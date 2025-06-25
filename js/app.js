// Map functionality variables
let map = null;
let currentMarker = null;
let currentLocationMarker = null; // Separate marker for user's current location
let selectedLatitude = null;
let selectedLongitude = null;
let mainMap = null;
let catchMarkers = [];

// Fullscreen image rotation and zoom state
let imageRotation = 0;
let currentScale = 1;
let currentTranslateX = 0;
let currentTranslateY = 0;
let isZoomed = false;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM CONTENT LOADED ===');
    console.log('Current URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
      try {
        // Initialize landing page functionality
        initLandingPage();        // Setup fullscreen image handling and ensure it's hidden on startup
        console.log('=== FULLSCREEN MODAL INITIALIZATION ===');
          // Reset fullscreen modal to clean state first
        resetFullscreenModal();
        
        // Add fallback resets to ensure modal stays hidden
        setTimeout(() => {
            resetFullscreenModal();
        }, 100);
        
        setTimeout(() => {
            resetFullscreenModal();
        }, 500);
        
        const fullscreenModal = document.getElementById('fullscreen-image');
        const fullscreenImage = document.getElementById('fullscreen-image-content');
        
        console.log('Fullscreen modal element:', fullscreenModal);
        
        // Double-check that fullscreen modal is hidden
        if (fullscreenModal) {
            fullscreenModal.classList.add('hidden');
            console.log('Force-hid fullscreen modal on startup');
        }
        if (fullscreenImage) {
            fullscreenImage.src = '';
            fullscreenImage.alt = '';
            console.log('Cleared fullscreen image source on startup');
        }
        
        const closeBtn = document.getElementById('close-fullscreen-btn');
        const rotateBtn = document.getElementById('rotate-image-btn');
        
        // Only add event listeners if buttons exist and are not disabled
        if (closeBtn && fullscreenModal) {
            closeBtn.addEventListener('click', closeFullscreenImage);
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                closeFullscreenImage();
            });
        }
        
        if (rotateBtn && fullscreenModal) {
            rotateBtn.addEventListener('click', handleRotateClick);
            rotateBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleRotateClick(e);
            });
        }
        
        fullscreenModal.addEventListener('click', (e) => {
            if (e.target === fullscreenModal) {
                closeFullscreenImage();
            }
        });

        const imageContent = document.getElementById('fullscreen-image-content');
        imageContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        console.log('About to initialize main app functionality...');

        // Initialize the main app functionality
        setupFormHandlers();
        setupLocationHandling();        setupPhotoHandling();
        setupModalHandlers();
        setupTabSystem(); // Updated from setupViewToggle
        setupDataOptions();
        setupSpeciesHandlers();
        setupMapHandlers(); // New map functionality
        
        console.log('Main app functionality initialized');
        
        // Initialize fish database and update species list
        initializeFishDatabase();
        
        // Initialize datetime input with current time
        initializeDatetime();

        // Load initial catch history
        loadCatchHistory();
        
        console.log('=== INITIALIZATION COMPLETE ===');
        
    } catch (error) {
        console.error('Error during app initialization:', error);
        console.error('Error stack:', error.stack);
        
        // Show user-friendly error message
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.textContent = 'Error initializing app. Please refresh the page.';
            messageBox.className = 'p-3 rounded-md text-sm bg-red-100 text-red-700';
            messageBox.classList.remove('hidden');
        }
    }
});

async function initializeFishDatabase() {
    console.log('=== FISH DATABASE INITIALIZATION START ===');
    try {
        if (window.fishDB) {
            const isReady = await window.fishDB.isReady();
            console.log('Fish database ready:', isReady);
            
            if (isReady) {
                // Refresh species list to include database species
                if (typeof window.refreshSpeciesList === 'function') {
                    await window.refreshSpeciesList();
                    console.log('Species list refreshed with database species');
                }
            } else {
                console.warn('Fish database failed to initialize properly');
            }
        } else {
            console.error('window.fishDB not found - fishDatabase.js may not have loaded');
        }
    } catch (error) {
        console.error('Error initializing fish database:', error);
    }
    console.log('=== FISH DATABASE INITIALIZATION END ===');
}

function initLandingPage() {
    const landingPage = document.getElementById('landing-page');
    const appContent = document.getElementById('app-content');
    const enterAppBtn = document.getElementById('enter-app-btn');

    // No need for event listener here since HTML calls window.enterApp directly
    console.log('Landing page initialized');
}

// Global function for landing page button
window.enterApp = function() {
    console.log('enterApp called');
    
    // CRITICAL: Reset fullscreen modal when entering the app
    resetFullscreenModal();
    
    const landingPage = document.getElementById('landing-page');
    const appContent = document.getElementById('app-content');
    
    if (landingPage && appContent) {
        landingPage.classList.add('fade-out');
        appContent.classList.remove('hidden');
        setTimeout(() => {
            appContent.classList.add('fade-in');
            // Load catch history after app content is visible
            loadCatchHistory();
        }, 50);
    }
};

function setupFormHandlers() {
    console.log('=== SETTING UP FORM HANDLERS ===');
    
    // Try to get form elements
    const catchForm = document.getElementById('catch-form');
    const lengthInput = document.getElementById('length');
    const speciesInput = document.getElementById('species');
    const weightInput = document.getElementById('weight');

    // Add debug logging to check if elements exist
    console.log('Form elements found:');
    console.log('catchForm:', !!catchForm);
    console.log('lengthInput:', !!lengthInput);
    console.log('speciesInput:', !!speciesInput);
    console.log('weightInput:', !!weightInput);

    if (!catchForm) {
        console.error('catch-form element not found! Retrying in 1 second...');
        // Retry after a delay in case the form is not yet in the DOM
        setTimeout(setupFormHandlers, 1000);
        return;
    }

    if (!lengthInput || !speciesInput || !weightInput) {
        console.error('Some form inputs not found! Retrying in 1 second...');
        setTimeout(setupFormHandlers, 1000);
        return;
    }

    console.log('All form elements found, setting up handlers...');

    // Make sure the form doesn't have any conflicting attributes
    catchForm.removeAttribute('onsubmit');
    
    // Setup automatic weight calculation
    const autoCalculateWeight = async () => {
        const species = speciesInput.value.trim();
        const length = parseFloat(lengthInput.value);
        
        if (species && length && length > 0) {
            await calculateEstimatedWeight(species, length);
        }
    };    // Calculate weight when length or species changes
    lengthInput.addEventListener('input', autoCalculateWeight);
    speciesInput.addEventListener('input', autoCalculateWeight);
    speciesInput.addEventListener('change', autoCalculateWeight);
      // Handle catch form submission with comprehensive debugging
    console.log('Setting up form submit handler...');
    catchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Event:', e);
        console.log('Form element:', catchForm);
          // Call the unified save function instead of duplicating logic
        saveCatchData();
    });      // Also add a direct click handler to the submit button as a fallback
    const submitButton = document.querySelector('#catch-form button[type="submit"]');
    console.log('Submit button found:', submitButton);
    if (submitButton) {
        console.log('Adding mobile-friendly touch and click handlers to submit button');
        
        // Use a less aggressive approach that works better with local testing
        let touchTimeout = null;
        let hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (hasTouchSupport) {
            console.log('Touch support detected, adding touch handlers');
            
            // Use a simpler approach - just add a touchend handler without preventing default
            submitButton.addEventListener('touchend', (e) => {
                console.log('=== SUBMIT BUTTON TOUCHEND (IMPROVED) ===');
                
                // Clear any existing timeout to prevent double submission
                if (touchTimeout) {
                    clearTimeout(touchTimeout);
                }
                
                // Add a small delay to ensure the touch event completes
                touchTimeout = setTimeout(() => {
                    console.log('Touch timeout triggered, calling saveCatchData...');
                    
                    // Check if this is a valid touch (not part of a scroll or drag)
                    const rect = submitButton.getBoundingClientRect();
                    const touch = e.changedTouches[0];
                    
                    if (touch && 
                        touch.clientX >= rect.left && 
                        touch.clientX <= rect.right && 
                        touch.clientY >= rect.top && 
                        touch.clientY <= rect.bottom) {
                        
                        console.log('Valid touch detected, saving catch...');
                        saveCatchData();
                    } else {
                        console.log('Touch outside button bounds, ignoring');
                    }
                }, 50);
                
            }, { passive: true }); // Use passive: true for better performance
            
        } else {
            console.log('No touch support detected, relying on click events');
        }
          // Add a more robust click handler for all devices
        submitButton.addEventListener('click', (e) => {
            console.log('=== SUBMIT BUTTON CLICK (IMPROVED) ===');
            console.log('Event type:', e.type);
            console.log('Event target:', e.target);
            console.log('Button element:', submitButton);
            
            // Add visual feedback
            submitButton.style.backgroundColor = '#1e40af';
            setTimeout(() => {
                submitButton.style.backgroundColor = '';
            }, 200);
            
            // Clear any touch timeout to prevent double submission
            if (touchTimeout) {
                clearTimeout(touchTimeout);
                touchTimeout = null;
            }
            
            // Always prevent default to avoid form submission conflicts
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Click handler calling saveCatchData...');
            saveCatchData();
        });
        
        // Add visual feedback for mobile users
        if (hasTouchSupport) {
            submitButton.style.cursor = 'pointer';
            submitButton.style.userSelect = 'none';
            submitButton.style.webkitUserSelect = 'none';
            submitButton.style.webkitTouchCallout = 'none';
        }
        
        console.log('=== MOBILE ENVIRONMENT DETECTION ===');
        console.log('User Agent:', navigator.userAgent);
        console.log('Touch Support:', hasTouchSupport);
        console.log('Max Touch Points:', navigator.maxTouchPoints);
        console.log('Protocol:', location.protocol);
        console.log('Is Local File:', location.protocol === 'file:');
        console.log('Is HTTPS:', location.protocol === 'https:');
        console.log('Viewport Width:', window.innerWidth);
        console.log('Screen Width:', screen.width);
        
    } else {
        console.error('Submit button not found!');
    }
    
    console.log('Form handlers setup complete');
    
    // Add a simple test to verify the button works
    setTimeout(() => {
        const testBtn = document.querySelector('#catch-form button[type="submit"]');
        if (testBtn) {
            console.log('=== BUTTON TEST ===');
            console.log('Button text:', testBtn.textContent);
            console.log('Button disabled:', testBtn.disabled);
            console.log('Button type:', testBtn.type);
            console.log('Button form:', testBtn.form);
        }
    }, 2000);
}

