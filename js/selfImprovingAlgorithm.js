// Self-improving Algorithm for Fish Weight Estimation
// JavaScript implementation with advanced pattern learning and error recovery

class SelfImprovingAlgorithm {
    constructor() {
        this.dataPointsKey = 'fish_data_points';
        this.algorithmsKey = 'fish_algorithms_improved';
        this.metricsKey = 'fish_algorithm_metrics';
        this.performanceKey = 'fish_algorithm_performance';
        this.patternKey = 'fish_pattern_recognition';

        // Algorithm performance tracking
        this.performanceCache = new Map();
        this.patternWeights = new Map();
        this.learningRate = 0.1;
        this.confidenceThreshold = 0.75;

        // Initialize pattern learning system
        this.initializePatternLearning();
    }

    initializePatternLearning() {
        try {
            // Load existing patterns from storage
            const storedPatterns = this.getStoredPatterns();
            if (storedPatterns) {
                for (const [pattern, weight] of Object.entries(storedPatterns)) {
                    this.patternWeights.set(pattern, weight);
                }
            }

            // Load performance metrics
            const storedPerformance = this.getStoredPerformance();
            if (storedPerformance) {
                for (const [key, metrics] of Object.entries(storedPerformance)) {
                    this.performanceCache.set(key, metrics);
                }
            }

            console.log('Pattern learning system initialized');
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(new window.FishLogError('Pattern learning initialization failed', error), 'SelfImprovingAlgorithm.init');
            }
            console.error('Failed to initialize pattern learning:', error);
        }
    }

    // Enhanced pattern recognition for algorithm selection
    analyzeSpeciesPattern(speciesName, length, historicalData = null) {
        try {
            const patterns = {
                species_type: this.classifySpeciesType(speciesName),
                length_category: this.categorizeLengthRange(length),
                body_shape: this.inferBodyShape(speciesName),
                habitat: this.inferHabitat(speciesName),
                family: this.inferFamily(speciesName)
            };

            // Calculate pattern confidence based on historical performance
            let totalConfidence = 0;
            let weightSum = 0;

            for (const [patternType, patternValue] of Object.entries(patterns)) {
                const patternKey = `${patternType}:${patternValue}`;
                const weight = this.patternWeights.get(patternKey) || 0.5;
                const confidence = this.calculatePatternConfidence(patternKey, historicalData);

                totalConfidence += confidence * weight;
                weightSum += weight;
            }

            const overallConfidence = weightSum > 0 ? totalConfidence / weightSum : 0.5;

            return {
                patterns,
                confidence: overallConfidence,
                recommendedAlgorithm: this.selectAlgorithmByPattern(patterns, overallConfidence)
            };
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(new window.CalculationError('Pattern analysis failed', error, speciesName), 'PatternAnalysis');
            }
            return {
                patterns: {},
                confidence: 0.3,
                recommendedAlgorithm: 'default'
            };
        }
    }

    classifySpeciesType(speciesName) {
        const name = speciesName.toLowerCase();

        // Marine fish patterns
        if (name.includes('tuna') || name.includes('marlin') || name.includes('shark')) {
            return 'pelagic_marine';
        }
        if (name.includes('cod') || name.includes('haddock') || name.includes('halibut')) {
            return 'demersal_marine';
        }
        if (name.includes('snapper') || name.includes('grouper') || name.includes('parrotfish')) {
            return 'reef_marine';
        }

        // Freshwater patterns
        if (name.includes('bass') || name.includes('pike') || name.includes('walleye')) {
            return 'predator_freshwater';
        }
        if (name.includes('carp') || name.includes('catfish') || name.includes('sucker')) {
            return 'bottom_freshwater';
        }
        if (name.includes('trout') || name.includes('salmon') || name.includes('char')) {
            return 'salmonid';
        }

        return 'general';
    }

    categorizeLengthRange(length) {
        if (length < 15) return 'small';
        if (length < 50) return 'medium';
        if (length < 100) return 'large';
        return 'extra_large';
    }

    inferBodyShape(speciesName) {
        const name = speciesName.toLowerCase();

        if (name.includes('eel') || name.includes('snake')) return 'elongated';
        if (name.includes('flounder') || name.includes('sole') || name.includes('ray')) return 'flattened';
        if (name.includes('puffer') || name.includes('boxfish')) return 'rounded';
        if (name.includes('tuna') || name.includes('mackerel')) return 'fusiform';
        if (name.includes('angelfish') || name.includes('butterflyfish')) return 'compressed';

        return 'typical';
    }

    inferHabitat(speciesName) {
        const name = speciesName.toLowerCase();

        if (name.includes('reef') || name.includes('coral')) return 'coral_reef';
        if (name.includes('deep') || name.includes('abyssal')) return 'deep_sea';
        if (name.includes('freshwater') || name.includes('lake') || name.includes('river')) return 'freshwater';
        if (name.includes('estuary') || name.includes('brackish')) return 'estuarine';

        return 'marine';
    }

    inferFamily(speciesName) {
        const name = speciesName.toLowerCase();

        // Common fish families
        if (name.includes('bass')) return 'serranidae';
        if (name.includes('cod')) return 'gadidae';
        if (name.includes('tuna')) return 'scombridae';
        if (name.includes('salmon') || name.includes('trout')) return 'salmonidae';
        if (name.includes('shark')) return 'chondrichthyes';
        if (name.includes('flounder') || name.includes('sole')) return 'pleuronectidae';

        return 'unknown';
    }

    calculatePatternConfidence(patternKey, historicalData) {
        // Get historical performance for this pattern
        const performance = this.performanceCache.get(patternKey);
        if (!performance) return 0.5; // Default confidence

        const successRate = performance.successes / (performance.successes + performance.failures);
        const totalSamples = performance.successes + performance.failures;

        // Apply confidence interval adjustment
        const confidenceInterval = 1.96 * Math.sqrt((successRate * (1 - successRate)) / totalSamples);
        const adjustedConfidence = Math.max(0, successRate - confidenceInterval);

        return Math.min(1, adjustedConfidence);
    }

    selectAlgorithmByPattern(patterns, confidence) {
        // Advanced algorithm selection based on patterns and confidence
        if (confidence > 0.8) {
            return 'improved';
        } else if (confidence > 0.6) {
            return 'adaptive';
        } else if (confidence > 0.4) {
            return 'default';
        }
        return 'generic';
    }

    // Enhanced algorithm performance tracking
    recordAlgorithmPerformance(speciesName, algorithmType, actualWeight, predictedWeight, patterns = null) {
        try {
            const accuracy = this.calculatePredictionAccuracy(actualWeight, predictedWeight);
            const timestamp = new Date().toISOString();

            // Record overall performance
            const performanceKey = `${speciesName}:${algorithmType}`;
            const currentPerformance = this.performanceCache.get(performanceKey) || {
                successes: 0,
                failures: 0,
                totalAccuracy: 0,
                samples: 0,
                lastUpdated: timestamp
            };

            if (accuracy > this.confidenceThreshold) {
                currentPerformance.successes++;
            } else {
                currentPerformance.failures++;
            }

            currentPerformance.totalAccuracy += accuracy;
            currentPerformance.samples++;
            currentPerformance.lastUpdated = timestamp;

            this.performanceCache.set(performanceKey, currentPerformance);

            // Update pattern weights using machine learning approach
            if (patterns) {
                this.updatePatternWeights(patterns, accuracy);
            }

            // Persist performance data
            this.savePerformanceData();

            console.log(`Algorithm performance recorded: ${algorithmType} for ${speciesName}, accuracy: ${accuracy.toFixed(3)}`);

        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(new window.CalculationError('Performance recording failed', error, speciesName), 'PerformanceTracking');
            }
        }
    }

    calculatePredictionAccuracy(actual, predicted) {
        if (actual <= 0 || predicted <= 0) return 0;

        const relativeError = Math.abs(actual - predicted) / actual;
        return Math.max(0, 1 - relativeError);
    }

    updatePatternWeights(patterns, accuracy) {
        // Use gradient descent-like approach to update pattern weights
        for (const [patternType, patternValue] of Object.entries(patterns)) {
            const patternKey = `${patternType}:${patternValue}`;
            const currentWeight = this.patternWeights.get(patternKey) || 0.5;

            // Calculate weight adjustment based on prediction accuracy
            const error = accuracy - this.confidenceThreshold;
            const adjustment = this.learningRate * error;
            const newWeight = Math.max(0.1, Math.min(1.0, currentWeight + adjustment));

            this.patternWeights.set(patternKey, newWeight);
        }

        // Persist pattern weights
        this.savePatternWeights();
    }

    // Advanced algorithm selection with dynamic weighting
    async getOptimalAlgorithm(speciesName, length, context = {}) {
        if (window.errorHandler) {
            return await window.errorHandler.withErrorBoundary(async () => {
                return await this.getOptimalAlgorithmInternal(speciesName, length, context);
            }, 'OptimalAlgorithmSelection', {
                showUserError: false
            });
        } else {
            return await this.getOptimalAlgorithmInternal(speciesName, length, context);
        }
    }

    async getOptimalAlgorithmInternal(speciesName, length, context) {
        // Analyze patterns for this species and length
        const patternAnalysis = this.analyzeSpeciesPattern(speciesName, length, context.historicalData);

        // Get available algorithms
        const algorithms = await this.getAvailableAlgorithms(speciesName);

        // Score each algorithm based on patterns and performance
        const scoredAlgorithms = algorithms.map(algorithm => ({
            ...algorithm,
            score: this.scoreAlgorithm(algorithm, patternAnalysis, speciesName, length)
        }));

        // Sort by score (highest first)
        scoredAlgorithms.sort((a, b) => b.score - a.score);

        const selectedAlgorithm = scoredAlgorithms[0];

        console.log(`Selected algorithm: ${selectedAlgorithm.type} for ${speciesName} (score: ${selectedAlgorithm.score.toFixed(3)})`);

        return selectedAlgorithm;
    }

    async getAvailableAlgorithms(speciesName) {
        const algorithms = [];

        // Check for improved algorithm
        const improvedAlg = this.getImprovedAlgorithm(speciesName);
        if (improvedAlg) {
            algorithms.push({
                type: 'improved',
                ...improvedAlg,
                priority: 1
            });
        }

        // Check for default algorithm
        const defaultAlg = await this.getDefaultAlgorithm(speciesName);
        if (defaultAlg) {
            algorithms.push({
                type: 'default',
                ...defaultAlg,
                priority: 2
            });
        }

        // Always include generic algorithm as fallback
        algorithms.push({
            type: 'generic',
            a: 0.000013,
            b: 3.0,
            r_squared: 0.5,
            priority: 3
        });

        return algorithms;
    }

    scoreAlgorithm(algorithm, patternAnalysis, speciesName, length) {
        let score = 0;

        // Base score from R-squared
        score += (algorithm.r_squared || 0.5) * 0.4;

        // Pattern confidence contribution
        score += patternAnalysis.confidence * 0.3;

        // Historical performance contribution
        const performanceKey = `${speciesName}:${algorithm.type}`;
        const performance = this.performanceCache.get(performanceKey);
        if (performance && performance.samples > 0) {
            const successRate = performance.successes / (performance.successes + performance.failures);
            score += successRate * 0.2;
        }

        // Algorithm priority (lower number = higher priority)
        score += (4 - algorithm.priority) * 0.1;

        return Math.max(0, Math.min(1, score));
    }

    // Enhanced storage operations with error handling
    getStoredPatterns() {
        if (window.errorHandler) {
            const result = window.errorHandler.withSyncErrorBoundary(() => {
                return JSON.parse(localStorage.getItem(this.patternKey) || '{}');
            }, 'GetStoredPatterns', { showUserError: false });
            return result.success ? result.result : {};
        } else {
            try {
                return JSON.parse(localStorage.getItem(this.patternKey) || '{}');
            } catch (error) {
                console.error('Error getting stored patterns:', error);
                return {};
            }
        }
    }

    savePatternWeights() {
        if (window.errorHandler) {
            return window.errorHandler.withSyncErrorBoundary(() => {
                const patterns = Object.fromEntries(this.patternWeights);
                localStorage.setItem(this.patternKey, JSON.stringify(patterns));
                return true;
            }, 'SavePatternWeights', { showUserError: false });
        } else {
            try {
                const patterns = Object.fromEntries(this.patternWeights);
                localStorage.setItem(this.patternKey, JSON.stringify(patterns));
                return true;
            } catch (error) {
                console.error('Error saving pattern weights:', error);
                return false;
            }
        }
    }

    getStoredPerformance() {
        if (window.errorHandler) {
            const result = window.errorHandler.withSyncErrorBoundary(() => {
                return JSON.parse(localStorage.getItem(this.performanceKey) || '{}');
            }, 'GetStoredPerformance', { showUserError: false });
            return result.success ? result.result : {};
        } else {
            try {
                return JSON.parse(localStorage.getItem(this.performanceKey) || '{}');
            } catch (error) {
                console.error('Error getting stored performance:', error);
                return {};
            }
        }
    }

    savePerformanceData() {
        if (window.errorHandler) {
            return window.errorHandler.withSyncErrorBoundary(() => {
                const performance = Object.fromEntries(this.performanceCache);
                localStorage.setItem(this.performanceKey, JSON.stringify(performance));
                return true;
            }, 'SavePerformanceData', { showUserError: false });
        } else {
            try {
                const performance = Object.fromEntries(this.performanceCache);
                localStorage.setItem(this.performanceKey, JSON.stringify(performance));
                return true;
            } catch (error) {
                console.error('Error saving performance data:', error);
                return false;
            }
        }
    }

    // Power law function: W = a * L^b
    powerLaw(length, a, b) {
        return a * Math.pow(length, b);
    }

    // Calculate R-squared for goodness of fit
    calculateRSquared(actualWeights, predictedWeights) {
        const meanActual = actualWeights.reduce((sum, w) => sum + w, 0) / actualWeights.length;
        const totalSumSquares = actualWeights.reduce((sum, w) => sum + Math.pow(w - meanActual, 2), 0);
        const residualSumSquares = actualWeights.reduce((sum, w, i) => sum + Math.pow(w - predictedWeights[i], 2), 0);

        return totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    }

    // Simplified curve fitting using least squares regression on log-transformed data
    calculateLWRParameters(lengths, weights) {
        try {
            // Filter out non-positive values
            const validData = lengths.map((l, i) => ({ length: l, weight: weights[i] }))
                .filter(d => d.length > 0 && d.weight > 0);

            if (validData.length < 2) {
                return { success: false, error: "Not enough valid data points" };
            }

            // Transform to log space: log(W) = log(a) + b * log(L)
            const logLengths = validData.map(d => Math.log(d.length));
            const logWeights = validData.map(d => Math.log(d.weight));

            // Calculate least squares regression
            const n = logLengths.length;
            const sumX = logLengths.reduce((sum, x) => sum + x, 0);
            const sumY = logWeights.reduce((sum, y) => sum + y, 0);
            const sumXY = logLengths.reduce((sum, x, i) => sum + x * logWeights[i], 0);
            const sumX2 = logLengths.reduce((sum, x) => sum + x * x, 0);

            const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const logA = (sumY - b * sumX) / n;
            const a = Math.exp(logA);

            // Constrain b to realistic range (2.5 - 3.5 for fish)
            const constrainedB = Math.max(2.5, Math.min(3.5, b));

            // Calculate R-squared
            const predictedWeights = validData.map(d => this.powerLaw(d.length, a, constrainedB));
            const actualWeights = validData.map(d => d.weight);
            const rSquared = this.calculateRSquared(actualWeights, predictedWeights);

            return {
                success: true,
                a: a,
                b: constrainedB,
                rSquared: rSquared,
                dataPointsCount: validData.length
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get stored data points for a species
    getSpeciesDataPoints(speciesName) {
        try {
            const allDataPoints = JSON.parse(localStorage.getItem(this.dataPointsKey) || '{}');
            return allDataPoints[speciesName] || { lengths: [], weights: [] };
        } catch (error) {
            console.error('Error getting species data points:', error);
            return { lengths: [], weights: [] };
        }
    }

    // Save data points for a species
    saveSpeciesDataPoints(speciesName, dataPoints) {
        try {
            const allDataPoints = JSON.parse(localStorage.getItem(this.dataPointsKey) || '{}');
            allDataPoints[speciesName] = dataPoints;
            localStorage.setItem(this.dataPointsKey, JSON.stringify(allDataPoints));
            return true;
        } catch (error) {
            console.error('Error saving species data points:', error);
            return false;
        }
    }

    // Get stored algorithms
    getStoredAlgorithms() {
        try {
            return JSON.parse(localStorage.getItem(this.algorithmsKey) || '{}');
        } catch (error) {
            console.error('Error getting stored algorithms:', error);
            return {};
        }
    }

    // Save algorithms
    saveAlgorithms(algorithms) {
        try {
            localStorage.setItem(this.algorithmsKey, JSON.stringify(algorithms));
            return true;
        } catch (error) {
            console.error('Error saving algorithms:', error);
            return false;
        }
    }

    // Update species algorithm with new data point
    updateSpeciesAlgorithm(speciesName, newLength, newWeight) {
        console.log('=== UPDATE SPECIES ALGORITHM START ===');
        console.log('Species:', speciesName, 'Length:', newLength, 'Weight:', newWeight);

        try {
            // Input validation
            if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
                console.error('Invalid species name provided:', speciesName);
                return {
                    status: "error",
                    message: "Invalid species name provided"
                };
            }

            if (!newLength || typeof newLength !== 'number' || newLength <= 0) {
                console.error('Invalid length provided:', newLength);
                return {
                    status: "error",
                    message: "Invalid length provided"
                };
            }

            if (!newWeight || typeof newWeight !== 'number' || newWeight <= 0) {
                console.error('Invalid weight provided:', newWeight);
                return {
                    status: "error",
                    message: "Invalid weight provided"
                };
            }

            // Get existing data points
            const dataPoints = this.getSpeciesDataPoints(speciesName);
            if (!dataPoints || !Array.isArray(dataPoints.lengths) || !Array.isArray(dataPoints.weights)) {
                console.error('Invalid data points structure:', dataPoints);
                return {
                    status: "error",
                    message: "Invalid data points structure"
                };
            }

            // Add new data point
            dataPoints.lengths.push(newLength);
            dataPoints.weights.push(newWeight);

            // Save updated data points
            const saved = this.saveSpeciesDataPoints(speciesName, dataPoints);
            if (!saved) {
                console.error('Failed to save data points');
                return {
                    status: "error",
                    message: "Failed to save data points"
                };
            }

            console.log('Data points updated. Total points:', dataPoints.lengths.length);

            // Calculate new algorithm parameters if we have enough data
            if (dataPoints.lengths.length >= 2) {
                const result = this.calculateLWRParameters(dataPoints.lengths, dataPoints.weights);

                if (result.success) {
                    // Update stored algorithms
                    const algorithms = this.getStoredAlgorithms();
                    if (!algorithms || typeof algorithms !== 'object') {
                        console.error('Failed to get stored algorithms');
                        return {
                            status: "error",
                            message: "Failed to get stored algorithms"
                        };
                    }

                    algorithms[speciesName] = {
                        a: result.a,
                        b: result.b,
                        r_squared: result.rSquared,
                        data_points_count: result.dataPointsCount,
                        last_updated: new Date().toISOString(),
                        formula: "W = a * L^b"
                    };

                    const algorithmsSaved = this.saveAlgorithms(algorithms);
                    if (!algorithmsSaved) {
                        console.error('Failed to save algorithms');
                        return {
                            status: "error",
                            message: "Failed to save algorithms"
                        };
                    }

                    console.log('Algorithm updated successfully:', algorithms[speciesName]);
                    return {
                        status: "success",
                        message: "Algorithm updated successfully",
                        algorithm: algorithms[speciesName]
                    };
                } else {
                    console.error('Failed to calculate parameters:', result.error);
                    return {
                        status: "failed",
                        message: `Failed to calculate parameters: ${result.error}`,
                        data_points_count: dataPoints.lengths.length
                    };
                }
            } else {
                console.log('Not enough data points for calculation');
                return {
                    status: "pending",
                    message: "Not enough data points to calculate parameters yet. Need at least 2.",
                    data_points_count: dataPoints.lengths.length
                };
            }
        } catch (error) {
            console.error('Error updating species algorithm:', error);
            return {
                status: "error",
                message: `Error: ${error.message}`
            };
        }
    }

    // Get the best algorithm for a species (improved or default)
    getBestAlgorithm(speciesName) {
        try {
            // First check if we have an improved algorithm
            const improvedAlgorithms = this.getStoredAlgorithms();
            if (improvedAlgorithms[speciesName]) {
                return {
                    source: "improved",
                    ...improvedAlgorithms[speciesName]
                };
            }

            // Fall back to default algorithm from fish_algorithms.json
            if (window.fishDatabase && window.fishDatabase.algorithms) {
                for (const [id, data] of Object.entries(window.fishDatabase.algorithms)) {
                    if (data.species_name === speciesName) {
                        return {
                            source: "default",
                            a: data.algorithm.a,
                            b: data.algorithm.b,
                            r_squared: data.algorithm.r_squared,
                            formula: data.algorithm.formula
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting best algorithm:', error);
            return null;
        }
    }

    // Calculate weight using the best available algorithm
    calculateWeight(speciesName, length) {
        console.log('=== SELF-IMPROVING CALCULATE WEIGHT START ===');
        console.log('Species:', speciesName, 'Length:', length);

        try {
            // Input validation
            if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
                console.error('Invalid species name provided:', speciesName);
                return null;
            }

            if (!length || typeof length !== 'number' || length <= 0) {
                console.error('Invalid length provided:', length);
                return null;
            }

            const algorithm = this.getBestAlgorithm(speciesName);
            if (!algorithm) {
                console.log('No algorithm found for species:', speciesName);
                return null;
            }

            // Validate algorithm parameters
            if (typeof algorithm.a !== 'number' || typeof algorithm.b !== 'number' ||
                algorithm.a <= 0 || algorithm.b <= 0) {
                console.error('Invalid algorithm parameters:', algorithm);
                return null;
            }

            const weight = this.powerLaw(length, algorithm.a, algorithm.b);

            // Validate result
            if (isNaN(weight) || weight <= 0) {
                console.error('Invalid weight calculation result:', weight);
                return null;
            }

            const result = {
                weight: weight,
                algorithm_source: algorithm.source,
                r_squared: algorithm.r_squared || 0,
                confidence: algorithm.r_squared > 0.8 ? 'high' : algorithm.r_squared > 0.6 ? 'medium' : 'low'
            };

            console.log('Self-improving algorithm result:', result);
            return result;
        } catch (error) {
            console.error('Error in calculateWeight:', error);
            return null;
        }
    }

    // Get statistics about improved algorithms
    getAlgorithmStats() {
        try {
            const algorithms = this.getStoredAlgorithms();
            const dataPoints = JSON.parse(localStorage.getItem(this.dataPointsKey) || '{}');

            const stats = {
                total_species: Object.keys(algorithms).length,
                total_data_points: 0,
                average_r_squared: 0,
                species_with_high_confidence: 0
            };

            let totalRSquared = 0;
            for (const [species, algorithm] of Object.entries(algorithms)) {
                stats.total_data_points += algorithm.data_points_count || 0;
                totalRSquared += algorithm.r_squared || 0;
                if (algorithm.r_squared > 0.8) {
                    stats.species_with_high_confidence++;
                }
            }

            if (stats.total_species > 0) {
                stats.average_r_squared = totalRSquared / stats.total_species;
            }

            return stats;
        } catch (error) {
            console.error('Error getting algorithm stats:', error);
            return null;
        }
    }

    // Export all data for backup
    exportData() {
        try {
            return {
                algorithms: this.getStoredAlgorithms(),
                data_points: JSON.parse(localStorage.getItem(this.dataPointsKey) || '{}'),
                export_date: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    // Import data from backup
    importData(data) {
        try {
            if (data.algorithms) {
                this.saveAlgorithms(data.algorithms);
            }
            if (data.data_points) {
                localStorage.setItem(this.dataPointsKey, JSON.stringify(data.data_points));
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.SelfImprovingAlgorithm = SelfImprovingAlgorithm;
