#!/bin/bash
# ==============================================================================
# FANBROJ CHANNEL MANAGER
# ==============================================================================
# Manage IPTV channels with PM2 - Start, Stop, Restart, List
#
# Usage:
#   ./channel-manager.sh start <slug> <channel_id>
#   ./channel-manager.sh stop <slug>
#   ./channel-manager.sh restart <slug>
#   ./channel-manager.sh list
#   ./channel-manager.sh logs <slug>
#   ./channel-manager.sh status
#   ./channel-manager.sh test <channel_id>
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$HOME/ciyaar/config/iptv.conf"
STREAM_SCRIPT="$SCRIPT_DIR/start-247-channel.sh"
HLS_DIR="/var/www/html/hls"
LOG_DIR="$HOME/ciyaar/logs"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    # Default values
    IPTV_USERNAME="jUpu92sC"
    IPTV_PASSWORD="gEjWzKe"
    IPTV_HOST="iptvtour.store"
fi

# Ensure directories exist
mkdir -p "$LOG_DIR"

# ==============================================================================
# FUNCTIONS
# ==============================================================================

show_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           FANBROJ CHANNEL MANAGER v2.0                       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_help() {
    show_banner
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start <slug> <channel_id>   Start a new channel"
    echo "  stop <slug>                 Stop a running channel"
    echo "  restart <slug>              Restart a channel"
    echo "  delete <slug>               Delete channel from PM2"
    echo "  list                        List all running channels"
    echo "  logs <slug>                 View logs for a channel"
    echo "  status                      Show detailed status"
    echo "  test <channel_id>           Test if channel ID works"
    echo "  find <search_term>          Search for channels"
    echo "  url <slug>                  Get stream URL for channel"
    echo "  save                        Save PM2 configuration"
    echo ""
    echo "Examples:"
    echo "  $0 start universal 12345"
    echo "  $0 stop universal"
    echo "  $0 find \"bein sport\""
    echo "  $0 list"
    echo ""
}

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Get server IP (prefer CloudFront domain if configured)
get_server_ip() {
    # Load config to check for CloudFront
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
    
    # If CloudFront is configured, use it
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        echo "$CLOUDFRONT_DOMAIN"
        return
    fi
    
    # Otherwise return the public IP
    curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost"
}

# Get the protocol (https for CloudFront, http for direct)
get_protocol() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
    
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        echo "https"
    else
        echo "http"
    fi
}

# Start a channel
start_channel() {
    local SLUG=$1
    local CHANNEL_ID=$2
    
    if [ -z "$SLUG" ] || [ -z "$CHANNEL_ID" ]; then
        log_error "Usage: $0 start <slug> <channel_id>"
        exit 1
    fi
    
    # Check if already running
    if pm2 describe "ch-$SLUG" > /dev/null 2>&1; then
        log_warn "Channel '$SLUG' is already running. Use 'restart' to restart it."
        return 1
    fi
    
    # Construct stream URL
    local STREAM_URL="http://$IPTV_HOST/live/$IPTV_USERNAME/$IPTV_PASSWORD/$CHANNEL_ID.ts"
    
    echo ""
    log_info "Starting channel: $SLUG"
    log_info "Channel ID: $CHANNEL_ID"
    log_info "Source: http://$IPTV_HOST/live/****/****/$CHANNEL_ID.ts"
    echo ""
    
    # Start with PM2
    pm2 start "$STREAM_SCRIPT" \
        --name "ch-$SLUG" \
        --interpreter bash \
        --log "$LOG_DIR/$SLUG.log" \
        --time \
        -- "$SLUG" "$STREAM_URL"
    
    # Wait for stream to initialize
    sleep 3
    
    # Check if stream is working
    if [ -f "$HLS_DIR/$SLUG/index.m3u8" ]; then
        local SERVER_IP=$(get_server_ip)
        local PROTOCOL=$(get_protocol)
        echo ""
        log_success "Channel '$SLUG' started successfully!"
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo -e "  ${GREEN}Stream URL:${NC} ${PROTOCOL}://$SERVER_IP/hls/$SLUG/index.m3u8"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
    else
        log_warn "Channel started but stream not yet available. Check logs with: $0 logs $SLUG"
    fi
    
    # Save PM2 config
    pm2 save --force > /dev/null 2>&1
}

