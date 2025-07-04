/// <reference types="jest" />
// This file contains unit tests for the SpeciesAnalyzer service, testing its methods for accuracy and functionality.

import { SpeciesAnalyzer } from '../../src/services/speciesAnalyzer';
import { DatabaseService } from '../../src/services/database';
import { Species, Catch } from '../../src/types';

jest.mock('../../src/services/database');

describe('SpeciesAnalyzer', () => {
    let analyzer: SpeciesAnalyzer;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        mockDb = new DatabaseService() as jest.Mocked<DatabaseService>;
        analyzer = new SpeciesAnalyzer();
    });

    describe('analyzeSpecies', () => {
        it('should return null when there are insufficient catches', async () => {
            mockDb.getCatchesBySpecies.mockResolvedValue([]);
            const result = await analyzer.analyzeSpecies('Bass');
            expect(result).toBeNull();
        });

        it('should generate and update formula for valid catches', async () => {
            const testCatches: Catch[] = [
                { id: '1', species: 'Bass', length: 20, weight: 2.1, datetime: '2025-04-11' },
                { id: '2', species: 'Bass', length: 25, weight: 3.4, datetime: '2025-04-11' },
                { id: '3', species: 'Bass', length: 30, weight: 5.1, datetime: '2025-04-11' },
                { id: '4', species: 'Bass', length: 35, weight: 7.2, datetime: '2025-04-11' },
                { id: '5', species: 'Bass', length: 40, weight: 9.8, datetime: '2025-04-11' }
            ];

            mockDb.getCatchesBySpecies.mockResolvedValue(testCatches);
            mockDb.getSpecies.mockResolvedValue(null);

            const result = await analyzer.analyzeSpecies('Bass');

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Bass');
            expect(result?.a).toBeGreaterThan(0);
            expect(result?.b).toBeGreaterThan(2.5);
            expect(result?.b).toBeLessThan(3.5);
            expect(result?.confidence).toBeGreaterThan(0.8);
        });

        it('should merge formulas when species already exists', async () => {
            const existingSpecies: Species = {
                name: 'Bass',
                a: 0.01,
                b: 3.0,
                minLength: 0,
                maxLength: 1000,
                confidence: 0.8,
                isCustom: true,
                lastUpdated: new Date().toISOString()
            };

            const testCatches: Catch[] = [
                { id: '1', species: 'Bass', length: 20, weight: 2.1, datetime: '2025-04-11' },
                { id: '2', species: 'Bass', length: 25, weight: 3.4, datetime: '2025-04-11' },
                { id: '3', species: 'Bass', length: 30, weight: 5.1, datetime: '2025-04-11' },
                { id: '4', species: 'Bass', length: 35, weight: 7.2, datetime: '2025-04-11' },
                { id: '5', species: 'Bass', length: 40, weight: 9.8, datetime: '2025-04-11' }
            ];

            mockDb.getCatchesBySpecies.mockResolvedValue(testCatches);
            mockDb.getSpecies.mockResolvedValue(existingSpecies);

            const result = await analyzer.analyzeSpecies('Bass');

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Bass');
            expect(result?.a).not.toBe(existingSpecies.a);
            expect(result?.b).not.toBe(existingSpecies.b);
            expect(result?.lastUpdated).not.toBe(existingSpecies.lastUpdated);
        });

        it('should handle invalid data gracefully', async () => {
            const invalidCatches: Catch[] = [
                { id: '1', species: 'Bass', length: -20, weight: -2.1, datetime: '2025-04-11' },
                { id: '2', species: 'Bass', length: 0, weight: 0, datetime: '2025-04-11' },
                { id: '3', species: 'Bass', length: 30, weight: 5.1, datetime: '2025-04-11' }
            ];

            mockDb.getCatchesBySpecies.mockResolvedValue(invalidCatches);
            const result = await analyzer.analyzeSpecies('Bass');
            expect(result).toBeNull();
        });
    });
});