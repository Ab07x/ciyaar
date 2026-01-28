#!/bin/bash
# ==============================================================================
# FANBROJ IPTV RESTREAM SERVER - AWS Lightsail Setup
# ==============================================================================
# This script sets up a fresh Ubuntu 24.04 LTS server for IPTV restreaming.
# 
# Usage: 
#   curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/lightsail-setup.sh | bash
#   Or: ./lightsail-setup.sh
#
# Requirements:
#   - AWS Lightsail Ubuntu 24.04 LTS ($24/month plan recommended)
#   - At least 4GB RAM, 2 vCPUs, 80GB SSD
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_header() { echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "ℹ️  $1"; }

# Banner
clear
echo -e "${CYAN}"
cat << 'BANNER'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗ █████╗ ███╗   ██╗██████╗ ██████╗  ██████╗      ║
║   ██╔════╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗██╔═══██╗     ║
║   █████╗  ███████║██╔██╗ ██║██████╔╝██████╔╝██║   ██║     ║
║   ██╔══╝  ██╔══██║██║╚██╗██║██╔══██╗██╔══██╗██║   ██║     ║
║   ██║     ██║  ██║██║ ╚████║██████╔╝██║  ██║╚██████╔╝     ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝      ║
║                                                               ║
║           IPTV RESTREAM SERVER SETUP v2.0                    ║
║           AWS Lightsail - Ubuntu 24.04 LTS                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please run as a regular user, not root!"
    exit 1
fi

# ==============================================================================
# STEP 1: System Update
# ==============================================================================
log_header "STEP 1: System Update"

sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# Set timezone
sudo timedatectl set-timezone Africa/Mogadishu

log_success "System updated and timezone set to Africa/Mogadishu"

# ==============================================================================
# STEP 2: Install Core Dependencies
# ==============================================================================
log_header "STEP 2: Installing Core Dependencies"

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
    jq \
    net-tools \
    screen \
    tmux

log_success "Core dependencies installed!"

# Verify FFmpeg
FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
log_info "FFmpeg version: $FFMPEG_VERSION"

# ==============================================================================
# STEP 3: Install Node.js 20 LTS
# ==============================================================================
log_header "STEP 3: Installing Node.js 20 LTS"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_info "Node.js already installed: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js $(node -v) installed!"
fi

# ==============================================================================
# STEP 4: Install PM2 Process Manager
# ==============================================================================
log_header "STEP 4: Installing PM2 Process Manager"

if command -v pm2 &> /dev/null; then
    log_info "PM2 already installed: $(pm2 -v)"
else
    sudo npm install -g pm2
    log_success "PM2 $(pm2 -v) installed!"
fi

# Setup PM2 startup
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true
log_success "PM2 startup configured!"

# ==============================================================================
# STEP 5: Create Directory Structure
# ==============================================================================
log_header "STEP 5: Creating Directory Structure"

# Create directories
sudo mkdir -p /var/www/html/hls
sudo mkdir -p /var/log/streams
mkdir -p ~/ciyaar/logs
mkdir -p ~/ciyaar/config

# Set permissions
sudo chown -R $USER:$USER /var/www/html
sudo chown -R $USER:$USER /var/log/streams
sudo chmod -R 755 /var/www/html

log_success "Directories created!"
log_info "HLS Output: /var/www/html/hls"
log_info "Logs: /var/log/streams"

# ==============================================================================
# STEP 6: Clone/Update Repository
# ==============================================================================
log_header "STEP 6: Setting Up Scripts"

if [ -d "$HOME/ciyaar" ]; then
    log_info "Repository exists, pulling latest..."
    cd ~/ciyaar && git pull origin main 2>/dev/null || git pull 2>/dev/null || true
else
    log_info "Cloning repository..."
    git clone https://github.com/Ab07x/ciyaar.git ~/ciyaar
fi

