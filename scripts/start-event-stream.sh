#!/bin/bash
# ==============================================================================
# FANBROJ EVENT STREAMING - Optimized for 2-hour live events
# ==============================================================================
# Designed for temporary event streams, not 24/7 operation
# Features:
# - Fresh start each stream (sequential segment numbering from 0)
# - Aggressive source health checking
# - Optimized for unstable sources
# - Clean shutdown and cleanup
# ==============================================================================

set -euo pipefail

# Configuration
SLUG="${1:-event}"
URL="${2:-}"

# Validate URL
if [ -z "$URL" ]; then
    echo "❌ Error: No stream URL provided"
    echo ""
    echo "Usage: $0 <slug> <stream_url>"
    exit 1
fi

# Load config if exists
CONFIG_FILE="$HOME/ciyaar/config/iptv.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Directories
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
LOG_DIR="${LOG_DIR:-$HOME/ciyaar/logs}"
LOG_FILE="$LOG_DIR/$SLUG.log"

# Event streaming settings (optimized for 2-hour events)
HLS_TIME="${HLS_TIME:-4}"                    # 4-second segments
HLS_LIST_SIZE="${HLS_LIST_SIZE:-10}"         # Keep only 40 seconds (10 segments)
HLS_DELETE_THRESHOLD="${HLS_DELETE_THRESHOLD:-15}"  # Delete after 60 seconds

# Proxy settings
PROXY_URL="${PROXY_URL:-}"
PROXY_ARGS=""
if [ -n "$PROXY_URL" ]; then
    PROXY_ARGS="-http_proxy $PROXY_URL"
fi

# Mobile User-Agents
MOBILE_AGENTS=(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
    "IPTV Smarters Pro/3.1.5"
    "Lavf/60.3.100"
)

RANDOM_INDEX=$((RANDOM % ${#MOBILE_AGENTS[@]}))
USER_AGENT="${USER_AGENT:-${MOBILE_AGENTS[$RANDOM_INDEX]}}"

# Create directories
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    log "🛑 Shutting down $SLUG stream"

    # Kill ffmpeg gracefully
    pkill -P $$ ffmpeg 2>/dev/null || true
    sleep 2

    # Clean up all segments and playlists
    log "🧹 Cleaning up HLS files"
    rm -f "$STREAM_DIR"/*.ts 2>/dev/null || true
    rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null || true

    log "✅ Cleanup complete"
    exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP EXIT

# CRITICAL: Clean everything before starting (fresh start for each event)
log "🧹 Removing old segments for fresh start"
rm -f "$STREAM_DIR"/*.ts 2>/dev/null || true
rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null || true

# Banner
echo "══════════════════════════════════════════════════════════════"
echo "  📺 FANBROJ EVENT STREAMING"
echo "══════════════════════════════════════════════════════════════"
echo "  Event:    $SLUG"
echo "  Output:   $STREAM_DIR/index.m3u8"
echo "  Log:      $LOG_FILE"
echo "  Started:  $(date)"
echo "══════════════════════════════════════════════════════════════"

log "🚀 Starting event stream for $SLUG"
log "📡 Source URL: ${URL//:\/\/*@/:\/\/***@}"

# Test source availability first
log "🔍 Testing source stream..."
timeout 10 ffprobe -v quiet -print_format json -show_streams "$URL" > /dev/null 2>&1 || {
    log "❌ Source stream is not accessible or invalid"
    exit 1
}
log "✅ Source stream is accessible"

# Retry settings
RETRY_COUNT=0
MAX_RETRIES=50  # Lower for event streams
RESTART_DELAY=3

# Main streaming loop
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))

    if [ -n "$PROXY_URL" ]; then
        log "▶️  Starting FFmpeg (attempt $RETRY_COUNT/$MAX_RETRIES) via PROXY"
    else
        log "▶️  Starting FFmpeg (attempt $RETRY_COUNT/$MAX_RETRIES)"
    fi

    # FFmpeg optimized for unstable sources
    # shellcheck disable=SC2086
    ffmpeg -hide_banner \
        -loglevel error \
        $PROXY_ARGS \
        -headers "User-Agent: $USER_AGENT"$'\r\n'"Accept: */*"$'\r\n'"Connection: keep-alive"$'\r\n' \
        -fflags +genpts+discardcorrupt+igndts \
        -err_detect ignore_err \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -reconnect_on_network_error 1 \
        -reconnect_on_http_error 4xx,5xx \
        -timeout 20000000 \
        -i "$URL" \
        -c:v copy \
        -c:a copy \
        -bsf:v h264_mp4toannexb \
        -avoid_negative_ts make_zero \
        -max_muxing_queue_size 1024 \
        -f hls \
        -hls_time "$HLS_TIME" \
        -hls_list_size "$HLS_LIST_SIZE" \
        -hls_delete_threshold "$HLS_DELETE_THRESHOLD" \
        -hls_flags delete_segments+omit_endlist+program_date_time+temp_file \
        -hls_segment_type mpegts \
        -start_number 0 \
        -hls_allow_cache 1 \
        -hls_segment_filename "$STREAM_DIR/%05d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"

    EXIT_CODE=$?

    # Log exit
    log "⚠️  FFmpeg exited with code $EXIT_CODE"

    # Check if we should retry
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        log "❌ Max retries reached. Stopping stream."
        exit 1
    fi

    # Clean up segments before restart
    log "🧹 Cleaning segments before restart"
    rm -f "$STREAM_DIR"/*.ts 2>/dev/null || true
    rm -f "$STREAM_DIR"/*.m3u8 2>/dev/null || true

    log "🔄 Restarting in ${RESTART_DELAY}s..."
    sleep "$RESTART_DELAY"
done

log "❌ Stream ended after $RETRY_COUNT attempts"
