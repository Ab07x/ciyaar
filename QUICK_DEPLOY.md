# ⚡ Quick Deployment Checklist

Use this for rapid deployment after code updates.

## 🚀 On Your Server (Ubuntu)

```bash
# 1. SSH into server
ssh ubuntu@13.61.187.198

# 2. Pull latest code
cd ~/ciyaar
git pull origin main

# 3. Make scripts executable
chmod +x scripts/*.sh

# 4. Restart streams (if already running)
pm2 restart all

# 5. Or start fresh (if not running)
pm2 delete all
sudo rm -rf /var/www/html/hls/*/

./scripts/manage-event.sh start sky-action "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9696"
./scripts/manage-event.sh start sky-football "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9700"
./scripts/manage-event.sh start sky-main "http://iptvtour.store:80/d06HPCFR/qEBJjW3/9701"
./scripts/manage-event.sh start tnt-sport-1 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/14345"
./scripts/manage-event.sh start tnt-sport-2 "http://iptvtour.store:80/d06HPCFR/qEBJjW3/14346"

# 6. Save PM2 config
pm2 save

# 7. Check status
pm2 list
pm2 logs --lines 20
```

## 🌐 Web App (Vercel)

Vercel auto-deploys from GitHub when you push to `main`. No manual steps needed.

**Or manually trigger:**
```bash
# On your local machine
cd ~/ciyaar
vercel --prod
```

## ✅ Verify Deployment

1. **Check streams are running:**
   ```bash
   pm2 list
   ls -lh /var/www/html/hls/sky-action/
   ```

2. **Test stream URL:**
   ```bash
   curl http://localhost/hls/sky-action/index.m3u8
   ```

3. **Test on website:**
   - Desktop: https://fanbroj.net/live/sky-sports-action
   - Mobile: Open same URL on phone

4. **Check CDN:**
   - https://cd.fanbroj.net/hls/sky-action/index.m3u8

## 🔍 Quick Troubleshooting

**Streams not working?**
```bash
pm2 logs event-sky-action --lines 50
```

**High memory/CPU?**
```bash
htop
pm2 monit
```

**Restart specific channel:**
```bash
./scripts/manage-event.sh stop sky-action
./scripts/manage-event.sh start sky-action "URL"
```

## 📋 What Got Updated?

Latest changes:
- ✅ Mobile video playback fixes
- ✅ Event streaming optimizations (6s segments, 2min buffer)
- ✅ Sequential segment numbering (fixes looping)
- ✅ Better mobile touch controls
- ✅ Auto user-interaction prompts

See full deployment guide: `docs/AWS_LIGHTSAIL_DEPLOYMENT.md`