// Helper function to generate UUID
function generateUUID() {
    // Try using crypto.randomUUID() if available
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    
    // Fallback to manual UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper function to format dates consistently as dd/mm/yyyy - time
function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Format date as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

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
    });    // Initialize the main app functionality
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
    try {
        if (window.fishDB) {
            const isReady = await window.fishDB.isReady();
            if (isReady) {
                console.log('Fish database initialized successfully');
                
                // Refresh species list to include database species
                // Wait a moment to ensure species handlers are set up
                setTimeout(async () => {
                    if (typeof window.refreshSpeciesList === 'function') {
                        await window.refreshSpeciesList();
                        console.log('Database species loaded into dropdown');
                    } else {
                        console.log('refreshSpeciesList function not yet available');
                    }
                }, 100);
            } else {
                console.warn('Fish database failed to initialize');
            }
        }
    } catch (error) {
        console.error('Error initializing fish database:', error);
    }
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

    // Setup datetime display formatting
    const datetimeInput = document.getElementById('datetime');
    const datetimeDisplay = document.getElementById('datetime-display');
    
    // Update display when datetime changes
    const updateDatetimeDisplay = () => {
        if (datetimeInput.value) {
            datetimeDisplay.textContent = `Will be saved as: ${formatDate(datetimeInput.value)}`;
            datetimeDisplay.classList.remove('hidden');
        } else {
            datetimeDisplay.textContent = '';
            datetimeDisplay.classList.add('hidden');
        }
    };
    
    datetimeInput.addEventListener('input', updateDatetimeDisplay);
    datetimeInput.addEventListener('change', updateDatetimeDisplay);
    
    // Initial display update
    updateDatetimeDisplay();

    // Handle catch form submission
    catchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Form submission started');
        
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
        const length = lengthInput.value ? parseFloat(lengthInput.value) : null;
        
        console.log('Creating catch data object');
        console.log('Length:', length);
        console.log('Weight:', weightInput.value);
        console.log('Photo data:', document.getElementById('photo').dataset.imageData ? 'Present' : 'None');        // Create catch object - making sure to only include non-empty fields
        const catchData = {
            id: generateUUID(),
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
                    const catchDataWithoutPhoto = { ...catchData, photo: null };
                    catches[catches.length - 1] = catchDataWithoutPhoto;
                    localStorage.setItem('catches', JSON.stringify(catches));
                    showMessage('Catch saved successfully! Photo was too large and could not be saved.', 'warning');
                } else {
                    throw storageError;
                }
            }

            if (!document.getElementById('message-box').textContent.includes('Photo was too large')) {
                console.log('Save successful, showing message');
                showMessage('Catch saved successfully!');
            }

            console.log('Resetting form');

            // Reset form and clear data
            catchForm.reset();
            document.getElementById('photo').dataset.imageData = '';
            document.getElementById('location-status').textContent = 'Location not saved.';
            document.getElementById('latitude').value = '';
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
    document.getElementById('edit-species').value = catchData.species;
    document.getElementById('edit-length').value = catchData.length;
    document.getElementById('edit-weight').value = Number(catchData.weight).toFixed(3);
    document.getElementById('edit-datetime').value = catchData.datetime;
    document.getElementById('edit-location-name').value = catchData.locationName || '';
    document.getElementById('edit-notes').value = catchData.notes || '';
    document.getElementById('edit-latitude').value = catchData.latitude || '';
    document.getElementById('edit-longitude').value = catchData.longitude || '';
    document.getElementById('edit-maps-link').value = '';
    document.getElementById('edit-maps-url').value = catchData.mapsUrl || '';
    document.getElementById('edit-photo').value = catchData.photo || '';

    // Setup datetime display formatting for edit modal
    const editDatetimeInput = document.getElementById('edit-datetime');
    const editDatetimeDisplay = document.getElementById('edit-datetime-display');
    
    // Update display when datetime changes
    const updateEditDatetimeDisplay = () => {
        if (editDatetimeInput.value) {
            editDatetimeDisplay.textContent = `Will be saved as: ${formatDate(editDatetimeInput.value)}`;
            editDatetimeDisplay.classList.remove('hidden');
        } else {
            editDatetimeDisplay.textContent = '';
            editDatetimeDisplay.classList.add('hidden');
        }
    };
    
    editDatetimeInput.addEventListener('input', updateEditDatetimeDisplay);
    editDatetimeInput.addEventListener('change', updateEditDatetimeDisplay);
    
    // Initial display update
    updateEditDatetimeDisplay();

    // Update location status
    updateEditLocationStatus(catchData);

    // Update photo button text
    const editPhotoText = document.getElementById('edit-photo-text');
    editPhotoText.textContent = catchData.photo ? 'Change Photo' : 'Add Photo';

    // Setup photo editing
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    const editPhotoInput = document.getElementById('edit-photo-input');
    
    editPhotoBtn.onclick = () => editPhotoInput.click();    editPhotoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // Show loading indicator
            showLoadingIndicator(true);
            
            compressImage(file, 0.7, 1200) // 70% quality, max 1200px width
                .then(compressedDataUrl => {
                    document.getElementById('edit-photo').value = compressedDataUrl;
                    editPhotoText.textContent = 'Photo Selected';
                    showLoadingIndicator(false);
                })
                .catch(error => {
                    console.error('Error processing photo:', error);
                    showLoadingIndicator(false);
                    showMessage('Error processing photo. Please try a smaller image.', 'error');
                    e.target.value = ''; // Clear the input
                });
        }
    };

    // Setup location editing functionality
    setupEditLocationHandlers(catchData);

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
    const datetime = document.getElementById('edit-datetime').value;
    const locationName = document.getElementById('edit-location-name').value.trim();
    const notes = document.getElementById('edit-notes').value.trim();
    const latitude = document.getElementById('edit-latitude').value;
    const longitude = document.getElementById('edit-longitude').value;
    const mapsUrl = document.getElementById('edit-maps-url').value.trim();
    const photo = document.getElementById('edit-photo').value;

    // Validate required fields - only species and datetime are required
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
    if (catchIndex !== -1) {
        catches[catchIndex] = {
            ...catches[catchIndex],
            species,
            length: isNaN(length) || !document.getElementById('edit-length').value ? null : length,
            weight: isNaN(weight) || !document.getElementById('edit-weight').value ? null : weight,
            datetime,
            locationName: locationName || null,
            notes: notes || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            mapsUrl: mapsUrl || null,
            photo: photo || null,
            lastModified: Date.now()
        };// Save back to localStorage with error handling
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
                <h3 class="text-lg font-semibold text-blue-700 mb-2">${species}</h3>
                <div class="space-y-4">
                    <div class="flex items-start gap-4 cursor-pointer" data-catch-id="${records.largest.id}">
                        <div class="flex-grow">
                            <p class="text-sm hover:text-blue-600">                                <span class="font-medium">Longest:</span> 
                                ${records.largest.length}cm (${formatDate(records.largest.datetime)})
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
                            <p class="text-sm hover:text-blue-600">                                <span class="font-medium">Heaviest:</span> 
                                ${Number(records.heaviest.weight).toFixed(3)}kg (${formatDate(records.heaviest.datetime)})
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

// Species Management Functions
function setupSpeciesHandlers() {
    const speciesInput = document.getElementById('species');
    const speciesDropdown = document.getElementById('species-dropdown');
    const manageSpeciesBtn = document.getElementById('manage-species-btn');
    
    // Initialize species list if empty
    if (!localStorage.getItem('species')) {
        const defaultSpecies = [
            'Bass', 'Trout', 'Salmon', 'Pike', 'Catfish', 'Perch', 'Carp'
        ].map(name => ({ name, isCustom: false }));
        localStorage.setItem('species', JSON.stringify(defaultSpecies));
    }    async function refreshSpeciesList() {
        let speciesList = JSON.parse(localStorage.getItem('species') || '[]');
        
        // Add species from fish database if available
        if (window.fishDB && await window.fishDB.isReady()) {
            const dbSpecies = window.fishDB.getSpeciesNames();
            
            // Add database species that aren't already in the list
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
                }
            });
            
            // Update localStorage with combined list
            localStorage.setItem('species', JSON.stringify(speciesList));
        }
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
    }

    // Make refreshSpeciesList globally accessible for database initialization
    window.refreshSpeciesList = refreshSpeciesList;async function updateSpeciesDropdown(matches) {
        const isDbReady = window.fishDB && await window.fishDB.isReady();
        
        if (matches.length > 0) {
            const dropdownHTML = await Promise.all(matches.map(async species => {
                let speciesInfo = '';
                if (isDbReady && species.isFromDatabase) {
                    const info = window.fishDB.getSpeciesInfo(species.name);
                    if (info) {
                        const edibleIcon = info.edible ? '🐟' : '🦈';
                        const accuracyPercent = (info.accuracy * 100).toFixed(0);
                        speciesInfo = ` <small class="text-gray-500">${edibleIcon} ${accuracyPercent}% accuracy</small>`;
                    }
                }
                
                return `
                    <div class="species-option px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        ${species.name}${speciesInfo}
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
        }

        // Handle species selection
        speciesDropdown.querySelectorAll('.species-option').forEach(option => {
            option.addEventListener('click', () => {
                if (option.textContent.includes('Add "')) {
                    // Show add species modal with the current input value
                    document.getElementById('species-modal').classList.remove('hidden');
                    document.getElementById('new-species-name').value = speciesInput.value;
                    document.getElementById('new-species-name').focus();
                } else {
                    speciesInput.value = option.textContent.trim();
                }
                speciesDropdown.classList.add('hidden');
            });
        });
        speciesDropdown.classList.remove('hidden');
    }    // Handle species input
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
    });    // Handle species form submission
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
    });    // Add click-outside handlers for modals
    [speciesModal, document.getElementById('manage-species-modal')].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Initial refresh to include any already-loaded database species
    setTimeout(async () => {
        await refreshSpeciesList();
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

// Edit Location Handling Functions
function setupEditLocationHandlers(catchData) {
    const extractBtn = document.getElementById('edit-extract-location-btn');
    const getCurrentLocationBtn = document.getElementById('edit-get-current-location-btn');
    const openMapsBtn = document.getElementById('edit-open-maps-btn');
    const mapsLinkInput = document.getElementById('edit-maps-link');

    // Extract location from Google Maps link
    extractBtn.addEventListener('click', () => {
        const mapsLink = mapsLinkInput.value.trim();
        if (!mapsLink) {
            showMessage('Please paste a Google Maps link first', 'error');
            return;
        }

        const locationData = extractLocationFromMapsLink(mapsLink);
        if (locationData) {
            document.getElementById('edit-latitude').value = locationData.latitude;
            document.getElementById('edit-longitude').value = locationData.longitude;
            document.getElementById('edit-maps-url').value = mapsLink;
            
            if (locationData.placeName && !document.getElementById('edit-location-name').value) {
                document.getElementById('edit-location-name').value = locationData.placeName;
            }
            
            updateEditLocationStatus(locationData);
            showMessage('Location extracted successfully');
        } else {
            showMessage('Could not extract location from the link. Please check the URL format.', 'error');
        }
    });

    // Get current location
    getCurrentLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showMessage('Geolocation is not supported by your browser', 'error');
            return;
        }

        getCurrentLocationBtn.disabled = true;
        getCurrentLocationBtn.textContent = 'Getting location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                document.getElementById('edit-latitude').value = latitude;
                document.getElementById('edit-longitude').value = longitude;
                
                // Generate Google Maps URL
                const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                document.getElementById('edit-maps-url').value = mapsUrl;
                
                updateEditLocationStatus({ latitude, longitude });
                getCurrentLocationBtn.disabled = false;
                getCurrentLocationBtn.innerHTML = '<span class="lucide lucide-map-pin"></span> Get Current Location';
                showMessage('Current location captured');
            },
            (error) => {
                console.error('Error getting location:', error);
                showMessage('Error getting location. Please try again.', 'error');
                getCurrentLocationBtn.disabled = false;
                getCurrentLocationBtn.innerHTML = '<span class="lucide lucide-map-pin"></span> Get Current Location';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });

    // Open in Maps
    openMapsBtn.addEventListener('click', () => {
        const mapsUrl = document.getElementById('edit-maps-url').value;
        const latitude = document.getElementById('edit-latitude').value;
        const longitude = document.getElementById('edit-longitude').value;
        
        let urlToOpen = mapsUrl;
        if (!urlToOpen && latitude && longitude) {
            urlToOpen = `https://www.google.com/maps?q=${latitude},${longitude}`;
        }
        
        if (urlToOpen) {
            window.open(urlToOpen, '_blank');
        } else {
            showMessage('No location available to open in maps', 'error');
        }
    });
}

function updateEditLocationStatus(locationData) {
    const statusElement = document.getElementById('edit-location-status');
    const locationName = document.getElementById('edit-location-name').value;
    
    if (locationData && (locationData.latitude || locationData.longitude)) {
        let statusText = '';
        if (locationName) {
            statusText += `📍 ${locationName}`;
        }
        if (locationData.latitude && locationData.longitude) {
            statusText += statusText ? ` (${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)})` : 
                         `📍 ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`;
        }
        statusElement.textContent = statusText || 'Location coordinates available';
        statusElement.className = 'text-sm text-green-700 bg-green-50 p-2 rounded';
    } else if (locationName) {
        statusElement.textContent = `📍 ${locationName} (no coordinates)`;
        statusElement.className = 'text-sm text-yellow-700 bg-yellow-50 p-2 rounded';
    } else {
        statusElement.textContent = 'No location set';
        statusElement.className = 'text-sm text-gray-600 bg-gray-50 p-2 rounded';
    }
}

function extractLocationFromMapsLink(url) {
    try {
        // Handle different Google Maps URL formats
        let latitude, longitude, placeName;
        
        // Format 1: https://maps.google.com/?q=lat,lng
        let match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            latitude = parseFloat(match[1]);
            longitude = parseFloat(match[2]);
        }
        
        // Format 2: https://www.google.com/maps/@lat,lng,zoom
        if (!latitude) {
            match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
            if (match) {
                latitude = parseFloat(match[1]);
                longitude = parseFloat(match[2]);
            }
        }
        
        // Format 3: https://maps.google.com/maps?ll=lat,lng
        if (!latitude) {
            match = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            if (match) {
                latitude = parseFloat(match[1]);
                longitude = parseFloat(match[2]);
            }
        }
        
        // Format 4: Place name in query
        if (!latitude) {
            match = url.match(/[?&]q=([^&]+)/);
            if (match) {
                placeName = decodeURIComponent(match[1].replace(/\+/g, ' '));
            }
        }
        
        if (latitude && longitude) {
            return { latitude, longitude, placeName };
        } else if (placeName) {
            return { placeName };
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing Google Maps URL:', error);
        return null;
    }
}

// Photo Handling Functions
function setupPhotoHandling() {
    const photoInput = document.getElementById('photo');
    photoInput.addEventListener('change', handlePhotoUpload);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        // Show loading indicator
        showLoadingIndicator(true);
        
        compressImage(file, 0.7, 1200) // 70% quality, max 1200px width
            .then(compressedDataUrl => {
                event.target.dataset.imageData = compressedDataUrl;
                showLoadingIndicator(false);
                showMessage('Photo processed successfully!');
            })
            .catch(error => {
                console.error('Error processing photo:', error);
                showLoadingIndicator(false);
                showMessage('Error processing photo. Please try a smaller image.', 'error');
                event.target.value = ''; // Clear the input
            });
    }
}

