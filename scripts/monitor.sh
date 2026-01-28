#!/bin/bash
# ==============================================================================
# FANBROJ STREAMING MONITOR
# ==============================================================================
# Real-time monitoring dashboard for IPTV restreaming server.
#
# Usage:
#   ./monitor.sh           # Full dashboard (refreshes every 5s)
#   ./monitor.sh --once    # Single snapshot
#   ./monitor.sh --json    # JSON output for API
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
HLS_DIR="/var/www/html/hls"
LOG_DIR="$HOME/ciyaar/logs"
REFRESH_INTERVAL=5

# Get server IP
get_server_ip() {
    curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}'
}

# Format bytes to human readable
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes / 1024))KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$((bytes / 1048576))MB"
    else
        echo "$((bytes / 1073741824))GB"
    fi
}

# Get CPU usage
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
}

# Get memory usage
get_memory_info() {
    free -b | awk '/^Mem:/ {printf "%.1f/%.1fGB (%.0f%%)", $3/1073741824, $2/1073741824, $3/$2*100}'
}

# Get disk usage
get_disk_info() {
    df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}'
}

# Get network stats
get_network_stats() {
    if command -v vnstat &> /dev/null; then
        vnstat -tr 2 2>/dev/null | grep -E "rx|tx" | head -2
    else
        echo "vnstat not installed"
    fi
}

