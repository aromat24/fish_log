// Self-improving Algorithm for Fish Weight Estimation
// JavaScript implementation of the Python self-improving algorithm

class SelfImprovingAlgorithm {
    constructor() {
        this.dataPointsKey = 'fish_data_points';
        this.algorithmsKey = 'fish_algorithms_improved';
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