# Stop a channel
stop_channel() {
    local SLUG=$1
    
    if [ -z "$SLUG" ]; then
        log_error "Usage: $0 stop <slug>"
        exit 1
    fi
    
    if ! pm2 describe "ch-$SLUG" > /dev/null 2>&1; then
        log_error "Channel '$SLUG' is not running"
        return 1
    fi
    
    pm2 stop "ch-$SLUG"
    log_success "Channel '$SLUG' stopped"
    
    # Clean up HLS files
    rm -rf "$HLS_DIR/$SLUG" 2>/dev/null
    log_info "HLS files cleaned up"
}

# Restart a channel
restart_channel() {
    local SLUG=$1
    
    if [ -z "$SLUG" ]; then
        log_error "Usage: $0 restart <slug>"
        exit 1
    fi
    
    if ! pm2 describe "ch-$SLUG" > /dev/null 2>&1; then
        log_error "Channel '$SLUG' is not running"
        return 1
    fi
    
    # Clean HLS files before restart
    rm -rf "$HLS_DIR/$SLUG"/*.ts 2>/dev/null
    rm -rf "$HLS_DIR/$SLUG"/*.m3u8 2>/dev/null
    
    pm2 restart "ch-$SLUG"
    log_success "Channel '$SLUG' restarted"
}

# Delete a channel
delete_channel() {
    local SLUG=$1
    
    if [ -z "$SLUG" ]; then
        log_error "Usage: $0 delete <slug>"
        exit 1
    fi
    
    pm2 delete "ch-$SLUG" 2>/dev/null
    rm -rf "$HLS_DIR/$SLUG" 2>/dev/null
    log_success "Channel '$SLUG' deleted"
    pm2 save --force > /dev/null 2>&1
}

# List all channels
list_channels() {
    show_banner
    echo "Running Channels:"
    echo "═══════════════════════════════════════════════════════════════"
    
    # Get PM2 list
    local CHANNELS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name | startswith("ch-")) | .name' 2>/dev/null)
    
    if [ -z "$CHANNELS" ]; then
        log_warn "No channels running"
        echo ""
        echo "Start a channel with: $0 start <slug> <channel_id>"
        return
    fi
    
    local SERVER_IP=$(get_server_ip)
    local PROTOCOL=$(get_protocol)
    
    echo ""
    printf "%-15s %-10s %-10s %-50s\n" "CHANNEL" "STATUS" "UPTIME" "STREAM URL"
    echo "───────────────────────────────────────────────────────────────────────────────────────"
    
    pm2 jlist 2>/dev/null | jq -r '.[] | select(.name | startswith("ch-")) | "\(.name)|\(.pm2_env.status)|\(.pm2_env.pm_uptime)"' 2>/dev/null | while IFS='|' read -r name status uptime; do
        local slug="${name#ch-}"
        local uptime_human=""
        
        if [ "$uptime" != "null" ] && [ -n "$uptime" ]; then
            local now=$(date +%s%3N)
            local diff=$(( (now - uptime) / 1000 ))
            if [ $diff -lt 60 ]; then
                uptime_human="${diff}s"
            elif [ $diff -lt 3600 ]; then
                uptime_human="$((diff/60))m"
            else
                uptime_human="$((diff/3600))h"
            fi
        fi
        
        local status_color="${GREEN}"
        [ "$status" != "online" ] && status_color="${RED}"
        
        printf "%-15s ${status_color}%-10s${NC} %-10s ${PROTOCOL}://%s/hls/%s/index.m3u8\n" "$slug" "$status" "$uptime_human" "$SERVER_IP" "$slug"
    done
    
    echo ""
}

# Show detailed status
show_status() {
    show_banner
    
    echo "System Status:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # CPU and Memory
    echo "Resources:"
    echo "──────────"
    echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% used"
    echo "  RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
    echo "  Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
    echo ""
    
    # Network
    echo "Network:"
    echo "────────"
    local SERVER_IP=$(get_server_ip)
    echo "  Server IP: $SERVER_IP"
    echo "  Nginx: $(systemctl is-active nginx)"
    echo ""
    
    # Bandwidth (if vnstat available)
    if command -v vnstat &> /dev/null; then
        echo "Bandwidth (Today):"
        echo "──────────────────"
        vnstat -d 1 2>/dev/null | tail -3 | head -1 || echo "  No data yet"
        echo ""
    fi
    
    # PM2 Status
    echo "PM2 Processes:"
    echo "──────────────"
    pm2 list
    echo ""
    
    # Active Streams
    echo "Active HLS Streams:"
    echo "───────────────────"
    for dir in "$HLS_DIR"/*/; do
        if [ -d "$dir" ]; then
            local slug=$(basename "$dir")
            local m3u8="$dir/index.m3u8"
            if [ -f "$m3u8" ]; then
                local segments=$(ls "$dir"/*.ts 2>/dev/null | wc -l)
                local age=$(stat -c %Y "$m3u8" 2>/dev/null || stat -f %m "$m3u8" 2>/dev/null)
                local now=$(date +%s)
                local diff=$((now - age))
                
                if [ $diff -lt 30 ]; then
                    echo -e "  ${GREEN}●${NC} $slug - $segments segments (updated ${diff}s ago)"
                else
                    echo -e "  ${RED}●${NC} $slug - STALE (last update ${diff}s ago)"
                fi
            fi
        fi
    done
    echo ""
}

# View logs
view_logs() {
    local SLUG=$1
    
    if [ -z "$SLUG" ]; then
        pm2 logs --lines 50
    else
        pm2 logs "ch-$SLUG" --lines 100
    fi
}

# Test a channel
test_channel() {
    local CHANNEL_ID=$1
    
    if [ -z "$CHANNEL_ID" ]; then
        log_error "Usage: $0 test <channel_id>"
        exit 1
    fi
    
    local TEST_URL="http://$IPTV_HOST/live/$IPTV_USERNAME/$IPTV_PASSWORD/$CHANNEL_ID.ts"
    
    echo ""
    log_info "Testing channel ID: $CHANNEL_ID"
    log_info "URL: http://$IPTV_HOST/live/****/****/$CHANNEL_ID.ts"
    echo ""
    
    # Test with curl
    local HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -A "VLC/3.0.18" "$TEST_URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Channel ID $CHANNEL_ID is VALID (HTTP $HTTP_CODE)"
        
        # Get stream info with ffprobe
        echo ""
        log_info "Stream Info:"
        ffprobe -v quiet -show_format -show_streams "$TEST_URL" 2>/dev/null | grep -E "^(codec_name|width|height|bit_rate|duration)=" | head -10 || echo "  Could not get stream info"
    else
        log_error "Channel ID $CHANNEL_ID returned HTTP $HTTP_CODE"
        log_warn "The channel may not exist or credentials are invalid"
    fi
    echo ""
}

# Find channels
find_channels() {
    local SEARCH=$1
    
    if [ -z "$SEARCH" ]; then
        log_error "Usage: $0 find <search_term>"
        exit 1
    fi
    
    # Use the find-channel.sh script
    if [ -f "$SCRIPT_DIR/find-channel.sh" ]; then
        "$SCRIPT_DIR/find-channel.sh" "$SEARCH" "$IPTV_USERNAME" "$IPTV_PASSWORD" "$IPTV_HOST"
    else
        log_error "find-channel.sh not found"
        exit 1
    fi
}

# Get stream URL
get_url() {
    local SLUG=$1
    
    if [ -z "$SLUG" ]; then
        log_error "Usage: $0 url <slug>"
        exit 1
    fi
    
    # Reload config to get CloudFront domain
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
    
    local SERVER_IP=$(get_server_ip)
    local PROTOCOL=$(get_protocol)
    
    if [ -f "$HLS_DIR/$SLUG/index.m3u8" ]; then
        echo ""
        echo "Stream URLs for '$SLUG':"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        if [ -n "$CLOUDFRONT_DOMAIN" ]; then
            echo -e "  ${GREEN}CloudFront URL (recommended):${NC}"
            echo "    https://$CLOUDFRONT_DOMAIN/hls/$SLUG/index.m3u8"
            echo ""
            echo "  Direct URL (hidden - use CloudFront instead):"
            echo "    [IP hidden for security]"
        else
            echo "  Stream URL:"
            echo "    ${PROTOCOL}://$SERVER_IP/hls/$SLUG/index.m3u8"
        fi
        echo ""
    else
        log_error "Channel '$SLUG' is not streaming"
    fi
}

# Save PM2 config
save_config() {
    pm2 save --force
    log_success "PM2 configuration saved"
}

# ==============================================================================
# MAIN
# ==============================================================================

case "$1" in
    start)
        start_channel "$2" "$3"
        ;;
    stop)
        stop_channel "$2"
        ;;
    restart)
        restart_channel "$2"
        ;;
    delete)
        delete_channel "$2"
        ;;
    list)
        list_channels
        ;;
    status)
        show_status
        ;;
    logs)
        view_logs "$2"
        ;;
    test)
        test_channel "$2"
        ;;
    find)
        find_channels "$2"
        ;;
    url)
        get_url "$2"
        ;;
    save)
        save_config
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac
