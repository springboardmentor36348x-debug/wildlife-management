"""
Database Seeding Script
Populates the database with realistic sample records for Indian Wildlife Reserves.
Includes users for all 4 roles, species catalog, monitoring sites, devices,
surveys, observations, population metrics, habitat health assessments,
ecosystem health scores, recommendations, alerts, and action logs.
"""

from datetime import datetime, timedelta
import logging
from database import engine, Base, SessionLocal
from security import SecurityService
from models import (
    User, UserRole, Species, MonitoringSite, HabitatType, 
    Device, DeviceType, Survey, Observation, ImageAnalysis, 
    AudioAnalysis, PopulationAnalytics, BiodiversityAnalytics, 
    HabitatAssessment, ConservationAlert, ConservationAction, 
    EcosystemHealth, AIRecommendation
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database():
    """Seed database with realistic initial data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(User).first() is not None:
            logger.info("Database is already seeded. Skipping.")
            return

        logger.info("Seeding database...")

        # 1. Create Users
        users = [
            User(
                name="Dr. Sarah Anjali",
                email="researcher@wildlife.org",
                hashed_password=SecurityService.hash_password("password123"),
                phone="+91-9876543210",
                organization="Wildlife Institute of India",
                role=UserRole.WILDLIFE_RESEARCHER,
                is_active=True,
                is_verified=True
            ),
            User(
                name="Officer Rajesh Kumar",
                email="officer@wildlife.org",
                hashed_password=SecurityService.hash_password("password123"),
                phone="+91-8765432109",
                organization="National Tiger Conservation Authority",
                role=UserRole.CONSERVATION_OFFICER,
                is_active=True,
                is_verified=True
            ),
            User(
                name="Ranger Amit Sharma",
                email="forest@wildlife.org",
                hashed_password=SecurityService.hash_password("password123"),
                phone="+91-7654321098",
                organization="Telangana Forest Department",
                role=UserRole.FOREST_DEPARTMENT_OFFICER,
                is_active=True,
                is_verified=True
            ),
            User(
                name="Admin Administrator",
                email="admin@wildlife.org",
                hashed_password=SecurityService.hash_password("password123"),
                phone="+91-9999999999",
                organization="Wildlife Population Intelligence System",
                role=UserRole.ADMINISTRATOR,
                is_active=True,
                is_verified=True
            )
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)
        researcher, officer, ranger, admin_usr = users

        # 2. Create Species Catalog
        species = [
            Species(
                common_name="Bengal Tiger",
                scientific_name="Panthera tigris tigris",
                species_group="Mammal",
                conservation_status="Endangered",
                iucn_status="EN",
                description="The Bengal tiger is the national animal of India and Bangladesh. It is a dominant apex predator key to forest eco-balance.",
                habitat_type="Tropical deciduous forests, mangroves, grasslands",
                diet_type="Carnivore",
                is_endangered=True
            ),
            Species(
                common_name="Asian Elephant",
                scientific_name="Elephas maximus",
                species_group="Mammal",
                conservation_status="Endangered",
                iucn_status="EN",
                description="The Asian elephant is the largest living land animal in Asia. It is a keystone species modifying habitats to benefit biodiversity.",
                habitat_type="Forests, grasslands, scrub forests",
                diet_type="Herbivore",
                is_endangered=True
            ),
            Species(
                common_name="Indian Leopard",
                scientific_name="Panthera pardus fusca",
                species_group="Mammal",
                conservation_status="Vulnerable",
                iucn_status="VU",
                description="A highly adaptable big cat species found across the Indian subcontinent, capable of climbing trees and hunting in diverse terrain.",
                habitat_type="Rainforests, dry deciduous forests, scrublands, borders",
                diet_type="Carnivore",
                is_endangered=True
            ),
            Species(
                common_name="Great Indian Hornbill",
                scientific_name="Buceros bicornis",
                species_group="Bird",
                conservation_status="Vulnerable",
                iucn_status="VU",
                description="A large, striking bird found in the forests of India and Southeast Asia, known for its loud double-honk vocalizations.",
                habitat_type="Wet evergreen and mixed deciduous forests",
                diet_type="Frugivore",
                is_endangered=True
            ),
            Species(
                common_name="King Cobra",
                scientific_name="Ophiophagus hannah",
                species_group="Reptile",
                conservation_status="Vulnerable",
                iucn_status="VU",
                description="The world's longest venomous snake, endemic to forests from India through Southeast Asia.",
                habitat_type="Rainforests, bamboo thickets, mangrove swamps",
                diet_type="Carnivore",
                is_endangered=True
            ),
            Species(
                common_name="Indian Peafowl",
                scientific_name="Pavo cristatus",
                species_group="Bird",
                conservation_status="Least Concern",
                iucn_status="LC",
                description="The national bird of India, featuring highly ornamental metallic blue plumage and fan-like crest.",
                habitat_type="Forest undergrowth, agricultural woodlands",
                diet_type="Omnivore",
                is_endangered=False
            )
        ]
        db.add_all(species)
        db.commit()
        for s in species:
            db.refresh(s)
        tiger, elephant, leopard, hornbill, cobra, peafowl = species

        # 3. Create Monitoring Sites
        sites = [
            MonitoringSite(
                site_name="Nagarjuna Sagar-Srisailam Tiger Reserve",
                site_code="SITE001",
                description="The largest Tiger Reserve in India, covering five districts across Andhra Pradesh and Telangana. Known for rugged valleys and deciduous forest.",
                latitude=16.5745,
                longitude=79.3124,
                altitude=350.0,
                habitat_type=HabitatType.FOREST,
                area_km2=3727.82,
                is_protected_area=True,
                protection_status="Tiger Reserve (Category IV)",
                created_by_id=researcher.id
            ),
            MonitoringSite(
                site_name="Jim Corbett National Park",
                site_code="SITE002",
                description="India's oldest national park, situated in Uttarakhand's sub-Himalayan belt. Famous for rich wildlife and riverine belts.",
                latitude=29.5300,
                longitude=78.7747,
                altitude=400.0,
                habitat_type=HabitatType.FOREST,
                area_km2=520.82,
                is_protected_area=True,
                protection_status="National Park",
                created_by_id=researcher.id
            ),
            MonitoringSite(
                site_name="Western Ghats Conservation Corridor",
                site_code="SITE003",
                description="A UNESCO World Heritage site and one of the world's eight hottest hotspots of biological diversity.",
                latitude=11.6512,
                longitude=76.6218,
                altitude=900.0,
                habitat_type=HabitatType.MOUNTAIN,
                area_km2=1600.0,
                is_protected_area=True,
                protection_status="Conservation Reserve",
                created_by_id=researcher.id
            )
        ]
        db.add_all(sites)
        db.commit()
        for s in sites:
            db.refresh(s)
        nagarjuna_sagar, jim_corbett, western_ghats = sites

        # 4. Create Devices
        devices = [
            Device(
                device_id="DEV-NS-CAM-01",
                device_type=DeviceType.CAMERA_TRAP,
                device_name="NS core Zone Cam 01",
                monitoring_site_id=nagarjuna_sagar.id,
                location_latitude=16.5780,
                location_longitude=79.3140,
                battery_level=89,
                is_active=True,
                last_sync=datetime.utcnow() - timedelta(hours=2)
            ),
            Device(
                device_id="DEV-NS-CAM-02",
                device_type=DeviceType.CAMERA_TRAP,
                device_name="NS core Zone Cam 02 (Low Battery)",
                monitoring_site_id=nagarjuna_sagar.id,
                location_latitude=16.5695,
                location_longitude=79.3090,
                battery_level=12,
                is_active=True,
                last_sync=datetime.utcnow() - timedelta(days=1)
            ),
            Device(
                device_id="DEV-NS-AUD-01",
                device_type=DeviceType.AUDIO_RECORDER,
                device_name="NS Bioacoustic Unit 01",
                monitoring_site_id=nagarjuna_sagar.id,
                location_latitude=16.5810,
                location_longitude=79.3210,
                battery_level=95,
                is_active=True,
                last_sync=datetime.utcnow() - timedelta(minutes=45)
            ),
            Device(
                device_id="DEV-JC-CAM-01",
                device_type=DeviceType.CAMERA_TRAP,
                device_name="Corbett Riverbed Cam 01",
                monitoring_site_id=jim_corbett.id,
                location_latitude=29.5350,
                location_longitude=78.7800,
                battery_level=82,
                is_active=True,
                last_sync=datetime.utcnow() - timedelta(hours=4)
            ),
            Device(
                device_id="DEV-WG-CAM-01",
                device_type=DeviceType.CAMERA_TRAP,
                device_name="WG Rainforest Cam 01",
                monitoring_site_id=western_ghats.id,
                location_latitude=11.6540,
                location_longitude=76.6250,
                battery_level=77,
                is_active=True,
                last_sync=datetime.utcnow() - timedelta(hours=6)
            )
        ]
        db.add_all(devices)
        db.commit()
        for d in devices:
            db.refresh(d)
        ns_cam1, ns_cam2, ns_aud, jc_cam1, wg_cam1 = devices

        # 5. Create Surveys
        surveys = [
            Survey(
                survey_id="SRV-NS-2026-Q1",
                survey_name="Nagarjuna Sagar Dry Deciduous Wildlife Census 2026",
                monitoring_site_id=nagarjuna_sagar.id,
                created_by_id=researcher.id,
                survey_date=datetime.utcnow() - timedelta(days=20),
                survey_duration_hours=72.0,
                weather_conditions="Dry, Warm, Clear skies",
                notes="Bi-annual baseline monitoring grid deployment to identify big cat populations.",
                is_active=True
            ),
            Survey(
                survey_id="SRV-JC-2026-Q1",
                survey_name="Corbett Riverine Corridor Survey",
                monitoring_site_id=jim_corbett.id,
                created_by_id=researcher.id,
                survey_date=datetime.utcnow() - timedelta(days=15),
                survey_duration_hours=48.0,
                weather_conditions="Foggy morning, sunny afternoon",
                notes="Monitoring tiger movement near water bodies.",
                is_active=True
            )
        ]
        db.add_all(surveys)
        db.commit()
        for s in surveys:
            db.refresh(s)
        ns_survey, jc_survey = surveys

        # 6. Create Historical Observations
        observations = [
            # NS Observations
            Observation(
                observation_id="OBS-NS-001",
                survey_id=ns_survey.id,
                species_id=tiger.id,
                device_id=ns_cam1.id,
                observation_type="image",
                observation_date=datetime.utcnow() - timedelta(days=18),
                latitude=16.5780,
                longitude=79.3140,
                count=1,
                confidence_score=0.965,
                behavior_observed="Scent marking / Walking",
                notes="Healthy male tiger captured in Core Zone.",
                file_path="/uploads/images/sample_tiger.jpg",
                created_by_id=researcher.id
            ),
            Observation(
                observation_id="OBS-NS-002",
                survey_id=ns_survey.id,
                species_id=elephant.id,
                device_id=ns_cam1.id,
                observation_type="image",
                observation_date=datetime.utcnow() - timedelta(days=17),
                latitude=16.5780,
                longitude=79.3140,
                count=3,
                confidence_score=0.941,
                behavior_observed="Foraging near bamboo",
                notes="Herd of 3 elephants moving south.",
                file_path="/uploads/images/sample_elephant.jpg",
                created_by_id=researcher.id
            ),
            Observation(
                observation_id="OBS-NS-003",
                survey_id=ns_survey.id,
                species_id=hornbill.id,
                device_id=ns_aud.id,
                observation_type="audio",
                observation_date=datetime.utcnow() - timedelta(days=16),
                latitude=16.5810,
                longitude=79.3210,
                count=2,
                confidence_score=0.912,
                behavior_observed="Calling from canopy",
                notes="Distinct double-honk vocalization identified.",
                file_path="/uploads/audio/sample_hornbill.wav",
                created_by_id=researcher.id
            ),
            Observation(
                observation_id="OBS-NS-004",
                survey_id=ns_survey.id,
                species_id=peafowl.id,
                device_id=ns_cam2.id,
                observation_type="image",
                observation_date=datetime.utcnow() - timedelta(days=12),
                latitude=16.5695,
                longitude=79.3090,
                count=4,
                confidence_score=0.895,
                behavior_observed="Alert behavior near edge",
                notes="Alarm calls detected shortly after.",
                file_path="/uploads/images/sample_peafowl.jpg",
                created_by_id=researcher.id
            ),
            # Jim Corbett Observations
            Observation(
                observation_id="OBS-JC-001",
                survey_id=jc_survey.id,
                species_id=tiger.id,
                device_id=jc_cam1.id,
                observation_type="image",
                observation_date=datetime.utcnow() - timedelta(days=14),
                latitude=29.5350,
                longitude=78.7800,
                count=2,
                confidence_score=0.982,
                behavior_observed="Drinking at riverbank",
                notes="Mother tiger with juvenile cub spotted.",
                file_path="/uploads/images/sample_tiger_jc.jpg",
                created_by_id=researcher.id
            ),
            Observation(
                observation_id="OBS-JC-002",
                survey_id=jc_survey.id,
                species_id=leopard.id,
                device_id=jc_cam1.id,
                observation_type="image",
                observation_date=datetime.utcnow() - timedelta(days=10),
                latitude=29.5350,
                longitude=78.7800,
                count=1,
                confidence_score=0.925,
                behavior_observed="Active hunting",
                notes="Spotted running along forest boundary.",
                file_path="/uploads/images/sample_leopard.jpg",
                created_by_id=researcher.id
            )
        ]
        db.add_all(observations)
        db.commit()
        for o in observations:
            db.refresh(o)

        # 7. Create ImageAnalysis / AudioAnalysis detail tables
        img_analyses = [
            ImageAnalysis(
                observation_id=observations[0].id,
                detected_species="Bengal Tiger",
                confidence=0.965,
                animal_count=1,
                image_quality="good",
                bounding_boxes=[{"label": "Bengal Tiger", "confidence": 96.5, "box": [120, 240, 480, 560]}],
                behavior_detected="Scent Marking",
                model_version="YOLOv8x-Wildlife-v1.0"
            ),
            ImageAnalysis(
                observation_id=observations[1].id,
                detected_species="Asian Elephant",
                confidence=0.941,
                animal_count=3,
                image_quality="good",
                bounding_boxes=[
                    {"label": "Asian Elephant", "confidence": 94.1, "box": [100, 200, 300, 500]},
                    {"label": "Asian Elephant", "confidence": 89.2, "box": [320, 220, 520, 530]},
                    {"label": "Asian Elephant", "confidence": 78.4, "box": [500, 250, 700, 550]}
                ],
                behavior_detected="Foraging",
                model_version="YOLOv8x-Wildlife-v1.0"
            )
        ]
        db.add_all(img_analyses)
        
        aud_analyses = [
            AudioAnalysis(
                observation_id=observations[2].id,
                detected_species="Great Indian Hornbill",
                confidence=0.912,
                call_type="Resonant Mating Call",
                frequency_range="800 Hz - 4.5 kHz",
                noise_level=0.08,
                model_version="BirdNET-Bioacoustic-v2.4",
                spectrogram_path="/uploads/spectrograms/sample_hornbill_spec.png"
            )
        ]
        db.add_all(aud_analyses)
        db.commit()

        # 8. Create Population Analytics Records
        pop_records = [
            PopulationAnalytics(
                species_id=tiger.id,
                monitoring_site_id=nagarjuna_sagar.id,
                time_period="monthly",
                period_start=datetime.utcnow() - timedelta(days=30),
                period_end=datetime.utcnow(),
                observation_count=18,
                population_estimate=27,
                population_density=0.007,
                growth_rate=8.5,
                trend="Increasing",
                confidence_level="High"
            ),
            PopulationAnalytics(
                species_id=elephant.id,
                monitoring_site_id=nagarjuna_sagar.id,
                time_period="monthly",
                period_start=datetime.utcnow() - timedelta(days=30),
                period_end=datetime.utcnow(),
                observation_count=24,
                population_estimate=45,
                population_density=0.012,
                growth_rate=-2.1,
                trend="Stable",
                confidence_level="Medium"
            )
        ]
        db.add_all(pop_records)

        # 9. Create Habitat Assessment Records
        habitat_records = [
            HabitatAssessment(
                monitoring_site_id=nagarjuna_sagar.id,
                assessment_date=datetime.utcnow() - timedelta(days=5),
                habitat_quality_score=82.4,
                vegetation_score=85.0,
                water_source_score=78.0,
                human_disturbance_score=15.0,
                degradation_level="Low",
                degradation_type="Minor corridor fragmentation",
                restoration_needed=False,
                notes="Deciduous cover intact, river sources flowing."
            ),
            HabitatAssessment(
                monitoring_site_id=western_ghats.id,
                assessment_date=datetime.utcnow() - timedelta(days=10),
                habitat_quality_score=68.5,
                vegetation_score=75.0,
                water_source_score=65.0,
                human_disturbance_score=40.0,
                degradation_level="Moderate",
                degradation_type="Tourist encroachment & edge logging",
                restoration_needed=True,
                notes="Urgent zone demarcation needed."
            )
        ]
        db.add_all(habitat_records)

        # 10. Create Ecosystem Health Records
        health_records = [
            EcosystemHealth(
                monitoring_site_id=nagarjuna_sagar.id,
                assessment_date=datetime.utcnow(),
                species_diversity_score=85.0,
                population_stability_score=78.0,
                habitat_quality_score=82.4,
                endangered_species_score=90.0,
                environmental_conditions_score=75.0,
                overall_health_score=82.7,
                health_status="Healthy"
            ),
            EcosystemHealth(
                monitoring_site_id=western_ghats.id,
                assessment_date=datetime.utcnow(),
                species_diversity_score=70.0,
                population_stability_score=62.0,
                habitat_quality_score=68.5,
                endangered_species_score=80.0,
                environmental_conditions_score=60.0,
                overall_health_score=67.7,
                health_status="Moderate Concern"
            )
        ]
        db.add_all(health_records)

        # 11. Create Alerts
        alerts = [
            ConservationAlert(
                alert_type="device_issue",
                severity="warning",
                description="Core Zone Camera DEV-NS-CAM-02 reports low battery levels (12%). Dispatch battery pack rotation.",
                monitoring_site_id=nagarjuna_sagar.id,
                is_active=True
            ),
            ConservationAlert(
                alert_type="habitat_degradation",
                severity="medium",
                description="Western Ghats Tourist corridor reports moderate canopy cover degradation and noise levels exceeding threshold.",
                monitoring_site_id=western_ghats.id,
                is_active=True
            ),
            ConservationAlert(
                alert_type="endangered_species",
                severity="critical",
                description="Bengal Tiger spotted close to fringe village block. Active monitoring and shepherd advisories launched.",
                monitoring_site_id=nagarjuna_sagar.id,
                species_id=tiger.id,
                is_active=True
            )
        ]
        db.add_all(alerts)

        # 12. Create Actions taken
        actions = [
            ConservationAction(
                action_type="Anti-Poaching Patrol",
                description="Ranger squad conducted intensive 48-hour patrol sweep of Nagarjuna Sagar grid grid-NS-12.",
                monitoring_site_id=nagarjuna_sagar.id,
                status="completed",
                start_date=datetime.utcnow() - timedelta(days=8),
                end_date=datetime.utcnow() - timedelta(days=6),
                responsible_party="Ranger Amit Sharma Team",
                outcome="Secured patrol corridor. Found no wire snares or human encroachment signatures."
            )
        ]
        db.add_all(actions)
        db.commit()

        logger.info("Database seeding completed successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
