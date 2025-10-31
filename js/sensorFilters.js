/**
 * Sensor Data Filters for Motion-Controlled Fishing Game
 * Implements One Euro Filter and other smoothing algorithms for responsive controls
 */

/**
 * One Euro Filter - Optimal balance between smoothness and latency for real-time gaming
 * Based on: http://cristal.univ-lille.fr/~casiez/1euro/
 */
class OneEuroFilter {
    constructor(minCutoff = 1.0, beta = 0.007, derivateCutoff = 1.0) {
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.derivateCutoff = derivateCutoff;
        
        this.x = new LowPassFilter();
        this.dx = new LowPassFilter();
        this.lastTimestamp = null;
    }

    filter(value, timestamp = Date.now()) {
        if (this.lastTimestamp !== null && timestamp !== this.lastTimestamp) {
            const dt = (timestamp - this.lastTimestamp) / 1000.0;
            const derivative = (value - this.x.previousValue) / dt;
            const edx = this.dx.filter(derivative, this.calculateAlpha(dt, this.derivateCutoff));
            const cutoff = this.minCutoff + this.beta * Math.abs(edx);
            const alpha = this.calculateAlpha(dt, cutoff);
            this.x.alpha = alpha;
        }

        this.lastTimestamp = timestamp;
        return this.x.filter(value);
    }

    calculateAlpha(dt, cutoff) {
        const tau = 1.0 / (2 * Math.PI * cutoff);
        return 1.0 / (1.0 + tau / dt);
    }

    reset() {
        this.x.reset();
        this.dx.reset();
        this.lastTimestamp = null;
    }
}

/**
 * Low Pass Filter - Simple exponential smoothing
 */
class LowPassFilter {
    constructor(alpha = 0.5) {
        this.alpha = alpha;
        this.previousValue = null;
    }

    filter(value, alpha = null) {
        if (alpha !== null) {
            this.alpha = alpha;
        }

        if (this.previousValue === null) {
            this.previousValue = value;
            return value;
        }

        const filtered = this.alpha * value + (1 - this.alpha) * this.previousValue;
        this.previousValue = filtered;
        return filtered;
    }

    reset() {
        this.previousValue = null;
    }
}

/**
 * Moving Average Filter - For less time-critical data processing
 */
class MovingAverageFilter {
    constructor(windowSize = 5) {
        this.windowSize = Math.max(1, windowSize);
        this.values = [];
    }

    filter(value) {
        this.values.push(value);
        
        if (this.values.length > this.windowSize) {
            this.values.shift();
        }

        return this.values.reduce((sum, val) => sum + val, 0) / this.values.length;
    }

    reset() {
        this.values = [];
    }
}

/**
 * Complementary Filter - For sensor fusion (accelerometer + gyroscope)
 */
class ComplementaryFilter {
    constructor(alpha = 0.98) {
        this.alpha = alpha;
        this.angle = 0;
        this.lastTimestamp = null;
    }

    filter(accelerometerAngle, gyroscopeRate, timestamp = Date.now()) {
        if (this.lastTimestamp !== null) {
            const dt = (timestamp - this.lastTimestamp) / 1000.0;
            
            // Complementary filter: combine accelerometer (long-term) and gyroscope (short-term)
            this.angle = this.alpha * (this.angle + gyroscopeRate * dt) + 
                        (1 - this.alpha) * accelerometerAngle;
        } else {
            this.angle = accelerometerAngle;
        }

        this.lastTimestamp = timestamp;
        return this.angle;
    }

    reset() {
        this.angle = 0;
        this.lastTimestamp = null;
    }
}

/**
 * Vector3D Filter - Applies filters to 3D vector data (acceleration, rotation)
 */
class Vector3DFilter {
    constructor(FilterClass, ...filterArgs) {
        this.x = new FilterClass(...filterArgs);
        this.y = new FilterClass(...filterArgs);
        this.z = new FilterClass(...filterArgs);
    }

    filter(vector, timestamp) {
        return {
            x: this.x.filter(vector.x, timestamp),
            y: this.y.filter(vector.y, timestamp),
            z: this.z.filter(vector.z, timestamp)
        };
    }

    reset() {
        this.x.reset();
        this.y.reset();
        this.z.reset();
    }
}

/**
 * Sensor Data Processor - Main class for processing and filtering sensor data
 */
class SensorDataProcessor {
    constructor(options = {}) {
        this.options = {
            // One Euro Filter settings
            minCutoff: options.minCutoff || 1.0,
            beta: options.beta || 0.007,
            derivateCutoff: options.derivateCutoff || 1.0,
            
            // Moving average settings
            movingAverageWindow: options.movingAverageWindow || 5,
            
            // Complementary filter settings
            complementaryAlpha: options.complementaryAlpha || 0.98,
            
            // Processing options
            enableFiltering: options.enableFiltering !== false,
            enableNormalization: options.enableNormalization !== false,
            enableDeadzone: options.enableDeadzone !== false,
            deadzoneThreshold: options.deadzoneThreshold || 0.1,
            
            ...options
        };

        this.initializeFilters();
        this.calibrationData = null;
        this.statistics = {
            samplesProcessed: 0,
            lastProcessingTime: 0,
            averageProcessingTime: 0
        };
    }

