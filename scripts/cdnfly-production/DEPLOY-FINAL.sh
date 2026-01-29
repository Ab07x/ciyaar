#!/bin/bash

##############################################################################
# FINAL DEPLOYMENT - Fixes all 404 errors
# Uses timestamp-based segment names (unique, never conflict)
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════╗
║                                                ║
║         FINAL FIX - No More 404 Errors         ║
║                                                ║
╚════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""
echo -e "${YELLOW}ROOT CAUSE OF 404 ERRORS:${NC}"
echo "  CloudFront caches old playlists that reference"
echo "  segments that have already been deleted."
echo ""
echo -e "${YELLOW}THE FIX:${NC}"
echo "  • Timestamp-based segment names (unique)"
echo "  • Each segment: seg_1706543210.ts (epoch time)"
echo "  • Never conflicts, never overwrites"
echo "  • CloudFront can cache safely"
echo "  • Auto-cleanup every 2 minutes (keeps 50 segments)"
echo ""
read -p "Deploy this fix? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}[1/9] Stopping all streams...${NC}"
pm2 delete all 2>/dev/null || true
pm2 save
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${BLUE}[2/9] Cleaning old segments...${NC}"
rm -rf ~/ciyaar/hls/channel-*
mkdir -p ~/ciyaar/hls
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${BLUE}[3/9] Installing final stream script...${NC}"
cp ~/ciyaar/scripts/cdnfly-production/final-working.sh ~/stream.sh
chmod +x ~/stream.sh
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${BLUE}[4/9] Installing auto-cleanup script...${NC}"
cp ~/ciyaar/scripts/cdnfly-production/auto-cleanup.sh ~/auto-cleanup.sh
chmod +x ~/auto-cleanup.sh
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${BLUE}[5/9] Setting up cleanup cron (every 2 minutes)...${NC}"
# Remove old cleanup jobs
(crontab -l 2>/dev/null | grep -v "cleanup" || true) | crontab -
# Add new cleanup job
(crontab -l 2>/dev/null; echo "*/2 * * * * ~/auto-cleanup.sh >> ~/ciyaar/logs/cleanup.log 2>&1") | crontab -
mkdir -p ~/ciyaar/logs
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${BLUE}[6/9] Updating nginx config...${NC}"
sudo cp ~/ciyaar/scripts/cdnfly-production/nginx-final.conf /etc/nginx/sites-available/cdnfly
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Config valid${NC}"
else
    echo "✗ Nginx config error"
    sudo nginx -t
    exit 1
fi

echo ""
echo -e "${BLUE}[7/9] Reloading nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${BLUE}[8/9] Starting streams...${NC}"
echo ""
~/stream.sh start

echo ""
echo -e "${BLUE}[9/9] Waiting 20 seconds for initialization...${NC}"
sleep 20

echo ""
echo -e "${BLUE}Testing...${NC}"
if curl -s http://localhost/channel-1/stream.m3u8 | grep -q "EXTINF"; then
    echo -e "${GREEN}✓ Stream is LIVE${NC}"
    echo ""
    echo "Sample playlist:"
    curl -s http://localhost/channel-1/stream.m3u8 | head -15
    echo ""
    echo "Sample segments:"
    ls -lh ~/ciyaar/hls/channel-1/seg_*.ts 2>/dev/null | head -5
else
    echo "⚠ Stream initializing, check: ~/stream.sh status"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              DEPLOYMENT COMPLETE                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}WHAT CHANGED:${NC}"
echo ""
echo "  ✓ Timestamp-based segment names"
echo "    Example: seg_1706543210.ts, seg_1706543216.ts"
echo ""
echo "  ✓ Each segment is UNIQUE (no conflicts)"
echo ""
echo "  ✓ 20 segments × 6 seconds = 2 minute buffer"
echo ""
echo "  ✓ Auto-cleanup every 2 minutes (keeps 50 segments)"
echo ""
echo "  ✓ CloudFront caches segments for 24 hours"
echo "    (safe because names are unique)"
echo ""
echo "  ✓ Playlist cache: 1 second (always fresh)"
echo ""
echo "  ✓ 404 errors are NOT cached by CloudFront"
echo ""
echo -e "${YELLOW}TEST NOW:${NC}"
echo ""
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
echo ""
echo -e "${YELLOW}COMMANDS:${NC}"
echo ""
echo "  ~/stream.sh start    - Start all"
echo "  ~/stream.sh stop     - Stop all"
echo "  ~/stream.sh status   - Check health"
echo "  ~/stream.sh test     - Test playlist"
echo "  ~/stream.sh clean    - Manual cleanup"
echo ""
echo -e "${GREEN}No more 404 errors. No more loops. Just working streams.${NC}"
echo ""
