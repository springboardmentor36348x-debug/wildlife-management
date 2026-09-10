# Wildlife Population Intelligence System - Run Manual

This manual covers everything you need to run your project locally and host it on Render's free tier. 

**Note on your UI:** Your version uses a completely custom, vanilla CSS "Dark Aurora" glassmorphism theme with a top navigation bar, whereas the original uses Tailwind CSS with an earthy green sidebar. Functionally, it remains exactly the same!

---

## 1. Running Locally (Development)

### Backend Setup

1. Open a terminal in the `backend/` directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Mac/Linux:
   source .venv/bin/activate
   ```
3. Install the full requirements (includes ML models for species detection):
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment file:
   ```bash
   copy .env.example .env
   ```
5. Run the seed script to generate all demo data, sites, users, and incidents:
   ```bash
   python -m app.seed
   ```
6. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Open a *new* terminal in the `frontend/` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`

---

## 2. Demo Credentials

Use these to explore the different role-based dashboards:

- **System Administrator:** `admin@wildlife.org` / `Admin@12345`
- **Wildlife Researcher:** `researcher@wildlife.org` / `Research@12345`
- **Conservation Officer:** `officer@wildlife.org` / `Officer@12345`
- **Forest Department:** `forest@wildlife.org` / `Forest@12345`

---

## 3. Deploying to Render.com (Free Tier)

This repository includes a `render.yaml` file configured specifically to fit Render's strict free tier limitations.

> **Important ML Note for Free Tier:** Render's free tier only has 512MB of RAM. The AI models (TensorFlow and YOLO) require >1.5GB of RAM to run. Because of this, the `render.yaml` file uses `requirements-deploy.txt`, which explicitly *excludes* the ML libraries so your app doesn't crash from out-of-memory errors on the cloud. Everything else (auth, dashboards, reports, datasets, surveys) will work perfectly!

### Deployment Steps:

1. Push this entire project folder to a **GitHub repository**.
2. Go to [Render.com](https://render.com/) and create a free account.
3. In the Render Dashboard, click **New +** and select **Blueprint**.
4. Connect your GitHub account and select the repository you just pushed.
5. Render will detect the `render.yaml` file. Give it a name and click **Apply**.
6. Render will automatically spin up two services:
   - `wildlife-api` (The FastAPI Backend)
   - `wildlife-frontend` (The React Static Site)
7. It will automatically link the frontend to the backend URL via environment variables.

*Note: The first deploy on Render's free tier can take 5-10 minutes. If the backend sleeps due to inactivity, it may take 50 seconds to wake up on the next request.*