    initializeFilters() {
        // One Euro filters for high-precision real-time data
        this.accelerationFilter = new Vector3DFilter(
            OneEuroFilter,
            this.options.minCutoff,
            this.options.beta,
            this.options.derivateCutoff
        );

        this.rotationFilter = new Vector3DFilter(
            OneEuroFilter,
            this.options.minCutoff,
            this.options.beta,
            this.options.derivateCutoff
        );

        // Moving average filters for less critical data
        this.accelerationAverage = new Vector3DFilter(
            MovingAverageFilter,
            this.options.movingAverageWindow
        );

        this.rotationAverage = new Vector3DFilter(
            MovingAverageFilter,
            this.options.movingAverageWindow
        );

        // Complementary filters for sensor fusion
        this.orientationFilter = {
            pitch: new ComplementaryFilter(this.options.complementaryAlpha),
            roll: new ComplementaryFilter(this.options.complementaryAlpha),
            yaw: new ComplementaryFilter(this.options.complementaryAlpha)
        };
    }

    /**
     * Process raw sensor data with filtering and normalization
     */
    process(rawData) {
        const startTime = performance.now();

        try {
            let processedData = { ...rawData };

            // Apply calibration if available
            if (this.calibrationData && this.options.enableNormalization) {
                processedData = this.applyCalibration(processedData);
            }

            // Apply filtering if enabled
            if (this.options.enableFiltering) {
                processedData.acceleration = this.accelerationFilter.filter(
                    processedData.acceleration, 
                    rawData.timestamp
                );

                processedData.rotation = this.rotationFilter.filter(
                    processedData.rotation, 
                    rawData.timestamp
                );
            }

            // Apply deadzone filtering
            if (this.options.enableDeadzone) {
                processedData.acceleration = this.applyDeadzone(
                    processedData.acceleration, 
                    this.options.deadzoneThreshold
                );
                
                processedData.rotation = this.applyDeadzone(
                    processedData.rotation, 
                    this.options.deadzoneThreshold
                );
            }

            // Calculate derived data
            processedData.accelerationMagnitude = this.calculateMagnitude(processedData.acceleration);
            processedData.rotationMagnitude = this.calculateMagnitude(processedData.rotation);

            // Update statistics
            this.updateStatistics(performance.now() - startTime);

            return processedData;

        } catch (error) {
            console.error('Error processing sensor data:', error);
            return rawData; // Return unprocessed data on error
        }
    }

    /**
     * Apply calibration offset to sensor data
     */
    applyCalibration(data) {
        if (!this.calibrationData) return data;

        return {
            ...data,
            acceleration: {
                x: data.acceleration.x - this.calibrationData.acceleration.x,
                y: data.acceleration.y - this.calibrationData.acceleration.y,
                z: data.acceleration.z - this.calibrationData.acceleration.z
            },
            rotation: {
                alpha: data.rotation.alpha - this.calibrationData.rotation.alpha,
                beta: data.rotation.beta - this.calibrationData.rotation.beta,
                gamma: data.rotation.gamma - this.calibrationData.rotation.gamma
            }
        };
    }

    /**
     * Apply deadzone filtering to reduce noise
     */
    applyDeadzone(vector, threshold) {
        return {
            x: Math.abs(vector.x) < threshold ? 0 : vector.x,
            y: Math.abs(vector.y) < threshold ? 0 : vector.y,
            z: Math.abs(vector.z) < threshold ? 0 : vector.z
        };
    }

    /**
     * Calculate magnitude of 3D vector
     */
    calculateMagnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    }

    /**
     * Set calibration data for normalization
     */
    setCalibration(calibrationData) {
        this.calibrationData = {
            acceleration: { ...calibrationData.acceleration },
            rotation: { ...calibrationData.rotation },
            timestamp: calibrationData.timestamp
        };
        console.log('Sensor calibration data updated');
    }

    /**
     * Clear calibration data
     */
    clearCalibration() {
        this.calibrationData = null;
        console.log('Sensor calibration cleared');
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.accelerationFilter.reset();
        this.rotationFilter.reset();
        this.accelerationAverage.reset();
        this.rotationAverage.reset();
        
        Object.values(this.orientationFilter).forEach(filter => filter.reset());
        
        console.log('All sensor filters reset');
    }

    /**
     * Update processing statistics
     */
    updateStatistics(processingTime) {
        this.statistics.samplesProcessed++;
        this.statistics.lastProcessingTime = processingTime;
        
        // Calculate rolling average processing time
        const alpha = 0.1; // Smoothing factor
        this.statistics.averageProcessingTime = 
            alpha * processingTime + (1 - alpha) * this.statistics.averageProcessingTime;
    }

    /**
     * Get processing statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            isCalibrated: this.calibrationData !== null,
            filterSettings: { ...this.options }
        };
    }

    /**
     * Update filter settings dynamically
     */
    updateSettings(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        // Reinitialize filters if critical parameters changed
        if (newOptions.minCutoff !== undefined || 
            newOptions.beta !== undefined || 
            newOptions.derivateCutoff !== undefined) {
            this.initializeFilters();
        }
        
        console.log('Sensor filter settings updated:', newOptions);
    }
}

