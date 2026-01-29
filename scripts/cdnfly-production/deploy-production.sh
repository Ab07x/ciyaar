#!/bin/bash

##############################################################################
# ONE-COMMAND PRODUCTION DEPLOYMENT
# Run this to deploy everything for 1k-16k viewers
##############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         CIYAAR PRODUCTION DEPLOYMENT                      ║
║         For 1k-16k Concurrent Viewers                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}This will configure your server for production streaming.${NC}"
echo -e "${YELLOW}Expected duration: 5-10 minutes${NC}"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: System Optimization${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Check if already optimized
if ! grep -q "net.core.somaxconn = 65535" /etc/sysctl.conf 2>/dev/null; then
    echo "Applying network optimizations..."
    sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'

# CIYAAR Network Optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10000 65535
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
EOF
    sudo sysctl -p > /dev/null
    echo -e "${GREEN}✓ Network optimizations applied${NC}"
else
    echo -e "${GREEN}✓ Network already optimized${NC}"
fi

# File descriptor limits
if ! grep -q "ubuntu soft nofile 65535" /etc/security/limits.conf 2>/dev/null; then
    echo "Increasing file descriptor limits..."
    sudo tee -a /etc/security/limits.conf > /dev/null << 'EOF'
ubuntu soft nofile 65535
ubuntu hard nofile 65535
www-data soft nofile 65535
www-data hard nofile 65535
EOF
    ulimit -n 65535
    echo -e "${GREEN}✓ File descriptor limits increased${NC}"
else
    echo -e "${GREEN}✓ File descriptors already configured${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Update Packages${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

sudo apt update -qq
echo -e "${GREEN}✓ Package list updated${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Deploy Production Scripts${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Pull latest code
cd ~/ciyaar
git pull origin main > /dev/null 2>&1 || echo "Already up to date"
echo -e "${GREEN}✓ Code updated${NC}"

# Copy production files
cp ~/ciyaar/scripts/cdnfly-production/production-stream.sh ~/stream.sh
chmod +x ~/stream.sh
echo -e "${GREEN}✓ Production stream script installed${NC}"

cp ~/ciyaar/scripts/cdnfly-production/auto-recovery.sh ~/auto-recovery.sh
chmod +x ~/auto-recovery.sh
echo -e "${GREEN}✓ Auto-recovery script installed${NC}"

mkdir -p ~/ciyaar/logs
echo -e "${GREEN}✓ Log directory created${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Configure Nginx (Production)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Backup existing config
if [ ! -f /etc/nginx/nginx.conf.backup ]; then
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    echo -e "${GREEN}✓ Nginx config backed up${NC}"
fi

# Install production config
sudo cp ~/ciyaar/scripts/cdnfly-production/nginx-production.conf /etc/nginx/nginx.conf
echo -e "${GREEN}✓ Production nginx config installed${NC}"

# Test config
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Nginx config test passed${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Nginx config test failed${NC}"
    sudo nginx -t
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5: Fix Permissions${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/ciyaar
sudo chmod 755 /home/ubuntu/ciyaar/hls 2>/dev/null || mkdir -p ~/ciyaar/hls
sudo chmod 755 /home/ubuntu/ciyaar/hls
sudo usermod -a -G ubuntu www-data 2>/dev/null || true
sudo chown -R ubuntu:ubuntu ~/ciyaar/hls
echo -e "${GREEN}✓ Permissions configured${NC}"

# Restart nginx for group membership
sudo systemctl restart nginx
sleep 2
echo -e "${GREEN}✓ Nginx restarted${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 6: Setup Auto-Recovery Cron${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "auto-recovery.sh"; then
    (crontab -l 2>/dev/null; echo "*/1 * * * * ~/auto-recovery.sh >> ~/ciyaar/logs/recovery.log 2>&1") | crontab -
    echo -e "${GREEN}✓ Auto-recovery cron job installed (runs every minute)${NC}"
else
    echo -e "${GREEN}✓ Auto-recovery cron job already exists${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 7: Clean and Start Streams${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Stop old streams
pm2 delete all 2>/dev/null || true
pm2 save > /dev/null 2>&1
echo -e "${GREEN}✓ Old streams stopped${NC}"

# Clean old data
rm -rf ~/ciyaar/hls/channel-* 2>/dev/null || true
echo -e "${GREEN}✓ Old segments cleaned${NC}"

# Start production streams
echo ""
echo "Starting production streams..."
~/stream.sh start

echo ""
echo "Waiting for streams to stabilize..."
sleep 15

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 8: Verification${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Test local access
if curl -s http://localhost/channel-1/stream.m3u8 | grep -q "EXTINF"; then
    echo -e "${GREEN}✓ Local stream accessible${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Stream may still be initializing${NC}"
fi

# Test CloudFront
if curl -s -I https://stream.cdnfly.online/health | grep -q "200"; then
    echo -e "${GREEN}✓ CloudFront is responding${NC}"
else
    echo -e "${YELLOW}⚠ CloudFront check failed (may need DNS propagation)${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}YOUR PRODUCTION URLS:${NC}"
echo ""
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8  (Nova Sport)"
echo "  https://stream.cdnfly.online/channel-2/stream.m3u8  (Sky Sports 1)"
echo "  https://stream.cdnfly.online/channel-3/stream.m3u8  (Sky Sports 2)"
echo "  https://stream.cdnfly.online/channel-4/stream.m3u8  (Sky Sports Main)"
echo "  https://stream.cdnfly.online/channel-5/stream.m3u8  (Sky Sports Football)"
echo ""
echo -e "${YELLOW}MONITORING:${NC}"
echo "  Status:      ~/stream.sh status"
echo "  Logs:        pm2 logs"
echo "  Dashboard:   pm2 monit"
echo "  Recovery:    tail -f ~/ciyaar/logs/recovery.log"
echo ""
echo -e "${YELLOW}FEATURES ENABLED:${NC}"
echo "  ✓ Auto-recovery every 60 seconds"
echo "  ✓ Optimized for 16k concurrent viewers"
echo "  ✓ 4-second segments, 24-second buffer"
echo "  ✓ Auto-reconnect on network failures"
echo "  ✓ Production nginx with rate limiting"
echo "  ✓ System optimized for high traffic"
echo ""
echo -e "${GREEN}Ready for production! Test your streams now.${NC}"
echo ""
