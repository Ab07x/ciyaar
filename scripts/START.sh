#!/bin/bash
#
# START.sh - Production 5-Channel Streaming (720p Transcoded)
#
# Usage:
#   ./START.sh                           # Uses default channels
#   ./START.sh 9704 52331 7018 16643 52332   # Custom channel IDs
#   ./START.sh 9704 "Premier League" 52331 "PL 50FPS" ...  # With names
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
IPTV_BASE="http://iptvtour.store:80/d06HPCFR/qEBJjW3"
HLS_BASE="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"
CDN_URL="https://stream.cdnfly.online"

# FFmpeg settings
HLS_TIME=10
HLS_LIST_SIZE=30
HLS_DELETE_THRESHOLD=60

# Default channels (if no arguments provided)
DEFAULT_CHANNELS=(
    "9704|Sky Sports Premier League HD"
    "52331|Sky Sports Premier League 50FPS"
    "7018|Sky Sports Racing"
    "16643|Sky Sports Racing HD"
    "52332|Sky Sports Racing HD 50FPS"
)

# Parse arguments into channels array
parse_channels() {
    CHANNELS=()

    if [ $# -eq 0 ]; then
        # No arguments - use defaults
        CHANNELS=("${DEFAULT_CHANNELS[@]}")
    else
        # Parse arguments: can be just IDs or "ID NAME" pairs
        local i=1
        while [ $# -gt 0 ]; do
            local id="$1"
            shift

            # Check if next arg is a name (not a number)
            if [ $# -gt 0 ] && ! [[ "$1" =~ ^[0-9]+$ ]]; then
                local name="$1"
                shift
            else
                local name="Channel $i"
            fi

            CHANNELS+=("$id|$name")
            ((i++))

            # Max 5 channels
            [ ${#CHANNELS[@]} -ge 5 ] && break
        done
    fi
}

# Parse command line
parse_channels "$@"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      CIYAAR PRODUCTION STREAMING - ${#CHANNELS[@]} CHANNELS (720p)          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# STOP EXISTING STREAMS
# ============================================================================
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  STOPPING ANY EXISTING STREAMS${NC}"
echo -e "${YELLOW}========================================${NC}"

pkill -9 -f ffmpeg 2>/dev/null
pkill -9 -f "while true" 2>/dev/null
sleep 2

# Clean and recreate directories
rm -rf "$HLS_BASE"/channel-*
mkdir -p "$HLS_BASE"/channel-{1,2,3,4,5}
mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR"/*.log

echo -e "${GREEN}✓ Cleaned old streams${NC}"
echo ""

# ============================================================================
# START CHANNELS
# ============================================================================
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  STARTING ${#CHANNELS[@]} CHANNELS (720p TRANSCODE)${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "  ${BLUE}Segment Duration:${NC}    ${HLS_TIME}s"
echo -e "  ${BLUE}Playlist Size:${NC}       ${HLS_LIST_SIZE} segments"
echo -e "  ${BLUE}Segment Retention:${NC}   ${HLS_DELETE_THRESHOLD} segments"
echo -e "  ${BLUE}Video:${NC}               720p @ 2500kbps (libx264)"
echo -e "  ${BLUE}Audio:${NC}               AAC @ 128kbps"
echo ""

start_channel() {
    local channel_num=$1
    local channel_config="$2"
    local stream_id="${channel_config%%|*}"
    local channel_name="${channel_config#*|}"
    local channel_dir="$HLS_BASE/channel-$channel_num"
    local stream_url="$IPTV_BASE/$stream_id"
    local log_file="$LOG_DIR/channel-$channel_num.log"

    mkdir -p "$channel_dir"

    echo -e "${GREEN}Starting Channel $channel_num:${NC} $channel_name"
    echo -e "  ${BLUE}Stream ID:${NC} $stream_id"

    # Save channel info for status script
    echo "$stream_id|$channel_name" > "$channel_dir/.channel_info"

    # Start FFmpeg with auto-restart loop
    (
        cd "$channel_dir" || exit 1
        while true; do
            nice -n -10 ffmpeg -hide_banner -loglevel warning \
                -fflags +genpts+discardcorrupt+igndts \
                -err_detect ignore_err \
                -reconnect 1 \
                -reconnect_streamed 1 \
                -reconnect_at_eof 1 \
                -reconnect_delay_max 10 \
                -timeout 10000000 \
                -rw_timeout 10000000 \
                -i "$stream_url" \
                -c:v libx264 -preset veryfast -crf 23 -maxrate 2500k -bufsize 5000k \
                -vf "scale=-2:720" \
                -c:a aac -b:a 128k \
                -f hls \
                -hls_time $HLS_TIME \
                -hls_list_size $HLS_LIST_SIZE \
                -hls_delete_threshold $HLS_DELETE_THRESHOLD \
                -hls_segment_filename 'seg_%s_%%03d.ts' \
                -strftime 1 \
                -hls_flags delete_segments+append_list+second_level_segment_index \
                stream.m3u8 2>&1 | tee -a "$log_file"

            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Channel $channel_num restarting in 5 seconds..." >> "$log_file"
            sleep 5
        done
    ) &

    echo -e "  ${GREEN}✓ Started (PID: $!)${NC}"
    echo ""
}

# Start all channels
for i in "${!CHANNELS[@]}"; do
    start_channel $((i+1)) "${CHANNELS[$i]}"
done

# Wait for initialization
echo -e "${YELLOW}Waiting 15 seconds for streams to initialize...${NC}"
sleep 15

# ============================================================================
# STATUS REPORT
# ============================================================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  ALL CHANNELS STARTED!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

echo -e "${BOLD}${BLUE}Stream URLs:${NC}"
for i in "${!CHANNELS[@]}"; do
    channel_config="${CHANNELS[$i]}"
    channel_name="${channel_config#*|}"
    echo -e "  Channel $((i+1)): ${GREEN}$CDN_URL/channel-$((i+1))/stream.m3u8${NC}"
    echo -e "             ${BLUE}($channel_name)${NC}"
done
echo ""

echo -e "${BOLD}${BLUE}Initial Segment Check:${NC}"
for i in "${!CHANNELS[@]}"; do
    ch=$((i+1))
    seg_count=$(ls -1 "$HLS_BASE/channel-$ch"/*.ts 2>/dev/null | wc -l | tr -d ' ')
    if [ "$seg_count" -gt 0 ]; then
        latest=$(ls -t "$HLS_BASE/channel-$ch"/*.ts 2>/dev/null | head -1 | xargs basename 2>/dev/null)
        echo -e "  Channel $ch: ${GREEN}$seg_count segments${NC} (latest: $latest)"
    else
        echo -e "  Channel $ch: ${YELLOW}Initializing...${NC}"
    fi
done
echo ""

echo -e "${BOLD}${BLUE}Commands:${NC}"
echo -e "  ${GREEN}Status:${NC}    ~/ciyaar/scripts/STATUS.sh"
echo -e "  ${RED}Stop:${NC}      ~/ciyaar/scripts/STOP.sh"
echo -e "  ${YELLOW}Monitor:${NC}   ~/ciyaar/scripts/monitor.sh"
echo -e "  ${BLUE}Logs:${NC}      tail -f ~/ciyaar/logs/channel-1.log"
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  STREAMING IS NOW LIVE!                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
