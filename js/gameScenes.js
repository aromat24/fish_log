/**
 * Game Scenes - Different scenes for the fishing game
 * Includes Menu, Fishing, and Game Over scenes
 */

/**
 * Menu Scene - Main menu and game selection
 */
class MenuScene extends BaseScene {
    constructor(game) {
        super(game);
        this.menuItems = [
            { text: 'Start Fishing', action: 'startGame' },
            { text: 'Motion Settings', action: 'motionSettings' },
            { text: 'Back to Log', action: 'backToLog' }
        ];
        this.selectedIndex = 0;
        this.motionControlsAvailable = false;
    }

    onEnter() {
        super.onEnter();
        
        // Check if motion controls are available
        this.motionControlsAvailable = this.game.motionSensorManager && 
            this.game.motionSensorManager.getStatus().isInitialized;
        
        console.log('Menu scene entered');
    }

    update(deltaTime) {
        // Handle input for menu navigation
        if (this.game.inputManager) {
            const inputState = this.game.inputManager.getInputState();
            
            // Handle keyboard navigation
            if (inputState.keyboard.keys.has('ArrowUp')) {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            } else if (inputState.keyboard.keys.has('ArrowDown')) {
                this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
            } else if (inputState.keyboard.keys.has('Enter') || inputState.keyboard.keys.has('Space')) {
                this.handleMenuSelection();
            }
        }
    }

    handleMenuSelection() {
        const selectedItem = this.menuItems[this.selectedIndex];
        
        switch (selectedItem.action) {
            case 'startGame':
                this.game.changeScene('fishing');
                break;
            case 'motionSettings':
                this.showSettingsModal();
                break;
            case 'backToLog':
                // Exit game and return to main app
                if (window.fishingGameIntegration) {
                    window.fishingGameIntegration.exitGame();
                }
                break;
        }
    }

    showSettingsModal() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[2000]';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 class="text-xl font-bold mb-4">Game Settings</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Master Volume</label>
                        <input type="range" id="master-volume" min="0" max="1" step="0.1" 
                               value="${this.game.audioManager ? this.game.audioManager.options.masterVolume : 0.7}"
                               class="w-full">
                        <span id="volume-display" class="text-sm text-gray-600">70%</span>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Motion Sensitivity</label>
                        <input type="range" id="motion-sensitivity" min="0.1" max="2.0" step="0.1" 
                               value="${this.game.inputManager ? this.game.inputManager.reelingConfig.sensitivity : 0.7}"
                               class="w-full">
                        <span id="sensitivity-display" class="text-sm text-gray-600">70%</span>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="audio-enabled" 
                               ${this.game.audioManager ? 'checked' : ''} 
                               class="mr-2">
                        <label for="audio-enabled" class="text-sm">Enable Audio</label>
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 mt-6">
                    <button id="cancel-settings" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                    <button id="save-settings" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event handlers
        const volumeSlider = modal.querySelector('#master-volume');
        const volumeDisplay = modal.querySelector('#volume-display');
        const sensitivitySlider = modal.querySelector('#motion-sensitivity');
        const sensitivityDisplay = modal.querySelector('#sensitivity-display');

        volumeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            volumeDisplay.textContent = Math.round(value * 100) + '%';
            if (this.game.audioManager) {
                this.game.audioManager.setMasterVolume(value);
            }
        });

        sensitivitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            sensitivityDisplay.textContent = Math.round(value * 100) + '%';
        });

        modal.querySelector('#cancel-settings').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#save-settings').addEventListener('click', () => {
            // Save settings
            const volume = parseFloat(volumeSlider.value);
            const sensitivity = parseFloat(sensitivitySlider.value);
            const audioEnabled = modal.querySelector('#audio-enabled').checked;

            if (this.game.audioManager) {
                this.game.audioManager.setMasterVolume(volume);
            }

            if (this.game.inputManager) {
                this.game.inputManager.setMotionSensitivity(sensitivity);
            }

            // Save to local storage
            const settings = {
                masterVolume: volume,
                motionSensitivity: sensitivity,
                audioEnabled: audioEnabled
            };
            localStorage.setItem('fishingGameSettings', JSON.stringify(settings));

            console.log('Settings saved:', settings);
            modal.remove();
        });

        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    render(renderer, interpolation) {
        const ctx = renderer.ctx;
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Clear with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(1, '#4682B4'); // Steel blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        renderer.drawText('🎣 Fish Now!', centerX, centerY - 100, {
            font: 'bold 32px Arial',
            color: '#ffffff',
            align: 'center'
        });

        // Draw menu items
        this.menuItems.forEach((item, index) => {
            const y = centerY + (index - 1) * 50;
            const isSelected = index === this.selectedIndex;
            const color = isSelected ? '#ffff00' : '#ffffff';
            const font = isSelected ? 'bold 18px Arial' : '16px Arial';

            renderer.drawText(item.text, centerX, y, {
                font: font,
                color: color,
                align: 'center'
            });
        });

        // Draw motion controls status
        const statusText = this.motionControlsAvailable ? 
            '📱 Motion Controls: Enabled' : 
            '📱 Motion Controls: Unavailable (Touch Controls)';
        
        renderer.drawText(statusText, centerX, centerY + 150, {
            font: '14px Arial',
            color: '#ffffff',
            align: 'center'
        });

        // Draw instructions
        renderer.drawText('Tap to start or use Space key', centerX, canvas.height - 30, {
            font: '12px Arial',
            color: '#ffffff',
            align: 'center'
        });
    }
}

