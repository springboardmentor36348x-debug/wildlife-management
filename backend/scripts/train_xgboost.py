import os
import json
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split

MODEL_PATH = "/app/model_cache/demo_habitat_xgboost.json"
METADATA_PATH = "/app/model_cache/demo_habitat_xgboost_meta.json"

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    veg = np.random.uniform(0, 1, num_samples)
    green = np.random.uniform(0, 1, num_samples)
    texture = np.random.uniform(0, 1, num_samples)
    effort = np.random.uniform(0, 100, num_samples)
    deg_flag = np.random.binomial(1, 0.3, num_samples)
    
    X = np.column_stack((veg, green, texture, effort, deg_flag))
    base_priority = 1.0 - (veg * 0.4 + green * 0.4 + texture * 0.2)
    priority = base_priority + (deg_flag * 0.3) - (effort * 0.001)
    priority = np.clip(priority, 0, 1)
    return X, priority

def main():
    print("Generating synthetic data for XGBoost demo model...")
    X, y = generate_synthetic_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBRegressor(objective="reg:squarederror", n_estimators=50, max_depth=3, learning_rate=0.1)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save_model(MODEL_PATH)
    
    metadata = {
        "model_version": "1.0.0-demo",
        "description": "Synthetic baseline model for habitat degradation risk and conservation priority. Do NOT present as validated real-world wildlife prediction.",
        "is_demo_model": True,
        "features": ["vegetation_index", "green_pixel_fraction", "canopy_texture", "effort", "degradation_flag"],
        "r2_score": float(score)
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print("Model saved.")

if __name__ == "__main__":
    main()
