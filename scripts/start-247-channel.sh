#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY - Stable Version
# ==============================================================================
# Uses lightweight transcoding to fix timestamp/freezing issues.
# -preset ultrafast: Very low CPU usage
# -tune zerolatency: Keeps stream live
#
# Usage: ./start-247-channel.sh <slug> <username> <password> <channel_id> <host>
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
LOG_DIR="/var/log/streams"
LOG_FILE="$LOG_DIR/$SLUG.log"

INPUT_URL="http://$HOST/live/$IPTV_USER/$IPTV_PASS/$CH_ID.ts"

mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Clean old segments
rm -f "$STREAM_DIR"/*.ts 2>/dev/null
rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null

echo "=============================================="
echo "📺 STARTING STABILIZED STREAM: $SLUG"
echo "=============================================="

RESTART_COUNT=0

while true; do
    RESTART_COUNT=$((RESTART_COUNT + 1))
    echo "[$(date)] Starting Stream (Attempt $RESTART_COUNT)..." >> "$LOG_FILE"
    
    # STABILIZED TRANSCODING COMMAND
    # -c:v libx264: Re-encode video to fix timestamps
    # -preset ultrafast: Use minimal CPU
    # -b:v 2500k: Cap bitrate at 2.5Mbps (good quality, lighter on network)
    # -hls_list_size 10: Keep 40 seconds buffer (10 * 4s) to prevent stopping
    ffmpeg -hide_banner -loglevel error \
        -user_agent "VLC/3.0.18" \
        -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
        -i "$INPUT_URL" \
        -c:v libx264 -preset ultrafast -tune zerolatency \
        -b:v 2500k -maxrate 2500k -bufsize 5000k \
        -c:a aac -b:a 128k -ac 2 \
        -hls_time 4 \
        -hls_list_size 10 \
        -hls_flags delete_segments \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    EXIT_CODE=$?
    echo "[$(date)] Stream crashed (Exit: $EXIT_CODE). Restarting..." >> "$LOG_FILE"
    sleep 5
done
