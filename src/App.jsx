import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

import ErrorBoundary from "./components/ErrorBoundary";
import useAnimationSystem from "./hooks/useAnimationSystem";

import DownloadAppBanner from "./components/DownloadAppBanner";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CGPACalculator from "./pages/CGPACalculator";
import MandatoryCourses from "./pages/MandatoryCourses";
import AttendanceTracker from "./pages/AttendanceTracker";
import FacultyDirectory from "./pages/FacultyDirectory";
import ResourcesHub from "./pages/ResourcesHub";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import CompleteProfile from "./pages/CompleteProfile";
import FacultyReviews from "./pages/FacultyReviews";
import CommonCourses from "./pages/CommonCourses";
import Leaderboard from "./pages/Leaderboard";

import AdminModal from "./components/AdminModal";

// ── ProtectedRoute ───────────────────────────────────────────────────────────
// KEY FIX: while loading=true we show a spinner — never redirect to /login
// This prevents the flash-redirect when Firebase auth resolves slowly
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0F0F1A", color: "white", gap: "1rem",
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#3B82F6",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── AppContent ───────────────────────────────────────────────────────────────
const AppContent = () => {
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  useAnimationSystem();

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setAdminModalOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<SplashScreen />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
        <Route path="/dashboard"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/calc"             element={<ProtectedRoute><CGPACalculator /></ProtectedRoute>} />
        <Route path="/attendance"       element={<ProtectedRoute><AttendanceTracker /></ProtectedRoute>} />
        <Route path="/courses"          element={<ProtectedRoute><MandatoryCourses /></ProtectedRoute>} />
        <Route path="/common-courses"   element={<ProtectedRoute><CommonCourses /></ProtectedRoute>} />
        <Route path="/faculty"          element={<ProtectedRoute><FacultyDirectory /></ProtectedRoute>} />
        <Route path="/resources"        element={<ProtectedRoute><ResourcesHub /></ProtectedRoute>} />
        <Route path="/profile"          element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings"         element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/reviews"          element={<ProtectedRoute><FacultyReviews /></ProtectedRoute>} />
        <Route path="/admin"            element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/leaderboard"      element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

        {/* Bug #38: wildcard → /login not / (prevents splash loop) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <AdminModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </>
  );
};

// ── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <DataProvider>
            <div className="app-container" style={{ minHeight: "100vh", background: "#0F0F1A" }}>
              <DownloadAppBanner />
              <AppContent />
            </div>
          </DataProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
