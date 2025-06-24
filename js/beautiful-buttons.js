// Beautiful Button Effects for Fish Log App
// Based on MagicUI Components

// Initialize all beautiful button effects
function initializeBeautifulButtons() {
    initializeRippleButtons();
    initializeInteractiveButtons();
    console.log('Beautiful button effects initialized');
}

// Ripple effect for buttons
function initializeRippleButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ripple-button')) {
            createRipple(e);
        }
    });
}

function createRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
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
    // Save Catch button - make it rainbow
    const saveCatchBtn = document.querySelector('#catch-form button[type="submit"]');
    if (saveCatchBtn && !saveCatchBtn.classList.contains('beautiful-styled')) {
        saveCatchBtn.classList.add('rainbow-button', 'beautiful-styled');
    }

    // Location buttons - make them nature themed
    const locationBtns = document.querySelectorAll('#get-location-btn, #edit-location-btn');
    locationBtns.forEach(btn => {
        if (btn && !btn.classList.contains('beautiful-styled')) {
            btn.classList.add('nature-button', 'beautiful-styled');
        }
    });

    // Map modal buttons
    const useCurrentLocationBtn = document.querySelector('#use-current-location-btn');
    if (useCurrentLocationBtn && !useCurrentLocationBtn.classList.contains('beautiful-styled')) {
        useCurrentLocationBtn.classList.add('shimmer-button', 'beautiful-styled');
    }

    const saveMapLocationBtn = document.querySelector('#save-map-location-btn');
    if (saveMapLocationBtn && !saveMapLocationBtn.classList.contains('beautiful-styled')) {
        saveMapLocationBtn.classList.add('pulsating-button', 'beautiful-styled');
    }

    // Delete buttons - make them warning themed
    const deleteBtns = document.querySelectorAll('.delete-btn, #confirm-action-btn');
    deleteBtns.forEach(btn => {
        if (btn && !btn.classList.contains('beautiful-styled')) {
            btn.classList.add('warning-button', 'beautiful-styled');
        }
    });

    // Other action buttons - make them interactive
    const actionBtns = document.querySelectorAll('.edit-btn, .view-btn, #cancel-action-btn');
    actionBtns.forEach(btn => {
        if (btn && !btn.classList.contains('beautiful-styled')) {
            btn.classList.add('interactive-hover-button', 'beautiful-styled');
        }
    });

    console.log('Beautiful button styles applied to existing buttons');
}

// Enhanced button click effects
function addButtonClickEffects() {
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;

        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        // Add success feedback for save buttons
        if (button.classList.contains('rainbow-button') || button.classList.contains('pulsating-button')) {
            addSuccessFeedback(button);
        }
    });
}

function addSuccessFeedback(button) {
    const originalText = button.textContent;
    const originalClass = button.className;
    
    // Temporarily change button appearance
    button.textContent = '✓ Saved!';
    button.classList.add('success-feedback');
    button.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.className = originalClass;
        button.style.background = '';
    }, 2000);
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
}

// Export for use in other scripts
window.beautifulButtons = {
    initialize: initializeBeautifulButtons,
    applyStyles: applyBeautifulButtonStyles,
    reapply: reapplyBeautifulStyles,
    createRipple: createRipple
};
