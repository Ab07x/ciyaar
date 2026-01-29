#!/bin/bash

##############################################################################
# PRODUCTION STREAMING SETUP - CDNFLY.ONLINE
# Optimized for World Cup & Premier League high traffic
# With CloudFront CDN integration
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"

# DNS Configuration
ORIGIN_DOMAIN="origin.cdnfly.online"
CDN_DOMAIN="stream.cdnfly.online"
ORIGIN_IP="13.61.180.155"

# IPTV Configuration
IPTV_USERNAME="d06HPCFR"
IPTV_PASSWORD="qEBJjW3"
IPTV_BASE_URL="http://iptvtour.store:80"

# HLS Settings - Optimized for high traffic + low latency
HLS_TIME=2              # 2-second segments (ultra low latency)
HLS_LIST_SIZE=10        # 10 segments = 20s buffer (good for mobile)
HLS_DELETE_THRESHOLD=15 # Delete after 15 segments
HLS_FLAGS="delete_segments+append_list+omit_endlist+program_date_time"

# World Cup / Premier League Channels (Top 5)
declare -A CHANNELS=(
    ["1"]="9701:Sky Sports Main Event"
    ["2"]="9700:Sky Sports Football"
    ["3"]="9696:Sky Sports Action"
    ["4"]="14345:TNT Sport 1"
    ["5"]="14346:TNT Sport 2"
)

echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     PRODUCTION STREAMING - CDNFLY.ONLINE              ║${NC}"
echo -e "${BOLD}${CYAN}║     World Cup & Premier League Ready                  ║${NC}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Domain Setup:${NC}"
echo -e "  Origin:      ${BLUE}http://$ORIGIN_DOMAIN${NC} (${ORIGIN_IP})"
echo -e "  CDN:         ${BLUE}https://$CDN_DOMAIN${NC} (CloudFront)"
echo ""
echo -e "${GREEN}Streaming Configuration:${NC}"
echo -e "  Segment Size:  ${YELLOW}${HLS_TIME}s${NC} (ultra low latency)"
echo -e "  Buffer:        ${YELLOW}${HLS_LIST_SIZE} segments (20s)${NC}"
echo -e "  Channels:      ${YELLOW}5 concurrent${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Must run as root${NC}"
    exit 1
fi

start_channel() {
    local channel_num=$1
    local channel_info="${CHANNELS[$channel_num]}"
    local stream_id="${channel_info%%:*}"
    local channel_name="${channel_info#*:}"

    local source_url="$IPTV_BASE_URL/$IPTV_USERNAME/$IPTV_PASSWORD/$stream_id"
    local output_dir="$HLS_OUTPUT/channel-$channel_num"

    echo -e "${BLUE}Starting Channel $channel_num: ${GREEN}$channel_name${NC}"
    echo -e "  Stream ID: $stream_id"
    echo -e "  Origin URL: http://$ORIGIN_DOMAIN/channel-$channel_num/playlist.m3u8"
    echo -e "  CDN URL: https://$CDN_DOMAIN/channel-$channel_num/playlist.m3u8"

    mkdir -p "$output_dir"

    # Ultra-optimized FFmpeg command for sports streaming
    pm2 start ffmpeg \
        --name "channel-$channel_num" \
        --interpreter none \
        --restart-delay 2000 \
        --max-restarts 100 \
        --log "$LOGS_DIR/channel-$channel_num.log" \
        -- \
        -loglevel error \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 3 \
        -timeout 15000000 \
        -fflags +genpts+discardcorrupt \
        -thread_queue_size 512 \
        -i "$source_url" \
        -c:v copy \
        -c:a aac -b:a 128k -ar 48000 -ac 2 \
        -avoid_negative_ts make_zero \
        -start_at_zero \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_delete_threshold $HLS_DELETE_THRESHOLD \
        -hls_flags $HLS_FLAGS \
        -hls_segment_type mpegts \
        -hls_segment_filename "$output_dir/seg_%05d.ts" \
        -master_pl_name "master.m3u8" \
        -method PUT \
        "$output_dir/playlist.m3u8"

    sleep 1
}

