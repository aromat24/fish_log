/**
 * Game Audio Manager - Handles game audio with spatial positioning and mobile optimization
 * Provides efficient audio playback for the fishing game
 */

class GameAudioManager {
    constructor(options = {}) {
        this.options = {
            enableSpatialAudio: options.enableSpatialAudio || false,
            maxConcurrentSounds: options.maxConcurrentSounds || 8,
            masterVolume: options.masterVolume || 0.7,
            enableCompression: options.enableCompression !== false,
            ...options
        };

        // Audio context and nodes
        this.audioContext = null;
        this.masterGainNode = null;
        this.compressorNode = null;
        
        // Audio assets
        this.audioBuffers = new Map();
        this.soundInstances = new Map();
        this.activeSounds = [];
        
        // Loading state
        this.isInitialized = false;
        this.loadingPromises = new Map();
        
        console.log('GameAudioManager initialized');
    }

    /**
     * Initialize audio system
     */
    async initialize() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.options.masterVolume;
            
            // Create compressor for better audio quality
            if (this.options.enableCompression) {
                this.compressorNode = this.audioContext.createDynamicsCompressor();
                this.compressorNode.threshold.value = -24;
                this.compressorNode.knee.value = 30;
                this.compressorNode.ratio.value = 12;
                this.compressorNode.attack.value = 0.003;
                this.compressorNode.release.value = 0.25;
                
                this.masterGainNode.connect(this.compressorNode);
                this.compressorNode.connect(this.audioContext.destination);
            } else {
                this.masterGainNode.connect(this.audioContext.destination);
            }
            
            // Handle audio context suspension (mobile requirement)
            this.setupAudioContextResumption();
            
