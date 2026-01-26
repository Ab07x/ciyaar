# 🌐 Setting up live.fanbroj.net for Streaming

This guide explains how to point your custom domain (`live.fanbroj.net`) to your AWS Lightsail streaming server and secure it with HTTPS.

---

## 1. DNS Configuration (Do this first)

Go to your domain registrar (GoDaddy, Namecheap, Route53, etc.) where you bought `fanbroj.net`.

### Add an "A Record"

| Type | Name / Host | Value / Target | TTL |
|------|-------------|----------------|-----|
| **A** | **live** | `13.61.187.198` | Automatic / 1 min |

*Result: `live.fanbroj.net` will point to your Lightsail server IP.*

---

## 2. Configure Nginx on Lightsail

SSH into your server:
```bash
ssh -i ~/LightsailDefaultKey.pem ubuntu@13.61.187.198
```

### Update Nginx Config

1. Edit the file:
   ```bash
   sudo nano /etc/nginx/sites-available/streaming
   ```

2. Change the `server_name` line. It currently says `server_name _;`. Change it to:
   ```nginx
   server_name live.fanbroj.net;
   ```

3. Save (Ctrl+O, Enter) and Exit (Ctrl+X).

4. Test and Reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 3. Enable HTTPS (SSL Certificate)

We use Certbot (Let's Encrypt) to get a free SSL certificate.

run this command:

```bash
sudo certbot --nginx -d live.fanbroj.net
```

1. Enter your email (for renewal notices).
2. Agree to terms (type `Y`).
3. **IMPORTANT:** When asked to redirect HTTP to HTTPS, choose **2 (Redirect)**.

---

## 4. Verification

Visit your stream URL with HTTPS:

`https://live.fanbroj.net/hls/bein1/index.m3u8`

✅ **Benefits:**
- **Secure:** Valid SSL padlock.
- **Access:** Works on iPhone/Safari (which requires HTTPS).
- **Professional:** Users see your brand, not an IP address.

---

## 5. Update Your Admin Panel

Once verified, go to your Admin Panel (`/admin/channels`) and update the stream URLs:

*   **Old:** `http://13.61.187.198/hls/...`
*   **New:** `https://live.fanbroj.net/hls/...`

---

## 🛠 Troubleshooting

**Error: "Unable to find a virtual host"**
- Make sure you updated `server_name live.fanbroj.net;` in Nginx **before** running Certbot.

**Error: "Challenge failed"**
- Wait 5-10 minutes after adding the DNS record for it to propagate globally.
