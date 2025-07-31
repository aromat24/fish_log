/**
 * Input Manager - Handles all input sources including touch, keyboard, and motion sensors
 * Provides unified input interface for the fishing game
 */

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.motionSensorManager = null;
        this.sensorDataProcessor = null;
        
        // Input state
        this.inputState = {
            // Touch/Mouse input
            touch: {
                isActive: false,
                startX: 0,
                startY: 0,
                currentX: 0,
                currentY: 0,
                deltaX: 0,
                deltaY: 0,
                pressure: 0
            },
            
            // Motion sensor input
            motion: {
                isActive: false,
                acceleration: { x: 0, y: 0, z: 0 },
                rotation: { alpha: 0, beta: 0, gamma: 0 },
                magnitude: 0,
                isCasting: false,
                isReeling: false,
                castPower: 0,
                reelSpeed: 0
            },
            
            // Keyboard input
            keyboard: {
                keys: new Set()
            },
            
            // Game-specific input
            fishing: {
                castDetected: false,
                reelDetected: false,
                lineHold: false,
                lastCastTime: 0,
                castCooldown: 1000 // 1 second cooldown
            }
        };

        // Input callbacks
        this.callbacks = new Map();
        
        // Casting detection parameters
        this.castingConfig = {
            threshold: 2.5, // G-force threshold for cast detection
            minCastTime: 200, // Minimum time for a valid cast (ms)
            maxCastTime: 1000, // Maximum time for a valid cast (ms)
            cooldownTime: 1000 // Cooldown between casts (ms)
        };

        // Reeling detection parameters
        this.reelingConfig = {
            rotationThreshold: 1.0, // Rotation threshold for reel detection
            sustainedTime: 100, // Time to sustain for reel detection (ms)
            sensitivity: 0.7 // Sensitivity multiplier
        };

        console.log('InputManager initialized');
    }

    /**
     * Set motion sensor manager reference
     */
    setMotionSensorManager(motionSensorManager) {
        this.motionSensorManager = motionSensorManager;
        
        if (motionSensorManager) {
            try {
                // Initialize sensor data processor if available
                if (typeof SensorFilters !== 'undefined' && SensorFilters.SensorDataProcessor) {
                    this.sensorDataProcessor = new SensorFilters.SensorDataProcessor({
                        enableFiltering: true,
                        enableDeadzone: true,
                        deadzoneThreshold: 0.1,
                        minCutoff: 1.0,
                        beta: 0.007
                    });
                    console.log('Sensor data processor initialized');
                } else {
                    console.warn('SensorFilters not available, using raw sensor data');
                    this.sensorDataProcessor = null;
                }

                // Register for sensor data callbacks
                motionSensorManager.registerCallback('inputManager', (sensorData) => {
                    this.handleMotionSensorData(sensorData);
                });
                
                console.log('Motion sensor manager connected to InputManager');
            } catch (error) {
                console.error('Failed to setup motion sensor processing:', error);
                this.sensorDataProcessor = null;
            }
        }
    }

    /**
     * Setup touch/mouse controls
     */
    setupTouchControls() {
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouchStart(touch.clientX, touch.clientY, touch.force || 1);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouchMove(touch.clientX, touch.clientY, touch.force || 1);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd();
        }, { passive: false });

        // Mouse events for desktop testing
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleTouchStart(e.clientX, e.clientY, 1);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.inputState.touch.isActive) {
                this.handleTouchMove(e.clientX, e.clientY, 1);
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.handleTouchEnd();
        });

        console.log('Touch controls setup complete');
    }

    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.inputState.keyboard.keys.add(e.code);
            this.handleKeyDown(e.code);
        });

        document.addEventListener('keyup', (e) => {
            this.inputState.keyboard.keys.delete(e.code);
            this.handleKeyUp(e.code);
        });

        console.log('Keyboard controls setup complete');
    }

    /**
     * Handle touch start
     */
    handleTouchStart(x, y, pressure) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        this.inputState.touch = {
            isActive: true,
            startX: canvasX,
            startY: canvasY,
            currentX: canvasX,
            currentY: canvasY,
            deltaX: 0,
            deltaY: 0,
            pressure: pressure
        };

        this.triggerCallback('touchStart', {
            x: canvasX,
            y: canvasY,
            pressure: pressure
        });
    }

    /**
     * Handle touch move
     */
    handleTouchMove(x, y, pressure) {
        if (!this.inputState.touch.isActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        this.inputState.touch.deltaX = canvasX - this.inputState.touch.currentX;
        this.inputState.touch.deltaY = canvasY - this.inputState.touch.currentY;
        this.inputState.touch.currentX = canvasX;
        this.inputState.touch.currentY = canvasY;
        this.inputState.touch.pressure = pressure;

        this.triggerCallback('touchMove', {
            x: canvasX,
            y: canvasY,
            deltaX: this.inputState.touch.deltaX,
            deltaY: this.inputState.touch.deltaY,
            pressure: pressure
        });
    }

    /**
     * Handle touch end
     */
    handleTouchEnd() {
        const touchData = { ...this.inputState.touch };
        
        this.inputState.touch = {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0,
            pressure: 0
        };

        this.triggerCallback('touchEnd', touchData);
    }

    /**
     * Handle key down
     */
    handleKeyDown(keyCode) {
        this.triggerCallback('keyDown', { keyCode });
        
        // Handle specific game keys
        switch (keyCode) {
            case 'Space':
                this.simulateCast();
                break;
            case 'KeyR':
                this.simulateReel();
                break;
        }
    }

    /**
     * Handle key up
     */
    handleKeyUp(keyCode) {
        this.triggerCallback('keyUp', { keyCode });
    }

    /**
     * Handle motion sensor data
     */
    handleMotionSensorData(rawSensorData) {
        try {
            let processedData = rawSensorData;

            // Process raw sensor data through filters if available
            if (this.sensorDataProcessor) {
                processedData = this.sensorDataProcessor.process(rawSensorData);
            } else {
                // Add acceleration magnitude if not present
                if (!processedData.accelerationMagnitude) {
                    const acc = processedData.acceleration;
                    processedData.accelerationMagnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
                }
            }
            
            // Update motion input state
            this.inputState.motion = {
                isActive: true,
                acceleration: processedData.acceleration,
                rotation: processedData.rotation,
                magnitude: processedData.accelerationMagnitude,
                isCasting: false,
                isReeling: false,
                castPower: 0,
                reelSpeed: 0
            };

            // Detect fishing gestures
            this.detectCastingMotion(processedData);
            this.detectReelingMotion(processedData);

            // Trigger motion callbacks
            this.triggerCallback('motionData', processedData);
        } catch (error) {
            console.error('Error handling motion sensor data:', error);
        }
    }

    /**
     * Detect casting motion from sensor data
     */
    detectCastingMotion(sensorData) {
        const currentTime = Date.now();
        const magnitude = sensorData.accelerationMagnitude;
        
        // Check cooldown
        if (currentTime - this.inputState.fishing.lastCastTime < this.castingConfig.cooldownTime) {
            return;
        }

        // Detect forward casting motion (high acceleration in Z-axis)
        const forwardMotion = sensorData.acceleration.z;
        
        if (!this.inputState.fishing.castDetected && 
            magnitude > this.castingConfig.threshold && 
            forwardMotion > 1.5) {
            
            this.inputState.fishing.castDetected = true;
            this.inputState.motion.isCasting = true;
            this.inputState.motion.castPower = Math.min(magnitude / 10, 1); // Normalize to 0-1
            
            this.triggerCallback('castDetected', {
                power: this.inputState.motion.castPower,
                magnitude: magnitude,
                timestamp: currentTime
            });
            
            this.inputState.fishing.lastCastTime = currentTime;
            
            console.log(`Cast detected! Power: ${this.inputState.motion.castPower.toFixed(2)}`);
            
            // Reset cast detection after a delay
            setTimeout(() => {
                this.inputState.fishing.castDetected = false;
                this.inputState.motion.isCasting = false;
            }, this.castingConfig.minCastTime);
        }
    }

    /**
     * Detect reeling motion from sensor data
     */
    detectReelingMotion(sensorData) {
        const rotationMagnitude = Math.sqrt(
            sensorData.rotation.alpha ** 2 + 
            sensorData.rotation.beta ** 2 + 
            sensorData.rotation.gamma ** 2
        );

        // Detect circular reeling motion
        const isReelingMotion = rotationMagnitude > this.reelingConfig.rotationThreshold;
        
        if (isReelingMotion) {
            if (!this.inputState.fishing.reelDetected) {
                this.inputState.fishing.reelDetected = true;
                this.inputState.motion.isReeling = true;
                
                this.triggerCallback('reelingStart', {
                    intensity: rotationMagnitude * this.reelingConfig.sensitivity
                });
            }
            
            this.inputState.motion.reelSpeed = rotationMagnitude * this.reelingConfig.sensitivity;
            
            this.triggerCallback('reeling', {
                speed: this.inputState.motion.reelSpeed,
                intensity: rotationMagnitude
            });
            
        } else if (this.inputState.fishing.reelDetected) {
            // Stop reeling
            this.inputState.fishing.reelDetected = false;
            this.inputState.motion.isReeling = false;
            this.inputState.motion.reelSpeed = 0;
            
            this.triggerCallback('reelingStop', {});
        }
    }

    /**
     * Simulate cast (for testing with keyboard)
     */
    simulateCast() {
        const currentTime = Date.now();
        
        if (currentTime - this.inputState.fishing.lastCastTime < this.castingConfig.cooldownTime) {
            return;
        }

        this.inputState.fishing.lastCastTime = currentTime;
        
        this.triggerCallback('castDetected', {
            power: 0.8, // Simulated power
            magnitude: 8.0,
            timestamp: currentTime,
            simulated: true
        });
        
        console.log('Simulated cast triggered');
    }

    /**
     * Simulate reel (for testing with keyboard)
     */
    simulateReel() {
        this.triggerCallback('reeling', {
            speed: 0.7,
            intensity: 2.0,
            simulated: true
        });
        
        console.log('Simulated reel triggered');
    }

    /**
     * Register input callback
     */
    registerCallback(eventType, callback) {
        if (!this.callbacks.has(eventType)) {
            this.callbacks.set(eventType, []);
        }
        
        this.callbacks.get(eventType).push(callback);
        console.log(`Callback registered for: ${eventType}`);
    }

    /**
     * Unregister input callback
     */
    unregisterCallback(eventType, callback) {
        if (this.callbacks.has(eventType)) {
            const callbacks = this.callbacks.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                console.log(`Callback unregistered for: ${eventType}`);
            }
        }
    }

    /**
     * Trigger callback for event type
     */
    triggerCallback(eventType, data) {
        if (this.callbacks.has(eventType)) {
            const callbacks = this.callbacks.get(eventType);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Callback error for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Update input manager
     */
    update(deltaTime) {
        // Update any time-based input processing here
        
        // Handle sustained touch input
        if (this.inputState.touch.isActive) {
            this.triggerCallback('touchHold', {
                duration: Date.now() - this.inputState.touch.startTime,
                x: this.inputState.touch.currentX,
                y: this.inputState.touch.currentY
            });
        }
    }

    /**
     * Get current input state
     */
    getInputState() {
        return { ...this.inputState };
    }

    /**
     * Check if motion controls are available
     */
    isMotionControlsAvailable() {
        return this.motionSensorManager && this.motionSensorManager.getStatus().isInitialized;
    }

    /**
     * Calibrate motion sensors
     */
    calibrateMotionSensors() {
        if (this.motionSensorManager) {
            return this.motionSensorManager.calibrate();
        }
        return false;
    }

    /**
     * Set motion sensitivity
     */
    setMotionSensitivity(sensitivity) {
        this.reelingConfig.sensitivity = Math.max(0.1, Math.min(2.0, sensitivity));
        console.log(`Motion sensitivity set to: ${this.reelingConfig.sensitivity}`);
    }

    /**
     * Clean up input manager
     */
    cleanup() {
        // Remove event listeners
        if (this.canvas) {
            const events = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup'];
            events.forEach(event => {
                this.canvas.removeEventListener(event, () => {});
            });
        }

        document.removeEventListener('keydown', () => {});
        document.removeEventListener('keyup', () => {});

        // Unregister from motion sensor manager
        if (this.motionSensorManager) {
            this.motionSensorManager.unregisterCallback('inputManager');
        }

        // Clear callbacks
        this.callbacks.clear();
        
        console.log('InputManager cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
} else {
    window.InputManager = InputManager;
}