            this.isInitialized = true;
            console.log('✅ Audio system initialized');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Failed to initialize audio system:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup audio context resumption for mobile
     */
    setupAudioContextResumption() {
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                });
            }
        };

        // Resume on first user interaction
        document.addEventListener('touchstart', resumeAudio, { once: true });
        document.addEventListener('touchend', resumeAudio, { once: true });
        document.addEventListener('mousedown', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
    }

    /**
     * Load audio file
     */
    async loadAudio(name, url) {
        if (this.audioBuffers.has(name)) {
            return this.audioBuffers.get(name);
        }

        // Check if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = this.fetchAndDecodeAudio(url);
        this.loadingPromises.set(name, loadPromise);

        try {
            const buffer = await loadPromise;
            this.audioBuffers.set(name, buffer);
            this.loadingPromises.delete(name);
            
            console.log(`Audio loaded: ${name}`);
            return buffer;
            
        } catch (error) {
            console.error(`Failed to load audio ${name}:`, error);
            this.loadingPromises.delete(name);
            throw error;
        }
    }

    /**
     * Fetch and decode audio data
     */
    async fetchAndDecodeAudio(url) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        return audioBuffer;
    }

    /**
     * Play sound with options
     */
    playSound(name, options = {}) {
        if (!this.isInitialized || !this.audioBuffers.has(name)) {
            console.warn(`Cannot play sound: ${name} (not loaded or audio not initialized)`);
            return null;
        }

        // Limit concurrent sounds for performance
        if (this.activeSounds.length >= this.options.maxConcurrentSounds) {
            // Stop oldest sound
            const oldestSound = this.activeSounds.shift();
            if (oldestSound && oldestSound.source) {
                oldestSound.source.stop();
            }
        }

        const buffer = this.audioBuffers.get(name);
        const soundInstance = this.createSoundInstance(buffer, options);
        
        this.activeSounds.push(soundInstance);
        
        // Clean up when sound ends
        soundInstance.source.onended = () => {
            this.cleanupSoundInstance(soundInstance);
        };

        // Start playback
        const when = options.when || 0;
        soundInstance.source.start(when);
        
        return soundInstance;
    }

    /**
     * Create sound instance with audio graph
     */
    createSoundInstance(buffer, options) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume || 1.0;

        // Create panner for spatial audio
        let pannerNode = null;
        if (this.options.enableSpatialAudio && (options.x !== undefined || options.y !== undefined)) {
            pannerNode = this.audioContext.createPanner();
            pannerNode.panningModel = 'HRTF';
            pannerNode.distanceModel = 'inverse';
            pannerNode.refDistance = 1;
            pannerNode.maxDistance = 1000;
            pannerNode.rolloffFactor = 1;
            
            // Set position
            pannerNode.positionX.value = options.x || 0;
            pannerNode.positionY.value = options.y || 0;
            pannerNode.positionZ.value = options.z || 0;
        }

        // Connect audio graph
        source.connect(gainNode);
        
        if (pannerNode) {
            gainNode.connect(pannerNode);
            pannerNode.connect(this.masterGainNode);
        } else {
            gainNode.connect(this.masterGainNode);
        }

        // Apply additional options
        if (options.loop) {
            source.loop = true;
            source.loopStart = options.loopStart || 0;
            source.loopEnd = options.loopEnd || buffer.duration;
        }

        if (options.playbackRate) {
            source.playbackRate.value = options.playbackRate;
        }

        const soundInstance = {
            id: Math.random().toString(36).substr(2, 9),
            source,
            gainNode,
            pannerNode,
            name,
            startTime: this.audioContext.currentTime,
            options: { ...options }
        };

        return soundInstance;
    }

    /**
     * Stop sound instance
     */
    stopSound(soundInstance) {
        if (soundInstance && soundInstance.source) {
            try {
                soundInstance.source.stop();
            } catch (error) {
                // Sound may have already ended
            }
            this.cleanupSoundInstance(soundInstance);
        }
    }

    /**
     * Clean up sound instance
     */
    cleanupSoundInstance(soundInstance) {
        const index = this.activeSounds.indexOf(soundInstance);
        if (index > -1) {
            this.activeSounds.splice(index, 1);
        }

        // Disconnect nodes
        if (soundInstance.source) {
            soundInstance.source.disconnect();
        }
        if (soundInstance.gainNode) {
            soundInstance.gainNode.disconnect();
        }
        if (soundInstance.pannerNode) {
            soundInstance.pannerNode.disconnect();
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.options.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.options.masterVolume;
        }
        console.log(`Master volume set to: ${this.options.masterVolume}`);
    }

    /**
     * Set listener position (for spatial audio)
     */
    setListenerPosition(x, y, z = 0) {
        if (this.audioContext && this.audioContext.listener) {
            this.audioContext.listener.positionX.value = x;
            this.audioContext.listener.positionY.value = y;
            this.audioContext.listener.positionZ.value = z;
        }
    }

    /**
     * Set listener orientation (for spatial audio)
     */
    setListenerOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ) {
        if (this.audioContext && this.audioContext.listener) {
            this.audioContext.listener.forwardX.value = forwardX;
            this.audioContext.listener.forwardY.value = forwardY;
            this.audioContext.listener.forwardZ.value = forwardZ;
            this.audioContext.listener.upX.value = upX;
            this.audioContext.listener.upY.value = upY;
            this.audioContext.listener.upZ.value = upZ;
        }
    }

    /**
     * Preload common game sounds
     */
    async preloadGameSounds() {
        const sounds = [
            // These would be actual audio files in a real implementation
            { name: 'cast', url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzV8xfirOAgzhK3o2H0tBTSFzPPZgjUFLYHO8tiJOAgYaLvt559NEAwZaP' },
            { name: 'reel', url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzV8xfirOAgzhK3o2H0tBTSFzPPZgjUFLYHO8tiJOAgYaLvt559NEAwZaP' },
            { name: 'splash', url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzV8xfirOAgzhK3o2H0tBTSFzPPZgjUFLYHO8tiJOAgYaLvt559NEAwZaP' },
            { name: 'bite', url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzV8xfirOAgzhK3o2H0tBTSFzPPZgjUFLYHO8tiJOAgYaLvt559NEAwZaP' },
            { name: 'catch', url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzV8xfirOAgzhK3o2H0tBTSFzPPZgjUFLYHO8tiJOAgYaLvt559NEAwZaP' }
        ];

        const loadPromises = sounds.map(sound => 
            this.loadAudio(sound.name, sound.url).catch(error => {
                console.warn(`Failed to preload ${sound.name}:`, error);
                return null;
            })
        );

        await Promise.all(loadPromises);
        console.log('Game sounds preloaded');
    }

    /**
     * Create simple tone (for testing when no audio files available)
     */
    createTone(frequency, duration, options = {}) {
        if (!this.isInitialized) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        oscillator.frequency.value = frequency;
        oscillator.type = options.type || 'sine';

        gainNode.gain.value = options.volume || 0.3;
        
        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(options.volume || 0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);

        return { oscillator, gainNode };
    }

    /**
     * Play fishing game sounds
     */
    playCastSound(power = 1.0) {
        return this.playSound('cast', { 
            volume: 0.5 * power,
            playbackRate: 0.8 + (power * 0.4)
        }) || this.createTone(220, 0.3, { volume: 0.3 * power });
    }

    playReelSound(speed = 1.0) {
        return this.playSound('reel', { 
            volume: 0.4 * speed,
            loop: true,
            playbackRate: 0.5 + (speed * 0.5)
        }) || this.createTone(440, 0.1, { volume: 0.2 * speed });
    }

    playSplashSound(intensity = 1.0) {
        return this.playSound('splash', { 
            volume: 0.6 * intensity,
            playbackRate: 0.9 + (Math.random() * 0.2)
        }) || this.createTone(150, 0.2, { volume: 0.4 * intensity });
    }

    playBiteSound() {
        return this.playSound('bite', { 
            volume: 0.7,
            playbackRate: 1.1 + (Math.random() * 0.2)
        }) || this.createTone(800, 0.1, { volume: 0.3 });
    }

    playCatchSound() {
        return this.playSound('catch', { 
            volume: 0.8,
            playbackRate: 1.0
        }) || this.createTone(523, 0.5, { volume: 0.4 });
    }

    /**
     * Stop all sounds
     */
    stopAllSounds() {
        this.activeSounds.forEach(sound => {
            this.stopSound(sound);
        });
        this.activeSounds = [];
    }

    /**
     * Get audio statistics
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            audioContext: this.audioContext ? {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate,
                currentTime: this.audioContext.currentTime
            } : null,
            loadedSounds: this.audioBuffers.size,
            activeSounds: this.activeSounds.length,
            masterVolume: this.options.masterVolume
        };
    }

    /**
     * Clean up audio resources
     */
    cleanup() {
        console.log('Cleaning up GameAudioManager...');
        
        // Stop all active sounds
        this.stopAllSounds();
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Clear maps
        this.audioBuffers.clear();
        this.soundInstances.clear();
        this.loadingPromises.clear();
        
        this.isInitialized = false;
        
        console.log('✅ GameAudioManager cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAudioManager;
} else {
    window.GameAudioManager = GameAudioManager;
}