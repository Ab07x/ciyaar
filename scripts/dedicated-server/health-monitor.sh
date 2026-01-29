#!/bin/bash

##############################################################################
# HEALTH MONITOR
# Monitors stream health and auto-restarts failed streams
# Run as cron job: */1 * * * * /var/streaming/scripts/health-monitor.sh
##############################################################################

STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"
HEALTH_LOG="$LOGS_DIR/health-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $HEALTH_LOG
}

check_stream_health() {
    local channel_id=$1
    local output_dir="$HLS_OUTPUT/channel-$channel_id"
    local playlist="$output_dir/playlist.m3u8"

    # Check if playlist exists
    if [ ! -f "$playlist" ]; then
        log "WARNING: Channel $channel_id - Playlist missing"
        return 1
    fi

    # Check if playlist was updated in last 30 seconds
    local last_modified=$(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null)
    local current_time=$(date +%s)
    local age=$((current_time - last_modified))

    if [ $age -gt 30 ]; then
        log "WARNING: Channel $channel_id - Playlist stale ($age seconds old)"
        return 1
    fi

    # Check if there are recent segments
    local segment_count=$(ls -1 "$output_dir"/*.ts 2>/dev/null | wc -l)
    if [ $segment_count -lt 3 ]; then
        log "WARNING: Channel $channel_id - Insufficient segments ($segment_count)"
        return 1
    fi

    return 0
}

restart_unhealthy_stream() {
    local channel_id=$1
    log "RESTARTING: Channel $channel_id due to health check failure"

    # Restart via PM2
    pm2 restart "channel-$channel_id" 2>&1 | tee -a $HEALTH_LOG

    # Wait for stream to stabilize
    sleep 10
}

# Main monitoring loop
log "=== Health check started ==="

# Get list of running channels from PM2
running_channels=$(pm2 jlist | jq -r '.[] | select(.name | startswith("channel-")) | .name' | sed 's/channel-//')

for channel_id in $running_channels; do
    if ! check_stream_health $channel_id; then
        restart_unhealthy_stream $channel_id
    fi
done

# Check system resources
cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
cpu_int=${cpu_usage%.*}

if [ $cpu_int -gt 90 ]; then
    log "ALERT: High CPU usage: ${cpu_usage}%"
fi

mem_percent=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
mem_int=${mem_percent%.*}

if [ $mem_int -gt 90 ]; then
    log "ALERT: High memory usage: ${mem_percent}%"
fi

log "=== Health check completed ==="
