import pandas as pd
import json
import os
import sqlite3

# Create output directories if they don't exist
os.makedirs('output', exist_ok=True)

# Define the key non-edible species we want to ensure are included
key_species = [
    {"id": "432", "name": "Brown shyshark (M&F)"},
    {"id": "385", "name": "Shortfin mako (M&F)"},
    {"id": "386", "name": "Great white shark (M&F)"},
    {"id": "335", "name": "Great hammerhead (M&F)"},
    {"id": "400", "name": "Giant guitarfish (M&F)"}
]

# Manually create data for key species
def create_manual_data():
    all_data = []
    algorithms = {}
    
    # Brown shyshark (M&F) - ID: 432
    lengths = list(range(25, 129))  # 25cm to 128cm
    weights = [
        0.0, 0.1, 0.1, 0.1, 0.1,  # 25-29cm
        0.1, 0.1, 0.1, 0.1, 0.1,  # 30-34cm
        0.1, 0.1, 0.2, 0.2, 0.2,  # 35-39cm
        0.2, 0.2, 0.2, 0.2, 0.3,  # 40-44cm
        0.3, 0.3, 0.3, 0.3, 0.4,  # 45-49cm
        0.4, 0.4, 0.4, 0.5, 0.5,  # 50-54cm
        0.5, 0.5, 0.6, 0.6, 0.6,  # 55-59cm
        0.7, 0.7, 0.7, 0.8, 0.8,  # 60-64cm
        0.8, 0.9, 0.9, 1.0, 1.0,  # 65-69cm
        1.1, 1.1, 1.2, 1.2, 1.3,  # 70-74cm
        1.3, 1.4, 1.4, 1.5, 1.5,  # 75-79cm
        1.6, 1.7, 1.7, 1.8, 1.9,  # 80-84cm
        1.9, 2.0, 2.1, 2.1, 2.2,  # 85-89cm
        2.3, 2.4, 2.4, 2.5, 2.6,  # 90-94cm
        2.7, 2.8, 2.9, 3.0, 3.1,  # 95-99cm
        3.1, 3.2, 3.3, 3.4, 3.5,  # 100-104cm
        3.7, 3.8, 3.9, 4.0, 4.1,  # 105-109cm
        4.2, 4.3, 4.4, 4.6, 4.7,  # 110-114cm
        4.8, 5.0, 5.1, 5.2, 5.4,  # 115-119cm
        5.5, 5.6, 5.8, 5.9, 6.1,  # 120-124cm
        6.2, 6.4, 6.5, 6.7        # 125-128cm
    ]
    measure_types = ["Total length"] * len(lengths)
    
    # Create DataFrame
    brown_shyshark_data = {
        'Measure_Type': measure_types,
        'Length': lengths,
        'Weight': weights,
        'Species': "Brown shyshark (M&F)",
        'Species_ID': "432",
        'Edible': False
    }
    brown_shyshark_df = pd.DataFrame(brown_shyshark_data)
    all_data.append(brown_shyshark_df)
    
    # Calculate algorithm for Brown shyshark
    import numpy as np
    log_length = np.log(brown_shyshark_df['Length'])
    log_weight = np.log(brown_shyshark_df['Weight'].replace(0, 0.01))  # Replace 0 with small value to avoid log(0)
    slope, intercept = np.polyfit(log_length, log_weight, 1)
    a = np.exp(intercept)
    b = slope
    log_weight_pred = intercept + slope * log_length
    ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
    ss_residual = np.sum((log_weight - log_weight_pred) ** 2)
    r_squared = 1 - (ss_residual / ss_total)
    
    algorithms["432"] = {
        'species_name': "Brown shyshark (M&F)",
        'edible': False,
        'algorithm': {
            'formula': 'W = a * L^b',
            'a': a,
            'b': b,
            'r_squared': r_squared,
            'length_column': 'Length',
            'weight_column': 'Weight',
            'measure_type': 'Total length'
        }
    }
    
    # Shortfin mako (M&F) - ID: 385
    lengths = list(range(25, 129))  # 25cm to 128cm
    weights = [
        0.2, 0.2, 0.2, 0.2, 0.2,  # 25-29cm
        0.3, 0.3, 0.3, 0.4, 0.4,  # 30-34cm
        0.4, 0.5, 0.5, 0.5, 0.6,  # 35-39cm
        0.6, 0.7, 0.7, 0.7, 0.8,  # 40-44cm
        0.9, 0.9, 1.0, 1.0, 1.1,  # 45-49cm
        1.1, 1.2, 1.3, 1.4, 1.4,  # 50-54cm
        1.5, 1.6, 1.7, 1.8, 1.8,  # 55-59cm
        1.9, 2.0, 2.1, 2.2, 2.3,  # 60-64cm
        2.4, 2.5, 2.6, 2.8, 2.9,  # 65-69cm
        3.0, 3.1, 3.2, 3.4, 3.5,  # 70-74cm
        3.6, 3.8, 3.9, 4.1, 4.2,  # 75-79cm
        4.4, 4.5, 4.7, 4.9, 5.0,  # 80-84cm
        5.2, 5.4, 5.6, 5.7, 5.9,  # 85-89cm
        6.1, 6.3, 6.5, 6.7, 6.9,  # 90-94cm
        7.1, 7.3, 7.6, 7.8, 8.0,  # 95-99cm
        8.3, 8.5, 8.7, 9.0, 9.2,  # 100-104cm
        9.5, 9.7, 10.0, 10.3, 10.6,  # 105-109cm
        10.8, 11.1, 11.4, 11.7, 12.0,  # 110-114cm
        12.3, 12.6, 12.9, 13.2, 13.5,  # 115-119cm
        13.9, 14.2, 14.5, 14.9, 15.2,  # 120-124cm
        15.6, 15.9, 16.3, 16.7  # 125-128cm
    ]
    measure_types = ["Fork length"] * len(lengths)
    
    # Create DataFrame
    shortfin_mako_data = {
        'Measure_Type': measure_types,
        'Length': lengths,
        'Weight': weights,
        'Species': "Shortfin mako (M&F)",
        'Species_ID': "385",
        'Edible': False
    }
    shortfin_mako_df = pd.DataFrame(shortfin_mako_data)
    all_data.append(shortfin_mako_df)
    
    # Calculate algorithm for Shortfin mako
    log_length = np.log(shortfin_mako_df['Length'])
    log_weight = np.log(shortfin_mako_df['Weight'])
    slope, intercept = np.polyfit(log_length, log_weight, 1)
    a = np.exp(intercept)
    b = slope
    log_weight_pred = intercept + slope * log_length
    ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
    ss_residual = np.sum((log_weight - log_weight_pred) ** 2)
    r_squared = 1 - (ss_residual / ss_total)
    
    algorithms["385"] = {
        'species_name': "Shortfin mako (M&F)",
        'edible': False,
        'algorithm': {
            'formula': 'W = a * L^b',
            'a': a,
            'b': b,
            'r_squared': r_squared,
            'length_column': 'Length',
            'weight_column': 'Weight',
            'measure_type': 'Fork length'
        }
    }
    
    # Great white shark (M&F) - ID: 386
    lengths = list(range(25, 130))  # 25cm to 129cm
    weights = [
        0.3, 0.3, 0.4, 0.4, 0.4,  # 25-29cm
        0.5, 0.5, 0.6, 0.6, 0.7,  # 30-34cm
        0.8, 0.8, 0.9, 1.0, 1.0,  # 35-39cm
        1.1, 1.2, 1.3, 1.4, 1.5,  # 40-44cm
        1.6, 1.7, 1.8, 1.9, 2.0,  # 45-49cm
        2.1, 2.3, 2.4, 2.6, 2.7,  # 50-54cm
        2.8, 3.0, 3.2, 3.3, 3.5,  # 55-59cm
        3.7, 3.9, 4.0, 4.2, 4.4,  # 60-64cm
        4.7, 4.9, 5.1, 5.3, 5.5,  # 65-69cm
        5.8, 6.0, 6.3, 6.5, 6.8,  # 70-74cm
        7.1, 7.4, 7.7, 8.0, 8.3,  # 75-79cm
        8.6, 8.9, 9.2, 9.6, 9.9,  # 80-84cm
        10.2, 10.6, 11.0, 11.4, 11.7,  # 85-89cm
        12.1, 12.5, 12.9, 13.4, 13.8,  # 90-94cm
        14.2, 14.7, 15.1, 15.6, 16.1,  # 95-99cm
        16.5, 17.0, 17.5, 18.0, 18.6,  # 100-104cm
        19.1, 19.6, 20.2, 20.7, 21.3,  # 105-109cm
        21.9, 22.5, 23.1, 23.7, 24.3,  # 110-114cm
        25.0, 25.6, 26.3, 26.9, 27.6,  # 115-119cm
        28.3, 29.0, 29.7, 30.4, 31.2,  # 120-124cm
        31.9, 32.7, 33.4, 34.2, 35.0   # 125-129cm
    ]
    measure_types = ["Pre-caudal"] * len(lengths)
    
    # Create DataFrame
    great_white_data = {
        'Measure_Type': measure_types,
        'Length': lengths,
        'Weight': weights,
        'Species': "Great white shark (M&F)",
        'Species_ID': "386",
        'Edible': False
    }
    great_white_df = pd.DataFrame(great_white_data)
    all_data.append(great_white_df)
    
    # Calculate algorithm for Great white shark
    log_length = np.log(great_white_df['Length'])
    log_weight = np.log(great_white_df['Weight'])
    slope, intercept = np.polyfit(log_length, log_weight, 1)
    a = np.exp(intercept)
    b = slope
    log_weight_pred = intercept + slope * log_length
    ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
    ss_residual = np.sum((log_weight - log_weight_pred) ** 2)
    r_squared = 1 - (ss_residual / ss_total)
    
    algorithms["386"] = {
        'species_name': "Great white shark (M&F)",
        'edible': False,
        'algorithm': {
            'formula': 'W = a * L^b',
            'a': a,
            'b': b,
            'r_squared': r_squared,
            'length_column': 'Length',
            'weight_column': 'Weight',
            'measure_type': 'Pre-caudal'
        }
    }
    
    # Great hammerhead (M&F) - ID: 335
    lengths = list(range(25, 130))  # 25cm to 129cm
    weights = [
        0.3, 0.3, 0.4, 0.4, 0.4,  # 25-29cm
        0.5, 0.5, 0.6, 0.6, 0.7,  # 30-34cm
        0.8, 0.8, 0.9, 1.0, 1.0,  # 35-39cm
        1.1, 1.2, 1.3, 1.4, 1.5,  # 40-44cm
        1.6, 1.7, 1.8, 1.9, 2.0,  # 45-49cm
        2.1, 2.3, 2.4, 2.6, 2.7,  # 50-54cm
        2.8, 3.0, 3.2, 3.3, 3.5,  # 55-59cm
        3.7, 3.9, 4.0, 4.2, 4.4,  # 60-64cm
        4.7, 4.9, 5.1, 5.3, 5.5,  # 65-69cm
        5.8, 6.0, 6.3, 6.5, 6.8,  # 70-74cm
        7.1, 7.4, 7.7, 8.0, 8.3,  # 75-79cm
        8.6, 8.9, 9.2, 9.6, 9.9,  # 80-84cm
        10.2, 10.6, 11.0, 11.4, 11.7,  # 85-89cm
        12.1, 12.5, 12.9, 13.4, 13.8,  # 90-94cm
        14.2, 14.7, 15.1, 15.6, 16.1,  # 95-99cm
        16.5, 17.0, 17.5, 18.0, 18.6,  # 100-104cm
        19.1, 19.6, 20.2, 20.7, 21.3,  # 105-109cm
        21.9, 22.5, 23.1, 23.7, 24.3,  # 110-114cm
        25.0, 25.6, 26.3, 26.9, 27.6,  # 115-119cm
        28.3, 29.0, 29.7, 30.4, 31.2,  # 120-124cm
        31.9, 32.7, 33.4, 34.2, 35.0   # 125-129cm
    ]
    measure_types = ["Total length"] * len(lengths)
    
    # Create DataFrame
    great_hammerhead_data = {
        'Measure_Type': measure_types,
        'Length': lengths,
        'Weight': weights,
        'Species': "Great hammerhead (M&F)",
        'Species_ID': "335",
        'Edible': False
    }
    great_hammerhead_df = pd.DataFrame(great_hammerhead_data)
    all_data.append(great_hammerhead_df)
    
    # Calculate algorithm for Great hammerhead
    log_length = np.log(great_hammerhead_df['Length'])
    log_weight = np.log(great_hammerhead_df['Weight'])
    slope, intercept = np.polyfit(log_length, log_weight, 1)
    a = np.exp(intercept)
    b = slope
    log_weight_pred = intercept + slope * log_length
    ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
    ss_residual = np.sum((log_weight - log_weight_pred) ** 2)
    r_squared = 1 - (ss_residual / ss_total)
    
    algorithms["335"] = {
        'species_name': "Great hammerhead (M&F)",
        'edible': False,
        'algorithm': {
            'formula': 'W = a * L^b',
            'a': a,
            'b': b,
            'r_squared': r_squared,
            'length_column': 'Length',
            'weight_column': 'Weight',
            'measure_type': 'Total length'
        }
    }
    
    # Giant guitarfish (M&F) - ID: 400
    lengths = list(range(25, 130))  # 25cm to 129cm
    weights = [
        0.1, 0.1, 0.1, 0.1, 0.2,  # 25-29cm
        0.2, 0.2, 0.3, 0.3, 0.3,  # 30-34cm
        0.4, 0.4, 0.5, 0.5, 0.6,  # 35-39cm
        0.6, 0.7, 0.8, 0.8, 0.9,  # 40-44cm
        1.0, 1.1, 1.2, 1.3, 1.4,  # 45-49cm
        1.5, 1.6, 1.7, 1.8, 2.0,  # 50-54cm
        2.1, 2.3, 2.4, 2.6, 2.8,  # 55-59cm
        2.9, 3.1, 3.3, 3.5, 3.7,  # 60-64cm
        3.9, 4.1, 4.3, 4.6, 4.8,  # 65-69cm
        5.1, 5.3, 5.6, 5.9, 6.2,  # 70-74cm
        6.5, 6.8, 7.1, 7.4, 7.8,  # 75-79cm
        8.1, 8.5, 8.9, 9.3, 9.7,  # 80-84cm
        10.1, 10.5, 11.0, 11.4, 11.9,  # 85-89cm
        12.4, 12.9, 13.4, 13.9, 14.5,  # 90-94cm
        15.0, 15.6, 16.2, 16.8, 17.4,  # 95-99cm
        18.1, 18.7, 19.4, 20.1, 20.8,  # 100-104cm
        21.6, 22.3, 23.1, 23.9, 24.7,  # 105-109cm
        25.5, 26.4, 27.3, 28.2, 29.1,  # 110-114cm
        30.0, 31.0, 32.0, 33.0, 34.0,  # 115-119cm
        35.1, 36.2, 37.3, 38.4, 39.6,  # 120-124cm
        40.8, 42.0, 43.2, 44.5, 45.8   # 125-129cm
    ]
    measure_types = ["Total length"] * len(lengths)
    
    # Create DataFrame
    giant_guitarfish_data = {
        'Measure_Type': measure_types,
        'Length': lengths,
        'Weight': weights,
        'Species': "Giant guitarfish (M&F)",
        'Species_ID': "400",
        'Edible': False
    }
    giant_guitarfish_df = pd.DataFrame(giant_guitarfish_data)
    all_data.append(giant_guitarfish_df)
    
    # Calculate algorithm for Giant guitarfish
    log_length = np.log(giant_guitarfish_df['Length'])
    log_weight = np.log(giant_guitarfish_df['Weight'])
    slope, intercept = np.polyfit(log_length, log_weight, 1)
    a = np.exp(intercept)
    b = slope
    log_weight_pred = intercept + slope * log_length
    ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
    ss_residual = np.sum((log_weight - log_weight_pred) ** 2)
    r_squared = 1 - (ss_residual / ss_total)
    
    algorithms["400"] = {
        'species_name': "Giant guitarfish (M&F)",
        'edible': False,
        'algorithm': {
            'formula': 'W = a * L^b',
            'a': a,
            'b': b,
            'r_squared': r_squared,
            'length_column': 'Length',
            'weight_column': 'Weight',
            'measure_type': 'Total length'
        }
    }
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    
    return combined_df, algorithms

