#!/bin/bash

##############################################################################
# SIMPLE 5-CHANNEL STREAMER - CIYAAR
# No bullshit - Just works!
# For ubuntu@ip-172-26-2-90
##############################################################################

# IPTV Credentials
USER="d06HPCFR"
PASS="qEBJjW3"
BASE="http://iptvtour.store:80"

# Output directory - Using CIYAAR
OUT_DIR="$HOME/ciyaar/hls"
mkdir -p $OUT_DIR

# 5 Channels - Top Sports
declare -A CHANNELS=(
    [1]="9701:sky-main"      # Sky Sports Main Event
    [2]="9700:sky-football"  # Sky Sports Football
    [3]="9696:sky-action"    # Sky Sports Action
    [4]="14345:tnt1"         # TNT Sport 1
    [5]="14346:tnt2"         # TNT Sport 2
)

# HLS Settings - ZERO BUFFER/LOOP
HLS_TIME=2
HLS_LIST=10
HLS_DELETE=15

start_channel() {
    local num=$1
    local info="${CHANNELS[$num]}"
    local id="${info%%:*}"
    local slug="${info#*:}"

    local source="$BASE/$USER/$PASS/$id"
    local out="$OUT_DIR/channel-$num"

    mkdir -p $out
    rm -f $out/*.ts $out/*.m3u8  # Clean old files

    echo "[$num/5] Starting: channel-$num (stream $id)"

    pm2 start ffmpeg \
        --name "ch$num" \
        -- \
        -re \
        -i "$source" \
        -c:v copy \
        -c:a aac -b:a 128k \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST \
        -hls_delete_threshold $HLS_DELETE \
        -hls_flags delete_segments+append_list+omit_endlist \
        -hls_segment_filename "$out/seg%05d.ts" \
        "$out/stream.m3u8" \
        >/dev/null 2>&1
}

case "$1" in
    on|start)
        echo "Starting 5 channels..."
        pm2 delete all 2>/dev/null || true
        for i in {1..5}; do
            start_channel $i
            sleep 1
        done
        pm2 save
        echo ""
        echo "✓ All 5 channels started!"
        echo ""
        echo "URLs:"
        echo "  http://origin.cdnfly.online/channel-1/stream.m3u8"
        echo "  http://origin.cdnfly.online/channel-2/stream.m3u8"
        echo "  http://origin.cdnfly.online/channel-3/stream.m3u8"
        echo "  http://origin.cdnfly.online/channel-4/stream.m3u8"
        echo "  http://origin.cdnfly.online/channel-5/stream.m3u8"
        echo ""
        echo "Monitor: pm2 list"
        ;;

    off|stop)
        echo "Stopping all channels..."
        pm2 delete all
        pm2 save
        for i in {1..5}; do
            rm -f $OUT_DIR/channel-$i/*.ts $OUT_DIR/channel-$i/*.m3u8
        done
        echo "✓ All stopped"
        ;;

    status)
        pm2 list
        echo ""
        for i in {1..5}; do
            if [ -f "$OUT_DIR/channel-$i/stream.m3u8" ]; then
                age=$(( $(date +%s) - $(stat -c %Y "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null || stat -f %m "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null) ))
                segs=$(ls -1 $OUT_DIR/channel-$i/*.ts 2>/dev/null | wc -l)
                if [ $age -lt 10 ]; then
                    echo "✓ Channel $i: LIVE ($segs segments, ${age}s ago)"
                else
                    echo "✗ Channel $i: STALE ($segs segments, ${age}s ago)"
                fi
            else
                echo "✗ Channel $i: NO PLAYLIST"
            fi
        done
        ;;

    *)
        echo "Usage:"
        echo "  $0 on       Start all 5 channels"
        echo "  $0 off      Stop all channels"
        echo "  $0 status   Check status"
        ;;
esac
