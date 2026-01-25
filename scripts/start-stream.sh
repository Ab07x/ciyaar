#!/bin/bash

# ==============================================================================
# FANBROJ STREAM RELAY SCRIPT
# ==============================================================================
# This script restreams an external IPTV/M3U8 link to your local server
# WITHOUT re-encoding (very low CPU usage).
# It fixes CORS issues and hides your provider link from users.
# ==============================================================================

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <channel_slug> <input_url>"
    echo "Example: $0 sntv 'http://provider.com/stream.m3u8?token=xyz'"
    exit 1
fi

CHANNEL_SLUG=$1
INPUT_URL=$2
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$CHANNEL_SLUG"

# Ensure output directory exists
if [ ! -d "$STREAM_DIR" ]; then
    echo "Creating directory: $STREAM_DIR"
    sudo mkdir -p "$STREAM_DIR"
    # User needs permissions to write here. Assuming this script runs as user who owns /var/www/html
    # or run with sudo. We'll set generic permissions for now to be safe.
    sudo chmod -R 777 "$STREAM_DIR"
fi

# Kill any existing process for this specific channel to avoid conflicts
# We search for the unique string we use in the command below
EXISTING_PID=$(pgrep -f "hls/$CHANNEL_SLUG/index.m3u8")
if [ ! -z "$EXISTING_PID" ]; then
    echo "Stopping existing stream for $CHANNEL_SLUG (PID: $EXISTING_PID)..."
    kill $EXISTING_PID
    sleep 2
fi

echo "Starting stream for $CHANNEL_SLUG..."

# ==============================================================================
# FFmpeg Command Explanation:
# -user_agent: Spoofs VLC media player to prevent blocking by some providers
# -re: Read input at native framerate (important for live streams)
# -i: Input URL
# -c copy: DIRECT STREAM COPY. Zero CPU encoding load.
# -hls_time 4: Segment length in seconds (lower = lower latency, higher = stability)
# -hls_list_size 5: Keep only 5 segments in the playlist (rolling buffer)
# -hls_flags delete_segments: Remove old .ts files to save disk space
# ==============================================================================

nohup ffmpeg \
  -hide_banner -loglevel error \
  -user_agent "VLC/3.0.18 LibVLC/3.0.18" \
  -re \
  -i "$INPUT_URL" \
  -c:v copy -c:a copy \
  -hls_time 4 \
  -hls_list_size 5 \
  -hls_flags delete_segments \
  -f hls \
  "$STREAM_DIR/index.m3u8" > "$STREAM_DIR/ffmpeg.log" 2>&1 &

echo "✅ Stream started!"
echo "---------------------------------------------------"
echo "Public URL: https://fanbroj.net/hls/$CHANNEL_SLUG/index.m3u8"
echo "Log File:   $STREAM_DIR/ffmpeg.log"
echo "---------------------------------------------------"
