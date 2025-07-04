/**
 * Advanced IndexedDB Wrapper
 * Implements schema versioning, multi-tab synchronization, cursors, and transaction optimization
 */

class AdvancedIndexedDB {
    constructor(dbName, options = {}) {
        this.dbName = dbName;
        this.currentVersion = options.version || 1;
        this.db = null;
        this.schemas = new Map();
        this.migrations = new Map();
        this.eventBus = new EventTarget();
        this.transactionPool = new Map();
        this.syncChannel = null;
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.operationQueue = [];
        this.maxTransactionDuration = options.maxTransactionDuration || 30000;
        this.maxConcurrentTransactions = options.maxConcurrentTransactions || 5;
        this.activeTransactions = 0;

        // Multi-tab synchronization
        this.setupMultiTabSync();

        // Online/offline detection
        this.setupOfflineDetection();

        // Performance monitoring
        this.performanceStats = {
            transactions: 0,
            operations: 0,
            averageTransactionTime: 0,
            errors: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        // Operation cache for read optimization
        this.operationCache = new Map();
        this.cacheExpiry = options.cacheExpiry || 300000; // 5 minutes

        // Connection pool for transaction management
        this.connectionPool = [];
        this.maxPoolSize = options.maxPoolSize || 10;

        // Initialize error handler integration
        this.initializeErrorHandler();
    }

    /**
     * Initialize error handler integration
     */
    initializeErrorHandler() {
        try {
            if (typeof window !== 'undefined' && window.errorHandler) {
                this.errorHandler = window.errorHandler;
            } else {
                this.errorHandler = {
                    handleError: async (error, options) => {
                        console.error('IndexedDB Error:', error, options);
                        return { success: false, error: error.message };
                    },
                    withErrorHandling: async (operation, options) => {
                        try {
                            return await operation();
                        } catch (error) {
                            console.error('IndexedDB Operation Error:', error);
                            throw error;
                        }
                    }
                };
            }
        } catch (error) {
            console.warn('Error handler not available:', error);
        }
    }

    /**
     * Define database schema with versioning
     */
    defineSchema(version, schemaCallback) {
        this.schemas.set(version, schemaCallback);
        if (version > this.currentVersion) {
            this.currentVersion = version;
        }
    }

    /**
     * Define database migration
     */
    defineMigration(fromVersion, toVersion, migrationCallback) {
        const key = `${fromVersion}-${toVersion}`;
        this.migrations.set(key, migrationCallback);
    }

    /**
     * Open database with schema versioning and migration support
     */
    async open() {
        return await this.errorHandler.withErrorHandling(async () => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.currentVersion);

                request.onerror = () => {
                    this.errorHandler.handleError(request.error, {
                        category: 'storage',
                        context: 'advanced_indexeddb_open',
                        metadata: { dbName: this.dbName, version: this.currentVersion }
                    });
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.setupDatabaseEventHandlers();
                    this.notifyTabsOfSchemaChange();
                    resolve(this.db);
                };

                request.onupgradeneeded = async (event) => {
                    try {
                        const db = event.target.result;
                        const transaction = event.target.transaction;
                        const oldVersion = event.oldVersion;
                        const newVersion = event.newVersion;

                        console.log(`Database upgrade: ${oldVersion} → ${newVersion}`);

                        // Apply schema changes
                        await this.applySchemaChanges(db, transaction, oldVersion, newVersion);

                        // Run migrations
                        await this.runMigrations(db, transaction, oldVersion, newVersion);

                    } catch (error) {
                        console.error('Database upgrade error:', error);
                        await this.errorHandler.handleError(error, {
                            category: 'storage',
                            context: 'database_upgrade',
                            severity: 'critical'
                        });
                        reject(error);
                    }
                };

                request.onblocked = () => {
                    console.warn('Database upgrade blocked by other tabs');
                    this.notifyTabsOfUpgradeBlocked();
                };
            });
        }, {
            category: 'storage',
            context: 'advanced_indexeddb_open'
        });
    }

    /**
     * Setup database event handlers
     */
    setupDatabaseEventHandlers() {
        this.db.addEventListener('close', () => {
            console.log('Database connection closed');
            this.eventBus.dispatchEvent(new CustomEvent('database-closed'));
        });

        this.db.addEventListener('versionchange', () => {
            console.log('Database version change detected');
            this.db.close();
            this.eventBus.dispatchEvent(new CustomEvent('version-change'));
        });
    }

    /**
     * Apply schema changes during upgrade
     */
    async applySchemaChanges(db, transaction, oldVersion, newVersion) {
        for (let version = oldVersion + 1; version <= newVersion; version++) {
            const schemaCallback = this.schemas.get(version);
            if (schemaCallback) {
                console.log(`Applying schema for version ${version}`);
                await schemaCallback(db, transaction, version);
            }
        }
    }

    /**
     * Run database migrations
     */
    async runMigrations(db, transaction, oldVersion, newVersion) {
        for (let version = oldVersion; version < newVersion; version++) {
            const migrationKey = `${version}-${version + 1}`;
            const migrationCallback = this.migrations.get(migrationKey);

            if (migrationCallback) {
                console.log(`Running migration: ${migrationKey}`);
                await migrationCallback(db, transaction, version, version + 1);
            }
        }
    }

    /**
     * Setup multi-tab synchronization
     */
    setupMultiTabSync() {
        if (typeof BroadcastChannel !== 'undefined') {
            this.syncChannel = new BroadcastChannel(`${this.dbName}-sync`);

            this.syncChannel.addEventListener('message', async (event) => {
                try {
                    await this.handleSyncMessage(event.data);
                } catch (error) {
                    console.error('Sync message handling error:', error);
                }
            });
        }
    }

    /**
     * Handle synchronization messages from other tabs
     */
    async handleSyncMessage(message) {
        switch (message.type) {
            case 'data-changed':
                this.invalidateCache(message.storeName, message.key);
                this.eventBus.dispatchEvent(new CustomEvent('data-changed', { detail: message }));
                break;
            case 'schema-changed':
                this.eventBus.dispatchEvent(new CustomEvent('schema-changed', { detail: message }));
                break;
            case 'upgrade-blocked':
                this.eventBus.dispatchEvent(new CustomEvent('upgrade-blocked', { detail: message }));
                break;
            case 'transaction-conflict':
                await this.handleTransactionConflict(message);
                break;
        }
    }

    /**
     * Notify other tabs of data changes
     */
    notifyTabsOfChange(storeName, key, operation) {
        if (this.syncChannel) {
            this.syncChannel.postMessage({
                type: 'data-changed',
                storeName,
                key,
                operation,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Notify other tabs of schema changes
     */
    notifyTabsOfSchemaChange() {
        if (this.syncChannel) {
            this.syncChannel.postMessage({
                type: 'schema-changed',
                version: this.currentVersion,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Notify other tabs of upgrade blocked
     */
    notifyTabsOfUpgradeBlocked() {
        if (this.syncChannel) {
            this.syncChannel.postMessage({
                type: 'upgrade-blocked',
                timestamp: Date.now()
            });
        }
    }

    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingOperations();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Process pending operations when coming back online
     */
    async processPendingOperations() {
        if (this.pendingOperations.length === 0) return;

        console.log(`Processing ${this.pendingOperations.length} pending operations`);

        const operations = [...this.pendingOperations];
        this.pendingOperations = [];

        for (const operation of operations) {
            try {
                await this.executeOperation(operation);
            } catch (error) {
                console.error('Failed to process pending operation:', error);
                await this.errorHandler.handleError(error, {
                    category: 'storage',
                    context: 'pending_operation_processing'
                });
            }
        }
    }

    /**
     * Optimized transaction management with connection pooling
     */
    async withTransaction(storeNames, mode, callback, options = {}) {
        return await this.errorHandler.withErrorHandling(async () => {
            const {
                timeout = this.maxTransactionDuration,
                retry = true,
                priority = 'normal'
            } = options;

            // Wait for available transaction slot
            await this.waitForTransactionSlot();

            const startTime = performance.now();
            let transaction;

            try {
                this.activeTransactions++;
                transaction = this.db.transaction(storeNames, mode);

                // Set up transaction timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Transaction timeout')), timeout);
                });

                // Setup transaction event handlers
                this.setupTransactionHandlers(transaction);

                // Execute callback with transaction
                const resultPromise = callback(transaction);

                // Race between result and timeout
                const result = await Promise.race([resultPromise, timeoutPromise]);

                // Wait for transaction to complete
                await this.waitForTransactionComplete(transaction);

                // Update performance stats
                const duration = performance.now() - startTime;
                this.updateTransactionStats(duration, true);

                return result;
            } catch (error) {
                this.updateTransactionStats(performance.now() - startTime, false);

                if (retry && this.shouldRetryTransaction(error)) {
                    console.log('Retrying transaction after error:', error);
                    return this.withTransaction(storeNames, mode, callback, { ...options, retry: false });
                }

                throw error;
            } finally {
                this.activeTransactions--;
            }
        }, {
            category: 'storage',
            context: 'transaction_execution',
            metadata: { storeNames, mode }
        });
    }

    /**
     * Wait for available transaction slot
     */
    async waitForTransactionSlot() {
        while (this.activeTransactions >= this.maxConcurrentTransactions) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    /**
     * Setup transaction event handlers
     */
    setupTransactionHandlers(transaction) {
        transaction.addEventListener('complete', () => {
            this.eventBus.dispatchEvent(new CustomEvent('transaction-complete', {
                detail: { transaction }
            }));
        });

        transaction.addEventListener('error', (event) => {
            this.eventBus.dispatchEvent(new CustomEvent('transaction-error', {
                detail: { transaction, error: event.target.error }
            }));
        });

        transaction.addEventListener('abort', () => {
            this.eventBus.dispatchEvent(new CustomEvent('transaction-abort', {
                detail: { transaction }
            }));
        });
    }

    /**
     * Wait for transaction to complete
     */
    async waitForTransactionComplete(transaction) {
        return new Promise((resolve, reject) => {
            transaction.addEventListener('complete', () => resolve());
            transaction.addEventListener('error', () => reject(transaction.error));
            transaction.addEventListener('abort', () => reject(new Error('Transaction aborted')));
        });
    }

    /**
     * Determine if transaction should be retried
     */
    shouldRetryTransaction(error) {
        const retryableErrors = [
            'QuotaExceededError',
            'UnknownError',
            'TransactionInactiveError'
        ];

        return retryableErrors.includes(error.name);
    }

    /**
     * Advanced cursor operations with streaming support
     */
    async streamCursor(storeName, options = {}) {
        const {
            index = null,
            query = null,
            direction = 'next',
            batchSize = 100,
            onBatch = null,
            onProgress = null
        } = options;

        return await this.withTransaction([storeName], 'readonly', async (transaction) => {
            const store = transaction.objectStore(storeName);
            const source = index ? store.index(index) : store;

            let processedCount = 0;
            let batch = [];
            const results = [];

            return new Promise((resolve, reject) => {
                const request = source.openCursor(query, direction);

                request.onsuccess = async (event) => {
                    const cursor = event.target.result;

                    if (cursor) {
                        batch.push({
                            key: cursor.primaryKey,
                            value: cursor.value
                        });

                        processedCount++;

                        // Process batch when it reaches the specified size
                        if (batch.length >= batchSize) {
                            try {
                                if (onBatch) {
                                    await onBatch([...batch]);
                                }

                                results.push(...batch);
                                batch = [];

                                if (onProgress) {
                                    onProgress({ processed: processedCount });
                                }
                            } catch (error) {
                                reject(error);
                                return;
                            }
                        }

                        cursor.continue();
                    } else {
                        // Process remaining batch
                        if (batch.length > 0) {
                            try {
                                if (onBatch) {
                                    await onBatch([...batch]);
                                }
                                results.push(...batch);
                            } catch (error) {
                                reject(error);
                                return;
                            }
                        }

                        resolve(results);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        });
    }

    /**
     * Bulk operations with optimized batch processing
     */
    async bulkOperation(storeName, operations, options = {}) {
        const {
            batchSize = 1000,
            onProgress = null,
            onBatch = null
        } = options;

        return await this.errorHandler.withErrorHandling(async () => {
            const results = [];
            const batches = [];

            // Split operations into batches
            for (let i = 0; i < operations.length; i += batchSize) {
                batches.push(operations.slice(i, i + batchSize));
            }

            let completedBatches = 0;

            for (const batch of batches) {
                const batchResults = await this.processBatch(storeName, batch);
                results.push(...batchResults);

                completedBatches++;

                if (onBatch) {
                    await onBatch(batchResults, completedBatches, batches.length);
                }

                if (onProgress) {
                    onProgress({
                        completed: completedBatches,
                        total: batches.length,
                        percentage: (completedBatches / batches.length) * 100
                    });
                }
            }

            return results;
        }, {
            category: 'storage',
            context: 'bulk_operation',
            metadata: { storeName, operationCount: operations.length }
        });
    }

    /**
     * Process a batch of operations
     */
    async processBatch(storeName, batch) {
        return await this.withTransaction([storeName], 'readwrite', async (transaction) => {
            const store = transaction.objectStore(storeName);
            const results = [];

            for (const operation of batch) {
                try {
                    let result;

                    switch (operation.type) {
                        case 'put':
                            result = await this.executeStoreOperation(store, 'put', operation.data, operation.key);
                            break;
                        case 'add':
                            result = await this.executeStoreOperation(store, 'add', operation.data, operation.key);
                            break;
                        case 'delete':
                            result = await this.executeStoreOperation(store, 'delete', operation.key);
                            break;
                        case 'get':
                            result = await this.executeStoreOperation(store, 'get', operation.key);
                            break;
                        default:
                            throw new Error(`Unknown operation type: ${operation.type}`);
                    }

                    results.push({
                        success: true,
                        result: result,
                        operation: operation
                    });
                } catch (error) {
                    results.push({
                        success: false,
                        error: error.message,
                        operation: operation
                    });
                }
            }

            return results;
        });
    }

    /**
     * Execute store operation with promise wrapper
     */
    async executeStoreOperation(store, operation, ...args) {
        return new Promise((resolve, reject) => {
            const request = store[operation](...args);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Smart caching with TTL support
     */
    async cachedGet(storeName, key, options = {}) {
        const {
            ttl = this.cacheExpiry,
            forceRefresh = false
        } = options;

        const cacheKey = `${storeName}:${key}`;
        const cached = this.operationCache.get(cacheKey);

        if (!forceRefresh && cached && (Date.now() - cached.timestamp) < ttl) {
            this.performanceStats.cacheHits++;
            return cached.value;
        }

        this.performanceStats.cacheMisses++;

        const value = await this.withTransaction([storeName], 'readonly', async (transaction) => {
            const store = transaction.objectStore(storeName);
            return await this.executeStoreOperation(store, 'get', key);
        });

        // Cache the result
        this.operationCache.set(cacheKey, {
            value,
            timestamp: Date.now()
        });

        return value;
    }

    /**
     * Invalidate cache entries
     */
    invalidateCache(storeName, key = null) {
        if (key) {
            const cacheKey = `${storeName}:${key}`;
            this.operationCache.delete(cacheKey);
        } else {
            // Invalidate all entries for the store
            for (const [cacheKey] of this.operationCache.entries()) {
                if (cacheKey.startsWith(`${storeName}:`)) {
                    this.operationCache.delete(cacheKey);
                }
            }
        }
    }

    /**
     * Transaction conflict resolution
     */
    async handleTransactionConflict(message) {
        // Implement conflict resolution strategy
        console.log('Handling transaction conflict:', message);

        // For now, just invalidate relevant cache entries
        this.invalidateCache(message.storeName, message.key);
    }

    /**
     * Update performance statistics
     */
    updateTransactionStats(duration, success) {
        this.performanceStats.transactions++;

        if (success) {
            const currentAvg = this.performanceStats.averageTransactionTime;
            const count = this.performanceStats.transactions;
            this.performanceStats.averageTransactionTime =
                (currentAvg * (count - 1) + duration) / count;
        } else {
            this.performanceStats.errors++;
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            activeTransactions: this.activeTransactions,
            cacheSize: this.operationCache.size,
            pendingOperations: this.pendingOperations.length,
            isOnline: this.isOnline
        };
    }

    /**
     * Database health check
     */
    async healthCheck() {
        try {
            const startTime = performance.now();

            // Test basic read operation
            await this.withTransaction(['test'], 'readonly', async (transaction) => {
                // Just get the transaction to complete
                return true;
            });

            const duration = performance.now() - startTime;

            return {
                healthy: true,
                responseTime: duration,
                activeTransactions: this.activeTransactions,
                cacheSize: this.operationCache.size,
                isOnline: this.isOnline
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                isOnline: this.isOnline
            };
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        // Clear expired cache entries
        const now = Date.now();
        for (const [key, entry] of this.operationCache.entries()) {
            if (now - entry.timestamp > this.cacheExpiry) {
                this.operationCache.delete(key);
            }
        }

        // Close sync channel
        if (this.syncChannel) {
            this.syncChannel.close();
        }

        // Close database connection
        if (this.db) {
            this.db.close();
        }
    }

    /**
     * Export database data
     */
    async exportData(storeNames = null) {
        const exportData = {};
        const stores = storeNames || Array.from(this.db.objectStoreNames);

        for (const storeName of stores) {
            exportData[storeName] = await this.streamCursor(storeName);
        }

        return exportData;
    }

    /**
     * Import database data
     */
    async importData(data, options = {}) {
        const {
            clearExisting = false,
            onProgress = null
        } = options;

        const storeNames = Object.keys(data);
        let processedStores = 0;

        for (const storeName of storeNames) {
            if (clearExisting) {
                await this.withTransaction([storeName], 'readwrite', async (transaction) => {
                    const store = transaction.objectStore(storeName);
                    await this.executeStoreOperation(store, 'clear');
                });
            }

            const operations = data[storeName].map(item => ({
                type: 'put',
                data: item.value,
                key: item.key
            }));

            await this.bulkOperation(storeName, operations);

            processedStores++;

            if (onProgress) {
                onProgress({
                    completed: processedStores,
                    total: storeNames.length,
                    percentage: (processedStores / storeNames.length) * 100
                });
            }
        }
    }

    /**
     * Execute operation (for offline support)
     */
    async executeOperation(operation) {
        switch (operation.type) {
            case 'put':
                return await this.withTransaction([operation.storeName], 'readwrite', async (transaction) => {
                    const store = transaction.objectStore(operation.storeName);
                    return await this.executeStoreOperation(store, 'put', operation.data, operation.key);
                });
            case 'delete':
                return await this.withTransaction([operation.storeName], 'readwrite', async (transaction) => {
                    const store = transaction.objectStore(operation.storeName);
                    return await this.executeStoreOperation(store, 'delete', operation.key);
                });
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        this.eventBus.addEventListener(event, callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        this.eventBus.removeEventListener(event, callback);
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }

        if (this.syncChannel) {
            this.syncChannel.close();
            this.syncChannel = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedIndexedDB;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdvancedIndexedDB = AdvancedIndexedDB;
}
