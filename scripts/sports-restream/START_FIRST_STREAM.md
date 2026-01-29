# 🚀 Start Your First Stream - Command by Command

Follow these exact commands on your server to start streaming.

---

## 📋 Your Credentials

```
Username: d06HPCFR
Password: qEBJjW3
Server:   iptvtour.store
```

---

## 🎯 Step-by-Step Commands

### Step 1: SSH to Your Server
```bash
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_STATIC_IP
```

### Step 2: Install the Sports Streaming System
```bash
# Run the installer
bash ~/ciyaar/scripts/sports-restream/install.sh

# Reload shell to get new aliases
source ~/.bashrc
```

### Step 3: Find a Channel ID
```bash
# Download the channel list
curl -s "http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts" -o /tmp/channels.m3u

# Search for sports channels (common names)
grep -i "bein\|espn\|sky sport\|bt sport\|super sport" /tmp/channels.m3u | head -10

# Or search for specific channel
grep -i "bein sports 1" /tmp/channels.m3u
```

**Look for URLs like:** `http://iptvtour.store/live/d06HPCFR/qEBJjW3/12345.ts`
**The number (12345) is your CHANNEL_ID**

### Step 4: Add Your Source (Encrypted)
```bash
# Add the M3U URL to encrypted storage
sp add iptvtour "http://iptvtour.store/get.php?username=d06HPCFR&password=qEBJjW3&type=m3u&output=ts"

# Verify it was added
sp list
```

### Step 5: Start Your First Stream

**Option A - Direct Stream (Simplest):**
```bash
# Replace 12345 with actual channel ID you found
sm start test-match "http://iptvtour.store/live/d06HPCFR/qEBJjW3/12345.ts" 150
```

**Option B - With Stealth (Hide from Provider):**
```bash
# Get encrypted source
SOURCE=$(sp get iptvtour)

# Start with stealth mode
st stream "$SOURCE" /var/www/html/sports/test-match
```

### Step 6: Check if Stream is Working
```bash
# Check stream status
sm status

# View logs
sm logs test-match

# Test the stream URL
curl -I http://localhost/sports/test-match/index.m3u8
```

### Step 7: Watch Your Stream

Open in any HLS player (VLC, browser, etc.):

```
https://cdnfly.online/sports/test-match/index.m3u8
```

Or test with curl:
```bash
curl -s https://cdnfly.online/sports/test-match/index.m3u8 | head -20
```

### Step 8: Start Health Monitor (Auto-Recovery)
```bash
mon start

# Check monitor status
mon status
```

### Step 9: Stop Stream When Done
```bash
sm stop test-match
```

---

## 🎮 Common Channel IDs to Try

If the M3U search doesn't work, try these common channel ID patterns:

```bash
# Test different channel IDs
sm start bein-1 "http://iptvtour.store/live/d06HPCFR/qEBJjW3/1.ts" 30
sm start bein-2 "http://iptvtour.store/live/d06HPCFR/qEBJjW3/2.ts" 30
sm start espn "http://iptvtour.store/live/d06HPCFR/qEBJjW3/100.ts" 30
sm start sky-sports "http://iptvtour.store/live/d06HPCFR/qEBJjW3/200.ts" 30
```

---

## 🛠️ Troubleshooting

### "No such file or directory"
```bash
# Make sure install.sh ran successfully
ls -la ~/sports-stream/scripts/

# If empty, run installer again
bash ~/ciyaar/scripts/sports-restream/install.sh
source ~/.bashrc
```

### "Channel not found"
```bash
# Check if URL is accessible
curl -I "http://iptvtour.store/live/d06HPCFR/qEBJjW3/12345.ts"

# Try different channel IDs
for i in 1 2 3 4 5; do
    echo "Testing channel $i..."
    curl -s -o /dev/null -w "%{http_code}" "http://iptvtour.store/live/d06HPCFR/qEBJjW3/$i.ts"
    echo ""
done
```

### "Stream not playing"
```bash
# Check if FFmpeg is running
ps aux | grep ffmpeg

# Check nginx
curl http://localhost/health

# Check logs
tail -f ~/sports-stream/logs/test-match.log
```

### "Permission denied"
```bash
# Fix permissions
chmod +x ~/sports-stream/scripts/*.sh
sudo chown -R www-data:www-data /var/www/html/sports
```

---

## 📊 Monitor While Streaming

```bash
# Open a new terminal and SSH again, then run:
perf

# Or watch dashboard
~/sports-stream/scripts/dashboard.sh
```

---

## ✅ Success Checklist

- [ ] Installer ran successfully
- [ ] Found channel ID from M3U
- [ ] Added source with `sp add`
- [ ] Started stream with `sm start`
- [ ] Stream shows in `sm status`
- [ ] Can access `https://cdnfly.online/sports/test-match/index.m3u8`
- [ ] Health monitor running with `mon start`

---

**Ready to stream! Run these commands one by one on your server.** 🏆
