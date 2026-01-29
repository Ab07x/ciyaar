# Dedicated Streaming Server Scripts

Professional IPTV → HLS streaming infrastructure for sports channels.

## 📦 What's Included

| Script | Purpose |
|--------|---------|
| `quick-start.sh` | **One-command deployment** - Sets up everything |
| `setup-streaming-server.sh` | Full server configuration |
| `start-all-streams.sh` | Start all enabled channels |
| `stream-manager.sh` | Advanced channel management CLI |
| `health-monitor.sh` | Auto-restart failed streams (cron) |
| `performance-monitor.py` | Real-time dashboard |
| `DEPLOYMENT_GUIDE.md` | Complete deployment documentation |

---

## 🚀 Quick Start (Recommended)

**For fresh server setup:**

```bash
# 1. Upload scripts to server
scp scripts/dedicated-server/* root@YOUR_SERVER_IP:/root/

# 2. SSH into server
ssh root@YOUR_SERVER_IP

# 3. Run quick start
cd /root
chmod +x quick-start.sh
./quick-start.sh
```

**That's it!** The script will:
- ✅ Install all dependencies
- ✅ Configure NGINX
- ✅ Set up 8 channels
- ✅ Start streaming
- ✅ Enable monitoring

**Duration:** ~10 minutes

---

## 📋 Manual Setup

If you prefer step-by-step control:

### Step 1: Initial Setup

```bash
chmod +x setup-streaming-server.sh
./setup-streaming-server.sh
```

### Step 2: Start Streams

```bash
/var/streaming/scripts/start-all-streams.sh
```

### Step 3: Verify

```bash
curl http://localhost/channel-1/playlist.m3u8
```

---

## 🎮 Stream Manager Usage

The main control interface:

```bash
cd /var/streaming/scripts

# Start specific channel
./stream-manager.sh start 1

# Stop channel
./stream-manager.sh stop 1

# Restart channel
./stream-manager.sh restart 1

# Start all enabled channels
./stream-manager.sh start-all

# Stop all
./stream-manager.sh stop-all

# View status
./stream-manager.sh status

# View logs
./stream-manager.sh logs 1

# Live monitoring
./stream-manager.sh monitor

# List available channels
./stream-manager.sh list

# Enable/disable in config
./stream-manager.sh enable 3
./stream-manager.sh disable 3
```

---

## 📊 Monitoring

### Real-Time Dashboard

```bash
python3 /var/streaming/scripts/performance-monitor.py
```

Shows:
- CPU/Memory/Disk usage
- All active streams
- Stream health status
- Segment counts
- Network traffic
- Per-core CPU usage

### PM2 Monitoring

```bash
# List processes
pm2 list

# Live CPU/Memory monitoring
pm2 monit

# View logs for all channels
pm2 logs

# View specific channel
pm2 logs channel-1 --lines 100
```

### Health Logs

```bash
# View health check logs
tail -f /var/streaming/logs/health-monitor.log

# Check if cron is running
crontab -l | grep health-monitor
```

---

## 🔧 Configuration

### Channel Configuration

Edit: `/var/streaming/config/channels.json`

```json
{
  "channels": [
    {
      "id": 1,
      "name": "Sky Sports Main Event",
      "stream_id": "9701",
      "enabled": true,
      "priority": "high"
    }
  ],
  "settings": {
    "max_concurrent": 8,
    "hls_time": 4,
    "hls_list_size": 6,
    "quality": "1080p",
    "bitrate": "4M"
  }
}
```

### Add New Channel

1. Add to config:
```bash
nano /var/streaming/config/channels.json
```

2. Create directory:
```bash
mkdir -p /var/streaming/hls/channel-9
```

3. Start:
```bash
./stream-manager.sh start 9
```

---

## 🌐 Stream URLs

After starting, streams are available at:

```
http://YOUR_SERVER_IP/channel-1/playlist.m3u8
http://YOUR_SERVER_IP/channel-2/playlist.m3u8
http://YOUR_SERVER_IP/channel-3/playlist.m3u8
...
```

### Test Stream

```bash
# Using FFplay
ffplay http://YOUR_SERVER_IP/channel-1/playlist.m3u8

# Using cURL
curl -I http://YOUR_SERVER_IP/channel-1/playlist.m3u8

# Check if segments exist
ls -lh /var/streaming/hls/channel-1/
```

---

## 🔄 Auto-Recovery

Health monitoring runs every minute and:
- Checks playlist updates
- Verifies segment count
- Detects stale streams
- Auto-restarts failed streams
- Logs all actions

**Setup:**

```bash
crontab -e
```

Add:
```cron
*/1 * * * * /var/streaming/scripts/health-monitor.sh
```

---

## 📁 Directory Structure

```
/var/streaming/
├── hls/                    # HLS output
│   ├── channel-1/
│   │   ├── playlist.m3u8
│   │   ├── segment_00001.ts
│   │   ├── segment_00002.ts
│   │   └── ...
│   ├── channel-2/
│   └── ...
├── logs/                   # All logs
│   ├── channel-1.log
│   ├── channel-2.log
│   └── health-monitor.log
├── scripts/                # Management scripts
│   ├── start-all-streams.sh
│   ├── stream-manager.sh
│   ├── health-monitor.sh
│   └── performance-monitor.py
└── config/                 # Configuration
    └── channels.json
```

