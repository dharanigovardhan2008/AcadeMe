import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminModal from './components/AdminModal';
import GlassCard from './components/GlassCard'; // Fallback / placeholder for Dashboard
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

// Placeholder Dashboard removed

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute - Loading:", loading, "User:", user ? user.uid : "null");
  if (loading) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading application...</div>;
  if (!user) {
    console.log("ProtectedRoute - Redirecting to login");
    return <Navigate to="/login" />;
  }
  console.log("ProtectedRoute - Rendering children");
  return children;
};

// Wrapper for global keys and modal
const AppContent = () => {
  const [adminModalOpen, setAdminModalOpen] = useState(false);

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

  // Also listen for a custom event if we want to trigger from login button easily
  // Or we just pass the setter to children via context or props? 
  // For now, let's keep it simple. The Login page has a button, we can't easily click it to trigger this state without Context.
  // I can expose openAdminModal in AuthContext ideally, or just rely on Ctrl+Shift+A for now, 
  // OR create a Layout component.

  return (
    <>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/calc" element={<ProtectedRoute><CGPACalculator /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendanceTracker /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><MandatoryCourses /></ProtectedRoute>} />
        <Route path="/faculty" element={<ProtectedRoute><FacultyDirectory /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><ResourcesHub /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      </Routes>
      <AdminModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <DataProvider>
            <div className="app-container" style={{ minHeight: '100vh' }}>
              <AppContent />
            </div>
          </DataProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
