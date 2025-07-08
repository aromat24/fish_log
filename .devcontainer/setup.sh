#!/bin/bash

# Fish Log PWA Development Setup Script

echo "🐟 Fish Log PWA Development Environment"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the Fish Log project directory."
    exit 1
fi

echo "✅ Found Fish Log project files"

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "⚠️  No package.json found, skipping npm install"
fi

echo ""
echo "🚀 Available commands:"
echo "  npm run dev    - Start development server on port 8080"
echo "  npm run serve  - Same as dev (alias)"
echo "  npm start      - Same as dev (alias)"
echo ""
echo "🌐 Development URLs (once server is running):"
echo "  Local:    http://localhost:8080"
echo "  Network:  http://0.0.0.0:8080"
echo ""
echo "📱 PWA Features:"
echo "  - Service Worker: /sw.js"
echo "  - Manifest: /manifest.json"
echo "  - Theme Toggle: Day/Night mode"
echo "  - Offline Capable: Yes"
echo ""
echo "🔧 Development Tips:"
echo "  - Use the browser's Developer Tools to test PWA features"
echo "  - Test offline functionality by going offline in DevTools"
echo "  - Use 'Application' tab in DevTools to inspect Service Worker"
echo "  - Test theme toggle button for day/night mode switching"
echo ""
echo "Ready to start development! Run 'npm run dev' to begin."
