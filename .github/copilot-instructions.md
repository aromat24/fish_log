# Fish Log PWA - Copilot Instructions

## Architecture Overview

This is a **vanilla JavaScript PWA** (no build tools) with sophisticated error handling, database operations, and offline capabilities. The app uses a modular architecture with the main application in a single HTML file (`index.html`) and supporting JavaScript modules in `js/`.

## Key Development Patterns

### Error Handling Strategy
- **Always use error boundaries**: Wrap operations with `window.errorHandler.withErrorBoundary()` for async or `withSyncErrorBoundary()` for sync
- **Custom error classes**: Use specific errors like `DatabaseError`, `ValidationError`, `CalculationError` - they're globally available
- **Fallback patterns**: Every database/calculation operation should have a fallback (see `calculateEstimatedWeightBasic()`)

```javascript
// Preferred pattern for new features
const result = await window.errorHandler.withErrorBoundary(async () => {
    return await someOperation();
}, 'OperationContext', { showUserError: false });

if (result.success) {
    // Handle success
} else {
    // Handle failure with fallback
}
```

### Event Management
- **Use EventManager**: Always use `eventManager.addListener()`, `eventManager.setupButton()`, `eventManager.setupForm()` instead of direct `addEventListener`
- **Automatic cleanup**: EventManager tracks and cleans up listeners to prevent memory leaks
- **Touch-friendly**: Built-in scroll detection prevents touch conflicts on mobile

### Database Architecture
- **Dual storage**: IndexedDB via `fishDatabase.js` + localStorage for user data
- **Self-improving algorithms**: The weight calculation system learns from user corrections via `selfImprovingAlgorithm.js`
- **Batch operations**: Use `processAlgorithmsBatch()` for large dataset operations
- **Transaction safety**: Always use `executeTransaction()` wrapper for IndexedDB operations

### PWA-Specific Patterns
- **Service Worker**: Auto-updating via `swUpdateManager.js` - handles version management and user notifications
- **Offline-first**: All core functionality works without network (cached in `sw.js`)
- **Theme system**: Uses `data-theme="day|night"` attributes, toggled via buttons

## Common File Patterns

### Form Handling
```javascript
function setupNewFeature() {
    const form = document.getElementById('feature-form');
    
    // Use EventManager for forms
    eventManager.setupForm(form, handleSubmit, {
        validateOnSubmit: true,
        resetAfterSubmit: false  // Manual reset for success feedback
    });
    
    // Always reset button state after operations
    const submitBtn = form.querySelector('button[type="submit"]');
    // Reset button logic here after success
}
```

### Weight Calculation Integration
- Main function: `calculateEstimatedWeight(species, length)`
- Always check for `window.fishDB.isReady()` before database operations
- Use `updateWeightInputWithResult()` to show calculation metadata to users
- Implement `fallbackCalculation()` for when database is unavailable

### Location & Maps
- GPS coordinates via `navigator.geolocation`
- Google Maps integration: Generate URLs like `https://www.google.com/maps?q=${lat},${lng}`
- Store both coordinates AND location names for user-friendly display

## Development Workflow

### Local Development
```bash
npm run dev  # Starts live-server on port 8080
```

### Testing Strategy
- Use the comprehensive test suites in `test-*.html` files
- Check PWA features: DevTools → Application → Service Workers
- Test offline: DevTools → Network → Offline checkbox
- Mobile testing: DevTools → Device Toolbar

### Adding New Features
1. Create error boundaries and fallbacks first
2. Use EventManager for all DOM events  
3. Implement proper logging with `logger.debug()`, `logger.warn()`
4. Add IndexedDB operations if persistent data needed
5. Test thoroughly on mobile (touch events)

## Critical Integration Points

### Global Dependencies (Always Available)
- `window.errorHandler` - Error handling system
- `window.eventManager` - Event management
- `window.fishDB` - Fish database operations
- `window.logger` - Development logging
- Storage utilities: `storage.get()`, `storage.set()`, `storage.remove()`

### Theme System
Use the existing theme toggle pattern in the header. Never directly manipulate CSS classes for themes - use the `data-theme` attribute system.

### Photo Handling
Images are base64-encoded and stored in localStorage. Use `compressImage()` function to keep under size limits. Always validate file types and sizes before processing.

## Common Gotchas

- **Never use `console.log()` directly** - use `logger.debug()` (auto-disabled in production)
- **Form resets**: EventManager uses `resetAfterSubmit: false` - manually reset buttons after success
- **Mobile scrolling**: EventManager handles touch scroll conflicts automatically
- **Database timing**: Always await `fishDB.isReady()` before operations
- **PWA caching**: Update `CACHE_NAME` in `sw.js` when adding new assets

This app prioritizes reliability and graceful degradation - every feature should work even when network/database fails.
