
import pandas as pd
import numpy as np
from scipy.optimize import curve_fit
import json

def power_law(x, a, b):
    return a * (x ** b)

def calculate_lwr_parameters(lengths, weights):
    try:
        # Convert to numpy arrays
        lengths = np.array(lengths)
        weights = np.array(weights)

        # Filter out zero or negative values to avoid log errors
        positive_lengths = lengths[lengths > 0]
        positive_weights = weights[weights > 0]

        if len(positive_lengths) < 2 or len(positive_weights) < 2:
            return None, None, None # Not enough data points

        # Fit the power law model
        params, covariance = curve_fit(power_law, positive_lengths, positive_weights, p0=[0.01, 3.0])
        a, b = params

        # Calculate R-squared
        y_predicted = power_law(positive_lengths, a, b)
        ss_total = np.sum((positive_weights - np.mean(positive_weights)) ** 2)
        ss_residual = np.sum((positive_weights - y_predicted) ** 2)
        r_squared = 1 - (ss_residual / ss_total) if ss_total > 0 else 0

        return a, b, r_squared
    except Exception as e:
        print(f"Error calculating LWR parameters: {e}")
        return None, None, None

# Data for Dageraad from FishBase and SAAMBR
# FishBase: a=0.01738, b=2.99 (in cm total length)
# SAAMBR: max size 70 cm total length, 8.7 kg

# Generate some data points based on the FishBase parameters for Dageraad
# Assuming total length for consistency
dageraad_lengths_cm = np.arange(20, 71, 1).tolist() # From 20cm to 70cm
dageraad_weights_kg = [0.01738 * (l ** 2.99) for l in dageraad_lengths_cm]

dageraad_data = []
for i in range(len(dageraad_lengths_cm)):
    dageraad_data.append({
        "Species": "Dageraad",
        "Species_ID": "", # Will be assigned later
        "Edible": True,
        "Measure_Type": "Total length",
        "Length": dageraad_lengths_cm[i],
        "Weight": round(dageraad_weights_kg[i], 2)
    })

# Calculate a, b, r_squared for Dageraad
a_dageraad, b_dageraad, r_squared_dageraad = calculate_lwr_parameters(dageraad_lengths_cm, dageraad_weights_kg)

dageraad_algorithm = {
    "Species": "Dageraad",
    "a": a_dageraad,
    "b": b_dageraad,
    "r_squared": r_squared_dageraad,
    "Measure_Type": "Total length"
}

# Save data and algorithm to JSON files for now
with open('dageraad_data.json', 'w') as f:
    json.dump(dageraad_data, f, indent=4)

with open('dageraad_algorithm.json', 'w') as f:
    json.dump(dageraad_algorithm, f, indent=4)

print("Dageraad data and algorithm generated and saved.")