# Count active streams
count_active_streams() {
    local count=0
    for dir in "$HLS_DIR"/*/; do
        if [ -d "$dir" ]; then
            local m3u8="$dir/index.m3u8"
            if [ -f "$m3u8" ]; then
                local age=$(( $(date +%s) - $(stat -c %Y "$m3u8" 2>/dev/null || stat -f %m "$m3u8" 2>/dev/null || echo 0) ))
                if [ $age -lt 30 ]; then
                    count=$((count + 1))
                fi
            fi
        fi
    done
    echo $count
}

# Get stream details
get_stream_details() {
    local json_output=""
    local first=true
    
    for dir in "$HLS_DIR"/*/; do
        if [ -d "$dir" ]; then
            local slug=$(basename "$dir")
            local m3u8="$dir/index.m3u8"
            
            if [ -f "$m3u8" ]; then
                local segments=$(ls "$dir"/*.ts 2>/dev/null | wc -l)
                local age=$(( $(date +%s) - $(stat -c %Y "$m3u8" 2>/dev/null || stat -f %m "$m3u8" 2>/dev/null || echo 0) ))
                local size=$(du -sb "$dir" 2>/dev/null | cut -f1)
                local status="active"
                [ $age -gt 30 ] && status="stale"
                
                if [ "$1" = "json" ]; then
                    [ "$first" = false ] && json_output+=","
                    json_output+="{\"slug\":\"$slug\",\"segments\":$segments,\"age\":$age,\"size\":$size,\"status\":\"$status\"}"
                    first=false
                else
                    local status_color="${GREEN}"
                    [ "$status" = "stale" ] && status_color="${RED}"
                    
                    printf "  ${status_color}●${NC} %-20s %3d segments  %6s  %3ds ago\n" \
                        "$slug" "$segments" "$(format_bytes $size)" "$age"
                fi
            fi
        fi
    done
    
    [ "$1" = "json" ] && echo "[$json_output]"
}

# Get PM2 process info
get_pm2_info() {
    if command -v pm2 &> /dev/null; then
        pm2 jlist 2>/dev/null | jq -r '.[] | select(.name | startswith("ch-")) | "\(.name)|\(.pm2_env.status)|\(.pm2_env.restart_time)|\(.monit.memory // 0)"' 2>/dev/null
    fi
}

# Draw dashboard
draw_dashboard() {
    clear
    
    local SERVER_IP=$(get_server_ip)
    local TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    local ACTIVE_STREAMS=$(count_active_streams)
    
    # Header
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}           ${BOLD}FANBROJ STREAMING SERVER MONITOR${NC}                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}           Server: ${GREEN}$SERVER_IP${NC}                                          ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}           Updated: $TIMESTAMP                                ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # System Resources
    echo -e "${BLUE}┌─ SYSTEM RESOURCES ─────────────────────────────────────────────────────────┐${NC}"
    
    local CPU=$(get_cpu_usage)
    local CPU_BAR=""
    local CPU_INT=${CPU%.*}
    for i in $(seq 1 20); do
        if [ $((i * 5)) -le $CPU_INT ]; then
            CPU_BAR+="█"
        else
            CPU_BAR+="░"
        fi
    done
    
    local MEM_INFO=$(get_memory_info)
    local DISK_INFO=$(get_disk_info)
    
    echo -e "${BLUE}│${NC}  CPU:    [${YELLOW}$CPU_BAR${NC}] ${CPU}%"
    echo -e "${BLUE}│${NC}  Memory: $MEM_INFO"
    echo -e "${BLUE}│${NC}  Disk:   $DISK_INFO"
    echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Active Streams
    echo -e "${GREEN}┌─ ACTIVE STREAMS ($ACTIVE_STREAMS) ──────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│${NC}  ${BOLD}Channel              Segments    Size    Updated${NC}"
    echo -e "${GREEN}│${NC}  ─────────────────────────────────────────────────────"
    
    if [ $ACTIVE_STREAMS -eq 0 ]; then
        echo -e "${GREEN}│${NC}  ${YELLOW}No active streams${NC}"
    else
        get_stream_details | while read line; do
            echo -e "${GREEN}│${NC}$line"
        done
    fi
    
    echo -e "${GREEN}└────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # PM2 Processes
    echo -e "${MAGENTA}┌─ PM2 PROCESSES ────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${MAGENTA}│${NC}  ${BOLD}Name                 Status      Restarts    Memory${NC}"
    echo -e "${MAGENTA}│${NC}  ─────────────────────────────────────────────────────"
    
    local PM2_DATA=$(get_pm2_info)
    if [ -z "$PM2_DATA" ]; then
        echo -e "${MAGENTA}│${NC}  ${YELLOW}No PM2 processes running${NC}"
    else
        echo "$PM2_DATA" | while IFS='|' read -r name status restarts memory; do
            local status_color="${GREEN}"
            [ "$status" != "online" ] && status_color="${RED}"
            local mem_mb=$((memory / 1048576))
            printf "${MAGENTA}│${NC}  %-20s ${status_color}%-10s${NC}  %8s    %4dMB\n" \
                "${name#ch-}" "$status" "$restarts" "$mem_mb"
        done
    fi
    
    echo -e "${MAGENTA}└────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Quick Commands
    echo -e "${CYAN}┌─ QUICK COMMANDS ──────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  Start channel:   ./channel-manager.sh start <slug> <channel_id>"
    echo -e "${CYAN}│${NC}  Stop channel:    ./channel-manager.sh stop <slug>"
    echo -e "${CYAN}│${NC}  View logs:       pm2 logs"
    echo -e "${CYAN}│${NC}  Find channels:   ./find-channel.sh \"search term\""
    echo -e "${CYAN}└────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  Press ${BOLD}Ctrl+C${NC} to exit | Refreshing every ${REFRESH_INTERVAL}s..."
}

# JSON output mode
output_json() {
    local SERVER_IP=$(get_server_ip)
    local ACTIVE_STREAMS=$(count_active_streams)
    local CPU=$(get_cpu_usage)
    local MEM=$(free -b | awk '/^Mem:/ {printf "%.2f", $3/$2*100}')
    local DISK=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
    
    cat << EOF
{
  "timestamp": "$(date -Iseconds)",
  "server_ip": "$SERVER_IP",
  "system": {
    "cpu_percent": $CPU,
    "memory_percent": $MEM,
    "disk_percent": $DISK
  },
  "streams": {
    "active_count": $ACTIVE_STREAMS,
    "details": $(get_stream_details json)
  }
}
EOF
}

# Main
case "$1" in
    --json)
        output_json
        ;;
    --once)
        draw_dashboard
        ;;
    *)
        # Continuous monitoring
        while true; do
            draw_dashboard
            sleep $REFRESH_INTERVAL
        done
        ;;
esac
