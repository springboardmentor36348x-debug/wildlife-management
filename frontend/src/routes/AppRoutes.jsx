import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

import Landing from "../pages/Landing.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import AdminUsers from "../pages/AdminUsers.jsx";
import UploadImage from "../pages/UploadImage.jsx";
import UploadAudio from "../pages/UploadAudio.jsx";
import Species from "../pages/Species.jsx";
import Population from "../pages/Population.jsx";
import Biodiversity from "../pages/Biodiversity.jsx";
import Reports from "../pages/Reports.jsx";
import Notifications from "../pages/Notifications.jsx";
import Profile from "../pages/Profile.jsx";
import Settings from "../pages/Settings.jsx";
import MonitoringOverview from "../pages/monitoring/MonitoringOverview.jsx";
import MonitoringSites from "../pages/monitoring/MonitoringSites.jsx";
import Surveys from "../pages/monitoring/Surveys.jsx";
import CameraTraps from "../pages/monitoring/CameraTraps.jsx";
import AudioSensors from "../pages/monitoring/AudioSensors.jsx";
import Observations from "../pages/monitoring/Observations.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin Only Route */}
          <Route element={<ProtectedRoute allowedRoles={["Administrator"]} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          <Route path="/monitoring" element={<MonitoringOverview />} />
          <Route path="/monitoring/sites" element={<MonitoringSites />} />
          <Route path="/monitoring/surveys" element={<Surveys />} />
          <Route path="/monitoring/camera-traps" element={<CameraTraps />} />
          <Route path="/monitoring/audio-sensors" element={<AudioSensors />} />
          <Route path="/monitoring/observations" element={<Observations />} />

          <Route path="/upload-image" element={<UploadImage />} />
          <Route path="/upload-audio" element={<UploadAudio />} />
          <Route path="/species" element={<Species />} />
          <Route path="/population" element={<Population />} />
          <Route path="/biodiversity" element={<Biodiversity />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}