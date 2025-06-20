// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize landing page functionality
    initLandingPage();
    
    // Setup fullscreen image handling
    const fullscreenModal = document.getElementById('fullscreen-image');
    const closeBtn = fullscreenModal.querySelector('button');
    closeBtn.addEventListener('click', closeFullscreenImage);
    
    fullscreenModal.addEventListener('click', (e) => {
        if (e.target === fullscreenModal) {
            closeFullscreenImage();
        }
    });

    const imageContent = document.getElementById('fullscreen-image-content');
    imageContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Initialize the main app functionality
    setupFormHandlers();
    setupLocationHandling();
    setupPhotoHandling();
    setupModalHandlers();
    setupViewToggle();
    setupDataOptions();
    setupSpeciesHandlers();
    
    // Initialize fish database and update species list
    initializeFishDatabase();
    
    // Initialize datetime input with current time
    initializeDatetime();

    // Load initial catch history
    loadCatchHistory();
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

    enterAppBtn.addEventListener('click', () => {
        landingPage.classList.add('fade-out');
        appContent.classList.remove('hidden');
        setTimeout(() => {
            appContent.classList.add('fade-in');
            // Load catch history after app content is visible
            loadCatchHistory();
        }, 50);
    });
}

function setupFormHandlers() {
    const catchForm = document.getElementById('catch-form');
    const lengthInput = document.getElementById('length');
    const speciesInput = document.getElementById('species');
    const weightInput = document.getElementById('weight');

    // Add debug logging to check if elements exist
    console.log('Setting up form handlers');
    console.log('catchForm:', catchForm);
    console.log('lengthInput:', lengthInput);
    console.log('speciesInput:', speciesInput);
    console.log('weightInput:', weightInput);

    if (!catchForm) {
        console.error('catch-form element not found!');
        return;
    }

    // Setup automatic weight calculation
    const autoCalculateWeight = async () => {
        const species = speciesInput.value.trim();
        const length = parseFloat(lengthInput.value);
        
        if (species && length && length > 0) {
            await calculateEstimatedWeight(species, length);
        }
    };

    // Calculate weight when length or species changes
    lengthInput.addEventListener('input', autoCalculateWeight);
    speciesInput.addEventListener('input', autoCalculateWeight);
    speciesInput.addEventListener('change', autoCalculateWeight);

    // Handle catch form submission
    catchForm.addEventListener('submit', (e) => {
        e.preventDefault();
          // Get datetime - the only required field
        const datetime = document.getElementById('datetime').value;
        const species = speciesInput.value.trim();
        
        console.log('Datetime:', datetime);
        console.log('Species:', species);
        
        // Validate required fields
        if (!datetime) {
            console.log('Missing datetime');
            showMessage('Please enter the date and time', 'error');
            return;
        }
        
        if (!species) {
            console.log('Missing species');
            showMessage('Please enter the species', 'error');
            return;
        }

        console.log('Validation passed, getting length');
        // Get length value - we'll treat it as the optional main field
        const length = lengthInput.value ? parseFloat(lengthInput.value) : null;        console.log('Creating catch data object');
        console.log('Length:', length);
        console.log('Weight:', weightInput.value);
        console.log('Photo data:', document.getElementById('photo').dataset.imageData ? 'Present' : 'None');

        // Create catch object - making sure to only include non-empty fields
        const catchData = {
            id: crypto.randomUUID(),
            datetime,
            length,
            species: species || null,
            weight: weightInput.value ? parseFloat(weightInput.value) : null,
            notes: document.getElementById('notes').value.trim() || null,
            locationName: document.getElementById('location-name').value || null,
            latitude: document.getElementById('latitude').value ? parseFloat(document.getElementById('latitude').value) : null,
            longitude: document.getElementById('longitude').value ? parseFloat(document.getElementById('longitude').value) : null,
            mapsUrl: null, // Can be added later through editing
            photo: document.getElementById('photo').dataset.imageData || null,
            timestamp: Date.now()
        };

        console.log('Catch data created:', catchData);        try {
            console.log('Getting existing catches from localStorage');
            // Get existing catches from localStorage
            const catches = JSON.parse(localStorage.getItem('catches') || '[]');
            
            console.log('Existing catches:', catches.length);
            
            // Add new catch
            catches.push(catchData);
            
            console.log('Saving to localStorage');
            // Save updated catches array with better error handling
            try {
                localStorage.setItem('catches', JSON.stringify(catches));
            } catch (storageError) {
                console.error('localStorage error:', storageError);
                if (storageError.name === 'QuotaExceededError') {
                    // Remove the photo data and try again
                    catchData.photo = null;
                    catches[catches.length - 1] = catchData;
                    localStorage.setItem('catches', JSON.stringify(catches));
                    showMessage('Catch saved successfully! Photo was too large and could not be saved.', 'warning');
                } else {
                    throw storageError;
                }
            }

            if (!document.getElementById('message-box').textContent.includes('Photo was too large')) {
                showMessage('Catch saved successfully!');
            }

            console.log('Resetting form');            // Reset form and clear data
            catchForm.reset();
            document.getElementById('photo').dataset.imageData = '';
            document.getElementById('location-status').textContent = 'Location not saved.';
            document.getElementById('location-status').className = 'text-sm text-gray-500';
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            document.getElementById('location-name').value = '';
            document.getElementById('longitude').value = '';
            document.getElementById('location-name').value = '';

            // Reset datetime to current time
            initializeDatetime();

            // Update displays
            loadCatchHistory();
            if (!document.getElementById('records-container').classList.contains('hidden')) {
                displayRecords();
            }
        } catch (error) {
            console.error('Error saving catch:', error);
            showMessage('Error saving catch. Please try again.', 'error');
        }
    });
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
    document.getElementById('edit-photo').value = catchData.photo || '';

    // Update photo button text
    const editPhotoText = document.getElementById('edit-photo-text');
    editPhotoText.textContent = catchData.photo ? 'Change Photo' : 'Add Photo';

    // Setup photo editing
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    const editPhotoInput = document.getElementById('edit-photo-input');
    
    editPhotoBtn.onclick = () => editPhotoInput.click();
    
    editPhotoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('edit-photo').value = e.target.result;
                editPhotoText.textContent = 'Photo Selected';
            };
            reader.readAsDataURL(file);
        }
    };

    // Show the modal
    editModal.classList.remove('hidden');

    // Setup form submission
    const editForm = document.getElementById('edit-catch-form');
    editForm.onsubmit = (e) => {
        e.preventDefault();
        updateCatch();
    };

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

    // Group catches by species
    const speciesRecords = {};
    catches.forEach(catch_ => {
        if (!speciesRecords[catch_.species]) {
            speciesRecords[catch_.species] = {
                largest: catch_,
                heaviest: catch_
            };
        } else {
            if (catch_.length > speciesRecords[catch_.species].largest.length) {
                speciesRecords[catch_.species].largest = catch_;
            }
            if (catch_.weight > speciesRecords[catch_.species].heaviest.weight) {
                speciesRecords[catch_.species].heaviest = catch_;
            }
        }
    });

    // Display records with click handlers
    recordsContainer.innerHTML = Object.entries(speciesRecords)
        .map(([species, records]) => `
            <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <h3 class="text-lg font-semibold text-blue-700 mb-2">${cleanSpeciesName(species)}</h3>
                <div class="space-y-4">
                    <div class="flex items-start gap-4 cursor-pointer" data-catch-id="${records.largest.id}">
                        <div class="flex-grow">
                            <p class="text-sm hover:text-blue-600">
                                <span class="font-medium">Longest:</span> 
                                ${records.largest.length}cm (${new Date(records.largest.datetime).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })})
                            </p>
                        </div>
                        ${records.largest.photo ? `
                            <div class="flex-shrink-0">
                                <img src="${records.largest.photo}" alt="Longest catch" class="w-16 h-16 object-cover rounded-md">
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-start gap-4 cursor-pointer" data-catch-id="${records.heaviest.id}">
                        <div class="flex-grow">
                            <p class="text-sm hover:text-blue-600">
                                <span class="font-medium">Heaviest:</span> 
                                ${Number(records.heaviest.weight).toFixed(3)}kg (${new Date(records.heaviest.datetime).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })})
                            </p>
                        </div>
                        ${records.heaviest.photo ? `
                            <div class="flex-shrink-0">
                                <img src="${records.heaviest.photo}" alt="Heaviest catch" class="w-16 h-16 object-cover rounded-md">
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `)
        .join('');

    // Add click handlers for record entries
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
    fullscreenModal.classList.add('hidden');
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
        }        // Handle species selection
        speciesDropdown.querySelectorAll('.species-option').forEach(option => {
            option.addEventListener('click', () => {
                if (option.textContent.includes('Add "')) {
                    // Show add species modal with the current input value
                    document.getElementById('species-modal').classList.remove('hidden');
                    document.getElementById('new-species-name').value = speciesInput.value;
                    document.getElementById('new-species-name').focus();
                } else {
                    // Use the original name if available, otherwise use the cleaned display name
                    const originalName = option.dataset.originalName;
                    speciesInput.value = originalName || cleanSpeciesName(option.textContent.trim());
                }
                speciesDropdown.classList.add('hidden');
            });
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
    });

    document.getElementById('cancel-species-btn').addEventListener('click', () => {
        speciesModal.classList.add('hidden');
    });

    // Add click-outside handlers for modals
    [speciesModal, document.getElementById('manage-species-modal')].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
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
    const getLocationBtn = document.getElementById('get-location-btn');
    const locationStatus = document.getElementById('location-status');
    const locationNameModal = document.getElementById('location-name-modal');
    const locationNameForm = document.getElementById('location-name-form');
    const modalLocationNameInput = document.getElementById('modal-location-name-input');

    getLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showMessage('Geolocation is not supported by your browser', 'error');
            return;
        }

        getLocationBtn.disabled = true;
        locationStatus.textContent = 'Getting location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Store coordinates in hidden inputs
                document.getElementById('latitude').value = latitude;
                document.getElementById('longitude').value = longitude;

                // Show location name modal
                locationNameModal.classList.remove('hidden');
                modalLocationNameInput.value = ''; // Clear previous value
                modalLocationNameInput.focus();
            },
            (error) => {
                console.error('Error getting location:', error);
                showMessage('Error getting location. Please try again.', 'error');
                locationStatus.textContent = 'Error getting location. Please try again.';
                getLocationBtn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });

    // Handle location name form submission
    locationNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const locationName = modalLocationNameInput.value.trim();
        
        if (!locationName) {
            showMessage('Please enter a location name', 'error');
            return;
        }

        // Save location name to form
        document.getElementById('location-name').value = locationName;
        locationStatus.textContent = `Location saved: ${locationName}`;
        
        // Hide modal and reset
        locationNameModal.classList.add('hidden');
        getLocationBtn.disabled = false;
        showMessage('Location saved successfully');
    });

    // Handle cancel button
    document.getElementById('cancel-location-name-btn').addEventListener('click', () => {
        locationNameModal.classList.add('hidden');
        getLocationBtn.disabled = false;
        locationStatus.textContent = 'Location not saved.';
        // Clear the hidden inputs
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.getElementById('location-name').value = '';
        modalLocationNameInput.value = '';
    });
}

