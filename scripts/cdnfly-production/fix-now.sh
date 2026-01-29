#!/bin/bash

##############################################################################
# FIX IT NOW - Simple working setup
##############################################################################

set -e

echo "════════════════════════════════════════"
echo "FIXING STREAMING ISSUES"
echo "════════════════════════════════════════"
echo ""

# Stop everything
echo "1. Stopping old streams..."
pm2 delete all 2>/dev/null || true
pm2 save
echo "✓ Stopped"
echo ""

# Clean everything
echo "2. Cleaning old segments..."
rm -rf ~/ciyaar/hls/channel-*
mkdir -p ~/ciyaar/hls
echo "✓ Cleaned"
echo ""

# Copy working script
echo "3. Installing working stream script..."
cp ~/ciyaar/scripts/cdnfly-production/working-stream.sh ~/stream.sh
chmod +x ~/stream.sh
echo "✓ Script installed"
echo ""

# Update nginx
echo "4. Updating nginx..."
sudo cp ~/ciyaar/scripts/cdnfly-production/nginx-working.conf /etc/nginx/sites-available/cdnfly
sudo nginx -t
sudo systemctl reload nginx
echo "✓ Nginx updated"
echo ""

# Fix permissions
echo "5. Fixing permissions..."
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/ciyaar
sudo chmod 755 /home/ubuntu/ciyaar/hls
sudo usermod -a -G ubuntu www-data 2>/dev/null || true
sudo chown -R ubuntu:ubuntu ~/ciyaar/hls
sudo systemctl restart nginx
sleep 2
echo "✓ Permissions fixed"
echo ""

# Start streams
echo "6. Starting streams with WORKING settings..."
echo ""
~/stream.sh start

echo ""
echo "7. Waiting 15 seconds for streams to start..."
sleep 15
echo ""

# Test
echo "8. Testing..."
if curl -s http://localhost/channel-1/stream.m3u8 | grep -q "EXTINF"; then
    echo "✓ Stream is working!"
    echo ""
    echo "Playlist preview:"
    curl -s http://localhost/channel-1/stream.m3u8
else
    echo "✗ Stream not ready yet, check: ~/stream.sh status"
fi

echo ""
echo "════════════════════════════════════════"
echo "DONE!"
echo "════════════════════════════════════════"
echo ""
echo "Test in VLC:"
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
echo ""
echo "Settings:"
echo "  - 6 second segments"
echo "  - 60 second buffer (10 segments)"
echo "  - Segments kept longer before deletion"
echo ""
echo "Commands:"
echo "  ~/stream.sh start   - Start"
echo "  ~/stream.sh stop    - Stop"
echo "  ~/stream.sh status  - Check"
echo "  ~/stream.sh test    - Test playlist"
echo ""
