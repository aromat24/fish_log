class FishingGameMenuScene {
    constructor() {
        this.engine = null;
        this.menuItems = [
            { id: 'quick-fish', text: 'Quick Fish', action: () => this.startQuickFish() },
            { id: 'locations', text: 'Choose Location', action: () => this.showLocations() },
            { id: 'fish-guide', text: 'Fish Guide', action: () => this.showFishGuide() },
            { id: 'achievements', text: 'Achievements', action: () => this.showAchievements() }
        ];
        this.selectedIndex = 0;
        this.animationTime = 0;
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 5;
        
        // Menu state
        this.isInitialized = false;
        this.backgroundGradient = null;
    }
    
    init() {
        try {
            console.log('🎮 Initializing Menu Scene...');
            this.createBackgroundGradient();
            this.isInitialized = true;
            console.log('✅ Menu Scene initialized');
            
        } catch (error) {
            this.handleError('Menu scene initialization failed', error);
        }
    }
    
    enter() {
        try {
            console.log('🎬 Entering Menu Scene');
            this.selectedIndex = 0;
            this.animationTime = 0;
            
            // Update game status
            this.updateGameStatus('Ready to Fish!');
            
            // Set up input listeners
            this.setupInputListeners();
            
        } catch (error) {
            this.handleError('Menu scene enter failed', error);
        }
    }
    
    exit() {
        try {
            console.log('🎬 Exiting Menu Scene');
            this.removeInputListeners();
            
        } catch (error) {
            this.handleError('Menu scene exit failed', error);
        }
    }
    
    setupInputListeners() {
        try {
            if (!this.engine?.inputManager?.canvas) {
                console.warn('⚠️ Input manager not available for menu');
                return;
            }
            
            const canvas = this.engine.inputManager.canvas;
            
            // Add touch/click listeners
            canvas.addEventListener('fishing-game-tap', this.handleTap.bind(this));
            canvas.addEventListener('fishing-game-drag', this.handleDrag.bind(this));
            
            console.log('✅ Menu input listeners setup');
            
        } catch (error) {
            this.handleError('Setup input listeners failed', error);
        }
    }
    
    removeInputListeners() {
        try {
            if (!this.engine?.inputManager?.canvas) return;
            
            const canvas = this.engine.inputManager.canvas;
            canvas.removeEventListener('fishing-game-tap', this.handleTap.bind(this));
            canvas.removeEventListener('fishing-game-drag', this.handleDrag.bind(this));
            
            console.log('🧹 Menu input listeners removed');
            
        } catch (error) {
            this.handleError('Remove input listeners failed', error);
        }
    }
    
    handleTap(event) {
        try {
            const { pointer } = event.detail;
            const menuItem = this.getMenuItemAtPosition(pointer.x, pointer.y);
            
            if (menuItem) {
                this.selectMenuItem(menuItem.index);
                this.activateMenuItem(menuItem.index);
                
                // Visual feedback
                this.showTouchFeedback(pointer.x, pointer.y);
            }
            
        } catch (error) {
            this.handleError('Menu tap handling failed', error);
        }
    }
    
    handleDrag(event) {
        try {
            const { currentPointer } = event.detail;
            const menuItem = this.getMenuItemAtPosition(currentPointer.x, currentPointer.y);
            
            if (menuItem && menuItem.index !== this.selectedIndex) {
                this.selectMenuItem(menuItem.index);
            }
            
        } catch (error) {
            this.handleError('Menu drag handling failed', error);
        }
    }
    
    getMenuItemAtPosition(x, y) {
        try {
            if (!this.engine?.canvas) return null;
            
            const canvas = this.engine.canvas;
            const centerX = canvas.width / 2;
            const startY = canvas.height / 2 - (this.menuItems.length * 30);
            const itemHeight = 60;
            const itemWidth = 200;
            
            for (let i = 0; i < this.menuItems.length; i++) {
                const itemY = startY + (i * itemHeight);
                
                if (x >= centerX - itemWidth / 2 && 
                    x <= centerX + itemWidth / 2 &&
                    y >= itemY && 
                    y <= itemY + itemHeight - 10) {
                    return { index: i, item: this.menuItems[i] };
                }
            }
            
            return null;
            
        } catch (error) {
            this.handleError('Get menu item at position failed', error);
            return null;
        }
    }
    
    selectMenuItem(index) {
        try {
            if (index >= 0 && index < this.menuItems.length) {
                this.selectedIndex = index;
                console.log(`🎯 Selected menu item: ${this.menuItems[index].text}`);
            }
            
        } catch (error) {
            this.handleError('Select menu item failed', error);
        }
    }
    
    activateMenuItem(index) {
        try {
            if (index >= 0 && index < this.menuItems.length) {
                const menuItem = this.menuItems[index];
                console.log(`🎯 Activating menu item: ${menuItem.text}`);
                
                if (typeof menuItem.action === 'function') {
                    menuItem.action();
                } else {
                    console.warn(`⚠️ No action defined for menu item: ${menuItem.text}`);
                }
            }
            
        } catch (error) {
            this.handleError('Activate menu item failed', error);
        }
    }
    
    showTouchFeedback(x, y) {
        try {
            if (!this.engine?.canvas?.parentElement) return;
            
            const container = this.engine.canvas.parentElement;
            const feedback = document.createElement('div');
            feedback.className = 'game-touch-feedback';
            feedback.style.left = x + 'px';
            feedback.style.top = y + 'px';
            
            container.appendChild(feedback);
            
            // Remove after animation
            setTimeout(() => {
                if (feedback.parentElement) {
                    feedback.parentElement.removeChild(feedback);
                }
            }, 600);
            
        } catch (error) {
            this.handleError('Show touch feedback failed', error);
        }
    }
    
    createBackgroundGradient() {
        try {
            if (!this.engine?.ctx) return;
            
            const ctx = this.engine.ctx;
            const canvas = this.engine.canvas;
            
            this.backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            this.backgroundGradient.addColorStop(0, '#87CEEB'); // Sky blue
            this.backgroundGradient.addColorStop(0.3, '#4682B4'); // Steel blue
            this.backgroundGradient.addColorStop(0.7, '#191970'); // Midnight blue
            this.backgroundGradient.addColorStop(1, '#000080'); // Navy
            
        } catch (error) {
            this.handleError('Create background gradient failed', error);
        }
    }
    
    update(deltaTime) {
        try {
            this.animationTime += deltaTime * 0.001; // Convert to seconds
            
        } catch (error) {
            this.handleError('Menu scene update failed', error);
        }
    }
    
    render(ctx) {
        try {
            if (!ctx || !this.isInitialized) return;
            
            const canvas = this.engine.canvas;
            
            // Clear and draw background
            this.drawBackground(ctx, canvas);
            
            // Draw title
            this.drawTitle(ctx, canvas);
            
            // Draw menu items
            this.drawMenuItems(ctx, canvas);
            
            // Draw footer info
            this.drawFooter(ctx, canvas);
            
        } catch (error) {
            this.handleError('Menu scene render failed', error);
        }
    }
    
    drawBackground(ctx, canvas) {
        try {
            // Fill with gradient background
            if (this.backgroundGradient) {
                ctx.fillStyle = this.backgroundGradient;
            } else {
                ctx.fillStyle = '#4682B4';
            }
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add animated water effect
            this.drawWaterEffect(ctx, canvas);
            
        } catch (error) {
            this.handleError('Draw background failed', error);
        }
    }
    
    drawWaterEffect(ctx, canvas) {
        try {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Draw animated waves
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const waveY = canvas.height * 0.8 + i * 20;
                const waveSpeed = 0.5 + i * 0.2;
                
                for (let x = 0; x <= canvas.width; x += 10) {
                    const y = waveY + Math.sin((x + this.animationTime * 50 * waveSpeed) * 0.02) * 10;
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
            
            ctx.restore();
            
        } catch (error) {
            this.handleError('Draw water effect failed', error);
        }
    }
    
    drawTitle(ctx, canvas) {
        try {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 2;
            ctx.textAlign = 'center';
            ctx.font = 'bold 32px Arial';
            
            const titleY = canvas.height * 0.2;
            ctx.fillText('🎣 Fishing Game', canvas.width / 2, titleY);
            
            // Subtitle
            ctx.font = '16px Arial';
            ctx.fillStyle = '#e0e0e0';
            ctx.fillText('Catch fish and learn about marine life!', canvas.width / 2, titleY + 40);
            
            ctx.restore();
            
        } catch (error) {
            this.handleError('Draw title failed', error);
        }
    }
    
    drawMenuItems(ctx, canvas) {
        try {
            ctx.save();
            
            const centerX = canvas.width / 2;
            const startY = canvas.height / 2 - (this.menuItems.length * 30);
            const itemHeight = 60;
            
            this.menuItems.forEach((item, index) => {
                const itemY = startY + (index * itemHeight);
                const isSelected = index === this.selectedIndex;
                
                // Item background
                if (isSelected) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(centerX - 100, itemY - 5, 200, 40);
                }
                
                // Item text
                ctx.fillStyle = isSelected ? '#ffffff' : '#e0e0e0';
                ctx.font = isSelected ? 'bold 18px Arial' : '16px Arial';
                ctx.textAlign = 'center';
                
                // Add selection glow effect
                if (isSelected) {
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowBlur = 0;
                }
                
                ctx.fillText(item.text, centerX, itemY + 20);
            });
            
            ctx.restore();
            
        } catch (error) {
            this.handleError('Draw menu items failed', error);
        }
    }
    
    drawFooter(ctx, canvas) {
        try {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            
            const footerY = canvas.height - 30;
            ctx.fillText('Touch to select • Integrated with your fishing logbook', canvas.width / 2, footerY);
            
            ctx.restore();
            
        } catch (error) {
            this.handleError('Draw footer failed', error);
        }
    }
    
    // Menu action methods
    startQuickFish() {
        try {
            console.log('🎣 Starting Quick Fish...');
            this.updateGameStatus('Starting fishing session...');
            
            // TODO: Transition to casting scene
            if (this.engine && typeof this.engine.setScene === 'function') {
                // For now, just show a placeholder message
                this.updateGameStatus('Quick Fish mode coming soon!');
                setTimeout(() => {
                    this.updateGameStatus('Ready to Fish!');
                }, 2000);
            }
            
        } catch (error) {
            this.handleError('Start quick fish failed', error);
        }
    }
    
    showLocations() {
        try {
            console.log('🗺️ Showing locations...');
            this.updateGameStatus('Choose your fishing location...');
            
            // TODO: Implement location selection
            setTimeout(() => {
                this.updateGameStatus('Location selection coming soon!');
                setTimeout(() => {
                    this.updateGameStatus('Ready to Fish!');
                }, 2000);
            }, 500);
            
        } catch (error) {
            this.handleError('Show locations failed', error);
        }
    }
    
    showFishGuide() {
        try {
            console.log('📚 Showing fish guide...');
            this.updateGameStatus('Loading fish species guide...');
            
            // TODO: Show fish guide using existing fish database
            setTimeout(() => {
                this.updateGameStatus('Fish guide coming soon!');
                setTimeout(() => {
                    this.updateGameStatus('Ready to Fish!');
                }, 2000);
            }, 500);
            
        } catch (error) {
            this.handleError('Show fish guide failed', error);
        }
    }
    
    showAchievements() {
        try {
            console.log('🏆 Showing achievements...');
            this.updateGameStatus('Loading achievements...');
            
            // TODO: Implement achievements system
            setTimeout(() => {
                this.updateGameStatus('Achievements coming soon!');
                setTimeout(() => {
                    this.updateGameStatus('Ready to Fish!');
                }, 2000);
            }, 500);
            
        } catch (error) {
            this.handleError('Show achievements failed', error);
        }
    }
    
    updateGameStatus(message) {
        try {
            const statusElement = document.getElementById('game-status-text');
            if (statusElement) {
                statusElement.textContent = message;
            }
            
        } catch (error) {
            this.handleError('Update game status failed', error);
        }
    }
    
    // Error handling
    handleError(message, error) {
        this.errorCount++;
        
        console.error(`🚨 Menu Scene Error: ${message}`, error);
        
        if (window.errorHandler) {
            window.errorHandler.logError(
                new Error(`Menu Scene: ${message}`),
                'FishingGameMenuScene.handleError',
                { originalError: error, errorCount: this.errorCount }
            );
        }
        
        // Graceful degradation
        if (this.errorCount > this.maxErrors) {
            console.warn('⚠️ Too many menu errors, attempting recovery');
            this.isInitialized = false;
            this.errorCount = Math.floor(this.maxErrors / 2);
        }
    }
    
    // Public methods
    isHealthy() {
        return this.isInitialized && this.errorCount < this.maxErrors;
    }
    
    reset() {
        try {
            this.selectedIndex = 0;
            this.animationTime = 0;
            this.errorCount = 0;
            console.log('🔄 Menu scene reset');
            
        } catch (error) {
            console.error('Menu scene reset failed:', error);
        }
    }
}

// Export to global scope
window.FishingGameMenuScene = FishingGameMenuScene;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishingGameMenuScene;
}