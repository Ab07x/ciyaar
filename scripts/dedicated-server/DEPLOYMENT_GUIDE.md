# Dedicated Streaming Server Deployment Guide

Complete guide to deploy your professional IPTV streaming infrastructure.

---

## Server Specifications

```
Type: General Purpose Dual-Stack
RAM: 16 GB
CPU: 4 vCPUs
Storage: 320 GB SSD
Bandwidth: 6 TB/month
```

**Expected Capacity:**
- 8 concurrent HD streams (1080p)
- ~750 GB/month per stream (at 4Mbps)
- Can serve 100+ concurrent viewers per stream

---

## Initial Server Setup

### 1. Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Update Hostname (Optional)

```bash
hostnamectl set-hostname streaming.fanbroj.net
```

### 3. Create Swap File (Recommended)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Installation

### 1. Upload Scripts to Server

From your local machine:

```bash
# Upload all scripts
scp scripts/dedicated-server/*.sh root@YOUR_SERVER_IP:/root/

# Make them executable
ssh root@YOUR_SERVER_IP 'chmod +x /root/*.sh'
```

### 2. Run Setup Script

```bash
cd /root
./setup-streaming-server.sh
```

This will:
- Install FFmpeg, NGINX, PM2
- Configure system optimizations
- Set up directory structure
- Create channel configuration
- Configure NGINX for HLS delivery

**Duration:** ~5-10 minutes

### 3. Configure Your IP Address

Edit the channel config (optional):

```bash
nano /var/streaming/config/channels.json
```

---

## Starting Streams

### Method 1: Start All Enabled Channels

```bash
/var/streaming/scripts/start-all-streams.sh
```

### Method 2: Use Stream Manager

```bash
cd /var/streaming/scripts

# Start specific channel
./stream-manager.sh start 1

# Start all
./stream-manager.sh start-all

# Check status
./stream-manager.sh status
```

---

## Stream URLs

After starting streams, they'll be available at:

```
Channel 1: http://YOUR_SERVER_IP/channel-1/playlist.m3u8
Channel 2: http://YOUR_SERVER_IP/channel-2/playlist.m3u8
Channel 3: http://YOUR_SERVER_IP/channel-3/playlist.m3u8
...
```

### Testing Stream

```bash
# Using FFplay
ffplay http://YOUR_SERVER_IP/channel-1/playlist.m3u8

# Using cURL (check if playlist exists)
curl http://YOUR_SERVER_IP/channel-1/playlist.m3u8
```

---

## CloudFront CDN Integration

### 1. Create CloudFront Distribution

**AWS Console:**
1. Go to CloudFront → Create Distribution
2. **Origin Domain:** YOUR_SERVER_IP
3. **Protocol:** HTTP only (or set up SSL first)
4. **Allowed HTTP Methods:** GET, HEAD
5. **Cache Policy:** Create custom

**Custom Cache Policy:**
```
Name: HLS-Streaming-Policy
TTL Settings:
  - Minimum: 0 seconds
  - Maximum: 31536000 seconds (1 year)
  - Default: 10 seconds
Headers: None
Cookies: None
Query Strings: None
```

### 2. Update Your App

In your Next.js app, update channel URLs:

```typescript
// Before
const streamUrl = "http://YOUR_SERVER_IP/channel-1/playlist.m3u8"

// After (with CloudFront)
const streamUrl = "https://d1234abcd.cloudfront.net/channel-1/playlist.m3u8"
```

### 3. CloudFront Invalidation (if needed)

```bash
aws cloudfront create-invalidation \
  --distribution-id EDFDVBD6EXAMPLE \
  --paths "/channel-*/playlist.m3u8"
```

---

## Monitoring

### Real-Time Dashboard

```bash
python3 /var/streaming/scripts/performance-monitor.py
```

Shows:
- CPU usage per core
- Memory usage
- Active streams
- Stream health
- Segment counts
- Network traffic

### PM2 Monitoring

```bash
# List all processes
pm2 list

# Live monitoring
pm2 monit

# View logs
pm2 logs

# View specific channel logs
pm2 logs channel-1
```

### Stream Health Check

```bash
./stream-manager.sh status
```

---

## Auto Health Monitoring

### Setup Cron Job

```bash
crontab -e
```

Add this line:

```cron
*/1 * * * * /var/streaming/scripts/health-monitor.sh
```

This runs every minute and:
- Checks if playlists are updating
- Verifies segment count
- Auto-restarts failed streams
- Logs all activities

View health logs:

```bash
tail -f /var/streaming/logs/health-monitor.log
```

---

## Channel Management

### Add New Channel

1. Edit config:
```bash
nano /var/streaming/config/channels.json
```

2. Add channel entry:
```json
{
  "id": 9,
  "name": "New Channel",
  "stream_id": "12345",
  "enabled": true,
  "priority": "medium"
}
```

3. Create output directory:
```bash
mkdir -p /var/streaming/hls/channel-9
```

4. Start the channel:
```bash
./stream-manager.sh start 9
```

### Enable/Disable Channels

```bash
# Enable channel
./stream-manager.sh enable 3

# Disable channel
./stream-manager.sh disable 3
```

---

## SSL/HTTPS Setup (Recommended)

### 1. Point Domain to Server

Create an A record:
```
streaming.fanbroj.net → YOUR_SERVER_IP
```

### 2. Get SSL Certificate

```bash
certbot --nginx -d streaming.fanbroj.net
```

### 3. Update NGINX Config

Certbot will auto-update, but verify:

```bash
nano /etc/nginx/sites-available/streaming
```

### 4. Update Stream URLs

```
https://streaming.fanbroj.net/channel-1/playlist.m3u8
```

---

## Performance Tuning

### For High Viewer Count

If you expect 500+ concurrent viewers:

