# 🚀 16GB Lightsail Deployment Guide

Optimized setup for the **$84/month Lightsail plan** (16GB RAM / 4 vCPUs / 320GB SSD / 6TB Transfer)

---

## 📊 What You Can Do With 16GB

| Capability | Details |
|------------|---------|
| **Simultaneous Streams** | 4-6 HD sports events at once |
| **Viewers** | 500-1000 concurrent viewers per stream |
| **Recording** | 4 hours per event (10GB max per file) |
| **Transfer** | 6TB/month = ~500 hours of HD streaming |
| **Latency** | 2-second HLS segments (low latency) |

---

## 🚀 Quick Deploy (16GB Optimized)

### Step 1: Create 16GB Instance

1. AWS Lightsail Console → Create Instance
2. **OS:** Ubuntu 24.04 LTS
3. **Plan:** $84/month (16GB RAM, 4 vCPUs, 320GB SSD)
4. **Name:** `sports-stream-16gb`
5. Create **Static IP** and attach

### Step 2: Connect & Deploy

```bash
# SSH into server
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_STATIC_IP

# Download and run optimized setup
curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/sports-restream/setup-sports-server.sh | bash

# Apply 16GB optimizations
sudo bash ~/sports-stream/scripts/optimized-16gb.conf

# Reboot to apply kernel optimizations
sudo reboot
```

### Step 3: Verify Optimization

```bash
# Check performance
perf

# Output should show:
# Streams: 0
# RAM: 0 GB
# CPU: 0%
# Connections: X
```

---

## ⚙️ 16GB Optimizations Applied

### 1. **Kernel Tuning**
```
BBR Congestion Control    → Faster streaming
128MB Socket Buffers      → Handle 1000+ viewers
2M File Descriptors       → Many concurrent connections
```

### 2. **NGINX Tuning**
```
4 Worker Processes        → Match 4 vCPUs
8192 Connections/Worker   → 32K total connections
32K Log Buffer            → Reduced I/O
HLS Nested Directories    → Better organization
```

### 3. **FFmpeg Resource Allocation**
```
2GB RAM per stream        → 6 streams max
3 Threads per stream      → 1 core for system
128M Buffer Size          → Smooth playback
```

---

## 🎮 Managing Multiple Streams

### Start 4 Simultaneous Events

```bash
# Event 1: Premier League
SOURCE1=$(~/sports-stream/scripts/stream-protector.sh get bein1)
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE1" /var/www/html/sports/epl &

# Event 2: UFC Fight Night
SOURCE2=$(~/sports-stream/scripts/stream-protector.sh get espn)
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE2" /var/www/html/sports/ufc &

# Event 3: NBA Playoffs
SOURCE3=$(~/sports-stream/scripts/stream-protector.sh get tnt)
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE3" /var/www/html/sports/nba &

# Event 4: Formula 1
SOURCE4=$(~/sports-stream/scripts/stream-protector.sh get sky-sports)
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE4" /var/www/html/sports/f1 &
```

### Monitor Resource Usage

```bash
# Quick performance check
perf

# Detailed output:
# === Performance ===
# Streams: 4
# RAM: 7.2 GB
# CPU: 45%
# Connections: 2341
```

### Individual Stream Commands

```bash
# Check active streams
streams                    # Shows: 4

# Check memory usage
stream-ram                 # Shows: 7.2 GB

# Check CPU usage
stream-cpu                 # Shows: 45%

# Check viewer connections
nginx-conns                # Shows: 2341

# Check bandwidth
bandwidth                  # Shows: 850 Mbit/s
```

---

## 📈 Performance Monitoring

### Real-time Dashboard

Create a simple monitoring script:

