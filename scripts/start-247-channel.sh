#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY - Stable Local Logs Version
# ==============================================================================

# Exit on undefined variable
set -u

if [ "$#" -ne 5 ]; then
    echo "Usage: $0 <slug> <username> <password> <channel_id> <host>"
    exit 1
fi

SLUG=$1
IPTV_USER=$2
IPTV_PASS=$3
CH_ID=$4
HOST=$5

# Configuration
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
# Move logs to current project directory to avoid root permission issues
LOG_DIR="$HOME/ciyaar/logs"
LOG_FILE="$LOG_DIR/$SLUG.log"

INPUT_URL="http://$HOST/live/$IPTV_USER/$IPTV_PASS/$CH_ID.ts"

# Create directories
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Clean old segments
rm -f "$STREAM_DIR"/*.ts 2>/dev/null
rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null

echo "=============================================="
echo "📺 STARTING OPTIMIZED STREAM: $SLUG"
echo "=============================================="

RESTART_COUNT=0

while true; do
    RESTART_COUNT=$((RESTART_COUNT + 1))
    echo "[$(date)] Starting Stream (Attempt $RESTART_COUNT)..." >> "$LOG_FILE"
    
    ffmpeg -hide_banner -loglevel error \
        -user_agent "VLC/3.0.18" \
        -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
        -i "$INPUT_URL" \
        -c:v libx264 -preset ultrafast -tune zerolatency \
        -b:v 1500k -maxrate 1500k -bufsize 3000k \
        -c:a copy \
        -hls_time 6 \
        -hls_list_size 10 \
        -hls_flags delete_segments \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    EXIT_CODE=$?
    echo "[$(date)] Stream crashed (Exit: $EXIT_CODE). Restarting..." >> "$LOG_FILE"
    sleep 5
done
