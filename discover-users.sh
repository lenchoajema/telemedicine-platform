#!/bin/bash

echo "🔍 Telemedicine Platform - User Discovery"
echo "======================================="

# Check if containers are running
echo "📋 Checking container status..."
docker-compose ps

echo ""
echo "🔌 Checking MongoDB connection..."
# Try to connect to MongoDB directly
docker-compose exec mongodb mongosh --eval "
  db = db.getSiblingDB('telemedicine');
  console.log('Connected to database:', db.getName());
  console.log('Collections:', db.getCollectionNames());
  if (db.users) {
    console.log('Users collection exists');
    const userCount = db.users.countDocuments();
    console.log('User count:', userCount);
    if (userCount > 0) {
      const users = db.users.find({}, {password: 0}).toArray();
      console.log('Users:');
      users.forEach(user => {
        console.log(\`- \${user.email} (\${user.role})\`);
      });
    } else {
      console.log('No users found in database');
    }
  } else {
    console.log('No users collection found');
  }
"

echo ""
echo "🌐 Testing API endpoints..."
curl -s http://localhost:5000/api/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/health

echo ""
echo "👨‍⚕️ Checking doctors endpoint..."
curl -s http://localhost:5000/api/doctors | jq . 2>/dev/null || curl -s http://localhost:5000/api/doctors

echo ""
echo "✅ User discovery completed!"
