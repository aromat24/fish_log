/**
 * Motion Permission UI Manager
 * Handles user-friendly consent flows for motion sensor permissions
 * Provides clear explanations and graceful degradation options
 */

class MotionPermissionUI {
    constructor() {
        this.isShowing = false;
        this.currentModal = null;
        this.permissionCallbacks = new Map();
        this.motionSensorManager = null;
        
        this.createModalElements();
        console.log('MotionPermissionUI initialized');
    }

    /**
     * Set reference to motion sensor manager
     */
    setMotionSensorManager(manager) {
        this.motionSensorManager = manager;
    }

    /**
     * Create permission modal elements
     */
    createModalElements() {
        // Create main permission modal
        this.createPermissionModal();
        
        // Create error modal
        this.createErrorModal();
        
        // Create calibration modal
        this.createCalibrationModal();
    }

    /**
     * Create the main permission request modal
     */
    createPermissionModal() {
        const modal = document.createElement('div');
        modal.id = 'motion-permission-modal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1400] p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border-beam-container relative">
                <div class="border-beam"></div>
                <!-- Close button -->
                <button id="close-permission-modal" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors">
                    ✕
                </button>
                <div class="space-y-4">
                    <div class="text-center">
                        <div class="text-6xl mb-4">🎣</div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Enable Motion Controls</h3>
                        <p class="text-sm text-gray-600">
                            Experience realistic fishing with motion controls! Cast your line and reel in catches using your device's movement.
                        </p>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <div class="flex items-start">
                            <div class="text-blue-400 mr-3 mt-0.5">ℹ️</div>
                            <div>
                                <h4 class="font-semibold text-blue-800 text-sm">How it works:</h4>
                                <ul class="text-xs text-blue-700 mt-1 space-y-1">
                                    <li>• Cast: Quick forward motion</li>
                                    <li>• Reel: Circular wrist movement</li>
                                    <li>• Works in portrait orientation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                        <div class="flex items-center">
                            <div class="text-green-400 mr-2">🔒</div>
                            <p class="text-xs text-green-700">
                                <strong>Privacy:</strong> Motion data stays on your device and is only used for game controls.
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-2">
                        <button id="enable-motion-btn" class="flex-1 shiny-button ripple-effect" 
                                style="--button-color: #22c55e; --button-bg: #dcfce7; --button-text: #15803d;">
                            🎮 Enable Motion Controls
                        </button>
                        <button id="skip-motion-btn" class="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors">
                            Skip
                        </button>
                    </div>
                    
                    <p class="text-xs text-gray-500 text-center">
                        You can always enable this later in game settings
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.permissionModal = modal;
        
        // Add event listeners
        modal.querySelector('#enable-motion-btn').addEventListener('click', () => {
            this.handleEnableMotion();
        });
        
        modal.querySelector('#skip-motion-btn').addEventListener('click', () => {
            this.handleSkipMotion();
        });
        
        modal.querySelector('#close-permission-modal').addEventListener('click', () => {
            this.handleSkipMotion(); // Treat close as skip
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.handleSkipMotion();
            }
        });
    }

    /**
     * Create error handling modal
     */
    createErrorModal() {
        const modal = document.createElement('div');
        modal.id = 'motion-error-modal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1400] p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div class="space-y-4">
                    <div class="text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Motion Controls Unavailable</h3>
                        <p id="error-message" class="text-sm text-gray-600 mb-4">
                            <!-- Error message will be inserted here -->
                        </p>
                    </div>
                    
                    <div class="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                        <div class="flex items-start">
                            <div class="text-amber-400 mr-3 mt-0.5">💡</div>
                            <div>
                                <h4 class="font-semibold text-amber-800 text-sm">Alternative Options:</h4>
                                <ul class="text-xs text-amber-700 mt-1 space-y-1">
                                    <li>• Use touch controls instead</li>
                                    <li>• Try refreshing the page</li>
                                    <li>• Check device settings</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-2">
                        <button id="retry-motion-btn" class="flex-1 shiny-button ripple-effect">
                            🔄 Try Again
                        </button>
                        <button id="use-touch-btn" class="flex-1 shiny-button ripple-effect" 
                                style="--button-color: #3b82f6; --button-bg: #dbeafe; --button-text: #1e40af;">
                            👆 Use Touch Controls
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.errorModal = modal;
        
        // Add event listeners
        modal.querySelector('#retry-motion-btn').addEventListener('click', () => {
            this.handleRetryMotion();
        });
        
        modal.querySelector('#use-touch-btn').addEventListener('click', () => {
            this.handleUseTouchControls();
        });
    }

    /**
     * Create calibration instruction modal
     */
    createCalibrationModal() {
        const modal = document.createElement('div');
        modal.id = 'motion-calibration-modal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1400] p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div class="space-y-4">
                    <div class="text-center">
                        <div class="text-6xl mb-4">📱</div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Calibrate Your Device</h3>
                        <p class="text-sm text-gray-600">
                            Hold your device in a comfortable fishing position, then tap calibrate.
                        </p>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <div class="flex items-start">
                            <div class="text-blue-400 mr-3 mt-0.5">📋</div>
                            <div>
                                <h4 class="font-semibold text-blue-800 text-sm">Instructions:</h4>
                                <ol class="text-xs text-blue-700 mt-1 space-y-1 list-decimal list-inside">
                                    <li>Hold device steady in portrait mode</li>
                                    <li>Position as if holding a fishing rod</li>
                                    <li>Keep device level and comfortable</li>
                                    <li>Tap "Calibrate" when ready</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <div id="calibration-countdown" class="text-3xl font-bold text-blue-600 mb-2 hidden">3</div>
                        <div id="calibration-status" class="text-sm text-gray-600">Ready to calibrate</div>
                    </div>
                    
                    <div class="flex gap-3 pt-2">
                        <button id="start-calibration-btn" class="flex-1 shiny-button ripple-effect" 
                                style="--button-color: #22c55e; --button-bg: #dcfce7; --button-text: #15803d;">
                            ⚖️ Calibrate Device
                        </button>
                        <button id="skip-calibration-btn" class="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors">
                            Skip
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.calibrationModal = modal;
        
        // Add event listeners
        modal.querySelector('#start-calibration-btn').addEventListener('click', () => {
            this.handleStartCalibration();
        });
        
        modal.querySelector('#skip-calibration-btn').addEventListener('click', () => {
            this.handleSkipCalibration();
        });
    }

    /**
     * Show permission request modal
     */
    async showPermissionRequest() {
        return new Promise((resolve) => {
            this.permissionCallbacks.set('permission', resolve);
            this.showModal(this.permissionModal);
            
            // Add timeout fallback to prevent hanging promises
            setTimeout(() => {
                const callback = this.permissionCallbacks.get('permission');
                if (callback) {
                    console.warn('Motion permission request timed out, auto-skipping');
                    this.permissionCallbacks.delete('permission');
                    this.hideCurrentModal();
                    callback({ granted: false, skipped: true, timeout: true });
                }
            }, 30000); // 30 second timeout
        });
    }

    /**
     * Show error modal with specific message
     */
    async showError(errorMessage, canRetry = true) {
        return new Promise((resolve) => {
            this.permissionCallbacks.set('error', resolve);
            
            // Update error message
            const messageElement = this.errorModal.querySelector('#error-message');
            messageElement.textContent = errorMessage;
            
            // Show/hide retry button based on canRetry
            const retryBtn = this.errorModal.querySelector('#retry-motion-btn');
            if (canRetry) {
                retryBtn.classList.remove('hidden');
            } else {
                retryBtn.classList.add('hidden');
            }
            
            this.showModal(this.errorModal);
        });
    }

    /**
     * Show calibration modal
     */
    async showCalibration() {
        return new Promise((resolve) => {
            this.permissionCallbacks.set('calibration', resolve);
            this.showModal(this.calibrationModal);
        });
    }

    /**
     * Show modal helper
     */
    showModal(modal) {
        if (this.currentModal) {
            this.hideCurrentModal();
        }
        
        modal.classList.remove('hidden');
        this.currentModal = modal;
        this.isShowing = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide current modal
     */
    hideCurrentModal() {
        if (this.currentModal) {
            this.currentModal.classList.add('hidden');
            this.currentModal = null;
        }
        
        this.isShowing = false;
        document.body.style.overflow = '';
    }

    /**
     * Handle enable motion button click
     */
    async handleEnableMotion() {
        const enableBtn = this.permissionModal.querySelector('#enable-motion-btn');
        const originalText = enableBtn.innerHTML;
        
        try {
            // Show loading state
            enableBtn.innerHTML = '⏳ Requesting Permission...';
            enableBtn.disabled = true;
            
            // Request motion sensor permission
            const result = await this.motionSensorManager.requestPermissionWithUI();
            
            this.hideCurrentModal();
            
            // Resolve the permission promise
            const callback = this.permissionCallbacks.get('permission');
            if (callback) {
                this.permissionCallbacks.delete('permission');
                callback({ granted: result.success, type: result.type });
            }
            
        } catch (error) {
            console.error('Permission request failed:', error);
            enableBtn.innerHTML = originalText;
            enableBtn.disabled = false;
            
            // Show error
            this.showError('Permission request failed. Please try again.', true);
        }
    }

    /**
     * Handle skip motion button click
     */
    handleSkipMotion() {
        this.hideCurrentModal();
        
        const callback = this.permissionCallbacks.get('permission');
        if (callback) {
            this.permissionCallbacks.delete('permission');
            callback({ granted: false, skipped: true });
        }
    }

    /**
     * Handle retry motion button click
     */
    async handleRetryMotion() {
        this.hideCurrentModal();
        
        const callback = this.permissionCallbacks.get('error');
        if (callback) {
            this.permissionCallbacks.delete('error');
            callback({ retry: true });
        }
    }

    /**
     * Handle use touch controls button click
     */
    handleUseTouchControls() {
        this.hideCurrentModal();
        
        const callback = this.permissionCallbacks.get('error');
        if (callback) {
            this.permissionCallbacks.delete('error');
            callback({ useTouchControls: true });
        }
    }

    /**
     * Handle start calibration button click
     */
    handleStartCalibration() {
        const countdownElement = this.calibrationModal.querySelector('#calibration-countdown');
        const statusElement = this.calibrationModal.querySelector('#calibration-status');
        const calibrateBtn = this.calibrationModal.querySelector('#start-calibration-btn');
        
        // Show countdown
        countdownElement.classList.remove('hidden');
        calibrateBtn.disabled = true;
        statusElement.textContent = 'Keep device steady...';
        
        let countdown = 3;
        countdownElement.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                
                // Perform calibration
                if (this.motionSensorManager) {
                    const success = this.motionSensorManager.calibrate();
                    
                    if (success) {
                        statusElement.textContent = '✅ Calibration complete!';
                        setTimeout(() => {
                            this.hideCurrentModal();
                            
                            const callback = this.permissionCallbacks.get('calibration');
                            if (callback) {
                                this.permissionCallbacks.delete('calibration');
                                callback({ calibrated: true });
                            }
                        }, 1500);
                    } else {
                        statusElement.textContent = '❌ Calibration failed. Try again.';
                        calibrateBtn.disabled = false;
                        countdownElement.classList.add('hidden');
                    }
                }
            }
        }, 1000);
    }

    /**
     * Handle skip calibration button click
     */
    handleSkipCalibration() {
        this.hideCurrentModal();
        
        const callback = this.permissionCallbacks.get('calibration');
        if (callback) {
            this.permissionCallbacks.delete('calibration');
            callback({ calibrated: false, skipped: true });
        }
    }

    /**
     * Show a simple notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-[1500] px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300`;
        
        // Style based on type
        switch (type) {
            case 'success':
                notification.className += ' bg-green-100 text-green-800 border-l-4 border-green-400';
                break;
            case 'error':
                notification.className += ' bg-red-100 text-red-800 border-l-4 border-red-400';
                break;
            case 'warning':
                notification.className += ' bg-amber-100 text-amber-800 border-l-4 border-amber-400';
                break;
            default:
                notification.className += ' bg-blue-100 text-blue-800 border-l-4 border-blue-400';
        }
        
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="text-sm font-medium">${message}</span>
                <button class="ml-3 text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">✖</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.hideCurrentModal();
        
        // Remove modal elements
        if (this.permissionModal) {
            this.permissionModal.remove();
        }
        if (this.errorModal) {
            this.errorModal.remove();
        }
        if (this.calibrationModal) {
            this.calibrationModal.remove();
        }
        
        // Clear callbacks
        this.permissionCallbacks.clear();
        
        console.log('MotionPermissionUI cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotionPermissionUI;
} else {
    window.MotionPermissionUI = MotionPermissionUI;
}