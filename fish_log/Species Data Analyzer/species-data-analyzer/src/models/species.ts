export class Species {
    name: string;
    lengthWeightRatio: number;

    constructor(name: string, lengthWeightRatio: number) {
        this.name = name;
        this.lengthWeightRatio = lengthWeightRatio;
    }

    updateLengthWeightRatio(newLength: number, newWeight: number): void {
        if (newLength <= 0 || newWeight <= 0) {
            throw new Error("Length and weight must be positive values.");
        }
        this.lengthWeightRatio = newWeight / newLength;
    }

    getSpeciesInfo(): string {
        return `Species: ${this.name}, Length/Weight Ratio: ${this.lengthWeightRatio.toFixed(2)}`;
    }
}