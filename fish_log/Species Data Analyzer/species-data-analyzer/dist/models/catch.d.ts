import { Species } from './species';
export declare class Catch {
    species: Species;
    length: number;
    weight: number;
    constructor(species: Species, length: number, weight: number);
    logCatch(): void;
    private updateSpeciesData;
    private calculateLengthWeightRatio;
}