/**
 * Fishing Scene - Main gameplay scene
 */
class FishingScene extends BaseScene {
    constructor(game) {
        super(game);
        
        // Game objects
        this.player = null;
        this.fishingLine = null;
        this.fish = [];
        this.water = null;
        
        // Species mapper for realistic fish
        this.speciesMapper = null;
        
        // Enhanced UI Manager
        this.uiManager = null;
        
        // Game state
        this.gameState = {
            isCasting: false,
            isReeling: false,
            lineInWater: false,
            fishHooked: false,
            currentCatch: null,
            score: 0,
            timeRemaining: 60000, // 1 minute
            currentPhase: 'idle' // idle, casting, waiting, striking, fighting, netting
        };
        
        // UI elements (legacy - some still used)
        this.ui = {
            powerMeter: { visible: false, power: 0 },
            reelIndicator: { visible: false, speed: 0 },
            instructions: 'Cast your line to start fishing!'
        };
    }

    onEnter() {
        super.onEnter();
        
        // Initialize game objects
        this.initializeGameObjects();
        
        // Setup input callbacks
        this.setupInputHandlers();
        
        // Initialize species mapper
        this.initializeSpeciesMapper();
        
        // Initialize enhanced UI manager
        this.initializeUIManager();
        
        // Initialize audio for this scene
        this.currentReelSound = null;
        
        // Preload audio if available
        if (this.game.audioManager && !this.game.audioManager.isInitialized) {
            this.game.audioManager.initialize().then(() => {
                console.log('Audio initialized for fishing scene');
            }).catch(error => {
                console.warn('Audio initialization failed:', error);
            });
        }
        
        console.log('Fishing scene entered');
    }

    onExit() {
        super.onExit();
        
        // Clean up input handlers
        this.cleanupInputHandlers();
        
        // Stop any active audio
        if (this.currentReelSound && this.game.audioManager) {
            this.game.audioManager.stopSound(this.currentReelSound);
            this.currentReelSound = null;
        }
        
        // Cleanup UI manager
        if (this.uiManager) {
            this.uiManager.cleanup();
            this.uiManager = null;
        }
        
        console.log('Fishing scene exited');
    }

