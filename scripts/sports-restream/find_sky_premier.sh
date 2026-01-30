#!/bin/bash
# ==============================================================================
# FIND SKY SPORTS & PREMIER LEAGUE CHANNELS
# ==============================================================================

# New IPTV Credentials
USERNAME="8cd579f4ea62"
PASSWORD="5168534cd5"
SERVER="live78.online"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     FINDING SKY SPORTS & PREMIER LEAGUE CHANNELS              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Download playlist
echo "📥 Downloading channel list..."
curl -s "http://${SERVER}/get.php?username=${USERNAME}&password=${PASSWORD}&type=m3u&output=ts" -o /tmp/channels.m3u

if [ ! -f /tmp/channels.m3u ]; then
    echo "❌ Failed to download"
    exit 1
fi

TOTAL=$(grep -c "#EXTINF" /tmp/channels.m3u)
echo "✅ Found $TOTAL total channels"
echo ""

# Extract and search
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 SEARCHING FOR 'SKY' CHANNELS:"
echo ""

awk '/^#EXTINF/{ 
    name=$0
    gsub(/.*,/, "", name)
    getline url
    print name "|" url
}' /tmp/channels.m3u | grep -i "sky" | while IFS='|' read -r name url; do
    channel_id=$(echo "$url" | grep -oE '[0-9]+' | tail -1)
    echo "📺 $name"
    echo "   ID: $channel_id"
    echo "   URL: http://${SERVER}/live/${USERNAME}/${PASSWORD}/${channel_id}.ts"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 SEARCHING FOR 'PREMIER' CHANNELS:"
echo ""

awk '/^#EXTINF/{ 
    name=$0
    gsub(/.*,/, "", name)
    getline url
    print name "|" url
}' /tmp/channels.m3u | grep -i "premier" | while IFS='|' read -r name url; do
    channel_id=$(echo "$url" | grep -oE '[0-9]+' | tail -1)
    echo "📺 $name"
    echo "   ID: $channel_id"
    echo "   URL: http://${SERVER}/live/${USERNAME}/${PASSWORD}/${channel_id}.ts"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 VLC PLAYLIST (Copy & Paste into VLC):"
echo ""
echo "#EXTM3U"

# Create VLC playlist
awk '/^#EXTINF/{ 
    name=$0
    gsub(/.*,/, "", name)
    getline url
    print name "|" url
}' /tmp/channels.m3u | grep -iE "sky|premier" | while IFS='|' read -r name url; do
    channel_id=$(echo "$url" | grep -oE '[0-9]+' | tail -1)
    clean_name=$(echo "$name" | sed 's/[^a-zA-Z0-9 ]//g')
    echo "#EXTINF:-1,$clean_name"
    echo "http://${SERVER}/live/${USERNAME}/${PASSWORD}/${channel_id}.ts"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 Saving to: ~/sky-premier-playlist.m3u"

echo "#EXTM3U" > ~/sky-premier-playlist.m3u
awk '/^#EXTINF/{ 
    name=$0
    gsub(/.*,/, "", name)
    getline url
    print name "|" url
}' /tmp/channels.m3u | grep -iE "sky|premier" | while IFS='|' read -r name url; do
    channel_id=$(echo "$url" | grep -oE '[0-9]+' | tail -1)
    clean_name=$(echo "$name" | sed 's/[^a-zA-Z0-9 ]//g')
    echo "#EXTINF:-1,$clean_name" >> ~/sky-premier-playlist.m3u
    echo "http://${SERVER}/live/${USERNAME}/${PASSWORD}/${channel_id}.ts" >> ~/sky-premier-playlist.m3u
done

echo ""
echo "✅ Done! Open ~/sky-premier-playlist.m3u in VLC"
echo ""
