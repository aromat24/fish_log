# Dev Container Troubleshooting Guide

## Latest Changes
- ✅ Simplified devcontainer.json to minimal configuration
- ✅ Using pre-built Microsoft Node.js image
- ✅ Removed complex features and Docker build steps
- ✅ Docker builds successfully when tested manually

## Current Status
✅ Docker builds successfully
✅ Dev Containers extension is installed
✅ Configuration files are simplified and valid

## If Dev Container Still Won't Open

### Step 1: Try the Simplified Configuration
1. Open Command Palette (Ctrl+Shift+P)
2. Run: `Dev Containers: Reopen in Container`
3. Wait for the container to start (may take a few minutes first time)

### Step 2: Check Docker
```powershell
docker --version
docker ps
docker images
```

### Step 3: Alternative Configuration
If the main configuration fails:
1. Rename `.devcontainer/devcontainer.json` to `devcontainer-main.json`
2. Rename `.devcontainer/devcontainer-alt.json` to `devcontainer.json`
3. Try `Dev Containers: Rebuild and Reopen in Container`

### Step 4: Manual Commands to Try
```powershell
# Clean Docker system
docker system prune -f

# Remove old containers
docker container prune -f

# Check if any containers are using the workspace
docker ps -a | findstr fish
```

### Step 5: VS Code Commands in Order
1. `Dev Containers: Rebuild Container`
2. `Dev Containers: Rebuild and Reopen in Container`
3. `Developer: Toggle Developer Tools` (check Console for errors)

### Step 6: Check VS Code Extension
- Ensure Dev Containers extension is up to date
- Try disabling and re-enabling the extension
- Restart VS Code completely

### Step 7: Common Issues
- **Antivirus software**: May block Docker operations
- **Windows Firewall**: May need Docker exceptions
- **WSL issues**: Ensure WSL 2 is properly configured
- **Docker Desktop**: Should be running and up to date

### Step 8: Last Resort - Local Development
If dev container completely fails:
```powershell
npm install
npm run dev
```

## Error Patterns to Look For
- Permission denied errors
- Port binding failures
- Docker daemon not running
- Configuration file syntax errors
- Missing dependencies in container

## Get More Information
Run with debug logging:
1. Open Command Palette
2. `Dev Containers: Show All Logs`
3. Look for specific error messages
