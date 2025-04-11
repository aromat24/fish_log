// src/types/index.ts

export interface Species {
    name: string;
    a: number;          // coefficient a in the formula W = aL^b
    b: number;          // exponent b in the formula W = aL^b
    minLength?: number;
    maxLength?: number;
    confidence?: number;
    dataPoints?: number;
    isCustom?: boolean;
    lastUpdated?: string;
}

export interface Catch {
    id: string;
    species: string;
    length: number;
    weight: number;
    datetime: string;
    notes?: string;
    locationName?: string;
}

export interface LengthWeightData {
    length: number;
    weight: number;
}