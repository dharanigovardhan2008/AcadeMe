import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calculator, Calendar, Users, BookOpen, TrendingUp,
    MessageSquare, ArrowRight, Megaphone, Layers,
    Trophy, Zap, ChevronRight, Star,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL = 300000;
const getCache = (k) => {
    try {
        const v = sessionStorage.getItem(k), t = sessionStorage.getItem(`${k}_t`);
        if (!v || !t || Date.now() - +t > CACHE_TTL) return null;
        return JSON.parse(v);
    } catch { return null; }
};
const setCache = (k, d) => {
    try { sessionStorage.setItem(k, JSON.stringify(d)); sessionStorage.setItem(`${k}_t`, String(Date.now())); } catch {}
};

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter = ({ value, decimals = 0, suffix = '' }) => {
    const [disp, setDisp] = useState(0);
    const num = parseFloat(value) || 0;
    useEffect(() => {
        let t0 = null, dur = 1200;
        const tick = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setDisp(+(num * e).toFixed(decimals));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [num, decimals]);
    return <>{disp.toFixed(decimals)}{suffix}</>;
};

// ── Quotes ────────────────────────────────────────────────────────────────────
const QUOTES = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it's done.",
    "Education is the passport to the future.",
    "Dream big. Work hard. Stay focused.",
];

