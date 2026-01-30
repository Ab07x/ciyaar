#!/bin/bash
#
# clear_cache.sh - CloudFront Cache Invalidation
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              CloudFront Cache Invalidation                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not installed!${NC}"
    echo ""
    echo "Install with:"
    echo "  Ubuntu: sudo apt install awscli"
    echo "  macOS:  brew install awscli"
    echo ""
    echo "Then configure: aws configure"
    exit 1
fi

# List distributions
echo -e "${YELLOW}Your CloudFront distributions:${NC}"
echo ""
aws cloudfront list-distributions \
    --query "DistributionList.Items[*].{Id:Id,Domain:DomainName,Status:Status}" \
    --output table 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to list distributions. Check your AWS credentials.${NC}"
    exit 1
fi

echo ""
read -p "Enter Distribution ID to invalidate (or 'q' to quit): " DIST_ID

if [ "$DIST_ID" == "q" ] || [ -z "$DIST_ID" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Select invalidation scope:${NC}"
echo "  1) All paths (/*)"
echo "  2) Playlists only (*.m3u8)"
echo "  3) Specific channel"
echo "  4) Custom path"
echo ""
read -p "Choice [1-4]: " choice

case $choice in
    1)
        paths="/*"
        ;;
    2)
        paths="/channel-1/*.m3u8 /channel-2/*.m3u8 /channel-3/*.m3u8 /channel-4/*.m3u8 /channel-5/*.m3u8"
        ;;
    3)
        read -p "Channel number (1-5): " ch
        paths="/channel-$ch/*"
        ;;
    4)
        read -p "Enter path (e.g., /channel-1/stream.m3u8): " paths
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Creating invalidation for: $paths${NC}"

aws cloudfront create-invalidation \
    --distribution-id "$DIST_ID" \
    --paths $paths

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Invalidation created successfully!${NC}"
    echo "It may take 5-10 minutes to complete."
    echo ""
    echo "Check status:"
    echo "  aws cloudfront list-invalidations --distribution-id $DIST_ID"
else
    echo -e "${RED}Failed to create invalidation${NC}"
fi
