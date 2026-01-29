# 🚀 RESTART STREAMS WITH PRODUCTION SETTINGS

Follow these exact steps to restart your streams with the new production-grade settings.

---

## 📋 Step-by-Step Commands

### Step 1: Stop All Current Streams
```bash
# Stop all FFmpeg processes
pkill -9 ffmpeg

# Clean up PID files
rm -f ~/sports-stream/pids/*.pid

# Clear old stream segments
sudo rm -rf /var/www/html/sports/*
sudo mkdir -p /var/www/html/sports
sudo chown -R www-data:www-data /var/www/html/sports

# Verify stopped
pgrep ffmpeg || echo "All streams stopped"
```

### Step 2: Copy Production Script to Server
```bash
# Copy the production script
cp ~/ciyaar/scripts/sports-restream/production-stream.sh ~/sports-stream/scripts/
chmod +x ~/sports-stream/scripts/production-stream.sh

# Create easy shortcut
ln -sf ~/sports-stream/scripts/production-stream.sh ~/prod
```

### Step 3: Start Production Streams

**Stream 1: Nova Sport (already working)**
```bash
~/prod nova-sport "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437" 150
```

**Stream 2: Sky Sports 1**
```bash
~/prod sky-sports-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487" 150
```

**Stream 3: Sky Sports 2**
```bash
~/prod sky-sports-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491" 150
```

**Stream 4: Another Sports Channel**
```bash
~/prod sports-hd "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178494" 150
```

### Step 4: Verify Streams Are Running
```bash
# Check active streams
ps aux | grep ffmpeg | grep -v grep

# Check stream directories
ls -la /var/www/html/sports/

# Check segments are being created
ls -la /var/www/html/sports/nova-sport/

# View logs
tail -f ~/sports-stream/logs/nova-sport.log
```

### Step 5: Get Customer URLs
```bash
# Get your server IP
IP=$(curl -s ifconfig.me)

echo "=== CUSTOMER STREAM URLS ==="
echo ""
echo "Nova Sport:"
echo "  http://$IP/sports/nova-sport/index.m3u8"
echo ""
echo "Sky Sports 1:"
echo "  http://$IP/sports/sky-sports-1/index.m3u8"
echo ""
echo "Sky Sports 2:"
echo "  http://$IP/sports/sky-sports-2/index.m3u8"
echo ""
echo "Sports HD:"
echo "  http://$IP/sports/sports-hd/index.m3u8"
echo ""
echo "==========================="
```

### Step 6: Test in VLC
```bash
# Copy URL and test in VLC
# Should play smoothly with NO looping and NO buffering
```

---

## 🎯 One-Command Full Restart

```bash
# Stop everything
pkill -9 ffmpeg && rm -f ~/sports-stream/pids/*.pid && sudo rm -rf /var/www/html/sports/* && sudo mkdir -p /var/www/html/sports && sudo chown -R www-data:www-data /var/www/html/sports

# Wait 2 seconds
sleep 2

# Start production streams
~/prod nova-sport "http://iptvtour.store:80/d06HPCFR/qEBJjW3/178437" 150 &
sleep 2
~/prod sky-sports-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45487" 150 &
sleep 2
~/prod sky-sports-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/45491" 150 &

# Show status
sleep 3
echo "=== STREAMS RUNNING ==="
ps aux | grep ffmpeg | grep -v grep | wc -l
echo "======================="
```

---

## ✅ Verify Production Quality

```bash
# Check no looping (timestamps should increase)
tail -f ~/sports-stream/logs/nova-sport.log | grep -E "frame|time"

# Should show continuous frame count without jumps backward
```

---

## 🛑 To Stop All Streams

```bash
pkill -9 ffmpeg
rm -f ~/sports-stream/pids/*.pid
```

---

**Your streams are now running with PRODUCTION quality!** 🏆
