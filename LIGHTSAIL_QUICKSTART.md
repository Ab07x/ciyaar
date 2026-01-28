# 🚀 AWS Lightsail IPTV Restream - Quick Start Guide

> **Your IPTV Credentials:**
> - Username: `jUpu92sC`
> - Password: `gEjWzKe`
> - Server: `iptvtour.store`

---

## 📋 Step 1: Create AWS Lightsail Instance

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click **Create Instance**
3. Select:
   - **Region:** Choose closest to your users (e.g., Frankfurt for Europe/Africa)
   - **Platform:** Linux/Unix
   - **Blueprint:** Ubuntu 24.04 LTS
   - **Instance Plan:** $24/month (4GB RAM, 2 vCPU, 80GB SSD)
4. Name it: `fanbroj-stream`
5. Click **Create Instance**

---

## 📋 Step 2: Configure Networking

In Lightsail Console → Your Instance → **Networking**:

1. Add these firewall rules:
   - HTTP (80)
   - HTTPS (443)
   - SSH (22)

2. Create a **Static IP** and attach it to your instance

---

## 📋 Step 3: SSH Into Your Server

```bash
# Download your SSH key from Lightsail Console → Account → SSH Keys
# Then connect:
ssh -i ~/LightsailDefaultKey.pem ubuntu@YOUR_STATIC_IP
```

---

## 📋 Step 4: Run Setup Script

```bash
# One-command setup (copy and paste this entire block)
curl -sSL https://raw.githubusercontent.com/Ab07x/ciyaar/main/scripts/lightsail-setup.sh | bash
```

Or manually:

```bash
# Clone repository
git clone https://github.com/Ab07x/ciyaar.git ~/ciyaar

# Make scripts executable
chmod +x ~/ciyaar/scripts/*.sh

# Run setup
~/ciyaar/scripts/lightsail-setup.sh
```

---

## 📋 Step 5: Find Channel IDs

```bash
# Search for channels
~/ciyaar/scripts/find-channel.sh "bein sport"
~/ciyaar/scripts/find-channel.sh "universal"
~/ciyaar/scripts/find-channel.sh "somali"
```

Example output:
```
📺 beIN Sports 1 HD
   ID: 12345
   
   To start this channel:
   ./channel-manager.sh start bein1 12345
```

---

## 📋 Step 6: Start Channels

```bash
cd ~/ciyaar/scripts

# Start a channel (replace CHANNEL_ID with actual ID from step 5)
./channel-manager.sh start bein1 12345
./channel-manager.sh start universal 12346
./channel-manager.sh start somali-tv 12347

# List running channels
./channel-manager.sh list

# View logs
./channel-manager.sh logs bein1
```

---

## 📋 Step 7: Test Your Stream

```bash
# Check if stream is working
curl -I http://localhost/hls/bein1/index.m3u8

# Should return: HTTP/1.1 200 OK
```

**Stream URL Format:**
```
http://YOUR_STATIC_IP/hls/CHANNEL_SLUG/index.m3u8
```

Example:
```
http://123.45.67.89/hls/bein1/index.m3u8
```

---

## 📋 Step 8: Monitor Your Server

```bash
# Real-time dashboard
~/ciyaar/scripts/monitor.sh

# PM2 monitoring
pm2 monit

# View all logs
pm2 logs
```

---

## 🔧 Quick Reference Commands

### Channel Management
```bash
# Start channel
./channel-manager.sh start <slug> <channel_id>

# Stop channel
./channel-manager.sh stop <slug>

# Restart channel
./channel-manager.sh restart <slug>

# List all channels
./channel-manager.sh list

# View channel logs
./channel-manager.sh logs <slug>

# Test channel ID
./channel-manager.sh test <channel_id>

# Get stream URL
./channel-manager.sh url <slug>
```

### PM2 Commands
```bash
pm2 list              # List all processes
pm2 logs              # View all logs
pm2 logs ch-bein1     # View specific channel logs
pm2 restart ch-bein1  # Restart channel
pm2 stop ch-bein1     # Stop channel
pm2 delete ch-bein1   # Remove channel
pm2 save              # Save config (survives reboot)
pm2 monit             # Real-time monitoring
```

### System Commands
```bash
# Check disk space
df -h

# Check memory
free -h

# Check bandwidth
sudo iftop

# Check nginx status
sudo systemctl status nginx

# View nginx logs
tail -f /var/log/nginx/streaming_access.log
```

---

## 🌐 CloudFront CDN Setup (For 100+ Viewers)

If you expect more than 100 concurrent viewers, you MUST use CloudFront:

1. Go to AWS CloudFront Console
2. Create Distribution:
   - Origin Domain: `YOUR_LIGHTSAIL_IP`
   - Protocol: HTTP Only
   - Cache Policy: Create custom (TTL: 1 second for m3u8, 1 hour for ts)
3. Wait 5-15 minutes for deployment
4. Use CloudFront URL instead of direct IP:
   ```
   https://d1234abcdef.cloudfront.net/hls/bein1/index.m3u8
   ```

---

## 💰 Cost Breakdown

| Item | Monthly Cost |
|------|--------------|
| Lightsail ($24 plan) | $24 |
| IPTV Subscription | ~$10-20 |
| CloudFront (optional) | ~$0.09/GB |
| **Total (without CDN)** | **~$35-45** |

### CloudFront Costs (if needed)
- 50 viewers × 2 Mbps × 8 hours/day = ~$130/month
- 200 viewers × 2 Mbps × 4 hours/day = ~$260/month

---

## 🔒 Security Tips

1. **Change SSH port** (optional):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change: Port 22 → Port 2222
   sudo systemctl restart sshd
   ```

2. **Use fail2ban**:
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 🆘 Troubleshooting

### Stream not starting
```bash
# Check if source URL works
./channel-manager.sh test CHANNEL_ID

# Check logs
pm2 logs ch-SLUG
```

### 403 Forbidden from IPTV provider
- Your IP may be blocked
- Try getting a new Lightsail IP (Networking → Static IP → Create new)

### High latency/buffering
- Reduce HLS segment time in config
- Check source stream quality
- Consider using CloudFront

### CORS errors in browser
```bash
# Verify nginx config
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📞 Support

- Full Guide: `~/ciyaar/AWS_LIGHTSAIL_RESTREAM_MASTER_GUIDE.md`
- Config File: `~/ciyaar/config/iptv.conf`
- Logs: `~/ciyaar/logs/`

---

*Last Updated: January 2026*
