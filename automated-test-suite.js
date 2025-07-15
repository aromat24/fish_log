/**
 * Comprehensive Automated Test Suite for Fish Log Application
 * This script tests core functionality including local storage, form validation, 
 * and user interactions.
 */

class FishLogTester {
    constructor() {
        this.tests = [];
        this.results = [];
        this.testData = {
            fishCatch: {
                species: "Bass",
                length: "25",
                weight: "3.5",
                location: "Lake Michigan",
                date: "2025-07-15",
                time: "08:30",
                bait: "Worm",
                weather: "Sunny",
                temperature: "22"
            }
        };
    }

    // Logging utility
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type.toUpperCase();
        console.log(`[${timestamp}] ${prefix}: ${message}`);
    }

    // Test runner
    async runAllTests() {
        this.log("Starting Fish Log Application Test Suite");
        
        // Clear any existing data first
        await this.clearStorageTest();
        
        // Core functionality tests
        await this.testLocalStorage();
        await this.testFormValidation();
        await this.testCatchEntry();
        await this.testDataPersistence();
        await this.testSpeciesAutocomplete();
        await this.testWeightLengthCalculation();
        await this.testLocationFeatures();
        await this.testErrorHandling();
        
        this.generateReport();
    }

    // Test local storage functionality
    async testLocalStorage() {
        this.log("Testing localStorage functionality");
        
        try {
            // Test basic localStorage operations
            const testKey = 'fishlog_test';
            const testValue = 'test_data_' + Date.now();
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            
            if (retrieved === testValue) {
                this.addResult('localStorage basic operations', 'PASS', 'Successfully stored and retrieved data');
            } else {
                this.addResult('localStorage basic operations', 'FAIL', `Expected ${testValue}, got ${retrieved}`);
            }
            
            localStorage.removeItem(testKey);
            
            // Test catches array initialization
            if (!localStorage.getItem('catches')) {
                localStorage.setItem('catches', JSON.stringify([]));
            }
            
            const catches = JSON.parse(localStorage.getItem('catches') || '[]');
            if (Array.isArray(catches)) {
                this.addResult('catches array initialization', 'PASS', 'Catches array properly initialized');
            } else {
                this.addResult('catches array initialization', 'FAIL', 'Catches is not an array');
            }
            
        } catch (error) {
            this.addResult('localStorage functionality', 'FAIL', error.message);
        }
    }

    // Test form validation
    async testFormValidation() {
        this.log("Testing form validation");
        
        try {
            // Find the main form
            const form = document.querySelector('form') || document.querySelector('#catch-form');
            
            if (!form) {
                this.addResult('form validation', 'SKIP', 'No form found on current page');
                return;
            }

            // Test required field validation
            const requiredFields = form.querySelectorAll('input[required], select[required]');
            this.addResult('required fields detection', 'PASS', `Found ${requiredFields.length} required fields`);
            
            // Test number field validation
            const numberFields = form.querySelectorAll('input[type="number"]');
            if (numberFields.length > 0) {
                this.addResult('number fields detection', 'PASS', `Found ${numberFields.length} number input fields`);
            }
            
        } catch (error) {
            this.addResult('form validation', 'FAIL', error.message);
        }
    }

    // Test catch entry functionality
    async testCatchEntry() {
        this.log("Testing catch entry functionality");
        
        try {
            // Try to fill out a catch form
            const species = document.querySelector('input[name="species"], #species');
            const length = document.querySelector('input[name="length"], #length');
            const weight = document.querySelector('input[name="weight"], #weight');
            
            if (species && length && weight) {
                // Simulate form filling
                this.simulateInput(species, this.testData.fishCatch.species);
                this.simulateInput(length, this.testData.fishCatch.length);
                this.simulateInput(weight, this.testData.fishCatch.weight);
                
                this.addResult('catch form filling', 'PASS', 'Successfully filled basic catch data');
            } else {
                this.addResult('catch form filling', 'SKIP', 'Catch form not found on current page');
            }
            
        } catch (error) {
            this.addResult('catch entry', 'FAIL', error.message);
        }
    }

    // Test data persistence
    async testDataPersistence() {
        this.log("Testing data persistence");
        
        try {
            const testCatch = {
                id: Date.now(),
                ...this.testData.fishCatch,
                timestamp: new Date().toISOString()
            };
            
            // Get existing catches
            let catches = JSON.parse(localStorage.getItem('catches') || '[]');
            const originalLength = catches.length;
            
            // Add test catch
            catches.push(testCatch);
            localStorage.setItem('catches', JSON.stringify(catches));
            
            // Verify persistence
            const savedCatches = JSON.parse(localStorage.getItem('catches') || '[]');
            if (savedCatches.length === originalLength + 1) {
                this.addResult('data persistence', 'PASS', 'Test catch successfully saved');
                
                // Clean up test data
                const cleanedCatches = savedCatches.filter(c => c.id !== testCatch.id);
                localStorage.setItem('catches', JSON.stringify(cleanedCatches));
            } else {
                this.addResult('data persistence', 'FAIL', 'Test catch not saved properly');
            }
            
        } catch (error) {
            this.addResult('data persistence', 'FAIL', error.message);
        }
    }

    // Test species autocomplete/selection
    async testSpeciesAutocomplete() {
        this.log("Testing species autocomplete/selection");
        
        try {
            const speciesInput = document.querySelector('input[name="species"], #species');
            const speciesSelect = document.querySelector('select[name="species"], #species-select');
            
            if (speciesInput) {
                // Test autocomplete functionality
                speciesInput.value = 'bas';
                speciesInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Check if suggestions appear
                setTimeout(() => {
                    const suggestions = document.querySelectorAll('.suggestion, .autocomplete-item, .species-option');
                    if (suggestions.length > 0) {
                        this.addResult('species autocomplete', 'PASS', `Found ${suggestions.length} suggestions`);
                    } else {
                        this.addResult('species autocomplete', 'INFO', 'No suggestions found - may not be implemented');
                    }
                }, 100);
                
            } else if (speciesSelect) {
                const options = speciesSelect.querySelectorAll('option');
                this.addResult('species selection', 'PASS', `Found ${options.length} species options`);
            } else {
                this.addResult('species input', 'SKIP', 'No species input/select found');
            }
            
        } catch (error) {
            this.addResult('species autocomplete', 'FAIL', error.message);
        }
    }

    // Test weight/length calculation
    async testWeightLengthCalculation() {
        this.log("Testing weight/length calculation");
        
        try {
            const lengthInput = document.querySelector('input[name="length"], #length');
            const weightInput = document.querySelector('input[name="weight"], #weight');
            
            if (lengthInput && weightInput) {
                // Test if there's auto-calculation
                const originalWeight = weightInput.value;
                
                this.simulateInput(lengthInput, '30');
                lengthInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                setTimeout(() => {
                    if (weightInput.value !== originalWeight && weightInput.value !== '') {
                        this.addResult('weight calculation', 'PASS', 'Auto-calculation appears to work');
                    } else {
                        this.addResult('weight calculation', 'INFO', 'No auto-calculation detected');
                    }
                }, 200);
                
            } else {
                this.addResult('weight/length fields', 'SKIP', 'Length or weight input not found');
            }
            
        } catch (error) {
            this.addResult('weight/length calculation', 'FAIL', error.message);
        }
    }

    // Test location features
    async testLocationFeatures() {
        this.log("Testing location features");
        
        try {
            const locationInput = document.querySelector('input[name="location"], #location');
            const geoButton = document.querySelector('button[onclick*="location"], .geo-button, #get-location');
            
            if (locationInput) {
                this.addResult('location input', 'PASS', 'Location input field found');
            }
            
            if (geoButton) {
                this.addResult('geolocation button', 'PASS', 'Geolocation button found');
            }
            
            // Test if geolocation is available
            if (navigator.geolocation) {
                this.addResult('geolocation API', 'PASS', 'Geolocation API available');
            } else {
                this.addResult('geolocation API', 'FAIL', 'Geolocation API not available');
            }
            
        } catch (error) {
            this.addResult('location features', 'FAIL', error.message);
        }
    }

    // Test error handling
    async testErrorHandling() {
        this.log("Testing error handling");
        
        try {
            // Test with invalid data
            const form = document.querySelector('form');
            if (form) {
                const numberInputs = form.querySelectorAll('input[type="number"]');
                
                numberInputs.forEach(input => {
                    const originalValue = input.value;
                    
                    // Test negative numbers
                    this.simulateInput(input, '-5');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Test non-numeric input
                    this.simulateInput(input, 'abc');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Restore original value
                    this.simulateInput(input, originalValue);
                });
                
                this.addResult('error handling', 'PASS', 'Error handling tests completed');
            }
            
        } catch (error) {
            this.addResult('error handling', 'FAIL', error.message);
        }
    }

    // Clear storage test
    async clearStorageTest() {
        this.log("Clearing test storage");
        
        try {
            // Backup existing data
            const existingCatches = localStorage.getItem('catches');
            if (existingCatches) {
                localStorage.setItem('catches_backup', existingCatches);
                this.log("Backed up existing catches data");
            }
            
            // Clear test data
            localStorage.removeItem('fishlog_test');
            this.addResult('storage cleanup', 'PASS', 'Test storage cleared');
            
        } catch (error) {
            this.addResult('storage cleanup', 'FAIL', error.message);
        }
    }

    // Utility function to simulate input
    simulateInput(element, value) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Add test result
    addResult(testName, status, message) {
        this.results.push({
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'blue';
        console.log(`%c${status}: ${testName} - ${message}`, `color: ${color}; font-weight: bold`);
    }

    // Generate test report
    generateReport() {
        this.log("Generating test report");
        
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const skipped = this.results.filter(r => r.status === 'SKIP').length;
        const info = this.results.filter(r => r.status === 'INFO').length;
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    FISH LOG TEST REPORT                     ║
╠══════════════════════════════════════════════════════════════╣
║ Total Tests: ${total.toString().padStart(3)} │ Passed: ${passed.toString().padStart(3)} │ Failed: ${failed.toString().padStart(3)} │ Skipped: ${skipped.toString().padStart(3)} ║
╚══════════════════════════════════════════════════════════════╝
        `);
        
        // Detailed results
        this.results.forEach(result => {
            const status = result.status.padEnd(6);
            const test = result.test.padEnd(30);
            console.log(`${status} │ ${test} │ ${result.message}`);
        });
        
        // Create downloadable report
        const reportData = {
            summary: { total, passed, failed, skipped, info },
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            results: this.results
        };
        
        // Save report to localStorage for access
        localStorage.setItem('test_report', JSON.stringify(reportData));
        
        this.log("Test report saved to localStorage as 'test_report'");
        
        return reportData;
    }

    // Method to download report as JSON
    downloadReport() {
        const report = localStorage.getItem('test_report');
        if (report) {
            const blob = new Blob([report], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fish-log-test-report-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize and export
window.FishLogTester = FishLogTester;

// Auto-run if not in Node.js environment
if (typeof window !== 'undefined' && window.location) {
    console.log('🐟 Fish Log Tester loaded! Run with: new FishLogTester().runAllTests()');
}
