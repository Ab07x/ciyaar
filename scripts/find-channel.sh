#!/bin/bash
# ==============================================================================
# FANBROJ IPTV CHANNEL FINDER
# Usage: ./find-channel.sh <search_term> <username> <password> <host>
# Example: ./find-channel.sh "Man Utd" 59ad8c73feb6 3c0ac8cfe4 cf.live78.online
# ==============================================================================

if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <search_term> <username> <password> <host>"
    echo "Example: $0 \"Man Utd\" myuser mypass cf.live78.online"
    exit 1
fi

SEARCH_TERM=$1
USER=$2
PASS=$3
HOST=$4

# Construct M3U URL
# Using type=m3u_plus to get channel names and groups
M3U_URL="http://$HOST/get.php?username=$USER&password=$PASS&type=m3u_plus&output=ts"

echo "🔍 Searching for \"$SEARCH_TERM\" in playlist..."
echo "⏳ Downloading playlist (this might take a few seconds)..."

# Download and parse
# 1. curl downloads the content.
# 2. grep -A 1 -i "$SEARCH_TERM" finds the line with the name AND the next line (the URL).
# 3. We then process it to look pretty.

curl -s "$M3U_URL" | grep -A 1 -i "$SEARCH_TERM" | grep -v "\-\-" | while read -r line; do
    if [[ $line == "#EXTINF"* ]]; then
        # Extract Channel Name (everything after comma)
        NAME=$(echo "$line" | sed 's/.*,//')
        # Extract Logo (optional, just for info)
        LOGO=$(echo "$line" | sed -n 's/.*tvg-logo="\([^"]*\)".*/\1/p')
        echo "--------------------------------------------------"
        echo "📺 NAME: $NAME"
    elif [[ $line == "http"* ]]; then
        # Extract ID from URL (last number before .ts)
        # URL format: http://host:port/live/user/pass/ID.ts
        ID=$(echo "$line" | sed 's/.*\/\([0-9]*\)\.ts/\1/')
        echo "🆔 ID:   $ID"
        echo "🔗 URL:  $line"
    fi
done

echo "--------------------------------------------------"
echo "✅ Search complete."
