# 🐾 Wildlife Population Intelligence System

## AI-Powered Wildlife Monitoring & Intelligence Platform

A full-stack web application that combines AI-based wildlife detection, audio analysis, population intelligence, analytics, detection history, authentication, and reporting into one platform.

---

## 🌿 Project Overview

The Wildlife Population Intelligence System provides a centralized platform for wildlife monitoring and analysis.

It allows users to upload wildlife images and audio, process observations, store detection records, analyze wildlife datasets, and view useful insights through an interactive web application.

**Core Flow:**

User → Web Application → AI/Data Processing → Database → Analytics → Insights → Reports

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🐾 Wildlife Detection | AI-assisted detection and classification of wildlife from images |
| 🎵 Audio Analysis | Processing and analysis of wildlife audio recordings |
| 📊 Population Intelligence | Analysis of wildlife observations and species information |
| 📈 Analytics | Detection counts, species statistics, and trends |
| 🕘 Detection History | Storage and review of previous wildlife observations |
| 🔐 Authentication | User registration, login, password security, and JWT authentication |
| 📄 Reports | Structured wildlife observation and analysis information |
| 🌿 Wildlife Data | Dataset-based species and population analysis |

---

## 🐾 Wildlife Detection

The system processes uploaded wildlife images through the configured AI detection workflow.

The detection process can provide:

- Animal/class prediction
- Confidence information
- Detection results
- Observation records

Supported image formats include:

- JPG
- JPEG
- PNG

---

## 🎵 Wildlife Audio Analysis

The system supports wildlife audio uploads and signal analysis.

Audio processing uses:

- Librosa
- NumPy
- Signal-energy analysis

Supported formats include:

- WAV
- MP3

The current implementation focuses on detecting animal-sound presence rather than complete species-level audio classification.

---

## 📊 Population Intelligence

The Population Intelligence module analyzes wildlife observation data and application detection records.

It provides information such as:

- Total wildlife observations
- Number of species
- Wildlife group distribution
- Top observed species
- Application detection counts
- Daily detection trends

---

## 🕘 Detection History

Wildlife detections are maintained as structured records.

A detection record can contain information such as:

- Animal
- Confidence
- Detection time
- Observation details

This allows previous observations to be reviewed and analyzed.

---

## 🔐 Authentication & Security

The application includes an authentication system with:

- User registration
- User login
- Password hashing
- JWT authentication
- Protected application access

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, JavaScript, Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Image AI | Roboflow |
| Audio Processing | Librosa, NumPy |
| Authentication | JWT, Passlib |
| Data | CSV Datasets |
| Version Control | Git, GitHub |

---

## 📁 Project Structure

```text
Wildlife-Population-Intelligence-System/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   ├── check_wildlife_dataset.py
│   └── prepare_population_dataset.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── datasets/
│   ├── wildlife_population_data.csv
│   ├── observations-770098.csv
│   ├── bird_songs_metadata.csv
│   ├── class.csv
│   └── zoo.csv
│
├── wavfiles/
├── weights/
├── README.md
└── .gitignore