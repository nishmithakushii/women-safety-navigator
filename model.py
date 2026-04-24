# safety_model.py

import numpy as np
from sklearn.linear_model import LogisticRegression

# -----------------------------
# 1. Training Data (Synthetic)
# -----------------------------
# Features:
# [time, crowd, light, crime]
# time: 0 = day, 1 = night
# crowd: 0 = low, 1 = medium, 2 = high
# light: 0 = poor, 1 = good
# crime: 0 = low, 1 = high

X = np.array([
    [0, 2, 1, 0],  # Safe (day, crowded, good light, low crime)
    [1, 0, 0, 1],  # Unsafe (night, low crowd, poor light, high crime)
    [1, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 0],
    [0, 2, 1, 1],
    [1, 2, 1, 0],
    [0, 0, 1, 0]
])

# Labels:
# 1 = Safe, 0 = Unsafe
y = np.array([1, 0, 0, 1, 0, 0, 1, 1])

# -----------------------------
# 2. Train Model
# -----------------------------
model = LogisticRegression()
model.fit(X, y)

# -----------------------------
# 3. Prediction Function
# -----------------------------
def predict_safety(time, crowd, light, crime):
    input_data = np.array([[time, crowd, light, crime]])
    
    probability = model.predict_proba(input_data)[0][1]  # Safe probability
    prediction = model.predict(input_data)[0]

    return probability, prediction


# -----------------------------
# 4. Example Usage
# -----------------------------
if __name__ == "__main__":
    prob, pred = predict_safety(time=1, crowd=0, light=0, crime=1)

    print(f"Safety Probability: {prob:.2f}")
    print("Safe Route" if pred == 1 else "Unsafe Route") 