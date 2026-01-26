# 🛰️ AWS Lightsail IPTV Restream Master Guide

> **Complete setup guide for restreaming Xtream Codes IPTV via AWS Lightsail**  
> **Target:** 500+ concurrent viewers using CloudFront CDN

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Server Capacity Analysis](#2-server-capacity-analysis)
3. [Step-by-Step Server Setup (Ubuntu 24)](#3-step-by-step-server-setup)
4. [Xtream Codes Integration](#4-xtream-codes-integration)
5. [HLS Restreaming with FFmpeg](#5-hls-restreaming-with-ffmpeg)
6. [Nginx Configuration](#6-nginx-configuration)
7. [PM2 Process Management](#7-pm2-process-management)
8. [CloudFront CDN Setup (For 500+ Viewers)](#8-cloudfront-cdn-setup-for-500-viewers)
9. [Adding Channels to Your Website](#9-adding-channels-to-your-website)
10. [Monitoring & Troubleshooting](#10-monitoring--troubleshooting)
11. [Cost Breakdown](#11-cost-breakdown)
12. [Quick Reference Commands](#12-quick-reference-commands)

---

## 1. Overview & Architecture

### What We're Building

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        FANBROJ IPTV RESTREAM ARCHITECTURE                  │
└────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────┐         ┌──────────────────────┐         ┌──────────────┐
  │   StreamQ IPTV  │         │   AWS LIGHTSAIL      │         │  CloudFront  │
  │   (Source)      │─────────│   Ubuntu 24          │─────────│  CDN         │
  │                 │         │   FFmpeg + Nginx     │         │  (Optional)  │
  │ Username:       │  HTTP   │                      │  HTTPS  │              │
  │ 59ad8c73feb6   │─────────│  ┌────────────────┐  │─────────│  Worldwide   │
  │ Pass:           │         │  │ FFmpeg (Copy)  │  │         │  Edge Cache  │
  │ 3c0ac8cfe4     │         │  │ No Encoding!   │  │         │              │
  │                 │         │  └───────┬────────┘  │         │              │
  │ Server:         │         │          │           │         │              │
  │ cf.live78.online│         │  ┌───────▼────────┐  │         │              │
  └─────────────────┘         │  │ /hls/channel/  │  │         │              │
                              │  │  index.m3u8    │  │         │              │
                              │  │  001.ts        │  │         │              │
                              │  │  002.ts        │  │         │              │
                              │  └────────────────┘  │         └──────────────┘
                              │                      │                 │
                              │         Nginx        │                 │
                              │    Reverse Proxy     │                 │
                              └──────────────────────┘                 │
                                                                       │
                              ┌─────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   500+ VIEWERS      │
                    │                     │
                    │  📱 Mobile Apps     │
                    │  💻 Web Browsers    │
                    │  📺 Smart TVs       │
                    │                     │
                    │  fanbroj.net/tv     │
                    └─────────────────────┘
```

### How It Works

1. **Source:** StreamQ IPTV provides Xtream Codes credentials
2. **Encoder Server:** Your Lightsail server fetches streams via HTTP
3. **FFmpeg:** Converts to HLS format (Copy mode = 0% CPU)
4. **Nginx:** Serves HLS files with proper CORS headers
5. **CloudFront (Required for 500+ users):** Distributes globally
6. **Users:** Watch via your website (fanbroj.net)

---

## 2. Server Capacity Analysis

### Your Instance Specs ($24/month)

| Resource | Available | Notes |
|----------|-----------|-------|
| **RAM** | 4 GB | ✅ Excellent - FFmpeg uses ~50-100MB per stream |
| **CPU** | 2 vCPUs | ✅ Perfect - Copy mode uses ~0-5% CPU |
| **Storage** | 80 GB SSD | ✅ Plenty - Only stores 6 segments per channel (~50MB) |
| **Transfer** | 4 TB/mo | ⚠️ **Critical Limit** |

### Bandwidth Calculation

| Scenario | Viewers | Bitrate | Hourly Usage | Daily (8hr) | Monthly |
|----------|---------|---------|--------------|-------------|---------|
| Light | 10 | 2 Mbps | 9 GB | 72 GB | 2.2 TB |
| Medium | 50 | 2 Mbps | 45 GB | 360 GB | **10.8 TB** |
| Heavy | 100 | 2 Mbps | 90 GB | 720 GB | **21.6 TB** |
| Target | 500 | 2 Mbps | 450 GB | 3.6 TB | **108 TB** |

### ⚠️ CRITICAL FINDING

**Your 4 TB/month limit can directly serve:**
- ✅ ~10-20 concurrent viewers (24/7)
- ✅ ~50 concurrent viewers (for peak events only)
- ❌ 500 concurrent viewers = **IMPOSSIBLE without CDN**

### ✅ SOLUTION: Use CloudFront CDN

With CloudFront, your server becomes the **Origin** (source):
- Server bandwidth: ~5-10 GB/day (CloudFront fetches once)
- CloudFront handles 500+ users (pay per GB: ~$0.085/GB)

---

## 3. Step-by-Step Server Setup

### 3.1 SSH into Your Lightsail Instance

```bash
# From your local terminal (Mac)
ssh -i ~/LightsailDefaultKey.pem ubuntu@<YOUR_LIGHTSAIL_IP>
```

### 3.2 Update Ubuntu 24

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Set timezone (Somalia)
sudo timedatectl set-timezone Africa/Mogadishu
```

### 3.3 Install Core Dependencies

```bash
# Install all required packages
sudo apt install -y \
    ffmpeg \
    nginx \
    git \
    curl \
    certbot \
    python3-certbot-nginx \
    htop \
    iftop \
    unzip

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
ffmpeg -version  # Should show ffmpeg 6.x+
nginx -v         # Should show nginx/1.24+
node -v          # Should show v20.x
```

### 3.4 Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (sudo env PATH=...)
```

### 3.5 Create Streaming Directories

```bash
# Create HLS output directory
sudo mkdir -p /var/www/html/hls
sudo mkdir -p /var/log/streams

# Set permissions for ubuntu user
sudo chown -R ubuntu:ubuntu /var/www/html
sudo chown -R ubuntu:ubuntu /var/log/streams
sudo chmod -R 755 /var/www/html
```

### 3.6 Clone Your Scripts Repository

```bash
# Clone the Fanbroj repo (contains streaming scripts)
cd ~
git clone https://github.com/Ab07x/ciyaar.git

# Make scripts executable
chmod +x ~/ciyaar/scripts/*.sh
```

---

## 4. Xtream Codes Integration

### Your StreamQ Credentials

Based on your email, here are your credentials:

| Field | Value |
|-------|-------|
| **Username** | `59ad8c73feb6` |
| **Password** | `3c0ac8cfe4` |
| **Server URL** | `http://cf.live78.online` |
| **M3U URL** | `http://cf.live78.online/get.php?username=59ad8c73feb6&password=3c0ac8cfe4&type=m3u_plus&output=ts` |

### Xtream API Endpoints

Xtream Codes uses a standard API format:

```bash
# Live Stream URL Format
http://cf.live78.online/live/59ad8c73feb6/3c0ac8cfe4/CHANNEL_ID.ts

# Get Live Categories (JSON)
http://cf.live78.online/player_api.php?username=59ad8c73feb6&password=3c0ac8cfe4&action=get_live_categories

# Get Live Streams (JSON) 
http://cf.live78.online/player_api.php?username=59ad8c73feb6&password=3c0ac8cfe4&action=get_live_streams

# Get Live Streams by Category
http://cf.live78.online/player_api.php?username=59ad8c73feb6&password=3c0ac8cfe4&action=get_live_streams&category_id=CATEGORY_ID
```

### Finding Channel IDs

**Method 1: Using the find-channel.sh script**

```bash
# Search for Somali channels
~/ciyaar/scripts/find-channel.sh "Universal" 59ad8c73feb6 3c0ac8cfe4 cf.live78.online

# Search for sports channels
~/ciyaar/scripts/find-channel.sh "bein" 59ad8c73feb6 3c0ac8cfe4 cf.live78.online

# Search for specific channel
~/ciyaar/scripts/find-channel.sh "SNTV" 59ad8c73feb6 3c0ac8cfe4 cf.live78.online
```

**Method 2: Using the API directly**

```bash
# Download all live streams as JSON
curl "http://cf.live78.online/player_api.php?username=59ad8c73feb6&password=3c0ac8cfe4&action=get_live_streams" | jq '.[] | {name: .name, id: .stream_id}' | head -100
```

---

## 5. HLS Restreaming with FFmpeg

### Understanding Copy Mode (Most Important!)

**Copy Mode = Zero CPU Load**

FFmpeg has two modes:
1. **Transcode Mode:** Decodes video → processes → re-encodes (HIGH CPU)
2. **Copy Mode:** Simply repackages the stream (0% CPU) ✅ **USE THIS**

### The Master Restream Script

I've enhanced the existing script for production use:

**Create/Update:** `/home/ubuntu/ciyaar/scripts/start-247-channel.sh`

```bash
#!/bin/bash
# ==============================================================================
# FANBROJ 24/7 CHANNEL RELAY (Production Version)
# ==============================================================================
# Usage: ./start-247-channel.sh <slug> <username> <password> <channel_id> <host>
# Example: ./start-247-channel.sh universal 59ad8c73feb6 3c0ac8cfe4 12345 cf.live78.online
# ==============================================================================

if [ "$#" -ne 5 ]; then
    echo "Usage: $0 <slug> <username> <password> <channel_id> <host>"
    echo "Example: $0 universal 59ad8c73feb6 3c0ac8cfe4 12345 cf.live78.online"
    exit 1
fi

SLUG=$1
USER=$2
PASS=$3
CH_ID=$4
HOST=$5

# Construct Input URL (Xtream Codes standard format)
INPUT_URL="http://$HOST/live/$USER/$PASS/$CH_ID.ts"

# Output directories
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"
LOG_DIR="/var/log/streams"
LOG_FILE="$LOG_DIR/$SLUG.log"

# Create directories
mkdir -p "$STREAM_DIR"
mkdir -p "$LOG_DIR"

# Clean old segments
rm -f "$STREAM_DIR"/*.ts
rm -f "$STREAM_DIR"/*.m3u8

echo "=================================================="
echo "📺 FANBROJ STREAMING SERVER"
echo "=================================================="
echo "🎬 Channel: $SLUG"
echo "🔗 Source: http://$HOST/live/****/****/*****.ts (hidden)"
echo "📂 Output: $STREAM_DIR/index.m3u8"
echo "📝 Log: $LOG_FILE"
echo "=================================================="
echo "⏰ Started at: $(date)"
echo "=================================================="

# Infinite loop to auto-restart on failure
while true; do
    echo "[$(date)] Starting FFmpeg for $SLUG..." >> "$LOG_FILE"
    
    ffmpeg -hide_banner \
        -loglevel warning \
        -user_agent "VLC/3.0.18 LibVLC/3.0.18" \
        -fflags +genpts+discardcorrupt+nobuffer \
        -reconnect 1 \
        -reconnect_at_eof 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 5 \
        -i "$INPUT_URL" \
        -c:v copy \
        -c:a copy \
        -hls_time 4 \
        -hls_list_size 6 \
        -hls_flags delete_segments+append_list \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8" 2>> "$LOG_FILE"
    
    echo "[$(date)] ⚠️ Stream $SLUG disconnected! Restarting in 5s..." >> "$LOG_FILE"
    echo "⚠️ Stream disconnected! Restarting in 5 seconds..."
    sleep 5
done
```

### FFmpeg Parameters Explained

| Parameter | Purpose |
|-----------|---------|
| `-user_agent "VLC/..."` | Pretend to be VLC player (avoids blocks) |
| `-fflags +genpts+discardcorrupt` | Fix timestamp issues, skip bad packets |
| `-reconnect 1` | Auto-reconnect if source drops |
| `-reconnect_delay_max 5` | Wait max 5 seconds between reconnects |
| `-c:v copy -c:a copy` | **COPY MODE - Zero CPU** |
| `-hls_time 4` | 4-second segments (low latency) |
| `-hls_list_size 6` | Keep 6 segments in playlist (24 seconds) |
| `-hls_flags delete_segments` | Delete old segments (save disk) |

### Starting a Channel Manually (Test)

```bash
# Example: Start "Universal TV" channel
~/ciyaar/scripts/start-247-channel.sh \
    universal \
    59ad8c73feb6 \
    3c0ac8cfe4 \
    CHANNEL_ID_HERE \
    cf.live78.online
```

---

## 6. Nginx Configuration

### 6.1 Create Nginx Configuration

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create streaming config
sudo nano /etc/nginx/sites-available/streaming
```

**Paste this configuration:**

```nginx
# ==============================================================================
# FANBROJ STREAMING SERVER - Nginx Configuration
# ==============================================================================

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=hls_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 80;
    server_name _;

    # Root directory
    root /var/www/html;

    # ============================================================
    # HLS STREAMING LOCATION
    # ============================================================
    location /hls {
        alias /var/www/html/hls;
        
        # Rate limiting (prevent abuse)
        limit_req zone=hls_limit burst=20 nodelay;
        limit_conn conn_limit 5;

        # CORS Headers (Allow all origins for video players)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Range,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # MIME Types for HLS
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }

        # ============================================================
        # CACHING HEADERS (Critical for CloudFront)
        # ============================================================
        
        # .m3u8 playlists - Cache for 1 second only (changes constantly)
        location ~ \.m3u8$ {
            add_header 'Cache-Control' 'public, max-age=1, must-revalidate' always;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }

        # .ts segments - Cache for 1 hour (never changes once created)
        location ~ \.ts$ {
            add_header 'Cache-Control' 'public, max-age=3600' always;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
    }

    # ============================================================
    # HEALTH CHECK ENDPOINT
    # ============================================================
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # ============================================================
    # STATUS PAGE (Optional - Check active streams)
    # ============================================================
    location /status {
        alias /var/www/html/hls;
        autoindex on;
        autoindex_format json;
    }

    # Logging
    access_log /var/log/nginx/streaming_access.log;
    error_log /var/log/nginx/streaming_error.log;
}
```

### 6.2 Enable Configuration

```bash
# Create symbolic link
sudo ln -sf /etc/nginx/sites-available/streaming /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6.3 Firewall Setup

```bash
# Enable UFW firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Check status
sudo ufw status
```

---

## 7. PM2 Process Management

### 7.1 Start Channels with PM2

PM2 keeps your streams running 24/7 and auto-restarts on crash.

```bash
# Example: Start Universal TV channel
pm2 start ~/ciyaar/scripts/start-247-channel.sh \
    --name "ch-universal" \
    --interpreter bash \
    -- universal 59ad8c73feb6 3c0ac8cfe4 CHANNEL_ID cf.live78.online

# Example: Start SNTV channel
pm2 start ~/ciyaar/scripts/start-247-channel.sh \
    --name "ch-sntv" \
    --interpreter bash \
    -- sntv 59ad8c73feb6 3c0ac8cfe4 SNTV_CHANNEL_ID cf.live78.online

# Example: Start Sports channel
pm2 start ~/ciyaar/scripts/start-247-channel.sh \
    --name "ch-sports" \
    --interpreter bash \
    -- sports 59ad8c73feb6 3c0ac8cfe4 SPORTS_CHANNEL_ID cf.live78.online
```

### 7.2 PM2 Commands Reference

```bash
# View all running streams
pm2 list

# View logs for specific channel
pm2 logs ch-universal

# View all logs
pm2 logs

# Restart a channel
pm2 restart ch-universal

# Stop a channel
pm2 stop ch-universal

# Delete a channel from PM2
pm2 delete ch-universal

# Save current configuration (survives reboot)
pm2 save

# View resource usage
pm2 monit
```

### 7.3 Example: Start Multiple Channels

Create a startup script:

```bash
# Create startup script
nano ~/start-all-channels.sh
```

```bash
#!/bin/bash
# ==============================================================================
# START ALL FANBROJ TV CHANNELS
# ==============================================================================

XTREAM_USER="59ad8c73feb6"
XTREAM_PASS="3c0ac8cfe4"
XTREAM_HOST="cf.live78.online"
SCRIPT="$HOME/ciyaar/scripts/start-247-channel.sh"

# Define channels: slug:channel_id
declare -A CHANNELS=(
    ["universal"]="123456"
    ["sntv"]="123457"
    ["sports"]="123458"
    # Add more channels here
)

# Start each channel
for slug in "${!CHANNELS[@]}"; do
    ch_id="${CHANNELS[$slug]}"
    echo "Starting channel: $slug (ID: $ch_id)"
    pm2 start "$SCRIPT" --name "ch-$slug" --interpreter bash -- \
        "$slug" "$XTREAM_USER" "$XTREAM_PASS" "$ch_id" "$XTREAM_HOST"
done

# Save PM2 configuration
pm2 save

echo "✅ All channels started!"
pm2 list
```

```bash
# Make executable
chmod +x ~/start-all-channels.sh

# Run it
~/start-all-channels.sh
```

---

## 8. CloudFront CDN Setup (For 500+ Viewers)

### Why CloudFront is REQUIRED for 500 Viewers

| Without CloudFront | With CloudFront |
|-------------------|-----------------|
| Server serves all 500 users directly | Server serves CloudFront only (1 viewer) |
| 500 × 2 Mbps = 1 Gbps constant | ~5 Mbps constant |
| 4 TB/month limit = ~8 hours | Unlimited (pay per use) |
| ❌ Will fail | ✅ Scales infinitely |

### 8.1 Create CloudFront Distribution

1. **Go to AWS Console** → **CloudFront** → **Create Distribution**

2. **Origin Settings:**
   - Origin Domain: `YOUR_LIGHTSAIL_IP` (or domain if you have one)
   - Protocol: HTTP Only
   - Origin Path: Leave empty

3. **Default Cache Behavior:**
   - Path Pattern: `Default (*)`
   - Viewer Protocol Policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP Methods: **GET, HEAD**
   - Cache Policy: **Create New** (see below)

4. **Create Custom Cache Policy:**

   ```
   Policy Name: HLS-LiveStreaming
   
   Minimum TTL: 0 seconds
   Maximum TTL: 31536000 seconds (1 year)
   Default TTL: 1 second
   
   Headers: None
   Cookies: None
   Query Strings: None
   
   Compression: Enable (Gzip, Brotli)
   ```

5. **Origin Request Policy:** All Viewer

6. **Price Class:** Use All Edge Locations (best performance)

7. **Create Distribution**

### 8.2 Wait for Deployment

CloudFront takes 5-15 minutes to deploy. You'll get a domain like:
```
d1234abcdef.cloudfront.net
```

### 8.3 Test CloudFront

```bash
# Test direct from origin
curl -I http://YOUR_LIGHTSAIL_IP/hls/universal/index.m3u8

# Test via CloudFront
curl -I https://d1234abcdef.cloudfront.net/hls/universal/index.m3u8
```

### 8.4 Use CloudFront URL in Your Website

**Old (Direct - don't use):**
```
https://stream.fanbroj.net/hls/universal/index.m3u8
```

**New (Via CloudFront - use this):**
```
https://d1234abcdef.cloudfront.net/hls/universal/index.m3u8
```

Or set up a custom domain (CNAME):
```
https://cdn.fanbroj.net/hls/universal/index.m3u8
```

---

## 9. Adding Channels to Your Website

### 9.1 Update Convex Database

In your Convex Dashboard, add channels with these URLs:

| Field | Value |
|-------|-------|
| `slug` | `universal` |
| `title` | `Universal TV` |
| `streamUrl` | `https://d1234abcdef.cloudfront.net/hls/universal/index.m3u8` |
| `isLive` | `true` |
| `category` | `entertainment` |

### 9.2 Test in Browser

Your video player should work with the HLS.js library:

```javascript
// Example using HLS.js
if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource('https://d1234abcdef.cloudfront.net/hls/universal/index.m3u8');
    hls.attachMedia(videoElement);
}
```

---

## 10. Monitoring & Troubleshooting

### 10.1 Check Stream Status

```bash
# Check if segments are being created
ls -la /var/www/html/hls/universal/

# Watch in real-time
watch -n 1 'ls -la /var/www/html/hls/universal/'

# Check FFmpeg logs
tail -f /var/log/streams/universal.log

# Check PM2 status
pm2 list
pm2 monit
```

### 10.2 Network Monitoring

```bash
# Install iftop (bandwidth monitor)
sudo apt install -y iftop

# Monitor bandwidth usage
sudo iftop

# Check network stats
vnstat -h
```

### 10.3 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Stream not starting | Wrong channel ID | Run `find-channel.sh` to verify ID |
| 403 Forbidden from source | IP blocked | Use VPN/proxy or new Lightsail IP |
| High latency | HLS segment too long | Reduce `-hls_time` to 2 |
| Buffer issues | Network congestion | Check source bandwidth |
| CORS errors | Missing headers | Verify Nginx CORS config |

### 10.4 Testing Stream Quality

```bash
# Test stream with VLC (on your Mac)
vlc https://YOUR_IP/hls/universal/index.m3u8

# Or use ffprobe
ffprobe -v error -show_format -show_streams https://YOUR_IP/hls/universal/index.m3u8
```

---

## 11. Cost Breakdown

### Fixed Costs

| Item | Monthly Cost |
|------|--------------|
| AWS Lightsail (4GB/2vCPU) | $24 |
| StreamQ IPTV (after trial) | ~$10-20 |
| Domain (if new) | ~$1 |
| **Subtotal** | **~$35-45** |

### Variable Costs (CloudFront)

CloudFront charges per GB of data transferred:

| Region | Price per GB |
|--------|--------------|
| US/EU | $0.085 |
| Africa | $0.110 |
| Global Average | ~$0.09 |

**500 Viewers Example:**

```
500 viewers × 2 Mbps × 3600 sec/hour = 450 GB/hour
450 GB × $0.09 = $40.50/hour

For 4 peak hours/day × 30 days:
450 GB × 4 hours × 30 days × $0.09 = $4,860/month 😱
```

### ⚠️ Cost Optimization Tips

1. **Lower bitrate:** Transcode to 1.5 Mbps (saves 25%)
2. **Limit hours:** Only stream during events (not 24/7)
3. **Regional pricing:** Use specific edge locations
4. **Reserved capacity:** Commit to CloudFront for discounts

### Realistic Scenarios

| Scenario | Viewers | Hours/Day | Monthly Cost |
|----------|---------|-----------|--------------|
| Small (Local TV) | 50 | 8 | ~$390 |
| Medium (Events) | 200 | 4 | ~$650 |
| Large (24/7 TV) | 500 | 24 | ~$9,700 |

---

## 12. Quick Reference Commands

### Server Management

```bash
# SSH into server
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_IP

# Update server
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Check memory
free -h

# Check processes
htop
```

### Streaming Commands

```bash
# Find channel ID
~/ciyaar/scripts/find-channel.sh "CHANNEL_NAME" 59ad8c73feb6 3c0ac8cfe4 cf.live78.online

# Start channel
pm2 start ~/ciyaar/scripts/start-247-channel.sh --name "ch-NAME" --interpreter bash -- NAME USER PASS ID HOST

# Stop channel
pm2 stop ch-NAME

# View all channels
pm2 list

# View logs
pm2 logs

# Save config
pm2 save
```

### Nginx Commands

```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View access logs
tail -f /var/log/nginx/streaming_access.log
```

### Quick Health Checks

```bash
# Check if channel is streaming
curl -I http://localhost/hls/universal/index.m3u8

# Count current segments
ls /var/www/html/hls/universal/*.ts | wc -l

# Check bandwidth
sudo iftop -i eth0
```

---

## 🎯 Quick Start Checklist

1. [ ] SSH into your Lightsail Ubuntu 24 server
2. [ ] Run system update: `sudo apt update && sudo apt upgrade -y`
3. [ ] Install dependencies: `sudo apt install -y ffmpeg nginx git nodejs npm`
4. [ ] Install PM2: `sudo npm install -g pm2`
5. [ ] Clone scripts: `git clone https://github.com/Ab07x/ciyaar.git`
6. [ ] Configure Nginx (copy config above)
7. [ ] Find channel IDs using `find-channel.sh`
8. [ ] Start channels with PM2
9. [ ] Set up CloudFront CDN
10. [ ] Update your website with CloudFront URLs
11. [ ] Monitor with `pm2 monit` and `htop`

---

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs` and `/var/log/nginx/streaming_error.log`
2. Verify source: Test IPTV URL directly in VLC
3. Check CloudFront: AWS Console → CloudFront → Your Distribution → Monitoring

---

*Last Updated: January 2026*  
*Author: Fanbroj Engineering Team*
