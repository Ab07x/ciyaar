# 🎯 Complete IPTV Restream Deployment Guide

## From Zero to Live Streaming in 30 Minutes

This guide will walk you through deploying your IPTV restreaming server on AWS Lightsail, step by step with screenshots descriptions.

---

## Your IPTV Credentials

```
Username: jUpu92sC
Password: gEjWzKe
Server:   iptvtour.store
M3U URL:  http://iptvtour.store/get.php?username=jUpu92sC&password=gEjWzKe&type=m3u&output=ts
```

---

# PART 1: AWS Lightsail Setup

## Step 1.1: Create AWS Account (Skip if you have one)

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process
4. Add a payment method (credit card required)

---

## Step 1.2: Create Lightsail Instance

1. **Go to Lightsail Console:**
   - Visit: https://lightsail.aws.amazon.com/
   - Or search "Lightsail" in AWS Console

2. **Click "Create Instance"**

3. **Select Instance Location:**
   - Choose a region close to your viewers
   - Recommended: **Frankfurt** (eu-central-1) for Europe/Africa
   - Or **Mumbai** (ap-south-1) for Asia

4. **Select Platform:**
   - Choose: **Linux/Unix**

5. **Select Blueprint:**
   - Click: **OS Only**
   - Select: **Ubuntu 24.04 LTS**

6. **Choose Instance Plan:**
   ```
   Recommended: $24/month plan
   - 4 GB RAM
   - 2 vCPUs
   - 80 GB SSD
   - 4 TB Transfer
   ```

7. **Name Your Instance:**
   - Enter: `fanbroj-stream`

8. **Click "Create Instance"**

9. **Wait 2-3 minutes** for the instance to start (status: Running)

---

## Step 1.3: Configure Networking

1. **Click on your instance** (`fanbroj-stream`)

2. **Go to "Networking" tab**

3. **Add Firewall Rules:**
   
   Click "+ Add rule" for each:
   
   | Application | Protocol | Port |
   |-------------|----------|------|
   | HTTP        | TCP      | 80   |
   | HTTPS       | TCP      | 443  |
   | SSH         | TCP      | 22   |

4. **Create Static IP:**
   - Scroll down to "Public IP"
   - Click "Create static IP"
   - Name it: `fanbroj-ip`
   - Click "Create"
   
   **Save this IP address!** Example: `3.123.45.67`

---

## Step 1.4: Download SSH Key

1. **Go to Account** (top right menu)
2. Click **"SSH keys"**
3. Click **"Download"** for your region's default key
4. Save the `.pem` file to your computer
5. Remember where you saved it (e.g., `~/Downloads/LightsailDefaultKey.pem`)

---

# PART 2: Server Setup

## Step 2.1: Connect to Your Server

### On Mac/Linux:

Open Terminal and run:

```bash
# Set correct permissions for the key
chmod 400 ~/Downloads/LightsailDefaultKey.pem

# Connect to your server (replace YOUR_IP with your static IP)
ssh -i ~/Downloads/LightsailDefaultKey.pem ubuntu@YOUR_IP
```

### On Windows:

Use PuTTY or Windows Terminal:
1. Convert .pem to .ppk using PuTTYgen
2. Connect using PuTTY with your IP and key

### Using Lightsail Browser Console:

1. Go to your instance in Lightsail
2. Click "Connect using SSH" button (orange button)
3. A browser terminal will open

---

## Step 2.2: Run the Setup Script

Once connected to your server, run:

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/lightsail-setup.sh | bash
```

**Or manually:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clone the repository
git clone https://github.com/Ab07x/ciyaar.git ~/ciyaar

# Make scripts executable
chmod +x ~/ciyaar/scripts/*.sh

# Run setup
~/ciyaar/scripts/lightsail-setup.sh
```

**Wait 5-10 minutes** for the setup to complete.

You should see:
```
🎉 SETUP COMPLETE!
Your IPTV restream server is ready!
```

---

## Step 2.3: Verify Installation

```bash
# Check if nginx is running
sudo systemctl status nginx

# Check if PM2 is installed
pm2 --version

# Check if FFmpeg is installed
ffmpeg -version
```

---

# PART 3: Finding and Starting Channels

## Step 3.1: Search for Channels