async function calculateEstimatedWeight(species, length) {
    if (!length || length <= 0) return null;
    
    // Wait for fish database to be ready
    if (window.fishDB && await window.fishDB.isReady()) {
        const result = window.fishDB.calculateWeight(species, length);
        
        if (result) {
            // Update weight input with calculated value
            const weightInput = document.getElementById('weight');
            weightInput.value = result.weight.toFixed(3);
            
            // Mark the weight as calculated and show info about the calculation
            weightInput.dataset.calculated = 'true';
            weightInput.dataset.species = result.species;
            weightInput.dataset.accuracy = result.accuracy;
            
            // Show calculation info as a tooltip or note
            const calculationInfo = result.isSpeciesSpecific 
                ? `Calculated using ${result.species} data (${(result.accuracy * 100).toFixed(1)}% accuracy, ${result.measureType})`
                : `Estimated using generic fish formula (${(result.accuracy * 100).toFixed(1)}% accuracy)`;
            
            weightInput.title = calculationInfo;
            
            // Show brief message about the calculation
            if (result.isSpeciesSpecific) {
                showMessage(`Weight calculated using ${result.species} specific data!`, 'info');
            }
            
            return result.weight;
        }
    }
    
    // Fallback to original generic calculation if database not available
    const a = 0.000013;
    const b = 3.0;
    const estimatedWeight = a * Math.pow(length, b);
    
    const weightInput = document.getElementById('weight');
    weightInput.value = estimatedWeight.toFixed(3);
    weightInput.dataset.calculated = 'true';
    weightInput.title = 'Generic estimate (80% accuracy)';
    
    return estimatedWeight;
}

function showEditModal(catchData) {
    const editModal = document.getElementById('edit-modal');
    
    // Fill in form fields
    document.getElementById('edit-catch-id').value = catchData.id;
    document.getElementById('edit-species').value = cleanSpeciesName(catchData.species);
    document.getElementById('edit-length').value = catchData.length;
    document.getElementById('edit-weight').value = Number(catchData.weight).toFixed(3);
    document.getElementById('edit-datetime').value = catchData.datetime;
    document.getElementById('edit-location-name').value = catchData.locationName || '';
    document.getElementById('edit-notes').value = catchData.notes || '';
    document.getElementById('edit-latitude').value = catchData.latitude || '';
    document.getElementById('edit-longitude').value = catchData.longitude || '';
    document.getElementById('edit-photo').value = catchData.photo || '';    // Update photo button text and reset styling
    const editPhotoText = document.getElementById('edit-photo-text');
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    editPhotoText.textContent = catchData.photo ? 'Change Photo' : 'Add Photo';
      // Reset button styling to default
    editPhotoBtn.className = 'shiny-button ripple-effect w-full';

    // Setup photo editing
    const editPhotoInput = document.getElementById('edit-photo-input');
      editPhotoBtn.onclick = () => editPhotoInput.click();
    
    editPhotoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showMessage('Please select a valid image file.', 'error');
            e.target.value = '';
            return;
        }

        // Validate file size (max 50MB raw file)
        const maxRawFileSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxRawFileSize) {
            showMessage('Image file is too large. Please choose a smaller image (max 50MB).', 'error');
            e.target.value = '';
            return;
        }        try {
            // Show processing message and change button appearance
            editPhotoText.textContent = 'Processing...';
            editPhotoBtn.className = 'shiny-button ripple-effect w-full';
            editPhotoBtn.style.setProperty('--button-bg', '#fef3c7');
            editPhotoBtn.style.setProperty('--button-text', '#b45309');
            
            // Compress the image
            const compressedDataUrl = await compressImage(file);
            
            // Store the compressed image
            document.getElementById('edit-photo').value = compressedDataUrl;
            editPhotoText.textContent = 'Photo Updated ✓';
            
            // Change button to green to indicate success
            editPhotoBtn.className = 'shiny-button ripple-effect w-full';
            editPhotoBtn.style.setProperty('--button-bg', '#dcfce7');
            editPhotoBtn.style.setProperty('--button-text', '#166534');
            
            showMessage('Upload Successful', 'success');
            
        } catch (error) {
            console.error('Image compression failed:', error);
            showMessage('Failed to process image. Please try a different image.', 'error');
            e.target.value = '';
            editPhotoText.textContent = 'Photo Upload Failed';
            
            // Change button to red to indicate error
            editPhotoBtn.className = 'w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md border border-red-300 flex items-center justify-center gap-2';
        }
    };

    // Show the modal
    editModal.classList.remove('hidden');

    // Setup form submission
    const editForm = document.getElementById('edit-catch-form');
    editForm.onsubmit = (e) => {
        e.preventDefault();
        updateCatch();
    };    // Prevent Enter key from auto-advancing from location name to notes field
    const locationNameInput = document.getElementById('edit-location-name');
    
    // Remove any existing event listeners to prevent duplicates
    locationNameInput.removeEventListener('keydown', locationNameInput._enterHandler);
    
    // Create the handler function
    locationNameInput._enterHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event bubbling
            locationNameInput.blur(); // Remove focus and dismiss keyboard on mobile
            return false; // Extra prevention
        }
    };
    
    // Add the handler
    locationNameInput.addEventListener('keydown', locationNameInput._enterHandler);
    
    // Setup close button
    const closeBtn = document.getElementById('close-edit-modal-btn');
    closeBtn.onclick = () => editModal.classList.add('hidden');

    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
    });
}

function updateCatch() {
    const catchId = document.getElementById('edit-catch-id').value;
    const species = document.getElementById('edit-species').value.trim();
    const length = parseFloat(document.getElementById('edit-length').value);
    const weight = parseFloat(document.getElementById('edit-weight').value);
    const datetime = document.getElementById('edit-datetime').value;    const locationName = document.getElementById('edit-location-name').value.trim();
    const notes = document.getElementById('edit-notes').value.trim();
    const latitude = document.getElementById('edit-latitude').value;
    const longitude = document.getElementById('edit-longitude').value;
    const photo = document.getElementById('edit-photo').value;// Validate required fields - only species and datetime are required
    if (!species || !datetime) {
        showMessage('Please fill in all required fields (species and date/time)', 'error');
        return;
    }

    // Validate length and weight if provided (must be positive numbers)
    if (document.getElementById('edit-length').value && (isNaN(length) || length <= 0)) {
        showMessage('Length must be a positive number', 'error');
        return;
    }

    if (document.getElementById('edit-weight').value && (isNaN(weight) || weight <= 0)) {
        showMessage('Weight must be a positive number', 'error');
        return;
    }

    // Get existing catches
    let catches = JSON.parse(localStorage.getItem('catches') || '[]');
    
    // Find and update the catch
    const catchIndex = catches.findIndex(c => c.id === catchId);
    if (catchIndex !== -1) {        catches[catchIndex] = {
            ...catches[catchIndex],
            species,
            length: isNaN(length) || !document.getElementById('edit-length').value ? null : length,
            weight: isNaN(weight) || !document.getElementById('edit-weight').value ? null : weight,
            datetime,
            locationName: locationName || null,
            notes: notes || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            photo: photo || null,
            lastModified: Date.now()
        };        // Save back to localStorage with error handling
        try {
            localStorage.setItem('catches', JSON.stringify(catches));
        } catch (storageError) {
            console.error('localStorage error:', storageError);
            if (storageError.name === 'QuotaExceededError') {
                // Remove the photo data and try again
                catches[catchIndex].photo = null;
                localStorage.setItem('catches', JSON.stringify(catches));
                showMessage('Catch updated successfully! Photo was too large and could not be saved.', 'warning');
            } else {
                showMessage('Error updating catch. Please try again.', 'error');
                return;
            }
        }        
        // Hide edit modal
        document.getElementById('edit-modal').classList.add('hidden');
          // Refresh displays
        loadCatchHistory();
        if (!document.getElementById('records-container').classList.contains('hidden')) {
            displayRecords();
        }
        
        // Refresh map if the map tab is currently active
        refreshMapIfVisible();
        
        if (!document.getElementById('message-box').textContent.includes('Photo was too large')) {
            showMessage('Catch updated successfully');
        }
    } else {
        showMessage('Error updating catch. Please try again.', 'error');
    }
}

function displayRecords() {
    const catches = JSON.parse(localStorage.getItem('catches') || '[]');
    const recordsContainer = document.getElementById('records-container');
    
    if (catches.length === 0) {
        recordsContainer.innerHTML = '<p class="text-gray-500 italic">No records yet.</p>';
        return;
    }

    // Group catches by species and find the best overall catch
    // Since longest fish is generally heaviest, we'll prioritize by length
    const speciesRecords = {};
    catches.forEach(catch_ => {
        if (!catch_.length || catch_.length <= 0) return; // Skip catches without valid length
        
        if (!speciesRecords[catch_.species] || catch_.length > speciesRecords[catch_.species].length) {
            speciesRecords[catch_.species] = catch_;
        }
    });

    // Display consolidated records with click handlers
    recordsContainer.innerHTML = Object.entries(speciesRecords)
        .sort(([,a], [,b]) => b.length - a.length) // Sort by length descending
        .map(([species, record]) => `
            <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" data-catch-id="${record.id}">
                <div class="flex items-start gap-4">
                    <div class="flex-grow">
                        <h3 class="text-lg font-semibold text-blue-700 mb-2">${cleanSpeciesName(species)}</h3>
                        <div class="space-y-1">
                            <p class="text-sm text-gray-600">
                                <span class="font-medium">Length:</span> ${record.length}cm
                                ${record.weight ? ` • <span class="font-medium">Weight:</span> ${Number(record.weight).toFixed(3)}kg` : ''}
                            </p>
                            <p class="text-xs text-gray-500">
                                ${new Date(record.datetime).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                                ${record.locationName ? ` • ${record.locationName}` : ''}
                            </p>
                        </div>
                    </div>
                    ${record.photo ? `
                        <div class="flex-shrink-0">
                            <img src="${record.photo}" alt="Record catch" class="w-16 h-16 object-cover rounded-md">
                        </div>
                    ` : ''}
                </div>
            </div>
        `)
        .join('');    // Add click handlers for record entries
    recordsContainer.querySelectorAll('[data-catch-id]').forEach(element => {
        element.addEventListener('click', () => {
            const catchId = element.dataset.catchId;
            const catchData = catches.find(c => c.id === catchId);
            if (catchData) {
                showCatchModal(catchData);
            }
        });
    });
}

