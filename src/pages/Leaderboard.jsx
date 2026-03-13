import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users, CalendarDays, Bug, Star, Lightbulb,
         UserPlus, MessageSquare, MessageCircle, Pencil, Phone,
         ThumbsUp, ChevronDown } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Static data ───────────────────────────────────────────────────────────────
const HOW_TO_EARN = [
    { label: 'Report a bug',           pts: 30, Icon: Bug,           color: '#F87171' },
    { label: 'Submit faculty review',  pts: 25, Icon: Star,          color: '#FBBF24' },
    { label: 'Suggest a feature',      pts: 20, Icon: Lightbulb,     color: '#A78BFA' },
    { label: 'Suggest a faculty',      pts: 15, Icon: UserPlus,      color: '#34D399' },
    { label: 'General feedback',       pts: 10, Icon: MessageSquare, color: '#60A5FA' },
    { label: 'Comment on review',      pts:  5, Icon: MessageCircle, color: '#818CF8' },
    { label: 'Edit your review',       pts:  5, Icon: Pencil,        color: '#F9A8D4' },
    { label: 'Call a faculty',         pts:  3, Icon: Phone,         color: '#6EE7B7' },
    { label: 'Like a review',          pts:  2, Icon: ThumbsUp,      color: '#FCA5A5' },
];

const MEDAL = [
    { color: '#FFD700', dark: '#B8860B', glow: 'rgba(255,215,0,0.7)',  shadow: 'rgba(255,215,0,0.4)',  label: '1ST' },
    { color: '#C0C0C0', dark: '#808080', glow: 'rgba(192,192,192,0.6)',shadow: 'rgba(192,192,192,0.3)', label: '2ND' },
    { color: '#CD7F32', dark: '#8B4513', glow: 'rgba(205,127,50,0.6)', shadow: 'rgba(205,127,50,0.35)', label: '3RD' },
];

// ── 3D Trophy SVG ─────────────────────────────────────────────────────────────
const Trophy3D = ({ size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(255,215,0,0.6)) drop-shadow(0 0 40px rgba(255,165,0,0.35))' }}>
        <defs>
            <linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF176"/>
                <stop offset="35%" stopColor="#FFD700"/>
                <stop offset="70%" stopColor="#FFA500"/>
                <stop offset="100%" stopColor="#B8860B"/>
            </linearGradient>
            <linearGradient id="tg2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFF9C4"/>
                <stop offset="50%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#8B6914"/>
            </linearGradient>
            <linearGradient id="tg3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE57A"/>
                <stop offset="100%" stopColor="#C8860A"/>
            </linearGradient>
            <linearGradient id="tbase" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#996300"/>
            </linearGradient>
            <radialGradient id="tshine" cx="35%" cy="25%" r="45%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </radialGradient>
            <filter id="tblur">
                <feGaussianBlur stdDeviation="2"/>
            </filter>
        </defs>
        {/* Shadow */}
        <ellipse cx="50" cy="107" rx="28" ry="5" fill="rgba(0,0,0,0.35)" filter="url(#tblur)"/>
        {/* Base plate */}
        <rect x="28" y="93" width="44" height="9" rx="2" fill="url(#tbase)"/>
        <rect x="30" y="92" width="40" height="3" rx="1" fill="#FFE066"/>
        {/* Stem */}
        <rect x="41" y="75" width="18" height="20" rx="2" fill="url(#tg3)"/>
        <rect x="44" y="75" width="4" height="20" fill="rgba(255,255,255,0.18)" rx="1"/>
        {/* Cup body */}
        <path d="M22 18 Q18 40 30 60 Q38 72 50 74 Q62 72 70 60 Q82 40 78 18 Z" fill="url(#tg1)"/>
        {/* Cup inner shadow */}
        <path d="M28 18 Q25 38 34 56 Q41 68 50 70 Q59 68 66 56 Q75 38 72 18 Z" fill="url(#tg2)" opacity="0.6"/>
        {/* Shine */}
        <path d="M22 18 Q18 40 30 60 Q38 72 50 74 Q62 72 70 60 Q82 40 78 18 Z" fill="url(#tshine)"/>
        {/* Handles */}
        <path d="M22 22 Q8 26 8 40 Q8 54 22 52" stroke="#FFD700" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M22 22 Q9 26 9 40 Q9 53 22 52" stroke="#FFF9C4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M78 22 Q92 26 92 40 Q92 54 78 52" stroke="#FFD700" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M78 22 Q91 26 91 40 Q91 53 78 52" stroke="#B8860B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
        {/* Rim */}
        <ellipse cx="50" cy="18" rx="28" ry="6" fill="#FFE566"/>
        <ellipse cx="50" cy="17" rx="26" ry="4" fill="#FFFDE0"/>
        {/* Star */}
        <text x="50" y="48" textAnchor="middle" fontSize="20" fill="#FFF9C4" opacity="0.9">★</text>
    </svg>
);

