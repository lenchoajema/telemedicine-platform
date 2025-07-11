#!/bin/bash

# 📱 MOBILE APP FOR PHONE INSTALLATION
# GitHub Codespace Mobile App Setup

echo "📱 SETTING UP MOBILE APP FOR PHONE INSTALLATION"
echo "=============================================="
echo "Codespace URL: https://stunning-journey-wv5pxxvw49xh565g.github.dev"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Navigate to mobile app directory
cd /workspaces/telemedicine-platform/mobile-app

echo -e "${BLUE}📁 Current directory: $(pwd)${NC}"

# Kill any existing Expo processes
echo -e "${YELLOW}🔄 Stopping any existing Expo processes...${NC}"
pkill -f expo > /dev/null 2>&1
pkill -f metro > /dev/null 2>&1

# Wait a moment
sleep 2

# Check backend connectivity to Codespace
echo -e "${BLUE}🔍 Testing backend connectivity...${NC}"
BACKEND_URL="https://stunning-journey-wv5pxxvw49xh565g.github.dev/api/health"

if curl -s "$BACKEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Backend is accessible via Codespace URL${NC}"
else
    echo -e "${RED}❌ Backend not accessible. Make sure backend is running${NC}"
    echo "Trying to start backend..."
    cd /workspaces/telemedicine-platform
    docker-compose up -d backend
    sleep 5
    cd mobile-app
fi

# Show current mobile app configuration
echo -e "\n${BLUE}📱 Mobile App Configuration:${NC}"
echo "API URL: https://stunning-journey-wv5pxxvw49xh565g.github.dev/api"
echo "Socket URL: https://stunning-journey-wv5pxxvw49xh565g.github.dev"

# Start Expo for phone installation
echo -e "\n${PURPLE}🚀 Starting Expo for Phone Installation...${NC}"
echo -e "${YELLOW}📲 This will generate a QR code for your phone${NC}"
echo ""

# Start Expo development server with tunnel for external access
echo -e "${GREEN}Starting Expo with public access...${NC}"
npx expo start --tunnel &
EXPO_PID=$!

echo ""
echo -e "${GREEN}✅ Expo development server started!${NC}"
echo -e "${BLUE}📱 TO INSTALL ON YOUR PHONE:${NC}"
echo ""
echo -e "${YELLOW}1. Download 'Expo Go' app from:${NC}"
echo "   📱 iOS: App Store"
echo "   🤖 Android: Google Play Store"
echo ""
echo -e "${YELLOW}2. Scan the QR code that appears above${NC}"
echo ""
echo -e "${YELLOW}3. The app will install and run on your phone!${NC}"
echo ""
echo -e "${PURPLE}📋 App Features Available:${NC}"
echo "   🔐 Authentication (Login/Register)"
echo "   🏠 Dashboard"
echo "   👨‍⚕️ Doctor Discovery"
echo "   📅 Appointments"
echo "   👤 Profile Management"
echo "   📹 Video Calls"
echo "   📋 Medical Records"
echo ""
echo -e "${BLUE}🌐 Backend API: https://stunning-journey-wv5pxxvw49xh565g.github.dev/api${NC}"
echo ""
echo -e "${GREEN}🎉 Your mobile app is ready for phone installation!${NC}"
echo ""
echo "Process ID: $EXPO_PID"
echo "To stop: kill $EXPO_PID or press Ctrl+C"
echo ""

# Keep the script running to show the QR code
wait $EXPO_PID
