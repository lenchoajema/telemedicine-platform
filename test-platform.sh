#!/bin/bash

# Simple script to test the telemedicine platform

echo "Starting telemedicine platform services..."

# Start with Docker Compose
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if containers are running
echo "Checking container status..."
docker-compose ps

# Check backend logs
echo "Backend logs:"
docker-compose logs backend | tail -20

# Check if MongoDB is accessible
echo "Testing MongoDB connection..."
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')" --quiet

# Test backend health
echo "Testing backend health..."
curl -s http://localhost:5000/api/health | jq . || echo "Health check failed"

# Test registration
echo "Testing user registration..."
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "patient",
    "profile": {
      "firstName": "Test",
      "lastName": "User"
    }
  }' | jq . || echo "Registration failed"

# Test login
echo "Testing user login..."
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq . || echo "Login failed"

echo "Test completed!"
