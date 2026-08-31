import json
import os
import sys

import numpy as np
import pandas as pd

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASETS_DIR = os.path.join(BACKEND_DIR, "datasets")
ML_MODELS_DIR = os.path.join(BACKEND_DIR, "app", "ml_models")
os.makedirs(ML_MODELS_DIR, exist_ok=True)

IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 12
VALID_EXTENSIONS = (".jpg", ".jpeg", ".png")

IMAGE_DATASET_FOLDERS = [
    "Bird Speciees Dataset",
    "animal_kingdom_substitute",
    os.path.join("inaturalist_sample", "sample_images"),
    "snapshot_serengeti_sample",
]


def build_dataframe() -> pd.DataFrame:
    rows = []
    for rel_path in IMAGE_DATASET_FOLDERS:
        base_path = os.path.join(DATASETS_DIR, rel_path)
        if not os.path.isdir(base_path):
            continue
        for species_folder in sorted(os.listdir(base_path)):
            species_path = os.path.join(base_path, species_folder)
            if not os.path.isdir(species_path):
                continue
            for fname in os.listdir(species_path):
                if fname.lower().endswith(VALID_EXTENSIONS):
                    rows.append({"filepath": os.path.join(species_path, fname), "label": species_folder})

    df = pd.DataFrame(rows)
    if df.empty:
        raise RuntimeError("No species-per-folder images found under backend/datasets/.")

    counts = df["label"].value_counts()
    keep_labels = counts[counts >= 10].index
    dropped = counts[counts < 10]
    if len(dropped) > 0:
        print(f"Dropping {len(dropped)} species with < 10 images:")
        for label, n in dropped.items():
            print(f"    - {label}: {n} images")
    return df[df["label"].isin(keep_labels)].reset_index(drop=True)


def main():
    import tensorflow as tf
    from sklearn.model_selection import train_test_split
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras import layers, models

    df = build_dataframe()
    class_names = sorted(df["label"].unique().tolist())
    print(f"Training on {len(df)} images across {len(class_names)} species: {class_names}")

    # Stratified, shuffled split — fixes Keras's validation_split just
    # slicing off the last rows (which put whole species only in val).
    train_df, val_df = train_test_split(
        df, test_size=0.2, stratify=df["label"], random_state=42
    )

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=15, horizontal_flip=True, zoom_range=0.1,
    )
    val_datagen = ImageDataGenerator(rescale=1.0 / 255)  # no augmentation for validation

    train_gen = train_datagen.flow_from_dataframe(
        train_df, x_col="filepath", y_col="label", target_size=IMG_SIZE,
        batch_size=BATCH_SIZE, class_mode="categorical",
        classes=class_names, shuffle=True,
    )
    val_gen = val_datagen.flow_from_dataframe(
        val_df, x_col="filepath", y_col="label", target_size=IMG_SIZE,
        batch_size=BATCH_SIZE, class_mode="categorical",
        classes=class_names, shuffle=False,
    )

    base_model = MobileNetV2(input_shape=IMG_SIZE + (3,), include_top=False, weights="imagenet")
    base_model.trainable = False

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.Dense(len(class_names), activation="softmax"),
    ])

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    model.summary()
    model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS)

    model.save(os.path.join(ML_MODELS_DIR, "image_species_model.h5"))

    index_to_label = {str(v): k for k, v in train_gen.class_indices.items()}
    with open(os.path.join(ML_MODELS_DIR, "image_labels.json"), "w") as f:
        json.dump(index_to_label, f, indent=2)

    print(f"\nSaved model to {ML_MODELS_DIR}/image_species_model.h5")
if __name__ == "__main__":
    main()