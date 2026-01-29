#!/bin/bash

##############################################################################
# MASTER CONTROL - ONE SCRIPT TO RULE THEM ALL
# Turn on/off 5 channels instantly with zero buffer/loop issues
# World Cup & Premier League Ready
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"

# IPTV
IPTV_USER="d06HPCFR"
IPTV_PASS="qEBJjW3"
IPTV_URL="http://iptvtour.store:80"

# Domains
CDN_DOMAIN="stream.cdnfly.online"
ORIGIN_DOMAIN="origin.cdnfly.online"

# Ultra-optimized HLS settings (ZERO BUFFER/LOOP)
HLS_TIME=2              # 2s segments (ultra low latency)
HLS_LIST_SIZE=10        # 10 segments = 20s buffer
HLS_DELETE_THRESHOLD=15
HLS_FLAGS="delete_segments+append_list+omit_endlist+program_date_time"

# 5 Channels (Premier League + World Cup)
declare -A CHANNELS=(
    [1]="9701:Sky Sports Main Event"
    [2]="9700:Sky Sports Football"
    [3]="9696:Sky Sports Action"
    [4]="14345:TNT Sport 1"
    [5]="14346:TNT Sport 2"
)

show_banner() {
    clear
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗        ║
║   ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗       ║
║   ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝       ║
║   ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗       ║
║   ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║       ║
║   ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝       ║
║                                                               ║
║           CDNFly Production Streaming Control                 ║
║              World Cup & Premier League Ready                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo ""
}

check_requirements() {
    local missing=0

    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}✗ FFmpeg not installed${NC}"
        missing=1
    fi

    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}✗ PM2 not installed${NC}"
        missing=1
    fi

    if ! command -v nginx &> /dev/null; then
        echo -e "${RED}✗ NGINX not installed${NC}"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        echo ""
        echo -e "${YELLOW}Install missing dependencies:${NC}"
        echo "  apt install -y ffmpeg nginx nodejs npm && npm install -g pm2"
        exit 1
    fi
}

setup_directories() {
    mkdir -p $HLS_OUTPUT
    mkdir -p $LOGS_DIR

    for i in {1..5}; do
        mkdir -p $HLS_OUTPUT/channel-$i
    done

    echo -e "${GREEN}✓ Directories ready${NC}"
}

configure_nginx() {
    if [ ! -f /etc/nginx/sites-available/streaming ]; then
        echo -e "${BLUE}Configuring NGINX...${NC}"

        cat > /etc/nginx/sites-available/streaming << 'NGINX_EOF'
server {
    listen 80;
    server_name origin.cdnfly.online;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # CORS for HLS
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;

    # Root
    root /var/streaming/hls;

    # HLS files
    location ~* \.(m3u8|ts)$ {
        access_log off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
    }

    # Gzip playlists
    location ~ \.m3u8$ {
        gzip on;
        gzip_types application/vnd.apple.mpegurl;
    }
}
NGINX_EOF

        ln -sf /etc/nginx/sites-available/streaming /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl reload nginx

        echo -e "${GREEN}✓ NGINX configured${NC}"
    fi
}

