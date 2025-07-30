class FishingGameInputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isEnabled = true;
        
        // Input state
        this.pointers = new Map(); // Support multi-touch
        this.currentGesture = null;
        this.gestureStartTime = 0;
        
        // Touch/mouse state
        this.isPointerDown = false;
        this.startPointer = { x: 0, y: 0 };
        this.currentPointer = { x: 0, y: 0 };
        this.lastPointer = { x: 0, y: 0 };
        this.pointerVelocity = { x: 0, y: 0 };
        
        // Gesture recognition
        this.dragThreshold = 10; // pixels
        this.tapMaxDuration = 200; // ms
        this.doubleTapMaxDelay = 300; // ms
        this.lastTapTime = 0;
        
        // Event listeners storage for cleanup
        this.eventListeners = [];
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 5;
        
        // Performance tracking
        this.inputStats = {
            totalInputs: 0,
            gestures: {
                tap: 0,
                drag: 0,
                pinch: 0
            },
            errors: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            console.log('🎮 Initializing Input Manager...');
            
            if (!this.canvas) {
                throw new Error('Canvas element is required for InputManager');
            }
            
            this.setupEventListeners();
            this.preventDefaultBehaviors();
            
            console.log('✅ Input Manager initialized successfully');
            
        } catch (error) {
            this.handleError('Input Manager initialization failed', error);
        }
    }
    
    setupEventListeners() {
        try {
            // Unified pointer events for better compatibility
            const events = [
                { type: 'pointerdown', handler: this.handlePointerDown.bind(this) },
                { type: 'pointermove', handler: this.handlePointerMove.bind(this) },
                { type: 'pointerup', handler: this.handlePointerUp.bind(this) },
                { type: 'pointercancel', handler: this.handlePointerCancel.bind(this) },
                
                // Fallback for older browsers
                { type: 'mousedown', handler: this.handleMouseDown.bind(this) },
                { type: 'mousemove', handler: this.handleMouseMove.bind(this) },
                { type: 'mouseup', handler: this.handleMouseUp.bind(this) },
                
                // Touch events for additional compatibility
                { type: 'touchstart', handler: this.handleTouchStart.bind(this) },
                { type: 'touchmove', handler: this.handleTouchMove.bind(this) },
                { type: 'touchend', handler: this.handleTouchEnd.bind(this) },
                { type: 'touchcancel', handler: this.handleTouchCancel.bind(this) }
            ];
            
            events.forEach(({ type, handler }) => {
                try {
                    this.canvas.addEventListener(type, handler, { passive: false });
                    this.eventListeners.push({ type, handler });
                } catch (eventError) {
                    console.warn(`⚠️ Failed to add ${type} event listener:`, eventError);
                }
            });
            
            console.log(`✅ ${events.length} input event listeners registered`);
            
        } catch (error) {
            throw new Error(`Event listener setup failed: ${error.message}`);
        }
    }
    
    preventDefaultBehaviors() {
        try {
            // Prevent context menu
            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
            
            // Prevent text selection
            this.canvas.style.userSelect = 'none';
            this.canvas.style.webkitUserSelect = 'none';
            this.canvas.style.mozUserSelect = 'none';
            this.canvas.style.msUserSelect = 'none';
            
            // Prevent touch behaviors
            this.canvas.style.touchAction = 'none';
            this.canvas.style.webkitTouchCallout = 'none';
            
            console.log('✅ Default behaviors prevented');
            
        } catch (error) {
            console.warn('⚠️ Failed to prevent some default behaviors:', error);
        }
    }
    
    // Unified pointer event handlers
    handlePointerDown(event) {
        if (!this.isEnabled) return;
        
        try {
            event.preventDefault();
            this.inputStats.totalInputs++;
            
            const pointer = this.getPointerFromEvent(event);
            this.pointers.set(event.pointerId, {
                ...pointer,
                startTime: Date.now(),
                startX: pointer.x,
                startY: pointer.y
            });
            
            if (this.pointers.size === 1) {
                // Single pointer - start gesture tracking
                this.startSinglePointerGesture(pointer);
            } else if (this.pointers.size === 2) {
                // Two pointers - potential pinch gesture
                this.startPinchGesture();
            }
            
            this.emitInputEvent('pointerdown', { pointer, pointerId: event.pointerId });
            
        } catch (error) {
            this.handleError('Pointer down handler failed', error);
        }
    }
    
    handlePointerMove(event) {
        if (!this.isEnabled) return;
        
        try {
            event.preventDefault();
            
            const pointer = this.getPointerFromEvent(event);
            const storedPointer = this.pointers.get(event.pointerId);
            
            if (!storedPointer) return;
            
            // Update pointer data
            this.pointers.set(event.pointerId, {
                ...storedPointer,
                x: pointer.x,
                y: pointer.y,
                lastX: storedPointer.x,
                lastY: storedPointer.y
            });
            
            // Calculate velocity
            const deltaTime = Date.now() - (storedPointer.lastMoveTime || storedPointer.startTime);
            if (deltaTime > 0) {
                this.pointerVelocity = {
                    x: (pointer.x - storedPointer.x) / deltaTime,
                    y: (pointer.y - storedPointer.y) / deltaTime
                };
            }
            
            if (this.pointers.size === 1) {
                this.updateSinglePointerGesture(pointer);
            } else if (this.pointers.size === 2) {
                this.updatePinchGesture();
            }
            
            this.emitInputEvent('pointermove', { pointer, pointerId: event.pointerId });
            
        } catch (error) {
            this.handleError('Pointer move handler failed', error);
        }
    }
    
    handlePointerUp(event) {
        if (!this.isEnabled) return;
        
        try {
            event.preventDefault();
            
            const pointer = this.getPointerFromEvent(event);
            const storedPointer = this.pointers.get(event.pointerId);
            
            if (storedPointer) {
                const duration = Date.now() - storedPointer.startTime;
                const distance = this.calculateDistance(
                    storedPointer.startX, storedPointer.startY,
                    pointer.x, pointer.y
                );
                
                // Gesture recognition
                if (this.pointers.size === 1) {
                    this.finalizeSinglePointerGesture(storedPointer, pointer, duration, distance);
                }
                
                this.pointers.delete(event.pointerId);
            }
            
            this.emitInputEvent('pointerup', { pointer, pointerId: event.pointerId });
            
        } catch (error) {
            this.handleError('Pointer up handler failed', error);
        }
    }
    
    handlePointerCancel(event) {
        if (!this.isEnabled) return;
        
        try {
            this.pointers.delete(event.pointerId);
            this.currentGesture = null;
            console.log('🔄 Pointer cancelled, resetting gesture state');
            
        } catch (error) {
            this.handleError('Pointer cancel handler failed', error);
        }
    }
    
    // Fallback mouse event handlers
    handleMouseDown(event) {
        if (event.pointerType) return; // Skip if already handled by pointer events
        
        try {
            const syntheticEvent = {
                pointerId: 'mouse',
                ...event
            };
            this.handlePointerDown(syntheticEvent);
            
        } catch (error) {
            this.handleError('Mouse down handler failed', error);
        }
    }
    
    handleMouseMove(event) {
        if (event.pointerType) return;
        
        try {
            const syntheticEvent = {
                pointerId: 'mouse',
                ...event
            };
            this.handlePointerMove(syntheticEvent);
            
        } catch (error) {
            this.handleError('Mouse move handler failed', error);
        }
    }
    
    handleMouseUp(event) {
        if (event.pointerType) return;
        
        try {
            const syntheticEvent = {
                pointerId: 'mouse',
                ...event
            };
            this.handlePointerUp(syntheticEvent);
            
        } catch (error) {
            this.handleError('Mouse up handler failed', error);
        }
    }
    
    // Touch event handlers for additional compatibility
    handleTouchStart(event) {
        if (event.pointerType) return; // Skip if already handled by pointer events
        
        try {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const syntheticEvent = {
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => event.preventDefault()
                };
                this.handlePointerDown(syntheticEvent);
            }
            
        } catch (error) {
            this.handleError('Touch start handler failed', error);
        }
    }
    
    handleTouchMove(event) {
        if (event.pointerType) return;
        
        try {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const syntheticEvent = {
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => event.preventDefault()
                };
                this.handlePointerMove(syntheticEvent);
            }
            
        } catch (error) {
            this.handleError('Touch move handler failed', error);
        }
    }
    
    handleTouchEnd(event) {
        if (event.pointerType) return;
        
        try {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const syntheticEvent = {
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => event.preventDefault()
                };
                this.handlePointerUp(syntheticEvent);
            }
            
        } catch (error) {
            this.handleError('Touch end handler failed', error);
        }
    }
    
    handleTouchCancel(event) {
        try {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                this.pointers.delete(touch.identifier);
            }
            this.currentGesture = null;
            
        } catch (error) {
            this.handleError('Touch cancel handler failed', error);
        }
    }
    
    // Gesture recognition methods
    startSinglePointerGesture(pointer) {
        try {
            this.isPointerDown = true;
            this.startPointer = { ...pointer };
            this.currentPointer = { ...pointer };
            this.gestureStartTime = Date.now();
            this.currentGesture = 'potential_tap';
            
        } catch (error) {
            this.handleError('Single pointer gesture start failed', error);
        }
    }
    
    updateSinglePointerGesture(pointer) {
        try {
            this.lastPointer = { ...this.currentPointer };
            this.currentPointer = { ...pointer };
            
            const distance = this.calculateDistance(
                this.startPointer.x, this.startPointer.y,
                pointer.x, pointer.y
            );
            
            if (distance > this.dragThreshold && this.currentGesture === 'potential_tap') {
                this.currentGesture = 'drag';
                this.inputStats.gestures.drag++;
                this.emitInputEvent('dragstart', {
                    startPointer: this.startPointer,
                    currentPointer: pointer
                });
            } else if (this.currentGesture === 'drag') {
                this.emitInputEvent('drag', {
                    startPointer: this.startPointer,
                    currentPointer: pointer,
                    lastPointer: this.lastPointer,
                    velocity: this.pointerVelocity
                });
            }
            
        } catch (error) {
            this.handleError('Single pointer gesture update failed', error);
        }
    }
    
    finalizeSinglePointerGesture(storedPointer, pointer, duration, distance) {
        try {
            if (this.currentGesture === 'drag') {
                this.emitInputEvent('dragend', {
                    startPointer: this.startPointer,
                    endPointer: pointer,
                    velocity: this.pointerVelocity,
                    duration
                });
            } else if (duration < this.tapMaxDuration && distance < this.dragThreshold) {
                // It's a tap
                this.inputStats.gestures.tap++;
                
                const currentTime = Date.now();
                const isDoubleTap = currentTime - this.lastTapTime < this.doubleTapMaxDelay;
                
                if (isDoubleTap) {
                    this.emitInputEvent('doubletap', { pointer });
                    this.lastTapTime = 0; // Reset to prevent triple tap
                } else {
                    this.emitInputEvent('tap', { pointer });
                    this.lastTapTime = currentTime;
                }
            }
            
            this.currentGesture = null;
            this.isPointerDown = false;
            
        } catch (error) {
            this.handleError('Single pointer gesture finalization failed', error);
        }
    }
    
    startPinchGesture() {
        try {
            this.currentGesture = 'pinch';
            this.inputStats.gestures.pinch++;
            
            const pointers = Array.from(this.pointers.values());
            if (pointers.length === 2) {
                this.emitInputEvent('pinchstart', {
                    pointer1: pointers[0],
                    pointer2: pointers[1],
                    distance: this.calculateDistance(
                        pointers[0].x, pointers[0].y,
                        pointers[1].x, pointers[1].y
                    )
                });
            }
            
        } catch (error) {
            this.handleError('Pinch gesture start failed', error);
        }
    }
    
    updatePinchGesture() {
        try {
            const pointers = Array.from(this.pointers.values());
            if (pointers.length === 2) {
                const distance = this.calculateDistance(
                    pointers[0].x, pointers[0].y,
                    pointers[1].x, pointers[1].y
                );
                
                this.emitInputEvent('pinch', {
                    pointer1: pointers[0],
                    pointer2: pointers[1],
                    distance
                });
            }
            
        } catch (error) {
            this.handleError('Pinch gesture update failed', error);
        }
    }
    
    // Utility methods
    getPointerFromEvent(event) {
        try {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                rawX: event.clientX,
                rawY: event.clientY
            };
        } catch (error) {
            this.handleError('Get pointer from event failed', error);
            return { x: 0, y: 0, rawX: 0, rawY: 0 };
        }
    }
    
    calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    emitInputEvent(type, data) {
        try {
            const event = new CustomEvent(`fishing-game-${type}`, {
                detail: { ...data, timestamp: Date.now() }
            });
            this.canvas.dispatchEvent(event);
            
        } catch (error) {
            this.handleError(`Failed to emit input event: ${type}`, error);
        }
    }
    
    // Public methods
    enable() {
        this.isEnabled = true;
        console.log('✅ Input manager enabled');
    }
    
    disable() {
        this.isEnabled = false;
        this.reset();
        console.log('⏸️ Input manager disabled');
    }
    
    reset() {
        try {
            this.pointers.clear();
            this.currentGesture = null;
            this.isPointerDown = false;
            this.pointerVelocity = { x: 0, y: 0 };
            console.log('🔄 Input state reset');
            
        } catch (error) {
            this.handleError('Input reset failed', error);
        }
    }
    
    getInputStats() {
        return { ...this.inputStats };
    }
    
    // Error handling
    handleError(message, error) {
        this.errorCount++;
        this.inputStats.errors++;
        
        console.error(`🚨 Input Manager Error: ${message}`, error);
        
        if (window.errorHandler) {
            window.errorHandler.logError(
                new Error(`Input Manager: ${message}`),
                'FishingGameInputManager.handleError',
                { originalError: error, errorCount: this.errorCount }
            );
        }
        
        // Auto-recovery for input errors
        if (this.errorCount > this.maxErrors) {
            console.warn('⚠️ Too many input errors, attempting recovery');
            this.reset();
            this.errorCount = Math.floor(this.maxErrors / 2); // Reduce error count
        }
    }
    
    // Cleanup
    destroy() {
        try {
            this.disable();
            
            // Remove all event listeners
            this.eventListeners.forEach(({ type, handler }) => {
                this.canvas.removeEventListener(type, handler);
            });
            this.eventListeners = [];
            
            console.log('🧹 Input Manager destroyed');
            
        } catch (error) {
            console.error('Input Manager destruction failed:', error);
        }
    }
}

// Export to global scope
window.FishingGameInputManager = FishingGameInputManager;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishingGameInputManager;
}