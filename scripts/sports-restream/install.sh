#!/bin/bash
# ==============================================================================
# SPORTS STREAMING SYSTEM - INSTALLER
# ==============================================================================
# This script installs all sports streaming components to ~/sports-stream
# Run this on your 16GB Lightsail server
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_header() { echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "ℹ️  $1"; }

# Banner
clear
echo -e "${CYAN}"
cat << 'BANNER'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ⚽ 🏀 🏈  SPORTS STREAMING INSTALLER  🏈 🏀 ⚽            ║
║                                                               ║
║        Installing to ~/sports-stream                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# Configuration
SCRIPT_SOURCE="${SCRIPT_SOURCE:-https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/sports-restream}"
INSTALL_DIR="$HOME/sports-stream"

cd "$HOME"

# ==============================================================================
# STEP 1: Create Directory Structure
# ==============================================================================
log_header "STEP 1: Creating Directory Structure"

mkdir -p "$INSTALL_DIR"/{scripts,logs,pids,config}
sudo mkdir -p /var/www/html/sports
sudo mkdir -p /var/recordings/sports

log_success "Directories created"

# ==============================================================================
# STEP 2: Download Scripts
# ==============================================================================
log_header "STEP 2: Downloading Scripts"

cd "$INSTALL_DIR/scripts"

SCRIPTS=(
    "sports-event-manager.sh"
    "stream-protector.sh"
    "stealth-restreamer.sh"
    "monitor-health.sh"
    "setup-sports-server.sh"
    "find-channel.sh"
)

for script in "${SCRIPTS[@]}"; do
    log_info "Downloading $script..."
    if curl -sSL "$SCRIPT_SOURCE/$script" -o "$script" 2>/dev/null; then
        chmod +x "$script"
        log_success "Downloaded $script"
    else
        log_warn "Could not download $script from GitHub"
        # Check if script exists locally
        if [ -f "$HOME/ciyaar/scripts/sports-restream/$script" ]; then
            cp "$HOME/ciyaar/scripts/sports-restream/$script" .
            chmod +x "$script"
            log_success "Copied $script from local repository"
        else
            log_error "Could not find $script"
        fi
    fi
done

# ==============================================================================
# STEP 3: Create Symlinks for Easy Access
# ==============================================================================
log_header "STEP 3: Creating Shortcuts"

ln -sf "$INSTALL_DIR/scripts/sports-event-manager.sh" "$HOME/sm"
ln -sf "$INSTALL_DIR/scripts/stream-protector.sh" "$HOME/sp"
ln -sf "$INSTALL_DIR/scripts/stealth-restreamer.sh" "$HOME/st"
ln -sf "$INSTALL_DIR/scripts/monitor-health.sh" "$HOME/mon"

log_success "Shortcuts created: sm, sp, st, mon"

# ==============================================================================
# STEP 4: Add Aliases to .bashrc
# ==============================================================================
log_header "STEP 4: Adding Aliases"

if ! grep -q "sports-stream aliases" "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" << 'EOF'

# sports-stream aliases
alias sm='~/sports-stream/scripts/sports-event-manager.sh'
alias sp='~/sports-stream/scripts/stream-protector.sh'
alias st='~/sports-stream/scripts/stealth-restreamer.sh'
alias mon='~/sports-stream/scripts/monitor-health.sh'
alias sports-logs='tail -f ~/sports-stream/logs/*.log'
alias perf='echo "=== Performance ===" && echo "Streams: $(pgrep -c ffmpeg 2>/dev/null || echo 0)" && ps aux | grep ffmpeg | grep -v grep | awk "{sum+=\$6} END {printf \"RAM: %.1f GB\\n\", sum/1024/1024}" && ps aux | grep ffmpeg | grep -v grep | awk "{sum+=\$3} END {printf \"CPU: %.1f%%\\n\", sum}" && echo "Connections: $(ss -ant | grep :80 | wc -l)"'
EOF
    log_success "Aliases added to .bashrc"
fi

# ==============================================================================
# STEP 5: Set Permissions
# ==============================================================================
log_header "STEP 5: Setting Permissions"

chmod 700 "$INSTALL_DIR/config"
chmod -R +x "$INSTALL_DIR/scripts"

# Set web directory permissions
sudo chown -R www-data:www-data /var/www/html 2>/dev/null || log_warn "Could not chown /var/www/html (run with sudo if needed)"
sudo chown -R www-data:www-data /var/recordings 2>/dev/null || true

log_success "Permissions set"

# ==============================================================================
# STEP 6: Initialize Stream Protector
# ==============================================================================
log_header "STEP 6: Initializing Stream Protection"

"$INSTALL_DIR/scripts/stream-protector.sh" init 2>/dev/null || log_warn "Stream protector init may have failed"

# ==============================================================================
# STEP 7: Create Sample Config
# ==============================================================================
log_header "STEP 7: Creating Sample Configuration"

cat > "$INSTALL_DIR/config/sports.conf" << 'EOF'
# Sports Streaming Configuration
# Domain settings
DOMAIN=cdnfly.online
CLOUDFRONT_DOMAIN=cdn.cdnfly.online
STREAM_ORIGIN=stream.cdnfly.online

# Performance settings (for 16GB plan)
MAX_CONCURRENT_STREAMS=6
FFMPEG_MEMORY_LIMIT=2048M
FFMPEG_THREADS=3

# Notification webhooks (optional)
# DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
# SLACK_WEBHOOK=https://hooks.slack.com/services/...
EOF

log_success "Sample config created"

# ==============================================================================
# INSTALLATION COMPLETE
# ==============================================================================
log_header "INSTALLATION COMPLETE!"

echo -e "\n${GREEN}Sports streaming system installed to: $INSTALL_DIR${NC}\n"

echo -e "${CYAN}Available Commands:${NC}"
echo "  sm start <name> <url> [min]  - Start streaming event"
echo "  sm stop <name>               - Stop event"
echo "  sm list                      - List active events"
echo "  sm status                    - Show system status"
echo "  sp add <name> <url>          - Add encrypted source"
echo "  sp get <name>                - Get source URL"
echo "  sp list                      - List sources"
echo "  st config                    - Configure stealth mode"
echo "  st stream <url> <dir>        - Start stealth stream"
echo "  mon start                    - Start health monitor"
echo "  mon status                   - Show monitor status"
echo ""

echo -e "${CYAN}Quick Start:${NC}"
echo "1. Add your IPTV source:"
echo "   sp add iptvtour \"http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts\""
echo ""
echo "2. Start streaming:"
echo "   sm start match-1 \"http://iptvtour.store/live/d06HPCFR/qEBJjW3/CHANNEL_ID.ts\" 150"
echo ""
echo "3. Watch at:"
echo "   https://cdnfly.online/sports/match-1/index.m3u8"
echo ""

echo -e "${YELLOW}Note: Run 'source ~/.bashrc' to load aliases in current session${NC}\n"
