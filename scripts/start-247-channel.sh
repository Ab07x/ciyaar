#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY - Flexible Input Version
# ==============================================================================

# Exit on undefined variable
set -u

# Function to display usage
usage() {
    echo "Usage: $0 <slug> <input_url>"
    echo "   OR: $0 <slug> <username> <password> <channel_id> <host>"
    exit 1
}

if [ "$#" -lt 2 ]; then
    usage
fi

SLUG=$1
INPUT_URL=""

# Handle different input formats
if [ "$#" -eq 2 ]; then
    # Direct URL mode
    INPUT_URL=$2
elif [ "$#" -eq 5 ]; then
    # Legacy mode (constructed URL)
    IPTV_USER=$2
    IPTV_PASS=$3
    CH_ID=$4
    HOST=$5
    INPUT_URL="http://$HOST/live/$IPTV_USER/$IPTV_PASS/$CH_ID.ts"
else
    echo "Error: Invalid number of arguments."
    usage
fi

# Configuration
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
LOG_DIR="$HOME/ciyaar/logs"
LOG_FILE="$LOG_DIR/$SLUG.log"

# Create directories
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Clean old segments
rm -f "$STREAM_DIR"/*.ts 2>/dev/null
rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null

echo "=============================================="
echo "📺 STARTING STREAM: $SLUG"
echo "🔗 URL: $INPUT_URL"
echo "=============================================="

RESTART_COUNT=0

while true; do
    RESTART_COUNT=$((RESTART_COUNT + 1))
    echo "[$(date)] Starting Stream (Attempt $RESTART_COUNT)..." >> "$LOG_FILE"
    
    # Using the exact FFmpeg command that worked for the user, but sending to HLS
    # Removing -c:v libx264 (transcoding) and using -c copy for performance as per original guide unless transcoding is needed
    # The user's manual test used -c copy and worked perfectly.
    
    ffmpeg -hide_banner -loglevel warning \
        -headers "User-Agent: VLC/3.0.18 LibVLC/3.0.18"$'\r\n' \
        -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
        -i "$INPUT_URL" \
        -c:v copy \
        -c:a copy \
        -hls_time 6 \
        -hls_list_size 10 \
        -hls_flags delete_segments \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    EXIT_CODE=$?
    echo "[$(date)] Stream crashed (Exit: $EXIT_CODE). Restarting..." >> "$LOG_FILE"
    echo "⚠️ Stream crashed! Restarting in 5s..."
    sleep 5
done
