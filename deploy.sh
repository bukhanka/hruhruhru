#!/bin/bash

# Deploy script for hhhack.agiin2024.ru
set -e

DOMAIN="hhhack.agiin2024.ru"
REPO_URL="https://github.com/bukhanka/hruhruhru"
APP_DIR="/var/www/hhhack"
PORT=3000

echo "🚀 Starting deployment for $DOMAIN..."

# Update system
echo "📦 Updating system packages..."
apt update
apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install nginx
echo "📦 Installing nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# Install certbot for SSL
echo "📦 Installing certbot..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Install PM2 for process management
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Clone or update repository
echo "📥 Setting up repository..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/master
else
    mkdir -p $APP_DIR
    cd $APP_DIR
    git clone $REPO_URL .
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
cd $APP_DIR/web
npm ci

echo "🔨 Building application..."
npm run build

# Create .env.local if needed
if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
# Add your environment variables here
EOF
fi

# Configure nginx
echo "⚙️  Configuring nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONFIG'
server {
    listen 80;
    server_name hhhack.agiin2024.ru;

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO WebSocket for Voice Chat (Server-to-Server)
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo "🧪 Testing nginx configuration..."
nginx -t

# Restart nginx
echo "🔄 Restarting nginx..."
systemctl restart nginx
systemctl enable nginx

# Start application with PM2 using ecosystem.config.js
echo "🚀 Starting applications..."
cd $APP_DIR/web
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

# Setup SSL
echo "🔒 Setting up SSL..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "SSL setup will need manual intervention"

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://$DOMAIN"
pm2 status

