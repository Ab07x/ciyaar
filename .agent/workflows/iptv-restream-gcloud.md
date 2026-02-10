---
description: IPTV to HLS m3u8 Restreaming on Google Cloud - Complete Setup Guide
---

# 🎬 IPTV → HLS m3u8 Restreaming on Google Cloud

Convert your IPTV streams to clean `.m3u8` URLs for Fire HLS Player (or any HLS player).

**Cost:** ~$5-15/month (much cheaper than IVS!)

---

## 📋 Prerequisites

- Google Cloud Console account with billing enabled
- Your IPTV credentials (e.g., `http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188`)
- Fire HLS Player panel access

---

## 🚀 Step 1: Create Google Cloud VM

### 1.1 Go to Google Cloud Console
```
https://console.cloud.google.com/compute/instances
```

### 1.2 Click "CREATE INSTANCE" with these settings:

| Setting | Value |
|---------|-------|
| **Name** | `iptv-restream` |
| **Region** | Choose closest to your viewers (e.g., `europe-west1` or `us-central1`) |
| **Machine type** | `e2-medium` (2 vCPU, 4GB RAM) - Good for 3-5 channels |
| **Boot disk** | Ubuntu 22.04 LTS, 20GB SSD |
| **Firewall** | ✅ Allow HTTP, ✅ Allow HTTPS |

### 1.3 Click "CREATE" and wait for the VM to start

### 1.4 Note your External IP (e.g., `34.123.45.67`)

---

## 🔧 Step 2: SSH and Install Dependencies

### 2.1 Click "SSH" button next to your VM in Google Cloud Console

### 2.2 Run these commands (copy entire block):

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install FFmpeg, Nginx, and tools
sudo apt install -y ffmpeg nginx curl htop screen

# Create directories
mkdir -p ~/iptv-restream/{scripts,logs,pids}
sudo mkdir -p /var/www/html/live
sudo chown -R $USER:$USER /var/www/html/live

