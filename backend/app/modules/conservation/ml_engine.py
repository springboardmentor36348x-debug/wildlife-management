import os
import json
import logging
from typing import Dict, Any, Optional

try:
    import xgboost as xgb
except ImportError:
    xgb = None

import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = "/app/model_cache/demo_habitat_xgboost.json"
METADATA_PATH = "/app/model_cache/demo_habitat_xgboost_meta.json"

class ConservationMLEngine:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self.is_loaded = False
        
        self.load_model()

    def load_model(self):
        if not xgb:
            logger.warning("xgboost not installed, ML engine disabled.")
            return

        if not os.path.exists(MODEL_PATH):
            logger.warning(f"XGBoost model not found at {MODEL_PATH}. Run python -m scripts.train_xgboost")
            return

        try:
            self.model = xgb.XGBRegressor()
            self.model.load_model(MODEL_PATH)
            
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r") as f:
                    self.metadata = json.load(f)
                    
            self.is_loaded = True
            logger.info(f"Loaded ML model: {self.metadata.get('model_version', 'unknown')}")
        except Exception as e:
            logger.error(f"Failed to load XGBoost model: {e}")

    def predict_priority(self, veg_index: float, green_frac: float, texture: float, effort: float, has_degradation: bool) -> Optional[Dict[str, Any]]:
        if not self.is_loaded or self.model is None:
            return None
            
        veg = veg_index if veg_index is not None else 0.5
        green = green_frac if green_frac is not None else 0.5
        tex = texture if texture is not None else 0.5
        eff = effort if effort is not None else 0.0
        deg = 1.0 if has_degradation else 0.0

        try:
            X = np.array([[veg, green, tex, eff, deg]])
            score = float(self.model.predict(X)[0])
            score = max(0.0, min(1.0, score))
            
            return {
                "ml_priority_score": round(score, 4),
                "model_version": self.metadata.get("model_version", "unknown"),
                "is_demo_model": self.metadata.get("is_demo_model", True),
                "disclaimer": "AI-driven priority is based on a demo XGBoost baseline model."
            }
        except Exception as e:
            logger.error(f"XGBoost inference failed: {e}")
            return None

ml_engine = ConservationMLEngine()
