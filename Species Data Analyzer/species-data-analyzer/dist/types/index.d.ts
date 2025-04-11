export interface Species {
    name: string;
    a: number;
    b: number;
    minLength: number;
    maxLength: number;
    isCustom?: boolean;
    lastUpdated?: string;
    confidence?: number;
}
export interface Catch {
    id: string;
    species: string;
    length?: number;
    weight?: number;
    datetime: string;
    notes?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    photo?: string;
}
export interface LengthWeightData {
    length: number;
    weight: number;
}
export interface Formula {
    a: number;
    b: number;
    confidence: number;
    dataPoints: number;
}
