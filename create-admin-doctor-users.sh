#!/bin/bash

# Create Admin and Doctor Users Script
echo "🔧 Creating Admin and Doctor Users..."

# Admin User Data
ADMIN_EMAIL="admin@telemedicine.com"
ADMIN_PASSWORD="admin123"
ADMIN_FIRST_NAME="Platform"
ADMIN_LAST_NAME="Administrator"

# Doctor User Data
DOCTOR_EMAIL="doctor@telemedicine.com"
DOCTOR_PASSWORD="doctor123"
DOCTOR_FIRST_NAME="Dr. Sarah"
DOCTOR_LAST_NAME="Johnson"
DOCTOR_SPECIALIZATION="General Medicine"
DOCTOR_LICENSE="MD123456789"

echo "📋 Creating users with the following credentials:"
echo "👤 Admin: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo "🩺 Doctor: $DOCTOR_EMAIL / $DOCTOR_PASSWORD"
echo ""

# Function to create user via API
create_user() {
    local email=$1
    local password=$2
    local role=$3
    local firstName=$4
    local lastName=$5
    local specialization=$6
    local license=$7
    
    echo "Creating $role user: $email"
    
    if [ "$role" = "doctor" ]; then
        # Create doctor with additional fields
        RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$email\",
                \"password\": \"$password\",
                \"firstName\": \"$firstName\",
                \"lastName\": \"$lastName\",
                \"role\": \"$role\",
                \"profile\": {
                    \"firstName\": \"$firstName\",
                    \"lastName\": \"$lastName\",
                    \"specialization\": \"$specialization\",
                    \"licenseNumber\": \"$license\",
                    \"phone\": \"+1-555-0123\",
                    \"address\": \"123 Medical Center Dr\",
                    \"bio\": \"Experienced healthcare professional\"
                }
            }")
    else
        # Create admin user
        RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$email\",
                \"password\": \"$password\",
                \"firstName\": \"$firstName\",
                \"lastName\": \"$lastName\",
                \"role\": \"$role\",
                \"profile\": {
                    \"firstName\": \"$firstName\",
                    \"lastName\": \"$lastName\",
                    \"phone\": \"+1-555-0100\"
                }
            }")
    fi
    
    echo "Response: $RESPONSE"
    
    # Check if user was created successfully
    if echo "$RESPONSE" | grep -q "success\|created\|token"; then
        echo "✅ $role user created successfully"
        return 0
    elif echo "$RESPONSE" | grep -q "already exists\|duplicate"; then
        echo "ℹ️ $role user already exists"
        return 0
    else
        echo "❌ Failed to create $role user"
        return 1
    fi
}

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo "✅ Backend is ready"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
    if [ $i -eq 30 ]; then
        echo "❌ Backend not responding after 60 seconds"
        exit 1
    fi
done

echo ""
echo "🔨 Creating users..."

# Create Admin User
create_user "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "admin" "$ADMIN_FIRST_NAME" "$ADMIN_LAST_NAME"
ADMIN_SUCCESS=$?

echo ""

# Create Doctor User
create_user "$DOCTOR_EMAIL" "$DOCTOR_PASSWORD" "doctor" "$DOCTOR_FIRST_NAME" "$DOCTOR_LAST_NAME" "$DOCTOR_SPECIALIZATION" "$DOCTOR_LICENSE"
DOCTOR_SUCCESS=$?

echo ""
echo "================================================"
echo "📊 User Creation Summary"
echo "================================================"

if [ $ADMIN_SUCCESS -eq 0 ]; then
    echo "✅ Admin User: $ADMIN_EMAIL"
    echo "   Password: $ADMIN_PASSWORD"
    echo "   Role: Administrator"
else
    echo "❌ Admin User: Failed to create"
fi

echo ""

if [ $DOCTOR_SUCCESS -eq 0 ]; then
    echo "✅ Doctor User: $DOCTOR_EMAIL"
    echo "   Password: $DOCTOR_PASSWORD"
    echo "   Role: Doctor"
    echo "   Specialization: $DOCTOR_SPECIALIZATION"
else
    echo "❌ Doctor User: Failed to create"
fi

echo ""
echo "================================================"
echo "🧪 Testing Login for Created Users"
echo "================================================"

# Test Admin Login
echo "Testing admin login..."
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$ADMIN_EMAIL\",
        \"password\": \"$ADMIN_PASSWORD\"
    }")

if echo "$ADMIN_LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Admin login successful"
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${ADMIN_TOKEN:0:20}..."
else
    echo "❌ Admin login failed"
    echo "   Response: $ADMIN_LOGIN_RESPONSE"
fi

echo ""

# Test Doctor Login
echo "Testing doctor login..."
DOCTOR_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$DOCTOR_EMAIL\",
        \"password\": \"$DOCTOR_PASSWORD\"
    }")

if echo "$DOCTOR_LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Doctor login successful"
    DOCTOR_TOKEN=$(echo "$DOCTOR_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${DOCTOR_TOKEN:0:20}..."
else
    echo "❌ Doctor login failed"
    echo "   Response: $DOCTOR_LOGIN_RESPONSE"
fi

echo ""
echo "================================================"
echo "📋 Database Verification"
echo "================================================"

echo "Users in database:"
docker exec telemedicine-platform-mongodb-1 mongosh telemedicine --eval "
    db.users.find({}, {email: 1, role: 1, 'profile.firstName': 1, 'profile.lastName': 1, _id: 0}).forEach(
        function(user) {
            print(user.email + ' (' + user.role + ') - ' + user.profile.firstName + ' ' + user.profile.lastName);
        }
    );
" --quiet

echo ""
echo "================================================"
echo "✅ User Creation Complete!"
echo "================================================"
echo ""
echo "🔑 Login Credentials:"
echo ""
echo "👤 ADMIN USER:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo "   Role: Administrator"
echo ""
echo "🩺 DOCTOR USER:"
echo "   Email: $DOCTOR_EMAIL"
echo "   Password: $DOCTOR_PASSWORD"
echo "   Role: Doctor"
echo "   Specialization: $DOCTOR_SPECIALIZATION"
echo ""
echo "🌐 Access the platform at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:5000"
echo ""
echo "💡 You can now log in with either of these accounts!"
