#!/bin/bash

# 📱 MOBILE APP STARTUP - OFFLINE MODE
# This script starts the mobile app without requiring Expo login

echo "🚀 STARTING MOBILE APP IN OFFLINE MODE"
echo "====================================="

# Force change to the mobile-app directory and stay there
cd /workspaces/telemedicine-platform/mobile-app

# Verify we're in the right place
echo "📁 Current directory: $(pwd)"

# Kill any existing processes on ports
echo "🔄 Clearing ports..."
lsof -ti :19006 | xargs kill -9 2>/dev/null || echo "Port 19006 is free"
lsof -ti :19007 | xargs kill -9 2>/dev/null || echo "Port 19007 is free"

# Start the mobile app in offline mode without login requirement
echo "🚀 Starting Expo development server in offline mode..."
echo "📱 Mobile app will be available at:"
echo "   GitHub Codespace: https://stunning-journey-wv5pxxvw49xh565g-19007.app.github.dev/"
echo ""

# Use npx expo start with offline flag to avoid login
exec npx expo start --web --port 19007 --offline --clear