function closeFullscreenImage() {
    const fullscreenModal = document.getElementById('fullscreen-image');
    
    // Aggressively hide modal using multiple methods
    fullscreenModal.classList.add('hidden');
    fullscreenModal.style.display = 'none';
    fullscreenModal.style.visibility = 'hidden';
    fullscreenModal.style.opacity = '0';
    fullscreenModal.style.zIndex = '-1';
    
    // Reset all image state when closing
    imageRotation = 0;
    currentScale = 1;
    currentTranslateX = 0;
    currentTranslateY = 0;
    isZoomed = false;
    
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    fullscreenImage.style.transform = '';
    fullscreenImage.style.maxWidth = '100vw';
    fullscreenImage.style.maxHeight = '100vh';
    fullscreenImage.style.width = 'auto';
    fullscreenImage.style.height = 'auto';
    fullscreenImage.src = '';
    fullscreenImage.alt = '';
    
    // Remove touch handlers
    removeImageTouchHandlers(fullscreenImage);
}

// Reset fullscreen modal to initial state
function resetFullscreenModal() {
    console.log('=== RESETTING FULLSCREEN MODAL ===');
    const fullscreenModal = document.getElementById('fullscreen-image');
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    
    if (fullscreenModal) {
        // Aggressively hide modal using multiple methods
        fullscreenModal.classList.add('hidden');
        fullscreenModal.style.display = 'none';
        fullscreenModal.style.visibility = 'hidden';
        fullscreenModal.style.opacity = '0';
        fullscreenModal.style.zIndex = '-1';
        console.log('Fullscreen modal aggressively hidden');
    }
    
    if (fullscreenImage) {
        // Clear image source and reset all transform state
        fullscreenImage.src = '';
        fullscreenImage.alt = '';
        fullscreenImage.style.transform = '';
        fullscreenImage.style.maxWidth = '100vw';
        fullscreenImage.style.maxHeight = '100vh';
        fullscreenImage.style.width = 'auto';
        fullscreenImage.style.height = 'auto';
        console.log('Fullscreen image cleared and reset');
    }
    
    // Reset rotation and zoom state
    imageRotation = 0;
    currentScale = 1;
    currentTranslateX = 0;
    currentTranslateY = 0;
    isZoomed = false;
    
    console.log('Fullscreen modal state reset complete');
}

// Handle rotate button clicks with mobile touch support and debouncing
function handleRotateClick(event) {
    // Check if fullscreen modal is actually visible before rotating
    const fullscreenModal = document.getElementById('fullscreen-image');
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    
    if (!fullscreenModal || fullscreenModal.classList.contains('hidden')) {
        console.log('Rotate button clicked but fullscreen modal is not visible - ignoring');
        return;
    }
    
    if (!fullscreenImage || !fullscreenImage.src || fullscreenImage.src.trim() === '') {
        console.log('Rotate button clicked but no image is loaded - ignoring');
        return;
    }
    
    // Prevent default behavior and stop propagation
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Debounce multiple rapid calls (common on mobile)
    if (window.rotateClickTimeout) {
        clearTimeout(window.rotateClickTimeout);
    }
    
    window.rotateClickTimeout = setTimeout(() => {
        rotateFullscreenImage();
        window.rotateClickTimeout = null;
    }, 100); // 100ms debounce
}

function rotateFullscreenImage() {
    // Toggle between 0 and 90 degrees only (portrait and landscape)
    imageRotation = imageRotation === 0 ? 90 : 0;
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    
    // Reset any zoom/pan transformations when rotating
    currentScale = 1;
    currentTranslateX = 0;
    currentTranslateY = 0;
    isZoomed = false;
    
    // Optimize sizing for rotation
    if (imageRotation === 90) {
        // Landscape mode: swap dimensions for optimal screen usage
        fullscreenImage.style.maxWidth = '100vh';
        fullscreenImage.style.maxHeight = '100vw';
        fullscreenImage.style.width = 'auto';
        fullscreenImage.style.height = '100vh';
    } else {
        // Portrait mode: normal dimensions
        fullscreenImage.style.maxWidth = '100vw';
        fullscreenImage.style.maxHeight = '100vh';
        fullscreenImage.style.width = 'auto';
        fullscreenImage.style.height = 'auto';
    }
    
    // Apply all transformations using the helper function
    updateImageTransform();
}

// Helper function to clean up species names for display
function cleanSpeciesName(name) {
    // Remove (M&F) or similar gender indicators
    return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Species Management Functions
function setupSpeciesHandlers() {
    console.log('=== SETTING UP SPECIES HANDLERS ===');
    const speciesInput = document.getElementById('species');
    const speciesDropdown = document.getElementById('species-dropdown');
    const manageSpeciesBtn = document.getElementById('manage-species-btn');
    
    console.log('Species DOM elements:', {
        speciesInput: !!speciesInput,
        speciesDropdown: !!speciesDropdown,
        manageSpeciesBtn: !!manageSpeciesBtn
    });
    
    if (!speciesInput || !speciesDropdown) {
        console.error('Critical species DOM elements not found!');
        return;
    }
    
    // Initialize species list if empty
    if (!localStorage.getItem('species')) {
        const defaultSpecies = [
            'Bass', 'Trout', 'Salmon', 'Pike', 'Catfish', 'Perch', 'Carp'
        ].map(name => ({ name, isCustom: false }));
        localStorage.setItem('species', JSON.stringify(defaultSpecies));
    }

    async function refreshSpeciesList() {
        console.log('=== REFRESH SPECIES LIST START ===');
        let speciesList = JSON.parse(localStorage.getItem('species') || '[]');
        console.log('Current species list:', speciesList);
        
        // Add species from fish database if available
        if (window.fishDB && await window.fishDB.isReady()) {
            console.log('Fish database is ready, getting species names...');
            const dbSpecies = window.fishDB.getSpeciesNames();
            console.log('Database species:', dbSpecies);
            
            // Add database species that aren't already in the list
            let addedCount = 0;
            dbSpecies.forEach(dbSpeciesName => {
                const exists = speciesList.some(species => 
                    species.name.toLowerCase() === dbSpeciesName.toLowerCase()
                );
                if (!exists) {
                    speciesList.push({ 
                        name: dbSpeciesName, 
                        isCustom: false, 
                        isFromDatabase: true 
                    });
                    addedCount++;
                    console.log('Added database species:', dbSpeciesName);
                }
            });
            
            console.log(`Added ${addedCount} species from database`);
            
            // Update localStorage with combined list
            localStorage.setItem('species', JSON.stringify(speciesList));
            console.log('Updated species list saved to localStorage');
        } else {
            console.log('Fish database not ready or not available');
        }
        
        console.log('Final species list:', speciesList);
        
        // Update dropdown if it's visible
        if (!speciesDropdown.classList.contains('hidden')) {
            const searchTerm = speciesInput.value.toLowerCase();
            const matches = speciesList.filter(species => 
                species.name.toLowerCase().startsWith(searchTerm)
            );
            await updateSpeciesDropdown(matches);
        }
        
        // Update manager list if it's visible
        if (!document.getElementById('manage-species-modal').classList.contains('hidden')) {
            displayCustomSpeciesList();
        }
        
        console.log('=== REFRESH SPECIES LIST END ===');
    }

    // Make refreshSpeciesList globally accessible for database initialization
    window.refreshSpeciesList = refreshSpeciesList;    async function updateSpeciesDropdown(matches) {
        const isDbReady = window.fishDB && await window.fishDB.isReady();
        
        if (matches.length > 0) {
            const dropdownHTML = await Promise.all(matches.map(async species => {
                let cleanName = cleanSpeciesName(species.name);
                let speciesInfo = '';
                if (isDbReady && species.isFromDatabase) {
                    const info = window.fishDB.getSpeciesInfo(species.name);
                    if (info) {
                        const edibleIcon = info.edible ? '🐟' : '🦈';
                        const accuracyPercent = (info.accuracy * 100).toFixed(0);
                        speciesInfo = ` <small class="text-gray-500">${edibleIcon} ${accuracyPercent}%</small>`;
                    }
                }
                
                return `
                    <div class="species-option px-4 py-2 hover:bg-gray-100 cursor-pointer" data-original-name="${species.name}">
                        ${cleanName}${speciesInfo}
                    </div>
                `;
            }));
            
            speciesDropdown.innerHTML = dropdownHTML.join('');
        } else {
            speciesDropdown.innerHTML = `
                <div class="species-option px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    Add "${speciesInput.value}" as new species
                </div>
            `;
        }        // Handle species selection with better mobile support
        speciesDropdown.querySelectorAll('.species-option').forEach(option => {
            let touchStartY = 0;
            let touchStartTime = 0;
              const handleSelection = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (option.textContent.includes('Add "')) {
                    // Show add species modal with the current input value
                    document.getElementById('species-modal').classList.remove('hidden');
                    document.getElementById('new-species-name').value = speciesInput.value;
                    document.getElementById('new-species-name').focus();
                } else {
                    // Always use the cleaned name for display in the input field
                    const originalName = option.dataset.originalName;
                    speciesInput.value = cleanSpeciesName(originalName || option.textContent.trim());
                    
                    // Automatically focus on the length input field
                    setTimeout(() => {
                        const lengthInput = document.getElementById('length');
                        if (lengthInput) {
                            lengthInput.focus();
                        }
                    }, 100); // Small delay to ensure dropdown closes first
                }
                speciesDropdown.classList.add('hidden');
            };
            
            // Track touch start to distinguish between tap and scroll
            option.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }, { passive: true });
            
            // Only handle selection if it's a short tap, not a scroll
            option.addEventListener('touchend', (e) => {
                const touchEndY = e.changedTouches[0].clientY;
                const touchDuration = Date.now() - touchStartTime;
                const touchDistance = Math.abs(touchEndY - touchStartY);
                
                // Only trigger if it's a quick tap with minimal movement
                if (touchDuration < 500 && touchDistance < 10) {
                    handleSelection(e);
                }
            }, { passive: false });
            
            // Add click event for desktop
            option.addEventListener('click', handleSelection);
        });
        speciesDropdown.classList.remove('hidden');
    }

    // Handle species input
    speciesInput.addEventListener('input', () => {
        const searchTerm = speciesInput.value.toLowerCase();
        if (searchTerm.length === 0) {
            speciesDropdown.classList.add('hidden');
            return;
        }

        const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
        const matches = speciesList.filter(species => 
            species.name.toLowerCase().startsWith(searchTerm)
        );
        updateSpeciesDropdown(matches);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!speciesInput.contains(e.target) && !speciesDropdown.contains(e.target)) {
            speciesDropdown.classList.add('hidden');
        }
    });

    // Setup manage species modal
    manageSpeciesBtn.addEventListener('click', () => {
        // Disable the button to prevent double-clicking
        manageSpeciesBtn.disabled = true;
        manageSpeciesBtn.style.pointerEvents = 'none';
        manageSpeciesBtn.style.opacity = '0.5';
        
        document.getElementById('manage-species-modal').classList.remove('hidden');
        displayCustomSpeciesList();
    });

    // Setup add new species functionality
    const addSpeciesBtn = document.getElementById('add-species-btn');
    const speciesForm = document.getElementById('species-form');
    const speciesModal = document.getElementById('species-modal');

    addSpeciesBtn.addEventListener('click', () => {
        speciesModal.classList.remove('hidden');
        document.getElementById('new-species-name').value = '';
        document.getElementById('new-species-name').focus();
    });

    // Handle species form submission
    speciesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSpeciesName = document.getElementById('new-species-name').value.trim();
        
        if (!newSpeciesName) {
            showMessage('Please enter a species name', 'error');
            return;
        }

        const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
        
        // Check for duplicates
        if (speciesList.some(species => species.name.toLowerCase() === newSpeciesName.toLowerCase())) {
            showMessage('This species already exists', 'error');
            return;
        }

        // Add new species
        speciesList.push({ name: newSpeciesName, isCustom: true });
        localStorage.setItem('species', JSON.stringify(speciesList));
        
        // Update UI
        speciesModal.classList.add('hidden');
        document.getElementById('new-species-name').value = '';
        await refreshSpeciesList();
        showMessage('Species added successfully');
    });

    // Handle modal close buttons
    document.getElementById('close-manage-species-btn').addEventListener('click', () => {
        document.getElementById('manage-species-modal').classList.add('hidden');
        
        // Re-enable the manage species button
        manageSpeciesBtn.disabled = false;
        manageSpeciesBtn.style.pointerEvents = 'auto';
        manageSpeciesBtn.style.opacity = '1';
    });

    document.getElementById('cancel-species-btn').addEventListener('click', () => {
        speciesModal.classList.add('hidden');
    });

    // Add click-outside handlers for modals
    [speciesModal, document.getElementById('manage-species-modal')].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                
                // If it's the manage species modal, re-enable the button
                if (modal.id === 'manage-species-modal') {
                    manageSpeciesBtn.disabled = false;
                    manageSpeciesBtn.style.pointerEvents = 'auto';
                    manageSpeciesBtn.style.opacity = '1';
                }
            }
        });
    });

    // Initial refresh to include any already-loaded database species
    setTimeout(async () => {
        console.log('Running initial species list refresh...');
        await refreshSpeciesList();
        console.log('Initial species list refresh completed');
    }, 50);
}

