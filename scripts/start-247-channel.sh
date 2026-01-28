#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY - Production Version
# ==============================================================================
# This script runs a single IPTV channel relay using FFmpeg.
# It's designed to be managed by PM2 for 24/7 operation.
#
# Usage:
#   ./start-247-channel.sh <slug> <stream_url>
#   ./start-247-channel.sh <slug> <username> <password> <channel_id> <host>
#
# Examples:
#   ./start-247-channel.sh universal "http://host/live/user/pass/123.ts"
#   ./start-247-channel.sh universal user pass 123 host.com
# ==============================================================================

# Configuration
SLUG="${1:-mytv}"
URL="${2:-}"

# Support legacy 5-argument format
if [ "$#" -eq 5 ]; then
    URL="http://$5/live/$2/$3/$4.ts"
fi

# Validate URL
if [ -z "$URL" ]; then
    echo "❌ Error: No stream URL provided"
    echo ""
    echo "Usage: $0 <slug> <stream_url>"
    echo "   or: $0 <slug> <username> <password> <channel_id> <host>"
    echo ""
    echo "Examples:"
    echo "  $0 universal \"http://host/live/user/pass/123.ts\""
    echo "  $0 universal user pass 123 host.com"
    exit 1
fi

# Directories
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
LOG_DIR="${LOG_DIR:-$HOME/ciyaar/logs}"
LOG_FILE="$LOG_DIR/$SLUG.log"

# FFmpeg Settings
HLS_TIME="${HLS_TIME:-4}"
HLS_LIST_SIZE="${HLS_LIST_SIZE:-6}"
USER_AGENT="${USER_AGENT:-VLC/3.0.18 LibVLC/3.0.18}"

# Create directories
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Clean old segments
rm -f "$STREAM_DIR"/*.ts 2>/dev/null
rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    log "🛑 Received shutdown signal for $SLUG"
    rm -f "$STREAM_DIR"/*.ts 2>/dev/null
    rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null
    exit 0
}

# Trap signals for clean shutdown
trap cleanup SIGTERM SIGINT SIGHUP

# Banner
echo "══════════════════════════════════════════════════════════════"
echo "  📺 FANBROJ STREAMING SERVER"
echo "══════════════════════════════════════════════════════════════"
echo "  Channel:  $SLUG"
echo "  Output:   $STREAM_DIR/index.m3u8"
echo "  Log:      $LOG_FILE"
echo "  Started:  $(date)"
echo "══════════════════════════════════════════════════════════════"

log "🚀 Starting stream for $SLUG"
log "📡 Source URL: ${URL//:\/\/*@/:\/\/***@}"  # Hide credentials in log

# Retry counter
RETRY_COUNT=0
MAX_RETRIES=100
RETRY_DELAY=5

# Main streaming loop with auto-restart
while true; do
    log "▶️  Starting FFmpeg (attempt $((RETRY_COUNT + 1)))"
    
    # FFmpeg command with optimized settings
    ffmpeg -hide_banner \
        -loglevel warning \
        -headers "User-Agent: $USER_AGENT"$'\r\n' \
        -fflags +genpts+discardcorrupt+nobuffer \
        -flags low_delay \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -timeout 10000000 \
        -i "$URL" \
        -c:v copy \
        -c:a copy \
        -f hls \
        -hls_time "$HLS_TIME" \
        -hls_list_size "$HLS_LIST_SIZE" \
        -hls_flags delete_segments+append_list+omit_endlist \
        -hls_segment_type mpegts \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    EXIT_CODE=$?
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    # Log the exit
    case $EXIT_CODE in
        0)
            log "⚠️  FFmpeg exited normally (code 0)"
            ;;
        255)
            log "⚠️  FFmpeg received signal (code 255)"
            ;;
        *)
            log "❌ FFmpeg crashed (exit code: $EXIT_CODE)"
            ;;
    esac
    
    # Check if we should continue retrying
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        log "❌ Max retries ($MAX_RETRIES) reached. Giving up."
        exit 1
    fi
    
    # Clean stale segments before restart
    rm -f "$STREAM_DIR"/*.ts 2>/dev/null
    rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null
    
    log "🔄 Restarting in ${RETRY_DELAY}s... (retry $RETRY_COUNT/$MAX_RETRIES)"
    sleep "$RETRY_DELAY"
    
    # Exponential backoff (max 60 seconds)
    if [ $RETRY_COUNT -gt 5 ]; then
        RETRY_DELAY=$((RETRY_DELAY * 2))
        [ $RETRY_DELAY -gt 60 ] && RETRY_DELAY=60
    fi
done
