# 🐘 Wildlife Population Intelligence System

## AI-Assisted Wildlife Monitoring, Detection & Population Analytics Platform

A full-stack wildlife monitoring and intelligence platform developed as part of the **Infosys Springboard Internship Project**.

The system combines **wildlife survey management, AI-based image detection, wildlife audio analysis, biodiversity analytics, population observation analysis, authentication, and geospatial survey information** into a unified web application.

---

# 📌 1. Project Overview

Wildlife monitoring requires the collection and analysis of information about animal species, their locations, observations, and population changes over time.

Traditional wildlife monitoring can involve significant manual effort when processing field observations, camera-trap images, and animal sounds.

The **Wildlife Population Intelligence System** provides a centralized digital platform that helps users manage wildlife surveys and observations while using AI-assisted detection and analytics to derive useful information from collected data.

### The system provides:

- 🔐 User authentication and role-based access
- 📝 Wildlife survey creation and management
- 📷 AI-assisted wildlife image detection
- 🎵 Wildlife audio detection
- 🐾 Wildlife observation management
- 📊 Dashboard monitoring
- 🧬 Biodiversity analysis
- 📈 Population observation and historical trend analysis
- 🗺️ Geographic survey information
- 🗄️ PostgreSQL + PostGIS data storage
- 🐳 Docker-based application architecture

---

# 🎯 2. Problem Statement

Wildlife researchers and monitoring teams collect large amounts of information from surveys, observations, camera traps, and acoustic recordings.

Managing this information manually can make it difficult to:

- Organize wildlife observations
- Identify species efficiently
- Maintain historical survey information
- Analyze biodiversity
- Compare population observations
- Associate observations with geographical locations
- Obtain useful insights from collected monitoring data

The proposed system addresses these challenges by combining **web-based wildlife monitoring with AI-assisted detection and analytical capabilities**.

---

# 💡 3. Proposed Solution

The system provides an integrated workflow:

```text
                    Wildlife Monitoring
                           │
                           ▼
                    Create Survey
                           │
                           ▼
                 Collect Observations
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
               Image Input    Audio Input
                    │             │
                    ▼             ▼
                AI Detection / Classification
                    │             │
                    └──────┬──────┘
                           ▼
                    Detection Result
                           │
                           ▼
                      Observation
                           │
                           ▼
                     Database
                           │
                           ▼
                     Analytics
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              Biodiversity   Population Trends
                 Analysis        Analysis

```
# 🏗️ 4. System Architecture

The application follows a modular three-tier architecture.

```text

┌──────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                                                              │
│              Admin / Researcher / Normal User               │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ HTTP / REST
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                       FRONTEND                               │
│                    React + Vite                              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐ │
│  │Dashboard │  │ Surveys  │  │ Detection │  │ Analytics  │ │
│  └──────────┘  └──────────┘  └───────────┘  └────────────┘ │
│                                                              │
│              Authentication & Navigation                     │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ REST API
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                       FastAPI                                │
│                                                              │
│  ┌────────────────┐     ┌────────────────────────────────┐  │
│  │ Authentication │     │ Survey & Observation Management │  │
│  └────────────────┘     └────────────────────────────────┘  │
│                                                              │
│  ┌────────────────┐     ┌────────────────────────────────┐  │
│  │ Image Detection│     │ Audio Detection                │  │
│  └────────────────┘     └────────────────────────────────┘  │
│                                                              │
│  ┌────────────────┐     ┌────────────────────────────────┐  │
│  │ Biodiversity   │     │ Population Trend Analysis      │  │
│  │ Analytics      │     │                                │  │
│  └────────────────┘     └────────────────────────────────┘  │
└───────────────┬─────────────────────────┬────────────────────┘
                │                         │
                │ Database                │ AI/ML Inference
                ▼                         ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│   PostgreSQL + PostGIS   │    │       AI / ML Layer         │
│                          │    │                             │
│ • Users                  │    │ • YOLOv8 Wildlife Model    │
│ • Surveys                │    │ • Custom Audio Classifier  │
│ • Observations           │    │ • BirdNET                  │
│ • Spatial Information    │    │                             │
└──────────────────────────┘    └─────────────────────────────┘

                    Docker Compose

```
# 🔄 5. End-to-End Application Workflow
```text

User
 │
 ▼
Login / Authentication
 │
 ▼
Dashboard
 │
 ├──────────────► Survey Management
 │                     │
 │                     ▼
 │               Create Survey
 │                     │
 │                     ▼
 │              Monitoring Data
 │
 └──────────────► Wildlife Detection
                       │
                 ┌─────┴─────┐
                 │           │
                 ▼           ▼
              Image        Audio
                 │           │
                 ▼           ▼
            YOLOv8       Audio Pipeline
                 │           │
                 └─────┬─────┘
                       ▼
                Detection Result
                       │
                       ▼
                  Observation
                       │
                       ▼
                   Database
                       │
                       ▼
                   Analytics
                  ┌────┴────┐
                  │         │
                  ▼         ▼
            Biodiversity  Population
              Analysis      Trends
```
# 🧩 6. Major System Modules
6.1 Authentication & User Management