// ── 3D Medal SVG ─────────────────────────────────────────────────────────────
const Medal3D = ({ rank = 0, size = 70 }) => {
    const m = MEDAL[rank];
    const id = `m${rank}`;
    return (
        <svg width={size} height={size} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ filter: `drop-shadow(0 6px 18px ${m.shadow}) drop-shadow(0 0 28px ${m.glow})` }}>
            <defs>
                <linearGradient id={`${id}g1`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
                    <stop offset="30%" stopColor={m.color}/>
                    <stop offset="70%" stopColor={m.dark}/>
                    <stop offset="100%" stopColor={m.dark} stopOpacity="0.7"/>
                </linearGradient>
                <linearGradient id={`${id}g2`} x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor={m.color}/>
                    <stop offset="100%" stopColor={m.dark}/>
                </linearGradient>
                <radialGradient id={`${id}shine`} cx="35%" cy="30%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.75)"/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                </radialGradient>
                <filter id={`${id}blur`}><feGaussianBlur stdDeviation="2"/></filter>
            </defs>
            {/* Ribbon */}
            <path d="M38 0 L50 10 L62 0 L62 35 L50 28 L38 35 Z" fill={m.color} opacity="0.85"/>
            <path d="M38 0 L50 10 L62 0 L62 5 L50 15 L38 5 Z" fill="rgba(255,255,255,0.3)"/>
            {/* Shadow */}
            <ellipse cx="50" cy="108" rx="26" ry="4" fill="rgba(0,0,0,0.3)" filter={`url(#${id}blur)`}/>
            {/* Medal disc edge (3D side) */}
            <ellipse cx="50" cy="72" rx="34" ry="6" fill={m.dark} opacity="0.7"/>
            {/* Medal disc body */}
            <circle cx="50" cy="68" r="34" fill={`url(#${id}g1)`}/>
            {/* Inner ring */}
            <circle cx="50" cy="68" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <circle cx="50" cy="68" r="26" fill={`url(#${id}g2)`} opacity="0.5"/>
            {/* Shine */}
            <circle cx="50" cy="68" r="34" fill={`url(#${id}shine)`}/>
            {/* Rank text */}
            <text x="50" y="62" textAnchor="middle" fontSize="13" fontWeight="bold"
                fontFamily="'Syne',sans-serif" fill="rgba(0,0,0,0.55)" letterSpacing="1">{m.label}</text>
            <text x="50" y="61" textAnchor="middle" fontSize="13" fontWeight="bold"
                fontFamily="'Syne',sans-serif" fill="rgba(255,255,255,0.9)" letterSpacing="1">{m.label}</text>
            {/* Star accent */}
            <text x="50" y="82" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)">✦</text>
        </svg>
    );
};

