import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ROBOFLOW_API_KEY")
MODEL_ID = "wildlife-monitoring-and-poaching-detection-ozf3h/1"


def detect_animal(image_path: str):

    with open(image_path, "rb") as image_file:
        image_base64 = base64.b64encode(
            image_file.read()
        ).decode("utf-8")

    url = f"https://serverless.roboflow.com/{MODEL_ID}"

    response = requests.post(
        url,
        params={
            "api_key": API_KEY,
            "confidence": 10
        },
        data=image_base64,
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout=120
    )

    response.raise_for_status()

    result = response.json()

    detections = []

    for prediction in result.get("predictions", []):

        detections.append({
            "animal": prediction.get("class", "unknown"),
            "confidence": round(
                float(prediction.get("confidence", 0)) * 100,
                2
            ),
            "x": prediction.get("x"),
            "y": prediction.get("y"),
            "width": prediction.get("width"),
            "height": prediction.get("height")
        })

    return detections