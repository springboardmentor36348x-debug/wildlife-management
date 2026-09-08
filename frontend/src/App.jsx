import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wildlife from "./pages/Wildlife";
import Detection from "./pages/Detection";
import Habitat from "./pages/Habitat";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import History from "./pages/History";
import AudioDetection from "./pages/AudioDetection";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";
import Population from "./pages/Population";
import Conservation from "./pages/Conservation";
import EcosystemHealth from "./pages/EcosystemHealth";

import StudentDashboard from "./pages/studentdashboard";
import ResearchOfficerDashboard from "./pages/researchofficerdashboard";
import ForestOfficerDashboard from "./pages/forestofficerdashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* AUTHENTICATION */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* STUDENT DASHBOARD */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* RESEARCH OFFICER DASHBOARD */}
        <Route
          path="/research-officer-dashboard"
          element={
            <ProtectedRoute>
              <ResearchOfficerDashboard />
            </ProtectedRoute>
          }
        />

        {/* FOREST OFFICER DASHBOARD */}
        <Route
          path="/forest-officer-dashboard"
          element={
            <ProtectedRoute>
              <ForestOfficerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMIN / COMMON DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* WILDLIFE */}
        <Route
          path="/wildlife"
          element={
            <ProtectedRoute>
              <Wildlife />
            </ProtectedRoute>
          }
        />

        {/* IMAGE DETECTION */}
        <Route
          path="/detection"
          element={
            <ProtectedRoute>
              <Detection />
            </ProtectedRoute>
          }
        />

        {/* AUDIO DETECTION */}
        <Route
          path="/audio"
          element={
            <ProtectedRoute>
              <AudioDetection />
            </ProtectedRoute>
          }
        />

        {/* HISTORY */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        {/* ANALYTICS */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* HABITAT */}
        <Route
          path="/habitat"
          element={
            <ProtectedRoute>
              <Habitat />
            </ProtectedRoute>
          }
        />

        {/* POPULATION */}
        <Route
          path="/population"
          element={
            <ProtectedRoute>
              <Population />
            </ProtectedRoute>
          }
        />

        {/* CONSERVATION */}
        <Route
          path="/conservation"
          element={
            <ProtectedRoute>
              <Conservation />
            </ProtectedRoute>
          }
        />

        {/* ECOSYSTEM HEALTH */}
        <Route
          path="/ecosystem-health"
          element={
            <ProtectedRoute>
              <EcosystemHealth />
            </ProtectedRoute>
          }
        />

        {/* REPORTS */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;