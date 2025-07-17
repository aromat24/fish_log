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

        // Clean up old particles to prevent memory issues
        const existingParticles = particlesContainer.querySelectorAll('.particle:not(.top-bubble)');
        if (existingParticles.length > 60) { // Keep max 60 regular particles
            // Remove the oldest particles
            for (let i = 0; i < existingParticles.length - 40; i++) {
                existingParticles[i].remove();
            }
        }

        // Create more floating bubble-like particles for better coverage
        const particleCount = 50; // Increased from 35
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // More varied bubble properties for better coverage
            const size = Math.random() * 8 + 2; // 2-10px (wider range)
            const left = Math.random() * 100; // 0-100%
            const animationDuration = Math.random() * 4 + 2; // 2-6s (longer durations)
            const animationDelay = Math.random() * 6; // 0-6s delay (longer stagger)
            
            // More complex drift patterns for bubble effect
            const driftStart = (Math.random() - 0.5) * 30; // -15px to 15px
            const driftMid = (Math.random() - 0.5) * 50; // -25px to 25px  
            const driftEnd = (Math.random() - 0.5) * 80; // -40px to 40px
            
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

    // Create persistent top bubbles that stay near the surface
    createTopBubbles(container) {
        if (!container) {
            container = document.getElementById('landing-page');
        }
        
        if (!container) {
            console.warn('No container found for top bubbles');
            return;
        }

        // Create particles container if it doesn't exist
        let particlesContainer = container.querySelector('.particles-container');
        if (!particlesContainer) {
            particlesContainer = document.createElement('div');
            particlesContainer.className = 'particles-container';
            container.appendChild(particlesContainer);
        }

        // Clean up old top bubbles to prevent memory issues
        const existingTopBubbles = particlesContainer.querySelectorAll('.particle.top-bubble');
        if (existingTopBubbles.length > 25) { // Keep max 25 top bubbles
            // Remove the oldest top bubbles
            for (let i = 0; i < existingTopBubbles.length - 15; i++) {
                existingTopBubbles[i].remove();
            }
        }

        // Create slower floating bubbles that stay near the top
        const topBubbleCount = 15;
        
        for (let i = 0; i < topBubbleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle top-bubble';
            
            // Smaller, more subtle bubbles for top area
            const size = Math.random() * 4 + 2; // 2-6px
            const left = Math.random() * 100; // 0-100%
            const animationDuration = Math.random() * 8 + 6; // 6-14s (very slow)
            const animationDelay = Math.random() * 8; // 0-8s delay
            
            // Gentle horizontal drift for top bubbles
            const driftStart = (Math.random() - 0.5) * 20; // -10px to 10px
            const driftMid = (Math.random() - 0.5) * 30; // -15px to 15px  
            const driftEnd = (Math.random() - 0.5) * 40; // -20px to 20px
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = left + '%';
            particle.style.animationDuration = animationDuration + 's';
            particle.style.animationDelay = animationDelay + 's';
            particle.style.setProperty('--drift-start', driftStart + 'px');
            particle.style.setProperty('--drift-mid', driftMid + 'px');
            particle.style.setProperty('--drift', driftEnd + 'px');
            
            // Lower opacity for subtle effect
            particle.style.opacity = Math.random() * 0.5 + 0.2; // 0.2-0.7
            
            particlesContainer.appendChild(particle);
        }

        console.log('🫧 Top bubbles created for persistent effect');
    }

    // Initialize bubble particles on splash screen
    initializeSplashParticles() {
        // Wait a bit for the page to load
        setTimeout(() => {
            console.log('🫧 Initializing splash particles...');
            const landingPage = document.getElementById('landing-page');
            if (landingPage) {
                console.log('✅ Landing page found, creating particles');
                this.createParticles();
                this.createTopBubbles(); // Add persistent top bubbles
                
                // Refresh main bubbles more frequently for continuous effect
                setInterval(() => {
                    const landingPage = document.getElementById('landing-page');
                    if (landingPage && !landingPage.classList.contains('hidden')) {
                        this.createParticles();
                    }
                }, 6000); // Refresh every 6 seconds (faster refresh)
                
                // Refresh top bubbles less frequently
                setInterval(() => {
                    const landingPage = document.getElementById('landing-page');
                    if (landingPage && !landingPage.classList.contains('hidden')) {
                        this.createTopBubbles();
                    }
                }, 15000); // Refresh top bubbles every 15 seconds
            } else {
                console.warn('❌ Landing page not found for particles');
            }
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
