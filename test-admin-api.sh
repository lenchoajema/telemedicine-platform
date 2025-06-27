#!/bin/bash

echo "Testing Admin User Management API..."

# Step 1: Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@telemedicine.com",
    "password": "admin123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token using a more reliable method
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//' | sed 's/"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Got admin token: ${TOKEN:0:20}..."

# Step 2: Test fetching users
echo ""
echo "2. Testing GET /api/admin/users..."
USERS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Users response: $USERS_RESPONSE"

# Step 3: Test creating a user
echo ""
echo "3. Testing POST /api/admin/users (create user)..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "patient"
  }')

echo "Create user response: $CREATE_RESPONSE"

# Step 4: Test user stats
echo ""
echo "4. Testing GET /api/admin/users/stats..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/admin/users/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Stats response: $STATS_RESPONSE"

echo ""
echo "✅ Admin API testing complete!"
