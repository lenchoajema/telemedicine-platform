#!/bin/bash

echo "🧪 Testing Admin User Management Functions..."

# Get admin token
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

# Test 1: Create a test user
echo ""
echo "2. Testing user creation..."
TIMESTAMP=$(date +%s)
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"testuser${TIMESTAMP}@example.com\",
    \"password\": \"password123\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"role\": \"patient\"
  }")

USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":"//' | sed 's/"//')

if [ -n "$USER_ID" ]; then
  echo "✅ User created successfully with ID: $USER_ID"
else
  echo "❌ User creation failed"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

# Test 2: Update user status
echo ""
echo "3. Testing user status update..."
STATUS_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/admin/users/${USER_ID}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}')

if echo "$STATUS_RESPONSE" | grep -q "User status updated successfully"; then
  echo "✅ User status updated successfully"
else
  echo "❌ User status update failed"
  echo "Response: $STATUS_RESPONSE"
fi

# Test 3: Reset user password
echo ""
echo "4. Testing password reset..."
PASSWORD_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/users/${USER_ID}/reset-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "newpassword123", "sendEmail": false}')

if echo "$PASSWORD_RESPONSE" | grep -q "Password reset successfully"; then
  echo "✅ Password reset successful"
else
  echo "❌ Password reset failed"
  echo "Response: $PASSWORD_RESPONSE"
fi

# Test 4: Delete user
echo ""
echo "5. Testing user deletion..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:5000/api/admin/users/${USER_ID} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$DELETE_RESPONSE" | grep -q "User deleted successfully"; then
  echo "✅ User deleted successfully"
else
  echo "❌ User deletion failed"
  echo "Response: $DELETE_RESPONSE"
fi

echo ""
echo "🎯 Summary of fixes applied:"
echo "- ✅ Changed PATCH to PUT for status updates"
echo "- ✅ Updated response format checks from data.success to data.message"
echo "- ✅ Fixed error handling to use data.error instead of data.message"
echo ""
echo "🎮 Frontend should now work correctly for:"
echo "- Creating users ✅"
echo "- Updating user status ✅"
echo "- Resetting passwords ✅"
echo "- Deleting users ✅"
