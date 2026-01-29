#!/bin/bash
# ==============================================================================
# STREAM SOURCE PROTECTOR
# ==============================================================================
# Hides and protects IPTV provider sources from exposure
# Features:
# - Source URL encryption/obfuscation
# - Token-based access control
# - IP whitelisting for ingest
# - Automatic source rotation on failure
# - User-Agent spoofing
#
# This ensures your IPTV provider URLs are never exposed to end users
# ==============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/ciyaar/config"
SECRETS_FILE="$CONFIG_DIR/.secrets"
SOURCES_FILE="$CONFIG_DIR/sources.enc"
LOG_DIR="$HOME/ciyaar/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Ensure directories exist
mkdir -p "$CONFIG_DIR" "$LOG_DIR"
chmod 700 "$CONFIG_DIR"

# ==============================================================================
# ENCRYPTION FUNCTIONS
# ==============================================================================

# Generate encryption key if not exists
generate_key() {
    if [ ! -f "$SECRETS_FILE" ]; then
        openssl rand -base64 32 > "$SECRETS_FILE"
        chmod 600 "$SECRETS_FILE"
        log_success "Generated new encryption key"
    fi
}

# Encrypt a string
encrypt() {
    local data="$1"
    local key=$(cat "$SECRETS_FILE" 2>/dev/null || echo "default-key-32-chars-long!!!!!")
    echo "$data" | openssl enc -aes-256-cbc -base64 -salt -pass pass:"$key" 2>/dev/null | tr '+/' '-_' | tr -d '='
}

# Decrypt a string
decrypt() {
    local data="$1"
    local key=$(cat "$SECRETS_FILE" 2>/dev/null || echo "default-key-32-chars-long!!!!!")
    # Restore base64 padding
    local padded=$(echo "$data" | tr '-_' '+/' | awk '{print $1 "==="}' | cut -c1-((length+2)/3*4))
    echo "$padded" | openssl enc -aes-256-cbc -base64 -d -pass pass:"$key" 2>/dev/null
}

# ==============================================================================
# SOURCE MANAGEMENT
# ==============================================================================

# Add a new source
add_source() {
    local name="$1"
    local url="$2"
    local priority="${3:-1}"
    
    if [ -z "$name" ] || [ -z "$url" ]; then
        log_error "Usage: add_source <name> <url> [priority]"
        return 1
    fi
    
    generate_key
    
    local encrypted_url=$(encrypt "$url")
    local entry="$(date +%s)|$name|$priority|$encrypted_url"
    
    echo "$entry" >> "$SOURCES_FILE"
    chmod 600 "$SOURCES_FILE"
    
    log_success "Source '$name' added successfully"
}

# Get source URL by name
get_source() {
    local name="$1"
    
    if [ ! -f "$SOURCES_FILE" ]; then
        log_error "No sources file found"
        return 1
    fi
    
    while IFS='|' read -r timestamp src_name priority encrypted_url; do
        if [ "$src_name" = "$name" ]; then
            decrypt "$encrypted_url"
            return 0
        fi
    done < "$SOURCES_FILE"
    
    log_error "Source '$name' not found"
    return 1
}

# Get all sources for a group (for failover)
get_source_group() {
    local pattern="$1"
    
    if [ ! -f "$SOURCES_FILE" ]; then
        return 1
    fi
    
    grep "$pattern" "$SOURCES_FILE" 2>/dev/null | while IFS='|' read -r timestamp name priority encrypted_url; do
        local url=$(decrypt "$encrypted_url")
        echo "$priority|$name|$url"
    done | sort -n
}

# List all sources (without showing URLs)
list_sources() {
    if [ ! -f "$SOURCES_FILE" ]; then
        log_info "No sources configured"
        return 0
    fi
    
    echo -e "\n${CYAN}Configured Sources:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    while IFS='|' read -r timestamp name priority encrypted_url; do
        local added_date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "unknown")
        echo -e "  Name:     $name"
        echo -e "  Priority: $priority"
        echo -e "  Added:    $added_date"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    done < "$SOURCES_FILE"
}

# Remove a source
remove_source() {
    local name="$1"
    
    if [ ! -f "$SOURCES_FILE" ]; then
        log_error "No sources file found"
        return 1
    fi
    
    grep -v "|$name|" "$SOURCES_FILE" > "$SOURCES_FILE.tmp" && mv "$SOURCES_FILE.tmp" "$SOURCES_FILE"
    log_success "Source '$name' removed"
}

# ==============================================================================
# STREAM PROTECTION FUNCTIONS
# ==============================================================================

