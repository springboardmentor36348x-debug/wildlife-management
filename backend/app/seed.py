"""
One-off seed script for local/dev setup.

Run with:  python -m app.seed

Creates:
  - A default administrator account (admin@wildlife.org / Admin@12345)
  - One sample account per other role, for quick RBAC testing
  - Dataset registry entries for the 5 datasets recommended in the spec
    (Snapshot Serengeti, iNaturalist, BirdCLEF, GBIF, Animal Kingdom)
  - One demo Survey with 5 GPS-located MonitoringSites (Milestone 1)
  - ~30 demo Observations, already species-labeled and time-spread over the
    last 60 days, so the Milestone 3/4 engines (Population, Habitat,
    Conservation, Ecosystem Health) have real rows to compute from the
    moment you log in - without this, every M3/4 page would start out
    empty until you manually upload and detect images/audio yourself.
    These rows are inserted directly (not run through the YOLOv8/YAMNet
    detection pipeline) - they simulate the OUTPUT of that pipeline having
    already run, they do not simulate the pipeline itself. Real image/audio
    detection still goes through Image / Audio Detection as normal.

Safe to re-run: skips anything that already exists.
"""
import random
from datetime import datetime, timedelta, timezone

from app.db.session import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.observation import Dataset, DatasetSource, DatasetStatus, Observation, ObservationType
from app.models.survey import Survey, MonitoringSite, SurveyStatus, HabitatType, MonitoringDevice

Base.metadata.create_all(bind=engine)

DEMO_USERS = [
    ("System Administrator", "admin@wildlife.org", "Admin@12345", UserRole.ADMINISTRATOR),
    ("Dr. Amara Singh", "researcher@wildlife.org", "Research@12345", UserRole.RESEARCHER),
    ("Officer Kevin Otieno", "officer@wildlife.org", "Officer@12345", UserRole.CONSERVATION_OFFICER),
    ("Warden Priya Nair", "forest@wildlife.org", "Forest@12345", UserRole.FOREST_DEPARTMENT),
]

DEMO_DATASETS = [
    ("Snapshot Serengeti", DatasetSource.SNAPSHOT_SERENGETI,
     "Wildlife species detection / camera trap image classification", 1_200_000),
    ("iNaturalist Mini", DatasetSource.INATURALIST,
     "Species classification / biodiversity recognition", 500_000),
    ("BirdCLEF", DatasetSource.BIRDCLEF,
     "Bird sound recognition / bioacoustic classification", 300_000),
    ("GBIF Occurrence Records", DatasetSource.GBIF,
     "Species occurrence records / biodiversity analysis", 900_000),
    ("Animal Kingdom Dataset", DatasetSource.ANIMAL_KINGDOM,
     "Animal image recognition / species identification", 150_000),
]

# Real GPS coordinates spread across the Serengeti-Mara ecosystem (East
# Africa) - matches the "Snapshot Serengeti" dataset referenced in the spec.
DEMO_SITES = [
    ("Seronera Camera Post", -2.4581, 34.8222, HabitatType.GRASSLAND, MonitoringDevice.CAMERA_TRAP),
    ("Grumeti Riverine Camp", -2.1667, 34.5333, HabitatType.RIVERINE, MonitoringDevice.CAMERA_TRAP),
    ("Musabi Plains Drone Base", -2.6944, 34.7500, HabitatType.GRASSLAND, MonitoringDevice.DRONE),
    ("Mara Wetland Audio Node", -1.5833, 35.1500, HabitatType.WETLAND, MonitoringDevice.AUDIO_SENSOR),
    ("Ngorongoro Forest Edge", -3.2000, 35.5000, HabitatType.FOREST, MonitoringDevice.CAMERA_TRAP),
]

# (species_label, typical confidence range) - matches Milestone 2's YOLOv8
# animal classes so Population/Conservation scoring behaves realistically:
# a couple of species are intentionally rare (<=2 total sightings) to
# exercise the "endangered species status" proxy in Feature E/D.
DEMO_SPECIES = [
    ("elephant", (0.72, 0.94)),
    ("zebra", (0.70, 0.92)),
    ("giraffe", (0.68, 0.90)),
    ("bird", (0.55, 0.85)),
    ("frog", (0.50, 0.80)),
    ("leopard", (0.60, 0.88)),  # kept rare on purpose
]


