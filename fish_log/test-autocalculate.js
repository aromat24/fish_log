// Simple test for autocalculate functionality
console.log('Testing autocalculate functionality...');

// Test function to verify database loading
async function testAutoCalculate() {
    console.log('Starting autocalculate test...');

    try {
        // Wait for fishDB to be available
        let attempts = 0;
        while (!window.fishDB && attempts < 10) {
            console.log('Waiting for fishDB...', attempts);
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (!window.fishDB) {
            console.error('fishDB not available after waiting');
            return;
        }

        const isReady = await window.fishDB.isReady();
        console.log('fishDB ready:', isReady);

        if (isReady) {
            console.log('Algorithms loaded:', Object.keys(window.fishDB.algorithms || {}).length);

            // Test weight calculation
            const testSpecies = 'Blacktail (M&F)';
            const testLength = 30;

            const result = await window.fishDB.getImprovedWeightEstimate(testSpecies, testLength);
            console.log('Test calculation result:', result);

            if (result) {
                console.log(`✓ SUCCESS: ${testSpecies} at ${testLength}cm = ${result.estimatedWeight.toFixed(3)}kg`);
                console.log(`  Algorithm: ${result.algorithm_source}, Confidence: ${result.confidence}`);
            } else {
                console.log('✗ FAILED: No result returned');
            }
        } else {
            console.log('fishDB not ready');
        }

    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run test after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testAutoCalculate, 2000);
    });
} else {
    setTimeout(testAutoCalculate, 2000);
}
