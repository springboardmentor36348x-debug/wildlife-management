import json
import os
import sys

import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from app.services.audio_classifier import extract_features

AUDIO_DIR = os.path.join(BACKEND_DIR, "datasets", "Audio")
ML_MODELS_DIR = os.path.join(BACKEND_DIR, "app", "ml_models")
os.makedirs(ML_MODELS_DIR, exist_ok=True)

VALID_EXTENSIONS = (".wav", ".mp3", ".flac", ".ogg")


def build_dataset():
    X, y = [], []
    if not os.path.isdir(AUDIO_DIR):
        raise RuntimeError(f"Audio dataset folder not found: {AUDIO_DIR}")

    for species_folder in sorted(os.listdir(AUDIO_DIR)):
        species_path = os.path.join(AUDIO_DIR, species_folder)
        if not os.path.isdir(species_path):
            continue
        clips = [f for f in os.listdir(species_path) if f.lower().endswith(VALID_EXTENSIONS)]
        print(f"  {species_folder}: {len(clips)} clips")
        for fname in clips:
            file_path = os.path.join(species_path, fname)
            with open(file_path, "rb") as f:
                audio_bytes = f.read()
            try:
                features = extract_features(audio_bytes)
            except Exception as e:
                print(f"    ! failed to process {fname}: {e}")
                continue
            X.append(features)
            y.append(species_folder)

    if not X:
        raise RuntimeError("No usable audio clips found under backend/datasets/Audio/.")
    return np.array(X), np.array(y)


def main():
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report
    import joblib

    print("Extracting features from audio clips...")
    X, y = build_dataset()

    class_names = sorted(set(y))
    print(f"\nTraining on {len(X)} clips across {len(class_names)} species: {class_names}")

    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    except ValueError:
        print("Too few clips per species for a held-out split — training on all data.")
        X_train, y_train = X, y
        X_test, y_test = X, y

    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    clf.fit(X_train, y_train)

    print("\nValidation performance:")
    print(classification_report(y_test, clf.predict(X_test)))

    joblib.dump(clf, os.path.join(ML_MODELS_DIR, "audio_species_model.joblib"))

    index_to_label = {str(i): label for i, label in enumerate(clf.classes_)}
    with open(os.path.join(ML_MODELS_DIR, "audio_labels.json"), "w") as f:
        json.dump(index_to_label, f, indent=2)

    print(f"\nSaved model to {ML_MODELS_DIR}/audio_species_model.joblib")


if __name__ == "__main__":
    main()