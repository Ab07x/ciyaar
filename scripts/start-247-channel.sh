#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY
# Usage: ./start-247-channel.sh <slug> <iptv_username> <iptv_password> <channel_id> <provider_host>
# ==============================================================================

if [ "$#" -ne 5 ]; then
    echo "Usage: $0 <slug> <iptv_username> <iptv_password> <channel_id> <provider_host>"
    echo "Example: $0 manutd myuser mypass 12345 line.provider.net:80"
    exit 1
fi

SLUG=$1
USER=$2
PASS=$3
CH_ID=$4
HOST=$5

# Construct Input URL (Standard Xtream Codes format)
# Usually http://domain:port/live/user/pass/id.ts
INPUT_URL="http://$HOST/live/$USER/$PASS/$CH_ID.ts"
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"

mkdir -p "$STREAM_DIR"
# Ensure clean start
rm -f "$STREAM_DIR/index.m3u8"
rm -f "$STREAM_DIR/*.ts"

echo "=================================================="
echo "📺 Starting 24/7 Channel: $SLUG"
echo "🔌 Source: $INPUT_URL (Hidden from public)"
echo "📂 Output: $STREAM_DIR/index.m3u8"
echo "=================================================="

# Infinite loop to keep stream alive
while true; do
    # copy mode (low cpu), with reconnect flags
    ffmpeg -hide_banner -loglevel warning \
        -user_agent "VLC/3.0.18" \
        -fflags +genpts+discardcorrupt \
        -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
        -i "$INPUT_URL" \
        -c copy \
        -hls_time 6 \
        -hls_list_size 6 \
        -hls_flags delete_segments \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8"
    
    echo "⚠️ Stream ($SLUG) disconnected or crashed! Restarting in 5 seconds..."
    sleep 5
done