function compressImage(file, quality = 0.7, maxWidth = 1200) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            try {
                // Calculate new dimensions maintaining aspect ratio
                let { width, height } = img;
                const originalSize = file.size;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to data URL with compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Check if compressed image is still too large (>1.5MB for safety)
                const compressedSizeEstimate = (compressedDataUrl.length * 0.75) / (1024 * 1024);
                console.log('Image compression: ' + (originalSize / (1024 * 1024)).toFixed(2) + 'MB -> ~' + compressedSizeEstimate.toFixed(2) + 'MB');
                
                if (compressedSizeEstimate > 1.5) {
                    // Try with much lower quality if still too large
                    const lowerQuality = Math.max(0.2, quality - 0.3);
                    const furtherCompressed = canvas.toDataURL('image/jpeg', lowerQuality);
                    const finalSizeEstimate = (furtherCompressed.length * 0.75) / (1024 * 1024);
                    console.log('Further compression: ~' + finalSizeEstimate.toFixed(2) + 'MB');
                    resolve(furtherCompressed);
                } else {
                    resolve(compressedDataUrl);
                }
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

function showLoadingIndicator(show) {
    const indicator = document.getElementById('loading-indicator');
    if (show) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
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
    
    let bgColor, textColor;
    switch(type) {
        case 'error':
            bgColor = 'bg-red-100';
            textColor = 'text-red-700';
            break;
        case 'warning':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-700';
            break;
        default:
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-700';
    }
    
    messageBox.className = `p-3 rounded-md text-sm ${bgColor} ${textColor}`;
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, type === 'warning' ? 5000 : 3000); // Show warnings longer
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
                <div class="flex-grow">                    <h3 class="text-lg font-semibold text-blue-700">${catch_.species}</h3>
                    <span class="text-sm text-gray-500">${formatDate(catch_.datetime)}</span>
                    <div class="mt-2 space-y-1">
                        <p class="text-sm"><span class="font-medium">Length:</span> ${catch_.length}cm</p>
                        <p class="text-sm"><span class="font-medium">Weight:</span> ${Number(catch_.weight).toFixed(3)}kg</p>                        ${catch_.locationName ? `
                            <p class="text-sm">
                                <span class="font-medium">Location:</span> ${catch_.locationName}
                                ${catch_.mapsUrl ? ` <a href="${catch_.mapsUrl}" target="_blank" class="text-blue-600 hover:underline">📍</a>` : ''}
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
    document.getElementById('modal-species').textContent = catchData.species;
    document.getElementById('modal-date').textContent = formatDate(catchData.datetime);
    document.getElementById('modal-length').textContent = `Length: ${catchData.length}cm`;
    document.getElementById('modal-weight').textContent = `Weight: ${Number(catchData.weight).toFixed(3)}kg`;
    
    const locationContainer = document.getElementById('modal-location-container');
    const locationName = document.getElementById('modal-location-name');
      if (catchData.locationName) {
        locationContainer.classList.remove('hidden');
        locationName.textContent = catchData.locationName;
        // Use stored mapsUrl if available, otherwise create from coordinates
        if (catchData.mapsUrl) {
            locationName.href = catchData.mapsUrl;
        } else if (catchData.latitude && catchData.longitude) {
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