// ── 3D Rank number badge ──────────────────────────────────────────────────────
const RankBadge3D = ({ rank }) => {
    const m = MEDAL[rank];
    return (
        <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
                style={{ filter: `drop-shadow(0 3px 8px ${m.shadow})` }}>
                <defs>
                    <linearGradient id={`rb${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
                        <stop offset="40%" stopColor={m.color}/>
                        <stop offset="100%" stopColor={m.dark}/>
                    </linearGradient>
                    <radialGradient id={`rbs${rank}`} cx="35%" cy="30%" r="55%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.6)"/>
                        <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                    </radialGradient>
                </defs>
                {/* 3D bottom face */}
                <ellipse cx="18" cy="32" rx="14" ry="3" fill={m.dark} opacity="0.6"/>
                {/* Hex shape */}
                <polygon points="18,3 30,10 30,26 18,33 6,26 6,10" fill={`url(#rb${rank})`}/>
                <polygon points="18,3 30,10 30,26 18,33 6,26 6,10" fill={`url(#rbs${rank})`}/>
                {/* Border */}
                <polygon points="18,3 30,10 30,26 18,33 6,26 6,10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            </svg>
            <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800',
                fontFamily: 'Syne,sans-serif', color: 'rgba(0,0,0,0.65)',
                textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                marginTop: '-2px',
            }}>
                {rank + 1}
            </span>
        </div>
    );
};

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter = ({ value }) => {
    const [disp, setDisp] = useState(0);
    useEffect(() => {
        let t0 = null;
        const dur = 1000;
        const tick = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            setDisp(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [value]);
    return <>{disp}</>;
};

// ── Starfield ─────────────────────────────────────────────────────────────────
const StarField = () => {
    const ref = useRef(null);
    useEffect(() => {
        const c = ref.current; if (!c) return;
        const ctx = c.getContext('2d');
        let W = c.width = c.offsetWidth, H = c.height = c.offsetHeight;
        const stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.3 + 0.2,
            a: Math.random(), da: (Math.random() - 0.5) * 0.004,
            vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (const s of stars) {
                s.x = (s.x + s.vx + W) % W;
                s.y = (s.y + s.vy + H) % H;
                s.a = Math.max(0.1, Math.min(1, s.a + s.da));
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(210,190,255,${s.a * 0.55})`; ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        const resize = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; };
        window.addEventListener('resize', resize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWeekStart = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
};
const fmtDate = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const nameInitials = (name = '') => {
    const p = name.trim().split(' ').filter(Boolean);
    return p.length >= 2 ? p[0][0].toUpperCase() + p[p.length - 1][0].toUpperCase()
                         : (p[0]?.[0]?.toUpperCase() || '?');
};

// ── Main component ────────────────────────────────────────────────────────────
const Leaderboard = () => {
    const { user } = useAuth();
    const currentUid = auth.currentUser?.uid || user?.uid;

    const [tab,      setTab]      = useState('weekly');
    const [allUsers, setAllUsers] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [showEarn, setShowEarn] = useState(false);
    const [mounted,  setMounted]  = useState(false);

    const weekStart = getWeekStart();

    useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(collection(db, 'users'), snap => {
            const list = snap.docs.map(d => {
                const data = d.data();
                const lr = data.pointsLastReset ? new Date(data.pointsLastReset) : null;
                return {
                    uid:          d.id,
                    name:         data.name || 'Student',
                    branch:       data.branch || '',
                    totalPoints:  data.totalPoints  || 0,
                    weeklyPoints: (!lr || lr < weekStart) ? 0 : (data.weeklyPoints || 0),
                };
            }).filter(u => u.totalPoints > 0 || u.weeklyPoints > 0);
            setAllUsers(list);
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });
        return () => unsub();
    }, []);

    const key     = tab === 'weekly' ? 'weeklyPoints' : 'totalPoints';
    const sorted  = [...allUsers].sort((a, b) => (b[key] || 0) - (a[key] || 0));
    const top10   = sorted.slice(0, 10);
    const myIdx   = sorted.findIndex(u => u.uid === currentUid);
    const myRank  = myIdx >= 0 ? myIdx + 1 : null;
    const myEntry = myIdx >= 0 ? sorted[myIdx] : null;
    const inTop10 = myRank !== null && myRank <= 10;
    const maxPts  = top10[0]?.[key] || 1;

    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

    // ── Styles ────────────────────────────────────────────────────────────────
    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes lb-spin    { to { transform: rotate(360deg); } }
        @keyframes lb-rise    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lb-glow    { 0%,100%{filter:drop-shadow(0 0 16px rgba(255,215,0,0.4))} 50%{filter:drop-shadow(0 0 32px rgba(255,215,0,0.75)) drop-shadow(0 0 60px rgba(255,165,0,0.3))} }
        @keyframes lb-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes lb-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes lb-float   { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes lb-rotate3d { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} }
        @keyframes lb-tilt    { 0%,100%{transform:rotateX(8deg) rotateY(-12deg)} 50%{transform:rotateX(-8deg) rotateY(12deg)} }
        @keyframes lb-bar     { from{width:0} to{width:var(--w,0%)} }
        @keyframes lb-title-glow { 0%,100%{text-shadow:0 0 40px rgba(255,215,0,0.3)} 50%{text-shadow:0 0 80px rgba(255,215,0,0.7),0 0 120px rgba(255,165,0,0.3)} }
        @keyframes lb-crown-bob { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.05)} }
        @keyframes lb-spark { 0%{transform:scale(0) rotate(0deg);opacity:1} 100%{transform:scale(1.5) rotate(180deg);opacity:0} }

        .lb { font-family: 'DM Sans', sans-serif; color: #e2d9f3; }

        /* ── Hero ── */
        .lb-hero {
            position: relative; overflow: hidden; border-radius: 28px;
            margin-bottom: 2rem; padding: 2.5rem 2rem 2rem;
            background: radial-gradient(ellipse at 20% 0%, #1a0533 0%, #0c0118 40%, #080e1e 100%);
            border: 1px solid rgba(130,80,255,0.25);
        }
        .lb-hero-title {
            font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1;
            letter-spacing: -2px; margin: 0 0 6px;
            font-size: clamp(2rem,6vw,3.2rem); color: #FFD700;
            animation: lb-title-glow 3s ease-in-out infinite;
        }

        /* ── Tabs ── */
        .lb-tabs { display:flex; gap:5px; background:rgba(255,255,255,0.04);
            border-radius:16px; padding:4px; margin-bottom:1.5rem;
            border:1px solid rgba(255,255,255,0.07); }
        .lb-tab { flex:1; padding:11px 8px; border-radius:12px; border:none; cursor:pointer;
            font-family:'DM Sans',sans-serif; font-weight:600; font-size:0.88rem;
            transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
            display:flex; align-items:center; justify-content:center; gap:6px; }
        .lb-tab-on  { background:linear-gradient(135deg,rgba(130,80,255,0.4),rgba(60,30,180,0.4));
            color:#e0d0ff; border:1px solid rgba(140,90,255,0.45);
            box-shadow:0 4px 20px rgba(100,50,255,0.3); }
        .lb-tab-off { background:transparent; color:rgba(180,155,255,0.4); border:1px solid transparent; }
        .lb-tab-off:hover { background:rgba(255,255,255,0.06); color:rgba(210,185,255,0.7); }

        /* ── Podium ── */
        .lb-podium { display:grid; grid-template-columns:1fr 1.2fr 1fr;
            gap:14px; margin-bottom:2rem; align-items:end; }
        .lb-pod {
            border-radius:24px; text-align:center; position:relative; overflow:visible;
            cursor:default; transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
            perspective: 600px;
        }
        .lb-pod:hover { transform: translateY(-10px) scale(1.03); }
        .lb-pod-inner {
            border-radius:24px; padding:1.25rem 0.75rem 1.5rem; position:relative; overflow:hidden;
            transition: box-shadow 0.4s;
        }
        .lb-pod-gold   .lb-pod-inner { background:linear-gradient(160deg,#1c1300,#2d1f00,#1c1300);
            border:1px solid rgba(255,215,0,0.4); box-shadow:0 8px 40px rgba(255,180,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1); }
        .lb-pod-silver .lb-pod-inner { background:linear-gradient(160deg,#111120,#1c1c30);
            border:1px solid rgba(200,200,230,0.2); box-shadow:0 6px 24px rgba(160,160,200,0.12); }
        .lb-pod-bronze .lb-pod-inner { background:linear-gradient(160deg,#150c00,#211200);
            border:1px solid rgba(205,127,50,0.3); box-shadow:0 6px 24px rgba(180,100,30,0.15); }
        .lb-pod-gold:hover   .lb-pod-inner { box-shadow:0 16px 60px rgba(255,215,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15); }
        .lb-pod-silver:hover .lb-pod-inner { box-shadow:0 12px 40px rgba(160,160,200,0.22); }
        .lb-pod-bronze:hover .lb-pod-inner { box-shadow:0 12px 40px rgba(180,100,30,0.25); }
        .lb-pod-floor { position:absolute; bottom:0; left:0; right:0; height:4px; }

        /* ── Trophy scene ── */
        .lb-trophy-scene {
            width:90px; height:90px; margin:0 auto 6px;
            display:flex; align-items:center; justify-content:center;
            position:relative; z-index:2;
        }
        .lb-trophy-anim { animation: lb-float 3.5s ease-in-out infinite; }
        .lb-trophy-glow {
            position:absolute; inset:0; border-radius:50%;
            background:radial-gradient(circle,rgba(255,215,0,0.25),transparent 70%);
            animation: lb-glow 3s ease-in-out infinite;
        }
        .lb-medal-scene {
            width:70px; height:70px; margin:0 auto 6px;
            display:flex; align-items:center; justify-content:center;
            position:relative; z-index:2;
        }
        .lb-medal-anim { animation: lb-tilt 4s ease-in-out infinite; }

        /* ── List ── */
        .lb-list { border-radius:22px; overflow:hidden; margin-bottom:1.5rem;
            background:rgba(255,255,255,0.022); border:1px solid rgba(255,255,255,0.07); }
        .lb-list-head { padding:1rem 1.4rem; display:flex; justify-content:space-between;
            align-items:center; border-bottom:1px solid rgba(255,255,255,0.06);
            background:linear-gradient(90deg,rgba(110,50,255,0.1),rgba(40,80,255,0.06)); }
        .lb-row {
            display:flex; align-items:center; gap:14px; padding:13px 16px;
            transition:background 0.2s; position:relative;
        }
        .lb-row::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
            background:transparent; transition:background 0.2s; border-radius:0 2px 2px 0; }
        .lb-row+.lb-row { border-top:1px solid rgba(255,255,255,0.04); }
        .lb-row:hover { background:rgba(255,255,255,0.045); }
        .lb-row:hover::before { background:rgba(140,80,255,0.7); }
        .lb-row-me { background:linear-gradient(90deg,rgba(96,165,250,0.1),rgba(139,92,246,0.07)) !important; }
        .lb-row-me::before { background:linear-gradient(180deg,#60A5FA,#A78BFA) !important; }

        .lb-you { font-size:0.6rem; background:linear-gradient(135deg,#3B82F6,#8B5CF6);
            padding:2px 8px; border-radius:20px; font-weight:800; letter-spacing:0.6px; flex-shrink:0; }
        .lb-bar-track { width:52px; height:3px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; }
        .lb-bar-fill  { height:100%; border-radius:2px; animation:lb-bar 1s ease-out both; }

        /* ── My rank ── */
        .lb-myrank { position:relative; border-radius:20px; padding:1.1rem 1.4rem;
            margin-bottom:1.5rem; overflow:hidden;
            background:linear-gradient(135deg,rgba(96,165,250,0.09),rgba(139,92,246,0.09));
            border:1px solid rgba(96,165,250,0.3); animation:lb-rise 0.5s ease both; }
        .lb-myrank::before { content:''; position:absolute; inset:0;
            background:linear-gradient(90deg,transparent,rgba(96,165,250,0.06),transparent);
            background-size:200% 100%; animation:lb-shimmer 4s linear infinite; pointer-events:none; }
        .lb-myrank-num {
            font-family:'Syne',sans-serif; font-weight:800; font-size:2.2rem; line-height:1;
            background:linear-gradient(135deg,#60A5FA,#A78BFA);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        /* ── Live dot ── */
        .lb-live-dot { width:7px; height:7px; border-radius:50%; background:#22c55e;
            box-shadow:0 0 8px #22c55e; animation:lb-pulse 2s ease-in-out infinite; }

        /* ── Earn ── */
        .lb-earn { border-radius:22px; overflow:hidden;
            border:1px solid rgba(251,191,36,0.18);
            background:linear-gradient(135deg,rgba(251,191,36,0.04),rgba(255,80,0,0.025)); }
        .lb-earn-head { padding:1rem 1.25rem; display:flex; align-items:center;
            justify-content:space-between; cursor:pointer; user-select:none;
            background:linear-gradient(90deg,rgba(251,191,36,0.08),transparent); transition:background 0.2s; }
        .lb-earn-head:hover { background:rgba(251,191,36,0.12); }
        .lb-earn-item { display:flex; align-items:center; justify-content:space-between;
            padding:9px 14px; border-radius:10px; transition:background 0.2s; }
        .lb-earn-item:hover { background:rgba(255,255,255,0.05); }
        .lb-pts-badge { font-family:'Syne',sans-serif; font-weight:800; font-size:0.82rem; color:#4ade80;
            background:rgba(74,222,128,0.1); padding:2px 10px; border-radius:20px;
            border:1px solid rgba(74,222,128,0.2); flex-shrink:0; }

        @media(max-width:520px) {
            .lb-podium { grid-template-columns:1fr 1.15fr 1fr; gap:8px; }
            .lb-hero   { padding:2rem 1.2rem 1.5rem; }
            .lb-row    { padding:10px 12px; gap:10px; }
            .lb-bar-track { display:none; }
            .lb-trophy-scene { width:75px; height:75px; }
            .lb-medal-scene  { width:58px; height:58px; }
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className="lb" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>

                {/* ── Hero ── */}
                <div className="lb-hero">
                    <StarField />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            {/* 3D Trophy in hero */}
                            <div style={{ animation: 'lb-float 3.5s ease-in-out infinite', flexShrink: 0 }}>
                                <Trophy3D size={72} />
                            </div>
                            <div>
                                <h1 className="lb-hero-title">Leaderboard</h1>
                                <p style={{ color: 'rgba(180,155,255,0.55)', fontSize: '0.82rem', margin: 0 }}>
                                    Earn points · Climb ranks · Be legendary
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1.25rem', alignItems: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                                background: 'rgba(130,80,255,0.15)', borderRadius: '20px',
                                border: '1px solid rgba(130,80,255,0.25)', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(200,170,255,0.8)' }}>
                                <Users size={12} /> {allUsers.length} students ranked
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                                background: 'rgba(60,100,255,0.12)', borderRadius: '20px',
                                border: '1px solid rgba(80,120,255,0.2)', fontSize: '0.75rem', color: 'rgba(160,185,255,0.7)' }}>
                                <CalendarDays size={12} /> {fmtDate(weekStart)} – {fmtDate(weekEnd)}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                                background: 'rgba(34,197,94,0.1)', borderRadius: '20px',
                                border: '1px solid rgba(34,197,94,0.25)', fontSize: '0.72rem', fontWeight: '700', color: '#4ade80', marginLeft: 'auto' }}>
                                <div className="lb-live-dot" /> LIVE
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── My Rank ── */}
                {myEntry && (
                    <div className="lb-myrank">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{myEntry.name}</span>
                                    <span className="lb-you">YOU</span>
                                </div>
                                <div style={{ fontSize: '0.73rem', color: 'rgba(180,155,255,0.45)', marginTop: '3px' }}>
                                    {myEntry.branch || 'Student'} · <Counter value={myEntry[key] || 0} /> pts {tab === 'weekly' ? 'this week' : 'total'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div className="lb-myrank-num">#{myRank}</div>
                                <div style={{ fontSize: '0.68rem', color: 'rgba(180,155,255,0.4)' }}>your rank</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="lb-tabs">
                    {[
                        ['weekly',  'alltime'],
                        ['⚡ This Week', '👑 All Time'],
                    ][0].map((id, i) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`lb-tab ${tab === id ? 'lb-tab-on' : 'lb-tab-off'}`}>
                            {['⚡ This Week', '👑 All Time'][i]}
                        </button>
                    ))}
                </div>

                {/* ── Podium ── */}
                {!loading && top10.length >= 3 && (
                    <div className="lb-podium">
                        {/* Order: 2nd, 1st, 3rd */}
                        {[1, 0, 2].map((ri, col) => {
                            const entry  = top10[ri];
                            if (!entry) return <div key={col} />;
                            const isMe   = entry.uid === currentUid;
                            const m      = MEDAL[ri];
                            const isGold = ri === 0;
                            const cls    = ['lb-pod-silver', 'lb-pod-gold', 'lb-pod-bronze'][col];
                            return (
                                <div key={entry.uid} className={`lb-pod ${cls}`}
                                    style={{ animation: `lb-rise 0.5s ${col * 0.08}s ease both` }}>
                                    <div className="lb-pod-inner"
                                        style={{ outline: isMe ? '2px solid rgba(96,165,250,0.5)' : 'none', outlineOffset: '-2px' }}>

                                        {/* 3D asset */}
                                        {isGold ? (
                                            <div className="lb-trophy-scene">
                                                <div className="lb-trophy-glow" />
                                                <div className="lb-trophy-anim">
                                                    <Trophy3D size={82} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="lb-medal-scene">
                                                <div className="lb-medal-anim">
                                                    <Medal3D rank={ri} size={62} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Name */}
                                        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '0.78rem',
                                            margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            padding: '0 6px', color: isGold ? '#FFE566' : 'rgba(230,220,255,0.9)' }}>
                                            {entry.name}
                                        </p>
                                        {entry.branch && (
                                            <p style={{ fontSize: '0.62rem', color: 'rgba(180,155,255,0.38)', margin: '0 0 8px',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {entry.branch}
                                            </p>
                                        )}

                                        {/* Points */}
                                        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800',
                                            fontSize: isGold ? '1.5rem' : '1.2rem', color: m.color,
                                            textShadow: `0 0 16px ${m.glow}` }}>
                                            <Counter value={entry[key] || 0} />
                                            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)',
                                                marginLeft: '3px', fontFamily: 'DM Sans,sans-serif' }}>pts</span>
                                        </div>

                                        {isMe && (
                                            <div style={{ marginTop: '6px' }}>
                                                <span className="lb-you">YOU</span>
                                            </div>
                                        )}

                                        <div className="lb-pod-floor"
                                            style={{ background: `linear-gradient(90deg,${m.color}00,${m.color}60,${m.color}00)` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Top 10 list ── */}
                <div className="lb-list">
                    <div className="lb-list-head">
                        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '0.88rem', color: 'rgba(210,195,255,0.8)' }}>
                            Top 10 Rankings
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(180,155,255,0.38)' }}>
                            {tab === 'weekly' ? '⚡ This week' : '👑 All time'}
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(180,155,255,0.45)' }}>
                            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(130,80,255,0.2)',
                                borderTopColor: '#8B5CF6', borderRadius: '50%', margin: '0 auto 14px',
                                animation: 'lb-spin 0.75s linear infinite' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading rankings…</p>
                        </div>
                    ) : top10.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(180,155,255,0.35)' }}>
                            <div style={{ margin: '0 auto 16px', width: 'fit-content' }}>
                                <Trophy3D size={56} />
                            </div>
                            <p style={{ fontWeight: '700', margin: '0 0 6px' }}>No rankings yet</p>
                            <p style={{ fontSize: '0.8rem', margin: 0 }}>Be the first — review faculty or submit feedback!</p>
                        </div>
                    ) : top10.map((entry, idx) => {
                        const rank  = idx + 1;
                        const isMe  = entry.uid === currentUid;
                        const isTop = rank <= 3;
                        const m     = isTop ? MEDAL[rank - 1] : null;
                        const pct   = Math.round(((entry[key] || 0) / maxPts) * 100);
                        const bar   = isTop ? m.color : '#8B5CF6';
                        return (
                            <div key={entry.uid} className={`lb-row${isMe ? ' lb-row-me' : ''}`}
                                style={{ animation: `lb-rise 0.4s ${idx * 0.04}s ease both` }}>

                                {/* Rank */}
                                {isTop ? (
                                    <RankBadge3D rank={rank - 1} />
                                ) : (
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                        fontSize: '0.78rem', fontWeight: '800', fontFamily: 'Syne,sans-serif',
                                        color: 'rgba(180,155,255,0.5)' }}>
                                        #{rank}
                                    </div>
                                )}

                                {/* Name + bar */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: isMe ? '700' : '500', fontSize: '0.9rem',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            color: isMe ? '#93C5FD' : 'rgba(215,205,255,0.88)' }}>
                                            {entry.name}
                                        </span>
                                        {isMe && <span className="lb-you">YOU</span>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                        {entry.branch && (
                                            <span style={{ fontSize: '0.67rem', color: 'rgba(180,155,255,0.32)' }}>{entry.branch}</span>
                                        )}
                                        <div className="lb-bar-track">
                                            <div className="lb-bar-fill"
                                                style={{ '--w': `${pct}%`, width: `${pct}%`,
                                                    background: `linear-gradient(90deg,${bar}55,${bar})`,
                                                    animationDelay: `${idx * 0.06 + 0.3}s` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Points */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '1.1rem',
                                        color: isTop ? m.color : (isMe ? '#93C5FD' : 'rgba(215,205,255,0.85)'),
                                        textShadow: isTop ? `0 0 10px ${m.glow}` : 'none' }}>
                                        <Counter value={entry[key] || 0} />
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(180,155,255,0.3)', letterSpacing: '0.5px' }}>PTS</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── My rank if outside top 10 ── */}
                {!loading && myRank !== null && !inTop10 && (
                    <div style={{ borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
                        background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.22)',
                        display: 'flex', alignItems: 'center', gap: '12px', animation: 'lb-rise 0.5s ease both' }}>
                        <TrendingUp size={18} color="#60A5FA" style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '0.85rem' }}>
                            Your rank: <strong style={{ color: '#60A5FA', fontFamily: 'Syne,sans-serif', fontSize: '1rem' }}>#{myRank}</strong>
                            <span style={{ color: 'rgba(180,155,255,0.4)', marginLeft: '6px', fontSize: '0.78rem' }}>
                                · {myEntry?.[key] || 0} pts
                            </span>
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'rgba(96,165,250,0.6)',
                            background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: '10px', fontWeight: '600' }}>
                            {myRank - 10} from top 10
                        </span>
                    </div>
                )}

                {/* ── How to Earn ── */}
                <div className="lb-earn">
                    <div className="lb-earn-head" onClick={() => setShowEarn(!showEarn)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Medal3D rank={0} size={28} />
                            </div>
                            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '0.88rem',
                                color: 'rgba(251,191,36,0.9)' }}>How to Earn Points</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(180,155,255,0.38)' }}>
                                {showEarn ? 'Collapse' : 'Tap to expand'}
                            </span>
                            <ChevronDown size={16} style={{ color: 'rgba(251,191,36,0.5)',
                                transition: 'transform 0.3s', transform: showEarn ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </div>
                    </div>

                    {showEarn && (
                        <div style={{ padding: '0.75rem', display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: '5px' }}>
                            {HOW_TO_EARN.map((item, i) => (
                                <div key={item.label} className="lb-earn-item"
                                    style={{ animation: `lb-rise 0.3s ${i * 0.035}s ease both` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                                            <item.Icon size={14} style={{ color: item.color }} />
                                        </div>
                                        <span style={{ fontSize: '0.78rem', color: 'rgba(200,185,255,0.68)' }}>{item.label}</span>
                                    </div>
                                    <span className="lb-pts-badge">+{item.pts}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Leaderboard;
