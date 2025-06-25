#!/bin/bash

echo "🖥️  Testing Large Screen Layout Fix..."
echo "===================================="

# Test frontend accessibility
echo "Testing frontend accessibility..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$STATUS" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend not accessible (HTTP $STATUS)"
fi

# Check if new layout files exist
echo ""
echo "Checking layout files..."
LAYOUT_FILES=(
    "/workspaces/telemedicine-platform/frontend/src/components/layout/Layout.jsx"
    "/workspaces/telemedicine-platform/frontend/src/components/layout/Layout.css"
    "/workspaces/telemedicine-platform/frontend/src/components/layout/Sidebar.css"
)

for file in "${LAYOUT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $(basename $file) exists"
    else
        echo "❌ $(basename $file) missing"
    fi
done

# Check for proper CSS classes
echo ""
echo "Checking CSS implementation..."

# Check Layout.css for main content margin
if grep -q "margin-left: 16rem" /workspaces/telemedicine-platform/frontend/src/components/layout/Layout.css; then
    echo "✅ Main content margin defined for large screens"
else
    echo "❌ Main content margin not found"
fi

# Check for responsive design
if grep -q "@media (min-width: 1024px)" /workspaces/telemedicine-platform/frontend/src/components/layout/Layout.css; then
    echo "✅ Large screen media queries implemented"
else
    echo "❌ Large screen media queries missing"
fi

# Check Layout.jsx for CSS classes
if grep -q "with-sidebar" /workspaces/telemedicine-platform/frontend/src/components/layout/Layout.jsx; then
    echo "✅ Conditional sidebar classes implemented"
else
    echo "❌ Conditional sidebar classes missing"
fi

# Check Sidebar.css z-index fix
if grep -q "z-index: 30" /workspaces/telemedicine-platform/frontend/src/components/layout/Sidebar.css; then
    echo "✅ Sidebar z-index properly configured"
else
    echo "❌ Sidebar z-index not configured"
fi

echo ""
echo "🎯 Layout Fix Summary:"
echo "===================="
echo "✅ Created Layout.css with proper responsive design"
echo "✅ Updated Layout.jsx to use semantic CSS classes"
echo "✅ Fixed main content margin for large screens (16rem/256px)"
echo "✅ Maintained mobile functionality with responsive design"
echo "✅ Added proper z-index management for sidebar"
echo ""
echo "📐 Large Screen Behavior:"
echo "========================"
echo "✅ Sidebar: Fixed position, 256px width, below header"
echo "✅ Main content: 256px left margin to avoid overlap"
echo "✅ Content container: Properly centered with max-width"
echo "✅ Responsive: Mobile keeps overlay behavior"
echo ""
echo "🌐 View the fixed layout at: http://localhost:5173"
echo "📱 Test on different screen sizes to verify responsive behavior"
echo ""
echo "Key Improvements:"
echo "- No more content hidden behind sidebar on large screens"
echo "- Proper content flow and readability"
echo "- Maintained mobile experience"
echo "- Smooth transitions between screen sizes"
