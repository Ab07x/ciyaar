# Offshore Reverse Proxy Architecture - DMCA Protection

## Purpose

- **Hide origin servers** from public and legal requests
- **DMCA requests go to Trabia** (Moldova - offshore, DMCA-ignored)
- **All origin servers remain completely anonymous** and protected
- **Single VPS protects multiple sites**

---

## Multi-Site Architecture (3 Sites)

```
                         ┌─────────────────────┐
                         │      Internet       │
                         │    (Users/DMCA)     │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
        fanbroj.net          fanprojnet.com        fanbrojtv.com
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    │ DMCA requests stop here ⛔
                                    ▼
              ┌────────────────────────────────────────────┐
              │         TRABIA VPS (OFFSHORE)              │
              │         Location: Moldova 🇲🇩               │
              │         DMCA-IGNORED HOSTING               │
              │         Plan: VDS-2G (€9/mo)               │
              │         Public IP: [TRABIA_IP]             │
              │         Nginx Reverse Proxy                │
              │         SSL Termination (all 3 sites)      │
              └──────────┬─────────┬─────────┬─────────────┘
                         │         │         │
                         │ Hidden  │ Hidden  │ Hidden
                         ▼         ▼         ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │   ORIGIN 1   │ │   ORIGIN 2   │ │   ORIGIN 3   │
              │ fanbroj.net  │ │fanprojnet.com│ │fanbrojtv.com │
              │  AWS Sweden  │ │  [SERVER 2]  │ │  [SERVER 3]  │
              │   HIDDEN     │ │   HIDDEN     │ │   HIDDEN     │
              └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Cost Breakdown (3 Sites)

| Component | Cost | Protects |
|-----------|------|----------|
| Trabia VDS-2G | €9/mo | All 3 sites |
| SSL Certificates | FREE (Let's Encrypt) | All domains |
| **Total** | **€9/mo** | **3 sites DMCA-protected** |

**Cost per site: €3/mo** 🎉

---

## How DMCA Protection Works

1. **User visits fanbroj.net** → Resolves to Trabia IP
2. **DMCA complaint sent** → Goes to Trabia (Moldova)
3. **Trabia ignores DMCA** → Offshore jurisdiction
4. **AWS never exposed** → No complaints reach AWS
5. **Your content stays online** ✅

---

## DNS Configuration (NO CLOUDFLARE!)

⚠️ **DO NOT USE CLOUDFLARE** - They comply with DMCA and will expose your origin!

Point ALL domains to Trabia VPS:

### fanbroj.net
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [TRABIA_IP] | 3600 |
| A | www | [TRABIA_IP] | 3600 |
| A | cd | [TRABIA_IP] | 3600 |

### fanprojnet.com
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [TRABIA_IP] | 3600 |
| A | www | [TRABIA_IP] | 3600 |

### fanbrojtv.com
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [TRABIA_IP] | 3600 |
| A | www | [TRABIA_IP] | 3600 |

---

## Step 1: Trabia VPS Setup

### 1.1 Connect

```bash
ssh root@[TRABIA_VPS_IP]
```

### 1.2 Install Nginx

```bash
apt update && apt upgrade -y
apt install nginx certbot python3-certbot-nginx -y
systemctl enable nginx
```

---

## Step 2: Nginx Reverse Proxy Config (3 Sites)

```bash
nano /etc/nginx/sites-available/all-sites
```

```nginx
# ============================================
# REDIRECT ALL HTTP TO HTTPS
# ============================================
server {
    listen 80;
    server_name fanbroj.net www.fanbroj.net cd.fanbroj.net
                fanprojnet.com www.fanprojnet.com
                fanbrojtv.com www.fanbrojtv.com;
    return 301 https://$host$request_uri;
}

# ============================================
# SITE 1: fanbroj.net (AWS Sweden)
# ============================================
server {
    listen 443 ssl http2;
    server_name fanbroj.net www.fanbroj.net;

    client_max_body_size 100M;

    # SSL configured by Certbot

    # HIDE ORIGIN INFO
    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;
    add_header Server "nginx" always;

    location / {
        proxy_pass http://[ORIGIN_IP_1]:80;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;

        proxy_set_header X-Proxy-Secret "YOUR_SECRET_KEY_HERE";
    }
}

# Admin subdomain for fanbroj.net
server {
    listen 443 ssl http2;
    server_name cd.fanbroj.net;

    client_max_body_size 100M;

    location / {
        proxy_pass http://[ORIGIN_IP_1]:80;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header X-Proxy-Secret "YOUR_SECRET_KEY_HERE";
    }
}

