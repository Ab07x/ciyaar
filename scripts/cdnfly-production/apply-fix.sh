#!/bin/bash

##############################################################################
# APPLY BUFFERING FIX - ONE COMMAND
# Run this on the server to fix the 20-second stopping issue
##############################################################################

set -e

echo "================================================"
echo "APPLYING BUFFERING FIX"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f ~/ciyaar/scripts/cdnfly-production/stream-5-channels-fixed.sh ]; then
    echo "ERROR: Run this script on the server"
    echo "Expected to find: ~/ciyaar/scripts/cdnfly-production/stream-5-channels-fixed.sh"
    exit 1
fi

echo "Step 1: Updating stream script..."
cp ~/ciyaar/scripts/cdnfly-production/stream-5-channels-fixed.sh ~/stream.sh
chmod +x ~/stream.sh
echo "✓ Stream script updated"
echo ""

echo "Step 2: Updating nginx config..."
sudo cp ~/ciyaar/scripts/cdnfly-production/nginx-cdnfly-fixed.conf /etc/nginx/sites-available/cdnfly
echo "✓ Nginx config copied"
echo ""

echo "Step 3: Testing nginx config..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✓ Nginx config test passed"
else
    echo "✗ Nginx config test FAILED"
    sudo nginx -t
    exit 1
fi
echo ""

echo "Step 4: Reloading nginx..."
sudo systemctl reload nginx
echo "✓ Nginx reloaded"
echo ""

echo "Step 5: Stopping old streams..."
pm2 delete all 2>/dev/null || true
pm2 save
echo "✓ Old streams stopped"
echo ""

echo "Step 6: Cleaning old segments..."
for i in {1..5}; do
    rm -f ~/ciyaar/hls/channel-$i/*.ts ~/ciyaar/hls/channel-$i/*.m3u8 2>/dev/null || true
done
echo "✓ Old segments cleaned"
echo ""

echo "Step 7: Fixing permissions..."
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/ciyaar
sudo chmod 755 /home/ubuntu/ciyaar/hls
sudo usermod -a -G ubuntu www-data 2>/dev/null || true
sudo chown -R ubuntu:ubuntu ~/ciyaar/hls
echo "✓ Permissions fixed"
echo ""

echo "Step 8: Restarting nginx (for group membership)..."
sudo systemctl restart nginx
sleep 2
echo "✓ Nginx restarted"
echo ""

echo "Step 9: Starting streams with NEW settings..."
~/stream.sh on
echo ""

echo "Step 10: Waiting for streams to stabilize..."
sleep 10
echo ""

echo "================================================"
echo "✓ FIX APPLIED SUCCESSFULLY!"
echo "================================================"
echo ""
echo "Testing playback..."
echo ""

# Test if stream is accessible
if curl -s http://localhost/channel-1/stream.m3u8 | grep -q "EXTINF"; then
    echo "✓ Channel 1 is LIVE and accessible!"
    echo ""
    echo "Playlist preview:"
    curl -s http://localhost/channel-1/stream.m3u8 | head -20
else
    echo "✗ Warning: Stream may not be ready yet"
    echo "Check with: ~/stream.sh status"
fi

echo ""
echo "================================================"
echo "YOUR URLS (use these in your app):"
echo "================================================"
echo ""
echo "Origin (direct):"
echo "  http://origin.cdnfly.online/channel-1/stream.m3u8"
echo "  http://origin.cdnfly.online/channel-2/stream.m3u8"
echo "  http://origin.cdnfly.online/channel-3/stream.m3u8"
echo ""
echo "CloudFront (recommended):"
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
echo ""
echo "================================================"
echo "WHAT CHANGED:"
echo "================================================"
echo ""
echo "• Segment duration: 2s → 6s (more stable)"
echo "• Buffer size: 20s → 36s (longer buffer)"
echo "• Auto-reconnect on network failures"
echo "• Better CORS and caching headers"
echo "• TCP optimizations for streaming"
echo ""
echo "Monitor with: pm2 logs"
echo "Check status: ~/stream.sh status"
echo ""
