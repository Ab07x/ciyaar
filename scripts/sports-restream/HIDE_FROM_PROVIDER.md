# 🕵️ Hiding From IPTV Provider

This guide explains how to hide your restreaming activity from IPTV providers who actively block restreaming connections.

---

## 🚨 The Problem

IPTV providers detect restreaming by:

1. **Multiple connections** from same IP
2. **Long-duration connections** (hours)
3. **Consistent User-Agent** across requests
4. **Server IP ranges** (AWS, DigitalOcean, etc.)
5. **Connection patterns** (too regular/perfect)
6. **High bandwidth usage** patterns

---

## ✅ The Solution

### Architecture: Residential Proxy/VPN + Stealth Techniques

```
Your Server (AWS Lightsail)
    ↓
Residential Proxy/VPN (Home IP)
    ↓
IPTV Provider (Sees residential IP, not AWS)
```

---

## 🛠️ Setup Options

### Option 1: Residential Proxy (Recommended)

**How it works:** Your server connects through a real residential IP address.

**Providers:**
- **Bright Data** (formerly Luminati) - Most reliable
- **Oxylabs** - Good for streaming
- **Smartproxy** - Affordable
- **PacketStream** - Cheapest option

**Cost:** ~$5-15/GB or $50-300/month unlimited

**Setup:**

```bash
# 1. Buy residential proxy from provider
# 2. Configure stealth restreamer
~/sports-stream/scripts/stealth-restreamer.sh config

# 3. Edit the config file
nano ~/sports-stream/config/proxy.conf

# 4. Add your proxy (example format):
RESIDENTIAL_PROXIES=(
    "http://user123:pass456@us.residential.proxy.com:8080"
    "http://user123:pass456@uk.residential.proxy.com:8080"
)

# 5. Test the proxy
~/sports-stream/scripts/stealth-restreamer.sh test-proxy

# 6. Start streaming with stealth
~/sports-stream/scripts/stealth-restreamer.sh stream "http://iptv-source.com/stream.m3u8" /var/www/html/sports/event1
```

---

### Option 2: VPN with Residential Exit

**How it works:** Route all traffic through a VPN that exits from a residential IP.

**Options:**
- **Mullvad VPN** - No logs, wireguard
- **ProtonVPN** - Secure core
- **Windscribe** - Residential IPs available
- **Custom OpenVPN** to a home connection

**Setup:**

```bash
# Install OpenVPN
sudo apt install openvpn

# Add VPN configs
mkdir -p ~/sports-stream/config/vpn
# Copy your .ovpn files to this directory

# Test VPN rotation
~/sports-stream/scripts/stealth-restreamer.sh vpn-rotate

# Check status
~/sports-stream/scripts/stealth-restreamer.sh vpn-status
```

---

### Option 3: Home Server Relay (Most Secure)

**How it works:** Small device at home pulls stream, your AWS server pulls from home.

**Hardware:**
- Raspberry Pi 4 ($50)
- Old laptop
- Cheap VPS in your home country

**Architecture:**
```
AWS Lightsail ← Home Raspberry Pi ← IPTV Provider
   (CDN)         (Looks like user)   (Source)
```

**Setup on Raspberry Pi:**
```bash
# Install FFmpeg
sudo apt update && sudo apt install ffmpeg

# Pull and restream
ffmpeg -i "http://iptv-source.com/stream.m3u8" \
    -c copy -f hls -hls_time 4 \
    -hls_segment_filename "/var/www/html/segment_%03d.ts" \
    "/var/www/html/index.m3u8"
```

**Setup on AWS:**
```bash
# Pull from your home server
ffmpeg -i "http://your-home-ip:8080/index.m3u8" \
    -c copy -f hls \
    -hls_segment_filename "/var/www/html/sports/event/%03d.ts" \
    "/var/www/html/sports/event/index.m3u8"
```

---

## 🔒 Stealth Techniques Used

