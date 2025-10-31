/**
 * Motion Sensor Manager for Fishing Game
 * Provides progressive enhancement pattern for motion sensor access
 * Supports Generic Sensor API and DeviceMotion fallback with robust error handling
 */

class MotionSensorManager {
    constructor() {
        this.sensorType = null;
        this.isInitialized = false;
        this.isPermissionGranted = false;
        this.callbacks = new Map();
        this.sensors = {
            accelerometer: null,
            gyroscope: null
        };
        this.fallbackData = {
            acceleration: { x: 0, y: 0, z: 0 },
            rotation: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: 0
        };
        this.lastCalibration = null;
        this.isCalibrated = false;
        
        // Error handling
        this.errorState = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Performance optimization
        this.updateFrequency = 60; // Hz
        this.lastUpdate = 0;
        this.throttleDelay = 1000 / this.updateFrequency; // ~16ms for 60fps
        
        console.log('MotionSensorManager initialized');
    }

    /**
     * Initialize motion sensors with progressive enhancement
     * Tries appropriate API based on platform (Android prefers Generic Sensor, iOS prefers DeviceMotion)
     */
    async initialize() {
        try {
            console.log('Initializing motion sensors...');

            // Reset error state
            this.errorState = null;
            this.retryCount = 0;

            // Check HTTPS requirement
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                throw new Error('Motion sensors require HTTPS in production');
            }

            // Detect platform to determine API priority
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

            console.log('📱 [INIT] Platform detection:', { isAndroid, isIOS, userAgent: navigator.userAgent });

            // Android Chrome/Samsung Internet prefer Generic Sensor API
            if (isAndroid) {
                console.log('📱 [INIT] Android detected - trying Generic Sensor API first');

                // Try Generic Sensor API first on Android
                if (await this.tryGenericSensorAPI()) {
                    this.sensorType = 'generic-sensor';
                    this.isInitialized = true;
                    console.log('✅ Generic Sensor API initialized successfully (Android)');

                    // Load saved calibration if available
                    this.loadCalibration();

                    return { success: true, type: 'generic-sensor' };
                }

                // Fallback to DeviceMotion on Android
                if (await this.tryDeviceMotionAPI()) {
                    this.sensorType = 'devicemotion';
                    this.isInitialized = true;
                    console.log('✅ DeviceMotion API initialized successfully (Android fallback)');

                    // Load saved calibration if available
                    this.loadCalibration();

                    return { success: true, type: 'devicemotion' };
                }
            } else {
                // iOS, desktop, and other platforms prefer DeviceMotion API first
                console.log('📱 [INIT] Non-Android platform - trying DeviceMotion API first');

                // Try DeviceMotion API first (Safari iOS, Firefox, better iOS support)
                if (await this.tryDeviceMotionAPI()) {
                    this.sensorType = 'devicemotion';
                    this.isInitialized = true;
                    console.log('✅ DeviceMotion API initialized successfully');

                    // Load saved calibration if available
                    this.loadCalibration();

                    return { success: true, type: 'devicemotion' };
                }

                // Fallback to Generic Sensor API
                if (await this.tryGenericSensorAPI()) {
                    this.sensorType = 'generic-sensor';
                    this.isInitialized = true;
                    console.log('✅ Generic Sensor API initialized successfully (fallback)');

                    // Load saved calibration if available
                    this.loadCalibration();

                    return { success: true, type: 'generic-sensor' };
                }
            }

            // No sensor support available
            throw new Error('No motion sensor support detected');

        } catch (error) {
            console.error('❌ Motion sensor initialization failed:', error);
            this.errorState = error.message;
            this.isInitialized = false;
            return {
                success: false,
                error: error.message,
                fallback: this.setupTouchFallback()
            };
        }
    }

    /**
     * Attempt to initialize Generic Sensor API
     */
    async tryGenericSensorAPI() {
        try {
            // Check for Generic Sensor API support
            if (!('Accelerometer' in window) || !('Gyroscope' in window)) {
                console.log('Generic Sensor API not supported');
                return false;
            }

            // Request permissions for Generic Sensor API
            const permissions = await Promise.all([
                navigator.permissions.query({ name: 'accelerometer' }),
                navigator.permissions.query({ name: 'gyroscope' })
            ]);

            const allGranted = permissions.every(result => 
                result.state === 'granted' || result.state === 'prompt'
            );

            if (!allGranted) {
                console.log('Generic Sensor permissions not available');
                return false;
            }

            // Initialize sensors with error handling
            try {
                this.sensors.accelerometer = new Accelerometer({
                    frequency: this.updateFrequency,
                    referenceFrame: 'screen'
                });

                this.sensors.gyroscope = new Gyroscope({
                    frequency: this.updateFrequency,
                    referenceFrame: 'screen'
                });

                // Setup event listeners with error handling
                this.sensors.accelerometer.addEventListener('reading', () => {
                    this.handleGenericSensorReading();
                });

                this.sensors.accelerometer.addEventListener('error', (event) => {
                    console.error('Accelerometer error:', event.error);
                    // Don't call handleSensorError for permission errors - let them propagate
                    if (event.error.name !== 'NotAllowedError' && event.error.name !== 'NotReadableError') {
                        this.handleSensorError(event.error);
                    }
                });

                this.sensors.gyroscope.addEventListener('error', (event) => {
                    console.error('Gyroscope error:', event.error);
                    // Don't call handleSensorError for permission errors - let them propagate
                    if (event.error.name !== 'NotAllowedError' && event.error.name !== 'NotReadableError') {
                        this.handleSensorError(event.error);
                    }
                });

                // CRITICAL: Start sensors - this triggers permission prompt on Android
                // If permission denied, will throw NotAllowedError
                console.log('📱 Starting Generic Sensor API sensors (will prompt for permission)...');
                this.sensors.accelerometer.start();
                this.sensors.gyroscope.start();

                // Wait a moment to ensure sensors started successfully
                await new Promise(resolve => setTimeout(resolve, 100));

                console.log('✅ Generic Sensor API sensors started successfully');
                this.isPermissionGranted = true;
                return true;

            } catch (error) {
                console.log('❌ Generic Sensor API error:', error.name, error.message);

                // If permission denied, this is expected - user declined
                if (error.name === 'NotAllowedError') {
                    console.log('🚫 Generic Sensor permission denied by user');
                    return false;
                }

                // Other errors - sensor not available
                console.log('Failed to initialize Generic Sensor API:', error.message);
                return false;
            }

        } catch (error) {
            console.log('Generic Sensor API check failed:', error.message);
            return false;
        }
    }

    /**
     * Attempt to initialize DeviceMotion API
     * @param {boolean} skipPermissionRequest - Set to true if permission already requested
     */
    async tryDeviceMotionAPI(skipPermissionRequest = false) {
        try {
            // Check for DeviceMotion support
            if (!('DeviceMotionEvent' in window)) {
                console.log('DeviceMotion API not supported');
                return false;
            }

            // Handle iOS 13+ permission requirement (if not already done)
            if (!skipPermissionRequest && typeof DeviceMotionEvent.requestPermission === 'function') {
                console.log('Requesting DeviceMotion permission (iOS 13+)...');

                try {
                    const permission = await DeviceMotionEvent.requestPermission();
                    if (permission !== 'granted') {
                        console.log('DeviceMotion permission denied');
                        return false;
                    }
                } catch (error) {
                    console.error('Permission request failed:', error);
                    return false;
                }
            }

            // Setup DeviceMotion event listener
            window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this), { passive: true });

            this.isPermissionGranted = true;

            // Test if we're getting data (longer timeout for slower Android devices)
            return new Promise((resolve) => {
                let testTimeout;
                const testHandler = (event) => {
                    if (event.accelerationIncludingGravity) {
                        clearTimeout(testTimeout);
                        window.removeEventListener('devicemotion', testHandler);
                        console.log('✅ DeviceMotion test successful - receiving data');
                        resolve(true);
                    }
                };

                window.addEventListener('devicemotion', testHandler, { passive: true });

                // Increased timeout from 2s to 5s for slower Android devices
                testTimeout = setTimeout(() => {
                    window.removeEventListener('devicemotion', testHandler);
                    console.log('❌ DeviceMotion test timeout - no data received after 5s');
                    resolve(false);
                }, 5000);
            });

        } catch (error) {
            console.log('DeviceMotion API initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Handle Generic Sensor API readings
     */
    handleGenericSensorReading() {
        const now = performance.now();
        
        // Throttle updates for performance
        if (now - this.lastUpdate < this.throttleDelay) {
            return;
        }
        this.lastUpdate = now;

        try {
            const acceleration = {
                x: this.sensors.accelerometer.x || 0,
                y: this.sensors.accelerometer.y || 0,
                z: this.sensors.accelerometer.z || 0
            };

            const rotation = {
                alpha: this.sensors.gyroscope.x || 0,
                beta: this.sensors.gyroscope.y || 0,
                gamma: this.sensors.gyroscope.z || 0
            };

            const sensorData = {
                acceleration,
                rotation,
                timestamp: now,
                type: 'generic-sensor'
            };

            this.processSensorData(sensorData);

        } catch (error) {
            console.error('Error processing Generic Sensor data:', error);
            this.handleSensorError(error);
        }
    }

    /**
     * Handle DeviceMotion events
     */
    handleDeviceMotion(event) {
        const now = performance.now();
        
        // Throttle updates for performance
        if (now - this.lastUpdate < this.throttleDelay) {
            return;
        }
        this.lastUpdate = now;

        try {
            const acc = event.accelerationIncludingGravity;
            const rot = event.rotationRate;

            if (!acc) return;

            const acceleration = {
                x: acc.x || 0,
                y: acc.y || 0,
                z: acc.z || 0
            };

            const rotation = {
                alpha: rot ? (rot.alpha || 0) : 0,
                beta: rot ? (rot.beta || 0) : 0,
                gamma: rot ? (rot.gamma || 0) : 0
            };

            const sensorData = {
                acceleration,
                rotation,
                timestamp: now,
                type: 'devicemotion'
            };

            this.processSensorData(sensorData);

        } catch (error) {
            console.error('Error processing DeviceMotion data:', error);
            this.handleSensorError(error);
        }
    }

    /**
     * Process and filter sensor data
     */
    processSensorData(rawData) {
        try {
            // Apply calibration if available
            const calibratedData = this.applyCalibration(rawData);
            
            // Store fallback data
            this.fallbackData = calibratedData;
            
            // Notify all registered callbacks
            this.callbacks.forEach((callback, id) => {
                try {
                    callback(calibratedData);
                } catch (error) {
                    console.error(`Callback ${id} error:`, error);
                }
            });

        } catch (error) {
            console.error('Error processing sensor data:', error);
            this.handleSensorError(error);
        }
    }

    /**
     * Apply device calibration to sensor data
     */
    applyCalibration(data) {
        if (!this.lastCalibration) {
            return data;
        }

        return {
            ...data,
            acceleration: {
                x: data.acceleration.x - this.lastCalibration.acceleration.x,
                y: data.acceleration.y - this.lastCalibration.acceleration.y,
                z: data.acceleration.z - this.lastCalibration.acceleration.z
            },
            rotation: {
                alpha: data.rotation.alpha - this.lastCalibration.rotation.alpha,
                beta: data.rotation.beta - this.lastCalibration.rotation.beta,
                gamma: data.rotation.gamma - this.lastCalibration.rotation.gamma
            }
        };
    }

    /**
     * Calibrate sensors to current position
     */
    calibrate() {
        if (!this.isInitialized) {
            console.warn('Cannot calibrate - sensors not initialized');
            return false;
        }

        this.lastCalibration = {
            ...this.fallbackData
        };
        this.isCalibrated = true;

        // Save calibration to localStorage for persistence
        try {
            const calibrationData = {
                acceleration: this.lastCalibration.acceleration,
                rotation: this.lastCalibration.rotation,
                timestamp: this.lastCalibration.timestamp,
                sensorType: this.sensorType
            };

            localStorage.setItem('motionSensorCalibration', JSON.stringify(calibrationData));
            console.log('✅ Sensors calibrated to current position and saved to localStorage');
        } catch (error) {
            console.warn('Failed to save calibration to localStorage:', error);
            // Continue anyway - calibration still works for this session
            console.log('✅ Sensors calibrated to current position (not persisted)');
        }

        return true;
    }

    /**
     * Load calibration from localStorage
     */
    loadCalibration() {
        try {
            const savedCalibration = localStorage.getItem('motionSensorCalibration');

            if (!savedCalibration) {
                console.log('📱 [CALIBRATION] No saved calibration found');
                return false;
            }

            const calibrationData = JSON.parse(savedCalibration);

            // Validate calibration data structure
            if (!calibrationData.acceleration || !calibrationData.rotation) {
                console.warn('📱 [CALIBRATION] Invalid calibration data structure');
                localStorage.removeItem('motionSensorCalibration');
                return false;
            }

            // Check if calibration is for the same sensor type (optional compatibility check)
            if (calibrationData.sensorType && calibrationData.sensorType !== this.sensorType) {
                console.log(`📱 [CALIBRATION] Calibration was for ${calibrationData.sensorType}, current is ${this.sensorType} - using anyway`);
            }

            // Apply loaded calibration
            this.lastCalibration = {
                acceleration: calibrationData.acceleration,
                rotation: calibrationData.rotation,
                timestamp: calibrationData.timestamp
            };
            this.isCalibrated = true;

            console.log('✅ [CALIBRATION] Loaded saved calibration from localStorage:', {
                sensorType: calibrationData.sensorType,
                timestamp: new Date(calibrationData.timestamp).toLocaleString()
            });

            return true;

        } catch (error) {
            console.warn('📱 [CALIBRATION] Failed to load calibration from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem('motionSensorCalibration');
            return false;
        }
    }

    /**
     * Clear calibration from localStorage
     */
    clearSavedCalibration() {
        try {
            localStorage.removeItem('motionSensorCalibration');
            this.lastCalibration = null;
            this.isCalibrated = false;
            console.log('✅ [CALIBRATION] Cleared saved calibration');
            return true;
        } catch (error) {
            console.warn('Failed to clear saved calibration:', error);
            return false;
        }
    }

    /**
     * Setup touch-based fallback controls
     */
    setupTouchFallback() {
        console.log('Setting up touch fallback controls...');

        // This will be expanded to provide alternative control methods
        return {
            type: 'touch-fallback',
            message: 'Motion sensors unavailable. Touch controls will be used instead.',
            available: true
        };
    }

    /**
     * Handle sensor errors with retry logic
     */
    handleSensorError(error) {
        console.error('Sensor error:', error);
        
        this.errorState = error.message || 'Unknown sensor error';
        
        // Attempt retry if under limit
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying sensor initialization (${this.retryCount}/${this.maxRetries})...`);
            
            setTimeout(() => {
                this.initialize();
            }, 1000 * this.retryCount); // Exponential backoff
        } else {
            console.log('Max retries reached. Falling back to alternative controls.');
            this.setupTouchFallback();
        }
    }

    /**
     * Register callback for sensor data
     */
    registerCallback(id, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.callbacks.set(id, callback);
        console.log(`Callback ${id} registered`);
        
        // If sensors are already active, provide current data
        if (this.isInitialized && this.fallbackData.timestamp > 0) {
            callback(this.fallbackData);
        }
    }

    /**
     * Unregister callback
     */
    unregisterCallback(id) {
        const removed = this.callbacks.delete(id);
        if (removed) {
            console.log(`Callback ${id} unregistered`);
        }
        return removed;
    }

    /**
     * Get current sensor status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isPermissionGranted: this.isPermissionGranted,
            sensorType: this.sensorType,
            isCalibrated: this.isCalibrated,
            errorState: this.errorState,
            retryCount: this.retryCount,
            callbackCount: this.callbacks.size
        };
    }

    /**
     * Request permission with user-friendly UI
     * CRITICAL: This must be called directly from a user gesture (button click)
     * to maintain synchronous call stack for iOS Safari
     */
    async requestPermissionWithUI() {
        try {
            console.log('📱 [PERMISSION] requestPermissionWithUI called from user gesture');

            // If already initialized and permission granted, return success
            if (this.isInitialized && this.isPermissionGranted) {
                console.log('✅ [PERMISSION] Already initialized and granted');
                return { success: true, type: this.sensorType };
            }

            // Detect platform for API priority
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);

            console.log('📱 [PERMISSION] Platform:', { isIOS, isAndroid });

            // CRITICAL: Call permission request DIRECTLY without intermediate awaits
            // This maintains the user gesture call stack
            let permissionGranted = false;

            // iOS: Request DeviceMotion permission synchronously
            if (isIOS && typeof DeviceMotionEvent.requestPermission === 'function') {
                console.log('📱 [PERMISSION] Requesting iOS DeviceMotion permission...');
                try {
                    // CRITICAL: No await before this call - keep synchronous stack
                    const permission = await DeviceMotionEvent.requestPermission();
                    permissionGranted = (permission === 'granted');
                    console.log('📱 [PERMISSION] iOS permission result:', permission);

                    if (permissionGranted) {
                        // Now initialize the rest asynchronously
                        // Skip permission request since we just did it
                        const result = await this.tryDeviceMotionAPI(true);
                        if (result) {
                            this.sensorType = 'devicemotion';
                            this.isInitialized = true;
                            this.isPermissionGranted = true;
                            this.loadCalibration();
                            return { success: true, type: 'devicemotion' };
                        }
                    }
                } catch (error) {
                    console.error('📱 [PERMISSION] iOS permission request failed:', error);
                    return { success: false, error: error.message };
                }
            }

            // Android/Other: Initialize normally
            if (!permissionGranted) {
                console.log('📱 [PERMISSION] Non-iOS or fallback - calling initialize()');
                const result = await this.initialize();
                return result;
            }

            return { success: false, error: 'Permission not granted' };

        } catch (error) {
            console.error('📱 [PERMISSION] Request failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        console.log('Cleaning up motion sensors...');
        
        // Stop Generic Sensor API sensors
        if (this.sensors.accelerometer) {
            try {
                this.sensors.accelerometer.stop();
            } catch (error) {
                console.warn('Error stopping accelerometer:', error);
            }
            this.sensors.accelerometer = null;
        }

        if (this.sensors.gyroscope) {
            try {
                this.sensors.gyroscope.stop();
            } catch (error) {
                console.warn('Error stopping gyroscope:', error);
            }
            this.sensors.gyroscope = null;
        }

        // Remove DeviceMotion listener
        if (this.sensorType === 'devicemotion') {
            window.removeEventListener('devicemotion', this.handleDeviceMotion);
        }

        // Clear callbacks
        this.callbacks.clear();
        
        // Reset state
        this.isInitialized = false;
        this.isPermissionGranted = false;
        this.sensorType = null;
        this.errorState = null;
        
        console.log('✅ Motion sensor cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotionSensorManager;
} else {
    window.MotionSensorManager = MotionSensorManager;
}