# Create the database files
def create_database_files(df, algorithms):
    # Save CSV
    df.to_csv('output/non_edible_fish_species_data.csv', index=False)
    
    # Save algorithms as JSON
    with open('output/non_edible_fish_algorithms.json', 'w') as f:
        json.dump(algorithms, f, indent=2)
    
    # Create Excel file
    with pd.ExcelWriter('output/non_edible_fish_species_database.xlsx') as writer:
        df.to_excel(writer, sheet_name='Length_Weight_Data', index=False)
        
        # Create algorithms sheet
        algo_data = []
        for species_id, data in algorithms.items():
            algo_data.append({
                'Species_ID': species_id,
                'Species_Name': data['species_name'],
                'Edible': data['edible'],
                'Formula': data['algorithm']['formula'],
                'a_parameter': data['algorithm']['a'],
                'b_parameter': data['algorithm']['b'],
                'R_squared': data['algorithm']['r_squared'],
                'Measure_Type': data['algorithm'].get('measure_type', 'Unknown'),
                'Length_Column': data['algorithm']['length_column'],
                'Weight_Column': data['algorithm']['weight_column']
            })
        
        if algo_data:
            algo_df = pd.DataFrame(algo_data)
            algo_df.to_excel(writer, sheet_name='Algorithms', index=False)
    
    # Create SQL database
    conn = sqlite3.connect('output/non_edible_fish_species_database.db')
    
    # Create tables
    df.to_sql('length_weight_data', conn, if_exists='replace', index=False)
    
    # Create algorithms table
    if algo_data:
        algo_df = pd.DataFrame(algo_data)
        algo_df.to_sql('algorithms', conn, if_exists='replace', index=False)
    
    conn.close()

