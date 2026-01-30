#!/bin/bash
#
# clear_cdn_cache.sh - CloudFront Cache Invalidation Helper
#
# This script helps invalidate CloudFront cache for streaming paths
# Requires AWS CLI to be configured with appropriate permissions
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"  # Set via env or below
CDN_DOMAIN="stream.cdnfly.online"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           CloudFront Cache Invalidation Tool                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo ""
    echo "Install AWS CLI:"
    echo "  macOS:  brew install awscli"
    echo "  Ubuntu: sudo apt install awscli"
    echo "  Or:     pip install awscli"
    echo ""
    echo "Then configure: aws configure"
    exit 1
fi

# Check for distribution ID
if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}CloudFront Distribution ID not set.${NC}"
    echo ""
    echo "You can find it in the AWS Console under CloudFront > Distributions"
    echo ""
    read -p "Enter your CloudFront Distribution ID: " DISTRIBUTION_ID

    if [ -z "$DISTRIBUTION_ID" ]; then
        echo -e "${RED}Distribution ID is required${NC}"
        exit 1
    fi
fi

# Function to invalidate paths
invalidate_paths() {
    local paths=("$@")
    local path_string=""

    for path in "${paths[@]}"; do
        path_string="$path_string \"$path\""
    done

    echo -e "${YELLOW}Creating invalidation for: ${paths[*]}${NC}"

    # Create invalidation
    result=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "${paths[@]}" \
        2>&1)

    if [ $? -eq 0 ]; then
        invalidation_id=$(echo "$result" | grep -o '"Id": "[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✓ Invalidation created: $invalidation_id${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to create invalidation${NC}"
        echo "$result"
        return 1
    fi
}

# Function to check invalidation status
check_status() {
    local inv_id="$1"

    result=$(aws cloudfront get-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --id "$inv_id" \
        2>&1)

    status=$(echo "$result" | grep -o '"Status": "[^"]*"' | cut -d'"' -f4)
    echo -e "Invalidation $inv_id: ${CYAN}$status${NC}"
}

# Function to list recent invalidations
list_invalidations() {
    echo -e "${BLUE}Recent Invalidations:${NC}"

    aws cloudfront list-invalidations \
        --distribution-id "$DISTRIBUTION_ID" \
        --max-items 10 \
        2>&1 | grep -E '"Id"|"Status"|"CreateTime"' | while read -r line; do
        echo "  $line"
    done
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BOLD}Choose an invalidation option:${NC}"
    echo ""
    echo "  1) Invalidate ALL streaming content (/*)"
    echo "  2) Invalidate all HLS playlists (*.m3u8)"
    echo "  3) Invalidate specific channel"
    echo "  4) Invalidate specific path"
    echo "  5) List recent invalidations"
    echo "  6) Check invalidation status"
    echo "  7) Exit"
    echo ""
    read -p "Select option [1-7]: " choice

    case $choice in
        1)
            echo ""
            echo -e "${YELLOW}WARNING: This will invalidate ALL cached content!${NC}"
            read -p "Are you sure? (y/N) " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                invalidate_paths "/*"
            fi
            ;;
        2)
            invalidate_paths "/channel-1/*.m3u8" "/channel-2/*.m3u8" "/channel-3/*.m3u8" "/channel-4/*.m3u8" "/channel-5/*.m3u8"
            ;;
        3)
            read -p "Enter channel number (1-5): " ch_num
            if [[ $ch_num =~ ^[1-5]$ ]]; then
                invalidate_paths "/channel-$ch_num/*"
            else
                echo -e "${RED}Invalid channel number${NC}"
            fi
            ;;
        4)
            echo "Enter path(s) to invalidate (e.g., /channel-1/stream.m3u8)"
            echo "Separate multiple paths with spaces"
            read -p "Path(s): " custom_paths
            if [ -n "$custom_paths" ]; then
                # shellcheck disable=SC2086
                invalidate_paths $custom_paths
            fi
            ;;
        5)
            list_invalidations
            ;;
        6)
            read -p "Enter invalidation ID: " inv_id
            if [ -n "$inv_id" ]; then
                check_status "$inv_id"
            fi
            ;;
        7)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac

    # Show menu again
    show_menu
}

# Quick invalidation mode (for scripts)
if [ -n "$1" ]; then
    case "$1" in
        --all)
            invalidate_paths "/*"
            ;;
        --playlists)
            invalidate_paths "/channel-1/*.m3u8" "/channel-2/*.m3u8" "/channel-3/*.m3u8" "/channel-4/*.m3u8" "/channel-5/*.m3u8"
            ;;
        --channel)
            if [ -n "$2" ]; then
                invalidate_paths "/channel-$2/*"
            else
                echo -e "${RED}Usage: $0 --channel <1-5>${NC}"
                exit 1
            fi
            ;;
        --path)
            shift
            if [ $# -gt 0 ]; then
                invalidate_paths "$@"
            else
                echo -e "${RED}Usage: $0 --path <path1> [path2] ...${NC}"
                exit 1
            fi
            ;;
        --list)
            list_invalidations
            ;;
        --status)
            if [ -n "$2" ]; then
                check_status "$2"
            else
                echo -e "${RED}Usage: $0 --status <invalidation-id>${NC}"
                exit 1
            fi
            ;;
        --help|-h)
            echo ""
            echo -e "${BOLD}Usage:${NC}"
            echo "  $0                     Interactive mode"
            echo "  $0 --all               Invalidate everything"
            echo "  $0 --playlists         Invalidate all .m3u8 files"
            echo "  $0 --channel <1-5>     Invalidate specific channel"
            echo "  $0 --path <paths>      Invalidate specific paths"
            echo "  $0 --list              List recent invalidations"
            echo "  $0 --status <id>       Check invalidation status"
            echo ""
            echo -e "${BOLD}Environment Variables:${NC}"
            echo "  CLOUDFRONT_DISTRIBUTION_ID   Your CloudFront distribution ID"
            echo ""
            echo -e "${BOLD}Examples:${NC}"
            echo "  $0 --channel 1"
            echo "  $0 --path /channel-1/stream.m3u8 /channel-2/stream.m3u8"
            echo "  CLOUDFRONT_DISTRIBUTION_ID=E1234EXAMPLE $0 --all"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
else
    # Interactive mode
    show_menu
fi
