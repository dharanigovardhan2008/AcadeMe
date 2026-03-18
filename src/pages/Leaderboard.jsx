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
        <ellipse cx="50" cy="107" rx="28" ry="5" fill="rgba(0,0,0,0.35)" filter="url(#tblur)"/>
        <rect x="28" y="93" width="44" height="9" rx="2" fill="url(#tbase)"/>
        <rect x="30" y="92" width="40" height="3" rx="1" fill="#FFE066"/>
        <rect x="41" y="75" width="18" height="20" rx="2" fill="url(#tg3)"/>
        <rect x="44" y="75" width="4" height="20" fill="rgba(255,255,255,0.18)" rx="1"/>
        <path d="M22 18 Q18 40 30 60 Q38 72 50 74 Q62 72 70 60 Q82 40 78 18 Z" fill="url(#tg1)"/>
        <path d="M28 18 Q25 38 34 56 Q41 68 50 70 Q59 68 66 56 Q75 38 72 18 Z" fill="url(#tg2)" opacity="0.6"/>
        <path d="M22 18 Q18 40 30 60 Q38 72 50 74 Q62 72 70 60 Q82 40 78 18 Z" fill="url(#tshine)"/>
        <path d="M22 22 Q8 26 8 40 Q8 54 22 52" stroke="#FFD700" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M22 22 Q9 26 9 40 Q9 53 22 52" stroke="#FFF9C4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M78 22 Q92 26 92 40 Q92 54 78 52" stroke="#FFD700" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d="M78 22 Q91 26 91 40 Q91 53 78 52" stroke="#B8860B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
        <ellipse cx="50" cy="18" rx="28" ry="6" fill="#FFE566"/>
        <ellipse cx="50" cy="17" rx="26" ry="4" fill="#FFFDE0"/>
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
            <path d="M38 0 L50 10 L62 0 L62 35 L50 28 L38 35 Z" fill={m.color} opacity="0.85"/>
            <path d="M38 0 L50 10 L62 0 L62 5 L50 15 L38 5 Z" fill="rgba(255,255,255,0.3)"/>
            <ellipse cx="50" cy="108" rx="26" ry="4" fill="rgba(0,0,0,0.3)" filter={`url(#${id}blur)`}/>
            <ellipse cx="50" cy="72" rx="34" ry="6" fill={m.dark} opacity="0.7"/>
            <circle cx="50" cy="68" r="34" fill={`url(#${id}g1)`}/>
            <circle cx="50" cy="68" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <circle cx="50" cy="68" r="26" fill={`url(#${id}g2)`} opacity="0.5"/>
            <circle cx="50" cy="68" r="34" fill={`url(#${id}shine)`}/>
            <text x="50" y="62" textAnchor="middle" fontSize="13" fontWeight="bold"
                fontFamily="'Syne',sans-serif" fill="rgba(0,0,0,0.55)" letterSpacing="1">{m.label}</text>
            <text x="50" y="61" textAnchor="middle" fontSize="13" fontWeight="bold"
                fontFamily="'Syne',sans-serif" fill="rgba(255,255,255,0.9)" letterSpacing="1">{m.label}</text>
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
                <ellipse cx="18" cy="32" rx="14" ry="3" fill={m.dark} opacity="0.6"/>
                <polygon points="18,3 30,10 30,26 18,33 6,26 6,10" fill={`url(#rb${rank})`}/>
                <polygon points="18,3 30,10 30,26 18,33 6,26 6,10" fill={`url(#rbs${rank})`}/>
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

        .lb {
            font-family: 'DM Sans', sans-serif;
            color: #e2d9f3;
            width: 100%;
            box-sizing: border-box;
        }

        /* ── Hero ── */
        .lb-hero {
            position: relative; overflow: hidden; border-radius: 28px;
            margin-bottom: 1.25rem; padding: 2.5rem 2rem 2rem;
            background: radial-gradient(ellipse at 20% 0%, #1a0533 0%, #0c0118 40%, #080e1e 100%);
            border: 1px solid rgba(130,80,255,0.25);
            box-sizing: border-box;
        }
        .lb-hero-title {
            font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1;
            letter-spacing: -2px; margin: 0 0 6px;
            font-size: clamp(1.6rem, 5vw, 3.2rem); color: #FFD700;
            animation: lb-title-glow 3s ease-in-out infinite;
        }

        /* ── Tabs ── */
        .lb-tabs {
            display: flex; gap: 5px; background: rgba(255,255,255,0.04);
            border-radius: 16px; padding: 4px; margin-bottom: 1.25rem;
            border: 1px solid rgba(255,255,255,0.07);
            box-sizing: border-box; width: 100%;
        }
        .lb-tab {
            flex: 1; padding: 11px 8px; border-radius: 12px; border: none; cursor: pointer;
            font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: clamp(0.75rem, 2.5vw, 0.88rem);
            transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
            display: flex; align-items: center; justify-content: center; gap: 6px;
            white-space: nowrap;
        }
        .lb-tab-on  {
            background: linear-gradient(135deg,rgba(130,80,255,0.4),rgba(60,30,180,0.4));
            color: #e0d0ff; border: 1px solid rgba(140,90,255,0.45);
            box-shadow: 0 4px 20px rgba(100,50,255,0.3);
        }
        .lb-tab-off { background: transparent; color: rgba(180,155,255,0.4); border: 1px solid transparent; }
        .lb-tab-off:hover { background: rgba(255,255,255,0.06); color: rgba(210,185,255,0.7); }

        /* ── Podium ── */
        .lb-podium {
            display: grid; grid-template-columns: 1fr 1.2fr 1fr;
            gap: 10px; margin-bottom: 1.25rem; align-items: end;
            width: 100%; box-sizing: border-box;
        }
        .lb-pod {
            border-radius: 20px; text-align: center; position: relative; overflow: visible;
            cursor: default; transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
            perspective: 600px; min-width: 0;
        }
        .lb-pod:hover { transform: translateY(-10px) scale(1.03); }
        .lb-pod-inner {
            border-radius: 20px; padding: 1rem 0.5rem 1.25rem; position: relative; overflow: hidden;
            transition: box-shadow 0.4s;
        }
        .lb-pod-gold   .lb-pod-inner { background: linear-gradient(160deg,#1c1300,#2d1f00,#1c1300);
            border: 1px solid rgba(255,215,0,0.4); box-shadow: 0 8px 40px rgba(255,180,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1); }
        .lb-pod-silver .lb-pod-inner { background: linear-gradient(160deg,#111120,#1c1c30);
            border: 1px solid rgba(200,200,230,0.2); box-shadow: 0 6px 24px rgba(160,160,200,0.12); }
        .lb-pod-bronze .lb-pod-inner { background: linear-gradient(160deg,#150c00,#211200);
            border: 1px solid rgba(205,127,50,0.3); box-shadow: 0 6px 24px rgba(180,100,30,0.15); }
        .lb-pod-gold:hover   .lb-pod-inner { box-shadow: 0 16px 60px rgba(255,215,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15); }
        .lb-pod-silver:hover .lb-pod-inner { box-shadow: 0 12px 40px rgba(160,160,200,0.22); }
        .lb-pod-bronze:hover .lb-pod-inner { box-shadow: 0 12px 40px rgba(180,100,30,0.25); }
        .lb-pod-floor { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; }

        /* ── Trophy scene ── */
        .lb-trophy-scene {
            width: 80px; height: 80px; margin: 0 auto 4px;
            display: flex; align-items: center; justify-content: center;
            position: relative; z-index: 2;
        }
        .lb-trophy-anim { animation: lb-float 3.5s ease-in-out infinite; }
        .lb-trophy-glow {
            position: abs
