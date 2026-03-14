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

/* ── SVG Icons ── */
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const CollegeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

/* ── Ring ── */
const Ring = ({ value, max = 100, size = 72, stroke = 5, color, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(value / max, 1) * c);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
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

  useEffect(() => { setTimeout(() => setReady(true), 30); }, []);

  useEffect(() => {
    const fetch_ = async () => {
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
    fetch_();
  }, []);

  const cgpa = useMemo(() => {
    if (!cgpaSubjects?.length) return 0;
    const gp = { S:10, A:9, B:8, C:7, D:6, E:5, F:0 };
    return (cgpaSubjects.reduce((s, x) => s + (gp[x.grade]||0), 0) / cgpaSubjects.length).toFixed(2);
  }, [cgpaSubjects]);

  const att = useMemo(() => {
    if (!attendanceSubjects?.length) return 0;
    const t = attendanceSubjects.reduce((s, x) => s + Number(x.total||0), 0);
    const a = attendanceSubjects.reduce((s, x) => s + Number(x.attended||0), 0);
    return t ? ((a/t)*100).toFixed(0) : 0;
  }, [attendanceSubjects]);

  const attOk = att >= 80;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  })();

  const emoji = (() => {
    const h = new Date().getHours();
    return h < 12 ? '☀️' : h < 17 ? '🌤️' : '🌙';
  })();

  const quotes = [
    "The future belongs to those who believe in the beauty of their dreams.",
    "Success is not final, failure is not fatal: courage to continue is what counts.",
    "Education is the most powerful weapon to change the world.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "It always seems impossible until it's done.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
  ];
  const todayQuote = quotes[new Date().getDay() % quotes.length];

  const grade = cgpa >= 9 ? 'S' : cgpa >= 8 ? 'A' : cgpa >= 7 ? 'B' : cgpa >= 6 ? 'C' : '–';

  const actions = [
    { label: 'My Courses', desc: 'Enrolled courses', icon: BookOpen, path: '/courses', color: '#818CF8' },
    { label: 'CGPA Calc', desc: 'Calculate GPA', icon: Calculator, path: '/calc', color: '#60A5FA' },
    { label: 'Attendance', desc: 'Track records', icon: Calendar, path: '/attendance', color: '#34D399' },
    { label: 'Faculty', desc: 'Browse directory', icon: Users, path: '/faculty', color: '#F472B6' },
  ];

  const extLinks = [
    {
      label: 'ARMS Portal',
      desc: 'Saveetha academic portal',
      url: 'https://arms.sse.saveetha.com/',
      icon: CollegeIcon,
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.06)',
      border: 'rgba(251,191,36,0.1)',
    },
    {
      label: 'Instagram',
      desc: 'Follow for updates',
      url: 'https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5',
      icon: InstagramIcon,
      color: '#E1306C',
      bg: 'rgba(225,48,108,0.06)',
      border: 'rgba(225,48,108,0.1)',
    },
  ];

  return (
    <DashboardLayout>
      <style>{`
        .d {
          max-width: 1100px; margin: 0 auto;
          opacity: ${ready ? 1 : 0};
          transform: translateY(${ready ? '0' : '12px'});
          transition: opacity 0.5s, transform 0.5s;
        }

        /* ── Glass Card ── */
        .gc {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.045);
          border-radius: 18px;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .gc:hover { border-color: rgba(255,255,255,0.07); }
        .gc-c { cursor: pointer; }
        .gc-c:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .gc-c:active { transform: translateY(0) scale(0.995); }

        /* ═══ HERO ═══ */
        .hero {
          padding: 1.4rem; margin-bottom: 1rem;
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.05), rgba(139,92,246,0.07));
          border-color: rgba(99,102,241,0.08); border-radius: 22px;
        }
        .hero::before {
          content:''; position:absolute; top:-80px; right:-60px;
          width:260px; height:260px;
          background: radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%);
          border-radius:50%; pointer-events:none;
        }
        .hero-z { position: relative; z-index: 1; }
        .hero-sub {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.7rem; color: rgba(255,255,255,0.35);
          font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 5px;
        }
        .hero h1 {
          font-size: clamp(1.3rem, 4.5vw, 1.9rem);
          font-weight: 800; margin: 0; line-height: 1.25; color: #F8FAFC;
        }
        .hero h1 em {
          font-style: normal;
          background: linear-gradient(135deg, #818CF8, #6366F1);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero-date {
          display: flex; align-items: center; gap: 5px;
          color: rgba(255,255,255,0.3); margin-top: 8px;
          font-size: clamp(0.72rem, 2vw, 0.82rem);
        }
        .hero-q {
          margin-top: 1rem; padding: 12px 14px;
          background: rgba(255,255,255,0.025); border-radius: 12px;
          border-left: 3px solid rgba(99,102,241,0.4);
          font-style: italic; color: rgba(255,255,255,0.4);
          font-size: clamp(0.72rem, 2vw, 0.82rem); line-height: 1.6;
          display: flex; gap: 8px; align-items: flex-start;
        }
        @media (min-width: 768px) { .hero { padding: 2rem 2.2rem; margin-bottom: 1.25rem; } }

        /* ═══ OVERVIEW ═══ */
        .ov-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 0.65rem; margin-bottom: 1rem;
        }
        @media (min-width: 600px) { .ov-grid { grid-template-columns: 1fr 1fr; gap: 0.85rem; } }
        @media (min-width: 768px) { .ov-grid { gap: 1rem; margin-bottom: 1.25rem; } }

        .ov {
          padding: 1.3rem; border-radius: 18px;
          display: flex; align-items: center; gap: 16px;
        }
        .ov-info { flex: 1; }
        .ov-lbl {
          font-size: 0.68rem; font-weight: 600;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase; letter-spacing: 0.7px; margin: 0 0 4px;
        }
        .ov-val {
          font-size: clamp(1.8rem, 5.5vw, 2.4rem);
          font-weight: 900; margin: 0; line-height: 1;
        }
        .ov-sub {
          font-size: 0.72rem; color: rgba(255,255,255,0.28);
          margin: 6px 0 0; display: flex; align-items: center; gap: 4px;
        }
        @media (min-width: 768px) { .ov { padding: 1.6rem; } }

        /* ═══ MINI STATS ═══ */
        .st-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 0.65rem; margin-bottom: 1rem;
        }
        @media (min-width: 600px) { .st-grid { gap: 0.85rem; } }
        @media (min-width: 900px) { .st-grid { grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; } }

        .st {
          padding: 1.1rem; border-radius: 18px;
          position: relative; overflow: hidden;
        }
        .st-ico {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
        }
        .st-v {
          font-size: clamp(1.4rem, 4vw, 1.7rem);
          font-weight: 800; line-height: 1; margin: 0;
        }
        .st-l {
          font-size: clamp(0.65rem, 1.8vw, 0.72rem);
          color: rgba(255,255,255,0.3); margin: 5px 0 0; font-weight: 500;
        }
        .st-tag {
          position: absolute; top: 10px; right: 10px;
          font-size: 0.55rem; font-weight: 700; padding: 2px 7px;
          border-radius: 6px; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .st-blob {
          position: absolute; bottom: -18px; right: -18px;
          width: 60px; height: 60px; border-radius: 50%;
          opacity: 0.04; pointer-events: none;
        }
        @media (min-width: 768px) {
          .st { padding: 1.3rem; }
          .st-ico { width: 42px; height: 42px; }
        }

        /* ═══ ANNOUNCEMENTS ═══ */
        .ann { margin-bottom: 1rem; }
        .ann-c { padding: 1.1rem; border-color: rgba(251,191,36,0.06); border-radius: 18px; }
        .ann-h { display: flex; align-items: center; gap: 8px; margin-bottom: 0.85rem; }
        .ann-h-ico {
          width: 32px; height: 32px; border-radius: 9px;
          background: rgba(251,191,36,0.08);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ann-i {
          padding: 12px; background: rgba(255,255,255,0.02);
          border-radius: 12px; border-left: 3px solid rgba(251,191,36,0.35);
          transition: background 0.2s;
        }
        .ann-i:hover { background: rgba(255,255,255,0.035); }
        .ann-lnk {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 6px; font-size: 0.72rem; font-weight: 600;
          color: #818CF8; text-decoration: none;
          background: rgba(99,102,241,0.05); padding: 3px 8px;
          border-radius: 6px; transition: background 0.2s;
        }
        .ann-lnk:hover { background: rgba(99,102,241,0.1); }
        @media (min-width: 768px) { .ann-c { padding: 1.3rem; } .ann { margin-bottom: 1.25rem; } }

        /* ═══ REVIEWS CTA ═══ */
        .rev { margin-bottom: 1rem; }
        .rev-c {
          padding: 1.3rem; border-radius: 18px; cursor: pointer;
          position: relative; overflow: hidden;
          border-color: rgba(236,72,153,0.06);
        }
        .rev-c:hover { border-color: rgba(236,72,153,0.15); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(236,72,153,0.05); }
        .rev-glow {
          position: absolute; top: -50%; right: -15%;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(236,72,153,0.06), transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .rev-body {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 14px;
          position: relative; z-index: 1;
        }
        .rev-left { display: flex; gap: 12px; align-items: center; }
        .rev-ico {
          width: 46px; height: 46px; flex-shrink: 0;
          background: linear-gradient(135deg, #EC4899, #BE185D);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
        }
        .rev-cta {
          display: flex; align-items: center; gap: 5px;
          font-weight: 700; font-size: 0.78rem;
          background: rgba(236,72,153,0.06); color: #F472B6;
          padding: 8px 16px; border-radius: 20px; white-space: nowrap;
        }
        .rev-c:hover .rev-cta { background: rgba(236,72,153,0.12); }
        @media (min-width: 768px) { .rev-c { padding: 1.6rem; } .rev { margin-bottom: 1.25rem; } }

        /* ═══ QUICK ACTIONS ═══ */
        .qa-t {
          font-size: clamp(1rem, 3vw, 1.15rem);
          font-weight: 700; margin: 0 0 0.85rem;
          display: flex; align-items: center; gap: 7px;
        }
        .qa-g {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 0.65rem; margin-bottom: 1rem;
        }
        @media (min-width: 600px) { .qa-g { gap: 0.85rem; } }
        @media (min-width: 900px) { .qa-g { grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; } }

        .qa {
          padding: 1.1rem; border-radius: 18px; cursor: pointer;
          text-align: center; position: relative; overflow: hidden;
        }
        .qa:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }
        .qa:active { transform: translateY(-1px) scale(0.98); }
        .qa-ico {
          width: 46px; height: 46px; border-radius: 13px;
          margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s;
        }
        .qa:hover .qa-ico { transform: scale(1.08) rotate(2deg); }
        .qa-lb { font-weight: 700; font-size: clamp(0.75rem, 2vw, 0.85rem); margin: 0 0 2px; color: #F1F5F9; }
        .qa-ds { font-size: 0.64rem; color: rgba(255,255,255,0.22); margin: 0; display: none; }
        @media (min-width: 768px) { .qa { padding: 1.3rem; } .qa-ds { display: block; } .qa-ico { width: 52px; height: 52px; } }
        .qa-ar {
          position: absolute; bottom: 8px; right: 8px;
          opacity: 0; transform: translateX(-3px);
          transition: all 0.2s; color: rgba(255,255,255,0.12);
        }
        .qa:hover .qa-ar { opacity: 1; transform: translateX(0); }

        /* ═══ EXTERNAL LINKS ═══ */
        .ext-t {
          font-size: clamp(1rem, 3vw, 1.15rem);
          font-weight: 700; margin: 0 0 0.85rem;
          display: flex; align-items: center; gap: 7px;
        }
        .ext-g {
          display: grid; grid-template-columns: 1fr;
          gap: 0.65rem; padding-bottom: 2rem;
        }
        @media (min-width: 600px) { .ext-g { grid-template-columns: 1fr 1fr; gap: 0.85rem; } }

        .ext {
          padding: 1.1rem; border-radius: 18px; cursor: pointer;
          display: flex; align-items: center; gap: 14px;
          text-decoration: none;
        }
        .ext:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .ext:active { transform: scale(0.98); }
        .ext-ico {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ext-info { flex: 1; min-width: 0; }
        .ext-lb { font-weight: 700; font-size: 0.85rem; margin: 0 0 2px; color: #F1F5F9; }
        .ext-ds { font-size: 0.68rem; color: rgba(255,255,255,0.3); margin: 0; }
        .ext-arrow { flex-shrink: 0; color: rgba(255,255,255,0.15); transition: all 0.2s; }
        .ext:hover .ext-arrow { color: rgba(255,255,255,0.4); transform: translateX(2px); }
        @media (min-width: 768px) { .ext { padding: 1.3rem; } .ext-ico { width: 48px; height: 48px; } }

        /* ═══ ANIMATION ═══ */
        .an { animation: fu 0.45s ease forwards; opacity: 0; }
        @keyframes fu { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .dl1{animation-delay:.04s} .dl2{animation-delay:.08s}
        .dl3{animation-delay:.12s} .dl4{animation-delay:.16s}
        .dl5{animation-delay:.2s} .dl6{animation-delay:.24s}
        .dl7{animation-delay:.28s}
      `}</style>

      <div className="d">

        {/* ═══ HERO ═══ */}
        <div className="gc hero an dl1">
          <div className="hero-z">
            <div className="hero-sub"><Sparkles size={12} /> {greeting}</div>
            <h1>Welcome back, <em>{firstName}</em> {emoji}</h1>
            <div className="hero-date">
              <Clock size={12} />
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
            </div>
            <div className="hero-q">
              <Sparkles size={14} style={{ flexShrink:0, color:'#6366F1', opacity:0.4, marginTop:1 }} />
              <span>{todayQuote}</span>
            </div>
          </div>
        </div>

        {/* ═══ OVERVIEW ═══ */}
        <div className="ov-grid an dl2">
          <div className="gc ov" style={{ borderColor: 'rgba(96,165,250,0.06)' }}>
            <div className="ov-info">
              <p className="ov-lbl">Current CGPA</p>
              <h2 className="ov-val" style={{ color: '#60A5FA' }}>{cgpa}</h2>
              <p className="ov-sub"><BarChart3 size={12} /> {cgpaSubjects.length} subjects</p>
            </div>
            <Ring value={parseFloat(cgpa)} max={10} color="#60A5FA">
              <Award size={18} color="#60A5FA" />
            </Ring>
          </div>
          <div className="gc ov" style={{ borderColor: attOk ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)' }}>
            <div className="ov-info">
              <p className="ov-lbl">Attendance</p>
              <h2 className="ov-val" style={{ color: attOk ? '#34D399' : '#F87171' }}>{att}%</h2>
              <p className="ov-sub">
                <Target size={12} /> Status:
                <span style={{ color: attOk ? '#34D399' : '#F87171', fontWeight:700, marginLeft:3 }}>
                  {attOk ? 'Safe' : 'Low'}
                </span>
              </p>
            </div>
            <Ring value={parseFloat(att)} max={100} color={attOk ? '#34D399' : '#F87171'}>
              <span style={{ fontSize:'0.95rem', fontWeight:800, color: attOk ? '#34D399' : '#F87171' }}>{att}%</span>
            </Ring>
          </div>
        </div>

        {/* ═══ MINI STATS ═══ */}
        <div className="st-grid an dl3">
          <div className="gc st">
            <div className="st-ico" style={{ background:'rgba(129,140,248,0.08)', color:'#818CF8' }}><BookOpen size={18} /></div>
            <h3 className="st-v" style={{ color:'#818CF8' }}>{cgpaSubjects.length}</h3>
            <p className="st-l">Active Subjects</p>
            <div className="st-blob" style={{ background:'#818CF8' }} />
          </div>
          <div className="gc st gc-c" onClick={() => navigate('/faculty')}>
            <div className="st-ico" style={{ background:'rgba(244,114,182,0.08)', color:'#F472B6' }}><Users size={18} /></div>
            <span className="st-tag" style={{ background:'rgba(244,114,182,0.08)', color:'#F472B6' }}>View →</span>
            <h3 className="st-v" style={{ color:'#F472B6' }}>{faculty.length}+</h3>
            <p className="st-l">Faculty</p>
            <div className="st-blob" style={{ background:'#F472B6' }} />
          </div>
          <div className="gc st">
            <div className="st-ico" style={{ background:'rgba(251,191,36,0.08)', color:'#FBBF24' }}><Star size={18} /></div>
            <h3 className="st-v" style={{ color:'#FBBF24' }}>{grade}</h3>
            <p className="st-l">Grade</p>
            <div className="st-blob" style={{ background:'#FBBF24' }} />
          </div>
          <div className="gc st">
            <div className="st-ico" style={{ background:'rgba(52,211,153,0.08)', color:'#34D399' }}><GraduationCap size={18} /></div>
            <h3 className="st-v" style={{ color:'#34D399' }}>{user?.year || '—'}</h3>
            <p className="st-l">Year</p>
            <div className="st-blob" style={{ background:'#34D399' }} />
          </div>
        </div>

        {/* ═══ ANNOUNCEMENTS ═══ */}
        {updates.length > 0 && (
          <div className="ann an dl4">
            <div className="gc ann-c">
              <div className="ann-h">
                <div className="ann-h-ico"><Megaphone size={15} color="#FBBF24" /></div>
                <div>
                  <h2 style={{ fontSize:'clamp(0.9rem,3vw,1.05rem)', fontWeight:700, margin:0 }}>Announcements</h2>
                  <p style={{ margin:0, fontSize:'0.62rem', color:'rgba(255,255,255,0.2)' }}>Latest updates</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {updates.map(u => (
                  <div key={u.id} className="ann-i">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                      <h4 style={{ fontWeight:700, fontSize:'0.82rem', margin:0, color:'#F1F5F9', flex:1, lineHeight:1.4 }}>{u.title}</h4>
                      <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', gap:3, whiteSpace:'nowrap' }}>
                        <Clock size={9} /> {timeAgo(u.date)}
                      </span>
                    </div>
                    <p style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.38)', margin:'3px 0 0', lineHeight:1.5 }}>{u.message}</p>
                    {u.link && (
                      <a href={u.link} target="_blank" rel="noreferrer" className="ann-lnk">
                        <ExternalLink size={10} /> Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ REVIEWS CTA ═══ */}
        <div className="rev an dl5">
          <div className="gc rev-c" onClick={() => navigate('/reviews')}>
            <div className="rev-glow" />
            <div className="rev-body">
              <div className="rev-left">
                <div className="rev-ico"><MessageSquare size={22} color="white" /></div>
                <div>
                  <h3 style={{ fontSize:'clamp(0.95rem,3vw,1.12rem)', fontWeight:700, margin:'0 0 3px' }}>Faculty Reviews</h3>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'clamp(0.7rem,2vw,0.8rem)', margin:0 }}>Rate & read honest feedback</p>
                </div>
              </div>
              <div className="rev-cta">Explore <ArrowRight size={15} /></div>
            </div>
          </div>
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <div className="an dl6">
          <h2 className="qa-t"><Zap size={16} color="#FBBF24" /> Quick Actions</h2>
          <div className="qa-g">
            {actions.map((a, i) => (
              <div key={i} className="gc qa gc-c" onClick={() => navigate(a.path)}>
                <div className="qa-ico" style={{ background: `${a.color}12` }}>
                  <a.icon size={20} color={a.color} />
                </div>
                <p className="qa-lb">{a.label}</p>
                <p className="qa-ds">{a.desc}</p>
                <ChevronRight size={14} className="qa-ar" />
              </div>
            ))}
          </div>
        </div>

        {/* ═══ EXTERNAL LINKS (Instagram + ARMS) ═══ */}
        <div className="an dl7">
          <h2 className="ext-t"><ExternalLink size={16} color="#818CF8" /> Quick Links</h2>
          <div className="ext-g">
            {extLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="gc ext gc-c" style={{ borderColor: link.border }}>
                <div className="ext-ico" style={{ background: link.bg, color: link.color }}>
                  <link.icon size={22} />
                </div>
                <div className="ext-info">
                  <p className="ext-lb">{link.label}</p>
                  <p className="ext-ds">{link.desc}</p>
                </div>
                <ArrowRight size={16} className="ext-arrow" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
