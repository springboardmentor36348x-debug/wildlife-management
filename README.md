# 🐾 Wildlife Population Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/AI-Wildlife%20Intelligence-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Language-Python-yellow?style=for-the-badge" />
</p>

<p align="center">
  <b>AI-assisted wildlife monitoring, detection, analysis and reporting platform</b>
</p>

---

## 📌 Table of Contents

- [🌿 About the Project](#-about-the-project)
- [🎯 Objectives](#-objectives)
- [✨ Key Features](#-key-features)
- [🔄 Application Workflow](#-application-workflow)
- [🖥️ Application Screens](#️-application-screens)
- [📊 Analytics](#-analytics)
- [🔐 Authentication & Security](#-authentication--security)
- [🧠 AI & Data Processing](#-ai--data-processing)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Project Structure](#-project-structure)
- [📂 Datasets](#-datasets)
- [⚙️ Installation](#️-installation)
- [▶️ Running the Project](#️-running-the-project)
- [📡 API Modules](#-api-modules)
- [📈 Current Implementation](#-current-implementation)
- [🔮 Future Scope](#-future-scope)
- [🌍 Impact](#-impact)
- [👥 Contribution](#-contribution)
- [📄 License](#-license)

---

# 🌿 About the Project

The **Wildlife Population Intelligence System** is a full-stack web application designed to organize and analyze wildlife observations through a unified digital platform.

The system connects:

> **Wildlife Data → AI/Analysis → Database → History → Analytics → Reports**

The platform provides workflows for wildlife image detection, audio analysis, observation history and analytics while providing a foundation for future population, biodiversity, habitat and conservation intelligence.

The current implementation combines a **React frontend**, **FastAPI backend**, **PostgreSQL database**, AI-assisted image detection and audio signal analysis.

---

# 🎯 Objectives

| Objective | Description |
|-----------|-------------|
| 🐾 Wildlife Detection | Process wildlife images through an AI-based detection workflow |
| 🎵 Audio Analysis | Analyze uploaded wildlife audio recordings |
| 📊 Observation Analytics | Calculate total and animal-wise detection counts |
| 🗂️ Detection History | Preserve wildlife observations as structured records |
| 🔐 Secure Access | Provide registration, login and protected application access |
| 📈 Data Visualization | Present wildlife information through application dashboards |
| 📄 Reporting | Support review and reporting of wildlife observations |
| 🌱 Future Intelligence | Provide a foundation for population, habitat and conservation analysis |

---

# ✨ Key Features

### 🐾 1. Wildlife Image Detection

Upload wildlife images and process them through the configured AI inference workflow.

**Supported formats:**

- JPG
- JPEG
- PNG

The system processes the image and returns information such as:

- Predicted animal/class
- Confidence score
- Detection information
- Observation record

The current image workflow uses the configured Roboflow inference service and wildlife detection model.

---

### 🎵 2. Wildlife Audio Analysis

The system supports wildlife audio uploads.

**Supported formats:**

- WAV
- MP3

The backend processes the audio using:

- Librosa
- NumPy
- Signal-energy analysis

The current implementation determines whether animal sound/presence is detected based on the configured threshold.

> **Note:** The current implementation is audio-presence analysis rather than species-level audio classification.

---

### 📊 3. Wildlife Analytics

The analytics module works with stored detection records.

It provides:

- Total detection count
- Animal-wise detection counts
- Detection history
- Confidence information
- Detection timestamps

This allows stored observations to be converted into useful wildlife statistics.

---

### 🗃️ 4. Detection History

Previous wildlife observations can be maintained as structured records.

Example information includes:

| Information | Example |
|-------------|---------|
| Image/File | wildlife_image.jpg |
| Animal | Elephant |
| Confidence | 92% |
| Detection Time | Stored timestamp |
| Observation | Wildlife detection |

This creates a historical record that can later support more advanced analysis.

---

### 🔐 5. Authentication

The application provides a secure authentication workflow.

Features include:

- User registration
- Login
- Password hashing
- JWT authentication
- Protected application access

Authentication is handled through the backend security layer.

---

### 📄 6. Reporting

The application includes reporting-related workflows for reviewing wildlife observations and analytical information.

Reports can use information generated from:

- Detection records
- History
- Analytics
- Wildlife observations

---

# 🔄 Application Workflow

```mermaid
flowchart LR

A[👤 User] --> B[🔐 Login / Register]

B --> C[🏠 Dashboard]

C --> D[🐾 Wildlife Image]
C --> E[🎵 Wildlife Audio]
C --> F[📊 Analytics]
C --> G[🕘 Detection History]
C --> H[📄 Reports]

D --> I[🤖 AI Image Processing]
E --> J[🔊 Audio Signal Processing]

I --> K[🗄️ Store Detection]
J --> K

K --> L[📊 Analytics]
K --> M[🕘 History]

L --> N[📈 Insights]
M --> N

N --> H