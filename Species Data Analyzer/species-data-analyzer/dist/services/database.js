"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
class DatabaseService {
    constructor() {
        this.DB_NAME = 'FishingLogDB';
        this.DB_VERSION = 2;
    }
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('catches')) {
                    db.createObjectStore('catches', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('species')) {
                    const store = db.createObjectStore('species', { keyPath: 'name' });
                    store.createIndex('lastUpdated', 'lastUpdated');
                }
            };
        });
    }
    async getAllCatches() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('catches', 'readonly');
            const store = transaction.objectStore('catches');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async getCatchesBySpecies(speciesName) {
        const catches = await this.getAllCatches();
        return catches.filter(c => c.species === speciesName);
    }
    async updateSpeciesFormula(species) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('species', 'readwrite');
            const store = transaction.objectStore('species');
            const request = store.put(species);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async getSpecies(name) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('species', 'readonly');
            const store = transaction.objectStore('species');
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.js.map