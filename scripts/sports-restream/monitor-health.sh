#!/bin/bash
# ==============================================================================
# STREAM HEALTH MONITOR
# ==============================================================================
# Monitors stream health and provides automatic failover
# Features:
# - Continuous health checks
# - Automatic restart on failure
# - Alert notifications (Discord/Slack)
# - Bandwidth monitoring
# - 100% uptime goal with failover
#
# Usage:
#   ./monitor-health.sh start                    Start monitoring daemon
#   ./monitor-health.sh stop                     Stop monitoring
#   ./monitor-health.sh status                   Show current status
#   ./monitor-health.sh check <event_name>       Check specific event
# ==============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/ciyaar/config"
LOG_DIR="$HOME/ciyaar/logs"
PID_DIR="$HOME/ciyaar/pids"
CHECK_INTERVAL=30           # Seconds between checks
FAILURE_THRESHOLD=3         # Consecutive failures before restart
RESTART_COOLDOWN=60         # Seconds between restarts

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; }

# Load configuration
if [ -f "$CONFIG_DIR/monitor.conf" ]; then
    source "$CONFIG_DIR/monitor.conf"
fi

# ==============================================================================
# DISCORD/SLACK NOTIFICATIONS
# ==============================================================================

send_notification() {
    local message="$1"
    local level="${2:-info}"  # info, warning, error
    
    # Discord webhook
    if [ -n "$DISCORD_WEBHOOK" ]; then
        local color="3447003"  # Blue
        [ "$level" = "warning" ] && color="16776960"  # Yellow
        [ "$level" = "error" ] && color="15158332"    # Red
        [ "$level" = "success" ] && color="3066993"   # Green
        
        curl -s -X POST "$DISCORD_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"embeds\": [{
                    \"title\": \"Sports Stream Monitor\",
                    \"description\": \"$message\",
                    \"color\": $color,
                    \"timestamp\": \"$(date -Iseconds)\"
                }]
            }" > /dev/null 2>&1 || true
    fi
    
    # Slack webhook
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"🎥 $message\"}" > /dev/null 2>&1 || true
    fi
}

# ==============================================================================
# HEALTH CHECK FUNCTIONS
# ==============================================================================

# Check if stream is healthy
check_stream_health() {
    local event_name="$1"
    local config_file="$CONFIG_DIR/${event_name}.json"
    
    if [ ! -f "$config_file" ]; then
        return 1
    fi
    
    local stream_key=$(jq -r '.stream_key' "$config_file" 2>/dev/null || echo "")
    local stream_dir="/var/www/html/sports/$stream_key"
    local m3u8_file="$stream_dir/index.m3u8"
    
    # Check if m3u8 exists
    if [ ! -f "$m3u8_file" ]; then
        return 1
    fi
    
    # Check if m3u8 is being updated (modified in last 60 seconds)
    if [ "$(find "$m3u8_file" -mmin -1 2>/dev/null | wc -l)" -eq 0 ]; then
        return 1
    fi
    
    # Check if segments exist
    local segment_count=$(find "$stream_dir" -name "*.ts" -mmin -1 2>/dev/null | wc -l)
    if [ "$segment_count" -lt 2 ]; then
        return 1
    fi
    
    return 0
}

# Check FFmpeg process
check_ffmpeg_process() {
    local event_name="$1"
    local pid_file="$PID_DIR/${event_name}.pid"
    
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    local pid=$(cat "$pid_file" 2>/dev/null)
    if [ -z "$pid" ]; then
        return 1
    fi
    
    if ! ps -p "$pid" > /dev/null 2>&1; then
        return 1
    fi
    
    return 0
}

