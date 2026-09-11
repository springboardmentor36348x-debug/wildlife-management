import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./components/RouteGuards";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import SurveysPage from "./pages/SurveysPage";
import DatasetsPage from "./pages/DatasetsPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import SpeciesRecognitionPage from "./pages/SpeciesRecognitionPage";
import PopulationPage from "./pages/PopulationPage";
import HabitatPage from "./pages/HabitatPage";
import ConservationPage from "./pages/ConservationPage";
import EcosystemHealthPage from "./pages/EcosystemHealthPage";
import NotificationsPage from "./pages/NotificationsPage";
import PerformancePage from "./pages/PerformancePage";
import GISMappingPage from "./pages/GISMappingPage";

function AuthedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <AuthedLayout>
            <DashboardPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/surveys"
        element={
          <AuthedLayout>
            <SurveysPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/datasets"
        element={
          <AuthedLayout>
            <RoleRoute roles={["administrator", "researcher"]}>
              <DatasetsPage />
            </RoleRoute>
          </AuthedLayout>
        }
      />
      <Route
        path="/species-recognition"
        element={
          <AuthedLayout>
            <RoleRoute roles={["administrator", "researcher", "forest_department"]}>
              <SpeciesRecognitionPage />
            </RoleRoute>
          </AuthedLayout>
        }
      />
      <Route
        path="/population"
        element={
          <AuthedLayout>
            <PopulationPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/habitat"
        element={
          <AuthedLayout>
            <HabitatPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/conservation"
        element={
          <AuthedLayout>
            <ConservationPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/ecosystem-health"
        element={
          <AuthedLayout>
            <EcosystemHealthPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/gis-mapping"
        element={
          <AuthedLayout>
            <GISMappingPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/performance"
        element={
          <AuthedLayout>
            <PerformancePage />
          </AuthedLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <AuthedLayout>
            <NotificationsPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AuthedLayout>
            <ReportsPage />
          </AuthedLayout>
        }
      />
      <Route
        path="/users"
        element={
          <AuthedLayout>
            <RoleRoute roles={["administrator"]}>
              <UsersPage />
            </RoleRoute>
          </AuthedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
