import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Added MessageSquare and ArrowRight to imports
import { Calculator, Calendar, Users, BookOpen, TrendingUp, MessageSquare, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

import { db } from '../firebase';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';

// ================= CACHE =================
const CACHE_DURATION = 300000;

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
// =========================================

const Dashboard = () => {
  const { user } = useAuth();
  const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData();
  const navigate = useNavigate();

  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const cached = getFromCache('dashboard_updates');
        if (cached) {
          setUpdates(cached);
          return;
        }

        const q = query(collection(db, "updates"), limit(5));
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));

        saveToCache('dashboard_updates', list);
        setUpdates(list);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUpdates();
  }, []);

  // ===== Calculations =====
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
    const total = attendanceSubjects.reduce((s, x) => s + Number(x.total || 0), 0);
    const attended = attendanceSubjects.reduce((s, x) => s + Number(x.attended || 0), 0);
    return total ? ((attended / total) * 100).toFixed(0) : 0;
  };

  const currentAttendance = calculateAttendance();
  const attendanceStatus = currentAttendance >= 80 ? 'Safe' : 'Low';

  const quickActions = [
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'CGPA Calculator', icon: Calculator, path: '/calc' },
    { label: 'Attendance Tracker', icon: Calendar, path: '/attendance' },
    { label: 'Faculty Directory', icon: Users, path: '/faculty' },
  ];

  return (
    <DashboardLayout>

      {/* ================= WELCOME CARD ================= */}
      <GlassCard
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(88,101,242,0.15), rgba(0,0,0,0.4))',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}
      >
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
          Good Morning, {user?.name?.split(' ')[0] || 'Student'} 👋
        </h1>

        <p style={{ opacity: 0.7, marginTop: 6 }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>

        <div
          style={{
            marginTop: '1rem',
            paddingLeft: '1rem',
            borderLeft: '3px solid #6366f1',
            fontStyle: 'italic',
            opacity: 0.8
          }}
        >
          "Success is not final, failure is not fatal: it is the courage to continue that counts."
        </div>

        <TrendingUp
          size={160}
          style={{
            position: 'absolute',
            right: -20,
            top: -20,
            opacity: 0.08
          }}
        />
      </GlassCard>

      {/* ================= STATS ================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >

        {/* CGPA */}
        <StatCard
          icon={<TrendingUp size={26} />}
          value={currentCGPA}
          label="Current CGPA"
          badge="Top 15%"
          color="#60A5FA"
        />

        {/* Attendance */}
        <StatCard
          icon={<Calendar size={26} />}
          value={`${currentAttendance}%`}
          label="Overall Attendance"
          badge={attendanceStatus}
          color={attendanceStatus === 'Safe' ? '#34D399' : '#F87171'}
        />

        {/* Subjects */}
        <StatCard
          icon={<BookOpen size={26} />}
          value={cgpaSubjects.length}
          label="Active Subjects"
          color="#A78BFA"
        />

        {/* Faculty */}
        <StatCard
          icon={<Users size={26} />}
          value={`${faculty.length}+`}
          label="Faculty Members"
          badge="View All"
          color="#F472B6"
          onClick={() => navigate('/faculty')}
        />
      </div>

      {/* ================= NEW: FACULTY REVIEWS BLOCK ================= */}
      <div style={{ marginBottom: '2.5rem' }}>
        <GlassCard 
            onClick={() => navigate('/reviews')} 
            style={{ 
                cursor: 'pointer', 
                position: 'relative', 
                overflow: 'hidden', 
                padding: '2rem',
                border: '1px solid rgba(236, 72, 153, 0.3)', // Pink accent to match theme
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
            }}
        >
            {/* Background Decor */}
            <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ 
                    width: '60px', height: '60px', 
                    background: 'linear-gradient(135deg, #EC4899, #BE185D)', 
                    borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
                }}>
                    <MessageSquare size={30} color="white" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Faculty Reviews</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        Rate professors, check internals difficulty & read feedback.
                    </p>
                </div>
            </div>

            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                color: '#EC4899', fontWeight: 'bold', fontSize: '1rem', 
                background: 'rgba(236, 72, 153, 0.1)', padding: '10px 20px', 
                borderRadius: '30px', position: 'relative', zIndex: 1 
            }}>
                View Reviews <ArrowRight size={20} />
            </div>
        </GlassCard>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
        Quick Actions
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {quickActions.map((item, idx) => (
          <GlassCard
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '2rem',
              transition: '0.3s',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                margin: '0 auto 1rem',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <item.icon size={28} />
            </div>

            <h3 style={{ fontWeight: 600 }}>{item.label}</h3>
          </GlassCard>
        ))}
      </div>

    </DashboardLayout>
  );
};

// ================= STAT CARD =================
const StatCard = ({ icon, value, label, badge, color, onClick }) => (
  <GlassCard
    onClick={onClick}
    style={{
      padding: '1.8rem',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative'
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}25`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color
      }}
    >
      {icon}
    </div>

    {badge && (
      <div style={{ position: 'absolute', right: 20, top: 20 }}>
        <Badge variant="neutral">{badge}</Badge>
      </div>
    )}

    <h2 style={{ fontSize: '2.4rem', fontWeight: 700, marginTop: '1rem' }}>
      {value}
    </h2>

    <p style={{ opacity: 0.7 }}>{label}</p>
  </GlassCard>
);

export default Dashboard;
