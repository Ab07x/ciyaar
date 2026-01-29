#!/bin/bash

##############################################################################
# SEGMENT CLEANUP - Runs every 5 minutes via cron
# Prevents disk from filling up while keeping enough for CloudFront
##############################################################################

OUT_DIR="$HOME/ciyaar/hls"

# For each channel, keep only the most recent 50 segments
# With 6-second segments, that's 5 minutes of video
# More than enough for CloudFront to cache

for i in {1..5}; do
    if [ -d "$OUT_DIR/channel-$i" ]; then
        cd $OUT_DIR/channel-$i

        # Count segments
        seg_count=$(ls -1 *.ts 2>/dev/null | wc -l | xargs)

        # If more than 50, delete oldest
        if [ $seg_count -gt 50 ]; then
            # Keep only last 50
            ls -t *.ts 2>/dev/null | tail -n +51 | xargs rm -f 2>/dev/null || true
            echo "[$(date)] Channel $i: Cleaned $(($seg_count - 50)) old segments"
        fi
    fi
done
