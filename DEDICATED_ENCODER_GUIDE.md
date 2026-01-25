# 🚀 Dedicated AWS Scaling Guide (2k+ Viewers)

If you expect **2,000+ simultaneous viewers**, you **CANNOT** serve the video directly from your Lightsail VPS. 
- **The Problem:** 2,000 users x 2 Mbps stream = **4 Gbps** bandwidth. A standard server port is usually 1 Gbps. Your stream will lag and buffer for everyone.
- **The Solution:** **Origin Server (Encoder)** -> **AWS CloudFront (CDN)** -> **Users**.

This architecture allows you to handle **unlimited** viewers because CloudFront distributes the load across thousands of servers worldwide.

---

## 🏗 Architecture Overview

1.  **Origin Server (EC2/Lightsail):** Does the dirty work. Connects to the IPTV provider, downloads the stream, (optionally) transcodes it, and saves `.ts` chunks to disk.
2.  **CDN (AWS CloudFront):** Pulls the chunks *once* from your Origin, creates thousands of copies, and serves them to your 2k+ users.

---

## Step 1: The Dedicated Encoder (Origin Server)

For 2k+ users, you need a stable Origin.

### Recommended Instance Types (EC2)
*   **Option A: Relay Only (Copy Mode)** - *Cheapest*
    *   **Instance:** `t3.medium` or `Lightsail $20 plan`
    *   **Use Case:** Source is already good quality (720p/1080p). You just repackage it.
    *   **Cost:** ~$30/month.
*   **Option B: Transcoding (Adaptive Bitrate)** - *Professional*
    *   **Instance:** `c6g.xlarge` (ARM-based Graviton2) or `c5.xlarge` (Intel).
    *   **Use Case:** You want to generate 1080p, 720p, and 360p ladders so users with bad internet can still watch.
    *   **Cost:** ~$100-130/month.

### Setup The Encoder (FFmpeg for Transcoding)

If you need to *transcode* (change quality/sanitize the stream), use this FFmpeg command instead of the simple copy one.

**Install Production FFmpeg:**
```bash
# On Ubuntu
sudo apt update && sudo apt install -y ffmpeg
```

**High-Performance Transcoding Script (`transcode.sh`):**

```bash
#!/bin/bash
IN_URL="$1"
OUT_DIR="/var/www/html/hls/channel_name"
mkdir -p $OUT_DIR

# Transcode to 720p (Good balance for live sports)
# -preset veryfast: Low latency
# -crf 23: Good quality
# -maxrate 2500k: Cap bitrate at 2.5Mbps (Saves bandwidth)
ffmpeg -hide_banner -loglevel error \
  -user_agent "VLC/3.0.18" \
  -re -i "$IN_URL" \
  -vf scale=-2:720 \
  -c:v libx264 -preset veryfast -tune zerolatency -profile:v high -level 4.1 \
  -b:v 2500k -maxrate 2800k -bufsize 5000k \
  -c:a aac -b:a 128k \
  -hls_time 4 -hls_list_size 6 -hls_flags delete_segments \
  -f hls "$OUT_DIR/index.m3u8"
```

---

## Step 2: Set Up AWS CloudFront (The Scaler)

This is the most important part for 2k+ users.

1.  **Go to AWS Console** -> **CloudFront** -> **Create Distribution**.
2.  **Origin Domain:** Enter your EC2/Lightsail Public IP (or domain, e.g., `origin.fanbroj.net`).
3.  **Protocol Policy:** HTTP Only (if your origin is HTTP) or Match Viewer.
4.  **Viewer Protocol Policy:** Redirect HTTP to HTTPS.
5.  **Allowed HTTP Methods:** GET, HEAD.
6.  **Cache Key and Origin Requests:**
    *   Select **CachingOptimized**.
    *   *Critical:* You must tweak the TTL (Time To Live). HLS segments change constantly.
    *   Create a **New Policy**:
        *   Name: `LiveStreamingTTL`
        *   Min TTL: `0`
        *   Max TTL: `2`
        *   Default TTL: `1`
        *   *Why?* We want CloudFront to check for a new playlist (`index.m3u8`) every second, but cache the video chunks (`.ts`) forever (since they are static names). Actually, for HLS, relying on "Headers" from Nginx is better.
7.  **Create Distribution.**

### Update Your Nginx (On Origin)

CloudFront needs to know how long to cache things. Update your Nginx config (`/etc/nginx/sites-available/...`) HLS block:

```nginx
    location /hls {
        alias /var/www/html/hls;
        add_header 'Access-Control-Allow-Origin' '*' always;
        
        # Cache .ts chunks (Video) for 1 hour 
        # (Once created, they never change)
        location ~ \.ts$ {
            expires 1h;
            add_header Cache-Control "public, max-age=3600";
        }

        # Cache .m3u8 playlists for 1 second 
        # (They change every 4 seconds)
        location ~ \.m3u8$ {
            expires 1s;
            add_header Cache-Control "public, max-age=1, must-revalidate";
        }
    }
```

---

## Step 3: Anti-Ban / Bypassing Protection

If the IPTV provider blocks you (Error 403), it's usually:
1.  **User-Agent:** They see "FFmpeg".
    *   *Fix:* Use `-user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."` spoofing Chrome.
2.  **IP Address:** They blacklisted your AWS IP.
    *   *Fix A:* Elastic IP swap (Request new IP in AWS console).
    *   *Fix B:* **Proxy usage**.

**How to use a Proxy with FFmpeg:**
If you buy a residential proxy (e.g., from Smartproxy, BrightData), add `-http_proxy` flag:

```bash
ffmpeg -http_proxy "http://username:password@proxy-server:port" -i "http://provider-url..." ...
```

---

## Step 4: The Final Link

Your users will NOT connect to your server IP. They connect to CloudFront.

*   **Origin IP:** `123.45.67.89` (Hidden, only CloudFront talks to this)
*   **CloudFront URL:** `https://d12345abcdef.cloudfront.net`

**Video URL on Fanbroj:**
`https://d12345abcdef.cloudfront.net/hls/channel_name/index.m3u8`

**Capacity:** 
- **1 Server** = Limited by Network (1Gbps). Max ~500-1000 users.
- **Server + CloudFront** = **Unlimited Users**. You pay AWS for bandwidth (~$0.08/GB), but it never crashes.
