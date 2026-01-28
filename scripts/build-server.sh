#!/bin/bash
# ==============================================================================
# Safe Build Script for Server with Limited Resources
# ==============================================================================
# This script builds Next.js app on servers with limited memory
# ==============================================================================

set -e

echo "🏗️  Starting server build process..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this from the project root.${NC}"
    exit 1
fi

# Check available memory
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
echo -e "${YELLOW}📊 Available memory: ${AVAILABLE_MEM}MB${NC}"

if [ "$AVAILABLE_MEM" -lt 1000 ]; then
    echo -e "${YELLOW}⚠️  Low memory detected. Creating swap space...${NC}"

    # Create swap if it doesn't exist
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo -e "${GREEN}✅ Swap space created${NC}"
    else
        sudo swapon /swapfile 2>/dev/null || echo "Swap already active"
    fi
fi

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf .next
rm -rf node_modules/.cache

# Set memory limits for Node.js
export NODE_OPTIONS="--max-old-space-size=3072"

# Build with progress indicator
echo -e "${GREEN}🚀 Building application...${NC}"
echo -e "${YELLOW}⏳ This may take 5-10 minutes. Please be patient...${NC}"

# Build without Turbopack (more stable for production)
NEXT_BUILD_MODE=stable pnpm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo -e "${GREEN}📦 Build output: .next/${NC}"

    # Show build size
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo -e "${GREEN}📊 Build size: ${BUILD_SIZE}${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${YELLOW}💡 Try these fixes:${NC}"
    echo "   1. Restart PM2: pm2 restart all"
    echo "   2. Check memory: free -h"
    echo "   3. Check disk space: df -h"
    echo "   4. View logs: pm2 logs"
    exit 1
fi

# Disable swap if we created it
# Uncomment if you want to disable swap after build
# sudo swapoff /swapfile 2>/dev/null || true

echo -e "${GREEN}✨ Ready to restart!${NC}"
echo -e "${YELLOW}Run: pm2 restart ciyaar-web${NC}"
