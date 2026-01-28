#!/bin/bash
# ==============================================================================
# FANBROJ VPN SETUP FOR IPTV RESTREAMING
# ==============================================================================
# This script sets up a VPN on your server to hide your AWS IP from IPTV providers.
#
# Supported VPNs:
#   - NordVPN (Recommended - $3.99/mo)
#   - Surfshark ($2.49/mo)
#   - ProtonVPN (Free tier available)
#
# Usage:
#   ./setup-vpn.sh nordvpn
#   ./setup-vpn.sh surfshark
#   ./setup-vpn.sh protonvpn
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

show_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           FANBROJ VPN SETUP                                  ║"
    echo "║           Hide Your Server IP from IPTV Providers            ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ==============================================================================
# NORDVPN SETUP
# ==============================================================================
setup_nordvpn() {
    show_banner
    echo "Setting up NordVPN..."
    echo ""
    
    # Install NordVPN
    log_info "Installing NordVPN..."
    sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh)
    
    echo ""
    log_success "NordVPN installed!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "NEXT STEPS:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "1. Login to NordVPN:"
    echo "   ${CYAN}nordvpn login${NC}"
    echo ""
    echo "2. Connect to a server:"
    echo "   ${CYAN}nordvpn connect${NC}              # Auto-select best server"
    echo "   ${CYAN}nordvpn connect Germany${NC}     # Connect to Germany"
    echo "   ${CYAN}nordvpn connect uk${NC}          # Connect to UK"
    echo ""
    echo "3. Enable auto-connect on boot:"
    echo "   ${CYAN}nordvpn set autoconnect on${NC}"
    echo ""
    echo "4. Check connection:"
    echo "   ${CYAN}nordvpn status${NC}"
    echo "   ${CYAN}curl ifconfig.me${NC}            # Should show VPN IP"
    echo ""
    echo "5. Restart your streams:"
    echo "   ${CYAN}pm2 restart all${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
}

# ==============================================================================
# SURFSHARK SETUP
# ==============================================================================
setup_surfshark() {
    show_banner
    echo "Setting up Surfshark..."
    echo ""
    
    # Install Surfshark
    log_info "Installing Surfshark..."
    curl -f https://downloads.surfshark.com/linux/debian-install.sh --output surfshark-install.sh
    sudo sh surfshark-install.sh
    
    echo ""
    log_success "Surfshark installed!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "NEXT STEPS:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "1. Login to Surfshark:"
    echo "   ${CYAN}sudo surfshark-vpn login${NC}"
    echo ""
    echo "2. Connect to a server:"
    echo "   ${CYAN}sudo surfshark-vpn connect${NC}"
    echo ""
    echo "3. Check connection:"
    echo "   ${CYAN}sudo surfshark-vpn status${NC}"
    echo "   ${CYAN}curl ifconfig.me${NC}"
    echo ""
    echo "4. Restart your streams:"
    echo "   ${CYAN}pm2 restart all${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
}

# ==============================================================================
# PROTONVPN SETUP (FREE OPTION)
# ==============================================================================
setup_protonvpn() {
    show_banner
    echo "Setting up ProtonVPN (Free tier available)..."
    echo ""
    
    # Install ProtonVPN
    log_info "Installing ProtonVPN..."
    
    # Add ProtonVPN repository
    wget https://repo.protonvpn.com/debian/dists/stable/main/binary-all/protonvpn-stable-release_1.0.3-3_all.deb
    sudo dpkg -i protonvpn-stable-release_1.0.3-3_all.deb
    sudo apt update
    sudo apt install -y protonvpn-cli
    rm protonvpn-stable-release_1.0.3-3_all.deb
    
    echo ""
    log_success "ProtonVPN installed!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "NEXT STEPS:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "1. Login to ProtonVPN:"
    echo "   ${CYAN}protonvpn-cli login${NC}"
    echo ""
    echo "2. Connect to a server:"
    echo "   ${CYAN}protonvpn-cli connect --fastest${NC}    # Fastest server"
    echo "   ${CYAN}protonvpn-cli connect --cc US${NC}      # US server"
    echo ""
    echo "3. Check connection:"
    echo "   ${CYAN}protonvpn-cli status${NC}"
    echo "   ${CYAN}curl ifconfig.me${NC}"
    echo ""
    echo "4. Restart your streams:"
    echo "   ${CYAN}pm2 restart all${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "NOTE: Free tier has limited servers and speed."
    echo "      Paid plans start at \$4.99/month."
    echo ""
}

# ==============================================================================
# WIREGUARD SETUP (Manual - Any VPN Provider)
# ==============================================================================
setup_wireguard() {
    show_banner
    echo "Setting up WireGuard (works with any VPN provider)..."
    echo ""
    
    # Install WireGuard
    log_info "Installing WireGuard..."
    sudo apt update
    sudo apt install -y wireguard resolvconf
    
    echo ""
    log_success "WireGuard installed!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "NEXT STEPS:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "1. Get WireGuard config from your VPN provider"
    echo "   (NordVPN, Mullvad, IVPN, etc. all support WireGuard)"
    echo ""
    echo "2. Save config to /etc/wireguard/wg0.conf:"
    echo "   ${CYAN}sudo nano /etc/wireguard/wg0.conf${NC}"
    echo ""
    echo "3. Start WireGuard:"
    echo "   ${CYAN}sudo wg-quick up wg0${NC}"
    echo ""
    echo "4. Enable auto-start on boot:"
    echo "   ${CYAN}sudo systemctl enable wg-quick@wg0${NC}"
    echo ""
    echo "5. Check connection:"
    echo "   ${CYAN}sudo wg show${NC}"
    echo "   ${CYAN}curl ifconfig.me${NC}"
    echo ""
    echo "6. Restart your streams:"
    echo "   ${CYAN}pm2 restart all${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
}

# ==============================================================================
# SHOW HELP
# ==============================================================================
show_help() {
    show_banner
    echo "Usage: $0 <vpn_provider>"
    echo ""
    echo "Available VPN providers:"
    echo ""
    echo "  ${GREEN}nordvpn${NC}     - NordVPN (\$3.99/mo) - Recommended"
    echo "  ${GREEN}surfshark${NC}   - Surfshark (\$2.49/mo) - Cheapest"
    echo "  ${GREEN}protonvpn${NC}   - ProtonVPN (Free tier available)"
    echo "  ${GREEN}wireguard${NC}   - WireGuard (Manual - any provider)"
    echo ""
    echo "Examples:"
    echo "  $0 nordvpn"
    echo "  $0 protonvpn"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "VPN COMPARISON:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  Provider    | Price     | Speed  | Servers | Best For"
    echo "  ------------|-----------|--------|---------|------------------"
    echo "  NordVPN     | \$3.99/mo  | Fast   | 5500+   | Best overall"
    echo "  Surfshark   | \$2.49/mo  | Good   | 3200+   | Budget option"
    echo "  ProtonVPN   | Free/\$5   | Medium | 1700+   | Privacy focused"
    echo "  WireGuard   | Varies    | Fast   | Varies  | Advanced users"
    echo ""
}

# ==============================================================================
# MAIN
# ==============================================================================
case "$1" in
    nordvpn)
        setup_nordvpn
        ;;
    surfshark)
        setup_surfshark
        ;;
    protonvpn)
        setup_protonvpn
        ;;
    wireguard)
        setup_wireguard
        ;;
    *)
        show_help
        ;;
esac
