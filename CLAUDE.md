# Fish Log PWA - Claude Code Context

## Project Overview
A Progressive Web App for logging fishing catches with offline capabilities, location tracking, and comprehensive species data. Built with vanilla HTML/CSS/JavaScript focusing on PWA features and mobile optimization.

## Quick Commands
```bash
# Development server
npm run dev

# Test the application
npm start

# No build process needed (static PWA)
npm run build
```

## Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript PWA
- **Database**: IndexedDB for local storage + fish species database files
- **Deployment**: Static files served via live-server
- **Offline**: Service worker with caching strategy

## Key Files
- `index.html` - Main application with embedded JavaScript
- `sw.js` - Service worker for offline functionality
- `manifest.json` - PWA configuration
- `css/beautiful-buttons.css` - Theme system and UI components
- `js/` - JavaScript modules (error handling, database, algorithms)
- `Fish App DB Files/` - Species database and weight calculation algorithms

## Recent Features
- ✅ Fixed day/night theme toggle functionality
- ✅ Advanced JavaScript patterns and error handling
- ✅ Self-improving weight calculation algorithms
- ✅ Comprehensive fish species database
- ✅ PWA offline capabilities

## Development Setup
The project uses a dev container with Node.js 18. The main development command is `npm run dev` which starts live-server on port 8080.

## Testing
- Theme toggle testing in browser
- PWA functionality testing (offline mode, installation)
- Database operations testing
- Mobile responsiveness testing

## Known Working Features
- Day/night theme toggle
- Fish species database with 100+ species
- Weight estimation algorithms
- Photo capture and storage
- GPS location tracking
- Data export/import
- Offline functionality

## Tech Stack
- HTML5/CSS3/JavaScript (ES6+)
- IndexedDB for data storage
- Service Worker for PWA features
- Live-server for development
- No build tools or frameworks

## Current Status
The application is fully functional with recent improvements to theme handling and advanced JavaScript patterns. The dev container setup needs investigation for potential startup issues.