/// <reference types="jest" />
import { FormulaGenerator } from '../../src/services/formulaGenerator';
import { Species, LengthWeightData } from '../../src/types';

describe('FormulaGenerator', () => {
    let generator: FormulaGenerator;

    beforeEach(() => {
        generator = new FormulaGenerator();
    });

    describe('generateFormula', () => {
        it('should return null for insufficient data points', () => {
            const data: LengthWeightData[] = [
                { length: 10, weight: 0.5 },
                { length: 15, weight: 1.2 }
            ];
            expect(generator.generateFormula(data)).toBeNull();
        });

        it('should generate correct formula for valid data', () => {
            const data: LengthWeightData[] = [
                { length: 10, weight: 0.5 },
                { length: 15, weight: 1.2 },
                { length: 20, weight: 2.1 },
                { length: 25, weight: 3.4 },
                { length: 30, weight: 5.1 }
            ];
            const formula = generator.generateFormula(data);
            
            expect(formula).not.toBeNull();
            expect(formula?.a).toBeGreaterThan(0);
            expect(formula?.b).toBeGreaterThan(2.5);
            expect(formula?.b).toBeLessThan(3.5);
            expect(formula?.confidence).toBeGreaterThan(0.7);
        });

        it('should handle outliers appropriately', () => {
            const data: LengthWeightData[] = [
                { length: 10, weight: 0.5 },
                { length: 15, weight: 1.2 },
                { length: 20, weight: 2.1 },
                { length: 25, weight: 3.4 },
                { length: 30, weight: 5.1 },
                { length: 35, weight: 50.0 } // Outlier
            ];
            const formula = generator.generateFormula(data);
            
            expect(formula).not.toBeNull();
            expect(formula?.confidence).toBeLessThan(0.9);
        });
    });

    describe('mergeFormulas', () => {
        it('should merge two formulas with appropriate weighting', () => {
            const oldFormula = {
                a: 0.01,
                b: 3.0,
                confidence: 0.8,
                dataPoints: 10
            };
            
            const newFormula = {
                a: 0.012,
                b: 3.1,
                confidence: 0.9,
                dataPoints: 5
            };
            
            const merged = generator.mergeFormulas(oldFormula, newFormula);
            
            expect(merged.a).toBeCloseTo(0.0107, 4);
            expect(merged.b).toBeCloseTo(3.033, 3);
            expect(merged.confidence).toBe(0.9);
            expect(merged.dataPoints).toBe(15);
        });
    });
});