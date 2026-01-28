#!/bin/bash
# ==============================================================================
# Event Stream Management Script
# ==============================================================================
# Easy script to start/stop event streams with PM2
# ==============================================================================

ACTION="${1:-help}"
SLUG="${2:-}"
URL="${3:-}"

SCRIPT_DIR="$HOME/ciyaar/scripts"

help() {
    cat <<EOF
═══════════════════════════════════════════════════════════════
  📺 FANBROJ EVENT STREAM MANAGER
═══════════════════════════════════════════════════════════════

USAGE:
  ./manage-event.sh start <slug> <stream_url>
  ./manage-event.sh stop <slug>
  ./manage-event.sh restart <slug> <stream_url>
  ./manage-event.sh list
  ./manage-event.sh clean <slug>

COMMANDS:
  start     - Start a new event stream
  stop      - Stop an event stream
  restart   - Restart an event stream
  list      - Show all running streams
  clean     - Clean up all files for a stream

EXAMPLES:
  # Start sky-action event
  ./manage-event.sh start sky-action "http://host/stream.ts"

  # Stop sky-action event
  ./manage-event.sh stop sky-action

  # List all streams
  ./manage-event.sh list

  # Clean up old sky-action files
  ./manage-event.sh clean sky-action

═══════════════════════════════════════════════════════════════
EOF
}

start_stream() {
    if [ -z "$SLUG" ] || [ -z "$URL" ]; then
        echo "❌ Error: Missing slug or URL"
        echo "Usage: $0 start <slug> <stream_url>"
        exit 1
    fi

    echo "🚀 Starting event stream: $SLUG"

    # Clean old segments first
    rm -rf "/var/www/html/hls/$SLUG"/*.ts 2>/dev/null || true
    rm -rf "/var/www/html/hls/$SLUG"/*.m3u8 2>/dev/null || true

    # Start with PM2
    pm2 start "$SCRIPT_DIR/start-event-stream.sh" \
        --name "event-$SLUG" \
        --time \
        --max-restarts 5 \
        --restart-delay 5000 \
        -- "$SLUG" "$URL"

    echo "✅ Stream started: event-$SLUG"
    echo "📊 View logs: pm2 logs event-$SLUG"
    echo "🌐 Stream URL: https://cdn.fanbroj.net/hls/$SLUG/index.m3u8"
}

stop_stream() {
    if [ -z "$SLUG" ]; then
        echo "❌ Error: Missing slug"
        echo "Usage: $0 stop <slug>"
        exit 1
    fi

    echo "🛑 Stopping event stream: $SLUG"
    pm2 delete "event-$SLUG" 2>/dev/null || echo "⚠️  Stream not running"

    # Clean segments
    rm -rf "/var/www/html/hls/$SLUG"/*.ts 2>/dev/null || true
    rm -rf "/var/www/html/hls/$SLUG"/*.m3u8 2>/dev/null || true

    echo "✅ Stream stopped and cleaned"
}

restart_stream() {
    if [ -z "$SLUG" ] || [ -z "$URL" ]; then
        echo "❌ Error: Missing slug or URL"
        echo "Usage: $0 restart <slug> <stream_url>"
        exit 1
    fi

    echo "🔄 Restarting event stream: $SLUG"
    stop_stream
    sleep 2
    start_stream
}

list_streams() {
    echo "📋 Running event streams:"
    pm2 list
}

clean_stream() {
    if [ -z "$SLUG" ]; then
        echo "❌ Error: Missing slug"
        echo "Usage: $0 clean <slug>"
        exit 1
    fi

    echo "🧹 Cleaning stream files: $SLUG"

    # Stop if running
    pm2 delete "event-$SLUG" 2>/dev/null || true

    # Clean all files
    rm -rf "/var/www/html/hls/$SLUG" 2>/dev/null || true
    rm -f "$HOME/ciyaar/logs/$SLUG.log" 2>/dev/null || true

    echo "✅ All files cleaned for: $SLUG"
}

case "$ACTION" in
    start)
        start_stream
        ;;
    stop)
        stop_stream
        ;;
    restart)
        restart_stream
        ;;
    list)
        list_streams
        ;;
    clean)
        clean_stream
        ;;
    help|--help|-h)
        help
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        help
        exit 1
        ;;
esac
