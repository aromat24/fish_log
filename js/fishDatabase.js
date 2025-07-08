// Fish Species Database Manager
// Handles IndexedDB operations and length-to-weight calculations

class FishDatabase {
    constructor() {
        this.db = null;
        this.dbName = 'FishSpeciesDB';
        this.version = 1;
        this.algorithms = null;
        this.connectionPool = new Map();
        this.maxConnections = 3;
        this.initPromise = this.init();
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            await this.loadAlgorithms();
            return true;
        } catch (error) {
            console.error('Failed to initialize fish database:', error);
            if (window.errorHandler) {
                window.errorHandler.logError(new window.DatabaseError('Database initialization failed', error), 'FishDatabase.init');
            }
            return false;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => {
                    const error = new window.DatabaseError('IndexedDB open failed', request.error);
                    console.error('IndexedDB open error:', request.error);
                    if (window.errorHandler) {
                        window.errorHandler.logError(error, 'FishDatabase.openDatabase');
                    }
                    reject(error);
                };

                request.onsuccess = () => {
                    const db = request.result;

                    // Set up multi-tab synchronization
                    db.onversionchange = () => {
                        console.warn('Database version changed in another tab');
                        db.close();
                        if (window.errorHandler) {
                            window.errorHandler.showUserError('Database was updated in another tab. Please refresh the page.');
                        }
                    };

                    // Set up global error handler for this database
                    db.onerror = (event) => {
                        const error = new window.DatabaseError('Database operation failed', event.target.error);
                        console.error('Database error:', event.target.error);
                        if (window.errorHandler) {
                            window.errorHandler.logError(error, 'FishDatabase.globalError');
                        }
                    };

                    resolve(db);
                };

                request.onblocked = () => {
                    console.warn('Database blocked - another connection is preventing upgrade');
                    if (window.errorHandler) {
                        window.errorHandler.showUserError('Database is busy. Please close other tabs and try again.');
                    }
                };

                request.onupgradeneeded = (event) => {
                    try {
                        const db = event.target.result;
                        const transaction = event.target.transaction;

                        // Set up transaction error handling
                        transaction.onerror = (txError) => {
                            console.error('Transaction error during upgrade:', txError);
                            if (window.errorHandler) {
                                window.errorHandler.logError(new window.DatabaseError('Upgrade transaction failed', txError), 'FishDatabase.upgrade');
                            }
                        };

                        // Create object store for species algorithms
                        if (!db.objectStoreNames.contains('algorithms')) {
                            const algoStore = db.createObjectStore('algorithms', { keyPath: 'species_id' });
                            algoStore.createIndex('species_name', 'species_name', { unique: false });
                            algoStore.createIndex('edible', 'edible', { unique: false });
                        }

                        // Create object store for length-weight data
                        if (!db.objectStoreNames.contains('lengthWeightData')) {
                            const dataStore = db.createObjectStore('lengthWeightData', { keyPath: 'id', autoIncrement: true });
                            dataStore.createIndex('species_id', 'Species_ID', { unique: false });
                            dataStore.createIndex('species', 'Species', { unique: false });
                            dataStore.createIndex('timestamp', 'timestamp', { unique: false });
                        }

                        // Create object store for algorithm performance metrics
                        if (!db.objectStoreNames.contains('algorithmMetrics')) {
                            const metricsStore = db.createObjectStore('algorithmMetrics', { keyPath: 'id', autoIncrement: true });
                            metricsStore.createIndex('species_id', 'species_id', { unique: false });
                            metricsStore.createIndex('algorithm_type', 'algorithm_type', { unique: false });
                            metricsStore.createIndex('timestamp', 'timestamp', { unique: false });
                        }

                    } catch (upgradeError) {
                        console.error('Error during IndexedDB upgrade:', upgradeError);
                        if (window.errorHandler) {
                            window.errorHandler.logError(new window.DatabaseError('Database upgrade failed', upgradeError), 'FishDatabase.upgrade');
                        }
                        reject(upgradeError);
                    }
                };
            } catch (outerError) {
                console.error('Exception in openDatabase:', outerError);
                if (window.errorHandler) {
                    window.errorHandler.logError(new window.DatabaseError('Database open exception', outerError), 'FishDatabase.openDatabase');
                }
                reject(outerError);
            }
        });
    }

    // Advanced transaction wrapper with comprehensive error handling
    async executeTransaction(storeNames, mode, operation) {
        if (!this.db) {
            throw new window.DatabaseError('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(storeNames, mode);

                transaction.oncomplete = () => {
                    console.log('Transaction completed successfully');
                    resolve();
                };

                transaction.onerror = (event) => {
                    const error = new window.DatabaseError('Transaction failed', event.target.error);
                    console.error('Transaction error:', event.target.error);
                    if (window.errorHandler) {
                        window.errorHandler.logError(error, 'FishDatabase.executeTransaction');
                    }
                    reject(error);
                };

                transaction.onabort = (event) => {
                    const error = new window.DatabaseError('Transaction aborted', event.target.error);
                    console.error('Transaction aborted:', event.target.error);
                    if (window.errorHandler) {
                        window.errorHandler.logError(error, 'FishDatabase.executeTransaction');
                    }
                    reject(error);
                };

                // Execute the operation
                operation(transaction);

            } catch (error) {
                const dbError = new window.DatabaseError('Transaction setup failed', error);
                if (window.errorHandler) {
                    window.errorHandler.logError(dbError, 'FishDatabase.executeTransaction');
                }
                reject(dbError);
            }
        });
    }

    // Cursor-based batch operations for efficient data processing
    async processAlgorithmsBatch(batchSize = 50, processor) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['algorithms'], 'readonly');
                const store = transaction.objectStore('algorithms');
                const request = store.openCursor();

                let batch = [];
                let processed = 0;

                request.onsuccess = async (event) => {
                    const cursor = event.target.result;

                    if (cursor) {
                        batch.push({
                            key: cursor.primaryKey,
                            value: cursor.value
                        });

                        if (batch.length >= batchSize) {
                            try {
                                await processor(batch);
                                processed += batch.length;
                                batch = [];
                            } catch (processingError) {
                                if (window.errorHandler) {
                                    window.errorHandler.logError(new window.DatabaseError('Batch processing failed', processingError), 'FishDatabase.processAlgorithmsBatch');
                                }
                                reject(processingError);
                                return;
                            }
                        }

                        cursor.continue();
                    } else {
                        // Process remaining items
                        if (batch.length > 0) {
                            try {
                                await processor(batch);
                                processed += batch.length;
                            } catch (processingError) {
                                if (window.errorHandler) {
                                    window.errorHandler.logError(new window.DatabaseError('Final batch processing failed', processingError), 'FishDatabase.processAlgorithmsBatch');
                                }
                                reject(processingError);
                                return;
                            }
                        }
                        resolve(processed);
                    }
                };

                request.onerror = (event) => {
                    const error = new window.DatabaseError('Cursor operation failed', event.target.error);
                    if (window.errorHandler) {
                        window.errorHandler.logError(error, 'FishDatabase.processAlgorithmsBatch');
                    }
                    reject(error);
                };

            } catch (error) {
                const dbError = new window.DatabaseError('Batch processing setup failed', error);
                if (window.errorHandler) {
                    window.errorHandler.logError(dbError, 'FishDatabase.processAlgorithmsBatch');
                }
                reject(dbError);
            }
        });
    }

    // Advanced search with cursor and filtering
    async searchSpecies(query, options = {}) {
        const { limit = 10, offset = 0, filterEdible = null } = options;

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['algorithms'], 'readonly');
                const store = transaction.objectStore('algorithms');
                const index = store.index('species_name');

                const results = [];
                let skipped = 0;
                let found = 0;

                const normalizedQuery = query.toLowerCase();
                const request = index.openCursor();

                request.onsuccess = (event) => {
                    const cursor = event.target.result;

                    if (cursor && found < limit) {
                        const species = cursor.value;
                        const speciesName = species.species_name.toLowerCase();

                        // Apply filters
                        let matches = speciesName.includes(normalizedQuery);
                        if (filterEdible !== null) {
                            matches = matches && species.edible === filterEdible;
                        }

                        if (matches) {
                            if (skipped < offset) {
                                skipped++;
                            } else {
                                results.push(species);
                                found++;
                            }
                        }

                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };

                request.onerror = (event) => {
                    const error = new window.DatabaseError('Species search failed', event.target.error);
                    if (window.errorHandler) {
                        window.errorHandler.logError(error, 'FishDatabase.searchSpecies');
                    }
                    reject(error);
                };

            } catch (error) {
                const dbError = new window.DatabaseError('Search setup failed', error);
                if (window.errorHandler) {
                    window.errorHandler.logError(dbError, 'FishDatabase.searchSpecies');
                }
                reject(dbError);
            }
        });
    }

    async loadAlgorithms() {
        if (window.errorHandler) {
            return await window.errorHandler.withErrorBoundary(async () => {
                return await this._loadAlgorithmsInternal();
            }, 'FishDatabase.loadAlgorithms', {
                userMessage: 'Failed to load fish species data. Please check your connection and try again.'
            });
        } else {
            return await this._loadAlgorithmsInternal();
        }
    }

    async _loadAlgorithmsInternal() {
        try {
            console.log('Loading fish algorithms from: ./fish_algorithms.json');

            // Try network first with timeout
            const response = await Promise.race([
                fetch('./fish_algorithms.json'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Network timeout')), 10000)
                )
            ]);

            if (!response.ok) {
                throw new window.NetworkError(
                    `Failed to fetch algorithms: ${response.status} ${response.statusText}`,
                    null,
                    './fish_algorithms.json',
                    response.status
                );
            }

            const data = await response.json();
            console.log('Fish algorithms loaded successfully:', data);
            console.log('Number of species in database:', Object.keys(data).length);

            // Validate data structure
            this._validateAlgorithmData(data);

            this.algorithms = data;

            // Store in IndexedDB for offline access with batching
            await this.storeAlgorithmsBatch(data);

            // Initialize self-improving algorithm
            if (window.SelfImprovingAlgorithm) {
                this.selfImprovingAlgorithm = new window.SelfImprovingAlgorithm();
                console.log('Self-improving algorithm initialized');
            }

            return { success: true, result: data };
        } catch (error) {
            console.error('Failed to load algorithms from network:', error);
            console.log('Attempting to load from IndexedDB...');

            // Try to load from IndexedDB as fallback
            const fallbackResult = await this.getStoredAlgorithms();
            if (fallbackResult.success && fallbackResult.result && Object.keys(fallbackResult.result).length > 0) {
                console.log('Loaded algorithms from IndexedDB:', fallbackResult.result);
                this.algorithms = fallbackResult.result;
                return fallbackResult;
            } else {
                throw new window.DatabaseError('No algorithms available from any source', error);
            }
        }
    }

    _validateAlgorithmData(data) {
        if (!data || typeof data !== 'object') {
            throw new window.ValidationError('Algorithm data must be an object');
        }

        const entries = Object.entries(data);
        if (entries.length === 0) {
            throw new window.ValidationError('Algorithm data cannot be empty');
        }

        // Validate a few random entries
        const sampleSize = Math.min(5, entries.length);
        const samples = entries.slice(0, sampleSize);

        for (const [speciesId, speciesData] of samples) {
            if (!speciesData.species_name) {
                throw new window.ValidationError(`Missing species_name for ${speciesId}`);
            }
            if (!speciesData.algorithm) {
                throw new window.ValidationError(`Missing algorithm for ${speciesId}`);
            }
        }
    }

    async storeAlgorithmsBatch(algorithms) {
        const batchSize = 50;
        const entries = Object.entries(algorithms);

        return await this.executeTransaction(['algorithms'], 'readwrite', async (transaction) => {
            const store = transaction.objectStore('algorithms');

            // Clear existing data first
            await new Promise((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = (event) => {
                    if (event.target.error.name === 'ConstraintError') {
                        event.preventDefault(); // Don't abort transaction
                        console.warn('Clear operation constraint error, continuing...');
                        resolve();
                    } else {
                        reject(new window.DatabaseError('Failed to clear algorithms store', event.target.error));
                    }
                };
            });

            // Store in batches
            for (let i = 0; i < entries.length; i += batchSize) {
                const batch = entries.slice(i, i + batchSize);
                const promises = batch.map(([speciesId, data]) => {
                    return new Promise((resolve, reject) => {
                        try {
                            const record = {
                                species_id: speciesId,
                                species_name: data.species_name,
                                edible: data.edible,
                                algorithm: data.algorithm
                            };

                            const request = store.put(record);
                            request.onsuccess = () => resolve();
                            request.onerror = (event) => {
                                if (event.target.error.name === 'ConstraintError') {
                                    event.preventDefault();
                                    console.warn(`Constraint error for ${speciesId}, skipping...`);
                                    resolve(); // Continue with other records
                                } else {
                                    reject(new window.DatabaseError(`Failed to store ${speciesId}`, event.target.error));
                                }
                            };
                        } catch (error) {
                            reject(new window.DatabaseError(`Error preparing record ${speciesId}`, error));
                        }
                    });
                });

                await Promise.allSettled(promises);
            }
        });
    }

    async storeAlgorithms(algorithms) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['algorithms'], 'readwrite');
                const store = transaction.objectStore('algorithms');

                transaction.oncomplete = () => resolve();
                transaction.onerror = (event) => {
                    const error = new window.DatabaseError('Store algorithms transaction failed', event.target.error);
                    console.error('IndexedDB transaction error (storeAlgorithms):', event.target.error);
                    if (window.errorHandler) {
                        window.errorHandler.logError(error, 'FishDatabase.storeAlgorithms');
                    }
                    reject(error);
                };

                // Store each algorithm with individual error handling
                Object.entries(algorithms).forEach(([speciesId, data]) => {
                    try {
                        const record = {
                            species_id: speciesId,
                            species_name: data.species_name,
                            edible: data.edible,
                            algorithm: data.algorithm
                        };

                        const request = store.put(record);
                        request.onerror = (event) => {
                            if (event.target.error.name === 'ConstraintError') {
                                console.warn(`Duplicate key for ${speciesId}, skipping...`);
                                event.preventDefault(); // Don't abort transaction
                            } else {
                                console.error(`Error storing algorithm record for ${speciesId}:`, event.target.error);
                                // Let transaction continue for other records
                            }
                        };
                    } catch (putError) {
                        console.error('Error storing algorithm record:', putError, speciesId);
                    }
                });
            } catch (err) {
                const error = new window.DatabaseError('Store algorithms setup failed', err);
                console.error('Exception in storeAlgorithms:', err);
                if (window.errorHandler) {
                    window.errorHandler.logError(error, 'FishDatabase.storeAlgorithms');
                }
                reject(error);
            }
        });
    }

    async getStoredAlgorithms() {
        if (window.errorHandler) {
            return await window.errorHandler.withErrorBoundary(async () => {
                return await this._getStoredAlgorithmsInternal();
            }, 'FishDatabase.getStoredAlgorithms', {
                showUserError: false // Don't show user error for fallback operation
            });
        } else {
            return await this._getStoredAlgorithmsInternal();
        }
    }

    async _getStoredAlgorithmsInternal() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['algorithms'], 'readonly');
                const store = transaction.objectStore('algorithms');
                const request = store.getAll();

                request.onsuccess = () => {
                    try {
                        const records = request.result;
                        const algorithms = {};

                        records.forEach(record => {
                            if (record.species_id && record.species_name && record.algorithm) {
                                algorithms[record.species_id] = {
                                    species_name: record.species_name,
                                    edible: record.edible,
                                    algorithm: record.algorithm
                                };
                            }
                        });

                        resolve({ success: true, result: algorithms });
                    } catch (parseError) {
                        const error = new window.DatabaseError('Error parsing stored algorithms', parseError);
                        console.error('Error parsing stored algorithms:', parseError);
                        reject(error);
                    }
                };

                request.onerror = () => {
                    const error = new window.DatabaseError('Failed to retrieve stored algorithms', request.error);
                    console.error('IndexedDB getAll error (getStoredAlgorithms):', request.error);
                    reject(error);
                };
            } catch (err) {
                const error = new window.DatabaseError('Get stored algorithms setup failed', err);
                console.error('Exception in getStoredAlgorithms:', err);
                reject(error);
            }
        });
    }    // Get list of all species names for autocomplete
    getSpeciesNames() {
        console.log('getSpeciesNames called, algorithms:', this.algorithms);
        if (!this.algorithms) {
            console.log('No algorithms available, returning empty array');
            return [];
        }

        const speciesNames = Object.values(this.algorithms).map(species => species.species_name);
        console.log('Returning species names:', speciesNames);
        return speciesNames;
    }

    // Find species by name (fuzzy matching)
    findSpeciesByName(name) {
        if (!this.algorithms || !name) return null;

        const normalizedName = name.toLowerCase().trim();

        // First try exact match
        for (const [id, species] of Object.entries(this.algorithms)) {
            if (species.species_name.toLowerCase() === normalizedName) {
                return { id, ...species };
            }
        }

        // Then try partial match
        for (const [id, species] of Object.entries(this.algorithms)) {
            if (species.species_name.toLowerCase().includes(normalizedName) ||
                normalizedName.includes(species.species_name.toLowerCase())) {
                return { id, ...species };
            }
        }

        return null;
    }

    // Calculate weight from length using species-specific algorithm
    calculateWeight(speciesName, length) {
        if (!length || length <= 0) return null;

        const species = this.findSpeciesByName(speciesName);
        if (!species || !species.algorithm) {
            // Fallback to generic calculation
            return this.calculateGenericWeight(length);
        }

        const { a, b } = species.algorithm;
        const weight = a * Math.pow(length, b);

        return {
            weight: parseFloat(weight.toFixed(3)),
            species: species.species_name,
            measureType: species.algorithm.measure_type,
            accuracy: species.algorithm.r_squared,
            isSpeciesSpecific: true
        };
    }

    // Generic weight calculation for unknown species
    calculateGenericWeight(length) {
        // Using a generic freshwater fish coefficient
        const a = 0.000013;
        const b = 3.0;
        const weight = a * Math.pow(length, b);

        return {
            weight: parseFloat(weight.toFixed(3)),
            species: 'Generic estimate',
            measureType: 'Total length',
            accuracy: 0.8,
            isSpeciesSpecific: false
        };
    }

    // Get species information including edibility
    getSpeciesInfo(speciesName) {
        const species = this.findSpeciesByName(speciesName);
        if (!species) return null;

        return {
            name: species.species_name,
            edible: species.edible,
            measureType: species.algorithm.measure_type,
            accuracy: species.algorithm.r_squared
        };
    }

    // Check if database is ready
    async isReady() {
        await this.initPromise;
        return this.db !== null && this.algorithms !== null;
    }

    // Self-Improving Algorithm Integration Methods

    // Update species algorithm with new catch data
    async updateSpeciesWithCatchData(speciesName, length, weight) {
        console.log('=== UPDATE SPECIES WITH CATCH DATA ===');
        console.log('Species:', speciesName, 'Length:', length, 'Weight:', weight);

        try {
            // Input validation
            if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
                console.error('Invalid species name provided:', speciesName);
                return {
                    status: "error",
                    message: "Invalid species name provided"
                };
            }

            if (!length || typeof length !== 'number' || length <= 0) {
                console.error('Invalid length provided:', length);
                return {
                    status: "error",
                    message: "Invalid length provided"
                };
            }

            if (!weight || typeof weight !== 'number' || weight <= 0) {
                console.error('Invalid weight provided:', weight);
                return {
                    status: "error",
                    message: "Invalid weight provided"
                };
            }

            // Wait for initialization
            await this.initPromise;

            // Check if self-improving algorithm is available
            if (!this.selfImprovingAlgorithm) {
                console.error('Self-improving algorithm not initialized');
                return {
                    status: "error",
                    message: "Self-improving algorithm not initialized"
                };
            }

            // Update the algorithm with new data
            const result = this.selfImprovingAlgorithm.updateSpeciesAlgorithm(speciesName, length, weight);

            if (result.status === 'success') {
                console.log('Algorithm updated successfully:', result.algorithm);

                // Optionally store the updated algorithm in IndexedDB as well
                try {
                    await this.storeImprovedAlgorithm(speciesName, result.algorithm);
                } catch (storageError) {
                    console.warn('Failed to store improved algorithm in IndexedDB:', storageError);
                }
            }

            return result;
        } catch (error) {
            console.error('Error updating species with catch data:', error);
            return {
                status: "error",
                message: `Error: ${error.message}`
            };
        }
    }

    // Store improved algorithm in IndexedDB (optional backup)
    async storeImprovedAlgorithm(speciesName, algorithm) {
        try {
            if (!this.db) {
                console.warn('Database not available for storing improved algorithm');
                return false;
            }

            const transaction = this.db.transaction(['algorithms'], 'readwrite');
            const store = transaction.objectStore('algorithms');

            const improvedAlgorithmData = {
                species_id: `improved_${speciesName}`,
                species_name: speciesName,
                algorithm: algorithm,
                source: 'self_improving',
                created_at: new Date().toISOString()
            };

            await new Promise((resolve, reject) => {
                const request = store.put(improvedAlgorithmData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            console.log('Improved algorithm stored in IndexedDB for', speciesName);
            return true;
        } catch (error) {
            console.error('Error storing improved algorithm:', error);
            return false;
        }
    }

    // Get improved weight estimate (wrapper for calculateWeight with expected format)
    async getImprovedWeightEstimate(speciesName, length) {
        console.log('=== GET IMPROVED WEIGHT ESTIMATE ===');
        console.log('Species:', speciesName, 'Length:', length);

        if (!length || length <= 0) {
            console.log('Invalid length, returning null');
            return null;
        }

        try {
            // First try to use the self-improving algorithm if available
            if (this.selfImprovingAlgorithm) {
                console.log('Trying self-improving algorithm...');
                const improvedResult = await this.selfImprovingAlgorithm.calculateWeight(speciesName, length);
                if (improvedResult && improvedResult.estimatedWeight > 0) {
                    console.log('Self-improving algorithm successful:', improvedResult);
                    return {
                        estimatedWeight: improvedResult.estimatedWeight,
                        algorithm_source: 'improved',
                        species: speciesName,
                        confidence: improvedResult.confidence || 'high',
                        accuracy: improvedResult.accuracy || 0.9,
                        isSpeciesSpecific: true
                    };
                }
            }

            // Fallback to regular calculation
            console.log('Trying regular calculation...');
            const result = this.calculateWeight(speciesName, length);
            if (result && result.weight > 0) {
                console.log('Regular calculation successful:', result);
                return {
                    estimatedWeight: result.weight,
                    algorithm_source: 'default',
                    species: result.species,
                    confidence: result.accuracy > 0.9 ? 'high' : result.accuracy > 0.7 ? 'medium' : 'low',
                    accuracy: result.accuracy,
                    isSpeciesSpecific: result.isSpeciesSpecific
                };
            }

            console.log('Regular calculation failed, using generic estimate');
            return null;
        } catch (error) {
            console.error('Error in getImprovedWeightEstimate:', error);
            if (window.errorHandler) {
                window.errorHandler.logError(new window.CalculationError('Improved weight estimation failed', error, speciesName, { length }), 'getImprovedWeightEstimate');
            }
            return null;
        }
    }

    // Check if database is ready
}

// Create global instance
window.fishDB = new FishDatabase();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishDatabase;
}
