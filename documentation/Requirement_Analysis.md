# Requirement Analysis
## Wildlife Population Intelligence System
---

## 1. Introduction

The Wildlife Population Intelligence System is a web-based project developed to help researchers and forest officers monitor wildlife using camera trap images and audio recordings. The main purpose of this system is to reduce manual work and organize wildlife data in a better way. The system will also help in analyzing animal populations and generating reports.

---

## 2. Problem Statement

In wildlife conservation, a large number of images are collected from camera traps placed in forests. Checking every image manually takes a lot of time and effort. It is also difficult to maintain all survey records in one place.

This project is developed to make wildlife monitoring easier by storing all information in one system and using Artificial Intelligence for animal detection.

---

## 3. Project Objectives

The main objectives of this project are:

- To manage wildlife survey information.
- To store monitoring site details.
- To upload wildlife images and audio.
- To identify animal species from images.
- To estimate wildlife population.
- To generate reports for researchers.
- To provide role-based access for different users.

---

## 4. Software Development Life Cycle (SDLC)

This project follows the Software Development Life Cycle (SDLC).

The phases include:

- Requirement Analysis
- System Design
- Development
- Testing
- Deployment
- Maintenance

Following SDLC helps in developing the project in an organized and systematic way.

---

## 5. Stakeholders

The people who will use this system are:

- Admin
- Researcher
- Forest Officer
- Conservation Officer

Each user has different responsibilities in the system.

---

## 6. Functional Requirements

Functional requirements describe what the system should do.

The system should provide the following features:

- User Registration
- User Login
- Survey Creation
- Monitoring Site Management
- Camera Trap Registration
- Wildlife Image Upload
- Wildlife Audio Upload
- Species Management
- Animal Detection
- Population Estimation
- Report Generation
- Dashboard
- User Management

---

## 7. Non-Functional Requirements

Non-functional requirements describe how the system should perform.

The system should have:

- Good Performance
- High Security
- Fast Response Time
- Easy User Interface
- Reliable Data Storage
- Scalability
- Maintainability

---

## 8. User Roles

### Admin

- Manage all users
- Manage reports
- Monitor overall system

### Researcher

- Create surveys
- Upload wildlife images
- View analysis reports

### Forest Officer

- Manage monitoring sites
- Record wildlife observations

### Conservation Officer

- View reports
- Study wildlife population
- Support conservation planning

---

## 9. User Stories

### Admin

As an Admin, I want to manage users so that only authorized users can access the system.

### Researcher

As a Researcher, I want to upload wildlife images so that I can analyze different animal species.

### Forest Officer

As a Forest Officer, I want to record wildlife observations so that survey data remains updated.

### Conservation Officer

As a Conservation Officer, I want to view wildlife reports so that I can support conservation activities.

---

## 10. Wildlife Monitoring Workflow

The basic workflow of the system is:

Login

↓

Create Survey

↓

Select Monitoring Site

↓

Register Camera Trap

↓

Capture Wildlife Images

↓

Upload Images and Audio

↓

Animal Detection using AI

↓

Population Estimation

↓

Generate Reports

↓

Dashboard

---

## 11. Dataset Information

For this project, the **Snapshot Serengeti Dataset** is being used.

The dataset contains:

- Wildlife images
- Image paths
- Camera trap information
- Animal species labels
- Capture date and time
- Monitoring site information

The dataset will be used for testing, analysis and AI model development.

---

## 12. Technology Stack

### Frontend

- React.js

### Backend

- FastAPI

### Database

- PostgreSQL

### AI Framework

- TensorFlow / PyTorch

### Development Tools

- VS Code
- pgAdmin
- Git
- GitHub
- Postman

---

## 13. Database Overview

Database Name:

**wildlife_db**

The database is created using PostgreSQL.

Currently, the following tables have been created:

- Users
- Surveys
- Species
- Camera_Traps
- Wildlife_Images
- Wildlife_Audio
- Detections
- Habitats
- Population_Estimates
- Reports

These tables will store all project-related information.

---

## 14. Expected Output

After completing the project, the system should be able to:

- Manage wildlife surveys
- Store wildlife data
- Upload camera trap images
- Detect animal species
- Estimate wildlife population
- Generate reports
- Display dashboard statistics

---

## 15. Future Scope

The project can be improved in future by adding:

- Live camera integration
- Mobile application
- GPS tracking
- Real-time animal detection
- AI-based prediction
- Cloud deployment

---

## 16. Current Progress (Day 1)

The following work has been completed:

- Project folder structure created.
- README file prepared.
- Requirement Analysis document completed.
- PostgreSQL installed successfully.
- pgAdmin configured.
- Wildlife database (**wildlife_db**) created.
- Initial database tables created.
- Snapshot Serengeti dataset downloaded.
- Dataset organized inside the project folder.