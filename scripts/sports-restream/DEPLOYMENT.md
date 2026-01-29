# 🏆 Sports Streaming Server - Deployment Guide

Complete guide for deploying a sports event streaming server on AWS Lightsail with 100% uptime and hidden source protection.

---

## 📋 Prerequisites

- AWS Lightsail account
- Domain name (e.g., `cdnfly.online`)
- CloudFlare account (for DNS and protection)
- CloudFront distribution (optional but recommended)
- IPTV source URLs (kept secret)

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Create AWS Lightsail Instance

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click **Create Instance**
3. Select:
   - **Region:** Closest to your audience (e.g., Frankfurt for Europe/Africa)
   - **Platform:** Linux/Unix
   - **Blueprint:** Ubuntu 24.04 LTS
   - **Instance Plan:** $44/month (8GB RAM, 2 vCPUs, 160GB SSD)
4. Name it: `sports-stream-server`
5. Click **Create Instance**

### Step 2: Configure Networking

In Lightsail Console → Your Instance → **Networking**:

Add these firewall rules:

| Application | Protocol | Port | Description |
|-------------|----------|------|-------------|
| HTTP        | TCP      | 80   | Web server  |
| HTTPS       | TCP      | 443  | SSL         |
| SSH         | TCP      | 22   | Management  |
| RTMP        | TCP      | 1935 | Streaming   |

Create a **Static IP** and attach it to your instance.

### Step 3: Connect and Deploy

```bash
# SSH into your server
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_STATIC_IP

# Run the setup script
curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/sports-restream/setup-sports-server.sh | bash

# Or if you have the scripts locally:
# ./setup-sports-server.sh
```

The setup takes about 5-10 minutes.

---

## ⚙️ Configuration

### Step 4: Configure Domain & CDN

#### CloudFlare Setup:

1. Add your domain to CloudFlare
2. Create an A record:
   - Name: `stream`
   - Target: Your Lightsail Static IP
   - Proxy Status: DNS Only (gray cloud)

3. Create a CNAME for CDN:
   - Name: `cdn`
   - Target: Your CloudFront domain
   - Proxy Status: Proxied (orange cloud)

#### CloudFront Setup (Optional but Recommended):

1. Go to AWS CloudFront Console
2. Create Distribution:
   - **Origin Domain:** Your Lightsail Static IP
   - **Origin Protocol:** HTTP
   - **Allowed HTTP Methods:** GET, HEAD, OPTIONS
   - **Cache Policy:** CachingOptimized
   - **Origin Request Policy:** CORS-CustomOrigin

3. Add Alternate Domain Names:
   - `cdn.yourdomain.online`

4. Request SSL Certificate in ACM (us-east-1 region)

5. Update your config:

```bash
# Edit the sports config
nano ~/sports-stream/config/sports.conf

# Add:
CLOUDFRONT_DOMAIN=cdn.yourdomain.online
DOMAIN=yourdomain.online
```

### Step 5: Protect Your Sources

```bash
# Initialize stream protection
~/sports-stream/scripts/stream-protector.sh init

# Add your IPTV sources (encrypted)
~/sports-stream/scripts/stream-protector.sh add bein1 "http://iptv-provider.com/bein1.m3u8"
~/sports-stream/scripts/stream-protector.sh add sky-sports "http://iptv-provider.com/sky.m3u8"

# List sources (URLs are hidden)
~/sports-stream/scripts/stream-protector.sh list
```

---

## 🎮 Usage

### Start Streaming a Sports Event

```bash
# Start immediately
~/sports-stream/scripts/sports-event-manager.sh start "premier-league" "http://your-source.com/stream.m3u8" 150

# Or use protected source
SOURCE=$(~/sports-stream/scripts/stream-protector.sh get bein1)
~/sports-stream/scripts/sports-event-manager.sh start "premier-league" "$SOURCE" 150
```

**Parameters:**
- `premier-league` - Event name (will be sanitized)
- `150` - Duration in minutes (2.5 hours with buffer)

### Schedule an Event

```bash
# Schedule for later
~/sports-stream/scripts/sports-event-manager.sh schedule "ucl-final" "$SOURCE" "2026-02-15 20:00" 150
```

### Monitor Events

```bash
# View all events
~/sports-stream/scripts/sports-event-manager.sh status

# View logs
~/sports-stream/scripts/sports-event-manager.sh logs premier-league

# Stop an event
~/sports-stream/scripts/sports-event-manager.sh stop premier-league
```

### Start Health Monitor