```bash
# Go to scripts directory
cd ~/ciyaar/scripts

# Search for channels (examples)
./find-channel.sh "bein"
./find-channel.sh "sport"
./find-channel.sh "universal"
./find-channel.sh "somali"
./find-channel.sh "news"
```

**Example Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║           FANBROJ IPTV CHANNEL FINDER                        ║
╚═══════════════════════════════════════════════════════════════╝

🔍 Searching for: "bein"
📡 Provider: iptvtour.store

═══════════════════════════════════════════════════════════════
                    SEARCH RESULTS                             
═══════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ 📺 beIN Sports 1 HD
│    Group: Sports
│    ID: 54321
│
│    To start this channel:
│    ./channel-manager.sh start bein1 54321
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 📺 beIN Sports 2 HD
│    Group: Sports
│    ID: 54322
│
│    To start this channel:
│    ./channel-manager.sh start bein2 54322
└────────────────────────────────────────────────────────────┘
```

**Write down the channel IDs you want to use!**

---

## Step 3.2: Test a Channel ID

Before starting, test if the channel works:

```bash
# Test channel ID (replace 54321 with actual ID)
./channel-manager.sh test 54321
```

**Good output:**
```
✅ Channel ID 54321 is VALID (HTTP 200)

Stream Info:
  codec_name=h264
  width=1920
  height=1080
  bit_rate=4500000
```

**Bad output:**
```
❌ Channel ID 54321 returned HTTP 404
```

---

## Step 3.3: Start Your First Channel

```bash
# Start a channel
# Format: ./channel-manager.sh start <slug> <channel_id>

# Example: Start beIN Sports 1
./channel-manager.sh start bein1 54321
```

**Output:**
```
ℹ️  Starting channel: bein1
ℹ️  Channel ID: 54321
ℹ️  Source: http://iptvtour.store/live/****/****/54321.ts

✅ Channel 'bein1' started successfully!

═══════════════════════════════════════════════════════════════
  Stream URL: http://3.123.45.67/hls/bein1/index.m3u8
═══════════════════════════════════════════════════════════════
```

---

## Step 3.4: Start More Channels

```bash
# Start multiple channels
./channel-manager.sh start bein2 54322
./channel-manager.sh start universal 12345
./channel-manager.sh start somali-tv 67890

# List all running channels
./channel-manager.sh list
```

**Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║           FANBROJ CHANNEL MANAGER v2.0                       ║
╚═══════════════════════════════════════════════════════════════╝

Running Channels:
═══════════════════════════════════════════════════════════════

CHANNEL         STATUS      UPTIME     STREAM URL
───────────────────────────────────────────────────────────────
bein1           online      5m         http://3.123.45.67/hls/bein1/index.m3u8
bein2           online      3m         http://3.123.45.67/hls/bein2/index.m3u8
universal       online      2m         http://3.123.45.67/hls/universal/index.m3u8
somali-tv       online      1m         http://3.123.45.67/hls/somali-tv/index.m3u8
```

---

## Step 3.5: Save Configuration

```bash
# Save PM2 config (channels will auto-start after reboot)
pm2 save
```

---

# PART 4: Testing Your Streams

## Step 4.1: Test in Browser

Open your browser and go to:
```
http://YOUR_IP/status
```

You should see a JSON list of your channels.

---

## Step 4.2: Test with VLC Player

1. Open VLC Media Player
2. Go to: Media → Open Network Stream
3. Enter your stream URL:
   ```
   http://YOUR_IP/hls/bein1/index.m3u8
   ```
4. Click "Play"

---

## Step 4.3: Test with Online HLS Player

1. Go to: https://hls-js.netlify.app/demo/
2. Enter your stream URL in the input box
3. Click "Load"

---

# PART 5: Channel Manager Commands

## All Available Commands

```bash
cd ~/ciyaar/scripts

# Start a channel
./channel-manager.sh start <slug> <channel_id>

# Stop a channel
./channel-manager.sh stop <slug>

# Restart a channel
./channel-manager.sh restart <slug>

# Delete a channel (removes from PM2)
./channel-manager.sh delete <slug>

# List all channels
./channel-manager.sh list

# View channel status
./channel-manager.sh status

# View logs for a channel
./channel-manager.sh logs <slug>

# Test if channel ID works
./channel-manager.sh test <channel_id>

# Search for channels
./channel-manager.sh find "search term"

# Get stream URL
./channel-manager.sh url <slug>

# Save PM2 configuration
./channel-manager.sh save
```