function displayCustomSpeciesList() {
    const customSpeciesList = document.getElementById('custom-species-list');
    const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
    const customSpecies = speciesList.filter(species => species.isCustom);
    
    if (customSpecies.length === 0) {
        customSpeciesList.innerHTML = `
            <p class="text-gray-500 italic">No custom species added yet.</p>
        `;
        return;
    }

    customSpeciesList.innerHTML = customSpecies
        .map(species => `
            <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span class="flex-grow">${species.name}</span>
                <button class="delete-species-btn text-red-600 hover:text-red-700 p-1" 
                        data-species="${species.name}" 
                        title="Delete species">
                    🗑️
                </button>
            </div>
        `)
        .join('');

    // Handle delete buttons
    customSpeciesList.querySelectorAll('.delete-species-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speciesName = btn.dataset.species;
            showConfirmationModal(
                'Delete Species',
                `Are you sure you want to delete "${speciesName}"? This will not affect your existing catch records.`,
                'Delete',
                () => {
                    const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
                    const updatedList = speciesList.filter(s => s.name !== speciesName);
                    localStorage.setItem('species', JSON.stringify(updatedList));
                    displayCustomSpeciesList();
                    showMessage('Species deleted successfully');
                }
            );
        });
    });
}

// Location Handling Functions
function setupLocationHandling() {
    // Location handling is now managed by the map modal
    // This function is kept for the location name modal functionality only
    const locationNameModal = document.getElementById('location-name-modal');
    const locationNameForm = document.getElementById('location-name-form');
    const modalLocationNameInput = document.getElementById('modal-location-name-input');

    // Handle location name form submission (used by map modal)
    if (locationNameForm) {
        locationNameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const locationName = modalLocationNameInput.value.trim();
            
            if (!locationName) {
                showMessage('Please enter a location name', 'error');
                return;
            }

            // Save location name to form
            document.getElementById('location-name').value = locationName;
            const locationStatus = document.getElementById('location-status');
            locationStatus.textContent = `Location name: ${locationName}`;
            locationStatus.className = 'text-sm text-green-600';
            
            // Hide modal and reset
            locationNameModal.classList.add('hidden');
            showMessage('Location: Success', 'success');
        });
    }

    // Handle cancel button
    const cancelBtn = document.getElementById('cancel-location-name-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            locationNameModal.classList.add('hidden');
            const locationStatus = document.getElementById('location-status');
            locationStatus.textContent = 'Location not saved.';
            // Clear the hidden inputs
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            document.getElementById('location-name').value = '';
            modalLocationNameInput.value = '';
        });
    }
}

// Photo Handling Functions with Compression
function setupPhotoHandling() {
    const photoInput = document.getElementById('photo');
    const photoUploadBtn = document.getElementById('photo-upload-btn');
    
    // Handle button click to trigger file input
    if (photoUploadBtn) {
        photoUploadBtn.addEventListener('click', () => {
            photoInput.click();
        });
    }
    
    photoInput.addEventListener('change', handlePhotoUpload);
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    const photoUploadBtn = document.getElementById('photo-upload-btn');
    const photoBtnText = document.getElementById('photo-btn-text');
    const helperText = document.getElementById('photo-helper-text');
    
    if (!file) {
        // Reset to default state if no file selected
        photoUploadBtn.className = 'shiny-button ripple-effect w-full';
        photoBtnText.textContent = 'Add Photo';
        helperText.textContent = 'Upload a photo of your catch (optional)';
        helperText.className = 'text-xs text-gray-500 mt-1';
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        photoUploadBtn.className = 'shiny-button ripple-effect w-full';
        photoUploadBtn.style.setProperty('--button-bg', '#fee2e2');
        photoUploadBtn.style.setProperty('--button-text', '#b91c1c');
        photoBtnText.textContent = 'Invalid file type';
        helperText.textContent = 'Please select a valid image file';
        helperText.className = 'text-xs text-red-500 mt-1';
        showMessage('Please select a valid image file.', 'error');
        event.target.value = '';
        return;
    }

    // Validate file size (max 50MB raw file)
    const maxRawFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxRawFileSize) {
        photoUploadBtn.className = 'shiny-button ripple-effect w-full';
        photoUploadBtn.style.setProperty('--button-bg', '#fee2e2');
        photoUploadBtn.style.setProperty('--button-text', '#b91c1c');
        photoBtnText.textContent = 'File too large';
        helperText.textContent = 'Image file too large (max 50MB)';
        helperText.className
        showMessage('Image file is too large. Please choose a smaller image (max 50MB).', 'error');
        event.target.value = '';
        return;
    }

    try {
        // Show processing state
        photoUploadBtn.className = 'shiny-button ripple-effect w-full';
        photoUploadBtn.style.setProperty('--button-bg', '#fef3c7');
        photoUploadBtn.style.setProperty('--button-text', '#92400e');
        photoBtnText.textContent = 'Processing...';
        helperText.textContent = 'Processing image...';
        helperText.className = 'text-xs text-yellow-600 mt-1';
        showMessage('Processing image...', 'info');
        
        // Compress the image
        const compressedDataUrl = await compressImage(file);
        
        // Store the compressed image data URL
        event.target.dataset.imageData = compressedDataUrl;
        
        // Calculate compressed size for user feedback
        const compressedSizeKB = Math.round((compressedDataUrl.length * 0.75) / 1024); // Approximate size in KB
          // Show success state
        photoUploadBtn.className = 'shiny-button ripple-effect w-full';
        photoUploadBtn.style.setProperty('--button-bg', '#dcfce7');
        photoUploadBtn.style.setProperty('--button-text', '#166534');
        photoBtnText.textContent = 'Photo Added ✓';
        helperText.textContent = 'Upload Successful';
        helperText.className = 'text-xs text-green-600 mt-1';
        showMessage('Upload Successful', 'success');
        
    } catch (error) {
        console.error('Image compression failed:', error);
        photoUploadBtn.className = 'shiny-button ripple-effect w-full';
        photoUploadBtn.style.setProperty('--button-bg', '#fee2e2');
        photoUploadBtn.style.setProperty('--button-text', '#b91c1c');
        photoBtnText.textContent = 'Failed to process';
        helperText.textContent = 'Failed to process image';
        helperText.className = 'text-xs text-red-500 mt-1';
        showMessage('Failed to process image. Please try a different image.', 'error');
        event.target.value = '';
    }
}

