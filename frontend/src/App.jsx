import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MonitoringSites from './pages/MonitoringSites';
import Surveys from './pages/Surveys';
import Observations from './pages/Observations';
import ImageAnalysis from './pages/ImageAnalysis';
import AudioAnalysis from './pages/AudioAnalysis';
import SpeciesCatalog from './pages/SpeciesCatalog';
import PopulationIntelligence from './pages/PopulationIntelligence';
import BiodiversityIntelligence from './pages/BiodiversityIntelligence';
import HabitatIntelligence from './pages/HabitatIntelligence';
import EcosystemHealth from './pages/EcosystemHealth';
import ConservationHub from './pages/ConservationHub';
import GISMap from './pages/GISMap';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';

// ─── Auth Context ───────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'administrator') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─── App Shell with Layout ────────────────────────────────────────────────────
function AppShell() {
  const { user } = useAuth();

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/monitoring-sites" element={<MonitoringSites />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/observations" element={<Observations />} />
        <Route path="/image-analysis" element={<ImageAnalysis />} />
        <Route path="/audio-analysis" element={<AudioAnalysis />} />
        <Route path="/species-catalog" element={<SpeciesCatalog />} />
        <Route path="/population" element={<PopulationIntelligence />} />
        <Route path="/biodiversity" element={<BiodiversityIntelligence />} />
        <Route path="/habitat" element={<HabitatIntelligence />} />
        <Route path="/ecosystem-health" element={<EcosystemHealth />} />
        <Route path="/conservation" element={<ConservationHub />} />
        <Route path="/gis-map" element={<GISMap />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/register" element={<RegisterGuard />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Redirect to /dashboard if already logged in
function LoginGuard() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

// Redirect to /dashboard if already logged in
function RegisterGuard() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Register />;
}
