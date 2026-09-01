import pandas as pd
from pathlib import Path

# Project folder
project_folder = Path(__file__).resolve().parent.parent

# Input dataset
input_file = project_folder / "datasets" / "observations-770098.csv"

# Output dataset
output_file = project_folder / "datasets" / "wildlife_population_data.csv"

print("Loading dataset...")

df = pd.read_csv(input_file)

# Wildlife groups we are currently using
wildlife_groups = [
    "Aves",
    "Mammalia",
    "Reptilia",
    "Amphibia"
]

# Filter wildlife observations
wildlife = df[
    df["iconic_taxon_name"].isin(wildlife_groups)
].copy()

# Remove records without species name
wildlife = wildlife[
    wildlife["scientific_name"].notna()
].copy()

# Keep only the fields required for population/distribution analysis
wildlife = wildlife[
    [
        "observed_on",
        "latitude",
        "longitude",
        "scientific_name",
        "common_name",
        "iconic_taxon_name"
    ]
]

# Remove records without coordinates
wildlife = wildlife.dropna(
    subset=["latitude", "longitude"]
)

# Save cleaned dataset
wildlife.to_csv(
    output_file,
    index=False
)

print("\nPopulation dataset prepared successfully!")

print("Total wildlife observations:", len(wildlife))

print("\nWildlife groups:")
print(
    wildlife["iconic_taxon_name"]
    .value_counts()
)

print("\nTop species:")
print(
    wildlife["scientific_name"]
    .value_counts()
    .head(20)
)

print("\nMissing latitude:",
      wildlife["latitude"].isna().sum())

print("Missing longitude:",
      wildlife["longitude"].isna().sum())

print("\nSaved to:")
print(output_file)