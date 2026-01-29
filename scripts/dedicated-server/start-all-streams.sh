#!/bin/bash

##############################################################################
# START ALL STREAMS
# Launches multiple IPTV → HLS streams with resource management
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"
CONFIG_FILE="$STREAM_BASE/config/channels.json"

# IPTV Credentials
IPTV_USERNAME="d06HPCFR"
IPTV_PASSWORD="qEBJjW3"
IPTV_BASE_URL="http://iptvtour.store:80"

# HLS Settings (optimized for sports - low latency)
HLS_TIME=4              # 4-second segments
HLS_LIST_SIZE=6         # Keep 6 segments (24s buffer)
HLS_DELETE_THRESHOLD=8  # Delete segments older than 8
HLS_FLAGS="delete_segments+append_list+omit_endlist"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     STARTING ALL STREAMS                              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file not found!${NC}"
    echo "Run setup-streaming-server.sh first"
    exit 1
fi

# Read enabled channels
ENABLED_CHANNELS=$(jq -r '.channels[] | select(.enabled==true) | .id' $CONFIG_FILE)
CHANNEL_COUNT=$(echo "$ENABLED_CHANNELS" | wc -l)

echo -e "${BLUE}Found $CHANNEL_COUNT enabled channels${NC}"
echo ""

# Stop any existing streams
echo -e "${YELLOW}Stopping existing streams...${NC}"
pm2 delete all 2>/dev/null || true
sleep 2

# Clear old HLS files
echo -e "${YELLOW}Cleaning old HLS files...${NC}"
for channel_id in $ENABLED_CHANNELS; do
    rm -f $HLS_OUTPUT/channel-$channel_id/*.ts
    rm -f $HLS_OUTPUT/channel-$channel_id/*.m3u8
done

# Start each enabled channel
STARTED=0
for channel_id in $ENABLED_CHANNELS; do
    # Get channel info from config
    CHANNEL_NAME=$(jq -r ".channels[] | select(.id==$channel_id) | .name" $CONFIG_FILE)
    STREAM_ID=$(jq -r ".channels[] | select(.id==$channel_id) | .stream_id" $CONFIG_FILE)

    # Build source URL
    SOURCE_URL="$IPTV_BASE_URL/$IPTV_USERNAME/$IPTV_PASSWORD/$STREAM_ID"

    # Output directory
    OUTPUT_DIR="$HLS_OUTPUT/channel-$channel_id"

    echo -e "${BLUE}[$((STARTED + 1))/$CHANNEL_COUNT]${NC} Starting: ${GREEN}$CHANNEL_NAME${NC}"
    echo -e "  Source: $SOURCE_URL"
    echo -e "  Output: $OUTPUT_DIR/playlist.m3u8"

    # Create FFmpeg command with PM2
    pm2 start ffmpeg \
        --name "channel-$channel_id" \
        --interpreter none \
        --restart-delay 3000 \
        --max-restarts 50 \
        --log "$LOGS_DIR/channel-$channel_id.log" \
        -- \
        -loglevel warning \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -timeout 10000000 \
        -i "$SOURCE_URL" \
        -c:v copy \
        -c:a aac -b:a 128k -ar 48000 \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_delete_threshold $HLS_DELETE_THRESHOLD \
        -hls_flags $HLS_FLAGS \
        -hls_segment_type mpegts \
        -hls_segment_filename "$OUTPUT_DIR/segment_%05d.ts" \
        -master_pl_name "master.m3u8" \
        "$OUTPUT_DIR/playlist.m3u8"

    STARTED=$((STARTED + 1))
    sleep 1
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ALL STREAMS STARTED SUCCESSFULLY ✓                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Stream URLs:${NC}"
for channel_id in $ENABLED_CHANNELS; do
    CHANNEL_NAME=$(jq -r ".channels[] | select(.id==$channel_id) | .name" $CONFIG_FILE)
    echo -e "  ${GREEN}$CHANNEL_NAME${NC}: http://YOUR_SERVER_IP/channel-$channel_id/playlist.m3u8"
done

echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo -e "  View all streams: ${BLUE}pm2 list${NC}"
echo -e "  Monitor streams:  ${BLUE}pm2 monit${NC}"
echo -e "  View logs:        ${BLUE}pm2 logs${NC}"
echo -e "  Restart all:      ${BLUE}pm2 restart all${NC}"
echo -e "  Stop all:         ${BLUE}pm2 stop all${NC}"
echo ""
echo -e "${GREEN}Streams are live! 🎬${NC}"

# Save PM2 process list
pm2 save
