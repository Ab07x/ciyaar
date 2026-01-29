# Simple Restream Guide - NO BULLSHIT

## Server: ubuntu@ip-172-26-2-90

You already have sports-stream installed. Let's use it!

---

## 🚀 Deploy (Copy & Paste)

### 1. Upload Script to Server

```bash
# From your local machine:
scp scripts/cdnfly-production/stream-5-channels.sh ubuntu@ip-172-26-2-90:~/
scp scripts/cdnfly-production/nginx-cdnfly.conf ubuntu@ip-172-26-2-90:~/
```

### 2. SSH into Server

```bash
ssh ubuntu@ip-172-26-2-90
```

### 3. Setup NGINX (One Time)

```bash
sudo cp ~/nginx-cdnfly.conf /etc/nginx/sites-available/cdnfly
sudo ln -sf /etc/nginx/sites-available/cdnfly /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Make Script Executable

```bash
chmod +x ~/stream-5-channels.sh
```

---

## ⚡ Turn ON All 5 Channels

```bash
./stream-5-channels.sh on
```

**Done!** All channels streaming in 10 seconds.

---

## ⏸️ Turn OFF All Channels

```bash
./stream-5-channels.sh off
```

---

## 📊 Check Status

```bash
./stream-5-channels.sh status
```

Expected output:
```
✓ Channel 1: LIVE (10 segments, 2s ago)
✓ Channel 2: LIVE (10 segments, 1s ago)
✓ Channel 3: LIVE (10 segments, 3s ago)
✓ Channel 4: LIVE (10 segments, 2s ago)
✓ Channel 5: LIVE (10 segments, 1s ago)
```

---

## 📺 Your Stream URLs

```
http://origin.cdnfly.online/channel-1/stream.m3u8  (Sky Sports Main Event)
http://origin.cdnfly.online/channel-2/stream.m3u8  (Sky Sports Football)
http://origin.cdnfly.online/channel-3/stream.m3u8  (Sky Sports Action)
http://origin.cdnfly.online/channel-4/stream.m3u8  (TNT Sport 1)
http://origin.cdnfly.online/channel-5/stream.m3u8  (TNT Sport 2)
```

With CloudFront CDN:
```
https://stream.cdnfly.online/channel-1/stream.m3u8
https://stream.cdnfly.online/channel-2/stream.m3u8
https://stream.cdnfly.online/channel-3/stream.m3u8
https://stream.cdnfly.online/channel-4/stream.m3u8
https://stream.cdnfly.online/channel-5/stream.m3u8
```

---

## 🧪 Test

```bash
# Test locally on server
curl http://localhost/channel-1/stream.m3u8

# Test from your computer
vlc http://origin.cdnfly.online/channel-1/stream.m3u8
```

---

## 🔄 Auto-Recovery (Optional)

```bash
crontab -e

# Add this line:
*/1 * * * * ~/stream-5-channels.sh status | grep -q "STALE\|NO PLAYLIST" && ~/stream-5-channels.sh on
```

---

## 💡 Commands

```bash
./stream-5-channels.sh on       # Start all
./stream-5-channels.sh off      # Stop all
./stream-5-channels.sh status   # Check health
pm2 list                        # List processes
pm2 logs                        # View logs
pm2 monit                       # Live monitor
```

---

## ✅ That's It!

No complicated setup. Just works.

**3 commands total:**
1. `./stream-5-channels.sh on` - Start
2. `./stream-5-channels.sh status` - Check
3. `./stream-5-channels.sh off` - Stop

**Use these URLs in your app:**
```
https://stream.cdnfly.online/channel-{1-5}/stream.m3u8
```

Done! 🔥
