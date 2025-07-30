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
        // This would be expanded with proper input handling
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
        
        // Game state
        this.gameState = {
            isCasting: false,
            isReeling: false,
            lineInWater: false,
            fishHooked: false,
            currentCatch: null,
            score: 0,
            timeRemaining: 60000 // 1 minute
        };
        
        // UI elements
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
        
        console.log('Fishing scene entered');
    }

    onExit() {
        super.onExit();
        
        // Clean up input handlers
        this.cleanupInputHandlers();
        
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

    spawnFish() {
        const fishCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < fishCount; i++) {
            this.fish.push({
                x: Math.random() * this.game.canvas.width,
                y: this.water.level + 50 + Math.random() * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 0.5,
                size: 10 + Math.random() * 20,
                type: Math.random() > 0.7 ? 'rare' : 'common',
                color: Math.random() > 0.5 ? '#FFD700' : '#FF6B6B',
                isHooked: false,
                biteChance: 0.01 + Math.random() * 0.02
            });
        }
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

    handleReeling(data) {
        if (!this.gameState.lineInWater) return;

        this.gameState.isReeling = true;
        this.ui.reelIndicator.visible = true;
        this.ui.reelIndicator.speed = data.speed;

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
                this.ui.powerMeter.visible = false;
                
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

        // Add to score
        const points = this.gameState.currentCatch.type === 'rare' ? 100 : 50;
        this.gameState.score += points;

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
        
        this.ui.instructions = `Nice catch! +${points} points. Cast again!`;
        
        // Respawn fish
        setTimeout(() => {
            this.spawnFish();
        }, 2000);
    }

    logVirtualCatch(fish) {
        // Log to separate game storage only (NEVER mix with real catches)
        const virtualCatch = {
            species: fish.type === 'rare' ? 'Golden Trout' : 'Bass',
            length: Math.round(fish.size * 2), // Convert size to cm
            weight: Math.round(fish.size * 0.1 * 100) / 100, // Convert to kg
            gameScore: this.gameState.score,
            motionAccuracy: Math.random() * 0.3 + 0.7, // Simulated accuracy between 70-100%
            gameDifficulty: 'normal',
            timeToLand: Math.round(Math.random() * 15) + 5, // 5-20 seconds
            baitUsed: 'Virtual Worm',
            weatherCondition: 'Sunny',
            waterDepth: Math.floor(Math.random() * 50) + 10,
            gameMetrics: {
                castAccuracy: Math.random() * 0.4 + 0.6, // 60-100%
                reelingConsistency: Math.random() * 0.3 + 0.7, // 70-100%
                totalGameTime: Math.floor(Date.now() / 1000) % 3600, // Game time in seconds
                sensorDataQuality: 'good'
            }
        };

        console.log('Virtual catch logged:', virtualCatch);
        
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
        this.fishingLine.isVisible = false;
        this.fishingLine.endX = this.player.x;
        this.fishingLine.endY = this.player.y - 20;
        this.gameState.lineInWater = false;
        this.gameState.fishHooked = false;
        this.gameState.currentCatch = null;
        this.gameState.isReeling = false;
        this.ui.reelIndicator.visible = false;
        this.ui.instructions = 'Cast your line to fish again!';
    }

    update(deltaTime) {
        // Update fish AI
        this.updateFish(deltaTime);
        
        // Check for fish bites
        if (this.gameState.lineInWater && !this.gameState.fishHooked) {
            this.checkForBites();
        }
        
        // Update water waves
        this.updateWater(deltaTime);
        
        // Update game timer
        this.gameState.timeRemaining -= deltaTime;
        if (this.gameState.timeRemaining <= 0) {
            this.game.changeScene('gameOver');
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
                fish.isHooked = true;
                
                this.ui.instructions = 'Fish on the line! Start reeling!';
                
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

        // Draw UI
        this.renderUI(renderer);
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
}