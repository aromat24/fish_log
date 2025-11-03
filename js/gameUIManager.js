/**
 * Game UI Manager - Handles mobile-optimized button overlays for enhanced fishing gameplay
 * Provides touch-optimized controls for casting, striking, reeling, drag control, and netting
 */

class GameUIManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.ctx = canvas.getContext('2d');

        // Get safe area insets (for notched phones)
        this.safeArea = this.calculateSafeArea();

        // CRITICAL: Use clientWidth/clientHeight for CSS dimensions
        // canvas.width/height are scaled by DPR and DO NOT represent visible screen area
        // All UI positioning MUST use CSS dimensions (clientWidth/clientHeight)

        // Initialize button structures (positions will be set by updateLayout)
        this.buttons = {
            cast: {
                id: 'cast',
                x: 0, y: 0, // Will be set by updateLayout
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
                x: 0, y: 0, // Will be set by updateLayout
                radius: 60,
                visible: false,
                enabled: false,
                pressed: false,
                urgent: true,
                timeRemaining: 0,
                maxTime: 5000,
                label: 'STRIKE!',
                color: '#ef4444',
                pressedColor: '#dc2626',
                disabledColor: '#6b7280'
            },
            reel: {
                id: 'reel',
                x: 0, y: 0, // Will be set by updateLayout
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
                x: 0, y: 0, // Will be set by updateLayout
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
            x: 0, y: 0, // Will be set by updateLayout
            width: 30,
            height: 200,
            visible: false,
            enabled: false,
            value: 0.5,
            isDragging: false,
            label: 'DRAG',
            color: '#8b5cf6',
            trackColor: '#e5e7eb',
            thumbColor: '#ffffff'
        };

        // Circular reel wheel control (right side)
        this.reelWheel = {
            x: 0, y: 0, // Will be set by updateLayout
            radius: 60,
            innerRadius: 20,
            visible: false,
            enabled: false,
            rotation: 0,
            lastAngle: 0,
            isDragging: false,
            reelingSpeed: 0,
            totalRotation: 0,
            label: 'REEL',
            color: '#dc2626',
            accentColor: '#991b1b',
            handleColor: '#ffffff',
            indicatorColor: '#fbbf24',
            segments: 8,
            lastHapticAngle: 0,
            hapticThreshold: Math.PI / 4
        };

        // Tension gauges (top of screen)
        this.tensionGauges = {
            visible: false,
            x: 0, y: 0, // Will be set by updateLayout
            width: 0, // Will be set by updateLayout
            height: 60,
            rod: { value: 0, max: 0.8, color: '#fbbf24', label: 'ROD' },
            line: { value: 0, max: 1.0, color: '#ef4444', label: 'LINE' },
            reel: { value: 0, max: 0.9, color: '#3b82f6', label: 'REEL' }
        };

        // Fish fight indicators
        this.fightIndicators = {
            visible: false,
            fishStamina: { value: 1.0, max: 1.0, label: 'FISH' },
            lineLength: { value: 50, max: 100, label: 'DISTANCE' },
            x: 0, y: 0, // Will be set by updateLayout
            width: 150,
            height: 40
        };

        // Touch tracking
        this.activeTouches = new Map();
        this.touchStartTime = new Map();

        // UI state
        this.currentPhase = 'idle';

        // Callbacks for button interactions
        this.callbacks = new Map();

        // Calculate initial layout
        this.updateLayout();

        // Initialize touch event handlers
        this.initializeTouchEvents();

        console.log('GameUIManager initialized with CSS dimensions:', this.canvas.clientWidth, 'x', this.canvas.clientHeight);
        console.log('Safe area insets:', this.safeArea);
    }

    /**
     * Calculate safe area insets for notched phones
     */
    calculateSafeArea() {
        // Try to get safe area insets from CSS environment variables
        const getEnvValue = (varName) => {
            const style = getComputedStyle(document.documentElement);
            const value = style.getPropertyValue(varName).trim();
            return value ? parseInt(value) : 0;
        };

        return {
            top: getEnvValue('--safe-area-inset-top') || 0,
            right: getEnvValue('--safe-area-inset-right') || 0,
            bottom: getEnvValue('--safe-area-inset-bottom') || 0,
            left: getEnvValue('--safe-area-inset-left') || 0
        };
    }

    /**
     * Update UI element positions based on current canvas CSS dimensions
     * CRITICAL: This MUST be called whenever canvas size changes
     */
    updateLayout() {
        // CRITICAL: Use clientWidth/clientHeight (CSS dimensions), NOT width/height (scaled by DPR)
        const cssWidth = this.canvas.clientWidth;
        const cssHeight = this.canvas.clientHeight;

        console.log('📱 [UI] Updating layout for CSS dimensions:', cssWidth, 'x', cssHeight);

        // Update button positions
        this.buttons.cast.x = 80 + this.safeArea.left;
        this.buttons.cast.y = cssHeight - 120 - this.safeArea.bottom;

        this.buttons.strike.x = cssWidth / 2;
        this.buttons.strike.y = cssHeight / 2;

        this.buttons.reel.x = cssWidth - 80 - this.safeArea.right;
        this.buttons.reel.y = cssHeight - 120 - this.safeArea.bottom;

        this.buttons.net.x = cssWidth / 2;
        this.buttons.net.y = cssHeight - 80 - this.safeArea.bottom;

        // DEBUG: Log button positions
        console.log('🎯 [LAYOUT] Strike button positioned at:', this.buttons.strike.x.toFixed(1), this.buttons.strike.y.toFixed(1), 'radius:', this.buttons.strike.radius);
        console.log('🎯 [LAYOUT] Cast button positioned at:', this.buttons.cast.x.toFixed(1), this.buttons.cast.y.toFixed(1), 'radius:', this.buttons.cast.radius);

        // Update drag slider position
        this.dragSlider.x = 40 + this.safeArea.left;
        this.dragSlider.y = cssHeight / 2 - 100;

        // Update reel wheel position
        this.reelWheel.x = cssWidth - 100 - this.safeArea.right;
        this.reelWheel.y = cssHeight - 150 - this.safeArea.bottom;

        // Update tension gauges position
        this.tensionGauges.x = cssWidth / 2;
        this.tensionGauges.y = 40 + this.safeArea.top;
        this.tensionGauges.width = Math.min(cssWidth - 40 - this.safeArea.left - this.safeArea.right, 400);

        // Update fight indicators position
        this.fightIndicators.x = 20 + this.safeArea.left;
        this.fightIndicators.y = cssHeight - 60 - this.safeArea.bottom;

        console.log('✅ [UI] Layout updated - Timer position:', this.buttons.strike.x, this.buttons.strike.y);
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

            console.log('🎯 [TOUCH] Touch at CSS coords:', touchX.toFixed(1), touchY.toFixed(1));

            // Check button touches
            for (const [buttonId, button] of Object.entries(this.buttons)) {
                if (button.visible) {
                    const dx = touchX - button.x;
                    const dy = touchY - button.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    console.log(`🎯 [TOUCH] ${buttonId}: pos(${button.x.toFixed(1)},${button.y.toFixed(1)}) radius:${button.radius} dist:${distance.toFixed(1)} visible:${button.visible} enabled:${button.enabled}`);
                }

                if (this.isPointInButton(touchX, touchY, button)) {
                    if (button.visible && button.enabled) {
                        console.log(`✅ [TOUCH] Hit ${buttonId}!`);
                        button.pressed = true;
                        this.activeTouches.set(touchId, buttonId);
                        this.touchStartTime.set(touchId, Date.now());

                        // Handle button-specific logic
                        this.handleButtonPress(buttonId);

                        // Trigger haptic feedback if available
                        if (navigator.vibrate) {
                            navigator.vibrate(50);
                        }
                    } else {
                        console.warn(`⚠️ [TOUCH] ${buttonId} not active - visible:${button.visible} enabled:${button.enabled}`);
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
                return;
            }

            // Check reel wheel touch
            if (this.isPointInReelWheel(touchX, touchY)) {
                if (this.reelWheel.visible && this.reelWheel.enabled) {
                    this.reelWheel.isDragging = true;
                    this.activeTouches.set(touchId, 'reelWheel');

                    // Calculate initial touch angle
                    const angle = this.calculateReelWheelAngle(touchX, touchY);
                    this.reelWheel.lastAngle = angle;

                    if (navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                }
                return;
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
            } else if (activeElement === 'reelWheel' && this.reelWheel.isDragging) {
                this.updateReelWheel(touchX, touchY);
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
            } else if (activeElement === 'reelWheel') {
                this.reelWheel.isDragging = false;
                this.reelWheel.reelingSpeed = 0; // Stop reeling
                this.triggerCallback('reelStop');
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
     * Check if point is within reel wheel bounds
     */
    isPointInReelWheel(x, y) {
        if (!this.reelWheel.visible) return false;
        const dx = x - this.reelWheel.x;
        const dy = y - this.reelWheel.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.reelWheel.radius && distance >= this.reelWheel.innerRadius;
    }

    /**
     * Calculate angle of touch relative to reel wheel center
     */
    calculateReelWheelAngle(x, y) {
        const dx = x - this.reelWheel.x;
        const dy = y - this.reelWheel.y;
        return Math.atan2(dy, dx);
    }

    /**
     * Update reel wheel rotation based on touch movement
     */
    updateReelWheel(touchX, touchY) {
        const currentAngle = this.calculateReelWheelAngle(touchX, touchY);

        // Calculate delta angle (change in rotation)
        let deltaAngle = currentAngle - this.reelWheel.lastAngle;

        // Handle angle wrapping (crossing from -PI to +PI or vice versa)
        if (deltaAngle > Math.PI) {
            deltaAngle -= 2 * Math.PI;
        } else if (deltaAngle < -Math.PI) {
            deltaAngle += 2 * Math.PI;
        }

        // Update rotation
        this.reelWheel.rotation += deltaAngle;
        this.reelWheel.totalRotation += deltaAngle;
        this.reelWheel.lastAngle = currentAngle;

        // Calculate reeling speed (-1 to 1, clockwise is positive)
        // Speed is based on how fast the angle is changing
        this.reelWheel.reelingSpeed = Math.max(-1, Math.min(1, deltaAngle * 5));

        // Haptic feedback on rotation milestones
        const totalRotation = Math.abs(this.reelWheel.totalRotation);
        if (totalRotation - Math.abs(this.reelWheel.lastHapticAngle) >= this.reelWheel.hapticThreshold) {
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            this.reelWheel.lastHapticAngle = totalRotation;
        }

        // Trigger reeling callback
        this.triggerCallback('reeling', {
            speed: this.reelWheel.reelingSpeed,
            rotation: this.reelWheel.rotation,
            totalRotation: this.reelWheel.totalRotation
        });
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
        this.reelWheel.visible = false;
        this.reelWheel.enabled = false;
        this.tensionGauges.visible = false;
        this.fightIndicators.visible = false;

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
                // Show all fighting UI elements
                this.reelWheel.visible = true;
                this.reelWheel.enabled = true;
                this.dragSlider.visible = true;
                this.dragSlider.enabled = true;
                this.tensionGauges.visible = true;
                this.fightIndicators.visible = true;

                // Reset reel wheel state
                this.reelWheel.totalRotation = 0;
                this.reelWheel.reelingSpeed = 0;
                break;

            case 'netting':
                this.buttons.net.visible = true;
                this.buttons.net.enabled = true;
                this.fightIndicators.visible = true; // Keep showing distance
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

        // Render tension gauges (top of screen)
        if (this.tensionGauges.visible) {
            this.renderTensionGauges();
        }

        // Render fight indicators (bottom left)
        if (this.fightIndicators.visible) {
            this.renderFightIndicators();
        }

        // Render drag slider
        if (this.dragSlider.visible) {
            this.renderDragSlider();
        }

        // Render reel wheel
        if (this.reelWheel.visible) {
            this.renderReelWheel();
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
     * Render circular reel wheel
     */
    renderReelWheel() {
        const ctx = this.ctx;
        const wheel = this.reelWheel;

        // Draw outer circle (rim)
        ctx.beginPath();
        ctx.arc(wheel.x, wheel.y, wheel.radius, 0, Math.PI * 2);
        ctx.fillStyle = wheel.color;
        ctx.fill();
        ctx.strokeStyle = wheel.accentColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw segments (make it look like a fishing reel)
        ctx.save();
        ctx.translate(wheel.x, wheel.y);
        ctx.rotate(wheel.rotation);

        for (let i = 0; i < wheel.segments; i++) {
            const angle = (i / wheel.segments) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(wheel.innerRadius * Math.cos(angle), wheel.innerRadius * Math.sin(angle));
            ctx.lineTo(wheel.radius * Math.cos(angle), wheel.radius * Math.sin(angle));
            ctx.strokeStyle = wheel.accentColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw rotation indicator (handle)
        ctx.beginPath();
        ctx.arc(wheel.radius * 0.7, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = wheel.handleColor;
        ctx.fill();
        ctx.strokeStyle = wheel.indicatorColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Draw inner circle (center)
        ctx.beginPath();
        ctx.arc(wheel.x, wheel.y, wheel.innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = wheel.accentColor;
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(wheel.label, wheel.x, wheel.y);

        // Draw speed indicator
        if (wheel.isDragging && Math.abs(wheel.reelingSpeed) > 0.1) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '10px Arial';
            ctx.fillText(`${(wheel.reelingSpeed * 100).toFixed(0)}%`, wheel.x, wheel.y + wheel.radius + 20);
        }
    }

    /**
     * Render tension gauges (rod, line, reel stress)
     */
    renderTensionGauges() {
        const ctx = this.ctx;
        const gauges = this.tensionGauges;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(gauges.x - gauges.width / 2, gauges.y - 10, gauges.width, gauges.height);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gauges.x - gauges.width / 2, gauges.y - 10, gauges.width, gauges.height);

        const barHeight = 15;
        const spacing = 3;
        let currentY = gauges.y;

        // Render each gauge (rod, line, reel)
        ['rod', 'line', 'reel'].forEach((type, index) => {
            const gauge = gauges[type];
            const barWidth = gauges.width - 20;
            const fillWidth = Math.min(barWidth * (gauge.value / gauge.max), barWidth);

            // Background track
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(gauges.x - barWidth / 2, currentY, barWidth, barHeight);

            // Determine color based on stress level
            let color = gauge.color;
            const stressPercent = gauge.value / gauge.max;
            if (stressPercent > 0.9) {
                color = '#ef4444'; // Red - critical
            } else if (stressPercent > 0.7) {
                color = '#f59e0b'; // Orange - warning
            } else if (stressPercent > 0.5) {
                color = gauge.color; // Original color
            } else {
                color = '#22c55e'; // Green - safe
            }

            // Fill bar
            ctx.fillStyle = color;
            ctx.fillRect(gauges.x - barWidth / 2, currentY, fillWidth, barHeight);

            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(gauges.x - barWidth / 2, currentY, barWidth, barHeight);

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(gauge.label, gauges.x - barWidth / 2 - 45, currentY + barHeight / 2 + 3);

            // Percentage
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(stressPercent * 100)}%`, gauges.x + barWidth / 2 + 45, currentY + barHeight / 2 + 3);

            currentY += barHeight + spacing;
        });
    }

    /**
     * Render fight indicators (fish stamina, distance)
     */
    renderFightIndicators() {
        const ctx = this.ctx;
        const indicators = this.fightIndicators;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(indicators.x, indicators.y, indicators.width, indicators.height);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(indicators.x, indicators.y, indicators.width, indicators.height);

        const barHeight = 12;
        let currentY = indicators.y + 5;

        // Fish stamina
        const staminaPercent = indicators.fishStamina.value / indicators.fishStamina.max;
        const staminaWidth = (indicators.width - 20) * staminaPercent;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(indicators.x + 10, currentY, indicators.width - 20, barHeight);

        ctx.fillStyle = staminaPercent > 0.5 ? '#3b82f6' : '#ef4444';
        ctx.fillRect(indicators.x + 10, currentY, staminaWidth, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(indicators.x + 10, currentY, indicators.width - 20, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('FISH', indicators.x + 10, currentY - 2);

        currentY += barHeight + 8;

        // Distance
        const distancePercent = indicators.lineLength.value / indicators.lineLength.max;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(indicators.x + 10, currentY, indicators.width - 20, barHeight);

        ctx.fillStyle = distancePercent < 0.3 ? '#22c55e' : '#fbbf24';
        ctx.fillRect(indicators.x + 10, currentY, (indicators.width - 20) * distancePercent, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(indicators.x + 10, currentY, indicators.width - 20, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`DIST ${indicators.lineLength.value.toFixed(0)}m`, indicators.x + 10, currentY - 2);
    }

    /**
     * Update tension gauge values
     * @param {Object} tension - {rod: 0-1, line: 0-1, reel: 0-1}
     */
    updateTension(tension) {
        if (tension.rod !== undefined) this.tensionGauges.rod.value = tension.rod;
        if (tension.line !== undefined) this.tensionGauges.line.value = tension.line;
        if (tension.reel !== undefined) this.tensionGauges.reel.value = tension.reel;
    }

    /**
     * Update fight indicator values
     * @param {Object} indicators - {fishStamina: 0-1, lineLength: number}
     */
    updateFightIndicators(indicators) {
        if (indicators.fishStamina !== undefined) {
            this.fightIndicators.fishStamina.value = indicators.fishStamina * this.fightIndicators.fishStamina.max;
        }
        if (indicators.lineLength !== undefined) {
            this.fightIndicators.lineLength.value = indicators.lineLength;
        }
    }

    /**
     * Get current reel wheel state
     */
    getReelWheelState() {
        return {
            isReeling: this.reelWheel.isDragging,
            speed: this.reelWheel.reelingSpeed,
            totalRotation: this.reelWheel.totalRotation
        };
    }

    /**
     * Get current drag setting
     */
    getDragSetting() {
        return this.dragSlider.value;
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