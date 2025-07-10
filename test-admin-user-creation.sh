#!/bin/bash

echo "🔐 Testing Admin User Creation"
echo "=============================="

# Step 1: Login as admin and get token
echo "1. Getting admin token..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@telemedicine.com",
    "password": "admin123"
  }' --max-time 10)

echo "Admin login response: $ADMIN_RESPONSE"

# Extract token 
TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//' | sed 's/"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token"
  echo "Checking recent backend logs..."
  docker-compose logs backend --tail 20
  exit 1
fi

echo "✅ Got admin token: ${TOKEN:0:30}..."

# Step 2: Create user via admin endpoint
echo ""
echo "2. Creating user via admin endpoint..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admintest@example.com",
    "password": "testpass123",
    "firstName": "Admin",
    "lastName": "Test",
    "role": "patient"
  }' --max-time 10)

echo "User creation response: $CREATE_RESPONSE"

# Step 3: Try to login with created user
echo ""
echo "3. Testing login with admin-created user..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admintest@example.com",
    "password": "testpass123"
  }' --max-time 10)

echo "Login response: $LOGIN_RESPONSE"

# Check backend logs
echo ""
echo "4. Recent backend logs:"
docker-compose logs backend --tail 25
