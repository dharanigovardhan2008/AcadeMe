import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, Calendar, Users, BookOpen,
  TrendingUp, MessageSquare, ArrowRight,
  Megaphone, ExternalLink, ChevronRight,
  Award, Clock, Zap, Star, Target,
  GraduationCap, Sparkles, BarChart3,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

/* ── Cache (unchanged) ── */
const CACHE_DURATION = 300000;
const getFromCache = (key) => {
  try {
    const c = sessionStorage.getItem(key);
    const t = sessionStorage.getItem(`${key}_time`);
    if (!c || !t) return null;
    if (Date.now() - parseInt(t, 10) > CACHE_DURATION) {
      sessionStorage.removeItem(key); sessionStorage.removeItem(`${key}_time`);
      return null;
    }
    return JSON.parse(c);
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

/* ── Circular Progress ── */
const Ring = ({ value, max = 100, size = 76, stroke = 5, color, children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((value / max) * 100, 100);
  const off = circ - (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
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

/* ══════════ DASHBOARD ══════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData() || {};
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 50); }, []);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const cached = getFromCache('dashboard_updates');
        if (cached) setUpdates(cached);
        const q = query(collection(db, 'updates'), orderBy('date', 'desc'), limit(3));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        saveToCache('dashboard_updates', list);
        setUpdates(list);
      } catch (err) { console.error('Updates Error:', err); }
    };
    fetchUpdates();
  }, []);

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

  const attStatus = currentAttendance >= 80 ? 'Safe' : 'Low';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const emoji = (() => {
    const h = new Date().getHours();
    if (h < 12) return '☀️';
    if (h < 17) return '🌤️';
    return '🌙';
  })();

  const quotes = [
    "The future belongs to those who believe in the beauty of their dreams.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "It always seems impossible until it's done.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
  ];
  const todayQuote = quotes[new Date().getDay() % quotes.length];

  const actions = [
    { label: 'My Courses', desc: 'Enrolled courses', icon: BookOpen, path: '/courses', color: '#818CF8' },
    { label: 'CGPA Calc', desc: 'Calculate GPA', icon: Calculator, path: '/calc', color: '#60A5FA' },
    { label: 'Attendance', desc: 'Track records', icon: Calendar, path: '/attendance', color: '#34D399' },
    { label: 'Faculty', desc: 'Directory', icon: Users, path: '/faculty', color: '#F472B6' },
  ];

  const perfGrade = currentCGPA >= 9 ? 'S' : currentCGPA >= 8 ? 'A' : currentCGPA >= 7 ? 'B' : currentCGPA >= 6 ? 'C' : '–';

  return (
    <DashboardLayout>
      <style>{`
        /* ══ SHARED DESIGN TOKENS ══
           Matches TopBar exactly:
           - rgba(10,10,22) base
           - rgba(255,255,255,0.05) borders
           - 20px border-radius
           - #6366F1 / #818CF8 primary
           - Same glassmorphism
        ══════════════════════════ */

        .dash {
          max-width: 1200px; margin: 0 auto;
          opacity: ${ready ? 1 : 0};
          transform: translateY(${ready ? '0' : '14px'});
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        /* ── Glass Card ── */
        .g {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .g:hover { border-color: rgba(255,255,255,0.08); }
        .g-click { cursor: pointer; }
        .g-click:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 40px rgba(0,0,0,0.25);
        }
        .g-click:active { transform: translateY(-1px) scale(0.995); }

        /* ══ HERO ══ */
        .hero {
          padding: 1.5rem; margin-bottom: 1.25rem;
          position: relative; overflow: hidden;
          background: linear-gradient(135deg,
            rgba(99,102,241,0.12), rgba(59,130,246,0.06), rgba(139,92,246,0.08));
          border-color: rgba(99,102,241,0.1);
          border-radius: 24px;
        }
        .hero::before {
          content: ''; position: absolute; top: -100px; right: -80px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .hero::after {
          content: ''; position: absolute; bottom: -60px; left: -40px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .hero-inner { position: relative; z-index: 1; }
        .hero-sub {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: rgba(255,255,255,0.4);
          font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px;
          margin-bottom: 6px;
        }
        .hero h1 {
          font-size: clamp(1.4rem, 5vw, 2.1rem);
          font-weight: 800; margin: 0; line-height: 1.25; color: #F8FAFC;
        }
        .hero h1 em {
          font-style: normal;
          background: linear-gradient(135deg, #818CF8, #6366F1);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-date {
          display: flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.35); margin-top: 10px;
          font-size: clamp(0.75rem, 2vw, 0.85rem);
        }
        .hero-quote {
          margin-top: 1.25rem; padding: 14px 16px;
          background: rgba(255,255,255,0.03); border-radius: 14px;
          border-left: 3px solid #6366F1;
          font-style: italic; color: rgba(255,255,255,0.5);
          font-size: clamp(0.76rem, 2vw, 0.86rem); line-height: 1.6;
          display: flex; align-items: flex-start; gap: 10px;
        }
        @media (min-width: 768px) { .hero { padding: 2.5rem; } }

        /* ══ OVERVIEW (CGPA + Attendance) ══ */
        .overview {
          display: grid; grid-template-columns: 1fr;
          gap: 0.75rem; margin-bottom: 1.25rem;
        }
        @media (min-width: 640px) { .overview { grid-template-columns: 1fr 1fr; gap: 1rem; } }
        @media (min-width: 768px) { .overview { gap: 1.25rem; margin-bottom: 1.5rem; } }

        .ov-card {
          padding: 1.5rem; border-radius: 20px;
          display: flex; align-items: center; gap: 20px;
          position: relative; overflow: hidden;
        }
        .ov-card::before {
          content: ''; position: absolute; bottom: -40px; right: -40px;
          width: 120px; height: 120px; border-radius: 50%;
          opacity: 0.04; pointer-events: none;
        }
        .ov-info { flex: 1; min-width: 0; }
        .ov-label {
          font-size: 0.72rem; font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase; letter-spacing: 0.8px;
          margin: 0 0 6px;
        }
        .ov-value {
          font-size: clamp(2rem, 6vw, 2.6rem);
          font-weight: 900; margin: 0; line-height: 1;
        }
        .ov-sub {
          font-size: 0.76rem; color: rgba(255,255,255,0.3);
          margin: 8px 0 0; display: flex; align-items: center; gap: 5px;
        }
        @media (min-width: 768px) { .ov-card { padding: 2rem; } }

        /* ══ MINI STATS ══ */
        .stats {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem; margin-bottom: 1.25rem;
        }
        @media (min-width: 640px) { .stats { gap: 1rem; } }
        @media (min-width: 900px) {
          .stats { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
        }

        .stat {
          padding: 1.2rem; position: relative; overflow: hidden; border-radius: 20px;
        }
        .stat-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
        }
        .stat-val {
          font-size: clamp(1.5rem, 4vw, 1.9rem);
          font-weight: 800; line-height: 1; margin: 0;
        }
        .stat-lbl {
          font-size: clamp(0.68rem, 1.8vw, 0.76rem);
          color: rgba(255,255,255,0.35); margin: 6px 0 0; font-weight: 500;
        }
        .stat-badge {
          position: absolute; top: 12px; right: 12px;
          font-size: 0.58rem; font-weight: 700;
          padding: 3px 8px; border-radius: 8px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .stat-blob {
          position: absolute; bottom: -20px; right: -20px;
          width: 70px; height: 70px; border-radius: 50%;
          opacity: 0.05; pointer-events: none;
        }
        @media (min-width: 768px) {
          .stat { padding: 1.4rem; }
          .stat-icon { width: 44px; height: 44px; }
        }

        /* ══ ANNOUNCEMENTS ══ */
        .ann { margin-bottom: 1.25rem; }
        .ann-card {
          padding: 1.25rem; border-radius: 20px;
          border-color: rgba(251,191,36,0.08);
        }
        .ann-head {
          display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;
        }
        .ann-head-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(251,191,36,0.1);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ann-item {
          padding: 14px; background: rgba(255,255,255,0.025);
          border-radius: 14px; border-left: 3px solid rgba(251,191,36,0.4);
          transition: background 0.2s;
        }
        .ann-item:hover { background: rgba(255,255,255,0.04); }
        .ann-link {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 8px; font-size: 0.76rem; font-weight: 600;
          color: #818CF8; text-decoration: none;
          background: rgba(99,102,241,0.06); padding: 4px 10px;
          border-radius: 8px; transition: background 0.2s;
        }
        .ann-link:hover { background: rgba(99,102,241,0.12); }
        @media (min-width: 768px) {
          .ann-card { padding: 1.5rem; } .ann { margin-bottom: 1.5rem; }
        }

        /* ══ REVIEWS CTA ══ */
        .rev { margin-bottom: 1.25rem; }
        .rev-card {
          padding: 1.5rem; border-radius: 20px; cursor: pointer;
          position: relative; overflow: hidden;
          border-color: rgba(236,72,153,0.08);
        }
        .rev-card:hover {
          border-color: rgba(236,72,153,0.2);
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(236,72,153,0.06);
        }
        .rev-glow {
          position: absolute; top: -60%; right: -20%;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(236,72,153,0.07), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .rev-body {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 16px;
          position: relative; z-index: 1;
        }
        .rev-left { display: flex; gap: 14px; align-items: center; }
        .rev-icon {
          width: 50px; height: 50px; flex-shrink: 0;
          background: linear-gradient(135deg, #EC4899, #BE185D);
          border-radius: 16px; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(236,72,153,0.15);
        }
        .rev-cta {
          display: flex; align-items: center; gap: 6px;
          font-weight: 700; font-size: 0.82rem;
          background: rgba(236,72,153,0.08); color: #F472B6;
          padding: 10px 18px; border-radius: 24px; white-space: nowrap;
          transition: background 0.2s;
        }
        .rev-card:hover .rev-cta { background: rgba(236,72,153,0.15); }
        @media (min-width: 768px) {
          .rev-card { padding: 2rem; }
          .rev-icon { width: 56px; height: 56px; }
          .rev { margin-bottom: 1.5rem; }
        }

        /* ══ QUICK ACTIONS ══ */
        .qa-title {
          font-size: clamp(1.05rem, 3vw, 1.25rem);
          font-weight: 700; margin: 0 0 1rem;
          display: flex; align-items: center; gap: 8px;
        }
        .qa-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem; padding-bottom: 2rem;
        }
        @media (min-width: 640px) { .qa-grid { gap: 1rem; } }
        @media (min-width: 900px) { .qa-grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; } }

        .qa-card {
          padding: 1.25rem; border-radius: 20px; cursor: pointer;
          text-align: center; position: relative; overflow: hidden;
        }
        .qa-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.2);
        }
        .qa-card:active { transform: translateY(-1px) scale(0.98); }

        .qa-icon {
          width: 50px; height: 50px; border-radius: 14px;
          margin: 0 auto 12px;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.3s ease;
        }
        .qa-card:hover .qa-icon { transform: scale(1.1) rotate(3deg); }

        .qa-label {
          font-weight: 700; font-size: clamp(0.78rem, 2vw, 0.88rem);
          margin: 0 0 3px; color: #F1F5F9;
        }
        .qa-desc {
          font-size: 0.68rem; color: rgba(255,255,255,0.25);
          margin: 0; display: none;
        }
        @media (min-width: 768px) {
          .qa-card { padding: 1.5rem; }
          .qa-icon { width: 56px; height: 56px; }
          .qa-desc { display: block; }
        }

        .qa-arrow {
          position: absolute; bottom: 10px; right: 10px;
          opacity: 0; transform: translateX(-4px);
          transition: all 0.25s; color: rgba(255,255,255,0.15);
        }
        .qa-card:hover .qa-arrow { opacity: 1; transform: translateX(0); }

        /* ══ ANIMATIONS ══ */
        .anim { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.1s; }
        .d3 { animation-delay: 0.15s; }
        .d4 { animation-delay: 0.2s; }
        .d5 { animation-delay: 0.25s; }
        .d6 { animation-delay: 0.3s; }
      `}</style>

      <div className="dash">

        {/* ═══════ HERO ═══════ */}
        <div className="g hero anim d1">
          <div className="hero-inner">
            <div className="hero-sub">
              <Sparkles size={13} /> {greeting}
            </div>
            <h1>Welcome back, <em>{firstName}</em> {emoji}</h1>
            <div className="hero-date">
              <Clock size={13} />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </div>
            <div className="hero-quote">
              <Sparkles size={15} style={{ flexShrink: 0, color: '#6366F1', opacity: 0.5, marginTop: 2 }} />
              <span>{todayQuote}</span>
            </div>
          </div>
        </div>

        {/* ═══════ OVERVIEW (CGPA + Attendance) ═══════ */}
        <div className="overview anim d2">
          <div className="g ov-card" style={{ borderColor: 'rgba(96,165,250,0.08)' }}>
            <div className="ov-info">
              <p className="ov-label">Current CGPA</p>
              <h2 className="ov-value" style={{ color: '#60A5FA' }}>{currentCGPA}</h2>
              <p className="ov-sub"><BarChart3 size={13} /> {cgpaSubjects.length} subjects graded</p>
            </div>
            <Ring value={parseFloat(currentCGPA)} max={10} color="#60A5FA">
              <Award size={20} color="#60A5FA" />
            </Ring>
          </div>

          <div className="g ov-card" style={{
            borderColor: attStatus === 'Safe' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
          }}>
            <div className="ov-info">
              <p className="ov-label">Attendance</p>
              <h2 className="ov-value" style={{ color: attStatus === 'Safe' ? '#34D399' : '#F87171' }}>
                {currentAttendance}%
              </h2>
              <p className="ov-sub">
                <Target size={13} /> Status:
                <span style={{ color: attStatus === 'Safe' ? '#34D399' : '#F87171', fontWeight: 700, marginLeft: 3 }}>
                  {attStatus}
                </span>
              </p>
            </div>
            <Ring value={parseFloat(currentAttendance)} max={100}
              color={attStatus === 'Safe' ? '#34D399' : '#F87171'}>
              <span style={{
                fontSize: '1rem', fontWeight: 800,
                color: attStatus === 'Safe' ? '#34D399' : '#F87171',
              }}>
                {currentAttendance}%
              </span>
            </Ring>
          </div>
        </div>

        {/* ═══════ MINI STATS ═══════ */}
        <div className="stats anim d3">
          <div className="g stat">
            <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.1)', color: '#818CF8' }}>
              <BookOpen size={19} />
            </div>
            <h3 className="stat-val" style={{ color: '#818CF8' }}>{cgpaSubjects.length}</h3>
            <p className="stat-lbl">Active Subjects</p>
            <div className="stat-blob" style={{ background: '#818CF8' }} />
          </div>

          <div className="g stat g-click" onClick={() => navigate('/faculty')}>
            <div className="stat-icon" style={{ background: 'rgba(244,114,182,0.1)', color: '#F472B6' }}>
              <Users size={19} />
            </div>
            <span className="stat-badge" style={{ background: 'rgba(244,114,182,0.1)', color: '#F472B6' }}>
              View →
            </span>
            <h3 className="stat-val" style={{ color: '#F472B6' }}>{faculty.length}+</h3>
            <p className="stat-lbl">Faculty Members</p>
            <div className="stat-blob" style={{ background: '#F472B6' }} />
          </div>

          <div className="g stat">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24' }}>
              <Star size={19} />
            </div>
            <h3 className="stat-val" style={{ color: '#FBBF24' }}>{perfGrade}</h3>
            <p className="stat-lbl">Performance</p>
            <div className="stat-blob" style={{ background: '#FBBF24' }} />
          </div>

          <div className="g stat">
            <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
              <GraduationCap size={19} />
            </div>
            <h3 className="stat-val" style={{ color: '#34D399' }}>{user?.year || '—'}</h3>
            <p className="stat-lbl">Current Year</p>
            <div className="stat-blob" style={{ background: '#34D399' }} />
          </div>
        </div>

        {/* ═══════ ANNOUNCEMENTS ═══════ */}
        {updates.length > 0 && (
          <div className="ann anim d4">
            <div className="g ann-card">
              <div className="ann-head">
                <div className="ann-head-icon"><Megaphone size={17} color="#FBBF24" /></div>
                <div>
                  <h2 style={{ fontSize: 'clamp(0.95rem,3vw,1.1rem)', fontWeight: 700, margin: 0 }}>
                    Announcements
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>
                    Latest updates & notices
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {updates.map(u => (
                  <div key={u.id} className="ann-item">
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap',
                    }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.86rem', margin: 0, color: '#F1F5F9', flex: 1, lineHeight: 1.4 }}>
                        {u.title}
                      </h4>
                      <span style={{
                        fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        <Clock size={10} /> {timeAgo(u.date)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.5 }}>
                      {u.message}
                    </p>
                    {u.link && (
                      <a href={u.link} target="_blank" rel="noreferrer" className="ann-link">
                        <ExternalLink size={11} /> Open Resource
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ REVIEWS CTA ═══════ */}
        <div className="rev anim d5">
          <div className="g rev-card" onClick={() => navigate('/reviews')}>
            <div className="rev-glow" />
            <div className="rev-body">
              <div className="rev-left">
                <div className="rev-icon"><MessageSquare size={24} color="white" /></div>
                <div>
                  <h3 style={{ fontSize: 'clamp(1rem,3vw,1.2rem)', fontWeight: 700, margin: '0 0 4px' }}>
                    Faculty Reviews
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(0.73rem,2vw,0.85rem)', margin: 0 }}>
                    Rate professors & read honest feedback
                  </p>
                </div>
              </div>
              <div className="rev-cta">Explore <ArrowRight size={16} /></div>
            </div>
          </div>
        </div>

        {/* ═══════ QUICK ACTIONS ═══════ */}
        <div className="anim d6">
          <h2 className="qa-title"><Zap size={18} color="#FBBF24" /> Quick Actions</h2>
          <div className="qa-grid">
            {actions.map((a, i) => (
              <div key={i} className="g qa-card g-click" onClick={() => navigate(a.path)}>
                <div className="qa-icon" style={{ background: `${a.color}15` }}>
                  <a.icon size={22} color={a.color} />
                </div>
                <p className="qa-label">{a.label}</p>
                <p className="qa-desc">{a.desc}</p>
                <ChevronRight size={15} className="qa-arrow" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