    initializeGameObjects() {
        // Initialize player
        this.player = {
            x: this.game.canvas.width / 2,
            y: this.game.canvas.height - 100,
            rodAngle: 0,
            isAnimating: false
        };

        // Initialize fishing line
        this.fishingLine = {
            startX: this.player.x,
            startY: this.player.y - 20,
            endX: this.player.x,
            endY: this.player.y - 20,
            segments: [],
            isVisible: false,
            tension: 0
        };

        // Initialize water
        this.water = {
            level: this.game.canvas.height - 200,
            waves: [],
            color: 'rgba(64, 164, 223, 0.8)'
        };

        // Generate water waves
        for (let i = 0; i < this.game.canvas.width; i += 20) {
            this.water.waves.push({
                x: i,
                amplitude: 5 + Math.random() * 5,
                frequency: 0.02 + Math.random() * 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Spawn some fish
        this.spawnFish();
    }

    initializeSpeciesMapper() {
        // Initialize species mapper with fish database
        if (window.fishDB && window.GameSpeciesMapper) {
            this.speciesMapper = new window.GameSpeciesMapper(window.fishDB);
            console.log('Species mapper initialized for realistic fishing');
        } else {
            console.warn('Fish database or GameSpeciesMapper not available, using fallback fish types');
        }
    }
    
    initializeUIManager() {
        // Initialize enhanced UI manager
        if (window.GameUIManager) {
            this.uiManager = new window.GameUIManager(this.game.canvas, this.game);
            
            // Register UI event callbacks
            this.uiManager.registerCallback('castStart', () => this.handleUICastStart());
            this.uiManager.registerCallback('castCharging', (data) => this.handleUICastCharging(data));
            this.uiManager.registerCallback('castRelease', (data) => this.handleUICastRelease(data));
            this.uiManager.registerCallback('strikeAttempt', () => this.handleUIStrikeAttempt());
            this.uiManager.registerCallback('strikeMissed', () => this.handleUIStrikeMissed());
            this.uiManager.registerCallback('reelStart', () => this.handleUIReelStart());
            this.uiManager.registerCallback('reelStop', () => this.handleUIReelStop());
            this.uiManager.registerCallback('dragChanged', (data) => this.handleUIDragChanged(data));
            this.uiManager.registerCallback('netAttempt', () => this.handleUINetAttempt());
            
            // Set initial phase
            this.uiManager.setPhase('idle');
            this.gameState.currentPhase = 'idle';
            
            console.log('Enhanced UI Manager initialized');
        } else {
            console.warn('GameUIManager not available, using fallback UI');
        }
    }

    spawnFish() {
        const fishCount = 5 + Math.floor(Math.random() * 5);
        this.fish = []; // Clear existing fish
        
        for (let i = 0; i < fishCount; i++) {
            // Determine fish rarity (common: 60%, rare: 35%, legendary: 5%)
            let gameType = 'common';
            const rarity = Math.random();
            if (rarity > 0.95) {
                gameType = 'legendary';
            } else if (rarity > 0.6) {
                gameType = 'rare';
            }
            
            // Get realistic species data
            let speciesData = null;
            if (this.speciesMapper && this.speciesMapper.initialized) {
                const species = this.speciesMapper.getRandomSpecies(gameType, 'lake');
                speciesData = this.speciesMapper.generateRealisticCatch(species, rarity);
            }
            
            // Create fish with enhanced properties
            const fish = {
                x: Math.random() * this.game.canvas.width,
                y: this.water.level + 50 + Math.random() * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 0.5,
                // Use realistic size or fallback
                size: speciesData ? Math.max(10, speciesData.length * 0.8) : (10 + Math.random() * 20),
                // Enhanced properties from species data
                type: gameType,
                speciesData: speciesData,
                species: speciesData ? speciesData.species : (gameType === 'rare' ? 'Golden Trout' : 'Bass'),
                length: speciesData ? speciesData.length : Math.round((10 + Math.random() * 20) * 2),
                weight: speciesData ? speciesData.weight : Math.round((10 + Math.random() * 20) * 0.1 * 100) / 100,
                edible: speciesData ? speciesData.edible : true,
                difficulty: speciesData ? speciesData.difficulty : (gameType === 'rare' ? 0.7 : 0.3),
                fightingStyle: speciesData ? speciesData.fightingStyle : 'moderate',
                // Visual properties
                color: this.getFishColor(gameType, speciesData),
                isHooked: false,
                biteChance: this.calculateBiteChance(gameType, speciesData)
            };
            
            this.fish.push(fish);
        }
        
        console.log(`Spawned ${fishCount} fish:`, this.fish.map(f => `${f.species} (${f.type})`));
    }
    
    getFishColor(gameType, speciesData) {
        if (speciesData && speciesData.rarity) {
            switch (speciesData.rarity) {
                case 'legendary': return '#9D4EDD'; // Purple for legendary
                case 'rare': return '#FFD700'; // Gold for rare
                default: return '#4A90E2'; // Blue for common
            }
        }
        
        // Fallback colors
        switch (gameType) {
            case 'legendary': return '#9D4EDD';
            case 'rare': return '#FFD700';
            default: return '#4A90E2';
        }
    }
    
    calculateBiteChance(gameType, speciesData) {
        let baseChance = 0.015; // 1.5% base chance
        
        if (speciesData && speciesData.difficulty) {
            // Higher difficulty = lower bite chance
            baseChance *= (1.2 - speciesData.difficulty);
        } else {
            // Fallback based on type
            switch (gameType) {
                case 'legendary': baseChance *= 0.3; break;
                case 'rare': baseChance *= 0.6; break;
                default: baseChance *= 1.0; break;
            }
        }
        
        return Math.max(0.005, Math.min(0.03, baseChance + Math.random() * 0.01));
    }

    setupInputHandlers() {
        if (this.game.inputManager) {
            this.castHandler = (data) => this.handleCast(data);
            this.reelingHandler = (data) => this.handleReeling(data);
            this.touchHandler = (data) => this.handleTouch(data);

            this.game.inputManager.registerCallback('castDetected', this.castHandler);
            this.game.inputManager.registerCallback('reeling', this.reelingHandler);
            this.game.inputManager.registerCallback('touchStart', this.touchHandler);
        }
    }

    cleanupInputHandlers() {
        if (this.game.inputManager) {
            this.game.inputManager.unregisterCallback('castDetected', this.castHandler);
            this.game.inputManager.unregisterCallback('reeling', this.reelingHandler);
            this.game.inputManager.unregisterCallback('touchStart', this.touchHandler);
        }
    }

    handleCast(data) {
        if (this.gameState.isCasting || this.gameState.lineInWater) return;

        console.log('Cast detected in fishing scene:', data);

        this.gameState.isCasting = true;
        this.ui.powerMeter.visible = true;
        this.ui.powerMeter.power = data.power;

        // Calculate cast distance based on power
        const castDistance = data.power * 200 + 100;
        const castAngle = -45; // degrees

        // Animate fishing line cast
        this.animateCast(castDistance, castAngle);

        // Update UI
        this.ui.instructions = 'Line cast! Wait for a bite...';
    }
    
    // Enhanced UI event handlers
    handleUICastStart() {
        console.log('UI Cast started - building momentum');
        this.ui.instructions = 'Hold and move device back and forth to build momentum!';
    }
    
    handleUICastCharging(data) {
        // Visual feedback for momentum building
        this.ui.powerMeter.visible = true;
        this.ui.powerMeter.power = data.chargeLevel;
        
        // Update instruction based on charge level
        if (data.chargeLevel > 0.8) {
            this.ui.instructions = 'Perfect momentum! Release to cast!';
        } else if (data.chargeLevel > 0.5) {
            this.ui.instructions = 'Good momentum building...';
        }
    }
    
    handleUICastRelease(data) {
        if (this.gameState.isCasting || this.gameState.lineInWater) return;
        
        console.log('UI Cast released:', data);
        
        // Set casting phase
        this.gameState.isCasting = true;
        this.gameState.currentPhase = 'casting';
        if (this.uiManager) {
            this.uiManager.setPhase('casting');
        }
        
        // Calculate cast distance based on charge level and duration
        const power = Math.max(0.3, data.chargeLevel); // Minimum 30% power
        const castDistance = power * 250 + 100; // Enhanced distance calculation
        const castAngle = -45;
        
        // Animate fishing line cast
        this.animateCast(castDistance, castAngle);
        
        this.ui.instructions = 'Line cast! Wait for a bite...';
    }
    
    handleUIStrikeAttempt() {
        console.log('UI Strike attempted');
        
        // Check if fish is still hooked and within strike window
        if (this.gameState.fishHooked && this.gameState.currentCatch) {
            // Success - transition to fighting phase
            this.gameState.currentPhase = 'fighting';
            if (this.uiManager) {
                this.uiManager.setPhase('fighting');
            }
            
            this.ui.instructions = 'Fish hooked! Use reel button and drag control to land it!';
            
            // Play hook sound
            if (this.game.audioManager) {
                this.game.audioManager.playCatchSound();
            }
        } else {
            // Failed strike
            this.handleUIStrikeMissed();
        }
    }
    
    handleUIStrikeMissed() {
        console.log('UI Strike missed - fish escaped');
        
        // Reset to idle state
        this.resetLine();
        this.gameState.currentPhase = 'idle';
        if (this.uiManager) {
            this.uiManager.setPhase('idle');
        }
        
        this.ui.instructions = 'Strike missed! Fish escaped. Cast again!';
    }
    
    handleUIReelStart() {
        console.log('UI Reel started');
        
        if (this.gameState.currentPhase === 'fighting') {
            this.gameState.isReeling = true;
            
            // Play reeling sound
            if (this.game.audioManager && !this.currentReelSound) {
                this.currentReelSound = this.game.audioManager.playReelSound(0.7);
            }
        }
    }
    
    handleUIReelStop() {
        console.log('UI Reel stopped');
        
        this.gameState.isReeling = false;
        
        // Stop reeling sound
        if (this.currentReelSound && this.game.audioManager) {
            this.game.audioManager.stopSound(this.currentReelSound);
            this.currentReelSound = null;
        }
    }
    
    handleUIDragChanged(data) {
        console.log('UI Drag changed:', data.value);
        
        // Store drag value for line tension calculations
        this.dragPressure = data.value;
        
        // Update reel availability based on drag (placeholder logic)
        const canReel = data.value < 0.8; // Can't reel if drag is too high
        if (this.uiManager) {
            this.uiManager.setReelAvailable(canReel);
        }
    }
    
    handleUINetAttempt() {
        console.log('UI Net attempted');
        
        if (this.gameState.currentPhase === 'netting' && this.gameState.currentCatch) {
            // Success - complete the catch
            this.catchFish();
        }
    }

    handleReeling(data) {
        if (!this.gameState.lineInWater) return;

        this.gameState.isReeling = true;
        this.ui.reelIndicator.visible = true;
        this.ui.reelIndicator.speed = data.speed;

        // Play reeling sound
        if (this.game.audioManager && !this.currentReelSound) {
            this.currentReelSound = this.game.audioManager.playReelSound(data.speed);
        }

        // If fish is hooked, reel it in
        if (this.gameState.fishHooked && this.gameState.currentCatch) {
            this.reelInFish(data.speed);
        } else {
            // Just reeling in empty line
            this.reelInLine(data.speed);
        }

        this.ui.instructions = 'Reeling in...';
    }

    handleTouch(data) {
        // Handle touch input for alternative controls
        if (!this.gameState.lineInWater && !this.gameState.isCasting) {
            // Simulate cast with touch
            this.handleCast({ power: 0.7, simulated: true });
        }
    }

    animateCast(distance, angle) {
        const endX = this.player.x + Math.cos(angle * Math.PI / 180) * distance;
        const endY = Math.max(this.water.level + 20, this.player.y + Math.sin(angle * Math.PI / 180) * distance);

        // Play cast sound with power-based intensity
        if (this.game.audioManager) {
            const power = this.ui.powerMeter.power;
            this.game.audioManager.playCastSound(power);
        }

        // Animate line to target position
        const animationDuration = 1000; // 1 second
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            // Easing function for realistic cast motion
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.fishingLine.endX = this.player.x + (endX - this.player.x) * easeOut;
            this.fishingLine.endY = this.player.y + (endY - this.player.y) * easeOut;
            this.fishingLine.isVisible = true;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Cast complete
                this.gameState.isCasting = false;
                this.gameState.lineInWater = true;
                this.gameState.currentPhase = 'waiting';
                this.ui.powerMeter.visible = false;
                
                // Update UI phase
                if (this.uiManager) {
                    this.uiManager.setPhase('waiting');
                }
                
                // Play splash sound when line hits water
                if (this.game.audioManager) {
                    const intensity = this.ui.powerMeter.power * 0.8 + 0.2; // 0.2 to 1.0
                    this.game.audioManager.playSplashSound(intensity);
                }
                
                // Create splash effect
                this.game.particleSystem.emit({
                    x: this.fishingLine.endX,
                    y: this.fishingLine.endY,
                    count: 20,
                    type: 'splash',
                    vx: 0,
                    vy: -50,
                    size: 3,
                    life: 1000,
                    color: '#ffffff'
                });
            }
        };

        animate();
    }

    reelInFish(speed) {
        if (!this.gameState.currentCatch) return;

        // Move fish towards player
        const dx = this.player.x - this.gameState.currentCatch.x;
        const dy = this.player.y - this.gameState.currentCatch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 50) {
            const moveSpeed = speed * 2;
            this.gameState.currentCatch.x += (dx / distance) * moveSpeed;
            this.gameState.currentCatch.y += (dy / distance) * moveSpeed;
            
            // Update fishing line end position
            this.fishingLine.endX = this.gameState.currentCatch.x;
            this.fishingLine.endY = this.gameState.currentCatch.y;
        } else {
            // Fish caught!
            this.catchFish();
        }
    }