```bash
# Start the monitor daemon
~/sports-stream/scripts/monitor-health.sh start

# Check system status
~/sports-stream/scripts/monitor-health.sh status

# View monitor logs
~/sports-stream/scripts/monitor-health.sh logs
```

---

## 🔒 Security Features

### Source Protection

- **Encrypted Storage:** All source URLs are encrypted at rest
- **No Exposure:** Original URLs never exposed to end users
- **User-Agent Rotation:** Random mobile User-Agents for requests
- **Referrer Masking:** Requests appear to come from localhost

### Access Control

- **Token-Based Access:** Generate time-limited access tokens
- **IP Whitelisting:** Restrict ingest to private networks
- **Rate Limiting:** Prevent abuse with request limits

### Stream Hiding

```bash
# Generate access token (valid for 4 hours)
TOKEN=$(~/sports-stream/scripts/stream-protector.sh token "premier-league" 4)

# Validate token
~/sports-stream/scripts/stream-protector.sh validate "$TOKEN"
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VIEWERS                                  │
│                    (Web Players)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (CDN)                             │
│              - DDoS Protection                                  │
│              - SSL Termination                                  │
│              - Caching Layer                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AWS CLOUDFRONT (Optional)                       │
│              - Edge Caching                                     │
│              - Global Distribution                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AWS LIGHTSAIL ($44/mo)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  NGINX + RTMP Module                                    │   │
│  │  - HLS Streaming (/var/www/html/sports)                 │   │
│  │  - RTMP Ingest (port 1935, internal only)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FFmpeg Relay                                           │   │
│  │  - Pulls from IPTV source                               │   │
│  │  - Creates HLS segments                                 │   │
│  │  - Rotates User-Agents                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Encrypted Source Storage                               │   │
│  │  - AES-256 encrypted URLs                               │   │
│  │  - No plain text exposure                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              IPTV PROVIDER (Hidden from public)                 │
│         - Original source never exposed                         │
│         - Requests masked with random UAs                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Stream Not Starting

```bash
# Check FFmpeg is installed
ffmpeg -version

# Check nginx is running
sudo systemctl status nginx

# Check nginx config
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Source Connection Issues

```bash
# Test source directly
~/sports-stream/scripts/stream-protector.sh test "http://your-source.com/stream.m3u8"

# Check with ffprobe
ffprobe -v error -show_entries format=duration "http://your-source.com/stream.m3u8"
```

### High CPU/Memory Usage

```bash
# Monitor resources
htop

# Check active FFmpeg processes
ps aux | grep ffmpeg

# View stream statistics
~/sports-stream/scripts/monitor-health.sh status
```

---

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| AWS Lightsail (8GB) | $44 |
| CloudFront (estimated) | $15-30 |
| Domain (.online) | $2-5 |
| **Total** | **~$60-80/month** |

---

## 🔄 Maintenance

### Daily

```bash
# Check status
~/sports-stream/scripts/monitor-health.sh status

# View active events
~/sports-stream/scripts/sports-event-manager.sh list
```

### Weekly

```bash
# Cleanup old recordings
~/sports-stream/scripts/sports-event-manager.sh cleanup

# Check disk space
df -h
```

### Monthly

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Check logs for issues
find ~/sports-stream/logs -name "*.log" -exec grep -l "ERROR" {} \;
```

---

## 📞 Support

For issues or questions:

1. Check logs: `~/sports-stream/logs/`
2. Review nginx logs: `/var/log/nginx/`
3. Test sources: `~/sports-stream/scripts/stream-protector.sh test <url>`

---

## ⚽ Example: Streaming a Football Match

```bash
# 1. Add your source (one time setup)
~/sports-stream/scripts/stream-protector.sh add bein-sports-1 "http://iptv.example.com/bein1.m3u8"

# 2. Get the protected source URL
SOURCE=$(~/sports-stream/scripts/stream-protector.sh get bein-sports-1)

# 3. Start streaming 15 minutes before kickoff
~/sports-stream/scripts/sports-event-manager.sh start "man-city-vs-liverpool" "$SOURCE" 150

# 4. Start the monitor for auto-recovery
~/sports-stream/scripts/monitor-health.sh start

# 5. Get your stream URL
# https://cdn.yourdomain.online/sports/man-city-vs-liverpool-1234567890-abc123/index.m3u8

# 6. Stop after the match
~/sports-stream/scripts/sports-event-manager.sh stop "man-city-vs-liverpool"
```

---

**Your streaming server is now ready for 100% uptime sports events!** 🎉
