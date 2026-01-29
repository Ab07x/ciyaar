#!/bin/bash
# ==============================================================================
# SPORTS EVENT STREAM MANAGER
# ==============================================================================
# Manages sports event streaming with automatic start/stop
# Designed for 2-hour sports matches with pre/post buffers
#
# Features:
# - Automated event scheduling
# - Stream source management with failover
# - Automatic cleanup after events
# - Integration with CloudFront CDN
# - Hidden source protection
#
# Usage:
#   ./sports-event-manager.sh start <event_name> <source_url> [duration_minutes]
#   ./sports-event-manager.sh stop <event_name>
#   ./sports-event-manager.sh schedule <event_name> <source_url> <start_time> <duration>
#   ./sports-event-manager.sh status
#   ./sports-event-manager.sh list
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/ciyaar/config"
LOG_DIR="$HOME/ciyaar/logs"
PID_DIR="$HOME/ciyaar/pids"
RECORD_DIR="/var/recordings/sports"
STREAM_DIR="/var/www/html/sports"
EVENTS_FILE="$CONFIG_DIR/events.json"

# Default settings
DEFAULT_DURATION=150  # 2.5 hours (2hr match + 30min buffer)
PRE_BUFFER=900        # 15 minutes before event
POST_BUFFER=900       # 15 minutes after event
RECONNECT_DELAY=5     # Seconds between reconnection attempts
MAX_RECONNECTS=100    # Maximum reconnection attempts

# Load configuration
mkdir -p "$CONFIG_DIR" "$LOG_DIR" "$PID_DIR" "$RECORD_DIR" "$STREAM_DIR"

if [ -f "$CONFIG_DIR/sports.conf" ]; then
    source "$CONFIG_DIR/sports.conf"
fi

# Logging functions
log_header() { echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "ℹ️  $1"; }

# Show banner
show_banner() {
    echo -e "${CYAN}"
    cat << 'BANNER'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ⚽ 🏀 🏈  SPORTS EVENT STREAM MANAGER  🏈 🏀 ⚽            ║
║                                                               ║
║        Automated Restreaming for Live Sports Events           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
BANNER
    echo -e "${NC}"
}

# Show help
show_help() {
    show_banner
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start <event> <source_url> [duration]  Start streaming an event now"
    echo "  stop <event>                           Stop a running event"
    echo "  schedule <event> <source> <time> <dur> Schedule an event for later"
    echo "  status                                 Show all events status"
    echo "  list                                   List scheduled and active events"
    echo "  logs <event>                           View logs for an event"
    echo "  cleanup                                Clean up old recordings"
    echo "  test <source_url>                      Test a stream source"
    echo ""
    echo "Examples:"
    echo "  $0 start premier-league http://source.com/stream.m3u8 150"
    echo "  $0 schedule ucl-final http://source.com/uefa.m3u8 \"2026-02-15 20:00\" 150"
    echo "  $0 status"
    echo ""
    echo "Duration is in minutes (default: 150 = 2.5 hours)"
    echo ""
}

# Generate unique stream key
generate_stream_key() {
    local event_name="$1"
    local timestamp=$(date +%s)
    local random=$(openssl rand -hex 8 2>/dev/null || echo "$RANDOM$RANDOM")
    echo "$(echo "$event_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-${timestamp}-${random}"
}

# Get CloudFront/stream URL
get_stream_url() {
    local stream_key="$1"
    
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        echo "https://${CLOUDFRONT_DOMAIN}/sports/${stream_key}.m3u8"
    elif [ -n "$DOMAIN" ]; then
        echo "https://${DOMAIN}/sports/${stream_key}.m3u8"
    else
        local ip=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
        echo "http://${ip}/sports/${stream_key}.m3u8"
    fi
}

