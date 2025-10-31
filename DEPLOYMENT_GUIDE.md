# Deployment Guide

## Quick Start

You can now toggle between deploying the **stable app** (main branch) and the **game testing version** (experimental-dev) using GitHub Actions.

## How to Deploy

### Option 1: Automatic Deployment
- Push to `main` branch → Automatically deploys stable app
- Push to `experimental-dev` branch → Automatically deploys game version

### Option 2: Manual Deployment (Recommended for Testing)
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Click on **Deploy Production** workflow
4. Click **Run workflow** button
5. Select the branch you want to deploy:
   - `main` - Stable fishing log app (no game)
   - `experimental-dev` - Game testing version
6. Click **Run workflow**

## Branch Overview

| Branch | Description | Status |
|--------|-------------|--------|
| `main` | Stable fishing log app without game | Production-ready |
| `experimental-dev` | Game implementation for testing | Testing |
| `dev` | Minor improvements, no game | Alternative stable |
| `fishing-game-implementation` | Old broken branch | ⚠️ DO NOT USE |

## Service Worker Cache

The deployment workflow automatically:
- Updates cache name with branch and timestamp
- Removes game files from cache when deploying `main`
- Includes game files when deploying `experimental-dev`
- Forces cache refresh for users

## Troubleshooting

### Users seeing old cached version or app not working
**Quick Fix:**
1. Navigate to: `https://your-site-url/clear-cache.html`
2. Click "Clear All Caches & Reload"
3. App will reload with fresh content

**Manual Fix:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Mobile: Clear browser cache in settings
- Service worker will auto-update within 24 hours

### Mobile app completely broken
1. Open `https://your-site-url/clear-cache.html` on mobile
2. Click "Full Reset (Nuclear Option)"
3. Wait for automatic reload

**Note:** Full reset will delete all saved fishing logs. Export your data first if possible.

### Deployment failed
- Check GitHub Actions logs for errors
- Ensure all files referenced in sw.js exist in the branch
- Verify service worker cache names are being updated

### Game not working on live site
- Verify you deployed `experimental-dev` branch via Actions tab
- Check browser console for errors (F12)
- Ensure motion sensor permissions are granted (on mobile)
- Clear cache if switching between branches

### Developer Console Commands
Open browser console (F12) and run:
```javascript
// Force clear all caches and service workers
window.swUpdateManager.forceReset();

// Check service worker status
window.swUpdateManager.getStatus();
```
