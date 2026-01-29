#!/bin/bash
# ==============================================================================
# FIND CHANNEL IDs - Extract working channel IDs from IPTV M3U
# ==============================================================================
# This script downloads the M3U playlist and tests channels to find working IDs
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "\n${CYAN}$1${NC}"; }

# IPTV Credentials
USERNAME="d06HPCFR"
PASSWORD="qEBJjW3"
SERVER="iptvtour.store"
M3U_URL="http://iptvtour.store/get.php?username=${USERNAME}&password=${PASSWORD}&type=m3u&output=ts"

# Working directory
WORK_DIR="/tmp/iptv-scan"
mkdir -p "$WORK_DIR"

# ==============================================================================
# DOWNLOAD M3U
# ==============================================================================
log_header "📥 Downloading Channel List..."

curl -s "$M3U_URL" -o "$WORK_DIR/channels.m3u"

if [ ! -f "$WORK_DIR/channels.m3u" ]; then
    log_error "Failed to download M3U playlist"
    exit 1
fi

CHANNEL_COUNT=$(grep -c "^#EXTINF" "$WORK_DIR/channels.m3u")
log_success "Downloaded $CHANNEL_COUNT channels"

# ==============================================================================
# PARSE CHANNELS
# ==============================================================================
log_header "📋 Parsing Channels..."

# Extract channel names and URLs
awk '/^#EXTINF/{name=$0; gsub(/.*,/, "", name); getline url; print name "|" url}' "$WORK_DIR/channels.m3u" > "$WORK_DIR/parsed.txt"

# Show first 20 channels
echo -e "\n${CYAN}First 20 Channels Found:${NC}"
head -20 "$WORK_DIR/parsed.txt" | nl

# ==============================================================================
# TEST CHANNELS
# ==============================================================================
log_header "🧪 Testing Channels..."

# Function to test a channel
test_channel() {
    local url="$1"
    local name="$2"
    
    # Extract channel ID from URL
    local channel_id=$(echo "$url" | grep -oE '[0-9]+\.ts$' | sed 's/\.ts$//')
    
    if [ -z "$channel_id" ]; then
        return 1
    fi
    
    # Test with curl (HEAD request)
    local response=$(curl -s -I --max-time 5 "$url" 2>&1 | head -1)
    
    if echo "$response" | grep -q "200\|302"; then
        echo -e "${GREEN}✓${NC} $name (ID: $channel_id)"
        echo "$channel_id|$name|$url" >> "$WORK_DIR/working.txt"
        return 0
    else
        return 1
    fi
}

# Test first 50 channels
echo -e "\n${CYAN}Testing first 50 channels...${NC}\n"

WORKING_COUNT=0
head -50 "$WORK_DIR/parsed.txt" | while IFS='|' read -r name url; do
    if test_channel "$url" "$name"; then
        WORKING_COUNT=$((WORKING_COUNT + 1))
    fi
done

# ==============================================================================
# SEARCH FOR SPORTS CHANNELS
# ==============================================================================
log_header "⚽ Searching for Sports Channels..."

SPORTS_KEYWORDS="sport|bein|espn|sky|bt sport|super sport|nba|nfl|ufc|box|fight|f1|formula|premier|champions|euro"

echo -e "\n${CYAN}Sports Channels Found:${NC}\n"
grep -iE "$SPORTS_KEYWORDS" "$WORK_DIR/parsed.txt" | head -30 | while IFS='|' read -r name url; do
    channel_id=$(echo "$url" | grep -oE '[0-9]+\.ts$' | sed 's/\.ts$//')
    echo -e "${YELLOW}•${NC} $name"
    echo -e "  ID: ${GREEN}$channel_id${NC}"
    echo -e "  URL: $url\n"
done

# ==============================================================================
# TEST SPECIFIC CHANNEL IDs
# ==============================================================================
log_header "🎯 Testing Common Channel ID Ranges..."

# Test common ranges
TEST_IDS=(1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 100 101 102 103 104 105 200 201 202 203 204 205 300 301 302 303 304 305 1000 1001 1002 1003 1004 1005)

echo -e "\n${CYAN}Testing common channel IDs...${NC}\n"

for id in "${TEST_IDS[@]}"; do
    url="http://${SERVER}/live/${USERNAME}/${PASSWORD}/${id}.ts"
    response=$(curl -s -I --max-time 3 "$url" 2>&1 | head -1)
    
    if echo "$response" | grep -q "200\|302"; then
        # Get channel name from parsed file
        name=$(grep "$id.ts" "$WORK_DIR/parsed.txt" | cut -d'|' -f1 | head -1)
        [ -z "$name" ] && name="Unknown Channel"
        echo -e "${GREEN}✓ WORKING:${NC} ID $id - $name"
        echo "$id|$name" >> "$WORK_DIR/confirmed.txt"
    fi
done

# ==============================================================================
# SUMMARY
# ==============================================================================
log_header "📊 Summary"

if [ -f "$WORK_DIR/confirmed.txt" ]; then
    echo -e "\n${GREEN}Confirmed Working Channel IDs:${NC}\n"
    cat "$WORK_DIR/confirmed.txt" | while IFS='|' read -r id name; do
        echo -e "  ID: ${GREEN}$id${NC} - $name"
        echo -e "  Command: sm start channel-${id} \"http://${SERVER}/live/${USERNAME}/${PASSWORD}/${id}.ts\" 150"
        echo ""
    done
else
    log_warn "No confirmed working channels found in common ranges"
fi

echo -e "\n${CYAN}To test a specific channel ID:${NC}"
echo "  curl -I http://${SERVER}/live/${USERNAME}/${PASSWORD}/12345.ts"
echo ""
echo -e "${CYAN}To start streaming a working channel:${NC}"
echo "  sm start my-channel \"http://${SERVER}/live/${USERNAME}/${PASSWORD}/ID.ts\" 150"
echo ""

# Save results
cp "$WORK_DIR/parsed.txt" "$HOME/sports-stream/config/channels.txt" 2>/dev/null || true
log_info "Channel list saved to: ~/sports-stream/config/channels.txt"