# Test stream source
test_source() {
    local source_url="$1"
    log_info "Testing stream source..."
    
    if ! command -v ffprobe &> /dev/null; then
        log_warn "ffprobe not found, using basic curl test"
        if curl -s -I "$source_url" | grep -q "200\|302"; then
            log_success "Source URL is accessible"
            return 0
        else
            log_error "Source URL is not accessible"
            return 1
        fi
    fi
    
    # Test with ffprobe
    if timeout 10 ffprobe -v error -show_entries format=duration -of csv=p=0 "$source_url" 2>/dev/null; then
        log_success "Stream source is valid and accessible"
        return 0
    else
        log_warn "Stream test inconclusive, will retry on start"
        return 0
    fi
}

# Start streaming an event
start_event() {
    local event_name="$1"
    local source_url="$2"
    local duration_minutes="${3:-$DEFAULT_DURATION}"
    
    if [ -z "$event_name" ] || [ -z "$source_url" ]; then
        log_error "Usage: $0 start <event_name> <source_url> [duration_minutes]"
        exit 1
    fi
    
    # Sanitize event name
    local sanitized_name=$(echo "$event_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    local stream_key=$(generate_stream_key "$sanitized_name")
    local pid_file="$PID_DIR/${sanitized_name}.pid"
    local log_file="$LOG_DIR/${sanitized_name}.log"
    local event_stream_dir="$STREAM_DIR/$stream_key"
    
    # Check if already running
    if [ -f "$pid_file" ]; then
        local old_pid=$(cat "$pid_file" 2>/dev/null)
        if ps -p "$old_pid" > /dev/null 2>&1; then
            log_warn "Event '$event_name' is already running (PID: $old_pid)"
            log_info "Stream URL: $(get_stream_url "$stream_key")"
            return 1
        fi
    fi
    
    log_header "Starting Sports Event: $event_name"
    log_info "Source: $source_url"
    log_info "Duration: $duration_minutes minutes"
    log_info "Stream Key: $stream_key"
    
    # Test source
    test_source "$source_url"
    
    # Create stream directory
    mkdir -p "$event_stream_dir"
    
    # Calculate end time
    local end_time=$(($(date +%s) + duration_minutes * 60))
    
    # Save event info
    cat > "$CONFIG_DIR/${sanitized_name}.json" << EOF
{
    "name": "$event_name",
    "sanitized_name": "$sanitized_name",
    "stream_key": "$stream_key",
    "source_url": "$source_url",
    "start_time": "$(date -Iseconds)",
    "end_time": "$(date -Iseconds -d "@$end_time" 2>/dev/null || date -Iseconds)",
    "duration_minutes": $duration_minutes,
    "status": "active",
    "pid_file": "$pid_file",
    "log_file": "$log_file",
    "stream_dir": "$event_stream_dir"
}
EOF
    
    # Start FFmpeg streaming
    log_info "Starting FFmpeg stream..."
    
    # FFmpeg command optimized for sports streaming
    ffmpeg -hide_banner -loglevel warning \
        -fflags +discardcorrupt+genpts \
        -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -timeout 5000000 \
        -i "$source_url" \
        -c copy \
        -f hls \
        -hls_time 4 \
        -hls_list_size 900 \
        -hls_flags delete_segments+omit_endlist+program_date_time \
        -hls_segment_filename "$event_stream_dir/%03d.ts" \
        "$event_stream_dir/index.m3u8" \
        >> "$log_file" 2>&1 &
    
    local ffmpeg_pid=$!
    echo $ffmpeg_pid > "$pid_file"
    
    sleep 2
    
    # Check if process started
    if ps -p "$ffmpeg_pid" > /dev/null 2>&1; then
        log_success "Event started successfully!"
        log_info "PID: $ffmpeg_pid"
        log_info "Stream URL: $(get_stream_url "$stream_key")"
        log_info "Log file: $log_file"
        
        # Schedule automatic stop
        (
            sleep $((duration_minutes * 60))
            if [ -f "$pid_file" ]; then
                log_info "Auto-stopping event: $event_name (duration reached)"
                "$0" stop "$sanitized_name" --auto
            fi
        ) &
        
        return 0
    else
        log_error "Failed to start FFmpeg"
        rm -f "$pid_file"
        return 1
    fi
}

# Stop streaming event
stop_event() {
    local event_name="$1"
    local auto_stop="${2:-}"
    
    local sanitized_name=$(echo "$event_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    local pid_file="$PID_DIR/${sanitized_name}.pid"
    local config_file="$CONFIG_DIR/${sanitized_name}.json"
    
    log_header "Stopping Sports Event: $event_name"
    
    if [ ! -f "$pid_file" ]; then
        log_warn "No PID file found for '$event_name'"
        # Try to find by name
        local pid=$(pgrep -f "ffmpeg.*$sanitized_name" | head -1)
        if [ -n "$pid" ]; then
            log_info "Found process $pid, stopping..."
            kill "$pid" 2>/dev/null || true
        fi
    else
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            log_info "Stopping FFmpeg process $pid..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
    fi
    
    # Update config status
    if [ -f "$config_file" ]; then
        local stream_key=$(jq -r '.stream_key' "$config_file" 2>/dev/null || echo "")
        if [ -n "$stream_key" ]; then
            # Add endlist to m3u8 to signal end of stream
            local stream_dir="$STREAM_DIR/$stream_key"
            if [ -f "$stream_dir/index.m3u8" ]; then
                echo "#EXT-X-ENDLIST" >> "$stream_dir/index.m3u8"
            fi
        fi
        
        # Update status in JSON
        jq '.status = "ended" | .ended_at = "'$(date -Iseconds)'"' "$config_file" > "$config_file.tmp" && mv "$config_file.tmp" "$config_file"
    fi
    
    if [ -z "$auto_stop" ]; then
        log_success "Event '$event_name' stopped successfully"
    fi
}

# Schedule an event for later
schedule_event() {
    local event_name="$1"
    local source_url="$2"
    local start_time="$3"
    local duration="${4:-$DEFAULT_DURATION}"
    
    if [ -z "$event_name" ] || [ -z "$source_url" ] || [ -z "$start_time" ]; then
        log_error "Usage: $0 schedule <event_name> <source_url> <start_time> <duration>"
        log_info "Example: $0 schedule \"UCL Final\" http://source.com/stream.m3u8 \"2026-02-15 20:00\" 150"
        exit 1
    fi
    
    local sanitized_name=$(echo "$event_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    local schedule_file="$CONFIG_DIR/schedule_${sanitized_name}.json"
    
    # Convert start time to timestamp
    local start_timestamp=$(date -d "$start_time" +%s 2>/dev/null || echo "")
    if [ -z "$start_timestamp" ]; then
        log_error "Invalid start time format. Use: YYYY-MM-DD HH:MM"
        exit 1
    fi
    
    cat > "$schedule_file" << EOF
{
    "name": "$event_name",
    "sanitized_name": "$sanitized_name",
    "source_url": "$source_url",
    "start_time": "$start_time",
    "start_timestamp": $start_timestamp,
    "duration_minutes": $duration,
    "scheduled_at": "$(date -Iseconds)"
}
EOF
    
    log_success "Event scheduled successfully!"
    log_info "Event: $event_name"
    log_info "Start: $start_time"
    log_info "Duration: $duration minutes"
    
    # Create at job for automatic start
    local start_command="cd $SCRIPT_DIR && ./sports-event-manager.sh start \"$event_name\" \"$source_url\" $duration >> $LOG_DIR/scheduler.log 2>&1"
    echo "$start_command" | at "$start_time" 2>/dev/null || {
        log_warn "Could not schedule with 'at'. Install with: sudo apt install at"
        log_info "Manual start command:"
        log_info "$start_command"
    }
}

# List all events
list_events() {
    log_header "Sports Events Status"
    
    echo -e "\n${CYAN}Active Events:${NC}"
    local found=0
    for pid_file in "$PID_DIR"/*.pid; do
        [ -e "$pid_file" ] || continue
        found=1
        local name=$(basename "$pid_file" .pid)
        local pid=$(cat "$pid_file" 2>/dev/null)
        local config_file="$CONFIG_DIR/${name}.json"
        
        if [ -f "$config_file" ]; then
            local event_name=$(jq -r '.name' "$config_file" 2>/dev/null || echo "$name")
            local stream_key=$(jq -r '.stream_key' "$config_file" 2>/dev/null || echo "unknown")
            local start_time=$(jq -r '.start_time' "$config_file" 2>/dev/null | cut -d'T' -f2 | cut -d'+' -f1 | cut -d'.' -f1)
            local stream_url=$(get_stream_url "$stream_key")
            
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "  ${GREEN}●${NC} $event_name"
                echo -e "     PID: $pid | Started: $start_time"
                echo -e "     URL: $stream_url"
            else
                echo -e "  ${RED}○${NC} $event_name (stale PID)"
            fi
        fi
    done
    
    if [ $found -eq 0 ]; then
        echo -e "  ${YELLOW}No active events${NC}"
    fi
    
    echo -e "\n${CYAN}Scheduled Events:${NC}"
    found=0
    for schedule_file in "$CONFIG_DIR"/schedule_*.json; do
        [ -e "$schedule_file" ] || continue
        found=1
        local name=$(jq -r '.name' "$schedule_file" 2>/dev/null)
        local start_time=$(jq -r '.start_time' "$schedule_file" 2>/dev/null)
        local duration=$(jq -r '.duration_minutes' "$schedule_file" 2>/dev/null)
        echo -e "  ${YELLOW}◐${NC} $name - $start_time (${duration}min)"
    done
    
    if [ $found -eq 0 ]; then
        echo -e "  ${YELLOW}No scheduled events${NC}"
    fi
    
    echo ""
}

# Show detailed status
show_status() {
    log_header "System Status"
    
    # Check disk space
    local disk_usage=$(df -h "$STREAM_DIR" 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
    echo -e "${CYAN}Disk Usage:${NC} ${disk_usage}%"
    
    # Check active FFmpeg processes
    local ffmpeg_count=$(pgrep -c ffmpeg 2>/dev/null || echo 0)
    echo -e "${CYAN}Active Streams:${NC} $ffmpeg_count"
    
    # Check nginx status
    if systemctl is-active nginx > /dev/null 2>&1; then
        echo -e "${CYAN}Nginx:${NC} ${GREEN}Running${NC}"
    else
        echo -e "${CYAN}Nginx:${NC} ${RED}Stopped${NC}"
    fi
    
    # Show active events
    list_events
}

# View logs
view_logs() {
    local event_name="$1"
    
    if [ -z "$event_name" ]; then
        log_error "Usage: $0 logs <event_name>"
        exit 1
    fi
    
    local sanitized_name=$(echo "$event_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    local log_file="$LOG_DIR/${sanitized_name}.log"
    
    if [ -f "$log_file" ]; then
        tail -f "$log_file"
    else
        log_error "No log file found for '$event_name'"
        exit 1
    fi
}

# Cleanup old recordings
cleanup() {
    log_header "Cleaning Up Old Recordings"
    
    # Remove recordings older than 7 days
    find "$RECORD_DIR" -name "*.flv" -mtime +7 -delete 2>/dev/null || true
    find "$RECORD_DIR" -name "*.mp4" -mtime +7 -delete 2>/dev/null || true
    
    # Remove old stream directories (keep last 24 hours)
    find "$STREAM_DIR" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true
    
    # Clean old logs (keep 30 days)
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main command handler
case "${1:-}" in
    start)
        start_event "$2" "$3" "$4"
        ;;
    stop)
        stop_event "$2" "$3"
        ;;
    schedule)
        schedule_event "$2" "$3" "$4" "$5"
        ;;
    status)
        show_status
        ;;
    list)
        list_events
        ;;
    logs)
        view_logs "$2"
        ;;
    cleanup)
        cleanup
        ;;
    test)
        test_source "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_banner
        show_help
        ;;
esac
