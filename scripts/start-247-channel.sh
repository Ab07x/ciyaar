#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY - Production Version
# ==============================================================================
# Restreams an Xtream Codes channel to HLS format using FFmpeg Copy Mode.
# Uses 0% CPU encoding overhead - perfect for low-cost VPS.
#
# Usage: ./start-247-channel.sh <slug> <username> <password> <channel_id> <host>
# Example: ./start-247-channel.sh universal 59ad8c73feb6 3c0ac8cfe4 12345 cf.live78.online
#
# Use with PM2:
# pm2 start ./start-247-channel.sh --name "ch-universal" --interpreter bash -- universal user pass id host
# ==============================================================================

# Exit on undefined variable
set -u

if [ "$#" -ne 5 ]; then
    echo "=============================================="
    echo "❌ ERROR: Missing arguments"
    echo "=============================================="
    echo "Usage: $0 <slug> <username> <password> <channel_id> <host>"
    echo "Example: $0 universal 59ad8c73feb6 3c0ac8cfe4 12345 cf.live78.online"
    echo ""
    echo "Parameters:"
    echo "  slug       - Short name for the channel (e.g., 'universal', 'sntv')"
    echo "  username   - Xtream Codes username"
    echo "  password   - Xtream Codes password"
    echo "  channel_id - Channel ID from your IPTV provider"
    echo "  host       - Provider hostname (e.g., 'cf.live78.online')"
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

# Construct Input URL (Standard Xtream Codes format)
# Format: http://host/live/username/password/channel_id.ts
INPUT_URL="http://$HOST/live/$IPTV_USER/$IPTV_PASS/$CH_ID.ts"

# Create directories if they don't exist
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Clean old segments for fresh start
rm -f "$STREAM_DIR"/*.ts 2>/dev/null
rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null

echo "=============================================="
echo "📺 FANBROJ 24/7 STREAMING"
echo "=============================================="
echo "🎬 Channel:  $SLUG"
echo "🔗 Source:   http://$HOST/live/****/****/$CH_ID.ts"
echo "📂 Output:   $STREAM_DIR/index.m3u8"
echo "📝 Log:      $LOG_FILE"
echo "⏰ Started:  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# Log startup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] === STREAM STARTING ===" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Channel: $SLUG | ID: $CH_ID | Host: $HOST" >> "$LOG_FILE"

# Track restart count
RESTART_COUNT=0

# Infinite loop for auto-restart on failure
while true; do
    RESTART_COUNT=$((RESTART_COUNT + 1))
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting FFmpeg (attempt #$RESTART_COUNT)..." >> "$LOG_FILE"
    
    # ==============================================================================
    # FFmpeg Command - COPY MODE (Zero CPU overhead)
    # ==============================================================================
    # -hide_banner           : Suppress FFmpeg banner
    # -loglevel warning      : Only show warnings/errors
    # -user_agent            : Spoof as VLC to avoid blocks
    # -fflags                : Fix timestamps, discard corrupt packets, no buffering
    # -reconnect*            : Auto-reconnect if source drops 
    # -c:v copy -c:a copy    : COPY MODE - no encoding, zero CPU usage
    # -hls_time 4            : 4-second segments (good balance of latency/stability)
    # -hls_list_size 6       : Keep 6 segments in playlist (24 seconds buffer)
    # -hls_flags             : Delete old segments, append to list
    # ==============================================================================
    
    ffmpeg -hide_banner \
        -loglevel warning \
        -user_agent "VLC/3.0.18 LibVLC/3.0.18" \
        -fflags +genpts+discardcorrupt+nobuffer \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -rw_timeout 10000000 \
        -i "$INPUT_URL" \
        -c:v copy \
        -c:a copy \
        -hls_time 4 \
        -hls_list_size 6 \
        -hls_flags delete_segments+append_list \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    # FFmpeg exited - log it
    EXIT_CODE=$?
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] FFmpeg exited with code $EXIT_CODE" >> "$LOG_FILE"
    echo "⚠️ Stream ($SLUG) disconnected! Exit code: $EXIT_CODE. Restarting in 5 seconds..."
    
    # Progressive backoff if multiple quick failures
    if [ $RESTART_COUNT -gt 10 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Multiple failures detected, waiting 30 seconds..." >> "$LOG_FILE"
        sleep 30
        RESTART_COUNT=0
    else
        sleep 5
    fi
done
