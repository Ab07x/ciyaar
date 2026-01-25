
# ⚡️ AWS Lightsail Deployment Guide (Ubuntu)

Follow these steps to deploy your Next.js + Convex application to an AWS Lightsail (Ubuntu) instance.

## 1. Prerequisites (Local)

Prepare your project for deployment.

1.  **Environment Variables**:
    Ensure your `.env.local` or `.env.production` is ready. You will need these values on the server.
    
    *   `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL`
    *   `NEXT_PUBLIC_APP_URL` (e.g. `https://fanbroj.net`)
    *   `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (for Push Notifications)
    *   Any other secrets (Google Auth, etc.)

2.  **Build Check**:
    Run `npm run build` locally to ensure there are no errors.

---

## 2. Server Setup (AWS Lightsail Terminal)

SSH into your Lightsail instance and run the following commands.

### A. Update & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (using nvm recommended or direct source)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

# Verify Node.js
node -v
npm -v

# Install PM2 (Process Manager) and pnpm
sudo npm install -g pm2 pnpm
```

### B. Clone the Repository

```bash
# Clone your repo (replace with your actual repo URL)
git clone https://github.com/Ab07x/ciyaar.git

# Enter directory
cd ciyaar
```

### C. Install Dependencies & Build

```bash
# Install dependencies
pnpm install

# Setup Environment Variables
# Create a .env file and paste your production keys
nano .env.local
# (Paste your env vars, save with Ctrl+O, exit with Ctrl+X)

# Build the project
pnpm run build
```

---

## 3. Run with PM2

Use PM2 to keep your application running 24/7.

```bash
# Start the Next.js app
pm2 start npm --name "ciyaar" -- start -- -p 3000

# Save PM2 list so it restarts on reboot
pm2 save
pm2 startup
# (Run the command output by pm2 startup if any)
```

---

## 4. Setup Nginx (Reverse Proxy) & HTTPS

Expose your app on port 80/443 using Nginx.

```bash
# Install Nginx
sudo apt install -y nginx

# Setup Firewall (UFW)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Configure Nginx

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create new config
sudo nano /etc/nginx/sites-available/ciyaar
```

Paste the following configuration (replace `fanbroj.net` with your domain):

```nginx
server {
    listen 80;
    server_name fanbroj.net www.fanbroj.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Link the config
sudo ln -s /etc/nginx/sites-available/ciyaar /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate (HTTPS)

Secure your site with Let's Encrypt (free).

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL
sudo certbot --nginx -d fanbroj.net -d www.fanbroj.net
```

Follow the prompts. Certbot will automatically update your Nginx config.

---

## 5. Updates

To update your app in the future:

```bash
cd ~/ciyaar
git pull
pnpm install
pnpm run build
pm2 restart ciyaar
```

---

## 🐳 Optional: Docker Deployment

If you prefer Docker:

```bash
# Install Docker
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# (Log out and back in for permissions to take effect)

# Create Dockerfile (if not exists)
# Build image
docker build -t ciyaar .

# Run container
docker run -d -p 3000:3000 --env-file .env.local --name ciyaar-container --restart always ciyaar
```
