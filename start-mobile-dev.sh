#!/bin/bash

# 📱 MOBILE APP QUICK START SCRIPT
# Telemedicine Platform - Mobile Focus Mode

echo "🚀 STARTING MOBILE DEVELOPMENT ENVIRONMENT"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if service is running
check_service() {
    local port=$1
    local name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name (Port $port) - Already Running${NC}"
        return 0
    else
        echo -e "${YELLOW}⏳ $name (Port $port) - Starting...${NC}"
        return 1
    fi
}

# Step 1: Start Backend Services
echo -e "${BLUE}🔧 Starting Backend Services...${NC}"

if ! check_service 27017 "MongoDB"; then
    echo "Starting MongoDB..."
    docker-compose up -d mongodb &
fi

if ! check_service 5000 "Backend API"; then
    echo "Starting Backend API..."
    docker-compose up -d backend &
fi

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend services...${NC}"
sleep 5

# Check backend health
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API not responding${NC}"
fi

echo ""

# Step 2: Start Mobile App
echo -e "${BLUE}📱 Starting Mobile App...${NC}"

cd mobile-app

# Kill any existing Expo processes
pkill -f expo > /dev/null 2>&1
pkill -f metro > /dev/null 2>&1

# Check if mobile app is already running
if ! check_service 19006 "Mobile App"; then
    echo -e "${YELLOW}🚀 Starting Expo development server...${NC}"
    
    # Start Expo in web mode
    npx expo start --web --port 19006 &
    EXPO_PID=$!
    
    # Wait for startup
    echo -e "${YELLOW}⏳ Waiting for mobile app to start...${NC}"
    sleep 10
    
    # Check if it's running
    if curl -s http://localhost:19006 > /dev/null; then
        echo -e "${GREEN}✅ Mobile App is running at http://localhost:19006${NC}"
    else
        echo -e "${RED}❌ Mobile App failed to start${NC}"
        echo "Check the terminal output for errors"
    fi
else
    echo -e "${GREEN}✅ Mobile App is already running${NC}"
fi

cd ..

echo ""

# Step 3: Service Status Summary
echo -e "${BLUE}📊 Service Status Summary${NC}"
echo "=========================="

check_service 27017 "MongoDB" && echo "" || echo -e "${RED}❌ MongoDB not running${NC}"
check_service 5000 "Backend API" && echo "" || echo -e "${RED}❌ Backend API not running${NC}" 
check_service 19006 "Mobile App" && echo "" || echo -e "${RED}❌ Mobile App not running${NC}"

echo ""

# Step 4: Next Steps
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "=============="
echo -e "1. 🌐 Open Mobile App: ${YELLOW}http://localhost:19006${NC}"
echo -e "2. 📱 Test on Device: Run ${YELLOW}'npx expo start'${NC} in mobile-app/ for QR code"
echo -e "3. 🔍 Run Tests: ${YELLOW}'./test-mobile-comprehensive.sh'${NC}"
echo -e "4. 📋 View Roadmap: ${YELLOW}'MOBILE-ENHANCEMENT-ROADMAP.md'${NC}"

echo ""
echo -e "${GREEN}🎉 Mobile Development Environment Ready!${NC}"
echo -e "${BLUE}📱 Focus Mode: Mobile App Optimization${NC}"

# Open browser automatically (if running in codespace/devcontainer)
if [ -n "$CODESPACE_NAME" ] || [ -n "$DEVCONTAINER" ]; then
    echo ""
    echo -e "${YELLOW}🌐 Opening mobile app in browser...${NC}"
    # The environment should automatically handle this
fi

echo ""
echo "Created: $(date)"
