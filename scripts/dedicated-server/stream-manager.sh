#!/bin/bash

##############################################################################
# STREAM MANAGER
# Advanced stream management with start/stop/restart/status
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
STREAM_BASE="/var/streaming"
HLS_OUTPUT="$STREAM_BASE/hls"
LOGS_DIR="$STREAM_BASE/logs"
CONFIG_FILE="$STREAM_BASE/config/channels.json"

IPTV_USERNAME="d06HPCFR"
IPTV_PASSWORD="qEBJjW3"
IPTV_BASE_URL="http://iptvtour.store:80"

HLS_TIME=4
HLS_LIST_SIZE=6
HLS_DELETE_THRESHOLD=8
HLS_FLAGS="delete_segments+append_list+omit_endlist"

# Functions
show_header() {
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           STREAM MANAGER v1.0                         ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

list_channels() {
    echo -e "${BLUE}Available Channels:${NC}"
    echo ""
    jq -r '.channels[] | "\(.id). \(.name) - \(if .enabled then "ENABLED" else "DISABLED" end) (\(.priority))"' $CONFIG_FILE
    echo ""
}

get_channel_info() {
    local channel_id=$1
    CHANNEL_NAME=$(jq -r ".channels[] | select(.id==$channel_id) | .name" $CONFIG_FILE)
    STREAM_ID=$(jq -r ".channels[] | select(.id==$channel_id) | .stream_id" $CONFIG_FILE)
    IS_ENABLED=$(jq -r ".channels[] | select(.id==$channel_id) | .enabled" $CONFIG_FILE)
}

start_channel() {
    local channel_id=$1
    get_channel_info $channel_id

    if [ "$IS_ENABLED" != "true" ]; then
        echo -e "${YELLOW}Warning: Channel is disabled in config${NC}"
        read -p "Start anyway? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            return 1
        fi
    fi

    # Check if already running
    if pm2 list | grep -q "channel-$channel_id"; then
        echo -e "${YELLOW}Channel $channel_id is already running${NC}"
        return 1
    fi

    SOURCE_URL="$IPTV_BASE_URL/$IPTV_USERNAME/$IPTV_PASSWORD/$STREAM_ID"
    OUTPUT_DIR="$HLS_OUTPUT/channel-$channel_id"

    mkdir -p $OUTPUT_DIR

    echo -e "${BLUE}Starting: ${GREEN}$CHANNEL_NAME${NC}"
    echo -e "  URL: http://YOUR_SERVER_IP/channel-$channel_id/playlist.m3u8"

    pm2 start ffmpeg \
        --name "channel-$channel_id" \
        --interpreter none \
        --restart-delay 3000 \
        --max-restarts 50 \
        --log "$LOGS_DIR/channel-$channel_id.log" \
        -- \
        -loglevel warning \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -timeout 10000000 \
        -i "$SOURCE_URL" \
        -c:v copy \
        -c:a aac -b:a 128k -ar 48000 \
        -f hls \
        -hls_time $HLS_TIME \
        -hls_list_size $HLS_LIST_SIZE \
        -hls_delete_threshold $HLS_DELETE_THRESHOLD \
        -hls_flags $HLS_FLAGS \
        -hls_segment_type mpegts \
        -hls_segment_filename "$OUTPUT_DIR/segment_%05d.ts" \
        -master_pl_name "master.m3u8" \
        "$OUTPUT_DIR/playlist.m3u8"

    pm2 save
    echo -e "${GREEN}✓ Started successfully${NC}"
}

stop_channel() {
    local channel_id=$1
    get_channel_info $channel_id

    echo -e "${YELLOW}Stopping: $CHANNEL_NAME${NC}"
    pm2 delete "channel-$channel_id" 2>/dev/null || echo "Channel not running"

    # Clean up HLS files
    rm -f $HLS_OUTPUT/channel-$channel_id/*.ts
    rm -f $HLS_OUTPUT/channel-$channel_id/*.m3u8

    pm2 save
    echo -e "${GREEN}✓ Stopped${NC}"
}

restart_channel() {
    local channel_id=$1
    get_channel_info $channel_id

    echo -e "${YELLOW}Restarting: $CHANNEL_NAME${NC}"
    stop_channel $channel_id
    sleep 2
    start_channel $channel_id
}

show_status() {
    echo -e "${BLUE}Stream Status:${NC}"
    echo ""
    pm2 list
    echo ""

    echo -e "${BLUE}System Resources:${NC}"
    echo -e "  CPU: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
    echo -e "  RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
    echo -e "  Disk: $(df -h $STREAM_BASE | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
    echo ""

    echo -e "${BLUE}Network Traffic (current session):${NC}"
    vnstat -i eth0 --oneline 2>/dev/null | awk -F';' '{print "  RX: " $4 " | TX: " $5}' || echo "  vnstat not configured"
    echo ""
}

show_logs() {
    local channel_id=$1
    if [ -z "$channel_id" ]; then
        pm2 logs
    else
        pm2 logs "channel-$channel_id"
    fi
}

enable_channel() {
    local channel_id=$1
    jq ".channels[$((channel_id-1))].enabled = true" $CONFIG_FILE > /tmp/channels.json
    mv /tmp/channels.json $CONFIG_FILE
    echo -e "${GREEN}✓ Channel $channel_id enabled${NC}"
}

disable_channel() {
    local channel_id=$1
    jq ".channels[$((channel_id-1))].enabled = false" $CONFIG_FILE > /tmp/channels.json
    mv /tmp/channels.json $CONFIG_FILE
    echo -e "${GREEN}✓ Channel $channel_id disabled${NC}"
}

show_help() {
    cat << EOF
${GREEN}Stream Manager - Usage:${NC}

${YELLOW}Channel Management:${NC}
  $0 start <channel_id>     Start a specific channel
  $0 stop <channel_id>      Stop a specific channel
  $0 restart <channel_id>   Restart a specific channel

${YELLOW}Bulk Operations:${NC}
  $0 start-all              Start all enabled channels
  $0 stop-all               Stop all running channels
  $0 restart-all            Restart all channels

${YELLOW}Configuration:${NC}
  $0 enable <channel_id>    Enable channel in config
  $0 disable <channel_id>   Disable channel in config
  $0 list                   List all channels

${YELLOW}Monitoring:${NC}
  $0 status                 Show stream status and resources
  $0 logs [channel_id]      Show logs (all or specific channel)
  $0 monitor                Live monitoring (PM2 monit)

${YELLOW}Examples:${NC}
  $0 start 1                Start Sky Sports Main Event
  $0 restart-all            Restart all channels
  $0 logs 3                 View logs for channel 3

EOF
}

# Main script
show_header

case "${1:-}" in
    start)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel ID required${NC}"
            echo "Usage: $0 start <channel_id>"
            exit 1
        fi
        start_channel $2
        ;;

    stop)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel ID required${NC}"
            echo "Usage: $0 stop <channel_id>"
            exit 1
        fi
        stop_channel $2
        ;;

    restart)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel ID required${NC}"
            echo "Usage: $0 restart <channel_id>"
            exit 1
        fi
        restart_channel $2
        ;;

    start-all)
        ./start-all-streams.sh
        ;;

    stop-all)
        echo -e "${YELLOW}Stopping all streams...${NC}"
        pm2 delete all
        pm2 save
        echo -e "${GREEN}✓ All streams stopped${NC}"
        ;;

    restart-all)
        echo -e "${YELLOW}Restarting all streams...${NC}"
        pm2 restart all
        echo -e "${GREEN}✓ All streams restarted${NC}"
        ;;

    enable)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel ID required${NC}"
            exit 1
        fi
        enable_channel $2
        ;;

    disable)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel ID required${NC}"
            exit 1
        fi
        disable_channel $2
        ;;

    list)
        list_channels
        ;;

    status)
        show_status
        ;;

    logs)
        show_logs $2
        ;;

    monitor)
        pm2 monit
        ;;

    help|--help|-h|"")
        show_help
        ;;

    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
