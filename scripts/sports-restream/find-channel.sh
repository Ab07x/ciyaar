#!/bin/bash
# ==============================================================================
# IPTV CHANNEL DISCOVERY TOOL
# ==============================================================================
# Parses M3U playlists to find specific channels and stream IDs
# Usage: ./find-channel.sh <search_term> [playlist_url]
# ==============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SEARCH_TERM="${1:-}"
PLAYLIST_URL="${2:-http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts}"
CACHE_FILE="/tmp/iptv_playlist.m3u"

if [ -z "$SEARCH_TERM" ]; then
    echo "Usage: $0 <search_term> [playlist_url]"
    echo "Example: $0 'bein sports'"
    exit 1
fi

echo -e "${CYAN}Searching for '$SEARCH_TERM' in playlist...${NC}"

# Download playlist if not cached or older than 1 hour
if [ ! -f "$CACHE_FILE" ] || [ "$(find "$CACHE_FILE" -mmin +60)" ]; then
    echo -e "${YELLOW}Downloading/Refreshing playlist...${NC}"
    curl -sSL "$PLAYLIST_URL" -o "$CACHE_FILE"
fi

if [ ! -f "$CACHE_FILE" ]; then
    echo "Error: Could not download playlist."
    exit 1
fi

# Parse M3U
# Looks for #EXTINF lines containing the search term and the next line (URL)
grep -i -A 1 "$SEARCH_TERM" "$CACHE_FILE" | while read -r line; do
    if [[ $line == \#EXTINF* ]]; then
        # Extract channel name
        NAME=$(echo "$line" | sed 's/.*,//')
        echo -e "${GREEN}Channel:${NC} $NAME"
    elif [[ $line == http* ]]; then
        # Extract ID from URL (usually the last numeric part before .ts)
        ID=$(echo "$line" | grep -oE '[0-9]+\.ts$' | cut -d'.' -f1 || echo "unknown")
        echo -e "${YELLOW}URL:${NC} $line"
        echo -e "${CYAN}ID:${NC}  $ID"
        echo "------------------------------------------------------"
    fi
done

echo -e "\n${CYAN}To start streaming one of these, use:${NC}"
echo "sm start <name> <url> 150"
