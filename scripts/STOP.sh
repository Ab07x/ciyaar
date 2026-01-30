#!/bin/bash
#
# STOP.sh - Stop all streaming processes
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

HLS_BASE="$HOME/ciyaar/hls"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  STOPPING ALL STREAMS${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Kill all ffmpeg processes
echo -e "${YELLOW}Killing FFmpeg processes...${NC}"
pkill -9 -f ffmpeg 2>/dev/null

# Kill shell loops
echo -e "${YELLOW}Killing background loops...${NC}"
pkill -9 -f "while true" 2>/dev/null

# Wait for processes to die
sleep 2

# Force kill any remaining
remaining=$(pgrep -f ffmpeg 2>/dev/null | wc -l | tr -d ' ')
if [ "$remaining" -gt 0 ]; then
    echo -e "${RED}Force killing $remaining remaining processes...${NC}"
    killall -9 ffmpeg 2>/dev/null
    sleep 1
fi

# Clean HLS directories
echo -e "${YELLOW}Cleaning HLS directories...${NC}"
rm -rf "$HLS_BASE"/channel-*
mkdir -p "$HLS_BASE"/channel-{1,2,3,4,5}

echo ""
echo -e "${GREEN}✓ All streams stopped${NC}"
echo -e "${GREEN}✓ HLS directories cleaned${NC}"
echo ""

# Final verification
ffmpeg_count=$(pgrep -f ffmpeg 2>/dev/null | wc -l | tr -d ' ')
echo -e "FFmpeg processes running: ${ffmpeg_count}"
echo ""
