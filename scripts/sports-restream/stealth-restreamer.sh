#!/bin/bash
# ==============================================================================
# STEALTH RESTREAMER - Hide from IPTV Provider
# ==============================================================================
# Advanced techniques to prevent IPTV providers from detecting restreaming:
#
# 1. Residential IP Proxy/VPN Integration
# 2. Connection Pattern Randomization
# 3. Multi-source Load Balancing (appears as multiple users)
# 4. Request Timing Jitter
# 5. Header Randomization
# 6. Bandwidth Throttling (looks like real user)
# 7. Session Rotation
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; }
log_stealth() { echo -e "${CYAN}[$(date '+%H:%M:%S')] 🕵️  $1${NC}"; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/sports-stream/config"
LOG_DIR="$HOME/sports-stream/logs"
COOKIE_JAR="$CONFIG_DIR/.cookies"

# Stealth settings
SESSION_DURATION=1800        # Rotate session every 30 minutes
JITTER_MIN=0.5               # Min delay between requests (seconds)
JITTER_MAX=3.0               # Max delay between requests (seconds)
BANDWIDTH_LIMIT="4M"         # Limit to look like residential user
CONNECTION_LIMIT=1           # Single connection per source

# Load proxy config if exists
if [ -f "$CONFIG_DIR/proxy.conf" ]; then
    source "$CONFIG_DIR/proxy.conf"
fi

# ==============================================================================
# RESIDENTIAL PROXY/VPN MANAGEMENT
# ==============================================================================

# List of residential proxy endpoints (configure your own)
RESIDENTIAL_PROXIES=(
    # Format: "type://user:pass@host:port"
    # Add your residential proxies here
)

# Get random proxy
get_random_proxy() {
    if [ ${#RESIDENTIAL_PROXIES[@]} -eq 0 ]; then
        echo ""
        return
    fi
    local index=$((RANDOM % ${#RESIDENTIAL_PROXIES[@]}))
    echo "${RESIDENTIAL_PROXIES[$index]}"
}

# Test proxy connectivity
test_proxy() {
    local proxy="$1"
    local test_url="http://ipinfo.io/ip"
    
    if [ -z "$proxy" ]; then
        log_warn "No proxy configured, using direct connection"
        return 0
    fi
    
    log_info "Testing proxy: $proxy"
    local ip=$(curl -s --max-time 10 -x "$proxy" "$test_url" 2>/dev/null || echo "")
    
    if [ -n "$ip" ]; then
        log_success "Proxy working. IP: $ip"
        return 0
    else
        log_error "Proxy failed"
        return 1
    fi
}

# ==============================================================================
# STEALTH USER-AGENTS (Residential ISP patterns)
# ==============================================================================

get_stealth_ua() {
    # Real residential device User-Agents
    local uas=(
        # iOS Devices (Common residential)
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
        "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1"
        
        # Android Devices (Common residential)
        "Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36"
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36"
        
        # Smart TVs (Common for IPTV)
        "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager"
        "Mozilla/5.0 (Linux; Tizen 6.0; Smart TV) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/56.0.2924.0 TV Safari/537.36"
        
        # IPTV Apps
        "IPTV Smarters/3.1.5 (iPhone; iOS 17.1.1; Scale/3.00)"
        "TiviMate/4.7.0 (Android 14; Mobile; rv:120.0)"
        "Perfect Player/1.6.0 (Linux; Android 13)"
        
        # Windows (Residential)
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.71 Safari/537.36 Edg/120.0.2210.61"
        
        # VLC (Common for streaming)
        "VLC/3.0.20 LibVLC/3.0.20"
        "Lavf/60.16.100"
    )
    
    local index=$((RANDOM % ${#uas[@]}))
    echo "${uas[$index]}"
}

# ==============================================================================
# STEALTH HEADERS (Mimic real browser behavior)
# ==============================================================================

get_stealth_headers() {
    local ua="$1"
    local referer="${2:-http://localhost/}"
    
    # Random accept-language (common locales)
    local langs=(
        "en-US,en;q=0.9"
        "en-GB,en;q=0.8"
        "en-CA,en;q=0.9,fr;q=0.8"
        "en-AU,en;q=0.9"
    )
    local lang=${langs[$RANDOM % ${#langs[@]}]}
    
    # Build headers
    cat << EOF
User-Agent: $ua
Accept: */*
Accept-Language: $lang
Accept-Encoding: gzip, deflate, br
Referer: $referer
Origin: http://localhost
Connection: keep-alive
Cache-Control: no-cache
Pragma: no-cache
EOF
}

# ==============================================================================
# CONNECTION JITTER (Randomize timing to avoid patterns)
# ==============================================================================

# Random delay between operations
apply_jitter() {
    local min=$JITTER_MIN
    local max=$JITTER_MAX
    local delay=$(awk "BEGIN {printf \"%.2f\", ($min + rand() * ($max - $min))}")
    sleep "$delay"
}

# Random session duration with variance
get_session_duration() {
    local variance=$((RANDOM % 600 - 300))  # ±5 minutes
    echo $((SESSION_DURATION + variance))
}

# ==============================================================================
# STEALTH STREAM FETCHER
# ==============================================================================

# Fetch stream with stealth techniques
fetch_stream_stealth() {
    local url="$1"
    local output_file="$2"
    local proxy="${3:-}"
    
    local ua=$(get_stealth_ua)
    local headers=$(get_stealth_headers "$ua")
    
    log_stealth "Starting stealth fetch"
    log_stealth "UA: ${ua:0:50}..."
    
    # Build curl command
    local curl_opts="-s -L --max-time 30 -H \"$headers\""
    
    if [ -n "$proxy" ]; then
        curl_opts="$curl_opts -x \"$proxy\""
        log_stealth "Using proxy: ${proxy:0:30}..."
    fi
    
    # Use cookie jar for session persistence
    curl_opts="$curl_opts -c \"$COOKIE_JAR\" -b \"$COOKIE_JAR\""
    
    # Fetch with bandwidth limiting (looks like residential)
    curl_opts="$curl_opts --limit-rate $BANDWIDTH_LIMIT"
    
    # Execute fetch
    eval "curl $curl_opts \"$url\" -o \"$output_file\"" &
    local curl_pid=$!
    
    # Monitor and apply jitter
    local session_duration=$(get_session_duration)
    local start_time=$(date +%s)
    
    while kill -0 $curl_pid 2>/dev/null; do
        local elapsed=$(($(date +%s) - start_time))
        
        # Rotate session if needed
        if [ $elapsed -gt $session_duration ]; then
            log_stealth "Rotating session after ${elapsed}s"
            kill $curl_pid 2>/dev/null || true
            return 2  # Signal to restart with new session
        fi
        
        apply_jitter
    done
    
    wait $curl_pid
    return $?
}

# ==============================================================================
# MULTI-SOURCE LOAD BALANCER (Appear as multiple users)
# ==============================================================================

# Split stream across multiple connections
start_load_balanced_stream() {
    local source_url="$1"
    local stream_dir="$2"
    local num_connections="${3:-1}"
    
    log_info "Starting load-balanced stream with $num_connections connection(s)"
    
    # For single connection, just use one proxy
    if [ "$num_connections" -eq 1 ]; then
        local proxy=$(get_random_proxy)
        start_stealth_ffmpeg "$source_url" "$stream_dir" "$proxy"
        return $?
    fi
    
    # Multiple connections would require segment-level load balancing
    # This is a placeholder for advanced implementation
    log_warn "Multi-connection load balancing not yet implemented"
    start_stealth_ffmpeg "$source_url" "$stream_dir" ""
}

# ==============================================================================
# STEALTH FFMPEG WRAPPER
# ==============================================================================

start_stealth_ffmpeg() {
    local source_url="$1"
    local stream_dir="$2"
    local proxy="${3:-}"
    
    local ua=$(get_stealth_ua)
    local referers=(
        "http://localhost/"
        "http://192.168.1.1/"
        "http://127.0.0.1/"
        "https://player.example.com/"
    )
    local referer=${referers[$RANDOM % ${#referers[@]}]}
    
    log_stealth "Starting FFmpeg with stealth settings"
    log_stealth "User-Agent: ${ua:0:50}..."
    
    # Build FFmpeg command with stealth options
    local ffmpeg_opts="-hide_banner -loglevel warning"
    
    # Input options for stealth
    ffmpeg_opts="$ffmpeg_opts -fflags +discardcorrupt+genpts+igndts"
    ffmpeg_opts="$ffmpeg_opts -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1"
    ffmpeg_opts="$ffmpeg_opts -reconnect_delay_max 5"
    ffmpeg_opts="$ffmpeg_opts -timeout 5000000"
    
    # User-Agent and headers
    ffmpeg_opts="$ffmpeg_opts -user_agent \"$ua\""
    ffmpeg_opts="$ffmpeg_opts -headers \"Referer: $referer\\r\\n\""
    ffmpeg_opts="$ffmpeg_opts -headers \"Accept: */*\\r\\n\""
    ffmpeg_opts="$ffmpeg_opts -headers \"Accept-Language: en-US,en;q=0.9\\r\\n\""
    
    # HTTP proxy if configured
    if [ -n "$proxy" ]; then
        local proxy_type=$(echo "$proxy" | cut -d':' -f1)
        local proxy_url=$(echo "$proxy" | sed 's|^[^:]*://||')
        
        if [ "$proxy_type" = "http" ] || [ "$proxy_type" = "https" ]; then
            ffmpeg_opts="$ffmpeg_opts -http_proxy \"$proxy\""
        fi
    fi
    
    # Input
    ffmpeg_opts="$ffmpeg_opts -i \"$source_url\""
    
    # Output options (copy for minimal CPU)
    ffmpeg_opts="$ffmpeg_opts -c copy"
    ffmpeg_opts="$ffmpeg_opts -f hls"
    ffmpeg_opts="$ffmpeg_opts -hls_time 4"
    ffmpeg_opts="$ffmpeg_opts -hls_list_size 900"
    ffmpeg_opts="$ffmpeg_opts -hls_flags delete_segments+omit_endlist+program_date_time"
    ffmpeg_opts="$ffmpeg_opts -hls_segment_filename \"$stream_dir/%03d.ts\""
    
    # Execute FFmpeg
    mkdir -p "$stream_dir"
    eval "ffmpeg $ffmpeg_opts \"$stream_dir/index.m3u8\""
}

# ==============================================================================
# VPN INTEGRATION (OpenVPN/WireGuard)
# ==============================================================================

# Check if VPN is connected
check_vpn_connection() {
    local vpn_interface="${VPN_INTERFACE:-tun0}"
    if ip link show "$vpn_interface" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Get VPN IP
get_vpn_ip() {
    local vpn_interface="${VPN_INTERFACE:-tun0}"
    ip addr show "$vpn_interface" 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d'/' -f1
}

# Rotate VPN connection (if using multiple VPN configs)
rotate_vpn() {
    local vpn_configs_dir="${VPN_CONFIGS_DIR:-$CONFIG_DIR/vpn}"
    
    if [ ! -d "$vpn_configs_dir" ]; then
        log_warn "No VPN configs directory found"
        return 1
    fi
    
    # Pick random config
    local configs=($(ls "$vpn_configs_dir"/*.ovpn "$vpn_configs_dir"/*.conf 2>/dev/null))
    if [ ${#configs[@]} -eq 0 ]; then
        log_warn "No VPN configs found"
        return 1
    fi
    
    local random_config=${configs[$RANDOM % ${#configs[@]}]}
    log_stealth "Rotating VPN to: $(basename "$random_config")"
    
    # Disconnect current VPN
    sudo killall openvpn 2>/dev/null || true
    sleep 2
    
    # Connect with new config
    sudo openvpn --config "$random_config" --daemon
    sleep 5
    
    if check_vpn_connection; then
        local vpn_ip=$(get_vpn_ip)
        log_success "VPN connected. IP: $vpn_ip"
        return 0
    else
        log_error "VPN connection failed"
        return 1
    fi
}

# ==============================================================================
# MAIN COMMANDS
# ==============================================================================

case "${1:-}" in
    test-proxy)
        test_proxy "$(get_random_proxy)"
        ;;
    
    test-ua)
        get_stealth_ua
        ;;
    
    test-headers)
        get_stealth_headers "$(get_stealth_ua)"
        ;;
    
    fetch)
        url="$2"
        output="${3:-/tmp/test-stream.ts}"
        proxy="${4:-$(get_random_proxy)}"
        fetch_stream_stealth "$url" "$output" "$proxy"
        ;;
    
    stream)
        source_url="$2"
        stream_dir="$3"
        proxy="${4:-$(get_random_proxy)}"
        
        if [ -z "$source_url" ] || [ -z "$stream_dir" ]; then
            echo "Usage: $0 stream <source_url> <stream_dir> [proxy]"
            exit 1
        fi
        
        start_stealth_ffmpeg "$source_url" "$stream_dir" "$proxy"
        ;;
    
    vpn-status)
        if check_vpn_connection; then
            ip=$(get_vpn_ip)
            log_success "VPN connected: $ip"
        else
            log_warn "VPN not connected"
        fi
        ;;
    
    vpn-rotate)
        rotate_vpn
        ;;
    
    config)
        echo "Creating proxy configuration template..."
        mkdir -p "$CONFIG_DIR"
        cat > "$CONFIG_DIR/proxy.conf" << 'EOF'
# Stealth Restreamer Configuration
# Add your residential proxies here

# Format: type://username:password@host:port
# RESIDENTIAL_PROXIES=(
#     "http://user:pass@proxy1.example.com:8080"
#     "http://user:pass@proxy2.example.com:8080"
#     "socks5://user:pass@proxy3.example.com:1080"
# )

# VPN Settings
# VPN_INTERFACE=tun0
# VPN_CONFIGS_DIR=$HOME/sports-stream/config/vpn
EOF
        log_success "Config template created at: $CONFIG_DIR/proxy.conf"
        ;;
    
    *)
        echo "Stealth Restreamer - Hide from IPTV Provider"
        echo ""
        echo "Commands:"
        echo "  config              Create proxy configuration template"
        echo "  test-proxy          Test random proxy"
        echo "  test-ua             Show random stealth User-Agent"
        echo "  test-headers        Show stealth headers"
        echo "  fetch <url> [out]   Fetch URL with stealth settings"
        echo "  stream <url> <dir>  Start stealth FFmpeg stream"
        echo "  vpn-status          Check VPN connection"
        echo "  vpn-rotate          Rotate VPN connection"
        echo ""
        echo "Setup:"
        echo "1. Buy residential proxies (BrightData, Oxylabs, etc.)"
        echo "2. Run: $0 config"
        echo "3. Edit: $CONFIG_DIR/proxy.conf"
        echo "4. Add proxies to RESIDENTIAL_PROXIES array"
        echo ""
        ;;
esac
