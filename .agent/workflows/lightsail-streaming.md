---
description: How to set up and manage IPTV restreaming on AWS Lightsail
---

# AWS Lightsail IPTV Streaming Workflow

This workflow guides you through setting up and managing IPTV restreaming on your AWS Lightsail server.

## Prerequisites

- AWS Lightsail Ubuntu 24.04 instance
- SSH key for access
- IPTV Xtream Codes credentials

## Quick Setup

// turbo-all

### Step 1: SSH into your Lightsail server

```bash
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_LIGHTSAIL_IP
```

### Step 2: Run the Setup Script

Once connected to the server, run:

```bash
curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/setup-ubuntu24-streaming.sh | bash
```

Or if already cloned:

```bash
chmod +x ~/ciyaar/scripts/setup-ubuntu24-streaming.sh
~/ciyaar/scripts/setup-ubuntu24-streaming.sh
```

## Adding Channels

### Step 3: Find Channel IDs

```bash
~/ciyaar/scripts/find-channel.sh "Universal" 59ad8c73feb6 3c0ac8cfe4 cf.live78.online
```

### Step 4: Start a Channel

```bash
pm2 start ~/ciyaar/scripts/start-247-channel.sh \
    --name "ch-universal" \
    --interpreter bash \
    -- universal 59ad8c73feb6 3c0ac8cfe4 CHANNEL_ID cf.live78.online
```

### Step 5: Save PM2 Configuration

```bash
pm2 save
```

## Testing

### Step 6: Test Local Stream

```bash
curl -I http://localhost/hls/universal/index.m3u8
```

### Step 7: Test from External

```bash
curl -I http://YOUR_IP/hls/universal/index.m3u8
```

## Monitoring

### Check PM2 Status

```bash
pm2 list
pm2 monit
```

### View Logs

```bash
pm2 logs ch-universal
```

### Check Bandwidth

```bash
vnstat -h
```

## Full Documentation

See: `AWS_LIGHTSAIL_RESTREAM_MASTER_GUIDE.md`
