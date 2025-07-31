#!/usr/bin/env node

/**
 * Node.js script to validate game implementation
 * Checks that all game files have proper exports and no syntax errors
 */

const fs = require('fs');
const path = require('path');

const gameFiles = [
    'js/gameComponents.js',
    'js/gameScenes.js', 
    'js/fishingGameCore.js',
    'js/inputManager.js',
    'js/motionSensorManager.js',
    'js/sensorFilters.js',
    'js/fishingGameIntegration.js'
];

console.log('🎮 Validating Fish Log Game Implementation...\n');

let allValid = true;

for (const file of gameFiles) {
    const filePath = path.join(__dirname, file);
    
    try {
        console.log(`📁 Checking ${file}...`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${file}`);
            allValid = false;
            continue;
        }
        
        // Check file size
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            console.error(`❌ File is empty: ${file}`);
            allValid = false;
            continue;
        }
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax validation
        try {
            // Use Node's vm module to check syntax without executing
            const vm = require('vm');
            new vm.Script(content);
            console.log(`✅ ${file} - Syntax OK (${(stats.size / 1024).toFixed(1)}KB)`);
        } catch (syntaxError) {
            console.error(`❌ ${file} - Syntax Error: ${syntaxError.message}`);
            allValid = false;
            continue;
        }
        
        // Check for key exports
        const hasExports = content.includes('window.') || content.includes('module.exports');
        if (hasExports) {
            console.log(`✅ ${file} - Has exports`);
        } else {
            console.warn(`⚠️ ${file} - No exports found`);
        }
        
        // Check for error handling
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        if (hasErrorHandling) {
            console.log(`✅ ${file} - Has error handling`);
        } else {
            console.log(`ℹ️ ${file} - No error handling detected`);
        }
        
    } catch (error) {
        console.error(`❌ Error checking ${file}: ${error.message}`);
        allValid = false;
    }
    
    console.log('');
}

// Summary
console.log('📊 Validation Summary:');
console.log('='.repeat(50));

if (allValid) {
    console.log('✅ All game files are valid!');
    console.log('🎮 The fishing game should be ready to test.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Open http://localhost:35059 in browser');
    console.log('   2. Click the "Fish Now!" button');
    console.log('   3. Use Space to cast, R to reel');
    console.log('   4. Check browser console for debug info');
    process.exit(0);
} else {
    console.log('❌ Some game files have issues.');
    console.log('🔧 Please fix the errors above before testing.');
    process.exit(1);
}