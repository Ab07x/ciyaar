#!/bin/bash
#
# RESTART.sh - Stop and restart all streams
#

SCRIPT_DIR="$HOME/ciyaar/scripts"

echo "Restarting all streams..."
echo ""

"$SCRIPT_DIR/STOP.sh"
sleep 3
"$SCRIPT_DIR/START.sh"
