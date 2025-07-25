# 2048 Game with MOS SDK Integration

A 2048 game with MOS SDK authentication integration.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with your configuration:

```env
MOS_APP_KEY=your_actual_app_key
API_BASE_URL=https://your-api-endpoint.com/api
LOGIN_ENDPOINT=/login/miniAppLogin
```

### 3. Development
```bash
npm run dev
```

This will start the development server at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

This will create a `dist` folder with the production build.

### 5. Preview Production Build
```bash
npm run preview
```

## Features

- **MOS SDK Integration**: Automatic login when page loads
- **Environment Variables**: Configurable via .env file
- **Vite Build Tool**: Fast development and optimized builds
- **Axios**: HTTP client for API requests

## Project Structure

```
├── index.html          # Main HTML file
├── js/                 # JavaScript files
│   ├── api.js         # MOS SDK integration
│   ├── application.js # Main application
│   └── ...           # Other game files
├── style/             # CSS/SCSS files
├── package.json       # Dependencies and scripts
├── vite.config.js     # Vite configuration
└── .env              # Environment variables (create this)
```

## MOS SDK Integration

The game automatically calls `mos.login()` when the page loads:

1. **Page Load** → `DOMContentLoaded` event fires
2. **MOS Login** → `mos.login(MOS_APP_KEY)` is called
3. **Get Code** → MOS SDK returns a code
4. **Backend Call** → Code is sent to your API endpoint
5. **Save Token** → Token is saved to localStorage

## Configuration

Update the following environment variables in your `.env` file:

- `MOS_APP_KEY`: Your MOS app key
- `API_BASE_URL`: Your API base URL
- `LOGIN_ENDPOINT`: Your login endpoint path
