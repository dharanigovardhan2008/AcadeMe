import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Calendar, Users, BookOpen, TrendingUp, CheckCircle, MessageCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

import { db } from '../firebase';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';

// ============ CACHING UTILITY ============
const CACHE_DURATION = 300000; // 5 minutes

const getFromCache = (key) => {
  const cached = sessionStorage.getItem(key);
  const timestamp = sessionStorage.getItem(`${key}_time`);

  if (!cached || !timestamp) return null;

  const age = Date.now() - parseInt(timestamp, 10);
  if (age > CACHE_DURATION) {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_time`);
    return null;
  }

  return JSON.parse(cached);
};

const saveToCache = (key, data) => {
  sessionStorage.setItem(key, JSON.stringify(data));
  sessionStorage.setItem(`${key}_time`, Date.now().toString());
};
// ============ END CACHING UTILITY ============

const Dashboard = () => {
  const { user } = useAuth();
  const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData();
  const navigate = useNavigate();

  const [updates, setUpdates] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        // ===== CACHE CHECK =====
        const cached = getFromCache('dashboard_updates');
        if (cached) {
          setUpdates(cached);
          return;
        }

        const q = query(collection(db, "updates"), limit(10));
        const querySnapshot = await getDocs(q);
        const list = [];

        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        list.sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          return dateB - dateA;
        });

        const finalList = list.slice(0, 5);
        setUpdates(finalList);
        saveToCache('dashboard_updates', finalList);
      } catch (error) {
        console.error("Error fetching updates:", error);
      }
    };

    const fetchMyReviews = async () => {
      if (!user?.uid) return;

      try {
        const cacheKey = `dashboard_reviews_${user.uid}`;
        const cached = getFromCache(cacheKey);
        if (cached) {
          setMyReviews(cached);
          return;
        }

        const q = query(
          collection(db, "reviews"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        const list = [];

        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        list.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });

        setMyReviews(list);
        saveToCache(cacheKey, list);
      } catch (error) {
        console.error("Error fetching my reviews:", error);
      }
    };

    fetchUpdates();
    fetchMyReviews();
  }, [user]);

  // ===== Stats Calculations =====
  const calculateCGPA = () => {
    if (!cgpaSubjects.length) return 0;
    const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
    const total = cgpaSubjects.reduce(
      (sum, s) => sum + (gradePoints[s.grade] || 0),
      0
    );
    return (total / cgpaSubjects.length).toFixed(2);
  };

  const currentCGPA = calculateCGPA();

  const calculateAttendance = () => {
    if (!attendanceSubjects.length) return 0;
    const totalClasses = attendanceSubjects.reduce(
      (sum, s) => sum + parseInt(s.total || 0),
      0
    );
    const attendedClasses = attendanceSubjects.reduce(
      (sum, s) => sum + parseInt(s.attended || 0),
      0
    );
    return totalClasses
      ? ((attendedClasses / totalClasses) * 100).toFixed(0)
      : 0;
  };

  const currentAttendance = calculateAttendance();
  const attendanceStatus = currentAttendance >= 80 ? 'Safe' : 'Low';

  const quotes = [
    "The only way to do great work is to love what you do.",
    "Education is the most powerful weapon which you can use to change the world.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const quickActions = [
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'CGPA Calculator', icon: Calculator, path: '/calc' },
    { label: 'Attendance Tracker', icon: Calendar, path: '/attendance' },
    { label: 'Faculty Directory', icon: Users, path: '/faculty' },
  ];

  return (
    <DashboardLayout>

      {/* Welcome Section */}
      <GlassCard className="mb-6 relative overflow-hidden" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Good Morning, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            "{randomQuote}"
          </div>
        </div>

        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
          <TrendingUp size={150} color="white" />
        </div>
      </GlassCard>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <GlassCard>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentCGPA}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Current CGPA</p>
        </GlassCard>

        <GlassCard>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {currentAttendance}%
          </h2>
          <Badge variant={attendanceStatus === 'Safe' ? 'success' : 'danger'}>
            {attendanceStatus}
          </Badge>
        </GlassCard>

        <GlassCard>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {cgpaSubjects.length}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Active Subjects</p>
        </GlassCard>

        <GlassCard>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {faculty.length}+
          </h2>
          <button onClick={() => navigate('/faculty')}>
            View Faculty
          </button>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Quick Actions
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {quickActions.map((action, idx) => (
          <GlassCard
            key={idx}
            style={{ cursor: 'pointer', textAlign: 'center' }}
            onClick={() => navigate(action.path)}
          >
            <action.icon size={30} />
            <h3>{action.label}</h3>
          </GlassCard>
        ))}
      </div>

      {/* Notifications */}
      <GlassCard>
        <h2>Notifications</h2>
        {updates.length === 0 ? (
          <p>No new updates.</p>
        ) : (
          updates.map(update => (
            <div key={update.id}>
              <strong>{update.title}</strong>
              <p>{update.message}</p>
            </div>
          ))
        )}
      </GlassCard>

    </DashboardLayout>
  );
};

export default Dashboard;
