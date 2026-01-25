
# ⚡️ Fanbroj 24/7 IPTV Relay Guide (Low Cost)

This specific guide is for creating **User-Friendly 24/7 Channels** (like "Man Utd TV", "World Cup HQ") from a raw IPTV username/password subscription.

**The Strategy:**
Don't just paste raw links. We will run a lightweight **Relay Service** on your $12 Lightsail server that connects to your IPTV provider, keeps the connection alive 24/7, and serves a clean `.m3u8` to your users.

---

## 🏗 Architecture (The "Smart Relay" Method)

1.  **Input:** Your IPTV Provider (`http://line.provider.com/get/user/pass/1234.ts`)
2.  **Middleman (Your Server):**
    *   Runs FFmpeg in "Copy Mode" (0% CPU).
    *   Auto-reconnects if the provider kicks you off.
    *   Cleans up the stream headers so it plays on ALL devices (iPhone/Android/Web).
3.  **Output:** `https://fanbroj.net/hls/manutd/index.m3u8`

This creates a **Buffer-Free Experience** because your server buffers the stream, not the user's phone.

---

## 🛠 Step 1: Create the Management Script

We will create a robust script specifically for 24/7 channels that handles disconnects automatically.

**File:** `scripts/start-247-channel.sh`

```bash
#!/bin/bash
# Usage: ./start-247-channel.sh <slug> <iptv_username> <iptv_password> <channel_id> <provider_host>

SLUG=$1
USER=$2
PASS=$3
CH_ID=$4
HOST=$5

# Example Input URL Construction (Most IPTV use this format)
# http://server:80/live/user/pass/1234.ts
INPUT_URL="http://$HOST/live/$USER/$PASS/$CH_ID.ts"
WEB_ROOT="/var/www/html"
STREAM_DIR="$WEB_ROOT/hls/$SLUG"

mkdir -p "$STREAM_DIR"

echo "📺 Starting 24/7 Channel: $SLUG"
echo "🔌 Source: $INPUT_URL"

# infinite loop to auto-restart if it crashes
while true; do
    ffmpeg -hide_banner -loglevel warning \
        -user_agent "VLC/3.0.18" \
        -fflags +genpts+discardcorrupt \
        -re \
        -i "$INPUT_URL" \
        -c copy \
        -hls_time 6 \
        -hls_list_size 6 \
        -hls_flags delete_segments \
        -hls_segment_filename "$STREAM_DIR/%03d.ts" \
        "$STREAM_DIR/index.m3u8"
    
    echo "⚠️ Stream crashed! Restarting in 5 seconds..."
    sleep 5
done
```

---

## 🛠 Step 2: Running 24/7 Channels with PM2

PM2 is perfect for this. It keeps the script running in the background forever.

**Command to Start "Man Utd TV":**
*(Replace variables with your actual IPTV details)*

```bash
pm2 start ~/ciyaar/scripts/start-247-channel.sh --name "ch-manutd" -- \
    manutd \
    "omar73x" \
    "mypassword123" \
    "5678" \
    "pro.tvhelper.net:8080"
```

**Command to Start "World Cup":**

```bash
pm2 start ~/ciyaar/scripts/start-247-channel.sh --name "ch-worldcup" -- \
    worldcup \
    "omar73x" \
    "mypassword123" \
    "9901" \
    "pro.tvhelper.net:8080"
```

**Save Configuration:**
```bash
pm2 save
```

Now, even if you reboot the server, these channels come back online automatically.

---

## 🛠 Step 3: Add to Website (Convex)

1.  Go to your Convex Dashboard -> Data -> `channels`.
2.  Add a new row:
    *   **slug:** `manutd`
    *   **title:** "Man Utd TV 24/7"
    *   **streamUrl:** `https://fanbroj.net/hls/manutd/index.m3u8`
    *   **isLive:** `true`

---

## 💰 Cost Analysis (7 Channels)

Your $12 Lightsail instance (2 TB Transfer) can handle:

*   **Ingest (Downloading 7 channels):** 
    *   7 channels * 2 Mbps = 14 Mbps.
    *   24 hours/day * 30 days = **~4,500 GB** (Ingress is FREE on AWS/Lightsail). ✅
*   **Egress (Serving to Users):**
    *   This is where you pay. 
    *   Video is cached by Nginx, so it serves fast.
    *   Capacity: You can serve about **50-100 concurrent users** directly from Lightsail before hitting limits.
    *   **Scale Up:** If you get 500+ users, TURN ON CLOUDFRONT (See `DEDICATED_ENCODER_GUIDE.md`). Use Lightsail ONLY as the Origin.

## ✅ Summary

1.  **Upload Script**: `git pull` then `chmod +x scripts/start-247-channel.sh`.
2.  **Start Streams**: Use `pm2 start ...` for each channel you want.
3.  **Link in DB**: Add `https://fanbroj.net/hls/SLUG/index.m3u8` to your website.

This converts your unstable IPTV links into **professional, owned, 24/7 TV channels** on your site.
