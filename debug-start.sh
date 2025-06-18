#!/bin/bash

echo "🚀 Starting Telemedicine Platform Debug Session"
echo "=============================================="

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    echo -n "Checking $service on port $port... "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port > /dev/null 2>&1; then
        echo "✅ Running"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local description=$2
    echo -n "Testing $description... "
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
            echo "✅ OK ($http_code)"
            echo "   Response: $body"
        else
            echo "⚠️  Status: $http_code"
            echo "   Response: $body"
        fi
    else
        echo "❌ Failed to connect"
    fi
}

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true

# Start MongoDB first
echo "🍃 Starting MongoDB..."
docker-compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo "✅ MongoDB is ready"
else
    echo "❌ MongoDB failed to start"
    exit 1
fi

# Start backend
echo "🔧 Starting backend..."
docker-compose up -d backend

# Wait for backend
echo "⏳ Waiting for backend to start..."
sleep 10

# Check backend logs
echo "📝 Backend logs (last 10 lines):"
docker-compose logs --tail=10 backend

# Test backend endpoints
echo "🧪 Testing backend endpoints..."
test_endpoint "http://localhost:5000/api/health" "Health check"

# Try to create a test user
echo "👤 Creating test user..."
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "debug@test.com",
    "password": "password123",
    "role": "patient",
    "profile": {
      "firstName": "Debug",
      "lastName": "User"
    }
  }' > /tmp/register_response.json

if [ $? -eq 0 ]; then
    echo "✅ Registration request sent"
    echo "Response: $(cat /tmp/register_response.json)"
else
    echo "❌ Registration request failed"
fi

# Try to login
echo "🔐 Testing login..."
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "debug@test.com",
    "password": "password123"
  }' > /tmp/login_response.json

if [ $? -eq 0 ]; then
    echo "✅ Login request sent"
    echo "Response: $(cat /tmp/login_response.json)"
else
    echo "❌ Login request failed"
fi

# Start frontend
echo "🎨 Starting frontend..."
docker-compose up -d frontend

echo "🎉 Debug session complete!"
echo ""
echo "Services status:"
check_service "MongoDB" "27017"
check_service "Backend" "5000"
check_service "Frontend" "5173"

echo ""
echo "📋 Quick reference:"
echo "- Backend API: http://localhost:5000"
echo "- Frontend: http://localhost:5173"
echo "- Health check: http://localhost:5000/api/health"
echo "- Logs: docker-compose logs <service>"
echo "- Stop all: docker-compose down"

# Clean up temp files
rm -f /tmp/register_response.json /tmp/login_response.json
