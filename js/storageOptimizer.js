/**
 * Advanced Storage Optimization System
 * Implements smart storage selection, efficient serialization, and memory-efficient caching
 */

class StorageOptimizer {
    constructor() {
        this.storageCapabilities = {};
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0
        };
        this.compressionWorker = null;
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB default
        this.maxItemSize = 5 * 1024 * 1024; // 5MB per item
        this.compressionThreshold = 1024; // 1KB
        this.storageHealthChecks = new Map();

        // Initialize storage detection
        this.initializeStorageDetection();

        // Setup cache management
        this.setupCacheManagement();

        // Initialize compression worker if available
        this.initializeCompression();
    }

    /**
     * Initialize storage detection and capability assessment
     */
    async initializeStorageDetection() {
        const storageTypes = ['indexedDB', 'localStorage', 'sessionStorage', 'memory'];

        for (const storageType of storageTypes) {
            try {
                const capability = await this.testStorageCapability(storageType);
                this.storageCapabilities[storageType] = capability;
                console.log(`Storage ${storageType}:`, capability);
            } catch (error) {
                console.warn(`Failed to test ${storageType}:`, error);
                this.storageCapabilities[storageType] = {
                    available: false,
                    quota: 0,
                    used: 0,
                    performance: 0
                };
            }
        }
    }

    /**
     * Test storage capability including quota, performance, and reliability
     */
    async testStorageCapability(storageType) {
        const testData = 'test_data_' + Date.now();
        const testKey = 'storage_test_' + Date.now();
        let capability = {
            available: false,
            quota: 0,
            used: 0,
            performance: 0,
            reliability: 0,
            features: []
        };

        try {
            switch (storageType) {
                case 'indexedDB':
                    capability = await this.testIndexedDBCapability(testKey, testData);
                    break;
                case 'localStorage':
                    capability = await this.testLocalStorageCapability(testKey, testData);
                    break;
                case 'sessionStorage':
                    capability = await this.testSessionStorageCapability(testKey, testData);
                    break;
                case 'memory':
                    capability = this.testMemoryStorageCapability();
                    break;
            }
        } catch (error) {
            console.error(`Error testing ${storageType}:`, error);
        }

        return capability;
    }

    /**
     * Test IndexedDB capability
     */
    async testIndexedDBCapability(testKey, testData) {
        if (!window.indexedDB) {
            return { available: false, quota: 0, used: 0, performance: 0 };
        }

        const startTime = performance.now();

        try {
            // Test basic operations
            const dbName = 'storage_test_db';
            const db = await this.openTestDB(dbName);

            // Test write performance
            const writeStart = performance.now();
            await this.testDBWrite(db, testKey, testData);
            const writeTime = performance.now() - writeStart;

            // Test read performance
            const readStart = performance.now();
            const readData = await this.testDBRead(db, testKey);
            const readTime = performance.now() - readStart;

            // Test delete
            await this.testDBDelete(db, testKey);

            db.close();

            // Get storage quota
            const quota = await this.getStorageQuota();

            return {
                available: true,
                quota: quota.quota,
                used: quota.usage,
                performance: (writeTime + readTime) / 2,
                reliability: readData === testData ? 100 : 0,
                features: ['transactions', 'cursors', 'indexes', 'versioning']
            };
        } catch (error) {
            return { available: false, quota: 0, used: 0, performance: 0, error: error.message };
        }
    }

    /**
     * Test localStorage capability
     */
    async testLocalStorageCapability(testKey, testData) {
        if (!window.localStorage) {
            return { available: false, quota: 0, used: 0, performance: 0 };
        }

        try {
            const startTime = performance.now();

            // Test write
            localStorage.setItem(testKey, testData);

            // Test read
            const readData = localStorage.getItem(testKey);

            // Test delete
            localStorage.removeItem(testKey);

            const endTime = performance.now();

            // Estimate quota
            const quota = await this.estimateLocalStorageQuota();

            return {
                available: true,
                quota: quota.quota,
                used: quota.used,
                performance: endTime - startTime,
                reliability: readData === testData ? 100 : 0,
                features: ['synchronous', 'persistent']
            };
        } catch (error) {
            return { available: false, quota: 0, used: 0, performance: 0, error: error.message };
        }
    }

    /**
     * Test sessionStorage capability
     */
    async testSessionStorageCapability(testKey, testData) {
        if (!window.sessionStorage) {
            return { available: false, quota: 0, used: 0, performance: 0 };
        }

        try {
            const startTime = performance.now();

            sessionStorage.setItem(testKey, testData);
            const readData = sessionStorage.getItem(testKey);
            sessionStorage.removeItem(testKey);

            const endTime = performance.now();

            const quota = await this.estimateSessionStorageQuota();

            return {
                available: true,
                quota: quota.quota,
                used: quota.used,
                performance: endTime - startTime,
                reliability: readData === testData ? 100 : 0,
                features: ['synchronous', 'session_only']
            };
        } catch (error) {
            return { available: false, quota: 0, used: 0, performance: 0, error: error.message };
        }
    }

    /**
     * Test memory storage capability
     */
    testMemoryStorageCapability() {
        return {
            available: true,
            quota: Infinity,
            used: 0,
            performance: 0.1, // Very fast
            reliability: 100,
            features: ['fast', 'temporary', 'unlimited']
        };
    }

    /**
     * Smart storage selection based on data characteristics and storage capabilities
     */
    selectOptimalStorage(data, options = {}) {
        const {
            priority = 'balanced', // 'speed', 'persistence', 'capacity', 'balanced'
            persistenceRequired = true,
            sizeHint = 0,
            accessPattern = 'random', // 'sequential', 'random', 'write_once'
            durability = 'medium' // 'low', 'medium', 'high'
        } = options;

        const dataSize = this.estimateDataSize(data);
        const availableStorages = Object.entries(this.storageCapabilities)
            .filter(([_, capability]) => capability.available)
            .map(([type, capability]) => ({
                type,
                ...capability,
                score: this.calculateStorageScore(capability, {
                    dataSize,
                    priority,
                    persistenceRequired,
                    accessPattern,
                    durability
                })
            }))
            .sort((a, b) => b.score - a.score);

        return availableStorages.length > 0 ? availableStorages[0] : null;
    }

    /**
     * Calculate storage score based on requirements
     */
    calculateStorageScore(capability, requirements) {
        let score = 0;

        // Base availability score
        if (!capability.available) return 0;

        // Capacity score
        if (capability.quota === Infinity) {
            score += 30;
        } else if (capability.quota > requirements.dataSize * 10) {
            score += 25;
        } else if (capability.quota > requirements.dataSize * 2) {
            score += 15;
        } else if (capability.quota > requirements.dataSize) {
            score += 5;
        }

        // Performance score
        const performanceScore = Math.max(0, 25 - (capability.performance / 10));
        score += performanceScore;

        // Persistence score
        if (requirements.persistenceRequired) {
            if (capability.features.includes('persistent')) {
                score += 20;
            } else if (capability.features.includes('session_only')) {
                score += 10;
            }
        }

        // Reliability score
        score += (capability.reliability / 100) * 15;

        // Priority-based adjustments
        switch (requirements.priority) {
            case 'speed':
                score += capability.features.includes('fast') ? 20 : 0;
                score -= capability.performance > 100 ? 10 : 0;
                break;
            case 'capacity':
                score += capability.quota === Infinity ? 20 : 0;
                score += capability.features.includes('unlimited') ? 10 : 0;
                break;
            case 'persistence':
                score += capability.features.includes('persistent') ? 25 : 0;
                score -= capability.features.includes('temporary') ? 15 : 0;
                break;
        }

        return score;
    }

    /**
     * Efficient serialization with compression
     */
    async serialize(data, options = {}) {
        const {
            compress = true,
            format = 'json',
            compressionLevel = 6
        } = options;

        try {
            let serialized;

            // Choose serialization format
            switch (format) {
                case 'json':
                    serialized = JSON.stringify(data);
                    break;
                case 'binary':
                    serialized = this.serializeToBinary(data);
                    break;
                case 'msgpack':
                    serialized = this.serializeToMsgPack(data);
                    break;
                default:
                    serialized = JSON.stringify(data);
            }

            // Apply compression if beneficial
            if (compress && serialized.length > this.compressionThreshold) {
                const compressed = await this.compressData(serialized, compressionLevel);

                // Only use compression if it saves significant space
                if (compressed.length < serialized.length * 0.8) {
                    return {
                        data: compressed,
                        compressed: true,
                        originalSize: serialized.length,
                        compressedSize: compressed.length,
                        format: format
                    };
                }
            }

            return {
                data: serialized,
                compressed: false,
                originalSize: serialized.length,
                compressedSize: serialized.length,
                format: format
            };
        } catch (error) {
            console.error('Serialization error:', error);
            throw error;
        }
    }

    /**
     * Efficient deserialization with decompression
     */
    async deserialize(serializedData, options = {}) {
        try {
            let data = serializedData.data;

            // Decompress if needed
            if (serializedData.compressed) {
                data = await this.decompressData(data);
            }

            // Deserialize based on format
            switch (serializedData.format) {
                case 'json':
                    return JSON.parse(data);
                case 'binary':
                    return this.deserializeFromBinary(data);
                case 'msgpack':
                    return this.deserializeFromMsgPack(data);
                default:
                    return JSON.parse(data);
            }
        } catch (error) {
            console.error('Deserialization error:', error);
            throw error;
        }
    }

    /**
     * Memory-efficient caching with LRU eviction
     */
    async cacheSet(key, value, options = {}) {
        const {
            ttl = 3600000, // 1 hour default
            priority = 'normal',
            tags = [],
            maxSize = this.maxItemSize
        } = options;

        try {
            const serialized = await this.serialize(value, options);

            if (serialized.compressedSize > maxSize) {
                throw new Error(`Item too large for cache: ${serialized.compressedSize} > ${maxSize}`);
            }

            // Check if we need to evict items
            await this.ensureCacheSpace(serialized.compressedSize);

            const cacheItem = {
                key,
                value: serialized,
                timestamp: Date.now(),
                ttl,
                priority,
                tags,
                accessCount: 0,
                lastAccessed: Date.now(),
                size: serialized.compressedSize
            };

            this.cache.set(key, cacheItem);
            this.cacheStats.size += serialized.compressedSize;

            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Get item from cache
     */
    async cacheGet(key, options = {}) {
        const {
            updateAccessStats = true
        } = options;

        const item = this.cache.get(key);

        if (!item) {
            this.cacheStats.misses++;
            return null;
        }

        // Check TTL
        if (item.ttl > 0 && (Date.now() - item.timestamp) > item.ttl) {
            this.cacheDelete(key);
            this.cacheStats.misses++;
            return null;
        }

        // Update access statistics
        if (updateAccessStats) {
            item.accessCount++;
            item.lastAccessed = Date.now();
        }

        this.cacheStats.hits++;

        try {
            return await this.deserialize(item.value);
        } catch (error) {
            console.error('Cache get deserialization error:', error);
            this.cacheDelete(key);
            return null;
        }
    }

    /**
     * Delete item from cache
     */
    cacheDelete(key) {
        const item = this.cache.get(key);
        if (item) {
            this.cache.delete(key);
            this.cacheStats.size -= item.size;
            return true;
        }
        return false;
    }

    /**
     * Ensure cache has space for new item
     */
    async ensureCacheSpace(requiredSize) {
        if (this.cacheStats.size + requiredSize <= this.maxCacheSize) {
            return;
        }

        // Calculate how much space we need to free
        const spaceToFree = (this.cacheStats.size + requiredSize) - this.maxCacheSize;
        let freedSpace = 0;

        // Get items sorted by eviction priority (LRU + priority)
        const items = Array.from(this.cache.entries())
            .map(([key, item]) => ({
                key,
                ...item,
                evictionScore: this.calculateEvictionScore(item)
            }))
            .sort((a, b) => a.evictionScore - b.evictionScore);

        // Evict items until we have enough space
        for (const item of items) {
            if (freedSpace >= spaceToFree) break;

            this.cache.delete(item.key);
            freedSpace += item.size;
            this.cacheStats.size -= item.size;
            this.cacheStats.evictions++;
        }
    }

    /**
     * Calculate eviction score (lower = more likely to be evicted)
     */
    calculateEvictionScore(item) {
        const now = Date.now();
        const age = now - item.timestamp;
        const timeSinceAccess = now - item.lastAccessed;

        let score = 0;

        // Age factor (older items more likely to be evicted)
        score += age / 1000;

        // Access recency factor
        score += timeSinceAccess / 1000;

        // Access frequency factor (less accessed items more likely to be evicted)
        score += Math.max(0, 1000 - item.accessCount);

        // Priority factor
        const priorityMultiplier = {
            'low': 0.5,
            'normal': 1.0,
            'high': 2.0,
            'critical': 5.0
        };
        score *= priorityMultiplier[item.priority] || 1.0;

        // Size factor (larger items slightly more likely to be evicted)
        score += item.size / 1024;

        return score;
    }

    /**
     * Progressive loading for large datasets
     */
    async loadDataProgressively(loader, options = {}) {
        const {
            chunkSize = 100,
            maxConcurrency = 3,
            onProgress = null,
            onChunk = null
        } = options;

        const results = [];
        const chunks = [];
        let totalItems = 0;

        try {
            // Get total count if possible
            if (typeof loader.getCount === 'function') {
                totalItems = await loader.getCount();
            }

            // Create chunks
            for (let i = 0; i < totalItems || i === 0; i += chunkSize) {
                chunks.push({ offset: i, limit: chunkSize });
                if (totalItems === 0) break; // Single chunk for unknown size
            }

            // Process chunks with limited concurrency
            let completedChunks = 0;
            const semaphore = new Semaphore(maxConcurrency);

            const chunkPromises = chunks.map(async (chunk) => {
                await semaphore.acquire();

                try {
                    const chunkData = await loader.load(chunk.offset, chunk.limit);

                    if (onChunk) {
                        await onChunk(chunkData, chunk);
                    }

                    completedChunks++;

                    if (onProgress) {
                        onProgress({
                            completed: completedChunks,
                            total: chunks.length,
                            percentage: (completedChunks / chunks.length) * 100
                        });
                    }

                    return chunkData;
                } finally {
                    semaphore.release();
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            return chunkResults.flat();
        } catch (error) {
            console.error('Progressive loading error:', error);
            throw error;
        }
    }

    /**
     * Storage health monitoring
     */
    async monitorStorageHealth() {
        for (const [storageType, capability] of Object.entries(this.storageCapabilities)) {
            if (!capability.available) continue;

            try {
                const healthCheck = await this.performHealthCheck(storageType);
                this.storageHealthChecks.set(storageType, {
                    ...healthCheck,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.warn(`Health check failed for ${storageType}:`, error);
                this.storageHealthChecks.set(storageType, {
                    healthy: false,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Get storage statistics
     */
    getStorageStats() {
        return {
            capabilities: this.storageCapabilities,
            cache: this.cacheStats,
            health: Object.fromEntries(this.storageHealthChecks)
        };
    }

    /**
     * Cleanup and optimization
     */
    async cleanup() {
        // Clear expired cache items
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.ttl > 0 && (now - item.timestamp) > item.ttl) {
                this.cacheDelete(key);
            }
        }

        // Run storage health checks
        await this.monitorStorageHealth();

        // Optimize cache if needed
        if (this.cacheStats.size > this.maxCacheSize * 0.9) {
            await this.ensureCacheSpace(this.maxCacheSize * 0.1);
        }
    }

    // Helper methods for testing and compression
    async openTestDB(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('test')) {
                    db.createObjectStore('test', { keyPath: 'id' });
                }
            };
        });
    }

    async testDBWrite(db, key, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['test'], 'readwrite');
            const store = transaction.objectStore('test');
            const request = store.put({ id: key, data: data });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async testDBRead(db, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['test'], 'readonly');
            const store = transaction.objectStore('test');
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.data);
        });
    }

    async testDBDelete(db, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['test'], 'readwrite');
            const store = transaction.objectStore('test');
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            return await navigator.storage.estimate();
        }
        return { quota: 0, usage: 0 };
    }

    async estimateLocalStorageQuota() {
        try {
            let quota = 0;
            let used = 0;

            // Estimate used space
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            // Estimate available quota (typical is 5-10MB)
            quota = 10 * 1024 * 1024; // 10MB estimate

            return { quota, used };
        } catch (error) {
            return { quota: 0, used: 0 };
        }
    }

    async estimateSessionStorageQuota() {
        try {
            let quota = 0;
            let used = 0;

            for (let key in sessionStorage) {
                if (sessionStorage.hasOwnProperty(key)) {
                    used += sessionStorage[key].length + key.length;
                }
            }

            quota = 5 * 1024 * 1024; // 5MB estimate

            return { quota, used };
        } catch (error) {
            return { quota: 0, used: 0 };
        }
    }

    estimateDataSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch (error) {
            return JSON.stringify(data).length * 2; // Rough estimate
        }
    }

    async compressData(data, level = 6) {
        // Placeholder for compression - would use a library like pako or fflate
        return data; // Return uncompressed for now
    }

    async decompressData(data) {
        // Placeholder for decompression
        return data;
    }

    serializeToBinary(data) {
        // Placeholder for binary serialization
        return JSON.stringify(data);
    }

    deserializeFromBinary(data) {
        // Placeholder for binary deserialization
        return JSON.parse(data);
    }

    serializeToMsgPack(data) {
        // Placeholder for MessagePack serialization
        return JSON.stringify(data);
    }

    deserializeFromMsgPack(data) {
        // Placeholder for MessagePack deserialization
        return JSON.parse(data);
    }

    async performHealthCheck(storageType) {
        const testKey = `health_check_${Date.now()}`;
        const testData = 'health_check_data';

        try {
            switch (storageType) {
                case 'indexedDB':
                    const db = await this.openTestDB('health_check_db');
                    await this.testDBWrite(db, testKey, testData);
                    const result = await this.testDBRead(db, testKey);
                    await this.testDBDelete(db, testKey);
                    db.close();
                    return { healthy: result === testData };

                case 'localStorage':
                    localStorage.setItem(testKey, testData);
                    const localResult = localStorage.getItem(testKey);
                    localStorage.removeItem(testKey);
                    return { healthy: localResult === testData };

                case 'sessionStorage':
                    sessionStorage.setItem(testKey, testData);
                    const sessionResult = sessionStorage.getItem(testKey);
                    sessionStorage.removeItem(testKey);
                    return { healthy: sessionResult === testData };

                default:
                    return { healthy: true };
            }
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    // Initialize compression worker
    initializeCompression() {
        // Placeholder for web worker initialization
        // Would create a worker for compression/decompression operations
    }

    // Setup cache management
    setupCacheManagement() {
        // Periodic cleanup
        setInterval(() => {
            this.cleanup();
        }, 300000); // Every 5 minutes
    }
}

/**
 * Simple semaphore implementation for concurrency control
 */
class Semaphore {
    constructor(permits) {
        this.permits = permits;
        this.queue = [];
    }

    async acquire() {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise((resolve) => {
            this.queue.push(resolve);
        });
    }

    release() {
        this.permits++;
        if (this.queue.length > 0) {
            this.permits--;
            const resolve = this.queue.shift();
            resolve();
        }
    }
}

// Create and export global storage optimizer instance
const storageOptimizer = new StorageOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageOptimizer, storageOptimizer };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.storageOptimizer = storageOptimizer;
}
