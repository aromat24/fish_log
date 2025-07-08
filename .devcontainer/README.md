# Fish Log PWA - Dev Container Setup

This project includes a complete development container configuration for working with the Fish Log Progressive Web App.

## Prerequisites

- **Docker Desktop** installed and running
- **Visual Studio Code** with the **Dev Containers extension** installed
  - Extension ID: `ms-vscode-remote.remote-containers`

## Quick Start

1. **Open in Dev Container**:
   - Open VS Code in the project folder
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Dev Containers: Reopen in Container"
   - Select it and wait for the container to build

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access the App**:
   - Open browser to: `http://localhost:8080`
   - The app will auto-reload when you make changes

## Development Environment Features

### Included Tools
- **Node.js LTS** - JavaScript runtime
- **Python 3** - For data processing scripts
- **Live Server** - Auto-reloading development server
- **SQLite** - For local database development
- **Git** - Version control

### VS Code Extensions
- **Prettier** - Code formatting
- **ESLint** - JavaScript linting
- **Tailwind CSS** - CSS framework support
- **Live Server** - Development server
- **Auto Rename Tag** - HTML tag editing
- **Path Intellisense** - File path autocomplete

### Available Ports
- **8080** - Main development server (Fish Log PWA)
- **3000** - Alternative development port
- **5000** - Additional port for services

## Project Structure

```
fish_log/
├── .devcontainer/          # Dev container configuration
│   ├── devcontainer.json   # Container settings
│   ├── Dockerfile          # Container image definition
│   └── setup.sh           # Setup script
├── css/                    # Stylesheets
├── js/                     # JavaScript files
├── Fish App DB Files/      # Database and data files
├── index.html             # Main PWA file
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm start` | Same as dev (alias) |
| `npm run serve` | Same as dev (alias) |

## PWA Features

### ✅ Recently Fixed
- **Day/Night Theme Toggle** - Now works correctly with distinct color schemes
- **Reliable Button Response** - Theme toggle responds on first click
- **Proper Color Switching** - Day mode uses light colors, night mode uses dark colors

### Available Features
- **Offline Functionality** - Works without internet connection
- **Service Worker** - Caches resources for offline use
- **Responsive Design** - Works on mobile and desktop
- **Location Services** - GPS location for fishing spots
- **Data Export/Import** - Backup and restore functionality
- **Species Database** - Comprehensive fish species data

## Testing PWA Features

1. **Service Worker**:
   - Open DevTools → Application → Service Workers
   - Verify registration and status

2. **Offline Mode**:
   - Open DevTools → Network → Check "Offline"
   - Reload page - should still work

3. **Theme Toggle**:
   - Click the 🌙/☀️ button in the top right
   - Verify day/night mode switching

4. **Mobile Simulation**:
   - Open DevTools → Toggle device toolbar
   - Test on different screen sizes

## Troubleshooting

### Container Won't Start
- Ensure Docker Desktop is running
- Try rebuilding: `Ctrl+Shift+P` → "Dev Containers: Rebuild Container"

### Port Already in Use
- Change port in package.json scripts: `--port=8081`
- Or stop other services using port 8080

### Theme Toggle Not Working
- Check browser console for JavaScript errors
- Verify `beautiful-buttons.css` is loading correctly
- Check that data-theme attribute is being set on `<html>` element

### Database Issues
- Database files are in `Fish App DB Files/`
- SQLite browser available in container for debugging

## Contributing

1. Make changes in your dev container
2. Test thoroughly with different devices/browsers
3. Verify PWA features still work
4. Test theme toggle functionality
5. Submit changes

## Support

If you encounter issues with the dev container setup:
1. Check Docker Desktop is running
2. Verify VS Code has Dev Containers extension
3. Try rebuilding the container
4. Check the container logs for errors

---

**Happy Coding! 🐟**
