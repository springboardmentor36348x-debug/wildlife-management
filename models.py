"""
Complete SQLAlchemy ORM Models for Wildlife Population Intelligence System
Covers all phases 1-4
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
import enum

# =====================================================================
# PHASE 1: AUTHENTICATION & MONITORING SETUP
# =====================================================================

class UserRole(str, enum.Enum):
    """User roles"""
    WILDLIFE_RESEARCHER = "wildlife_researcher"
    CONSERVATION_OFFICER = "conservation_officer"
    FOREST_DEPARTMENT_OFFICER = "forest_department_officer"
    ADMINISTRATOR = "administrator"

class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    organization = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.WILDLIFE_RESEARCHER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    surveys = relationship("Survey", back_populates="created_by", foreign_keys="Survey.created_by_id")
    observations = relationship("Observation", back_populates="created_by")
    monitoring_sites = relationship("MonitoringSite", back_populates="created_by")

    def __repr__(self):
        return f"<User {self.email}>"

class Species(Base):
    """Species catalog"""
    __tablename__ = "species"

    id = Column(Integer, primary_key=True, index=True)
    common_name = Column(String(255), nullable=False, index=True)
    scientific_name = Column(String(255), nullable=False, unique=True, index=True)
    species_group = Column(String(100), nullable=False)  # Mammal, Bird, Reptile, etc.
    conservation_status = Column(String(100), nullable=True)  # Endangered, Vulnerable, etc.
    iucn_status = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    habitat_type = Column(String(255), nullable=True)
    diet_type = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_endangered = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    observations = relationship("Observation", back_populates="species")
    population_data = relationship("PopulationAnalytics", back_populates="species")

    def __repr__(self):
        return f"<Species {self.scientific_name}>"

class HabitatType(str, enum.Enum):
    """Habitat types"""
    FOREST = "forest"
    GRASSLAND = "grassland"
    WETLAND = "wetland"
    MOUNTAIN = "mountain"
    DESERT = "desert"
    COASTAL = "coastal"
    URBAN = "urban"
    AGRICULTURAL = "agricultural"

class MonitoringSite(Base):
    """Monitoring site/location"""
    __tablename__ = "monitoring_sites"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String(255), nullable=False, index=True)
    site_code = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    habitat_type = Column(Enum(HabitatType), nullable=False)
    area_km2 = Column(Float, nullable=True)
    is_protected_area = Column(Boolean, default=False)
    protection_status = Column(String(100), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_by = relationship("User", back_populates="monitoring_sites")
    surveys = relationship("Survey", back_populates="monitoring_site")
    devices = relationship("Device", back_populates="monitoring_site")
    environmental_data = relationship("EnvironmentalMeasurement", back_populates="monitoring_site")
    habitat_assessments = relationship("HabitatAssessment", back_populates="monitoring_site")

    def __repr__(self):
        return f"<MonitoringSite {self.site_name}>"

class DeviceType(str, enum.Enum):
    """Device types"""
    CAMERA_TRAP = "camera_trap"
    AUDIO_RECORDER = "audio_recorder"
    DRONE = "drone"
    SATELLITE = "satellite"
    THERMAL_CAMERA = "thermal_camera"

class Device(Base):
    """Monitoring device"""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, nullable=False)
    device_type = Column(Enum(DeviceType), nullable=False)
    device_name = Column(String(255), nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)
    battery_level = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite", back_populates="devices")
    observations = relationship("Observation", back_populates="device")

    def __repr__(self):
        return f"<Device {self.device_name}>"

class Survey(Base):
    """Wildlife survey"""
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(String(100), unique=True, nullable=False, index=True)
    survey_name = Column(String(255), nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    survey_date = Column(DateTime(timezone=True), nullable=False)
    survey_duration_hours = Column(Float, nullable=True)
    weather_conditions = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite", back_populates="surveys")
    created_by = relationship("User", back_populates="surveys", foreign_keys=[created_by_id])
    observations = relationship("Observation", back_populates="survey")

    def __repr__(self):
        return f"<Survey {self.survey_id}>"

# =====================================================================
# PHASE 2: IMAGE & AUDIO ANALYSIS
# =====================================================================

class Observation(Base):
    """Wildlife observation"""
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(String(100), unique=True, nullable=False, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    observation_type = Column(String(50), nullable=False)  # image, audio, manual
    observation_date = Column(DateTime(timezone=True), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    count = Column(Integer, default=1)
    confidence_score = Column(Float, nullable=True)
    behavior_observed = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    survey = relationship("Survey", back_populates="observations")
    species = relationship("Species", back_populates="observations")
    device = relationship("Device", back_populates="observations")
    created_by = relationship("User")
    image_analysis = relationship("ImageAnalysis", back_populates="observation", uselist=False)
    audio_analysis = relationship("AudioAnalysis", back_populates="observation", uselist=False)

    def __repr__(self):
        return f"<Observation {self.observation_id}>"

class ImageAnalysis(Base):
    """Image analysis results"""
    __tablename__ = "image_analysis"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), unique=True, nullable=False)
    detected_species = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    animal_count = Column(Integer, nullable=True)
    image_quality = Column(String(50), nullable=True)  # good, fair, poor
    bounding_boxes = Column(JSON, nullable=True)
    behavior_detected = Column(String(255), nullable=True)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now())
    model_version = Column(String(50), nullable=True)

    # Relationships
    observation = relationship("Observation", back_populates="image_analysis")

    def __repr__(self):
        return f"<ImageAnalysis obs_id={self.observation_id}>"

class AudioAnalysis(Base):
    """Audio analysis results"""
    __tablename__ = "audio_analysis"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), unique=True, nullable=False)
    detected_species = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    call_type = Column(String(100), nullable=True)  # bird_call, mammal_vocalization, etc.
    frequency_range = Column(String(100), nullable=True)
    noise_level = Column(Float, nullable=True)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now())
    model_version = Column(String(50), nullable=True)
    spectrogram_path = Column(String(500), nullable=True)

    # Relationships
    observation = relationship("Observation", back_populates="audio_analysis")

    def __repr__(self):
        return f"<AudioAnalysis obs_id={self.observation_id}>"

# =====================================================================
# PHASE 3: POPULATION & BIODIVERSITY INTELLIGENCE
# =====================================================================

class PopulationAnalytics(Base):
    """Population statistics and trends"""
    __tablename__ = "population_analytics"

    id = Column(Integer, primary_key=True, index=True)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    time_period = Column(String(50), nullable=False)  # daily, weekly, monthly, yearly
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    observation_count = Column(Integer, default=0)
    population_estimate = Column(Integer, nullable=True)
    population_density = Column(Float, nullable=True)
    growth_rate = Column(Float, nullable=True)
    trend = Column(String(50), nullable=True)  # increasing, stable, decreasing
    confidence_level = Column(String(50), nullable=True)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    species = relationship("Species", back_populates="population_data")
    monitoring_site = relationship("MonitoringSite")

    def __repr__(self):
        return f"<PopulationAnalytics species_id={self.species_id}>"

class BiodiversityAnalytics(Base):
    """Biodiversity metrics"""
    __tablename__ = "biodiversity_analytics"

    id = Column(Integer, primary_key=True, index=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    time_period = Column(String(50), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    species_richness = Column(Integer, default=0)  # number of species
    shannon_diversity = Column(Float, nullable=True)
    simpson_diversity = Column(Float, nullable=True)
    evenness = Column(Float, nullable=True)
    total_observations = Column(Integer, default=0)
    biodiversity_score = Column(Float, nullable=True)
    biodiversity_status = Column(String(50), nullable=True)  # excellent, good, fair, poor
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite")

    def __repr__(self):
        return f"<BiodiversityAnalytics site_id={self.monitoring_site_id}>"

# =====================================================================
# PHASE 3: HABITAT & CONSERVATION INTELLIGENCE
# =====================================================================

class EnvironmentalMeasurement(Base):
    """Environmental measurements"""
    __tablename__ = "environmental_measurements"

    id = Column(Integer, primary_key=True, index=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    measurement_date = Column(DateTime(timezone=True), nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    ph_level = Column(Float, nullable=True)
    water_quality = Column(String(100), nullable=True)
    vegetation_cover = Column(Float, nullable=True)  # percentage
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite", back_populates="environmental_data")

    def __repr__(self):
        return f"<EnvironmentalMeasurement site_id={self.monitoring_site_id}>"

class HabitatAssessment(Base):
    """Habitat health assessment"""
    __tablename__ = "habitat_assessments"

    id = Column(Integer, primary_key=True, index=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    assessment_date = Column(DateTime(timezone=True), nullable=False)
    habitat_quality_score = Column(Float, nullable=True)  # 0-100
    vegetation_score = Column(Float, nullable=True)
    water_source_score = Column(Float, nullable=True)
    human_disturbance_score = Column(Float, nullable=True)  # reverse scored
    degradation_level = Column(String(50), nullable=True)  # none, low, moderate, high
    degradation_type = Column(String(255), nullable=True)  # deforestation, pollution, etc.
    restoration_needed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite", back_populates="habitat_assessments")

    def __repr__(self):
        return f"<HabitatAssessment site_id={self.monitoring_site_id}>"

class HabitatThreat(Base):
    """Habitat threats"""
    __tablename__ = "habitat_threats"

    id = Column(Integer, primary_key=True, index=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    threat_type = Column(String(100), nullable=False)  # poaching, deforestation, pollution, etc.
    severity = Column(String(50), nullable=False)  # low, medium, high
    description = Column(Text, nullable=True)
    date_identified = Column(DateTime(timezone=True), nullable=False)
    date_resolved = Column(DateTime(timezone=True), nullable=True)
    evidence_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite")

    def __repr__(self):
        return f"<HabitatThreat {self.threat_type}>"

class ConservationAlert(Base):
    """Conservation alerts"""
    __tablename__ = "conservation_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(100), nullable=False)  # population_decline, habitat_degradation, etc.
    severity = Column(String(50), nullable=False)  # low, medium, high, critical
    description = Column(Text, nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=True)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    monitoring_site = relationship("MonitoringSite")
    species = relationship("Species")

    def __repr__(self):
        return f"<ConservationAlert {self.alert_type}>"

class ConservationAction(Base):
    """Conservation actions taken"""
    __tablename__ = "conservation_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=True)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)
    status = Column(String(50), default="planned")  # planned, in_progress, completed
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    responsible_party = Column(String(255), nullable=True)
    outcome = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite")
    species = relationship("Species")

    def __repr__(self):
        return f"<ConservationAction {self.action_type}>"

class EcosystemHealth(Base):
    """Overall ecosystem health score"""
    __tablename__ = "ecosystem_health"

    id = Column(Integer, primary_key=True, index=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    assessment_date = Column(DateTime(timezone=True), nullable=False)
    species_diversity_score = Column(Float, nullable=True)  # 30% weight
    population_stability_score = Column(Float, nullable=True)  # 25% weight
    habitat_quality_score = Column(Float, nullable=True)  # 20% weight
    endangered_species_score = Column(Float, nullable=True)  # 15% weight
    environmental_conditions_score = Column(Float, nullable=True)  # 10% weight
    overall_health_score = Column(Float, nullable=True)  # weighted average
    health_status = Column(String(50), nullable=True)  # excellent, good, fair, poor
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite")

    def __repr__(self):
        return f"<EcosystemHealth site_id={self.monitoring_site_id}>"

# =====================================================================
# PHASE 4: REPORTING & GIS
# =====================================================================

class GeneratedReport(Base):
    """Generated reports"""
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(100), unique=True, nullable=False)
    report_type = Column(String(100), nullable=False)  # survey, population, biodiversity, conservation
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=True)  # pdf, xlsx, json
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite")
    created_by = relationship("User")

    def __repr__(self):
        return f"<GeneratedReport {self.report_id}>"

class GISData(Base):
    """GIS spatial data"""
    __tablename__ = "gis_data"

    id = Column(Integer, primary_key=True, index=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    geometry_type = Column(String(50), nullable=False)  # point, polygon, linestring
    geojson_data = Column(JSON, nullable=False)
    layer_type = Column(String(50), nullable=False)  # species_distribution, habitat, risk, threat
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    monitoring_site = relationship("MonitoringSite")

    def __repr__(self):
        return f"<GISData site_id={self.monitoring_site_id}>"

# =====================================================================
# PHASE 9 & 10: AI & ADVANCED FEATURES
# =====================================================================

class AIRecommendation(Base):
    """AI-generated recommendations"""
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=True)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)
    priority = Column(String(50), nullable=False)  # low, medium, high, critical
    evidence = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected, implemented
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    monitoring_site = relationship("MonitoringSite")
    species = relationship("Species")

    def __repr__(self):
        return f"<AIRecommendation {self.recommendation_type}>"