---

## 🐛 Troubleshooting

### Stream Won't Start

```bash
# Check source is accessible
ffprobe "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701"

# Check FFmpeg is installed
ffmpeg -version

# View detailed logs
pm2 logs channel-1 --lines 200 --nostream
```

### Segments Not Updating

```bash
# Check disk space
df -h /var/streaming

# Check permissions
ls -la /var/streaming/hls/channel-1/

# Restart stream
./stream-manager.sh restart 1
```

### High CPU/Memory

```bash
# Check current usage
pm2 monit

# Reduce concurrent streams
./stream-manager.sh stop 6
./stream-manager.sh stop 7
./stream-manager.sh stop 8

# Restart all to clear memory leaks
./stream-manager.sh restart-all
```

### NGINX Errors

```bash
# Test NGINX config
nginx -t

# Reload NGINX
systemctl reload nginx

# Check NGINX logs
tail -f /var/log/nginx/error.log
```

---

## 💰 Resource Usage

### Expected Usage (per channel)

```
CPU: ~25% (1/4 of a vCore)
RAM: ~1.5GB
Bandwidth: ~4Mbps (1.3TB/month if 24/7)
Disk: ~500MB for segments (auto-cleanup)
```

### For 8 Channels

```
CPU: ~100% (all 4 cores)
RAM: ~12GB (of 16GB available)
Bandwidth: ~32Mbps peak (10TB+/month if all 24/7)
Disk: ~4GB for segments
```

**Recommendation:** Run 5-6 channels 24/7 to stay within 6TB bandwidth limit.

---

## 🔒 Security

### Firewall Setup

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (if using SSL)
ufw enable
```

### Fail2Ban (DDoS Protection)

```bash
apt install fail2ban -y
systemctl enable fail2ban
```

### Hide Source URLs

Don't expose IPTV credentials! Use environment variables:

```bash
export IPTV_USER="d06HPCFR"
export IPTV_PASS="qEBJjW3"
```

---

## 📈 Scaling

### Vertical Scaling (Upgrade Server)

Upgrade to more vCPUs/RAM to run more channels:
- 8 vCPUs + 32GB RAM = 16 channels

### Horizontal Scaling (Multiple Servers)

Run different channels on different servers:
- Server 1: Channels 1-4
- Server 2: Channels 5-8

Use CloudFront as CDN to balance load.

---

## 🌍 CDN Integration

### CloudFront Setup

1. Create CloudFront distribution
2. Origin: `YOUR_SERVER_IP`
3. Cache policy: Custom (10s TTL for playlists)
4. Update stream URLs to CloudFront domain

**Benefits:**
- Reduce origin bandwidth by 70-90%
- Lower latency globally
- Better DDoS protection
- Scale to millions of viewers

See `DEPLOYMENT_GUIDE.md` for detailed CloudFront setup.

---

## 📞 Support

### Useful Resources

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- FFmpeg documentation: https://ffmpeg.org/documentation.html
- HLS spec: https://datatracker.ietf.org/doc/html/rfc8216
- PM2 docs: https://pm2.keymetrics.io/

### Common Commands Reference

```bash
# Stream Management
pm2 list                    # List all streams
pm2 restart all             # Restart all
pm2 stop all                # Stop all
pm2 delete all              # Remove all
pm2 save                    # Save current state

# Monitoring
pm2 monit                   # Live monitoring
pm2 logs                    # View all logs
htop                        # System resources
iotop                       # Disk I/O

# System
systemctl status nginx      # NGINX status
systemctl restart nginx     # Restart NGINX
df -h                       # Disk usage
free -h                     # Memory usage
```

---

## 📝 Maintenance Schedule

### Daily
- [ ] Check `pm2 list` for failed streams
- [ ] Review health monitor logs
- [ ] Check disk space

### Weekly
- [ ] Restart all streams (`restart-all`)
- [ ] Clean old logs
- [ ] Review bandwidth usage

### Monthly
- [ ] Update system packages
- [ ] Backup configuration
- [ ] Check FFmpeg for updates

---

## ✅ Quick Checklist

- [ ] Server has 16GB RAM, 4 vCPUs
- [ ] Scripts uploaded and executable
- [ ] `quick-start.sh` completed successfully
- [ ] Streams accessible via HTTP
- [ ] Health monitoring cron job active
- [ ] PM2 processes auto-start on reboot
- [ ] Firewall configured
- [ ] CloudFront CDN configured (optional)
- [ ] SSL certificate installed (optional)

---

## 🎬 You're Ready!

Your professional streaming infrastructure is set up and running!

**Stream URLs are now live at:**
```
http://YOUR_SERVER_IP/channel-{1-8}/playlist.m3u8
```

**Next:** Integrate these URLs into your Next.js app via the admin panel.

Happy streaming! 📺🚀
