// Beautiful Button Effects for Fish Log App
// Based on MagicUI Components

// Initialize all beautiful button effects
function initializeBeautifulButtons() {
    trackScrollState();
    initializeRippleEffects();
    initializeInteractiveButtons();
    initializeShinyButtons();
    console.log('Beautiful button effects initialized with scroll protection');
}

// Universal ripple effect for all buttons
function initializeRippleEffects() {
    // Add ripple effect to all buttons
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (button && !button.disabled) {
            // Only create ripple effect if not scrolling, but don't block the actual click
            if (!isCurrentlyScrolling()) {
                createRippleEffect(e, button);
            }
        }
    });
    
    // Enhanced touch event protection
    document.addEventListener('touchend', function(e) {
        const button = e.target.closest('button');
        if (button && button.type === 'submit') {
            // Prevent submit buttons during any form of scrolling
            if (isCurrentlyScrolling()) {
                console.log('Blocking submit button during scroll:', {
                    isScrolling,
                    isTouchScrolling,
                    timeSinceScroll: Date.now() - lastScrollTime,
                    timeSinceTouchMove: Date.now() - lastTouchMoveTime,
                    scrollVelocity
                });
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    });
    
    // Additional protection for click events during scrolling
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (button && button.type === 'submit' && isCurrentlyScrolling()) {
            console.log('Blocking submit button click during scroll');
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true); // Use capture phase to catch early
}

function createRippleEffect(event, button) {
    // Skip if button has its own custom ripple
    if (button.classList.contains('no-ripple')) return;
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    // Create ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-span');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        z-index: 1000;
    `;

    // Ensure button has relative positioning
    const originalPosition = button.style.position;
    if (!originalPosition || originalPosition === 'static') {
        button.style.position = 'relative';
    }
    
    // Add overflow hidden temporarily
    const originalOverflow = button.style.overflow;
    button.style.overflow = 'hidden';

    button.appendChild(ripple);

    // Clean up after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
            // Restore original styles
            if (!originalPosition || originalPosition === 'static') {
                button.style.position = '';
            }
            if (!originalOverflow) {
                button.style.overflow = '';
            }
        }
    }, 600);
}

// Shiny button animation enhancements
function initializeShinyButtons() {
    const shinyButtons = document.querySelectorAll('.shiny-button');
    shinyButtons.forEach(button => {
        // Enhanced hover effects
        button.addEventListener('mouseenter', function() {
            this.style.setProperty('--x', '-100%');
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.setProperty('--x', '100%');
        });
    });
}

// Interactive hover buttons
function initializeInteractiveButtons() {
    const interactiveButtons = document.querySelectorAll('.interactive-hover-button');
    
    interactiveButtons.forEach(button => {
        // Add required HTML structure if not present
        if (!button.querySelector('.button-content')) {
            const text = button.textContent;
            button.innerHTML = `
                <div class="button-content">
                    <div class="button-dot"></div>
                    <span class="button-text">${text}</span>
                </div>
                <span class="button-arrow">→</span>
            `;
        }
    });
}

// Apply beautiful button styles to existing buttons
function applyBeautifulButtonStyles() {
    // Save Catch button - now using shiny button instead of rainbow
    const saveCatchBtn = document.querySelector('#catch-form button[type="submit"]');
    if (saveCatchBtn && !saveCatchBtn.classList.contains('beautiful-styled')) {
        saveCatchBtn.classList.add('shiny-button', 'ripple-effect', 'beautiful-styled');
        // Remove rainbow class if present
        saveCatchBtn.classList.remove('rainbow-button');
    }

    // Location buttons - keep them shiny themed
    const locationBtns = document.querySelectorAll('#get-location-btn');
    locationBtns.forEach(btn => {
        if (btn && !btn.classList.contains('beautiful-styled')) {
            btn.classList.add('shiny-button', 'beautiful-styled');
        }
    });

    // Tab buttons - add subtle ripple
    const tabBtns = document.querySelectorAll('.tab-button');
    tabBtns.forEach(btn => {
        if (btn && !btn.classList.contains('beautiful-styled')) {
            btn.classList.add('ripple-effect', 'beautiful-styled');
        }
    });

    // Other action buttons - add ripple effects
    const actionBtns = document.querySelectorAll('#edit-catch-btn, #delete-catch-btn, #manage-species-btn');
    actionBtns.forEach(btn => {
        if (btn && !btn.classList.contains('beautiful-styled')) {
            btn.classList.add('ripple-effect', 'beautiful-styled');
        }
    });

    console.log('Beautiful button styles applied to existing buttons');
}

// Enhanced button click effects
function addButtonClickEffects() {
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button || button.disabled) return;

        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        // Add success feedback for save buttons
        if (button.classList.contains('shiny-button') && button.textContent.includes('Save')) {
            addSuccessFeedback(button);
        }
    });
}

function addSuccessFeedback(button) {
    const originalText = button.innerHTML;
    const originalClass = button.className;
    
    // Temporarily change button appearance
    button.innerHTML = '<span class="lucide lucide-save"></span> ✓ Saved!';
    button.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    button.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
        button.style.transform = '';
    }, 1500);
}

// Enhanced scroll detection to prevent accidental button clicks
let isScrolling = false;
let isTouchScrolling = false;
let scrollTimeout;
let touchScrollTimeout;
let lastScrollTime = 0;
let lastTouchMoveTime = 0;
let scrollVelocity = 0;
let lastScrollY = 0;

// Track scroll state with improved detection
function trackScrollState() {
    // Track regular scroll events
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const currentTime = Date.now();
        
        // Calculate scroll velocity
        if (lastScrollTime > 0) {
            const deltaY = Math.abs(currentScrollY - lastScrollY);
            const deltaTime = currentTime - lastScrollTime;
            scrollVelocity = deltaTime > 0 ? deltaY / deltaTime : 0;
        }
        
        lastScrollY = currentScrollY;
        lastScrollTime = currentTime;
        isScrolling = true;
        
        clearTimeout(scrollTimeout);
        
        // Use dynamic timeout based on scroll velocity
        const timeoutDelay = Math.max(50, Math.min(200, 100 + (scrollVelocity * 10)));
        
        scrollTimeout = setTimeout(function() {
            isScrolling = false;
            scrollVelocity = 0;
        }, timeoutDelay);
    }, { passive: true });
    
    // Track touch-based scrolling with enhanced detection
    document.addEventListener('touchstart', function() {
        // Reset touch scrolling state on new touch
        isTouchScrolling = false;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        isTouchScrolling = true;
        lastTouchMoveTime = Date.now();
        
        clearTimeout(touchScrollTimeout);
        
        touchScrollTimeout = setTimeout(function() {
            isTouchScrolling = false;
        }, 150); // Slightly longer timeout for touch
    }, { passive: true });
    
    // Additional protection for momentum scrolling on iOS
    document.addEventListener('touchend', function() {
        if (isTouchScrolling) {
            // Extend the protection period for momentum scrolling
            clearTimeout(touchScrollTimeout);
            touchScrollTimeout = setTimeout(function() {
                isTouchScrolling = false;
            }, 300); // Longer timeout to account for iOS momentum scrolling
        }
    }, { passive: true });
}

// Helper function to check if user is currently scrolling
function isCurrentlyScrolling() {
    const now = Date.now();
    const timeSinceScroll = now - lastScrollTime;
    const timeSinceTouchMove = now - lastTouchMoveTime;
    
    return isScrolling || 
           isTouchScrolling || 
           timeSinceScroll < 100 || 
           timeSinceTouchMove < 150 ||
           scrollVelocity > 0.5; // High velocity indicates recent scrolling
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            initializeBeautifulButtons();
            applyBeautifulButtonStyles();
            addButtonClickEffects();
            trackScrollState();
        } catch (err) {
            console.error('Error initializing beautiful buttons:', err);
        }
    }, 100);
});

// Re-apply styles when new elements are added (for dynamic content)
function reapplyBeautifulStyles() {
    try {
        applyBeautifulButtonStyles();
        initializeInteractiveButtons();
        initializeShinyButtons();
    } catch (err) {
        console.error('Error reapplying beautiful button styles:', err);
    }
}

// Export for use in other scripts
window.beautifulButtons = {
    initialize: initializeBeautifulButtons,
    applyStyles: applyBeautifulButtonStyles,
    reapply: reapplyBeautifulStyles,
    createRipple: createRippleEffect,
    isScrolling: isCurrentlyScrolling,
    addSuccessFeedback: addSuccessFeedback
};
