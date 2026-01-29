# 📋 Streaming Server Deployment Checklist

Print this checklist and follow it step-by-step for a smooth deployment.

---

## Pre-Deployment (On Your Local Machine)

### ✅ Verify Server Specs

- [ ] Server has **16GB RAM minimum**
- [ ] Server has **4 vCPUs minimum**
- [ ] Server has **100GB+ free disk space**
- [ ] Server has **Ubuntu 22.04/24.04** or similar
- [ ] You have **root/sudo access**
- [ ] Server IP address: `_________________________`

### ✅ Prepare Scripts

- [ ] Downloaded all scripts from `scripts/dedicated-server/`
- [ ] Scripts are in a single folder
- [ ] You have the server's SSH key or password

---

## Deployment (On Dedicated Server)

### Step 1: Upload Scripts ⏱️ 2 minutes

```bash
# From your local machine:
scp scripts/dedicated-server/* root@YOUR_SERVER_IP:/root/
```

- [ ] All 8 files uploaded successfully
- [ ] No upload errors

### Step 2: SSH Into Server ⏱️ 1 minute

```bash
ssh root@YOUR_SERVER_IP
```

- [ ] Successfully logged in as root
- [ ] You're at `/root` directory

### Step 3: Run Quick Start ⏱️ 10 minutes

```bash
cd /root
chmod +x quick-start.sh
./quick-start.sh
```

- [ ] Script started successfully
- [ ] Answered "Y" to proceed
- [ ] All dependencies installed (FFmpeg, NGINX, PM2, Node.js)
- [ ] Directory structure created (`/var/streaming/`)
- [ ] NGINX configured and started
- [ ] System optimizations applied
- [ ] 8 channels configured
- [ ] Scripts installed to `/var/streaming/scripts/`
- [ ] Health monitoring cron job enabled
- [ ] No critical errors in output

**Expected output at end:**
```
╔═══════════════════════════════════════════════════════╗
║     SETUP COMPLETE! 🎉                                ║
╚═══════════════════════════════════════════════════════╝
```

### Step 4: Start Streams ⏱️ 2 minutes

```bash
cd /var/streaming/scripts
./start-all-streams.sh
```

- [ ] Chose "Y" to start streams (or run manually later)
- [ ] All 5 enabled channels started
- [ ] PM2 shows all streams as "online"
- [ ] No FFmpeg errors

**Verify with:**
```bash
pm2 list
```

Expected output: 5 processes named `channel-1` through `channel-5`, all showing "online"

---

## Verification ⏱️ 5 minutes

### ✅ Check Stream Health

```bash
./stream-manager.sh status
```

- [ ] All channels show "online" status
- [ ] CPU usage 80-100%
- [ ] Memory usage ~12GB
- [ ] Disk usage reasonable

### ✅ Test Streams Locally

```bash
# Check if playlist exists
curl http://localhost/channel-1/playlist.m3u8

# Should return something like:
# #EXTM3U
# #EXT-X-VERSION:3
# #EXT-X-TARGETDURATION:5
# ...
```

- [ ] Playlist returns valid m3u8 content
- [ ] No 404 or 500 errors

```bash
# Check segments exist
ls -lh /var/streaming/hls/channel-1/
```

- [ ] See 6-8 `.ts` segment files
- [ ] See `playlist.m3u8` file
- [ ] Files are being updated (check timestamp)

### ✅ Test Stream from Your Computer

```bash
# From your local machine (requires ffplay):
ffplay http://YOUR_SERVER_IP/channel-1/playlist.m3u8
```

- [ ] Video starts playing within 5-10 seconds
- [ ] No stuttering or buffering issues
- [ ] Audio is working

**Alternative:** Open in VLC or any HLS-compatible player

### ✅ Test in Browser (Web)

1. Open browser
2. Navigate to: `http://YOUR_SERVER_IP/channel-1/playlist.m3u8`

- [ ] Browser downloads the playlist file
- [ ] File contains valid m3u8 content

---

## Post-Deployment Configuration ⏱️ 10 minutes

### ✅ Enable Auto-Start on Reboot

