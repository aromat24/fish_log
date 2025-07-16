/**
 * Service Worker Update Manager for Fish Log PWA
 * Handles automatic updates and user notifications
 */

class ServiceWorkerUpdateManager {
    constructor() {
        this.registration = null;
        this.refreshing = false;
        this.newWorkerAvailable = false;
        
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                // Register service worker
                this.registration = await navigator.serviceWorker.register('./sw.js');
                logger.log('Service Worker registered successfully');
                
                // Set up update detection
                this.setupUpdateDetection();
                
                // Check for updates immediately
                this.checkForUpdates();
                
                // Check for updates every 30 seconds when app is active
                this.setupPeriodicChecks();
                
            } catch (error) {
                logger.error('Service Worker registration failed:', error);
            }
        } else {
            logger.warn('Service Worker not supported in this browser');
        }
    }

    setupUpdateDetection() {
        if (!this.registration) return;

        // Listen for new service worker installations
        this.registration.addEventListener('updatefound', () => {
            logger.log('New service worker found, installing...');
            
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    logger.log('New service worker installed, waiting to activate');
                    this.newWorkerAvailable = true;
                    this.showUpdateNotification();
                }
            });
        });

        // Listen for service worker activation
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (this.refreshing) return;
            logger.log('Service worker activated, reloading app');
            this.refreshing = true;
            window.location.reload();
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SKIP_WAITING') {
                this.activateNewServiceWorker();
            }
        });
    }

    async checkForUpdates() {
        if (!this.registration) return;

        try {
            await this.registration.update();
            logger.debug('SW Update', 'Checked for service worker updates');
        } catch (error) {
            logger.warn('Failed to check for service worker updates:', error);
        }
    }

    setupPeriodicChecks() {
        // Check for updates every 30 seconds when page is visible
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.checkForUpdates();
            }
        }, 30000);

        // Check for updates when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !document.hidden) {
                setTimeout(() => this.checkForUpdates(), 1000);
            }
        });

        // Check for updates on focus
        window.addEventListener('focus', () => {
            setTimeout(() => this.checkForUpdates(), 1000);
        });
    }

    showUpdateNotification() {
        // Create update notification UI
        const notification = this.createUpdateNotification();
        document.body.appendChild(notification);

        // Auto-hide after 10 seconds if not interacted with
        setTimeout(() => {
            if (notification.parentNode) {
                this.hideUpdateNotification(notification);
            }
        }, 10000);
    }

    createUpdateNotification() {
        const notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-[9999] max-w-sm';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="mr-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                    </div>
                    <div>
                        <p class="font-semibold text-sm">Update Available!</p>
                        <p class="text-xs opacity-90">New features and improvements ready</p>
                    </div>
                </div>
                <button id="close-update-notification" class="ml-4 text-white active:text-gray-200 focus:text-gray-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="mt-3 flex gap-2">
                <button id="update-now-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium active:bg-gray-100 focus:bg-gray-100 transition-colors">
                    Update Now
                </button>
                <button id="update-later-btn" class="border border-white text-white px-3 py-1 rounded text-sm active:bg-white active:text-blue-600 focus:bg-white focus:text-blue-600 transition-colors">
                    Later
                </button>
            </div>
        `;

        // Add event listeners
        notification.querySelector('#update-now-btn').addEventListener('click', () => {
            this.activateNewServiceWorker();
            this.hideUpdateNotification(notification);
        });

        notification.querySelector('#update-later-btn').addEventListener('click', () => {
            this.hideUpdateNotification(notification);
        });

        notification.querySelector('#close-update-notification').addEventListener('click', () => {
            this.hideUpdateNotification(notification);
        });

        return notification;
    }

    hideUpdateNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    activateNewServiceWorker() {
        if (!this.registration || !this.registration.waiting) {
            logger.warn('No waiting service worker to activate');
            return;
        }

        logger.log('Activating new service worker...');
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Manual update check (can be called from UI)
    async forceUpdate() {
        logger.log('Force checking for updates...');
        await this.checkForUpdates();
        
        // If there's a waiting worker, activate it immediately
        if (this.registration && this.registration.waiting) {
            this.activateNewServiceWorker();
        } else {
            // Show feedback that we checked
            this.showNoUpdateNotification();
        }
    }

    showNoUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-[9999]';
        notification.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-sm font-medium">You're up to date!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 2000);
    }

    // Get current service worker status
    getStatus() {
        return {
            supported: 'serviceWorker' in navigator,
            registered: !!this.registration,
            newWorkerAvailable: this.newWorkerAvailable,
            controller: !!navigator.serviceWorker.controller
        };
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.swUpdateManager = new ServiceWorkerUpdateManager();
    });
} else {
    window.swUpdateManager = new ServiceWorkerUpdateManager();
}

// Export for global access
window.ServiceWorkerUpdateManager = ServiceWorkerUpdateManager;