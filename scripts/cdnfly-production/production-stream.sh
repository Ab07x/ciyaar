#!/bin/bash

##############################################################################
# PRODUCTION-GRADE STREAMING - CIYAAR
# Handles 1k-16k concurrent viewers
# ZERO tolerance for failures
##############################################################################

set -e

# IPTV Credentials
USER="d06HPCFR"
PASS="qEBJjW3"
BASE="http://iptvtour.store:80"

# Output directory
OUT_DIR="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"
mkdir -p $OUT_DIR $LOG_DIR

# Production Channels
declare -A CHANNELS=(
    [1]="178437:nova-sport"      # Nova Sport (VERIFIED)
    [2]="45487:sky-sports-1"     # Sky Sports 1 (VERIFIED)
    [3]="45491:sky-sports-2"     # Sky Sports 2 (VERIFIED)
    [4]="9701:sky-main"          # Sky Sports Main Event
    [5]="9700:sky-football"      # Sky Sports Football
)

# PRODUCTION HLS SETTINGS - Optimized for 16k viewers
# 4-second segments = industry standard for live sports
# 6 segments = 24-second buffer (perfect balance)
HLS_TIME=4
HLS_LIST_SIZE=6
HLS_DELETE_THRESHOLD=1

# FFmpeg settings for MAXIMUM reliability
RECONNECT_OPTS="-reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 2"
INPUT_OPTS="-fflags +genpts+discardcorrupt+igndts -analyzeduration 2000000 -probesize 2000000"
OUTPUT_OPTS="-avoid_negative_ts make_zero -max_muxing_queue_size 1024"

start_channel() {
    local num=$1
    local info="${CHANNELS[$num]}"
    local id="${info%%:*}"
    local slug="${info#*:}"

    local source="$BASE/$USER/$PASS/$id"
    local out="$OUT_DIR/channel-$num"
    local log="$LOG_DIR/ch$num.log"

    mkdir -p $out

    echo "[CH$num] Starting: $slug (ID: $id)"

    # Use timestamp for unique segment names
    local start_num=$(date +%s)

    pm2 start ffmpeg \
        --name "ch$num" \
        --restart-delay 3000 \
        --max-restarts 99999 \
        -- \
        $RECONNECT_OPTS \
        $INPUT_OPTS \
        -i "$source" \
        -c:v copy \
        -c:a aac -b:a 128k -ar 48000 -ac 2 \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_delete_threshold $HLS_DELETE_THRESHOLD \
        -hls_flags delete_segments+append_list+omit_endlist+program_date_time+independent_segments \
        -hls_segment_type mpegts \
        -start_number $start_num \
        -hls_allow_cache 1 \
        -hls_segment_filename "$out/seg%d.ts" \
        $OUTPUT_OPTS \
        "$out/stream.m3u8" \
        >> "$log" 2>&1
}

case "$1" in
    start|on)
        echo "════════════════════════════════════════════════"
        echo "  STARTING PRODUCTION STREAMS"
        echo "  Target: 1k-16k concurrent viewers"
        echo "════════════════════════════════════════════════"
        echo ""

        # Stop any existing streams
        pm2 delete all 2>/dev/null || true

        # Clean old segments
        for i in {1..5}; do
            rm -f $OUT_DIR/channel-$i/*.ts $OUT_DIR/channel-$i/*.m3u8 2>/dev/null || true
        done

        # Start all channels
        for i in {1..5}; do
            start_channel $i
            sleep 2
        done

        pm2 save

        echo ""
        echo "════════════════════════════════════════════════"
        echo "✓ ALL STREAMS STARTED"
        echo "════════════════════════════════════════════════"
        echo ""
        echo "CloudFront URLs (PRODUCTION - use these):"
        echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-4/stream.m3u8"
        echo "  https://stream.cdnfly.online/channel-5/stream.m3u8"
        echo ""
        echo "Monitor: pm2 monit"
        echo "Logs:    pm2 logs"
        echo "Status:  $0 status"
        echo ""
        ;;

    stop|off)
        echo "Stopping all streams..."
        pm2 delete all 2>/dev/null || true
        pm2 save

        # Clean segments
        for i in {1..5}; do
            rm -f $OUT_DIR/channel-$i/*.ts $OUT_DIR/channel-$i/*.m3u8 2>/dev/null || true
        done

        echo "✓ All streams stopped"
        ;;

    restart)
        echo "Restarting all streams..."
        $0 stop
        sleep 3
        $0 start
        ;;

    status)
        echo "════════════════════════════════════════════════"
        echo "  STREAM STATUS"
        echo "════════════════════════════════════════════════"
        echo ""
        pm2 list
        echo ""
        echo "Channel Health:"
        for i in {1..5}; do
            if [ -f "$OUT_DIR/channel-$i/stream.m3u8" ]; then
                age=$(( $(date +%s) - $(stat -c %Y "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null || stat -f %m "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null) ))
                segs=$(ls -1 $OUT_DIR/channel-$i/*.ts 2>/dev/null | wc -l | xargs)
                size=$(du -sh $OUT_DIR/channel-$i/ 2>/dev/null | cut -f1)

                if [ $age -lt 10 ]; then
                    echo "  ✓ Channel $i: LIVE ($segs segments, ${age}s ago, $size)"
                else
                    echo "  ✗ Channel $i: STALE ($segs segments, ${age}s ago, $size)"
                fi
            else
                echo "  ✗ Channel $i: NO PLAYLIST"
            fi
        done
        echo ""
        echo "CloudFront Status:"
        curl -s -o /dev/null -w "  Status: %{http_code} | Time: %{time_total}s\n" https://stream.cdnfly.online/status
        echo ""
        ;;

    health)
        # Quick health check for monitoring
        all_healthy=1
        for i in {1..5}; do
            if [ -f "$OUT_DIR/channel-$i/stream.m3u8" ]; then
                age=$(( $(date +%s) - $(stat -c %Y "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null || stat -f %m "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null) ))
                if [ $age -gt 15 ]; then
                    all_healthy=0
                fi
            else
                all_healthy=0
            fi
        done

        if [ $all_healthy -eq 1 ]; then
            echo "HEALTHY"
            exit 0
        else
            echo "UNHEALTHY"
            exit 1
        fi
        ;;

    logs)
        tail -f $LOG_DIR/*.log
        ;;

    *)
        echo "CIYAAR Production Streaming Control"
        echo ""
        echo "Usage:"
        echo "  $0 start      Start all streams"
        echo "  $0 stop       Stop all streams"
        echo "  $0 restart    Restart all streams"
        echo "  $0 status     Show detailed status"
        echo "  $0 health     Quick health check"
        echo "  $0 logs       View live logs"
        echo ""
        exit 1
        ;;
esac
