#!/bin/bash

# 📱 MOBILE APP STARTUP SCRIPT - FIXED
# Properly start the mobile app with all dependencies

echo "🚀 STARTING MOBILE APP (DEPENDENCY FIXED)"
echo "========================================="

# Navigate to mobile app directory
cd /workspaces/telemedicine-platform/mobile-app

echo "📁 Current directory: $(pwd)"
echo "📦 Checking package.json..."

if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "📋 Project name: $(cat package.json | grep '"name"' | cut -d'"' -f4)"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Check if Expo is installed
if [ -d "node_modules/expo" ]; then
    echo "✅ Expo is installed"
else
    echo "❌ Expo not found, installing..."
    npm install expo --legacy-peer-deps
fi

# Check webpack dependencies
echo "🔧 Checking webpack dependencies..."
if [ -d "node_modules/stream-browserify" ]; then
    echo "✅ stream-browserify installed"
else
    echo "❌ Missing webpack dependencies"
    exit 1
fi

# Kill any existing processes on port 19006
echo "🔄 Clearing port 19006..."
lsof -ti :19006 | xargs kill -9 2>/dev/null || echo "Port 19006 is free"

# Start Expo development server
echo "🚀 Starting Expo development server on port 19006..."
echo "📱 Mobile app will be available at: http://localhost:19006"
echo ""

# Start in background and show output
npx expo start --web --port 19006 --non-interactive &
EXPO_PID=$!

echo "⏳ Waiting for server to start..."
sleep 8

# Check if it's running
if curl -s http://localhost:19006 > /dev/null 2>&1; then
    echo "✅ Mobile app is running successfully!"
    echo "🌐 Open: http://localhost:19006"
else
    echo "❌ Mobile app failed to start"
    echo "📋 Check the process output above for errors"
fi

echo ""
echo "📱 Mobile app process ID: $EXPO_PID"
echo "🛑 To stop: kill $EXPO_PID"
echo ""
