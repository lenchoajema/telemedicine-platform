#!/bin/bash

# 📱 MOBILE APP COMPREHENSIVE TESTING SCRIPT
# Telemedicine Platform - Mobile Focus Mode

echo "🎯 MOBILE APP TESTING SUITE"
echo "=========================="
echo "Date: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service status
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null; then
        echo -e "${GREEN}✅ $name - RUNNING${NC}"
        return 0
    else
        echo -e "${RED}❌ $name - NOT RUNNING${NC}"
        return 1
    fi
}

# Function to test mobile app endpoints
test_mobile_endpoints() {
    echo -e "${BLUE}🔍 Testing Mobile App Endpoints...${NC}"
    
    # Test authentication endpoint
    echo "Testing /api/auth/login..."
    curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpass"}' | jq '.'
    
    # Test doctors endpoint
    echo "Testing /api/doctors..."
    curl -s http://localhost:5000/api/doctors | jq '.[0:3]'
    
    # Test appointments endpoint  
    echo "Testing /api/appointments..."
    curl -s http://localhost:5000/api/appointments | jq '.[0:2]'
}

# Function to analyze mobile app structure
analyze_mobile_structure() {
    echo -e "${BLUE}📱 Analyzing Mobile App Structure...${NC}"
    
    echo "Core Screens:"
    find mobile-app/src/screens -name "*.tsx" | head -10
    
    echo -e "\nComponents:"
    find mobile-app/src/components -name "*.tsx" | head -10
    
    echo -e "\nServices:"
    find mobile-app/src/services -name "*.ts" | head -5
}

# Function to check mobile app dependencies
check_mobile_dependencies() {
    echo -e "${BLUE}📦 Checking Mobile Dependencies...${NC}"
    
    cd mobile-app
    
    echo "React Native version:"
    npm list react-native --depth=0 2>/dev/null || echo "Not found"
    
    echo "Expo version:"
    npm list expo --depth=0 2>/dev/null || echo "Not found"
    
    echo "Navigation libraries:"
    npm list @react-navigation/native --depth=0 2>/dev/null || echo "Not found"
    
    cd ..
}

# Function to generate mobile testing report
generate_mobile_report() {
    echo -e "${BLUE}📊 Generating Mobile Testing Report...${NC}"
    
    cat > MOBILE-TESTING-REPORT.md << EOF
# 📱 MOBILE APP TESTING REPORT

**Date**: $(date)  
**Platform**: React Native + Expo  
**Status**: Testing Phase  

## 🔍 Test Results

### Backend Services
$(check_service "http://localhost:5000/api/health" "Backend API" && echo "✅ Backend Ready" || echo "❌ Backend Issue")
$(check_service "http://localhost:27017" "MongoDB" && echo "✅ Database Ready" || echo "❌ Database Issue")

### Mobile App Status
$(check_service "http://localhost:19006" "Mobile App" && echo "✅ Mobile App Running" || echo "❌ Mobile App Issue")

### Key Features to Test
- [ ] Authentication (Login/Register)
- [ ] Dashboard Navigation
- [ ] Doctor Discovery
- [ ] Appointment Booking
- [ ] Profile Management
- [ ] Video Call Interface
- [ ] Medical Records
- [ ] Real Device Testing

### Mobile-Specific Tests
- [ ] Touch Interactions
- [ ] Responsive Design
- [ ] Performance on Mobile
- [ ] Offline Functionality
- [ ] Push Notifications
- [ ] Camera Integration

## 🎯 Next Steps
1. **Open Mobile App**: http://localhost:19006
2. **Test Core Features**: Authentication → Dashboard → Appointments
3. **Real Device Testing**: Use Expo Go app
4. **Performance Optimization**: Bundle size and speed
5. **Mobile UX Enhancement**: Gestures and animations

---
Generated: $(date)
EOF

    echo "Report saved to: MOBILE-TESTING-REPORT.md"
}

# Main execution
echo -e "${YELLOW}🚀 Starting Mobile App Testing Suite...${NC}"
echo ""

# Check backend services
echo -e "${BLUE}🔧 Checking Backend Services...${NC}"
check_service "http://localhost:5000/api/health" "Backend API"
check_service "http://localhost:27017" "MongoDB" 

echo ""

# Check mobile app
echo -e "${BLUE}📱 Checking Mobile App...${NC}"
check_service "http://localhost:19006" "Mobile App (Web)"

echo ""

# Analyze structure
analyze_mobile_structure

echo ""

# Check dependencies
check_mobile_dependencies

echo ""

# Test endpoints
test_mobile_endpoints

echo ""

# Generate report
generate_mobile_report

echo ""
echo -e "${GREEN}🎉 Mobile Testing Suite Complete!${NC}"
echo -e "${YELLOW}📋 Check MOBILE-TESTING-REPORT.md for detailed results${NC}"
echo -e "${BLUE}🌐 Open http://localhost:19006 to test your mobile app${NC}"
echo ""
