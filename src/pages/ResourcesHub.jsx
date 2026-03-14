import React, { useState, useEffect } from 'react';
import {
    BookOpen, FileText, PlayCircle, Map,
    Layers, FlaskConical, HelpCircle, CheckSquare,
    SearchX, ExternalLink,
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

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'concept-maps',  label: 'Concept Maps',    icon: Map,          type: 'concept-map',  color: '#22D3EE', bg: 'rgba(34,211,238,0.12)'  },
    { id: 'papers',        label: 'Papers',           icon: FileText,     type: 'paper',        color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
    { id: 'syllabus',      label: 'Syllabus',         icon: BookOpen,     type: 'syllabus',     color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
    { id: 'lab-manuals',   label: 'Lab Manuals',      icon: FlaskConical, type: 'lab-manual',   color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    { id: 'imp-questions', label: 'Imp Questions',    icon: HelpCircle,   type: 'imp-question', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'  },
    { id: 'mcqs',          label: 'MCQs',             icon: CheckSquare,  type: 'mcq',          color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    { id: 'lectures',      label: 'Video Lectures',   icon: PlayCircle,   type: null,           color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const ResourcesHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('concept-maps');
    const [resources, setResources] = useState([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        if (!user?.branch) return;
        const key = `resources_${user.branch}`;
        const hit = getCache(key);
        if (hit) { setResources(hit); setLoading(false); return; }
        setLoading(true);
        getDocs(query(collection(db, 'resources'), where('branches', 'array-contains', user.branch)))
            .then(snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setResources(list);
                setCache(key, list);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.branch]);

    const cfg      = TABS.find(t => t.id === activeTab);
    const filtered = resources.filter(r => r.type === cfg?.type);

    return (
        <DashboardLayout>
            <style>{`
                /* ── Reset ── */
                * { box-sizing: border-box; }

                /* ── Page wrapper ── */
                .rh-page { width: 100%; max-width: 100%; overflow-x: hidden; }

                /* ── Header card ── */
                .rh-header {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 18px;
                    padding: 1.1rem 1rem 1rem;
                    margin-bottom: 1rem;
                    width: 100%;
                }

                /* ── Tab grid — wraps naturally, NO horizontal scroll ── */
                .rh-tab-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 7px;
                    width: 100%;
                    margin-top: 1rem;
                }
                @media (max-width: 380px) {
                    .rh-tab-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
                }
                @media (min-width: 600px) {
                    .rh-tab-grid { grid-template-columns: repeat(7, 1fr); }
                }

                /* ── Single tab button ── */
                .rh-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    padding: 10px 4px 9px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.07);
                    background: rgba(255,255,255,0.04);
                    cursor: pointer;
                    font-size: 0.68rem;
                    font-weight: 500;
                    color: rgba(180,180,200,0.7);
                    text-align: center;
                    line-height: 1.2;
                    min-height: 58px;
                    transition: all 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                    word-break: break-word;
                }
                .rh-tab:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
                .rh-tab.active {
                    font-weight: 700;
                    border-width: 1.5px;
                }

                /* ── Resource grid ── */
                .rh-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.85rem;
                    width: 100%;
                }
                @media (min-width: 600px) {
                    .rh-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 900px) {
                    .rh-grid { grid-template-columns: repeat(3, 1fr); }
                }

                /* ── Resource card ── */
                .rh-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 16px;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.7rem;
                    width: 100%;
                }

                /* ── Open button — always visible ── */
                .rh-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 13px 16px;
                    border-radius: 12px;
                    border: none;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    text-decoration: none;
                    color: #ffffff;
                    margin-top: auto;
                    min-height: 48px;
                    -webkit-tap-highlight-color: transparent;
                    transition: opacity 0.2s, transform 0.15s;
                }
                .rh-btn:active { opacity: 0.85; transform: scale(0.98); }

                /* ── Skeleton pulse ── */
                @keyframes rh-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
                .rh-skel { animation: rh-pulse 1.5s ease-in-out infinite; }

                /* ── Empty / coming soon ── */
                .rh-empty {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 18px;
                    padding: 3.5rem 1.5rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                }
            `}</style>

            <div className="rh-page">

                {/* ── Header ── */}
                <div className="rh-header">

                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                            background: 'rgba(6,182,212,0.18)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#22D3EE',
                        }}>
                            <Layers size={20} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem,5vw,1.7rem)', fontWeight: 'bold', lineHeight: 1.2 }}>
                                Resources Hub
                            </h1>
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(180,180,200,0.6)' }}>
                                Everything you need to succeed
                            </p>
                        </div>
                    </div>

                    {/* Tab grid — wraps, never scrolls */}
                    <div className="rh-tab-grid">
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`rh-tab${isActive ? ' active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={isActive ? {
                                        background: tab.bg,
                                        borderColor: tab.color + '70',
                                        color: tab.color,
                                        boxShadow: `0 2px 12px ${tab.color}20`,
                                    } : {}}
                                >
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    /* Skeleton */
                    <div className="rh-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rh-card rh-skel">
                                <div style={{ height: '18px', width: '70%', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                                <div style={{ height: '14px', width: '40%', background: 'rgba(255,255,255,0.07)', borderRadius: '6px' }} />
                                <div style={{ height: '48px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', marginTop: '8px' }} />
                            </div>
                        ))}
                    </div>

                ) : activeTab === 'lectures' ? (
                    /* Coming soon */
                    <div className="rh-empty">
                        <div style={{ padding: '16px', background: 'rgba(251,146,60,0.1)', borderRadius: '50%' }}>
                            <PlayCircle size={36} color="#FB923C" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Video Lectures Coming Soon</h3>
                        <p style={{ margin: 0, color: 'rgba(180,180,200,0.6)', fontSize: '0.85rem', maxWidth: '260px' }}>
                            We're curating the best content for you. Stay tuned!
                        </p>
                    </div>

                ) : filtered.length === 0 ? (
                    /* Empty */
                    <div className="rh-empty">
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                            <SearchX size={36} color="rgba(180,180,200,0.5)" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>No {cfg?.label} Found</h3>
                        <p style={{ margin: 0, color: 'rgba(180,180,200,0.5)', fontSize: '0.85rem', maxWidth: '260px' }}>
                            No {cfg?.label?.toLowerCase()} uploaded for {user?.branch || 'your branch'} yet. Check back soon!
                        </p>
                    </div>

                ) : (
                    /* Resource cards */
                    <div className="rh-grid">
                        {filtered.map((res, idx) => (
                            <div key={res.id || idx} className="rh-card">
                                {/* Accent top bar */}
                                <div style={{
                                    height: '3px', borderRadius: '3px',
                                    background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}44)`,
                                    marginBottom: '2px',
                                }} />

                                {/* Title */}
                                <h3 style={{
                                    margin: 0,
                                    fontSize: 'clamp(0.88rem, 3.5vw, 1rem)',
                                    fontWeight: '700',
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                }}>
                                    {res.title}
                                </h3>

                                {/* Tags row */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: '600', padding: '3px 10px',
                                        borderRadius: '20px', background: cfg.bg,
                                        color: cfg.color, border: `1px solid ${cfg.color}40`,
                                        flexShrink: 0,
                                    }}>
                                        {cfg.label}
                                    </span>
                                    {user?.branch && (
                                        <span style={{ fontSize: '0.72rem', color: 'rgba(180,180,200,0.5)' }}>
                                            {user.branch}
                                        </span>
                                    )}
                                </div>

                                {/* Open button — gradient, always visible */}
                                <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rh-btn"
                                    style={{
                                        background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}88)`,
                                        boxShadow: `0 4px 16px ${cfg.color}30`,
                                    }}
                                >
                                    <ExternalLink size={16} />
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
