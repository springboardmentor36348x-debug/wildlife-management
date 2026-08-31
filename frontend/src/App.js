import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SpeciesCatalog from "./pages/SpeciesCatalog";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import MonitoringSites from "./pages/MonitoringSites";
import CameraTraps from "./pages/CameraTraps";
import AudioSensors from "./pages/AudioSensors";
import AdminPanel from "./pages/AdminPanel";
import BiodiversityAnalytics from "./pages/BiodiversityAnalytics";
import SpeciesTrend from "./pages/SpeciesTrend";
import Observations from "./pages/Observations";
import ImageAnalysis from "./pages/ImageAnalysis";
import BioacousticAnalysis from "./pages/BioacousticAnalysis";
import SpeciesDetections from "./pages/SpeciesDetections";
import Reports from "./pages/Reports";
import UserActivity from "./pages/UserActivity";
import PopulationEstimation from "./pages/PopulationEstimation";
import HabitatIntelligence from "./pages/HabitatIntelligence";
import EcosystemHealth from "./pages/EcosystemHealth";
import ConservationRecommendations from "./pages/ConservationRecommendations";
import AnimalCounting from "./pages/AnimalCounting";
import WildlifeIntelligenceDashboard from "./pages/WildlifeIntelligenceDashboard";
import Alerts from "./pages/Alerts";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <Surveys />
              </ProtectedRoute>
            }
          />

          <Route
            path="/monitoring-sites"
            element={
              <ProtectedRoute>
                <MonitoringSites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/camera-traps"
            element={
              <ProtectedRoute>
                <CameraTraps />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audio-sensors"
            element={
              <ProtectedRoute>
                <AudioSensors />
              </ProtectedRoute>
            }
          />

          <Route
            path="/observations"
            element={
              <ProtectedRoute>
                <Observations />
              </ProtectedRoute>
            }
          />
          <Route
  path="/image-analysis"
  element={
    <ProtectedRoute>
      <ImageAnalysis />
    </ProtectedRoute>
  }
/>

<Route
  path="/bioacoustic-analysis"
  element={
    <ProtectedRoute>
      <BioacousticAnalysis />
    </ProtectedRoute>
  }
/>
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer","wildlife_researcher"]}>
                <BiodiversityAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/species-trend"
            element={
              <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer","wildlife_researcher"]}>
                <SpeciesTrend />
              </ProtectedRoute>
            }
          />
          <Route
  path="/species-detections"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer","wildlife_researcher"]}>
      <SpeciesDetections />
    </ProtectedRoute>
  }
/>

          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute allowedRoles={["administrator"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        <Route
  path="/user-activity"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer"]}>
      <UserActivity />
    </ProtectedRoute>
  }
/>
          <Route
  path="/species-catalog"
  element={
    <ProtectedRoute>
      <SpeciesCatalog />
    </ProtectedRoute>
  }
/>
<Route
  path="/population-estimation"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer", "wildlife_researcher"]}>
      <PopulationEstimation />
    </ProtectedRoute>
  }
/>
<Route
  path="/habitat-intelligence"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer", "wildlife_researcher"]}>
      <HabitatIntelligence />
    </ProtectedRoute>
  }
/>
<Route
  path="/ecosystem-health"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer", "wildlife_researcher"]}>
      <EcosystemHealth />
    </ProtectedRoute>
  }
/>
<Route
  path="/conservation-recommendations"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer", "wildlife_researcher"]}>
      <ConservationRecommendations />
    </ProtectedRoute>
  }
/>
<Route
  path="/animal-counting"
  element={
    <ProtectedRoute allowedRoles={["administrator", "wildlife_researcher", "forest_officer"]}>
      <AnimalCounting />
    </ProtectedRoute>
  }
/>
<Route
  path="/wildlife-intelligence"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer", "wildlife_researcher"]}>
      <WildlifeIntelligenceDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/alerts"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer", "wildlife_researcher"]}>
      <Alerts />
    </ProtectedRoute>
  }
/>
<Route
  path="/reports"
  element={
    <ProtectedRoute allowedRoles={["administrator", "conservation_officer", "forest_officer","wildlife_researcher"]}>
      <Reports />
    </ProtectedRoute>
  }
/>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;