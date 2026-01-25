# 📺 Fanbroj Streaming Server Guide (AWS Lightsail)

This guide explains how to turn your AWS Lightsail instance into a powerful, low-cost HLS RESTREAMING server.

**Goal:** Take a hidden/paid IPTV link -> Restream it via your server -> Play it on Fanbroj.net.
**Cost:** Minimal (Using "Copy" mode uses almost 0% CPU).
**Protection:** Users will only see `https://fanbroj.net/hls/sntv/index.m3u8`, keeping your source provider SAFE.

---

## 1. Server Prerequisites

You can use the **same AWS Lightsail instance** that hosts your Next.js app. No need to buy a new one unless you have 500+ concurrent viewers.

### A. Install FFmpeg
The tool that does the magic.

```bash
sudo apt update
sudo apt install -y ffmpeg
```

### B. Create Streaming Directory
Where the video chunks (.ts files) will live.

```bash
# Create root folder
sudo mkdir -p /var/www/html/hls

# Give ownership to your user (ubuntu) so script can write to it
sudo chown -R ubuntu:ubuntu /var/www/html
sudo chmod -R 755 /var/www/html
```

---

## 2. Configure Nginx for Streaming

We need to tell Nginx to serve `.m3u8` and `.ts` files with the correct headers (CORS allowed).

**Edit your Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/ciyaar
```

**Add this block inside your `server { ... }` block (443 ssl section):**

```nginx
    # ----------------------------------------------------
    # 🎥 HLS STREAMING CONFIG
    # ----------------------------------------------------
    location /hls {
        # Serve the files from this directory
        alias /var/www/html/hls;

        # Add CORS headers so your website can play it
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length';

        # Standard HLS headers
        add_header Cache-Control no-cache;
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }

        # Don't buffer HLS, send immediately for low latency
        autoindex off;
    }
```

**Restart Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. The "Magic" Script

I have created a script called `scripts/start-stream.sh` in your codebase. Upload this to your server (it will be there when you `git pull`).

### Make it executable:
```bash
chmod +x ~/ciyaar/scripts/start-stream.sh
```

### Usages:

Usage is simple: `./start-stream.sh <channel-name> "<m3u8-link>"`

**Example:**
If you want to stream "SNTV" from a provider link:

```bash
# Run this command/script (use single quotes for the URL!)
~/ciyaar/scripts/start-stream.sh sntv 'http://provider-iptv.com/get/username/password/1234.m3u8'
```

**What happens?**
1.  FFmpeg connects to the provider (Pretending to be VLC Player to avoid blocks).
2.  It copies the video/audio **WITHOUT ENCODING** (0% CPU load).
3.  It saves chunks to `/var/www/html/hls/sntv/`.
4.  It creates a playlist at `/var/www/html/hls/sntv/index.m3u8`.

**Your Final Public Link:**
`https://fanbroj.net/hls/sntv/index.m3u8`

*(You put THIS link into your Convex Dashboard for the Channel)*

---

## 4. Automation (Keep it running)

If the server reboots, the stream stops. To keep it running forever or restart automatically:

### Option A: Crontab (Simplest)
Edit crontab: `crontab -e`

Add a line to verify stream is running every minute (Basic):
```cron
* * * * * pgrep -f "hls/sntv" || ~/ciyaar/scripts/start-stream.sh sntv 'http://input-url...'
```

### Option B: PM2 (Better)
Since you already have PM2 for Next.js, use it for streams too!

```bash
pm2 start ~/ciyaar/scripts/start-stream.sh --name "stream-sntv" --interpreter bash -- sntv 'http://provider-url...'
pm2 save
```
If the stream crashes, PM2 restarts it instantly.

---

## 5. Troubleshooting / Anti-Ban

If the provider blocks you, FFmpeg can spoof headers.

**My script already does this:**
`-user_agent "VLC/3.0.18 LibVLC/3.0.18"`

**If you need a Referrer (some providers require you to come from their site):**
Edit the script and add `-headers "Referer: http://their-site.com/"` before the `-i` flag.

**To check if it's working:**
```bash
# Check if files are being created
ls -l /var/www/html/hls/sntv/
```
You should see `index.m3u8` and files like `index0.ts`, `index1.ts` updating constantly.
