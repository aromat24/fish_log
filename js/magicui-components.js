/**
 * MagicUI Components for Fish Log PWA
 * Ripple Effect Buttons and Particles (CSS defined in beautiful-buttons.css)
 */

class MagicUIComponents {
    constructor() {
        this.attachButtonEffects();
        this.setupShinyButton();
    }

    // Add ripple effect to all clickable buttons except the enter logbook button
    attachButtonEffects() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachButtonEffects());
            return;
        }

        // Add ripple to all buttons except the main enter logbook button (which gets shiny effect)
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .btn, [role="button"]');
            
            // Exclude the enter button completely from ripple effects
            if (button && 
                button.id !== 'enter-app-btn' && 
                !button.id.includes('enter-app')) {
                this.createRippleEffect(button, e);
            }
        });

        console.log('🎨 MagicUI button effects attached');
    }

    createRippleEffect(element, event) {
        // Don't add ripple if element already creating one
        if (element.querySelector('.ripple-span')) {
            return;
        }

        // Check if element already has required styles, don't override if it does
        const computedStyle = window.getComputedStyle(element);
        const hasPosition = computedStyle.position !== 'static';
        const hasOverflow = computedStyle.overflow !== 'visible';
        
        // Only add styles if they're not already set properly
        if (!hasPosition) {
            element.style.position = 'relative';
        }
        if (!hasOverflow) {
            element.style.overflow = 'hidden';
        }

        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-span';
        ripple.style.left = x - 10 + 'px';
        ripple.style.top = y - 10 + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';

        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    setupShinyButton() {
        const enterButton = document.getElementById('enter-app-btn');
        if (enterButton) {
            // Remove any classes that might conflict, but don't modify positioning
            enterButton.classList.remove('shimmer-button', 'ripple-effect');
            
            // Ensure it has the shiny-button class
            if (!enterButton.classList.contains('shiny-button')) {
                enterButton.classList.add('shiny-button');
            }
            
            console.log('🌟 Shiny button effect applied to Enter Logbook button');
        }
    }

    // Create bubble particles for splash screen
    createParticles(container) {
        if (!container) {
            container = document.getElementById('landing-page');
        }
        
        if (!container) {
            console.warn('No container found for particles');
            return;
        }

        // Create particles container
        let particlesContainer = container.querySelector('.particles-container');
        if (!particlesContainer) {
            particlesContainer = document.createElement('div');
            particlesContainer.className = 'particles-container';
            container.appendChild(particlesContainer);
        }

        // Clear existing particles
        particlesContainer.innerHTML = '';

        // Create floating bubble-like particles
        const particleCount = 35;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random bubble properties - even faster!
            const size = Math.random() * 6 + 3; // 3-9px (larger like bubbles)
            const left = Math.random() * 100; // 0-100%
            const animationDuration = Math.random() * 2 + 1; // 1-3s (much faster!)
            const animationDelay = Math.random() * 2; // 0-2s delay
            
            // More complex drift patterns for bubble effect
            const driftStart = (Math.random() - 0.5) * 20; // -10px to 10px
            const driftMid = (Math.random() - 0.5) * 40; // -20px to 20px  
            const driftEnd = (Math.random() - 0.5) * 60; // -30px to 30px
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = left + '%';
            particle.style.animationDuration = animationDuration + 's';
            particle.style.animationDelay = animationDelay + 's';
            particle.style.setProperty('--drift-start', driftStart + 'px');
            particle.style.setProperty('--drift-mid', driftMid + 'px');
            particle.style.setProperty('--drift', driftEnd + 'px');
            
            // Random opacity for depth effect
            particle.style.opacity = Math.random() * 0.7 + 0.3; // 0.3-1.0
            
            particlesContainer.appendChild(particle);
        }

        console.log('🫧 Bubbles created for splash screen');
    }

    // Initialize bubble particles on splash screen
    initializeSplashParticles() {
        // Wait a bit for the page to load
        setTimeout(() => {
            this.createParticles();
            
            // Refresh bubbles more frequently for continuous effect
            setInterval(() => {
                const landingPage = document.getElementById('landing-page');
                if (landingPage && !landingPage.classList.contains('hidden')) {
                    this.createParticles();
                }
            }, 10000); // Refresh every 10 seconds (even faster refresh)
        }, 1000);
    }
}

// Initialize MagicUI components
window.magicUI = new MagicUIComponents();

// Initialize splash particles when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.magicUI.initializeSplashParticles();
    });
} else {
    window.magicUI.initializeSplashParticles();
}

console.log('🎨 MagicUI Components initialized');
