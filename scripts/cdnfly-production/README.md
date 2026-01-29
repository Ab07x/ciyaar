# CDNFly Production - World Cup & Premier League Streaming

Production-ready IPTV streaming infrastructure optimized for high-traffic live sports events.

---

## 🎯 Quick Start (3 Commands)

```bash
# 1. Upload to server
scp scripts/cdnfly-production/* root@13.61.180.155:/root/cdnfly/

# 2. SSH and setup
ssh root@13.61.180.155
cd /root/cdnfly && chmod +x *.sh

# 3. Start streaming
./production-streamer.sh start
```

**Your streams:** `https://stream.cdnfly.online/channel-{1-5}/playlist.m3u8`

---

## 📦 Scripts Overview

| Script | Purpose |
|--------|---------|
| `find-channels.sh` | Interactive channel discovery from M3U playlist |
| `production-streamer.sh` | Main streaming control (start/stop/status) |
| `anti-buffer-optimizer.sh` | Prevents buffering, looping, frozen streams |
| `uptime-monitor.sh` | 24/7 monitoring with auto-recovery |
| `cloudfront-manager.sh` | CDN cache management and optimization |

---

## 🏆 Features

### Ultra-Low Latency
- **2-second segments** (vs normal 4-6s)
- **20-second total latency** from broadcast
- Optimized for live sports (World Cup, Premier League)

### Anti-Buffer Technology
- Automatic loop detection
- Segment gap detection
- Bitrate consistency monitoring
- Auto-restart frozen streams
- Disk space optimization

### 24/7 Uptime Monitoring
- Checks every 30 seconds
- Auto-restart within 15 seconds of downtime
- Real-time status JSON
- Critical alerts when >2 channels down

### CloudFront CDN Integration
- Unlimited concurrent viewers
- 70-90% bandwidth reduction
- Global low latency
- Cache management tools

---

## 🎮 Commands

### Channel Discovery

```bash
# Interactive menu
./find-channels.sh

# Search for specific channels
./find-channels.sh "premier league"
./find-channels.sh "world cup"
./find-channels.sh "sky sports"

# Export to JSON
./find-channels.sh
# Select option 6 to export
```

### Streaming Control

```bash
# Start all 5 channels
./production-streamer.sh start

# Stop all
./production-streamer.sh stop

# Restart all
./production-streamer.sh restart

# Check status
./production-streamer.sh status

# Test specific channel
./production-streamer.sh test 1

# View logs
./production-streamer.sh logs
./production-streamer.sh logs 1  # Specific channel
```

### Optimization & Monitoring

```bash
# Run buffer optimizer
./anti-buffer-optimizer.sh

# Run uptime check
./uptime-monitor.sh

# View real-time status
cat /var/streaming/status.json | jq .
```

### CloudFront Management

```bash
# Invalidate cache for channel
./cloudfront-manager.sh invalidate 1

# Invalidate all
./cloudfront-manager.sh invalidate-all

# Check cache status
./cloudfront-manager.sh check 1

# Test CDN performance
./cloudfront-manager.sh test

# Show optimization tips
./cloudfront-manager.sh optimize
```

---

## 🚀 Deployment Steps

### 1. Initial Setup

```bash
# Install dependencies
apt install -y ffmpeg nginx nodejs npm jq curl awscli
npm install -g pm2

# Create directories
mkdir -p /var/streaming/{hls,logs,scripts}
```

### 2. Configure Channels

Default channels (already configured):
1. Sky Sports Main Event (9701)
2. Sky Sports Football (9700)
3. Sky Sports Action (9696)
4. TNT Sport 1 (14345)
5. TNT Sport 2 (14346)

To add more, edit `production-streamer.sh`.

### 3. Start Streaming

```bash
./production-streamer.sh start
```

### 4. Setup Automation

```bash
crontab -e

# Add these lines:
*/1 * * * * /var/streaming/scripts/anti-buffer-optimizer.sh
*/1 * * * * /var/streaming/scripts/uptime-monitor.sh
```

### 5. Configure CloudFront

```bash
# Get distribution ID
aws cloudfront list-distributions

# Update in cloudfront-manager.sh
DISTRIBUTION_ID="E3XXXXXXXXX"
```

---

## 📺 Stream URLs

