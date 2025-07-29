export declare class Species {
    name: string;
    lengthWeightRatio: number;
    constructor(name: string, lengthWeightRatio: number);
    updateLengthWeightRatio(newLength: number, newWeight: number): void;
    getSpeciesInfo(): string;
}
