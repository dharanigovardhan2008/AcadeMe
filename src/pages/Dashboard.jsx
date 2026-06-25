import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calculator, Calendar, Users, BookOpen, TrendingUp,
    MessageSquare, ArrowRight, Megaphone, Layers,
    Trophy, Zap, ExternalLink,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

// ── Cache ──────────────────────────────────────────────────────────────────────
const CACHE_TTL = 300000;
const getCache = k => { try { const v=sessionStorage.getItem(k),t=sessionStorage.getItem(`${k}_t`); if(!v||!t||Date.now()-+t>CACHE_TTL)return null; return JSON.parse(v); } catch{return null;} };
const setCache = (k,d) => { try{sessionStorage.setItem(k,JSON.stringify(d));sessionStorage.setItem(`${k}_t`,String(Date.now()));}catch{} };

// ── Animated counter ───────────────────────────────────────────────────────────
const Counter = ({ value, decimals=0, suffix='' }) => {
    const [disp, setDisp] = useState(0);
    const num = parseFloat(value) || 0;
    useEffect(() => {
        let t0=null; const dur=1100;
        const tick = ts => {
            if(!t0) t0=ts;
            const p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3);
            setDisp(+(num*e).toFixed(decimals));
            if(p<1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [num, decimals]);
    return <>{disp.toFixed(decimals)}{suffix}</>;
};

const QUOTES = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it's done.",
    "Education is the passport to the future.",
    "Dream big. Work hard. Stay focused.",
];

const Dashboard = () => {
    const { user } = useAuth();
    const { cgpaSubjects=[], attendanceSubjects=[], faculty=[] } = useData() || {};
    const navigate = useNavigate();
    const [updates, setUpdates] = useState([]);
    const [mounted, setMounted] = useState(false);
    const quote = QUOTES[new Date().getDay() % QUOTES.length];

    useEffect(() => { const t=setTimeout(()=>setMounted(true),60); return ()=>clearTimeout(t); }, []);

    useEffect(() => {
        (async () => {
            try {
                const hit = getCache('dash_updates');
                if (hit) setUpdates(hit);
                const snap = await getDocs(query(collection(db,'updates'), orderBy('date','desc'), limit(5)));
                const list = snap.docs.map(d=>({id:d.id,...d.data()}));
                setCache('dash_updates', list);
                setUpdates(list);
            } catch(e) { console.error(e); }
        })();
    }, []);

    const cgpa = (() => {
        if (!cgpaSubjects?.length) return 0;
        const gp = {S:10,A:9,B:8,C:7,D:6,E:5,F:0};
        return +(cgpaSubjects.reduce((s,x)=>s+(gp[x.grade]||0),0)/cgpaSubjects.length).toFixed(2);
    })();

    const attendance = (() => {
        if (!attendanceSubjects?.length) return 0;
        const tot = attendanceSubjects.reduce((s,x)=>s+Number(x.total||0),0);
        const att = attendanceSubjects.reduce((s,x)=>s+Number(x.attended||0),0);
        return tot ? +((att/tot)*100).toFixed(0) : 0;
    })();

    const attSafe   = attendance >= 80;
    const userName  = user?.name?.split(' ')[0] || 'Student';
    const hour      = new Date().getHours();
    const greeting  = hour<12 ? 'Good Morning' : hour<17 ? 'Good Afternoon' : 'Good Evening';
    const greetMoji = hour<12 ? '🌅' : hour<17 ? '☀️' : '🌙';

    const stats = [
        { icon:TrendingUp, value:cgpa,  label:'Current CGPA',      suffix:'',  decimals:2, color:'#818CF8', glow:'rgba(129,140,248,0.35)',   grad:'linear-gradient(135deg,rgba(129,140,248,0.2),rgba(99,102,241,0.08))',  bar:cgpa/10,                   detail:`${cgpaSubjects.length} subjects` },
        { icon:Calendar,   value:attendance, label:'Attendance',   suffix:'%', decimals:0, color:attSafe?'#34D399':'#F87171', glow:attSafe?'rgba(52,211,153,0.35)':'rgba(248,113,113,0.35)', grad:attSafe?'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(16,185,129,0.08))':'linear-gradient(135deg,rgba(248,113,113,0.2),rgba(239,68,68,0.08))', bar:attendance/100, detail:attSafe?'Safe ✓':'Below 80% ⚠' },
        { icon:BookOpen,   value:cgpaSubjects.length, label:'Active Subjects', suffix:'', decimals:0, color:'#C084FC', glow:'rgba(192,132,252,0.35)', grad:'linear-gradient(135deg,rgba(192,132,252,0.2),rgba(168,85,247,0.08))', bar:Math.min(cgpaSubjects.length/10,1), detail:'This semester' },
        { icon:Users,      value:faculty.length||0,   label:'Faculty Members', suffix:'+',decimals:0, color:'#F472B6', glow:'rgba(244,114,182,0.35)', grad:'linear-gradient(135deg,rgba(244,114,182,0.2),rgba(219,39,119,0.08))', bar:0.7, detail:'In directory', onClick:()=>navigate('/faculty') },
    ];

    const actions = [
        { label:'My Courses',      icon:BookOpen,   path:'/courses',     color:'#818CF8', bg:'rgba(129,140,248,0.12)'   },
        { label:'CGPA Calculator', icon:Calculator, path:'/calc',        color:'#C084FC', bg:'rgba(192,132,252,0.12)'  },
        { label:'Attendance',      icon:Calendar,   path:'/attendance',  color:'#34D399', bg:'rgba(52,211,153,0.12)'   },
        { label:'Faculty',         icon:Users,      path:'/faculty',     color:'#F472B6', bg:'rgba(244,114,182,0.12)'  },
        { label:'Resources Hub',   icon:Layers,     path:'/resources',   color:'#FB923C', bg:'rgba(251,146,60,0.12)'   },
        { label:'Leaderboard',     icon:Trophy,     path:'/leaderboard', color:'#FBBF24', bg:'rgba(251,191,36,0.12)'   },
    ];

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }

        /* ── Keyframes ── */
        @keyframes db-rise   { from{opacity:0;transform:translateY(22px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes db-bar    { from{width:0} to{width:var(--w,0%)} }
        @keyframes db-dot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.65)} }
        @keyframes db-orb1   { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.1)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes db-orb2   { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,25px) scale(0.92)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes db-orb3   { 0%{transform:translate(0,0)} 33%{transform:translate(15px,15px)} 66%{transform:translate(-15px,5px)} 100%{transform:translate(0,0)} }
        @keyframes db-shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes db-pulse  { 0%,100%{box-shadow:0 0 0 0 var(--glow-c,rgba(129,140,248,0.4))} 50%{box-shadow:0 0 0 8px transparent} }
        @keyframes db-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

        .db {
            font-family:'Inter',sans-serif;
            width:100%;
            position:relative;
            min-height:100vh;
            background:transparent;
        }

        /* ══════════════════════════════════════════
           GLOBAL BACKGROUND  — three ambient orbs
        ══════════════════════════════════════════ */
        .db-bg {
            position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden;
            background:linear-gradient(145deg,#050714 0%,#080c1a 40%,#060a16 100%);
        }
        .db-bg-orb {
            position:absolute; border-radius:50%; filter:blur(90px);
        }
        .db-bg-orb1 {
            width:600px; height:600px; top:-100px; right:-100px;
            background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.08) 50%,transparent 70%);
            animation:db-orb1 18s ease-in-out infinite;
        }
        .db-bg-orb2 {
            width:500px; height:500px; bottom:-80px; left:-80px;
            background:radial-gradient(circle,rgba(16,185,129,0.1) 0%,rgba(59,130,246,0.06) 50%,transparent 70%);
            animation:db-orb2 22s ease-in-out infinite;
        }
        .db-bg-orb3 {
            width:350px; height:350px; top:40%; left:40%;
            background:radial-gradient(circle,rgba(217,70,239,0.07) 0%,transparent 65%);
            animation:db-orb3 30s ease-in-out infinite;
        }

        .db-content { position:relative; z-index:1; }

        /* ══════════════════════════════════════════
           GLASS UTILITY
        ══════════════════════════════════════════ */
        .glass {
            background:rgba(255,255,255,0.04);
            backdrop-filter:blur(24px) saturate(180%);
            -webkit-backdrop-filter:blur(24px) saturate(180%);
            border:1px solid rgba(255,255,255,0.08);
        }
        .glass-strong {
            background:rgba(255,255,255,0.06);
            backdrop-filter:blur(40px) saturate(200%);
            -webkit-backdrop-filter:blur(40px) saturate(200%);
            border:1px solid rgba(255,255,255,0.1);
        }

        /* ══════════════════════════════════════════
           HERO
        ══════════════════════════════════════════ */
        .db-hero {
            position:relative; overflow:hidden; border-radius:28px;
            padding:2.5rem 2rem 2rem;
            margin-bottom:1.6rem;
            animation:db-rise 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .db-hero-shine {
            position:absolute; inset:0; border-radius:inherit;
            background:linear-gradient(135deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.02) 100%);
            pointer-events:none;
        }
        .db-hero-line {
            position:absolute; top:0; left:0; right:0; height:1px;
            background:linear-gradient(90deg,transparent,rgba(129,140,248,0.6),rgba(192,132,252,0.6),transparent);
        }
        .db-hero-tag {
            display:inline-flex; align-items:center; gap:6px;
            padding:5px 13px; border-radius:100px; margin-bottom:1rem;
            background:rgba(129,140,248,0.1);
            border:1px solid rgba(129,140,248,0.25);
            font-size:0.68rem; font-weight:700; letter-spacing:0.8px;
            text-transform:uppercase; color:rgba(129,140,248,0.9);
        }
        .db-hero-tag-dot {
            width:5px; height:5px; border-radius:50%; background:#818CF8;
            animation:db-dot 2s ease-in-out infinite;
        }
        .db-hero-h {
            font-family:'Sora',sans-serif;
            font-size:clamp(1.65rem,5.5vw,2.6rem);
            font-weight:800; letter-spacing:-0.6px; line-height:1.12;
            margin-bottom:0.35rem;
            background:linear-gradient(120deg,#ffffff 0%,rgba(192,132,252,0.95) 50%,rgba(129,140,248,0.85) 100%);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .db-hero-sub {
            font-size:0.8rem; color:rgba(148,163,184,0.5); margin-bottom:1.4rem;
            font-weight:400; letter-spacing:0.1px;
        }
        .db-quote {
            position:relative;
            padding:1rem 1.1rem 1rem 1.4rem;
            border-radius:14px;
            background:rgba(129,140,248,0.06);
            border:1px solid rgba(129,140,248,0.15);
            overflow:hidden;
        }
        .db-quote::before {
            content:'';
            position:absolute; left:0; top:0; bottom:0; width:3px;
            background:linear-gradient(180deg,#818CF8,#C084FC);
            border-radius:3px 0 0 3px;
        }
        .db-quote-mark {
            font-size:2rem; line-height:1; color:rgba(129,140,248,0.25);
            font-family:Georgia,serif; float:left; margin-right:6px; margin-top:-4px;
        }
        .db-quote-text {
            font-size:0.79rem; color:rgba(148,163,184,0.6);
            font-style:italic; line-height:1.6; font-weight:400;
        }

        /* Decorative icon */
        .db-hero-deco {
            position:absolute; right:-10px; top:50%; transform:translateY(-50%);
            opacity:0.04; pointer-events:none;
            animation:db-float 6s ease-in-out infinite;
        }

        /* ══════════════════════════════════════════
           SECTION LABELS
        ══════════════════════════════════════════ */
        .db-lbl {
            display:flex; align-items:center; gap:8px;
            margin-bottom:0.9rem;
            font-size:0.69rem; font-weight:700; letter-spacing:1px;
            text-transform:uppercase;
        }
        .db-lbl-text { color:rgba(148,163,184,0.45); }
        .db-lbl-icon {
            width:22px; height:22px; border-radius:6px;
            display:flex; align-items:center; justify-content:center;
        }
        .db-lbl::after {
            content:''; flex:1; height:1px;
            background:linear-gradient(90deg,rgba(148,163,184,0.1),transparent);
        }

        /* ══════════════════════════════════════════
           ANNOUNCEMENTS
        ══════════════════════════════════════════ */
        .db-ann { margin-bottom:1.6rem; animation:db-rise 0.55s 0.08s cubic-bezier(0.22,1,0.36,1) both; }

        .db-ann-header {
            display:flex; align-items:center; gap:10px;
            padding:1rem 1.2rem 1rem;
            border-radius:20px 20px 0 0;
            background:linear-gradient(135deg,rgba(251,191,36,0.08),rgba(245,158,11,0.04));
            border:1px solid rgba(251,191,36,0.15); border-bottom:none;
            position:relative; overflow:hidden;
        }
        .db-ann-header::after {
            content:''; position:absolute; top:0; left:0; right:0; height:1px;
            background:linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent);
        }
        .db-ann-header-icon {
            width:34px; height:34px; border-radius:10px; flex-shrink:0;
            background:rgba(251,191,36,0.12);
            border:1px solid rgba(251,191,36,0.2);
            display:flex; align-items:center; justify-content:center;
        }
        .db-ann-title { font-weight:800; font-size:0.88rem; color:#FCD34D; font-family:'Sora',sans-serif; }
        .db-ann-badge {
            margin-left:auto; font-size:0.63rem; font-weight:700;
            color:rgba(251,191,36,0.7); background:rgba(251,191,36,0.1);
            padding:3px 9px; border-radius:100px;
            border:1px solid rgba(251,191,36,0.18);
        }
        .db-ann-body {
            border:1px solid rgba(251,191,36,0.1); border-top:none;
            border-radius:0 0 20px 20px; overflow:hidden;
            background:rgba(255,255,255,0.025);
            backdrop-filter:blur(24px);
        }
        .db-ann-row {
            display:flex; gap:12px; padding:1rem 1.2rem;
            border-bottom:1px solid rgba(255,255,255,0.04);
            transition:background 0.2s; animation:db-rise 0.35s ease both;
            position:relative; overflow:hidden;
        }
        .db-ann-row:last-child { border-bottom:none; }
        .db-ann-row:hover { background:rgba(251,191,36,0.04); }
        .db-ann-row::before {
            content:''; position:absolute; left:0; top:0; bottom:0; width:0;
            background:linear-gradient(90deg,rgba(251,191,36,0.08),transparent);
            transition:width 0.3s;
        }
        .db-ann-row:hover::before { width:100%; }
        .db-ann-dot {
            width:7px; height:7px; border-radius:50%; background:#FBBF24;
            flex-shrink:0; margin-top:5px;
            box-shadow:0 0 8px rgba(251,191,36,0.6);
            animation:db-dot 2.5s ease-in-out infinite;
        }
        .db-ann-row-title { font-weight:700; font-size:0.85rem; color:#F1F5F9; line-height:1.3; }
        .db-ann-row-date  { font-size:0.63rem; color:rgba(148,163,184,0.38); flex-shrink:0; font-weight:600; }
        .db-ann-row-msg   { font-size:0.77rem; color:rgba(148,163,184,0.55); line-height:1.55; margin-top:3px; }
        .db-rlink {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 12px; border-radius:100px; margin-top:8px;
            background:rgba(129,140,248,0.1); border:1px solid rgba(129,140,248,0.22);
            color:#818CF8; font-size:0.72rem; font-weight:700;
            text-decoration:none; cursor:pointer;
            transition:all 0.2s;
        }
        .db-rlink:hover {
            background:rgba(129,140,248,0.2);
            border-color:rgba(129,140,248,0.4);
            transform:translateX(2px);
        }

        /* ══════════════════════════════════════════
           STATS GRID
        ══════════════════════════════════════════ */
        .db-stats {
            display:grid; grid-template-columns:repeat(2,1fr);
            gap:1rem; margin-bottom:1.6rem;
            animation:db-rise 0.55s 0.14s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media(min-width:640px){ .db-stats{grid-template-columns:repeat(4,1fr);} }

        .db-stat {
            position:relative; overflow:hidden; border-radius:22px;
            padding:1.25rem 1.1rem 1.1rem;
            transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
            cursor:default;
        }
        .db-stat::before {
            content:''; position:absolute; top:0; left:0; right:0; height:1px;
            background:linear-gradient(90deg,transparent,var(--accent,rgba(255,255,255,0.2)),transparent);
            opacity:0.6;
        }
        .db-stat::after {
            content:''; position:absolute; inset:0; border-radius:inherit;
            background:linear-gradient(150deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0) 60%);
            pointer-events:none;
        }
        .db-stat:hover { transform:translateY(-5px) scale(1.015); }

        .db-stat-glow {
            position:absolute; top:-30px; right:-30px; width:100px; height:100px;
            border-radius:50%; pointer-events:none; opacity:0.22;
            filter:blur(28px);
            transition:opacity 0.3s;
        }
        .db-stat:hover .db-stat-glow { opacity:0.45; }

        .db-stat-icon {
            width:38px; height:38px; border-radius:12px;
            display:flex; align-items:center; justify-content:center;
            margin-bottom:0.8rem;
        }
        .db-stat-val {
            font-family:'Sora',sans-serif;
            font-size:clamp(1.7rem,4.5vw,2.3rem);
            font-weight:800; line-height:1; margin-bottom:3px; letter-spacing:-1.5px;
        }
        .db-stat-lbl {
            font-size:0.68rem; color:rgba(148,163,184,0.45); margin-bottom:0.7rem;
            font-weight:500; letter-spacing:0.1px;
        }
        .db-stat-track {
            height:3px; background:rgba(255,255,255,0.06);
            border-radius:100px; overflow:hidden; margin-bottom:5px;
        }
        .db-stat-fill {
            height:100%; border-radius:100px;
            animation:db-bar 1.2s cubic-bezier(0.22,1,0.36,1) both;
        }
        .db-stat-det {
            font-size:0.62rem; font-weight:700; letter-spacing:0.2px;
        }

        /* ══════════════════════════════════════════
           FACULTY REVIEWS CARD
        ══════════════════════════════════════════ */
        .db-reviews {
            position:relative; overflow:hidden; border-radius:22px;
            padding:1.4rem 1.3rem; margin-bottom:1.6rem; cursor:pointer;
            transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.3s;
            animation:db-rise 0.55s 0.2s cubic-bezier(0.22,1,0.36,1) both;
        }
        .db-reviews::before {
            content:''; position:absolute; top:0; left:0; right:0; height:1px;
            background:linear-gradient(90deg,transparent,rgba(236,72,153,0.6),rgba(244,114,182,0.5),transparent);
        }
        .db-reviews::after {
            content:''; position:absolute; inset:0; border-radius:inherit;
            background:linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0) 55%);
            pointer-events:none;
        }
        .db-reviews:hover {
            transform:translateY(-4px) scale(1.008);
            box-shadow:0 16px 48px rgba(236,72,153,0.2);
            border-color:rgba(236,72,153,0.3) !important;
        }
        .db-reviews-blob {
            position:absolute; top:-50%; right:-5%; width:260px; height:260px;
            border-radius:50%; pointer-events:none;
            background:radial-gradient(circle,rgba(236,72,153,0.14),transparent 65%);
            filter:blur(32px);
        }
        .db-reviews-blob2 {
            position:absolute; bottom:-40%; left:10%; width:160px; height:160px;
            border-radius:50%; pointer-events:none;
            background:radial-gradient(circle,rgba(139,92,246,0.1),transparent 65%);
            filter:blur(24px);
        }
        .db-reviews-icon-wrap {
            width:50px; height:50px; border-radius:15px; flex-shrink:0;
            background:linear-gradient(135deg,#EC4899 0%,#BE185D 100%);
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 8px 24px rgba(236,72,153,0.45);
        }
        .db-reviews-cta {
            display:flex; align-items:center; gap:6px;
            color:#F472B6; font-weight:700; font-size:0.82rem;
            background:rgba(236,72,153,0.08); padding:9px 16px; border-radius:100px;
            border:1px solid rgba(236,72,153,0.22); flex-shrink:0;
            transition:all 0.25s;
        }
        .db-reviews:hover .db-reviews-cta {
            background:rgba(236,72,153,0.16);
            border-color:rgba(236,72,153,0.4);
            gap:9px;
        }

        /* ══════════════════════════════════════════
           QUICK ACTIONS
        ══════════════════════════════════════════ */
        .db-acts {
            display:grid; grid-template-columns:repeat(3,1fr);
            gap:1rem; margin-bottom:1rem;
            animation:db-rise 0.55s 0.26s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media(min-width:580px){ .db-acts{grid-template-columns:repeat(6,1fr);} }

        .db-act {
            display:flex; flex-direction:column; align-items:center;
            justify-content:center; gap:8px;
            padding:1.1rem 0.5rem; border-radius:20px; cursor:pointer;
            min-height:92px;
            transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.25s, background 0.25s;
            -webkit-tap-highlight-color:transparent;
            position:relative; overflow:hidden;
        }
        .db-act::before {
            content:''; position:absolute; top:0; left:0; right:0; height:1px;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
        }
        .db-act::after {
            content:''; position:absolute; inset:0; border-radius:inherit;
            background:linear-gradient(160deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0) 60%);
            pointer-events:none;
        }
        .db-act:hover  { transform:translateY(-5px) scale(1.03); }
        .db-act:active { transform:scale(0.94); }

        .db-act-icon {
            width:36px; height:36px; border-radius:11px;
            display:flex; align-items:center; justify-content:center;
            transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .db-act:hover .db-act-icon { transform:scale(1.12) rotate(-4deg); }
        .db-act-lbl {
            font-size:0.61rem; font-weight:700; text-align:center;
            line-height:1.35; color:rgba(226,232,240,0.65);
            letter-spacing:0.1px;
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>

            {/* Fixed ambient background */}
            <div className="db-bg" aria-hidden="true">
                <div className="db-bg-orb db-bg-orb1" />
                <div className="db-bg-orb db-bg-orb2" />
                <div className="db-bg-orb db-bg-orb3" />
            </div>

            <div className="db db-content" style={{ opacity:mounted?1:0, transition:'opacity 0.4s ease' }}>

                {/* ── HERO ── */}
                <div className="db-hero glass-strong" style={{ animationDelay:'0s' }}>
                    <div className="db-hero-shine" />
                    <div className="db-hero-line" />
                    <TrendingUp size={150} className="db-hero-deco" color="white" />

                    <div style={{ position:'relative', zIndex:1 }}>
                        <div className="db-hero-tag">
                            <div className="db-hero-tag-dot" />
                            Academic Dashboard
                        </div>
                        <h1 className="db-hero-h">{greeting}, {userName} {greetMoji}</h1>
                        <p className="db-hero-sub">
                            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                        </p>
                        <div className="db-quote">
                            <span className="db-quote-mark">"</span>
                            <span className="db-quote-text">{quote}"</span>
                        </div>
                    </div>
                </div>

                {/* ── ANNOUNCEMENTS ── */}
                {updates.length > 0 && (
                    <div className="db-ann">
                        <div className="db-lbl">
                            <div className="db-lbl-icon" style={{ background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.2)' }}>
                                <Megaphone size={11} color="#FBBF24" />
                            </div>
                            <span className="db-lbl-text">Announcements</span>
                        </div>
                        <div className="db-ann-header glass">
                            <div className="db-ann-header-icon"><Megaphone size={15} color="#FBBF24" /></div>
                            <span className="db-ann-title">Latest Announcements</span>
                            <span className="db-ann-badge">{updates.length} new</span>
                        </div>
                        <div className="db-ann-body">
                            {updates.map((u, idx) => (
                                <div key={u.id} className="db-ann-row" style={{ animationDelay:`${idx*0.06}s` }}>
                                    <div className="db-ann-dot" />
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', flexWrap:'wrap', marginBottom:'3px' }}>
                                            <span className="db-ann-row-title">{u.title}</span>
                                            <span className="db-ann-row-date">
                                                {u.date ? new Date(u.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : ''}
                                            </span>
                                        </div>
                                        {u.message && (
                                            <p className="db-ann-row-msg">{u.message}</p>
                                        )}
                                        {(u.link || u.url) && (
                                            <a href={u.link || u.url} target="_blank" rel="noreferrer"
                                                className="db-rlink" onClick={e => e.stopPropagation()}>
                                                <ExternalLink size={11} /> Open Resource
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STATS ── */}
                <div className="db-lbl">
                    <div className="db-lbl-icon" style={{ background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.2)' }}>
                        <TrendingUp size={11} color="#818CF8" />
                    </div>
                    <span className="db-lbl-text">Your Progress</span>
                </div>
                <div className="db-stats">
                    {stats.map((s, i) => (
                        <div key={i} className="db-stat glass"
                            style={{
                                '--accent': s.color,
                                animationDelay:`${i*0.07}s`,
                                cursor:s.onClick?'pointer':'default',
                            }}
                            onClick={s.onClick}
                            onMouseEnter={e=>{
                                e.currentTarget.style.boxShadow=`0 12px 40px ${s.glow}`;
                                e.currentTarget.style.borderColor=`${s.color}30`;
                            }}
                            onMouseLeave={e=>{
                                e.currentTarget.style.boxShadow='';
                                e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';
                            }}>
                            <div className="db-stat-glow" style={{ background:`radial-gradient(circle,${s.color},transparent 70%)` }} />
                            <div className="db-stat-icon" style={{ background:s.grad, border:`1px solid ${s.color}22` }}>
                                <s.icon size={17} color={s.color} />
                            </div>
                            <div className="db-stat-val" style={{ color:s.color }}>
                                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                            </div>
                            <p className="db-stat-lbl">{s.label}</p>
                            <div className="db-stat-track">
                                <div className="db-stat-fill" style={{
                                    '--w':`${Math.round(s.bar*100)}%`,
                                    width:`${Math.round(s.bar*100)}%`,
                                    background:`linear-gradient(90deg,${s.color}55,${s.color})`,
                                    animationDelay:`${i*0.1+0.5}s`,
                                }} />
                            </div>
                            <div className="db-stat-det" style={{ color:s.color }}>{s.detail}</div>
                        </div>
                    ))}
                </div>

                {/* ── FACULTY REVIEWS ── */}
                <div className="db-lbl">
                    <div className="db-lbl-icon" style={{ background:'rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.2)' }}>
                        <MessageSquare size={11} color="#EC4899" />
                    </div>
                    <span className="db-lbl-text">Community</span>
                </div>
                <div className="db-reviews glass"
                    style={{ border:'1px solid rgba(236,72,153,0.18)' }}
                    onClick={()=>navigate('/reviews')}>
                    <div className="db-reviews-blob" />
                    <div className="db-reviews-blob2" />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'14px', flexWrap:'wrap', position:'relative', zIndex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                            <div className="db-reviews-icon-wrap">
                                <MessageSquare size={22} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(0.95rem,3.5vw,1.2rem)', fontWeight:800, marginBottom:'4px', color:'#F9FAFB' }}>Faculty Reviews</h2>
                                <p style={{ color:'rgba(148,163,184,0.5)', fontSize:'0.76rem' }}>Rate professors & browse feedback</p>
                            </div>
                        </div>
                        <div className="db-reviews-cta">Explore <ArrowRight size={14} /></div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <div className="db-lbl">
                    <div className="db-lbl-icon" style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)' }}>
                        <Zap size={11} color="#FBBF24" />
                    </div>
                    <span className="db-lbl-text">Quick Actions</span>
                </div>
                <div className="db-acts">
                    {actions.map((a,i) => (
                        <div key={i} className="db-act glass"
                            style={{ animationDelay:`${i*0.05}s` }}
                            onClick={()=>navigate(a.path)}
                            onMouseEnter={e=>{
                                e.currentTarget.style.background=a.bg;
                                e.currentTarget.style.borderColor=`${a.color}30`;
                                e.currentTarget.style.boxShadow=`0 10px 30px ${a.color}20`;
                            }}
                            onMouseLeave={e=>{
                                e.currentTarget.style.background='rgba(255,255,255,0.04)';
                                e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';
                                e.currentTarget.style.boxShadow='';
                            }}>
                            <div className="db-act-icon" style={{ background:a.bg, border:`1px solid ${a.color}28` }}>
                                <a.icon size={16} color={a.color} />
                            </div>
                            <span className="db-act-lbl">{a.label}</span>
                        </div>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
