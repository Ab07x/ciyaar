#!/bin/bash
# ==============================================================================
# FANBROJ IPTV CHANNEL FINDER
# ==============================================================================
# Search for channels in your IPTV provider's playlist.
#
# Usage:
#   ./find-channel.sh <search_term>
#   ./find-channel.sh <search_term> <username> <password> <host>
#
# Examples:
#   ./find-channel.sh "bein sport"
#   ./find-channel.sh "universal"
#   ./find-channel.sh "somali" user pass host.com
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Load config if available
CONFIG_FILE="$HOME/ciyaar/config/iptv.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Parse arguments
SEARCH_TERM="${1:-}"

if [ "$#" -eq 4 ]; then
    # Legacy format: search user pass host
    SEARCH_TERM="$1"
    IPTV_USERNAME="$2"
    IPTV_PASSWORD="$3"
    IPTV_HOST="$4"
elif [ "$#" -eq 1 ]; then
    # Use config file values
    IPTV_USERNAME="${IPTV_USERNAME:-jUpu92sC}"
    IPTV_PASSWORD="${IPTV_PASSWORD:-gEjWzKe}"
    IPTV_HOST="${IPTV_HOST:-iptvtour.store}"
else
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           FANBROJ IPTV CHANNEL FINDER                        ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Usage: $0 <search_term> [username] [password] [host]"
    echo ""
    echo "Examples:"
    echo "  $0 \"bein sport\"           # Search using config file"
    echo "  $0 \"universal\" user pass host.com"
    echo ""
    exit 1
fi

if [ -z "$SEARCH_TERM" ]; then
    echo -e "${RED}❌ Error: Search term required${NC}"
    exit 1
fi

# Construct M3U URL
M3U_URL="http://$IPTV_HOST/get.php?username=$IPTV_USERNAME&password=$IPTV_PASSWORD&type=m3u_plus&output=ts"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           FANBROJ IPTV CHANNEL FINDER                        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🔍 Searching for:${NC} \"$SEARCH_TERM\""
echo -e "${BLUE}📡 Provider:${NC} $IPTV_HOST"
echo ""
echo -e "${YELLOW}⏳ Downloading playlist (this may take a moment)...${NC}"
echo ""

# Download and parse
RESULTS=$(curl -s --max-time 60 "$M3U_URL" 2>/dev/null | grep -A 1 -i "$SEARCH_TERM" | grep -v "\-\-")

if [ -z "$RESULTS" ]; then
    echo -e "${RED}❌ No channels found matching \"$SEARCH_TERM\"${NC}"
    echo ""
    echo "Tips:"
    echo "  - Try a shorter search term"
    echo "  - Check spelling"
    echo "  - Try searching for category (e.g., \"sport\", \"news\")"
    exit 0
fi

# Count results
CHANNEL_COUNT=0

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    SEARCH RESULTS                             ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo "$RESULTS" | while read -r line; do
    if [[ $line == "#EXTINF"* ]]; then
        # Extract Channel Name
        NAME=$(echo "$line" | sed 's/.*,//')
        # Extract Group
        GROUP=$(echo "$line" | sed -n 's/.*group-title="\([^"]*\)".*/\1/p')
        # Extract Logo
        LOGO=$(echo "$line" | sed -n 's/.*tvg-logo="\([^"]*\)".*/\1/p')
        
        echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
        echo -e "${CYAN}│${NC} ${GREEN}📺 $NAME${NC}"
        [ -n "$GROUP" ] && echo -e "${CYAN}│${NC}    Group: $GROUP"
    elif [[ $line == "http"* ]]; then
        # Extract ID from URL
        ID=$(echo "$line" | sed 's/.*\/\([0-9]*\)\.ts/\1/')
        
        echo -e "${CYAN}│${NC}    ${YELLOW}ID: $ID${NC}"
        echo -e "${CYAN}│${NC}"
        echo -e "${CYAN}│${NC}    To start this channel:"
        echo -e "${CYAN}│${NC}    ${BLUE}./channel-manager.sh start SLUG $ID${NC}"
        echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        CHANNEL_COUNT=$((CHANNEL_COUNT + 1))
    fi
done

echo ""
echo -e "${GREEN}✅ Search complete${NC}"
echo ""
echo "Quick Start:"
echo "  1. Note the channel ID you want"
echo "  2. Run: ./channel-manager.sh start <slug> <channel_id>"
echo "  3. Access: http://YOUR_IP/hls/<slug>/index.m3u8"
echo ""
