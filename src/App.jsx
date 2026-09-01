import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { onForegroundMessage } from "./firebase"; // Keep this

import ErrorBoundary from "./components/ErrorBoundary";
import useAnimationSystem from "./hooks/useAnimationSystem";

import DownloadAppBanner from "./components/DownloadAppBanner";
import NotificationPrompt from "./components/NotificationPrompt"; // ✅ ADD THIS
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

import AIAssistant from "./components/AIAssistant";

// ── ProtectedRoute ───────────────────────────────────────────────────────────
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
  const { user } = useAuth();
  const navigate = useNavigate();

  useAnimationSystem();

  // ✅ REMOVE the old automatic notification request
  // We'll use the popup instead

  // Handle foreground notifications
  useEffect(() => {
    if (user?.uid) {
      onForegroundMessage((payload) => {
        console.log("📩 Notification received while app is open:", payload);
      });
    }
  }, [user?.uid]);

  // When a background notification is tapped, the service worker focuses this
  // tab and posts { type: 'NOTIFICATION_CLICK', url } — route there client-side
  // (e.g. attendance reminders → /attendance) instead of a full page reload.
  useEffect(() => {
    const handleSwMessage = (event) => {
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data?.url) {
        try {
          const path = new URL(event.data.url).pathname || "/attendance";
          navigate(path);
        } catch {
          navigate("/attendance");
        }
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    }
  }, [navigate]);

  // Same routing, but for notifications clicked while the app tab is
  // already focused (foreground notifications), dispatched from firebase.js
  useEffect(() => {
    const handleFgClick = (e) => {
      if (e.detail?.path) navigate(e.detail.path);
    };
    window.addEventListener("app-notification-click", handleFgClick);
    return () => window.removeEventListener("app-notification-click", handleFgClick);
  }, [navigate]);

  return (
    <>
      {/* ✅ ADD THIS - Shows notification popup automatically */}
      <NotificationPrompt />

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

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Floating AI chat widget — only shown once a user is signed in */}
      {user && <AIAssistant />}
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
            <div className="app-container" style={{ minHeight: "100vh" }}>
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