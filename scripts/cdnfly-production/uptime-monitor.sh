#!/bin/bash

##############################################################################
# UPTIME MONITORING & AUTO-RECOVERY
# Real-time monitoring with instant recovery for live sports
# Runs every 30 seconds via cron
##############################################################################

STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"
UPTIME_LOG="$LOGS_DIR/uptime.log"
STATUS_FILE="$STREAM_BASE/status.json"

# Notification settings (optional)
WEBHOOK_URL=""  # Add your Discord/Slack webhook URL

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$UPTIME_LOG"
}

send_alert() {
    local message="$1"
    log "🚨 ALERT: $message"

    # Send to webhook if configured
    if [ ! -z "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$message\"}" \
            >/dev/null 2>&1 || true
    fi
}

check_channel_uptime() {
    local channel_num=$1
    local output_dir="$HLS_OUTPUT/channel-$channel_num"
    local playlist="$output_dir/playlist.m3u8"

    local status="DOWN"
    local age=999
    local segments=0
    local health="CRITICAL"

    if [ -f "$playlist" ]; then
        age=$(( $(date +%s) - $(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null) ))
        segments=$(ls -1 "$output_dir"/*.ts 2>/dev/null | wc -l)

        if [ $age -lt 5 ]; then
            status="LIVE"
            health="HEALTHY"
        elif [ $age -lt 15 ]; then
            status="LIVE"
            health="WARNING"
        else
            status="DOWN"
            health="CRITICAL"

            # Auto-restart if down for more than 15 seconds
            send_alert "Channel $channel_num is DOWN (${age}s stale) - Auto-restarting..."
            pm2 restart "channel-$channel_num" 2>&1 | tee -a "$UPTIME_LOG"

            # Clean stale files
            rm -f "$output_dir"/seg_*.ts
            rm -f "$output_dir"/*.m3u8

            sleep 3
            return 1
        fi
    else
        status="DOWN"
        health="CRITICAL"
        send_alert "Channel $channel_num has NO PLAYLIST - Restarting..."
        pm2 restart "channel-$channel_num" 2>&1 | tee -a "$UPTIME_LOG"
        return 1
    fi

    # Update status JSON
    jq --arg ch "channel_$channel_num" \
       --arg status "$status" \
       --arg health "$health" \
       --argjson age "$age" \
       --argjson segments "$segments" \
       '.channels[$ch] = {status: $status, health: $health, age: $age, segments: $segments, last_check: now}' \
       "$STATUS_FILE" > "$STATUS_FILE.tmp" 2>/dev/null && mv "$STATUS_FILE.tmp" "$STATUS_FILE" || true

    if [ "$health" = "HEALTHY" ]; then
        log "✅ Channel $channel_num: $status ($segments segments, ${age}s ago)"
    elif [ "$health" = "WARNING" ]; then
        log "⚠️  Channel $channel_num: $status ($segments segments, ${age}s ago)"
    fi

    return 0
}

# Initialize status file
if [ ! -f "$STATUS_FILE" ]; then
    echo '{"channels":{}}' > "$STATUS_FILE"
fi

# Check all channels
log "=== Uptime Check Started ==="

TOTAL_UP=0
TOTAL_DOWN=0

for channel_num in {1..5}; do
    if check_channel_uptime $channel_num; then
        TOTAL_UP=$((TOTAL_UP + 1))
    else
        TOTAL_DOWN=$((TOTAL_DOWN + 1))
    fi
done

# Overall status
UPTIME_PERCENT=$(( TOTAL_UP * 100 / 5 ))

log "📊 Status: $TOTAL_UP/5 UP, $TOTAL_DOWN/5 DOWN (${UPTIME_PERCENT}% uptime)"

# Critical alert if more than 2 channels down
if [ $TOTAL_DOWN -gt 2 ]; then
    send_alert "CRITICAL: $TOTAL_DOWN/5 channels are DOWN! Uptime: ${UPTIME_PERCENT}%"
fi

# System resource monitoring
CPU=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
MEM=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')

log "💻 System: CPU ${CPU}%, RAM ${MEM}%"

# Update status JSON with system info
jq --argjson uptime "$UPTIME_PERCENT" \
   --arg cpu "$CPU" \
   --arg mem "$MEM" \
   '.system = {uptime: $uptime, cpu: $cpu, memory: $mem, last_update: now}' \
   "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"

log "=== Uptime Check Complete ==="

# Rotate logs if too large (>10MB)
if [ -f "$UPTIME_LOG" ]; then
    LOG_SIZE=$(stat -c %s "$UPTIME_LOG" 2>/dev/null || stat -f %z "$UPTIME_LOG" 2>/dev/null)
    if [ $LOG_SIZE -gt 10485760 ]; then
        mv "$UPTIME_LOG" "$UPTIME_LOG.old"
        log "📦 Log rotated (was $(($LOG_SIZE / 1024 / 1024))MB)"
    fi
fi
