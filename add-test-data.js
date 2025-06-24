// Add some test data for debugging
console.log('Adding test data...');

const testCatches = [
    {
        id: Date.now().toString(),
        species: 'Bass',
        length: 35.5,
        weight: 1.2,
        lengthUnit: 'cm',
        weightUnit: 'kg',
        datetime: '2025-06-24T14:30',
        latitude: 40.7128,
        longitude: -74.0060,
        locationName: 'Central Park Lake',
        notes: 'Caught with sardine bait, sunny weather',
        photo: null
    },
    {
        id: (Date.now() + 1000).toString(),
        species: 'Trout',
        length: 28.0,
        weight: 0.8,
        lengthUnit: 'cm',
        weightUnit: 'kg',
        datetime: '2025-06-23T09:15',
        latitude: 40.7580,
        longitude: -73.9855,
        locationName: 'Times Square Pond',
        notes: 'Morning catch',
        photo: null
    }
];

localStorage.setItem('catches', JSON.stringify(testCatches));
console.log('Test data added:', testCatches);

// Test loading catch history
if (typeof loadCatchHistory === 'function') {
    loadCatchHistory();
    console.log('Catch history reloaded');
} else {
    console.error('loadCatchHistory function not found');
}