# Make scripts executable
chmod +x ~/ciyaar/scripts/*.sh 2>/dev/null || true

log_success "Scripts ready!"

# ==============================================================================
# STEP 7: Configure Nginx
# ==============================================================================
log_header "STEP 7: Configuring Nginx"

# Remove default config
sudo rm -f /etc/nginx/sites-enabled/default

# Create optimized streaming configuration
sudo tee /etc/nginx/sites-available/streaming > /dev/null << 'NGINX_CONFIG'
# ==============================================================================
# FANBROJ STREAMING SERVER - Nginx Configuration
# Optimized for HLS Live Streaming with CloudFront CDN
# ==============================================================================

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=hls_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Upstream keepalive for better performance
upstream hls_backend {
    server 127.0.0.1:80;
    keepalive 32;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/html;
    index index.html;

    # Gzip compression for playlists
    gzip on;
    gzip_types application/vnd.apple.mpegurl application/x-mpegURL;
    gzip_min_length 256;

    # ============================================================
    # HLS STREAMING LOCATION
    # ============================================================
    location /hls {
        alias /var/www/html/hls;
        
        # Rate limiting
        limit_req zone=hls_limit burst=50 nodelay;
        limit_conn conn_limit 20;

        # CORS Headers (Required for video players)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Range,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # MIME Types for HLS
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }

        # .m3u8 playlists - Cache for 1 second (changes constantly)
        location ~ \.m3u8$ {
            add_header 'Cache-Control' 'public, max-age=1, must-revalidate' always;
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'X-Content-Type-Options' 'nosniff' always;
        }

        # .ts segments - Cache for 1 hour (immutable once created)
        location ~ \.ts$ {
            add_header 'Cache-Control' 'public, max-age=3600, immutable' always;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
    }

    # ============================================================
    # HEALTH CHECK ENDPOINT
    # ============================================================
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # ============================================================
    # STATUS PAGE (JSON list of active streams)
    # ============================================================
    location /status {
        alias /var/www/html/hls;
        autoindex on;
        autoindex_format json;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }

    # ============================================================
    # API ENDPOINT (For channel info)
    # ============================================================
    location /api/channels {
        alias /var/www/html/hls;
        autoindex on;
        autoindex_format json;
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Content-Type' 'application/json' always;
    }

    # Logging
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

log_success "Nginx configured and running!"

# ==============================================================================
# STEP 8: Configure Firewall
# ==============================================================================
log_header "STEP 8: Configuring Firewall"

sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable 2>/dev/null || true

log_success "Firewall configured!"

# ==============================================================================
# STEP 9: Enable Monitoring
# ==============================================================================
log_header "STEP 9: Setting Up Monitoring"

sudo systemctl start vnstat 2>/dev/null || true
sudo systemctl enable vnstat 2>/dev/null || true

log_success "Bandwidth monitoring enabled!"

# ==============================================================================
# STEP 10: Create Default Configuration
# ==============================================================================
log_header "STEP 10: Creating Default Configuration"

# Create config file with IPTV credentials
cat > ~/ciyaar/config/iptv.conf << 'CONFIG'
# ==============================================================================
# FANBROJ IPTV CONFIGURATION
# ==============================================================================
# Edit these values with your IPTV provider credentials

# IPTV Provider Settings
IPTV_USERNAME="jUpu92sC"
IPTV_PASSWORD="gEjWzKe"
IPTV_HOST="iptvtour.store"

# Server Settings
HLS_OUTPUT_DIR="/var/www/html/hls"
LOG_DIR="/var/log/streams"

# FFmpeg Settings
HLS_TIME=4
HLS_LIST_SIZE=6
USER_AGENT="VLC/3.0.18 LibVLC/3.0.18"

# CloudFront (Optional - fill in after setup)
CLOUDFRONT_DOMAIN=""
CONFIG

chmod 600 ~/ciyaar/config/iptv.conf

log_success "Configuration file created at ~/ciyaar/config/iptv.conf"

# ==============================================================================
# VERIFICATION
# ==============================================================================
log_header "VERIFICATION"

echo ""
echo "Installed Versions:"
echo "───────────────────"
echo "  FFmpeg: $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
echo "  Nginx:  $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "  Node:   $(node -v)"
echo "  PM2:    $(pm2 -v)"

echo ""
echo "Service Status:"
echo "───────────────"
systemctl is-active nginx >/dev/null && log_success "Nginx is running" || log_error "Nginx is NOT running"

echo ""
echo "Directories:"
echo "────────────"
[ -d /var/www/html/hls ] && log_success "/var/www/html/hls exists" || log_error "/var/www/html/hls missing"
[ -d /var/log/streams ] && log_success "/var/log/streams exists" || log_error "/var/log/streams missing"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_IP")

# ==============================================================================
# COMPLETE
# ==============================================================================
log_header "🎉 SETUP COMPLETE!"

echo ""
echo -e "${GREEN}Your IPTV restream server is ready!${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 QUICK START COMMANDS:"
echo ""
echo "  1. Find channels:"
echo "     ~/ciyaar/scripts/find-channel.sh \"CHANNEL_NAME\""
echo ""
echo "  2. Start a channel:"
echo "     ~/ciyaar/scripts/channel-manager.sh start SLUG CHANNEL_ID"
echo ""
echo "  3. List running channels:"
echo "     ~/ciyaar/scripts/channel-manager.sh list"
echo ""
echo "  4. View stream:"
echo "     http://$SERVER_IP/hls/SLUG/index.m3u8"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📖 Full Guide: ~/ciyaar/AWS_LIGHTSAIL_RESTREAM_MASTER_GUIDE.md"
echo "⚙️  Config File: ~/ciyaar/config/iptv.conf"
echo ""
echo "═══════════════════════════════════════════════════════════════"
