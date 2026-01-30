#!/bin/bash
#
# START_ABR.sh - Adaptive Bitrate Streaming (720p + 480p + 360p)
#
# WARNING: Uses ~3x more CPU than single quality.
# Recommended: Only run 2-3 channels with ABR on 4 vCPUs.
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

IPTV_BASE="http://iptvtour.store:80/d06HPCFR/qEBJjW3"
HLS_BASE="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"
CDN_URL="https://stream.cdnfly.online"

# Only 3 channels for ABR (CPU intensive)
CHANNELS=(
    "178437|BeIN Sports 1 HD"
    "45487|Sky Sports Premier League"
    "45491|Sky Sports Football"
)

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       CIYAAR ABR STREAMING - 3 CHANNELS (720p/480p/360p)     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}WARNING: ABR uses ~3x more CPU than single quality!${NC}"
echo ""

# Stop existing
pkill -9 -f ffmpeg 2>/dev/null
pkill -9 -f "while true" 2>/dev/null
sleep 2

# Clean directories
rm -rf "$HLS_BASE"/channel-*
mkdir -p "$LOG_DIR"

create_master_playlist() {
    local channel_dir=$1
    cat > "$channel_dir/master.m3u8" << 'EOF'
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/stream.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480
480p/stream.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/stream.m3u8
EOF
}

start_abr_channel() {
    local channel_num=$1
    local channel_config="${CHANNELS[$((channel_num-1))]}"
    local stream_id="${channel_config%%|*}"
    local channel_name="${channel_config#*|}"
    local channel_dir="$HLS_BASE/channel-$channel_num"
    local stream_url="$IPTV_BASE/$stream_id"
    local log_file="$LOG_DIR/channel-$channel_num.log"

    # Create directories
    mkdir -p "$channel_dir/720p" "$channel_dir/480p" "$channel_dir/360p"

    # Create master playlist
    create_master_playlist "$channel_dir"

    echo -e "${GREEN}Starting ABR Channel $channel_num:${NC} $channel_name"
    echo -e "  ${BLUE}Qualities:${NC} 720p (2.5Mbps), 480p (1.2Mbps), 360p (800kbps)"

    (
        cd "$channel_dir" || exit 1
        while true; do
            nice -n -10 ffmpeg -hide_banner -loglevel warning \
                -fflags +genpts+discardcorrupt+igndts \
                -err_detect ignore_err \
                -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 10 \
                -timeout 10000000 -rw_timeout 10000000 \
                -i "$stream_url" \
                -filter_complex "[0:v]split=3[v720][v480][v360]; \
                    [v720]scale=-2:720[v720out]; \
                    [v480]scale=-2:480[v480out]; \
                    [v360]scale=-2:360[v360out]" \
                \
                -map "[v720out]" -map 0:a \
                -c:v libx264 -preset veryfast -crf 23 -maxrate 2500k -bufsize 5000k \
                -c:a aac -b:a 128k \
                -f hls -hls_time 10 -hls_list_size 30 -hls_delete_threshold 60 \
                -hls_segment_filename '720p/seg_%s_%%03d.ts' -strftime 1 \
                -hls_flags delete_segments+append_list+second_level_segment_index \
                720p/stream.m3u8 \
                \
                -map "[v480out]" -map 0:a \
                -c:v libx264 -preset veryfast -crf 23 -maxrate 1200k -bufsize 2400k \
                -c:a aac -b:a 96k \
                -f hls -hls_time 10 -hls_list_size 30 -hls_delete_threshold 60 \
                -hls_segment_filename '480p/seg_%s_%%03d.ts' -strftime 1 \
                -hls_flags delete_segments+append_list+second_level_segment_index \
                480p/stream.m3u8 \
                \
                -map "[v360out]" -map 0:a \
                -c:v libx264 -preset veryfast -crf 23 -maxrate 800k -bufsize 1600k \
                -c:a aac -b:a 64k \
                -f hls -hls_time 10 -hls_list_size 30 -hls_delete_threshold 60 \
                -hls_segment_filename '360p/seg_%s_%%03d.ts' -strftime 1 \
                -hls_flags delete_segments+append_list+second_level_segment_index \
                360p/stream.m3u8 \
                2>&1 | tee -a "$log_file"

            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ABR Channel $channel_num restarting..." >> "$log_file"
            sleep 5
        done
    ) &

    echo -e "  ${GREEN}✓ Started (PID: $!)${NC}"
    echo ""
}

# Start 3 ABR channels
for i in 1 2 3; do
    start_abr_channel $i
done

echo -e "${YELLOW}Waiting 20 seconds for ABR streams to initialize...${NC}"
sleep 20

echo ""
echo -e "${GREEN}ABR Streaming Started!${NC}"
echo ""
echo -e "${BOLD}Master Playlist URLs (use these for adaptive playback):${NC}"
for i in 1 2 3; do
    echo "  Channel $i: $CDN_URL/channel-$i/master.m3u8"
done
echo ""