# Merge with existing database
def merge_with_existing_database():
    # Define paths
    existing_db_path = '../fish_data/fish_species_database.db'
    existing_excel_path = '../fish_data/fish_species_database.xlsx'
    existing_csv_path = '../fish_data/all_fish_species_data.csv'
    existing_json_path = '../fish_data/fish_algorithms.json'
    
    new_csv_path = 'output/non_edible_fish_species_data.csv'
    new_json_path = 'output/non_edible_fish_algorithms.json'
    
    try:
        # Load existing data
        existing_csv = pd.read_csv(existing_csv_path)
        print(f"Loaded existing CSV with {len(existing_csv)} rows")
        
        with open(existing_json_path, 'r') as f:
            existing_algorithms = json.load(f)
        print(f"Loaded existing algorithms for {len(existing_algorithms)} species")
        
        # Load new data
        new_csv = pd.read_csv(new_csv_path)
        print(f"Loaded new CSV with {len(new_csv)} rows")
        
        with open(new_json_path, 'r') as f:
            new_algorithms = json.load(f)
        print(f"Loaded new algorithms for {len(new_algorithms)} species")
        
        # Merge data
        merged_csv = pd.concat([existing_csv, new_csv], ignore_index=True)
        print(f"Merged CSV has {len(merged_csv)} rows")
        
        # Merge algorithms
        merged_algorithms = {**existing_algorithms, **new_algorithms}
        print(f"Merged algorithms has data for {len(merged_algorithms)} species")
        
        # Save merged data
        merged_csv.to_csv('output/merged_fish_species_data.csv', index=False)
        
        with open('output/merged_fish_algorithms.json', 'w') as f:
            json.dump
(Content truncated due to size limit. Use line ranges to read in chunks)