// Image compression function
function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            try {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;
                
                // Calculate scaling factor
                const scaleX = maxWidth / width;
                const scaleY = maxHeight / height;
                const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
                
                const newWidth = Math.round(width * scale);
                const newHeight = Math.round(height * scale);
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Draw with high quality settings
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Convert to compressed JPEG
                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Check if still too large for localStorage (aim for <2MB base64)
                const maxBase64Size = 2 * 1024 * 1024; // 2MB
                if (compressedDataUrl.length > maxBase64Size) {
                    console.log('Image still too large, reducing quality further...');
                    
                    // Try with lower quality
                    compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    
                    // If still too large, reduce dimensions further
                    if (compressedDataUrl.length > maxBase64Size) {
                        console.log('Reducing dimensions further...');
                        return compressImage(file, 800, 800, 0.5).then(resolve).catch(reject);
                    }
                }
                
                console.log(`Image compressed: ${Math.round(file.size/1024)}KB → ${Math.round(compressedDataUrl.length*0.75/1024)}KB`);
                resolve(compressedDataUrl);
                
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        // Create object URL for the image to avoid memory issues with large files
        img.src = URL.createObjectURL(file);
    });
}

function showFullscreenImage(imageUrl) {
    console.log('showFullscreenImage called with:', imageUrl);
    
    // Validate image URL
    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'undefined' || imageUrl === 'null') {
        console.warn('showFullscreenImage called with invalid image URL:', imageUrl);
        return;
    }
    
    const fullscreenModal = document.getElementById('fullscreen-image');
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    
    if (!fullscreenModal || !fullscreenImage) {
        console.error('Fullscreen modal elements not found');
        return;
    }
    
    // Reset rotation, zoom, and sizing for new image
    imageRotation = 0;
    currentScale = 1;
    currentTranslateX = 0;
    currentTranslateY = 0;
    isZoomed = false;
    
    fullscreenImage.style.transform = '';
    fullscreenImage.style.maxWidth = '100vw';
    fullscreenImage.style.maxHeight = '100vh';
    fullscreenImage.style.width = 'auto';
    fullscreenImage.style.height = 'auto';
      // Set image source and show modal
    fullscreenImage.src = imageUrl;
    fullscreenImage.alt = 'Full size catch photo';
    
    // Restore modal visibility using multiple methods
    fullscreenModal.classList.remove('hidden');
    fullscreenModal.style.display = 'flex';
    fullscreenModal.style.visibility = 'visible';
    fullscreenModal.style.opacity = '1';
    fullscreenModal.style.zIndex = '1300';
    
    console.log('Fullscreen modal shown with image:', imageUrl);
    
    // Setup touch handlers for zoom and pan
    setupImageTouchHandlers(fullscreenImage);
}

// Touch handling for fullscreen image zoom and pan
function setupImageTouchHandlers(imageElement) {
    let initialDistance = 0;
    let initialScale = 1;
    let initialX = 0;
    let initialY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let touchStartY = 0;
    let touchCount = 0;
    
    // Prevent default touch behaviors
    imageElement.style.touchAction = 'none';
    
    function handleTouchStart(e) {
        e.preventDefault();
        touchCount = e.touches.length;
        
        if (touchCount === 1) {
            // Single touch - prepare for pan or swipe
            const touch = e.touches[0];
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            touchStartY = touch.clientY;
        } else if (touchCount === 2) {
            // Two fingers - prepare for pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            initialDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            initialScale = currentScale;
            
            // Get center point of pinch
            initialX = (touch1.clientX + touch2.clientX) / 2;
            initialY = (touch1.clientY + touch2.clientY) / 2;
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        
        if (touchCount === 1 && isZoomed) {
            // Single touch pan when zoomed
            const touch = e.touches[0];
            const deltaX = touch.clientX - lastTouchX;
            const deltaY = touch.clientY - lastTouchY;
            
            currentTranslateX += deltaX;
            currentTranslateY += deltaY;
            
            updateImageTransform();
            
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
        } else if (touchCount === 2) {
            // Two finger pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const scale = (currentDistance / initialDistance) * initialScale;
            currentScale = Math.max(1, Math.min(scale, 4)); // Limit zoom between 1x and 4x
            
            // Update zoom state
            isZoomed = currentScale > 1;
            
            updateImageTransform();
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        
        // Check for swipe up to exit when not zoomed
        if (touchCount === 1 && !isZoomed && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const swipeDistance = touchStartY - touch.clientY;
            const swipeThreshold = 100; // pixels
            
            if (swipeDistance > swipeThreshold) {
                // Swipe up detected - exit fullscreen
                closeFullscreenImage();
                return;
            }
        }
        
        touchCount = Math.max(0, touchCount - e.changedTouches.length);
        
        // Reset to fit if zoomed out completely
        if (currentScale <= 1) {
            currentScale = 1;
            currentTranslateX = 0;
            currentTranslateY = 0;
            isZoomed = false;
            updateImageTransform();
        }
    }
    
    // Store handlers for removal later
    imageElement._touchHandlers = {
        touchstart: handleTouchStart,
        touchmove: handleTouchMove,
        touchend: handleTouchEnd
    };
    
    // Add event listeners
    imageElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    imageElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    imageElement.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function removeImageTouchHandlers(imageElement) {
    if (imageElement._touchHandlers) {
        imageElement.removeEventListener('touchstart', imageElement._touchHandlers.touchstart);
        imageElement.removeEventListener('touchmove', imageElement._touchHandlers.touchmove);
        imageElement.removeEventListener('touchend', imageElement._touchHandlers.touchend);
        delete imageElement._touchHandlers;
    }
    
    // Reset touch action
    imageElement.style.touchAction = 'pinch-zoom';
}

// Helper function to update image transform
function updateImageTransform() {
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    if (!fullscreenImage) return;
    
    const rotateTransform = `rotate(${imageRotation}deg)`;
    const scaleTransform = `scale(${currentScale})`;
    const translateTransform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
    
    fullscreenImage.style.transform = `${rotateTransform} ${scaleTransform} ${translateTransform}`;
}

// Message handling function
function showMessage(message, type = 'info') {
    // Create or get the sliding notification container
    let slideNotification = document.getElementById('slide-notification');
    if (!slideNotification) {
        slideNotification = document.createElement('div');
        slideNotification.id = 'slide-notification';
        slideNotification.className = 'slide-notification';
        document.body.appendChild(slideNotification);
    }
    
    // Set message content
    slideNotification.textContent = message;
    
    // Set colors based on type
    let bgColor, textColor;
    switch(type) {
        case 'error':
            bgColor = 'bg-red-100';
            textColor = 'text-red-700';
            break;
        case 'success':
            bgColor = 'bg-green-100';
            textColor = 'text-green-700';
            break;
        default:
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-700';
    }
    
    // Apply styling
    slideNotification.className = `slide-notification p-3 rounded-md text-sm font-medium ${bgColor} ${textColor}`;
    
    // Position the notification to cover the location status area
    const locationStatus = document.getElementById('location-status');
    if (locationStatus) {
        const rect = locationStatus.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        slideNotification.style.position = 'absolute';
        slideNotification.style.top = (rect.top + scrollTop) + 'px';
        slideNotification.style.left = '-' + (rect.width + 20) + 'px'; // Start off-screen to the left
        slideNotification.style.width = rect.width + 'px'; // Match location status width
        slideNotification.style.height = rect.height + 'px'; // Match location status height
        slideNotification.style.zIndex = '1000';
        slideNotification.style.transition = 'left 0.4s ease-in-out';
        slideNotification.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.1)';
        slideNotification.style.opacity = '1'; // Solid, not see-through
        slideNotification.style.backdropFilter = 'blur(8px)';
        slideNotification.style.display = 'flex';
        slideNotification.style.alignItems = 'center';
    }
    
    // Show notification with slide animation
    slideNotification.style.display = 'block';
    
    // Trigger slide-in animation
    setTimeout(() => {
        slideNotification.style.left = '10px'; // Slide in from left
    }, 50);
    
    // Auto-hide after duration with slide-out animation (half duration)
    const duration = type === 'success' ? 2000 : 1500; // Reduced from 4000/3000 to 2000/1500
    setTimeout(() => {
        // Slide out to the left
        slideNotification.style.left = '-' + (locationStatus ? locationStatus.getBoundingClientRect().width + 20 : 300) + 'px';
        
        // Hide completely after animation
        setTimeout(() => {
            slideNotification.style.display = 'none';
        }, 400);
    }, duration);
}

function loadCatchHistory() {
    const catches = JSON.parse(localStorage.getItem('catches') || '[]');
    const catchLog = document.getElementById('catch-log');

    if (catches.length === 0) {
        catchLog.innerHTML = '<p class="text-gray-500 italic">No catches logged yet.</p>';
        return;
    }

    // Sort catches by datetime, most recent first
    catches.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    catchLog.innerHTML = catches.map(catch_ => `
        <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" data-catch-id="${catch_.id}">
            <div class="flex justify-between items-start gap-4">
                <div class="flex-grow">
                    <h3 class="text-lg font-semibold text-blue-700">${cleanSpeciesName(catch_.species)}</h3>
                    <span class="text-sm text-gray-500">${new Date(catch_.datetime).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                    <div class="mt-2 space-y-1">
                        <p class="text-sm"><span class="font-medium">Length:</span> ${catch_.length}cm</p>
                        <p class="text-sm"><span class="font-medium">Weight:</span> ${Number(catch_.weight).toFixed(3)}kg</p>
                        ${catch_.locationName ? `
                            <p class="text-sm">
                                <span class="font-medium">Location:</span> ${catch_.locationName}
                            </p>
                        ` : ''}
                        ${catch_.notes ? `
                            <p class="text-sm text-gray-600 mt-2">${catch_.notes}</p>
                        ` : ''}
                    </div>                </div>
                ${catch_.photo ? `
                    <div class="flex-shrink-0">
                        <img src="${catch_.photo}" alt="Catch photo" class="w-32 h-32 object-cover rounded-md">
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Add click handlers for catch entries
    catchLog.querySelectorAll('[data-catch-id]').forEach(element => {
        element.addEventListener('click', () => {
            const catchId = element.dataset.catchId;
            const catchData = catches.find(c => c.id === catchId);
            if (catchData) {
                showCatchModal(catchData);
            }
        });
    });
}

function setupModalHandlers() {
    // Setup delete confirmation modal
    document.getElementById('confirm-action-btn').addEventListener('click', () => {
        const confirmationModal = document.getElementById('confirmation-modal');
        const catchId = confirmationModal.dataset.catchId;
        
        if (catchId) {
            deleteCatch(catchId);
            confirmationModal.classList.add('hidden');
        }
    });

    document.getElementById('cancel-action-btn').addEventListener('click', () => {
        document.getElementById('confirmation-modal').classList.add('hidden');
    });
}

function showConfirmationModal(title, message, actionText, onConfirm) {
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-action-btn');

    confirmationTitle.textContent = title;
    confirmationMessage.textContent = message;
    confirmBtn.textContent = actionText;

    // Store the callback
    confirmBtn.onclick = () => {
        onConfirm();
        confirmationModal.classList.add('hidden');
    };

    // Show the modal
    confirmationModal.classList.remove('hidden');

    // Close on outside click
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.classList.add('hidden');
        }
    });
}

