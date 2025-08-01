# Fish Species Length-to-Weight Database Implementation Guide (Updated)

## Overview

This document provides guidance on implementing the fish species length-to-weight database in your app's autocalculate feature. The database contains length-to-weight ratios for seven commonly caught South African fish species, with algorithms that can be used to calculate weight from length measurements.

## Species Included

The database includes the following species:

1. **Dusky kob (M&F)** - One of the most sought-after coastal fish in South Africa
2. **Shad (M&F)** - Common coastal species
3. **Galjoen (M&F)** - South Africa's national fish
4. **Blacktail (M&F)** - Common coastal species
5. **Garrick (M&F)** - Popular game fish in coastal waters
6. **Brown shyshark (M&F)** - Common non-edible species
7. **Cape Stumpnose (M&F)** - Listed as "Malabar kingfish" in the database

## Database Structure

### CSV Database (`all_fish_species_data.csv`)
The raw data is provided in CSV format with the following columns:
- `Measure_Type`: The type of length measurement (e.g., "Total length", "Fork length")
- `Length`: The length measurement in centimeters (cm)
- `Weight`: The corresponding weight in kilograms (kg)
- `Species`: The name of the fish species
- `Species_ID`: Unique identifier for the species
- `Edible`: Boolean indicating whether the species is edible (True/False)

### Excel Database (`fish_species_database.xlsx`)
The Excel database contains two sheets:
1. `Length_Weight_Data`: Contains the same data as the CSV file
2. `Algorithms`: Contains the length-to-weight algorithms for each species

### SQL Database (`fish_species_database.db`)
The SQLite database contains two tables:
1. `length_weight_data`: Contains the same data as the CSV file
2. `algorithms`: Contains the length-to-weight algorithms for each species

### Algorithms JSON (`fish_algorithms.json`)
This file contains the mathematical algorithms for calculating weight from length for each species, including:
- Formula: `W = a * L^b` (standard length-weight relationship)
- `a` parameter: Coefficient
- `b` parameter: Exponent
- `r_squared`: Statistical measure of fit quality
- `measure_type`: The type of length measurement used

## Length-to-Weight Calculation

The standard formula for calculating weight from length is:

```
Weight (kg) = a * [Length (cm)]^b
```

Where:
- `a` is the coefficient specific to each species
- `b` is the exponent specific to each species
- Both parameters are provided in the algorithms JSON and Excel sheet

## Algorithm Accuracy

All included species have high-quality algorithms with R-squared values above 0.98, indicating excellent fit:

| Species | R-squared | Measure Type |
|---------|-----------|--------------|
| Dusky kob | 0.999 | Total length |
| Shad | 0.999 | Fork length |
| Galjoen | 0.999 | Total length |
| Blacktail | 0.982 | Fork length |
| Garrick | 0.996 | Fork length |
| Brown shyshark | 0.999 | Total length |
| Cape Stumpnose | 0.984 | Fork length |

## Implementation in IndexedDB

### Setting Up IndexedDB

```javascript
// Open a connection to IndexedDB
const request = indexedDB.open("FishSpeciesDB", 1);

// Create object stores on database initialization
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  
  // Create object store for length-weight data
  const dataStore = db.createObjectStore("lengthWeightData", { keyPath: "id", autoIncrement: true });
  dataStore.createIndex("speciesId", "Species_ID", { unique: false });
  dataStore.createIndex("species", "Species", { unique: false });
  
  // Create object store for algorithms
  const algoStore = db.createObjectStore("algorithms", { keyPath: "Species_ID" });
};

// Handle successful database opening
request.onsuccess = function(event) {
  const db = event.target.result;
  // Import data from JSON or CSV
  importData(db);
};
```

### Importing Data

```javascript
function importData(db) {
  // Fetch the CSV data
  fetch('all_fish_species_data.csv')
    .then(response => response.text())
    .then(csvText => {
      // Parse CSV
      const data = parseCSV(csvText);
      
      // Add to IndexedDB
      const transaction = db.transaction(["lengthWeightData"], "readwrite");
      const store = transaction.objectStore("lengthWeightData");
      
      data.forEach(item => {
        store.add(item);
      });
    });
    
  // Fetch the algorithms
  fetch('fish_algorithms.json')
    .then(response => response.json())
    .then(algorithms => {
      const transaction = db.transaction(["algorithms"], "readwrite");
      const store = transaction.objectStore("algorithms");
      
      Object.keys(algorithms).forEach(speciesId => {
        store.add({
          Species_ID: speciesId,
          ...algorithms[speciesId]
        });
      });
    });
}
```

### Auto-Calculate Feature Implementation

```javascript
function calculateWeight(speciesId, length, callback) {
  const request = indexedDB.open("FishSpeciesDB", 1);
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(["algorithms"], "readonly");
    const store = transaction.objectStore("algorithms");
    
    const getRequest = store.get(speciesId);
    
    getRequest.onsuccess = function(event) {
      const algorithm = event.target.result;
      
      if (algorithm) {
        // Apply the formula: W = a * L^b
        const a = algorithm.algorithm.a;
        const b = algorithm.algorithm.b;
        const weight = a * Math.pow(length, b);
        
        callback({
          success: true,
          weight: weight,
          unit: "kg",
          species: algorithm.species_name,
          measureType: algorithm.algorithm.measure_type
        });
      } else {
        callback({
          success: false,
          error: "Species not found"
        });
      }
    };
  };
}
```

### Usage Example

```javascript
// Example: Calculate weight for Dusky kob with length 50cm
calculateWeight("333", 50, function(result) {
  if (result.success) {
    console.log(`Estimated weight: ${result.weight.toFixed(2)} kg`);
    console.log(`Measurement type: ${result.measureType}`);
  } else {
    console.error(result.error);
  }
});
```

## Notes on Data Limitations

1. The current database contains data for seven representative fish species commonly caught in South Africa.

2. Some species that were targeted but could not be extracted due to data limitations:
   - Baardman/Belman
   - Geelbek
   - Snoek
   - Some freshwater species like Common Carp and Tilapia may not be listed on this primarily marine-focused website

3. For species not in the database, you could:
   - Use a generic algorithm based on similar fish types
   - Display a message that the species is not supported
   - Allow manual input of weight

## Future Enhancements

1. Expand the database to include more species
2. Add images for each species
3. Include seasonal variations in length-weight relationships
4. Add geographic distribution data

## Species ID Reference

For easy reference, here are the IDs for each species in the database:

| Species ID | Species Name |
|------------|--------------|
| 333 | Dusky kob (M&F) |
| 344 | Shad (M&F) |
| 345 | Galjoen (M&F) |
| 342 | Blacktail (M&F) |
| 350 | Garrick (M&F) |
| 432 | Brown shyshark (M&F) |
| 535 | Cape Stumpnose (M&F) |