// Photo Handling Functions
function setupPhotoHandling() {
    const photoInput = document.getElementById('photo');
    photoInput.addEventListener('change', handlePhotoUpload);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Store the image data URL
            event.target.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function showFullscreenImage(imageUrl) {
    const fullscreenModal = document.getElementById('fullscreen-image');
    const fullscreenImage = document.getElementById('fullscreen-image-content');
    
    fullscreenImage.src = imageUrl;
    fullscreenModal.classList.remove('hidden');
}

// Message handling function
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.className = `p-3 rounded-md text-sm ${
        type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
    }`;
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
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
                    </div>
                </div>
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
        if (catchData.latitude && catchData.longitude) {
            locationName.href = `https://www.google.com/maps?q=${catchData.latitude},${catchData.longitude}`;
        } else {
            locationName.removeAttribute('href');
        }
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

function setupViewToggle() {
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const catchLog = document.getElementById('catch-log');
    const recordsContainer = document.getElementById('records-container');
    const viewIcon = toggleViewBtn.querySelector('.view-icon');
    const viewText = toggleViewBtn.querySelector('.view-text');
    const viewHeading = document.getElementById('view-heading');

    // Set initial state
    viewIcon.textContent = '📋';
    viewText.textContent = 'View Records';

    toggleViewBtn.addEventListener('click', () => {
        if (catchLog.classList.contains('hidden')) {
            // Switch to History view
            catchLog.classList.remove('hidden');
            recordsContainer.classList.add('hidden');
            viewIcon.textContent = '📋';
            viewText.textContent = 'View Records';
            viewHeading.textContent = 'Catch History';
            loadCatchHistory();
        } else {
            // Switch to Records view
            catchLog.classList.add('hidden');
            recordsContainer.classList.remove('hidden');
            viewIcon.textContent = '🏆';
            viewText.textContent = 'View History';
            viewHeading.textContent = 'Personal Records';
            displayRecords();
        }
    });
}

// Debug function to test species loading manually
window.testSpeciesLoading = async function() {
    console.log('=== MANUAL SPECIES LOADING TEST ===');
    
    // Check if fishDB exists
    console.log('window.fishDB exists:', !!window.fishDB);
    
    if (window.fishDB) {
        // Check if database is ready
        const isReady = await window.fishDB.isReady();
        console.log('Fish database ready:', isReady);
        
        if (isReady) {
            // Get species names
            const speciesNames = window.fishDB.getSpeciesNames();
            console.log('Database species:', speciesNames);
            
            // Check current localStorage species
            const currentSpecies = JSON.parse(localStorage.getItem('species') || '[]');
            console.log('Current localStorage species:', currentSpecies);
            
            // Trigger manual refresh
            if (typeof window.refreshSpeciesList === 'function') {
                console.log('Calling refreshSpeciesList manually...');
                await window.refreshSpeciesList();
                
                // Check updated localStorage
                const updatedSpecies = JSON.parse(localStorage.getItem('species') || '[]');
                console.log('Updated localStorage species:', updatedSpecies);
            } else {
                console.error('refreshSpeciesList function not available');
            }
        }
    }
    
    console.log('=== TEST COMPLETE ===');
};