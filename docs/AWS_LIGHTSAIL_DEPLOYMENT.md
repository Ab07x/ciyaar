# AWS Lightsail Deployment Guide - Ciyaar Platform

Complete guide to deploy your Next.js app + IPTV streaming server on AWS Lightsail.

## 🏗️ Architecture Overview

Your setup consists of:
1. **Streaming Server** (ubuntu@ip-172-26-11-149) - Running FFmpeg/HLS streams
2. **Web Application** - Next.js app (can be on same server or separate)
3. **CloudFront CDN** - Serving HLS streams globally
4. **Domain** - fanbroj.net pointing to CloudFront

---

## 📋 Prerequisites

- AWS Account with Lightsail access
- Domain name (fanbroj.net)
- SSH access to your server
- GitHub repository with latest code

---

## 🚀 Part 1: Streaming Server Deployment

### Server Specs (Current Setup)
- **Instance**: Ubuntu 24.04 LTS
- **Plan**: 2 vCPU, 4GB RAM (minimum for 5 channels)
- **IP**: 13.61.187.198
- **Region**: eu-north-1 (Stockholm)

### Initial Server Setup

```bash
# 1. SSH into your server
ssh ubuntu@13.61.187.198

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Install essential packages
sudo apt install -y git curl wget build-essential nginx

# 4. Install FFmpeg
sudo apt install -y ffmpeg

# 5. Verify FFmpeg installation
ffmpeg -version

# 6. Install Node.js & PM2 (for process management)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 7. Setup web root directory
sudo mkdir -p /var/www/html/hls
sudo chown -R ubuntu:ubuntu /var/www/html
```

### Clone Repository

```bash
# 1. Navigate to home directory
cd ~

# 2. Clone your repository (if not already cloned)
git clone https://github.com/Ab07x/ciyaar.git

# Or if already exists, pull latest changes
cd ~/ciyaar
git pull origin main

# 3. Make scripts executable
chmod +x scripts/*.sh

# 4. Create config directory
mkdir -p ~/ciyaar/config
mkdir -p ~/ciyaar/logs
```

### Configure IPTV Streams

```bash
# 1. Create IPTV configuration file
nano ~/ciyaar/config/iptv.conf
```

Add this content:
```bash
# IPTV Configuration
LOG_DIR="$HOME/ciyaar/logs"

# Optional: Proxy settings (uncomment if needed)
# PROXY_URL="http://user:pass@proxy:port"

# HLS Settings (already optimized in scripts)
# HLS_TIME=6
# HLS_LIST_SIZE=20
# HLS_DELETE_THRESHOLD=25
```

Save and exit (Ctrl+X, Y, Enter).

### Start Streaming Channels

```bash
# 1. Stop any old streams
pm2 delete all

# 2. Clean old HLS files
sudo rm -rf /var/www/html/hls/*/

# 3. Start your channels (using YOUR IPTV URLs)
./scripts/manage-event.sh start sky-action "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9696"
./scripts/manage-event.sh start sky-football "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9700"
./scripts/manage-event.sh start sky-main "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701"
./scripts/manage-event.sh start tnt-sport-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/14345"
./scripts/manage-event.sh start tnt-sport-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/14346"

# 4. Check status
pm2 list

# 5. Save PM2 processes (survive reboots)
pm2 save

# 6. Setup PM2 startup
pm2 startup
# Copy and run the command it outputs
```

### Configure Nginx

```bash
# 1. Create Nginx config for HLS
sudo nano /etc/nginx/sites-available/hls
```

Add this content:
```nginx
server {
    listen 80;
    server_name 13.61.187.198;

    # HLS directory
    root /var/www/html;

    # Enable CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';

    # HLS settings
    location /hls/ {
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }

        # Cache headers for segments
        location ~* \.ts$ {
            add_header Cache-Control "public, max-age=3600";
            add_header Access-Control-Allow-Origin *;
        }

        # Cache headers for playlists
        location ~* \.m3u8$ {
            add_header Cache-Control "public, max-age=1";
            add_header Access-Control-Allow-Origin *;
        }
    }

    # Health check endpoint
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

```bash
# 2. Enable the site
sudo ln -s /etc/nginx/sites-available/hls /etc/nginx/sites-enabled/

