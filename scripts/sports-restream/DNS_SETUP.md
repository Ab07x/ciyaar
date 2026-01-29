# 🌐 DNS Setup Guide for Sports Streaming

Complete DNS configuration for your cheap `.online` domain with CloudFlare.

---

## 📋 Recommended Subdomains

For a sports streaming setup, you need **minimum 2 subdomains**:

| Subdomain | Purpose | Points To | Proxy |
|-----------|---------|-----------|-------|
| `stream.yourdomain.online` | Streaming server origin | Lightsail Static IP | ❌ DNS Only |
| `cdn.yourdomain.online` | CDN for viewers | CloudFront Domain | ✅ Proxied |

**Optional 3rd subdomain:**
| `admin.yourdomain.online` | Management interface | Lightsail Static IP | ✅ Proxied |

---

## 🚀 Step-by-Step Setup

### Step 1: Add Domain to CloudFlare

1. Go to [CloudFlare Dashboard](https://dash.cloudflare.com)
2. Click **"Add a Site"**
3. Enter your domain: `yourdomain.online`
4. Select **Free Plan**
5. Copy the 2 nameservers CloudFlare gives you
6. Go to your domain registrar (where you bought the .online domain)
7. Change nameservers to CloudFlare's
8. Wait 5-30 minutes for propagation

---

### Step 2: Create DNS Records

In CloudFlare Dashboard → Your Domain → **DNS** → **Records**

#### Record 1: Stream Origin (REQUIRED)
```
Type: A
Name: stream
Target: YOUR_LIGHTSAIL_STATIC_IP
Proxy Status: DNS Only (gray cloud)
TTL: Auto
```

**Why DNS Only?** 
- CloudFlare's proxy can interfere with HLS streaming
- Direct connection needed for FFmpeg/CORS
- Keep this unproxied for reliability

---

#### Record 2: CDN Endpoint (REQUIRED)
```
Type: CNAME
Name: cdn
Target: YOUR_CLOUDFRONT_DOMAIN.cloudfront.net
Proxy Status: Proxied (orange cloud)
TTL: Auto
```

**Example:**
```
Name: cdn
Target: dhl5pduahvd17.cloudfront.net
```

**Why Proxied?**
- Hides your CloudFront origin
- Adds DDoS protection
- SSL certificate handled automatically

---

#### Record 3: Admin Panel (OPTIONAL)
```
Type: A
Name: admin
Target: YOUR_LIGHTSAIL_STATIC_IP
Proxy Status: Proxied (orange cloud)
TTL: Auto
```

**Why Proxied?**
- Protects your admin interface
- IP whitelist can be bypassed if needed
- Access logs show CloudFlare IPs

---

### Step 3: SSL/TLS Configuration

In CloudFlare Dashboard → **SSL/TLS**:

1. **Overview Tab:**
   - Set to **"Full (strict)"** or **"Full"**

2. **Edge Certificates:**
   - CloudFlare will auto-generate SSL for your subdomains
   - Wait 5 minutes for "Active" status

---

### Step 4: Configure CloudFront

In AWS Console → CloudFront:

1. Edit your distribution
2. **Alternate Domain Names:**
   ```
   cdn.yourdomain.online
   ```

3. **Custom SSL Certificate:**
   - Request certificate in ACM (us-east-1)
   - Add domain: `cdn.yourdomain.online`
   - Validate via DNS (CNAME record)
   - Wait for "Issued" status

4. **Origin Settings:**
   - Origin Domain: `stream.yourdomain.online`
   - Protocol: HTTP only (or HTTPS if you setup SSL on Lightsail)

---

## 📊 Final DNS Configuration

Your CloudFlare DNS should look like this:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| A | stream | 52.XX.XX.XX | ❌ DNS Only |
| CNAME | cdn | dhl5pduahvd17.cloudfront.net | ✅ Proxied |
| A | admin | 52.XX.XX.XX | ✅ Proxied |

---

## 🔗 URLs You'll Use

| Purpose | URL |
|---------|-----|
| Stream Origin | `http://stream.yourdomain.online/sports/event/index.m3u8` |
| Public Stream | `https://cdn.yourdomain.online/sports/event/index.m3u8` |
| Health Check | `http://stream.yourdomain.online/health` |
| Admin Panel | `https://admin.yourdomain.online` |

---

## 🧪 Testing Your Setup

```bash
# Test stream origin (should return m3u8 or 404 if no stream)
curl -I http://stream.yourdomain.online/health

# Test CDN (should return via CloudFront)
curl -I https://cdn.yourdomain.online/health

# Check DNS propagation
dig stream.yourdomain.online
dig cdn.yourdomain.online
```

---

## ⚠️ Important Notes

### Why Keep `stream.` Unproxied?

1. **HLS Compatibility:** CloudFlare's proxy can buffer or modify HLS requests
2. **Real IP:** FFmpeg needs direct connection to your server
3. **Performance:** No extra hop for stream data

### Security Considerations

Even though `stream.` is unproxied:
- Your **IPTV source URLs are still hidden** (encrypted in config)
- **Provider sees** residential proxy IP, not your server
- **Viewers see** CloudFront domain, not your origin

---

## 🔄 Updating Your Config

After DNS is setup, update your server config:

```bash
# Edit sports config
nano ~/sports-stream/config/sports.conf

# Add:
DOMAIN=yourdomain.online
CLOUDFRONT_DOMAIN=cdn.yourdomain.online
STREAM_ORIGIN=stream.yourdomain.online
```

---

## 🆘 Troubleshooting

### DNS Not Propagating
```bash
# Check with different DNS servers
dig @8.8.8.8 stream.yourdomain.online
dig @1.1.1.1 stream.yourdomain.online
```

### CloudFront Error
- Ensure SSL certificate is "Issued" in ACM
- Check CloudFront distribution status is "Deployed"
- Verify CNAME record points to correct CloudFront domain

### Stream Not Loading
```bash
# Test direct to origin
curl http://stream.yourdomain.online/sports/test/index.m3u8

# Test via CDN
curl https://cdn.yourdomain.online/sports/test/index.m3u8
```

---

## ✅ Checklist

- [ ] Domain added to CloudFlare
- [ ] Nameservers updated at registrar
- [ ] `stream.` A record created (DNS Only)
- [ ] `cdn.` CNAME record created (Proxied)
- [ ] CloudFront SSL certificate issued
- [ ] CloudFront alternate domain name added
- [ ] Server config updated with domains
- [ ] Tested stream URLs

---

**Your streaming infrastructure is now properly configured with DNS!** 🎉