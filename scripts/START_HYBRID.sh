#!/bin/bash
#
# START_HYBRID.sh - Video Copy + Audio Transcode (Best Balance)
#
# - Video: Copy (no CPU usage)
# - Audio: Transcode to AAC (fixes sound issues, minimal CPU)
# - Can run 5+ channels easily on 4 vCPUs
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
HLS_TIME=6
HLS_LIST_SIZE=10
HLS_DELETE_THRESHOLD=20

# Default channels
DEFAULT_CHANNELS=(
    "9704|Sky Sports Premier League HD"
    "52331|Sky Sports Premier League 50FPS"
    "7018|Sky Sports Racing"
    "16643|Sky Sports Racing HD"
    "52332|Sky Sports Racing 50FPS"
)

# Parse arguments
parse_channels() {
    CHANNELS=()
    if [ $# -eq 0 ]; then
        CHANNELS=("${DEFAULT_CHANNELS[@]}")
    else
        local i=1
        while [ $# -gt 0 ]; do
            local id="$1"
            shift
            if [ $# -gt 0 ] && ! [[ "$1" =~ ^[0-9]+$ ]]; then
                local name="$1"
                shift
            else
                local name="Channel $i"
            fi
            CHANNELS+=("$id|$name")
            ((i++))
            [ ${#CHANNELS[@]} -ge 5 ] && break
        done
    fi
}

parse_channels "$@"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    CIYAAR STREAMING - ${#CHANNELS[@]} CHANNELS (HYBRID MODE)            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop existing
echo -e "${YELLOW}Stopping existing streams...${NC}"
pkill -9 -f ffmpeg 2>/dev/null
pkill -9 -f "while true" 2>/dev/null
sleep 2

rm -rf "$HLS_BASE"/channel-*
mkdir -p "$HLS_BASE"/channel-{1,2,3,4,5}
mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR"/*.log

echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

echo -e "${YELLOW}Starting ${#CHANNELS[@]} channels (HYBRID MODE)${NC}"
echo -e "  ${BLUE}Video:${NC}    Copy (no transcode)"
echo -e "  ${BLUE}Audio:${NC}    AAC 128kbps (fixes sound issues)"
echo -e "  ${BLUE}Segments:${NC} ${HLS_TIME}s x ${HLS_LIST_SIZE} = $(($HLS_TIME * $HLS_LIST_SIZE))s buffer"
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
    echo "$stream_id|$channel_name" > "$channel_dir/.channel_info"

    echo -e "${GREEN}Channel $channel_num:${NC} $channel_name (ID: $stream_id)"

    (
        cd "$channel_dir" || exit 1
        while true; do
            ffmpeg -hide_banner -loglevel warning \
                -fflags +genpts+discardcorrupt+igndts \
                -err_detect ignore_err \
                -reconnect 1 \
                -reconnect_streamed 1 \
                -reconnect_at_eof 1 \
                -reconnect_delay_max 5 \
                -timeout 5000000 \
                -rw_timeout 5000000 \
                -i "$stream_url" \
                -c:v copy \
                -c:a aac -b:a 128k \
                -f hls \
                -hls_time $HLS_TIME \
                -hls_list_size $HLS_LIST_SIZE \
                -hls_delete_threshold $HLS_DELETE_THRESHOLD \
                -hls_segment_filename 'seg_%s_%%03d.ts' \
                -strftime 1 \
                -hls_flags delete_segments+append_list+second_level_segment_index \
                stream.m3u8 2>&1 | tee -a "$log_file"

            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting..." >> "$log_file"
            sleep 3
        done
    ) &

    echo -e "  ${GREEN}✓ Started${NC}"
}

for i in "${!CHANNELS[@]}"; do
    start_channel $((i+1)) "${CHANNELS[$i]}"
done

echo ""
echo -e "${YELLOW}Waiting 15 seconds...${NC}"
sleep 15

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ${#CHANNELS[@]} CHANNELS LIVE (HYBRID: Video Copy + Audio AAC)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

for i in "${!CHANNELS[@]}"; do
    channel_name="${CHANNELS[$i]#*|}"
    echo -e "  Ch$((i+1)): $CDN_URL/channel-$((i+1))/stream.m3u8"
    echo -e "       ${CYAN}$channel_name${NC}"
done
echo ""