# ============================================
# SITE 2: fanprojnet.com
# ============================================
server {
    listen 443 ssl http2;
    server_name fanprojnet.com www.fanprojnet.com;

    client_max_body_size 100M;

    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;
    add_header Server "nginx" always;

    location / {
        proxy_pass http://[ORIGIN_IP_2]:80;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;

        proxy_set_header X-Proxy-Secret "YOUR_SECRET_KEY_HERE";
    }
}

# ============================================
# SITE 3: fanbrojtv.com
# ============================================
server {
    listen 443 ssl http2;
    server_name fanbrojtv.com www.fanbrojtv.com;

    client_max_body_size 100M;

    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;
    add_header Server "nginx" always;

    location / {
        proxy_pass http://[ORIGIN_IP_3]:80;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;

        proxy_set_header X-Proxy-Secret "YOUR_SECRET_KEY_HERE";
    }
}
```

### Enable Config

```bash
ln -s /etc/nginx/sites-available/all-sites /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## Step 3: SSL Certificates (All 3 Sites)

```bash
certbot --nginx -d fanbroj.net -d www.fanbroj.net -d cd.fanbroj.net \
                -d fanprojnet.com -d www.fanprojnet.com \
                -d fanbrojtv.com -d www.fanbrojtv.com
```

---

## Step 4: Lock Down AWS Origin

### 4.1 AWS Lightsail Firewall

**Remove ALL public access except:**
- SSH (port 22) - Your IP only
- HTTP (port 80) - Trabia VPS IP only

```
Allowed:
  - TCP 22 from [YOUR_HOME_IP]
  - TCP 80 from [TRABIA_VPS_IP]

Blocked:
  - Everything else
```

### 4.2 Nginx on AWS - Verify Secret Header

Edit `/etc/nginx/sites-available/ciyaar` on AWS:

```nginx
server {
    listen 80;
    server_name fanbroj.net www.fanbroj.net cd.fanbroj.net;

    # BLOCK direct access - only allow from Trabia proxy
    if ($http_x_proxy_secret != "YOUR_SECRET_KEY_HERE") {
        return 444;  # Close connection silently
    }

    # ... rest of existing config
}
```

Reload:
```bash
nginx -t && systemctl reload nginx
```

---

## Step 5: Remove All AWS Traces

### 5.1 Disable CloudFront

- Go to AWS Console → CloudFront
- Disable the distribution
- Delete after disabled

### 5.2 Remove Direct IP Access

Make sure these return nothing:
- http://16.170.141.191 → Should timeout/refuse
- Direct IP should NOT be discoverable

---

## Security Checklist

- [ ] DNS points to Trabia only (no AWS IP anywhere)
- [ ] CloudFront disabled/deleted
- [ ] AWS firewall blocks all except Trabia
- [ ] Secret header verification enabled
- [ ] SSL working on Trabia
- [ ] No AWS IP in response headers
- [ ] WHOIS for domain doesn't reveal AWS

---

## Verify Origin is Hidden

```bash
# Check DNS - should show Trabia IP only
dig fanbroj.net +short

# Check headers - should NOT reveal AWS
curl -I https://fanbroj.net

# Port scan - AWS should be invisible
nmap [AWS_IP]  # Should show filtered/closed
```

---

## DMCA Response Flow

```
DMCA Notice Received
        │
        ▼
┌───────────────────┐
│ Sent to Trabia    │
│ (Moldova hosting) │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Trabia ignores    │ ← Offshore jurisdiction
│ No action taken   │
└───────────────────┘
         │
         ▼
   Content stays up ✅
```

---

## Replace These Values

| Placeholder | Description |
|-------------|-------------|
| `[TRABIA_IP]` | Your Trabia VPS public IP |
| `[ORIGIN_IP_1]` | fanbroj.net origin (AWS Sweden) |
| `[ORIGIN_IP_2]` | fanprojnet.com origin server |
| `[ORIGIN_IP_3]` | fanbrojtv.com origin server |
| `YOUR_SECRET_KEY_HERE` | Generate: `openssl rand -hex 32` |
| `[YOUR_HOME_IP]` | Your home IP for SSH access |

## Origin Server IPs (KEEP SECRET!)

| Site | Origin IP | Location |
|------|-----------|----------|
| fanbroj.net | [FILL IN] | AWS Sweden |
| fanprojnet.com | [FILL IN] | TBD |
| fanbrojtv.com | [FILL IN] | TBD |

---

## Important Reminders

1. **NEVER share AWS IP** - This defeats the entire purpose
2. **Don't use Cloudflare** - They comply with DMCA
3. **Pay Trabia anonymously** if possible (crypto)
4. **Use private WHOIS** for domain registration
5. **No AWS branding** anywhere on the site
