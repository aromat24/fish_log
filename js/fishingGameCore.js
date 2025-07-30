/**
 * Fishing Game Core - Lightweight game framework foundation
 * Provides the main game engine with mobile-optimized performance
 * Integrates motion sensor controls with traditional touch fallbacks
 */

class FishingGameCore {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration options
        this.options = {
            targetFPS: options.targetFPS || 60,
            enableMotionControls: options.enableMotionControls !== false,
            enableDebugMode: options.enableDebugMode || false,
            maxParticles: options.maxParticles || 500,
            adaptiveQuality: options.adaptiveQuality !== false,
            enableObjectPooling: options.enableObjectPooling !== false,
            ...options
        };

        // Game state
        this.gameState = {
            isRunning: false,
            isPaused: false,
            isInitialized: false,
            currentScene: null,
            gameMode: 'menu', // menu, fishing, paused, gameOver
            score: 0,
            level: 1
        };

        // Performance tracking
        this.performance = {
            fps: 0,
            frameTime: 0,
            lastFrameTime: 0,
            frameCount: 0,
            lastFPSUpdate: 0,
            averageFrameTime: 16.67, // Target ~60fps
            isPerformanceAdaptive: this.options.adaptiveQuality
        };

        // Input systems
        this.inputManager = null;
        this.motionSensorManager = null;
        this.motionPermissionUI = null;

        // Rendering system
        this.renderer = null;
        this.sceneManager = null;

        // Game systems
        this.entityManager = new EntityManager(this.options.enableObjectPooling);
        this.particleSystem = new ParticleSystem(this.options.maxParticles);
        this.audioManager = null;

        // Animation frame management
        this.animationFrameId = null;
        this.lastUpdateTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / this.options.targetFPS;