def run():
    db = SessionLocal()
    try:
        for full_name, email, password, role in DEMO_USERS:
            if db.query(User).filter(User.email == email).first():
                print(f"[skip] user already exists: {email}")
                continue
            user = User(
                full_name=full_name,
                email=email,
                hashed_password=hash_password(password),
                role=role,
                organization="Wildlife Population Intelligence System",
            )
            db.add(user)
            print(f"[created] {role.value:22s} -> {email} / {password}")
        db.commit()

        for name, source, purpose, count in DEMO_DATASETS:
            if db.query(Dataset).filter(Dataset.name == name).first():
                print(f"[skip] dataset already exists: {name}")
                continue
            ds = Dataset(
                name=name,
                source=source,
                purpose=purpose,
                record_count=count,
                status=DatasetStatus.REGISTERED,
                registered_at=datetime.now(timezone.utc),
            )
            db.add(ds)
            print(f"[created] dataset -> {name}")
        db.commit()

        # --- Demo Survey + Sites + Observations (Milestone 3/4 sample data) ---
        survey_name = "Serengeti-Mara Ecosystem Watch"
        survey = db.query(Survey).filter(Survey.name == survey_name).first()
        if survey:
            print(f"[skip] survey already exists: {survey_name}")
        else:
            admin = db.query(User).filter(User.email == "admin@wildlife.org").first()
            survey = Survey(
                name=survey_name,
                description="Demo survey seeded for local development so the Population, Habitat, "
                "Conservation, and Ecosystem Health pages have real data to show immediately.",
                protected_area="Serengeti-Mara Protected Area",
                status=SurveyStatus.ACTIVE,
                start_date=datetime.now(timezone.utc) - timedelta(days=60),
                created_by=admin.id,
            )
            db.add(survey)
            db.commit()
            print(f"[created] survey -> {survey_name}")

            sites = []
            for site_name, lat, lon, habitat_type, device in DEMO_SITES:
                site = MonitoringSite(
                    survey_id=survey.id,
                    site_name=site_name,
                    latitude=lat,
                    longitude=lon,
                    habitat_type=habitat_type,
                    monitoring_device=device,
                    protected_area="Serengeti-Mara Protected Area",
                )
                db.add(site)
                sites.append(site)
            db.commit()
            print(f"[created] {len(sites)} monitoring site(s)")

            rng = random.Random(42)  # deterministic, so re-seeding a fresh DB is reproducible
            now = datetime.now(timezone.utc)
            observation_count = 0
            for site in sites:
                # Leave one site (the wetland audio node) sparsely observed on
                # purpose, so Conservation Priorities / Ecosystem Health show a
                # realistic spread instead of every site looking "Excellent".
                num_obs = 2 if site.site_name == "Mara Wetland Audio Node" else rng.randint(6, 10)
                for _ in range(num_obs):
                    species, (lo, hi) = rng.choice(DEMO_SPECIES)
                    # Keep "leopard" genuinely rare system-wide (<=2 total).
                    if species == "leopard" and rng.random() > 0.15:
                        species, (lo, hi) = rng.choice(DEMO_SPECIES[:-1])
                    days_ago = rng.randint(0, 55)
                    obs_type = ObservationType.AUDIO if site.monitoring_device == MonitoringDevice.AUDIO_SENSOR else ObservationType.IMAGE
                    obs = Observation(
                        site_id=site.id,
                        observation_type=obs_type,
                        file_reference=f"seed/{site.id}/{obs_type.value}-{observation_count}.demo",
                        species_label=species,
                        confidence_score=round(rng.uniform(lo, hi), 2),
                        captured_at=now - timedelta(days=days_ago, hours=rng.randint(0, 23)),
                        notes="Seeded demo observation (not run through the live detection pipeline).",
                    )
                    db.add(obs)
                    observation_count += 1
            db.commit()
            print(f"[created] {observation_count} demo observation(s) across {len(sites)} site(s)")

        print("\nSeed complete. Demo login credentials:")
        for full_name, email, password, role in DEMO_USERS:
            print(f"  {role.value:22s} {email:28s} {password}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
