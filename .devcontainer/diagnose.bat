@echo off
echo Dev Container Diagnostic Script
echo ================================

echo.
echo Checking Docker...
docker --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker not found or not running
    pause
    exit /b 1
)

echo.
echo Checking Docker daemon...
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker daemon is not running
    echo Please start Docker Desktop
    pause
    exit /b 1
)

echo.
echo Current Docker containers:
docker ps -a

echo.
echo Current Docker images:
docker images

echo.
echo Cleaning up old containers and images...
docker container prune -f
docker image prune -f

echo.
echo Testing dev container build...
docker build -t fish-log-test .devcontainer
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed
    pause
    exit /b 1
)

echo.
echo Cleaning up test image...
docker rmi fish-log-test

echo.
echo All checks passed! Try opening the dev container in VS Code now.
echo Use: Ctrl+Shift+P -> "Dev Containers: Reopen in Container"
pause
