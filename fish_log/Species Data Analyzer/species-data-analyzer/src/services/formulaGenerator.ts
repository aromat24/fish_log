import { LengthWeightData } from '../types';

interface Formula {
    a: number;
    b: number;
    confidence: number;
    dataPoints?: number;
}

export class FormulaGenerator {
    generateFormula(data: LengthWeightData[]): Formula | null {
        if (data.length < 5) {
            return null;
        }

        // Convert to log space for linear regression
        const logData = data.map(point => ({
            x: Math.log(point.length),
            y: Math.log(point.weight)
        }));

        // Calculate means
        const meanX = logData.reduce((sum, p) => sum + p.x, 0) / logData.length;
        const meanY = logData.reduce((sum, p) => sum + p.y, 0) / logData.length;

        // Calculate coefficients
        let numerator = 0;
        let denominator = 0;
        logData.forEach(point => {
            const xDiff = point.x - meanX;
            numerator += xDiff * (point.y - meanY);
            denominator += xDiff * xDiff;
        });

        let b = numerator / denominator;
        
        // Constrain b to biologically reasonable bounds
        b = Math.max(2.5, Math.min(3.5, b));
        
        const a = Math.exp(meanY - b * meanX);

        // Calculate R-squared
        const yPred = logData.map(point => b * point.x + (Math.log(a)));
        const ssRes = logData.reduce((sum, point, i) => sum + Math.pow(point.y - yPred[i], 2), 0);
        const ssTot = logData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
        const rSquared = 1 - (ssRes / ssTot);

        return {
            a,
            b,
            confidence: rSquared,
            dataPoints: data.length
        };
    }

    mergeFormulas(oldFormula: Formula, newFormula: Formula): Formula {
        const totalPoints = (oldFormula.dataPoints || 0) + (newFormula.dataPoints || 0);
        const oldWeight = (oldFormula.dataPoints || 0) / totalPoints;
        const newWeight = (newFormula.dataPoints || 0) / totalPoints;

        return {
            a: oldFormula.a * oldWeight + newFormula.a * newWeight,
            b: oldFormula.b * oldWeight + newFormula.b * newWeight,
            confidence: Math.max(oldFormula.confidence, newFormula.confidence),
            dataPoints: totalPoints
        };
    }
}