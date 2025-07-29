#!/usr/bin/env python3
import json
import os

def merge_fish_algorithms():
    """Merge current fish algorithms with updated complete database"""
    
    # Load current algorithms
    current_file = '/workspaces/fish_log/fish_algorithms.json'
    updated_file = '/workspaces/fish_log/fish_algorithms_updated.json'
    
    try:
        with open(current_file, 'r') as f:
            current_algorithms = json.load(f)
        print(f"Loaded {len(current_algorithms)} current species")
    except FileNotFoundError:
        current_algorithms = {}
        print("No current algorithms file found, starting fresh")
    
    try:
        with open(updated_file, 'r') as f:
            updated_algorithms = json.load(f)
        print(f"Loaded {len(updated_algorithms)} updated species")
    except FileNotFoundError:
        print("ERROR: Updated algorithms file not found!")
        return False
    
    # Merge algorithms - updated ones take precedence
    merged_algorithms = current_algorithms.copy()
    
    new_species_count = 0
    updated_species_count = 0
    
    for species_id, species_data in updated_algorithms.items():
        if species_id in merged_algorithms:
            # Check if the updated version has more data points or better r_squared
            current_data = merged_algorithms[species_id]
            updated_data = species_data
            
            current_r_squared = current_data.get('algorithm', {}).get('r_squared', 0)
            updated_r_squared = updated_data.get('algorithm', {}).get('r_squared', 0)
            
            current_data_points = current_data.get('algorithm', {}).get('data_points', 0)
            updated_data_points = updated_data.get('algorithm', {}).get('data_points', 0)
            
            # Update if the new version has better r_squared or more data points
            if updated_r_squared > current_r_squared or updated_data_points > current_data_points:
                merged_algorithms[species_id] = species_data
                updated_species_count += 1
        else:
            merged_algorithms[species_id] = species_data
            new_species_count += 1
    
    print(f"Merged results:")
    print(f"  - Total species: {len(merged_algorithms)}")
    print(f"  - New species added: {new_species_count}")
    print(f"  - Existing species updated: {updated_species_count}")
    
    # Backup current file
    backup_file = current_file + '.backup'
    if os.path.exists(current_file):
        import shutil
        shutil.copy2(current_file, backup_file)
        print(f"Backed up current file to: {backup_file}")
    
    # Save merged algorithms
    with open(current_file, 'w') as f:
        json.dump(merged_algorithms, f, indent=2)
    
    print(f"Merged algorithms saved to: {current_file}")
    
    # Create a summary of new species
    if new_species_count > 0:
        new_species_summary = []
        for species_id, species_data in updated_algorithms.items():
            if species_id not in current_algorithms:
                new_species_summary.append({
                    'species_id': species_id,
                    'species_name': species_data.get('species_name', 'Unknown'),
                    'edible': species_data.get('edible', False),
                    'r_squared': species_data.get('algorithm', {}).get('r_squared', 0),
                    'data_points': species_data.get('algorithm', {}).get('data_points', 0)
                })
        
        # Sort by r_squared descending
        new_species_summary.sort(key=lambda x: x['r_squared'], reverse=True)
        
        print("\nTop 10 new species by algorithm quality:")
        for i, species in enumerate(new_species_summary[:10]):
            print(f"  {i+1}. {species['species_name']} (ID: {species['species_id']}, R²: {species['r_squared']:.3f}, Points: {species['data_points']})")
    
    return True

if __name__ == "__main__":
    merge_fish_algorithms()
