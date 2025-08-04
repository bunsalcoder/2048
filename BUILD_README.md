# 2048 Game - Build & Deployment Guide

## 🎮 Project Overview

This is a modern implementation of the classic 2048 game with enhanced features:
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Game State Persistence**: Saves progress and game over state
- **Statistics Tracking**: View current score, best score, and total moves
- **Modern UI**: Clean, intuitive interface with smooth animations
- **API Integration**: Ready for backend integration

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation
```bash
# Clone or download the project
cd 2048

# Install dependencies
npm install
```

### Development
```bash
# Start development server
npm run dev

# The game will be available at http://localhost:3000
```

## 🏗️ Building for Production

### Option 1: Automated Build Script (Recommended)
```bash
# Run the automated build script
./build.sh
```

This script will:
- ✅ Check prerequisites (Node.js, npm)
- ✅ Clean previous builds
- ✅ Install dependencies
- ✅ Prepare static assets
- ✅ Build the project
- ✅ Verify build output
- ✅ Test the build locally
- ✅ Display build statistics

### Option 2: Manual Build Process
```bash
# 1. Install dependencies
npm install

# 2. Prepare public folder
mkdir -p public
cp favicon.ico public/ 2>/dev/null || echo "favicon.ico not found"
cp -r meta public/ 2>/dev/null || echo "meta folder not found"
cp -r js public/

# 3. Build the project
npm run build

# 4. Test the build
npm run preview
```

## 📁 Build Output Structure

After building, the `dist/` folder will contain:

```
dist/
├── index.html                    # Main HTML file
├── favicon.ico                   # Favicon
├── meta/                         # Apple touch icons
│   ├── apple-touch-icon.png
│   ├── apple-touch-startup-image-640x920.png
│   └── apple-touch-startup-image-640x1096.png
├── js/                           # All JavaScript files
│   ├── animframe_polyfill.js
│   ├── api.js
│   ├── application.js
│   ├── bind_polyfill.js
│   ├── classlist_polyfill.js
│   ├── game_manager.js
│   ├── grid.js
│   ├── html_actuator.js
│   ├── keyboard_input_manager.js
│   ├── local_storage_manager.js
│   └── tile.js
└── assets/                       # Compiled assets
    ├── index-CVvCO-hi.css       # Compiled CSS
    ├── main-BgXsBxou.js         # Vite bundle
    └── [font files and images]
```

## 🌐 Deployment Options

### 1. Static Hosting (Netlify, Vercel, GitHub Pages)
Simply upload the contents of the `dist/` folder to your hosting provider.

### 2. Traditional Web Server (Apache, Nginx)
```bash
# Copy files to web server
cp -r dist/* /var/www/html/

# Ensure proper permissions
chmod -R 755 /var/www/html/
```

### 3. Docker Deployment
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4. CDN Deployment
Upload the `dist/` contents to your CDN provider (AWS CloudFront, Cloudflare, etc.)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=https://your-api-url.com/api
VITE_MOS_APP_KEY=your_mos_app_key_here
VITE_ENV=production
```

### Vite Configuration
The build process uses Vite with the following configuration:
- **Output Directory**: `dist/`
- **Assets Directory**: `assets/`
- **Source Maps**: Enabled for debugging
- **Public Directory**: `public/` (static files)

## 📊 Build Statistics

Typical build output:
- **Total Size**: ~500KB
- **JavaScript Files**: 11 files (~40KB total)
- **CSS**: ~24KB (compiled from SCSS)
- **Images**: ~120KB (fonts, icons, favicon)
- **HTML**: ~11KB

## 🧪 Testing

### Local Testing
```bash
# Start preview server
npm run preview

# Open http://localhost:4173 in your browser
```

### Build Verification
The build script automatically verifies:
- ✅ All essential files are present
- ✅ JavaScript files are accessible
- ✅ Server responds correctly
- ✅ No 404 errors for assets

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check Node.js version
node --version  # Should be 14+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**JavaScript Files Missing**
```bash
# Ensure js folder exists
ls -la js/

# Rebuild with clean state
rm -rf dist public/js
./build.sh
```

**Server Not Responding**
```bash
# Check if port is in use
lsof -i :4173

# Kill existing process
pkill -f "vite preview"
```

### Performance Optimization
The build process automatically:
- ✅ Minifies CSS and JavaScript
- ✅ Optimizes images
- ✅ Generates hashed filenames for cache busting
- ✅ Creates source maps for debugging

## 📝 Recent Changes

### UI Improvements
- Moved statistics button to header next to restart button
- Removed footer buttons (new game, settings, leaderboard)
- Enhanced responsive design for mobile devices

### Game Logic Fixes
- Fixed game over state persistence when page is closed and reopened
- Improved game state management
- Enhanced API integration for game progress saving

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build: `./build.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Building! 🎮✨** 