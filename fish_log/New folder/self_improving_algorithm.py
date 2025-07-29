
import pandas as pd
import numpy as np
from scipy.optimize import curve_fit
import json
import os

def power_law(x, a, b):
    return a * (x ** b)

def calculate_lwr_parameters(lengths, weights):
    try:
        lengths = np.array(lengths)
        weights = np.array(weights)

        positive_lengths = lengths[lengths > 0]
        positive_weights = weights[weights > 0]

        if len(positive_lengths) < 2 or len(positive_weights) < 2:
            return None, None, None, "Not enough data points to calculate parameters."

        # Initial guess for a and b
        # A common range for 'b' is 2.5 to 3.5, and 'a' is usually small
        p0 = [0.01, 3.0]

        # Bounds for parameters to ensure realistic values
        # a > 0, b typically between 2.5 and 3.5 for fish
        bounds = ([0., 2.5], [np.inf, 3.5])

        params, covariance = curve_fit(power_law, positive_lengths, positive_weights, p0=p0, bounds=bounds)
        a, b = params

        y_predicted = power_law(positive_lengths, a, b)
        ss_total = np.sum((positive_weights - np.mean(positive_weights)) ** 2)
        ss_residual = np.sum((positive_weights - y_predicted) ** 2)
        r_squared = 1 - (ss_residual / ss_total) if ss_total > 0 else 0

        return a, b, r_squared, "Success"
    except RuntimeError as e:
        return None, None, None, f"Could not fit curve: {e}. Try providing more diverse data points."
    except Exception as e:
        return None, None, None, f"An error occurred: {e}"

def update_species_algorithm(species_name, new_length, new_weight, algorithms_file, data_points_file):
    # Load existing algorithms
    algorithms = {}
    if os.path.exists(algorithms_file):
        with open(algorithms_file, 'r') as f:
            try:
                algorithms = json.load(f)
            except json.JSONDecodeError:
                algorithms = {} # Handle empty or invalid JSON

    # Load existing data points for the species
    all_data_points = {}
    if os.path.exists(data_points_file):
        with open(data_points_file, 'r') as f:
            try:
                all_data_points = json.load(f)
            except json.JSONDecodeError:
                all_data_points = {} # Handle empty or invalid JSON

    species_data_points = all_data_points.get(species_name, {"lengths": [], "weights": []})

    # Add new data point
    species_data_points["lengths"].append(new_length)
    species_data_points["weights"].append(new_weight)

    # Save updated data points immediately
    all_data_points[species_name] = species_data_points
    with open(data_points_file, 'w') as f:
        json.dump(all_data_points, f, indent=4)

    # Only calculate algorithm parameters if enough data points exist
    if len(species_data_points["lengths"]) >= 2:
        a, b, r_squared, status_message = calculate_lwr_parameters(
            species_data_points["lengths"],
            species_data_points["weights"]
        )

        if a is not None and b is not None:
            algorithms[species_name] = {
                "a": a,
                "b": b,
                "r_squared": r_squared,
                "data_points_count": len(species_data_points["lengths"])
            }
            # Save updated algorithms
            with open(algorithms_file, 'w') as f:
                json.dump(algorithms, f, indent=4)

            return {"status": "success", "a": a, "b": b, "r_squared": r_squared, "data_points_count": len(species_data_points["lengths"]), "message": status_message}
        else:
            return {"status": "failed", "message": status_message}
    else:
        return {"status": "pending", "message": "Not enough data points to calculate parameters yet. Need at least 2.", "data_points_count": len(species_data_points["lengths"])}

# Example Usage (for testing/demonstration)
if __name__ == "__main__":
    algorithms_output_file = "self_improving_algorithms.json"
    data_points_output_file = "self_improving_data_points.json"

    # Clean up previous test files if they exist
    if os.path.exists(algorithms_output_file):
        os.remove(algorithms_output_file)
    if os.path.exists(data_points_output_file):
        os.remove(data_points_output_file)

    print("\n--- Adding first data point for NewSpeciesA ---")
    result1 = update_species_algorithm("NewSpeciesA", 30, 0.5, algorithms_output_file, data_points_output_file)
    print(result1)

    print("\n--- Adding second data point for NewSpeciesA ---")
    result2 = update_species_algorithm("NewSpeciesA", 40, 1.0, algorithms_output_file, data_points_output_file)
    print(result2)

    print("\n--- Adding third data point for NewSpeciesA ---")
    result3 = update_species_algorithm("NewSpeciesA", 50, 1.8, algorithms_output_file, data_points_output_file)
    print(result3)

    print("\n--- Adding first data point for NewSpeciesB ---")
    result4 = update_species_algorithm("NewSpeciesB", 20, 0.2, algorithms_output_file, data_points_output_file)
    print(result4)

    print("\n--- Adding a data point that might cause issues (e.g., too few points) ---")
    result5 = update_species_algorithm("NewSpeciesC", 10, 0.1, algorithms_output_file, data_points_output_file)
    print(result5)

    print("\n--- Adding a second data point for NewSpeciesC to enable calculation ---")
    result6 = update_species_algorithm("NewSpeciesC", 15, 0.25, algorithms_output_file, data_points_output_file)
    print(result6)

    print("\n--- Adding a data point for an existing species to refine its algorithm ---")
    # To test this, we need to ensure Albacore (M&F) exists in the initial algorithms_output_file
    # For this test, we'll assume it's a new species to simplify, or load a dummy initial state
    # For a real scenario, you'd load the complete_fish_algorithms.json here
    result7 = update_species_algorithm("Albacore (M&F)", 100, 45.0, algorithms_output_file, data_points_output_file)
    print(result7)

    print("\n--- Final algorithms file content ---")
    if os.path.exists(algorithms_output_file):
        with open(algorithms_output_file, 'r') as f:
            print(json.dumps(json.load(f), indent=4))
    else:
        print("Algorithms file does not exist.")

    print("\n--- Final data points file content ---")
    if os.path.exists(data_points_output_file):
        with open(data_points_output_file, 'r') as f:
            print(json.dumps(json.load(f), indent=4))
    else:
        print("Data points file does not exist.")