        console.log('FishingGameCore initialized with options:', this.options);
    }

    /**
     * Initialize the game engine and all systems
     */
    async initialize() {
        try {
            console.log('🎮 [GAME] Initializing Fishing Game Core...');
            console.log('🎮 [GAME] Canvas element:', this.canvas);
            console.log('🎮 [GAME] Canvas context:', this.ctx);
            console.log('🎮 [GAME] Game options:', this.options);
            
            // Setup canvas for optimal mobile performance
            console.log('🎮 [GAME] Setting up canvas...');
            this.setupCanvas();
            console.log('✅ [GAME] Canvas setup complete');
            
            // Initialize core systems
            console.log('🎮 [GAME] Initializing renderer...');
            this.initializeRenderer();
            console.log('✅ [GAME] Renderer initialized');
            
            console.log('🎮 [GAME] Initializing scene manager...');
            this.initializeSceneManager();
            console.log('✅ [GAME] Scene manager initialized');
            
            console.log('🎮 [GAME] Initializing input manager...');
            this.initializeInputManager();
            console.log('✅ [GAME] Input manager initialized');
            
            // Initialize motion controls if enabled
            if (this.options.enableMotionControls) {
                console.log('🎮 [GAME] Initializing motion controls...');
                await this.initializeMotionControls();
                console.log('✅ [GAME] Motion controls initialized');
            } else {
                console.log('⚠️ [GAME] Motion controls disabled');
            }
            
            // Setup resize handling
            console.log('🎮 [GAME] Setting up resize handling...');
            this.setupResizeHandling();
            console.log('✅ [GAME] Resize handling setup complete');
            
            // Initialize audio system
            console.log('🎮 [GAME] Initializing audio system...');
            this.initializeAudioSystem();
            console.log('✅ [GAME] Audio system initialized');
            
            this.gameState.isInitialized = true;
            console.log('✅ [GAME] Fishing Game Core initialized successfully');
            console.log('🎮 [GAME] Final game state:', this.gameState);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ [GAME] Failed to initialize Fishing Game Core:', error);
            console.error('❌ [GAME] Error stack:', error.stack);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup canvas for optimal performance
     */
    setupCanvas() {
        // Set canvas to match device pixel ratio for crisp graphics
        const pixelRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;
        
        this.ctx.scale(pixelRatio, pixelRatio);
        
        // Optimize canvas for mobile performance
        this.ctx.imageSmoothingEnabled = this.options.enableImageSmoothing !== false;
        this.ctx.imageSmoothingQuality = 'low'; // Prioritize performance over quality
        
        console.log(`Canvas initialized: ${this.canvas.width}x${this.canvas.height} (${pixelRatio}x pixel ratio)`);
    }

    /**
     * Initialize the rendering system
     */
    initializeRenderer() {
        console.log('🎮 [RENDERER] Checking GameRenderer class availability...');
        if (typeof GameRenderer === 'undefined') {
            throw new Error('GameRenderer class not found! Make sure gameComponents.js is loaded.');
        }
        
        console.log('🎮 [RENDERER] Creating GameRenderer instance...');
        this.renderer = new GameRenderer(this.ctx, {
            enableDebugMode: this.options.enableDebugMode,
            adaptiveQuality: this.options.adaptiveQuality,
            maxLayers: 5 // Background, water, entities, particles, UI
        });
        
        console.log('✅ [RENDERER] Renderer initialized:', this.renderer);
    }

    /**
     * Initialize scene management
     */
    initializeSceneManager() {
        console.log('🎮 [SCENES] Checking required scene classes...');
        
        // Check for required classes
        const requiredClasses = ['SceneManager', 'MenuScene', 'FishingScene', 'GameOverScene'];
        for (const className of requiredClasses) {
            if (typeof window[className] === 'undefined') {
                throw new Error(`${className} class not found! Make sure all game files are loaded.`);
            }
            console.log(`✅ [SCENES] ${className} class found`);
        }
        
        console.log('🎮 [SCENES] Creating SceneManager instance...');
        this.sceneManager = new SceneManager();
        
        // Register default scenes
        console.log('🎮 [SCENES] Registering menu scene...');
        this.sceneManager.registerScene('menu', new MenuScene(this));
        
        console.log('🎮 [SCENES] Registering fishing scene...');
        this.sceneManager.registerScene('fishing', new FishingScene(this));
        
        console.log('🎮 [SCENES] Registering game over scene...');
        this.sceneManager.registerScene('gameOver', new GameOverScene(this));
        
        // Set initial scene
        console.log('🎮 [SCENES] Setting initial scene to menu...');
        this.sceneManager.setActiveScene('menu');
        this.gameState.currentScene = 'menu';
        
        console.log('✅ [SCENES] Scene manager initialized with active scene:', this.sceneManager.getActiveScene());
    }

    /**
     * Initialize input management
     */
    initializeInputManager() {
        this.inputManager = new InputManager(this.canvas);
        
        // Setup basic touch/mouse controls
        this.inputManager.setupTouchControls();
        this.inputManager.setupKeyboardControls();
        
        console.log('Input manager initialized');
    }

    /**
     * Initialize motion control systems
     */
    async initializeMotionControls() {
        try {
            // Initialize motion sensor manager
            this.motionSensorManager = new MotionSensorManager();
            
            // Initialize permission UI
            this.motionPermissionUI = new MotionPermissionUI();
            this.motionPermissionUI.setMotionSensorManager(this.motionSensorManager);
            
            // Connect to input manager
            this.inputManager.setMotionSensorManager(this.motionSensorManager);
            
            console.log('Motion controls initialized');
            
        } catch (error) {
            console.warn('Motion controls initialization failed:', error);
            this.options.enableMotionControls = false;
        }
    }

    /**
     * Initialize audio system
     */
    initializeAudioSystem() {
        this.audioManager = new GameAudioManager({
            enableSpatialAudio: true,
            maxConcurrentSounds: 8,
            masterVolume: 0.7
        });
        
        console.log('Audio system initialized');
    }

    /**
     * Setup responsive canvas handling
     */
    setupResizeHandling() {
        const resizeHandler = () => {
            this.handleResize();
        };
        
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeHandler, 100); // Delay for orientation change
        });
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        this.setupCanvas();
        
        // Notify renderer of size change
        if (this.renderer) {
            this.renderer.handleResize(this.canvas.width, this.canvas.height);
        }
        
        // Notify current scene of resize
        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene && activeScene.onResize) {
            activeScene.onResize(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Start the game engine
     */
    async start() {
        console.log('🎮 [START] Starting fishing game...');
        
        if (!this.gameState.isInitialized) {
            console.log('🎮 [START] Game not initialized, initializing now...');
            const initResult = await this.initialize();
            if (!initResult.success) {
                throw new Error(`Failed to initialize game: ${initResult.error}`);
            }
        }

        if (this.gameState.isRunning) {
            console.warn('⚠️ [START] Game is already running');
            return;
        }

        console.log('🎮 [START] Setting game state to running...');
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        this.lastUpdateTime = performance.now();
        
        console.log('🎮 [START] Current scene:', this.sceneManager.getActiveScene());
        console.log('🎮 [START] Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        
        // Start the game loop
        console.log('🎮 [START] Starting game loop...');
        this.gameLoop();
        
        console.log('✅ [START] Fishing game started successfully');
    }

    /**
     * Main game loop with fixed timestep
     */
    gameLoop(currentTime = performance.now()) {
        if (!this.gameState.isRunning) return;

        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        
        // Calculate frame time
        const frameTime = currentTime - this.lastUpdateTime;
        this.performance.frameTime = frameTime;
        this.lastUpdateTime = currentTime;

        // Update performance metrics
        this.updatePerformanceMetrics(currentTime, frameTime);

        // Adaptive quality based on performance
        if (this.performance.isPerformanceAdaptive) {
            this.adaptQualitySettings();
        }

        // Fixed timestep updates for consistent game logic
        this.accumulator += frameTime;
        
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }

        // Render with interpolation
        const interpolation = this.accumulator / this.timestep;
        this.render(interpolation);
    }

    /**
     * Update game systems
     */
    update(deltaTime) {
        if (this.gameState.isPaused) return;

        // Update input systems
        this.inputManager.update(deltaTime);

        // Update current scene
        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene) {
            activeScene.update(deltaTime);
        }

        // Update particle system
        this.particleSystem.update(deltaTime);

        // Update entity manager
        this.entityManager.update(deltaTime);
    }

    /**
     * Render game frame
     */
    render(interpolation) {
        // Add frame counter for initial debug (only log first few frames)
        if (!this.frameCounter) this.frameCounter = 0;
        this.frameCounter++;
        
        if (this.frameCounter <= 5) {
            console.log(`🎮 [RENDER] Frame ${this.frameCounter} - Starting render cycle`);
        }
        
        // Clear canvas
        if (this.frameCounter <= 5) {
            console.log('🎮 [RENDER] Clearing canvas...');
        }
        this.renderer.clear();

        // Render current scene
        const activeScene = this.sceneManager.getActiveScene();
        if (this.frameCounter <= 5) {
            console.log('🎮 [RENDER] Active scene:', activeScene);
        }
        
        if (activeScene) {
            if (this.frameCounter <= 5) {
                console.log('🎮 [RENDER] Rendering scene...');
            }
            activeScene.render(this.renderer, interpolation);
        } else {
            if (this.frameCounter <= 5) {
                console.warn('⚠️ [RENDER] No active scene to render!');
            }
        }

        // Render particles
        if (this.particleSystem) {
            this.particleSystem.render(this.renderer);
        }

        // Render debug information
        if (this.options.enableDebugMode) {
            this.renderDebugInfo();
        }
        
        if (this.frameCounter <= 5) {
            console.log(`✅ [RENDER] Frame ${this.frameCounter} render complete`);
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(currentTime, frameTime) {
        this.performance.frameCount++;
        
        // Update FPS every second
        if (currentTime - this.performance.lastFPSUpdate >= 1000) {
            this.performance.fps = this.performance.frameCount;
            this.performance.frameCount = 0;
            this.performance.lastFPSUpdate = currentTime;
        }

        // Update average frame time with exponential smoothing
        const alpha = 0.1;
        this.performance.averageFrameTime = 
            alpha * frameTime + (1 - alpha) * this.performance.averageFrameTime;
    }

    /**
     * Adapt quality settings based on performance
     */
    adaptQualitySettings() {
        const targetFrameTime = 1000 / this.options.targetFPS;
        
        if (this.performance.averageFrameTime > targetFrameTime * 1.5) {
            // Performance is poor, reduce quality
            this.particleSystem.reduceQuality();
            this.renderer.reduceQuality();
        } else if (this.performance.averageFrameTime < targetFrameTime * 0.8) {
            // Performance is good, can increase quality
            this.particleSystem.increaseQuality();
            this.renderer.increaseQuality();
        }
    }

    /**
     * Render debug information
     */
    renderDebugInfo() {
        const debugY = 20;
        const lineHeight = 16;
        let currentY = debugY;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, debugY - 5, 200, 80);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        
        this.ctx.fillText(`FPS: ${this.performance.fps}`, 15, currentY);
        currentY += lineHeight;
        
        this.ctx.fillText(`Frame Time: ${this.performance.frameTime.toFixed(1)}ms`, 15, currentY);
        currentY += lineHeight;
        
        this.ctx.fillText(`Entities: ${this.entityManager.getEntityCount()}`, 15, currentY);
        currentY += lineHeight;
        
        this.ctx.fillText(`Particles: ${this.particleSystem.getActiveCount()}`, 15, currentY);
    }

    /**
     * Pause the game
     */
    pause() {
        this.gameState.isPaused = true;
        console.log('Game paused');
    }

    /**
     * Resume the game
     */
    resume() {
        this.gameState.isPaused = false;
        this.lastUpdateTime = performance.now();
        console.log('Game resumed');
    }

    /**
     * Stop the game
     */
    stop() {
        this.gameState.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('Game stopped');
    }

    /**
     * Request motion sensor permissions
     */
    async requestMotionPermissions() {
        if (!this.motionPermissionUI || !this.motionSensorManager) {
            return { success: false, error: 'Motion controls not available' };
        }

        try {
            const result = await this.motionPermissionUI.showPermissionRequest();
            
            if (result.granted) {
                // Show calibration if needed
                const calibrationResult = await this.motionPermissionUI.showCalibration();
                return { success: true, calibrated: calibrationResult.calibrated };
            } else if (result.skipped) {
                return { success: false, skipped: true };
            }
            
        } catch (error) {
            console.error('Motion permission request failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Change game scene
     */
    changeScene(sceneName) {
        if (this.sceneManager.hasScene(sceneName)) {
            this.sceneManager.setActiveScene(sceneName);
            this.gameState.currentScene = sceneName;
            console.log(`Scene changed to: ${sceneName}`);
        } else {
            console.error(`Scene '${sceneName}' not found`);
        }
    }

    /**
     * Get current game state
     */
    getGameState() {
        return {
            ...this.gameState,
            performance: { ...this.performance },
            motionControlsAvailable: this.motionSensorManager?.getStatus().isInitialized || false
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        console.log('Cleaning up Fishing Game Core...');
        
        this.stop();
        
        // Cleanup systems
        if (this.motionSensorManager) {
            this.motionSensorManager.cleanup();
        }
        
        if (this.motionPermissionUI) {
            this.motionPermissionUI.cleanup();
        }
        
        if (this.inputManager) {
            this.inputManager.cleanup();
        }
        
        if (this.audioManager) {
            this.audioManager.cleanup();
        }
        
        // Clear entity and particle systems
        this.entityManager.cleanup();
        this.particleSystem.cleanup();
        
        console.log('✅ Fishing Game Core cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishingGameCore;
} else {
    window.FishingGameCore = FishingGameCore;
}