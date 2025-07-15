/**
 * Unified Event Manager for Fish Log PWA
 * Consolidates duplicate event handlers and improves performance
 */

class EventManager {
    constructor() {
        this.listeners = new Map();
        this.delegatedListeners = new Set();
        this.touchState = {
            isScrolling: false,
            lastMoveTime: 0,
            scrollTimeout: null
        };
        
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Global touch scroll detection
        document.addEventListener('touchstart', () => {
            this.touchState.isScrolling = false;
        }, { passive: true });

        document.addEventListener('touchmove', () => {
            this.touchState.isScrolling = true;
            this.touchState.lastMoveTime = Date.now();
            
            clearTimeout(this.touchState.scrollTimeout);
            this.touchState.scrollTimeout = setTimeout(() => {
                this.touchState.isScrolling = false;
            }, 150);
        }, { passive: true });

        document.addEventListener('touchend', () => {
            setTimeout(() => {
                this.touchState.isScrolling = false;
            }, 100);
        }, { passive: true });
    }

    isScrolling() {
        return this.touchState.isScrolling || 
               (Date.now() - this.touchState.lastMoveTime < 150);
    }

    // Add optimized event listener with automatic cleanup
    addListener(element, event, handler, options = {}) {
        if (!element) return;

        const key = `${element.tagName}-${event}`;
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }

        const wrappedHandler = (e) => {
            // Scroll protection for touch events
            if (event.includes('touch') && this.isScrolling()) {
                e.preventDefault();
                return false;
            }
            
            return handler(e);
        };

        element.addEventListener(event, wrappedHandler, options);
        this.listeners.get(key).add({ element, handler: wrappedHandler, original: handler });
        
        return wrappedHandler;
    }

    // Remove specific listener
    removeListener(element, event, originalHandler) {
        const key = `${element.tagName}-${event}`;
        const listeners = this.listeners.get(key);
        
        if (listeners) {
            const listener = Array.from(listeners).find(l => l.original === originalHandler);
            if (listener) {
                element.removeEventListener(event, listener.handler);
                listeners.delete(listener);
            }
        }
    }

    // Cleanup all listeners for memory management
    cleanup() {
        this.listeners.forEach((listeners, key) => {
            listeners.forEach(({ element, handler }) => {
                const event = key.split('-')[1];
                element.removeEventListener(event, handler);
            });
        });
        this.listeners.clear();
    }

    // Delegate click events for better performance with dynamic content
    delegateClick(container, selector, handler) {
        if (this.delegatedListeners.has(selector)) return;

        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && container.contains(target)) {
                // Prevent double-clicks
                if (target.dataset.processing) return;
                target.dataset.processing = 'true';
                
                setTimeout(() => {
                    delete target.dataset.processing;
                }, 300);

                handler.call(target, e);
            }
        };

        this.addListener(container, 'click', delegatedHandler);
        this.delegatedListeners.add(selector);
    }

    // Unified button handler that works across all devices
    setupButton(button, handler, options = {}) {
        if (!button) return;

        const { 
            preventDefault = true, 
            debounce = 300,
            loading = false 
        } = options;

        let isProcessing = false;

        const unifiedHandler = async (e) => {
            if (isProcessing) return;
            
            if (preventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Visual feedback
            if (loading) {
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = 'Loading...';
                
                isProcessing = true;
                
                try {
                    await handler(e);
                } finally {
                    setTimeout(() => {
                        button.disabled = false;
                        button.textContent = originalText;
                        isProcessing = false;
                    }, debounce);
                }
            } else {
                isProcessing = true;
                handler(e);
                
                setTimeout(() => {
                    isProcessing = false;
                }, debounce);
            }
        };

        // Add both click and touch for maximum compatibility
        this.addListener(button, 'click', unifiedHandler);
        
        // Only add touch if touch is supported
        if ('ontouchstart' in window) {
            this.addListener(button, 'touchend', unifiedHandler, { passive: false });
        }
    }

    // Setup form with validation and submission
    setupForm(form, submitHandler, options = {}) {
        if (!form) return;

        const { 
            validateOnSubmit = true,
            resetAfterSubmit = false 
        } = options;

        const formHandler = async (e) => {
            e.preventDefault();
            
            if (validateOnSubmit && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            try {
                await submitHandler(e);
                
                if (resetAfterSubmit) {
                    form.reset();
                }
            } catch (error) {
                logger.error('Form submission error:', error);
                
                if (window.errorHandler) {
                    window.errorHandler.handleError(error, 'Form Submission');
                }
            }
        };

        this.addListener(form, 'submit', formHandler);
        
        // Also setup the submit button if it exists
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            this.setupButton(submitButton, formHandler, { loading: true });
        }
    }

    // Setup modal with click-outside-to-close and ESC key
    setupModal(modal, closeHandler) {
        if (!modal) return;

        const modalHandler = (e) => {
            if (e.target === modal) {
                closeHandler();
            }
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeHandler();
            }
        };

        this.addListener(modal, 'click', modalHandler);
        this.addListener(document, 'keydown', keyHandler);
    }
}

// Global event manager instance
window.eventManager = new EventManager();