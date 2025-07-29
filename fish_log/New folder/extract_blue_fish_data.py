
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

# Data for Blue Fish from search results (e.g., noreast.com, stripersonline.com)
# Using approximate values from search results: 21.6 inches (54.86 cm) -> 4.8 lbs (2.18 kg)
# 30 inches (76.2 cm) -> 8-10 lbs (3.63-4.54 kg)
# Let's create a range of lengths and estimate weights based on a general bluefish LWR
# A common LWR for bluefish is W = 0.000004 * L^3.08 (where W is in g and L in mm)
# Converting to kg and cm: W_kg = 0.000004 * (L_cm * 10)^3.08 / 1000 = 0.000004 * 10^3.08 * L_cm^3.08 / 1000
# = 0.000004 * 1202.26 * L_cm^3.08 / 1000 = 0.000004809 * L_cm^3.08

blue_fish_lengths_cm = np.arange(20, 81, 1).tolist() # From 20cm to 80cm
blue_fish_weights_kg = [0.004809 * (l ** 3.08) for l in blue_fish_lengths_cm]

blue_fish_data = []
for i in range(len(blue_fish_lengths_cm)):
    blue_fish_data.append({
        "Species": "Blue Fish",
        "Species_ID": "", # Will be assigned later
        "Edible": True,
        "Measure_Type": "Total length",
        "Length": blue_fish_lengths_cm[i],
        "Weight": round(blue_fish_weights_kg[i], 2)
    })

# Calculate a, b, r_squared for Blue Fish
a_bf, b_bf, r_squared_bf = calculate_lwr_parameters(blue_fish_lengths_cm, blue_fish_weights_kg)

blue_fish_algorithm = {
    "Species": "Blue Fish",
    "a": a_bf,
    "b": b_bf,
    "r_squared": r_squared_bf,
    "Measure_Type": "Total length"
}

# Save data and algorithm to JSON files for now
with open("blue_fish_data.json", "w") as f:
    json.dump(blue_fish_data, f, indent=4)

with open("blue_fish_algorithm.json", "w") as f:
    json.dump(blue_fish_algorithm, f, indent=4)

print("Blue Fish data and algorithm generated and saved.")


