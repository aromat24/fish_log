import { Species, LengthWeightData } from '../types';
import { FormulaGenerator } from './formulaGenerator';
import { DatabaseService } from './database';

export class SpeciesAnalyzer {
    private formulaGenerator: FormulaGenerator;
    private db: DatabaseService;

    constructor() {
        this.formulaGenerator = new FormulaGenerator();
        this.db = new DatabaseService();
    }

    async analyzeSpecies(speciesName: string): Promise<Species | null> {
        try {
            // Get all catches for this species
            const catches = await this.db.getCatchesBySpecies(speciesName) || [];
            
            if (catches.length < 5) {
                return null; // Not enough data for analysis
            }

            // Convert catches to length-weight data
            const data: LengthWeightData[] = catches.map(c => ({
                length: c.length,
                weight: c.weight
            }));

            // Generate new formula
            const newFormula = this.formulaGenerator.generateFormula(data);
            if (!newFormula) {
                return null;
            }

            // Get existing species data if any
            const existingSpecies = await this.db.getSpecies(speciesName);
            
            if (existingSpecies) {
                // Create a new formula object with required confidence
                const oldFormula = {
                    ...existingSpecies,
                    confidence: existingSpecies.confidence || 0
                };
                const mergedFormula = this.formulaGenerator.mergeFormulas(oldFormula, {
                    ...newFormula,
                    confidence: newFormula.confidence || 0
                });

                // Update existing species with merged formula
                return {
                    ...existingSpecies,
                    a: mergedFormula.a,
                    b: mergedFormula.b,
                    confidence: mergedFormula.confidence,
                    dataPoints: mergedFormula.dataPoints,
                    lastUpdated: new Date().toISOString()
                };
            } else {
                // Create new species entry
                return {
                    name: speciesName,
                    a: newFormula.a,
                    b: newFormula.b,
                    confidence: newFormula.confidence,
                    dataPoints: newFormula.dataPoints,
                    minLength: Math.min(...data.map(d => d.length)),
                    maxLength: Math.max(...data.map(d => d.length)),
                    isCustom: true,
                    lastUpdated: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error analyzing species:', error);
            return null;
        }
    }
}