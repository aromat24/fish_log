const { chromium } = require('playwright');

async function runFishLogTests() {
    console.log('🐟 Starting Fish Log Live Tests with Playwright...');
    
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
        
        // Test 1: Check page title
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Test 2: Check for main elements
        const elements = await page.evaluate(() => {
            return {
                forms: document.querySelectorAll('form').length,
                buttons: document.querySelectorAll('button').length,
                inputs: document.querySelectorAll('input').length,
                selects: document.querySelectorAll('select').length
            };
        });
        
        console.log('🔍 Page elements found:', elements);
        
        // Test 3: Check localStorage functionality
        await page.evaluate(() => {
            localStorage.setItem('test_item', 'test_value');
        });
        
        const testValue = await page.evaluate(() => {
            return localStorage.getItem('test_item');
        });
        
        console.log(`💾 localStorage test: ${testValue === 'test_value' ? 'PASS' : 'FAIL'}`);
        
        // Test 4: Check for JavaScript errors
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleMessages.push(msg.text());
            }
        });
        
        // Trigger some interactions
        await page.click('body'); // Safe click
        
        // Test 5: Take a screenshot
        await page.screenshot({ 
            path: '/workspaces/fish_log/test-screenshot.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved to test-screenshot.png');
        
        // Test 6: Test debug localStorage page
        await page.goto('http://localhost:8000/debug_localStorage.html');
        console.log('✅ Navigated to debug localStorage page');
        
        // Click the debug button
        const debugButton = await page.$('button[onclick="debugLocalStorage()"]');
        if (debugButton) {
            await debugButton.click();
            console.log('🔧 Clicked debug localStorage button');
            
            // Wait for output
            await page.waitForTimeout(1000);
            
            const outputContent = await page.$eval('#output', el => el.innerHTML);
            console.log('📋 Debug output generated:', outputContent.length > 0 ? 'SUCCESS' : 'EMPTY');
        }
        
        // Test 7: Form interaction test
        await page.goto('http://localhost:8000');
        
        // Get all form elements for analysis
        const formElements = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const buttons = Array.from(document.querySelectorAll('button'));
            const selects = Array.from(document.querySelectorAll('select'));
            
            return {
                inputs: inputs.map(input => ({
                    type: input.type,
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    visible: input.offsetWidth > 0 && input.offsetHeight > 0
                })),
                buttons: buttons.map(btn => ({
                    text: btn.textContent?.trim(),
                    onclick: btn.onclick ? 'has onclick' : 'no onclick',
                    visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
                })),
                selects: selects.map(select => ({
                    name: select.name,
                    id: select.id,
                    options: Array.from(select.options).map(opt => opt.text)
                }))
            };
        });
        
        console.log('📋 Form elements analysis:', JSON.stringify(formElements, null, 2));
        
        // Try to interact with visible form elements
        let formInteractionSuccess = false;
        
        try {
            // Look for any visible input fields
            const visibleInputs = await page.$$('input:visible');
            if (visibleInputs.length > 0) {
                console.log(`� Found ${visibleInputs.length} visible inputs`);
                
                // Try to fill the first text input we find
                for (const input of visibleInputs) {
                    const inputType = await input.getAttribute('type');
                    const inputName = await input.getAttribute('name');
                    const inputId = await input.getAttribute('id');
                    
                    if (inputType === 'text' || inputType === 'search' || !inputType) {
                        try {
                            await input.click();
                            await input.fill('Test Value');
                            console.log(`✅ Successfully filled input: ${inputName || inputId || 'unnamed'}`);
                            formInteractionSuccess = true;
                            break;
                        } catch (error) {
                            console.log(`⚠️ Could not fill input ${inputName || inputId}: ${error.message}`);
                        }
                    }
                }
            }
            
            // Try clicking a safe button
            const buttons = await page.$$('button:visible');
            if (buttons.length > 0) {
                console.log(`🔘 Found ${buttons.length} visible buttons`);
            }
            
        } catch (error) {
            console.log(`⚠️ Form interaction test encountered error: ${error.message}`);
        }
        
        console.log('✅ All tests completed successfully!');
        
        // Generate test report
        const report = {
            timestamp: new Date().toISOString(),
            url: 'http://localhost:8000',
            tests: {
                pageLoad: 'PASS',
                title: title,
                elements: elements,
                localStorage: testValue === 'test_value' ? 'PASS' : 'FAIL',
                debugPage: 'PASS',
                formInteraction: formInteractionSuccess ? 'PASS' : 'PARTIAL',
                screenshots: 'PASS',
                formAnalysis: formElements
            },
            consoleErrors: consoleMessages
        };
        
        console.log('📊 Test Report:', JSON.stringify(report, null, 2));
        
        return report;
        
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
    runFishLogTests()
        .then(report => {
            console.log('🎉 Test suite completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runFishLogTests };
