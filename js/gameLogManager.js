/**
 * Game Log Manager - Dedicated storage system for motion sensor fishing game catches
 * Completely separate from real fishing log data to avoid interference
 */

class GameLogManager {
    constructor() {
        this.storageKey = 'gameCatches';
        this.settingsKey = 'gameSettings';
        this.achievementsKey = 'gameAchievements';
        this.sessionKey = 'gameSession';
        
        this.currentSession = this.generateSessionId();
        
        // Initialize default settings
        this.defaultSettings = {
            soundEnabled: true,
            motionSensitivity: 0.7,
            gameMode: 'normal', // normal, expert, beginner
            showTutorials: true,
            autoSave: true
        };
        
        this.initializeStorage();
        console.log('GameLogManager initialized with session:', this.currentSession);
    }

    /**
     * Initialize storage if it doesn't exist
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.settingsKey)) {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.defaultSettings));
        }
        
        if (!localStorage.getItem(this.achievementsKey)) {
            localStorage.setItem(this.achievementsKey, JSON.stringify({}));
        }
    }

    /**
     * Generate unique session ID for game sessions
     */
    generateSessionId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Add a virtual catch to game log only
     */
    addGameCatch(catchData) {
        try {
            const gameCatch = {
                id: this.generateCatchId(),
                sessionId: this.currentSession,
                species: catchData.species || 'Unknown Fish',
                length: catchData.length || 0,
                weight: catchData.weight || 0,
                gameScore: catchData.gameScore || 0,
                motionAccuracy: catchData.motionAccuracy || 0,
                gameDifficulty: catchData.gameDifficulty || 'normal',
                timeToLand: catchData.timeToLand || 0, // seconds
                baitUsed: catchData.baitUsed || 'Virtual Worm',
                weatherCondition: catchData.weatherCondition || 'Sunny',
                waterDepth: catchData.waterDepth || Math.floor(Math.random() * 50) + 10,
                timestamp: new Date().toISOString(),
                isVirtual: true,
                gameMetrics: {
                    castAccuracy: catchData.castAccuracy || 0,
                    reelingConsistency: catchData.reelingConsistency || 0,
                    totalGameTime: catchData.totalGameTime || 0,
                    sensorDataQuality: catchData.sensorDataQuality || 'good'
                }
            };

            const gameCatches = this.getGameCatches();
            gameCatches.push(gameCatch);
            localStorage.setItem(this.storageKey, JSON.stringify(gameCatches));
            
            console.log('Game catch added:', gameCatch);
            
            // Update achievements
            this.updateAchievements(gameCatch);
            
            return gameCatch;
            
        } catch (error) {
            console.error('Error adding game catch:', error);
            throw error;
        }
    }

