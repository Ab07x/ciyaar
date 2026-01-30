#!/bin/bash
#
# monitor.sh - Real-time streaming monitor
#

SCRIPT_DIR="$HOME/ciyaar/scripts"

echo "Starting real-time monitor (Ctrl+C to exit)..."
echo ""

while true; do
    "$SCRIPT_DIR/STATUS.sh"
    echo ""
    echo -e "\033[1;33m[AUTO-REFRESH: 5 seconds | Press Ctrl+C to exit]\033[0m"
    sleep 5
done
