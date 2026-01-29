#!/bin/bash

##############################################################################
# REAL-TIME MONITORING DASHBOARD
# Shows live status of your production streams
##############################################################################

OUT_DIR="$HOME/ciyaar/hls"
LOG_DIR="$HOME/ciyaar/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

while true; do
    clear

    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                     CIYAAR PRODUCTION DASHBOARD                               ║${NC}"
    echo -e "${GREEN}║                     $(date '+%Y-%m-%d %H:%M:%S %Z')                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # System Stats
    echo -e "${CYAN}═══ SYSTEM RESOURCES ═══${NC}"
    echo -e "  CPU:    $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% used"
    echo -e "  Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
    echo -e "  Disk:   $(df -h /home/ubuntu | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
    echo -e "  Load:   $(uptime | awk -F'load average:' '{print $2}')"
    echo ""

    # Nginx Stats
    echo -e "${CYAN}═══ NGINX STATUS ═══${NC}"
    if systemctl is-active --quiet nginx; then
        echo -e "  Status: ${GREEN}● RUNNING${NC}"
        # Get nginx connections (if stub_status is enabled)
        if curl -s http://localhost/nginx_status 2>/dev/null | grep -q "Active"; then
            local active=$(curl -s http://localhost/nginx_status 2>/dev/null | grep "Active" | awk '{print $3}')
            echo -e "  Active connections: $active"
        fi
    else
        echo -e "  Status: ${RED}● DOWN${NC}"
    fi
    echo ""

    # PM2 Processes
    echo -e "${CYAN}═══ STREAM PROCESSES ═══${NC}"
    pm2 jlist 2>/dev/null | jq -r '.[] | "  \(.name): \(.pm2_env.status) (restarts: \(.pm2_env.restart_time), uptime: \(.pm2_env.pm_uptime))"' 2>/dev/null || \
        echo "  PM2 data not available"
    echo ""

    # Channel Health
    echo -e "${CYAN}═══ CHANNEL HEALTH ═══${NC}"
    printf "  %-10s %-10s %-12s %-15s %-10s\n" "CHANNEL" "STATUS" "SEGMENTS" "LAST UPDATE" "SIZE"
    printf "  ${BLUE}%-10s %-10s %-12s %-15s %-10s${NC}\n" "----------" "----------" "------------" "---------------" "----------"

    for i in {1..5}; do
        if [ -f "$OUT_DIR/channel-$i/stream.m3u8" ]; then
            age=$(( $(date +%s) - $(stat -c %Y "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null || stat -f %m "$OUT_DIR/channel-$i/stream.m3u8" 2>/dev/null) ))
            segs=$(ls -1 $OUT_DIR/channel-$i/*.ts 2>/dev/null | wc -l | xargs)
            size=$(du -sh $OUT_DIR/channel-$i/ 2>/dev/null | cut -f1)

            if [ $age -lt 10 ]; then
                status="${GREEN}● LIVE${NC}"
            else
                status="${RED}● STALE${NC}"
            fi

            printf "  %-18s %-20s %-12s %-15s %-10s\n" "Channel $i" "$status" "$segs" "${age}s ago" "$size"
        else
            printf "  %-18s ${RED}%-20s${NC} %-12s %-15s %-10s\n" "Channel $i" "● NO DATA" "-" "-" "-"
        fi
    done
    echo ""

    # CloudFront Test
    echo -e "${CYAN}═══ CLOUDFRONT STATUS ═══${NC}"
    response_time=$(curl -s -o /dev/null -w "%{time_total}" https://stream.cdnfly.online/health 2>/dev/null || echo "N/A")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" https://stream.cdnfly.online/health 2>/dev/null || echo "N/A")

    if [ "$http_code" == "200" ]; then
        echo -e "  Status: ${GREEN}● HEALTHY${NC}"
        echo -e "  Response time: ${response_time}s"
    else
        echo -e "  Status: ${RED}● ERROR (HTTP $http_code)${NC}"
    fi
    echo ""

    # Recent Errors
    echo -e "${CYAN}═══ RECENT ERRORS (last 5) ═══${NC}"
    if [ -f "$LOG_DIR/recovery.log" ]; then
        tail -5 $LOG_DIR/recovery.log 2>/dev/null | sed 's/^/  /' || echo "  No errors logged"
    else
        echo "  No error log found"
    fi
    echo ""

    # Network Stats
    echo -e "${CYAN}═══ NETWORK STATS ═══${NC}"
    rx_bytes=$(cat /sys/class/net/$(ip route | grep default | awk '{print $5}')/statistics/rx_bytes 2>/dev/null || echo 0)
    tx_bytes=$(cat /sys/class/net/$(ip route | grep default | awk '{print $5}')/statistics/tx_bytes 2>/dev/null || echo 0)
    rx_mb=$(echo "scale=2; $rx_bytes / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
    tx_mb=$(echo "scale=2; $tx_bytes / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
    echo -e "  Total RX: ${rx_mb} MB"
    echo -e "  Total TX: ${tx_mb} MB"
    echo ""

    # URLs
    echo -e "${CYAN}═══ YOUR PRODUCTION URLS ═══${NC}"
    echo -e "  ${YELLOW}https://stream.cdnfly.online/channel-1/stream.m3u8${NC}"
    echo -e "  ${YELLOW}https://stream.cdnfly.online/channel-2/stream.m3u8${NC}"
    echo -e "  ${YELLOW}https://stream.cdnfly.online/channel-3/stream.m3u8${NC}"
    echo ""

    echo -e "${BLUE}Refreshing in 5 seconds... (Ctrl+C to exit)${NC}"
    sleep 5
done
