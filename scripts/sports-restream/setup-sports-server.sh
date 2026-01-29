#!/bin/bash
# ==============================================================================
# SPORTS STREAMING SERVER SETUP
# ==============================================================================
# Complete setup script for AWS Lightsail sports streaming server
# Optimized for 2-hour sports events with 100% uptime goal
#
# This script sets up:
# - NGINX with RTMP module for streaming
# - FFmpeg for stream relay
# - Sports event management system
# - Stream protection and hiding
# - Health monitoring
# - CloudFront CDN integration
#
# Usage:
#   curl -sSL https://your-domain.com/setup-sports-server.sh | bash
#   Or: ./setup-sports-server.sh
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
║   ⚽ 🏀 🏈  SPORTS STREAMING SERVER SETUP  🏈 🏀 ⚽          ║
║                                                               ║
║        AWS Lightsail - Optimized for Live Sports              ║
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
# STEP 1: System Update & Dependencies
# ==============================================================================
log_header "STEP 1: System Update & Dependencies"

sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# Set timezone
sudo timedatectl set-timezone Africa/Mogadishu
log_success "Timezone set to Africa/Mogadishu"

# Install core dependencies
log_info "Installing core dependencies..."
sudo apt install -y \
    build-essential \
    libpcre3 libpcre3-dev \
    libssl-dev \
    zlib1g-dev \
    libxml2-dev \
    libxslt1-dev \
    libgd-dev \
    libgeoip-dev \
    libperl-dev \
    ffmpeg \
    git \
    curl \
    wget \
    unzip \
    htop \
    iftop \
    vnstat \
    jq \
    net-tools \
    screen \
    tmux \
    at \
    openssl

log_success "Core dependencies installed"

# ==============================================================================
# STEP 2: Install NGINX with RTMP Module
# ==============================================================================
log_header "STEP 2: Installing NGINX with RTMP Module"

NGINX_VERSION="1.24.0"
RTMP_VERSION="1.2.2"
INSTALL_DIR="$HOME/nginx-build"

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download sources
log_info "Downloading NGINX and RTMP module..."
wget -q "http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz"
wget -q "https://github.com/arut/nginx-rtmp-module/archive/v${RTMP_VERSION}.tar.gz"

tar -xzf "nginx-${NGINX_VERSION}.tar.gz"
tar -xzf "v${RTMP_VERSION}.tar.gz"

cd "nginx-${NGINX_VERSION}"

# Configure and build
log_info "Building NGINX with RTMP module..."
./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_realip_module \
    --with-http_addition_module \
    --with-http_sub_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_mp4_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_random_index_module \
    --with-http_secure_link_module \
    --with-http_stub_status_module \
    --with-http_auth_request_module \
    --with-threads \
    --with-stream \
    --with-stream_ssl_module \
    --with-file-aio \
    --add-module="$INSTALL_DIR/nginx-rtmp-module-${RTMP_VERSION}" \
    --with-cc-opt="-Wno-error" 2>&1 | tail -5

make -j$(nproc) 2>&1 | tail -5
sudo make install 2>&1 | tail -5

# Create nginx user and directories
sudo useradd -r -d /var/cache/nginx -s /sbin/nologin nginx 2>/dev/null || true
sudo mkdir -p /var/cache/nginx/{client_temp,proxy_temp,fastcgi_temp,uwsgi_temp,scgi_temp}
sudo mkdir -p /var/www/html/sports
sudo mkdir -p /var/recordings/sports
sudo chown -R www-data:www-data /var/www/html
sudo chown -R www-data:www-data /var/recordings

# Create systemd service
sudo tee /etc/systemd/system/nginx.service > /dev/null << 'EOF'
[Unit]
Description=A high performance web server and a reverse proxy server
After=network.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'
ExecReload=/usr/sbin/nginx -g 'daemon on; master_process on;' -s reload
ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /var/run/nginx.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nginx

log_success "NGINX with RTMP installed"

# ==============================================================================
# STEP 3: Setup Sports Streaming System
# ==============================================================================
log_header "STEP 3: Setting Up Sports Streaming System"

# Create directory structure
SPORTS_DIR="$HOME/ciyaar"
mkdir -p "$SPORTS_DIR"/{config,logs,pids,scripts/sports-restream}

# Copy scripts
SCRIPT_SOURCE="${SCRIPT_SOURCE:-https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/sports-restream}"

log_info "Downloading sports streaming scripts..."

cd "$SPORTS_DIR/scripts"

# Download scripts
for script in sports-event-manager.sh stream-protector.sh monitor-health.sh; do
    wget -q "${SCRIPT_SOURCE}/${script}" -O "$script" 2>/dev/null || {
        log_warn "Could not download $script, will use local copy if available"
    }
    chmod +x "$script"
done

# Create symlinks for easy access
ln -sf "$SPORTS_DIR/scripts/sports-restream/sports-event-manager.sh" "$HOME/sports-manager"
ln -sf "$SPORTS_DIR/scripts/sports-restream/stream-protector.sh" "$HOME/stream-protect"
ln -sf "$SPORTS_DIR/scripts/monitor-health.sh" "$HOME/stream-monitor"

log_success "Scripts installed"

# ==============================================================================
# STEP 4: Configure NGINX
# ==============================================================================
log_header "STEP 4: Configuring NGINX"

# Backup existing config
sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true

