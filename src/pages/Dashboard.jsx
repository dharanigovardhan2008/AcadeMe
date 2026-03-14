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
        { icon:TrendingUp, value:cgpa,  label:'Current CGPA',      suffix:'',  decimals:2, color:'#60A5FA', glow:'rgba(96,165,250,0.28)',   grad:'linear-gradient(135deg,rgba(96,165,250,0.14),rgba(59,130,246,0.06))',  bar:cgpa/10,                   detail:`${cgpaSubjects.length} subjects` },
        { icon:Calendar,   value:attendance, label:'Attendance',   suffix:'%', decimals:0, color:attSafe?'#34D399':'#F87171', glow:attSafe?'rgba(52,211,153,0.28)':'rgba(248,113,113,0.28)', grad:attSafe?'linear-gradient(135deg,rgba(52,211,153,0.14),rgba(16,185,129,0.06))':'linear-gradient(135deg,rgba(248,113,113,0.14),rgba(239,68,68,0.06))', bar:attendance/100, detail:attSafe?'Safe ✓':'Below 80% ⚠' },
        { icon:BookOpen,   value:cgpaSubjects.length, label:'Active Subjects', suffix:'', decimals:0, color:'#A78BFA', glow:'rgba(167,139,250,0.28)', grad:'linear-gradient(135deg,rgba(167,139,250,0.14),rgba(124,58,237,0.06))', bar:Math.min(cgpaSubjects.length/10,1), detail:'This semester' },
        { icon:Users,      value:faculty.length||0,   label:'Faculty Members', suffix:'+',decimals:0, color:'#F472B6', glow:'rgba(244,114,182,0.28)', grad:'linear-gradient(135deg,rgba(244,114,182,0.14),rgba(219,39,119,0.06))', bar:0.7, detail:'In directory', onClick:()=>navigate('/faculty') },
    ];

    const actions = [
        { label:'My Courses',      icon:BookOpen,   path:'/courses',     color:'#60A5FA', bg:'rgba(96,165,250,0.1)'   },
        { label:'CGPA Calculator', icon:Calculator, path:'/calc',        color:'#A78BFA', bg:'rgba(167,139,250,0.1)'  },
        { label:'Attendance',      icon:Calendar,   path:'/attendance',  color:'#34D399', bg:'rgba(52,211,153,0.1)'   },
        { label:'Faculty',         icon:Users,      path:'/faculty',     color:'#F472B6', bg:'rgba(244,114,182,0.1)'  },
        { label:'Resources Hub',   icon:Layers,     path:'/resources',   color:'#FB923C', bg:'rgba(251,146,60,0.1)'   },
        { label:'Leaderboard',     icon:Trophy,     path:'/leaderboard', color:'#FBBF24', bg:'rgba(251,191,36,0.1)'   },
    ];

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }

        @keyframes db-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes db-bar  { from{width:0} to{width:var(--w,0%)} }
        @keyframes db-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes db-glow { 0%,100%{opacity:0.18} 50%{opacity:0.35} }

        .db { font-family:'Plus Jakarta Sans',sans-serif; width:100%; }

        /* HERO */
        .db-hero {
            position:relative; overflow:hidden; border-radius:24px;
            padding:2rem 1.5rem 1.75rem; margin-bottom:1.5rem;
            background:linear-gradient(135deg,#0d0d2e 0%,#0f172a 50%,#0a0d1f 100%);
            border:1px solid rgba(148,163,184,0.09);
            animation:db-up 0.45s ease both;
        }
        .db-hero::before { content:''; position:absolute; top:-60px; right:-60px; width:240px; height:240px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,0.16),transparent 65%); pointer-events:none; }
        .db-hero::after  { content:''; position:absolute; bottom:-40px; left:-20px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle,rgba(56,189,248,0.09),transparent 65%); pointer-events:none; }
        .db-hero-h {
            font-size:clamp(1.4rem,5vw,2rem); font-weight:800; margin:0 0 4px; letter-spacing:-0.4px;
            background:linear-gradient(135deg,#fff 0%,#94A3B8 100%);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .db-quote {
            padding:.7rem .9rem; border-left:3px solid rgba(99,102,241,0.55);
            background:rgba(99,102,241,0.07); border-radius:0 10px 10px 0;
            font-size:0.8rem; color:rgba(148,163,184,0.65); font-style:italic; line-height:1.55;
        }

        /* SECTION LABEL */
        .db-lbl {
            display:flex; align-items:center; gap:7px; margin-bottom:.8rem;
            font-size:0.72rem; font-weight:700; letter-spacing:.7px;
            text-transform:uppercase; color:rgba(148,163,184,0.4);
        }
        .db-lbl::after { content:''; flex:1; height:1px; background:rgba(148,163,184,0.07); }

        /* ANNOUNCEMENTS */
        .db-ann { margin-bottom:1.4rem; animation:db-up 0.45s 0.07s ease both; }
        .db-ann-head {
            display:flex; align-items:center; gap:9px;
            padding:.9rem 1.1rem; border-radius:16px 16px 0 0;
            background:linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.05));
            border:1px solid rgba(251,191,36,0.18); border-bottom:none;
        }
        .db-ann-body {
            border:1px solid rgba(251,191,36,0.13); border-top:none;
            border-radius:0 0 16px 16px; overflow:hidden;
            background:rgba(12,17,38,0.8);
        }
        .db-ann-row {
            display:flex; gap:11px; padding:.95rem 1.1rem;
            border-bottom:1px solid rgba(255,255,255,0.05);
            transition:background 0.18s; animation:db-up 0.35s ease both;
        }
        .db-ann-row:last-child { border-bottom:none; }
        .db-ann-row:hover { background:rgba(251,191,36,0.04); }
        .db-ann-dot { width:6px; height:6px; border-radius:50%; background:#FBBF24; flex-shrink:0; margin-top:6px; animation:db-dot 2.5s ease-in-out infinite; }

        /* Open resource link in announcements */
        .db-rlink {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:8px; margin-top:7px;
            background:rgba(96,165,250,0.1); border:1px solid rgba(96,165,250,0.22);
            color:#60A5FA; font-size:0.74rem; font-weight:700;
            text-decoration:none; cursor:pointer;
            -webkit-tap-highlight-color:transparent;
            transition:background 0.2s;
        }
        .db-rlink:hover { background:rgba(96,165,250,0.18); }

        /* STATS */
        .db-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:.85rem; margin-bottom:1.4rem; animation:db-up 0.45s 0.11s ease both; }
        @media(min-width:640px) { .db-stats { grid-template-columns:repeat(4,1fr); } }
        .db-stat {
            position:relative; overflow:hidden; border-radius:18px; padding:1.05rem;
            background:rgba(12,17,38,0.8); border:1px solid rgba(148,163,184,0.09);
            transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.25s;
        }
        .db-stat:hover { transform:translateY(-4px); }
        .db-stat::after { content:''; position:absolute; inset:0; border-radius:inherit; background:linear-gradient(135deg,rgba(255,255,255,0.03),transparent 55%); pointer-events:none; }
        .db-stat-glow { position:absolute; top:-18px; right:-18px; width:80px; height:80px; border-radius:50%; pointer-events:none; opacity:0.18; animation:db-glow 3s ease-in-out infinite; }
        .db-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:.65rem; }
        .db-stat-val { font-size:clamp(1.55rem,4vw,2.1rem); font-weight:800; line-height:1; margin:0 0 2px; letter-spacing:-1px; }
        .db-stat-lbl { font-size:0.69rem; color:rgba(148,163,184,0.45); margin:0 0 .6rem; font-weight:500; }
        .db-stat-track { height:3px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
        .db-stat-fill  { height:100%; border-radius:2px; animation:db-bar 1.1s ease-out both; }
        .db-stat-det   { font-size:0.63rem; font-weight:700; margin-top:4px; }

        /* REVIEWS BANNER */
        .db-reviews {
            position:relative; overflow:hidden; border-radius:20px;
            padding:1.3rem 1.1rem; margin-bottom:1.4rem; cursor:pointer;
            background:linear-gradient(135deg,rgba(12,17,38,0.95),rgba(18,9,35,0.95));
            border:1px solid rgba(236,72,153,0.22);
            transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.25s;
            animation:db-up 0.45s 0.17s ease both;
        }
        .db-reviews:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(236,72,153,0.18); border-color:rgba(236,72,153,0.38); }
        .db-reviews-blob { position:absolute; top:-40%; right:-5%; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle,rgba(236,72,153,0.16),transparent 70%); filter:blur(28px); pointer-events:none; }

        /* QUICK ACTIONS */
        .db-acts { display:grid; grid-template-columns:repeat(3,1fr); gap:.85rem; margin-bottom:1rem; animation:db-up 0.45s 0.22s ease both; }
        @media(min-width:580px) { .db-acts { grid-template-columns:repeat(6,1fr); } }
        .db-act {
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:7px; padding:.9rem .4rem; border-radius:18px; cursor:pointer;
            background:rgba(12,17,38,0.8); border:1px solid rgba(148,163,184,0.09);
            min-height:88px; transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
            -webkit-tap-highlight-color:transparent; position:relative; overflow:hidden;
        }
        .db-act:hover  { transform:translateY(-4px); }
        .db-act:active { transform:scale(0.94); }
        .db-act-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .db-act-lbl  { font-size:0.62rem; font-weight:700; text-align:center; line-height:1.3; color:rgba(226,232,240,0.75); }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className="db" style={{ opacity:mounted?1:0, transition:'opacity 0.3s ease' }}>

                {/* ── HERO ── */}
                <div className="db-hero">
                    <TrendingUp size={130} style={{ position:'absolute', right:-15, top:-15, opacity:0.055, pointerEvents:'none' }} />
                    <div style={{ position:'relative', zIndex:1 }}>
                        <h1 className="db-hero-h">{greeting}, {userName} {greetMoji}</h1>
                        <p style={{ margin:'0 0 1rem', fontSize:'0.78rem', color:'rgba(148,163,184,0.45)' }}>
                            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                        </p>
                        <div className="db-quote">"{quote}"</div>
                    </div>
                </div>

                {/* ── ANNOUNCEMENTS — first, with working links ── */}
                {updates.length > 0 && (
                    <div className="db-ann">
                        <div className="db-lbl"><Megaphone size={12} color="#FBBF24" /> Announcements</div>
                        <div className="db-ann-head">
                            <div style={{ width:'32px', height:'32px', borderRadius:'9px', flexShrink:0,
                                background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.22)',
                                display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Megaphone size={15} color="#FBBF24" />
                            </div>
                            <span style={{ fontWeight:800, fontSize:'0.88rem', color:'#FBBF24' }}>Latest Announcements</span>
                            <span style={{ marginLeft:'auto', fontSize:'0.67rem', fontWeight:700,
                                color:'rgba(251,191,36,0.55)', background:'rgba(251,191,36,0.1)',
                                padding:'2px 8px', borderRadius:'10px' }}>
                                {updates.length} new
                            </span>
                        </div>
                        <div className="db-ann-body">
                            {updates.map((u, idx) => (
                                <div key={u.id} className="db-ann-row" style={{ animationDelay:`${idx*0.05}s` }}>
                                    <div className="db-ann-dot" />
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', flexWrap:'wrap', marginBottom:'3px' }}>
                                            <span style={{ fontWeight:700, fontSize:'0.86rem', color:'#E2E8F0', lineHeight:1.35 }}>
                                                {u.title}
                                            </span>
                                            <span style={{ fontSize:'0.65rem', color:'rgba(148,163,184,0.38)', flexShrink:0, fontWeight:600 }}>
                                                {u.date ? new Date(u.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : ''}
                                            </span>
                                        </div>
                                        {u.message && (
                                            <p style={{ margin:'0 0 0', fontSize:'0.78rem', color:'rgba(148,163,184,0.58)', lineHeight:1.5 }}>
                                                {u.message}
                                            </p>
                                        )}
                                        {/* ── LINK — restored & working ── */}
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
                <div className="db-lbl"><TrendingUp size={12} color="#60A5FA" /> Your Progress</div>
                <div className="db-stats">
                    {stats.map((s, i) => (
                        <div key={i} className="db-stat"
                            style={{ animationDelay:`${i*0.07}s`, animation:'db-up 0.4s ease both', cursor:s.onClick?'pointer':'default' }}
                            onClick={s.onClick}
                            onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 8px 28px ${s.glow}`; e.currentTarget.style.borderColor=`${s.color}28`; }}
                            onMouseLeave={e=>{ e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor='rgba(148,163,184,0.09)'; }}>
                            <div className="db-stat-glow" style={{ background:`radial-gradient(circle,${s.color},transparent 70%)` }} />
                            <div className="db-stat-icon" style={{ background:s.grad }}>
                                <s.icon size={17} color={s.color} />
                            </div>
                            <div className="db-stat-val" style={{ color:s.color }}>
                                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                            </div>
                            <p className="db-stat-lbl">{s.label}</p>
                            <div className="db-stat-track">
                                <div className="db-stat-fill" style={{ '--w':`${Math.round(s.bar*100)}%`, width:`${Math.round(s.bar*100)}%`, background:`linear-gradient(90deg,${s.color}44,${s.color})`, animationDelay:`${i*0.1+0.4}s` }} />
                            </div>
                            <div className="db-stat-det" style={{ color:s.color }}>{s.detail}</div>
                        </div>
                    ))}
                </div>

                {/* ── FACULTY REVIEWS ── */}
                <div className="db-lbl"><MessageSquare size={12} color="#EC4899" /> Community</div>
                <div className="db-reviews" onClick={()=>navigate('/reviews')}>
                    <div className="db-reviews-blob" />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'14px', flexWrap:'wrap', position:'relative', zIndex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                            <div style={{ width:'48px', height:'48px', borderRadius:'14px', flexShrink:0,
                                background:'linear-gradient(135deg,#EC4899,#BE185D)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow:'0 6px 18px rgba(236,72,153,0.38)' }}>
                                <MessageSquare size={22} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize:'clamp(0.95rem,3.5vw,1.2rem)', fontWeight:800, margin:'0 0 3px', color:'#F9FAFB' }}>Faculty Reviews</h2>
                                <p style={{ color:'rgba(148,163,184,0.55)', fontSize:'0.77rem', margin:0 }}>Rate professors & browse feedback</p>
                            </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', color:'#EC4899', fontWeight:800, fontSize:'0.82rem',
                            background:'rgba(236,72,153,0.1)', padding:'8px 14px', borderRadius:'22px',
                            border:'1px solid rgba(236,72,153,0.22)', flexShrink:0 }}>
                            Explore <ArrowRight size={15} />
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <div className="db-lbl"><Zap size={12} color="#FBBF24" /> Quick Actions</div>
                <div className="db-acts">
                    {actions.map((a,i) => (
                        <div key={i} className="db-act"
                            style={{ animationDelay:`${i*0.05}s`, animation:'db-up 0.4s ease both' }}
                            onClick={()=>navigate(a.path)}
                            onMouseEnter={e=>{ e.currentTarget.style.background=a.bg; e.currentTarget.style.borderColor=`${a.color}30`; e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}18`; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(12,17,38,0.8)'; e.currentTarget.style.borderColor='rgba(148,163,184,0.09)'; e.currentTarget.style.boxShadow=''; }}>
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
