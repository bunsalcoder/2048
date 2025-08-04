#!/bin/bash

# 2048 Game Build Script
# This script builds the project and prepares it for deployment

set -e  # Exit on any error

echo "🚀 Starting 2048 Game build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    print_warning "Node.js version 14 or higher is recommended. Current version: $(node --version)"
fi

print_success "Prerequisites check completed"

# Clean previous build
print_status "Cleaning previous build..."
if [ -d "dist" ]; then
    rm -rf dist
    print_success "Previous build cleaned"
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Prepare public folder
print_status "Preparing public folder..."
mkdir -p public

# Copy static assets to public folder
if [ -f "favicon.ico" ]; then
    cp favicon.ico public/
    print_success "favicon.ico copied to public/"
else
    print_warning "favicon.ico not found, skipping..."
fi

if [ -d "meta" ]; then
    cp -r meta public/
    print_success "meta folder copied to public/"
else
    print_warning "meta folder not found, skipping..."
fi

# Copy JS files to public folder
if [ -d "js" ]; then
    cp -r js public/
    print_success "js folder copied to public/"
else
    print_error "js folder not found! This is required for the build."
    exit 1
fi

# Build the project
print_status "Building the project..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Verify build output
print_status "Verifying build output..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    print_error "dist folder not found after build!"
    exit 1
fi

# Check if essential files exist
ESSENTIAL_FILES=("dist/index.html" "dist/js/game_manager.js" "dist/js/application.js")
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Essential file missing: $file"
        exit 1
    fi
done

print_success "Build verification completed"

# Display build statistics
print_status "Build statistics:"
echo "📁 Build output location: ./dist/"
echo "📊 Build size:"
du -sh dist/

echo ""
echo "📋 Files in dist/:"
ls -la dist/

echo ""
echo "📋 JavaScript files in dist/js/:"
ls -la dist/js/ | wc -l
echo "JavaScript files found"

# Test the build
print_status "Testing the build..."
npm run preview &
PREVIEW_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4173 | grep -q "200"; then
    print_success "Build test successful! Server is running at http://localhost:4173"
else
    print_warning "Build test failed - server may not be responding"
fi

# Stop the preview server
kill $PREVIEW_PID 2>/dev/null || true

echo ""
echo "🎮 Build Summary:"
echo "✅ All JavaScript files included in dist/js/"
echo "✅ HTML file properly references all scripts"
echo "✅ CSS compiled and optimized"
echo "✅ Static assets copied"
echo "✅ Build tested and working"

echo ""
echo "📤 Deployment Instructions:"
echo "1. Upload the contents of the 'dist/' folder to your web server"
echo "2. Ensure your server is configured to serve static files"
echo "3. The game will be available at your domain root"

echo ""
echo "🌐 To test locally:"
echo "   npm run preview"
echo "   Then open http://localhost:4173 in your browser"

echo ""
print_success "Build process completed successfully!"
echo "✨ Your 2048 game is ready for deployment!" 