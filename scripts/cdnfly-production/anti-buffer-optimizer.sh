#!/bin/bash

##############################################################################
# ANTI-BUFFER & LOOP OPTIMIZER
# Prevents buffering, looping, and stream interruptions
# Optimized for World Cup & Premier League live events
##############################################################################

set -e

STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"
OPTIMIZER_LOG="$LOGS_DIR/optimizer.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$OPTIMIZER_LOG"
}

optimize_channel() {
    local channel_num=$1
    local output_dir="$HLS_OUTPUT/channel-$channel_num"
    local playlist="$output_dir/playlist.m3u8"

    if [ ! -f "$playlist" ]; then
        return 1
    fi

    # Check for segment numbering issues (looping detection)
    local segments=($(ls -1 "$output_dir"/seg_*.ts 2>/dev/null | sort -V))
    if [ ${#segments[@]} -gt 0 ]; then
        # Get first and last segment numbers
        local first_seg=$(basename "${segments[0]}" | sed 's/seg_\([0-9]*\)\.ts/\1/')
        local last_seg=$(basename "${segments[-1]}" | sed 's/seg_\([0-9]*\)\.ts/\1/')

        # Check for excessive segment numbers (indicates looping)
        if [ "$last_seg" -gt 99999 ]; then
            log "⚠️  Channel $channel_num: Segment overflow detected ($last_seg) - Restarting..."
            pm2 restart "channel-$channel_num"
            sleep 5

            # Clean old segments
            rm -f "$output_dir"/seg_*.ts
            rm -f "$output_dir"/*.m3u8
            return 0
        fi

        # Check for gaps in segment sequence (buffer detection)
        local expected_count=$((10#$last_seg - 10#$first_seg + 1))
        local actual_count=${#segments[@]}

        if [ $actual_count -lt $((expected_count - 5)) ]; then
            log "⚠️  Channel $channel_num: Segment gaps detected - May cause buffering"
        fi
    fi

    # Check playlist staleness (downtime detection)
    local last_modified=$(stat -c %Y "$playlist" 2>/dev/null || stat -f %m "$playlist" 2>/dev/null)
    local current_time=$(date +%s)
    local age=$((current_time - last_modified))

    if [ $age -gt 15 ]; then
        log "🔴 Channel $channel_num: Playlist stale (${age}s) - Stream DOWN - Restarting..."
        pm2 restart "channel-$channel_num"
        return 0
    fi

    # Check for too many segments (disk space optimization)
    local segment_count=${#segments[@]}
    if [ $segment_count -gt 20 ]; then
        log "📦 Channel $channel_num: Too many segments ($segment_count) - Cleaning old files..."
        # Keep only latest 15 segments
        ls -1t "$output_dir"/seg_*.ts 2>/dev/null | tail -n +16 | xargs rm -f 2>/dev/null || true
    fi

    # Check bitrate consistency (quality optimization)
    if [ ${#segments[@]} -gt 5 ]; then
        local latest_seg="${segments[-1]}"
        local seg_size=$(stat -c %s "$latest_seg" 2>/dev/null || stat -f %z "$latest_seg" 2>/dev/null)

        # Expected size for 2s segment at ~4Mbps = ~1MB
        if [ $seg_size -lt 500000 ]; then
            log "⚠️  Channel $channel_num: Low bitrate detected (${seg_size} bytes) - Quality issue"
        elif [ $seg_size -gt 3000000 ]; then
            log "⚠️  Channel $channel_num: High bitrate detected (${seg_size} bytes) - May cause buffering on slow connections"
        fi
    fi

    return 0
}

# Main optimization loop
log "=== Anti-Buffer Optimizer Started ==="

for channel_num in {1..5}; do
    optimize_channel $channel_num
done

# System resource check
cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
cpu_int=${cpu_usage%.*}

if [ $cpu_int -gt 95 ]; then
    log "🔥 CRITICAL: CPU usage at ${cpu_usage}% - System overload!"
fi

mem_percent=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
mem_int=${mem_percent%.*}

if [ $mem_int -gt 95 ]; then
    log "🔥 CRITICAL: Memory usage at ${mem_percent}% - System overload!"
fi

# Network check (bandwidth)
rx_bytes_before=$(cat /sys/class/net/eth0/statistics/rx_bytes 2>/dev/null || echo 0)
tx_bytes_before=$(cat /sys/class/net/eth0/statistics/tx_bytes 2>/dev/null || echo 0)

sleep 1

rx_bytes_after=$(cat /sys/class/net/eth0/statistics/rx_bytes 2>/dev/null || echo 0)
tx_bytes_after=$(cat /sys/class/net/eth0/statistics/tx_bytes 2>/dev/null || echo 0)

rx_rate=$(( (rx_bytes_after - rx_bytes_before) * 8 / 1000000 )) # Mbps
tx_rate=$(( (tx_bytes_after - tx_bytes_before) * 8 / 1000000 )) # Mbps

log "📊 Network: RX ${rx_rate}Mbps, TX ${tx_rate}Mbps"

# Expected: ~20Mbps RX (5 channels @ 4Mbps), TX depends on viewers
if [ $tx_rate -gt 100 ]; then
    log "🚀 High traffic detected: ${tx_rate}Mbps - Popular match!"
fi

log "=== Optimization Complete ==="
