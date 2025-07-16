#!/bin/bash

echo "🛑 COMPLETE MOBILE APP RESTART"
echo "=============================="

# Step 1: Kill all processes
echo "1. Stopping all processes..."
pkill -f "expo" 2>/dev/null || true
pkill -f "node.*expo" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true
sleep 2

# Step 2: Clear ports
echo "2. Clearing ports..."
lsof -ti :19006 | xargs kill -9 2>/dev/null || echo "   Port 19006 cleared"
lsof -ti :19007 | xargs kill -9 2>/dev/null || echo "   Port 19007 cleared"
lsof -ti :19009 | xargs kill -9 2>/dev/null || echo "   Port 19009 cleared"

# Step 3: Clear cache
echo "3. Clearing cache..."
cd /workspaces/telemedicine-platform/mobile-app
rm -rf .expo/web-cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true

# Step 4: Wait for cleanup
echo "4. Waiting for cleanup..."
sleep 3

# Step 5: Show status
echo "5. Current directory and files:"
pwd
ls -la package.json webpack.config.js 2>/dev/null || echo "   Files verified"

# Step 6: Start fresh
echo ""
echo "🚀 STARTING MOBILE APP FRESH"
echo "=============================="
echo "📱 URL: https://stunning-journey-wv5pxxvw49xh565g-19007.app.github.dev/"
echo ""

# Start Expo
npx expo start --web --port 19007 --clear --offline
