import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MonitoringSites from "./pages/MonitoringSites";
import Surveys from "./pages/Surveys";
import ImageAudioUpload from "./pages/ImageAudioUpload";
import SpeciesObservations from "./pages/SpeciesObservations";
import BiodiversityAnalytics from "./pages/BiodiversityAnalytics";
import PopulationHabitat from "./pages/PopulationHabitat";
import ConservationRecommendations from "./pages/ConservationRecommendations";
import LiveMap from "./pages/LiveMap";

export default function App() {
  return (
    <div className="min-h-screen wildlife-bg-subtle">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          path="/surveys"
          element={
            <ProtectedRoute>
              <Surveys />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <ImageAudioUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/species"
          element={
            <ProtectedRoute>
              <SpeciesObservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/biodiversity"
          element={
            <ProtectedRoute>
              <BiodiversityAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/population-habitat"
          element={
            <ProtectedRoute>
              <PopulationHabitat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conservation"
          element={
            <ProtectedRoute>
              <ConservationRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-map"
          element={
            <ProtectedRoute>
              <LiveMap />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
