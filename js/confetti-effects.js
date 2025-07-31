/**
 * MagicUI-style Confetti Effects for Fish Log PWA
 * Based on canvas-confetti library with MagicUI patterns
 */

class ConfettiManager {
    constructor() {
        this.confetti = null;
        this.isLoaded = false;
        this.loadConfetti();
    }

    async loadConfetti() {
        try {
            // Skip node_modules loading to avoid 404s, go straight to CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
            script.onload = () => {
                this.confetti = window.confetti;
                this.isLoaded = true;
                console.log('✨ Confetti library loaded from CDN');
            };
            script.onerror = () => {
                console.warn('Failed to load confetti from CDN');
                this.isLoaded = false;
            };
            document.head.appendChild(script);
            
        } catch (error) {
            console.warn('Failed to load confetti library:', error);
            // Fallback - try global confetti if available
            if (window.confetti) {
                this.confetti = window.confetti;
                this.isLoaded = true;
                console.log('✨ Using global confetti library');
            }
        }
    }

    /**
     * Fire confetti with fishing-themed colors and settings
     * Based on MagicUI confetti component patterns
     */
    fireCatchCelebration(options = {}) {
        if (!this.isLoaded || !this.confetti) {
            console.warn('Confetti not available - showing fallback celebration');
            this.showFallbackCelebration();
            return;
        }

        // Fishing-themed color palette
        const fishingColors = [
            '#1e40af', // Ocean blue
            '#059669', // Sea green  
            '#dc2626', // Hook red
            '#f59e0b', // Golden fish
            '#8b5cf6', // Sunset purple
            '#06b6d4', // Aqua blue
            '#10b981', // Fresh green
            '#f97316'  // Coral orange
        ];

        // Default confetti configuration with MagicUI-style settings
        const defaultConfig = {
            particleCount: 80,
            angle: 90,
            spread: 60,
            startVelocity: 45,
            decay: 0.9,
            gravity: 1.2,
            drift: 0,
            ticks: 300,
            colors: fishingColors,
            shapes: ['square', 'circle'],
            scalar: 1.2,
            zIndex: 9999, // Higher z-index to ensure confetti appears above all content
            disableForReducedMotion: true,
            origin: { x: 0.5, y: 0.5 }
        };

        // Merge user options with defaults
        const config = { ...defaultConfig, ...options };

        // Fire multiple bursts for dramatic effect (MagicUI pattern)
        this.fireBurst(config);
        
        // Add delayed secondary bursts for better visual impact
        setTimeout(() => this.fireBurst({
            ...config,
            particleCount: 50,
            angle: 75,
            origin: { x: 0.3, y: 0.6 }
        }), 150);

        setTimeout(() => this.fireBurst({
            ...config,
            particleCount: 50,
            angle: 105,
            origin: { x: 0.7, y: 0.6 }
        }), 300);
    }

    /**
     * Fire a single confetti burst
     */
    fireBurst(config) {
        try {
            this.confetti(config);
        } catch (error) {
            console.error('Error firing confetti:', error);
            this.showFallbackCelebration();
        }
    }

    /**
     * Specialized confetti for save button success
     * Triggers from the button's position for better UX
     */
    async fireSaveCatchConfetti() {
        console.log('🎉 Firing save catch confetti!');
        
        // Simple immediate check - don't wait if not ready
        if (!this.isLoaded || !this.confetti) {
            console.warn('Confetti not loaded, using fallback');
            this.showFallbackCelebration();
            return;
        }

        try {
            // Fishing-themed color palette (local variable)
            const fishingColors = [
                '#1e40af', // Ocean blue
                '#059669', // Sea green  
                '#dc2626', // Hook red
                '#f59e0b', // Golden fish
                '#8b5cf6', // Sunset purple
                '#06b6d4', // Aqua blue
                '#10b981', // Fresh green
                '#f97316'  // Coral orange
            ];
            
            const saveButton = document.querySelector('#catch-form button[type="submit"]');
            
            if (saveButton) {
                const rect = saveButton.getBoundingClientRect();
                const x = (rect.left + rect.width / 2) / window.innerWidth;
                const y = (rect.top + rect.height / 2) / window.innerHeight;

                // Single immediate confetti burst
                this.fireBurst({
                    particleCount: 80,
                    angle: 90,
                    spread: 60,
                    origin: { x, y },
                    startVelocity: 45,
                    decay: 0.9,
                    scalar: 1.2,
                    colors: fishingColors
                });
            } else {
                // Fallback to center if button not found
                this.fireBurst({
                    particleCount: 80,
                    angle: 90,
                    spread: 60,
                    origin: { x: 0.5, y: 0.6 },
                    startVelocity: 45,
                    decay: 0.9,
                    scalar: 1.2,
                    colors: fishingColors
                });
            }
        } catch (error) {
            console.error('Error in fireSaveCatchConfetti:', error);
            this.showFallbackCelebration();
        }
    }

    /**
     * Fallback celebration for when confetti library isn't available
     */
    showFallbackCelebration() {
        // Find the save button and add a temporary success animation
        const saveButton = document.querySelector('#catch-form button[type="submit"]');
        
        if (saveButton) {
            // Add success pulse animation
            saveButton.style.transform = 'scale(1.1)';
            saveButton.style.transition = 'transform 0.2s ease-out';
            
            setTimeout(() => {
                saveButton.style.transform = 'scale(1)';
                setTimeout(() => {
                    saveButton.style.transform = '';
                    saveButton.style.transition = '';
                }, 200);
            }, 200);
        }

        // Add a temporary success emoji burst
        this.createEmojiCelebration();
    }

    /**
     * Create simple emoji-based celebration fallback
     */
    createEmojiCelebration() {
        const emojis = ['🎉', '✨', '🐟', '🎊', '⭐'];
        const container = document.body;

        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.cssText = `
                    position: fixed;
                    font-size: 1.5rem;
                    pointer-events: none;
                    z-index: 1000;
                    left: ${Math.random() * 100}vw;
                    top: ${Math.random() * 30 + 10}vh;
                    animation: fallAndFade 2s ease-out forwards;
                `;

                container.appendChild(emoji);

                setTimeout(() => {
                    emoji.remove();
                }, 2000);
            }, i * 100);
        }
    }
}

// Add CSS animation for emoji fallback
const style = document.createElement('style');
style.textContent = `
    @keyframes fallAndFade {
        0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(50vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize global confetti manager
window.confettiManager = new ConfettiManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfettiManager;
}
