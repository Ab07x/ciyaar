#!/bin/bash
#
# watchdog.sh - Auto-recovery watchdog for stale/dead streams
#
# Reads channel info from .channel_info files created by START.sh
# Add to crontab:
#   * * * * * /home/ubuntu/ciyaar/scripts/watchdog.sh
#   * * * * * sleep 30 && /home/ubuntu/ciyaar/scripts/watchdog.sh
#

IPTV_BASE="http://iptvtour.store:80/d06HPCFR/qEBJjW3"
HLS_BASE="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"
LOGFILE="$LOG_DIR/watchdog.log"
MAX_AGE=60

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"
}

restart_channel() {
    local channel=$1
    local channel_id=$2
    local channel_dir="$HLS_BASE/channel-$channel"
    local stream_url="$IPTV_BASE/$channel_id"
    local channel_log="$LOG_DIR/channel-$channel.log"

    # Kill existing process for this channel
    pkill -9 -f "channel-$channel" 2>/dev/null
    sleep 2

    # Recreate directory but preserve .channel_info
    local channel_info=""
    [ -f "$channel_dir/.channel_info" ] && channel_info=$(cat "$channel_dir/.channel_info")

    rm -rf "$channel_dir"
    mkdir -p "$channel_dir"

    [ -n "$channel_info" ] && echo "$channel_info" > "$channel_dir/.channel_info"

    # Restart channel
    (
        cd "$channel_dir" || exit 1
        while true; do
            nice -n -10 ffmpeg -hide_banner -loglevel warning \
                -fflags +genpts+discardcorrupt+igndts \
                -err_detect ignore_err \
                -reconnect 1 \
                -reconnect_streamed 1 \
                -reconnect_at_eof 1 \
                -reconnect_delay_max 10 \
                -timeout 10000000 \
                -rw_timeout 10000000 \
                -i "$stream_url" \
                -c:v libx264 -preset veryfast -crf 23 -maxrate 2500k -bufsize 5000k \
                -vf "scale=-2:720" \
                -c:a aac -b:a 128k \
                -f hls \
                -hls_time 10 \
                -hls_list_size 30 \
                -hls_delete_threshold 60 \
                -hls_segment_filename 'seg_%s_%%03d.ts' \
                -strftime 1 \
                -hls_flags delete_segments+append_list+second_level_segment_index \
                stream.m3u8 2>&1 >> "$channel_log"
            sleep 5
        done
    ) &

    log "Channel $channel: restarted with PID $!"
}

# Check each channel
for channel in 1 2 3 4 5; do
    channel_dir="$HLS_BASE/channel-$channel"
    info_file="$channel_dir/.channel_info"
    m3u8="$channel_dir/stream.m3u8"

    # Skip if no channel info (channel not configured)
    [ ! -f "$info_file" ] && continue

    # Get channel ID from info file
    channel_id=$(cat "$info_file" | cut -d'|' -f1)
    [ -z "$channel_id" ] && continue

    restart_needed=false

    if [ ! -f "$m3u8" ]; then
        log "Channel $channel: stream.m3u8 missing - restarting"
        restart_needed=true
    else
        # Check age
        if [ "$(uname)" == "Darwin" ]; then
            mod_time=$(stat -f %m "$m3u8" 2>/dev/null)
        else
            mod_time=$(stat -c %Y "$m3u8" 2>/dev/null)
        fi
        current_time=$(date +%s)
        age=$((current_time - mod_time))

        if [ $age -gt $MAX_AGE ]; then
            log "Channel $channel: stale (${age}s old) - restarting"
            restart_needed=true
        fi
    fi

    if [ "$restart_needed" = true ]; then
        restart_channel $channel $channel_id
    fi
done
