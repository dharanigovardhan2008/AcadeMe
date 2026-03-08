import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import useAnimationSystem from './hooks/useAnimationSystem';

// Page Imports
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminModal from './components/AdminModal';
import Dashboard from './pages/Dashboard';
import CGPACalculator from './pages/CGPACalculator';
import MandatoryCourses from './pages/MandatoryCourses';
import AttendanceTracker from './pages/AttendanceTracker';
import FacultyDirectory from './pages/FacultyDirectory';
import ResourcesHub from './pages/ResourcesHub';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import CompleteProfile from './pages/CompleteProfile';
import FacultyReviews from './pages/FacultyReviews';
import CommonCourses from './pages/CommonCourses';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Main App Content Wrapper
const AppContent = () => {

  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // NEW STATE FOR INSTALL PROMPT
  const [installPrompt, setInstallPrompt] = useState(null);

  // 1. ACTIVATE ANIMATION SYSTEM GLOBALLY
  useAnimationSystem();

  // 2. ADMIN MODAL HOTKEY LISTENER
  useEffect(() => {

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAdminModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, []);

  // NEW: CAPTURE INSTALL PROMPT EVENT
  useEffect(() => {

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("PWA Install prompt ready");
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);

  }, []);

  return (
    <>
      <Routes>

        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}

        <Route path="/complete-profile" element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/calc" element={
          <ProtectedRoute>
            <CGPACalculator />
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute>
            <AttendanceTracker />
          </ProtectedRoute>
        } />

        <Route path="/courses" element={
          <ProtectedRoute>
            <MandatoryCourses />
          </ProtectedRoute>
        } />

        <Route path="/common-courses" element={
          <ProtectedRoute>
            <CommonCourses />
          </ProtectedRoute>
        } />

        <Route path="/faculty" element={
          <ProtectedRoute>
            <FacultyDirectory />
          </ProtectedRoute>
        } />

        <Route path="/resources" element={
          <ProtectedRoute>
            <ResourcesHub />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/reviews" element={
          <ProtectedRoute>
            <FacultyReviews />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

      {/* INSTALL APP BUTTON */}

      {installPrompt && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#1f2937",
            padding: "14px 18px",
            borderRadius: "10px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            color: "white",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >

          <span>Install AcadeMe</span>

          <button
            style={{
              background: "#3b82f6",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer"
            }}

            onClick={async () => {

              installPrompt.prompt();
              await installPrompt.userChoice;
              setInstallPrompt(null);

            }}
          >
            Install
          </button>

        </div>
      )}

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

    </>
  );
};

function App() {

  return (

    <Router>

      <ErrorBoundary>

        <AuthProvider>

          <DataProvider>

            <div
              className="app-container"
              style={{ minHeight: '100vh', background: '#0F0F1A' }}
            >

              <AppContent />

            </div>

          </DataProvider>

        </AuthProvider>

      </ErrorBoundary>

    </Router>

  );

}

export default App;
