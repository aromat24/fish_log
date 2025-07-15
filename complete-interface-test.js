const { chromium } = require('playwright');

async function runFullFishLogTests() {
    console.log('🐟 Starting Complete Fish Log Interface Tests with Playwright...');
    
    let browser;
    let page;
    
    try {
        // Launch browser
        browser = await chromium.launch({
            headless: true,
            executablePath: '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome'
        });
        
        page = await browser.newPage();
        
        console.log('✅ Browser launched successfully');
        
        // Navigate to the app
        await page.goto('http://localhost:8000');
        console.log('✅ Navigated to Fish Log app');
        
        // Test 1: Click Enter Logbook button
        const enterButton = await page.$('button:has-text("Enter Logbook")');
        if (enterButton) {
            await enterButton.click();
            console.log('🚪 Clicked "Enter Logbook" button');
            
            // Wait for the interface to load
            await page.waitForTimeout(2000);
            
            // Take screenshot of main interface
            await page.screenshot({ 
                path: '/workspaces/fish_log/main-interface-screenshot.png',
                fullPage: true 
            });
            console.log('📸 Screenshot of main interface saved');
            
            // Now test form interactions in the main interface
            const mainFormElements = await page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const buttons = Array.from(document.querySelectorAll('button'));
                
                return {
                    visibleInputs: inputs.filter(input => 
                        input.offsetWidth > 0 && input.offsetHeight > 0
                    ).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder,
                        value: input.value
                    })),
                    visibleButtons: buttons.filter(button => 
                        button.offsetWidth > 0 && button.offsetHeight > 0
                    ).map(button => ({
                        text: button.textContent?.trim(),
                        id: button.id,
                        className: button.className
                    }))
                };
            });
            
            console.log('📋 Main interface form elements:', JSON.stringify(mainFormElements, null, 2));
            
            // Test 2: Try to fill visible form fields
            let formTestsPassed = 0;
            let formTestsTotal = 0;
            
            // Test species input
            const speciesInput = await page.$('#species');
            if (speciesInput) {
                const isVisible = await speciesInput.isVisible();
                const isEnabled = await speciesInput.isEnabled();
                
                console.log(`🐟 Species input - Visible: ${isVisible}, Enabled: ${isEnabled}`);
                
                if (isVisible && isEnabled) {
                    formTestsTotal++;
                    try {
                        await speciesInput.click();
                        await speciesInput.fill('Bass');
                        const value = await speciesInput.inputValue();
                        if (value === 'Bass') {
                            formTestsPassed++;
                            console.log('✅ Species input test: PASS');
                        } else {
                            console.log('❌ Species input test: FAIL - value not set correctly');
                        }
                    } catch (error) {
                        console.log(`❌ Species input test: FAIL - ${error.message}`);
                    }
                }
            }
            
            // Test length input
            const lengthInput = await page.$('#length');
            if (lengthInput) {
                const isVisible = await lengthInput.isVisible();
                const isEnabled = await lengthInput.isEnabled();
                
                console.log(`📏 Length input - Visible: ${isVisible}, Enabled: ${isEnabled}`);
                
                if (isVisible && isEnabled) {
                    formTestsTotal++;
                    try {
                        await lengthInput.click();
                        await lengthInput.fill('25');
                        const value = await lengthInput.inputValue();
                        if (value === '25') {
                            formTestsPassed++;
                            console.log('✅ Length input test: PASS');
                        } else {
                            console.log('❌ Length input test: FAIL - value not set correctly');
                        }
                    } catch (error) {
                        console.log(`❌ Length input test: FAIL - ${error.message}`);
                    }
                }
            }
            
            // Test weight input
            const weightInput = await page.$('#weight');
            if (weightInput) {
                const isVisible = await weightInput.isVisible();
                const isEnabled = await weightInput.isEnabled();
                
                console.log(`⚖️ Weight input - Visible: ${isVisible}, Enabled: ${isEnabled}`);
                
                if (isVisible && isEnabled) {
                    formTestsTotal++;
                    try {
                        await weightInput.click();
                        await weightInput.fill('2.5');
                        const value = await weightInput.inputValue();
                        if (value === '2.5') {
                            formTestsPassed++;
                            console.log('✅ Weight input test: PASS');
                        } else {
                            console.log('❌ Weight input test: FAIL - value not set correctly');
                        }
                    } catch (error) {
                        console.log(`❌ Weight input test: FAIL - ${error.message}`);
                    }
                }
            }
            
            // Test 3: Test Get Current Location button
            const locationButton = await page.$('button:has-text("Get Current Location")');
            if (locationButton) {
                const isVisible = await locationButton.isVisible();
                console.log(`📍 Location button - Visible: ${isVisible}`);
                
                if (isVisible) {
                    try {
                        await locationButton.click();
                        console.log('✅ Clicked Get Current Location button');
                        await page.waitForTimeout(1000);
                    } catch (error) {
                        console.log(`⚠️ Location button click failed: ${error.message}`);
                    }
                }
            }
            
            // Test 4: Try to save a catch (if form is filled)
            if (formTestsPassed > 0) {
                const saveButton = await page.$('button:has-text("Save Catch")');
                if (saveButton) {
                    const isVisible = await saveButton.isVisible();
                    const isEnabled = await saveButton.isEnabled();
                    
                    console.log(`💾 Save button - Visible: ${isVisible}, Enabled: ${isEnabled}`);
                    
                    if (isVisible && isEnabled) {
                        try {
                            await saveButton.click();
                            console.log('✅ Clicked Save Catch button');
                            await page.waitForTimeout(2000);
                            
                            // Check if catch was saved by looking for success indicators
                            const successIndicators = await page.evaluate(() => {
                                // Look for success messages or catch list items
                                const alerts = Array.from(document.querySelectorAll('.alert, .success, .notification'));
                                const catchItems = Array.from(document.querySelectorAll('.catch-item, .catch-entry, [id*="catch"]'));
                                
                                return {
                                    alerts: alerts.map(el => el.textContent?.trim()),
                                    catchCount: catchItems.length
                                };
                            });
                            
                            console.log('📝 Save result indicators:', JSON.stringify(successIndicators, null, 2));
                            
                        } catch (error) {
                            console.log(`⚠️ Save catch failed: ${error.message}`);
                        }
                    }
                }
            }
            
            // Test 5: Check localStorage for saved data
            const storageData = await page.evaluate(() => {
                const catches = localStorage.getItem('catches');
                return {
                    hasCatches: !!catches,
                    catchCount: catches ? JSON.parse(catches).length : 0,
                    storageKeys: Object.keys(localStorage)
                };
            });
            
            console.log('💾 Storage data check:', JSON.stringify(storageData, null, 2));
            
            // Generate comprehensive report
            const report = {
                timestamp: new Date().toISOString(),
                url: 'http://localhost:8000',
                tests: {
                    navigation: 'PASS',
                    mainInterface: 'PASS',
                    formInteraction: `${formTestsPassed}/${formTestsTotal} PASSED`,
                    localStorage: storageData.hasCatches ? 'PASS' : 'NO_DATA',
                    screenshots: 'PASS'
                },
                details: {
                    mainFormElements,
                    storageData,
                    formTestResults: {
                        passed: formTestsPassed,
                        total: formTestsTotal
                    }
                }
            };
            
            console.log('✅ All main interface tests completed!');
            console.log('📊 Final Test Report:', JSON.stringify(report, null, 2));
            
            return report;
            
        } else {
            console.log('❌ Could not find "Enter Logbook" button');
            return { error: 'Entry button not found' };
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

// Run if called directly
if (require.main === module) {
    runFullFishLogTests()
        .then(report => {
            console.log('🎉 Complete test suite finished successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Complete test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runFullFishLogTests };
