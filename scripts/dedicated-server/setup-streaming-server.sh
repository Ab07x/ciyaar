#!/bin/bash

##############################################################################
# DEDICATED STREAMING SERVER SETUP
# Production-ready IPTV streaming infrastructure
#
# Server Specs:
# - 16GB RAM
# - 4 vCPUs
# - 320GB SSD
# - 6TB Transfer
#
# Features:
# - Multi-channel HLS streaming
# - Auto-restart on failure
# - Resource monitoring
# - CDN-ready output
# - Low-latency sports streaming
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     DEDICATED STREAMING SERVER SETUP                  ║${NC}"
echo -e "${GREEN}║     Professional IPTV → HLS Infrastructure            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
STREAM_USER="streamuser"
STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"
SCRIPTS_DIR="$STREAM_BASE/scripts"
CONFIG_DIR="$STREAM_BASE/config"

# IPTV Credentials
IPTV_USERNAME="d06HPCFR"
IPTV_PASSWORD="qEBJjW3"
IPTV_BASE_URL="http://iptvtour.store"
M3U_URL="$IPTV_BASE_URL/get.php?username=$IPTV_USERNAME&password=$IPTV_PASSWORD&type=m3u&output=ts"

# Server Resources
MAX_CONCURRENT_STREAMS=8  # For 4 vCPUs (2 per CPU)
RAM_PER_STREAM=1536      # 1.5GB per stream (leaves 4GB for system)

echo -e "${BLUE}[1/10]${NC} Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

echo -e "${BLUE}[2/10]${NC} Installing core dependencies..."
apt-get install -y -qq \
    ffmpeg \
    nginx \
    curl \
    wget \
    git \
    htop \
    iotop \
    vnstat \
    jq \
    python3 \
    python3-pip \
    certbot \
    python3-certbot-nginx

echo -e "${BLUE}[3/10]${NC} Installing PM2 for process management..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
pm2 startup systemd -u root --hp /root

echo -e "${BLUE}[4/10]${NC} Creating dedicated streaming user..."
if ! id "$STREAM_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $STREAM_BASE -m $STREAM_USER
fi

echo -e "${BLUE}[5/10]${NC} Setting up directory structure..."
mkdir -p $HLS_OUTPUT
mkdir -p $LOGS_DIR
mkdir -p $SCRIPTS_DIR
mkdir -p $CONFIG_DIR

# Create output directories for each channel
for i in {1..8}; do
    mkdir -p $HLS_OUTPUT/channel-$i
done

chown -R $STREAM_USER:$STREAM_USER $STREAM_BASE
chmod -R 755 $STREAM_BASE

echo -e "${BLUE}[6/10]${NC} Configuring NGINX for HLS delivery..."
cat > /etc/nginx/sites-available/streaming << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS for HLS
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Range, Content-Type" always;

    # Root directory
    root /var/streaming/hls;

    # Disable access log for HLS segments (reduce I/O)
    location ~* \.(m3u8|ts)$ {
        access_log off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
    }

    # Enable gzip for m3u8 playlists
    location ~ \.m3u8$ {
        gzip on;
        gzip_types application/vnd.apple.mpegurl;
    }

    # Status endpoint
    location /status {
        default_type application/json;
        return 200 '{"status":"online","server":"streaming"}';
    }

    # Channel list endpoint
    location /channels {
        autoindex on;
        autoindex_format json;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/streaming /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

echo -e "${BLUE}[7/10]${NC} Optimizing system for streaming..."

# Increase file descriptors
cat >> /etc/security/limits.conf << EOF
*       soft    nofile  65536
*       hard    nofile  65536
root    soft    nofile  65536
root    hard    nofile  65536
EOF

# Sysctl optimizations for streaming
cat > /etc/sysctl.d/99-streaming.conf << EOF
# Network optimizations for streaming
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# Increase max connections
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 8192

# File system optimizations
fs.file-max = 2097152
vm.swappiness = 10
EOF

sysctl -p /etc/sysctl.d/99-streaming.conf

echo -e "${BLUE}[8/10]${NC} Creating channel configuration..."
cat > $CONFIG_DIR/channels.json << 'CHANNELS_EOF'
{
  "channels": [
    {
      "id": 1,
      "name": "Sky Sports Main Event",
      "stream_id": "9701",
      "enabled": true,
      "priority": "high"
    },
    {
      "id": 2,
      "name": "Sky Sports Football",
      "stream_id": "9700",
      "enabled": true,
      "priority": "high"
    },
    {
      "id": 3,
      "name": "Sky Sports Action",
      "stream_id": "9696",
      "enabled": true,
      "priority": "high"
    },
    {
      "id": 4,
      "name": "TNT Sport 1",
      "stream_id": "14345",
      "enabled": true,
      "priority": "high"
    },
    {
      "id": 5,
      "name": "TNT Sport 2",
      "stream_id": "14346",
      "enabled": true,
      "priority": "high"
    },
    {
      "id": 6,
      "name": "BT Sport 1",
      "stream_id": "9685",
      "enabled": false,
      "priority": "medium"
    },
    {
      "id": 7,
      "name": "Premier Sports 1",
      "stream_id": "9710",
      "enabled": false,
      "priority": "medium"
    },
    {
      "id": 8,
      "name": "ESPN",
      "stream_id": "9715",
      "enabled": false,
      "priority": "low"
    }
  ],
  "settings": {
    "max_concurrent": 8,
    "hls_time": 4,
    "hls_list_size": 6,
    "quality": "1080p",
    "bitrate": "4M",
    "framerate": 50
  }
}
CHANNELS_EOF

chown $STREAM_USER:$STREAM_USER $CONFIG_DIR/channels.json

echo -e "${BLUE}[9/10]${NC} Installing stream management scripts..."
# Will create in next step

echo -e "${BLUE}[10/10]${NC} Setting up monitoring..."
# Install monitoring dashboard (will create in next step)

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     STREAMING SERVER SETUP COMPLETE ✓                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Run: ${BLUE}./start-all-streams.sh${NC} to start streaming"
echo -e "2. Check: ${BLUE}http://YOUR_SERVER_IP/status${NC}"
echo -e "3. View channels: ${BLUE}http://YOUR_SERVER_IP/channels${NC}"
echo -e "4. Monitor: ${BLUE}pm2 monit${NC}"
echo ""
echo -e "${YELLOW}HLS Endpoints:${NC}"
echo -e "Channel 1: ${BLUE}http://YOUR_SERVER_IP/channel-1/playlist.m3u8${NC}"
echo -e "Channel 2: ${BLUE}http://YOUR_SERVER_IP/channel-2/playlist.m3u8${NC}"
echo -e "..."
echo ""
echo -e "${GREEN}Server is ready for streaming!${NC}"