# Get stream statistics
get_stream_stats() {
    local event_name="$1"
    local config_file="$CONFIG_DIR/${event_name}.json"
    
    if [ ! -f "$config_file" ]; then
        echo "No config found"
        return 1
    fi
    
    local stream_key=$(jq -r '.stream_key' "$config_file" 2>/dev/null || echo "")
    local stream_dir="/var/www/html/sports/$stream_key"
    local m3u8_file="$stream_dir/index.m3u8"
    
    if [ -f "$m3u8_file" ]; then
        local last_modified=$(stat -c %Y "$m3u8_file" 2>/dev/null || echo "0")
        local now=$(date +%s)
        local age=$((now - last_modified))
        
        local segment_count=$(find "$stream_dir" -name "*.ts" 2>/dev/null | wc -l)
        local total_size=$(du -sh "$stream_dir" 2>/dev/null | cut -f1 || echo "0")
        
        echo "Last update: ${age}s ago | Segments: $segment_count | Size: $total_size"
    else
        echo "No stream file found"
    fi
}

# ==============================================================================
# MONITORING DAEMON
# ==============================================================================

# Track failures per event
declare -A FAILURE_COUNTS
declare -A LAST_RESTART

monitor_loop() {
    log_info "Starting health monitor loop..."
    
    while true; do
        # Check all active events
        for pid_file in "$PID_DIR"/*.pid; do
            [ -e "$pid_file" ] || continue
            
            local event_name=$(basename "$pid_file" .pid)
            local config_file="$CONFIG_DIR/${event_name}.json"
            
            # Skip if config doesn't exist
            [ -f "$config_file" ] || continue
            
            local healthy=true
            
            # Check FFmpeg process
            if ! check_ffmpeg_process "$event_name"; then
                log_error "FFmpeg process not running for: $event_name"
                healthy=false
            fi
            
            # Check stream health
            if ! check_stream_health "$event_name"; then
                log_warn "Stream health check failed for: $event_name"
                healthy=false
            fi
            
            if [ "$healthy" = false ]; then
                # Increment failure count
                FAILURE_COUNTS[$event_name]=$((${FAILURE_COUNTS[$event_name]:-0} + 1))
                local failures=${FAILURE_COUNTS[$event_name]}
                
                log_warn "$event_name: Failure count = $failures"
                
                # Check if we should restart
                if [ "$failures" -ge "$FAILURE_THRESHOLD" ]; then
                    local now=$(date +%s)
                    local last_restart=${LAST_RESTART[$event_name]:-0}
                    local time_since_restart=$((now - last_restart))
                    
                    if [ "$time_since_restart" -gt "$RESTART_COOLDOWN" ]; then
                        log_error "Restarting stream: $event_name"
                        
                        # Get source URL
                        local source_url=$(jq -r '.source_url' "$config_file" 2>/dev/null || echo "")
                        local duration=$(jq -r '.duration_minutes' "$config_file" 2>/dev/null || echo "150")
                        
                        # Stop current stream
                        "$SCRIPT_DIR/sports-event-manager.sh" stop "$event_name" --auto 2>/dev/null || true
                        
                        sleep 2
                        
                        # Restart stream
                        if "$SCRIPT_DIR/sports-event-manager.sh" start "$event_name" "$source_url" "$duration" 2>/dev/null; then
                            log_success "Stream restarted: $event_name"
                            send_notification "Stream restarted: $event_name" "warning"
                            FAILURE_COUNTS[$event_name]=0
                            LAST_RESTART[$event_name]=$(date +%s)
                        else
                            log_error "Failed to restart: $event_name"
                            send_notification "Failed to restart: $event_name" "error"
                        fi
                    else
                        log_info "Restart cooldown active for: $event_name"
                    fi
                fi
            else
                # Reset failure count on success
                if [ "${FAILURE_COUNTS[$event_name]:-0}" -gt 0 ]; then
                    log_success "$event_name: Recovered"
                    FAILURE_COUNTS[$event_name]=0
                fi
            fi
        done
        
        sleep "$CHECK_INTERVAL"
    done
}

# ==============================================================================
# SYSTEM MONITORING
# ==============================================================================

show_system_status() {
    echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                 SYSTEM STATUS                                 ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    
    # Disk usage
    echo -e "\n${BLUE}Disk Usage:${NC}"
    df -h /var/www/html /var/recordings 2>/dev/null | grep -v "Filesystem" | while read fs size used avail pct mount; do
        echo "  $mount: $used / $size ($pct)"
    done
    
    # Memory
    echo -e "\n${BLUE}Memory:${NC}"
    free -h | grep "Mem:" | awk '{print "  Used: " $3 " / " $2 " (" int($3/$2*100) "%)"}'
    
    # CPU Load
    echo -e "\n${BLUE}CPU Load:${NC}"
    uptime | awk -F'load average:' '{print "  " $2}'
    
    # Network (if vnstat available)
    if command -v vnstat &> /dev/null; then
        echo -e "\n${BLUE}Network Today:${NC}"
        vnstat -i eth0 --oneline 2>/dev/null | cut -d';' -f11 || echo "  N/A"
    fi
    
    # Active FFmpeg processes
    echo -e "\n${BLUE}Active Streams:${NC}"
    local count=$(pgrep -c ffmpeg 2>/dev/null || echo 0)
    echo "  FFmpeg processes: $count"
    
    # Show event details
    echo -e "\n${BLUE}Event Details:${NC}"
    for pid_file in "$PID_DIR"/*.pid; do
        [ -e "$pid_file" ] || continue
        local event_name=$(basename "$pid_file" .pid)
        local status_emoji="${GREEN}✓${NC}"
        
        if ! check_stream_health "$event_name"; then
            status_emoji="${RED}✗${NC}"
        fi
        
        local stats=$(get_stream_stats "$event_name")
        echo -e "  $status_emoji $event_name: $stats"
    done
    
    echo ""
}

# ==============================================================================
# MAIN COMMANDS
# ==============================================================================

case "${1:-}" in
    start)
        # Check if already running
        if [ -f "$PID_DIR/monitor.pid" ]; then
            local old_pid=$(cat "$PID_DIR/monitor.pid" 2>/dev/null)
            if ps -p "$old_pid" > /dev/null 2>&1; then
                log_warn "Monitor already running (PID: $old_pid)"
                exit 1
            fi
        fi
        
        log_info "Starting health monitor..."
        
        # Start monitor in background
        (
            monitor_loop >> "$LOG_DIR/monitor.log" 2>&1
        ) &
        
        local monitor_pid=$!
        echo $monitor_pid > "$PID_DIR/monitor.pid"
        
        sleep 1
        
        if ps -p "$monitor_pid" > /dev/null 2>&1; then
            log_success "Monitor started (PID: $monitor_pid)"
            send_notification "Health monitor started" "success"
        else
            log_error "Failed to start monitor"
            exit 1
        fi
        ;;
    
    stop)
        if [ -f "$PID_DIR/monitor.pid" ]; then
            local pid=$(cat "$PID_DIR/monitor.pid" 2>/dev/null)
            if [ -n "$pid" ]; then
                kill "$pid" 2>/dev/null || true
                sleep 1
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$PID_DIR/monitor.pid"
            log_success "Monitor stopped"
        else
            log_warn "Monitor not running"
        fi
        ;;
    
    status)
        show_system_status
        ;;
    
    check)
        local event_name="$2"
        if [ -z "$event_name" ]; then
            log_error "Usage: $0 check <event_name>"
            exit 1
        fi
        
        if check_stream_health "$event_name"; then
            log_success "$event_name is healthy"
            get_stream_stats "$event_name"
        else
            log_error "$event_name is unhealthy"
            exit 1
        fi
        ;;
    
    logs)
        if [ -f "$LOG_DIR/monitor.log" ]; then
            tail -f "$LOG_DIR/monitor.log"
        else
            log_error "No monitor logs found"
        fi
        ;;
    
    test-notify)
        send_notification "Test notification from Sports Stream Monitor" "info"
        log_success "Test notification sent"
        ;;
    
    *)
        echo "Stream Health Monitor"
        echo ""
        echo "Usage:"
        echo "  $0 start              Start monitoring daemon"
        echo "  $0 stop               Stop monitoring daemon"
        echo "  $0 status             Show system status"
        echo "  $0 check <event>      Check specific event health"
        echo "  $0 logs               View monitor logs"
        echo "  $0 test-notify        Send test notification"
        echo ""
        ;;
esac