// Update the showDeleteConfirmation function to use the generic confirmation modal
function showDeleteConfirmation(catchData) {
    showConfirmationModal(
        'Delete Catch',
        `Are you sure you want to delete this catch record? This action cannot be undone.`,
        'Delete',
        () => deleteCatch(catchData.id)
    );
}

function deleteCatch(catchId) {
    try {
        let catches = JSON.parse(localStorage.getItem('catches') || '[]');
        catches = catches.filter(c => c.id !== catchId);
        localStorage.setItem('catches', JSON.stringify(catches));
        
        // Close any open modals
        document.getElementById('catch-modal').classList.add('hidden');
          // Refresh displays
        loadCatchHistory();
        if (!document.getElementById('records-container').classList.contains('hidden')) {
            displayRecords();
        }
        
        // Refresh map if the map tab is currently active
        refreshMapIfVisible();
        
        showMessage('Catch deleted successfully');
    } catch (error) {
        console.error('Error deleting catch:', error);
        showMessage('Error deleting catch. Please try again.', 'error');
    }
}

// Initialize datetime with current time
function initializeDatetime() {
    const datetimeInput = document.getElementById('datetime');
    if (datetimeInput) {
        // Get current date and time in local timezone
        const now = new Date();
        // Format datetime to match the input format
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

function showCatchModal(catchData) {
    const catchModal = document.getElementById('catch-modal');
      // Fill in modal content
    document.getElementById('modal-species').textContent = cleanSpeciesName(catchData.species);
    document.getElementById('modal-date').textContent = new Date(catchData.datetime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('modal-length').textContent = `Length: ${catchData.length}cm`;
    document.getElementById('modal-weight').textContent = `Weight: ${Number(catchData.weight).toFixed(3)}kg`;
    
    const locationContainer = document.getElementById('modal-location-container');
    const locationName = document.getElementById('modal-location-name');
      if (catchData.locationName) {
        locationContainer.classList.remove('hidden');
        locationName.textContent = catchData.locationName;
    } else {
        locationContainer.classList.add('hidden');
    }
    
    const notes = document.getElementById('modal-notes');
    if (catchData.notes) {
        notes.textContent = catchData.notes;
        notes.classList.remove('hidden');
    } else {
        notes.classList.add('hidden');
    }
    
    const photoContainer = document.getElementById('modal-photo-container');
    const modalPhoto = document.getElementById('modal-photo');
    if (catchData.photo) {
        photoContainer.classList.remove('hidden');
        modalPhoto.src = catchData.photo;
        modalPhoto.onclick = () => showFullscreenImage(catchData.photo);
    } else {
        photoContainer.classList.add('hidden');
    }
    
    // Setup edit button
    document.getElementById('edit-catch-btn').onclick = () => {
        catchModal.classList.add('hidden');
        showEditModal(catchData);
    };
    
    // Setup delete button
    document.getElementById('delete-catch-btn').onclick = () => {
        catchModal.classList.add('hidden');
        showDeleteConfirmation(catchData);
    };
    
    // Show the modal
    catchModal.classList.remove('hidden');
    
    // Close modal when clicking outside
    catchModal.addEventListener('click', (e) => {
        if (e.target === catchModal) {
            catchModal.classList.add('hidden');
        }
    });

    // Setup close button
    document.getElementById('close-modal-btn').onclick = () => {
        catchModal.classList.add('hidden');
    };
}

// Function to show catch details from map popup
function showCatchFromMap(catchId) {
    console.log('=== showCatchFromMap START ===');
    console.log('Showing catch from map:', catchId);
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile:', /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
    
    // Get all catches from localStorage
    const catches = JSON.parse(localStorage.getItem('catches') || '[]');
    console.log('Total catches found:', catches.length);
    console.log('Available catch IDs:', catches.map(c => c.id));
    console.log('Looking for ID:', catchId, 'Type:', typeof catchId);
    
    // Find the specific catch - handle both string and number IDs
    const catchData = catches.find(catch_ => {
        console.log('Comparing:', catch_.id, 'with', catchId, 'Match:', catch_.id == catchId);
        return catch_.id == catchId || catch_.id === catchId;
    });
    
    if (!catchData) {
        console.error('Catch not found:', catchId);
        console.error('Available catches:', catches);
        
        // Mobile fallback: Try to find by partial ID match
        const partialMatch = catches.find(catch_ => 
            catch_.id.toString().includes(catchId.toString()) || 
            catchId.toString().includes(catch_.id.toString())
        );
        
        if (partialMatch) {
            console.log('Found partial match:', partialMatch);
            showCatchModal(partialMatch);
            return;
        }
        
        showMessage('Catch not found - please try again', 'error');
        return;
    }
      console.log('Found catch data:', catchData);
    
    // Stay on the Map tab - just show the modal directly
    console.log('Showing catch modal on Map tab');
    showCatchModal(catchData);
    console.log('=== showCatchFromMap END ===');
}

function setupDataOptions() {
    const dataOptionsBtn = document.getElementById('data-options-btn');
    const dataOptionsMenu = document.getElementById('data-options-menu');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataInput = document.getElementById('import-data-input');

    // Toggle data options menu
    dataOptionsBtn.addEventListener('click', () => {
        dataOptionsMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!dataOptionsBtn.contains(e.target) && !dataOptionsMenu.contains(e.target)) {
            dataOptionsMenu.classList.add('hidden');
        }
    });

    // Handle data export
    exportDataBtn.addEventListener('click', () => {
        const catches = JSON.parse(localStorage.getItem('catches') || '[]');
        const species = JSON.parse(localStorage.getItem('species') || '[]');
        const exportData = {
            catches,
            species,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fishing-log-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        dataOptionsMenu.classList.add('hidden');
        showMessage('Data exported successfully');
    });

    // Handle data import
    importDataInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    if (importData.catches && importData.species) {
                        localStorage.setItem('catches', JSON.stringify(importData.catches));
                        localStorage.setItem('species', JSON.stringify(importData.species));
                        loadCatchHistory();
                        if (!document.getElementById('records-container').classList.contains('hidden')) {
                            displayRecords();
                        }
                        showMessage('Data imported successfully');
                    } else {
                        throw new Error('Invalid data format');
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    showMessage('Error importing data. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
        dataOptionsMenu.classList.add('hidden');
        importDataInput.value = ''; // Reset input
    });
}

function setupTabSystem() {
    console.log('=== SETTING UP TAB SYSTEM ===');
    
    // Get tab buttons and content areas
    const historyTab = document.getElementById('history-tab-btn');
    const recordsTab = document.getElementById('records-tab-btn');
    const mapTab = document.getElementById('map-tab-btn');
      const catchLog = document.getElementById('catch-log');
    const recordsContainer = document.getElementById('records-container');
    const mapContainer = document.getElementById('map-view-container');
    
    console.log('Tab elements found:', {
        historyTab: !!historyTab,
        recordsTab: !!recordsTab,
        mapTab: !!mapTab,
        catchLog: !!catchLog,
        recordsContainer: !!recordsContainer,
        mapContainer: !!mapContainer
    });    // Function to switch tabs and reposition label
    function switchTab(activeTab, activeContent) {
        // Remove active class from all tab buttons
        [historyTab, recordsTab, mapTab].forEach(tab => {
            if (tab) {
                tab.classList.remove('active');
            }
        });
        
        // Hide all content areas
        [catchLog, recordsContainer, mapContainer].forEach(content => {
            if (content) {
                content.classList.add('hidden');
            }
        });
        
        // Activate the selected tab and content
        if (activeTab) {
            activeTab.classList.add('active');
            
            // Update the label text and position it next to the active tab
            const label = activeTab.getAttribute('data-label');
            const labelElement = document.getElementById('active-tab-label');
            if (labelElement && label) {
                labelElement.textContent = label;
                
                // Remove the label from its current position
                labelElement.remove();
                
                // Insert the label after the active tab
                activeTab.insertAdjacentElement('afterend', labelElement);
            }
        }
        
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    }
      // History tab click handler
    if (historyTab) {
        historyTab.addEventListener('click', () => {
            console.log('History tab clicked');
            switchTab(historyTab, catchLog);
        });
    }
    
    // Records tab click handler
    if (recordsTab) {
        recordsTab.addEventListener('click', () => {
            console.log('Records tab clicked');
            switchTab(recordsTab, recordsContainer);
            displayRecords(); // Load records when tab is clicked
        });
    }
      // Map tab click handler
    if (mapTab) {
        mapTab.addEventListener('click', () => {
            console.log('Map tab clicked');
            switchTab(mapTab, mapContainer);
            
            // Initialize or refresh map view
            setTimeout(() => {
                setupMainMap();
            }, 100);
        });
    }
    
    // Initialize - make sure History tab is active by default
    if (historyTab) {
        switchTab(historyTab, catchLog);
    }
    
    console.log('Tab system setup complete');
}

// Compatibility function for any legacy references
function setupViewToggle() {
    console.warn('setupViewToggle is deprecated, using setupTabSystem instead');
    setupTabSystem();
}

// Map functionality
function setupMapHandlers() {
    console.log('Setting up map handlers...');
    
    // Map modal buttons
    const closeMapModalBtn = document.getElementById('close-map-modal-btn');
    const cancelMapModalBtn = document.getElementById('cancel-map-modal-btn');
    const useCurrentLocationBtn = document.getElementById('use-current-location-btn');
    const saveMapLocationBtn = document.getElementById('save-map-location-btn');
    
    if (closeMapModalBtn) {
        closeMapModalBtn.addEventListener('click', closeMapModal);
    }
    
    if (cancelMapModalBtn) {
        cancelMapModalBtn.addEventListener('click', closeMapModal);
    }
    
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', useCurrentLocationOnMap);
    }
    
    if (saveMapLocationBtn) {
        saveMapLocationBtn.addEventListener('click', saveSelectedLocation);
    }      // Setup the location button to open map modal (don't replace, just add listener)
    const getLocationBtn = document.getElementById('get-location-btn');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', openMapModal);
    }
    
    // Setup the edit location button to open map modal in edit mode
    const editLocationBtn = document.getElementById('edit-location-btn');
    if (editLocationBtn) {
        editLocationBtn.addEventListener('click', () => {
            const mapModal = document.getElementById('map-modal');
            mapModal.dataset.editMode = 'true';
            openMapModal();
        });
    }
}

function openMapModal() {
    console.log('Opening map modal...');
    const mapModal = document.getElementById('map-modal');
    mapModal.classList.remove('hidden');
    
    // Initialize map if not already done
    setTimeout(() => {
        if (!map) {
            initializeMap();
        } else {
            map.invalidateSize();
        }
    }, 100);
}

function closeMapModal() {
    console.log('Closing map modal...');
    const mapModal = document.getElementById('map-modal');
    mapModal.classList.add('hidden');
    
    // Reset modal state
    selectedLatitude = null;
    selectedLongitude = null;
    document.getElementById('location-name-input').value = '';
    document.getElementById('coord-display').textContent = 'No location selected';
    document.getElementById('save-map-location-btn').disabled = true;
    
    // Clean up markers
    if (currentMarker && map) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }
    
    if (currentLocationMarker && map) {
        map.removeLayer(currentLocationMarker);
        currentLocationMarker = null;
    }
}

