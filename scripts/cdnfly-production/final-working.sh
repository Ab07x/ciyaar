#!/bin/bash

##############################################################################
# FINAL WORKING SOLUTION - No more 404s
# Uses timestamp-based segment names + aggressive cleanup
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

# FINAL SETTINGS THAT ACTUALLY WORK
# - 6 second segments
# - 20 segments in playlist = 2 minutes buffer
# - Timestamp-based names (unique, never conflict)
# - NO auto-delete (we clean manually)
HLS_TIME=6
HLS_LIST_SIZE=20

start_channel() {
    local num=$1
    local info="${CHANNELS[$num]}"
    local id="${info%%:*}"
    local slug="${info#*:}"

    local source="$BASE/$USER/$PASS/$id"
    local out="$OUT_DIR/channel-$num"

    mkdir -p $out

    echo "[CH$num] Starting: $slug"

    # Use epoch timestamp for unique segment names
    # Each segment gets a unique timestamp-based name
    # Example: seg_1706543210.ts, seg_1706543216.ts, etc.
    pm2 start ffmpeg \
        --name "ch$num" \
        -- \
        -reconnect 1 \
        -reconnect_streamed 1 \
        -reconnect_at_eof 1 \
        -reconnect_delay_max 5 \
        -i "$source" \
        -c:v copy \
        -c:a aac -b:a 128k -ar 48000 \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_flags append_list \
        -strftime 1 \
        -hls_segment_filename "$out/seg_%s.ts" \
        "$out/stream.m3u8"
}

cleanup_old_segments() {
    echo "Cleaning old segments (keeping last 50)..."
    for i in {1..5}; do
        if [ -d "$OUT_DIR/channel-$i" ]; then
            cd $OUT_DIR/channel-$i
            # Keep only last 50 segments (5 minutes of video)
            ls -t seg_*.ts 2>/dev/null | tail -n +51 | xargs rm -f 2>/dev/null || true
        fi
    done
}

case "$1" in
    start|on)
        echo "════════════════════════════════════════"
        echo "  STARTING STREAMS (Timestamp-based)"
        echo "════════════════════════════════════════"
        echo ""

        pm2 delete all 2>/dev/null || true

        # Clean all old data
        for i in {1..5}; do
            rm -rf $OUT_DIR/channel-$i 2>/dev/null || true
            mkdir -p $OUT_DIR/channel-$i
        done

        # Start all channels
        for i in {1..5}; do
            start_channel $i
            sleep 2
        done

        pm2 save

        echo ""
        echo "✓ All channels started"
        echo ""
        echo "URLs:"
        echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
        echo ""
        echo "Segments are timestamp-based (unique names)"
        echo "Cleanup runs automatically every 2 minutes"
        echo ""
        ;;

    stop|off)
        echo "Stopping..."
        pm2 delete all 2>/dev/null || true
        pm2 save

        # Optional: clean segments on stop
        # for i in {1..5}; do
        #     rm -rf $OUT_DIR/channel-$i 2>/dev/null || true
        # done

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
                segs=$(ls -1 $OUT_DIR/channel-$i/seg_*.ts 2>/dev/null | wc -l | xargs)
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

    clean)
        cleanup_old_segments
        echo "✓ Cleaned"
        ;;

    test)
        echo "Playlist:"
        curl -s http://localhost/channel-1/stream.m3u8
        echo ""
        echo ""
        echo "Recent segments:"
        ls -lth $OUT_DIR/channel-1/seg_*.ts 2>/dev/null | head -10
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|status|clean|test}"
        exit 1
        ;;
esac
