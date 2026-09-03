# Wildlife Population Intelligence System - Complete Installation Guide

**For Windows 10/11 with VS Code**

## 📋 Prerequisites

- **Windows 10/11**
- **VS Code** (https://code.visualstudio.com/)
- **Python 3.11+** (https://www.python.org/downloads/)
- **Node.js 18+** (https://nodejs.org/)
- **Git** (https://git-scm.com/)
- **PostgreSQL 16** (https://www.postgresql.org/download/windows/) - Optional (SQLite works for dev)
- **Docker Desktop** (https://www.docker.com/products/docker-desktop/) - Optional (for production)

## 🚀 Phase 1: Project Setup

### 1.1 Clone/Create Project

```powershell
# Open PowerShell in your development directory
cd C:\Users\YourUsername\Desktop

# Create project directory
mkdir wildlife-intelligence
cd wildlife-intelligence

# Initialize git
git init
git config user.name "Your Name"
git config user.email "your@email.com"
```

### 1.2 Create Directory Structure

```powershell
# Create folder structure
New-Item -ItemType Directory -Path backend, frontend, docs, models, uploads | Out-Null

# Create Python backend structure
New-Item -ItemType Directory -Path backend/routers, backend/schemas, backend/services | Out-Null
```

### 1.3 Create Environment Files

```powershell
# Copy .env.example to .env
Copy-Item .env.example .env

# Edit .env in VS Code
code .env
```

### 1.4 Setup Backend (Python)

#### Step 1: Create Virtual Environment

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Step 2: Install Backend Dependencies

```powershell
# Ensure venv is activated
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

#### Step 3: Test Backend

```powershell
# Run the application
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# Visit http://localhost:8000/docs in browser
```

Press `Ctrl+C` to stop the server.

### 1.5 Setup Frontend (React)

#### Step 1: Initialize Frontend

```powershell
# Open new PowerShell tab and navigate to frontend
cd frontend

# Initialize Node project
npm install

# Install dependencies (this will use package.json)
# Already done above, but can run again
npm install
```

#### Step 2: Create React App Structure

```powershell
# Create src directory structure
New-Item -ItemType Directory -Path src/components, src/pages, src/services, src/hooks, src/utils, src/styles | Out-Null

# Create main files
New-Item -ItemType File -Path src/main.jsx, src/App.jsx, src/App.css, src/index.css | Out-Null
```

#### Step 3: Create .env for Frontend

```powershell
# In frontend directory
@"
VITE_API_URL=http://localhost:8000
"@ | Set-Content -Path .env.local
```

#### Step 4: Start Frontend Development Server

```powershell
npm run dev

# You should see:
# VITE v5.0.8 ready in 123 ms
# ➜  Local:   http://localhost:5173/
```

Visit `http://localhost:5173` in browser.

## 🗄️ Phase 2: Database Setup

### 2.1 SQLite (Development - Easy)

SQLite is already built-in. Just ensure DATABASE_URL in .env is:
```
DATABASE_URL=sqlite:///wildlife.db
```

Tables are automatically created when backend starts.

### 2.2 PostgreSQL (Production Recommended)

#### Install PostgreSQL

1. Download from https://www.postgresql.org/download/windows/
2. Run installer
3. Set password: `wildlife_password`
4. Port: `5432`
5. Finish installation

#### Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL terminal:
# CREATE USER wildlife_user WITH PASSWORD 'wildlife_password';
# CREATE DATABASE wildlife_db OWNER wildlife_user;
# ALTER ROLE wildlife_user CREATEDB;
# \q
```

Update .env:
```
DATABASE_URL=postgresql://wildlife_user:wildlife_password@localhost:5432/wildlife_db
```

#### Verify Database Connection

```powershell
# From backend directory with venv activated
cd backend
.\venv\Scripts\Activate.ps1

python -c "from database import engine; engine.connect(); print('Database connected!')"
```

## 🧪 Phase 3: Testing & Verification

### 3.1 Test Backend API

#### Terminal 1: Run Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

#### Terminal 2: Test Endpoints

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Test API docs
start http://localhost:8000/docs
```

### 3.2 Test Frontend

#### Terminal 3: Run Frontend
```powershell
cd frontend
npm run dev
```

Visit `http://localhost:5173` in browser.

### 3.3 Create Initial Data (Optional)

```powershell
# Backend terminal
cd backend
.\venv\Scripts\Activate.ps1

# Run Python script
python -c "
from database import SessionLocal
from models import User, Species
from security import SecurityService

db = SessionLocal()

# Create admin user
user = User(
    name='Admin User',
    email='admin@wildlife.local',
    hashed_password=SecurityService.hash_password('Admin123!'),
    role='administrator',
    is_active=True
)
db.add(user)
db.commit()
print('Admin user created: admin@wildlife.local / Admin123!')
"
```

## 🐳 Phase 4: Docker Deployment (Optional)

### 4.1 Install Docker Desktop

1. Download: https://www.docker.com/products/docker-desktop/
2. Install and restart Windows
3. Open PowerShell and verify:

```powershell
docker --version
docker run hello-world
```

### 4.2 Build Docker Images

```powershell
# From project root
docker-compose build

# This creates images for:
# - PostgreSQL
# - Redis
# - Backend (FastAPI)
# - Frontend (React)
```

### 4.3 Start Services

```powershell
# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4.4 Stop Services

```powershell
docker-compose down

# To remove volumes (warning: deletes data)
docker-compose down -v
```

## 📝 Troubleshooting

### Issue: Port Already in Use

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Issue: Python Module Not Found

```powershell
# Ensure venv is activated
.\venv\Scripts\Activate.ps1

# Reinstall requirements
pip install --force-reinstall -r requirements.txt
```

### Issue: npm package errors

```powershell
# Clear cache
npm cache clean --force

# Delete node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

### Issue: Cannot activate venv

```powershell
# Check execution policy
Get-ExecutionPolicy

# Set to allow scripts (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Database connection error

```powershell
# Test connection
python -c "from database import get_db; print('OK')"

# Check DATABASE_URL in .env
type .env | findstr DATABASE_URL
```

## 📊 Verify Installation

Run this checklist:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Can access http://localhost:5173
- [ ] Database connected successfully
- [ ] Can register user (POST /api/v1/auth/register)
- [ ] Can login user (POST /api/v1/auth/login)
- [ ] Receive valid JWT token

## 🎯 Next Steps

### Phase 1 Complete ✅
- [x] Authentication system
- [x] User management
- [x] Database models
- [x] Frontend setup

### Phase 2 (Week 3-4): AI Analysis
- [ ] Image upload & analysis
- [ ] Audio upload & analysis
- [ ] Species recognition
- [ ] Biodiversity calculation

### Phase 3 (Week 5-6): Intelligence
- [ ] Population analytics
- [ ] Habitat assessment
- [ ] Conservation recommendations
- [ ] Ecosystem health scoring

### Phase 4 (Week 7-8): Deployment
- [ ] Testing suite
- [ ] GIS/Maps
- [ ] Reports & exports
- [ ] Production deployment

## 📚 Useful Commands

```powershell
# Backend Development
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000

# Frontend Development
cd frontend
npm run dev

# Run tests (after setup)
pytest

# Format code
black backend/
prettier frontend/src

# Build for production
npm run build

# Docker commands
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f backend`
2. Check API docs: http://localhost:8000/docs
3. Verify .env settings
4. Ensure all prerequisites installed
5. Check firewall settings (ports 3000, 5173, 8000, 5432)

## ✅ Quick Start Summary

```powershell
# Terminal 1: Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Check services
# Backend: http://localhost:8000/docs
# Frontend: http://localhost:5173

# Test login:
# Email: admin@wildlife.local
# Password: Admin123!
```

**Congratulations! You have successfully set up the Wildlife Population Intelligence System! 🎉**
