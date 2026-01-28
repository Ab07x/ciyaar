#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY - Production Version with Auto-Recovery
# ==============================================================================
# This script runs a single IPTV channel relay using FFmpeg.
# It's designed to be managed by PM2 for 24/7 operation.
#
# Features:
# - Auto-reconnect on source disconnect
# - Exponential backoff for retries
# - Clean segment management
# - Detailed logging
#
# Usage:
#   ./start-247-channel.sh <slug> <stream_url>
#   ./start-247-channel.sh <slug> <username> <password> <channel_id> <host>
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
    exit 1
fi

# Directories
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
LOG_DIR="${LOG_DIR:-$HOME/ciyaar/logs}"
LOG_FILE="$LOG_DIR/$SLUG.log"

# FFmpeg Settings - Optimized for stability
HLS_TIME="${HLS_TIME:-4}"
HLS_LIST_SIZE="${HLS_LIST_SIZE:-10}"
USER_AGENT="${USER_AGENT:-Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}"

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
echo "  📺 FANBROJ STREAMING SERVER - Auto-Recovery Mode"
echo "══════════════════════════════════════════════════════════════"
echo "  Channel:  $SLUG"
echo "  Output:   $STREAM_DIR/index.m3u8"
echo "  Log:      $LOG_FILE"
echo "  Started:  $(date)"
echo "══════════════════════════════════════════════════════════════"

log "🚀 Starting stream for $SLUG"
log "📡 Source URL: ${URL//:\/\/*@/:\/\/***@}"

# Retry settings
RETRY_COUNT=0
MAX_RETRIES=1000
BASE_DELAY=3
MAX_DELAY=30
CURRENT_DELAY=$BASE_DELAY

# Main streaming loop with auto-restart
while true; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "▶️  Starting FFmpeg (attempt $RETRY_COUNT)"
    
    # FFmpeg command with optimized settings for stability
    ffmpeg -hide_banner \
        -loglevel warning \
        -headers "User-Agent: $USER_AGENT"$'\r\n'"Referer: http://iptvtour.store/"$'\r\n' \
        -fflags +genpts+discardcorrupt+nobuffer \
        -flags low_delay \
        -analyzeduration 3000000 \
        -probesize 3000000 \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 10 \
        -reconnect_on_network_error 1 \
        -reconnect_on_http_error 4xx,5xx \
        -timeout 30000000 \
        -rw_timeout 30000000 \
        -i "$URL" \
        -c:v copy \
        -c:a copy \
        -f hls \
        -hls_time "$HLS_TIME" \
        -hls_list_size "$HLS_LIST_SIZE" \
        -hls_flags delete_segments+append_list+omit_endlist+temp_file \
        -hls_segment_type mpegts \
        -hls_allow_cache 1 \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    EXIT_CODE=$?
    
    # Log the exit
    case $EXIT_CODE in
        0)
            log "⚠️  FFmpeg exited normally (code 0) - Source may have ended"
            CURRENT_DELAY=$BASE_DELAY  # Reset delay on clean exit
            ;;
        255)
            log "⚠️  FFmpeg received signal (code 255)"
            ;;
        *)
            log "❌ FFmpeg error (exit code: $EXIT_CODE)"
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
    
    log "🔄 Restarting in ${CURRENT_DELAY}s... (retry $RETRY_COUNT)"
    sleep "$CURRENT_DELAY"
    
    # Exponential backoff with cap
    CURRENT_DELAY=$((CURRENT_DELAY + 2))
    [ $CURRENT_DELAY -gt $MAX_DELAY ] && CURRENT_DELAY=$MAX_DELAY
    
    # Reset delay after 10 successful minutes (indicated by high retry count with same delay)
    if [ $RETRY_COUNT -gt 0 ] && [ $((RETRY_COUNT % 20)) -eq 0 ]; then
        CURRENT_DELAY=$BASE_DELAY
        log "📊 Resetting retry delay to ${BASE_DELAY}s"
    fi
done
