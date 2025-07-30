class FishingGameEngine {
    constructor(canvasId, options = {}) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // Configuration with defaults
        this.config = {
            targetFPS: options.targetFPS || 60,
            debugMode: options.debugMode || false,
            maxDeltaTime: options.maxDeltaTime || 100, // Max ms between frames
            enableErrorRecovery: options.enableErrorRecovery !== false
        };
        
        // Game state
        this.currentScene = null;
        this.scenes = new Map();
        this.inputManager = null;
        this.audioManager = null;
        this.gameDatabase = null;
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorCooldown = 5000; // 5 seconds
        this.lastErrorTime = 0;
        
        // Performance monitoring
        this.performanceStats = {
            averageFPS: 60,
            frameTimeHistory: [],
            maxFrameTime: 0,
            memoryUsage: 0
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🎮 Initializing Fishing Game Engine...');
            
            // Setup canvas with error handling
            await this.setupCanvas();
            
            // Initialize subsystems
            await this.initializeSubsystems();
            
            // Setup error handlers
            this.setupErrorHandlers();
            
            console.log('✅ Fishing Game Engine initialized successfully');
            return true;
            
        } catch (error) {
            this.handleCriticalError('Game engine initialization failed', error);
            return false;
        }
    }
    
    async setupCanvas() {
        try {
            this.canvas = document.getElementById(this.canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas element with id '${this.canvasId}' not found`);
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Failed to get 2D rendering context from canvas');
            }
            
            // High DPI support with error handling
            this.setupHighDPI();
            
            // Touch optimization
            this.canvas.style.touchAction = 'none';
            this.canvas.style.userSelect = 'none';
            
            console.log('✅ Canvas setup complete');
            
        } catch (error) {
            throw new Error(`Canvas setup failed: ${error.message}`);
        }
    }
    
    setupHighDPI() {
        try {
            const devicePixelRatio = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            
            // Set actual size
            this.canvas.width = rect.width * devicePixelRatio;
            this.canvas.height = rect.height * devicePixelRatio;
            
            // Scale context
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
            
            // Set CSS size
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            
            console.log(`📱 High DPI setup: ${devicePixelRatio}x scaling`);
            
        } catch (error) {
            console.warn('⚠️ High DPI setup failed, using standard resolution:', error);
        }
    }
    
    async initializeSubsystems() {
        try {
            // Initialize input manager
            if (window.FishingGameInputManager) {
                this.inputManager = new window.FishingGameInputManager(this.canvas);
                console.log('✅ Input manager initialized');
            } else {
                console.warn('⚠️ Input manager not available');
            }
            
            // Initialize audio manager
            if (window.FishingGameAudioManager) {
                this.audioManager = new window.FishingGameAudioManager();
                await this.audioManager.init();
                console.log('✅ Audio manager initialized');
            } else {
                console.warn('⚠️ Audio manager not available');
            }
            
            // Initialize game database
            if (window.FishingGameDatabase) {
                this.gameDatabase = new window.FishingGameDatabase();
                await this.gameDatabase.init();
                console.log('✅ Game database initialized');
            } else {
                console.warn('⚠️ Game database not available');
            }
            
        } catch (error) {
            console.error('❌ Subsystem initialization error:', error);
            throw error;
        }
    }
    
    setupErrorHandlers() {
        // Global error handler for the game
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('/game/')) {
                this.handleRuntimeError('Global error in game code', event.error);
            }
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.stack && event.reason.stack.includes('/game/')) {
                this.handleRuntimeError('Unhandled promise rejection in game', event.reason);
            }
        });
        
        // Canvas context lost handler
        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.handleContextLoss();
        });
        
        this.canvas.addEventListener('webglcontextrestored', () => {
            this.handleContextRestore();
        });
    }
    
    handleRuntimeError(message, error) {
        const currentTime = Date.now();
        
        // Rate limiting
        if (currentTime - this.lastErrorTime < this.errorCooldown) {
            return;
        }
        
        this.errorCount++;
        this.lastErrorTime = currentTime;
        
        console.error(`🚨 Game Error: ${message}`, error);
        
        // Log to external error handler if available
        if (window.errorHandler) {
            window.errorHandler.logError(
                new Error(`Game Engine: ${message}`), 
                'FishingGameEngine.handleRuntimeError',
                { originalError: error, errorCount: this.errorCount }
            );
        }
        
        // Recovery strategies
        if (this.config.enableErrorRecovery && this.errorCount < this.maxErrors) {
            this.attemptErrorRecovery(error);
        } else {
            this.handleCriticalError('Maximum error count exceeded', error);
        }
    }
    
    attemptErrorRecovery(error) {
        try {
            console.log('🔧 Attempting error recovery...');
            
            // Stop current scene safely
            if (this.currentScene && typeof this.currentScene.pause === 'function') {
                this.currentScene.pause();
            }
            
            // Clear any problematic intervals/timeouts
            this.stop();
            
            // Reset input state
            if (this.inputManager && typeof this.inputManager.reset === 'function') {
                this.inputManager.reset();
            }
            
            // Clear canvas
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            console.log('✅ Error recovery completed');
            
        } catch (recoveryError) {
            console.error('❌ Error recovery failed:', recoveryError);
            this.handleCriticalError('Error recovery failed', recoveryError);
        }
    }
    
    handleCriticalError(message, error) {
        console.error(`💥 Critical Game Error: ${message}`, error);
        
        // Stop the game completely
        this.stop();
        
        // Show user-friendly error message
        if (window.errorHandler) {
            window.errorHandler.showUserError(
                'The fishing game encountered a critical error and has been stopped. Please refresh the page to restart.'
            );
        }
        
        // Draw error message on canvas if possible
        try {
            if (this.ctx) {
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    'Game Error - Please Refresh', 
                    this.canvas.width / 2, 
                    this.canvas.height / 2
                );
            }
        } catch (drawError) {
            console.error('Failed to draw error message:', drawError);
        }
    }
    
    handleContextLoss() {
        console.warn('🔄 Canvas context lost, pausing game');
        this.stop();
    }
    
    handleContextRestore() {
        console.log('🔄 Canvas context restored, attempting to resume');
        try {
            this.setupCanvas();
            if (this.currentScene) {
                this.start();
            }
        } catch (error) {
            this.handleRuntimeError('Context restore failed', error);
        }
    }
    
    // Scene management with error handling
    addScene(name, scene) {
        try {
            if (!scene || typeof scene.update !== 'function' || typeof scene.render !== 'function') {
                throw new Error(`Invalid scene: ${name}. Scene must have update() and render() methods`);
            }
            
            this.scenes.set(name, scene);
            scene.engine = this;
            
            if (typeof scene.init === 'function') {
                scene.init();
            }
            
            console.log(`✅ Scene '${name}' added successfully`);
            
        } catch (error) {
            this.handleRuntimeError(`Failed to add scene '${name}'`, error);
        }
    }
    
    setScene(name) {
        try {
            const scene = this.scenes.get(name);
            if (!scene) {
                throw new Error(`Scene '${name}' not found`);
            }
            
            // Exit current scene
            if (this.currentScene && typeof this.currentScene.exit === 'function') {
                this.currentScene.exit();
            }
            
            this.currentScene = scene;
            
            // Enter new scene
            if (typeof scene.enter === 'function') {
                scene.enter();
            }
            
            console.log(`🎬 Switched to scene: ${name}`);
            
        } catch (error) {
            this.handleRuntimeError(`Failed to set scene '${name}'`, error);
        }
    }
    
    // Game loop with comprehensive error handling
    start() {
        if (this.isRunning) {
            console.warn('⚠️ Game is already running');
            return;
        }
        
        try {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.gameLoop();
            console.log('▶️ Game loop started');
            
        } catch (error) {
            this.handleRuntimeError('Failed to start game loop', error);
        }
    }
    
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game loop stopped');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        try {
            const currentTime = performance.now();
            const deltaTime = Math.min(currentTime - this.lastFrameTime, this.config.maxDeltaTime);
            
            // Update performance stats
            this.updatePerformanceStats(deltaTime);
            
            // Update current scene
            if (this.currentScene) {
                this.currentScene.update(deltaTime);
            }
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Render current scene
            if (this.currentScene) {
                this.currentScene.render(this.ctx);
            }
            
            // Debug information
            if (this.config.debugMode) {
                this.renderDebugInfo();
            }
            
            this.lastFrameTime = currentTime;
            
            // Schedule next frame
            requestAnimationFrame(() => this.gameLoop());
            
        } catch (error) {
            this.handleRuntimeError('Game loop error', error);
            
            // Try to continue with next frame unless critical
            if (this.errorCount < this.maxErrors) {
                requestAnimationFrame(() => this.gameLoop());
            }
        }
    }
    
    updatePerformanceStats(deltaTime) {
        try {
            this.frameCount++;
            
            // Calculate FPS
            const currentTime = performance.now();
            if (currentTime - this.fpsUpdateTime >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
                this.frameCount = 0;
                this.fpsUpdateTime = currentTime;
                
                // Update average FPS
                this.performanceStats.averageFPS = (this.performanceStats.averageFPS + this.fps) / 2;
            }
            
            // Track frame times
            this.performanceStats.frameTimeHistory.push(deltaTime);
            if (this.performanceStats.frameTimeHistory.length > 60) {
                this.performanceStats.frameTimeHistory.shift();
            }
            
            // Track max frame time
            this.performanceStats.maxFrameTime = Math.max(this.performanceStats.maxFrameTime, deltaTime);
            
            // Memory usage (if available)
            if (performance.memory) {
                this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            }
            
        } catch (error) {
            console.warn('Performance stats update failed:', error);
        }
    }
    
    renderDebugInfo() {
        try {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 200, 120);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`FPS: ${this.fps}`, 20, 30);
            this.ctx.fillText(`Avg FPS: ${this.performanceStats.averageFPS.toFixed(1)}`, 20, 45);
            this.ctx.fillText(`Max Frame: ${this.performanceStats.maxFrameTime.toFixed(2)}ms`, 20, 60);
            this.ctx.fillText(`Memory: ${this.performanceStats.memoryUsage.toFixed(1)}MB`, 20, 75);
            this.ctx.fillText(`Errors: ${this.errorCount}`, 20, 90);
            this.ctx.fillText(`Scene: ${this.currentScene?.constructor.name || 'None'}`, 20, 105);
            
            this.ctx.restore();
            
        } catch (error) {
            console.warn('Debug info rendering failed:', error);
        }
    }
    
    // Utility methods
    getPerformanceStats() {
        return { ...this.performanceStats };
    }
    
    isHealthy() {
        return this.errorCount < this.maxErrors && 
               this.performanceStats.averageFPS > 30 &&
               this.isRunning;
    }
    
    reset() {
        try {
            this.stop();
            this.errorCount = 0;
            this.lastErrorTime = 0;
            this.performanceStats.frameTimeHistory = [];
            this.performanceStats.maxFrameTime = 0;
            
            if (this.inputManager && typeof this.inputManager.reset === 'function') {
                this.inputManager.reset();
            }
            
            console.log('🔄 Game engine reset completed');
            
        } catch (error) {
            console.error('Game engine reset failed:', error);
        }
    }
}

// Export to global scope
window.FishingGameEngine = FishingGameEngine;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishingGameEngine;
}