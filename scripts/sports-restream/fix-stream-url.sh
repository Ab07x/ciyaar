#!/bin/bash
# ==============================================================================
# FIX STREAM URL - Get correct public URL for VLC
# ==============================================================================

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           GET CORRECT STREAM URL FOR VLC                      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

# List active streams
echo "Active Streams:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for pid_file in ~/sports-stream/pids/*.pid; do
    [ -e "$pid_file" ] || continue
    
    name=$(basename "$pid_file" .pid)
    config_file="~/sports-stream/config/${name}.json"
    
    if [ -f "$config_file" ]; then
        stream_key=$(jq -r '.stream_key' "$config_file" 2>/dev/null || echo "")
        
        if [ -n "$stream_key" ]; then
            echo ""
            echo "📺 Channel: $name"
            echo ""
            echo -e "${GREEN}VLC URL (use this):${NC}"
            echo "http://$SERVER_IP/sports/$stream_key/index.m3u8"
            echo ""
            echo "Alternative (if above doesn't work):"
            echo "http://$SERVER_IP:80/sports/$stream_key/index.m3u8"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        fi
    fi
done

echo ""
echo "📝 To test in VLC:"
echo "1. Open VLC"
echo "2. Media → Open Network Stream"
echo "3. Paste the URL above"
echo "4. Click Play"
echo ""
