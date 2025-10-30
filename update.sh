#!/bin/bash

# Update script for hhhack.agiin2024.ru
set -e

APP_DIR="/var/www/hhhack"

echo "🔄 Updating application..."

cd $APP_DIR
git pull origin master

cd $APP_DIR/web
npm ci
npm run build

pm2 restart hhhack

echo "✅ Update complete!"
pm2 status

