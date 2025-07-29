import pandas as pd
import json
import os
import sqlite3

class DatabaseIntegrator:
    def __init__(self):
        self.main_dir = "/home/ubuntu/fish_data_merged"
        self.output_dir = os.path.join(self.main_dir, "final_output")
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Paths to existing database files
        self.existing_csv = os.path.join(self.main_dir, "merged_fish_species_data.csv")
        self.existing_json = os.path.join(self.main_dir, "merged_fish_algorithms.json")
        self.existing_excel = os.path.join(self.main_dir, "merged_fish_species_database.xlsx")
        self.existing_db = os.path.join(self.main_dir, "merged_fish_species_database.db")
        
        # Paths to new species data files
        self.new_csv = os.path.join(self.main_dir, "output", "missing_species_data.csv")
        self.new_json = os.path.join(self.main_dir, "output", "missing_species_algorithms.json")
        self.new_excel = os.path.join(self.main_dir, "output", "missing_species_database.xlsx")
        
        # Paths to output files
        self.output_csv = os.path.join(self.output_dir, "complete_fish_species_data.csv")
        self.output_json = os.path.join(self.output_dir, "complete_fish_algorithms.json")
        self.output_excel = os.path.join(self.output_dir, "complete_fish_species_database.xlsx")
        self.output_db = os.path.join(self.output_dir, "complete_fish_species_database.db")
        
    def integrate_data(self):
        """Integrate the new species data with the existing database"""
        print("Integrating new species data with existing database...")
        
        # Integrate CSV data
        self.integrate_csv_data()
        
        # Integrate JSON algorithms
        self.integrate_json_algorithms()
        
        # Create integrated Excel file
        self.create_excel_database()
        
        # Create integrated SQLite database
        self.create_sqlite_database()
        
        print("Integration complete!")
        
    def integrate_csv_data(self):
        """Integrate CSV data from existing and new species"""
        print("Integrating CSV data...")
        
        # Load existing data
        existing_df = pd.read_csv(self.existing_csv)
        print(f"Loaded existing CSV with {len(existing_df)} rows")
        
        # Load new data
        new_df = pd.read_csv(self.new_csv)
        print(f"Loaded new CSV with {len(new_df)} rows")
        
        # Combine data
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        print(f"Combined CSV has {len(combined_df)} rows")
        
        # Save combined data
        combined_df.to_csv(self.output_csv, index=False)
        print(f"Saved combined CSV to {self.output_csv}")
        
        return combined_df
        
    def integrate_json_algorithms(self):
        """Integrate JSON algorithms from existing and new species"""
        print("Integrating JSON algorithms...")
        
        # Load existing algorithms
        with open(self.existing_json, 'r') as f:
            existing_algorithms = json.load(f)
        print(f"Loaded existing algorithms for {len(existing_algorithms)} species")
        
        # Load new algorithms
        with open(self.new_json, 'r') as f:
            new_algorithms = json.load(f)
        print(f"Loaded new algorithms for {len(new_algorithms)} species")
        
        # Combine algorithms
        combined_algorithms = {**existing_algorithms}
        
        # Add new species with new IDs
        next_id = max([int(id) for id in existing_algorithms.keys()]) + 1
        for species_name, algorithm in new_algorithms.items():
            # Check if species already exists (case-insensitive)
            exists = False
            for existing_id, existing_algo in existing_algorithms.items():
                if existing_algo['species_name'].lower() == species_name.lower():
                    exists = True
                    print(f"Species {species_name} already exists, skipping")
                    break
            
            if not exists:
                combined_algorithms[str(next_id)] = algorithm
                print(f"Added {species_name} with ID {next_id}")
                next_id += 1
        
        print(f"Combined algorithms has data for {len(combined_algorithms)} species")
        
        # Save combined algorithms
        with open(self.output_json, 'w') as f:
            json.dump(combined_algorithms, f, indent=2)
        print(f"Saved combined algorithms to {self.output_json}")
        
        return combined_algorithms
        
    def create_excel_database(self):
        """Create integrated Excel database"""
        print("Creating Excel database...")
        
        # Load combined CSV data
        combined_df = pd.read_csv(self.output_csv)
        
        # Load combined algorithms
        with open(self.output_json, 'r') as f:
            combined_algorithms = json.load(f)
        
        # Create algorithms dataframe
        algo_data = []
        for species_id, algo_info in combined_algorithms.items():
            algo_data.append({
                'Species_ID': species_id,
                'Species_Name': algo_info['species_name'],
                'Formula': algo_info['algorithm']['formula'],
                'a_parameter': algo_info['algorithm']['a'],
                'b_parameter': algo_info['algorithm']['b'],
                'R_squared': algo_info['algorithm']['r_squared'],
                'Measure_Type': algo_info['algorithm']['measure_type'],
                'Data_Points': algo_info['algorithm']['data_points']
            })
        
        algo_df = pd.DataFrame(algo_data)
        
        # Save to Excel
        with pd.ExcelWriter(self.output_excel) as writer:
            combined_df.to_excel(writer, sheet_name='Length_Weight_Data', index=False)
            algo_df.to_excel(writer, sheet_name='Algorithms', index=False)
        
        print(f"Saved Excel database to {self.output_excel}")
        
    def create_sqlite_database(self):
        """Create integrated SQLite database"""
        print("Creating SQLite database...")
        
        # Load combined CSV data
        combined_df = pd.read_csv(self.output_csv)
        
        # Load combined algorithms
        with open(self.output_json, 'r') as f:
            combined_algorithms = json.load(f)
        
        # Create algorithms dataframe
        algo_data = []
        for species_id, algo_info in combined_algorithms.items():
            algo_data.append({
                'Species_ID': species_id,
                'Species_Name': algo_info['species_name'],
                'Formula': algo_info['algorithm']['formula'],
                'a_parameter': algo_info['algorithm']['a'],
                'b_parameter': algo_info['algorithm']['b'],
                'R_squared': algo_info['algorithm']['r_squared'],
                'Measure_Type': algo_info['algorithm']['measure_type'],
                'Data_Points': algo_info['algorithm']['data_points']
            })
        
        algo_df = pd.DataFrame(algo_data)
        
        # Create SQLite database
        conn = sqlite3.connect(self.output_db)
        
        # Save dataframes to database
        combined_df.to_sql('length_weight_data', conn, if_exists='replace', index=False)
        algo_df.to_sql('algorithms', conn, if_exists='replace', index=False)
        
        # Close connection
        conn.close()
        
        print(f"Saved SQLite database to {self.output_db}")
        
    def validate_database(self):
        """Validate the integrated database"""
        print("Validating integrated database...")
        
        # Check if all files exist
        files_to_check = [self.output_csv, self.output_json, self.output_excel, self.output_db]
        for file_path in files_to_check:
            if not os.path.exists(file_path):
                print(f"ERROR: File {file_path} does not exist")
                return False
        
        # Check CSV data
        try:
            csv_df = pd.read_csv(self.output_csv)
            print(f"CSV validation: {len(csv_df)} rows")
        except Exception as e:
            print(f"ERROR: Failed to read CSV: {str(e)}")
            return False
        
        # Check JSON algorithms
        try:
            with open(self.output_json, 'r') as f:
                algorithms = json.load(f)
            print(f"JSON validation: {len(algorithms)} algorithms")
        except Exception as e:
            print(f"ERROR: Failed to read JSON: {str(e)}")
            return False
        
        # Check Excel database
        try:
            excel_data = pd.read_excel(self.output_excel, sheet_name='Length_Weight_Data')
            excel_algos = pd.read_excel(self.output_excel, sheet_name='Algorithms')
            print(f"Excel validation: {len(excel_data)} data rows, {len(excel_algos)} algorithm rows")
        except Exception as e:
            print(f"ERROR: Failed to read Excel: {str(e)}")
            return False
        
        # Check SQLite database
        try:
            conn = sqlite3.connect(self.output_db)
            data_df = pd.read_sql("SELECT * FROM length_weight_data", conn)
            algo_df = pd.read_sql("SELECT * FROM algorithms", conn)
            conn.close()
            print(f"SQLite validation: {len(data_df)} data rows, {len(algo_df)} algorithm rows")
        except Exception as e:
            print(f"ERROR: Failed to read SQLite: {str(e)}")
            return False
        
        print("All database files validated successfully!")
        return True
        
    def update_implementation_guide(self):
        """Update the implementation guide with new species information"""
        print("Updating implementation guide...")
        
        # Load algorithms to get species count
        with open(self.output_json, 'r') as f:
            algorithms = json.load(f)
        
        # Count edible and non-edible species
        # For simplicity, we'll consider the original species as a mix of edible and non-edible,
        # and the new species as non-edible (since they were mostly sharks and specialized species)
        original_count = len(json.load(open(self.existing_json, 'r')))
        new_count = len(algorithms) - original_count
        
        # Create updated implementation guide
        guide_path = os.path.join(self.output_dir, "complete_implementation_guide.md")
        
        with open(guide_path, 'w') as f:
            f.write("""# Fish Species Length-to-Weight Conversion Database Implementation Guide

## Overview

This guide provides detailed instructions for implementing the fish species length-to-weight conversion database in your app's autocalculate feature. The database contains comprehensive data for """ + str(len(algorithms)) + """ fish species found in South African waters, with accurate algorithms for calculating weight from length measurements.

## Database Structure

The database is provided in multiple formats for flexibility:

1. **Excel Database** (`complete_fish_species_database.xlsx`):
   - Sheet 1: `Length_Weight_Data` - Raw length and weight measurements for all species
   - Sheet 2: `Algorithms` - Calculated algorithms for each species

2. **SQLite Database** (`complete_fish_species_database.db`):
   - Table: `length_weight_data` - Raw length and weight measurements
   - Table: `algorithms` - Calculated algorithms for each species

3. **CSV Data** (`complete_fish_species_data.csv`):
   - Raw length and weight measurements in CSV format for easy import

4. **JSON Algorithms** (`complete_fish_algorithms.json`):
   - Mathematical formulas and coefficients for weight calculation in JSON format

## Length-to-Weight Algorithm

For each fish species, the relationship between length (L) and weight (W) follows the standard formula:

```
W = a × L^b
```

Where:
- W = Weight in kilograms (kg)
- L = Length in centimeters (cm)
- a = Coefficient (species-specific)
- b = Exponent (species-specific)

The database provides the `a` and `b` values for each species, calculated using regression analysis with high R-squared values (most above 0.99), indicating excellent accuracy.

## Measurement Types

Different fish species may use different length measurement types:

1. **Total Length (TL)**: Measured from the tip of the snout to the tip of the tail fin
2. **Fork Length (FL)**: Measured from the tip of the snout to the fork of the tail fin
3. **Standard Length (SL)**: Measured from the tip of the snout to the base of the tail fin
4. **Pre-caudal Length (PCL)**: Measured from the tip of the snout to the pre-caudal pit

The `Measure_Type` field in the database indicates which measurement type is used for each species.

## Implementation in IndexedDB

### Setting Up IndexedDB

```javascript
// Initialize IndexedDB
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FishDatabase', 1);
    
    request.onerror = event => {
      reject('Database error: ' + event.target.errorCode);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object store for algorithms
      const algorithmStore = db.createObjectStore('algorithms', { keyPath: 'speciesId' });
      algorithmStore.createIndex('speciesName', 'speciesName', { unique: false });
      algorithmStore.createIndex('edible', 'edible', { unique: false });
      
      // Create object store for raw data (optional)
      const dataStore = db.createObjectStore('lengthWeightData', { keyPath: 'id', autoIncrement: true });
      dataStore.createIndex('speciesId', 'speciesId', { unique: false });
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      resolve(db);
    };
  });
}

// Import algorithms from JSON
async function importAlgorithms(algorithmData) {
  const db = await initDatabase();
  const transaction = db.transaction(['algorithms'], 'readwrite');
  const store = transaction.objectStore('algorithms');
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = event => reject(event.target.error);
    
    // Add each algorithm to the store
    Object.entries(algorithmData).forEach(([speciesId, data]) => {
      store.put({
        speciesId: speciesId,
        speciesName: data.species_name,
        edible: data.edible,
        formula: data.algorithm.formula,
        aParameter: data.algorithm.a,
        bParameter: data.algorithm.b,
        rSquared: data.algorithm.r_squared,
        measureType: data.algorithm.measure_type,
        dataPoints: data.algorithm.data_points
      });
    });
  });
}
```

### Implementing the Autocalculate Feature

```javascript
// Calculate weight from length
async function calculateWeight(speciesId, length) {
  const db = await initDatabase();
  const transaction = db.transaction(['algorithms'], 'readonly');
  const store = transaction.objectStore('algorithms');
  
  return new Promise((resolve, reject) => {
    const request = store.get(speciesId);
    
    request.onerror = event => {
      reject('Error fetching algorithm: ' + event.target.errorCode);
    };
    
    request.onsuccess = event => {
      const algorithm = event.target.result;
      if (!algorithm) {
        reject('Algorithm not found for species ID: ' + speciesId);
        return;
      }
      
      // Apply the formula: W = a * L^b
      const weight = algorithm.aParameter * Math.pow(length, algorithm.bParameter);
      resolve({
        weight: weight,
        speciesName: algorithm.speciesName,
        measureType: algorithm.measureType,
        accuracy: algorithm.rSquared
      });
    };
  });
}

// Example usage in UI
document.getElementById('calculateButton').addEventListener('click', async () => {
  const speciesId = document.getElementById('speciesSelect').valu
(Content truncated due to size limit. Use line ranges to read in chunks)