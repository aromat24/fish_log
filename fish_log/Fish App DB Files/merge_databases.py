import pandas as pd
import json
import os
import sqlite3

# Define paths
edible_dir = '/home/ubuntu/fish_data_edible_update/output'
non_edible_dir = '/home/ubuntu/fish_data_update/output'
merged_dir = '/home/ubuntu/fish_data_merged'

# Create merged directory if it doesn't exist
os.makedirs(merged_dir, exist_ok=True)

# Function to merge databases
def merge_databases():
    print("Merging edible and non-edible databases...")
    
    # Define file paths
    edible_csv_path = os.path.join(edible_dir, 'edible_all_species_data.csv')
    edible_json_path = os.path.join(edible_dir, 'edible_algorithms.json')
    
    non_edible_csv_path = os.path.join(non_edible_dir, 'non_edible_fish_species_data.csv')
    non_edible_json_path = os.path.join(non_edible_dir, 'non_edible_fish_algorithms.json')
    
    try:
        # Load CSV data
        print(f"Loading edible data from {edible_csv_path}")
        edible_df = pd.read_csv(edible_csv_path)
        print(f"Loading non-edible data from {non_edible_csv_path}")
        non_edible_df = pd.read_csv(non_edible_csv_path)
        print(f"Loaded edible CSV with {len(edible_df)} rows")
        print(f"Loaded non-edible CSV with {len(non_edible_df)} rows")
        
        # Load algorithm data
        print(f"Loading edible algorithms from {edible_json_path}")
        with open(edible_json_path, 'r') as f:
            edible_algorithms = json.load(f)
        print(f"Loading non-edible algorithms from {non_edible_json_path}")
        with open(non_edible_json_path, 'r') as f:
            non_edible_algorithms = json.load(f)
        print(f"Loaded edible algorithms for {len(edible_algorithms)} species")
        print(f"Loaded non-edible algorithms for {len(non_edible_algorithms)} species")
        
        # Merge data
        merged_df = pd.concat([edible_df, non_edible_df], ignore_index=True)
        merged_algorithms = {**edible_algorithms, **non_edible_algorithms}
        print(f"Merged CSV has {len(merged_df)} rows")
        print(f"Merged algorithms has data for {len(merged_algorithms)} species")
        
        # Save merged data
        merged_csv_path = os.path.join(merged_dir, 'merged_fish_species_data.csv')
        merged_json_path = os.path.join(merged_dir, 'merged_fish_algorithms.json')
        merged_df.to_csv(merged_csv_path, index=False)
        with open(merged_json_path, 'w') as f:
            json.dump(merged_algorithms, f, indent=2)
        
        # Create Excel file
        print("Creating merged Excel database...")
        merged_excel_path = os.path.join(merged_dir, 'merged_fish_species_database.xlsx')
        with pd.ExcelWriter(merged_excel_path) as writer:
            merged_df.to_excel(writer, sheet_name='Length_Weight_Data', index=False)
            
            # Create algorithms sheet
            algo_data = []
            for species_id, data in merged_algorithms.items():
                algo_data.append({
                    'Species_ID': species_id,
                    'Species_Name': data['species_name'],
                    'Edible': data['edible'],
                    'Formula': data['algorithm']['formula'],
                    'a_parameter': data['algorithm']['a'],
                    'b_parameter': data['algorithm']['b'],
                    'R_squared': data['algorithm']['r_squared'],
                    'Measure_Type': data['algorithm'].get('measure_type', 'Unknown'),
                    'Data_Points': data['algorithm'].get('data_points', 0)
                })
            
            if algo_data:
                algo_df = pd.DataFrame(algo_data)
                algo_df.to_excel(writer, sheet_name='Algorithms', index=False)
        
        # Create SQL database
        print("Creating merged SQL database...")
        merged_db_path = os.path.join(merged_dir, 'merged_fish_species_database.db')
        conn = sqlite3.connect(merged_db_path)
        
        # Create tables
        merged_df.to_sql('length_weight_data', conn, if_exists='replace', index=False)
        
        # Create algorithms table
        if algo_data:
            algo_df = pd.DataFrame(algo_data)
            algo_df.to_sql('algorithms', conn, if_exists='replace', index=False)
        
        conn.close()
        
        print("Merged database creation completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error merging databases: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    merge_databases()