    reelInLine(speed) {
        // Reel in empty line
        const dx = this.player.x - this.fishingLine.endX;
        const dy = this.player.y - this.fishingLine.endY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 30) {
            const moveSpeed = speed * 3;
            this.fishingLine.endX += (dx / distance) * moveSpeed;
            this.fishingLine.endY += (dy / distance) * moveSpeed;
        } else {
            // Line reeled in
            this.resetLine();
        }
    }

    catchFish() {
        if (!this.gameState.currentCatch) return;

        // Calculate points based on rarity and difficulty
        let points = 50; // Base points
        const fish = this.gameState.currentCatch;
        
        switch (fish.type) {
            case 'legendary':
                points = 200;
                break;
            case 'rare':
                points = 100;
                break;
            default:
                points = 50;
        }
        
        // Bonus points for difficulty
        if (fish.difficulty && fish.difficulty > 0.5) {
            points += Math.round(points * (fish.difficulty - 0.5));
        }
        
        this.gameState.score += points;

        // Play success sound
        if (this.game.audioManager) {
            this.game.audioManager.playCatchSound();
        }

        // Stop reeling sound if playing
        if (this.currentReelSound && this.game.audioManager) {
            this.game.audioManager.stopSound(this.currentReelSound);
            this.currentReelSound = null;
        }

        // Create celebration particles
        this.game.particleSystem.emit({
            x: this.player.x,
            y: this.player.y,
            count: 30,
            type: 'celebration',
            vx: 0,
            vy: -100,
            size: 4,
            life: 2000,
            color: '#FFD700'
        });

        // Log the catch (integrate with main app)
        this.logVirtualCatch(this.gameState.currentCatch);

        // Reset fishing state
        this.resetLine();
        
        // Show species-specific celebration message
        const fish = this.gameState.currentCatch;
        let celebrationMsg = `Nice catch! +${points} points`;
        
        if (fish.species && fish.species !== 'Bass') {
            celebrationMsg = `${fish.species} caught! +${points} points`;
        }
        
        if (fish.type === 'legendary') {
            celebrationMsg = `🌟 LEGENDARY ${fish.species}! +${points} points! 🌟`;
        } else if (fish.type === 'rare') {
            celebrationMsg = `✨ Rare ${fish.species}! +${points} points! ✨`;
        }
        
        this.ui.instructions = celebrationMsg;
        
        // Respawn fish
        setTimeout(() => {
            this.spawnFish();
        }, 2000);
    }

    logVirtualCatch(fish) {
        // Use realistic species data if available
        const virtualCatch = {
            species: fish.species || (fish.type === 'rare' ? 'Golden Trout' : 'Bass'),
            length: fish.length || Math.round(fish.size * 2), // Use realistic length or fallback
            weight: fish.weight || Math.round(fish.size * 0.1 * 100) / 100, // Use realistic weight or fallback
            edible: fish.edible !== undefined ? fish.edible : true,
            rarity: fish.type,
            difficulty: fish.difficulty || (fish.type === 'rare' ? 0.7 : 0.3),
            fightingStyle: fish.fightingStyle || 'moderate',
            gameScore: this.gameState.score,
            motionAccuracy: Math.random() * 0.3 + 0.7, // Simulated accuracy between 70-100%
            gameDifficulty: fish.difficulty ? (fish.difficulty > 0.6 ? 'hard' : 'normal') : 'normal',
            timeToLand: Math.round(Math.random() * 15) + 5, // 5-20 seconds
            baitUsed: 'Virtual Worm',
            weatherCondition: 'Sunny',
            waterDepth: Math.floor(Math.random() * 50) + 10,
            habitat: fish.speciesData ? fish.speciesData.habitat : 'lake',
            gameMetrics: {
                castAccuracy: Math.random() * 0.4 + 0.6, // 60-100%
                reelingConsistency: Math.random() * 0.3 + 0.7, // 70-100%
                totalGameTime: Math.floor(Date.now() / 1000) % 3600, // Game time in seconds
                sensorDataQuality: 'good',
                speciesMapper: this.speciesMapper ? 'enabled' : 'disabled'
            }
        };

        console.log('Virtual catch logged with realistic data:', virtualCatch);
        
        // Use GameLogManager for separate storage
        if (window.gameLogManager) {
            try {
                window.gameLogManager.addGameCatch(virtualCatch);
                console.log('✅ Virtual catch saved to game log successfully');
            } catch (error) {
                console.error('❌ Failed to save virtual catch to game log:', error);
            }
        } else {
            console.warn('⚠️ GameLogManager not available - virtual catch not saved');
        }
        
        // Trigger integration layer event (for UI updates, notifications, etc.)
        if (window.logVirtualCatch) {
            window.logVirtualCatch(virtualCatch);
        }
    }

    resetLine() {
        // Stop any active reeling sound
        if (this.currentReelSound && this.game.audioManager) {
            this.game.audioManager.stopSound(this.currentReelSound);
            this.currentReelSound = null;
        }

        this.fishingLine.isVisible = false;
        this.fishingLine.endX = this.player.x;
        this.fishingLine.endY = this.player.y - 20;
        this.gameState.lineInWater = false;
        this.gameState.fishHooked = false;
        this.gameState.currentCatch = null;
        this.gameState.isReeling = false;
        this.gameState.currentPhase = 'idle';
        this.ui.reelIndicator.visible = false;
        this.ui.instructions = 'Cast your line to fish again!';
        
        // Reset UI to idle phase
        if (this.uiManager) {
            this.uiManager.setPhase('idle');
        }
    }

    update(deltaTime) {
        // Update enhanced UI manager
        if (this.uiManager) {
            this.uiManager.update(deltaTime);
        }
        
        // Update fish AI
        this.updateFish(deltaTime);
        
        // Check for fish bites
        if (this.gameState.lineInWater && !this.gameState.fishHooked && this.gameState.currentPhase === 'waiting') {
            this.checkForBites();
        }
        
        // Update fish fighting mechanics
        if (this.gameState.currentPhase === 'fighting' && this.gameState.currentCatch) {
            this.updateFishFighting(deltaTime);
        }
        
        // Update water waves
        this.updateWater(deltaTime);
        
        // Update game timer
        this.gameState.timeRemaining -= deltaTime;
        if (this.gameState.timeRemaining <= 0) {
            this.game.changeScene('gameOver');
        }
    }
    
    updateFishFighting(deltaTime) {
        if (!this.gameState.currentCatch) return;
        
        const fish = this.gameState.currentCatch;
        
        // Simple fish proximity check for netting
        const dx = this.player.x - fish.x;
        const dy = this.player.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If fish is close enough and being reeled, show net option
        if (distance < 80 && this.gameState.isReeling && this.gameState.currentPhase === 'fighting') {
            this.gameState.currentPhase = 'netting';
            if (this.uiManager) {
                this.uiManager.setPhase('netting');
            }
            this.ui.instructions = 'Fish is close! Use NET button to land it!';
        }
        
        // Simple fish movement towards player when reeling
        if (this.gameState.isReeling && distance > 50) {
            const moveSpeed = 1.0;
            fish.x += (dx / distance) * moveSpeed;
            fish.y += (dy / distance) * moveSpeed;
            
            // Update fishing line
            this.fishingLine.endX = fish.x;
            this.fishingLine.endY = fish.y;
        }
    }

    updateFish(deltaTime) {
        this.fish.forEach(fish => {
            if (fish.isHooked) return;

            // Simple AI movement
            fish.x += fish.vx;
            fish.y += fish.vy;

            // Bounce off boundaries
            if (fish.x < 0 || fish.x > this.game.canvas.width) {
                fish.vx *= -1;
            }
            if (fish.y < this.water.level + 20 || fish.y > this.game.canvas.height - 50) {
                fish.vy *= -1;
            }

            // Random direction changes
            if (Math.random() < 0.01) {
                fish.vx += (Math.random() - 0.5) * 0.5;
                fish.vy += (Math.random() - 0.5) * 0.2;
                
                // Limit speed
                fish.vx = Math.max(-2, Math.min(2, fish.vx));
                fish.vy = Math.max(-1, Math.min(1, fish.vy));
            }
        });
    }

    checkForBites() {
        const hookX = this.fishingLine.endX;
        const hookY = this.fishingLine.endY;

        for (const fish of this.fish) {
            const distance = Math.sqrt(
                (fish.x - hookX) ** 2 + (fish.y - hookY) ** 2
            );

            if (distance < 30 && Math.random() < fish.biteChance) {
                // Fish bites!
                this.gameState.fishHooked = true;
                this.gameState.currentCatch = fish;
                this.gameState.currentPhase = 'striking';
                fish.isHooked = true;
                
                // Update UI to strike phase
                if (this.uiManager) {
                    this.uiManager.setPhase('striking');
                }
                
                // Play bite sound
                if (this.game.audioManager) {
                    this.game.audioManager.playBiteSound();
                }
                
                this.ui.instructions = 'Fish bite detected! Hit STRIKE button quickly!';
                
                // Create bite effect
                this.game.particleSystem.emit({
                    x: hookX,
                    y: hookY,
                    count: 10,
                    type: 'bubble',
                    vx: 0,
                    vy: -30,
                    size: 2,
                    life: 1500,
                    color: '#87CEEB'
                });
                
                break;
            }
        }
    }

    updateWater(deltaTime) {
        const time = Date.now() * 0.001;
        
        this.water.waves.forEach(wave => {
            wave.currentY = this.water.level + 
                Math.sin(time * wave.frequency + wave.phase) * wave.amplitude;
        });
    }

    render(renderer, interpolation) {
        const ctx = renderer.ctx;
        const canvas = ctx.canvas;

        // Draw sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.water.level);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F6FF');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, this.water.level);

        // Draw water
        ctx.fillStyle = this.water.color;
        ctx.fillRect(0, this.water.level, canvas.width, canvas.height - this.water.level);

        // Draw water waves
        ctx.strokeStyle = '#5BA3D4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.water.waves.length - 1; i++) {
            const wave = this.water.waves[i];
            const nextWave = this.water.waves[i + 1];
            
            if (i === 0) {
                ctx.moveTo(wave.x, wave.currentY);
            }
            
            const cpX = (wave.x + nextWave.x) / 2;
            const cpY = (wave.currentY + nextWave.currentY) / 2;
            ctx.quadraticCurveTo(wave.x, wave.currentY, cpX, cpY);
        }
        
        ctx.stroke();

        // Draw player
        renderer.drawCircle(this.player.x, this.player.y, 15, '#8B4513', true);
        renderer.drawText('🎣', this.player.x - 10, this.player.y + 5, {
            font: '20px Arial'
        });

        // Draw fishing line
        if (this.fishingLine.isVisible) {
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.fishingLine.startX, this.fishingLine.startY);
            ctx.lineTo(this.fishingLine.endX, this.fishingLine.endY);
            ctx.stroke();

            // Draw hook
            renderer.drawCircle(this.fishingLine.endX, this.fishingLine.endY, 3, '#C0C0C0', true);
        }

        // Draw fish
        this.fish.forEach(fish => {
            const color = fish.isHooked ? '#FF0000' : fish.color;
            renderer.drawCircle(fish.x, fish.y, fish.size / 2, color, true);
            
            // Draw fish eye
            renderer.drawCircle(fish.x + fish.size / 4, fish.y - fish.size / 4, 2, '#000000', true);
        });

        // Draw legacy UI
        this.renderUI(renderer);
        
        // Draw enhanced UI overlay
        if (this.uiManager) {
            this.uiManager.render();
        }
    }

    renderUI(renderer) {
        const canvas = renderer.ctx.canvas;

        // Draw score
        renderer.drawText(`Score: ${this.gameState.score}`, 20, 30, {
            font: 'bold 18px Arial',
            color: '#ffffff'
        });

        // Draw timer
        const timeLeft = Math.ceil(this.gameState.timeRemaining / 1000);
        renderer.drawText(`Time: ${timeLeft}s`, canvas.width - 100, 30, {
            font: 'bold 18px Arial',
            color: timeLeft < 10 ? '#FF0000' : '#ffffff'
        });

        // Draw instructions
        renderer.drawText(this.ui.instructions, canvas.width / 2, 60, {
            font: '16px Arial',
            color: '#ffffff',
            align: 'center'
        });

        // Draw power meter
        if (this.ui.powerMeter.visible) {
            const meterX = canvas.width / 2 - 50;
            const meterY = canvas.height - 80;
            const meterWidth = 100;
            const meterHeight = 20;

            // Background
            renderer.drawRect(meterX, meterY, meterWidth, meterHeight, '#333333');
            
            // Power bar
            const powerWidth = meterWidth * this.ui.powerMeter.power;
            const powerColor = this.ui.powerMeter.power > 0.8 ? '#FF0000' : 
                              this.ui.powerMeter.power > 0.5 ? '#FFFF00' : '#00FF00';
            renderer.drawRect(meterX, meterY, powerWidth, meterHeight, powerColor);

            renderer.drawText('Cast Power', meterX + meterWidth / 2, meterY - 10, {
                font: '14px Arial',
                color: '#ffffff',
                align: 'center'
            });
        }

        // Draw reel indicator
        if (this.ui.reelIndicator.visible) {
            const indicatorX = canvas.width - 120;
            const indicatorY = canvas.height - 80;
            
            renderer.drawText(`Reel Speed: ${(this.ui.reelIndicator.speed * 100).toFixed(0)}%`, 
                indicatorX, indicatorY, {
                font: '14px Arial',
                color: '#ffffff'
            });
        }
    }
}