1. **Increase NGINX worker processes:**
```bash
nano /etc/nginx/nginx.conf
```
```nginx
worker_processes 4;
worker_connections 4096;
```

2. **Optimize FFmpeg settings:**
```bash
nano /var/streaming/scripts/start-all-streams.sh
```
Reduce segment size for lower latency:
```bash
HLS_TIME=2  # Change from 4 to 2
```

3. **Restart:**
```bash
systemctl restart nginx
./stream-manager.sh restart-all
```

### For Lower Bandwidth Costs

Reduce bitrate:

```bash
# Edit start script
nano /var/streaming/scripts/start-all-streams.sh
```

Add bitrate limiting to FFmpeg:
```bash
-b:v 2M -maxrate 2.5M -bufsize 5M
```

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup channel config
cp /var/streaming/config/channels.json /root/channels-backup.json

# Backup NGINX config
cp /etc/nginx/sites-available/streaming /root/nginx-backup.conf
```

### Quick Recovery

If a stream dies:

```bash
# Check status
./stream-manager.sh status

# Restart specific channel
./stream-manager.sh restart 1

# Or restart all
./stream-manager.sh restart-all
```

### Full System Recovery

```bash
# Stop all streams
pm2 delete all

# Clear HLS files
rm -rf /var/streaming/hls/channel-*/*.ts
rm -rf /var/streaming/hls/channel-*/*.m3u8

# Restart all
./start-all-streams.sh
```

---

## Troubleshooting

### Stream Won't Start

1. Check IPTV source:
```bash
ffprobe "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701"
```

2. Check FFmpeg is installed:
```bash
ffmpeg -version
```

3. Check logs:
```bash
pm2 logs channel-1 --lines 100
```

### High CPU Usage

1. Reduce concurrent streams
2. Use hardware encoding if available:
```bash
-c:v h264_nvenc  # For NVIDIA GPUs
```

3. Lower segment time (less buffering):
```bash
HLS_TIME=6  # Increase from 4 to 6
```

### Segments Not Updating

1. Check disk space:
```bash
df -h
```

2. Check permissions:
```bash
ls -la /var/streaming/hls/channel-1/
```

3. Restart stream:
```bash
./stream-manager.sh restart 1
```

### NGINX 403 Forbidden

```bash
# Fix permissions
chown -R www-data:www-data /var/streaming/hls
chmod -R 755 /var/streaming/hls
```

---

## Maintenance

### Daily Tasks

```bash
# Check stream health
./stream-manager.sh status

# Check logs for errors
pm2 logs --lines 50 | grep -i error

# Check disk usage
df -h /var/streaming
```

### Weekly Tasks

```bash
# Restart all streams (clears memory leaks)
./stream-manager.sh restart-all

# Clean old logs
find /var/streaming/logs -name "*.log" -mtime +7 -delete

# Update system packages
apt update && apt upgrade -y
```

### Monthly Tasks

```bash
# Review bandwidth usage
vnstat -m

# Check for FFmpeg updates
apt list --upgradable | grep ffmpeg

# Backup configuration
tar -czf /root/streaming-backup-$(date +%Y%m%d).tar.gz /var/streaming/config
```

---

## Integration with Next.js App

### Update Channel URLs in Database

Use Convex dashboard or update your admin panel to point channels to:

```
http://YOUR_SERVER_IP/channel-1/playlist.m3u8
```

Or with CloudFront:

```
https://d1234abcd.cloudfront.net/channel-1/playlist.m3u8
```

### Example Channel Update

```typescript
// In your admin panel
await updateChannel({
  channelId: "...",
  streamUrl: "https://streaming.fanbroj.net/channel-1/playlist.m3u8",
  isLive: true
});
```

---

## Cost Estimation

### Monthly Bandwidth

With 8 channels at 4Mbps, 24/7:

```
Per channel: ~1.3 TB/month
8 channels: ~10.4 TB/month
```

**Your 6TB limit means:**
- Run 4-5 channels 24/7
- OR run 8 channels during peak hours only
- Use CloudFront CDN to offload bandwidth

### CloudFront Costs (Approximate)

- Data Transfer Out: $0.085/GB
- 1TB/month ≈ $85/month
- With caching: ~50% reduction

---

## Security Best Practices

### 1. Firewall Setup

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Fail2Ban (Prevent Brute Force)

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. Secure IPTV Credentials

Never commit credentials to git!

```bash
# Use environment variables
export IPTV_USER="d06HPCFR"
export IPTV_PASS="qEBJjW3"
```

---

## Advanced: Load Balancing

If you need more capacity, set up multiple servers:

```
┌─────────────┐
│  CloudFront │
│     CDN     │
└──────┬──────┘
       │
       ├─────> Server 1 (Channels 1-4)
       │
       └─────> Server 2 (Channels 5-8)
```

Each server runs 4 channels, doubled capacity!

---

## Support & Resources

### Useful Commands

```bash
# Quick restart all
pm2 restart all

# View real-time monitoring
pm2 monit

# Check stream is live
curl -I http://localhost/channel-1/playlist.m3u8

# Test stream playback
ffplay http://localhost/channel-1/playlist.m3u8
```

### Log Locations

```
System logs: /var/log/nginx/
Stream logs: /var/streaming/logs/
PM2 logs: ~/.pm2/logs/
Health logs: /var/streaming/logs/health-monitor.log
```

---

## Summary Checklist

- [ ] Server setup complete
- [ ] Scripts uploaded and executable
- [ ] Streams started and running
- [ ] URLs accessible from internet
- [ ] CloudFront CDN configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Health monitoring cron job active
- [ ] Channels integrated in Next.js app
- [ ] Backup strategy in place
- [ ] Firewall configured

**You're ready to stream!** 🎬🔴

