// Simple version of app.js without syntax errors
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized - DOM content loaded');
    
    // Initialize main functionality with error handling
    try {
        // Setup the Enter Logbook button
        const landingPage = document.getElementById('landing-page');
        const appContent = document.getElementById('app-content');
        const enterAppBtn = document.getElementById('enter-app-btn');
        
        if (landingPage && appContent && enterAppBtn) {
            console.log('Landing page elements found');
            
            // Make button more accessible
            enterAppBtn.style.position = 'relative';
            enterAppBtn.style.zIndex = '20';
            enterAppBtn.style.cursor = 'pointer';
            
            // Direct click handler that's simple and reliable
            enterAppBtn.addEventListener('click', function() {
                console.log('Enter button clicked');
                
                // Hide landing page
                landingPage.style.display = 'none';
                landingPage.classList.add('hidden');
                
                // Show app content
                appContent.style.display = 'block';
                appContent.classList.remove('hidden');
                
                // Remember user's choice
                localStorage.setItem('skipLandingPage', 'true');
            });
            
            // Skip landing page if user previously chose to
            if (localStorage.getItem('skipLandingPage') === 'true') {
                console.log('Skipping landing page based on preference');
                landingPage.style.display = 'none';
                appContent.style.display = 'block';
                appContent.classList.remove('hidden');
            }
        } else {
            console.error('Landing page elements not found');
        }
        
        // Message component
        const messageBox = document.createElement('div');
        messageBox.id = 'message-box';
        messageBox.className = 'fixed top-5 left-1/2 transform -translate-x-1/2 z-50 hidden';
        document.body.appendChild(messageBox);
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Helper function to show messages
function showMessage(message, type = 'success') {
    console.log(`Message (${type}): ${message}`);
    
    const successToast = document.getElementById('success-toast');
    const messageEl = document.getElementById('success-message');
    
    if (successToast && messageEl) {
        messageEl.textContent = message;
        
        if (type === 'error') {
            successToast.classList.remove('bg-green-100', 'border-green-500', 'text-green-700');
            successToast.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
        } else {
            successToast.classList.remove('bg-red-100', 'border-red-500', 'text-red-700');
            successToast.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
        }
        
        successToast.classList.remove('translate-x-full');
        
        setTimeout(() => {
            successToast.classList.add('translate-x-full');
        }, 3000);
    }
}