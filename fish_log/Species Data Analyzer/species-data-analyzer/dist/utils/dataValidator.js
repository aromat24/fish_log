"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSpeciesData = validateSpeciesData;
exports.validateCatchData = validateCatchData;
exports.validateDataPoints = validateDataPoints;
const MAX_LENGTH = 1000; // cm
const MAX_WEIGHT = 500; // kg
const MIN_LENGTH = 1; // cm
const MIN_WEIGHT = 0.001; // kg
function validateSpeciesData(name, lengthWeightRatio) {
    if (!name || typeof name !== 'string') {
        console.error('Invalid species name');
        return false;
    }
    if (typeof lengthWeightRatio !== 'number' || lengthWeightRatio <= 0) {
        console.error('Invalid length/weight ratio');
        return false;
    }
    return true;
}
function validateCatchData(species, length, weight) {
    if (!species || typeof species !== 'string') {
        console.error('Invalid species name');
        return false;
    }
    if (typeof length !== 'number' || length <= 0) {
        console.error('Invalid length');
        return false;
    }
    if (typeof weight !== 'number' || weight <= 0) {
        console.error('Invalid weight');
        return false;
    }
    return true;
}
function validateDataPoints(data) {
    return data.filter(point => {
        // Filter out invalid or extreme values
        if (!isValidMeasurement(point.length, point.weight)) {
            return false;
        }
        // Filter out statistical outliers using IQR method
        return !isOutlier(point, data);
    });
}
function isValidMeasurement(length, weight) {
    return length >= MIN_LENGTH &&
        length <= MAX_LENGTH &&
        weight >= MIN_WEIGHT &&
        weight <= MAX_WEIGHT;
}
function isOutlier(point, data) {
    const ratios = data.map(p => p.weight / Math.pow(p.length, 3));
    const { q1, q3 } = calculateQuartiles(ratios);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const ratio = point.weight / Math.pow(point.length, 3);
    return ratio < lowerBound || ratio > upperBound;
}
function calculateQuartiles(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const lowerHalf = sorted.slice(0, mid);
    const upperHalf = sorted.slice(mid + (sorted.length % 2));
    return {
        q1: median(lowerHalf),
        q3: median(upperHalf)
    };
}
function median(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}
//# sourceMappingURL=dataValidator.js.map