```bash
# Verify PM2 startup script exists
pm2 startup

# Save current process list
pm2 save
```

- [ ] PM2 startup configured
- [ ] Process list saved

### ✅ Configure Health Monitoring

```bash
# Check cron job exists
crontab -l | grep health-monitor
```

- [ ] Cron job shows: `*/1 * * * * /var/streaming/scripts/health-monitor.sh`

### ✅ Configure Firewall (Optional but Recommended)

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS (if using SSL later)
ufw enable
```

- [ ] Firewall enabled
- [ ] Necessary ports open
- [ ] Can still SSH into server

---

## CloudFront CDN Setup (Optional) ⏱️ 15 minutes

### ✅ Create CloudFront Distribution

**In AWS Console:**
1. Go to **CloudFront** → **Create Distribution**
2. **Origin Domain:** `YOUR_SERVER_IP`
3. **Protocol:** HTTP only (for now)
4. **Allowed HTTP Methods:** GET, HEAD, OPTIONS
5. **Cache Policy:** Create custom

- [ ] Distribution created
- [ ] Status shows "Deployed"
- [ ] Distribution domain noted: `d____________.cloudfront.net`

### ✅ Test CloudFront

```bash
# From your local machine:
curl https://d1234abcd.cloudfront.net/channel-1/playlist.m3u8
```

- [ ] Playlist loads successfully
- [ ] X-Cache header shows "Hit" or "Miss from cloudfront"

---

## Next.js App Integration ⏱️ 10 minutes

### ✅ Update Channel URLs

**Option 1: Admin Panel**
1. Navigate to: `http://your-app.com/admin/channels`
2. For each channel, update Stream URL to:
   - Without CDN: `http://YOUR_SERVER_IP/channel-1/playlist.m3u8`
   - With CDN: `https://d1234abcd.cloudfront.net/channel-1/playlist.m3u8`

**Channels to update:**
- [ ] Channel 1: Sky Sports Main Event
- [ ] Channel 2: Sky Sports Football
- [ ] Channel 3: Sky Sports Action
- [ ] Channel 4: TNT Sport 1
- [ ] Channel 5: TNT Sport 2

### ✅ Test in Your App

1. Open your app: `http://your-app.com`
2. Navigate to **Live TV** or **Channels** page
3. Click on "Sky Sports Main Event"
4. Video should play

- [ ] Channel list shows all channels
- [ ] Clicking a channel opens player
- [ ] Video plays successfully
- [ ] No CORS errors in console
- [ ] Controls work properly

---

## Monitoring Setup ⏱️ 5 minutes

### ✅ Set Up Monitoring Dashboard

```bash
# Install Python dependencies (if not already)
apt install python3-pip -y
pip3 install psutil

# Test dashboard
python3 /var/streaming/scripts/performance-monitor.py
```

- [ ] Dashboard opens and shows live stats
- [ ] All channels show "HEALTHY" status
- [ ] CPU/Memory metrics display correctly
- [ ] Press Ctrl+C to exit

### ✅ Check Health Monitor Logs

```bash
tail -f /var/streaming/logs/health-monitor.log
```

- [ ] Log file exists
- [ ] Shows recent health checks
- [ ] No critical errors

---

## SSL/HTTPS Setup (Optional) ⏱️ 10 minutes

### ✅ Point Domain to Server

- [ ] Created A record: `streaming.fanbroj.net` → `YOUR_SERVER_IP`
- [ ] DNS propagated (test with `ping streaming.fanbroj.net`)

### ✅ Install SSL Certificate

```bash
certbot --nginx -d streaming.fanbroj.net
```

- [ ] Certificate issued successfully
- [ ] NGINX auto-configured
- [ ] Test: `https://streaming.fanbroj.net/channel-1/playlist.m3u8` works

---

## Final Verification ⏱️ 5 minutes

### ✅ System Check

```bash
# All streams running
pm2 list

# All healthy
./stream-manager.sh status

# No errors in logs
pm2 logs | grep -i error

# Health monitor active
tail -5 /var/streaming/logs/health-monitor.log

# NGINX running
systemctl status nginx

# Disk space OK
df -h /var/streaming
```

