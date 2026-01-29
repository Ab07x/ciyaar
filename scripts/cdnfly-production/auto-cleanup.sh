#!/bin/bash

##############################################################################
# AUTO CLEANUP - Runs every 2 minutes
# Keeps only last 50 segments per channel (5 minutes of video)
##############################################################################

OUT_DIR="$HOME/ciyaar/hls"

for i in {1..5}; do
    if [ -d "$OUT_DIR/channel-$i" ]; then
        cd $OUT_DIR/channel-$i

        # Count segments
        seg_count=$(ls -1 seg_*.ts 2>/dev/null | wc -l | xargs)

        # If more than 50, delete oldest
        if [ $seg_count -gt 50 ]; then
            deleted=$(ls -t seg_*.ts 2>/dev/null | tail -n +51 | wc -l | xargs)
            ls -t seg_*.ts 2>/dev/null | tail -n +51 | xargs rm -f 2>/dev/null || true
            echo "[$(date '+%H:%M:%S')] Ch$i: Deleted $deleted old segments (had $seg_count, kept 50)"
        fi
    fi
done
