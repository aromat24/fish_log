import { Species, Catch } from '../types';
export declare class DatabaseService {
    private readonly DB_NAME;
    private readonly DB_VERSION;
    openDB(): Promise<IDBDatabase>;
    getAllCatches(): Promise<Catch[]>;
    getCatchesBySpecies(speciesName: string): Promise<Catch[]>;
    updateSpeciesFormula(species: Species): Promise<void>;
    getSpecies(name: string): Promise<Species | null>;
}
