# 🎓 Wildlife Population Intelligence System - Code Guide

**A comprehensive guide for BTech Data Science students to understand and extend the codebase**

---

## 📖 Table of Contents

1. [Project Structure Overview](#-project-structure-overview)
2. [Phase-by-Phase Code Breakdown](#-phase-by-phase-code-breakdown)
3. [How to Extend the Code](#-how-to-extend-the-code)
4. [Key Concepts](#-key-concepts)
5. [Debugging Tips](#-debugging-tips)
6. [Common Tasks](#-common-tasks)

---

## 🗂️ Project Structure Overview

### Directory Layout

```
wildlife-intelligence/
├── backend/                    # FastAPI application
│   ├── main.py                # Application entry point
│   ├── database.py            # Database configuration
│   ├── models.py              # SQLAlchemy ORM models
│   ├── config.py              # Application settings
│   ├── security.py            # JWT & authentication
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Container configuration
│   ├── routers/               # API route handlers
│   │   ├── auth.py           # User authentication
│   │   ├── users.py          # User management
│   │   ├── surveys.py        # Survey operations
│   │   └── ... (other routers)
│   ├── schemas/              # Pydantic validation models
│   ├── services/             # Business logic layer
│   └── tests/                # Unit tests
│
├── frontend/                  # React application
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Build configuration
│   ├── index.html            # HTML template
│   └── src/
│       ├── main.jsx          # React app entry
│       ├── App.jsx           # Root component
│       ├── components/       # Reusable components
│       ├── pages/            # Page components
│       ├── services/         # API clients
│       └── styles/           # CSS/Tailwind
│
├── .env.example              # Environment template
├── docker-compose.yml        # Container orchestration
├── README.md                 # Project overview
├── INSTALLATION_GUIDE.md     # Setup instructions
└── CODE_GUIDE.md            # This file
```

---

## 🚀 Phase-by-Phase Code Breakdown

### Phase 1: Foundation (Weeks 1-2) ✅

**What It Does:**
- Sets up database with PostgreSQL
- Implements user authentication with JWT
- Creates CRUD operations for basic entities
- Provides role-based access control

**Key Files:**
- `backend/models.py` - Database schema
- `backend/security.py` - JWT token management
- `backend/routers/auth.py` - Login/Register endpoints
- `backend/database.py` - DB connection

**How It Works:**

```python
# 1. User registration
POST /api/v1/auth/register
{
  "name": "John Researcher",
  "email": "john@wildlife.local",
  "password": "SecurePass123",
  "role": "wildlife_researcher"
}

# 2. Backend processes:
# - Validates input using Pydantic
# - Hashes password with bcrypt
# - Creates user in database
# - Generates JWT token
# - Returns token + user info

# 3. Frontend stores token
# - Saved in localStorage
# - Sent in Authorization header
# - Automatically refreshed

# 4. Protected routes check token
# - Extract user_id from token
# - Verify user is active
# - Check role permissions
```

**Code Example:**

```python
# In routers/auth.py
@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Validate user doesn't exist
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed = SecurityService.hash_password(user_data.password)
    
    # Create user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    
    # Generate token
    token = SecurityService.create_access_token(new_user.id, new_user.email)
    return TokenResponse(..., user=new_user)
```

### Phase 2: AI Analysis (Weeks 3-4) 🔄

**What It Does:**
- Accepts image/audio uploads
- Processes with ML models (YOLO v8, BirdNET)
- Returns species identification
- Stores analysis results

**Key Files:**
- `backend/routers/image_analysis.py` - Image processing
- `backend/routers/audio_analysis.py` - Audio processing  
- `backend/models.py` - ImageAnalysis & AudioAnalysis models
- `backend/ml/` - Model wrappers (to be implemented)

**How to Implement:**

```python
# backend/services/ml_service.py (NEW FILE)
import cv2
import numpy as np
from ultralytics import YOLO

class MLService:
    def __init__(self):
        self.yolo_model = YOLO("yolov8n.pt")  # Load model
    
    def analyze_image(self, image_path):
        # Read image
        img = cv2.imread(image_path)
        
        # Run YOLO detection
        results = self.yolo_model(img)
        
        # Process results
        detections = results[0].boxes
        
        species = []
        for box in detections:
            species.append({
                "name": results[0].names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            })
        
        return species

# In routers/image_analysis.py
@router.post("/analyze")
async def analyze_image(
    observation_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save file
    content = await file.read()
    temp_path = f"/uploads/temp_{observation_id}.jpg"
    with open(temp_path, "wb") as f:
        f.write(content)
    
    # Analyze with ML
    ml_service = MLService()
    species_list = ml_service.analyze_image(temp_path)
    
    # Store in database
    analysis = ImageAnalysis(
        observation_id=observation_id,
        detected_species=species_list[0]["name"] if species_list else "Unknown",
        confidence=species_list[0]["confidence"] if species_list else 0.0,
        animal_count=len(species_list)
    )
    db.add(analysis)
    db.commit()
    
    return analysis
```

### Phase 3: Intelligence (Weeks 5-6) 🔄

**What It Does:**
- Calculates population metrics
- Computes biodiversity indices
- Assesses habitat health
- Recommends conservation actions

**Key Files:**
- `backend/routers/population.py`
- `backend/routers/biodiversity.py`
- `backend/routers/habitat.py`
- `backend/services/analytics_service.py` (to be created)

**How to Implement:**

```python
# backend/services/analytics_service.py (NEW FILE)
from sqlalchemy.orm import Session
from models import Observation, PopulationAnalytics, BiodiversityAnalytics
from datetime import datetime, timedelta
import numpy as np

class AnalyticsService:
    @staticmethod
    def calculate_population(species_id, site_id, db: Session, days=30):
        """Calculate population metrics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get observations
        obs = db.query(Observation).filter(
            Observation.species_id == species_id,
            Observation.monitoring_site_id == site_id,
            Observation.observation_date >= cutoff_date
        ).all()
        
        # Calculate metrics
        observation_count = len(obs)
        counts = [o.count for o in obs]
        avg_count = np.mean(counts) if counts else 0
        
        # Determine trend
        if observation_count > 0:
            trend = "stable"  # Simplified
        
        return PopulationAnalytics(
            species_id=species_id,
            monitoring_site_id=site_id,
            observation_count=observation_count,
            population_estimate=int(avg_count),
            trend=trend
        )
    
    @staticmethod
    def calculate_biodiversity(site_id, db: Session):
        """Calculate biodiversity metrics"""
        # Get all species at site
        observations = db.query(Observation).filter(
            Observation.monitoring_site_id == site_id
        ).all()
        
        # Calculate Shannon diversity
        species_counts = {}
        for obs in observations:
            species_counts[obs.species_id] = species_counts.get(obs.species_id, 0) + obs.count
        
        total = sum(species_counts.values())
        shannon = -sum((count/total) * np.log(count/total) for count in species_counts.values())
        
        return BiodiversityAnalytics(
            monitoring_site_id=site_id,
            species_richness=len(species_counts),
            shannon_diversity=shannon,
            total_observations=len(observations)
        )
```

### Phase 4: Deployment (Weeks 7-8) 🔄

**What It Does:**
- Creates GIS/map visualizations
- Generates PDF/Excel reports
- Runs test suite
- Packages for Docker deployment

**Key Files:**
- `backend/routers/gis.py`
- `backend/routers/reports.py`
- `docker-compose.yml`
- `backend/tests/` (to be created)

**How to Implement GIS:**

```python
# backend/routers/gis.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import geopandas as gpd
from shapely.geometry import Point

router = APIRouter()

@router.get("/species-distribution/{species_id}")
async def get_species_distribution(species_id: int, db: Session = Depends(get_db)):
    """Get GeoJSON of species locations"""
    
    # Get observations
    observations = db.query(Observation).filter(
        Observation.species_id == species_id
    ).all()
    
    # Create GeoJSON
    features = []
    for obs in observations:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [obs.longitude, obs.latitude]
            },
            "properties": {
                "observation_id": obs.id,
                "count": obs.count,
                "date": obs.observation_date.isoformat()
            }
        })
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return JSONResponse(geojson)
```

---

## 🛠️ How to Extend the Code

### Adding a New Feature

Let's add a "bird watching" specific feature:

#### Step 1: Create Database Model

```python
# Add to backend/models.py

class BirdObservation(Base):
    __tablename__ = "bird_observations"
    
    id = Column(Integer, primary_key=True)
    observation_id = Column(Integer, ForeignKey("observations.id"))
    bird_species = Column(String(255))
    call_heard = Column(Boolean, default=False)
    nesting_evidence = Column(Boolean, default=False)
    migration_status = Column(String(50))  # resident, migratory, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### Step 2: Create Pydantic Schema

```python
# Create backend/schemas/bird.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BirdCreate(BaseModel):
    observation_id: int
    bird_species: str
    call_heard: bool = False
    nesting_evidence: bool = False
    migration_status: Optional[str] = None

class BirdResponse(BaseModel):
    id: int
    observation_id: int
    bird_species: str
    call_heard: bool
    nesting_evidence: bool
    migration_status: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### Step 3: Create Router

```python
# Create backend/routers/bird_observations.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import BirdObservation, User
from security import get_current_active_user
from schemas.bird import BirdCreate, BirdResponse

router = APIRouter()

@router.post("/", response_model=BirdResponse, status_code=201)
async def create_bird_observation(
    data: BirdCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create bird observation"""
    db_bird = BirdObservation(**data.dict())
    db.add(db_bird)
    db.commit()
    db.refresh(db_bird)
    return BirdResponse.from_orm(db_bird)

@router.get("/species/{species}", response_model=list[BirdResponse])
async def get_bird_species(
    species: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all observations of a bird species"""
    birds = db.query(BirdObservation).filter(
        BirdObservation.bird_species == species
    ).all()
    return [BirdResponse.from_orm(b) for b in birds]
```

#### Step 4: Register Router

```python
# In backend/main.py

from routers import bird_observations

app.include_router(
    bird_observations.router,
    prefix="/api/v1/bird-observations",
    tags=["Bird Observations"]
)
```

#### Step 5: Test with curl

```bash
# Create observation
curl -X POST "http://localhost:8000/api/v1/bird-observations/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "observation_id": 1,
    "bird_species": "Indian Peafowl",
    "call_heard": true,
    "migration_status": "resident"
  }'

# Get species
curl -X GET "http://localhost:8000/api/v1/bird-observations/species/Indian%20Peafowl" \
  -H "Authorization: Bearer <token>"
```

---

## 💡 Key Concepts

### 1. FastAPI Request/Response Cycle

```
Request → Router → Database Query → Response
  ↓
Validation (Pydantic)
  ↓
Authentication (Security)
  ↓
Authorization (Roles)
  ↓
Business Logic (Service)
  ↓
Database Operation
  ↓
Response Serialization
  ↓
Client
```

### 2. SQLAlchemy ORM

```python
# Creating records
user = User(name="John", email="john@example.com")
db.add(user)
db.commit()

# Reading records
user = db.query(User).filter(User.id == 1).first()

# Updating records
user.name = "Jane"
db.commit()

# Deleting records
db.delete(user)
db.commit()

# Relationships
user.surveys  # Access related surveys
survey.created_by  # Access relationship
```

### 3. Pydantic Validation

```python
# Automatic validation
class UserCreate(BaseModel):
    email: EmailStr  # Validates email
    password: str = Field(..., min_length=8)  # Min 8 chars
    age: int = Field(..., ge=0, le=150)  # Between 0-150

# Try to create with invalid data
user = UserCreate(email="invalid", password="short", age=200)
# Raises: ValidationError
```

### 4. JWT Authentication Flow

```
1. User logs in
   POST /login with email/password
   ↓
2. Server validates credentials
   Password check, user exists
   ↓
3. Server creates JWT token
   Payload: {user_id, email, exp, ...}
   Signature: HMAC(payload, secret_key)
   ↓
4. Return token to client
   Client stores in localStorage
   ↓
5. Client sends token with requests
   Authorization: Bearer <token>
   ↓
6. Server validates token
   Check signature, expiration, user status
   ↓
7. Request proceeds if valid
```

### 5. Relationship Types

```python
# One-to-Many
class User(Base):
    surveys = relationship("Survey", back_populates="created_by")

class Survey(Base):
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_by = relationship("User", back_populates="surveys")

# Many-to-Many (requires association table)
association_table = Table(
    'species_habitat',
    Base.metadata,
    Column('species_id', Integer, ForeignKey('species.id')),
    Column('habitat_id', Integer, ForeignKey('habitats.id'))
)

class Species(Base):
    habitats = relationship("Habitat", secondary=association_table)
```

---

## 🐛 Debugging Tips

### 1. Enable SQL Logging

```python
# In database.py
engine = create_engine(DATABASE_URL, echo=True)  # Logs all SQL queries
```

### 2. Inspect Database State

```powershell
# Connect to PostgreSQL
psql -U wildlife_user -d wildlife_db

# List tables
\dt

# Query data
SELECT * FROM users;
SELECT * FROM observations LIMIT 10;

# Exit
\q
```

### 3. Debug API Requests

```python
# Add logging to routers
import logging
logger = logging.getLogger(__name__)

@router.post("/")
async def create_item(data: ItemCreate):
    logger.debug(f"Request data: {data}")
    logger.info(f"Creating item: {data.name}")
    # ...
    logger.error(f"Error occurred: {str(e)}")
```

### 4. Test API with Postman

1. Download Postman
2. Create request: `POST http://localhost:8000/api/v1/auth/login`
3. Set headers: `Content-Type: application/json`
4. Set body:
```json
{
  "email": "admin@wildlife.local",
  "password": "Admin123!"
}
```
5. Send and see response

### 5. Frontend Console Debugging

```javascript
// In browser console
console.log("API Response:", response);
console.error("Error:", error);

// Network tab
// Check Status, Headers, Response, Timing
```

---

## 📋 Common Tasks

### Task 1: Add a New User Role

```python
# 1. Update enum in models.py
class UserRole(str, enum.Enum):
    WILDLIFE_RESEARCHER = "wildlife_researcher"
    CONSERVATION_OFFICER = "conservation_officer"
    FOREST_DEPARTMENT_OFFICER = "forest_department_officer"
    ADMINISTRATOR = "administrator"
    NEW_ROLE = "new_role"  # Add here

# 2. Update schema in schemas/auth.py
# (already uses enum, auto-updates)

# 3. Create permission function in security.py
def require_new_role(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.NEW_ROLE:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user

# 4. Use in router
@router.get("/admin-only")
async def admin_endpoint(current_user: User = Depends(require_new_role)):
    return {"message": "New role access"}
```

### Task 2: Add Email Notification

```python
# 1. Create notification service
# backend/services/email_service.py
import smtplib
from email.mime.text import MIMEText

class EmailService:
    @staticmethod
    def send_email(to: str, subject: str, body: str):
        try:
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = settings.SMTP_USERNAME
            msg['To'] = to
            
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Email send error: {str(e)}")
            return False

# 2. Use in router
from services.email_service import EmailService

@router.post("/register")
async def register(user_data: UserRegister):
    # ... create user ...
    
    # Send welcome email
    EmailService.send_email(
        to=user_data.email,
        subject="Welcome to Wildlife Intelligence",
        body=f"Hello {user_data.name}, welcome to our platform!"
    )
    
    return token
```

### Task 3: Create Database Migration

```python
# 1. Create migration with Alembic (if using)
alembic revision --autogenerate -m "Add bird_observations table"

# 2. Review generated file in alembic/versions/

# 3. Apply migration
alembic upgrade head

# Or for simple SQLite:
# Tables auto-create when models exist
```

### Task 4: Write Unit Test

```python
# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPass123",
            "role": "wildlife_researcher"
        }
    )
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "test@example.com"

def test_login():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@wildlife.local",
            "password": "Admin123!"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

# Run tests
pytest
```

---

## 📚 Learning Resources

### FastAPI
- Docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

### React
- Docs: https://react.dev/
- Examples: https://react.dev/learn

### SQLAlchemy
- Docs: https://docs.sqlalchemy.org/
- ORM Tutorial: https://docs.sqlalchemy.org/en/20/orm/

### Machine Learning
- YOLO: https://docs.ultralytics.com/
- BirdNET: https://github.com/kahst/BirdNET-Analyzer
- TensorFlow: https://www.tensorflow.org/

---

## 🎯 Next Steps

1. **Run the application** following INSTALLATION_GUIDE.md
2. **Explore the code** in VS Code
3. **Test the API** with Swagger docs
4. **Add a new feature** using the patterns shown above
5. **Run tests** to ensure nothing breaks
6. **Deploy** with Docker when ready

---

## 📞 Getting Help

When stuck:
1. Check API docs: http://localhost:8000/docs
2. Read error messages carefully
3. Search code for similar patterns
4. Check database state
5. Enable logging
6. Test with Postman

---

**Happy coding! 🦁**

*This guide is your companion throughout the project development.*
