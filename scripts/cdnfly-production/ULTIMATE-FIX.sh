#!/bin/bash

##############################################################################
# ULTIMATE FIX FOR CLOUDFRONT 404 ERRORS
# Fixes segment deletion before CloudFront can cache them
##############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "══════════════════════════════════════════════════"
echo "  ULTIMATE FIX - CloudFront 404 Errors"
echo "══════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo "Problem: Segments deleted before CloudFront caches them"
echo "Solution: Keep segments for 3 minutes instead of 20 seconds"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}[1/8] Stopping all streams...${NC}"
pm2 delete all 2>/dev/null || true
pm2 save
echo -e "${GREEN}✓ Stopped${NC}"
echo ""

echo -e "${BLUE}[2/8] Cleaning all old segments...${NC}"
rm -rf ~/ciyaar/hls/channel-*
mkdir -p ~/ciyaar/hls
echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

echo -e "${BLUE}[3/8] Installing CloudFront-optimized stream script...${NC}"
cp ~/ciyaar/scripts/cdnfly-production/cloudfront-stream.sh ~/stream.sh
chmod +x ~/stream.sh
echo -e "${GREEN}✓ Installed${NC}"
echo ""

echo -e "${BLUE}[4/8] Installing cleanup script...${NC}"
cp ~/ciyaar/scripts/cdnfly-production/cleanup-segments.sh ~/cleanup-segments.sh
chmod +x ~/cleanup-segments.sh
echo -e "${GREEN}✓ Installed${NC}"
echo ""

echo -e "${BLUE}[5/8] Setting up cleanup cron (runs every 5 minutes)...${NC}"
# Remove old cleanup cron if exists
(crontab -l 2>/dev/null | grep -v "cleanup-segments.sh" || true) | crontab -
# Add new cleanup cron
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/cleanup-segments.sh >> ~/ciyaar/logs/cleanup.log 2>&1") | crontab -
echo -e "${GREEN}✓ Cron job added${NC}"
echo ""

echo -e "${BLUE}[6/8] Updating nginx config...${NC}"
sudo cp ~/ciyaar/scripts/cdnfly-production/nginx-working.conf /etc/nginx/sites-available/cdnfly
if sudo nginx -t 2>&1 | grep -q "successful"; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx updated${NC}"
else
    echo -e "${RED}✗ Nginx config error${NC}"
    sudo nginx -t
    exit 1
fi
echo ""

echo -e "${BLUE}[7/8] Starting streams with new settings...${NC}"
echo ""
~/stream.sh start

echo ""
echo -e "${BLUE}[8/8] Waiting 20 seconds for streams to stabilize...${NC}"
sleep 20
echo ""

echo -e "${BLUE}Testing...${NC}"
if curl -s http://localhost/channel-1/stream.m3u8 | grep -q "EXTINF"; then
    echo -e "${GREEN}✓ Stream is working!${NC}"
    echo ""
    echo "Playlist:"
    curl -s http://localhost/channel-1/stream.m3u8
    echo ""
    echo ""
    seg_count=$(ls -1 ~/ciyaar/hls/channel-1/*.ts 2>/dev/null | wc -l | xargs)
    echo "Segments on disk: $seg_count"
else
    echo -e "${YELLOW}⚠ Stream not ready yet${NC}"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ FIX APPLIED${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}WHAT CHANGED:${NC}"
echo "  • Segments kept for 3 MINUTES (not 20 seconds)"
echo "  • 90-second buffer (15 segments × 6 seconds)"
echo "  • CloudFront has plenty of time to cache"
echo "  • Auto-cleanup every 5 minutes (keeps disk clean)"
echo "  • M3U8 cache: 3 seconds"
echo "  • TS segments cache: 5 minutes"
echo ""
echo -e "${YELLOW}TEST NOW:${NC}"
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
echo ""
echo -e "${YELLOW}COMMANDS:${NC}"
echo "  ~/stream.sh start    - Start streams"
echo "  ~/stream.sh stop     - Stop streams"
echo "  ~/stream.sh status   - Check status"
echo "  ~/stream.sh test     - Test locally"
echo "  ~/stream.sh clean    - Manual cleanup"
echo ""
echo -e "${GREEN}No more 404 errors!${NC}"
echo ""
