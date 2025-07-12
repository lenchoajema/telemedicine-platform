#!/bin/bash

# 📱 MOBILE APP STARTUP - DIRECTORY FIXED
# This script ensures we start from the correct directory

echo "🚀 STARTING MOBILE APP WITH FIXED DIRECTORY PATH"
echo "================================================"

# Force change to the mobile-app directory and stay there
cd /workspaces/telemedicine-platform/mobile-app

# Verify we're in the right place
echo "📁 Current directory: $(pwd)"
echo "📦 Looking for package.json..."

if [ -f "package.json" ]; then
    echo "✅ Found package.json"
    echo "📋 Project name: $(cat package.json | grep '"name"' | head -1 | cut -d'"' -f4)"
else
    echo "❌ package.json not found in current directory"
    echo "📂 Directory contents:"
    ls -la
    exit 1
fi

# Check available scripts
echo "📝 Available npm scripts:"
npm run 2>/dev/null || echo "Could not read scripts"

# Kill any existing processes on port 19006
echo "🔄 Clearing port 19006..."
lsof -ti :19006 | xargs kill -9 2>/dev/null || echo "Port 19006 is free"

# Start the mobile app with explicit directory context
echo "🚀 Starting Expo development server..."
echo "📱 Mobile app will be available at:"
echo "   Local: http://localhost:19006"
echo "   GitHub Codespace: https://stunning-journey-wv5pxxvw49xh565g-19006.app.github.dev/"
echo ""

# Use exec to ensure the process runs in this directory context
exec npx expo start --web --port 19006 --host tunnel