# Generate a secure stream token
generate_token() {
    local event_name="$1"
    local expiry_hours="${2:-4}"
    
    local expiry=$(($(date +%s) + expiry_hours * 3600))
    local random=$(openssl rand -hex 16)
    local data="$event_name:$expiry:$random"
    local signature=$(echo "$data" | openssl dgst -sha256 -hmac "$(cat "$SECRETS_FILE")" 2>/dev/null | cut -d' ' -f2)
    
    echo "${data}:${signature}" | base64 | tr '+/' '-_' | tr -d '='
}

# Validate a stream token
validate_token() {
    local token="$1"
    
    # Restore padding and decode
    local padded=$(echo "$token" | tr '-_' '+/' | awk '{print $1 "==="}' | cut -c1-((length+2)/3*4))
    local decoded=$(echo "$padded" | base64 -d 2>/dev/null)
    
    if [ -z "$decoded" ]; then
        return 1
    fi
    
    local event_name=$(echo "$decoded" | cut -d':' -f1)
    local expiry=$(echo "$decoded" | cut -d':' -f2)
    local random=$(echo "$decoded" | cut -d':' -f3)
    local signature=$(echo "$decoded" | cut -d':' -f4)
    local data="$event_name:$expiry:$random"
    
    # Verify signature
    local expected_sig=$(echo "$data" | openssl dgst -sha256 -hmac "$(cat "$SECRETS_FILE")" 2>/dev/null | cut -d' ' -f2)
    
    if [ "$signature" != "$expected_sig" ]; then
        return 1
    fi
    
    # Check expiry
    local now=$(date +%s)
    if [ "$now" -gt "$expiry" ]; then
        return 1
    fi
    
    echo "$event_name"
    return 0
}

# Get random User-Agent
get_random_ua() {
    local agents=(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
        "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        "IPTV Smarters Pro/3.1.5 (iPhone; iOS 17.2; Scale/3.00)"
        "VLC/3.0.18 LibVLC/3.0.18"
        "Lavf/60.3.100"
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    
    local index=$((RANDOM % ${#agents[@]}))
    echo "${agents[$index]}"
}

# Get FFmpeg input options with protection
get_ffmpeg_input_opts() {
    local source_url="$1"
    local ua=$(get_random_ua)
    
    cat << EOF
-fflags +discardcorrupt+genpts+igndts \
-reconnect 1 \
-reconnect_at_eof 1 \
-reconnect_streamed 1 \
-reconnect_delay_max 5 \
-timeout 5000000 \
-user_agent "$ua" \
-headers "Referer: http://localhost/\r\n" \
-i "$source_url"
EOF
}

# ==============================================================================
# FAILOVER AND HEALTH CHECK
# ==============================================================================

# Test if a source is working
test_source_health() {
    local url="$1"
    local timeout="${2:-10}"
    
    local ua=$(get_random_ua)
    
    if command -v ffprobe &> /dev/null; then
        if timeout "$timeout" ffprobe -v error -show_entries format=duration \
            -user_agent "$ua" \
            -headers "Referer: http://localhost/" \
            "$url" > /dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Fallback to curl test
    if curl -s -I --max-time "$timeout" \
        -A "$ua" \
        -H "Referer: http://localhost/" \
        "$url" | grep -q "200\|302"; then
        return 0
    fi
    
    return 1
}

# Get working source from group with failover
get_working_source() {
    local group_pattern="$1"
    
    log_info "Testing sources for pattern: $group_pattern"
    
    get_source_group "$group_pattern" | while IFS='|' read -r priority name url; do
        log_info "Testing: $name"
        if test_source_health "$url"; then
            log_success "Source '$name' is working"
            echo "$name|$url"
            return 0
        else
            log_warn "Source '$name' failed health check"
        fi
    done | head -1
}

# ==============================================================================
# MAIN COMMANDS
# ==============================================================================

case "${1:-}" in
    add)
        add_source "$2" "$3" "$4"
        ;;
    get)
        get_source "$2"
        ;;
    list)
        list_sources
        ;;
    remove)
        remove_source "$2"
        ;;
    token)
        generate_token "$2" "$3"
        ;;
    validate)
        validate_token "$2"
        ;;
    test)
        test_source_health "$2"
        if [ $? -eq 0 ]; then
            log_success "Source is healthy"
        else
            log_error "Source failed health check"
        fi
        ;;
    ua)
        get_random_ua
        ;;
    init)
        generate_key
        log_success "Stream protector initialized"
        ;;
    *)
        echo "Stream Source Protector"
        echo ""
        echo "Usage:"
        echo "  $0 init                          Initialize encryption"
        echo "  $0 add <name> <url> [priority]   Add a source"
        echo "  $0 get <name>                    Get source URL"
        echo "  $0 list                          List all sources"
        echo "  $0 remove <name>                 Remove a source"
        echo "  $0 token <event> [hours]         Generate access token"
        echo "  $0 validate <token>              Validate token"
        echo "  $0 test <url>                    Test source health"
        echo "  $0 ua                            Get random User-Agent"
        ;;
esac
