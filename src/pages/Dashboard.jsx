import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, Calendar, Users, BookOpen,
  TrendingUp, MessageSquare, ArrowRight,
  Megaphone, ExternalLink, Sparkles,
  ChevronRight, Award, Clock, Zap,
  Star, BarChart3, Target, GraduationCap,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

/* ══════════════════════════════════════════════
   CACHE LOGIC (unchanged)
══════════════════════════════════════════════ */
const CACHE_DURATION = 300000;
const getFromCache = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    const ts = sessionStorage.getItem(`${key}_time`);
    if (!cached || !ts) return null;
    if (Date.now() - parseInt(ts, 10) > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}_time`);
      return null;
    }
    return JSON.parse(cached);
  } catch { return null; }
};
const saveToCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}_time`, Date.now().toString());
  } catch {}
};

/* ── Safe Firestore date ── */
const toSafeDate = (val) => {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

const timeAgo = (val) => {
  const d = toSafeDate(val);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/* ══════════════════════════════════════════════
   CIRCULAR PROGRESS COMPONENT
══════════════════════════════════════════════ */
const CircularProgress = ({ value, max = 100, size = 80, strokeWidth = 6, color, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((value / max) * 100, 100);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData() || {};
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const cached = getFromCache('dashboard_updates');
        if (cached) setUpdates(cached);
        const q = query(collection(db, 'updates'), orderBy('date', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
        saveToCache('dashboard_updates', list);
        setUpdates(list);
      } catch (err) { console.error('Updates Error:', err); }
    };
    fetchUpdates();
  }, []);

  /* ── Calculations (unchanged) ── */
  const currentCGPA = useMemo(() => {
    if (!cgpaSubjects?.length) return 0;
    const gp = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
    const total = cgpaSubjects.reduce((sum, s) => sum + (gp[s.grade] || 0), 0);
    return (total / cgpaSubjects.length).toFixed(2);
  }, [cgpaSubjects]);

  const currentAttendance = useMemo(() => {
    if (!attendanceSubjects?.length) return 0;
    const total = attendanceSubjects.reduce((s, x) => s + Number(x.total || 0), 0);
    const attended = attendanceSubjects.reduce((s, x) => s + Number(x.attended || 0), 0);
    return total ? ((attended / total) * 100).toFixed(0) : 0;
  }, [attendanceSubjects]);

  const attendanceStatus = currentAttendance >= 80 ? 'Safe' : 'Low';
  const userName = user?.name ? user.name.split(' ')[0] : 'Student';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getEmoji = () => {
    const h = new Date().getHours();
    if (h < 12) return '☀️';
    if (h < 17) return '🌤️';
    return '🌙';
  };

  const quickActions = [
    { label: 'My Courses', desc: 'View enrolled courses', icon: BookOpen, path: '/courses', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'CGPA Calculator', desc: 'Calculate your GPA', icon: Calculator, path: '/calc', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Attendance', desc: 'Track your attendance', icon: Calendar, path: '/attendance', gradient: 'linear-gradient(135deg, #10B981, #059669)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Faculty', desc: 'Browse directory', icon: Users, path: '/faculty', gradient: 'linear-gradient(135deg, #F472B6, #EC4899)', bg: 'rgba(244,114,182,0.1)' },
  ];

  const motivationalQuotes = [
    "The future belongs to those who believe in the beauty of their dreams.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The only way to do great work is to love what you do.",
  ];
  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  return (
    <DashboardLayout>
      <style>{`
        /* ══════════════════════════════════════
           DESIGN SYSTEM
        ══════════════════════════════════════ */
        .d-root {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 0 3rem;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '12px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        /* ── Glass Card Base ── */
        .d-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .d-glass:hover {
          border-color: rgba(255,255,255,0.1);
        }
        .d-glass-clickable {
          cursor: pointer;
        }
        .d-glass-clickable:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .d-glass-clickable:active {
          transform: translateY(-1px) scale(0.995);
        }

        /* ══ HERO SECTION ══ */
        .d-hero {
          padding: 1.5rem;
          margin-bottom: 1.25rem;
          position: relative; overflow: hidden;
          background: linear-gradient(135deg,
            rgba(99,102,241,0.15) 0%,
            rgba(59,130,246,0.08) 50%,
            rgba(139,92,246,0.1) 100%
          );
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 24px;
        }
        .d-hero::before {
          content: '';
          position: absolute; top: -100px; right: -100px;
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .d-hero::after {
          content: '';
          position: absolute; bottom: -80px; left: -50px;
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .d-hero-content { position: relative; z-index: 1; }
        .d-hero-greeting {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.82rem; color: rgba(255,255,255,0.5);
          font-weight: 500; margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .d-hero h1 {
          font-size: clamp(1.5rem, 5vw, 2.2rem);
          font-weight: 800; margin: 0; line-height: 1.2;
          color: #F8FAFC;
        }
        .d-hero h1 span {
          background: linear-gradient(135deg, #818CF8, #6366F1);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .d-hero-date {
          display: flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.4);
          margin-top: 10px; font-size: clamp(0.78rem, 2vw, 0.88rem);
        }
        .d-hero-quote {
          margin-top: 1.25rem; padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          border-left: 3px solid #6366F1;
          font-style: italic;
          color: rgba(255,255,255,0.55);
          font-size: clamp(0.78rem, 2vw, 0.88rem);
          line-height: 1.6;
          display: flex; align-items: flex-start; gap: 10px;
        }
        .d-hero-quote-icon {
          flex-shrink: 0; color: #6366F1; opacity: 0.5; margin-top: 2px;
        }
        @media (min-width: 768px) {
          .d-hero { padding: 2.5rem; margin-bottom: 1.5rem; }
        }

        /* ══ STATS SECTION ══ */
        .d-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 640px) { .d-stats { gap: 1rem; } }
        @media (min-width: 900px) {
          .d-stats { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
        }

        .d-stat {
          padding: 1.25rem;
          position: relative; overflow: hidden;
          border-radius: 20px;
        }
        .d-stat::after {
          content: ''; position: absolute; top: -30px; right: -30px;
          width: 100px; height: 100px; border-radius: 50%;
          opacity: 0.06; pointer-events: none;
          transition: opacity 0.3s;
        }
        .d-stat:hover::after { opacity: 0.12; }

        .d-stat-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .d-stat-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .d-stat-badge {
          font-size: 0.62rem; font-weight: 700;
          padding: 3px 8px; border-radius: 8px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .d-stat-value {
          font-size: clamp(1.6rem, 5vw, 2rem);
          font-weight: 800; line-height: 1; margin: 0;
        }
        .d-stat-label {
          font-size: clamp(0.7rem, 2vw, 0.78rem);
          color: rgba(255,255,255,0.4);
          margin: 6px 0 0; font-weight: 500;
        }
        @media (min-width: 768px) {
          .d-stat { padding: 1.5rem; }
          .d-stat-icon { width: 46px; height: 46px; }
        }

        /* ══ OVERVIEW CARDS (CGPA + Attendance side by side on desktop) ══ */
        .d-overview {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 768px) {
          .d-overview { grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
        }

        .d-overview-card {
          padding: 1.5rem; border-radius: 20px;
          display: flex; align-items: center; gap: 20px;
          position: relative; overflow: hidden;
        }
        .d-overview-info { flex: 1; min-width: 0; }
        .d-overview-title {
          font-size: 0.78rem; font-weight: 600;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase; letter-spacing: 0.8px;
          margin: 0 0 6px;
        }
        .d-overview-value {
          font-size: clamp(2rem, 6vw, 2.8rem);
          font-weight: 900; margin: 0; line-height: 1;
        }
        .d-overview-sub {
          font-size: 0.78rem; color: rgba(255,255,255,0.35);
          margin: 8px 0 0;
          display: flex; align-items: center; gap: 4px;
        }
        @media (min-width: 768px) {
          .d-overview-card { padding: 2rem; }
        }

        /* ══ ANNOUNCEMENTS ══ */
        .d-announce {
          margin-bottom: 1.25rem;
        }
        .d-announce-card {
          padding: 1.25rem; border-radius: 20px;
          border: 1px solid rgba(251,191,36,0.1);
        }
        .d-announce-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 1rem;
        }
        .d-announce-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(251,191,36,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .d-announce-title {
          font-size: clamp(0.95rem, 3vw, 1.1rem);
          font-weight: 700; margin: 0;
        }
        .d-announce-item {
          padding: 14px; background: rgba(255,255,255,0.03);
          border-radius: 14px;
          border-left: 3px solid rgba(251,191,36,0.5);
          transition: background 0.2s;
        }
        .d-announce-item:hover { background: rgba(255,255,255,0.05); }
        .d-announce-item-title {
          font-weight: 700; font-size: 0.88rem; margin: 0;
          color: #F1F5F9; line-height: 1.4;
        }
        .d-announce-item-msg {
          font-size: 0.82rem; color: rgba(255,255,255,0.5);
          margin: 6px 0 0; line-height: 1.5;
        }
        .d-announce-item-time {
          font-size: 0.68rem; color: rgba(255,255,255,0.25);
          display: flex; align-items: center; gap: 4px;
        }
        .d-announce-link {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 8px; font-size: 0.78rem; color: #818CF8;
          text-decoration: none; font-weight: 600;
          padding: 4px 12px; border-radius: 8px;
          background: rgba(99,102,241,0.08);
          transition: background 0.2s;
        }
        .d-announce-link:hover { background: rgba(99,102,241,0.15); }
        @media (min-width: 768px) {
          .d-announce-card { padding: 1.5rem; }
          .d-announce { margin-bottom: 1.5rem; }
        }

        /* ══ REVIEWS CTA ══ */
        .d-reviews {
          margin-bottom: 1.25rem;
        }
        .d-reviews-card {
          padding: 1.5rem; border-radius: 20px;
          position: relative; overflow: hidden;
          border: 1px solid rgba(236,72,153,0.1);
          cursor: pointer;
        }
        .d-reviews-card:hover {
          border-color: rgba(236,72,153,0.25);
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(236,72,153,0.08);
        }
        .d-reviews-glow {
          position: absolute; top: -60%; right: -20%;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(236,72,153,0.08), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .d-reviews-body {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 16px;
          position: relative; z-index: 1;
        }
        .d-reviews-left { display: flex; gap: 14px; align-items: center; }
        .d-reviews-icon {
          width: 50px; height: 50px; flex-shrink: 0;
          background: linear-gradient(135deg, #EC4899, #BE185D);
          border-radius: 16px; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(236,72,153,0.2);
        }
        .d-reviews-text h3 {
          font-size: clamp(1rem, 3vw, 1.2rem);
          font-weight: 700; margin: 0 0 4px;
        }
        .d-reviews-text p {
          color: rgba(255,255,255,0.4);
          font-size: clamp(0.75rem, 2vw, 0.85rem); margin: 0;
        }
        .d-reviews-cta {
          display: flex; align-items: center; gap: 6px;
          font-weight: 700; font-size: 0.82rem;
          background: rgba(236,72,153,0.1);
          color: #F472B6;
          padding: 10px 18px; border-radius: 24px;
          white-space: nowrap;
          transition: background 0.2s;
        }
        .d-reviews-card:hover .d-reviews-cta {
          background: rgba(236,72,153,0.18);
        }
        @media (min-width: 768px) {
          .d-reviews-card { padding: 2rem; }
          .d-reviews-icon { width: 56px; height: 56px; }
          .d-reviews { margin-bottom: 1.5rem; }
        }

        /* ══ QUICK ACTIONS ══ */
        .d-quick-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem;
        }
        .d-quick-title {
          font-size: clamp(1.1rem, 3vw, 1.3rem);
          font-weight: 700; margin: 0;
          display: flex; align-items: center; gap: 8px;
        }
        .d-quick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          padding-bottom: 2rem;
        }
        @media (min-width: 640px) { .d-quick-grid { gap: 1rem; } }
        @media (min-width: 900px) {
          .d-quick-grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        }

        .d-quick-card {
          padding: 1.25rem; border-radius: 20px;
          cursor: pointer; position: relative; overflow: hidden;
          text-align: center;
        }
        .d-quick-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.25);
        }
        .d-quick-card:active { transform: translateY(-1px) scale(0.98); }

        .d-quick-icon-wrap {
          width: 52px; height: 52px; border-radius: 16px;
          margin: 0 auto 12px;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.3s ease;
        }
        .d-quick-card:hover .d-quick-icon-wrap { transform: scale(1.1) rotate(3deg); }

        .d-quick-label {
          font-weight: 700; font-size: clamp(0.8rem, 2vw, 0.9rem);
          margin: 0 0 4px; color: #F1F5F9;
        }
        .d-quick-desc {
          font-size: 0.7rem; color: rgba(255,255,255,0.3);
          margin: 0; display: none;
        }
        @media (min-width: 768px) {
          .d-quick-card { padding: 1.5rem; }
          .d-quick-icon-wrap { width: 58px; height: 58px; }
          .d-quick-desc { display: block; }
        }

        .d-quick-arrow {
          position: absolute; bottom: 10px; right: 10px;
          opacity: 0; transform: translateX(-4px);
          transition: all 0.25s ease;
          color: rgba(255,255,255,0.2);
        }
        .d-quick-card:hover .d-quick-arrow { opacity: 1; transform: translateX(0); }

        /* ══ ANIMATION HELPERS ══ */
        .d-anim {
          animation: d-fadeUp 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes d-fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .d-delay-1 { animation-delay: 0.05s; }
        .d-delay-2 { animation-delay: 0.1s; }
        .d-delay-3 { animation-delay: 0.15s; }
        .d-delay-4 { animation-delay: 0.2s; }
        .d-delay-5 { animation-delay: 0.25s; }
        .d-delay-6 { animation-delay: 0.3s; }
        .d-delay-7 { animation-delay: 0.35s; }

        /* ══ SCROLLBAR ══ */
        .d-root::-webkit-scrollbar { width: 4px; }
        .d-root::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
      `}</style>

      <div className="d-root">

        {/* ════════════════════ HERO ════════════════════ */}
        <div className="d-hero d-anim d-delay-1">
          <div className="d-hero-content">
            <div className="d-hero-greeting">
              <Sparkles size={14} />
              {getGreeting()}
            </div>
            <h1>
              Welcome back, <span>{userName}</span> {getEmoji()}
            </h1>
            <div className="d-hero-date">
              <Clock size={14} />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </div>
            <div className="d-hero-quote">
              <Sparkles size={16} className="d-hero-quote-icon" />
              <span>{todayQuote}</span>
            </div>
          </div>
        </div>

        {/* ════════════════════ OVERVIEW CARDS ════════════════════ */}
        <div className="d-overview d-anim d-delay-2">
          {/* CGPA Card */}
          <div className="d-glass d-overview-card" style={{ borderColor: 'rgba(96,165,250,0.1)' }}>
            <div className="d-overview-info">
              <p className="d-overview-title">Current CGPA</p>
              <h2 className="d-overview-value" style={{ color: '#60A5FA' }}>
                {currentCGPA}
              </h2>
              <p className="d-overview-sub">
                <BarChart3 size={13} />
                {cgpaSubjects.length} subjects graded
              </p>
            </div>
            <CircularProgress value={parseFloat(currentCGPA)} max={10} size={80} strokeWidth={6} color="#60A5FA">
              <Award size={22} color="#60A5FA" />
            </CircularProgress>
          </div>

          {/* Attendance Card */}
          <div className="d-glass d-overview-card" style={{ borderColor: `${attendanceStatus === 'Safe' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'}` }}>
            <div className="d-overview-info">
              <p className="d-overview-title">Attendance</p>
              <h2 className="d-overview-value" style={{ color: attendanceStatus === 'Safe' ? '#34D399' : '#F87171' }}>
                {currentAttendance}%
              </h2>
              <p className="d-overview-sub">
                <Target size={13} />
                Status: <span style={{
                  color: attendanceStatus === 'Safe' ? '#34D399' : '#F87171',
                  fontWeight: 700, marginLeft: '2px',
                }}>{attendanceStatus}</span>
              </p>
            </div>
            <CircularProgress
              value={parseFloat(currentAttendance)} max={100} size={80} strokeWidth={6}
              color={attendanceStatus === 'Safe' ? '#34D399' : '#F87171'}
            >
              <span style={{
                fontSize: '1.1rem', fontWeight: 800,
                color: attendanceStatus === 'Safe' ? '#34D399' : '#F87171',
              }}>
                {currentAttendance}%
              </span>
            </CircularProgress>
          </div>
        </div>

        {/* ════════════════════ MINI STATS ════════════════════ */}
        <div className="d-stats d-anim d-delay-3">
          <div className="d-glass d-stat" style={{ '--stat-color': '#6366F1' }}>
            <div className="d-stat-header">
              <div className="d-stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                <BookOpen size={20} />
              </div>
            </div>
            <h3 className="d-stat-value" style={{ color: '#818CF8' }}>{cgpaSubjects.length}</h3>
            <p className="d-stat-label">Active Subjects</p>
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.06)' }} />
          </div>

          <div className="d-glass d-stat d-glass-clickable" onClick={() => navigate('/faculty')} style={{ '--stat-color': '#F472B6' }}>
            <div className="d-stat-header">
              <div className="d-stat-icon" style={{ background: 'rgba(244,114,182,0.12)', color: '#F472B6' }}>
                <Users size={20} />
              </div>
              <span className="d-stat-badge" style={{ background: 'rgba(244,114,182,0.12)', color: '#F472B6' }}>
                View →
              </span>
            </div>
            <h3 className="d-stat-value" style={{ color: '#F472B6' }}>{faculty.length}+</h3>
            <p className="d-stat-label">Faculty Members</p>
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(244,114,182,0.06)' }} />
          </div>

          <div className="d-glass d-stat">
            <div className="d-stat-header">
              <div className="d-stat-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24' }}>
                <Star size={20} />
              </div>
            </div>
            <h3 className="d-stat-value" style={{ color: '#FBBF24' }}>
              {currentCGPA >= 8 ? 'A+' : currentCGPA >= 6 ? 'B+' : 'C+'}
            </h3>
            <p className="d-stat-label">Performance</p>
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(251,191,36,0.06)' }} />
          </div>

          <div className="d-glass d-stat">
            <div className="d-stat-header">
              <div className="d-stat-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
                <GraduationCap size={20} />
              </div>
            </div>
            <h3 className="d-stat-value" style={{ color: '#34D399' }}>
              {user?.year || '—'}
            </h3>
            <p className="d-stat-label">Current Year</p>
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(52,211,153,0.06)' }} />
          </div>
        </div>

        {/* ════════════════════ ANNOUNCEMENTS ════════════════════ */}
        {updates.length > 0 && (
          <div className="d-announce d-anim d-delay-4">
            <div className="d-glass d-announce-card">
              <div className="d-announce-header">
                <div className="d-announce-header-icon">
                  <Megaphone size={18} color="#FBBF24" />
                </div>
                <div>
                  <h2 className="d-announce-title">Announcements</h2>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                    Latest updates & notices
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {updates.map(update => (
                  <div key={update.id} className="d-announce-item">
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: '8px', marginBottom: '4px',
                    }}>
                      <h4 className="d-announce-item-title">{update.title}</h4>
                      <span className="d-announce-item-time">
                        <Clock size={10} />
                        {timeAgo(update.date)}
                      </span>
                    </div>
                    <p className="d-announce-item-msg">{update.message}</p>
                    {update.link && (
                      <a href={update.link} target="_blank" rel="noreferrer" className="d-announce-link">
                        <ExternalLink size={12} /> Open Resource
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ FACULTY REVIEWS CTA ════════════════════ */}
        <div className="d-reviews d-anim d-delay-5">
          <div className="d-glass d-reviews-card" onClick={() => navigate('/reviews')}>
            <div className="d-reviews-glow" />
            <div className="d-reviews-body">
              <div className="d-reviews-left">
                <div className="d-reviews-icon">
                  <MessageSquare size={24} color="white" />
                </div>
                <div className="d-reviews-text">
                  <h3>Faculty Reviews</h3>
                  <p>Rate professors & read honest feedback</p>
                </div>
              </div>
              <div className="d-reviews-cta">
                Explore <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════ QUICK ACTIONS ════════════════════ */}
        <div className="d-anim d-delay-6">
          <div className="d-quick-header">
            <h2 className="d-quick-title">
              <Zap size={20} color="#FBBF24" />
              Quick Actions
            </h2>
          </div>
          <div className="d-quick-grid">
            {quickActions.map((item, idx) => (
              <div
                key={idx}
                className="d-glass d-quick-card d-glass-clickable"
                onClick={() => navigate(item.path)}
              >
                <div className="d-quick-icon-wrap" style={{ background: item.bg }}>
                  <item.icon size={24} style={{ color: item.gradient.includes('#6366F1') ? '#818CF8' : item.gradient.includes('#3B82F6') ? '#60A5FA' : item.gradient.includes('#10B981') ? '#34D399' : '#F472B6' }} />
                </div>
                <p className="d-quick-label">{item.label}</p>
                <p className="d-quick-desc">{item.desc}</p>
                <ChevronRight size={16} className="d-quick-arrow" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
