#!/bin/bash
# ==============================================================================
# GET SPORTS CHANNELS FROM XTREAM CODES
# ==============================================================================
# Usage: ./get-sports-channels.sh <username> <password> <host>
# Example: ./get-sports-channels.sh 59ad8c73feb6 3c0ac8cfe4 cf.live78.online
# ==============================================================================

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <username> <password> <host>"
    echo "Example: $0 59ad8c73feb6 3c0ac8cfe4 cf.live78.online"
    exit 1
fi

USER=$1
PASS=$2
HOST=$3

API_URL="http://$HOST/player_api.php?username=$USER&password=$PASS"

echo "=============================================="
echo "🏈 XTREAM SPORTS CHANNEL EXTRACTOR"
echo "=============================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    sudo apt install -y jq
fi

# Step 1: Get all categories and find sports-related ones
echo "📂 Fetching categories..."
CATEGORIES=$(curl -s "$API_URL&action=get_live_categories")

echo ""
echo "🎯 SPORTS CATEGORIES FOUND:"
echo "-------------------------------------------"
echo "$CATEGORIES" | jq -r '.[] | select(.category_name | test("sport|bein|soccer|football|premier|nfl|nba|ufc|wwe|boxing|cricket|tennis|f1|espn|sky sport|dazn|supersport"; "i")) | "\(.category_id): \(.category_name)"'

echo ""
echo "-------------------------------------------"
echo ""

# Step 2: Get sports category IDs
SPORTS_CAT_IDS=$(echo "$CATEGORIES" | jq -r '.[] | select(.category_name | test("sport|bein|soccer|football|premier|nfl|nba|ufc|wwe|boxing|cricket|tennis|f1|espn|sky sport|dazn|supersport"; "i")) | .category_id')

if [ -z "$SPORTS_CAT_IDS" ]; then
    echo "❌ No sports categories found. Searching all channels for sports keywords..."
    echo ""
    
    # Fallback: Search all streams for sports keywords
    curl -s "$API_URL&action=get_live_streams" | jq -r --arg host "$HOST" --arg user "$USER" --arg pass "$PASS" '
        .[] | 
        select(.name | test("bein|sport|soccer|football|premier|espn|sky|dazn|super"; "i")) |
        "📺 \(.name)\n   ID: \(.stream_id)\n   URL: http://\($host)/live/\($user)/\($pass)/\(.stream_id).ts\n"
    ' | head -100
    exit 0
fi

# Step 3: Get streams from each sports category
echo "📺 SPORTS CHANNELS:"
echo "=============================================="

for CAT_ID in $SPORTS_CAT_IDS; do
    CAT_NAME=$(echo "$CATEGORIES" | jq -r ".[] | select(.category_id == \"$CAT_ID\") | .category_name")
    echo ""
    echo "🏆 CATEGORY: $CAT_NAME (ID: $CAT_ID)"
    echo "-------------------------------------------"
    
    curl -s "$API_URL&action=get_live_streams&category_id=$CAT_ID" | jq -r --arg host "$HOST" --arg user "$USER" --arg pass "$PASS" '
        .[] | 
        "  📺 \(.name)\n     ID: \(.stream_id)\n     TS:  http://\($host)/live/\($user)/\($pass)/\(.stream_id).ts\n     M3U8: http://\($host)/live/\($user)/\($pass)/\(.stream_id).m3u8\n"
    '
done

echo ""
echo "=============================================="
echo "✅ Done! Copy the URLs above to use with FFmpeg"
echo "=============================================="