# Verify FFmpeg
ffmpeg -version | head -3
```

---

## 🌐 Step 3: Configure Nginx for HLS

### 3.1 Create Nginx config:

```bash
sudo tee /etc/nginx/sites-available/hls-stream << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    root /var/www/html;
    
    # HLS Stream location
    location /live/ {
        # CORS for all players
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range, Origin, X-Requested-With, Content-Type, Accept" always;
        
        # M3U8 playlist - no cache for live
        location ~ \.m3u8$ {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Cache-Control "no-cache, no-store, must-revalidate" always;
            add_header Pragma "no-cache" always;
            expires -1;
            types { application/vnd.apple.mpegurl m3u8; }
        }
        
        # TS segments - short cache
        location ~ \.ts$ {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Cache-Control "public, max-age=5" always;
            expires 5s;
            types { video/mp2t ts; }
        }
        
        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF
```

### 3.2 Enable the config:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/hls-stream /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 📺 Step 4: Create the Restream Script

### 4.1 Create the main restream script:

```bash
cat > ~/iptv-restream/scripts/start-channel.sh << 'SCRIPT'
#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
#  IPTV → HLS Restreamer
#  Converts IPTV stream to m3u8 for Fire HLS Player
#═══════════════════════════════════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CHANNEL_NAME="$1"
IPTV_URL="$2"

if [ -z "$CHANNEL_NAME" ] || [ -z "$IPTV_URL" ]; then
    echo -e "${RED}Usage: $0 <channel-name> <iptv-url>${NC}"
    echo ""
    echo "Example:"
    echo "  $0 bein-sports-1 \"http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188\""
    exit 1
fi

# Paths
OUTPUT_DIR="/var/www/html/live/$CHANNEL_NAME"
LOG_FILE="$HOME/iptv-restream/logs/${CHANNEL_NAME}.log"
PID_FILE="$HOME/iptv-restream/pids/${CHANNEL_NAME}.pid"

# Stop existing stream for this channel
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping existing stream (PID: $OLD_PID)...${NC}"
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*.ts "$OUTPUT_DIR"/*.m3u8 2>/dev/null

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Starting IPTV → HLS Restream${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  Channel: ${GREEN}$CHANNEL_NAME${NC}"
echo -e "  Source:  $IPTV_URL"
echo ""

# Start FFmpeg restream
ffmpeg -hide_banner -loglevel warning \
    -fflags +genpts+igndts+discardcorrupt \
    -reconnect 1 \
    -reconnect_at_eof 1 \
    -reconnect_streamed 1 \
    -reconnect_delay_max 30 \
    -timeout 30000000 \
    -i "$IPTV_URL" \
    \
    -c:v copy \
    -c:a aac -b:a 128k -ar 44100 \
    \
    -f hls \
    -hls_time 4 \
    -hls_list_size 6 \
    -hls_flags delete_segments+omit_endlist+append_list \
    -hls_segment_type mpegts \
    -hls_segment_filename "$OUTPUT_DIR/seg_%05d.ts" \
    "$OUTPUT_DIR/index.m3u8" \
    >> "$LOG_FILE" 2>&1 &

FFMPEG_PID=$!
echo $FFMPEG_PID > "$PID_FILE"

# Wait for stream to start
echo -e "${YELLOW}Waiting for stream to initialize...${NC}"
sleep 5

if ps -p "$FFMPEG_PID" > /dev/null 2>&1; then
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ STREAM STARTED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}📺 Your m3u8 URL (paste in Fire HLS Player):${NC}"
    echo ""
    echo -e "     ${GREEN}http://$SERVER_IP/live/$CHANNEL_NAME/index.m3u8${NC}"
    echo ""
    echo -e "  PID: $FFMPEG_PID"
    echo -e "  Log: $LOG_FILE"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}❌ Failed to start stream. Check log: $LOG_FILE${NC}"
    tail -20 "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
SCRIPT

chmod +x ~/iptv-restream/scripts/start-channel.sh
```

### 4.2 Create the stop script:

```bash
cat > ~/iptv-restream/scripts/stop-channel.sh << 'SCRIPT'
#!/bin/bash
CHANNEL_NAME="$1"

if [ -z "$CHANNEL_NAME" ]; then
    echo "Usage: $0 <channel-name>"
    echo "       $0 all  (stops all channels)"
    exit 1
fi

if [ "$CHANNEL_NAME" = "all" ]; then
    echo "Stopping all streams..."
    pkill -f "ffmpeg.*hls" 2>/dev/null
    rm -f ~/iptv-restream/pids/*.pid
    echo "✅ All streams stopped"
else
    PID_FILE="$HOME/iptv-restream/pids/${CHANNEL_NAME}.pid"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        kill "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        rm -rf "/var/www/html/live/$CHANNEL_NAME"
        echo "✅ Stopped: $CHANNEL_NAME"
    else
        echo "Channel not running: $CHANNEL_NAME"
    fi
fi
SCRIPT

chmod +x ~/iptv-restream/scripts/stop-channel.sh
```

### 4.3 Create the status script:

```bash
cat > ~/iptv-restream/scripts/status.sh << 'SCRIPT'
#!/bin/bash
echo "═══════════════════════════════════════════════════════════"
echo "  IPTV Restream Status"
echo "═══════════════════════════════════════════════════════════"
echo ""

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_IP")

for pid_file in ~/iptv-restream/pids/*.pid; do
    [ -f "$pid_file" ] || continue
    channel=$(basename "$pid_file" .pid)
    pid=$(cat "$pid_file")
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "  ✅ $channel"
        echo -e "     URL: http://$SERVER_IP/live/$channel/index.m3u8"
        echo -e "     PID: $pid"
    else
        echo -e "  ❌ $channel (dead)"
        rm -f "$pid_file"
    fi
    echo ""
done

if [ ! "$(ls -A ~/iptv-restream/pids/ 2>/dev/null)" ]; then
    echo "  No active streams"
fi
echo "═══════════════════════════════════════════════════════════"
SCRIPT

chmod +x ~/iptv-restream/scripts/status.sh
```

### 4.4 Create convenient aliases:

```bash
# Add to bashrc for easy access
echo '
# IPTV Restream shortcuts
alias stream-start="~/iptv-restream/scripts/start-channel.sh"
alias stream-stop="~/iptv-restream/scripts/stop-channel.sh"
alias stream-status="~/iptv-restream/scripts/status.sh"
alias stream-logs="tail -f ~/iptv-restream/logs/*.log"
' >> ~/.bashrc

source ~/.bashrc
```

---

## 🎯 Step 5: Start Your First Stream!

### 5.1 Test with your IPTV channel:

```bash
# Start a channel
stream-start bein-1 "http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188"
```

### 5.2 Your m3u8 URL will be:

```
http://YOUR_SERVER_IP/live/bein-1/index.m3u8
```

### 5.3 Paste this URL in your Fire HLS Player!

---

## 📺 Step 6: Running Multiple Channels

```bash
# Start multiple channels
stream-start bein-1 "http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188"
stream-start sky-sports "http://iptvtour.store:80/jqA5b6mC/fHnme5H/12345"
stream-start espn "http://iptvtour.store:80/jqA5b6mC/fHnme5H/67890"

# Check status
stream-status

# Stop a specific channel
stream-stop bein-1

# Stop all
stream-stop all
```

---

## 🔄 Step 7: Auto-Restart on Reboot (Optional)

### 7.1 Create a startup script:

```bash
cat > ~/iptv-restream/scripts/autostart.sh << 'SCRIPT'
#!/bin/bash
# Add your channels here - they will start on boot

# Wait for network
sleep 10

# Your channels (uncomment and edit as needed)
# ~/iptv-restream/scripts/start-channel.sh bein-1 "http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188"
# ~/iptv-restream/scripts/start-channel.sh sky-1 "http://iptvtour.store:80/YOUR_CREDS/CHANNEL_ID"
SCRIPT

chmod +x ~/iptv-restream/scripts/autostart.sh
```

### 7.2 Add to crontab:

```bash
(crontab -l 2>/dev/null; echo "@reboot sleep 30 && ~/iptv-restream/scripts/autostart.sh") | crontab -
```

---

## 🔗 Step 8: Using with Fire HLS Player

In your Fire HLS Player panel:

1. Go to **Add Video** or **Add Stream**
2. Select source type: **M3U8 / HLS**
3. Paste your URL: `http://YOUR_SERVER_IP/live/CHANNEL_NAME/index.m3u8`
4. Save and use the embed code!

---

## 💰 Cost Breakdown

| Resource | Monthly Cost |
|----------|--------------|
| e2-medium VM (2 vCPU, 4GB) | ~$25 |
| **OR** e2-small (2 vCPU, 2GB) | ~$13 |
| **OR** e2-micro (2 vCPU, 1GB) | ~$7 |
| Network egress (100GB) | ~$8 |
| **Total (small setup)** | **~$15-20/month** |

💡 **Tip:** Use e2-micro for 1-2 channels, e2-small for 3-4 channels, e2-medium for 5+ channels.

---

## 🛠️ Troubleshooting

### Stream not starting?
```bash
# Check logs
tail -50 ~/iptv-restream/logs/CHANNEL_NAME.log

# Check if FFmpeg is running
ps aux | grep ffmpeg

# Test IPTV source directly
ffplay "http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188"
```

### 403 Forbidden on m3u8?
```bash
# Check nginx
sudo nginx -t
sudo systemctl restart nginx

# Check permissions
sudo chown -R $USER:$USER /var/www/html/live
```

### High CPU usage?
The script uses `-c:v copy` (no transcoding). If CPU is high:
```bash
# Check which streams are running
htop

# Reduce number of concurrent streams
stream-stop CHANNEL_NAME
```

---

## 🎉 Quick Reference

| Command | Description |
|---------|-------------|
| `stream-start NAME "URL"` | Start a channel |
| `stream-stop NAME` | Stop a channel |
| `stream-stop all` | Stop all channels |
| `stream-status` | Show running channels |
| `stream-logs` | Watch live logs |

### Your m3u8 URLs:
```
http://YOUR_SERVER_IP/live/CHANNEL_NAME/index.m3u8
```

---

## 📌 Example: Your IPTV Setup

```bash
# Your channel
stream-start match-live "http://iptvtour.store:80/jqA5b6mC/fHnme5H/65188"

# Result URL for Fire HLS Player:
# http://34.123.45.67/live/match-live/index.m3u8
```

---

**Done!** You now have a cost-effective IPTV to HLS restreaming setup on Google Cloud. 🚀
