// Fish Species Database Manager
// Handles IndexedDB operations and length-to-weight calculations

class FishDatabase {
    constructor() {
        this.db = null;
        this.dbName = 'FishSpeciesDB';
        this.version = 1;
        this.algorithms = null;
        this.initPromise = this.init();
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            await this.loadAlgorithms();
            return true;
        } catch (error) {
            console.error('Failed to initialize fish database:', error);
            return false;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => {
                    console.error('IndexedDB open error:', request.error);
                    reject(request.error);
                };
                request.onsuccess = () => resolve(request.result);

                request.onupgradeneeded = (event) => {
                    try {
                        const db = event.target.result;

                        // Create object store for species algorithms
                        if (!db.objectStoreNames.contains('algorithms')) {
                            const algoStore = db.createObjectStore('algorithms', { keyPath: 'species_id' });
                            algoStore.createIndex('species_name', 'species_name', { unique: false });
                        }

                        // Create object store for length-weight data (for future use)
                        if (!db.objectStoreNames.contains('lengthWeightData')) {
                            const dataStore = db.createObjectStore('lengthWeightData', { keyPath: 'id', autoIncrement: true });
                            dataStore.createIndex('species_id', 'Species_ID', { unique: false });
                            dataStore.createIndex('species', 'Species', { unique: false });
                        }
                    } catch (upgradeError) {
                        console.error('Error during IndexedDB upgrade:', upgradeError);
                        reject(upgradeError);
                    }
                };
            } catch (outerError) {
                console.error('Exception in openDatabase:', outerError);
                reject(outerError);
            }
        });
    }    async loadAlgorithms() {
        try {
            console.log('Loading fish algorithms from: ./fish_algorithms.json');
            // Load algorithms from the JSON file
            const response = await fetch('./fish_algorithms.json');
            
            if (!response.ok) {
                console.error('Failed to fetch fish algorithms:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fish algorithms loaded successfully:', data);
            console.log('Number of species in database:', Object.keys(data).length);
            this.algorithms = data;

            // Store in IndexedDB for offline access
            await this.storeAlgorithms(data);
            
            return data;
        } catch (error) {
            console.error('Failed to load algorithms from network:', error);
            console.log('Attempting to load from IndexedDB...');
            // Try to load from IndexedDB as fallback
            const storedData = await this.getStoredAlgorithms();
            if (storedData && Object.keys(storedData).length > 0) {
                console.log('Loaded algorithms from IndexedDB:', storedData);
                this.algorithms = storedData;
                return storedData;
            } else {
                console.error('No algorithms available from IndexedDB either');
                return null;
            }
        }
    }

    async storeAlgorithms(algorithms) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['algorithms'], 'readwrite');
                const store = transaction.objectStore('algorithms');

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => {
                    console.error('IndexedDB transaction error (storeAlgorithms):', transaction.error);
                    reject(transaction.error);
                };

                // Store each algorithm
                Object.entries(algorithms).forEach(([speciesId, data]) => {
                    try {
                        const record = {
                            species_id: speciesId,
                            species_name: data.species_name,
                            edible: data.edible,
                            algorithm: data.algorithm
                        };
                        store.put(record);
                    } catch (putError) {
                        console.error('Error storing algorithm record:', putError, record);
                    }
                });
            } catch (err) {
                console.error('Exception in storeAlgorithms:', err);
                reject(err);
            }
        });
    }

    async getStoredAlgorithms() {
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
                            algorithms[record.species_id] = {
                                species_name: record.species_name,
                                edible: record.edible,
                                algorithm: record.algorithm
                            };
                        });
                        resolve(algorithms);
                    } catch (parseError) {
                        console.error('Error parsing stored algorithms:', parseError);
                        reject(parseError);
                    }
                };

                request.onerror = () => {
                    console.error('IndexedDB getAll error (getStoredAlgorithms):', request.error);
                    reject(request.error);
                };
            } catch (err) {
                console.error('Exception in getStoredAlgorithms:', err);
                reject(err);
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
}

// Create global instance
window.fishDB = new FishDatabase();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FishDatabase;
}
