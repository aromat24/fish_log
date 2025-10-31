/**
 * Fishing Game Integration - Connects the motion-controlled fishing game with the main fishing log app
 * Handles launching the game, managing virtual catches, and seamless integration
 */

class FishingGameIntegration {
    constructor() {
        this.fishingGame = null;
        this.gameCanvas = null;
        this.gameContainer = null;
        this.isGameActive = false;
        this.originalAppContent = null;
        
        console.log('FishingGameIntegration initialized');
    }

    /**
     * Initialize the game integration
     */
    async initialize() {
        try {
            console.log('Initializing fishing game integration...');
            
            // Create game container and canvas
            this.createGameContainer();
            
            // Setup Fish Now button handler
            this.setupFishNowButton();
            
            // Setup virtual catch logging
            this.setupVirtualCatchLogging();
            
            // Setup ESC key handler for exiting game
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isGameActive) {
                    this.exitGame();
                }
            });
            
            console.log('✅ Fishing game integration initialized');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Failed to initialize fishing game integration:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create the game container and canvas
     */
    createGameContainer() {
        // Create game container
        this.gameContainer = document.createElement('div');
        this.gameContainer.id = 'fishing-game-container';
        this.gameContainer.className = 'hidden fixed inset-0 bg-black z-[1500]';
        
        // Add mobile-specific styles
        this.gameContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            height: 100dvh; /* Dynamic viewport height for mobile */
            background-color: black;
            z-index: 1500;
            overflow: hidden;
        `;
        this.gameContainer.innerHTML = `
            <div class="relative w-full h-full">
                <!-- Game Canvas -->
                <canvas id="fishing-game-canvas" class="w-full h-full" style="display: block; width: 100%; height: 100%;"></canvas>
                
                <!-- Game UI Overlay -->
                <div class="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                    <div class="bg-black bg-opacity-50 rounded-lg p-3 text-white">
                        <div class="text-sm">Motion Gaming Active</div>
                        <div class="text-xs opacity-75">ESC to exit</div>
                    </div>
                    
                    <button id="exit-game-btn" class="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white rounded-full w-12 h-12 flex items-center justify-center pointer-events-auto transition-all"
                            style="min-height: 48px; min-width: 48px; touch-action: manipulation;">
                        ✖
                    </button>
                </div>
                
                <!-- Loading overlay -->
                <div id="game-loading-overlay" class="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <div class="text-white text-center">
                        <div class="text-2xl mb-2">🎣</div>
                        <div class="text-lg mb-2">Loading Fishing Game...</div>
                        <div class="text-sm opacity-75">Initializing motion controls...</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(this.gameContainer);
        
        // Get canvas reference
        this.gameCanvas = document.getElementById('fishing-game-canvas');
        
        // Setup exit button
        document.getElementById('exit-game-btn').addEventListener('click', () => {
            this.exitGame();
        });
    }

    /**
     * Setup Fish Now button handler
     */
    setupFishNowButton() {
        const findAndSetupButton = () => {
            console.log('🎣 [SETUP] Looking for Fish Now button...');
            const fishNowBtn = document.getElementById('fish-now-btn');
            if (fishNowBtn) {
                console.log('🎣 [SETUP] Fish Now button found, setting up click handler...');
                
                // Remove any existing listeners first
                const clonedBtn = fishNowBtn.cloneNode(true);
                fishNowBtn.parentNode.replaceChild(clonedBtn, fishNowBtn);
                
                clonedBtn.addEventListener('click', async (e) => {
                    console.log('🎣 [CLICK] Fish Now button clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        await this.launchGame();
                    } catch (error) {
                        console.error('🎣 [CLICK] Error launching game:', error);
                    }
                });
                
                console.log('✅ [SETUP] Fish Now button handler setup complete');
                return true;
            } else {
                console.warn('⚠️ [SETUP] Fish Now button not found in DOM');
                return false;
            }
        };
        
        // Try to setup immediately
        if (!findAndSetupButton()) {
            console.log('🎣 [SETUP] Button not found, retrying in 100ms...');
            // Retry after short delay in case DOM isn't fully ready
            setTimeout(() => {
                if (!findAndSetupButton()) {
                    console.log('🎣 [SETUP] Button not found, retrying in 500ms...');
                    setTimeout(findAndSetupButton, 500);
                }
            }, 100);
        }
    }

    /**
     * Setup virtual catch logging system
     */
    setupVirtualCatchLogging() {
        // Global function for logging virtual catches
        window.logVirtualCatch = (virtualCatch) => {
            this.handleVirtualCatch(virtualCatch);
        };
        
        console.log('Virtual catch logging system setup complete');
    }

    /**
     * Launch the fishing game
     */
    async launchGame() {
        try {
            console.log('🎮 [INTEGRATION] Launching fishing game...');
            
            // Show game container
            console.log('🎮 [INTEGRATION] Showing game container...');
            this.gameContainer.classList.remove('hidden');
            this.isGameActive = true;
            
            // Ensure loading overlay is initially visible on first load
            const loadingOverlay = document.getElementById('game-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
                loadingOverlay.style.opacity = '1';
                loadingOverlay.style.visibility = 'visible';
                console.log('🎮 [INTEGRATION] Loading overlay ensured visible');
            }
            
            // Hide main app content (fade out effect)
            console.log('🎮 [INTEGRATION] Hiding main app content...');
            const appContent = document.getElementById('app-content');
            if (appContent) {
                this.originalAppContent = appContent;
                appContent.style.transition = 'opacity 0.5s ease-out';
                appContent.style.opacity = '0';
                
                setTimeout(() => {
                    appContent.style.display = 'none';
                }, 500);
            }
            
            // Initialize game if not already created
            if (!this.fishingGame) {
                console.log('🎮 [INTEGRATION] Game not initialized, initializing...');
                
                // Add small delay to ensure all scripts are loaded
                console.log('🎮 [INTEGRATION] Waiting for scripts to load...');
                await new Promise(resolve => setTimeout(resolve, 100));
                
                await this.initializeGame();
            } else {
                console.log('🎮 [INTEGRATION] Game already initialized, reusing instance');
            }
            
            // Ensure loading overlay is shown for at least 800ms for better UX
            console.log('🎮 [INTEGRATION] Ensuring minimum loading time...');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Hide loading overlay first before any permission requests
            console.log('🎮 [INTEGRATION] Hiding loading overlay...');
            const hideLoadingOverlay = document.getElementById('game-loading-overlay');
            if (hideLoadingOverlay) {
                hideLoadingOverlay.style.opacity = '0';
                hideLoadingOverlay.style.visibility = 'hidden';
                setTimeout(() => {
                    hideLoadingOverlay.style.display = 'none';
                    console.log('🎮 [INTEGRATION] Loading overlay fully hidden');
                }, 300);
            }
            
            // Add small delay to ensure loading overlay is hidden
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Request motion permissions for enhanced gameplay (only if needed)
            console.log('🎮 [INTEGRATION] Checking motion sensor permissions...');
            await this.requestMotionPermissions();

            // CRITICAL: Re-assert overflow:hidden after calibration modal closes
            // The calibration modal restores body overflow, but we need it hidden for fullscreen game
            document.body.style.overflow = 'hidden';
            console.log('🎮 [INTEGRATION] Re-asserted body overflow:hidden after calibration');

            // Ensure game container is still visible and focused
            if (this.gameContainer) {
                this.gameContainer.classList.remove('hidden');
                this.gameContainer.style.zIndex = '1500';
                console.log('🎮 [INTEGRATION] Game container visibility re-confirmed');
            }

            // Start the game
            console.log('🎮 [INTEGRATION] Starting game...');
            await this.fishingGame.start();
            
            console.log('✅ [INTEGRATION] Fishing game launched successfully');
            
        } catch (error) {
            console.error('❌ [INTEGRATION] Failed to launch fishing game:', error);
            console.error('❌ [INTEGRATION] Error stack:', error.stack);
            
            // Hide loading overlay in case of error
            let errorLoadingOverlay = document.getElementById('game-loading-overlay');
            if (errorLoadingOverlay) {
                errorLoadingOverlay.style.opacity = '0';
                errorLoadingOverlay.style.visibility = 'hidden';
                errorLoadingOverlay.style.display = 'none';
                console.log('🎮 [INTEGRATION] Loading overlay hidden due to error');
            }
            
            // Also hide the game container to prevent black screen
            if (this.gameContainer) {
                this.gameContainer.classList.add('hidden');
                this.isGameActive = false;
                console.log('🎮 [INTEGRATION] Game container hidden due to error');
            }
            
            // Restore main app content
            if (this.originalAppContent) {
                this.originalAppContent.style.display = 'block';
                this.originalAppContent.style.opacity = '1';
                console.log('🎮 [INTEGRATION] Main app content restored due to error');
            }
            
            // Show appropriate error message based on error type
            let errorTitle = 'Failed to launch game';
            let errorMessage = error.message;
            
            if (error.message.includes('class not found')) {
                errorTitle = 'Game files not loaded';
                errorMessage = 'Some game files are missing or not loaded properly. Please refresh the page and try again.';
            } else if (error.message.includes('motion')) {
                errorTitle = 'Motion controls issue';
                errorMessage = 'There was an issue with motion controls. The game will work with touch controls.';
            } else if (error.message.includes('audio')) {
                errorTitle = 'Audio system issue';
                errorMessage = 'Audio system failed to initialize. The game will work without sound.';
            }
            
            this.showGameError(errorTitle, errorMessage);
        }
    }

    /**
     * Initialize the fishing game core
     */
    async initializeGame() {
        try {
            console.log('🎮 [INIT] Initializing fishing game...');
            
            // Check if FishingGameCore class is available
            if (typeof FishingGameCore === 'undefined') {
                throw new Error('FishingGameCore class not found! Make sure fishingGameCore.js is loaded.');
            }
            console.log('✅ [INIT] FishingGameCore class found');
            
            // Resize canvas to fit container
            console.log('🎮 [INIT] Resizing canvas...');
            this.resizeCanvas();
            
            // Create fishing game instance
            console.log('🎮 [INIT] Creating FishingGameCore instance...');
            this.fishingGame = new FishingGameCore(this.gameCanvas, {
                enableMotionControls: true,
                enableDebugMode: false, // Disable debug mode for production
                targetFPS: 60,
                adaptiveQuality: true,
                maxParticles: 300 // Reduced for mobile performance
            });
            console.log('✅ [INIT] FishingGameCore instance created:', this.fishingGame);
            
            // Initialize game
            console.log('🎮 [INIT] Initializing game core...');
            const initResult = await this.fishingGame.initialize();
            console.log('🎮 [INIT] Initialization result:', initResult);
            
            if (!initResult.success) {
                throw new Error(initResult.error);
            }
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (this.isGameActive) {
                    this.resizeCanvas();
                }
            });
            
            // Handle orientation changes
            window.addEventListener('orientationchange', () => {
                if (this.isGameActive) {
                    setTimeout(() => {
                        this.resizeCanvas();
                    }, 100);
                }
            });
            
            console.log('✅ [INIT] Fishing game core initialized successfully');
            
        } catch (error) {
            console.error('❌ [INIT] Failed to initialize fishing game:', error);
            console.error('❌ [INIT] Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * Request motion sensor permissions for enhanced gameplay
     */
    async requestMotionPermissions() {
        try {
            if (!this.fishingGame) {
                console.log('🎮 [MOTION] Game not initialized, skipping motion permissions');
                return { success: false, error: 'Game not initialized' };
            }

            // Check if motion permissions have already been handled
            const motionPermissionState = localStorage.getItem('motionPermissionState');
            console.log('🎮 [MOTION] Checking stored permission state:', motionPermissionState);

            // CRITICAL: Even if localStorage says "granted", verify sensors are ACTUALLY initialized
            const sensorStatus = this.fishingGame.motionSensorManager?.getStatus();
            const sensorsActuallyWorking = sensorStatus?.isInitialized && sensorStatus?.isPermissionGranted;

            console.log('🎮 [MOTION] Sensor actual status:', {
                isInitialized: sensorStatus?.isInitialized,
                isPermissionGranted: sensorStatus?.isPermissionGranted,
                sensorType: sensorStatus?.sensorType,
                cachedPermission: motionPermissionState
            });

            if (motionPermissionState === 'granted' && sensorsActuallyWorking) {
                console.log('✅ [MOTION] Motion permissions granted AND sensors initialized');

                // CRITICAL: Ensure loading overlay is hidden even when permissions are cached
                const cachedLoadingOverlay = document.getElementById('game-loading-overlay');
                if (cachedLoadingOverlay && cachedLoadingOverlay.style.display !== 'none') {
                    console.log('🎮 [MOTION] Hiding loading overlay (cached permissions)');
                    cachedLoadingOverlay.style.opacity = '0';
                    cachedLoadingOverlay.style.visibility = 'hidden';
                    setTimeout(() => {
                        cachedLoadingOverlay.style.display = 'none';
                    }, 300);
                }

                return { success: true, fromStorage: true };
            } else if (motionPermissionState === 'granted' && !sensorsActuallyWorking) {
                console.warn('⚠️ [MOTION] localStorage says granted but sensors not initialized - requesting again');
                // Clear cached permission and request again
                localStorage.removeItem('motionPermissionState');
                // Continue to request permissions below
            } else if (motionPermissionState === 'denied' || motionPermissionState === 'skipped') {
                console.log('ℹ️ [MOTION] Motion permissions previously denied/skipped, continuing without motion controls');

                // Ensure loading overlay is hidden even when permissions were previously denied
                const deniedLoadingOverlay = document.getElementById('game-loading-overlay');
                if (deniedLoadingOverlay && deniedLoadingOverlay.style.display !== 'none') {
                    console.log('🎮 [MOTION] Hiding loading overlay (cached denial)');
                    deniedLoadingOverlay.style.opacity = '0';
                    deniedLoadingOverlay.style.visibility = 'hidden';
                    setTimeout(() => {
                        deniedLoadingOverlay.style.display = 'none';
                    }, 300);
                }

                return { success: false, fromStorage: true, previouslyDenied: true };
            }

            // Check if motion controls are enabled and available
            if (this.fishingGame.options.enableMotionControls && this.fishingGame.motionPermissionUI) {
                console.log('🎮 [MOTION] Requesting motion sensor permissions (first time)...');
                const result = await this.fishingGame.requestMotionPermissions();
                
                // Store the permission result for future sessions
                if (result.success) {
                    localStorage.setItem('motionPermissionState', 'granted');
                    console.log('✅ [MOTION] Motion permissions granted and saved');
                } else if (result.skipped) {
                    localStorage.setItem('motionPermissionState', 'skipped');
                    console.log('ℹ️ [MOTION] Motion permissions skipped and saved');
                } else {
                    localStorage.setItem('motionPermissionState', 'denied');
                    console.log('ℹ️ [MOTION] Motion permissions denied and saved');
                }
                
                return result;
            } else {
                console.log('ℹ️ [MOTION] Motion controls not available or disabled');
                return { success: false, error: 'Motion controls not available' };
            }
        } catch (error) {
            console.error('❌ [MOTION] Failed to request motion permissions:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        if (!this.gameCanvas || !this.gameContainer) return;
        
        const container = this.gameContainer;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match container
        this.gameCanvas.width = rect.width;
        this.gameCanvas.height = rect.height;
        
        // Update canvas CSS size
        this.gameCanvas.style.width = rect.width + 'px';
        this.gameCanvas.style.height = rect.height + 'px';
        
        console.log(`Canvas resized to: ${rect.width}x${rect.height}`);
    }

    /**
     * Exit the fishing game and return to main app
     */
    async exitGame() {
        try {
            console.log('Exiting fishing game...');
            
            // Stop the game
            if (this.fishingGame) {
                this.fishingGame.stop();
            }
            
            // Hide game container
            this.gameContainer.classList.add('hidden');
            this.isGameActive = false;
            
            // Show main app content (fade in effect)
            if (this.originalAppContent) {
                this.originalAppContent.style.display = 'block';
                this.originalAppContent.style.opacity = '0';
                
                setTimeout(() => {
                    this.originalAppContent.style.opacity = '1';
                }, 50);
            }
            
            // Show loading overlay for next time
            let exitLoadingOverlay = document.getElementById('game-loading-overlay');
            if (exitLoadingOverlay) {
                exitLoadingOverlay.style.display = 'flex';
                exitLoadingOverlay.style.opacity = '1';
            }
            
            console.log('✅ Exited fishing game successfully');
            
        } catch (error) {
            console.error('❌ Error exiting fishing game:', error);
        }
    }

    /**
     * Handle virtual catch from game
     */
    handleVirtualCatch(virtualCatch) {
        try {
            console.log('Processing virtual catch:', virtualCatch);
            
            // Log to separate game storage (NEVER mix with real catches)
            if (window.gameLogManager) {
                const gameCatch = window.gameLogManager.addGameCatch(virtualCatch);
                console.log('Virtual catch saved to game log:', gameCatch);
                
                // Update game log UI if visible
                this.updateGameLogUI();
            } else {
                console.warn('GameLogManager not available - virtual catch not saved');
            }
            
            // Show catch notification
            this.showCatchNotification(virtualCatch);
            
        } catch (error) {
            console.error('Error handling virtual catch:', error);
        }
    }

    /**
     * Update game log UI if visible
     */
    updateGameLogUI() {
        try {
            // Check if game log tab is active
            const gameLogContainer = document.getElementById('game-log-container');
            if (!gameLogContainer || gameLogContainer.classList.contains('hidden')) {
                return; // Game log not visible, no need to update
            }

            if (window.gameLogManager) {
                const gameCatches = window.gameLogManager.getGameCatches();
                
                // Update catches list (statistics are now shown in tab button)
                this.renderGameCatchesList(gameCatches);
            }
        } catch (error) {
            console.error('Error updating game log UI:', error);
        }
    }

    /**
     * Render game catches list
     */
    renderGameCatchesList(gameCatches) {
        const gameListContainer = document.getElementById('game-catches-list');
        if (!gameListContainer) return;

        // Safety check: ensure gameCatches is an array
        if (!gameCatches || !Array.isArray(gameCatches)) {
            console.warn('gameCatches is not an array:', gameCatches);
            gameCatches = [];
        }

        if (gameCatches.length === 0) {
            gameListContainer.innerHTML = '<p class="italic text-gray-500 text-center py-8">No game catches yet. Play the fishing game to start logging virtual catches!</p>';
            return;
        }

        const catchesHTML = gameCatches
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20) // Show latest 20 catches
            .map(catch_ => `
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">🎮</span>
                            <div>
                                <h4 class="font-semibold text-purple-800">${catch_.species}</h4>
                                <div class="text-sm text-purple-600">
                                    ${catch_.length}cm • ${catch_.weight}kg 
                                    ${catch_.gameScore ? `• Score: ${catch_.gameScore}` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-purple-500">${new Date(catch_.timestamp).toLocaleDateString()}</div>
                            <div class="text-xs text-purple-400">${new Date(catch_.timestamp).toLocaleTimeString()}</div>
                            ${catch_.motionAccuracy ? `<div class="text-xs text-green-600">Accuracy: ${Math.round(catch_.motionAccuracy * 100)}%</div>` : ''}
                        </div>
                    </div>
                    ${catch_.gameMetrics ? `
                        <div class="mt-2 pt-2 border-t border-purple-200 text-xs text-purple-600">
                            <span class="bg-purple-100 px-2 py-1 rounded">VIRTUAL CATCH</span>
                            ${catch_.gameDifficulty ? `<span class="bg-blue-100 px-2 py-1 rounded ml-1">${catch_.gameDifficulty.toUpperCase()}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('');

        gameListContainer.innerHTML = catchesHTML;
    }

    /**
     * Show catch notification overlay
     */
    showCatchNotification(virtualCatch) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[1600] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
        notification.innerHTML = `
            <div class="text-center">
                <div class="text-lg font-bold">🎣 Nice Catch!</div>
                <div class="text-sm">${virtualCatch.species} - ${virtualCatch.length}cm</div>
                <div class="text-xs opacity-75">Game Score: ${virtualCatch.gameScore}</div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Animate in
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -20px)';
        
        setTimeout(() => {
            notification.style.transition = 'all 0.3s ease-out';
            notification.style.opacity = '1';
            notification.style.transform = 'translate(-50%, 0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -20px)';
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show game error
     */
    showGameError(title, message) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1600]';
        errorOverlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button id="close-error-btn" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        
        // Setup close button
        errorOverlay.querySelector('#close-error-btn').addEventListener('click', () => {
            errorOverlay.remove();
            this.exitGame();
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (errorOverlay.parentElement) {
                errorOverlay.remove();
                this.exitGame();
            }
        }, 10000);
    }

    /**
     * Get game status
     */
    getGameStatus() {
        return {
            isGameActive: this.isGameActive,
            isGameInitialized: this.fishingGame !== null,
            gameState: this.fishingGame ? this.fishingGame.getGameState() : null
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        console.log('Cleaning up fishing game integration...');
        
        // Stop and cleanup game
        if (this.fishingGame) {
            this.fishingGame.cleanup();
            this.fishingGame = null;
        }
        
        // Remove game container
        if (this.gameContainer) {
            this.gameContainer.remove();
            this.gameContainer = null;
        }
        
        // Remove global functions
        delete window.logVirtualCatch;
        
        this.isGameActive = false;
        
        console.log('✅ Fishing game integration cleanup complete');
    }
}

// Global instance
let fishingGameIntegration = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        fishingGameIntegration = new FishingGameIntegration();
        window.fishingGameIntegration = fishingGameIntegration; // Make it globally accessible
        await fishingGameIntegration.initialize();
    } catch (error) {
        console.error('Failed to initialize fishing game integration:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishingGameIntegration;
} else {
    window.FishingGameIntegration = FishingGameIntegration;
}