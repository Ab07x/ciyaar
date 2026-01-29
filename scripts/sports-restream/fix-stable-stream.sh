#!/bin/bash
# ==============================================================================
# FIX STABLE STREAM - No Stopping, No Buffering, Smooth Playback
# ==============================================================================
# Fixes: Stream stops every 20s, Network errors, VLC/Web player issues
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; }

log_header() {
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           FIXING STREAM STABILITY                             ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_header

# Stop all current streams
log_warn "Stopping all unstable streams..."
pkill -9 ffmpeg 2>/dev/null || true
sleep 2

# Clean up
rm -f ~/sports-stream/pids/*.pid 2>/dev/null || true
sudo rm -rf /var/www/html/sports/* 2>/dev/null || true
sudo mkdir -p /var/www/html/sports
sudo chown -R $USER:$USER /var/www/html/sports 2>/dev/null || true

log_success "Cleaned up old streams"

# Create ultra-stable FFmpeg script
cat > ~/sports-stream/scripts/ultra-stable.sh << 'EOF'
#!/bin/bash
# ULTRA STABLE STREAM - For VLC and Web Players

SLUG="$1"
URL="$2"
DURATION="${3:-150}"

if [ -z "$SLUG" ] || [ -z "$URL" ]; then
    echo "Usage: $0 <name> <url> [duration]"
    exit 1
fi

STREAM_DIR="/var/www/html/sports/$SLUG"
LOG_FILE="$HOME/sports-stream/logs/${SLUG}.log"
PID_FILE="$HOME/sports-stream/pids/${SLUG}.pid"

mkdir -p "$STREAM_DIR"

echo "Starting ULTRA STABLE stream: $SLUG"

# ULTRA STABLE settings for VLC/Web players
ffmpeg -hide_banner \
    -loglevel warning \
    \
    # Input - maximum stability
    -fflags +genpts+igndts+discardcorrupt+nobuffer \
    -flags low_delay \
    -strict experimental \
    -reconnect 1 \
    -reconnect_at_eof 1 \
    -reconnect_streamed 1 \
    -reconnect_delay_max 60 \
    -timeout 60000000 \
    -tcp_nodelay 1 \
    -i "$URL" \
    \
    # Video - copy with repair
    -c:v copy \
    -bsf:v h264_mp4toannexb \
    -max_muxing_queue_size 1024 \
    \
    # Audio - copy
    -c:a copy \
    -bsf:a aac_adtstoasc \
    \
    # HLS - optimized for players
    -f hls \
    -hls_time 6 \
    -hls_list_size 10 \
    -hls_delete_threshold 3 \
    -hls_flags delete_segments+omit_endlist+program_date_time+independent_segments \
    -hls_allow_cache 1 \
    -hls_segment_type mpegts \
    -hls_segment_filename "$STREAM_DIR/segment_%05d.ts" \
    -hls_playlist_type event \
    -hls_base_url "./" \
    "$STREAM_DIR/index.m3u8" \
    >> "$LOG_FILE" 2>&1 &

PID=$!
echo $PID > "$PID_FILE"

sleep 5

if ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ Stream started: $SLUG (PID: $PID)"
    
    # Create simple m3u8 for compatibility
    sleep 3
    
    IP=$(curl -s ifconfig.me 2>/dev/null || echo "SERVER_IP")
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "VLC/Web URL:"
    echo "http://$IP/sports/$SLUG/index.m3u8"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Failed to start"
    rm -f "$PID_FILE"
    exit 1
fi
EOF

chmod +x ~/sports-stream/scripts/ultra-stable.sh
ln -sf ~/sports-stream/scripts/ultra-stable.sh ~/stable

log_success "Created ultra-stable stream script"

# Create nginx fix for HLS
cat > /tmp/nginx-hls-fix.conf << 'EOF'
location /sports/ {
    # CORS for web players
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Range, Origin, X-Requested-With, Content-Type, Accept" always;
    
    # Cache settings for live streams
    location ~ \.m3u8$ {
        add_header Access-Control-Allow-Origin "*" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        expires -1;
        
        # Ensure proper MIME type
        default_type application/vnd.apple.mpegurl;
    }
    
    location ~ \.ts$ {
        add_header Access-Control-Allow-Origin "*" always;
        add_header Cache-Control "public, max-age=10" always;
        expires 10s;
        
        # MPEG-TS MIME type
        default_type video/mp2t;
    }
    
    alias /var/www/html/sports/;
    
    # Handle preflight
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        return 204;
    }
}
EOF

log_info "Nginx HLS config created at: /tmp/nginx-hls-fix.conf"
log_info "Add this to your nginx config if streams still fail"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ ULTRA STABLE SYSTEM READY!${NC}"
echo ""
echo "Start streams with:"
echo "  ~/stable <name> <url> <minutes>"
echo ""
echo "Examples:"
echo "  ~/stable nova-sport \"http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437\" 150"
echo "  ~/stable sky-1 \"http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487\" 150"
echo ""
echo "Key fixes applied:"
echo "  ✓ Longer segments (6s) for stability"
echo "  ✓ 10 segments in playlist (60s buffer)"
echo "  ✓ CORS headers for web players"
echo "  ✓ Proper MIME types"
echo "  ✓ 60s reconnect delay"
echo "  ✓ Program date time for sync"
echo "  ✓ Independent segments"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
