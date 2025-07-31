/**
 * Game UI Manager - Handles mobile-optimized button overlays for enhanced fishing gameplay
 * Provides touch-optimized controls for casting, striking, reeling, drag control, and netting
 */

class GameUIManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.ctx = canvas.getContext('2d');
        
        // Button definitions with touch-optimized positioning
        this.buttons = {
            cast: {
                id: 'cast',
                x: 80,
                y: canvas.height - 120,
                radius: 50,
                visible: true,
                enabled: true,
                pressed: false,
                charging: false,
                chargeLevel: 0,
                label: 'CAST',
                color: '#22c55e',
                pressedColor: '#16a34a',
                disabledColor: '#6b7280'
            },
            strike: {
                id: 'strike',
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 60,
                visible: false,
                enabled: false,
                pressed: false,
                urgent: true,
                timeRemaining: 0,
                maxTime: 5000, // 5 seconds
                label: 'STRIKE!',
                color: '#ef4444',
                pressedColor: '#dc2626',
                disabledColor: '#6b7280'
            },
            reel: {
                id: 'reel',
                x: canvas.width - 80,
                y: canvas.height - 120,
                radius: 40,
                visible: false,
                enabled: false,
                pressed: false,
                canReel: true,
                label: 'REEL',
                color: '#3b82f6',
                pressedColor: '#2563eb',
                disabledColor: '#6b7280'
            },
            net: {
                id: 'net',
                x: canvas.width / 2,
                y: canvas.height - 80,
                radius: 45,
                visible: false,
                enabled: false,
                pressed: false,
                label: 'NET',
                color: '#f59e0b',
                pressedColor: '#d97706',
                disabledColor: '#6b7280'
            }
        };
        
        // Drag control slider (left thumb)
        this.dragSlider = {
            x: 40,
            y: canvas.height / 2 - 100,
            width: 30,
            height: 200,
            visible: false,
            enabled: false,
            value: 0.5, // 0-1 range
            isDragging: false,
            label: 'DRAG',
            color: '#8b5cf6',
            trackColor: '#e5e7eb',
            thumbColor: '#ffffff'
        };
        
        // Touch tracking
        this.activeTouches = new Map();
        this.touchStartTime = new Map();
        
        // UI state
        this.currentPhase = 'idle'; // idle, casting, fighting, striking, netting
        
        // Callbacks for button interactions
        this.callbacks = new Map();
        
        // Initialize touch event handlers
        this.initializeTouchEvents();
        
        console.log('GameUIManager initialized');
    }
    
    /**
     * Initialize touch event handlers for mobile controls
     */
    initializeTouchEvents() {
        // Prevent default touch behaviors on canvas
        this.canvas.style.touchAction = 'none';
        
        // Touch start handler
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });
        
        // Touch move handler  
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });
        
        // Touch end handler
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
        
        // Mouse events for desktop testing
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    /**
     * Handle touch start events
     */
    handleTouchStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const touchId = touch.identifier;
            
            // Check button touches
            for (const [buttonId, button] of Object.entries(this.buttons)) {
                if (this.isPointInButton(touchX, touchY, button)) {
                    if (button.visible && button.enabled) {
                        button.pressed = true;
                        this.activeTouches.set(touchId, buttonId);
                        this.touchStartTime.set(touchId, Date.now());
                        
                        // Handle button-specific logic
                        this.handleButtonPress(buttonId);
                        
                        // Trigger haptic feedback if available
                        if (navigator.vibrate) {
                            navigator.vibrate(50);
                        }
                    }
                    return;
                }
            }
            
            // Check drag slider touch
            if (this.isPointInDragSlider(touchX, touchY)) {
                if (this.dragSlider.visible && this.dragSlider.enabled) {
                    this.dragSlider.isDragging = true;
                    this.activeTouches.set(touchId, 'dragSlider');
                    this.updateDragSlider(touchY);
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                }
            }
        }
    }
    
    /**
     * Handle touch move events
     */
    handleTouchMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const touchId = touch.identifier;
            
            const activeElement = this.activeTouches.get(touchId);
            
            if (activeElement === 'dragSlider' && this.dragSlider.isDragging) {
                this.updateDragSlider(touchY);
            } else if (activeElement === 'cast' && this.buttons.cast.charging) {
                // Update cast charge based on touch duration
                const pressDuration = Date.now() - this.touchStartTime.get(touchId);
                this.updateCastCharge(pressDuration);
            }
        }
    }
    
    /**
     * Handle touch end events
     */
    handleTouchEnd(e) {
        // Get list of ended touches
        const endedTouches = [];
        for (let i = 0; i < e.changedTouches.length; i++) {
            endedTouches.push(e.changedTouches[i].identifier);
        }
        
        endedTouches.forEach(touchId => {
            const activeElement = this.activeTouches.get(touchId);
            
            if (activeElement && this.buttons[activeElement]) {
                const button = this.buttons[activeElement];
                button.pressed = false;
                
                // Handle button release
                this.handleButtonRelease(activeElement, touchId);
            } else if (activeElement === 'dragSlider') {
                this.dragSlider.isDragging = false;
            }
            
            this.activeTouches.delete(touchId);
            this.touchStartTime.delete(touchId);
        });
    }
    
    /**
     * Handle mouse events for desktop testing
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Simulate touch event
        const mockTouch = {
            touches: [{
                identifier: 0,
                clientX: e.clientX,
                clientY: e.clientY
            }],
            preventDefault: () => e.preventDefault()
        };
        
        this.handleTouchStart(mockTouch);
    }
    
    handleMouseMove(e) {
        if (this.activeTouches.size > 0) {
            const mockTouch = {
                touches: [{
                    identifier: 0,
                    clientX: e.clientX,
                    clientY: e.clientY
                }],
                preventDefault: () => e.preventDefault()
            };
            
            this.handleTouchMove(mockTouch);
        }
    }
    
    handleMouseUp(e) {
        const mockTouch = {
            changedTouches: [{
                identifier: 0
            }],
            preventDefault: () => e.preventDefault()
        };
        
        this.handleTouchEnd(mockTouch);
    }
    
    /**
     * Check if point is within button bounds
     */
    isPointInButton(x, y, button) {
        if (!button.visible) return false;
        const dx = x - button.x;
        const dy = y - button.y;
        return (dx * dx + dy * dy) <= (button.radius * button.radius);
    }
    
    /**
     * Check if point is within drag slider bounds
     */
    isPointInDragSlider(x, y) {
        if (!this.dragSlider.visible) return false;
        return x >= this.dragSlider.x - this.dragSlider.width / 2 &&
               x <= this.dragSlider.x + this.dragSlider.width / 2 &&
               y >= this.dragSlider.y &&
               y <= this.dragSlider.y + this.dragSlider.height;
    }
    
    /**
     * Handle button press events
     */
    handleButtonPress(buttonId) {
        switch (buttonId) {
            case 'cast':
                if (this.currentPhase === 'idle') {
                    this.buttons.cast.charging = true;
                    this.buttons.cast.chargeLevel = 0;
                    this.triggerCallback('castStart');
                }
                break;
                
            case 'strike':
                if (this.currentPhase === 'striking') {
                    this.triggerCallback('strikeAttempt');
                }
                break;
                
            case 'reel':
                if (this.currentPhase === 'fighting' && this.buttons.reel.canReel) {
                    this.triggerCallback('reelStart');
                }
                break;
                
            case 'net':
                if (this.currentPhase === 'netting') {
                    this.triggerCallback('netAttempt');
                }
                break;
        }
    }
    
    /**
     * Handle button release events
     */
    handleButtonRelease(buttonId, touchId) {
        switch (buttonId) {
            case 'cast':
                if (this.buttons.cast.charging) {
                    this.buttons.cast.charging = false;
                    const pressDuration = Date.now() - this.touchStartTime.get(touchId);
                    this.triggerCallback('castRelease', { 
                        chargeLevel: this.buttons.cast.chargeLevel,
                        duration: pressDuration
                    });
                    this.buttons.cast.chargeLevel = 0;
                }
                break;
                
            case 'reel':
                if (this.currentPhase === 'fighting') {
                    this.triggerCallback('reelStop');
                }
                break;
        }
    }
    
    /**
     * Update cast charge based on hold duration
     */
    updateCastCharge(duration) {
        // Charge builds over 3 seconds to maximum
        const maxChargeDuration = 3000;
        this.buttons.cast.chargeLevel = Math.min(duration / maxChargeDuration, 1.0);
        
        // Trigger momentum building callback
        this.triggerCallback('castCharging', { 
            chargeLevel: this.buttons.cast.chargeLevel,
            duration: duration
        });
    }
    
    /**
     * Update drag slider value
     */
    updateDragSlider(touchY) {
        const relativeY = touchY - this.dragSlider.y;
        const clampedY = Math.max(0, Math.min(this.dragSlider.height, relativeY));
        this.dragSlider.value = 1.0 - (clampedY / this.dragSlider.height); // Invert so top = 1, bottom = 0
        
        this.triggerCallback('dragChanged', { value: this.dragSlider.value });
    }
    
    /**
     * Set UI phase and update button visibility
     */
    setPhase(phase) {
        console.log(`UI Phase changed: ${this.currentPhase} -> ${phase}`);
        this.currentPhase = phase;
        
        // Reset all buttons
        Object.values(this.buttons).forEach(button => {
            button.visible = false;
            button.enabled = false;
            button.pressed = false;
        });
        this.dragSlider.visible = false;
        this.dragSlider.enabled = false;
        
        // Configure buttons for current phase
        switch (phase) {
            case 'idle':
                this.buttons.cast.visible = true;
                this.buttons.cast.enabled = true;
                break;
                
            case 'casting':
                // No buttons during cast animation
                break;
                
            case 'waiting':
                // Line is in water, waiting for bite
                break;
                
            case 'striking':
                this.buttons.strike.visible = true;
                this.buttons.strike.enabled = true;
                this.buttons.strike.timeRemaining = this.buttons.strike.maxTime;
                break;
                
            case 'fighting':
                this.buttons.reel.visible = true;
                this.buttons.reel.enabled = true;
                this.dragSlider.visible = true;
                this.dragSlider.enabled = true;
                break;
                
            case 'netting':
                this.buttons.net.visible = true;
                this.buttons.net.enabled = true;
                break;
        }
    }
    
    /**
     * Update strike timer
     */
    updateStrikeTimer(deltaTime) {
        if (this.currentPhase === 'striking' && this.buttons.strike.visible) {
            this.buttons.strike.timeRemaining -= deltaTime;
            
            if (this.buttons.strike.timeRemaining <= 0) {
                this.triggerCallback('strikeMissed');
                this.setPhase('idle'); // Reset to idle if strike missed
            }
        }
    }
    
    /**
     * Set reel button availability based on line tension
     */
    setReelAvailable(canReel) {
        this.buttons.reel.canReel = canReel;
        this.buttons.reel.color = canReel ? '#3b82f6' : '#6b7280';
    }
    
    /**
     * Register callback for UI events
     */
    registerCallback(eventType, callback) {
        if (!this.callbacks.has(eventType)) {
            this.callbacks.set(eventType, []);
        }
        this.callbacks.get(eventType).push(callback);
    }
    
    /**
     * Trigger callback for UI events
     */
    triggerCallback(eventType, data = {}) {
        if (this.callbacks.has(eventType)) {
            this.callbacks.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`UI callback error for ${eventType}:`, error);
                }
            });
        }
    }
    
    /**
     * Update UI elements (called from game loop)
     */
    update(deltaTime) {
        // Update strike timer
        this.updateStrikeTimer(deltaTime);
        
        // Update any animations or time-based UI elements
        if (this.buttons.cast.charging) {
            // Cast charge visual feedback happens in render
        }
    }
    
    /**
     * Render all UI elements
     */
    render() {
        // Save context state
        this.ctx.save();
        
        // Render drag slider
        if (this.dragSlider.visible) {
            this.renderDragSlider();
        }
        
        // Render buttons
        Object.values(this.buttons).forEach(button => {
            if (button.visible) {
                this.renderButton(button);
            }
        });
        
        // Restore context state
        this.ctx.restore();
    }
    
    /**
     * Render a button
     */
    renderButton(button) {
        const ctx = this.ctx;
        
        // Determine button color
        let fillColor = button.color;
        if (!button.enabled) {
            fillColor = button.disabledColor;
        } else if (button.pressed) {
            fillColor = button.pressedColor;
        }
        
        // Draw button background
        ctx.beginPath();
        ctx.arc(button.x, button.y, button.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        
        // Draw button border
        ctx.beginPath();
        ctx.arc(button.x, button.y, button.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw button label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(button.label, button.x, button.y);
        
        // Special rendering for specific buttons
        if (button.id === 'cast' && button.charging) {
            this.renderCastCharge(button);
        } else if (button.id === 'strike') {
            this.renderStrikeTimer(button);
        }
    }
    
    /**
     * Render cast charge indicator
     */
    renderCastCharge(button) {
        const ctx = this.ctx;
        const chargeRadius = button.radius + 10;
        
        // Draw charge ring
        ctx.beginPath();
        ctx.arc(button.x, button.y, chargeRadius, -Math.PI / 2, 
                -Math.PI / 2 + (Math.PI * 2 * button.chargeLevel));
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Draw momentum indicator
        if (button.chargeLevel > 0.8) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
            ctx.beginPath();
            ctx.arc(button.x, button.y, button.radius + 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Render strike timer
     */
    renderStrikeTimer(button) {
        const ctx = this.ctx;
        const progress = button.timeRemaining / button.maxTime;
        const timerRadius = button.radius + 15;
        
        // Draw timer ring (decreasing)
        ctx.beginPath();
        ctx.arc(button.x, button.y, timerRadius, -Math.PI / 2, 
                -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = progress > 0.3 ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Draw urgency pulse effect
        if (progress < 0.5) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(button.x, button.y, button.radius + 25, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Render drag slider
     */
    renderDragSlider() {
        const ctx = this.ctx;
        const slider = this.dragSlider;
        
        // Draw slider track
        ctx.fillStyle = slider.trackColor;
        ctx.fillRect(slider.x - slider.width / 2, slider.y, slider.width, slider.height);
        
        // Draw slider fill (bottom to current value)
        const fillHeight = slider.height * slider.value;
        const fillY = slider.y + slider.height - fillHeight;
        ctx.fillStyle = slider.color;
        ctx.fillRect(slider.x - slider.width / 2, fillY, slider.width, fillHeight);
        
        // Draw slider thumb
        const thumbY = slider.y + slider.height - (slider.height * slider.value);
        ctx.beginPath();
        ctx.arc(slider.x, thumbY, 15, 0, Math.PI * 2);
        ctx.fillStyle = slider.thumbColor;
        ctx.fill();
        ctx.strokeStyle = slider.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw slider label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(slider.label, slider.x, slider.y - 15);
        
        // Draw value percentage
        const percentage = Math.round(slider.value * 100);
        ctx.fillText(`${percentage}%`, slider.x, slider.y + slider.height + 20);
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Remove event listeners
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        
        // Clear callbacks and touch tracking
        this.callbacks.clear();
        this.activeTouches.clear();
        this.touchStartTime.clear();
        
        console.log('GameUIManager cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUIManager;
} else {
    window.GameUIManager = GameUIManager;
}