- [ ] All streams online
- [ ] No critical errors
- [ ] Health monitor working
- [ ] NGINX active
- [ ] Sufficient disk space

### ✅ Performance Check

```bash
# Check CPU/RAM usage
htop

# Or use PM2 monitor
pm2 monit
```

- [ ] CPU usage 80-100% (expected for 5 channels)
- [ ] Memory usage ~8-12GB (expected)
- [ ] No processes using excessive resources

---

## Documentation Review

### ✅ Read Key Documents

- [ ] Read `README.md` for quick reference
- [ ] Bookmark `DEPLOYMENT_GUIDE.md` for troubleshooting
- [ ] Review `SUMMARY.md` for architecture overview

---

## Backup & Disaster Recovery

### ✅ Create Backups

```bash
# Backup channel configuration
cp /var/streaming/config/channels.json ~/channels-backup.json

# Backup NGINX config
cp /etc/nginx/sites-available/streaming ~/nginx-backup.conf

# Backup PM2 process list (already saved)
pm2 save
```

- [ ] Channel config backed up
- [ ] NGINX config backed up
- [ ] PM2 list saved

---

## Success Criteria ✅

**Your deployment is successful if:**

✅ All 5 enabled channels show "online" in `pm2 list`
✅ Streams are accessible at `http://YOUR_SERVER_IP/channel-*/playlist.m3u8`
✅ Video plays in browser/VLC/ffplay
✅ Health monitoring is active (cron job)
✅ Auto-restart on reboot configured (PM2 startup)
✅ Streams work in your Next.js app
✅ No critical errors in logs

---

## Troubleshooting

### If a stream won't start:

```bash
# Check source accessibility
ffprobe "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701"

# View detailed error
pm2 logs channel-1 --lines 100
```

### If playlist returns 404:

```bash
# Check NGINX is running
systemctl status nginx

# Reload NGINX
systemctl reload nginx

# Check file permissions
ls -la /var/streaming/hls/channel-1/
```

### If video won't play in app:

```bash
# Check CORS in browser console
# Should see Access-Control-Allow-Origin: *

# Test stream URL directly
curl -I http://YOUR_SERVER_IP/channel-1/playlist.m3u8
```

---

## Maintenance Schedule

### Daily (2 minutes)
- [ ] Run `pm2 list` - verify all online
- [ ] Check health logs for errors

### Weekly (5 minutes)
- [ ] Restart all streams: `./stream-manager.sh restart-all`
- [ ] Clean old logs: `find /var/streaming/logs -name "*.log" -mtime +7 -delete`
- [ ] Review bandwidth usage

### Monthly (15 minutes)
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] Backup configuration files
- [ ] Check FFmpeg updates
- [ ] Review costs (if using CloudFront)

---

## Next Steps

- [ ] Monitor streams for 24 hours to ensure stability
- [ ] Set up CloudFront if not already done
- [ ] Configure alerts (email/SMS for downtime)
- [ ] Create runbook for common issues
- [ ] Train team on stream management

---

## Support Resources

**Documentation:**
- Quick Start: `/scripts/dedicated-server/README.md`
- Full Guide: `/scripts/dedicated-server/DEPLOYMENT_GUIDE.md`
- Summary: `/scripts/dedicated-server/SUMMARY.md`

**Commands:**
```bash
# Help
./stream-manager.sh help

# Status
./stream-manager.sh status

# Logs
pm2 logs

# Monitor
pm2 monit
```

---

## 🎉 Deployment Complete!

**Congratulations!** Your professional streaming infrastructure is now live.

**Stream URLs:**
```
http://YOUR_SERVER_IP/channel-1/playlist.m3u8
http://YOUR_SERVER_IP/channel-2/playlist.m3u8
http://YOUR_SERVER_IP/channel-3/playlist.m3u8
http://YOUR_SERVER_IP/channel-4/playlist.m3u8
http://YOUR_SERVER_IP/channel-5/playlist.m3u8
```

**Total Deployment Time:** ~60 minutes
**Channels Live:** 5 (expandable to 8)
**Capacity:** 100-500 concurrent viewers (more with CDN)

**Happy Streaming! 📺🚀**
