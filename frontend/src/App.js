import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import LandingPage from './components/landing/LandingPage';
import Login from './components/auth/Login';
import RoleSelection from './components/auth/RoleSelection';
import PsychologistDashboard from './components/dashboard/PsychologistDashboard';
import Settings from './components/dashboard/Settings';
import LogbookSummary from './components/logbook/LogbookSummary';
import LogbookSettings from './components/logbook/LogbookSettings';
import CPDHub from './components/cpd/CPDHub';
import ActivityLog from './components/cpd/ActivityLog';
import CPDSettings from './components/cpd/CPDSettings';
import LearningPlans from './components/cpd/LearningPlans';
import PeerConsultations from './components/cpd/PeerConsultations';
import CompetencyDashboard from './components/competencies/CompetencyDashboard';
import Messages from './components/messages/Messages';
import UserManagement from './components/admin/UserManagement';
import MobileBottomNav from './components/dashboard/MobileBottomNav';
import './App.css';
import './styles/design-system.css';

function AuthHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      if (sessionId) {
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Navigate to role selection with session ID
        navigate('/role-selection', { state: { sessionId } });
      }
    }
  }, [navigate]);

  return null;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <AuthHandler />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        
        {/* Single Psychologist Dashboard */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <PsychologistDashboard />
          </PrivateRoute>
        } />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/logbook" element={<PrivateRoute><LogbookSummary /></PrivateRoute>} />
        <Route path="/logbook/settings" element={<PrivateRoute><LogbookSettings /></PrivateRoute>} />
        <Route path="/cpd" element={<PrivateRoute><CPDHub /></PrivateRoute>} />
        <Route path="/cpd/activities" element={<PrivateRoute><ActivityLog /></PrivateRoute>} />
        <Route path="/cpd/settings" element={<PrivateRoute><CPDSettings /></PrivateRoute>} />
        <Route path="/cpd/plans" element={<PrivateRoute><LearningPlans /></PrivateRoute>} />
        <Route path="/cpd/consultations" element={<PrivateRoute><PeerConsultations /></PrivateRoute>} />
        <Route path="/competencies" element={<PrivateRoute><CompetencyDashboard /></PrivateRoute>} />
        <Route path="/journal" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