// ── Main ──────────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user } = useAuth();
    const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData() || {};
    const navigate = useNavigate();
    const [updates, setUpdates] = useState([]);
    const [mounted, setMounted] = useState(false);
    const quote = QUOTES[new Date().getDay() % QUOTES.length];

    useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

    useEffect(() => {
        const fetch = async () => {
            try {
                const hit = getCache('dash_updates');
                if (hit) setUpdates(hit);
                const snap = await getDocs(query(collection(db, 'updates'), orderBy('date', 'desc'), limit(5)));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setCache('dash_updates', list);
                setUpdates(list);
            } catch (e) { console.error(e); }
        };
        fetch();
    }, []);

    // ── Calculations ──────────────────────────────────────────────────────────
    const cgpa = (() => {
        if (!cgpaSubjects?.length) return 0;
        const gp = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
        return +(cgpaSubjects.reduce((s, x) => s + (gp[x.grade] || 0), 0) / cgpaSubjects.length).toFixed(2);
    })();

    const attendance = (() => {
        if (!attendanceSubjects?.length) return 0;
        const tot = attendanceSubjects.reduce((s, x) => s + Number(x.total || 0), 0);
        const att = attendanceSubjects.reduce((s, x) => s + Number(x.attended || 0), 0);
        return tot ? +((att / tot) * 100).toFixed(0) : 0;
    })();

    const attSafe = attendance >= 80;
    const userName = user?.name?.split(' ')[0] || 'Student';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

    const stats = [
        {
            icon: TrendingUp, value: cgpa, label: 'Current CGPA', suffix: '',
            decimals: 2, color: '#60A5FA', glow: 'rgba(96,165,250,0.3)',
            grad: 'linear-gradient(135deg,rgba(96,165,250,0.15),rgba(59,130,246,0.08))',
            bar: cgpa / 10, detail: `${cgpaSubjects.length} subjects`,
        },
        {
            icon: Calendar, value: attendance, label: 'Attendance', suffix: '%',
            decimals: 0, color: attSafe ? '#34D399' : '#F87171',
            glow: attSafe ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)',
            grad: attSafe ? 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.08))' : 'linear-gradient(135deg,rgba(248,113,113,0.15),rgba(239,68,68,0.08))',
            bar: attendance / 100, detail: attSafe ? 'Safe ✓' : 'Below 80% ⚠',
        },
        {
            icon: BookOpen, value: cgpaSubjects.length, label: 'Active Subjects', suffix: '',
            decimals: 0, color: '#A78BFA', glow: 'rgba(167,139,250,0.3)',
            grad: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(124,58,237,0.08))',
            bar: Math.min(cgpaSubjects.length / 10, 1), detail: 'This semester',
        },
        {
            icon: Users, value: faculty.length || 0, label: 'Faculty Members', suffix: '+',
            decimals: 0, color: '#F472B6', glow: 'rgba(244,114,182,0.3)',
            grad: 'linear-gradient(135deg,rgba(244,114,182,0.15),rgba(219,39,119,0.08))',
            bar: 0.7, detail: 'In directory',
            onClick: () => navigate('/faculty'),
        },
    ];

    const quickActions = [
        { label: 'My Courses',       icon: BookOpen,    path: '/courses',    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'   },
        { label: 'CGPA Calculator',  icon: Calculator,  path: '/calc',       color: '#A78BFA', bg: 'rgba(167,139,250,0.12)'  },
        { label: 'Attendance',       icon: Calendar,    path: '/attendance', color: '#34D399', bg: 'rgba(52,211,153,0.12)'   },
        { label: 'Faculty',          icon: Users,       path: '/faculty',    color: '#F472B6', bg: 'rgba(244,114,182,0.12)'  },
        { label: 'Resources Hub',    icon: Layers,      path: '/resources',  color: '#FB923C', bg: 'rgba(251,146,60,0.12)'   },
        { label: 'Leaderboard',      icon: Trophy,      path: '/leaderboard',color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'   },
    ];

    return (
        <DashboardLayout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                * { box-sizing: border-box; }

                @keyframes db-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes db-fade { from{opacity:0} to{opacity:1} }
                @keyframes db-bar  { from{width:0} to{width:var(--w,0%)} }
                @keyframes db-pulse{ 0%,100%{opacity:0.6} 50%{opacity:1} }
                @keyframes db-float{ 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
                @keyframes db-shine{ 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes db-spin { to{transform:rotate(360deg)} }

                .db { font-family:'Plus Jakarta Sans',sans-serif; width:100%; }

                /* ── HERO ── */
                .db-hero {
                    position:relative; overflow:hidden; border-radius:24px;
                    padding:2rem 1.5rem 1.75rem; margin-bottom:1.5rem;
                    background:linear-gradient(135deg,#0d0d2e 0%,#0f172a 45%,#0a0d1f 100%);
                    border:1px solid rgba(148,163,184,0.1);
                    animation: db-up 0.5s ease both;
                }
                .db-hero::before {
                    content:''; position:absolute; top:-60px; right:-60px;
                    width:260px; height:260px; border-radius:50%;
                    background:radial-gradient(circle,rgba(99,102,241,0.18),transparent 65%);
                    pointer-events:none;
                }
                .db-hero::after {
                    content:''; position:absolute; bottom:-40px; left:-20px;
                    width:180px; height:180px; border-radius:50%;
                    background:radial-gradient(circle,rgba(56,189,248,0.1),transparent 65%);
                    pointer-events:none;
                }
                .db-hero-title {
                    font-size:clamp(1.5rem,5vw,2.1rem); font-weight:800; margin:0 0 4px;
                    letter-spacing:-0.5px;
                    background:linear-gradient(135deg,#fff 0%,#94A3B8 100%);
                    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
                }
                .db-hero-date { font-size:0.82rem; color:rgba(148,163,184,0.5); margin:0 0 1rem; }
                .db-quote {
                    padding:0.75rem 1rem; border-left:3px solid rgba(99,102,241,0.6);
                    background:rgba(99,102,241,0.07); border-radius:0 10px 10px 0;
                    font-size:0.82rem; color:rgba(148,163,184,0.7); font-style:italic;
                    line-height:1.55; position:relative; z-index:1;
                }
                .db-hero-icon {
                    position:absolute; right:1.5rem; top:1.5rem;
                    opacity:0.06; pointer-events:none;
                }

                /* ── SECTION LABEL ── */
                .db-section-label {
                    display:flex; align-items:center; gap:8px;
                    font-size:0.78rem; font-weight:700; letter-spacing:0.8px;
                    text-transform:uppercase; color:rgba(148,163,184,0.45);
                    margin-bottom:0.85rem;
                }
                .db-section-label::after {
                    content:''; flex:1; height:1px; background:rgba(148,163,184,0.08);
                }

                /* ── ANNOUNCEMENTS ── */
                .db-announce-wrap { margin-bottom:1.5rem; animation: db-up 0.5s 0.08s ease both; }
                .db-announce-header {
                    position:relative; overflow:hidden; border-radius:18px 18px 0 0;
                    padding:1rem 1.2rem;
                    background:linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.06));
                    border:1px solid rgba(251,191,36,0.2); border-bottom:none;
                    display:flex; align-items:center; gap:10px;
                }
                .db-announce-pulse {
                    width:8px; height:8px; border-radius:50%; background:#FBBF24;
                    box-shadow:0 0 8px #FBBF24; animation:db-pulse 2s ease-in-out infinite;
                    flex-shrink:0;
                }
                .db-announce-list {
                    border-radius:0 0 18px 18px; overflow:hidden;
                    border:1px solid rgba(251,191,36,0.14); border-top:none;
                    background:rgba(15,23,42,0.7);
                }
                .db-announce-item {
                    padding:1rem 1.2rem; border-bottom:1px solid rgba(148,163,184,0.06);
                    display:flex; align-items:flex-start; gap:12px;
                    transition:background 0.2s;
                }
                .db-announce-item:last-child { border-bottom:none; }
                .db-announce-item:hover { background:rgba(251,191,36,0.04); }
                .db-announce-dot {
                    width:6px; height:6px; border-radius:50%; background:#FBBF24;
                    flex-shrink:0; margin-top:6px;
                }

                /* ── STATS GRID ── */
                .db-stats {
                    display:grid;
                    grid-template-columns:repeat(2,1fr);
                    gap:0.85rem; margin-bottom:1.5rem;
                    animation: db-up 0.5s 0.12s ease both;
                }
                @media(min-width:640px) { .db-stats { grid-template-columns:repeat(4,1fr); } }

                .db-stat {
                    position:relative; overflow:hidden; border-radius:18px;
                    padding:1.1rem; cursor:default;
                    background:rgba(15,23,42,0.75);
                    border:1px solid rgba(148,163,184,0.09);
                    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
                }
                .db-stat:hover { transform:translateY(-4px); }
                .db-stat-click { cursor:pointer; }
                .db-stat::after {
                    content:''; position:absolute; inset:0; border-radius:inherit;
                    background:linear-gradient(135deg,rgba(255,255,255,0.03),transparent 60%);
                    pointer-events:none;
                }
                .db-stat-icon {
                    width:38px; height:38px; border-radius:11px;
                    display:flex; align-items:center; justify-content:center;
                    margin-bottom:0.7rem; flex-shrink:0;
                }
                .db-stat-value {
                    font-size:clamp(1.6rem,4vw,2.2rem); font-weight:800; line-height:1;
                    margin:0 0 3px; letter-spacing:-1px;
                }
                .db-stat-label { font-size:0.72rem; color:rgba(148,163,184,0.5); margin:0 0 0.6rem; font-weight:500; }
                .db-stat-bar-track {
                    height:3px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden;
                    margin-top:auto;
                }
                .db-stat-bar { height:100%; border-radius:2px; animation:db-bar 1.2s ease-out both; }
                .db-stat-detail { font-size:0.66rem; font-weight:600; margin-top:5px; }
                .db-stat-glow {
                    position:absolute; top:-20px; right:-20px;
                    width:80px; height:80px; border-radius:50%;
                    pointer-events:none; opacity:0.2;
                }

                /* ── FACULTY REVIEWS BANNER ── */
                .db-reviews {
                    position:relative; overflow:hidden; border-radius:20px;
                    padding:1.4rem 1.2rem; margin-bottom:1.5rem; cursor:pointer;
                    background:linear-gradient(135deg,rgba(15,23,42,0.9),rgba(20,10,40,0.9));
                    border:1px solid rgba(236,72,153,0.25);
                    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
                    animation: db-up 0.5s 0.18s ease both;
                }
                .db-reviews:hover {
                    transform:translateY(-3px);
                    box-shadow:0 12px 40px rgba(236,72,153,0.2);
                    border-color:rgba(236,72,153,0.4);
                }
                .db-reviews-blob {
                    position:absolute; top:-40%; right:-5%;
                    width:240px; height:240px; border-radius:50%;
                    background:radial-gradient(circle,rgba(236,72,153,0.18),transparent 70%);
                    filter:blur(30px); pointer-events:none;
                }

                /* ── QUICK ACTIONS ── */
                .db-actions {
                    display:grid;
                    grid-template-columns:repeat(3,1fr);
                    gap:0.85rem; margin-bottom:1.5rem;
                    animation: db-up 0.5s 0.22s ease both;
                }
                @media(min-width:600px) { .db-actions { grid-template-columns:repeat(6,1fr); } }

                .db-action {
                    display:flex; flex-direction:column; align-items:center;
                    justify-content:center; gap:8px; padding:1rem 0.5rem;
                    border-radius:18px; cursor:pointer;
                    background:rgba(15,23,42,0.75);
                    border:1px solid rgba(148,163,184,0.09);
                    transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    min-height:90px; -webkit-tap-highlight-color:transparent;
                    position:relative; overflow:hidden;
                }
                .db-action::before {
                    content:''; position:absolute; inset:0; opacity:0;
                    background:linear-gradient(135deg,rgba(255,255,255,0.06),transparent);
                    transition:opacity 0.2s;
                }
                .db-action:hover { transform:translateY(-4px); }
                .db-action:hover::before { opacity:1; }
                .db-action:active { transform:scale(0.96); }
                .db-action-icon {
                    width:36px; height:36px; border-radius:11px;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0;
                }
                .db-action-label {
                    font-size:0.65rem; font-weight:700; text-align:center;
                    line-height:1.3; color:rgba(226,232,240,0.8);
                }
            `}</style>

            <div className="db" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.35s ease' }}>

                {/* ── HERO ── */}
                <div className="db-hero">
                    <TrendingUp size={140} className="db-hero-icon" />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 className="db-hero-title">
                            {greeting}, {userName} {greetEmoji}
                        </h1>
                        <p className="db-hero-date">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="db-quote">"{quote}"</div>
                    </div>
                </div>

                {/* ── ANNOUNCEMENTS (first) ── */}
                {updates.length > 0 && (
                    <div className="db-announce-wrap">
                        <div className="db-section-label">
                            <Megaphone size={13} color="#FBBF24" /> Announcements
                        </div>
                        <div>
                            <div className="db-announce-header">
                                <div className="db-announce-pulse" />
                                <Megaphone size={17} color="#FBBF24" />
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FBBF24' }}>
                                    Latest Announcements
                                </span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600,
                                    color: 'rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.1)',
                                    padding: '2px 8px', borderRadius: '10px' }}>
                                    {updates.length} new
                                </span>
                            </div>
                            <div className="db-announce-list">
                                {updates.map((u, idx) => (
                                    <div key={u.id} className="db-announce-item"
                                        style={{ animationDelay: `${idx * 0.05}s`, animation: 'db-up 0.35s ease both' }}>
                                        <div className="db-announce-dot" style={{ marginTop: '7px' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.3 }}>
                                                    {u.title}
                                                </span>
                                                <span style={{ fontSize: '0.67rem', color: 'rgba(148,163,184,0.4)',
                                                    flexShrink: 0, fontWeight: 600 }}>
                                                    {u.date ? new Date(u.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            {u.message && (
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(148,163,184,0.6)',
                                                    lineHeight: 1.5 }}>
                                                    {u.message}
                                                </p>
                                            )}
                                            {/* ── link REMOVED as requested ── */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STATS (after announcements) ── */}
                <div className="db-section-label">
                    <TrendingUp size={13} color="#60A5FA" /> Your Progress
                </div>
                <div className="db-stats">
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            className={`db-stat${s.onClick ? ' db-stat-click' : ''}`}
                            style={{ animationDelay: `${i * 0.07}s`, animation: 'db-up 0.4s ease both' }}
                            onClick={s.onClick}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${s.glow}`; e.currentTarget.style.borderColor = `${s.color}30`; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.09)'; }}
                        >
                            {/* Glow blob */}
                            <div className="db-stat-glow" style={{ background: `radial-gradient(circle,${s.color},transparent 70%)` }} />

                            <div className="db-stat-icon" style={{ background: s.grad.replace('0.15', '0.18').replace('0.08', '0.1') }}>
                                <s.icon size={18} color={s.color} />
                            </div>

                            <div className="db-stat-value" style={{ color: s.color }}>
                                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                            </div>
                            <p className="db-stat-label">{s.label}</p>

                            <div className="db-stat-bar-track">
                                <div className="db-stat-bar"
                                    style={{ '--w': `${Math.round(s.bar * 100)}%`, width: `${Math.round(s.bar * 100)}%`,
                                        background: `linear-gradient(90deg,${s.color}55,${s.color})`,
                                        animationDelay: `${i * 0.1 + 0.4}s` }} />
                            </div>
                            <div className="db-stat-detail" style={{ color: s.color }}>{s.detail}</div>
                        </div>
                    ))}
                </div>

                {/* ── FACULTY REVIEWS BANNER ── */}
                <div className="db-section-label">
                    <MessageSquare size={13} color="#EC4899" /> Community
                </div>
                <div className="db-reviews" onClick={() => navigate('/reviews')}>
                    <div className="db-reviews-blob" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0,
                                background: 'linear-gradient(135deg,#EC4899,#BE185D)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 6px 20px rgba(236,72,153,0.4)' }}>
                                <MessageSquare size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 'clamp(1rem,3.5vw,1.3rem)', fontWeight: 800, margin: '0 0 3px', color: '#F9FAFB' }}>
                                    Faculty Reviews
                                </h2>
                                <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: '0.8rem', margin: 0 }}>
                                    Rate professors & browse feedback
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EC4899',
                            fontWeight: 800, fontSize: '0.85rem',
                            background: 'rgba(236,72,153,0.12)', padding: '9px 16px',
                            borderRadius: '24px', border: '1px solid rgba(236,72,153,0.25)',
                            flexShrink: 0 }}>
                            Explore <ArrowRight size={16} />
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <div className="db-section-label">
                    <Zap size={13} color="#FBBF24" /> Quick Actions
                </div>
                <div className="db-actions">
                    {quickActions.map((a, i) => (
                        <div
                            key={i}
                            className="db-action"
                            onClick={() => navigate(a.path)}
                            style={{ animationDelay: `${i * 0.055}s`, animation: 'db-up 0.4s ease both' }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = a.bg;
                                e.currentTarget.style.borderColor = `${a.color}35`;
                                e.currentTarget.style.boxShadow = `0 6px 20px ${a.color}20`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(15,23,42,0.75)';
                                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.09)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div className="db-action-icon" style={{ background: a.bg, border: `1px solid ${a.color}30` }}>
                                <a.icon size={17} color={a.color} />
                            </div>
                            <span className="db-action-label">{a.label}</span>
                        </div>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