# Download nginx config
log_info "Downloading NGINX configuration..."
wget -q "${SCRIPT_SOURCE}/nginx-sports.conf" -O /tmp/nginx-sports.conf 2>/dev/null || {
    log_warn "Could not download nginx config, creating default..."
    # Create minimal config if download fails
    sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user www-data;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
}

rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application sports {
            live on;
            hls on;
            hls_path /var/www/html/sports;
            hls_fragment 4s;
            hls_playlist_length 2h;
        }
    }
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    
    server {
        listen 80;
        root /var/www/html;
        
        location /sports/ {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Cache-Control "no-cache" always;
            alias /var/www/html/sports/;
        }
        
        location /health {
            access_log off;
            return 200 "healthy\n";
        }
    }
}
EOF
}

# Use downloaded config if available
if [ -f /tmp/nginx-sports.conf ]; then
    sudo cp /tmp/nginx-sports.conf /etc/nginx/nginx.conf
fi

# Test nginx config
if sudo nginx -t; then
    log_success "NGINX configuration valid"
else
    log_error "NGINX configuration invalid, restoring backup"
    sudo mv /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf 2>/dev/null || true
    exit 1
fi

# ==============================================================================
# STEP 5: Initialize Stream Protection
# ==============================================================================
log_header "STEP 5: Initializing Stream Protection"

"$SPORTS_DIR/scripts/stream-protector.sh" init

# Create sample config
cat > "$SPORTS_DIR/config/sports.conf" << EOF
# Sports Streaming Configuration
# Add your CloudFront domain here:
# CLOUDFRONT_DOMAIN=your-domain.cloudfront.net
# DOMAIN=your-domain.online

# Notification webhooks (optional)
# DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
# SLACK_WEBHOOK=https://hooks.slack.com/services/...
EOF

log_success "Stream protection initialized"

# ==============================================================================
# STEP 6: Setup Directories and Permissions
# ==============================================================================
log_header "STEP 6: Setting Up Directories"

sudo mkdir -p /var/www/html/sports
sudo mkdir -p /var/recordings/sports
sudo chown -R www-data:www-data /var/www/html
sudo chown -R www-data:www-data /var/recordings
sudo chmod 755 /var/www/html
sudo chmod 755 /var/recordings

# Set proper permissions for config
chmod 700 "$SPORTS_DIR/config"

log_success "Directories configured"

# ==============================================================================
# STEP 7: Start Services
# ==============================================================================
log_header "STEP 7: Starting Services"

sudo systemctl start nginx

if systemctl is-active nginx > /dev/null 2>&1; then
    log_success "NGINX started successfully"
else
    log_error "Failed to start NGINX"
    sudo journalctl -u nginx --no-pager -n 20
    exit 1
fi

# ==============================================================================
# STEP 8: Create Management Aliases
# ==============================================================================
log_header "STEP 8: Creating Management Commands"

# Add aliases to .bashrc if not already present
if ! grep -q "sports-stream" "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" << 'EOF'

# Sports Streaming Aliases
alias sm='~/sports-stream/scripts/sports-event-manager.sh'
alias sp='~/sports-stream/scripts/stream-protector.sh'
alias mon='~/sports-stream/scripts/monitor-health.sh'
alias sports-logs='tail -f ~/sports-stream/logs/*.log'
EOF
    log_success "Aliases added to .bashrc"
fi

# ==============================================================================
# STEP 9: Cleanup
# ==============================================================================
log_header "STEP 9: Cleanup"

# Clean up build files
cd "$HOME"
rm -rf "$INSTALL_DIR"
sudo apt autoremove -y

log_success "Cleanup completed"

# ==============================================================================
# SETUP COMPLETE
# ==============================================================================
log_header "SETUP COMPLETE!"

echo -e "\n${GREEN}Your sports streaming server is ready!${NC}\n"

echo -e "${CYAN}Quick Start Commands:${NC}"
echo "  Start an event:     ~/sports-stream/scripts/sports-event-manager.sh start <name> <source_url>"
echo "  Stop an event:      ~/sports-stream/scripts/sports-event-manager.sh stop <name>"
echo "  View status:        ~/sports-stream/scripts/sports-event-manager.sh status"
echo "  Start monitor:      ~/sports-stream/scripts/monitor-health.sh start"
echo ""

echo -e "${CYAN}Management Aliases (after 'source ~/.bashrc'):${NC}"
echo "  sm start <name> <url>     - Start streaming event"
echo "  sm stop <name>            - Stop event"
echo "  sm status                 - View all events"
echo "  mon start                 - Start health monitor"
echo "  mon status                - View system status"
echo ""

echo -e "${CYAN}Important Directories:${NC}"
echo "  Config:    $SPORTS_DIR/config"
echo "  Logs:      $SPORTS_DIR/logs"
echo "  Streams:   /var/www/html/sports"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your CloudFront domain in: $SPORTS_DIR/config/sports.conf"
echo "2. Add your IPTV sources: ~/sports-stream/scripts/stream-protector.sh add <name> <url>"
echo "3. Start the health monitor: ~/sports-stream/scripts/monitor-health.sh start"
echo "4. Test streaming with: ~/sports-stream/scripts/sports-event-manager.sh start test-event <your-source-url>"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")
echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}Health Check: http://$SERVER_IP/health${NC}"
echo ""
