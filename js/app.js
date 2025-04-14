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
    
    // Initialize datetime input with current time
    initializeDatetime();

    // Load initial catch history
    loadCatchHistory();
    
    // Check if backup reminder should be shown
    checkBackupReminder();

    // Initialize species database
    initializeSpeciesDatabase();
});

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

    // Handle catch form submission
    catchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get datetime - the only required field
        const datetime = document.getElementById('datetime').value;
        if (!datetime) {
            showMessage('Please enter the date and time', 'error');
            return;
        }

        // Get length value - we'll treat it as the optional main field
        const length = lengthInput.value ? parseFloat(lengthInput.value) : null;

        // Create catch object - making sure to only include non-empty fields
        const catchData = {
            id: crypto.randomUUID(),
            datetime,
            length,
            species: speciesInput.value.trim() || null,
            weight: weightInput.value ? parseFloat(weightInput.value) : null,
            notes: document.getElementById('notes').value.trim() || null,
            locationName: document.getElementById('location-name').value || null,
            latitude: document.getElementById('latitude').value ? parseFloat(document.getElementById('latitude').value) : null,
            longitude: document.getElementById('longitude').value ? parseFloat(document.getElementById('longitude').value) : null,
            photo: document.getElementById('photo').dataset.imageData || null,
            timestamp: Date.now()
        };

        try {
            // Get existing catches from localStorage
            const catches = JSON.parse(localStorage.getItem('catches') || '[]');
            
            // Add new catch
            catches.push(catchData);
            
            // Save updated catches array
            localStorage.setItem('catches', JSON.stringify(catches));

            // Show success message
            showMessage('Catch saved successfully!');

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

function calculateEstimatedWeight(species, length) {
    // Using more accurate coefficients for common fish species
    // W = aL^b where:
    // a = 0.000013 (common coefficient for many freshwater fish)
    // b = 3.0 (standard length-weight relationship)
    // Result will be in kg when length is in cm
    const a = 0.000013;
    const b = 3.0;
    const estimatedWeight = a * Math.pow(length, b);
    
    // Update weight input with calculated value, rounded to 3 decimal places
    const weightInput = document.getElementById('weight');
    weightInput.value = estimatedWeight.toFixed(3);
    
    // Mark the weight as valid since we calculated it
    weightInput.dataset.calculated = 'true';
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
    const datetime = document.getElementById('edit-datetime').value;
    const locationName = document.getElementById('edit-location-name').value.trim();
    const notes = document.getElementById('edit-notes').value.trim();
    const latitude = document.getElementById('edit-latitude').value;
    const longitude = document.getElementById('edit-longitude').value;
    const photo = document.getElementById('edit-photo').value;

    // Validate required fields
    if (!species || !length || !weight || !datetime) {
        showMessage('Please fill in all required fields (species, length, weight, and date/time)', 'error');
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
            length,
            weight,
            datetime,
            locationName: locationName || null,
            notes: notes || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            photo: photo || null,
            lastModified: Date.now()
        };

        // Save back to localStorage
        localStorage.setItem('catches', JSON.stringify(catches));
        
        // Hide edit modal
        document.getElementById('edit-modal').classList.add('hidden');
        
        // Refresh displays
        loadCatchHistory();
        if (!document.getElementById('records-container').classList.contains('hidden')) {
            displayRecords();
        }
        
        showMessage('Catch updated successfully');
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

// Species Management Functions
function setupSpeciesHandlers() {
    const speciesInput = document.getElementById('species');
    const lengthInput = document.getElementById('length');
    const weightInput = document.getElementById('weight');
    const speciesDropdown = document.getElementById('species-dropdown');
    const manageSpeciesBtn = document.getElementById('manage-species-btn');
    
    // Initialize species list if empty
    if (!localStorage.getItem('species')) {
        const defaultSpecies = [
            'Bass', 'Trout', 'Salmon', 'Pike', 'Catfish', 'Perch', 'Carp'
        ].map(name => ({ name, isCustom: false }));
        localStorage.setItem('species', JSON.stringify(defaultSpecies));
    }

    // Listen for species changes to update length range and weight placeholder
    speciesInput.addEventListener('change', () => {
        updateLengthAndWeightPlaceholders();
    });
    
    // Listen for length changes to calculate weight
    lengthInput.addEventListener('input', () => {
        const length = parseFloat(lengthInput.value);
        const species = speciesInput.value;
        
        if (length && species) {
            const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
            const selectedSpecies = speciesList.find(s => s.name === species);
            
            if (selectedSpecies && selectedSpecies.a && selectedSpecies.b) {
                // Calculate weight using species-specific formula
                const estimatedWeight = selectedSpecies.a * Math.pow(length, selectedSpecies.b);
                weightInput.value = estimatedWeight.toFixed(3);
            } else {
                // Use default formula
                calculateEstimatedWeight(species, length);
            }
        }
    });
    
    function updateLengthAndWeightPlaceholders() {
        const species = speciesInput.value;
        if (!species) {
            lengthInput.placeholder = "Enter fish length";
            weightInput.placeholder = "Will auto-calculate from length";
            return;
        }
        
        const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
        const selectedSpecies = speciesList.find(s => s.name === species);
        
        if (selectedSpecies) {
            // Update length input with min/max range if available
            if (selectedSpecies.minLength && selectedSpecies.maxLength) {
                lengthInput.placeholder = `Typical range: ${selectedSpecies.minLength}-${selectedSpecies.maxLength}cm`;
            } else {
                lengthInput.placeholder = "Enter fish length";
            }
            
            // Update weight input placeholder to show it will calculate
            if (selectedSpecies.a && selectedSpecies.b) {
                weightInput.placeholder = "Will calculate based on species formula";
            } else {
                weightInput.placeholder = "Will auto-calculate from length";
            }
        } else {
            lengthInput.placeholder = "Enter fish length";
            weightInput.placeholder = "Will auto-calculate from length";
        }
    }

    function refreshSpeciesList() {
        const speciesList = JSON.parse(localStorage.getItem('species') || '[]');
        
        // Update dropdown if it's visible
        if (!speciesDropdown.classList.contains('hidden')) {
            const searchTerm = speciesInput.value.toLowerCase();
            const matches = speciesList.filter(species => 
                species.name.toLowerCase().includes(searchTerm)
            );
            updateSpeciesDropdown(matches);
        }
        
        // Update manager list if it's visible
        if (!document.getElementById('manage-species-modal').classList.contains('hidden')) {
            displayCustomSpeciesList();
        }
    }

    function updateSpeciesDropdown(matches) {
        if (matches.length > 0) {
            speciesDropdown.innerHTML = matches
                .map(species => `
                    <div class="species-option px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        ${species.name}
                    </div>
                `)
                .join('');
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
                    // Update length and weight placeholders for selected species
                    updateLengthAndWeightPlaceholders();
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
            species.name.toLowerCase().includes(searchTerm)
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
    speciesForm.addEventListener('submit', (e) => {
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
        refreshSpeciesList();
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
    const photoStatus = document.getElementById('photo-status');
    const photoBtn = document.getElementById('photo-btn');
    
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            photoStatus.textContent = `Selected: ${file.name}`;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                // Store the image data URL
                photoInput.dataset.imageData = e.target.result;
            };
            reader.readAsDataURL(file);
        } else if (file) {
            photoStatus.textContent = 'Invalid file type. Please select an image.';
            photoInput.value = '';
        } else {
            photoStatus.textContent = 'No photo selected';
        }
    });
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
                    <h3 class="text-lg font-semibold text-blue-700">${catch_.species || 'Unspecified Fish'}</h3>
                    <span class="text-sm text-gray-500">${new Date(catch_.datetime).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                    <div class="mt-2 space-y-1">
                        ${catch_.length ? `<p class="text-sm"><span class="font-medium">Length:</span> ${catch_.length}cm</p>` : ''}
                        ${catch_.weight ? `<p class="text-sm"><span class="font-medium">Weight:</span> ${Number(catch_.weight).toFixed(3)}kg</p>` : ''}
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
    document.getElementById('modal-species').textContent = catchData.species || 'Unspecified Fish';
    document.getElementById('modal-date').textContent = new Date(catchData.datetime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Only show length and weight if they exist
    const modalLength = document.getElementById('modal-length');
    const modalWeight = document.getElementById('modal-weight');
    
    if (catchData.length) {
        modalLength.textContent = `Length: ${catchData.length}cm`;
        modalLength.classList.remove('hidden');
    } else {
        modalLength.classList.add('hidden');
    }
    
    if (catchData.weight) {
        modalWeight.textContent = `Weight: ${Number(catchData.weight).toFixed(3)}kg`;
        modalWeight.classList.remove('hidden');
    } else {
        modalWeight.classList.add('hidden');
    }
    
    const locationContainer = document.getElementById('modal-location-container');
    const locationName = document.getElementById('modal-location-name');
    const mapContainer = document.getElementById('modal-map-container');
    
    if (catchData.locationName) {
        locationContainer.classList.remove('hidden');
        locationName.textContent = catchData.locationName;
        
        // Handle location map
        if (catchData.latitude && catchData.longitude) {
            locationName.href = `https://www.google.com/maps?q=${catchData.latitude},${catchData.longitude}`;
            mapContainer.classList.remove('hidden');
            
            // Initialize the map after a brief delay to ensure the modal is visible
            setTimeout(() => {
                const modalMap = L.map('modal-map').setView([catchData.latitude, catchData.longitude], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 18
                }).addTo(modalMap);
                
                // Add a marker at the catch location
                L.marker([catchData.latitude, catchData.longitude]).addTo(modalMap);
                
                // Ensure the map renders correctly
                modalMap.invalidateSize();
                
                // Store map instance for cleanup
                window.modalMapInstance = modalMap;
            }, 100);
        } else {
            mapContainer.classList.add('hidden');
            locationName.removeAttribute('href');
        }
    } else {
        locationContainer.classList.add('hidden');
        mapContainer.classList.add('hidden');
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
        // Clean up the map before closing the modal to prevent issues
        if (window.modalMapInstance) {
            window.modalMapInstance.remove();
            window.modalMapInstance = null;
        }
        catchModal.classList.add('hidden');
        showEditModal(catchData);
    };
    
    // Setup delete button
    document.getElementById('delete-catch-btn').onclick = () => {
        // Clean up the map before closing the modal to prevent issues
        if (window.modalMapInstance) {
            window.modalMapInstance.remove();
            window.modalMapInstance = null;
        }
        catchModal.classList.add('hidden');
        showDeleteConfirmation(catchData);
    };
    
    // Show the modal
    catchModal.classList.remove('hidden');
    
    // Close modal when clicking outside
    catchModal.addEventListener('click', (e) => {
        if (e.target === catchModal) {
            // Clean up the map before closing the modal
            if (window.modalMapInstance) {
                window.modalMapInstance.remove();
                window.modalMapInstance = null;
            }
            catchModal.classList.add('hidden');
        }
    });

    // Setup close button
    document.getElementById('close-modal-btn').onclick = () => {
        // Clean up the map before closing the modal
        if (window.modalMapInstance) {
            window.modalMapInstance.remove();
            window.modalMapInstance = null;
        }
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
        // Enhanced export with metadata and versioning
        const exportData = {
            catches,
            species,
            metadata: {
                version: "1.1.0",
                exportDate: new Date().toISOString(),
                catchCount: catches.length,
                speciesCount: species.length,
                appName: "Ghoti - Hooked",
                checksum: generateSimpleChecksum(JSON.stringify(catches) + JSON.stringify(species))
            }
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
        
        // Set last backup date
        localStorage.setItem('lastBackupDate', new Date().toISOString());
        checkBackupReminder();
    });

    // Handle data import
    importDataInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    // Validate import data
                    if (!validateImportData(importData)) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Show import options modal
                    showImportOptionsModal(importData);
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

// Helper function to generate a simple checksum for data integrity
function generateSimpleChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// Validate imported data
function validateImportData(importData) {
    // Check for required data structures
    if (!importData.catches || !Array.isArray(importData.catches)) {
        return false;
    }
    
    if (!importData.species || !Array.isArray(importData.species)) {
        return false;
    }
    
    // Validate each catch has required fields
    for (const catchItem of importData.catches) {
        if (!catchItem.id || !catchItem.datetime) {
            return false;
        }
    }
    
    // Validate each species has required fields
    for (const species of importData.species) {
        if (!species.name) {
            return false;
        }
    }
    
    return true;
}

// Show import options modal
function showImportOptionsModal(importData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('import-options-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'import-options-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
                <h3 class="text-xl font-bold text-blue-700 mb-2">Import Options</h3>
                <div id="import-summary" class="mb-4 text-sm bg-gray-50 p-3 rounded">
                    <p><strong>File contains:</strong></p>
                    <ul class="list-disc list-inside"></ul>
                </div>
                <p class="text-gray-600 mb-4">How would you like to import this data?</p>
                <div class="space-y-3">
                    <button id="merge-data-btn" class="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600">
                        Merge with existing data
                    </button>
                    <button id="replace-data-btn" class="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600">
                        Replace all existing data
                    </button>
                    <button id="cancel-import-btn" class="w-full px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Update import summary
    const summaryList = modal.querySelector('#import-summary ul');
    summaryList.innerHTML = `
        <li>${importData.catches.length} catch records</li>
        <li>${importData.species.length} species</li>
        ${importData.metadata ? `<li>Export date: ${new Date(importData.metadata.exportDate).toLocaleDateString()}</li>` : ''}
    `;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Setup event handlers
    document.getElementById('merge-data-btn').onclick = () => {
        mergeImportedData(importData);
        modal.classList.add('hidden');
    };
    
    document.getElementById('replace-data-btn').onclick = () => {
        replaceWithImportedData(importData);
        modal.classList.add('hidden');
    };
    
    document.getElementById('cancel-import-btn').onclick = () => {
        modal.classList.add('hidden');
    };
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// Merge imported data with existing data
function mergeImportedData(importData) {
    try {
        // Get existing data
        const existingCatches = JSON.parse(localStorage.getItem('catches') || '[]');
        const existingSpecies = JSON.parse(localStorage.getItem('species') || '[]');
        
        // Create ID sets for faster lookups
        const existingCatchIds = new Set(existingCatches.map(c => c.id));
        const existingSpeciesNames = new Set(existingSpecies.map(s => s.name));
        
        // Merge catches (avoid duplicates by ID)
        const newCatches = importData.catches.filter(c => !existingCatchIds.has(c.id));
        const mergedCatches = [...existingCatches, ...newCatches];
        
        // Merge species (avoid duplicates by name)
        const newSpecies = importData.species.filter(s => !existingSpeciesNames.has(s.name));
        const mergedSpecies = [...existingSpecies, ...newSpecies];
        
        // Save merged data
        localStorage.setItem('catches', JSON.stringify(mergedCatches));
        localStorage.setItem('species', JSON.stringify(mergedSpecies));
        
        // Update UI
        loadCatchHistory();
        if (!document.getElementById('records-container').classList.contains('hidden')) {
            displayRecords();
        }
        
        showMessage(`Data merged successfully. Added ${newCatches.length} catches and ${newSpecies.length} species.`);
    } catch (error) {
        console.error('Error merging data:', error);
        showMessage('Error merging data. Please try again.', 'error');
    }
}

// Replace all existing data with imported data
function replaceWithImportedData(importData) {
    try {
        // Save imported data (replacing existing)
        localStorage.setItem('catches', JSON.stringify(importData.catches));
        localStorage.setItem('species', JSON.stringify(importData.species));
        
        // Update UI
        loadCatchHistory();
        if (!document.getElementById('records-container').classList.contains('hidden')) {
            displayRecords();
        }
        
        showMessage(`Data replaced successfully. Now have ${importData.catches.length} catches and ${importData.species.length} species.`);
    } catch (error) {
        console.error('Error replacing data:', error);
        showMessage('Error replacing data. Please try again.', 'error');
    }
}

// Check if backup reminder should be shown
function checkBackupReminder() {
    const lastBackupDate = localStorage.getItem('lastBackupDate');
    
    // No reminder if no data or already backed up recently
    if (!lastBackupDate) {
        const catches = JSON.parse(localStorage.getItem('catches') || '[]');
        if (catches.length > 5) {
            // Show reminder for users with 5+ catches and no backup
            showBackupReminder();
        }
        return;
    }
    
    // Check if backup is older than 30 days
    const lastBackup = new Date(lastBackupDate);
    const now = new Date();
    const daysSinceBackup = Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24));
    
    if (daysSinceBackup >= 30) {
        showBackupReminder();
    }
}

// Show backup reminder
function showBackupReminder() {
    let reminderBanner = document.getElementById('backup-reminder');
    if (!reminderBanner) {
        reminderBanner = document.createElement('div');
        reminderBanner.id = 'backup-reminder';
        reminderBanner.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 relative';
        reminderBanner.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <span class="text-xl">⚠️</span>
                </div>
                <div class="ml-3">
                    <p class="text-sm">It's been a while since you backed up your fishing data. Consider exporting your data to avoid losing your records.</p>
                </div>
                <div class="ml-auto pl-3">
                    <button id="backup-now-btn" class="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 text-xs font-medium px-3 py-1 rounded">
                        Backup Now
                    </button>
                    <button id="dismiss-reminder-btn" class="ml-2 text-yellow-500 hover:text-yellow-800">
                        ✕
                    </button>
                </div>
            </div>
        `;
        
        // Insert after app heading
        const heading = document.querySelector('#app-content h1');
        if (heading) {
            heading.parentNode.insertBefore(reminderBanner, heading.nextSibling);
        } else {
            document.querySelector('#app-content .form-section').prepend(reminderBanner);
        }
        
        // Setup event handlers
        document.getElementById('backup-now-btn').addEventListener('click', () => {
            document.getElementById('export-data-btn').click();
            reminderBanner.remove();
        });
        
        document.getElementById('dismiss-reminder-btn').addEventListener('click', () => {
            // Update last backup date to dismiss for another 30 days
            localStorage.setItem('lastBackupDate', new Date().toISOString());
            reminderBanner.remove();
        });
    }
}

function setupViewToggle() {
    const historyViewBtn = document.getElementById('history-view-btn');
    const recordsViewBtn = document.getElementById('records-view-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const catchLog = document.getElementById('catch-log');
    const recordsContainer = document.getElementById('records-container');
    const mapContainer = document.getElementById('map-container');
    const viewHeading = document.getElementById('view-heading');

    // Show history view by default
    historyViewBtn.classList.add('bg-blue-500', 'text-white');
    historyViewBtn.classList.remove('bg-blue-100', 'text-blue-700');
    
    // Handle history view button click
    historyViewBtn.addEventListener('click', () => {
        // Update UI
        catchLog.classList.remove('hidden');
        recordsContainer.classList.add('hidden');
        mapContainer.classList.add('hidden');
        viewHeading.textContent = 'Catch History';
        
        // Update button styles
        historyViewBtn.classList.add('bg-blue-500', 'text-white');
        historyViewBtn.classList.remove('bg-blue-100', 'text-blue-700');
        recordsViewBtn.classList.add('bg-blue-100', 'text-blue-700');
        recordsViewBtn.classList.remove('bg-blue-500', 'text-white');
        mapViewBtn.classList.add('bg-blue-100', 'text-blue-700');
        mapViewBtn.classList.remove('bg-blue-500', 'text-white');
        
        // Update content
        loadCatchHistory();
    });
    
    // Handle records view button click
    recordsViewBtn.addEventListener('click', () => {
        // Update UI
        catchLog.classList.add('hidden');
        recordsContainer.classList.remove('hidden');
        mapContainer.classList.add('hidden');
        viewHeading.textContent = 'Personal Records';
        
        // Update button styles
        historyViewBtn.classList.add('bg-blue-100', 'text-blue-700');
        historyViewBtn.classList.remove('bg-blue-500', 'text-white');
        recordsViewBtn.classList.add('bg-blue-500', 'text-white');
        recordsViewBtn.classList.remove('bg-blue-100', 'text-blue-700');
        mapViewBtn.classList.add('bg-blue-100', 'text-blue-700');
        mapViewBtn.classList.remove('bg-blue-500', 'text-white');
        
        // Update content
        displayRecords();
    });
    
    // Handle map view button click
    mapViewBtn.addEventListener('click', () => {
        // Update UI
        catchLog.classList.add('hidden');
        recordsContainer.classList.add('hidden');
        mapContainer.classList.remove('hidden');
        viewHeading.textContent = 'Catch Map';
        
        // Update button styles
        historyViewBtn.classList.add('bg-blue-100', 'text-blue-700');
        historyViewBtn.classList.remove('bg-blue-500', 'text-white');
        recordsViewBtn.classList.add('bg-blue-100', 'text-blue-700');
        recordsViewBtn.classList.remove('bg-blue-500', 'text-white');
        mapViewBtn.classList.add('bg-blue-500', 'text-white');
        mapViewBtn.classList.remove('bg-blue-100', 'text-blue-700');
        
        // Initialize and display the map
        initializeMap();
    });
}

// Map handling functions
let catchMap = null;
let catchMarkers = [];

function initializeMap() {
    if (!catchMap) {
        catchMap = L.map('catch-map').setView([51.505, -0.09], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(catchMap);
        
        // Add scale control
        L.control.scale().addTo(catchMap);
    }
    
    // Refresh markers (in case data has changed)
    displayCatchesOnMap();
    
    // Force map to recalculate its size since it was hidden
    setTimeout(() => {
        catchMap.invalidateSize();
    }, 100);
}

function displayCatchesOnMap() {
    // Clear existing markers
    clearMapMarkers();
    
    // Get all catches
    const catches = JSON.parse(localStorage.getItem('catches') || '[]');
    const catchesWithLocation = catches.filter(c => c.latitude && c.longitude);
    
    if (catchesWithLocation.length === 0) {
        // Show message if no catches with location
        const noLocationMsg = document.createElement('div');
        noLocationMsg.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4';
        noLocationMsg.innerHTML = '<p>No catches with location data available. Add location data to your catches to see them on the map.</p>';
        document.getElementById('map-container').prepend(noLocationMsg);
        
        // Set default view
        catchMap.setView([0, 0], 2);
        return;
    }
    
    // Remove any existing message
    const existingMsg = document.getElementById('map-container').querySelector('.bg-yellow-100');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Add markers for each catch with location
    const bounds = [];
    catchesWithLocation.forEach(catch_ => {
        const marker = L.marker([catch_.latitude, catch_.longitude])
            .addTo(catchMap)
            .bindPopup(`
                <div class="font-semibold text-blue-700">${catch_.species}</div>
                <div class="text-sm">${catch_.length}cm, ${Number(catch_.weight).toFixed(3)}kg</div>
                <div class="text-xs text-gray-500">${new Date(catch_.datetime).toLocaleDateString()}</div>
                ${catch_.locationName ? `<div class="text-xs">${catch_.locationName}</div>` : ''}
                <div class="mt-2">
                    <button class="view-catch-btn px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200" 
                            data-catch-id="${catch_.id}">
                        View Details
                    </button>
                </div>
            `);
            
        // Setup click handler directly on popup content
        marker.on('popupopen', function() {
            setTimeout(() => {
                const btn = document.querySelector('.view-catch-btn');
                if (btn) {
                    btn.addEventListener('click', function() {
                        const catchId = this.dataset.catchId;
                        const catchData = catches.find(c => c.id === catchId);
                        if (catchData) {
                            showCatchModal(catchData);
                        }
                    });
                }
            }, 10);
        });
        
        // Store the marker and add the coordinates to bounds
        catchMarkers.push(marker);
        bounds.push([catch_.latitude, catch_.longitude]);
    });
    
    // Fit map to show all markers if there are any
    if (bounds.length > 0) {
        catchMap.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 15
        });
    }
}

function clearMapMarkers() {
    // Remove all existing markers
    catchMarkers.forEach(marker => {
        catchMap.removeLayer(marker);
    });
    catchMarkers = [];
}

// Initialize species database with size ranges and weight coefficients
function initializeSpeciesDatabase() {
    const currentSpecies = JSON.parse(localStorage.getItem('species') || '[]');
    
    // Only add data if it doesn't exist yet
    if (!currentSpecies.some(s => s.hasOwnProperty('minLength'))) {
        const speciesData = [
            { 
                name: 'Bass', 
                minLength: 20, 
                maxLength: 70,
                a: 0.000013,
                b: 3.0,
                isCustom: false 
            },
            { 
                name: 'Trout', 
                minLength: 15, 
                maxLength: 80,
                a: 0.000012,
                b: 3.0,
                isCustom: false 
            },
            { 
                name: 'Salmon', 
                minLength: 30, 
                maxLength: 150,
                a: 0.000011,
                b: 3.02,
                isCustom: false 
            },
            { 
                name: 'Pike', 
                minLength: 40, 
                maxLength: 130,
                a: 0.000008,
                b: 3.05,
                isCustom: false 
            },
            { 
                name: 'Catfish', 
                minLength: 25, 
                maxLength: 160,
                a: 0.000014,
                b: 3.1,
                isCustom: false 
            },
            { 
                name: 'Perch', 
                minLength: 10, 
                maxLength: 40,
                a: 0.000017,
                b: 2.98,
                isCustom: false 
            },
            { 
                name: 'Carp', 
                minLength: 25, 
                maxLength: 100,
                a: 0.000015,
                b: 3.08,
                isCustom: false 
            }
        ];
        
        // Update species with additional data
        const updatedSpecies = currentSpecies.map(species => {
            const matchedData = speciesData.find(s => s.name === species.name);
            if (matchedData) {
                return { ...species, ...matchedData };
            }
            return species;
        });
        
        // Add any missing default species
        speciesData.forEach(defaultSpecies => {
            if (!updatedSpecies.some(s => s.name === defaultSpecies.name)) {
                updatedSpecies.push(defaultSpecies);
            }
        });
        
        localStorage.setItem('species', JSON.stringify(updatedSpecies));
    }
}