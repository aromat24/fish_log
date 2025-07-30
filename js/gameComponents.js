/**
 * Game Components - Supporting classes for the fishing game framework
 * Includes Entity Manager, Particle System, Scene Manager, and other core components
 */

/**
 * Entity Manager - Handles game objects with optional object pooling
 */
class EntityManager {
    constructor(enableObjectPooling = true) {
        this.entities = new Map();
        this.entityTypes = new Map();
        this.nextEntityId = 0;
        this.enableObjectPooling = enableObjectPooling;
        this.objectPools = new Map();
        
        console.log('EntityManager initialized with pooling:', enableObjectPooling);
    }

    /**
     * Register an entity type for object pooling
     */
    registerEntityType(typeName, EntityClass, poolSize = 50) {
        this.entityTypes.set(typeName, EntityClass);
        
        if (this.enableObjectPooling) {
            const pool = [];
            for (let i = 0; i < poolSize; i++) {
                const entity = new EntityClass();
                entity.isActive = false;
                pool.push(entity);
            }
            this.objectPools.set(typeName, pool);
            console.log(`Entity type '${typeName}' registered with pool size ${poolSize}`);
        }
    }

    /**
     * Create or get entity from pool
     */
    createEntity(typeName, ...args) {
        let entity;
        let entityId = this.nextEntityId++;

        if (this.enableObjectPooling && this.objectPools.has(typeName)) {
            const pool = this.objectPools.get(typeName);
            entity = pool.find(e => !e.isActive);
            
            if (entity) {
                entity.reset(...args);
                entity.isActive = true;
            } else {
                // Pool exhausted, create new entity
                const EntityClass = this.entityTypes.get(typeName);
                entity = new EntityClass(...args);
                entity.isActive = true;
                console.warn(`Pool exhausted for ${typeName}, creating new entity`);
            }
        } else {
            // No pooling or type not registered
            const EntityClass = this.entityTypes.get(typeName);
            if (EntityClass) {
                entity = new EntityClass(...args);
                entity.isActive = true;
            } else {
                throw new Error(`Entity type '${typeName}' not registered`);
            }
        }

        entity.id = entityId;
        this.entities.set(entityId, entity);
        return entity;
    }

    /**
     * Remove entity (return to pool if pooling enabled)
     */
    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;

        entity.isActive = false;
        this.entities.delete(entityId);

        // Entity will be returned to pool automatically when inactive
        return true;
    }

    /**
     * Update all active entities
     */
    update(deltaTime) {
        for (const [id, entity] of this.entities) {
            if (entity.isActive && entity.update) {
                entity.update(deltaTime);
                
                // Remove entity if marked for deletion
                if (entity.shouldRemove) {
                    this.removeEntity(id);
                }
            }
        }
    }

    /**
     * Get all entities of a specific type
     */
    getEntitiesByType(typeName) {
        return Array.from(this.entities.values()).filter(
            entity => entity.type === typeName && entity.isActive
        );
    }

    /**
     * Get entity count
     */
    getEntityCount() {
        return this.entities.size;
    }

    /**
     * Clean up all entities
     */
    cleanup() {
        this.entities.clear();
        this.objectPools.clear();
        this.entityTypes.clear();
        console.log('EntityManager cleanup complete');
    }
}

/**
 * Particle System - Mobile-optimized particle effects
 */
class ParticleSystem {
    constructor(maxParticles = 500) {
        this.maxParticles = maxParticles;
        this.particles = [];
        this.particlePool = [];
        this.qualityLevel = 'medium'; // low, medium, high
        
        // Pre-allocate particle pool
        for (let i = 0; i < maxParticles; i++) {
            this.particlePool.push(new Particle());
        }
        
        console.log(`ParticleSystem initialized with ${maxParticles} particles`);
    }

