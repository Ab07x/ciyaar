#!/bin/bash
# ==============================================================================
# FANBROJ STREAMING SERVER SETUP - Ubuntu 24.04 LTS
# ==============================================================================
# This script sets up a fresh Ubuntu 24 server as an IPTV restreaming server.
# Run this ONCE on a new AWS Lightsail instance.
#
# Usage: curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/setup-ubuntu24-streaming.sh | bash
# Or: ./setup-ubuntu24-streaming.sh
# ==============================================================================

set -e  # Exit on error

echo "=============================================="
echo "🚀 FANBROJ STREAMING SERVER SETUP"
echo "   Ubuntu 24.04 LTS Edition"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "ℹ️  $1"; }

# ==============================================================================
# STEP 1: System Update
# ==============================================================================
echo ""
echo "=============================================="
echo "📦 STEP 1: Updating System"
echo "=============================================="

sudo apt update
sudo apt upgrade -y
log_success "System updated!"

# ==============================================================================
# STEP 2: Install Core Dependencies
# ==============================================================================
echo ""
echo "=============================================="
echo "📦 STEP 2: Installing Core Dependencies"
echo "=============================================="

sudo apt install -y \
    ffmpeg \
    nginx \
    git \
    curl \
    wget \
    unzip \
    htop \
    iftop \
    vnstat \
    certbot \
    python3-certbot-nginx \
    jq

log_success "Core dependencies installed!"

# ==============================================================================
# STEP 3: Install Node.js 20 LTS
# ==============================================================================
echo ""
echo "=============================================="
echo "📦 STEP 3: Installing Node.js 20 LTS"
echo "=============================================="

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_info "Node.js already installed: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js $(node -v) installed!"
fi

# ==============================================================================
# STEP 4: Install PM2
# ==============================================================================
echo ""
echo "=============================================="
echo "📦 STEP 4: Installing PM2 Process Manager"
echo "=============================================="

if command -v pm2 &> /dev/null; then
    log_info "PM2 already installed"
else
    sudo npm install -g pm2
    log_success "PM2 installed!"
fi

# Setup PM2 startup script
pm2 startup systemd -u $USER --hp $HOME > /dev/null 2>&1 || true
log_success "PM2 startup configured!"

# ==============================================================================
# STEP 5: Create Streaming Directories
# ==============================================================================
echo ""
echo "=============================================="
echo "📂 STEP 5: Creating Streaming Directories"
echo "=============================================="

# Create HLS output directory
sudo mkdir -p /var/www/html/hls
sudo mkdir -p /var/log/streams

# Set permissions
sudo chown -R $USER:$USER /var/www/html
sudo chown -R $USER:$USER /var/log/streams
sudo chmod -R 755 /var/www/html

log_success "Directories created!"

# ==============================================================================
# STEP 6: Clone/Update Fanbroj Repository
# ==============================================================================
echo ""
echo "=============================================="
echo "📥 STEP 6: Setting Up Scripts"
echo "=============================================="

if [ -d "$HOME/ciyaar" ]; then
    log_info "Repository exists, pulling latest..."
    cd ~/ciyaar && git pull
else
    log_info "Cloning repository..."
    git clone https://github.com/Ab07x/ciyaar.git ~/ciyaar
fi

# Make scripts executable
chmod +x ~/ciyaar/scripts/*.sh

log_success "Scripts ready!"

# ==============================================================================
# STEP 7: Configure Nginx
# ==============================================================================
echo ""
echo "=============================================="
echo "⚙️  STEP 7: Configuring Nginx"
echo "=============================================="

# Remove default config
sudo rm -f /etc/nginx/sites-enabled/default

# Create streaming configuration
sudo tee /etc/nginx/sites-available/streaming > /dev/null << 'NGINX_CONFIG'
# ==============================================================================
# FANBROJ STREAMING SERVER - Nginx Configuration
# ==============================================================================

limit_req_zone $binary_remote_addr zone=hls_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 80;
    server_name _;

    root /var/www/html;

    # HLS Streaming
    location /hls {
        alias /var/www/html/hls;
        
        limit_req zone=hls_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        # CORS Headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Range,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }

        # m3u8 playlists - minimal cache
        location ~ \.m3u8$ {
            add_header 'Cache-Control' 'public, max-age=1, must-revalidate' always;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }

        # ts segments - cache for 1 hour
        location ~ \.ts$ {
            add_header 'Cache-Control' 'public, max-age=3600' always;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # Status page
    location /status {
        alias /var/www/html/hls;
        autoindex on;
        autoindex_format json;
    }

    access_log /var/log/nginx/streaming_access.log;
    error_log /var/log/nginx/streaming_error.log;
}
NGINX_CONFIG

# Enable configuration
sudo ln -sf /etc/nginx/sites-available/streaming /etc/nginx/sites-enabled/

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

log_success "Nginx configured!"

# ==============================================================================
# STEP 8: Configure Firewall
# ==============================================================================
echo ""
echo "=============================================="
echo "🔒 STEP 8: Configuring Firewall"
echo "=============================================="

sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
echo "y" | sudo ufw enable > /dev/null 2>&1 || true

log_success "Firewall configured!"

# ==============================================================================
# STEP 9: Enable Bandwidth Monitoring
# ==============================================================================
echo ""
echo "=============================================="
echo "📊 STEP 9: Setting Up Monitoring"
echo "=============================================="

sudo systemctl start vnstat
sudo systemctl enable vnstat

log_success "Monitoring enabled!"

# ==============================================================================
# VERIFICATION
# ==============================================================================
echo ""
echo "=============================================="
echo "🔍 VERIFICATION"
echo "=============================================="

echo ""
echo "Installed Versions:"
echo "-------------------"
echo "FFmpeg: $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
echo "Nginx:  $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "Node:   $(node -v)"
echo "PM2:    $(pm2 -v)"

echo ""
echo "Service Status:"
echo "---------------"
systemctl is-active nginx >/dev/null && log_success "Nginx is running" || log_error "Nginx is NOT running"

echo ""
echo "Directories:"
echo "------------"
[ -d /var/www/html/hls ] && log_success "/var/www/html/hls exists" || log_error "/var/www/html/hls missing"
[ -d /var/log/streams ] && log_success "/var/log/streams exists" || log_error "/var/log/streams missing"

# ==============================================================================
# COMPLETE
# ==============================================================================
echo ""
echo "=============================================="
echo "🎉 SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "Your server is now ready for IPTV restreaming."
echo ""
echo "📋 NEXT STEPS:"
echo "  1. Find channel IDs:"
echo "     ~/ciyaar/scripts/find-channel.sh \"CHANNEL\" USER PASS HOST"
echo ""
echo "  2. Start a channel:"
echo "     pm2 start ~/ciyaar/scripts/start-247-channel.sh --name 'ch-NAME' --interpreter bash -- NAME USER PASS ID HOST"
echo ""
echo "  3. Save PM2 config:"
echo "     pm2 save"
echo ""
echo "  4. Test stream:"
echo "     curl http://localhost/hls/NAME/index.m3u8"
echo ""
echo "📖 Full Guide: ~/ciyaar/AWS_LIGHTSAIL_RESTREAM_MASTER_GUIDE.md"
echo ""
echo "=============================================="
