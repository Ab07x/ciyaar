#!/bin/bash

##############################################################################
# SIMPLE SOLUTION - JUST WORKS
# Based on your working ~/prod script
# Optimized for 5 channels + CloudFront
##############################################################################

USER="d06HPCFR"
PASS="qEBJjW3"
BASE="http://iptvtour.store:80"
OUT_DIR="$HOME/ciyaar/hls"

declare -A CHANNELS=(
    [1]="178437:nova-sport"
    [2]="45487:sky-sports-1"
    [3]="45491:sky-sports-2"
    [4]="9701:sky-main"
    [5]="9700:sky-football"
)

start_channel() {
    local num=$1
    local info="${CHANNELS[$num]}"
    local id="${info%%:*}"
    local name="${info#*:}"

    local url="$BASE/$USER/$PASS/$id"
    local dir="$OUT_DIR/channel-$num"

    mkdir -p $dir
    cd $dir

    echo "Starting channel $num: $name"

    # SIMPLE FFmpeg command - NO BULLSHIT
    # Just like your ~/prod script but optimized
    pm2 start ffmpeg --name "ch$num" -- \
        -i "$url" \
        -c copy \
        -f hls \
        -hls_time 4 \
        -hls_list_size 6 \
        -hls_wrap 12 \
        -hls_flags delete_segments \
        -hls_segment_filename "seg%03d.ts" \
        stream.m3u8
}

case "$1" in
    start)
        echo "Starting all 5 channels..."
        pm2 delete all 2>/dev/null || true

        for i in {1..5}; do
            rm -rf $OUT_DIR/channel-$i
            start_channel $i
        done

        pm2 save
        echo ""
        echo "DONE! URLs:"
        echo "https://stream.cdnfly.online/channel-1/stream.m3u8"
        echo "https://stream.cdnfly.online/channel-2/stream.m3u8"
        echo "https://stream.cdnfly.online/channel-3/stream.m3u8"
        ;;

    stop)
        pm2 delete all
        pm2 save
        ;;

    status)
        pm2 list
        ;;

    *)
        echo "Usage: $0 {start|stop|status}"
        ;;
esac
