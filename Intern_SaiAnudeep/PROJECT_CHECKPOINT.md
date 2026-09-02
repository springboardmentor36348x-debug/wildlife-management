# Wildlife AI System — Project Checkpoint

## Project

Infosys Springboard — Wildlife AI System

This file is the source of truth for continuing development in a new ChatGPT conversation.

---

# 1. Current System Status

## Infrastructure

- Docker Compose: WORKING
- Backend: FastAPI + Python
- Frontend: React/Vite
- Database: PostgreSQL/PostGIS
- Backend container: WORKING
- Frontend container: WORKING
- Database container: WORKING

Verified services:

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

---

# 2. AI Image Detection

## Current final image model

Path:

backend/runs/classify/train/weights/best.pt

Training configuration:

- Model: YOLOv8n Classification
- Dataset: backend/training_data
- Training images: 1261
- Validation images: 223
- Classes:
  - buffalo
  - elephant
  - gazelle_thomsons
  - giraffe
  - hartebeest
  - impala
  - wildebeest
  - zebra
- Epochs: 15
- Image size: 224
- Batch size: 16
- Pretrained: true

## V1 result

Top-1 accuracy: 95.52%
Top-5 accuracy: 95.71%

V1 is currently the FINAL image model.

DO NOT replace V1 with V2 unless a later experiment clearly performs better.

---

# 3. Image V2 Experiment

Directory:

backend/runs/classify/train_v2

V2 was started with the larger image training experiment.

It was intentionally stopped after 5 epochs because CPU training was extremely slow.

Results after epoch 5:

- Top-1: 67.71%
- Top-5: 94.17%
- Validation loss: 1.03896

Files preserved:

- train_v2/weights/best.pt
- train_v2/weights/last.pt
- train_v2/results.csv
- train_v2/args.yaml

V2 is NOT the final model.

Keep the experiment for documentation.

---

# 4. Audio AI

## BirdNET

BirdNET integration is WORKING.

File:

backend/app/ml/audio_detection.py

The implementation:

- accepts audio files
- analyzes short recordings directly
- splits long recordings into 60-second segments
- analyzes each segment with BirdNET
- converts timestamps back to original audio timeline

Current threshold:

min_conf = 0.3

---

# 5. Audio Dataset

Dataset archive:

Downloads/soundscape_data.zip

Approximate archive size:

3.1 GB

Required species:

- Common Bulbul
- White-browed Sparrow-Weaver
- Gray-backed Camaroptera

eBird codes:

- combul2
- wbswea1
- gnbcam2

Three recordings were extracted for testing:

- KEN_023_20220119_035324.flac
- KEN_030_20220203_030448.flac
- KEN_031_20220204_040326.flac

Each recording is approximately 3600 seconds.

---

# 6. Custom Audio Model

Training script:

backend/app/ml/train_audio_model.py

Model:

RandomForestClassifier

Features:

- MFCC
- 20 coefficients
- mean
- standard deviation
- 3-second audio windows

Classes:

- Common Bulbul
- Gray-backed Camaroptera
- White-browed Sparrow-Weaver

Initial training:

474 samples

Accuracy:

85.26%

Model:

backend/audio_dataset/processed/wildlife_audio_classifier.joblib

Verified:

Model loads successfully as RandomForestClassifier.

---

# 7. Audio V2

Training script:

backend/app/ml/train_audio_model_v2.py

Training samples:

1470

Test samples:

74

Class distribution:

Common Bulbul: 970
Gray-backed Camaroptera: 210
White-browed Sparrow-Weaver: 290

V2 accuracy:

83.78%

Classification:

Common Bulbul:
precision 0.88
recall 0.92
f1 0.90

Gray-backed Camaroptera:
precision 0.57
recall 0.36
f1 0.44

White-browed Sparrow-Weaver:
precision 0.81
recall 0.93
f1 0.87

Model:

backend/audio_dataset/processed/wildlife_audio_classifier_v2.joblib

Do not assume V2 is better than the original custom audio model.

---

# 8. Audio Frontend Integration

BirdNET is already connected to:

POST /audio/upload/{survey_id}

Example successful test:

African Black-headed Oriole
confidence: 0.6326

Townsend's Solitaire
confidence: 0.4684

Observations were successfully created in the database.

The custom Random Forest classifier exists but is NOT yet fully integrated into the frontend upload workflow.

This remains a future task.

---

# 9. Backend Audio Files

backend/app/api/audio.py

backend/app/ml/audio_detection.py

backend/app/ml/custom_audio_classifier.py

backend/app/ml/train_audio_model.py

backend/app/ml/train_audio_model_v2.py

---

# 10. Frontend

Frontend source:

frontend/src

Important files:

frontend/src/App.jsx
frontend/src/api.js
frontend/src/pages/Surveys.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/pages/Detection.jsx
frontend/src/pages/Analytics.jsx
frontend/src/pages/LiveDetection.jsx

Current survey page already contains:

- survey listing
- search
- summary cards
- survey cards
- survey detail modal
- Create New Survey action

---

# 11. Survey API

frontend/src/api.js currently supports:

GET /surveys/
POST /surveys/

It does NOT currently contain a deleteSurvey() function.

Need to verify backend/app/api/surveys.py before implementing deletion.

---

# 12. Immediate Frontend Requirements

These were specifically identified as remaining work:

## Create Survey

Create a professional UI containing:

- Survey name/title
- Location
- Date
- Habitat
- Latitude
- Longitude
- Validation
- Loading state
- Success message
- Error handling
- Cancel/reset functionality

## Delete Survey

Required:

- Delete button
- Confirmation dialog
- DELETE backend API
- Remove survey from UI after successful deletion
- Proper error handling

IMPORTANT:

Before implementing deletion, inspect:

backend/app/api/surveys.py

and

backend/app/models/survey.py

Determine what happens to related observations when a survey is deleted.

---

# 13. Milestone 3 Requirements

Required Milestone 3 functionality:

## Population Intelligence Engine

- Estimate wildlife populations
- Analyze population trends
- Analyze population density
- Study migration patterns
- Species distribution

## Habitat Intelligence

- Classify habitats
- Detect habitat degradation
- Analyze vegetation
- Monitor environmental conditions
- Predict habitat suitability

## Conservation Recommendations

- Identify conservation priorities
- Suggest habitat restoration actions
- Suggest wildlife protection strategies
- Optimize monitoring and resource allocation

## Ecosystem Health Analytics

- Biodiversity score
- Habitat quality score
- Population stability score
- Overall ecosystem health score

## Wildlife Intelligence Dashboards

- Present population trends
- Show habitat information
- Display conservation insights
- Help researchers and officers make decisions

---

# 14. Milestone 3 Current Assessment

## Completed / demonstrated

- Wildlife population estimation
- Population trends
- Species distribution
- Biodiversity score
- Overall ecosystem health
- Basic conservation recommendation
- Wildlife intelligence analytics
- Working image AI detection
- Working audio AI detection

## Partially implemented / needs strengthening

- Habitat information
- Conservation priorities
- Habitat restoration recommendations
- Wildlife protection strategies
- Population stability score
- Habitat quality score
- Dashboard presentation

## Not yet properly implemented / verified

- Population density
- Migration pattern analysis
- Habitat degradation detection
- Vegetation analysis
- Environmental condition monitoring
- Habitat suitability prediction
- Monitoring/resource allocation optimization

Do NOT claim these as complete until they are actually implemented and tested.

---

# 15. Existing Analytics

Working endpoints include:

GET /analytics/biodiversity/{survey_id}

GET /analytics/population-trends/{survey_id}

The system has already produced an ecosystem health result for Survey 1:

Overall ecosystem health: 76.57
Status: Healthy

---

# 16. Known Issues

## Uvicorn WatchFiles

Previously encountered:

WatchfilesRustInternalError:
Cannot allocate memory

The backend recovered/restarted successfully.

Cause was resource pressure during development/training.

## CPU training

The machine currently does not have CUDA available to the Docker backend.

Long YOLO training experiments can therefore take many hours.

Do not start unnecessarily long training experiments.

---

# 17. Important Model Decision

FINAL IMAGE MODEL:

backend/runs/classify/train/weights/best.pt

Do not replace it with train_v2.

CUSTOM AUDIO MODEL:

backend/audio_dataset/processed/wildlife_audio_classifier.joblib

Keep both audio models until final evaluation.

---

# 18. Current Development Position

CURRENT TASK:

Frontend Survey Management

Next sequence:

1. Inspect backend/app/api/surveys.py
2. Inspect backend/app/models/survey.py
3. Verify whether DELETE /surveys/{id} exists
4. Add delete API if required
5. Add deleteSurvey() to frontend/src/api.js
6. Improve Surveys.jsx
7. Implement professional Create Survey UI
8. Implement Delete Survey
9. Test create
10. Test delete
11. Verify database consistency

After frontend:

12. Complete remaining Milestone 3 analytics
13. Complete dashboard presentation
14. End-to-end testing
15. Fix UI/UX issues
16. Prepare screenshots
17. Prepare final technical documentation
18. Prepare final presentation/PPT

---

# 19. Critical Rule

Do not randomly rewrite working components.

Before changing any feature:

1. Inspect the existing implementation.
2. Understand the API/database relationship.
3. Make the smallest necessary change.
4. Test the change.
5. Preserve existing working functionality.

---

# 20. Checkpoint Date

Checkpoint created:

2026-08-18

This document should be updated whenever a major milestone or architectural decision is completed.
