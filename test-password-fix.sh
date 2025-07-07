#!/bin/bash

echo "🔐 Testing Password Hashing Fix..."

# Step 1: Get admin token
echo "1. Getting admin token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@telemedicine.com",
    "password": "admin123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//' | sed 's/"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Got admin token"

# Step 2: Create a test user with a known password
echo ""
echo "2. Creating test user with password 'testpass123'..."
TIMESTAMP=$(date +%s)
TEST_EMAIL="passwordtest${TIMESTAMP}@example.com"
TEST_PASSWORD="testpass123"

CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Password\",
    \"lastName\": \"Test\",
    \"role\": \"patient\"
  }")

USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":"//' | sed 's/"//')

if [ -n "$USER_ID" ]; then
  echo "✅ Test user created successfully"
  echo "   Email: $TEST_EMAIL"
  echo "   Password: $TEST_PASSWORD"
  echo "   User ID: $USER_ID"
else
  echo "❌ User creation failed"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

# Step 3: Wait a moment for user to be saved properly
echo ""
echo "3. Waiting for user to be saved..."
sleep 2

# Step 4: Try to login with the created user
echo ""
echo "4. Testing login with created user..."
LOGIN_TEST_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_TEST_RESPONSE" | grep -q "token"; then
  echo "✅ LOGIN SUCCESSFUL! Password hashing is working correctly."
  echo "   User can login with their password"
else
  echo "❌ LOGIN FAILED! Password hashing issue still exists."
  echo "Response: $LOGIN_TEST_RESPONSE"
  
  # Let's check what's in the database
  echo ""
  echo "🔍 Debugging: Checking user in database..."
  docker exec telemedicine-platform-mongodb-1 mongosh telemedicine --eval "db.users.findOne({email: '$TEST_EMAIL'}, {email: 1, password: 1})" --quiet
fi

# Step 5: Clean up - delete test user
echo ""
echo "5. Cleaning up test user..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:5000/api/admin/users/${USER_ID} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$DELETE_RESPONSE" | grep -q "User deleted successfully"; then
  echo "✅ Test user cleaned up"
else
  echo "⚠️  Could not clean up test user (manual cleanup may be needed)"
fi

echo ""
echo "🎯 Password Hashing Test Complete!"
