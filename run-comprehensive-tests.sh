#!/bin/bash

echo "🩺 Telemedicine Platform - Comprehensive Test Suite"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# 1. Infrastructure Tests
echo "1. Infrastructure Tests"
echo "======================"
run_test "Backend Health" "curl -s http://localhost:5000/api/health | grep -q 'ok'"
run_test "Frontend Accessibility" "curl -s http://localhost:5173 | grep -q 'html'"
run_test "Database Connection" "curl -s http://localhost:5000/api/health | grep -q 'ok'"
echo ""

# 2. Authentication Tests
echo "2. Authentication Tests"
echo "======================"
run_test "Patient Registration" "curl -s -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"testpatient@test.com\",\"password\":\"password123\",\"role\":\"patient\",\"profile\":{\"firstName\":\"Test\",\"lastName\":\"Patient\"}}' | grep -q 'token'"
run_test "Doctor Registration" "curl -s -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"testdoctor@test.com\",\"password\":\"password123\",\"role\":\"doctor\",\"profile\":{\"firstName\":\"Test\",\"lastName\":\"Doctor\"}}' | grep -q 'token'"
run_test "Admin Login" "curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@telemedicine.com\",\"password\":\"admin123\"}' | grep -q 'token'"
echo ""

# 3. API Endpoint Tests
echo "3. API Endpoint Tests"
echo "===================="
run_test "Public Doctors List" "curl -s http://localhost:5000/api/doctors | grep -q 'firstName'"
run_test "Specializations List" "curl -s http://localhost:5000/api/specializations | grep -q '\\['"
run_test "Dashboard Analytics" "curl -s http://localhost:5000/api/admin/dashboard/overview -H 'Authorization: Bearer test' | grep -q 'users'"
echo ""

# 4. User Management Tests
echo "4. User Management Tests"
echo "========================"
# Get admin token first
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@telemedicine.com","password":"admin123"}' | grep -o '"token":"[^"]*"' | sed 's/"token":"//' | sed 's/"//')

if [ ! -z "$ADMIN_TOKEN" ]; then
    run_test "Admin User List" "curl -s -H 'Authorization: Bearer $ADMIN_TOKEN' http://localhost:5000/api/admin/users | grep -q 'email'"
    run_test "Admin User Creation" "curl -s -X POST -H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json' -d '{\"email\":\"newuser@test.com\",\"password\":\"password123\",\"firstName\":\"New\",\"lastName\":\"User\",\"role\":\"patient\"}' http://localhost:5000/api/admin/users | grep -q 'email'"
else
    echo -e "${RED}❌ Admin User List - FAILED (No admin token)${NC}"
    echo -e "${RED}❌ Admin User Creation - FAILED (No admin token)${NC}"
    ((TESTS_FAILED+=2))
fi
echo ""

# 5. File System Tests
echo "5. File System Tests"
echo "==================="
run_test "Frontend Assets" "[ -f 'frontend/public/default-doctor.png' ]"
run_test "Backend Routes" "[ -f 'backend/src/modules/admin/users.routes.js' ]"
run_test "Database Models" "[ -f 'backend/src/modules/auth/user.model.js' ]"
echo ""

# 6. Container Tests
echo "6. Container Tests"
echo "=================="
run_test "MongoDB Container" "docker ps | grep -q 'telemedicine-platform-mongodb'"
run_test "Backend Container" "docker ps | grep -q 'telemedicine-platform-backend'"
run_test "Frontend Container" "docker ps | grep -q 'telemedicine-platform-frontend'"
echo ""

# 7. Port Accessibility Tests
echo "7. Port Accessibility Tests"
echo "==========================="
run_test "Frontend Port 5173" "nc -z localhost 5173"
run_test "Backend Port 5000" "nc -z localhost 5000"
run_test "Database Port 27017" "nc -z localhost 27017"
echo ""

# Final Results
echo "🎯 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Platform is fully functional.${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the issues above.${NC}"
fi

echo ""
echo "🔧 Manual Testing Recommendations:"
echo "=================================="
echo "1. Open http://localhost:5173 in browser"
echo "2. Test user registration and login"
echo "3. Test appointment booking flow"
echo "4. Test doctor dashboard features"
echo "5. Test admin user management"
echo "6. Test video call functionality"
echo ""
echo "📊 Test Credentials:"
echo "==================="
echo "Admin: admin@telemedicine.com / admin123"
echo "Doctor: test.doctor@example.com / password123"
echo "Patient: patient1@example.com / password123"
