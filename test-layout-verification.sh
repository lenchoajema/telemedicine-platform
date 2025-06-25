#!/bin/bash

echo "=== Layout Verification Test ==="
echo "Checking if layout components exist and are properly configured..."

# Check if Layout.css exists and has the correct margin styles
if [ -f "frontend/src/components/layout/Layout.css" ]; then
    echo "✅ Layout.css exists"
    
    # Check for desktop margin rule
    if grep -q "margin-left: 16rem" frontend/src/components/layout/Layout.css; then
        echo "✅ Desktop margin rule found in Layout.css"
    else
        echo "❌ Desktop margin rule missing in Layout.css"
    fi
    
    # Check for media query
    if grep -q "@media (min-width: 1024px)" frontend/src/components/layout/Layout.css; then
        echo "✅ Desktop media query found in Layout.css"
    else
        echo "❌ Desktop media query missing in Layout.css"
    fi
else
    echo "❌ Layout.css does not exist"
fi

# Check if Sidebar.css has correct positioning
if [ -f "frontend/src/components/layout/Sidebar.css" ]; then
    echo "✅ Sidebar.css exists"
    
    # Check for fixed positioning
    if grep -q "position: fixed" frontend/src/components/layout/Sidebar.css; then
        echo "✅ Fixed positioning found in Sidebar.css"
    else
        echo "❌ Fixed positioning missing in Sidebar.css"
    fi
    
    # Check for desktop rules
    if grep -q "top: 4rem" frontend/src/components/layout/Sidebar.css; then
        echo "✅ Desktop positioning rule found in Sidebar.css"
    else
        echo "❌ Desktop positioning rule missing in Sidebar.css"
    fi
else
    echo "❌ Sidebar.css does not exist"
fi

# Check if Layout.jsx has the correct class names
if [ -f "frontend/src/components/layout/Layout.jsx" ]; then
    echo "✅ Layout.jsx exists"
    
    # Check for conditional class application
    if grep -q "with-sidebar" frontend/src/components/layout/Layout.jsx; then
        echo "✅ Conditional sidebar class found in Layout.jsx"
    else
        echo "❌ Conditional sidebar class missing in Layout.jsx"
    fi
else
    echo "❌ Layout.jsx does not exist"
fi

echo ""
echo "=== Frontend Status Check ==="
echo "Checking frontend accessibility..."

# Check if frontend is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
    echo "✅ Frontend is accessible at http://localhost:5173"
else
    echo "❌ Frontend is not accessible"
fi

echo ""
echo "=== Docker Status Check ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Layout verification complete!"
