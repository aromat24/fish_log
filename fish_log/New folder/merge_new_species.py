
import pandas as pd
import json
import sqlite3

# Load existing data
existing_csv_path = "/home/ubuntu/fish_data_merged/final_output/complete_fish_species_data.csv"
existing_algorithms_path = "/home/ubuntu/fish_data_merged/final_output/complete_fish_algorithms.json"

existing_df = pd.read_csv(existing_csv_path)
with open(existing_algorithms_path, "r") as f:
    existing_algorithms = json.load(f)

# Load new species data and algorithms
new_species_data_files = [
    "dageraad_data.json",
    "black_mussel_cracker_data.json",
    "blue_fish_data.json",
    "sand_shark_data.json",
    "shy_shark_data.json"
]

new_species_algorithm_files = [
    "dageraad_algorithm.json",
    "black_mussel_cracker_algorithm.json",
    "blue_fish_algorithm.json",
    "sand_shark_algorithm.json",
    "shy_shark_algorithm.json"
]

new_data_list = []
new_algorithms_list = []

for file_path in new_species_data_files:
    with open(file_path, "r") as f:
        new_data_list.extend(json.load(f))

for file_path in new_species_algorithm_files:
    with open(file_path, "r") as f:
        new_algorithms_list.append(json.load(f))

new_df = pd.DataFrame(new_data_list)

# Assign Species_ID to new species
# Find the maximum existing Species_ID and increment for new ones
max_species_id = existing_df["Species_ID"].max()
if pd.isna(max_species_id):
    max_species_id = 0

# Get unique new species names
unique_new_species = new_df["Species"].unique()

species_id_map = {}
for i, species_name in enumerate(unique_new_species):
    species_id_map[species_name] = max_species_id + 1 + i

new_df["Species_ID"] = new_df["Species"].map(species_id_map)

# Update Species_ID in new algorithms
for algo in new_algorithms_list:
    algo["Species_ID"] = species_id_map.get(algo["Species"], "")

# Merge dataframes
merged_df = pd.concat([existing_df, new_df], ignore_index=True)

# Merge algorithms - ensure existing_algorithms is a list
if isinstance(existing_algorithms, dict):
    existing_algorithms = [existing_algorithms] # Convert to list if it's a single dict

merged_algorithms = existing_algorithms + new_algorithms_list

# Clean up and reorder columns if necessary
merged_df = merged_df[["Species", "Species_ID", "Edible", "Measure_Type", "Length", "Weight"]]

# Save to CSV
output_csv_path = "/home/ubuntu/fish_data_merged/final_output/complete_fish_species_data.csv"
merged_df.to_csv(output_csv_path, index=False)
print(f"Updated CSV saved to {output_csv_path}")

# Save to Excel
output_excel_path = "/home/ubuntu/fish_data_merged/final_output/complete_fish_species_database.xlsx"
merged_df.to_excel(output_excel_path, index=False)
print(f"Updated Excel saved to {output_excel_path}")

# Save to JSON (algorithms)
output_algorithms_path = "/home/ubuntu/fish_data_merged/final_output/complete_fish_algorithms.json"
with open(output_algorithms_path, "w") as f:
    json.dump(merged_algorithms, f, indent=4)
print(f"Updated Algorithms JSON saved to {output_algorithms_path}")

# Save to SQLite
output_db_path = "/home/ubuntu/fish_data_merged/final_output/complete_fish_species_database.db"
conn = sqlite3.connect(output_db_path)
merged_df.to_sql("fish_species", conn, if_exists="replace", index=False)
conn.close()
print(f"Updated SQLite DB saved to {output_db_path}")

print("All files updated successfully.")


