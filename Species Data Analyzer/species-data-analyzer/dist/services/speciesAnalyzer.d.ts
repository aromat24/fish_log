import { Species } from '../types';
export declare class SpeciesAnalyzer {
    private db;
    private formulaGenerator;
    constructor();
    analyzeSpecies(speciesName: string): Promise<Species | null>;
    private getValidCatches;
    private extractLengthWeightData;
    private updateSpeciesData;
}