/**
 * Game Over Scene - Show results and return options
 */
class GameOverScene extends BaseScene {
    constructor(game) {
        super(game);
        this.finalScore = 0;
        this.fishCaught = 0;
    }

    onEnter() {
        super.onEnter();
        
        // Get final game stats
        const fishingScene = this.game.sceneManager.scenes.get('fishing');
        if (fishingScene) {
            this.finalScore = fishingScene.gameState.score;
            this.fishCaught = Math.floor(this.finalScore / 50); // Rough estimate
        }
        
        console.log('Game Over scene entered');
    }

    render(renderer, interpolation) {
        const ctx = renderer.ctx;
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        renderer.drawText('Game Over!', centerX, centerY - 80, {
            font: 'bold 32px Arial',
            color: '#ffffff',
            align: 'center'
        });

        // Stats
        renderer.drawText(`Final Score: ${this.finalScore}`, centerX, centerY - 20, {
            font: 'bold 20px Arial',
            color: '#FFD700',
            align: 'center'
        });

        renderer.drawText(`Fish Caught: ${this.fishCaught}`, centerX, centerY + 20, {
            font: '18px Arial',
            color: '#ffffff',
            align: 'center'
        });

        // Instructions
        renderer.drawText('Tap to play again or press ESC to return to log', centerX, centerY + 80, {
            font: '14px Arial',
            color: '#ffffff',
            align: 'center'
        });
    }
}

// Make scene classes available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MenuScene, FishingScene, GameOverScene };
} else {
    window.MenuScene = MenuScene;
    window.FishingScene = FishingScene;
    window.GameOverScene = GameOverScene;
    
    console.log('✅ [GAMESCENES] All scene classes exported globally:', {
        MenuScene: !!window.MenuScene,
        FishingScene: !!window.FishingScene,
        GameOverScene: !!window.GameOverScene
    });
}