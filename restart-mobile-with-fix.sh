#!/bin/bash

# 📱 MOBILE APP RESTART WITH MIME FIX
# Test the updated webpack configuration

echo "🔄 RESTARTING MOBILE APP WITH MIME FIX"
echo "====================================="

# Navigate to mobile app directory
cd /workspaces/telemedicine-platform/mobile-app

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true

# Clear cache
echo "🧹 Clearing cache..."
rm -rf .expo/web-cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Wait a moment
sleep 3

# Start with updated configuration
echo "🚀 Starting mobile app with MIME fix..."
echo "📱 Will be available at: https://stunning-journey-wv5pxxvw49xh565g-19007.app.github.dev/"
echo ""

# Start expo
npx expo start --web --port 19007 --clear --no-dev
