import { Species } from './species';

export class Catch {
    species: Species;
    length: number;
    weight: number;

    constructor(species: Species, length: number, weight: number) {
        this.species = species;
        this.length = length;
        this.weight = weight;
    }

    logCatch(): void {
        // Logic to log the catch in the database
        // This would typically involve calling a service method to save the catch
        console.log(`Logged catch: ${this.species.name}, Length: ${this.length}, Weight: ${this.weight}`);
        
        // Update the species data with the new length and weight
        this.updateSpeciesData();
    }

    private updateSpeciesData(): void {
        const newRatio = this.calculateLengthWeightRatio();
        this.species.lengthWeightRatio = newRatio;

        // Logic to update the species in the database
        console.log(`Updated species ${this.species.name} with new length/weight ratio: ${newRatio}`);
    }

    private calculateLengthWeightRatio(): number {
        return this.length / this.weight;
    }
}