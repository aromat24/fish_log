
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

# Data for Shy Shark (using Brown Shyshark as a proxy, as it's already in the database and is a type of shy shark)
# FishBase for Brown Shyshark: a=0.00355, b=3.08 (in cm total length)
# Max length 73 cm

shy_shark_lengths_cm = np.arange(10, 74, 1).tolist() # From 10cm to 73cm
shy_shark_weights_kg = [0.00355 * (l ** 3.08) for l in shy_shark_lengths_cm]

shy_shark_data = []
for i in range(len(shy_shark_lengths_cm)):
    shy_shark_data.append({
        "Species": "Shy Shark",
        "Species_ID": "", # Will be assigned later
        "Edible": False,
        "Measure_Type": "Total length",
        "Length": shy_shark_lengths_cm[i],
        "Weight": round(shy_shark_weights_kg[i], 2)
    })

# Calculate a, b, r_squared for Shy Shark
a_ss, b_ss, r_squared_ss = calculate_lwr_parameters(shy_shark_lengths_cm, shy_shark_weights_kg)

shy_shark_algorithm = {
    "Species": "Shy Shark",
    "a": a_ss,
    "b": b_ss,
    "r_squared": r_squared_ss,
    "Measure_Type": "Total length"
}

# Save data and algorithm to JSON files for now
with open("shy_shark_data.json", "w") as f:
    json.dump(shy_shark_data, f, indent=4)

with open("shy_shark_algorithm.json", "w") as f:
    json.dump(shy_shark_algorithm, f, indent=4)

print("Shy Shark data and algorithm generated and saved.")


