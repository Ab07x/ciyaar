#!/bin/bash
pkill ffmpeg
rm -rf ~/ciyaar/hls/channel-*
mkdir -p ~/ciyaar/hls/channel-{1,2,3,4,5}

# SMOOTH PLAYBACK with timestamp-based segments (no 404 conflicts)
# - Unique segment names prevent CloudFront caching old 404s
# - Large playlist and long retention for smooth playback

# Channel 1
(
  cd ~/ciyaar/hls/channel-1
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437" \
      -c copy -f hls \
      -hls_time 10 \
      -hls_list_size 30 \
      -hls_delete_threshold 60 \
      -hls_segment_filename 'seg_%s_%%d.ts' \
      -hls_flags delete_segments+append_list+second_level_segment_index \
      -strftime 1 \
      stream.m3u8 2>&1 | tee /tmp/ch1.log
    echo "Channel 1 restarting..."
    sleep 3
  done
) &

# Channel 2
(
  cd ~/ciyaar/hls/channel-2
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487" \
      -c copy -f hls \
      -hls_time 10 \
      -hls_list_size 30 \
      -hls_delete_threshold 60 \
      -hls_segment_filename 'seg_%s_%%d.ts' \
      -hls_flags delete_segments+append_list+second_level_segment_index \
      -strftime 1 \
      stream.m3u8 2>&1 | tee /tmp/ch2.log
    echo "Channel 2 restarting..."
    sleep 3
  done
) &

# Channel 3
(
  cd ~/ciyaar/hls/channel-3
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491" \
      -c copy -f hls \
      -hls_time 10 \
      -hls_list_size 30 \
      -hls_delete_threshold 60 \
      -hls_segment_filename 'seg_%s_%%d.ts' \
      -hls_flags delete_segments+append_list+second_level_segment_index \
      -strftime 1 \
      stream.m3u8 2>&1 | tee /tmp/ch3.log
    echo "Channel 3 restarting..."
    sleep 3
  done
) &

# Channel 4
(
  cd ~/ciyaar/hls/channel-4
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701" \
      -c copy -f hls \
      -hls_time 10 \
      -hls_list_size 30 \
      -hls_delete_threshold 60 \
      -hls_segment_filename 'seg_%s_%%d.ts' \
      -hls_flags delete_segments+append_list+second_level_segment_index \
      -strftime 1 \
      stream.m3u8 2>&1 | tee /tmp/ch4.log
    echo "Channel 4 restarting..."
    sleep 3
  done
) &

# Channel 5
(
  cd ~/ciyaar/hls/channel-5
  while true; do
    ffmpeg -reconnect 1 -reconnect_streamed 1 -reconnect_at_eof 1 -reconnect_delay_max 5 \
      -i "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9700" \
      -c copy -f hls \
      -hls_time 10 \
      -hls_list_size 30 \
      -hls_delete_threshold 60 \
      -hls_segment_filename 'seg_%s_%%d.ts' \
      -hls_flags delete_segments+append_list+second_level_segment_index \
      -strftime 1 \
      stream.m3u8 2>&1 | tee /tmp/ch5.log
    echo "Channel 5 restarting..."
    sleep 3
  done
) &

echo "All 5 channels started!"
echo ""
echo "Settings:"
echo "  - 10-second segments (longer = more stable)"
echo "  - 30 segments in playlist (5 minutes of video)"
echo "  - Segments kept 10 minutes before deletion"
echo "  - Timestamp-based names (no 404 conflicts)"
echo ""
echo "URLs:"
echo "  https://stream.cdnfly.online/channel-1/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-2/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-3/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-4/stream.m3u8"
echo "  https://stream.cdnfly.online/channel-5/stream.m3u8"
