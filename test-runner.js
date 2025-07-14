#!/usr/bin/env node

/**
 * Fish Log Application Test Runner
 * Automated testing script for core functionality
 */

const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.warnings = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.testResults.push(logEntry);
        
        // Color coding for console output
        const colors = {
            pass: '\x1b[32m', // Green
            fail: '\x1b[31m', // Red
            warn: '\x1b[33m', // Yellow
            info: '\x1b[36m', // Cyan
            reset: '\x1b[0m'
        };
        
        const color = colors[type] || colors.info;
        console.log(`${color}[${type.toUpperCase()}] ${message}${colors.reset}`);
        
        // Update counters
        this.totalTests++;
        if (type === 'pass') this.passedTests++;
        else if (type === 'fail') this.failedTests++;
        else if (type === 'warn') this.warnings++;
    }

    async testFileStructure() {
        this.log('Testing file structure...', 'info');
        
        const requiredFiles = [
            'index.html',
            'js/app.js',
            'js/errorHandler.js',
            'js/fishDatabase.js',
            'js/selfImprovingAlgorithm.js',
            'js/beautiful-buttons.js',
            'css/beautiful-buttons.css',
            'manifest.json',
            'sw.js'
        ];
        
        const baseDir = path.join(__dirname);
        
        for (const file of requiredFiles) {
            const filePath = path.join(baseDir, file);
            if (fs.existsSync(filePath)) {
                this.log(`✓ File exists: ${file}`, 'pass');
            } else {
                this.log(`✗ File missing: ${file}`, 'fail');
            }
        }
    }

    async testHtmlStructure() {
        this.log('Testing HTML structure...', 'info');
        
        try {
            const htmlPath = path.join(__dirname, 'index.html');
            if (!fs.existsSync(htmlPath)) {
                this.log('✗ index.html not found', 'fail');
                return;
            }
            
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // Test for required elements
            const requiredElements = [
                'catch-form',
                'species',
                'length',
                'weight',
                'datetime',
                'notes',
                'catch-modal',
                'edit-modal',
                'map-modal'
            ];
            
            for (const elementId of requiredElements) {
                const pattern = new RegExp(`id="${elementId}"`, 'i');
                if (pattern.test(htmlContent)) {
                    this.log(`✓ HTML element found: #${elementId}`, 'pass');
                } else {
                    this.log(`✗ HTML element missing: #${elementId}`, 'fail');
                }
            }
            
            // Test for script inclusions
            const requiredScripts = [
                'js/app.js',
                'js/errorHandler.js',
                'js/fishDatabase.js',
                'js/selfImprovingAlgorithm.js'
            ];
            
            for (const script of requiredScripts) {
                const pattern = new RegExp(`src="[^"]*${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i');
                if (pattern.test(htmlContent)) {
                    this.log(`✓ Script included: ${script}`, 'pass');
                } else {
                    this.log(`✗ Script missing: ${script}`, 'fail');
                }
            }
            
        } catch (error) {
            this.log(`✗ HTML structure test failed: ${error.message}`, 'fail');
        }
    }

    async testJavaScriptSyntax() {
        this.log('Testing JavaScript syntax...', 'info');
        
        const jsFiles = [
            'js/app.js',
            'js/errorHandler.js',
            'js/fishDatabase.js',
            'js/selfImprovingAlgorithm.js',
            'js/beautiful-buttons.js'
        ];
        
        for (const jsFile of jsFiles) {
            const filePath = path.join(__dirname, jsFile);
            
            if (!fs.existsSync(filePath)) {
                this.log(`✗ JavaScript file missing: ${jsFile}`, 'fail');
                continue;
            }
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Basic syntax checks
                if (content.includes('function') || content.includes('=>')) {
                    this.log(`✓ Functions found in: ${jsFile}`, 'pass');
                } else {
                    this.log(`⚠ No functions found in: ${jsFile}`, 'warn');
                }
                
                // Check for common errors
                const commonErrors = [
                    { pattern: /console\.log\(/g, message: 'console.log statements (consider removing for production)' },
                    { pattern: /debugger/g, message: 'debugger statements' },
                    { pattern: /TODO|FIXME|XXX/gi, message: 'TODO/FIXME comments' }
                ];
                
                for (const error of commonErrors) {
                    const matches = content.match(error.pattern);
                    if (matches) {
                        this.log(`⚠ ${matches.length} ${error.message} in ${jsFile}`, 'warn');
                    }
                }
                
                // Check for proper error handling
                if (content.includes('try') && content.includes('catch')) {
                    this.log(`✓ Error handling found in: ${jsFile}`, 'pass');
                } else {
                    this.log(`⚠ No error handling found in: ${jsFile}`, 'warn');
                }
                
            } catch (error) {
                this.log(`✗ Error reading ${jsFile}: ${error.message}`, 'fail');
            }
        }
    }

    async testManifestAndServiceWorker() {
        this.log('Testing PWA components...', 'info');
        
        // Test manifest.json
        const manifestPath = path.join(__dirname, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                
                const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color'];
                for (const field of requiredFields) {
                    if (manifest[field]) {
                        this.log(`✓ Manifest field: ${field}`, 'pass');
                    } else {
                        this.log(`✗ Manifest field missing: ${field}`, 'fail');
                    }
                }
                
                if (manifest.icons && Array.isArray(manifest.icons)) {
                    this.log(`✓ Manifest icons: ${manifest.icons.length} defined`, 'pass');
                } else {
                    this.log('✗ Manifest icons missing or invalid', 'fail');
                }
                
            } catch (error) {
                this.log(`✗ Manifest.json parsing failed: ${error.message}`, 'fail');
            }
        } else {
            this.log('✗ manifest.json not found', 'fail');
        }
        
        // Test service worker
        const swPath = path.join(__dirname, 'sw.js');
        if (fs.existsSync(swPath)) {
            try {
                const swContent = fs.readFileSync(swPath, 'utf8');
                
                if (swContent.includes('install') && swContent.includes('activate')) {
                    this.log('✓ Service worker has install and activate events', 'pass');
                } else {
                    this.log('⚠ Service worker missing standard events', 'warn');
                }
                
                if (swContent.includes('cache')) {
                    this.log('✓ Service worker implements caching', 'pass');
                } else {
                    this.log('⚠ Service worker caching not implemented', 'warn');
                }
                
            } catch (error) {
                this.log(`✗ Service worker reading failed: ${error.message}`, 'fail');
            }
        } else {
            this.log('✗ sw.js not found', 'fail');
        }
    }

    async testConfiguration() {
        this.log('Testing configuration files...', 'info');
        
        // Test for various config files
        const configFiles = [
            { file: 'package.json', required: false },
            { file: '_config.yml', required: false },
            { file: '.gitignore', required: false },
            { file: 'README.md', required: false }
        ];
        
        for (const config of configFiles) {
            const filePath = path.join(__dirname, config.file);
            if (fs.existsSync(filePath)) {
                this.log(`✓ Config file found: ${config.file}`, 'pass');
                
                // Special handling for package.json
                if (config.file === 'package.json') {
                    try {
                        const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        if (packageJson.scripts) {
                            this.log(`✓ Package.json has ${Object.keys(packageJson.scripts).length} scripts`, 'pass');
                        }
                        if (packageJson.dependencies) {
                            this.log(`✓ Package.json has ${Object.keys(packageJson.dependencies).length} dependencies`, 'pass');
                        }
                    } catch (error) {
                        this.log(`✗ Package.json parsing failed: ${error.message}`, 'fail');
                    }
                }
            } else {
                if (config.required) {
                    this.log(`✗ Required config file missing: ${config.file}`, 'fail');
                } else {
                    this.log(`⚠ Optional config file missing: ${config.file}`, 'warn');
                }
            }
        }
    }

    async testDataStructure() {
        this.log('Testing data structure...', 'info');
        
        try {
            // Test fish algorithms data
            const algorithmsPath = path.join(__dirname, 'fish_algorithms.json');
            if (fs.existsSync(algorithmsPath)) {
                const algorithms = JSON.parse(fs.readFileSync(algorithmsPath, 'utf8'));
                
                if (typeof algorithms === 'object' && algorithms !== null) {
                    const algorithmKeys = Object.keys(algorithms);
                    this.log(`✓ Fish algorithms object with ${algorithmKeys.length} entries`, 'pass');
                    
                    // Test structure of first few entries
                    const sampleSize = Math.min(3, algorithmKeys.length);
                    for (let i = 0; i < sampleSize; i++) {
                        const key = algorithmKeys[i];
                        const entry = algorithms[key];
                        if (entry.species_name && entry.algorithm) {
                            this.log(`✓ Algorithm entry ${key} has required fields`, 'pass');
                        } else {
                            this.log(`✗ Algorithm entry ${key} missing required fields`, 'fail');
                        }
                    }
                } else {
                    this.log('✗ Fish algorithms data is not a valid object', 'fail');
                }
            } else {
                this.log('✗ fish_algorithms.json not found', 'fail');
            }
            
            // Test fish database files
            const dbPath = path.join(__dirname, 'Fish App DB Files');
            if (fs.existsSync(dbPath)) {
                const dbFiles = fs.readdirSync(dbPath);
                this.log(`✓ Fish database directory with ${dbFiles.length} files`, 'pass');
                
                const expectedFiles = [
                    'complete_fish_algorithms.json',
                    'complete_fish_species_data.csv',
                    'fish_species_database.db'
                ];
                
                for (const expectedFile of expectedFiles) {
                    if (dbFiles.includes(expectedFile)) {
                        this.log(`✓ Database file found: ${expectedFile}`, 'pass');
                    } else {
                        this.log(`✗ Database file missing: ${expectedFile}`, 'fail');
                    }
                }
            } else {
                this.log('✗ Fish App DB Files directory not found', 'fail');
            }
            
        } catch (error) {
            this.log(`✗ Data structure test failed: ${error.message}`, 'fail');
        }
    }

    generateReport() {
        const successRate = this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(1) : 0;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`⚠️  Warnings: ${this.warnings}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log('='.repeat(50));
        
        // Generate JSON report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                warnings: this.warnings,
                successRate: parseFloat(successRate)
            },
            results: this.testResults
        };
        
        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Detailed report saved to: ${reportPath}`);
        
        return report;
    }

    async runAllTests() {
        console.log('🚀 Starting Fish Log Application Tests...\n');
        
        try {
            await this.testFileStructure();
            await this.testHtmlStructure();
            await this.testJavaScriptSyntax();
            await this.testManifestAndServiceWorker();
            await this.testConfiguration();
            await this.testDataStructure();
            
            const report = this.generateReport();
            
            // Exit with appropriate code
            process.exit(this.failedTests > 0 ? 1 : 0);
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests();
}

module.exports = TestRunner;