    /**
     * Emit particles
     */
    emit(config) {
        const particleCount = this.getParticleCount(config.count);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticleFromPool();
            if (particle) {
                particle.initialize(config);
                this.particles.push(particle);
            }
        }
    }

    /**
     * Get particle from pool
     */
    getParticleFromPool() {
        return this.particlePool.pop() || null;
    }

    /**
     * Return particle to pool
     */
    returnParticleToPool(particle) {
        particle.reset();
        this.particlePool.push(particle);
    }

    /**
     * Update particles
     */
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
                this.returnParticleToPool(particle);
            }
        }
    }

    /**
     * Render particles
     */
    render(renderer) {
        if (this.particles.length === 0) return;
        
        // Group particles by type for efficient rendering
        const particleGroups = this.groupParticlesByType();
        
        for (const [type, particles] of particleGroups) {
            this.renderParticleGroup(renderer, type, particles);
        }
    }

    /**
     * Group particles by type for batch rendering
     */
    groupParticlesByType() {
        const groups = new Map();
        
        for (const particle of this.particles) {
            if (!groups.has(particle.type)) {
                groups.set(particle.type, []);
            }
            groups.get(particle.type).push(particle);
        }
        
        return groups;
    }

    /**
     * Render a group of particles efficiently
     */
    renderParticleGroup(renderer, type, particles) {
        const ctx = renderer.ctx;
        
        // Optimize rendering based on particle type
        switch (type) {
            case 'bubble':
                this.renderBubbles(ctx, particles);
                break;
            case 'splash':
                this.renderSplashes(ctx, particles);
                break;
            case 'water':
                this.renderWaterParticles(ctx, particles);
                break;
            default:
                this.renderGenericParticles(ctx, particles);
        }
    }

    /**
     * Render bubble particles
     */
    renderBubbles(ctx, particles) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
        ctx.lineWidth = 1;
        
        for (const particle of particles) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.globalAlpha = particle.alpha;
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Render splash particles
     */
    renderSplashes(ctx, particles) {
        ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
        
        for (const particle of particles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Render water particles
     */
    renderWaterParticles(ctx, particles) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgba(64, 164, 223, 0.8)');
        gradient.addColorStop(1, 'rgba(32, 107, 156, 0.6)');
        
        ctx.fillStyle = gradient;
        
        for (const particle of particles) {
            ctx.globalAlpha = particle.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Render generic particles
     */
    renderGenericParticles(ctx, particles) {
        for (const particle of particles) {
            particle.render(ctx);
        }
    }

    /**
     * Adjust particle count based on quality level
     */
    getParticleCount(requestedCount) {
        switch (this.qualityLevel) {
            case 'low':
                return Math.floor(requestedCount * 0.3);
            case 'medium':
                return Math.floor(requestedCount * 0.7);
            case 'high':
                return requestedCount;
            default:
                return requestedCount;
        }
    }

    /**
     * Reduce quality for better performance
     */
    reduceQuality() {
        if (this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
        } else if (this.qualityLevel === 'medium') {
            this.qualityLevel = 'low';
        }
        console.log(`Particle quality reduced to: ${this.qualityLevel}`);
    }

    /**
     * Increase quality when performance allows
     */
    increaseQuality() {
        if (this.qualityLevel === 'low') {
            this.qualityLevel = 'medium';
        } else if (this.qualityLevel === 'medium') {
            this.qualityLevel = 'high';
        }
        console.log(`Particle quality increased to: ${this.qualityLevel}`);
    }

    /**
     * Get active particle count
     */
    getActiveCount() {
        return this.particles.length;
    }

    /**
     * Clean up particles
     */
    cleanup() {
        this.particles = [];
        this.particlePool = [];
        console.log('ParticleSystem cleanup complete');
    }
}

/**
 * Individual Particle class
 */
class Particle {
    constructor() {
        this.reset();
    }

    initialize(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.size = config.size || 2;
        this.color = config.color || '#ffffff';
        this.alpha = config.alpha || 1;
        this.life = config.life || 1000;
        this.maxLife = this.life;
        this.type = config.type || 'generic';
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 0.99;
    }

    update(deltaTime) {
        // Apply velocity
        this.x += this.vx * deltaTime * 0.001;
        this.y += this.vy * deltaTime * 0.001;
        
        // Apply gravity
        this.vy += this.gravity * deltaTime * 0.001;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update life and alpha
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    render(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 2;
        this.color = '#ffffff';
        this.alpha = 1;
        this.life = 1000;
        this.maxLife = 1000;
        this.type = 'generic';
        this.gravity = 0;
        this.friction = 0.99;
    }
}

/**
 * Scene Manager - Handles different game scenes
 */
class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.activeScene = null;
        this.transitionState = null;
        
        console.log('SceneManager initialized');
    }

    /**
     * Register a scene
     */
    registerScene(name, scene) {
        this.scenes.set(name, scene);
        console.log(`Scene '${name}' registered`);
    }

    /**
     * Set active scene
     */
    setActiveScene(name) {
        if (!this.scenes.has(name)) {
            console.error(`Scene '${name}' not found`);
            return false;
        }

        // Exit current scene
        if (this.activeScene) {
            this.activeScene.onExit();
        }

        // Enter new scene
        this.activeScene = this.scenes.get(name);
        this.activeScene.onEnter();
        
        console.log(`Active scene set to: ${name}`);
        return true;
    }

    /**
     * Get active scene
     */
    getActiveScene() {
        return this.activeScene;
    }

    /**
     * Check if scene exists
     */
    hasScene(name) {
        return this.scenes.has(name);
    }

    /**
     * Clean up scene manager
     */
    cleanup() {
        if (this.activeScene) {
            this.activeScene.onExit();
        }
        
        this.scenes.clear();
        this.activeScene = null;
        console.log('SceneManager cleanup complete');
    }
}

/**
 * Base Scene class
 */
class BaseScene {
    constructor(game) {
        this.game = game;
        this.isActive = false;
    }

    onEnter() {
        this.isActive = true;
    }

    onExit() {
        this.isActive = false;
    }

    update(deltaTime) {
        // Override in subclasses
    }

    render(renderer, interpolation) {
        // Override in subclasses
    }

    onResize(width, height) {
        // Override in subclasses
    }
}

/**
 * Game Renderer - Handles drawing operations
 */
class GameRenderer {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.options = {
            enableDebugMode: options.enableDebugMode || false,
            adaptiveQuality: options.adaptiveQuality !== false,
            maxLayers: options.maxLayers || 5,
            ...options
        };
        
        this.qualityLevel = 'medium';
        this.layers = new Map();
        
        console.log('GameRenderer initialized');
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    /**
     * Draw a filled rectangle
     */
    drawRect(x, y, width, height, color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    /**
     * Draw a circle
     */
    drawCircle(x, y, radius, color = '#000000', fill = true) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    /**
     * Draw text
     */
    drawText(text, x, y, options = {}) {
        const font = options.font || '16px Arial';
        const color = options.color || '#000000';
        const align = options.align || 'left';
        
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Handle resize
     */
    handleResize(width, height) {
        console.log(`Renderer resize: ${width}x${height}`);
    }

    /**
     * Reduce quality for better performance
     */
    reduceQuality() {
        if (this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
        } else if (this.qualityLevel === 'medium') {
            this.qualityLevel = 'low';
        }
        console.log(`Renderer quality reduced to: ${this.qualityLevel}`);
    }

    /**
     * Increase quality when performance allows
     */
    increaseQuality() {
        if (this.qualityLevel === 'low') {
            this.qualityLevel = 'medium';
        } else if (this.qualityLevel === 'medium') {
            this.qualityLevel = 'high';
        }
        console.log(`Renderer quality increased to: ${this.qualityLevel}`);
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EntityManager,
        ParticleSystem,
        Particle,
        SceneManager,
        BaseScene,
        GameRenderer
    };
} else {
    window.GameComponents = {
        EntityManager,
        ParticleSystem,
        Particle,
        SceneManager,
        BaseScene,
        GameRenderer
    };
    
    // Export classes individually for game engine compatibility
    window.EntityManager = EntityManager;
    window.ParticleSystem = ParticleSystem;
    window.Particle = Particle;
    window.SceneManager = SceneManager;
    window.BaseScene = BaseScene;
    window.GameRenderer = GameRenderer;
    
    console.log('✅ [GAMECOMPONENTS] All game component classes exported globally');
}