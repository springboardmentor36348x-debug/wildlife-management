import os
import warnings

import joblib
import librosa
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


# ============================================================
# CONFIGURATION
# ============================================================

DATASET_DIR = "/app/animal_audio_dataset/raw"
OUTPUT_DIR = "/app/animal_audio_dataset/processed"
MODEL_PATH = os.path.join(
    OUTPUT_DIR,
    "animal_audio_classifier.joblib",
)

SAMPLE_RATE = 22050
MAX_DURATION = 10
N_MFCC = 40


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def extract_features(file_path):
    """
    Extract MFCC and spectral features from an audio file.
    """

    try:
        y, sr = librosa.load(
            file_path,
            sr=SAMPLE_RATE,
            mono=True,
            duration=MAX_DURATION,
        )

        if len(y) == 0:
            return None

        # MFCC
        mfcc = librosa.feature.mfcc(
            y=y,
            sr=sr,
            n_mfcc=N_MFCC,
        )

        mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_std = np.std(mfcc, axis=1)

        # Spectral centroid
        spectral_centroid = librosa.feature.spectral_centroid(
            y=y,
            sr=sr,
        )

        # Spectral bandwidth
        spectral_bandwidth = librosa.feature.spectral_bandwidth(
            y=y,
            sr=sr,
        )

        # Spectral rolloff
        spectral_rolloff = librosa.feature.spectral_rolloff(
            y=y,
            sr=sr,
        )

        # Zero crossing rate
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y)

        features = np.concatenate([
            mfcc_mean,
            mfcc_std,
            [
                np.mean(spectral_centroid),
                np.std(spectral_centroid),
                np.mean(spectral_bandwidth),
                np.std(spectral_bandwidth),
                np.mean(spectral_rolloff),
                np.std(spectral_rolloff),
                np.mean(zero_crossing_rate),
                np.std(zero_crossing_rate),
            ],
        ])

        return features

    except Exception as error:
        print(f"Feature extraction failed: {file_path}")
        print(f"Reason: {error}")
        return None


# ============================================================
# DATASET LOADING
# ============================================================

def load_dataset():
    features = []
    labels = []
    filenames = []

    class_names = sorted(
        [
            name
            for name in os.listdir(DATASET_DIR)
            if os.path.isdir(os.path.join(DATASET_DIR, name))
        ]
    )

    print()
    print("Classes:")
    for class_name in class_names:
        print(f"- {class_name}")

    print()
    print("Extracting audio features...")
    print("-" * 60)

    for class_name in class_names:

        class_dir = os.path.join(
            DATASET_DIR,
            class_name,
        )

        audio_files = sorted(
            [
                filename
                for filename in os.listdir(class_dir)
                if filename.lower().endswith(".wav")
            ]
        )

        successful = 0

        for filename in audio_files:

            file_path = os.path.join(
                class_dir,
                filename,
            )

            feature_vector = extract_features(file_path)

            if feature_vector is None:
                continue

            features.append(feature_vector)
            labels.append(class_name)
            filenames.append(filename)

            successful += 1

        print(
            f"{class_name}: "
            f"{successful}/{len(audio_files)} files processed"
        )

    return (
        np.array(features),
        np.array(labels),
        np.array(filenames),
    )


# ============================================================
# MAIN TRAINING
# ============================================================

def main():

    print("=" * 60)
    print("WILDLIFE ANIMAL AUDIO CLASSIFIER")
    print("=" * 60)

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True,
    )

    X, labels, filenames = load_dataset()

    if len(X) == 0:
        raise RuntimeError(
            "No audio features were extracted."
        )

    print()
    print("Total usable recordings:", len(X))
    print("Feature vector size:", X.shape[1])

    # --------------------------------------------------------
    # Encode labels
    # --------------------------------------------------------

    label_encoder = LabelEncoder()

    y = label_encoder.fit_transform(labels)

    print()
    print("Encoded classes:")

    for index, class_name in enumerate(
        label_encoder.classes_
    ):
        print(f"{index}: {class_name}")

    # --------------------------------------------------------
    # Train / test split
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    print()
    print("Training samples:", len(X_train))
    print("Testing samples:", len(X_test))

    # --------------------------------------------------------
    # Random Forest
    # --------------------------------------------------------

    print()
    print("Training Random Forest...")
    print("-" * 60)

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

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print()
    print("Animal Model Accuracy:")
    print(round(accuracy, 4))

    print()
    print("Animal Model Classification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=label_encoder.classes_,
            zero_division=0,
        )
    )

    # --------------------------------------------------------
    # Save model
    # --------------------------------------------------------

    model_package = {
        "model": model,
        "label_encoder": label_encoder,
        "sample_rate": SAMPLE_RATE,
        "n_mfcc": N_MFCC,
        "max_duration": MAX_DURATION,
        "feature_type": "MFCC + spectral features",
    }

    joblib.dump(
        model_package,
        MODEL_PATH,
    )

    print()
    print("Animal model saved to:")
    print(MODEL_PATH)

    print()
    print("=" * 60)
    print("ANIMAL AUDIO TRAINING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    warnings.filterwarnings(
        "ignore",
        category=FutureWarning,
    )

    main()