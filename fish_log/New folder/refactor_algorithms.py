import json

input_path = '/home/ubuntu/fish_data_merged/final_output/complete_fish_algorithms.json'
output_path = '/home/ubuntu/fish_data_merged/final_output/complete_fish_algorithms.json'

with open(input_path, 'r') as f:
    algorithms_list = json.load(f)

refactored_algorithms = {}
for item in algorithms_list:
    for species_id, data in item.items():
        refactored_algorithms[species_id] = data

with open(output_path, 'w') as f:
    json.dump(refactored_algorithms, f, indent=4)

print("Algorithms refactored and saved.")


