import React, { useState, useEffect } from 'react';
import {
    BookOpen, FileText, PlayCircle, Map,
    Layers, FlaskConical, HelpCircle, CheckSquare,
    SearchX, ExternalLink, Sparkles,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL = 300000;
const getCache = (key) => {
    try {
        const v = sessionStorage.getItem(key), t = sessionStorage.getItem(`${key}_t`);
        if (!v || !t || Date.now() - +t > CACHE_TTL) return null;
        return JSON.parse(v);
    } catch { return null; }
};
const setCache = (key, data) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem(`${key}_t`, Date.now().toString());
    } catch {}
};

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
    {
        id: 'concept-maps', label: 'Concept Maps', icon: Map, type: 'concept-map',
        color: '#00E5FF', dim: '#0097A7',
        grad: 'linear-gradient(135deg,#00E5FF,#0097A7)',
        glow: 'rgba(0,229,255,0.35)', bg: 'rgba(0,229,255,0.08)',
    },
    {
        id: 'papers', label: 'Papers', icon: FileText, type: 'paper',
        color: '#7C6FFF', dim: '#4C46C8',
        grad: 'linear-gradient(135deg,#7C6FFF,#4C46C8)',
        glow: 'rgba(124,111,255,0.35)', bg: 'rgba(124,111,255,0.08)',
    },
    {
        id: 'syllabus', label: 'Syllabus', icon: BookOpen, type: 'syllabus',
        color: '#00E896', dim: '#00A86B',
        grad: 'linear-gradient(135deg,#00E896,#00A86B)',
        glow: 'rgba(0,232,150,0.35)', bg: 'rgba(0,232,150,0.08)',
    },
    {
        id: 'lab-manuals', label: 'Lab Manuals', icon: FlaskConical, type: 'lab-manual',
        color: '#FF6B6B', dim: '#C0392B',
        grad: 'linear-gradient(135deg,#FF6B6B,#C0392B)',
        glow: 'rgba(255,107,107,0.35)', bg: 'rgba(255,107,107,0.08)',
    },
    {
        id: 'imp-questions', label: 'Imp Questions', icon: HelpCircle, type: 'imp-question',
        color: '#FFD60A', dim: '#B8860B',
        grad: 'linear-gradient(135deg,#FFD60A,#FF9500)',
        glow: 'rgba(255,214,10,0.35)', bg: 'rgba(255,214,10,0.08)',
    },
    {
        id: 'mcqs', label: 'MCQs', icon: CheckSquare, type: 'mcq',
        color: '#D946EF', dim: '#9D174D',
        grad: 'linear-gradient(135deg,#D946EF,#9D174D)',
        glow: 'rgba(217,70,239,0.35)', bg: 'rgba(217,70,239,0.08)',
    },
    {
        id: 'lectures', label: 'Videos', icon: PlayCircle, type: null,
        color: '#FF7A00', dim: '#C2410C',
        grad: 'linear-gradient(135deg,#FF7A00,#FF4500)',
        glow: 'rgba(255,122,0,0.35)', bg: 'rgba(255,122,0,0.08)',
    },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const ResourcesHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('concept-maps');
    const [resources, setResources] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [mounted,   setMounted]   = useState(false);

    useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

    useEffect(() => {
        if (!user?.branch) return;
        const key = `resources_${user.branch}`;
        const hit = getCache(key);
        if (hit) { setResources(hit); setLoading(false); return; }
        setLoading(true);
        getDocs(query(collection(db, 'resources'), where('branches', 'array-contains', user.branch)))
            .then(snap => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); setResources(list); setCache(key, list); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.branch]);

    const cfg      = TABS.find(t => t.id === activeTab);
    const filtered = resources.filter(r => r.type === cfg?.type);

    return (
        <DashboardLayout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

                * { box-sizing: border-box; }

                /* ── Keyframes ── */
                @keyframes rh-rise    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes rh-pulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
                @keyframes rh-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes rh-glow    { 0%,100%{opacity:0.5} 50%{opacity:1} }
                @keyframes rh-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes rh-spin    { to{transform:rotate(360deg)} }

                /* ── Page ── */
                .rh { font-family:'DM Sans',sans-serif; width:100%; overflow-x:hidden; }

                /* ── Hero header ── */
                .rh-hero {
                    position: relative; overflow: hidden;
                    border-radius: 22px; padding: 1.4rem 1.2rem 0;
                    margin-bottom: 1.1rem;
                    background: linear-gradient(135deg, #0a0118 0%, #0d0d2b 50%, #060f1a 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .rh-hero::before {
                    content:''; position:absolute; top:-40px; right:-40px;
                    width:180px; height:180px; border-radius:50%;
                    background: radial-gradient(circle, rgba(124,111,255,0.2), transparent 70%);
                    pointer-events:none;
                }
                .rh-hero::after {
                    content:''; position:absolute; bottom:-30px; left:-20px;
                    width:140px; height:140px; border-radius:50%;
                    background: radial-gradient(circle, rgba(0,229,255,0.12), transparent 70%);
                    pointer-events:none;
                }
                .rh-hero-title {
                    font-family:'Syne',sans-serif; font-weight:800;
                    font-size:clamp(1.35rem,5vw,1.9rem);
                    margin:0; line-height:1.1; letter-spacing:-0.5px;
                    background: linear-gradient(135deg,#ffffff 0%,#b4aeff 50%,#00e5ff 100%);
                    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
                }

                /* ── Tab grid ── */
                .rh-tab-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 7px;
                    padding: 1rem 0 1.1rem;
                    position: relative; z-index: 1;
                }
                @media (max-width:370px) { .rh-tab-grid { grid-template-columns: repeat(3,1fr); gap:6px; } }
                @media (min-width:600px) { .rh-tab-grid { grid-template-columns: repeat(7,1fr); } }

                /* ── Tab pill ── */
                .rh-tab {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; gap: 6px;
                    padding: 11px 4px 10px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.07);
                    background: rgba(255,255,255,0.04);
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.67rem; font-weight: 500;
                    color: rgba(180,175,220,0.6);
                    text-align: center; line-height: 1.25;
                    min-height: 62px;
                    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    -webkit-tap-highlight-color: transparent;
                    word-break: break-word;
                    position: relative; overflow: hidden;
                }
                .rh-tab::before {
                    content:''; position:absolute; inset:0; opacity:0;
                    background: linear-gradient(135deg,rgba(255,255,255,0.06),transparent);
                    transition: opacity 0.2s;
                }
                .rh-tab:hover::before { opacity:1; }
                .rh-tab:hover { border-color:rgba(255,255,255,0.14); color:rgba(255,255,255,0.85); transform:translateY(-2px); }
                .rh-tab.on { font-weight:700; border-width:1.5px; transform:translateY(-2px); }
                .rh-tab.on::after {
                    content:''; position:absolute; bottom:0; left:20%; right:20%; height:2px;
                    border-radius:2px 2px 0 0; background:currentColor; opacity:0.7;
                }

                /* ── Resource grid ── */
                .rh-grid {
                    display:grid; grid-template-columns:1fr;
                    gap:0.9rem; width:100%;
                }
                @media (min-width:580px) { .rh-grid { grid-template-columns:repeat(2,1fr); } }
                @media (min-width:900px) { .rh-grid { grid-template-columns:repeat(3,1fr); } }

                /* ── Resource card ── */
                .rh-card {
                    position: relative; overflow: hidden;
                    border-radius: 18px;
                    padding: 1.1rem;
                    display: flex; flex-direction: column; gap: 0.75rem;
                    background: rgba(255,255,255,0.035);
                    border: 1px solid rgba(255,255,255,0.08);
                    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s;
                    animation: rh-rise 0.4s ease both;
                }
                .rh-card:hover { transform: translateY(-4px); }
                .rh-card-glow {
                    position:absolute; top:-30px; right:-30px; width:100px; height:100px;
                    border-radius:50%; pointer-events:none; opacity:0.25;
                    animation: rh-glow 3s ease-in-out infinite;
                }
                .rh-card-bar {
                    position:absolute; top:0; left:0; right:0; height:3px; border-radius:18px 18px 0 0;
                }

                /* ── Open button ── */
                .rh-btn {
                    display:flex; align-items:center; justify-content:center; gap:8px;
                    width:100%; padding:13px 16px; border-radius:13px; border:none;
                    font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:700;
                    cursor:pointer; text-decoration:none; color:#fff;
                    min-height:48px; margin-top:auto;
                    -webkit-tap-highlight-color:transparent;
                    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
                    position:relative; overflow:hidden;
                }
                .rh-btn::before {
                    content:''; position:absolute; inset:0; opacity:0;
                    background:rgba(255,255,255,0.15);
                    transition:opacity 0.2s;
                }
                .rh-btn:hover::before { opacity:1; }
                .rh-btn:active { transform:scale(0.97); opacity:0.9; }

                /* ── Icon wrapper on card ── */
                .rh-card-icon {
                    width:40px; height:40px; border-radius:12px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center;
                }

                /* ── Skeleton ── */
                .rh-skel-card {
                    border-radius:18px; padding:1.1rem;
                    background:rgba(255,255,255,0.03);
                    border:1px solid rgba(255,255,255,0.06);
                    display:flex; flex-direction:column; gap:0.75rem;
                    animation: rh-pulse 1.5s ease-in-out infinite;
                }
                .rh-skel-line { border-radius:8px; background:rgba(255,255,255,0.08); }

                /* ── Empty / coming soon ── */
                .rh-empty {
                    border-radius:20px; padding:3.5rem 1.5rem;
                    text-align:center; display:flex; flex-direction:column;
                    align-items:center; gap:1rem;
                    background:rgba(255,255,255,0.025);
                    border:1px solid rgba(255,255,255,0.07);
                    animation: rh-rise 0.4s ease both;
                }
                .rh-empty-icon {
                    width:64px; height:64px; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                }

                /* ── Tag pill ── */
                .rh-tag {
                    display:inline-flex; align-items:center;
                    font-size:0.7rem; font-weight:700; padding:3px 10px;
                    border-radius:20px; letter-spacing:0.3px;
                }
            `}</style>

            <div className="rh" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s' }}>

                {/* ── Hero header with live tab grid ── */}
                <div className="rh-hero">
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                                background: 'linear-gradient(135deg,rgba(0,229,255,0.25),rgba(124,111,255,0.2))',
                                border: '1px solid rgba(0,229,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#00E5FF', animation: 'rh-float 3s ease-in-out infinite',
                            }}>
                                <Layers size={20} />
                            </div>
                            <div>
                                <h1 className="rh-hero-title">Resources Hub</h1>
                                <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'rgba(180,175,220,0.5)', fontFamily: 'DM Sans,sans-serif' }}>
                                    Everything you need to succeed · {user?.branch || ''}
                                </p>
                            </div>
                        </div>

                        {/* Tab grid — GRID layout, never scrolls, always wraps */}
                        <div className="rh-tab-grid">
                            {TABS.map(tab => {
                                const on = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`rh-tab${on ? ' on' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={on ? {
                                            background: tab.bg,
                                            borderColor: tab.color + '55',
                                            color: tab.color,
                                            boxShadow: `0 4px 16px ${tab.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                                        } : {}}
                                    >
                                        <tab.icon size={17} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="rh-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rh-skel-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="rh-skel-line" style={{ height: '16px', width: '60%' }} />
                                <div className="rh-skel-line" style={{ height: '13px', width: '35%' }} />
                                <div className="rh-skel-line" style={{ height: '48px', width: '100%', marginTop: '4px' }} />
                            </div>
                        ))}
                    </div>

                ) : activeTab === 'lectures' ? (
                    <div className="rh-empty">
                        <div className="rh-empty-icon" style={{ background: 'rgba(255,122,0,0.12)', border: '1px solid rgba(255,122,0,0.25)' }}>
                            <PlayCircle size={30} color="#FF7A00" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontFamily: 'Syne,sans-serif', fontSize: '1.05rem', fontWeight: '800' }}>
                                Video Lectures Coming Soon
                            </h3>
                            <p style={{ margin: 0, color: 'rgba(180,175,220,0.5)', fontSize: '0.84rem' }}>
                                We're curating the best content for you.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                            background: 'rgba(255,122,0,0.08)', borderRadius: '20px', border: '1px solid rgba(255,122,0,0.2)' }}>
                            <Sparkles size={13} color="#FF7A00" />
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#FF7A00' }}>Stay tuned!</span>
                        </div>
                    </div>

                ) : filtered.length === 0 ? (
                    <div className="rh-empty">
                        <div className="rh-empty-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                            <SearchX size={28} color={cfg.color} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontFamily: 'Syne,sans-serif', fontSize: '1.05rem', fontWeight: '800' }}>
                                No {cfg.label} Yet
                            </h3>
                            <p style={{ margin: 0, color: 'rgba(180,175,220,0.5)', fontSize: '0.84rem', maxWidth: '240px' }}>
                                Nothing uploaded for {user?.branch || 'your branch'} yet. Check back soon!
                            </p>
                        </div>
                    </div>

                ) : (
                    <div className="rh-grid">
                        {filtered.map((res, idx) => (
                            <div
                                key={res.id || idx}
                                className="rh-card"
                                style={{
                                    animationDelay: `${idx * 0.06}s`,
                                    borderColor: `${cfg.color}18`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = `0 8px 32px ${cfg.glow}, 0 0 0 1px ${cfg.color}25`;
                                    e.currentTarget.style.borderColor = `${cfg.color}35`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = '';
                                    e.currentTarget.style.borderColor = `${cfg.color}18`;
                                }}
                            >
                                {/* Glow blob top-right */}
                                <div className="rh-card-glow" style={{ background: `radial-gradient(circle,${cfg.color},transparent 70%)` }} />

                                {/* Top accent bar */}
                                <div className="rh-card-bar" style={{ background: cfg.grad }} />

                                {/* Icon + title row */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '4px' }}>
                                    <div className="rh-card-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                                        <cfg.icon size={18} color={cfg.color} />
                                    </div>
                                    <h3 style={{
                                        margin: 0, flex: 1,
                                        fontFamily: 'Syne,sans-serif', fontWeight: '700',
                                        fontSize: 'clamp(0.87rem,3.5vw,0.98rem)',
                                        lineHeight: 1.4, wordBreak: 'break-word',
                                        color: '#f0ecff',
                                    }}>
                                        {res.title}
                                    </h3>
                                </div>

                                {/* Tags */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span className="rh-tag" style={{
                                        background: cfg.bg, color: cfg.color,
                                        border: `1px solid ${cfg.color}35`,
                                    }}>
                                        {cfg.label}
                                    </span>
                                    {user?.branch && (
                                        <span className="rh-tag" style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'rgba(180,175,220,0.55)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}>
                                            {user.branch}
                                        </span>
                                    )}
                                </div>

                                {/* CTA button — vivid, always visible */}
                                <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rh-btn"
                                    style={{
                                        background: cfg.grad,
                                        boxShadow: `0 4px 18px ${cfg.glow}`,
                                    }}
                                >
                                    <ExternalLink size={15} />
                                    Open Resource
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ResourcesHub;
