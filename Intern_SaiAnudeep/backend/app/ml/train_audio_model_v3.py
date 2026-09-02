import os
import csv
import numpy as np
import librosa
import joblib

from collections import defaultdict
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split


BASE_DIR = "/app"

ANNOTATIONS = f"{BASE_DIR}/audio_dataset/labels/annotations.csv"
RAW_DIR = f"{BASE_DIR}/audio_dataset/raw"
MODEL_DIR = f"{BASE_DIR}/audio_dataset/processed"

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# SPECIES USED FOR V3
# ============================================================

SPECIES = {
    "combul2": "Common Bulbul",
    "slcbou1": "Southern Lapwing",
    "gnbcam2": "Gray-backed Camaroptera",
    "wbswea1": "White-browed Sparrow-Weaver",
    "yebapa1": "Yellow-bellied Apalis",
    "rindov": "Ring-necked Dove",
    "blnmou1": "Black-naped Monarch",
    "reccor": "Red-capped Robin-Chat",
    "wbgbir1": "White-browed Goshawk",
    "wbrcha2": "White-browed Robin-Chat",
}


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def extract_features(audio_path, start_time):
    y, sr = librosa.load(
        audio_path,
        sr=16000,
        mono=True,
        offset=max(0, float(start_time)),
        duration=3.0,
    )

    if len(y) < sr:
        y = np.pad(y, (0, sr - len(y)))

    mfcc = librosa.feature.mfcc(
        y=y,
        sr=sr,
        n_mfcc=20,
    )

    return np.concatenate([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
    ])


# ============================================================
# LOAD ANNOTATIONS
# ============================================================

def load_annotations():
    rows = []

    with open(
        ANNOTATIONS,
        encoding="utf-8",
        newline="",
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            code = row["Species eBird Code"]

            if code not in SPECIES:
                continue

            filename = row["Filename"]

            audio_path = os.path.join(
                RAW_DIR,
                filename,
            )

            if not os.path.exists(audio_path):
                continue

            rows.append({
                "code": code,
                "filename": filename,
                "start_time": float(
                    row["Start Time (s)"]
                ),
            })

    return rows


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("WILDLIFE AUDIO CLASSIFIER V3")
    print("=" * 60)

    rows = load_annotations()

    print("\nTotal selected annotations:", len(rows))

    # --------------------------------------------------------
    # Group recordings by species
    # --------------------------------------------------------

    recordings_by_species = defaultdict(set)

    for row in rows:
        recordings_by_species[row["code"]].add(
            row["filename"]
        )

    print("\nDistinct recordings per species:")

    for code in SPECIES:
        print(
            f"{SPECIES[code]}: "
            f"{len(recordings_by_species[code])}"
        )

    # --------------------------------------------------------
    # Split BY RECORDING
    # --------------------------------------------------------

    train_files = set()
    test_files = set()

    for code in SPECIES:

        files = sorted(
            recordings_by_species[code]
        )

        if len(files) < 4:
            print(
                f"\nSkipping {SPECIES[code]} "
                f"(not enough recordings)"
            )
            continue

        train, test = train_test_split(
            files,
            test_size=0.20,
            random_state=42,
        )

        train_files.update(train)
        test_files.update(test)

    print("\nTraining recordings:", len(train_files))
    print("Testing recordings:", len(test_files))

    # --------------------------------------------------------
    # Feature extraction
    # --------------------------------------------------------

    X_train = []
    y_train = []

    X_test = []
    y_test = []

    for row in rows:

        audio_path = os.path.join(
            RAW_DIR,
            row["filename"],
        )

        try:

            features = extract_features(
                audio_path,
                row["start_time"],
            )

            label = SPECIES[row["code"]]

            if row["filename"] in train_files:

                X_train.append(features)
                y_train.append(label)

            elif row["filename"] in test_files:

                X_test.append(features)
                y_test.append(label)

        except Exception as exc:

            print(
                f"Skipping {row['filename']} "
                f"@ {row['start_time']}: {exc}"
            )

    X_train = np.asarray(X_train)
    y_train = np.asarray(y_train)

    X_test = np.asarray(X_test)
    y_test = np.asarray(y_test)

    print("\nTraining samples:", len(X_train))
    print("Test samples:", len(X_test))

    if len(X_train) == 0 or len(X_test) == 0:
        raise RuntimeError(
            "Not enough data was extracted for training/testing."
        )

    # --------------------------------------------------------
    # Class distribution
    # --------------------------------------------------------

    print("\nTraining class distribution:")

    unique, counts = np.unique(
        y_train,
        return_counts=True,
    )

    for name, count in zip(unique, counts):

        print(
            f"{name}: {count}"
        )

    # --------------------------------------------------------
    # Train Random Forest
    # --------------------------------------------------------

    print("\nTraining V3 Random Forest...")

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
        max_features="sqrt",
    )

    model.fit(
        X_train,
        y_train,
    )

    # --------------------------------------------------------
    # Evaluation
    # --------------------------------------------------------

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print(
        "\nV3 Accuracy:",
        round(accuracy, 4)
    )

    print(
        "\nV3 Classification Report:"
    )

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    # --------------------------------------------------------
    # Save model
    # --------------------------------------------------------

    model_path = os.path.join(
        MODEL_DIR,
        "wildlife_audio_classifier_v3.joblib",
    )

    joblib.dump(
        model,
        model_path,
    )

    print(
        "\nV3 model saved to:"
    )

    print(model_path)

    print("\nClasses:")

    for class_name in model.classes_:
        print(
            "-",
            class_name
        )

    print("\n" + "=" * 60)
    print("V3 TRAINING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()