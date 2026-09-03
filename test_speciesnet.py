"""
test_speciesnet.py
Runs wildlife species identification on a sample camera-trap image using SpeciesNet.
"""
import os
import sys
from PIL import Image

def ensure_sample_image(image_path: str = "sample_image.jpg") -> str:
    """Creates a sample test image if none exists."""
    if not os.path.exists(image_path):
        print(f"Creating a sample image at {image_path}...")
        img = Image.new("RGB", (640, 480), color=(85, 120, 90))
        img.save(image_path)
    return image_path

def main():
    print("=" * 60)
    print("Testing SpeciesNet (Google CameraTraps AI)")
    print("=" * 60)

    try:
        import speciesnet
        from speciesnet import SpeciesNet
    except ImportError as e:
        print(f"ERROR: speciesnet is not installed in the current environment: {e}")
        print("Run with: .\\venv_speciesnet\\Scripts\\python.exe test_speciesnet.py")
        sys.exit(1)

    image_path = ensure_sample_image("sample_image.jpg")
    print(f"Target sample image: {image_path}")

    model_name = speciesnet.DEFAULT_MODEL
    print(f"Loading SpeciesNet model ({model_name})...")
    model = SpeciesNet(model_name=model_name)
    print("Model loaded successfully!")

    print(f"Running inference on {image_path}...")
    results = model.predict(filepaths=[image_path])

    print("\n" + "=" * 60)
    print("INFERENCE RESULTS:")
    print("=" * 60)
    predictions = results.get("predictions", [])
    for p in predictions:
        print(f"File: {p.get('filepath')}")
        print(f"Prediction: {p.get('prediction')}")
        print(f"Confidence Score: {p.get('prediction_score'):.4f}")
        print(f"Source: {p.get('prediction_source')}")
        detections = p.get("detections", [])
        print(f"Detections Count: {len(detections)}")
        for d in detections:
            print(f"  - Category: {d.get('category')}, Confidence: {d.get('conf')}, BBox: {d.get('bbox')}")
    print("=" * 60)
    print("SpeciesNet test completed successfully!")

if __name__ == "__main__":
    main()