    /**
     * Get all game catches (never real catches)
     */
    getGameCatches() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('Error reading game catches:', error);
            return [];
        }
    }

    /**
     * Get game catch by ID
     */
    getGameCatch(id) {
        const gameCatches = this.getGameCatches();
        return gameCatches.find(catch_ => catch_.id === id);
    }

    /**
     * Update game catch
     */
    updateGameCatch(id, updateData) {
        try {
            const gameCatches = this.getGameCatches();
            const index = gameCatches.findIndex(catch_ => catch_.id === id);
            
            if (index === -1) {
                throw new Error('Game catch not found');
            }
            
            gameCatches[index] = { ...gameCatches[index], ...updateData };
            localStorage.setItem(this.storageKey, JSON.stringify(gameCatches));
            
            console.log('Game catch updated:', gameCatches[index]);
            return gameCatches[index];
            
        } catch (error) {
            console.error('Error updating game catch:', error);
            throw error;
        }
    }

    /**
     * Delete game catch
     */
    deleteGameCatch(id) {
        try {
            const gameCatches = this.getGameCatches();
            const filteredCatches = gameCatches.filter(catch_ => catch_.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filteredCatches));
            
            console.log('Game catch deleted:', id);
            return true;
            
        } catch (error) {
            console.error('Error deleting game catch:', error);
            throw error;
        }
    }

    /**
     * Clear all game catches
     */
    clearAllGameCatches() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
            localStorage.setItem(this.achievementsKey, JSON.stringify({}));
            console.log('All game catches cleared');
            return true;
        } catch (error) {
            console.error('Error clearing game catches:', error);
            throw error;
        }
    }

    /**
     * Generate unique catch ID
     */
    generateCatchId() {
        return 'catch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get game statistics
     */
    getGameStatistics() {
        const gameCatches = this.getGameCatches();
        
        if (gameCatches.length === 0) {
            return {
                totalCatches: 0,
                uniqueSpecies: 0,
                highestScore: 0,
                totalGameTime: 0,
                averageAccuracy: 0,
                bestSession: null,
                speciesBreakdown: {},
                difficultyStats: {},
                recentCatches: []
            };
        }

        // Calculate statistics
        const totalCatches = gameCatches.length;
        const uniqueSpecies = [...new Set(gameCatches.map(c => c.species))].length;
        const highestScore = Math.max(...gameCatches.map(c => c.gameScore || 0));
        const totalGameTime = gameCatches.reduce((sum, c) => sum + (c.gameMetrics?.totalGameTime || 0), 0);
        const averageAccuracy = gameCatches.reduce((sum, c) => sum + (c.motionAccuracy || 0), 0) / totalCatches;

        // Species breakdown
        const speciesBreakdown = {};
        gameCatches.forEach(catch_ => {
            const species = catch_.species;
            if (!speciesBreakdown[species]) {
                speciesBreakdown[species] = { count: 0, totalScore: 0, bestScore: 0 };
            }
            speciesBreakdown[species].count++;
            speciesBreakdown[species].totalScore += catch_.gameScore || 0;
            speciesBreakdown[species].bestScore = Math.max(speciesBreakdown[species].bestScore, catch_.gameScore || 0);
        });

        // Difficulty stats
        const difficultyStats = {};
        gameCatches.forEach(catch_ => {
            const difficulty = catch_.gameDifficulty || 'normal';
            if (!difficultyStats[difficulty]) {
                difficultyStats[difficulty] = { count: 0, totalScore: 0 };
            }
            difficultyStats[difficulty].count++;
            difficultyStats[difficulty].totalScore += catch_.gameScore || 0;
        });

        // Find best session
        const sessionScores = {};
        gameCatches.forEach(catch_ => {
            if (!sessionScores[catch_.sessionId]) {
                sessionScores[catch_.sessionId] = { score: 0, catches: 0, timestamp: catch_.timestamp };
            }
            sessionScores[catch_.sessionId].score += catch_.gameScore || 0;
            sessionScores[catch_.sessionId].catches++;
        });

        const bestSession = Object.entries(sessionScores)
            .sort((a, b) => b[1].score - a[1].score)[0];

        return {
            totalCatches,
            uniqueSpecies,
            highestScore,
            totalGameTime: Math.round(totalGameTime / 60), // Convert to minutes
            averageAccuracy: Math.round(averageAccuracy * 100) / 100,
            bestSession: bestSession ? {
                id: bestSession[0],
                score: bestSession[1].score,
                catches: bestSession[1].catches,
                timestamp: bestSession[1].timestamp
            } : null,
            speciesBreakdown,
            difficultyStats,
            recentCatches: gameCatches.slice(-5).reverse() // Last 5 catches
        };
    }

    /**
     * Update achievements based on new catch
     */
    updateAchievements(gameCatch) {
        try {
            const achievements = JSON.parse(localStorage.getItem(this.achievementsKey) || '{}');
            const stats = this.getGameStatistics();
            
            // Define achievement conditions
            const achievementConditions = {
                'first_catch': () => stats.totalCatches >= 1,
                'rookie_angler': () => stats.totalCatches >= 10,
                'experienced_angler': () => stats.totalCatches >= 50,
                'master_angler': () => stats.totalCatches >= 100,
                'high_scorer': () => stats.highestScore >= 1000,
                'perfect_accuracy': () => gameCatch.motionAccuracy >= 0.95,
                'species_collector': () => stats.uniqueSpecies >= 5,
                'marathon_fisher': () => stats.totalGameTime >= 60, // 1 hour
                'speed_catcher': () => gameCatch.timeToLand > 0 && gameCatch.timeToLand <= 5,
                'big_catch': () => gameCatch.length >= 100 // 1 meter fish
            };

            // Check and award achievements
            Object.entries(achievementConditions).forEach(([key, condition]) => {
                if (!achievements[key] && condition()) {
                    achievements[key] = {
                        unlocked: true,
                        timestamp: new Date().toISOString(),
                        catchId: gameCatch.id
                    };
                    console.log('🏆 Achievement unlocked:', key);
                }
            });

            localStorage.setItem(this.achievementsKey, JSON.stringify(achievements));
            
        } catch (error) {
            console.error('Error updating achievements:', error);
        }
    }

    /**
     * Get achievements
     */
    getAchievements() {
        try {
            return JSON.parse(localStorage.getItem(this.achievementsKey) || '{}');
        } catch (error) {
            console.error('Error reading achievements:', error);
            return {};
        }
    }

    /**
     * Export game data
     */
    exportGameData() {
        try {
            const gameData = {
                catches: this.getGameCatches(),
                settings: JSON.parse(localStorage.getItem(this.settingsKey) || '{}'),
                achievements: this.getAchievements(),
                statistics: this.getGameStatistics(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(gameData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `fishing-game-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('Game data exported successfully');
            return true;
            
        } catch (error) {
            console.error('Error exporting game data:', error);
            throw error;
        }
    }

    /**
     * Import game data
     */
    importGameData(jsonData) {
        try {
            const gameData = JSON.parse(jsonData);
            
            if (!gameData.catches || !Array.isArray(gameData.catches)) {
                throw new Error('Invalid game data format');
            }

            // Validate data structure
            gameData.catches.forEach(catch_ => {
                if (!catch_.isVirtual) {
                    throw new Error('Attempting to import non-game data');
                }
            });

            // Import data
            localStorage.setItem(this.storageKey, JSON.stringify(gameData.catches));
            
            if (gameData.settings) {
                localStorage.setItem(this.settingsKey, JSON.stringify(gameData.settings));
            }
            
            if (gameData.achievements) {
                localStorage.setItem(this.achievementsKey, JSON.stringify(gameData.achievements));
            }

            console.log('Game data imported successfully:', gameData.catches.length, 'catches');
            return true;
            
        } catch (error) {
            console.error('Error importing game data:', error);
            throw error;
        }
    }

    /**
     * Get game settings
     */
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.settingsKey) || JSON.stringify(this.defaultSettings));
        } catch (error) {
            console.error('Error reading game settings:', error);
            return this.defaultSettings;
        }
    }

    /**
     * Update game settings
     */
    updateSettings(newSettings) {
        try {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...newSettings };
            localStorage.setItem(this.settingsKey, JSON.stringify(updatedSettings));
            console.log('Game settings updated:', updatedSettings);
            return updatedSettings;
        } catch (error) {
            console.error('Error updating game settings:', error);
            throw error;
        }
    }

    /**
     * Start new game session
     */
    startNewSession() {
        this.currentSession = this.generateSessionId();
        console.log('New game session started:', this.currentSession);
        return this.currentSession;
    }

    /**
     * Get current session info
     */
    getCurrentSession() {
        return {
            id: this.currentSession,
            catches: this.getGameCatches().filter(c => c.sessionId === this.currentSession),
            startTime: this.currentSession.split('_')[1] // Extract timestamp from session ID
        };
    }
}

// Create global instance
let gameLogManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        gameLogManager = new GameLogManager();
        window.gameLogManager = gameLogManager; // Make it globally accessible
        console.log('✅ GameLogManager initialized globally');
    } catch (error) {
        console.error('❌ Failed to initialize GameLogManager:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogManager;
} else {
    window.GameLogManager = GameLogManager;
}