### 1. **Random User-Agents**
Rotates between real device signatures:
- iPhone iOS 17
- Android 14 devices
- Smart TVs (Samsung, LG)
- IPTV apps (TiviMate, IPTV Smarters)

### 2. **Connection Jitter**
Random delays (0.5-3 seconds) between requests to avoid robotic patterns.

### 3. **Session Rotation**
Changes connection parameters every 30 minutes ±5 minutes.

### 4. **Bandwidth Throttling**
Limits to 4Mbps (looks like residential user, not datacenter).

### 5. **Header Randomization**
Randomizes:
- Accept-Language
- Referrer
- Connection headers

### 6. **Cookie Persistence**
Maintains session cookies like a real browser.

---

## 📋 Complete Setup Example

```bash
# 1. Setup server
curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/sports-restream/setup-sports-server.sh | bash

# 2. Configure stealth mode
~/sports-stream/scripts/stealth-restreamer.sh config

# 3. Edit proxy configuration
nano ~/sports-stream/config/proxy.conf
# Add:
RESIDENTIAL_PROXIES=(
    "http://your-proxy-user:your-proxy-pass@proxy.example.com:8080"
)

# 4. Add encrypted source
~/sports-stream/scripts/stream-protector.sh add bein-sports "http://iptv-provider.com/bein1.m3u8"

# 5. Start event with stealth
SOURCE=$(~/sports-stream/scripts/stream-protector.sh get bein-sports)
~/sports-stream/scripts/stealth-restreamer.sh stream "$SOURCE" /var/www/html/sports/premier-league

# 6. Start health monitor
~/sports-stream/scripts/monitor-health.sh start
```

---

## 🧪 Testing Your Stealth

```bash
# Test what IP provider sees
~/sports-stream/scripts/stealth-restreamer.sh test-proxy

# Check current VPN status
~/sports-stream/scripts/stealth-restreamer.sh vpn-status

# View stealth headers
~/sports-stream/scripts/stealth-restreamer.sh test-headers

# Test with small fetch
~/sports-stream/scripts/stealth-restreamer.sh fetch "http://ipinfo.io/ip" /tmp/my-ip.txt
```

---

## ⚠️ Important Notes

1. **Never use datacenter IPs directly** - Providers block AWS, GCP, Azure ranges
2. **Rotate sessions** - Don't keep same connection for hours
3. **Use residential bandwidth limits** - Don't pull 50Mbps, look like a home user (3-5Mbps)
4. **Match timezone** - Your server timezone should match proxy location
5. **Monitor blocks** - If stream stops working, proxy might be blocked

---

## 💰 Cost Comparison

| Method | Monthly Cost | Difficulty | Reliability |
|--------|-------------|------------|-------------|
| Residential Proxy | $50-300 | Easy | ⭐⭐⭐⭐⭐ |
| VPN | $10-30 | Medium | ⭐⭐⭐⭐ |
| Home Raspberry Pi | $0 | Hard | ⭐⭐⭐ |
| Mobile 4G Proxy | $20-100 | Medium | ⭐⭐⭐⭐ |

---

## 🚨 Emergency: If Provider Blocks You

```bash
# 1. Stop all streams immediately
~/sports-stream/scripts/sports-event-manager.sh stop all

# 2. Rotate VPN/Proxy
~/sports-stream/scripts/stealth-restreamer.sh vpn-rotate

# 3. Wait 10 minutes
sleep 600

# 4. Restart with new IP
~/sports-stream/scripts/stealth-restreamer.sh stream <source> <output>

# 5. Check if working
~/sports-stream/scripts/monitor-health.sh check <event>
```

---

## 📞 Recommended Proxy Providers for Streaming

1. **Bright Data** (luminati.io) - Best for streaming, expensive
2. **Oxylabs** - Good residential pool
3. **Smartproxy** - Affordable, rotating IPs
4. **PacketStream** - Cheapest, P2P residential
5. **IPRoyal** - Static residential IPs

---

**Your provider will see:** A regular home user watching TV on their iPhone
**They won't see:** AWS datacenter IP, server User-Agent, or restreaming patterns