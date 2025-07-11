#!/bin/bash

echo "🚀 Starting Telemedicine Mobile App..."
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run from mobile-app directory"
    exit 1
fi

# Check if backend is running
echo "🔍 Checking backend connection..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:5000"
else
    echo "⚠️  Backend not detected at http://localhost:5000"
    echo "   Make sure your backend is running with: docker-compose up"
fi

echo ""
echo "📱 Starting mobile app in web mode..."
echo "   This will open the app in your browser for testing"
echo ""

# Start the app
npm run web
