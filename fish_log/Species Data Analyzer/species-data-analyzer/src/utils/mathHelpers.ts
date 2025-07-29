export function calculateLengthWeightRatio(length: number, weight: number): number {
    if (length <= 0 || weight <= 0) {
        throw new Error("Length and weight must be positive numbers.");
    }
    return weight / length;
}

export function calculateAverage(values: number[]): number {
    if (values.length === 0) {
        throw new Error("Cannot calculate average of an empty array.");
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
}

export function updateSpeciesLengthWeightRatio(lengths: number[], weights: number[]): number {
    if (lengths.length !== weights.length || lengths.length === 0) {
        throw new Error("Lengths and weights arrays must be of the same non-zero length.");
    }
    const ratios = lengths.map((length, index) => calculateLengthWeightRatio(length, weights[index]));
    return calculateAverage(ratios);
}

export function calculateMean(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

export function calculateStandardDeviation(numbers: number[]): number {
    const mean = calculateMean(numbers);
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return Math.sqrt(calculateMean(squareDiffs));
}

export function calculateRSquared(observed: number[], predicted: number[]): number {
    if (observed.length !== predicted.length) {
        throw new Error('Arrays must have same length');
    }

    const mean = calculateMean(observed);
    const totalSS = observed.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const residualSS = observed.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    
    return 1 - (residualSS / totalSS);
}

export function roundToSignificantDigits(number: number, digits: number): number {
    if (number === 0) return 0;
    const magnitude = Math.floor(Math.log10(Math.abs(number)));
    const factor = Math.pow(10, digits - magnitude - 1);
    return Math.round(number * factor) / factor;
}