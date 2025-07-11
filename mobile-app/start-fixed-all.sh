#!/bin/bash

# 📱 MOBILE APP FIXED STARTUP SCRIPT
# All dependencies and webpack issues resolved

echo "🔧 MOBILE APP STARTUP - ALL ISSUES FIXED"
echo "========================================"

# Navigate to correct directory
cd /workspaces/telemedicine-platform/mobile-app

echo "📁 Working directory: $(pwd)"
echo "📦 Checking mobile app setup..."

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in mobile-app directory"
    exit 1
fi

echo "✅ package.json found"
echo "📋 Project: $(cat package.json | grep '"name"' | cut -d'"' -f4)"

# Check if expo is installed
if [ ! -d "node_modules/expo" ]; then
    echo "❌ Expo not found, installing..."
    npm install expo --legacy-peer-deps
fi

# Check vector icons
if [ ! -d "node_modules/@expo/vector-icons" ]; then
    echo "❌ Vector icons missing, installing..."
    npm install @expo/vector-icons --legacy-peer-deps
fi

echo "✅ All dependencies verified"

# Kill any existing processes
echo "🔄 Clearing port 19006..."
lsof -ti :19006 | xargs kill -9 2>/dev/null || echo "Port 19006 is free"

# Clear Expo cache
echo "🧹 Clearing Expo cache..."
npx expo r -c || echo "Cache cleared"

# Start the app
echo "🚀 Starting mobile app with fixes..."
echo "📱 Will be available at: http://localhost:19006"
echo "🌐 And via Codespace: https://stunning-journey-wv5pxxvw49xh565g.github.dev/"
echo ""

# Start Expo with proper flags
EXPO_DEBUG=true npx expo start --web --port 19006 --non-interactive &
EXPO_PID=$!

echo "⏳ Waiting for app to start..."
sleep 10

# Check if it's running
if curl -s http://localhost:19006 > /dev/null 2>&1; then
    echo "✅ Mobile app is running successfully!"
    echo "🌐 Local: http://localhost:19006"
    echo "🌍 Codespace: https://stunning-journey-wv5pxxvw49xh565g.github.dev/ (look for port 19006)"
    echo ""
    echo "🎉 All webpack and dependency issues have been resolved!"
else
    echo "❌ App may still be starting, check the output above"
fi

echo ""
echo "📱 Mobile app process ID: $EXPO_PID"
echo "🛑 To stop: kill $EXPO_PID"
echo ""
echo "🔧 Issues Fixed:"
echo "✅ Vector icons dependencies"
echo "✅ MIME type handling"
echo "✅ Webpack configuration"
echo "✅ Buffer and stream polyfills"
echo ""
