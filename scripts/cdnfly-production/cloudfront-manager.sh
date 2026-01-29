#!/bin/bash

##############################################################################
# CLOUDFRONT CDN MANAGER
# Manages CloudFront distribution for cdnfly.online
# Includes cache invalidation and optimization
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# CloudFront Configuration
# Get this from your CloudFront distribution
DISTRIBUTION_ID="E3XXXXXXX"  # UPDATE THIS WITH YOUR DISTRIBUTION ID
CDN_DOMAIN="stream.cdnfly.online"
ORIGIN_DOMAIN="origin.cdnfly.online"

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     CLOUDFRONT CDN MANAGER                            ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI not installed${NC}"
        echo -e "${YELLOW}Install with: sudo apt install awscli${NC}"
        exit 1
    fi
}

invalidate_channel() {
    local channel_num=$1

    echo -e "${BLUE}Invalidating Channel $channel_num cache...${NC}"

    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/channel-$channel_num/*" \
        2>&1 | tee /tmp/cloudfront-invalidation.json

    local invalidation_id=$(jq -r '.Invalidation.Id' /tmp/cloudfront-invalidation.json 2>/dev/null || echo "unknown")

    echo -e "${GREEN}✓ Invalidation created: $invalidation_id${NC}"
    echo -e "${YELLOW}Note: Cache invalidation takes 1-5 minutes${NC}"
}

invalidate_all() {
    echo -e "${BLUE}Invalidating ALL channel caches...${NC}"

    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/channel-*/*" \
        2>&1 | tee /tmp/cloudfront-invalidation.json

    echo -e "${GREEN}✓ All channels invalidated${NC}"
}

check_cache_status() {
    local channel_num=$1
    local url="https://$CDN_DOMAIN/channel-$channel_num/playlist.m3u8"

    echo -e "${CYAN}Checking cache status for Channel $channel_num...${NC}"
    echo ""

    curl -I "$url" 2>&1 | grep -E "HTTP|X-Cache|X-Amz-Cf|Age|Date"

    echo ""
}

show_distribution_info() {
    echo -e "${CYAN}CloudFront Distribution Info:${NC}"
    echo ""

    aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query 'Distribution.{Status:Status,DomainName:DomainName,Enabled:Enabled,PriceClass:DistributionConfig.PriceClass}' \
        --output table

    echo ""
}

test_cdn_performance() {
    echo -e "${CYAN}Testing CDN Performance...${NC}"
    echo ""

    for channel_num in {1..5}; do
        local url="https://$CDN_DOMAIN/channel-$channel_num/playlist.m3u8"
        echo -e "${BLUE}Channel $channel_num:${NC}"

        local start=$(date +%s%N)
        local response=$(curl -s -w "%{http_code}" -o /dev/null "$url")
        local end=$(date +%s%N)
        local duration=$(( (end - start) / 1000000 ))

        if [ "$response" = "200" ]; then
            echo -e "  Status: ${GREEN}✓ OK${NC} (${duration}ms)"
        else
            echo -e "  Status: ${RED}✗ FAILED${NC} (HTTP $response)"
        fi
    done

    echo ""
}

optimize_cache_policy() {
    echo -e "${YELLOW}CloudFront Cache Optimization Tips:${NC}"
    echo ""
    echo "For HLS live streaming, configure:"
    echo ""
    echo "1. Cache Policy for .m3u8 (playlists):"
    echo "   - Min TTL: 0 seconds"
    echo "   - Default TTL: 2 seconds"
    echo "   - Max TTL: 5 seconds"
    echo ""
    echo "2. Cache Policy for .ts (segments):"
    echo "   - Min TTL: 0 seconds"
    echo "   - Default TTL: 3600 seconds (1 hour)"
    echo "   - Max TTL: 86400 seconds (1 day)"
    echo ""
    echo "3. Origin Request Policy:"
    echo "   - Forward all headers: No"
    echo "   - Forward query strings: All"
    echo "   - Cookies: None"
    echo ""
    echo "4. Response Headers Policy:"
    echo "   - CORS: Enabled"
    echo "   - Access-Control-Allow-Origin: *"
    echo ""
}

show_help() {
    cat << EOF
${GREEN}CloudFront CDN Manager${NC}

${YELLOW}Commands:${NC}
  $0 invalidate <channel>    Invalidate specific channel cache
  $0 invalidate-all          Invalidate all channels
  $0 check <channel>         Check cache status for channel
  $0 test                    Test CDN performance for all channels
  $0 info                    Show distribution information
  $0 optimize                Show cache optimization tips

${YELLOW}Examples:${NC}
  $0 invalidate 1            Invalidate cache for channel 1
  $0 check 3                 Check cache headers for channel 3
  $0 test                    Test all channels

${YELLOW}Configuration:${NC}
  Distribution ID: $DISTRIBUTION_ID
  CDN Domain:      $CDN_DOMAIN
  Origin Domain:   $ORIGIN_DOMAIN

EOF
}

# Main
check_aws_cli

case "${1:-}" in
    invalidate)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel number required${NC}"
            exit 1
        fi
        invalidate_channel $2
        ;;
    invalidate-all)
        invalidate_all
        ;;
    check)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Channel number required${NC}"
            exit 1
        fi
        check_cache_status $2
        ;;
    test)
        test_cdn_performance
        ;;
    info)
        show_distribution_info
        ;;
    optimize)
        optimize_cache_policy
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