start_channel() {
    local num=$1
    local info="${CHANNELS[$num]}"
    local stream_id="${info%%:*}"
    local name="${info#*:}"

    local source="$IPTV_URL/$IPTV_USER/$IPTV_PASS/$stream_id"
    local output="$HLS_OUTPUT/channel-$num"

    # Clean any old segments first
    rm -f $output/seg_*.ts
    rm -f $output/*.m3u8

    echo -e "  ${BLUE}[$num/5]${NC} Starting: ${GREEN}$name${NC}"

    # ULTRA-OPTIMIZED FFmpeg for ZERO BUFFER/LOOP
    pm2 start ffmpeg \
        --name "channel-$num" \
        --interpreter none \
        --restart-delay 1000 \
        --max-restarts 9999 \
        --log "$LOGS_DIR/channel-$num.log" \
        --time \
        -- \
        -hide_banner \
        -loglevel error \
        -err_detect ignore_err \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 2 \
        -timeout 20000000 \
        -fflags +genpts+discardcorrupt+igndts \
        -thread_queue_size 1024 \
        -analyzeduration 2000000 \
        -probesize 2000000 \
        -i "$source" \
        -map 0:v:0 \
        -map 0:a:0 \
        -c:v copy \
        -c:a aac -b:a 128k -ar 48000 -ac 2 \
        -avoid_negative_ts make_zero \
        -start_at_zero \
        -vsync cfr \
        -async 1 \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_delete_threshold $HLS_DELETE_THRESHOLD \
        -hls_flags $HLS_FLAGS \
        -hls_segment_type mpegts \
        -hls_segment_filename "$output/seg_%05d.ts" \
        -method PUT \
        "$output/playlist.m3u8" \
        >/dev/null 2>&1

    sleep 0.5
}

# ============================================================================
# TURN ON - Start all 5 channels
# ============================================================================
turn_on() {
    show_banner
    echo -e "${CYAN}${BOLD}Turning ON all streams...${NC}"
    echo ""

    # Check requirements
    check_requirements

    # Setup
    setup_directories
    configure_nginx

    echo ""
    echo -e "${CYAN}Starting 5 channels...${NC}"

    # Stop any existing first
    pm2 delete all 2>/dev/null || true
    sleep 1

    # Start all 5 channels
    for i in {1..5}; do
        start_channel $i
    done

    # Wait for streams to stabilize
    echo ""
    echo -e "${YELLOW}Waiting for streams to stabilize (10s)...${NC}"
    sleep 10

    # Verify all are running
    echo ""
    echo -e "${CYAN}Verifying streams...${NC}"

    local all_good=1
    for i in {1..5}; do
        local playlist="$HLS_OUTPUT/channel-$i/playlist.m3u8"
        if [ -f "$playlist" ]; then
            local age=$(( $(date +%s) - $(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null) ))
            if [ $age -lt 15 ]; then
                echo -e "  ${GREEN}✓${NC} Channel $i: LIVE"
            else
                echo -e "  ${YELLOW}⚠${NC} Channel $i: Starting..."
                all_good=0
            fi
        else
            echo -e "  ${RED}✗${NC} Channel $i: Failed to start"
            all_good=0
        fi
    done

    # Save PM2 state
    pm2 save >/dev/null 2>&1

    echo ""
    if [ $all_good -eq 1 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║         ALL 5 CHANNELS LIVE ✓                         ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║         Streams starting... (wait 30s)                ║${NC}"
        echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
    fi

    echo ""
    echo -e "${CYAN}CDN URLs (Use these in your app):${NC}"
    for i in {1..5}; do
        local info="${CHANNELS[$i]}"
        local name="${info#*:}"
        echo -e "  ${name}"
        echo -e "    ${BLUE}https://$CDN_DOMAIN/channel-$i/playlist.m3u8${NC}"
    done

    echo ""
    echo -e "${YELLOW}Monitor:${NC} pm2 monit"
    echo -e "${YELLOW}Logs:${NC} pm2 logs"
    echo -e "${YELLOW}Status:${NC} $0 status"
}

# ============================================================================
# TURN OFF - Stop all channels
# ============================================================================
turn_off() {
    show_banner
    echo -e "${CYAN}${BOLD}Turning OFF all streams...${NC}"
    echo ""

    pm2 delete all 2>/dev/null || {
        echo -e "${YELLOW}No streams running${NC}"
        exit 0
    }

    pm2 save >/dev/null 2>&1

    # Clean HLS files
    echo -e "${BLUE}Cleaning HLS files...${NC}"
    for i in {1..5}; do
        rm -f $HLS_OUTPUT/channel-$i/seg_*.ts
        rm -f $HLS_OUTPUT/channel-$i/*.m3u8
    done

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ALL STREAMS STOPPED ✓                         ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
}

# ============================================================================
# STATUS - Show current status
# ============================================================================
show_status() {
    show_banner

    echo -e "${CYAN}${BOLD}Stream Status:${NC}"
    echo ""
    pm2 list

    echo ""
    echo -e "${CYAN}${BOLD}Health Check:${NC}"

    for i in {1..5}; do
        local info="${CHANNELS[$i]}"
        local name="${info#*:}"
        local playlist="$HLS_OUTPUT/channel-$i/playlist.m3u8"

        if [ -f "$playlist" ]; then
            local age=$(( $(date +%s) - $(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null) ))
            local segments=$(ls -1 $HLS_OUTPUT/channel-$i/seg_*.ts 2>/dev/null | wc -l)

            if [ $age -lt 5 ]; then
                echo -e "  ${GREEN}✓${NC} Channel $i ($name): ${GREEN}HEALTHY${NC} - $segments segs, ${age}s ago"
            elif [ $age -lt 15 ]; then
                echo -e "  ${YELLOW}⚠${NC} Channel $i ($name): ${YELLOW}WARNING${NC} - $segments segs, ${age}s ago"
            else
                echo -e "  ${RED}✗${NC} Channel $i ($name): ${RED}DOWN${NC} - $segments segs, ${age}s ago"
            fi
        else
            echo -e "  ${RED}✗${NC} Channel $i ($name): ${RED}OFFLINE${NC}"
        fi
    done

    echo ""
    echo -e "${CYAN}${BOLD}Stream URLs:${NC}"
    for i in {1..5}; do
        echo -e "  https://$CDN_DOMAIN/channel-$i/playlist.m3u8"
    done
}

# ============================================================================
# QUICK TEST
# ============================================================================
quick_test() {
    echo -e "${CYAN}Testing all channels...${NC}"
    echo ""

    for i in {1..5}; do
        local url="https://$CDN_DOMAIN/channel-$i/playlist.m3u8"
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

        if [ "$response" = "200" ]; then
            echo -e "  ${GREEN}✓${NC} Channel $i: OK"
        else
            echo -e "  ${RED}✗${NC} Channel $i: Failed (HTTP $response)"
        fi
    done
}

# ============================================================================
# HELP
# ============================================================================
show_help() {
    show_banner

    cat << EOF
${GREEN}${BOLD}MASTER CONTROL - All-in-One Streaming${NC}

${YELLOW}Commands:${NC}

  ${BOLD}$0 on${NC}        Turn ON all 5 channels (instant)
  ${BOLD}$0 off${NC}       Turn OFF all 5 channels (instant)
  ${BOLD}$0 restart${NC}   Restart all channels
  ${BOLD}$0 status${NC}    Show current status
  ${BOLD}$0 test${NC}      Quick test all channels

${YELLOW}Examples:${NC}

  ${BOLD}$0 on${NC}         Start streaming (World Cup/Premier League)
  ${BOLD}$0 status${NC}     Check if all channels healthy
  ${BOLD}$0 off${NC}        Stop all streams

${YELLOW}Channels (5):${NC}
EOF

    for i in {1..5}; do
        local info="${CHANNELS[$i]}"
        local name="${info#*:}"
        echo -e "  $i. $name"
    done

    cat << EOF

${YELLOW}Features:${NC}

  ✅ Zero buffer/loop issues
  ✅ 2-second ultra-low latency
  ✅ Auto-restart on failure
  ✅ CloudFront CDN ready
  ✅ World Cup & Premier League optimized

${YELLOW}URLs (Use these in your app):${NC}

  https://$CDN_DOMAIN/channel-{1-5}/playlist.m3u8

${YELLOW}Monitor:${NC}

  pm2 monit          Live monitoring
  pm2 logs           View all logs
  pm2 logs channel-1 Specific channel

EOF
}

# ============================================================================
# MAIN
# ============================================================================

case "${1:-}" in
    on|start)
        turn_on
        ;;
    off|stop)
        turn_off
        ;;
    restart)
        turn_off
        sleep 2
        turn_on
        ;;
    status)
        show_status
        ;;
    test)
        quick_test
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
