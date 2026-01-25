#!/bin/bash
# ==============================================================================
# FANBROJ DEDICATED STREAMING SERVER SETUP
# Run this on a FRESH Ubuntu 22.04 server to make it a Streaming Powerhouse.
# ==============================================================================

# 1. Update & Install Core
echo "🚀 Installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y ffmpeg nginx git certbot python3-certbot-nginx nodejs npm

# 2. Install PM2 globals
echo "📦 Installing PM2..."
sudo npm install -g pm2 n
sudo n lts

# 3. Setup Directories
echo "📂 Creating stream directories..."
sudo mkdir -p /var/www/html/hls
sudo chown -R $USER:$USER /var/www/html

# 4. Clone Repo (for scripts)
echo "📥 Cloning scripts..."
# Note: Allows public clone. If private, user needs to add SSH keys.
git clone https://github.com/Ab07x/ciyaar.git ~/ciyaar

# 5. Connect PM2 to startup
pm2 startup

echo "✅ Server Ready!"
echo "--------------------------------------------------"
echo "Next Steps:"
echo "1. Configure Nginx (Copy block from STREAMING_GUIDE.md)"
echo "2. Run './scripts/find-channel.sh' to find IDs"
echo "3. Run 'pm2 start ./scripts/start-247-channel.sh ...' for each channel"
