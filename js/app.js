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
    const speciesDropdown = document.getElementById('species-dropdown');
    const manageSpeciesBtn = document.getElementById('manage-species-btn');
    
    // Initialize species list if empty
    if (!localStorage.getItem('species')) {
        const defaultSpecies = [
            'Bass', 'Trout', 'Salmon', 'Pike', 'Catfish', 'Perch', 'Carp'
        ].map(name => ({ name, isCustom: false }));
        localStorage.setItem('species', JSON.stringify(defaultSpecies));
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
                    <h3 class="text-lg font-semibold text-blue-700">${catch_.species}</h3>
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
    document.getElementById('modal-species').textContent = catchData.species;
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