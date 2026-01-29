#!/bin/bash
pm2 delete all 2>/dev/null || true
rm -rf ~/ciyaar/hls/*
mkdir -p ~/ciyaar/hls/channel-{1,2,3,4,5}

pm2 start "ffmpeg -re -i http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437 -c copy -hls_time 6 -hls_list_size 5 -hls_wrap 10 -hls_flags delete_segments -f hls ~/ciyaar/hls/channel-1/stream.m3u8" --name ch1

pm2 start "ffmpeg -re -i http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487 -c copy -hls_time 6 -hls_list_size 5 -hls_wrap 10 -hls_flags delete_segments -f hls ~/ciyaar/hls/channel-2/stream.m3u8" --name ch2

pm2 start "ffmpeg -re -i http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491 -c copy -hls_time 6 -hls_list_size 5 -hls_wrap 10 -hls_flags delete_segments -f hls ~/ciyaar/hls/channel-3/stream.m3u8" --name ch3

pm2 start "ffmpeg -re -i http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701 -c copy -hls_time 6 -hls_list_size 5 -hls_wrap 10 -hls_flags delete_segments -f hls ~/ciyaar/hls/channel-4/stream.m3u8" --name ch4

pm2 start "ffmpeg -re -i http://iptvtour.store:80/d06HPCFR/qEBJjW3/9700 -c copy -hls_time 6 -hls_list_size 5 -hls_wrap 10 -hls_flags delete_segments -f hls ~/ciyaar/hls/channel-5/stream.m3u8" --name ch5

pm2 save
pm2 list

echo ""
echo "DONE! Wait 30 seconds then test:"
echo "https://stream.cdnfly.online/channel-1/stream.m3u8"