### Origin (Direct from Server)
```
http://origin.cdnfly.online/channel-1/playlist.m3u8
http://origin.cdnfly.online/channel-2/playlist.m3u8
http://origin.cdnfly.online/channel-3/playlist.m3u8
http://origin.cdnfly.online/channel-4/playlist.m3u8
http://origin.cdnfly.online/channel-5/playlist.m3u8
```

### CDN (Recommended - Use These!)
```
https://stream.cdnfly.online/channel-1/playlist.m3u8
https://stream.cdnfly.online/channel-2/playlist.m3u8
https://stream.cdnfly.online/channel-3/playlist.m3u8
https://stream.cdnfly.online/channel-4/playlist.m3u8
https://stream.cdnfly.online/channel-5/playlist.m3u8
```

---

## 💡 Optimization Tips

### For World Cup / Premier League

1. **Use CDN URLs** (stream.cdnfly.online) - handles unlimited viewers
2. **Enable auto-monitoring** (cron jobs) - instant recovery
3. **2-second segments** (already configured) - lowest latency
4. **Pre-start channels** 5 minutes before match - stability

### For High Traffic (10,000+ viewers)

- ✅ CloudFront CDN (required)
- ✅ Origin handles encoding only
- ✅ CDN handles all delivery
- ✅ Expected cost: $85-170/month

### For Low Latency (<20s from broadcast)

- ✅ 2-second segments (configured)
- ✅ 10 segment buffer (20s total)
- ✅ CloudFront edge locations
- ✅ BBR congestion control (OS level)

---

## 🔧 Troubleshooting

### Buffering Issues

```bash
# Run optimizer
./anti-buffer-optimizer.sh

# Check segment sizes
ls -lh /var/streaming/hls/channel-1/

# Expected: ~1MB per segment
```

### Stream Loops/Repeats

```bash
# Auto-fixed by optimizer
# Or manually:
pm2 restart channel-1
rm -f /var/streaming/hls/channel-1/seg_*.ts
```

### Channel Down

```bash
# Should auto-recover in 15s
# Check logs:
tail -f /var/streaming/logs/uptime.log

# Manual restart:
pm2 restart channel-1
```

### CloudFront Issues

```bash
# Test origin
curl -I http://origin.cdnfly.online/channel-1/playlist.m3u8

# Test CDN
curl -I https://stream.cdnfly.online/channel-1/playlist.m3u8

# Invalidate cache
./cloudfront-manager.sh invalidate 1
```

---

## 📊 Monitoring

### PM2 Dashboard

```bash
pm2 list      # List processes
pm2 monit     # Live monitoring
pm2 logs      # View logs
```

### Status JSON

```bash
cat /var/streaming/status.json | jq .

# Example output:
{
  "channels": {
    "channel_1": {
      "status": "LIVE",
      "health": "HEALTHY",
      "age": 2,
      "segments": 10
    }
  },
  "system": {
    "uptime": 100,
    "cpu": "45.2",
    "memory": "53.1"
  }
}
```

### Logs

```
/var/streaming/logs/channel-1.log     # FFmpeg output
/var/streaming/logs/uptime.log        # Uptime monitoring
/var/streaming/logs/optimizer.log     # Buffer optimizer
```

---

## 📈 Capacity & Scaling

### Current Setup (16GB RAM, 4 vCPU)

- **Channels:** 5 (optimal) - 8 (maximum)
- **Viewers (no CDN):** 100-500
- **Viewers (with CDN):** Unlimited
- **Bandwidth:** ~20Mbps inbound, variable outbound

### Scaling Options

**More channels:** Upgrade to 32GB/8vCPU = 16 channels

**More viewers:** Use CloudFront CDN (configured!)

**Global delivery:** CloudFront edge locations (automatic)

---

## ✅ Production Checklist

- [ ] All scripts executable
- [ ] 5 channels streaming
- [ ] Tested all URLs in VLC
- [ ] CDN domain working
- [ ] Cron jobs configured
- [ ] CloudFront distribution ID set
- [ ] Integrated in your app
- [ ] Firewall configured

---

## 🎉 Ready for Action!

Your infrastructure is optimized for:
- 🏆 **World Cup 2026**
- ⚽ **Premier League**
- 🔥 **10,000+ concurrent viewers**
- 📺 **24/7 live sports**

**Monitor:** `pm2 monit`
**Status:** `./production-streamer.sh status`
**URLs:** `https://stream.cdnfly.online/channel-{1-5}/playlist.m3u8`

**Let's go!** 🚀⚽
