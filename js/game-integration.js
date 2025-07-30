/**
 * Fishing Game Integration Module
 * Integrates the fishing game with the existing fish log PWA
 */

class FishingGameIntegration {
    constructor() {
        this.gameEngine = null;
        this.isGameInitialized = false;
        this.isGameRunning = false;
        this.gameCanvas = null;
        this.statusText = null;
        
        console.log('🎮 Fishing Game Integration initialized');
    }

    async initializeGame() {
        try {
            console.log('🎮 Initializing fishing game...');
            
            // Get canvas and status elements
            this.gameCanvas = document.getElementById('fishing-game-canvas');
            this.statusText = document.getElementById('game-status-text');
            
            if (!this.gameCanvas) {
                throw new Error('Game canvas not found');
            }

            // Ensure game classes are available
            if (!window.FishingGameEngine) {
                throw new Error('FishingGameEngine not loaded');
            }

            // Initialize game engine
            this.gameEngine = new window.FishingGameEngine('fishing-game-canvas', {
                debugMode: false,
                targetFPS: 60,
                enableErrorRecovery: true
            });

            // Initialize the engine
            const initSuccess = await this.gameEngine.init();
            if (!initSuccess) {
                throw new Error('Game engine initialization failed');
            }

            // Set up scenes
            this.setupGameScenes();
            
            // Set up game controls
            this.setupGameControls();
            
            this.isGameInitialized = true;
            this.updateStatus('Game ready! Click Start Game to begin.');
            
            console.log('✅ Fishing game initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize fishing game:', error);
            this.updateStatus('Failed to load game. Please refresh the page.');
            
            if (window.errorHandler) {
                window.errorHandler.logError(error, 'FishingGameIntegration.initializeGame');
            }
            
            return false;
        }
    }

    setupGameScenes() {
        try {
            // Add menu scene
            if (window.FishingGameMenuScene) {
                const menuScene = new window.FishingGameMenuScene();
                this.gameEngine.addScene('menu', menuScene);
                this.gameEngine.setScene('menu');
                console.log('✅ Menu scene added');
            }
            
        } catch (error) {
            console.error('❌ Failed to setup game scenes:', error);
            throw error;
        }
    }

    setupGameControls() {
        try {
            const startBtn = document.getElementById('start-game-btn');
            const pauseBtn = document.getElementById('pause-game-btn');
            const stopBtn = document.getElementById('stop-game-btn');

            if (startBtn) {
                startBtn.addEventListener('click', () => this.startGame());
            }

            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => this.pauseGame());
            }

            if (stopBtn) {
                stopBtn.addEventListener('click', () => this.stopGame());
            }

            console.log('✅ Game controls setup complete');
            
        } catch (error) {
            console.error('❌ Failed to setup game controls:', error);
            throw error;
        }
    }

    startGame() {
        try {
            if (!this.isGameInitialized) {
                this.updateStatus('Game not initialized. Please wait...');
                return;
            }

            if (this.isGameRunning) {
                this.updateStatus('Game is already running!');
                return;
            }

            console.log('🎮 Starting fishing game...');
            this.gameEngine.start();
            this.isGameRunning = true;
            
            this.updateStatus('Game started! 🎣');
            this.updateGameButtons('running');
            
        } catch (error) {
            console.error('❌ Failed to start game:', error);
            this.updateStatus('Failed to start game. Please try again.');
            
            if (window.errorHandler) {
                window.errorHandler.logError(error, 'FishingGameIntegration.startGame');
            }
        }
    }

    pauseGame() {
        try {
            if (!this.isGameRunning) {
                this.updateStatus('Game is not running!');
                return;
            }

            console.log('⏸️ Pausing fishing game...');
            this.gameEngine.stop();
            this.isGameRunning = false;
            
            this.updateStatus('Game paused');
            this.updateGameButtons('paused');
            
        } catch (error) {
            console.error('❌ Failed to pause game:', error);
            this.updateStatus('Failed to pause game.');
        }
    }

    stopGame() {
        try {
            console.log('⏹️ Stopping fishing game...');
            
            if (this.gameEngine) {
                this.gameEngine.stop();
            }
            
            this.isGameRunning = false;
            this.updateStatus('Game stopped. Click Start Game to play again.');
            this.updateGameButtons('stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop game:', error);
            this.updateStatus('Game stopped with errors.');
        }
    }

    updateGameButtons(state) {
        const startBtn = document.getElementById('start-game-btn');
        const pauseBtn = document.getElementById('pause-game-btn');
        const stopBtn = document.getElementById('stop-game-btn');

        switch (state) {
            case 'running':
                if (startBtn) startBtn.classList.add('hidden');
                if (pauseBtn) pauseBtn.classList.remove('hidden');
                if (stopBtn) stopBtn.classList.remove('hidden');
                break;
            case 'paused':
            case 'stopped':
                if (startBtn) startBtn.classList.remove('hidden');
                if (pauseBtn) pauseBtn.classList.add('hidden');
                if (stopBtn) stopBtn.classList.add('hidden');
                break;
        }
    }

    updateStatus(message) {
        if (this.statusText) {
            this.statusText.textContent = message;
        }
        console.log(`🎮 Game Status: ${message}`);
    }

    // Integration with fish log system
    logCatch(fishData) {
        try {
            console.log('🐟 Logging game catch to fish database:', fishData);
            
            // Create catch entry compatible with existing fish log system
            const catchEntry = {
                id: `game-catch-${Date.now()}`,
                species: fishData.species || 'Unknown Fish',
                length: fishData.length || 0,
                weight: fishData.weight || 0,
                location: fishData.location || 'Game Location',
                date: new Date().toISOString(),
                time: new Date().toLocaleTimeString(),
                method: 'Fishing Game',
                notes: fishData.notes || 'Caught in fishing game',
                gameData: true // Mark as game catch
            };

            // Use existing saveCatchData function if available
            if (window.saveCatchData) {
                window.saveCatchData(catchEntry);
                this.updateStatus(`Great catch! ${fishData.species} logged to your journal.`);
            } else {
                console.warn('⚠️ saveCatchData function not available');
                this.updateStatus(`Great catch! ${fishData.species} (game integration pending)`);
            }
            
        } catch (error) {
            console.error('❌ Failed to log game catch:', error);
            this.updateStatus('Catch recorded in game, but failed to save to journal.');
        }
    }

    // Get fish species data from existing database
    async getFishSpecies() {
        try {
            // Access existing fish database if available
            if (window.fishDatabase && typeof window.fishDatabase.getAllSpecies === 'function') {
                return await window.fishDatabase.getAllSpecies();
            }
            
            // Fallback to fish algorithms data
            if (window.fishAlgorithms) {
                return Object.keys(window.fishAlgorithms).map(species => ({
                    name: species,
                    data: window.fishAlgorithms[species]
                }));
            }
            
            console.warn('⚠️ Fish database not available for game integration');
            return [];
            
        } catch (error) {
            console.error('❌ Failed to get fish species for game:', error);
            return [];
        }
    }

    // Cleanup when tab is switched away
    cleanup() {
        try {
            if (this.isGameRunning) {
                this.pauseGame();
            }
            console.log('🧹 Game integration cleanup completed');
            
        } catch (error) {
            console.error('❌ Game cleanup failed:', error);
        }
    }

    // Check if game is healthy
    isHealthy() {
        return this.isGameInitialized && 
               this.gameEngine && 
               this.gameEngine.isHealthy && 
               this.gameEngine.isHealthy();
    }
}

// Export to global scope
window.FishingGameIntegration = FishingGameIntegration;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishingGameIntegration;
}