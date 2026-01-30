#!/bin/bash
#
# STATUS.sh - Streaming Server Status Dashboard
#

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

HLS_BASE="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"
CDN_URL="https://stream.cdnfly.online"

clear
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              STREAMING SERVER STATUS DASHBOARD               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# SYSTEM RESOURCES
# ============================================================================
echo -e "${BOLD}${BLUE}[SYSTEM RESOURCES]${NC}"

if [ "$(uname)" == "Darwin" ]; then
    # macOS
    cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | tr -d '%')
    mem_info=$(vm_stat | awk '/Pages free/ {free=$3} /Pages active/ {active=$3} END {printf "%.0f%% used", (active/(free+active))*100}')
    echo "CPU: ${cpu_usage:-N/A}"
    echo "RAM: $mem_info"
else
    # Linux
    cpu_usage=$(top -bn1 | grep 'Cpu(s)' | awk '{print $2}')
    mem_info=$(free -h | awk '/^Mem:/ {print $3 "/" $2}')
    echo "CPU: ${cpu_usage}% used"
    echo "RAM: $mem_info"
fi

disk_info=$(df -h "$HOME" 2>/dev/null | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')
echo "Disk: $disk_info"
echo ""

# ============================================================================
# FFMPEG PROCESSES
# ============================================================================
echo -e "${BOLD}${BLUE}[FFMPEG PROCESSES]${NC}"
ffmpeg_procs=$(pgrep -f ffmpeg 2>/dev/null)
if [ -z "$ffmpeg_procs" ]; then
    echo -e "${RED}No FFmpeg processes running${NC}"
else
    ffmpeg_count=$(echo "$ffmpeg_procs" | wc -l | tr -d ' ')
    echo -e "${GREEN}$ffmpeg_count FFmpeg process(es) running${NC}"

    for pid in $ffmpeg_procs; do
        if [ "$(uname)" == "Darwin" ]; then
            ps_info=$(ps -p "$pid" -o %cpu=,%mem= 2>/dev/null)
            cpu=$(echo "$ps_info" | awk '{print $1}')
            mem=$(echo "$ps_info" | awk '{print $2}')
        else
            cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | tr -d ' ')
            mem=$(ps -p "$pid" -o %mem= 2>/dev/null | tr -d ' ')
        fi
        echo "  PID $pid: CPU ${cpu:-?}% | MEM ${mem:-?}%"
    done
fi
echo ""

# ============================================================================
# CHANNEL STATUS
# ============================================================================
echo -e "${BOLD}${BLUE}[CHANNEL STATUS]${NC}"
for i in 1 2 3 4 5; do
    dir="$HLS_BASE/channel-$i"
    m3u8="$dir/stream.m3u8"

    if [ -f "$m3u8" ]; then
        # Check age
        if [ "$(uname)" == "Darwin" ]; then
            mod_time=$(stat -f %m "$m3u8" 2>/dev/null)
        else
            mod_time=$(stat -c %Y "$m3u8" 2>/dev/null)
        fi
        current_time=$(date +%s)
        age=$((current_time - mod_time))

        # Count segments
        segment_count=$(ls -1 "$dir"/*.ts 2>/dev/null | wc -l | tr -d ' ')
        latest_segment=$(ls -t "$dir"/*.ts 2>/dev/null | head -1 | xargs basename 2>/dev/null)

        # Status indicator
        if [ $age -lt 30 ]; then
            status="${GREEN}● LIVE${NC}"
        elif [ $age -lt 120 ]; then
            status="${YELLOW}● STALE (${age}s)${NC}"
        else
            status="${RED}● DEAD (${age}s)${NC}"
        fi

        echo -e "Channel $i: $status"
        echo -e "           Segments: $segment_count | Latest: ${latest_segment:-none}"
    else
        echo -e "Channel $i: ${RED}● OFFLINE${NC} (no stream.m3u8)"
    fi
done
echo ""

# ============================================================================
# HLS DISK USAGE
# ============================================================================
echo -e "${BOLD}${BLUE}[HLS DISK USAGE]${NC}"
for i in 1 2 3 4 5; do
    dir="$HLS_BASE/channel-$i"
    if [ -d "$dir" ]; then
        size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
        echo "  Channel $i: $size"
    fi
done
total=$(du -sh "$HLS_BASE" 2>/dev/null | awk '{print $1}')
echo -e "  ${BOLD}Total: $total${NC}"
echo ""

# ============================================================================
# RECENT ERRORS
# ============================================================================
echo -e "${BOLD}${BLUE}[RECENT LOG ERRORS]${NC}"
error_found=false
for i in 1 2 3 4 5; do
    log_file="$LOG_DIR/channel-$i.log"
    if [ -f "$log_file" ]; then
        errors=$(grep -i "error\|fail\|connection refused" "$log_file" 2>/dev/null | tail -2)
        if [ -n "$errors" ]; then
            error_found=true
            echo -e "  ${YELLOW}Channel $i:${NC}"
            echo "$errors" | while read -r line; do
                echo -e "    ${RED}$line${NC}"
            done
        fi
    fi
done
if [ "$error_found" = false ]; then
    echo -e "  ${GREEN}No recent errors${NC}"
fi
echo ""

# ============================================================================
# STREAM URLS
# ============================================================================
echo -e "${BOLD}${BLUE}[STREAM URLs]${NC}"
for i in 1 2 3 4 5; do
    echo "  $CDN_URL/channel-$i/stream.m3u8"
done
echo ""

# ============================================================================
# COMMANDS
# ============================================================================
echo -e "${BOLD}${BLUE}[QUICK COMMANDS]${NC}"
echo -e "  Start:   ${GREEN}~/ciyaar/scripts/START.sh${NC}"
echo -e "  Stop:    ${RED}~/ciyaar/scripts/STOP.sh${NC}"
echo -e "  Restart: ${YELLOW}~/ciyaar/scripts/RESTART.sh${NC}"
echo -e "  Monitor: ${BLUE}~/ciyaar/scripts/monitor.sh${NC}"
echo ""
