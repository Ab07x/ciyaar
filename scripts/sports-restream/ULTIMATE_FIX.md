# 🔧 ULTIMATE FIX - Stream Stops Every 20s

## Problem
- Stream stops every 20 seconds
- VLC shows "Network error - trying to recover"
- Web player can't play
- Buffering issues

## Root Cause
The default HLS settings create segments that are too small and players can't keep up.

## Solution - Run These Commands

### Step 1: Stop Everything
```bash
pkill -9 ffmpeg
rm -f ~/sports-stream/pids/*.pid
sudo rm -rf /var/www/html/sports/*
sudo mkdir -p /var/www/html/sports
sudo chown -R $USER:$USER /var/www/html/sports
```

### Step 2: Create Ultra-Stable Stream Script
```bash
cat > ~/ultra-stream.sh << 'ENDSCRIPT'
#!/bin/bash
SLUG="$1"
URL="$2"
mkdir -p "/var/www/html/sports/$SLUG"

ffmpeg -hide_banner -loglevel warning \
  -fflags +genpts+igndts+discardcorrupt \
  -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 60 \
  -timeout 60000000 -i "$URL" \
  -c:v copy -c:a copy \
  -f hls -hls_time 10 -hls_list_size 12 -hls_delete_threshold 4 \
  -hls_flags delete_segments+omit_endlist+program_date_time \
  -hls_segment_filename "/var/www/html/sports/$SLUG/seg_%05d.ts" \
  "/var/www/html/sports/$SLUG/index.m3u8" &

echo $! > ~/sports-stream/pids/${SLUG}.pid
echo "Started $SLUG - PID: $!"
sleep 5
IP=$(curl -s ifconfig.me)
echo "URL: http://$IP/sports/$SLUG/index.m3u8"
ENDSCRIPT

chmod +x ~/ultra-stream.sh
```

### Step 3: Fix Nginx for HLS
```bash
sudo tee /etc/nginx/conf.d/hls.conf << 'EOF'
location /sports/ {
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Cache-Control "no-cache" always;
    
    location ~ \.m3u8$ {
        add_header Content-Type "application/vnd.apple.mpegurl" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }
    
    location ~ \.ts$ {
        add_header Content-Type "video/mp2t" always;
        add_header Cache-Control "public, max-age=30" always;
    }
    
    alias /var/www/html/sports/;
}
EOF

sudo nginx -t && sudo systemctl reload nginx
```

### Step 4: Start Streams
```bash
~/ultra-stream.sh nova-sport "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437"
sleep 3
~/ultra-stream.sh sky-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487"
sleep 3
~/ultra-stream.sh sky-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491"
```

### Step 5: Verify
```bash
# Check streams running
ps aux | grep ffmpeg | grep -v grep

# Check segments being created
ls -la /var/www/html/sports/nova-sport/

# Test URL
curl -I http://localhost/sports/nova-sport/index.m3u8
```

## Key Changes

| Setting | Old | New | Why |
|---------|-----|-----|-----|
| hls_time | 2-4s | **10s** | Longer = more stable |
| hls_list_size | 6 | **12** | 2 min buffer |
| reconnect_delay_max | 5s | **60s** | Wait longer before reconnect |
| timeout | 5s | **60s** | Don't timeout quickly |
| segment naming | %03d | **%05d** | More segments possible |

## VLC/Web Player URLs

```
http://YOUR_SERVER_IP/sports/nova-sport/index.m3u8
http://YOUR_SERVER_IP/sports/sky-1/index.m3u8
http://YOUR_SERVER_IP/sports/sky-2/index.m3u8
```

## Still Having Issues?

Check logs:
```bash
tail -f /var/log/nginx/error.log
tail -f ~/sports-stream/logs/*.log
```

Test source directly:
```bash
ffplay "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437"
```
