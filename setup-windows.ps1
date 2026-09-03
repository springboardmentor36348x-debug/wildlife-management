# Wildlife Population Intelligence System - Windows Quick Setup Script
# Run this in PowerShell from project root directory
# Usage: .\setup-windows.ps1

# Set error action
$ErrorActionPreference = "Stop"

# Color output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "=================================================="
Write-Info "Wildlife Population Intelligence System"
Write-Info "Windows Setup Script"
Write-Info "=================================================="
Write-Info ""

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "✓ Python: $pythonVersion"
} catch {
    Write-Error "✗ Python not found. Install from https://www.python.org/downloads/"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "✓ Node.js: $nodeVersion"
} catch {
    Write-Error "✗ Node.js not found. Install from https://nodejs.org/"
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Success "✓ Git: $gitVersion"
} catch {
    Write-Error "✗ Git not found. Install from https://git-scm.com/"
    exit 1
}

Write-Info ""
Write-Info "=================================================="
Write-Info "Setting up Backend (FastAPI)"
Write-Info "=================================================="
Write-Info ""

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Error "✗ backend directory not found"
    exit 1
}

cd backend

# Create virtual environment
Write-Info "Creating Python virtual environment..."
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Success "✓ Virtual environment created"
} else {
    Write-Info "Virtual environment already exists"
}

# Activate virtual environment
Write-Info "Activating virtual environment..."
& ".\venv\Scripts\Activate.ps1"
Write-Success "✓ Virtual environment activated"

# Upgrade pip
Write-Info "Upgrading pip..."
python -m pip install --upgrade pip setuptools wheel | Out-Null
Write-Success "✓ pip upgraded"

# Install dependencies
Write-Info "Installing Python dependencies (this may take a few minutes)..."
pip install -r requirements.txt
Write-Success "✓ Dependencies installed"

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Info "Creating .env file..."
    Copy-Item ..\.env.example -Destination .env
    Write-Success "✓ .env file created"
}

# Test database connection
Write-Info "Testing database connection..."
try {
    python -c "from database import engine; engine.connect(); print('OK')"
    Write-Success "✓ Database connection successful"
} catch {
    Write-Info "Note: Database connection test skipped (may need configuration)"
}

# Return to root
cd ..

Write-Info ""
Write-Info "=================================================="
Write-Info "Setting up Frontend (React)"
Write-Info "=================================================="
Write-Info ""

# Check if frontend directory exists
if (-not (Test-Path "frontend")) {
    Write-Error "✗ frontend directory not found"
    exit 1
}

cd frontend

# Install dependencies
Write-Info "Installing npm dependencies (this may take a few minutes)..."
npm install
Write-Success "✓ Dependencies installed"

# Create .env if not exists
if (-not (Test-Path ".env.local")) {
    Write-Info "Creating .env.local file..."
    "@`nVITE_API_URL=http://localhost:8000`n@" | Set-Content -Path .env.local
    Write-Success "✓ .env.local file created"
}

# Return to root
cd ..

Write-Info ""
Write-Info "=================================================="
Write-Info "Setup Complete! 🎉"
Write-Info "=================================================="
Write-Info ""
Write-Info "Next steps:"
Write-Info "1. Backend:"
Write-Info "   cd backend"
Write-Info "   .\venv\Scripts\Activate.ps1"
Write-Info "   python -m uvicorn main:app --reload"
Write-Info ""
Write-Info "2. Frontend (in new terminal):"
Write-Info "   cd frontend"
Write-Info "   npm run dev"
Write-Info ""
Write-Info "3. Access:"
Write-Info "   Frontend: http://localhost:5173"
Write-Info "   Backend API: http://localhost:8000"
Write-Info "   API Docs: http://localhost:8000/docs"
Write-Info ""
Write-Info "4. Login with:"
Write-Info "   Email: admin@wildlife.local"
Write-Info "   Password: Admin123!"
Write-Info ""
Write-Success "Happy coding! 🦁"
