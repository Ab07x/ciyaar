#!/bin/bash
# ==============================================================================
# FIX STREAM LOOPING - High Quality No-Loop Configuration
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "\n${CYAN}$1${NC}"; }

log_header "🔧 FIXING STREAM LOOPING - HIGH QUALITY MODE"

# Stop all current streams
log_warn "Stopping all current streams..."
pkill -9 ffmpeg 2>/dev/null || true
rm -f ~/sports-stream/pids/*.pid 2>/dev/null || true
sleep 2

# Clear old segments
log_info "Clearing old stream segments..."
sudo rm -rf /var/www/html/sports/* 2>/dev/null || true
sudo mkdir -p /var/www/html/sports
sudo chown -R www-data:www-data /var/www/html/sports

# Create optimized FFmpeg start script
cat > ~/sports-stream/scripts/start-hq-stream.sh << 'EOF'
#!/bin/bash
# High Quality Stream - No Looping

SLUG="$1"
URL="$2"
DURATION="${3:-150}"

if [ -z "$SLUG" ] || [ -z "$URL" ]; then
    echo "Usage: $0 <slug> <url> [duration]"
    exit 1
fi

STREAM_DIR="/var/www/html/sports/$SLUG"
LOG_FILE="$HOME/sports-stream/logs/${SLUG}.log"
PID_FILE="$HOME/sports-stream/pids/${SLUG}.pid"

mkdir -p "$STREAM_DIR"
mkdir -p "$HOME/sports-stream/logs"

echo "Starting HIGH QUALITY stream: $SLUG"
echo "Source: $URL"
echo "Duration: $DURATION minutes"

# High quality FFmpeg settings - NO LOOPING
ffmpeg -hide_banner -loglevel warning \
    -fflags +discardcorrupt+genpts+igndts+discardcorrupt \
    -reconnect 1 \
    -reconnect_at_eof 1 \
    -reconnect_streamed 1 \
    -reconnect_delay_max 10 \
    -timeout 10000000 \
    -i "$URL" \
    -c:v copy \
    -c:a copy \
    -copyts \
    -start_at_zero \
    -f hls \
    -hls_time 2 \
    -hls_list_size 10 \
    -hls_flags delete_segments+omit_endlist+discont_start \
    -hls_segment_type mpegts \
    -hls_segment_filename "$STREAM_DIR/%03d.ts" \
    "$STREAM_DIR/index.m3u8" \
    >> "$LOG_FILE" 2>&1 &

PID=$!
echo $PID > "$PID_FILE"

sleep 3

if ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ Stream started successfully!"
    echo "PID: $PID"
    echo "Stream URL: http://YOUR_SERVER_IP/sports/$SLUG/index.m3u8"
    echo "Log: $LOG_FILE"
else
    echo "❌ Failed to start stream"
    rm -f "$PID_FILE"
    exit 1
fi
EOF

chmod +x ~/sports-stream/scripts/start-hq-stream.sh

# Create symlink
ln -sf ~/sports-stream/scripts/start-hq-stream.sh ~/hq-stream

log_success "High quality stream script created!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎬 START YOUR STREAM WITH HIGH QUALITY:"
echo ""
echo "  ~/hq-stream CHANNEL-NAME URL MINUTES"
echo ""
echo "Example:"
echo "  ~/hq-stream sky-sports-1 'http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487' 150"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 Key Fixes Applied:"
echo "  ✓ Video codec copy (no re-encoding)"
echo "  ✓ Audio codec copy (no re-encoding)"
echo "  ✓ copyts (preserve timestamps)"
echo "  ✓ start_at_zero (prevent looping)"
echo "  ✓ discardcorrupt (skip bad packets)"
echo "  ✓ 2-second segments (low latency)"
echo "  ✓ Only 10 segments in playlist"
echo ""
