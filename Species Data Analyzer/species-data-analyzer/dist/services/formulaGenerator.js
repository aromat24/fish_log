"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulaGenerator = void 0;
exports.generateFormula = generateFormula;
exports.updateSpeciesFormula = updateSpeciesFormula;
const dataValidator_1 = require("../utils/dataValidator");
class FormulaGenerator {
    constructor() {
        this.MINIMUM_DATA_POINTS = 5;
        this.CONFIDENCE_THRESHOLD = 0.8;
    }
    generateFormula(data) {
        if (!this.hasEnoughData(data)) {
            return null;
        }
        const validData = (0, dataValidator_1.validateDataPoints)(data);
        if (validData.length < this.MINIMUM_DATA_POINTS) {
            return null;
        }
        const { a, b } = this.calculateCoefficients(validData);
        const confidence = this.calculateConfidence(validData, a, b);
        return {
            a: parseFloat(a.toFixed(6)),
            b: parseFloat(b.toFixed(3)),
            confidence: parseFloat(confidence.toFixed(3)),
            dataPoints: validData.length
        };
    }
    hasEnoughData(data) {
        return data.length >= this.MINIMUM_DATA_POINTS;
    }
    calculateCoefficients(data) {
        // Convert to logarithmic form: log(W) = log(a) + b*log(L)
        const logData = data.map(point => ({
            x: Math.log(point.length),
            y: Math.log(point.weight)
        }));
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        const n = logData.length;
        logData.forEach(point => {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
        });
        // Calculate b (slope)
        const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        // Calculate log(a) (y-intercept)
        const logA = (sumY - b * sumX) / n;
        // Convert back from logarithmic form
        return {
            a: Math.exp(logA),
            b: b
        };
    }
    calculateConfidence(data, a, b) {
        let totalError = 0;
        let maxError = 0;
        data.forEach(point => {
            const predictedWeight = a * Math.pow(point.length, b);
            const error = Math.abs(predictedWeight - point.weight) / point.weight;
            totalError += error;
            maxError = Math.max(maxError, error);
        });
        const averageError = totalError / data.length;
        const confidence = 1 - averageError;
        return Math.max(0, Math.min(1, confidence));
    }
    mergeFormulas(oldFormula, newFormula) {
        // Weight based on number of data points and confidence
        const oldWeight = oldFormula.dataPoints * oldFormula.confidence;
        const newWeight = newFormula.dataPoints * newFormula.confidence;
        const totalWeight = oldWeight + newWeight;
        const mergedA = (oldFormula.a * oldWeight + newFormula.a * newWeight) / totalWeight;
        const mergedB = (oldFormula.b * oldWeight + newFormula.b * newWeight) / totalWeight;
        return {
            a: parseFloat(mergedA.toFixed(6)),
            b: parseFloat(mergedB.toFixed(3)),
            confidence: Math.max(oldFormula.confidence, newFormula.confidence),
            dataPoints: oldFormula.dataPoints + newFormula.dataPoints
        };
    }
}
exports.FormulaGenerator = FormulaGenerator;
function generateFormula(length, weight) {
    if (length <= 0 || weight <= 0) {
        throw new Error("Length and weight must be positive values.");
    }
    const ratio = weight / length;
    const formula = `Weight = ${ratio.toFixed(2)} * Length`;
    return formula;
}
function updateSpeciesFormula(species, newLength, newWeight) {
    const newFormula = generateFormula(newLength, newWeight);
    species.lengthWeightRatio = newFormula; // Assuming species has a property to store the formula
}
//# sourceMappingURL=formulaGenerator.js.map