function initializeMap() {
    console.log('Initializing map...');
    
    try {
        // Try to get user's current location first
        if (navigator.geolocation) {
            console.log('Getting user location for map...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    console.log('User location obtained:', userLat, userLng);
                    
                    // Initialize map with user's location
                    map = L.map('map-container').setView([userLat, userLng], 13);
                    
                    // Add OpenStreetMap tiles
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);
                    
                    // Add click handler
                    map.on('click', onMapClick);
                    
                    // Add a marker showing user's current location
                    currentLocationMarker = L.marker([userLat, userLng])
                        .addTo(map)
                        .bindPopup('📍 Your current location')
                        .openPopup();
                    
                    console.log('Map initialized successfully with user location');
                },
                (error) => {
                    console.warn('Failed to get user location:', error.message);
                    initializeMapWithDefault();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            console.warn('Geolocation not supported');
            initializeMapWithDefault();
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        initializeMapWithDefault();
    }
}

function initializeMapWithDefault() {
    console.log('Initializing map with default location (Cape Town)...');
    
    try {
        // Fallback to Cape Town, South Africa
        const defaultLat = -33.9249;
        const defaultLng = 18.4241;
        
        map = L.map('map-container').setView([defaultLat, defaultLng], 10);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add click handler
        map.on('click', onMapClick);
        
        console.log('Map initialized successfully with default location');
        showMessage('Map loaded with default location. Allow location access for better experience.', 'info');
    } catch (error) {
        console.error('Error initializing map with default location:', error);
        showMessage('Failed to initialize map. Please try again.', 'error');
    }
}

function onMapClick(e) {
    console.log('Map clicked at:', e.latlng);
    
    selectedLatitude = e.latlng.lat;
    selectedLongitude = e.latlng.lng;
    
    // Remove existing selected marker
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    
    // Remove current location marker when user selects a different location
    if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
        currentLocationMarker = null;
    }
    
    // Add new selected marker
    currentMarker = L.marker([selectedLatitude, selectedLongitude]).addTo(map);
    
    // Update display
    document.getElementById('coord-display').textContent = 
        `${selectedLatitude.toFixed(6)}, ${selectedLongitude.toFixed(6)}`;
    document.getElementById('save-map-location-btn').disabled = false;
}

function useCurrentLocationOnMap() {
    console.log('Getting current location for map...');
    
    if (!navigator.geolocation) {
        showMessage('Geolocation is not supported by your browser', 'error');
        return;
    }

    // Check if we're on HTTPS (required for geolocation on mobile)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showMessage('Geolocation requires HTTPS. Please use a secure connection.', 'error');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 30000 // Allow slightly older location data
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log('Current location obtained:', lat, lng);
            
            // Center map on current location
            map.setView([lat, lng], 15);
            
            // Remove existing current location marker
            if (currentLocationMarker) {
                map.removeLayer(currentLocationMarker);
            }
            
            // Remove any selected marker (user will need to click again to select a different location)
            if (currentMarker) {
                map.removeLayer(currentMarker);
                currentMarker = null;
            }
            
            // Add current location marker
            currentLocationMarker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup('📍 Your current location')
                .openPopup();
            
            // Set the current location as selected
            selectedLatitude = lat;
            selectedLongitude = lng;
            
            // Update display
            document.getElementById('coord-display').textContent = 
                `${lat.toFixed(6)}, ${lng.toFixed(6)} (Current Location)`;
            document.getElementById('save-map-location-btn').disabled = false;
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Could not get current location. ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Location access denied. Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location unavailable. Please select manually on the map.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out. Please select manually on the map.';
                    break;
                default:
                    errorMessage += 'Please select manually on the map.';
                    break;
            }
            
            showMessage(errorMessage, 'error');
        },
        options
    );
}

function saveSelectedLocation() {
    console.log('Saving selected location...');
    
    if (!selectedLatitude || !selectedLongitude) {
        showMessage('Please select a location on the map first.', 'error');
        return;
    }
    
    const locationName = document.getElementById('location-name-input').value.trim();
    const mapModal = document.getElementById('map-modal');
    const isEditMode = mapModal.dataset.editMode === 'true';
    
    if (isEditMode) {
        // Update edit form fields
        document.getElementById('edit-latitude').value = selectedLatitude;
        document.getElementById('edit-longitude').value = selectedLongitude;
        document.getElementById('edit-location-name').value = locationName;
        
        // Update edit location status
        const editLocationStatus = document.getElementById('edit-location-status');
        if (locationName) {
            editLocationStatus.textContent = `Location name: ${locationName}`;
        } else {
            editLocationStatus.textContent = `Location: ${selectedLatitude.toFixed(4)}, ${selectedLongitude.toFixed(4)}`;
        }
        editLocationStatus.className = 'text-sm text-green-600';
        
        // Update edit location button with feedback
        const editLocationBtn = document.getElementById('edit-location-btn');
        if (editLocationBtn) {
            const originalText = editLocationBtn.textContent;
            const originalStyle = editLocationBtn.style.cssText;
            editLocationBtn.textContent = 'Location Saved ✓';
            editLocationBtn.style.setProperty('--button-bg', '#22c55e');
            editLocationBtn.style.setProperty('--button-text', '#ffffff');
            setTimeout(() => {
                editLocationBtn.textContent = originalText;
                editLocationBtn.style.cssText = originalStyle;
            }, 2000);
        }
        
        // Clear edit mode flag
        delete mapModal.dataset.editMode;
    } else {
        // Update the main form
        document.getElementById('latitude').value = selectedLatitude;
        document.getElementById('longitude').value = selectedLongitude;
        document.getElementById('location-name').value = locationName;
        
        // Update location status
        const locationStatus = document.getElementById('location-status');
        if (locationName) {
            locationStatus.textContent = `Location name: ${locationName}`;
        } else {
            locationStatus.textContent = `Location: ${selectedLatitude.toFixed(4)}, ${selectedLongitude.toFixed(4)}`;
        }
        locationStatus.className = 'text-sm text-green-600';
    }
    
    closeMapModal();
    showMessage('Location: Success', 'success');
}

