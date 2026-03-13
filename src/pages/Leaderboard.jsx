import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Trophy, Crown, Flame, Zap, Users, CalendarDays, Bug, Star, Lightbulb, UserPlus, MessageSquare, MessageCircle, Pencil, Phone, ThumbsUp, ChevronDown, Medal } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Static Data ───────────────────────────────────────────────────────────────
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

const MEDAL_COLOR = ['#FFD700', '#D4D4D8', '#CD7F32'];
const MEDAL_GLOW  = ['rgba(255,215,0,0.55)', 'rgba(212,212,218,0.45)', 'rgba(205,127,50,0.5)'];
const RANK_BADGE_COLORS = [MEDAL_COLOR[0], MEDAL_COLOR[1], MEDAL_COLOR[2]];

// ── Helpers ──────────────────────────────────────────────────────────────────
const getWeekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
};

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter = ({ value }) => {
    const [disp, setDisp] = useState(0);
    useEffect(() => {
        let t0 = null;
        const dur = 900;
        const end = value;
        const tick = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setDisp(Math.round(end * e));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [value]);
    return <>{disp}</>;
};

// ── Particle starfield ────────────────────────────────────────────────────────
const StarField = () => {
    const ref = useRef(null);
    useEffect(() => {
        const c = ref.current; if (!c) return;
        const ctx = c.getContext('2d');
        let W = c.width = c.offsetWidth, H = c.height = c.offsetHeight;
        const stars = Array.from({ length: 70 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.4 + 0.2,
            a: Math.random(), da: (Math.random() - 0.5) * 0.004,
            vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (const s of stars) {
                s.x += s.vx; s.y += s.vy; s.a += s.da;
                if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
                if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
                s.a = Math.max(0.1, Math.min(1, s.a));
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,180,255,${s.a * 0.6})`; ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        const onResize = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
    }, []);
    return (
        <canvas ref={ref} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.7,
        }} />
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const Leaderboard = () => {
    const { user } = useAuth();
    const currentUid = auth.currentUser?.uid || user?.uid;

    const [tab,         setTab]      = useState('weekly');
    const [allUsers,    setAllUsers] = useState([]);
    const [loading,     setLoading]  = useState(true);
    const [showEarn,    setShowEarn] = useState(false);
    const [mounted,     setMounted]  = useState(false);

    const weekStart = getWeekStart();

    useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const list = snap.docs.map(d => {
                const data = d.data();
                const lr = data.pointsLastReset ? new Date(data.pointsLastReset) : null;
                const stale = !lr || lr < weekStart;
                return {
                    uid:          d.id,
                    name:         data.name || 'Student',
                    branch:       data.branch || '',
                    totalPoints:  data.totalPoints  || 0,
                    weeklyPoints: stale ? 0 : (data.weeklyPoints || 0),
                };
            }).filter(u => u.totalPoints > 0 || u.weeklyPoints > 0);
            setAllUsers(list);
            setLoading(false);
        }, (err) => { console.error(err); setLoading(false); });
        return () => unsub();
    }, []);

    const key    = tab === 'weekly' ? 'weeklyPoints' : 'totalPoints';
    const sorted = [...allUsers].sort((a, b) => (b[key] || 0) - (a[key] || 0));
    const top10  = sorted.slice(0, 10);
    const myIdx  = sorted.findIndex(u => u.uid === currentUid);
    const myRank = myIdx >= 0 ? myIdx + 1 : null;
    const myEntry = myIdx >= 0 ? sorted[myIdx] : null;
    const inTop10 = myRank !== null && myRank <= 10;
    const maxPts  = top10[0]?.[key] || 1;

    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const fmtDate = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

        .lb { font-family: 'DM Sans', sans-serif; color: #e2d9f3; }

        /* Keyframes */
        @keyframes lb-spin    { to { transform: rotate(360deg); } }
        @keyframes lb-rise    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lb-pop     { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 70%{transform:scale(1.06) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes lb-glow    { 0%,100%{box-shadow:0 0 24px rgba(255,215,0,0.25),0 0 0 1px rgba(255,215,0,0.2)} 50%{box-shadow:0 0 48px rgba(255,215,0,0.55),0 0 0 1px rgba(255,215,0,0.45)} }
        @keyframes lb-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes lb-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes lb-float   { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-7px) rotate(8deg)} }
        @keyframes lb-crown   { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-5px) rotate(4deg)} }
        @keyframes lb-bar     { from{width:0} to{width:var(--w,0%)} }
        @keyframes lb-scanline { from{transform:translateY(-100%)} to{transform:translateY(100%)} }

        /* Hero */
        .lb-hero {
            position: relative; overflow: hidden; border-radius: 28px;
            margin-bottom: 1.75rem; padding: 2.75rem 2rem 2rem;
            background: linear-gradient(140deg, #0c0118 0%, #100d2e 45%, #080f1f 100%);
            border: 1px solid rgba(130,90,255,0.22);
        }
        .lb-hero::after {
            content: ''; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(180deg, rgba(130,90,255,0.06) 0%, transparent 60%);
        }
        .lb-hero-title {
            font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1;
            letter-spacing: -2px; margin: 0 0 6px;
            font-size: clamp(2.2rem, 6vw, 3.5rem);
            background: linear-gradient(135deg, #FFD700 0%, #FF8C00 25%, #FF6B9D 55%, #BF5FFF 85%, #60BFFF 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            animation: lb-shimmer 6s linear infinite;
        }
        .lb-hero-sub { font-size: 0.82rem; color: rgba(180,155,255,0.5); margin: 0; letter-spacing: 0.3px; }

        /* Live pill */
        .lb-live {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
            background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3);
            color: #4ade80; letter-spacing: 0.5px;
        }
        .lb-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
            box-shadow: 0 0 7px #22c55e; animation: lb-pulse 2s ease-in-out infinite; }

        /* My rank */
        .lb-myrank {
            position: relative; border-radius: 20px; padding: 1.1rem 1.4rem;
            margin-bottom: 1.5rem; overflow: hidden;
            background: linear-gradient(135deg, rgba(96,165,250,0.09), rgba(139,92,246,0.09));
            border: 1px solid rgba(96,165,250,0.3);
            animation: lb-rise 0.45s ease both;
        }
        .lb-myrank::before {
            content: ''; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(90deg, transparent, rgba(96,165,250,0.07), transparent);
            background-size: 200% 100%; animation: lb-shimmer 4s linear infinite;
        }
        .lb-myrank-num {
            font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2.2rem; line-height: 1;
            background: linear-gradient(135deg, #60A5FA, #A78BFA);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        /* Tabs */
        .lb-tabs { display: flex; gap: 5px; background: rgba(255,255,255,0.04);
            border-radius: 16px; padding: 4px; margin-bottom: 1.5rem;
            border: 1px solid rgba(255,255,255,0.07); }
        .lb-tab { flex: 1; padding: 11px 8px; border-radius: 13px; border: none; cursor: pointer;
            font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.88rem;
            transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .lb-tab-on  { background: linear-gradient(135deg,rgba(130,90,255,0.35),rgba(70,40,190,0.35));
            color: #e0d0ff; border: 1px solid rgba(140,100,255,0.4);
            box-shadow: 0 4px 18px rgba(110,60,255,0.28), inset 0 1px 0 rgba(255,255,255,0.08); }
        .lb-tab-off { background: transparent; color: rgba(180,155,255,0.4); border: 1px solid transparent; }
        .lb-tab-off:hover { background: rgba(255,255,255,0.05); color: rgba(210,190,255,0.7); }

        /* Podium */
        .lb-podium { display: grid; grid-template-columns: 1fr 1.18fr 1fr;
            gap: 10px; margin-bottom: 1.75rem; align-items: end; }
        .lb-pod {
            border-radius: 22px; text-align: center; position: relative;
            overflow: hidden; cursor: default;
            transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .lb-pod:hover { transform: translateY(-8px) scale(1.03); }
        .lb-pod-gold   { background: linear-gradient(160deg,#19110a,#2c1d00); border: 1px solid rgba(255,215,0,0.35); animation: lb-glow 3.5s ease-in-out infinite; }
        .lb-pod-silver { background: linear-gradient(160deg,#101018,#1a1a2a); border: 1px solid rgba(200,200,225,0.2); }
        .lb-pod-bronze { background: linear-gradient(160deg,#130b00,#1f1200); border: 1px solid rgba(205,127,50,0.28); }
        .lb-pod-pts { font-family: 'Syne', sans-serif; font-weight: 800; }
        .lb-pod-floor { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; }

        /* List */
        .lb-list { border-radius: 22px; overflow: hidden; margin-bottom: 1.5rem;
            background: rgba(255,255,255,0.022); border: 1px solid rgba(255,255,255,0.07); }
        .lb-list-head { padding: 1rem 1.25rem; display: flex; justify-content: space-between;
            align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(90deg, rgba(110,60,255,0.08), rgba(50,100,255,0.05)); }
        .lb-row {
            display: flex; align-items: center; gap: 14px; padding: 12px 16px;
            transition: background 0.22s ease; cursor: default; position: relative;
        }
        .lb-row::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0;
            width: 3px; background: transparent; transition: background 0.22s; border-radius: 0 2px 2px 0; }
        .lb-row + .lb-row { border-top: 1px solid rgba(255,255,255,0.04); }
        .lb-row:hover { background: rgba(255,255,255,0.04); }
        .lb-row:hover::before { background: rgba(130,90,255,0.7); }
        .lb-row-me { background: linear-gradient(90deg, rgba(96,165,250,0.09), rgba(139,92,246,0.06)) !important; }
        .lb-row-me::before { background: linear-gradient(180deg, #60A5FA, #A78BFA) !important; }
        .lb-rank-badge {
            width: 32px; height: 32px; border-radius: 10px; display: flex;
            align-items: center; justify-content: center; flex-shrink: 0;
            font-size: 0.78rem; font-weight: 800;
        }
        .lb-bar-track { width: 56px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
        .lb-bar-fill  { height: 100%; border-radius: 2px; animation: lb-bar 0.9s ease-out both; }
        .lb-you { font-size: 0.62rem; background: linear-gradient(135deg,#3B82F6,#8B5CF6);
            padding: 2px 8px; border-radius: 20px; font-weight: 700; letter-spacing: 0.5px; flex-shrink: 0; }

        /* Earn */
        .lb-earn { border-radius: 22px; overflow: hidden;
            border: 1px solid rgba(251,191,36,0.18);
            background: linear-gradient(135deg, rgba(251,191,36,0.04), rgba(255,90,0,0.025)); }
        .lb-earn-head { padding: 1rem 1.25rem; display: flex; align-items: center;
            justify-content: space-between; cursor: pointer; user-select: none;
            background: linear-gradient(90deg, rgba(251,191,36,0.07), transparent);
            transition: background 0.2s; }
        .lb-earn-head:hover { background: rgba(251,191,36,0.11); }
        .lb-earn-item { display: flex; align-items: center; justify-content: space-between;
            padding: 9px 14px; border-radius: 10px; transition: background 0.2s; }
        .lb-earn-item:hover { background: rgba(255,255,255,0.05); }
        .lb-pts-badge { font-family: 'Syne',sans-serif; font-weight: 800; font-size: 0.82rem; color: #4ade80;
            background: rgba(74,222,128,0.1); padding: 2px 10px; border-radius: 20px;
            border: 1px solid rgba(74,222,128,0.2); flex-shrink: 0; }

        @media(max-width:520px) {
            .lb-podium { grid-template-columns: 1fr 1.1fr 1fr; gap: 7px; }
            .lb-hero   { padding: 2rem 1.2rem 1.5rem; }
            .lb-row    { padding: 10px 12px; gap: 10px; }
            .lb-bar-track { display: none; }
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
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '2.6rem', lineHeight: 1, animation: 'lb-float 3s ease-in-out infinite', display: 'inline-block' }}>
                                <Trophy size={44} style={{ filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.7))', color: '#FFD700' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 className="lb-hero-title">Leaderboard</h1>
                                <p className="lb-hero-sub">Earn points · Climb ranks · Be legendary</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1.4rem', alignItems: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                                background: 'rgba(130,90,255,0.15)', borderRadius: '20px',
                                border: '1px solid rgba(130,90,255,0.25)', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(200,175,255,0.8)' }}>
                                <Users size={12} /> {allUsers.length} students ranked
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                                background: 'rgba(60,100,255,0.12)', borderRadius: '20px',
                                border: '1px solid rgba(80,120,255,0.2)', fontSize: '0.75rem', color: 'rgba(160,185,255,0.7)' }}>
                                <CalendarDays size={12} /> {fmtDate(weekStart)} – {fmtDate(weekEnd)}
                            </div>
                            <div className="lb-live" style={{ marginLeft: 'auto' }}>
                                <div className="lb-live-dot" /> LIVE
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── My Rank Card ── */}
                {myEntry && (
                    <div className="lb-myrank">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{myEntry.name}</span>
                                    <span className="lb-you">YOU</span>
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'rgba(180,155,255,0.45)', marginTop: '3px' }}>
                                    {myEntry.branch || 'Student'} · <Counter value={myEntry[key] || 0} /> pts {tab === 'weekly' ? 'this week' : 'total'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div className="lb-myrank-num">#{myRank}</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(180,155,255,0.4)' }}>your rank</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="lb-tabs">
                    {[['weekly', <><Zap size={14} style={{marginRight:5,verticalAlign:'middle'}}/>This Week</>],
                  ['alltime', <><Crown size={14} style={{marginRight:5,verticalAlign:'middle'}}/>All Time</>]].map(([id, label]) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`lb-tab ${tab === id ? 'lb-tab-on' : 'lb-tab-off'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Podium ── */}
                {!loading && top10.length >= 3 && (
                    <div className="lb-podium">
                        {[1, 0, 2].map((ri, col) => {
                            const entry = top10[ri];
                            if (!entry) return <div key={col} />;
                            const isMe = entry.uid === currentUid;
                            const mc   = MEDAL_COLOR[ri];
                            const mg   = MEDAL_GLOW[ri];
                            const cls  = ['lb-pod-silver', 'lb-pod-gold', 'lb-pod-bronze'][col];
                            const pad  = ri === 0 ? '2.2rem 0.8rem 1.4rem' : '1.6rem 0.7rem 1.2rem';
                            return (
                                <div key={entry.uid} className={`lb-pod ${cls}`}
                                    style={{ padding: pad, outline: isMe ? '2px solid rgba(96,165,250,0.55)' : 'none',
                                        animation: `lb-rise 0.5s ${col * 0.07}s ease both` }}>

                                    {ri === 0 && (
                                        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                            animation: 'lb-crown 2.8s ease-in-out infinite', zIndex: 3,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Crown size={26} style={{ color: '#FFD700', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.8))' }} />
                                        </div>
                                    )}

                                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '0.76rem',
                                        margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        padding: '0 6px', position: 'relative', zIndex: 1 }}>
                                        {entry.name}{isMe ? <span style={{marginLeft:4,verticalAlign:'middle'}}><Flame size={13} style={{color:'#F87171',display:'inline'}}/></span> : ''}
                                    </p>
                                    {entry.branch && (
                                        <p style={{ fontSize: '0.63rem', color: 'rgba(180,155,255,0.38)', margin: '0 0 8px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            position: 'relative', zIndex: 1 }}>
                                            {entry.branch}
                                        </p>
                                    )}

                                    <div className="lb-pod-pts" style={{ fontSize: ri === 0 ? '1.55rem' : '1.2rem',
                                        color: mc, textShadow: `0 0 14px ${mg}`, position: 'relative', zIndex: 1 }}>
                                        <Counter value={entry[key] || 0} />
                                        <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)',
                                            marginLeft: '3px', fontFamily: 'DM Sans,sans-serif' }}>pts</span>
                                    </div>

                                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
                                        <Medal size={18} style={{ color: RANK_BADGE_COLORS[ri], filter: `drop-shadow(0 0 6px ${MEDAL_GLOW[ri]})` }} />
                                    </div>

                                    <div className="lb-pod-floor" style={{ background: `linear-gradient(90deg,${mc}00,${mc}55,${mc}00)` }} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Top 10 List ── */}
                <div className="lb-list">
                    <div className="lb-list-head">
                        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '0.88rem',
                            color: 'rgba(210,195,255,0.8)' }}>Top 10 Rankings</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(180,155,255,0.38)', fontWeight: '500', display:'flex', alignItems:'center', gap:'4px' }}>
                            {tab === 'weekly' ? <><Zap size={11}/>This week</> : <><Crown size={11}/>All time</>}
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(180,155,255,0.45)' }}>
                            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(130,90,255,0.2)',
                                borderTopColor: '#8B5CF6', borderRadius: '50%', margin: '0 auto 14px',
                                animation: 'lb-spin 0.75s linear infinite' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading rankings…</p>
                        </div>
                    ) : top10.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(180,155,255,0.35)' }}>
                            <Trophy size={48} style={{ opacity: 0.2, color: '#FBBF24', marginBottom: '14px' }} />
                            <p style={{ fontWeight: '700', margin: '0 0 6px' }}>No rankings yet</p>
                            <p style={{ fontSize: '0.8rem', margin: 0 }}>Be the first — review faculty or submit feedback!</p>
                        </div>
                    ) : (
                        top10.map((entry, idx) => {
                            const rank  = idx + 1;
                            const isMe  = entry.uid === currentUid;
                            const isTop = rank <= 3;
                            const mc    = isTop ? MEDAL_COLOR[rank - 1] : null;
                            const pct   = Math.round(((entry[key] || 0) / maxPts) * 100);
                            const bar   = isTop ? mc : '#8B5CF6';
                            return (
                                <div key={entry.uid} className={`lb-row${isMe ? ' lb-row-me' : ''}`}
                                    style={{ animation: `lb-rise 0.4s ${idx * 0.045}s ease both` }}>

                                    <div className="lb-rank-badge" style={{
                                        background: isTop ? `${mc}18` : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${isTop ? mc + '40' : 'rgba(255,255,255,0.08)'}`,
                                        color: isTop ? mc : 'rgba(180,155,255,0.45)',
                                        fontSize: isTop ? '1rem' : '0.78rem',
                                    }}>
                                        {isTop ? <Medal size={16} style={{ color: RANK_BADGE_COLORS[rank-1], filter:`drop-shadow(0 0 5px ${MEDAL_GLOW[rank-1]})` }} /> : `#${rank}`}
                                    </div>

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
                                                        background: `linear-gradient(90deg,${bar}66,${bar})`,
                                                        animationDelay: `${idx * 0.06 + 0.25}s` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '1.1rem',
                                            color: isTop ? mc : (isMe ? '#93C5FD' : 'rgba(215,205,255,0.85)'),
                                            textShadow: isTop ? `0 0 10px ${MEDAL_GLOW[rank-1]}` : 'none' }}>
                                            <Counter value={entry[key] || 0} />
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(180,155,255,0.3)', letterSpacing: '0.5px' }}>PTS</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
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
                            <Zap size={16} style={{ color: '#FBBF24', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
                            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: '800', fontSize: '0.88rem',
                                color: 'rgba(251,191,36,0.88)' }}>How to Earn Points</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(180,155,255,0.38)' }}>
                                {showEarn ? 'Collapse' : 'Tap to expand'}
                            </span>
                            <ChevronDown size={16} style={{ color: 'rgba(251,191,36,0.5)',
                                transition: 'transform 0.3s', transform: showEarn ? 'rotate(180deg)' : 'rotate(0)' }} />
                        </div>
                    </div>

                    {showEarn && (
                        <div style={{ padding: '0.75rem', display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: '5px' }}>
                            {HOW_TO_EARN.map((item, i) => (
                                <div key={item.label} className="lb-earn-item"
                                    style={{ animation: `lb-rise 0.32s ${i * 0.035}s ease both` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
