import pandas as pd
from pathlib import Path

# Project folder
project_folder = Path(__file__).resolve().parent.parent

# Dataset
file_path = project_folder / "datasets" / "observations-770098.csv"

print("Dataset path:")
print(file_path)

print("\nFile exists:", file_path.exists())

if not file_path.exists():
    print("\nERROR: Dataset file was not found.")
    print("Please check that observations-770098.csv is inside:")
    print(project_folder / "datasets")
    exit()

# Read dataset
df = pd.read_csv(file_path)

print("\nDataset loaded successfully!")

print("Total observations:", len(df))
print("Total columns:", len(df.columns))

print("\nImportant columns:")
print(
    df[
        [
            "observed_on",
            "latitude",
            "longitude",
            "scientific_name",
            "common_name",
            "iconic_taxon_name"
        ]
    ].head(10)
)

print("\nTaxonomic groups:")
print(df["iconic_taxon_name"].value_counts().head(20))

print("\nTop observed species:")
print(df["scientific_name"].value_counts().head(20))

print("\nMissing latitude:", df["latitude"].isna().sum())
print("Missing longitude:", df["longitude"].isna().sum())
print("Missing species:", df["scientific_name"].isna().sum())