```bash
cat > ~/sports-stream/scripts/dashboard.sh << 'EOF'
#!/bin/bash
while true; do
    clear
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           SPORTS STREAM DASHBOARD - 16GB PLAN                 ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Streams
    STREAM_COUNT=$(pgrep -c ffmpeg 2>/dev/null || echo 0)
    echo "📺 Active Streams: $STREAM_COUNT / 6"
    
    # Resource usage
    RAM_USED=$(ps aux | grep ffmpeg | grep -v grep | awk '{sum+=$6} END {printf "%.1f", sum/1024/1024}')
    echo "💾 RAM Usage: ${RAM_USED:-0} GB / 16 GB"
    
    CPU_USED=$(ps aux | grep ffmpeg | grep -v grep | awk '{sum+=$3} END {printf "%.1f", sum}')
    echo "🔥 CPU Usage: ${CPU_USED:-0}%"
    
    # Disk
    DISK_USED=$(df -h /var/www/html | tail -1 | awk '{print $5}')
    echo "💿 Disk Usage: $DISK_USED"
    
    # Connections
    CONNS=$(ss -ant | grep :80 | wc -l)
    echo "👥 Active Connections: $CONNS"
    
    # Network
    echo ""
    echo "📊 Network (5s sample):"
    vnstat -i eth0 -tr 5 2>/dev/null | grep -E "rx|tx" || echo "  Install vnstat for network stats"
    
    # Stream details
    echo ""
    echo "📋 Stream Details:"
    for pid_file in ~/sports-stream/pids/*.pid; do
        [ -e "$pid_file" ] || continue
        name=$(basename "$pid_file" .pid)
        pid=$(cat "$pid_file" 2>/dev/null)
        if ps -p "$pid" > /dev/null 2>&1; then
            cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | tr -d ' ')
            mem=$(ps -p "$pid" -o rss= 2>/dev/null | awk '{printf "%.0f", $1/1024}')
            echo "  ● $name - CPU: ${cpu}% MEM: ${mem}MB"
        fi
    done
    
    sleep 5
done
EOF

chmod +x ~/sports-stream/scripts/dashboard.sh
```

Run dashboard:
```bash
~/sports-stream/scripts/dashboard.sh
```

---

## 🔄 Auto-Scaling Events

### Schedule Multiple Events

```bash
# Saturday Premier League - 3 matches
~/sports-stream/scripts/sports-event-manager.sh schedule "epl-match-1" "$SOURCE1" "2026-02-01 13:00" 150 &
~/sports-stream/scripts/sports-event-manager.sh schedule "epl-match-2" "$SOURCE2" "2026-02-01 15:30" 150 &
~/sports-stream/scripts/sports-event-manager.sh schedule "epl-match-3" "$SOURCE3" "2026-02-01 18:00" 150 &
```

### Sunday NFL + NBA

```bash
# NFL Sunday 1PM ET
~/sports-stream/scripts/sports-event-manager.sh schedule "nfl-1pm" "$NFL_SOURCE" "2026-02-02 18:00" 210 &

# NFL Sunday 4PM ET
~/sports-stream/scripts/sports-event-manager.sh schedule "nfl-4pm" "$NFL_SOURCE2" "2026-02-02 21:00" 210 &

# NBA All-Star Game
~/sports-stream/scripts/sports-event-manager.sh schedule "nba-asg" "$NBA_SOURCE" "2026-02-02 01:00" 180 &
```

---

## 🛡️ 16GB Security Setup

### Firewall Rules (Lightsail Console)

| Application | Port | Protocol | Limit |
|-------------|------|----------|-------|
| HTTP | 80 | TCP | - |
| HTTPS | 443 | TCP | - |
| SSH | 22 | TCP | Your IP only |
| RTMP | 1935 | TCP | 127.0.0.1 only |

### Rate Limits (Built-in)

```
Playlist requests: 30/sec per IP
Segment requests: 100/sec per IP
Max connections: 20 per IP
```

---

## 💰 Cost Breakdown (16GB Plan)

| Service | Monthly |
|---------|---------|
| Lightsail 16GB | $84 |
| CloudFront (~3TB) | $25-40 |
| Domain (.online) | $3 |
| Residential Proxy | $50-150 |
| **Total** | **$162-277** |

**ROI:** With 4-6 simultaneous premium events, this pays for itself quickly.

---

## 🆘 Troubleshooting 16GB Setup

### High Memory Usage

```bash
# Check which streams using most RAM
ps aux --sort=-%mem | grep ffmpeg | head -5

# Restart heavy stream
~/sports-stream/scripts/sports-event-manager.sh restart <event-name>
```

### Too Many Connections

```bash
# Check connection count
ss -ant | grep :80 | wc -l

# If > 5000, increase limits in nginx.conf
# worker_connections 16384;
```

### Disk Full

```bash
# Check disk usage
df -h

# Clean old recordings
find /var/recordings/sports -mtime +1 -delete

# Clean old streams
find /var/www/html/sports -type d -mtime +1 -exec rm -rf {} +
```

---

## ✅ 16GB Pre-Event Checklist

- [ ] `perf` shows < 50% CPU, < 8GB RAM used
- [ ] `streams` shows current count < 6
- [ ] `nginx-conns` shows < 4000 connections
- [ ] Residential proxy configured and tested
- [ ] Source encrypted with stream-protector
- [ ] Health monitor running (`mon status`)
- [ ] CloudFront distribution healthy
- [ ] DNS records propagated (`dig stream.yourdomain.online`)

---

**Your 16GB sports streaming server is ready for championship weekend!** 🏆