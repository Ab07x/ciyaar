#!/bin/bash
# ==============================================================================
# RUN 5 CHANNELS - Start all working sports channels
# ==============================================================================

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           STARTING 5 SPORTS CHANNELS                          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fix permissions first
sudo chown -R $USER:$USER /var/www/html/sports 2>/dev/null || sudo mkdir -p /var/www/html/sports && sudo chown $USER:$USER /var/www/html/sports

# Stop any existing streams
pkill -9 ffmpeg 2>/dev/null || true
rm -f ~/sports-stream/pids/*.pid 2>/dev/null || true
sleep 2

# Channel 1: Nova Sport
echo -e "${YELLOW}Starting Channel 1: Nova Sport${NC}"
~/prod nova-sport "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437" 150 &
sleep 3

# Channel 2: Sky Sports 1
echo -e "${YELLOW}Starting Channel 2: Sky Sports 1${NC}"
~/prod sky-sports-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487" 150 &
sleep 3

# Channel 3: Sky Sports 2
echo -e "${YELLOW}Starting Channel 3: Sky Sports 2${NC}"
~/prod sky-sports-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491" 150 &
sleep 3

# Channel 4: Sky Sports 3
echo -e "${YELLOW}Starting Channel 4: Sky Sports 3${NC}"
~/prod sky-sports-3 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45488" 150 &
sleep 3

# Channel 5: Sky Sports 4
echo -e "${YELLOW}Starting Channel 5: Sky Sports 4${NC}"
~/prod sky-sports-4 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45492" 150 &
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for streams to initialize
sleep 5

# Check status
echo -e "${CYAN}Stream Status:${NC}"
echo ""

IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

for channel in nova-sport sky-sports-1 sky-sports-2 sky-sports-3 sky-sports-4; do
    if [ -f ~/sports-stream/pids/${channel}.pid ]; then
        PID=$(cat ~/sports-stream/pids/${channel}.pid 2>/dev/null)
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $channel - RUNNING"
            echo "  URL: http://$IP/sports/$channel/index.m3u8"
        else
            echo -e "${YELLOW}✗${NC} $channel - FAILED"
        fi
    else
        echo -e "${YELLOW}✗${NC} $channel - NO PID"
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}All 5 channels started!${NC}"
echo ""
echo "Total running: $(pgrep -c ffmpeg 2>/dev/null || echo 0)"
echo ""
echo "To check status: ps aux | grep ffmpeg"
echo "To view logs: tail -f ~/sports-stream/logs/*.log"
echo ""
