import { LengthWeightData, Formula } from '../types';
export declare class FormulaGenerator {
    private readonly MINIMUM_DATA_POINTS;
    private readonly CONFIDENCE_THRESHOLD;
    generateFormula(data: LengthWeightData[]): Formula | null;
    private hasEnoughData;
    private calculateCoefficients;
    private calculateConfidence;
    mergeFormulas(oldFormula: Formula, newFormula: Formula): Formula;
}
export declare function generateFormula(length: number, weight: number): string;
export declare function updateSpeciesFormula(species: any, newLength: number, newWeight: number): void;
