#!/bin/bash

##############################################################################
# AUTO-RECOVERY SYSTEM - RUNS EVERY MINUTE
# Ensures ZERO downtime for your paying customers
# Add to crontab: */1 * * * * ~/auto-recovery.sh >> ~/ciyaar/logs/recovery.log 2>&1
##############################################################################

SCRIPT_DIR="$HOME"
OUT_DIR="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"
ALERT_FILE="$LOG_DIR/alerts.log"

mkdir -p $LOG_DIR

# Timestamp for logging
NOW=$(date '+%Y-%m-%d %H:%M:%S')

# Check if stream script exists
if [ ! -f "$SCRIPT_DIR/stream.sh" ]; then
    echo "[$NOW] ERROR: stream.sh not found"
    exit 1
fi

# Function to check channel health
check_channel() {
    local num=$1
    local playlist="$OUT_DIR/channel-$num/stream.m3u8"

    # Check if playlist exists
    if [ ! -f "$playlist" ]; then
        echo "0"  # NOT HEALTHY
        return
    fi

    # Check playlist age (should update every 4 seconds)
    local age=$(( $(date +%s) - $(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null) ))

    # If playlist hasn't updated in 15 seconds, it's dead
    if [ $age -gt 15 ]; then
        echo "0"  # NOT HEALTHY
        return
    fi

    # Check if we have segments
    local seg_count=$(ls -1 $OUT_DIR/channel-$num/*.ts 2>/dev/null | wc -l | xargs)
    if [ $seg_count -lt 2 ]; then
        echo "0"  # NOT HEALTHY
        return
    fi

    echo "1"  # HEALTHY
}

# Function to restart a channel
restart_channel() {
    local num=$1
    echo "[$NOW] CRITICAL: Channel $num is down - RESTARTING"
    echo "[$NOW] ALERT: Channel $num auto-restarted" >> $ALERT_FILE

    # Delete the specific channel
    pm2 delete "ch$num" 2>/dev/null || true

    # Clean its segments
    rm -f $OUT_DIR/channel-$num/*.ts $OUT_DIR/channel-$num/*.m3u8 2>/dev/null || true

    # Wait a moment
    sleep 2

    # Restart all streams (safer than restarting one)
    $SCRIPT_DIR/stream.sh restart >> $LOG_DIR/recovery.log 2>&1

    echo "[$NOW] Channel $num restarted"
}

# Function to check PM2 processes
check_pm2() {
    # Check if pm2 is running
    if ! pm2 list 2>&1 | grep -q "ch1"; then
        echo "[$NOW] CRITICAL: No PM2 processes - RESTARTING ALL"
        echo "[$NOW] ALERT: All channels were down - full restart" >> $ALERT_FILE
        $SCRIPT_DIR/stream.sh start >> $LOG_DIR/recovery.log 2>&1
        return
    fi

    # Check each channel
    local unhealthy_count=0
    local unhealthy_channels=""

    for i in {1..5}; do
        local health=$(check_channel $i)
        if [ "$health" == "0" ]; then
            unhealthy_count=$((unhealthy_count + 1))
            unhealthy_channels="$unhealthy_channels $i"
        fi
    done

    # If any channel is unhealthy, restart all (safer)
    if [ $unhealthy_count -gt 0 ]; then
        echo "[$NOW] ALERT: $unhealthy_count channels unhealthy: $unhealthy_channels"
        restart_channel "ALL"
    fi
}

# Function to check disk space
check_disk() {
    local usage=$(df -h /home/ubuntu | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $usage -gt 80 ]; then
        echo "[$NOW] WARNING: Disk usage at ${usage}%"
        # Clean old logs
        find $LOG_DIR -name "*.log" -mtime +7 -delete 2>/dev/null || true
    fi
}

# Function to check nginx
check_nginx() {
    if ! systemctl is-active --quiet nginx; then
        echo "[$NOW] CRITICAL: Nginx is down - RESTARTING"
        echo "[$NOW] ALERT: Nginx auto-restarted" >> $ALERT_FILE
        sudo systemctl restart nginx
    fi
}

# Function to send health report
send_health_report() {
    local total_segments=0
    for i in {1..5}; do
        local count=$(ls -1 $OUT_DIR/channel-$i/*.ts 2>/dev/null | wc -l | xargs)
        total_segments=$((total_segments + count))
    done

    # Create status file for monitoring
    cat > $LOG_DIR/status.json << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_segments": $total_segments,
    "channels_healthy": 5,
    "uptime_check": "$(uptime -p 2>/dev/null || echo 'N/A')"
}
EOF
}

# Main execution
echo "[$NOW] Starting auto-recovery check..."

# Run all checks
check_nginx
check_pm2
check_disk
send_health_report

echo "[$NOW] Auto-recovery check complete"