// Backup function to save catch data (can be called directly)
function saveCatchData() {
    console.log('=== SAVE CATCH DATA CALLED DIRECTLY ===');
    console.log('Function called at:', new Date().toISOString());
    
    try {
        console.log('Step 1: Getting form elements');
        const speciesInput = document.getElementById('species');
        const lengthInput = document.getElementById('length');
        const weightInput = document.getElementById('weight');
        const datetimeInput = document.getElementById('datetime');
        
        console.log('Form inputs found:');
        console.log('- speciesInput:', !!speciesInput, speciesInput?.value);
        console.log('- lengthInput:', !!lengthInput, lengthInput?.value);
        console.log('- weightInput:', !!weightInput, weightInput?.value);
        console.log('- datetimeInput:', !!datetimeInput, datetimeInput?.value);
        
        console.log('Step 2: Getting datetime and species values');
        // Get datetime - the only required field
        const datetime = datetimeInput ? datetimeInput.value : '';
        const species = speciesInput ? speciesInput.value.trim() : '';
        
        console.log('Direct save - Datetime:', datetime);
        console.log('Direct save - Species:', species);
        
        console.log('Step 3: Validating required fields');
        // Validate required fields
        if (!datetime) {
            console.log('Direct save validation failed: Missing datetime');
            showMessage('Please enter the date and time', 'error');
            return;
        }
        
        if (!species) {
            console.log('Direct save validation failed: Missing species');
            showMessage('Please enter the species', 'error');
            return;
        }        console.log('Step 4: Validation passed, processing catch data...');
        
        // Get length value - we'll treat it as the optional main field
        const length = lengthInput ? (lengthInput.value ? parseFloat(lengthInput.value) : null) : null;
        
        console.log('Step 5: Creating catch data object');
        console.log('Length:', length);
        console.log('Weight:', weightInput?.value);
        console.log('Photo data:', document.getElementById('photo')?.dataset?.imageData ? 'Present' : 'None');
        
        // Create catch object - making sure to only include non-empty fields
        const catchData = {
            id: crypto.randomUUID(),
            datetime,
            length,
            species: species || null,
            weight: weightInput ? (weightInput.value ? parseFloat(weightInput.value) : null) : null,
            notes: document.getElementById('notes')?.value?.trim() || null,
            locationName: document.getElementById('location-name')?.value || null,
            latitude: document.getElementById('latitude')?.value ? parseFloat(document.getElementById('latitude').value) : null,
            longitude: document.getElementById('longitude')?.value ? parseFloat(document.getElementById('longitude').value) : null,
            mapsUrl: null, // Can be added later through editing
            photo: document.getElementById('photo')?.dataset?.imageData || null,
            timestamp: Date.now()
        };
        
        console.log('Step 6: Catch data created:', catchData);
        
        console.log('Step 7: Getting existing catches from localStorage');
        // Get existing catches from localStorage
        const catches = JSON.parse(localStorage.getItem('catches') || '[]');
        
        console.log('Existing catches:', catches.length);
        
        console.log('Step 8: Adding new catch to array');
        // Add new catch
        catches.push(catchData);
        
        console.log('Step 9: Saving to localStorage');
        // Save updated catches array with better error handling
        try {
            localStorage.setItem('catches', JSON.stringify(catches));
            console.log('Step 10: localStorage save successful');
        } catch (storageError) {
            console.error('localStorage error:', storageError);
            if (storageError.name === 'QuotaExceededError') {
                console.log('Step 10a: Quota exceeded, removing photo and retrying');
                // Remove the photo data and try again
                catchData.photo = null;
                catches[catches.length - 1] = catchData;
                localStorage.setItem('catches', JSON.stringify(catches));
                showMessage('Catch saved successfully! Photo was too large and could not be saved.', 'warning');
            } else {
                throw storageError;
            }
        }        console.log('Step 11: Checking for success message');
        if (!document.getElementById('message-box').textContent.includes('Photo was too large')) {
            console.log('Step 11a: Showing success message');
            showMessage('Catch saved successfully!');
        }

        console.log('Step 12: Resetting form');
        // Reset form and clear data
        const catchForm = document.getElementById('catch-form');
        if (catchForm) {
            catchForm.reset();
        }
        
        const photoElement = document.getElementById('photo');
        if (photoElement) {
            photoElement.dataset.imageData = '';
        }
        
        const locationStatus = document.getElementById('location-status');
        if (locationStatus) {
            locationStatus.textContent = 'Location not saved.';
            locationStatus.className = 'text-sm text-gray-500';
        }
        
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        const locNameInput = document.getElementById('location-name');
        
        if (latInput) latInput.value = '';
        if (lngInput) lngInput.value = '';
        if (locNameInput) locNameInput.value = '';

        console.log('Step 13: Reinitializing datetime');
        // Reset datetime to current time
        initializeDatetime();        console.log('Step 14: Updating displays');
        // Update displays
        loadCatchHistory();
        if (!document.getElementById('records-container').classList.contains('hidden')) {
            displayRecords();
        }
        
        console.log('Step 15: Refreshing map if visible');
        // Refresh map if the map tab is currently active
        refreshMapIfVisible();
        
        console.log('=== SAVE CATCH DATA COMPLETED SUCCESSFULLY ===');
        
    } catch (error) {
        console.error('Error saving catch:', error);
        console.error('Error stack:', error.stack);
        showMessage('Error saving catch. Please try again.', 'error');
    }
}

// Main map functionality for the Map tab
function setupMainMap() {
    console.log('=== SETTING UP MAIN MAP ===');
    
    const mapContainer = document.getElementById('map-view-container');
    const mapElement = document.getElementById('main-map');
    
    if (!mapContainer || !mapElement) {
        console.error('Map container elements not found');
        return;
    }
    
    // Get all catches with location data
    const catches = JSON.parse(localStorage.getItem('catches') || '[]');
    const catchesWithLocation = catches.filter(c => c.latitude && c.longitude);
    
    console.log('Catches with location:', catchesWithLocation.length);
    
    if (catchesWithLocation.length === 0) {
        mapContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow text-center">
                <div class="text-6xl mb-4">🗺️</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">No catches with location data yet</h3>
                <p class="text-gray-500 mb-4">Start logging catches with location to see them on the map!</p>
                <p class="text-sm text-gray-400">Use the "Get Current Location" button when logging a catch.</p>
            </div>
        `;
        return;
    }
    
    // Initialize map if not already done
    if (!mainMap) {
        console.log('Initializing main map...');
        
        // Calculate center point from all catches
        const avgLat = catchesWithLocation.reduce((sum, c) => sum + c.latitude, 0) / catchesWithLocation.length;
        const avgLng = catchesWithLocation.reduce((sum, c) => sum + c.longitude, 0) / catchesWithLocation.length;
        
        mainMap = L.map('main-map').setView([avgLat, avgLng], 10);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mainMap);
    }
    
    // Clear existing markers
    catchMarkers.forEach(marker => mainMap.removeLayer(marker));
    catchMarkers = [];
    
    // Add markers for each catch
    catchesWithLocation.forEach(catch_ => {
        const marker = L.marker([catch_.latitude, catch_.longitude])
            .addTo(mainMap);
        
        // Create popup content
        const popupContent = `
            <div class="p-2 max-w-xs">
                <div class="font-semibold text-blue-700 mb-2">${cleanSpeciesName(catch_.species)}</div>
                ${catch_.photo ? `<img src="${catch_.photo}" alt="Catch photo" class="w-full h-20 object-cover rounded mb-2">` : ''}
                <div class="text-sm text-gray-600 space-y-1">
                    ${catch_.length ? `<div><span class="font-medium">Length:</span> ${catch_.length}cm</div>` : ''}
                    ${catch_.weight ? `<div><span class="font-medium">Weight:</span> ${Number(catch_.weight).toFixed(3)}kg</div>` : ''}
                    <div><span class="font-medium">Date:</span> ${new Date(catch_.datetime).toLocaleDateString('en-GB')}</div>
                    ${catch_.locationName ? `<div><span class="font-medium">Location:</span> ${catch_.locationName}</div>` : ''}
                    ${catch_.notes ? `<div class="mt-2 p-2 bg-gray-50 rounded text-xs">${catch_.notes}</div>` : ''}
                </div>                <button class="mt-2 w-full px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation" 
                        onclick="handleViewDetailsClick(event, '${catch_.id}')"
                        style="min-height: 44px; touch-action: manipulation;">
                    View Details
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        catchMarkers.push(marker);
    });
    
    // Fit map to show all markers if we have multiple catches
    if (catchesWithLocation.length > 1) {
        const group = new L.featureGroup(catchMarkers);
        mainMap.fitBounds(group.getBounds().pad(0.1));
    }
    
    console.log('Main map setup complete');
}

// Handle View Details button clicks with mobile touch support
function handleViewDetailsClick(event, catchId) {
    console.log('handleViewDetailsClick called with:', catchId, 'Event type:', event.type);
    
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Debounce multiple rapid calls (common on mobile)
    if (window.viewDetailsClickTimeout) {
        clearTimeout(window.viewDetailsClickTimeout);
    }
    
    window.viewDetailsClickTimeout = setTimeout(() => {
        console.log('Executing showCatchFromMap for:', catchId);
        showCatchFromMap(catchId);
        window.viewDetailsClickTimeout = null;
    }, 100); // 100ms debounce
}

// Make the function globally accessible for inline onclick handlers
window.handleViewDetailsClick = handleViewDetailsClick;

// Function to refresh the map when data changes
function refreshMapIfVisible() {
    // Check if the map tab is currently active
    const mapContainer = document.getElementById('map-view-container');
    const mapTab = document.getElementById('map-tab-btn');
    
    if (mapContainer && !mapContainer.classList.contains('hidden') && mapTab && mapTab.classList.contains('active')) {
        console.log('Map tab is active, refreshing map...');
        setupMainMap();
    }
}

// Global error handler for mobile debugging
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
    console.error('Error message:', e.message);
    console.error('Error filename:', e.filename);
    console.error('Error line:', e.lineno);
    console.error('Error stack:', e.error?.stack);
});

// Make showCatchFromMap globally accessible for debugging
window.showCatchFromMap = showCatchFromMap;

// Make handleRotateClick globally accessible for debugging
window.handleRotateClick = handleRotateClick;

// Add touch event debugging for mobile
document.addEventListener('touchstart', function(e) {
    if (e.target.tagName === 'BUTTON' && e.target.textContent.includes('View Details')) {
        console.log('Touch detected on View Details button');
        console.log('Button onclick:', e.target.onclick);
        console.log('Button dataset:', e.target.dataset);
    }
    
    if (e.target.id === 'rotate-image-btn') {
        console.log('Touch detected on Rotate button');
        console.log('Button id:', e.target.id);
        console.log('Button title:', e.target.title);
    }
    
    if (e.target.id === 'close-fullscreen-btn') {
        console.log('Touch detected on Close fullscreen button');
        console.log('Button id:', e.target.id);
        console.log('Button title:', e.target.title);
    }
}, { passive: true });

// Additional fallback to ensure fullscreen modal is hidden on window load
window.addEventListener('load', () => {
    setTimeout(() => {
        const fullscreenModal = document.getElementById('fullscreen-image');
        if (fullscreenModal) {
            fullscreenModal.classList.add('hidden');
            fullscreenModal.style.display = 'none';
            fullscreenModal.style.visibility = 'hidden';
            fullscreenModal.style.opacity = '0';
            fullscreenModal.style.zIndex = '-1';
            console.log('Window load: Force-hidden fullscreen modal');
        }
    }, 100);
});

// Prevent location name input from auto-advancing to notes field on Enter (main form)
const mainLocationNameInput = document.getElementById('location-name');
if (mainLocationNameInput) {
    // Remove any existing handler to prevent duplicates
    mainLocationNameInput.removeEventListener('keydown', mainLocationNameInput._enterHandler);
    
    // Create the handler function
    mainLocationNameInput._enterHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event bubbling
            mainLocationNameInput.blur(); // Remove focus and dismiss keyboard on mobile
            return false; // Extra prevention
        }
    };
    
    // Add the handler
    mainLocationNameInput.addEventListener('keydown', mainLocationNameInput._enterHandler);
}

// Calculate weight when length or species changes
lengthInput.addEventListener('input', autoCalculateWeight);
speciesInput.addEventListener('input', autoCalculateWeight);
speciesInput.addEventListener('change', autoCalculateWeight);