# 3. Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# 4. Test Nginx config
sudo nginx -t

# 5. Restart Nginx
sudo systemctl restart nginx

# 6. Enable Nginx on boot
sudo systemctl enable nginx
```

### Test Streaming

```bash
# 1. Check if HLS files are being created
ls -lh /var/www/html/hls/sky-action/

# 2. Check playlist
cat /var/www/html/hls/sky-action/index.m3u8

# 3. Test stream locally
curl http://localhost/hls/sky-action/index.m3u8

# 4. Check PM2 logs
pm2 logs event-sky-action --lines 50

# 5. Monitor all streams
pm2 monit
```

---

## 🌐 Part 2: Web Application Deployment

You have two options for deploying the Next.js app:

### Option A: Deploy on Same Server (Ubuntu)

```bash
# 1. Navigate to project
cd ~/ciyaar

# 2. Install dependencies
npm install

# 3. Build the app
npm run build

# 4. Start with PM2
pm2 start npm --name "ciyaar-web" -- start

# 5. Configure Nginx for Next.js
sudo nano /etc/nginx/sites-available/web
```

Add:
```nginx
server {
    listen 80;
    server_name fanbroj.net www.fanbroj.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
pm2 save
```

### Option B: Deploy on Vercel (Recommended)

```bash
# 1. Install Vercel CLI locally (on your Mac)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from your local machine
cd ~/path/to/ciyaar
vercel --prod

# 4. Set environment variables on Vercel dashboard
# - CONVEX_DEPLOYMENT
# - NEXT_PUBLIC_CONVEX_URL
# etc.
```

---

## ☁️ Part 3: CloudFront CDN Setup

### Create CloudFront Distribution

1. **Go to AWS CloudFront Console**
2. **Create Distribution**
   - **Origin Domain**: `13.61.187.198` (your streaming server IP)
   - **Protocol**: HTTP only (or setup SSL on origin)
   - **Origin Path**: Leave empty
   - **Name**: `fanbroj-hls-origin`

3. **Default Cache Behavior Settings**:
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: Create custom policy:
     - **Minimum TTL**: 0
     - **Maximum TTL**: 3600
     - **Default TTL**: 1
   - **Origin Request Policy**: All viewer headers

4. **Distribution Settings**:
   - **Alternate Domain Names (CNAMEs)**: `cdn.fanbroj.net`
   - **SSL Certificate**: Request ACM certificate for `cdn.fanbroj.net`
   - **Default Root Object**: Leave empty
   - **Logging**: Enable (optional)

5. **Create Distribution** and wait for deployment (~15 minutes)

### Configure Domain DNS

Add these records to your DNS (Route 53 or your DNS provider):

```
Type    Name              Value                                TTL
---------------------------------------------------------------------
CNAME   cdn.fanbroj.net   d123abc.cloudfront.net              300
CNAME   fanbroj.net       cname.vercel-dns.com (from Vercel)  300
```

---

## 🔄 Part 4: Continuous Deployment

### Auto-Deploy Streams on Server Restart

```bash
# 1. Create startup script
nano ~/ciyaar/scripts/startup-streams.sh
```

Add:
```bash
#!/bin/bash
cd ~/ciyaar

# Wait for network
sleep 10

# Start all streams
./scripts/manage-event.sh start sky-action "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9696"
./scripts/manage-event.sh start sky-football "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9700"
./scripts/manage-event.sh start sky-main "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701"
./scripts/manage-event.sh start tnt-sport-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/14345"
./scripts/manage-event.sh start tnt-sport-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/14346"
```

```bash
chmod +x ~/ciyaar/scripts/startup-streams.sh

# 2. Add to crontab
crontab -e
```

Add this line:
```
@reboot /home/ubuntu/ciyaar/scripts/startup-streams.sh >> /home/ubuntu/ciyaar/logs/startup.log 2>&1
```

### GitHub Auto-Deploy Hook

```bash
# 1. Create deploy script
nano ~/ciyaar/scripts/deploy.sh
```

Add:
```bash
#!/bin/bash
cd ~/ciyaar

echo "Pulling latest changes..."
git pull origin main

echo "Making scripts executable..."
chmod +x scripts/*.sh

echo "Restarting streams..."
pm2 restart all

echo "Deployment complete!"
```

```bash
chmod +x ~/ciyaar/scripts/deploy.sh

# To deploy manually:
~/ciyaar/scripts/deploy.sh
```

---

## 📊 Part 5: Monitoring & Maintenance

### Monitor Streams

```bash
# Check all PM2 processes
pm2 list

# Monitor in real-time
pm2 monit

# View logs for specific channel
pm2 logs event-sky-action

# View all logs
pm2 logs

# Check resource usage
htop

# Check network usage
vnstat -l
```

### Check HLS Health

```bash
# Check segment count (should be ~20-25)
ls /var/www/html/hls/sky-action/*.ts | wc -l

# Check latest playlist
tail -20 /var/www/html/hls/sky-action/index.m3u8

# Check disk usage
df -h

# Check logs
tail -50 ~/ciyaar/logs/sky-action.log
```

### Restart Individual Channel

```bash
# Stop channel
./scripts/manage-event.sh stop sky-action

# Clean files
sudo rm -rf /var/www/html/hls/sky-action/

# Restart
./scripts/manage-event.sh start sky-action "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9696"
```

---

## 🆘 Troubleshooting

### Issue: Streams not playing

```bash
# 1. Check if FFmpeg is running
pm2 list

# 2. Check logs for errors
pm2 logs event-sky-action --lines 100

# 3. Verify HLS files exist
ls -lh /var/www/html/hls/sky-action/

# 4. Test stream URL directly
curl http://localhost/hls/sky-action/index.m3u8

# 5. Check Nginx is running
sudo systemctl status nginx

# 6. Restart everything
pm2 restart all
sudo systemctl restart nginx
```

### Issue: High CPU/Memory usage

```bash
# Check resource usage
htop

# Reduce number of channels
pm2 delete event-tnt-sport-2

# Check logs for reconnection loops
pm2 logs --lines 200 | grep -i "error\|reconnect"
```

### Issue: CloudFront 404 errors

```bash
# Create CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/hls/*"

# Or wait 60 seconds for cache to expire
```

---

## 📝 Quick Reference

### Essential Commands

```bash
# Deploy latest code
cd ~/ciyaar && git pull && ./scripts/deploy.sh

# Start all channels
pm2 start all

# Stop all channels
pm2 stop all

# Restart all channels
pm2 restart all

# View logs
pm2 logs

# Save PM2 config
pm2 save

# Check status
pm2 status
```

### File Locations

- **Scripts**: `~/ciyaar/scripts/`
- **Logs**: `~/ciyaar/logs/`
- **Config**: `~/ciyaar/config/`
- **HLS Output**: `/var/www/html/hls/`
- **Nginx Config**: `/etc/nginx/sites-available/`

### Stream URLs

- **Origin**: `http://13.61.187.198/hls/{channel}/index.m3u8`
- **CDN**: `https://cdn.fanbroj.net/hls/{channel}/index.m3u8`

### Available Channels

- `sky-action`
- `sky-football`
- `sky-main`
- `tnt-sport-1`
- `tnt-sport-2`

---

## 🎯 Next Steps

1. ✅ Setup monitoring/alerts (AWS CloudWatch)
2. ✅ Configure auto-scaling (if needed)
3. ✅ Setup automated backups
4. ✅ Implement health checks
5. ✅ Add more channels as needed

---

## 📞 Support

For issues:
1. Check PM2 logs: `pm2 logs`
2. Check system logs: `sudo journalctl -xe`
3. Check GitHub Issues: https://github.com/Ab07x/ciyaar/issues

---

**Last Updated**: January 28, 2026
**Server**: AWS Lightsail Ubuntu 24.04
**Streams**: 5 concurrent channels
**CDN**: CloudFront
