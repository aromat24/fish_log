/**
 * Game Species Mapper - Connects virtual fishing game to real fish database
 * Maps simple game fish types to realistic species from the comprehensive database
 */

class GameSpeciesMapper {
    constructor(fishDatabase) {
        this.fishDatabase = fishDatabase;
        this.speciesCache = new Map();
        this.gameToSpeciesMap = new Map();
        this.speciesByDifficulty = {
            common: [],
            rare: [],
            legendary: []
        };
        
        this.initialized = false;
        this.initPromise = this.initialize();
        
        console.log('GameSpeciesMapper created');
    }

    /**
     * Initialize the mapper with species data
     */
    async initialize() {
        try {
            if (!this.fishDatabase) {
                throw new Error('Fish database not provided');
            }

            // Wait for fish database to be ready
            await this.fishDatabase.isReady();
            
            // Load and categorize species
            await this.loadSpeciesMapping();
            
            this.initialized = true;
            console.log('✅ GameSpeciesMapper initialized successfully');
            console.log(`Loaded ${this.speciesByDifficulty.common.length} common species`);
            console.log(`Loaded ${this.speciesByDifficulty.rare.length} rare species`);
            console.log(`Loaded ${this.speciesByDifficulty.legendary.length} legendary species`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize GameSpeciesMapper:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Load and categorize fish species based on game difficulty
     */
    async loadSpeciesMapping() {
        if (!this.fishDatabase.algorithms) {
            console.warn('No algorithms available in fish database');
            return;
        }

        const allSpecies = Object.entries(this.fishDatabase.algorithms);
        console.log(`Processing ${allSpecies.length} species for game mapping`);

        for (const [speciesId, speciesData] of allSpecies) {
            if (!speciesData.species_name || !speciesData.algorithm) {
                continue;
            }

            const species = {
                id: speciesId,
                name: speciesData.species_name,
                edible: speciesData.edible,
                algorithm: speciesData.algorithm,
                difficulty: this.calculateDifficulty(speciesData),
                habitat: this.inferHabitat(speciesData.species_name),
                averageSize: this.calculateAverageSize(speciesData.algorithm),
                fightingStyle: this.determineFightingStyle(speciesData)
            };

            this.speciesCache.set(speciesId, species);

            // Categorize by difficulty
            if (species.difficulty <= 0.3) {
                this.speciesByDifficulty.common.push(species);
            } else if (species.difficulty <= 0.7) {
                this.speciesByDifficulty.rare.push(species);
            } else {
                this.speciesByDifficulty.legendary.push(species);
            }
        }

        // Ensure we have species in each category
        this.validateCategories();
    }

    /**
     * Calculate difficulty based on species characteristics
     */
    calculateDifficulty(speciesData) {
        let difficulty = 0.5; // Base difficulty

        // Larger fish are generally harder to catch
        const algorithm = speciesData.algorithm;
        if (algorithm && algorithm.a && algorithm.b) {
            const estimatedWeight = algorithm.a * Math.pow(50, algorithm.b); // Weight at 50cm
            if (estimatedWeight > 2) difficulty += 0.2;
            if (estimatedWeight > 5) difficulty += 0.2;
            if (estimatedWeight > 10) difficulty += 0.1;
        }

        // R-squared affects difficulty (more predictable = easier)
        if (algorithm && algorithm.r_squared) {
            difficulty -= (algorithm.r_squared - 0.5) * 0.3;
        }

        // Species-specific adjustments
        const name = speciesData.species_name.toLowerCase();
        if (name.includes('shark') || name.includes('tuna') || name.includes('marlin')) {
            difficulty += 0.3;
        } else if (name.includes('bass') || name.includes('trout') || name.includes('bream')) {
            difficulty -= 0.1;
        }

        return Math.max(0.1, Math.min(0.9, difficulty));
    }

    /**
     * Infer habitat from species name
     */
    inferHabitat(speciesName) {
        const name = speciesName.toLowerCase();
        
        if (name.includes('river') || name.includes('stream') || name.includes('creek')) {
            return 'river';
        } else if (name.includes('lake') || name.includes('pond')) {
            return 'lake';
        } else if (name.includes('sea') || name.includes('ocean') || name.includes('marine')) {
            return 'ocean';
        } else if (name.includes('bass') || name.includes('trout') || name.includes('pike')) {
            return 'lake';
        } else if (name.includes('tuna') || name.includes('shark') || name.includes('marlin')) {
            return 'ocean';
        }
        
        return 'lake'; // Default habitat
    }

    /**
     * Calculate average size for the species
     */
    calculateAverageSize(algorithm) {
        if (!algorithm || !algorithm.a || !algorithm.b) {
            return 30; // Default size in cm
        }

        // Estimate typical length where weight would be around 1-2kg
        const targetWeight = 1.5;
        const estimatedLength = Math.pow(targetWeight / algorithm.a, 1 / algorithm.b);
        
        return Math.max(15, Math.min(100, estimatedLength));
    }

    /**
     * Determine fighting style based on species characteristics
     */
    determineFightingStyle(speciesData) {
        const name = speciesData.species_name.toLowerCase();
        
        if (name.includes('shark') || name.includes('tuna')) {
            return 'aggressive'; // Strong, fast runs
        } else if (name.includes('bass') || name.includes('pike')) {
            return 'sporadic'; // Bursts of energy
        } else if (name.includes('trout') || name.includes('salmon')) {
            return 'acrobatic'; // Jumps and runs
        } else if (name.includes('bream') || name.includes('carp')) {
            return 'steady'; // Consistent pressure
        }
        
        return 'moderate'; // Default fighting style
    }

    /**
     * Ensure all categories have species
     */
    validateCategories() {
        if (this.speciesByDifficulty.common.length === 0) {
            console.warn('No common species found, moving some rare species to common');
            const movedSpecies = this.speciesByDifficulty.rare.splice(0, 5);
            this.speciesByDifficulty.common.push(...movedSpecies);
        }

        if (this.speciesByDifficulty.rare.length === 0) {
            console.warn('No rare species found, creating from common species');
            const movedSpecies = this.speciesByDifficulty.common.splice(-3);
            this.speciesByDifficulty.rare.push(...movedSpecies);
        }

        if (this.speciesByDifficulty.legendary.length === 0) {
            console.warn('No legendary species found, creating from rare species');
            const movedSpecies = this.speciesByDifficulty.rare.splice(-2);
            this.speciesByDifficulty.legendary.push(...movedSpecies);
        }
    }

    /**
     * Get a random species for the given game fish type
     */
    getRandomSpecies(gameType, habitat = 'lake') {
        if (!this.initialized) {
            console.warn('GameSpeciesMapper not initialized, returning fallback');
            return this.getFallbackSpecies(gameType);
        }

        let candidates = [];
        
        switch (gameType) {
            case 'common':
                candidates = this.speciesByDifficulty.common;
                break;
            case 'rare':
                candidates = this.speciesByDifficulty.rare;
                break;
            case 'legendary':
                candidates = this.speciesByDifficulty.legendary;
                break;
            default:
                candidates = this.speciesByDifficulty.common;
        }

        // Filter by habitat if specified
        const habitatFiltered = candidates.filter(species => 
            species.habitat === habitat || species.habitat === 'lake' // Lake as universal fallback
        );

        const finalCandidates = habitatFiltered.length > 0 ? habitatFiltered : candidates;
        
        if (finalCandidates.length === 0) {
            return this.getFallbackSpecies(gameType);
        }

        const randomIndex = Math.floor(Math.random() * finalCandidates.length);
        const selectedSpecies = finalCandidates[randomIndex];
        
        console.log(`Selected ${gameType} species: ${selectedSpecies.name} (${selectedSpecies.habitat})`);
        return selectedSpecies;
    }

    /**
     * Get fallback species when mapper isn't ready
     */
    getFallbackSpecies(gameType) {
        const fallbackSpecies = {
            common: {
                id: 'fallback_bass',
                name: 'Largemouth Bass',
                edible: true,
                difficulty: 0.3,
                habitat: 'lake',
                averageSize: 35,
                fightingStyle: 'sporadic',
                algorithm: { a: 0.00001, b: 3.0, r_squared: 0.85 }
            },
            rare: {
                id: 'fallback_trout',
                name: 'Rainbow Trout',
                edible: true,
                difficulty: 0.6,
                habitat: 'river',
                averageSize: 45,
                fightingStyle: 'acrobatic',
                algorithm: { a: 0.000008, b: 3.1, r_squared: 0.9 }
            },
            legendary: {
                id: 'fallback_pike',
                name: 'Northern Pike',
                edible: true,
                difficulty: 0.8,
                habitat: 'lake',
                averageSize: 60,
                fightingStyle: 'aggressive',
                algorithm: { a: 0.000005, b: 3.2, r_squared: 0.88 }
            }
        };

        return fallbackSpecies[gameType] || fallbackSpecies.common;
    }

    /**
     * Generate realistic size and weight for a species
     */
    generateRealisticCatch(species, baseDifficulty = 0.5) {
        // Use species average size as baseline with some variation
        const sizeVariation = 0.3; // 30% variation
        const baseSize = species.averageSize || 30;
        const minSize = baseSize * (1 - sizeVariation);
        const maxSize = baseSize * (1 + sizeVariation);
        
        // Difficulty affects size distribution (harder = potentially larger)
        const difficultyBonus = baseDifficulty * 0.5;
        const length = minSize + (Math.random() * (maxSize - minSize)) * (1 + difficultyBonus);
        
        // Calculate weight using species algorithm
        let weight = 0.5; // Fallback weight
        if (species.algorithm && species.algorithm.a && species.algorithm.b) {
            weight = species.algorithm.a * Math.pow(length, species.algorithm.b);
        }
        
        return {
            species: species.name,
            length: Math.round(length * 10) / 10, // Round to 1 decimal
            weight: Math.round(weight * 100) / 100, // Round to 2 decimals
            edible: species.edible,
            difficulty: species.difficulty,
            fightingStyle: species.fightingStyle,
            habitat: species.habitat,
            rarity: this.getSpeciesRarity(species)
        };
    }

    /**
     * Determine rarity category for a species
     */
    getSpeciesRarity(species) {
        if (this.speciesByDifficulty.legendary.includes(species)) {
            return 'legendary';
        } else if (this.speciesByDifficulty.rare.includes(species)) {
            return 'rare';
        } else {
            return 'common';
        }
    }

    /**
     * Get species by name for specific requests
     */
    getSpeciesByName(name) {
        if (!this.initialized) {
            return null;
        }

        for (const species of this.speciesCache.values()) {
            if (species.name.toLowerCase().includes(name.toLowerCase())) {
                return species;
            }
        }
        return null;
    }

    /**
     * Get all species in a category
     */
    getSpeciesByCategory(category) {
        if (!this.initialized) {
            return [];
        }

        return this.speciesByDifficulty[category] || [];
    }

    /**
     * Get mapper statistics
     */
    getStats() {
        return {
            initialized: this.initialized,
            totalSpecies: this.speciesCache.size,
            common: this.speciesByDifficulty.common.length,
            rare: this.speciesByDifficulty.rare.length,
            legendary: this.speciesByDifficulty.legendary.length,
            habitats: ['lake', 'river', 'ocean']
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.speciesCache.clear();
        this.gameToSpeciesMap.clear();
        this.speciesByDifficulty = { common: [], rare: [], legendary: [] };
        this.initialized = false;
        console.log('GameSpeciesMapper cleanup complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameSpeciesMapper;
} else {
    window.GameSpeciesMapper = GameSpeciesMapper;
}