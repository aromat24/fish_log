/**
 * Test script to validate Fish Now button functionality
 * This will simulate clicking the Fish Now button and check for errors
 */

console.log('🎮 Starting Fish Now button test...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM loaded');
    
    // Check if FishingGameIntegration is available
    if (typeof window.fishingGameIntegration === 'undefined') {
        console.error('❌ FishingGameIntegration not found');
        return;
    }
    
    console.log('✅ FishingGameIntegration found');
    
    // Check if Fish Now button exists
    const fishNowBtn = document.getElementById('fish-now-btn');
    if (!fishNowBtn) {
        console.error('❌ Fish Now button not found');
        return;
    }
    
    console.log('✅ Fish Now button found');
    
    // Add test click handler
    const testGame = async () => {
        try {
            console.log('🎮 Testing Fish Now button click...');
            
            // Get game integration status
            const status = window.fishingGameIntegration.getGameStatus();
            console.log('📊 Game status:', status);
            
            // Try to launch the game
            await window.fishingGameIntegration.launchGame();
            
            console.log('✅ Game launch test completed');
            
        } catch (error) {
            console.error('❌ Game launch test failed:', error);
        }
    };
    
    // Add test button
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Fish Now';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    `;
    testButton.onclick = testGame;
    document.body.appendChild(testButton);
    
    console.log('✅ Test button added to page');
    
    // Auto-test after 3 seconds
    setTimeout(() => {
        console.log('🎮 Auto-testing Fish Now functionality...');
        testGame();
    }, 3000);
});

// Add error handlers for debugging
window.addEventListener('error', (e) => {
    console.error('💥 JavaScript Error:', e.message, 'at', e.filename, ':', e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('💥 Unhandled Promise Rejection:', e.reason);
});

console.log('✅ Test script loaded');