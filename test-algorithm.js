// Test the algorithm calculation directly
const fs = require('fs');

async function testAlgorithm() {
    try {
        // Load fish algorithms
        const algorithmsData = JSON.parse(fs.readFileSync('fish_algorithms.json', 'utf8'));
        console.log('Loaded', Object.keys(algorithmsData).length, 'species');

        // Test calculation for a specific species
        const testSpecies = 'Blacktail (M&F)';
        let speciesData = null;

        // Find the species
        for (const [id, data] of Object.entries(algorithmsData)) {
            if (data.species_name === testSpecies) {
                speciesData = data;
                break;
            }
        }

        if (speciesData) {
            console.log('\nFound species:', speciesData.species_name);
            console.log('Algorithm:', speciesData.algorithm);

            // Test calculation
            const length = 30; // cm
            const a = speciesData.algorithm.a;
            const b = speciesData.algorithm.b;
            const weight = a * Math.pow(length, b);

            console.log('\nCalculation:');
            console.log(`Length: ${length}cm`);
            console.log(`Formula: W = ${a} * ${length}^${b}`);
            console.log(`Weight: ${weight.toFixed(3)}kg`);
            console.log(`R²: ${speciesData.algorithm.r_squared}`);
            console.log(`Data points: ${speciesData.algorithm.data_points}`);

        } else {
            console.log('Species not found:', testSpecies);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testAlgorithm();