/**
 * Filter Profile Manager
 * Manages different filter configurations for different fishing gestures
 */
class FilterProfileManager {
    constructor() {
        // Define filter profiles for different gesture types
        this.profiles = {
            // Casting: Fast, sudden motion - needs high responsiveness
            casting: {
                minCutoff: 1.5,      // Higher = less smoothing, more responsive
                beta: 0.05,          // Higher = more responsive to speed changes
                derivateCutoff: 1.5,
                description: 'Optimized for fast casting motions'
            },

            // Reeling: Continuous, smooth circular motion
            reeling: {
                minCutoff: 1.0,      // Balanced smoothing
                beta: 0.007,         // Lower = smoother, less jittery
                derivateCutoff: 1.0,
                description: 'Optimized for smooth reeling motions'
            },

            // Fighting: Erratic fish movements requiring moderate response
            fighting: {
                minCutoff: 1.2,      // Moderate smoothing
                beta: 0.02,          // Moderate responsiveness
                derivateCutoff: 1.2,
                description: 'Optimized for fighting fish movements'
            },

            // Idle: Very smooth, minimal motion expected
            idle: {
                minCutoff: 0.5,      // Low = more smoothing
                beta: 0.001,         // Very low = very smooth
                derivateCutoff: 0.5,
                description: 'Optimized for idle state'
            },

            // Default: Balanced for general use
            default: {
                minCutoff: 1.0,
                beta: 0.007,
                derivateCutoff: 1.0,
                description: 'Balanced default profile'
            }
        };

        this.currentProfile = 'default';
        this.transitionDuration = 200; // ms to blend between profiles
        this.transitionStartTime = null;
        this.fromProfile = null;
        this.toProfile = null;
    }

    /**
     * Get filter parameters for a specific gesture type
     */
    getProfile(gestureType) {
        return this.profiles[gestureType] || this.profiles.default;
    }

    /**
     * Set the current active profile with smooth transition
     */
    setProfile(gestureType) {
        if (gestureType === this.currentProfile) return;

        if (this.profiles[gestureType]) {
            this.fromProfile = this.currentProfile;
            this.toProfile = gestureType;
            this.transitionStartTime = Date.now();
            this.currentProfile = gestureType;

            console.log(`Filter profile transitioning: ${this.fromProfile} → ${this.toProfile}`);
        } else {
            console.warn(`Unknown gesture type: ${gestureType}, using default`);
        }
    }

    /**
     * Get current filter parameters with smooth transition
     */
    getCurrentParameters() {
        if (this.transitionStartTime) {
            const elapsed = Date.now() - this.transitionStartTime;
            const t = Math.min(elapsed / this.transitionDuration, 1.0);

            if (t >= 1.0) {
                // Transition complete
                this.transitionStartTime = null;
                this.fromProfile = null;
                this.toProfile = null;
                return this.profiles[this.currentProfile];
            }

            // Interpolate between profiles
            const from = this.profiles[this.fromProfile];
            const to = this.profiles[this.toProfile];

            return {
                minCutoff: this.lerp(from.minCutoff, to.minCutoff, t),
                beta: this.lerp(from.beta, to.beta, t),
                derivateCutoff: this.lerp(from.derivateCutoff, to.derivateCutoff, t),
                description: `Transitioning: ${from.description} → ${to.description}`
            };
        }

        return this.profiles[this.currentProfile];
    }

    /**
     * Linear interpolation helper
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Get all available profiles
     */
    getAllProfiles() {
        return Object.keys(this.profiles).map(key => ({
            name: key,
            ...this.profiles[key]
        }));
    }

    /**
     * Add or update a custom profile
     */
    addProfile(name, params) {
        this.profiles[name] = {
            minCutoff: params.minCutoff || 1.0,
            beta: params.beta || 0.007,
            derivateCutoff: params.derivateCutoff || 1.0,
            description: params.description || `Custom profile: ${name}`
        };

        console.log(`Filter profile added: ${name}`, this.profiles[name]);
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OneEuroFilter,
        LowPassFilter,
        MovingAverageFilter,
        ComplementaryFilter,
        Vector3DFilter,
        SensorDataProcessor,
        FilterProfileManager
    };
} else {
    window.SensorFilters = {
        OneEuroFilter,
        LowPassFilter,
        MovingAverageFilter,
        ComplementaryFilter,
        Vector3DFilter,
        SensorDataProcessor,
        FilterProfileManager
    };
}