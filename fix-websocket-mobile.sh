#!/bin/bash

# 🔌 MOBILE APP WEBSOCKET FIX
# Fixes WebSocket connection issues in GitHub Codespace

echo "🔧 FIXING WEBSOCKET CONNECTION ISSUES"
echo "====================================="

# Navigate to mobile app directory
cd /workspaces/telemedicine-platform/mobile-app

# Kill any processes that might be running on wrong ports
echo "🛑 Stopping processes on conflicting ports..."
lsof -ti :19006 | xargs kill -9 2>/dev/null || echo "Port 19006 is free"
lsof -ti :19007 | xargs kill -9 2>/dev/null || echo "Port 19007 is free"

# Clear any cached configurations
echo "🧹 Clearing Expo cache..."
rm -rf .expo/web-cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Wait for processes to fully terminate
sleep 3

# Set environment variables for proper WebSocket handling
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_USE_DEV_SERVER=true
export EXPO_NO_DOTENV=1

echo "🚀 Starting mobile app with WebSocket fixes..."
echo "📱 App URL: https://stunning-journey-wv5pxxvw49xh565g-19007.app.github.dev/"
echo "🔌 WebSocket: wss://stunning-journey-wv5pxxvw49xh565g-19007.app.github.dev/_expo/ws"
echo ""

# Start with specific WebSocket configuration
npx expo start --web --port 19007 --clear --no-dev --offline
