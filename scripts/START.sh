#!/bin/bash
pkill ffmpeg
rm -rf ~/ciyaar/hls/channel-*
mkdir -p ~/ciyaar/hls/channel-{1,2,3,4,5}

# Optimized settings for SMOOTH playback (accepts 2-5 min delay)
# - hls_time 6: 6-second segments
# - hls_list_size 20: Keep 20 segments in playlist (2 minutes of video)
# - hls_delete_threshold 30: Don't delete segments until 30 newer ones exist (3 minutes retention)
# - hls_flags: delete_segments + append_list for stability

# Channel 1 - auto-restart loop
(
  cd ~/ciyaar/hls/channel-1
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437" \
      -c copy -f hls \
      -hls_time 6 \
      -hls_list_size 20 \
      -hls_delete_threshold 30 \
      -hls_flags delete_segments+append_list \
      stream.m3u8 2>&1 | tee /tmp/ch1.log
    echo "Channel 1 died, restarting in 3 seconds..."
    sleep 3
  done
) &

# Channel 2 - auto-restart loop
(
  cd ~/ciyaar/hls/channel-2
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487" \
      -c copy -f hls \
      -hls_time 6 \
      -hls_list_size 20 \
      -hls_delete_threshold 30 \
      -hls_flags delete_segments+append_list \
      stream.m3u8 2>&1 | tee /tmp/ch2.log
    echo "Channel 2 died, restarting in 3 seconds..."
    sleep 3
  done
) &

# Channel 3 - auto-restart loop
(
  cd ~/ciyaar/hls/channel-3
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491" \
      -c copy -f hls \
      -hls_time 6 \
      -hls_list_size 20 \
      -hls_delete_threshold 30 \
      -hls_flags delete_segments+append_list \
      stream.m3u8 2>&1 | tee /tmp/ch3.log
    echo "Channel 3 died, restarting in 3 seconds..."
    sleep 3
  done
) &

# Channel 4 - auto-restart loop
(
  cd ~/ciyaar/hls/channel-4
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701" \
      -c copy -f hls \
      -hls_time 6 \
      -hls_list_size 20 \
      -hls_delete_threshold 30 \
      -hls_flags delete_segments+append_list \
      stream.m3u8 2>&1 | tee /tmp/ch4.log
    echo "Channel 4 died, restarting in 3 seconds..."
    sleep 3
  done
) &

# Channel 5 - auto-restart loop
(
  cd ~/ciyaar/hls/channel-5
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9700" \
      -c copy -f hls \
      -hls_time 6 \
      -hls_list_size 20 \
      -hls_delete_threshold 30 \
      -hls_flags delete_segments+append_list \
      stream.m3u8 2>&1 | tee /tmp/ch5.log
    echo "Channel 5 died, restarting in 3 seconds..."
    sleep 3
  done
) &

echo "All 5 channels started with SMOOTH playback settings!"
echo ""
echo "Settings for smooth playback:"
echo "  - 6-second segments"
echo "  - 20 segments in playlist (2 minutes of video)"
echo "  - Segments kept for 3 minutes before deletion"
echo "  - Auto-reconnect on source drop"
echo ""
echo "URLs:"
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-4/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-5/stream.m3u8"
