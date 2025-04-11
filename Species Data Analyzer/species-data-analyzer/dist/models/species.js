"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Species = void 0;
class Species {
    constructor(name, lengthWeightRatio) {
        this.name = name;
        this.lengthWeightRatio = lengthWeightRatio;
    }
    updateLengthWeightRatio(newLength, newWeight) {
        if (newLength <= 0 || newWeight <= 0) {
            throw new Error("Length and weight must be positive values.");
        }
        this.lengthWeightRatio = newWeight / newLength;
    }
    getSpeciesInfo() {
        return `Species: ${this.name}, Length/Weight Ratio: ${this.lengthWeightRatio.toFixed(2)}`;
    }
}
exports.Species = Species;
//# sourceMappingURL=species.js.map