start_all() {
    echo -e "${YELLOW}Starting all 5 channels...${NC}"
    echo ""

    # Stop any existing
    pm2 delete all 2>/dev/null || true
    sleep 2

    # Start each channel
    for num in {1..5}; do
        start_channel $num
    done

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ALL CHANNELS STARTED ✓                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Save PM2 state
    pm2 save

    echo -e "${CYAN}Stream URLs (via CDN):${NC}"
    for num in {1..5}; do
        local channel_info="${CHANNELS[$num]}"
        local channel_name="${channel_info#*:}"
        echo -e "  ${GREEN}$channel_name${NC}"
        echo -e "    https://$CDN_DOMAIN/channel-$num/playlist.m3u8"
    done

    echo ""
    echo -e "${YELLOW}Monitor with:${NC} pm2 monit"
}

stop_all() {
    echo -e "${YELLOW}Stopping all channels...${NC}"
    pm2 delete all
    pm2 save
    echo -e "${GREEN}✓ All channels stopped${NC}"
}

status() {
    echo -e "${CYAN}Channel Status:${NC}"
    echo ""
    pm2 list
    echo ""

    echo -e "${CYAN}Stream Health:${NC}"
    for num in {1..5}; do
        local channel_info="${CHANNELS[$num]}"
        local channel_name="${channel_info#*:}"
        local output_dir="$HLS_OUTPUT/channel-$num"
        local playlist="$output_dir/playlist.m3u8"

        if [ -f "$playlist" ]; then
            local age=$(( $(date +%s) - $(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null) ))
            local segments=$(ls -1 "$output_dir"/*.ts 2>/dev/null | wc -l)

            if [ $age -lt 10 ]; then
                echo -e "  ${GREEN}✓${NC} Channel $num ($channel_name): ${GREEN}LIVE${NC} - $segments segments, updated ${age}s ago"
            else
                echo -e "  ${RED}✗${NC} Channel $num ($channel_name): ${RED}STALE${NC} - $segments segments, updated ${age}s ago"
            fi
        else
            echo -e "  ${YELLOW}?${NC} Channel $num ($channel_name): ${YELLOW}NO PLAYLIST${NC}"
        fi
    done
}

test_stream() {
    local num=$1
    if [ -z "$num" ]; then
        echo -e "${RED}Usage: $0 test <channel_number>${NC}"
        exit 1
    fi

    local channel_info="${CHANNELS[$num]}"
    local channel_name="${channel_info#*:}"

    echo -e "${CYAN}Testing Channel $num: $channel_name${NC}"
    echo ""

    # Test origin
    echo -e "${BLUE}Testing Origin...${NC}"
    curl -I "http://$ORIGIN_DOMAIN/channel-$num/playlist.m3u8" 2>&1 | head -5

    echo ""
    echo -e "${BLUE}Testing CDN...${NC}"
    curl -I "https://$CDN_DOMAIN/channel-$num/playlist.m3u8" 2>&1 | head -5

    echo ""
    echo -e "${GREEN}URLs:${NC}"
    echo -e "  Origin: http://$ORIGIN_DOMAIN/channel-$num/playlist.m3u8"
    echo -e "  CDN:    https://$CDN_DOMAIN/channel-$num/playlist.m3u8"
}

show_help() {
    cat << EOF
${GREEN}Production Streaming - cdnfly.online${NC}

${YELLOW}Commands:${NC}
  $0 start            Start all 5 channels
  $0 stop             Stop all channels
  $0 restart          Restart all channels
  $0 status           Show channel status
  $0 test <num>       Test specific channel
  $0 logs [num]       View logs

${YELLOW}Channels:${NC}
EOF
    for num in {1..5}; do
        local channel_info="${CHANNELS[$num]}"
        local channel_name="${channel_info#*:}"
        echo -e "  $num. $channel_name"
    done

    cat << EOF

${YELLOW}URLs:${NC}
  Origin: http://$ORIGIN_DOMAIN/channel-{1-5}/playlist.m3u8
  CDN:    https://$CDN_DOMAIN/channel-{1-5}/playlist.m3u8

${YELLOW}Monitoring:${NC}
  pm2 list            List all processes
  pm2 monit           Live monitoring
  pm2 logs            View all logs
  pm2 logs channel-1  View specific channel

EOF
}

# Main
case "${1:-}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        start_all
        ;;
    status)
        status
        ;;
    test)
        test_stream $2
        ;;
    logs)
        if [ -z "$2" ]; then
            pm2 logs
        else
            pm2 logs "channel-$2"
        fi
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
