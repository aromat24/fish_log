# 🐟 Fish Log PWA - Ghoti Hooked

A Progressive Web App for logging fishing catches with offline capabilities, location tracking, and comprehensive species data.

## ✨ Features

- **📱 Progressive Web App** - Install on mobile devices, works offline
- **🌍 Location Tracking** - GPS coordinates for fishing spots
- **🐠 Species Database** - Comprehensive fish species with length-to-weight calculations
- **🌙 Day/Night Theme** - Toggle between light and dark modes
- **💾 Data Export/Import** - Backup and restore your fishing logs
- **📊 Advanced Analytics** - Track your fishing success over time
- **📷 Photo Support** - Add photos to your fishing logs
- **🔒 Privacy First** - All data stored locally on your device

## 🚀 Quick Start

### Using Dev Container (Recommended)

1. **Prerequisites**:
   - Docker Desktop installed and running
   - VS Code with Dev Containers extension

2. **Open in Container**:
   ```bash
   # In VS Code
   Ctrl+Shift+P → "Dev Containers: Reopen in Container"
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```

4. **Open App**: Navigate to `http://localhost:8080`

### Manual Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd fish_log
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Project Structure
```
fish_log/
├── .devcontainer/          # Dev container configuration
├── css/                    # Stylesheets (including theme system)
├── js/                     # JavaScript modules
├── Fish App DB Files/      # Database and species data
├── index.html             # Main application file
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker for offline functionality
└── package.json           # Dependencies and scripts
```

### Key Files
- **`index.html`** - Main application with embedded JavaScript
- **`css/beautiful-buttons.css`** - Theme system and UI components
- **`sw.js`** - Service worker for offline functionality
- **`manifest.json`** - PWA configuration
- **`Fish App DB Files/`** - Species database and algorithms

### Available Scripts
```bash
npm run dev     # Start development server
npm start       # Same as dev
npm run serve   # Same as dev
```

## 🎨 Recent Improvements

### Theme System Fix ✅
- **Fixed Day/Night Toggle**: Button now responds reliably on first click
- **Proper Color Schemes**: Day mode uses bright colors, night mode uses dark colors
- **Improved JavaScript**: Cleaned up event listeners and theme switching logic
- **Enhanced CSS**: Added explicit day theme selector for consistent styling

### Technical Details
- Removed conflicting event listeners
- Added proper theme attribute handling (`data-theme="day"` vs `data-theme="night"`)
- Implemented reliable button state management
- Enhanced debugging and error handling

## 🌟 PWA Features

### Offline Functionality
- Service worker caches essential resources
- IndexedDB for local data storage
- Works without internet connection

### Mobile Optimization
- Responsive design for all screen sizes
- Touch-friendly interface
- iOS and Android PWA support

### Performance
- Fast loading with service worker caching
- Optimized images and assets
- Efficient data storage

## 🧪 Testing

### Theme Toggle Testing
1. Click the 🌙/☀️ button in the top-right corner
2. Verify smooth transition between light and dark modes
3. Check that theme preference is saved across sessions

### PWA Testing
1. **Service Worker**: DevTools → Application → Service Workers
2. **Offline Mode**: DevTools → Network → Offline checkbox
3. **Mobile**: DevTools → Device Toolbar

### Database Testing
- Species data loading and searching
- Length-to-weight calculations
- Data export/import functionality

## 📱 Installation

### Mobile Installation
1. Open the app in a mobile browser
2. Look for "Add to Home Screen" prompt
3. Follow browser-specific installation steps

### Desktop Installation
1. Open in Chrome/Edge
2. Look for install icon in address bar
3. Click to install as desktop app

## 🤝 Contributing

1. Fork the repository
2. Open in dev container for consistent environment
3. Make your changes
4. Test thoroughly (especially PWA features)
5. Submit a pull request

### Testing Checklist
- [ ] Theme toggle works correctly
- [ ] App works offline
- [ ] Mobile responsive design
- [ ] Data export/import functions
- [ ] Location services work
- [ ] Service worker registers correctly

## 📄 License

MIT License - see LICENSE file for details

## 🐛 Known Issues

None currently! The theme toggle issue has been resolved.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section in `.devcontainer/README.md`
2. Review browser console for errors
3. Verify PWA features in DevTools

---

**Happy Fishing! 🎣**
