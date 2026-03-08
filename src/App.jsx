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
import AdminModal from "./components/AdminModal";

// ─── Loading Screen (shown while Firebase checks auth) ───────────────────────
const LoadingScreen = () => (
  <div style={{
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#0F0F1A", gap: "1.5rem"
  }}>
    {/* Glowing blobs */}
    <div style={{
      position: "absolute", top: "25%", left: "25%",
      width: 300, height: 300, borderRadius: "50%",
      background: "rgba(59,130,246,0.15)", filter: "blur(80px)", pointerEvents: "none"
    }} />
    <div style={{
      position: "absolute", bottom: "25%", right: "25%",
      width: 300, height: 300, borderRadius: "50%",
      background: "rgba(139,92,246,0.15)", filter: "blur(80px)", pointerEvents: "none"
    }} />

    {/* Spinner */}
    <div style={{
      width: 48, height: 48,
      border: "4px solid rgba(255,255,255,0.08)",
      borderTopColor: "#60A5FA",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      zIndex: 10
    }} />
    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", zIndex: 10 }}>
      Loading AcadeMe...
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Safety valve — if Firebase hangs for 8s, stop loading and redirect to login
  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(id);
  }, [loading]);

  if (timedOut) return <Navigate to="/login" />;
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// ─── App Content ─────────────────────────────────────────────────────────────
const AppContent = () => {
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  useAnimationSystem();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setAdminModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <AdminModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
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
```

---

## What Changed and Why

**`LoadingScreen` component** replaces the raw `"Loading..."` text. Shows your app's blue/purple glowing blobs and a spinner — matches your existing design language from `SplashScreen.jsx`.

**8-second timeout in `ProtectedRoute`** — if Firebase hangs forever (broken keys, no internet), after 8 seconds the app stops waiting and redirects to `/login` instead of showing a blank screen forever.

**`timedOut` state** — separates "still loading" from "gave up waiting" so the fallback is clean.

---

## But also fix this immediately

Even with this fix, if your **Vercel env vars aren't set**, Firebase will keep failing. Check Vercel → your project → Settings → Environment Variables and confirm all these exist:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_GEMINI_API_KEY
VITE_ADMIN_PIN
VITE_ADMIN_EMAIL
