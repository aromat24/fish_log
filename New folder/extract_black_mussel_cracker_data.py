
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

# Data for Black Mussel Cracker from FishBase and SAAMBR
# FishBase: a=0.01514, b=3.06 (in cm total length)
# SAAMBR: max size 110 cm fork length, 37.8 kg

# Generate some data points based on the FishBase parameters for Black Mussel Cracker
# Assuming total length for consistency, and converting fork length to total length if needed (approx TL = FL / 0.9)
# Let's use total length directly as FishBase provides it in TL
black_mussel_cracker_lengths_cm = np.arange(30, 111, 1).tolist() # From 30cm to 110cm
black_mussel_cracker_weights_kg = [0.01514 * (l ** 3.06) for l in black_mussel_cracker_lengths_cm]

black_mussel_cracker_data = []
for i in range(len(black_mussel_cracker_lengths_cm)):
    black_mussel_cracker_data.append({
        "Species": "Black Mussel Cracker",
        "Species_ID": "", # Will be assigned later
        "Edible": True,
        "Measure_Type": "Total length",
        "Length": black_mussel_cracker_lengths_cm[i],
        "Weight": round(black_mussel_cracker_weights_kg[i], 2)
    })

# Calculate a, b, r_squared for Black Mussel Cracker
a_bmc, b_bmc, r_squared_bmc = calculate_lwr_parameters(black_mussel_cracker_lengths_cm, black_mussel_cracker_weights_kg)

black_mussel_cracker_algorithm = {
    "Species": "Black Mussel Cracker",
    "a": a_bmc,
    "b": b_bmc,
    "r_squared": r_squared_bmc,
    "Measure_Type": "Total length"
}

# Save data and algorithm to JSON files for now
with open("black_mussel_cracker_data.json", "w") as f:
    json.dump(black_mussel_cracker_data, f, indent=4)

with open("black_mussel_cracker_algorithm.json", "w") as f:
    json.dump(black_mussel_cracker_algorithm, f, indent=4)

print("Black Mussel Cracker data and algorithm generated and saved.")


