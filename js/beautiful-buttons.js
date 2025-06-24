// Beautiful Button Effects for Fish Log App
// Based on MagicUI Components

// Initialize all beautiful button effects
function initializeBeautifulButtons() {
    initializeRippleEffects();
    initializeInteractiveButtons();
    initializeShinyButtons();
    console.log('Beautiful button effects initialized');
}

// Universal ripple effect for all buttons
function initializeRippleEffects() {
    // Add ripple effect to all buttons
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (button && !button.disabled) {
            createRippleEffect(e, button);
        }
    });
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        initializeBeautifulButtons();
        applyBeautifulButtonStyles();
        addButtonClickEffects();
    }, 100);
});

// Re-apply styles when new elements are added (for dynamic content)
function reapplyBeautifulStyles() {
    applyBeautifulButtonStyles();
    initializeInteractiveButtons();
    initializeShinyButtons();
}

// Export for use in other scripts
window.beautifulButtons = {
    initialize: initializeBeautifulButtons,
    applyStyles: applyBeautifulButtonStyles,
    reapply: reapplyBeautifulStyles,
    createRipple: createRippleEffect
};