The application provides authentication and role-based access.

The system supports different user roles, including:

Admin / Researcher
Normal User

The access level determines which wildlife monitoring and management capabilities are available to the user.

6.2 Survey Management

The Survey module provides functionality for creating and managing wildlife monitoring surveys.

Survey information includes:
Monitoring location
Latitude
Longitude
Habitat type
Protected area
Survey date

Surveys provide the context for wildlife observations and AI-generated detection records.

#Relationship
```text
Survey
   │
   ├── Location
   ├── Date
   ├── Habitat
   ├── Protected Area
   │
   └──► Wildlife Observations
             │
             ├── Species
             ├── Count
             ├── Confidence
             └── Detection Information
```
📷 6.3 AI Wildlife Image Detection

The application integrates a trained wildlife classification model for AI-assisted wildlife identification from images.

#Detection workflow
```text
Wildlife Image
      │
      ▼
Image Upload
      │
      ▼
Image Processing
      │
      ▼
YOLOv8 Wildlife Model
      │
      ▼
Species Prediction
      │
      ▼
Confidence Score
      │
      ▼
Detection Result
      │
      ▼
Observation
      │
      ▼
Associated Survey
```
# 🧠 Production Image Model

The active production model is:

backend/app/ml/wildlife_best.pt
Model
YOLOv8 Nano Classification
Supported Classes

The current production model supports eight wildlife classes:

#	Species
1	Buffalo
2	Elephant
3	Thomson's Gazelle
4	Giraffe
5	Hartebeest
6	Impala
7	Wildebeest
8	Zebra
Model Validation Performance

The original wildlife validation dataset produced approximately:

Metric	Result
Top-1 Accuracy	95.52%
Top-5 Accuracy	95.75%

The existing production model was retained because it provided stronger performance on the application's original wildlife classes than the experimental expanded model.

🎵 6.4 Wildlife Audio Detection

The system includes an audio detection pipeline for wildlife sound analysis.

The audio functionality uses:

Custom animal audio classification
BirdNET as supplementary detection
#Audio workflow
```text
Wildlife Audio
      │
      ▼
Audio Processing
      │
      ├───────────────┐
      ▼               ▼
Custom Audio      BirdNET
Classifier        Detection
      │               │
      └───────┬───────┘
              ▼
       Detection Results
              │
              ▼
         Observation

The audio detection pipeline provides an additional input channel for wildlife monitoring beyond image-based detection.
```
📊 6.5 Dashboard

The Dashboard provides a high-level overview of wildlife monitoring activity.

Example dashboard metrics
Total Surveys
Total Observations
Species Detected
Average Detection Confidence
Wildlife monitoring statistics

The dashboard allows users to quickly understand the current state of the monitoring system.

🧬 6.6 Biodiversity Analytics

The Analytics module provides biodiversity-related analysis based on recorded observations.

Implemented analytics
Shannon Diversity Index

The system calculates the Shannon diversity index based on recorded species observations.

Species Distribution

The system aggregates observations by species to provide an overview of species distribution.

Population Aggregation

Population observations are aggregated from the recorded observation counts.

Ecosystem Indicators

The application includes baseline ecosystem-related indicators within the analytics interface.

These indicators provide a foundation for future integration with actual environmental and ecological datasets.

📈 6.7 Population Trend Analysis

The system provides historical comparison of wildlife observations.

Surveys from the same monitoring location can be compared using their survey dates.
```text

Previous Survey
      │
      ▼
Historical Observations
      │
      │
      │ Comparison
      ▼
Current Survey
      │
      ▼
Population Observation Trend
```
The system handles cases where sufficient historical information is unavailable and indicates that additional historical data is required.

Important Note

The current population value is derived from recorded observation counts.

It is not a scientific population-density estimate.

Advanced statistical population estimation is planned as a future enhancement.

🗺️ 6.8 Geospatial Information

The application uses PostgreSQL with PostGIS to support geographical wildlife monitoring information.

Survey records can contain:

Monitoring location
Latitude
Longitude
Habitat type
Protected area

This provides a foundation for future spatial intelligence features such as:

Wildlife distribution mapping
Spatial clustering
Habitat analysis
Migration analysis
Geographic population analysis
# 🛠️ 7. Technology Stack

Frontend Technologies
```
| Technology       | Purpose                             |
| ---------------- | ----------------------------------- |
| **React.js**     | User interface                      |
| **Vite**         | Frontend development and build tool |
| **JavaScript**   | Application logic                   |
| **HTML5**        | Application structure               |
| **CSS**          | Styling                             |
| **Axios**        | REST API communication              |
| **React Router** | Client-side routing                 |
| **Lucide React** | UI icons                            |
```
Backend Technologies
```
| Technology     | Purpose              |
| -------------- | -------------------- |
| **Python**     | Backend programming  |
| **FastAPI**    | REST API framework   |
| **Uvicorn**    | ASGI server          |
| **Pydantic**   | Data validation      |
| **SQLAlchemy** | Database interaction |
```
Database Technologies
```
| Technology     | Purpose                 |
| -------------- | ----------------------- |
| **PostgreSQL** | Relational data storage |
| **PostGIS**    | Geospatial data support |
```
AI / ML Technologies
```
| Technology                  | Purpose                                |
| --------------------------- | -------------------------------------- |
| **YOLOv8**                  | Wildlife image classification          |
| **Ultralytics**             | YOLO model framework                   |
| **PyTorch**                 | Machine learning framework             |
| **BirdNET**                 | Supplementary wildlife audio detection |
| **Custom Audio Classifier** | Animal sound classification            |
```
Development & Infrastructure
```
| Technology         | Purpose                     |
| ------------------ | --------------------------- |
| **Docker**         | Containerization            |
| **Docker Compose** | Multi-service orchestration |
| **Git**            | Version control             |
| **GitHub**         | Source-code management      |
| **VS Code**        | Development environment     |
```
# 📁 8. Project Structure
```text
Intern_SaiAnudeep/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── API route modules
│   │   │
│   │   ├── models/
│   │   │   └── Application / database models
│   │   │
│   │   ├── services/
│   │   │   └── Business logic and processing services
│   │   │
│   │   ├── ml/
│   │   │   └── wildlife_best.pt
│   │   │
│   │   └── ...
│   │
│   ├── audio_dataset/
│   │   └── labels/
│   │       ├── annotations.csv
│   │       └── species.csv
│   │
│   ├── yolov8n.pt
│   ├── yolov8n-cls.pt
│   └── ...
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── .gitignore
├── PROJECT_CHECKPOINT.md
├── PROJECT_LEARNING_NOTES.md
└── ...
```
# 🐳 9. Docker Architecture

The application is containerized using Docker Compose.
```text

                     Docker Compose
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     ┌──────────┐     ┌──────────┐    ┌─────────────┐
     │ Frontend │     │ Backend  │    │  Database   │
     │          │     │          │    │             │
     │ React    │     │ FastAPI  │    │ PostgreSQL  │
     │ Vite     │     │ Python   │    │ + PostGIS   │
     └──────────┘     └──────────┘    └─────────────┘
```
Services
Frontend
React + Vite

Provides the web-based user interface.

Backend
FastAPI + Python

Provides:

REST APIs
Authentication
Survey management
Observation management
Image detection
Audio detection
Analytics
Database
PostgreSQL + PostGIS

Stores application data, wildlife observations, surveys, and geographical information.

# 🔌 10. Local Application Endpoints

When the application is running locally through Docker Compose:

Frontend
http://localhost:5173
Backend
http://localhost:8000
Backend Health Check
http://localhost:8000/health
# 🗄️ 11. Data Architecture

The major data flow can be represented as:
```text
                 User Input
                     │
                     ▼
                  Survey
                     │
                     ▼
               Observations
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
     Image Detection       Audio Detection
          │                     │
          └──────────┬──────────┘
                     ▼
              Detection Data
                     │
                     ▼
               PostgreSQL
                     │
                     ▼
                 Analytics

The database provides persistent storage for application and wildlife monitoring information.

PostGIS extends the database with geospatial capabilities.
```
# 🏆 12. Project Milestones
🥇 Milestone 1 — Project Foundation
Completed Components
Initial full-stack project architecture
React + Vite frontend
FastAPI backend
PostgreSQL database
PostGIS integration
Docker Compose environment
Authentication
User management foundation
Role-based access foundation
Wildlife survey management
Survey and observation workflow
Initial dashboard
REST API structure
Milestone Result

A functional full-stack wildlife monitoring platform foundation was established.

The frontend, backend, database, and containerized development environment were integrated into a single application.

