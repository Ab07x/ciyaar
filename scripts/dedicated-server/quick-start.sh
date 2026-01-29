#!/bin/bash

##############################################################################
# QUICK START SCRIPT
# One-command deployment for streaming server
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

clear

cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗     ║
║     ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║     ║
║     ███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║     ║
║     ╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║     ║
║     ███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║     ║
║     ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     ║
║                                                               ║
║           PROFESSIONAL STREAMING SERVER SETUP                 ║
║                     Quick Start v1.0                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}This script will:${NC}"
echo -e "  ${GREEN}✓${NC} Set up your streaming server"
echo -e "  ${GREEN}✓${NC} Configure 8 sports channels"
echo -e "  ${GREEN}✓${NC} Start HLS streaming"
echo -e "  ${GREEN}✓${NC} Enable auto-monitoring"
echo ""
echo -e "${YELLOW}Server Specs Required:${NC}"
echo -e "  • 16GB RAM minimum"
echo -e "  • 4 vCPUs minimum"
echo -e "  • 100GB+ free disk space"
echo ""

read -p "$(echo -e ${CYAN}Ready to start? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  STEP 1: SYSTEM SETUP${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if we're root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root${NC}"
    echo "Please run: sudo ./quick-start.sh"
    exit 1
fi

# Check system resources
echo -e "${CYAN}Checking system resources...${NC}"

TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
CPU_CORES=$(nproc)
FREE_DISK=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')

if [ $TOTAL_RAM -lt 14 ]; then
    echo -e "${RED}Warning: Only ${TOTAL_RAM}GB RAM detected. 16GB recommended.${NC}"
    read -p "Continue anyway? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [ $CPU_CORES -lt 4 ]; then
    echo -e "${YELLOW}Warning: Only $CPU_CORES CPU cores detected. Performance may be limited.${NC}"
fi

if [ $FREE_DISK -lt 100 ]; then
    echo -e "${RED}Warning: Only ${FREE_DISK}GB free disk space. 100GB+ recommended.${NC}"
fi

echo -e "${GREEN}✓ System check passed${NC}"
echo ""

# Run main setup
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  STEP 2: INSTALLING DEPENDENCIES${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ ! -f "./setup-streaming-server.sh" ]; then
    echo -e "${RED}Error: setup-streaming-server.sh not found in current directory${NC}"
    echo "Please ensure all scripts are in the same directory"
    exit 1
fi

chmod +x ./setup-streaming-server.sh
./setup-streaming-server.sh

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  STEP 3: CONFIGURING CHANNELS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo -e "${CYAN}Detected Server IP: ${GREEN}$SERVER_IP${NC}"
echo ""

# Move scripts to streaming directory
echo -e "${CYAN}Installing stream management scripts...${NC}"
cp *.sh /var/streaming/scripts/ 2>/dev/null || true
cp *.py /var/streaming/scripts/ 2>/dev/null || true
chmod +x /var/streaming/scripts/*.sh
chmod +x /var/streaming/scripts/*.py

echo -e "${GREEN}✓ Scripts installed${NC}"
echo ""

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  STEP 4: STARTING STREAMS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

read -p "$(echo -e ${CYAN}Start all streams now? [Y/n]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    cd /var/streaming/scripts
    ./start-all-streams.sh
else
    echo -e "${YELLOW}Streams not started. Run later with: /var/streaming/scripts/start-all-streams.sh${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  STEP 5: SETTING UP MONITORING${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Setting up health monitoring cron job...${NC}"

# Add cron job for health monitoring
(crontab -l 2>/dev/null | grep -v health-monitor; echo "*/1 * * * * /var/streaming/scripts/health-monitor.sh") | crontab -

echo -e "${GREEN}✓ Health monitoring enabled (runs every minute)${NC}"
echo ""

echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  SETUP COMPLETE! 🎉${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}${BOLD}Your Streaming Server is Ready!${NC}"
echo ""
echo -e "${YELLOW}Stream URLs:${NC}"
for i in {1..5}; do
    CHANNEL_NAME=$(jq -r ".channels[] | select(.id==$i) | .name" /var/streaming/config/channels.json)
    echo -e "  ${GREEN}$CHANNEL_NAME${NC}"
    echo -e "    http://$SERVER_IP/channel-$i/playlist.m3u8"
done
echo ""

echo -e "${YELLOW}Quick Commands:${NC}"
echo -e "  View streams:     ${CYAN}pm2 list${NC}"
echo -e "  Live monitoring:  ${CYAN}pm2 monit${NC}"
echo -e "  View logs:        ${CYAN}pm2 logs${NC}"
echo -e "  Manage streams:   ${CYAN}/var/streaming/scripts/stream-manager.sh help${NC}"
echo -e "  Performance dash: ${CYAN}python3 /var/streaming/scripts/performance-monitor.py${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Test a stream: ${CYAN}ffplay http://$SERVER_IP/channel-1/playlist.m3u8${NC}"
echo -e "  2. Set up CloudFront CDN (see DEPLOYMENT_GUIDE.md)"
echo -e "  3. Configure SSL/HTTPS (optional)"
echo -e "  4. Update your Next.js app with stream URLs"
echo ""

echo -e "${GREEN}Happy Streaming! 📺${NC}"
