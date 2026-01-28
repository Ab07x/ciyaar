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

# Load config file if exists
CONFIG_FILE="$HOME/ciyaar/config/iptv.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Directories
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
LOG_DIR="${LOG_DIR:-$HOME/ciyaar/logs}"
LOG_FILE="$LOG_DIR/$SLUG.log"

# FFmpeg Settings - Optimized for CDN/CloudFront compatibility
HLS_TIME="${HLS_TIME:-4}"
HLS_LIST_SIZE="${HLS_LIST_SIZE:-900}"  # 900 segments = 1 hour retention (matches CloudFront cache)
HLS_DELETE_THRESHOLD="${HLS_DELETE_THRESHOLD:-5}"  # Keep 5x more segments before deletion

# Proxy Settings (optional - for residential IP masking)
# Set in config file: PROXY_URL="http://user:pass@proxy:port"
PROXY_URL="${PROXY_URL:-}"
PROXY_ARGS=""
if [ -n "$PROXY_URL" ]; then
    PROXY_ARGS="-http_proxy $PROXY_URL"
fi

# Mobile device User-Agents (rotates for anti-detection)
MOBILE_AGENTS=(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
    "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    "IPTV Smarters Pro/3.1.5"
    "VLC/3.0.18 LibVLC/3.0.18"
    "Lavf/60.3.100"
)

# Select random User-Agent
RANDOM_INDEX=$((RANDOM % ${#MOBILE_AGENTS[@]}))
USER_AGENT="${USER_AGENT:-${MOBILE_AGENTS[$RANDOM_INDEX]}}"

# Create directories
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# IMPORTANT: Do NOT delete old segments on restart
# CloudFront may still be serving cached playlists referencing them
# FFmpeg will continue numbering from the highest existing segment
# Old segments will be auto-deleted by hls_flags delete_segments once outside the playlist window

# Only clean on very first start (if no m3u8 exists)
if [ ! -f "$STREAM_DIR/index.m3u8" ]; then
    log "🧹 First start detected - cleaning directory"
    rm -f "$STREAM_DIR"/*.ts 2>/dev/null
    rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null
fi

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
    
    # Log proxy status
    if [ -n "$PROXY_URL" ]; then
        log "▶️  Starting FFmpeg (attempt $RETRY_COUNT) via PROXY"
    else
        log "▶️  Starting FFmpeg (attempt $RETRY_COUNT)"
    fi
    
    # FFmpeg command with optimized settings for stability
    # Using mobile device headers to avoid detection
    # shellcheck disable=SC2086
    ffmpeg -hide_banner \
        -loglevel warning \
        $PROXY_ARGS \
        -headers "User-Agent: $USER_AGENT"$'\r\n'"Accept: */*"$'\r\n'"Accept-Language: en-US,en;q=0.9"$'\r\n'"Connection: keep-alive"$'\r\n'"X-Requested-With: com.nst.iptvsmarterstvbox"$'\r\n' \
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
        -hls_delete_threshold "$HLS_DELETE_THRESHOLD" \
        -hls_flags delete_segments+append_list+omit_endlist+temp_file \
        -hls_segment_type mpegts \
        -hls_start_number_source epoch \
        -hls_allow_cache 1 \
        -hls_segment_filename "$STREAM_DIR/%d.ts" \
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
