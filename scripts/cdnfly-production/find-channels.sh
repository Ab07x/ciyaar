#!/bin/bash

##############################################################################
# CHANNEL DISCOVERY TOOL
# Finds and lists all available channels from IPTV M3U playlist
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# IPTV Credentials
IPTV_USERNAME="d06HPCFR"
IPTV_PASSWORD="qEBJjW3"
IPTV_BASE_URL="http://iptvtour.store"
M3U_URL="$IPTV_BASE_URL/get.php?username=$IPTV_USERNAME&password=$IPTV_PASSWORD&type=m3u&output=ts"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     IPTV CHANNEL DISCOVERY TOOL                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Download M3U playlist
echo -e "${BLUE}Downloading M3U playlist...${NC}"
curl -s "$M3U_URL" > /tmp/playlist.m3u 2>&1

if [ ! -s /tmp/playlist.m3u ]; then
    echo -e "${RED}Error: Failed to download playlist${NC}"
    exit 1
fi

TOTAL_CHANNELS=$(grep -c "^#EXTINF" /tmp/playlist.m3u)
echo -e "${GREEN}✓ Found $TOTAL_CHANNELS total channels${NC}"
echo ""

# Parse and display channels
parse_channels() {
    local category="$1"
    local filter="$2"

    echo -e "${CYAN}${BOLD}=== $category ===${NC}"
    echo ""

    # Extract channels matching filter
    awk -v filter="$filter" '
    BEGIN {
        count = 0
    }
    /^#EXTINF/ {
        if (tolower($0) ~ tolower(filter)) {
            # Extract channel name
            match($0, /tvg-name="([^"]*)"/, name)
            match($0, /group-title="([^"]*)"/, group)

            # Get channel name from end of line
            split($0, parts, ",")
            channel_name = parts[length(parts)]

            getline url

            # Extract stream ID from URL
            if (match(url, /\/([0-9]+)$/, id)) {
                stream_id = id[1]
                printf "%3d. %-40s [ID: %s]\n", ++count, channel_name, stream_id
                printf "     URL: %s\n", url
                printf "     Group: %s\n\n", group[1]
            }
        }
    }
    ' /tmp/playlist.m3u
}

# Show menu
show_menu() {
    echo -e "${YELLOW}Select category to view:${NC}"
    echo ""
    echo "  1. ⚽ Football/Soccer Channels (Sky Sports, TNT, BT Sport)"
    echo "  2. 🏀 All Sports Channels"
    echo "  3. 🎬 Entertainment Channels"
    echo "  4. 📺 All Channels (Full List)"
    echo "  5. 🔍 Search by Name"
    echo "  6. 💾 Export to JSON"
    echo "  7. ❌ Exit"
    echo ""
    read -p "$(echo -e ${CYAN}Enter choice [1-7]: ${NC})" choice

    case $choice in
        1)
            parse_channels "FOOTBALL/SOCCER CHANNELS" "sky sports|tnt sport|bt sport|premier sports|bein sports"
            ;;
        2)
            parse_channels "ALL SPORTS CHANNELS" "sport"
            ;;
        3)
            parse_channels "ENTERTAINMENT CHANNELS" "movies|series|entertainment"
            ;;
        4)
            echo -e "${CYAN}ALL CHANNELS:${NC}"
            echo ""
            awk '
            /^#EXTINF/ {
                split($0, parts, ",")
                channel_name = parts[length(parts)]
                getline url
                if (match(url, /\/([0-9]+)$/, id)) {
                    printf "%s [ID: %s]\n", channel_name, id[1]
                }
            }
            ' /tmp/playlist.m3u | nl
            ;;
        5)
            read -p "$(echo -e ${CYAN}Enter search term: ${NC})" search_term
            parse_channels "SEARCH RESULTS: $search_term" "$search_term"
            ;;
        6)
            export_to_json
            ;;
        7)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac

    echo ""
    read -p "$(echo -e ${YELLOW}Press Enter to continue...${NC})"
    clear
    show_menu
}

export_to_json() {
    echo -e "${BLUE}Exporting channels to JSON...${NC}"

    cat > /tmp/channels.json << 'EOF'
{
  "channels": [
EOF

    awk '
    BEGIN {
        first = 1
    }
    /^#EXTINF/ {
        match($0, /tvg-name="([^"]*)"/, name)
        match($0, /tvg-logo="([^"]*)"/, logo)
        match($0, /group-title="([^"]*)"/, group)

        split($0, parts, ",")
        channel_name = parts[length(parts)]

        getline url

        if (match(url, /\/([0-9]+)$/, id)) {
            if (!first) printf ",\n"
            first = 0

            printf "    {\n"
            printf "      \"id\": %s,\n", id[1]
            printf "      \"name\": \"%s\",\n", channel_name
            printf "      \"tvg_name\": \"%s\",\n", name[1]
            printf "      \"logo\": \"%s\",\n", logo[1]
            printf "      \"group\": \"%s\",\n", group[1]
            printf "      \"url\": \"%s\"\n", url
            printf "    }"
        }
    }
    ' /tmp/playlist.m3u >> /tmp/channels.json

    cat >> /tmp/channels.json << 'EOF'

  ]
}
EOF

    echo -e "${GREEN}✓ Exported to /tmp/channels.json${NC}"
    echo ""
    echo -e "${CYAN}Preview:${NC}"
    head -20 /tmp/channels.json
}

# Quick search for specific channels
if [ ! -z "$1" ]; then
    parse_channels "SEARCH: $1" "$1"
    exit 0
fi

# Interactive mode
clear
show_menu
