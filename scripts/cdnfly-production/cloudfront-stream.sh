#!/bin/bash

##############################################################################
# CLOUDFRONT-OPTIMIZED STREAMING
# Keeps segments MUCH longer for CloudFront caching
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

# CLOUDFRONT-OPTIMIZED SETTINGS
# 6-second segments
# 15 segments in playlist = 90 seconds of video
# Keep segments for 30 extra segments (3 minutes!) before deletion
# This gives CloudFront plenty of time to cache
HLS_TIME=6
HLS_LIST_SIZE=15
HLS_DELETE_THRESHOLD=30

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
        echo "══════════════════════════════════════════"
        echo "  STARTING CLOUDFRONT-OPTIMIZED STREAMS"
        echo "══════════════════════════════════════════"
        echo ""
        echo "Settings:"
        echo "  • 6 second segments"
        echo "  • 90 second buffer (15 segments)"
        echo "  • Segments kept for 3 minutes"
        echo "  • CloudFront-safe"
        echo ""

        pm2 delete all 2>/dev/null || true

        for i in {1..5}; do
            rm -rf $OUT_DIR/channel-$i 2>/dev/null || true
            mkdir -p $OUT_DIR/channel-$i
        done

        for i in {1..5}; do
            start_channel $i
            sleep 2
        done

        pm2 save

        echo ""
        echo "✓ All channels started"
        echo ""
        echo "CloudFront URLs (use these):"
        echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
        echo ""
        echo "Monitor: pm2 list"
        echo ""
        ;;

    stop|off)
        echo "Stopping..."
        pm2 delete all 2>/dev/null || true
        pm2 save
        for i in {1..5}; do
            rm -rf $OUT_DIR/channel-$i 2>/dev/null || true
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
        echo "Channel Status:"
        for i in {1..5}; do
            if [ -f "$OUT_DIR/channel-$i/stream.m3u8" ]; then
                age=$(( $(date +%s) - $(stat -c %Y "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null || stat -f %m "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null) ))
                segs=$(ls -1 $OUT_DIR/channel-$i/*.ts 2>/dev/null | wc -l | xargs)
                size=$(du -sh $OUT_DIR/channel-$i 2>/dev/null | cut -f1)

                if [ $age -lt 15 ]; then
                    echo "  ✓ Channel $i: LIVE ($segs segments, ${age}s ago, $size)"
                else
                    echo "  ✗ Channel $i: STALE ($segs segments, ${age}s ago, $size)"
                fi
            else
                echo "  ✗ Channel $i: NO PLAYLIST"
            fi
        done
        echo ""
        ;;

    test)
        echo "Testing channel 1 playlist..."
        echo ""
        curl -s http://localhost/channel-1/stream.m3u8
        echo ""
        echo ""
        echo "Segment files on disk:"
        ls -lh $OUT_DIR/channel-1/*.ts 2>/dev/null | tail -10
        ;;

    clean)
        echo "Cleaning old segments (keeping last 20)..."
        for i in {1..5}; do
            if [ -d "$OUT_DIR/channel-$i" ]; then
                cd $OUT_DIR/channel-$i
                # Keep only last 20 segments
                ls -t *.ts 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true
            fi
        done
        echo "✓ Cleaned"
        ;;

    *)
        echo "CloudFront Streaming Control"
        echo ""
        echo "Usage:"
        echo "  $0 start    - Start all streams"
        echo "  $0 stop     - Stop all streams"
        echo "  $0 restart  - Restart all"
        echo "  $0 status   - Show status"
        echo "  $0 test     - Test channel 1"
        echo "  $0 clean    - Clean old segments"
        echo ""
        exit 1
        ;;
esac
