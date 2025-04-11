import { Species, Catch } from '../types';

export class DatabaseService {
    private db: Map<string, any>;

    constructor() {
        this.db = new Map();
    }

    async openDB(): Promise<void> {
        // In-memory database initialization
        return Promise.resolve();
    }

    async getSpecies(name: string): Promise<Species | null> {
        return this.db.get(`species:${name}`) || null;
    }

    async getCatchesBySpecies(species: string): Promise<Catch[]> {
        const catches = this.db.get(`catches:${species}`) || [];
        return catches;
    }

    async updateSpeciesFormula(species: Species): Promise<void> {
        this.db.set(`species:${species.name}`, species);
    }

    async addCatch(catchData: Catch): Promise<void> {
        const key = `catches:${catchData.species}`;
        const catches = this.db.get(key) || [];
        catches.push(catchData);
        this.db.set(key, catches);
    }

    async closeDB(): Promise<void> {
        this.db.clear();
        return Promise.resolve();
    }
}