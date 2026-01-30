#!/bin/bash
#
# find_channels.sh - M3U Playlist Channel Finder
# Usage: ./find_channels.sh [search_term]
#

# IPTV Credentials
IPTV_URL="http://iptvtour.store"
USERNAME="d06HPCFR"
PASSWORD="qEBJjW3"
M3U_URL="${IPTV_URL}/get.php?username=${USERNAME}&password=${PASSWORD}&type=m3u&output=ts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Cache file
CACHE_FILE="/tmp/iptv_channels.m3u"
CACHE_MAX_AGE=3600

# Check if cache is fresh
check_cache() {
    if [ -f "$CACHE_FILE" ]; then
        if [ "$(uname)" == "Darwin" ]; then
            file_age=$(($(date +%s) - $(stat -f %m "$CACHE_FILE")))
        else
            file_age=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE")))
        fi
        [ $file_age -lt $CACHE_MAX_AGE ] && return 0
    fi
    return 1
}

# Download playlist
download_playlist() {
    echo -e "${YELLOW}Downloading M3U playlist...${NC}"
    curl -s "$M3U_URL" > "$CACHE_FILE"
    if [ $? -eq 0 ] && [ -s "$CACHE_FILE" ]; then
        echo -e "${GREEN}Downloaded successfully!${NC}"
        return 0
    else
        echo -e "${RED}Failed to download playlist${NC}"
        return 1
    fi
}

# Parse and search channels
search_channels() {
    local search_term="$1"
    local count=0
    local current_name=""
    local current_url=""

    echo ""
    if [ -n "$search_term" ]; then
        echo -e "${BOLD}${CYAN}=== Channels matching: \"$search_term\" ===${NC}"
    else
        echo -e "${BOLD}${CYAN}=== All Channels ===${NC}"
    fi
    echo ""

    while IFS= read -r line; do
        if [[ "$line" == "#EXTINF:"* ]]; then
            current_name="${line#*,}"
        elif [[ "$line" == "http"* ]] && [ -n "$current_name" ]; then
            current_url="$line"

            # If no search term, show all; otherwise filter
            if [ -z "$search_term" ] || echo "$current_name" | grep -qi "$search_term"; then
                ((count++))

                # Extract stream ID
                stream_id=$(echo "$current_url" | awk -F'/' '{print $NF}' | sed 's/\.[^.]*$//')

                # Quality indicator
                quality=""
                if echo "$current_name" | grep -qi "FHD\|1080"; then
                    quality="${GREEN}[FHD]${NC}"
                elif echo "$current_name" | grep -qi "4K\|UHD"; then
                    quality="${CYAN}[4K]${NC}"
                elif echo "$current_name" | grep -qi "HD\|720"; then
                    quality="${YELLOW}[HD]${NC}"
                elif echo "$current_name" | grep -qi "SD\|LQ"; then
                    quality="${RED}[SD]${NC}"
                fi

                echo -e "${BOLD}[ID: ${BLUE}$stream_id${NC}${BOLD}]${NC} $current_name $quality"
                echo -e "   ${BLUE}URL:${NC} $current_url"
                echo ""

                # Limit output if showing all channels
                if [ -z "$search_term" ] && [ $count -ge 100 ]; then
                    echo -e "${YELLOW}... showing first 100 channels. Use search term to filter.${NC}"
                    break
                fi
            fi

            current_name=""
            current_url=""
        fi
    done < "$CACHE_FILE"

    echo -e "${BOLD}${GREEN}Found $count channel(s)${NC}"
}

# Main
main() {
    # Ensure cache exists
    if ! check_cache; then
        download_playlist || exit 1
    fi

    if [ $# -eq 0 ]; then
        echo ""
        echo -e "${BOLD}${CYAN}M3U Channel Finder${NC}"
        echo ""
        echo -e "${BOLD}Usage:${NC}"
        echo "  $0 <search_term>    Search for channels"
        echo "  $0 --all            List all channels"
        echo "  $0 --refresh        Force refresh playlist"
        echo ""
        echo -e "${BOLD}Examples:${NC}"
        echo "  $0 \"bein\"           Find BeIN channels"
        echo "  $0 \"sky sports\"     Find Sky Sports channels"
        echo "  $0 \"premier\"        Find Premier League channels"
        echo ""
        exit 0
    fi

    case "$1" in
        --refresh|-r)
            rm -f "$CACHE_FILE"
            download_playlist
            ;;
        --all|-a)
            search_channels ""
            ;;
        *)
            search_channels "$1"
            ;;
    esac
}

main "$@"
