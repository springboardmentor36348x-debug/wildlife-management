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
   # Windows:
   copy .env.example .env
   # Mac/Linux:
   cp .env.example .env
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

We recommend deploying the backend as a **Web Service** and the frontend as a **Static Site** on Render to best utilize the free tier resources.

> **Important ML Note for Free Tier:** Render's free tier only has 512MB of RAM. The AI models (TensorFlow and YOLO) require >1.5GB of RAM to run. Because of this, when deploying the backend, ensure you use `requirements-deploy.txt` which explicitly *excludes* the ML libraries so your app doesn't crash from out-of-memory errors. Everything else (auth, dashboards, reports, datasets, surveys) will work perfectly!

### Step 1: Push to GitHub
1. Push this entire project folder to a **GitHub repository**.
2. Go to [Render.com](https://render.com/) and create a free account.

### Step 2: Deploy the Backend (Web Service)
1. In the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub account and select your repository.
3. Configure the service:
   - **Name:** `wildlife-api` (or similar)
   - **Root Directory:** `backend`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements-deploy.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
4. Add the following **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.0`
   - `DATABASE_URL`: `sqlite:///./wildlife.db`
   - `SECRET_KEY`: (Generate a random string)
   - `REFRESH_SECRET_KEY`: (Generate a random string)
   - `CORS_ORIGINS`: `*`
5. Click **Create Web Service**. Wait for it to deploy and copy the provided external URL (e.g., `https://wildlife-api.onrender.com`).

### Step 3: Deploy the Frontend (Static Site)
1. Go back to the Render Dashboard, click **New +** and select **Static Site**.
2. Select the same GitHub repository.
3. Configure the site:
   - **Name:** `wildlife-frontend` (or similar)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish directory:** `./dist`
4. Add the following **Environment Variable**:
   - `VITE_API_BASE_URL`: (Paste the external URL of your backend from Step 2, e.g., `https://wildlife-api.onrender.com`)
5. Click **Create Static Site**.

*Note: The first deploy on Render's free tier can take 5-10 minutes. If the backend sleeps due to inactivity, it may take 50 seconds to wake up on the next request.*
