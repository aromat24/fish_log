"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Catch = void 0;
class Catch {
    constructor(species, length, weight) {
        this.species = species;
        this.length = length;
        this.weight = weight;
    }
    logCatch() {
        // Logic to log the catch in the database
        // This would typically involve calling a service method to save the catch
        console.log(`Logged catch: ${this.species.name}, Length: ${this.length}, Weight: ${this.weight}`);
        // Update the species data with the new length and weight
        this.updateSpeciesData();
    }
    updateSpeciesData() {
        const newRatio = this.calculateLengthWeightRatio();
        this.species.lengthWeightRatio = newRatio;
        // Logic to update the species in the database
        console.log(`Updated species ${this.species.name} with new length/weight ratio: ${newRatio}`);
    }
    calculateLengthWeightRatio() {
        return this.length / this.weight;
    }
}
exports.Catch = Catch;
//# sourceMappingURL=catch.js.map