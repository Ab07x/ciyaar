#!/bin/bash

##############################################################################
# NGINX AUTO-SETUP FOR CDNFLY
# Run this on the server: ubuntu@ip-172-26-2-90
##############################################################################

set -e

echo "=================================="
echo "NGINX SETUP FOR CDNFly"
echo "=================================="
echo ""

# Check if nginx config exists
if [ ! -f ~/nginx-cdnfly.conf ]; then
    echo "ERROR: nginx-cdnfly.conf not found in home directory"
    echo "Upload it first: scp scripts/cdnfly-production/nginx-cdnfly-fixed.conf ubuntu@ip-172-26-2-90:~/nginx-cdnfly.conf"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt update
    sudo apt install nginx -y
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo "✓ Nginx installed"
else
    echo "✓ Nginx already installed"
fi

# Create HLS directory
echo "Creating HLS directory..."
mkdir -p ~/ciyaar/hls
echo "✓ Directory created: ~/ciyaar/hls"

# Install nginx config
echo "Installing nginx config..."
sudo cp ~/nginx-cdnfly.conf /etc/nginx/sites-available/cdnfly
sudo ln -sf /etc/nginx/sites-available/cdnfly /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
echo "✓ Config installed"

# Test nginx config
echo "Testing nginx config..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✓ Nginx config test passed"
else
    echo "✗ Nginx config test FAILED"
    sudo nginx -t
    exit 1
fi

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx
echo "✓ Nginx reloaded"

# Check if nginx is running
if sudo systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx is NOT running"
    sudo systemctl status nginx
    exit 1
fi

# Test status endpoint
echo ""
echo "Testing status endpoint..."
sleep 1
if curl -s http://localhost/status | grep -q "live"; then
    echo "✓ Status endpoint working"
else
    echo "✗ Status endpoint not responding"
fi

echo ""
echo "=================================="
echo "✓ NGINX SETUP COMPLETE!"
echo "=================================="
echo ""
echo "Origin server ready at: http://origin.cdnfly.online"
echo ""
echo "Next steps:"
echo "  1. ./stream.sh on      # Start streaming"
echo "  2. ./stream.sh status  # Check health"
echo ""
echo "Test URLs:"
echo "  http://origin.cdnfly.online/status"
echo "  http://origin.cdnfly.online/channel-1/stream.m3u8"
echo ""
