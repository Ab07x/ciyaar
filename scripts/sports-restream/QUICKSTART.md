# 🚀 Quick Start - cdnfly.online Sports Streaming

Your 16GB server is ready! Here's how to start streaming immediately.

---

## 📋 Your IPTV Credentials

```
Username: d06HPCFR
Password: qEBJjW3
Server:   iptvtour.store
M3U URL:  http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts
```

---

## 🎯 First Time Setup (Run Once)

```bash
# SSH into your 16GB server
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_STATIC_IP

# 1. Setup folder structure
mkdir -p ~/sports-stream/logs ~/sports-stream/pids ~/sports-stream/config

# 2. Initialize stream protection (encrypts your credentials)
~/sports-stream/scripts/stream-protector.sh init

# 3. Add your IPTV source (encrypted)
~/sports-stream/scripts/stream-protector.sh add iptvtour "http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts"

# 4. Configure stealth mode
~/sports-stream/scripts/stealth-restreamer.sh config

# 5. Start health monitor
~/sports-stream/scripts/monitor-health.sh start
```

---

## 🎥 Start Streaming (Use These Commands)

### Option A: Direct Stream (No Stealth)
```bash
# Start a match immediately
~/sports-stream/scripts/sports-event-manager.sh start "match-1" "http://iptvtour.store/live/d06HPCFR/qEBJjW3/CHANNEL_ID.ts" 150
```

### Option B: Stealth Stream (Hide from Provider) ⭐ RECOMMENDED
```bash
# Get encrypted source
SOURCE=$(~/sports-stream/scripts/stream-protector.sh get iptvtour)

# Start with stealth
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE" /var/www/html/sports/match-1
```

---

## 🔍 Finding Channel IDs

```bash
# Download and search M3U
curl -s "http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts" -o /tmp/channels.m3u

# Search for sports channels
grep -i "bein\|espn\|sky\|sport" /tmp/channels.m3u | head -20

# Extract channel ID from URL
# URL format: http://iptvtour.store/live/d06HPCFR/qEBJjW3/12345.ts
# Channel ID: 12345
```

---

## 📺 Watch Your Stream

Once started, your stream is available at:

```
https://cdnfly.online/sports/match-1/index.m3u8
```

Or via CloudFront:
```
https://cdn.cdnfly.online/sports/match-1/index.m3u8
```

---

## 🎮 Common Commands

```bash
# View all commands
sm

# Start event
sm start "event-name" "source-url" 150

# Stop event
sm stop "event-name"

# List active events
sm list

# View status
sm status

# View logs
sm logs "event-name"

# Check system performance
perf

# Monitor health
mon status
```

---

## ⚡ Quick Test

```bash
# Test with a generic channel (replace 12345 with actual channel ID)
~/sports-stream/scripts/sports-event-manager.sh start test "http://iptvtour.store/live/d06HPCFR/qEBJjW3/12345.ts" 30

# Check if working
curl -I http://localhost/sports/test/index.m3u8

# Stop test
sm stop test
```

---

## 🛡️ Enable Stealth Mode (Hide from Provider)

```bash
# 1. Buy residential proxy (BrightData, Oxylabs, etc.)
# 2. Edit config
nano ~/sports-stream/config/proxy.conf

# 3. Add proxy
RESIDENTIAL_PROXIES=(
    "http://user:pass@proxy.example.com:8080"
)

# 4. Test proxy
~/sports-stream/scripts/stealth-restreamer.sh test-proxy

# 5. Start stealth stream
SOURCE=$(~/sports-stream/scripts/stream-protector.sh get iptvtour)
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE" /var/www/html/sports/event-1
```

---

## 📊 Monitor Your Server

```bash
# Real-time dashboard
~/sports-stream/scripts/dashboard.sh

# Or use aliases:
streams          # Active stream count
stream-ram       # Memory usage
stream-cpu       # CPU usage
nginx-conns      # Viewer connections
perf             # All metrics
```

---

## 🚨 Emergency Commands

```bash
# Stop all streams immediately
sm stop all

# Restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Check disk space
df -h
```

---

## ✅ Pre-Stream Checklist

- [ ] Health monitor running: `mon status`
- [ ] Nginx active: `sudo systemctl status nginx`
- [ ] Disk space available: `df -h`
- [ ] Source encrypted: `sp list`
- [ ] Proxy configured (for stealth): `~/sports-stream/config/proxy.conf`
- [ ] DNS working: `dig stream.cdnfly.online`

---

**Ready to stream!** 🏆