🥈 Milestone 2 — AI-Based Wildlife Detection
Completed Components
AI wildlife image classification
YOLOv8 integration
Custom wildlife model
Image upload and processing
Species prediction
Confidence score generation
Detection result processing
Survey association
Detection-to-observation workflow
Wildlife audio detection pipeline
Custom animal audio classifier
BirdNET supplementary detection
Production Image Model
backend/app/ml/wildlife_best.pt
Model Performance
Top-1 Accuracy : 95.52%
Top-5 Accuracy : 95.75%
Milestone Result

The system can perform AI-assisted wildlife identification from image and audio inputs and associate detection results with wildlife monitoring surveys.

🥉 Milestone 3 — Analytics & Wildlife Intelligence
Completed Components
Dashboard monitoring metrics
Species distribution analysis
Shannon diversity index
Population aggregation
Historical population comparison
Same-location survey comparison
Population trend analysis
Analytics interface
Ecosystem-related baseline indicators
Historical data availability handling
Intelligence Flow
```text
Wildlife Observations
          │
          ▼
    Species Analysis
          │
          ├──────────────► Biodiversity
          │
          ├──────────────► Population Aggregation
          │
          └──────────────► Historical Comparison
                                  │
                                  ▼
                           Population Trends
Current Limitation

The current implementation uses recorded observation counts for population aggregation.

The following advanced capabilities are not yet implemented as production features:

Scientific population-density estimation
Automated migration prediction
Advanced habitat-quality prediction
Continuous real-time camera monitoring
Large-scale environmental correlation

These capabilities remain part of the future enhancement roadmap.
```
# 🧪 13. Model Development & Evaluation

During development, the wildlife image model was evaluated using the original project dataset.

The production model was retained because it provided strong validation performance on the application's primary wildlife classes.

An experimental expanded dataset containing additional animal classes was also evaluated.

The expanded model learned additional classes but had lower overall validation performance than the existing production model.

Therefore, the experimental model was not integrated into the production application.
```text
Original Wildlife Model
          │
          ▼
       Evaluation
          │
          ▼
 Strong Validation Performance
          │
          ▼
     Production Model
```
The experimental training data and outputs are excluded from the final repository to keep the submission focused on the working application.

# 🔐 14. Repository & Data Management

The project is submitted to a shared GitHub repository.

To keep the project isolated from other contributors, the complete application is contained inside:

Intern_SaiAnudeep/

The repository also uses .gitignore rules to exclude development-only and large local artifacts such as:

Large training datasets
Experimental datasets
Temporary model-training outputs
Local uploaded files
Development backups
Raw audio datasets
Other local-only artifacts

The active production model required by the application is included in the submission.
# 📈 15. Scalability & Extensibility

The application has been designed with modular components so that additional functionality can be introduced without redesigning the entire system.

Potential extension points include:
```text
                   Wildlife Platform
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
    Image AI           Audio AI        Environmental Data
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
                     Data Layer
                          │
                          ▼
                      Analytics
                          │
                          ▼
                   Intelligence Layer
```
This architecture makes it possible to introduce additional AI models, datasets, sensors, and analytical modules in future versions.
# 16. Conclusion

The Wildlife Population Intelligence System provides an integrated platform for wildlife monitoring by combining digital survey management, AI-assisted wildlife detection, audio analysis, biodiversity analytics, and population observation analysis.

The completed workflow is:
```text
                Wildlife Survey
                      │
                      ▼
             Image / Audio Input
                      │
                      ▼
                AI Detection
                      │
                      ▼
                Observation
                      │
                      ▼
                Data Storage
                      │
                      ▼
                  Analytics
                      │
             ┌────────┴────────┐
             ▼                 ▼
       Biodiversity       Population Trends
          Analysis             Analysis
```
The current implementation establishes a functional foundation for intelligent wildlife monitoring while providing clear extension points for advanced capabilities such as real-time camera monitoring, population-density estimation, migration analysis, habitat intelligence, and environmental data integration.
# ⭐ Technology Summary
```text
Frontend
  ├── React.js
  ├── Vite
  ├── Axios
  ├── React Router
  └── Lucide React

Backend
  ├── Python
  ├── FastAPI
  ├── Uvicorn
  ├── Pydantic
  └── SQLAlchemy

Database
  ├── PostgreSQL
  └── PostGIS

AI / ML
  ├── YOLOv8
  ├── Ultralytics
  ├── PyTorch
  ├── Custom Audio Classifier
  └── BirdNET

Infrastructure
  ├── Docker
  ├── Docker Compose
  ├── Git
  └── GitHub