---

## Examples

```bash
# Start beIN Sports 1 with slug "bein1" and channel ID 54321
./channel-manager.sh start bein1 54321

# Stop the bein1 channel
./channel-manager.sh stop bein1

# Restart bein1 (useful if stream freezes)
./channel-manager.sh restart bein1

# View logs for bein1
./channel-manager.sh logs bein1

# Search for all "sport" channels
./channel-manager.sh find "sport"

# Get the stream URL for bein1
./channel-manager.sh url bein1
```

---

# PART 6: Monitoring

## Real-Time Dashboard

```bash
# Start the monitoring dashboard
~/ciyaar/scripts/monitor.sh
```

This shows:
- CPU/Memory/Disk usage
- Active streams
- PM2 process status
- Stream health

Press `Ctrl+C` to exit.

---

## PM2 Monitoring

```bash
# View all processes
pm2 list

# Real-time monitoring
pm2 monit

# View all logs
pm2 logs

# View specific channel logs
pm2 logs ch-bein1
```

---

# PART 7: Using Streams in Your Website

## Stream URL Format

```
http://YOUR_IP/hls/CHANNEL_SLUG/index.m3u8
```

## Example URLs

| Channel | URL |
|---------|-----|
| bein1 | `http://3.123.45.67/hls/bein1/index.m3u8` |
| bein2 | `http://3.123.45.67/hls/bein2/index.m3u8` |
| universal | `http://3.123.45.67/hls/universal/index.m3u8` |

## Using in HLS.js (JavaScript)

```javascript
// In your video player component
const streamUrl = 'http://YOUR_IP/hls/bein1/index.m3u8';

if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(videoElement);
}
```

## Using in Video.js

```html
<video-js id="player" class="vjs-default-skin" controls>
    <source src="http://YOUR_IP/hls/bein1/index.m3u8" type="application/x-mpegURL">
</video-js>
```

---

# PART 8: Troubleshooting

## Problem: Channel won't start

```bash
# Check if channel ID is valid
./channel-manager.sh test CHANNEL_ID

# Check logs
pm2 logs ch-SLUG
```

## Problem: Stream is buffering

```bash
# Check server resources
htop

# Check bandwidth
sudo iftop

# Restart the channel
./channel-manager.sh restart SLUG
```

## Problem: 403 Forbidden from IPTV provider

Your IP may be blocked. Solutions:
1. Create a new Static IP in Lightsail
2. Attach it to your instance
3. Update your DNS if using a domain

## Problem: CORS errors in browser

```bash
# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Problem: Server crashed/rebooted

```bash
# PM2 should auto-restart channels
# If not, run:
pm2 resurrect
```

---

# PART 9: Maintenance

## Daily Tasks

```bash
# Check channel status
./channel-manager.sh list

# Check server resources
~/ciyaar/scripts/monitor.sh --once
```

## Weekly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Check bandwidth usage
vnstat -m
```

## If Channels Stop Working

```bash
# Restart all channels
pm2 restart all

# Or restart specific channel
./channel-manager.sh restart SLUG
```

---

# Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK REFERENCE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FIND CHANNELS:                                             │
│    ./find-channel.sh "search term"                          │
│                                                             │
│  START CHANNEL:                                             │
│    ./channel-manager.sh start SLUG CHANNEL_ID               │
│                                                             │
│  STOP CHANNEL:                                              │
│    ./channel-manager.sh stop SLUG                           │
│                                                             │
│  LIST CHANNELS:                                             │
│    ./channel-manager.sh list                                │
│                                                             │
│  VIEW LOGS:                                                 │
│    pm2 logs                                                 │
│                                                             │
│  MONITOR:                                                   │
│    ~/ciyaar/scripts/monitor.sh                              │
│                                                             │
│  STREAM URL:                                                │
│    http://YOUR_IP/hls/SLUG/index.m3u8                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Need Help?

- **Full Documentation:** `~/ciyaar/AWS_LIGHTSAIL_RESTREAM_MASTER_GUIDE.md`
- **Config File:** `~/ciyaar/config/iptv.conf`
- **Logs Directory:** `~/ciyaar/logs/`

---

*Guide Version: 2.0 | Last Updated: January 2026*
