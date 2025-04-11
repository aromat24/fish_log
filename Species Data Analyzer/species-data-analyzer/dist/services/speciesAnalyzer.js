"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeciesAnalyzer = void 0;
const database_1 = require("./database");
const formulaGenerator_1 = require("./formulaGenerator");
class SpeciesAnalyzer {
    constructor() {
        this.db = new database_1.DatabaseService();
        this.formulaGenerator = new formulaGenerator_1.FormulaGenerator();
    }
    async analyzeSpecies(speciesName) {
        try {
            const catches = await this.db.getCatchesBySpecies(speciesName);
            const validCatches = this.getValidCatches(catches);
            if (validCatches.length === 0) {
                return null;
            }
            const lengthWeightData = this.extractLengthWeightData(validCatches);
            const newFormula = this.formulaGenerator.generateFormula(lengthWeightData);
            if (!newFormula) {
                return null;
            }
            const existingSpecies = await this.db.getSpecies(speciesName);
            const updatedSpecies = this.updateSpeciesData(existingSpecies, newFormula, speciesName);
            await this.db.updateSpeciesFormula(updatedSpecies);
            return updatedSpecies;
        }
        catch (error) {
            console.error('Error analyzing species:', error);
            return null;
        }
    }
    getValidCatches(catches) {
        return catches.filter(c => c.length && c.length > 0 &&
            c.weight && c.weight > 0);
    }
    extractLengthWeightData(catches) {
        return catches
            .filter(c => c.length && c.weight)
            .map(c => ({
            length: c.length,
            weight: c.weight
        }));
    }
    updateSpeciesData(existingSpecies, newFormula, speciesName) {
        if (!existingSpecies) {
            return {
                name: speciesName,
                a: newFormula.a,
                b: newFormula.b,
                minLength: 0,
                maxLength: 1000,
                isCustom: true,
                lastUpdated: new Date().toISOString(),
                confidence: newFormula.confidence
            };
        }
        const oldFormula = {
            a: existingSpecies.a,
            b: existingSpecies.b,
            confidence: existingSpecies.confidence || 0,
            dataPoints: 0
        };
        const mergedFormula = this.formulaGenerator.mergeFormulas(oldFormula, newFormula);
        return {
            ...existingSpecies,
            a: mergedFormula.a,
            b: mergedFormula.b,
            confidence: mergedFormula.confidence,
            lastUpdated: new Date().toISOString()
        };
    }
}
exports.SpeciesAnalyzer = SpeciesAnalyzer;
//# sourceMappingURL=speciesAnalyzer.js.map