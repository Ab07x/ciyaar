#!/bin/bash

##############################################################################
# WORKING STREAM - NO BULLSHIT
# Simple settings that ACTUALLY WORK
##############################################################################

set -e

# IPTV Credentials
USER="d06HPCFR"
PASS="qEBJjW3"
BASE="http://iptvtour.store:80"

# Output directory
OUT_DIR="$HOME/ciyaar/hls"
mkdir -p $OUT_DIR

# Channels
declare -A CHANNELS=(
    [1]="178437:nova-sport"
    [2]="45487:sky-sports-1"
    [3]="45491:sky-sports-2"
    [4]="9701:sky-main"
    [5]="9700:sky-football"
)

# WORKING HLS SETTINGS
# 6-second segments, 10 in playlist = 60 seconds buffer
# Segments kept for 3 extra cycles before deletion
HLS_TIME=6
HLS_LIST_SIZE=10
HLS_DELETE_THRESHOLD=3

start_channel() {
    local num=$1
    local info="${CHANNELS[$num]}"
    local id="${info%%:*}"
    local slug="${info#*:}"

    local source="$BASE/$USER/$PASS/$id"
    local out="$OUT_DIR/channel-$num"

    mkdir -p $out

    echo "[CH$num] Starting: $slug (ID: $id)"

    pm2 start ffmpeg \
        --name "ch$num" \
        -- \
        -reconnect 1 \
        -reconnect_streamed 1 \
        -reconnect_at_eof 1 \
        -reconnect_delay_max 5 \
        -i "$source" \
        -c:v copy \
        -c:a aac -b:a 128k \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_delete_threshold $HLS_DELETE_THRESHOLD \
        -hls_flags delete_segments \
        -hls_segment_filename "$out/seg_%05d.ts" \
        "$out/stream.m3u8"
}

case "$1" in
    start|on)
        echo "Starting streams..."
        pm2 delete all 2>/dev/null || true

        for i in {1..5}; do
            rm -rf $OUT_DIR/channel-$i/*.ts $OUT_DIR/channel-$i/*.m3u8 2>/dev/null || true
        done

        for i in {1..5}; do
            start_channel $i
            sleep 2
        done

        pm2 save

        echo ""
        echo "✓ All channels started"
        echo ""
        echo "CloudFront URLs:"
        echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
        echo ""
        ;;

    stop|off)
        echo "Stopping..."
        pm2 delete all 2>/dev/null || true
        pm2 save
        for i in {1..5}; do
            rm -rf $OUT_DIR/channel-$i/*.ts $OUT_DIR/channel-$i/*.m3u8 2>/dev/null || true
        done
        echo "✓ Stopped"
        ;;

    restart)
        $0 stop
        sleep 3
        $0 start
        ;;

    status)
        pm2 list
        echo ""
        for i in {1..5}; do
            if [ -f "$OUT_DIR/channel-$i/stream.m3u8" ]; then
                age=$(( $(date +%s) - $(stat -c %Y "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null || stat -f %m "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null) ))
                segs=$(ls -1 $OUT_DIR/channel-$i/*.ts 2>/dev/null | wc -l | xargs)
                if [ $age -lt 15 ]; then
                    echo "✓ Channel $i: LIVE ($segs segments, ${age}s ago)"
                else
                    echo "✗ Channel $i: STALE ($segs segments, ${age}s ago)"
                fi
            else
                echo "✗ Channel $i: NO PLAYLIST"
            fi
        done
        ;;

    test)
        echo "Testing channel 1..."
        echo ""
        curl http://localhost/channel-1/stream.m3u8
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|status|test}"
        exit 1
        ;;
esac
