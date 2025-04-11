import { LengthWeightData } from '../types';
export declare function validateSpeciesData(name: string, lengthWeightRatio: number): boolean;
export declare function validateCatchData(species: string, length: number, weight: number): boolean;
export declare function validateDataPoints(data: LengthWeightData[]): LengthWeightData[];
