import React, { useState, useEffect } from 'react';
import {
    BookOpen, FileText, PlayCircle, Map,
    Layers, FlaskConical, HelpCircle, CheckSquare,
    SearchX, ExternalLink, Sparkles, BookMarked, Search, X,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ── Cache ────────────────────────────────────────────────────────────────────
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

// ── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
    {
        id: 'concept-maps',  label: 'Concept Maps',  icon: Map,          type: 'concept-map',
        color: '#38BDF8', glow: 'rgba(56,189,248,0.3)',
        grad: 'linear-gradient(135deg,#38BDF8,#0284C7)',
        bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)',
    },
    {
        id: 'papers',        label: 'Papers',         icon: FileText,     type: 'paper',
        color: '#A78BFA', glow: 'rgba(167,139,250,0.3)',
        grad: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
        bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)',
    },
    {
        id: 'syllabus',      label: 'Syllabus',       icon: BookOpen,     type: 'syllabus',
        color: '#34D399', glow: 'rgba(52,211,153,0.3)',
        grad: 'linear-gradient(135deg,#34D399,#059669)',
        bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)',
    },
    {
        id: 'lab-manuals',   label: 'Lab Manuals',    icon: FlaskConical, type: 'lab-manual',
        color: '#2DD4BF', glow: 'rgba(45,212,191,0.3)',
        grad: 'linear-gradient(135deg,#2DD4BF,#0891B2)',
        bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.25)',
    },
    {
        id: 'imp-questions', label: 'Imp Questions',  icon: HelpCircle,   type: 'imp-question',
        color: '#FBBF24', glow: 'rgba(251,191,36,0.3)',
        grad: 'linear-gradient(135deg,#FBBF24,#D97706)',
        bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)',
    },
    {
        id: 'mcqs',          label: 'MCQs',           icon: CheckSquare,  type: 'mcq',
        color: '#E879F9', glow: 'rgba(232,121,249,0.3)',
        grad: 'linear-gradient(135deg,#E879F9,#9D17C4)',
        bg: 'rgba(232,121,249,0.1)', border: 'rgba(232,121,249,0.25)',
    },
    {
        id: 'lectures',      label: 'Videos',         icon: PlayCircle,   type: null,
        color: '#FB923C', glow: 'rgba(251,146,60,0.3)',
        grad: 'linear-gradient(135deg,#FB923C,#EA580C)',
        bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)',
    },
];

// ── Component ─────────────────────────────────────────────────────────────────
const ResourcesHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('concept-maps');
    const [resources, setResources] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [mounted,   setMounted]   = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

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

    const [searchRaw,  setSearchRaw]  = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setSearchTerm(searchRaw.trim().toLowerCase()), 250);
        return () => clearTimeout(t);
    }, [searchRaw]);

    useEffect(() => { setSearchRaw(''); setSearchTerm(''); }, [activeTab]);

    const cfg      = TABS.find(t => t.id === activeTab);
    const byTab    = resources.filter(r => r.type === cfg?.type);
    const filtered = searchTerm
        ? byTab.filter(r => r.title?.toLowerCase().includes(searchTerm))
        : byTab;

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes rh-up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rh-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ── FIX: was overflow-x:hidden which traps scroll inside this element ── */
        .rh-page {
            font-family: 'Plus Jakarta Sans', sans-serif;
            width: 100%; max-width: 100%;
            opacity: 0; transition: opacity 0.35s ease;
        }
        .rh-page.in { opacity: 1; }

        .rh-header {
            position: relative; overflow: hidden;
            background: linear-gradient(135deg,
                rgba(15,23,42,0.95) 0%,
                rgba(17,24,56,0.95) 50%,
                rgba(10,15,35,0.95) 100%);
            border: 1px solid rgba(148,163,184,0.1);
            border-radius: 20px;
            padding: 1.25rem 1.1rem 0;
            margin-bottom: 1.1rem;
            backdrop-filter: blur(20px);
        }
        .rh-header::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg,
                transparent, rgba(148,163,184,0.3), rgba(99,102,241,0.4),
                rgba(148,163,184,0.3), transparent);
        }
        .rh-header::after {
            content: '';
            position: absolute; top: -60px; right: -60px;
            width: 200px; height: 200px; border-radius: 50%;
            background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);
            pointer-events: none;
        }

        .rh-title {
            font-size: clamp(1.2rem, 5vw, 1.75rem);
            font-weight: 800; margin: 0; line-height: 1.15; letter-spacing: -0.3px;
            background: linear-gradient(135deg, #ffffff 0%, #94A3B8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .rh-tab-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            padding: 1rem 0 1.1rem;
            position: relative; z-index: 1;
        }
        @media (max-width: 360px) { .rh-tab-grid { grid-template-columns: repeat(3,1fr); gap:6px; } }
        @media (min-width: 640px) { .rh-tab-grid { grid-template-columns: repeat(7,1fr); } }

        .rh-tab {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 6px; padding: 11px 6px 10px;
            border-radius: 14px;
            border: 1px solid rgba(148,163,184,0.08);
            background: rgba(148,163,184,0.04);
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.65rem; font-weight: 500;
            color: rgba(148,163,184,0.55);
            text-align: center; line-height: 1.3;
            min-height: 64px;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            word-break: break-word;
        }
        .rh-tab:hover {
            background: rgba(148,163,184,0.09);
            border-color: rgba(148,163,184,0.2);
            color: rgba(226,232,240,0.85);
            transform: translateY(-2px);
        }
        .rh-tab.on { font-weight: 700; transform: translateY(-2px); }

        .rh-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.85rem;
        }
        @media (min-width: 580px) { .rh-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 960px) { .rh-grid { grid-template-columns: repeat(3,1fr); } }

        .rh-card {
            position: relative; overflow: hidden;
            border-radius: 18px;
            padding: 1.1rem 1.1rem 1rem;
            background: rgba(15,23,42,0.8);
            border: 1px solid rgba(148,163,184,0.1);
            backdrop-filter: blur(12px);
            display: flex; flex-direction: column; gap: 0.8rem;
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s;
            animation: rh-up 0.4s ease both;
        }
        .rh-card:hover { transform: translateY(-5px); }
        .rh-card::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg,
                rgba(255,255,255,0.025) 0%, transparent 50%, rgba(255,255,255,0.01) 100%);
            pointer-events: none; border-radius: inherit;
        }

        .rh-btn {
            display: flex; align-items: center; justify-content: center;
            gap: 7px; width: 100%;
            padding: 12px 16px; border-radius: 12px; border: none;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.875rem; font-weight: 700;
            cursor: pointer; text-decoration: none;
            color: #fff; min-height: 46px; margin-top: auto;
            -webkit-tap-highlight-color: transparent;
            transition: opacity 0.2s, transform 0.15s;
            position: relative; overflow: hidden;
        }
        .rh-btn::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
        }
        .rh-btn:hover { opacity: 0.92; }
        .rh-btn:active { transform: scale(0.97); opacity: 0.85; }

        .rh-empty {
            border-radius: 20px;
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(148,163,184,0.1);
            padding: 4rem 1.5rem; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 1rem;
            animation: rh-up 0.4s ease both;
            backdrop-filter: blur(12px);
        }

        .rh-skel {
            animation: rh-pulse 1.6s ease-in-out infinite;
            border-radius: 18px;
            background: rgba(15,23,42,0.7);
            border: 1px solid rgba(148,163,184,0.08);
            padding: 1.1rem; display: flex; flex-direction: column; gap: 0.8rem;
        }
        .rh-skel-bar { border-radius: 8px; background: rgba(148,163,184,0.08); }

        .rh-search-wrap { position: relative; margin: 0.75rem 0 1.1rem; }
        .rh-search-input {
            width: 100%;
            padding: 11px 40px 11px 40px;
            border-radius: 13px;
            border: 1px solid rgba(148,163,184,0.12);
            background: rgba(148,163,184,0.06);
            color: #E2E8F0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 16px; font-weight: 500;
            outline: none;
            transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .rh-search-input::placeholder { color: rgba(148,163,184,0.4); font-size: 0.85rem; }
        .rh-search-input:focus {
            border-color: var(--rh-focus-color, rgba(148,163,184,0.35));
            background: rgba(148,163,184,0.09);
            box-shadow: 0 0 0 3px var(--rh-focus-glow, rgba(148,163,184,0.08));
        }
        .rh-search-icon {
            position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
            pointer-events: none; display: flex; align-items: center; transition: color 0.2s;
        }
        .rh-search-clear {
            position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
            width: 24px; height: 24px; border-radius: 50%; border: none; cursor: pointer;
            background: rgba(148,163,184,0.15); color: rgba(148,163,184,0.7);
            display: flex; align-items: center; justify-content: center;
            transition: background 0.2s, color 0.2s;
            -webkit-tap-highlight-color: transparent;
        }
        .rh-search-clear:hover { background: rgba(148,163,184,0.25); color: #E2E8F0; }
        .rh-result-count {
            font-size: 0.72rem; font-weight: 600;
            color: rgba(148,163,184,0.45);
            padding: 0 2px 0.6rem;
            display: flex; align-items: center; gap: 5px;
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className={`rh-page${mounted ? ' in' : ''}`}>

                {/* ── HEADER ── */}
                <div className="rh-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
                            background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(56,189,248,0.2))',
                            border: '1px solid rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BookMarked size={19} color="#818CF8" />
                        </div>
                        <div>
                            <h1 className="rh-title">Resources Hub</h1>
                            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'rgba(148,163,184,0.5)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {user?.branch ? `Showing resources for ${user.branch}` : 'Everything you need to succeed'}
                            </p>
                        </div>
                    </div>

                    {/* ── TAB GRID ── */}
                    <div className="rh-tab-grid">
                        {TABS.map(tab => {
                            const on = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`rh-tab${on ? ' on' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={on ? {
                                        background: tab.bg, borderColor: tab.border, color: tab.color,
                                        boxShadow: `0 0 16px ${tab.glow}, 0 4px 12px rgba(0,0,0,0.3)`,
                                    } : {}}
                                >
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '9px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: on ? tab.bg : 'rgba(148,163,184,0.06)',
                                        border: on ? `1px solid ${tab.border}` : '1px solid rgba(148,163,184,0.1)',
                                        transition: 'all 0.2s',
                                    }}>
                                        <tab.icon size={15} color={on ? tab.color : 'rgba(148,163,184,0.5)'} />
                                    </div>
                                    <span style={{ fontSize: '0.64rem', fontWeight: on ? 700 : 500 }}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── SEARCH BAR ── */}
                    {activeTab !== 'lectures' && (
                        <div
                            className="rh-search-wrap"
                            style={{ '--rh-focus-color': cfg?.border, '--rh-focus-glow': cfg?.glow?.replace('0.3', '0.12') }}
                        >
                            <span className="rh-search-icon" style={{ color: searchRaw ? cfg?.color : 'rgba(148,163,184,0.4)' }}>
                                <Search size={16} />
                            </span>
                            <input
                                className="rh-search-input"
                                type="search"
                                value={searchRaw}
                                onChange={e => setSearchRaw(e.target.value)}
                                placeholder={`Search ${cfg?.label || 'resources'}…`}
                                autoComplete="off"
                                style={searchRaw ? { borderColor: cfg?.border, boxShadow: `0 0 0 3px ${cfg?.glow?.replace('0.3', '0.1')}` } : {}}
                            />
                            {searchRaw && (
                                <button className="rh-search-clear" onClick={() => setSearchRaw('')} aria-label="Clear search">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── CONTENT ── */}
                {loading ? (
                    <div className="rh-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rh-skel" style={{ animationDelay: `${i * 0.12}s` }}>
                                <div className="rh-skel-bar" style={{ height: '15px', width: '55%' }} />
                                <div className="rh-skel-bar" style={{ height: '12px', width: '35%' }} />
                                <div className="rh-skel-bar" style={{ height: '46px', width: '100%', marginTop: '6px' }} />
                            </div>
                        ))}
                    </div>

                ) : activeTab === 'lectures' ? (
                    <div className="rh-empty">
                        <div style={{
                            width: '62px', height: '62px', borderRadius: '18px',
                            background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <PlayCircle size={28} color="#FB923C" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: '#E2E8F0' }}>
                                Video Lectures Coming Soon
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(148,163,184,0.6)', maxWidth: '240px' }}>
                                We're curating the best content for you.
                            </p>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '20px',
                            background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)',
                        }}>
                            <Sparkles size={12} color="#FB923C" />
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FB923C' }}>Stay tuned</span>
                        </div>
                    </div>

                ) : filtered.length === 0 ? (
                    <div className="rh-empty">
                        <div style={{
                            width: '62px', height: '62px', borderRadius: '18px',
                            background: cfg.bg, border: `1px solid ${cfg.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <SearchX size={26} color={cfg.color} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: '#E2E8F0' }}>
                                {searchTerm ? 'No results found' : `No ${cfg.label} Yet`}
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(148,163,184,0.55)', maxWidth: '240px' }}>
                                {searchTerm
                                    ? `Nothing matched "${searchRaw}" in ${cfg.label}. Try a different keyword.`
                                    : `Nothing uploaded for ${user?.branch || 'your branch'} yet. Check back soon!`}
                            </p>
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchRaw('')}
                                style={{
                                    padding: '8px 20px', borderRadius: '20px', border: `1px solid ${cfg.border}`,
                                    background: cfg.bg, color: cfg.color, fontWeight: 700,
                                    fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans,sans-serif',
                                }}
                            >
                                Clear search
                            </button>
                        )}
                    </div>

                ) : (
                    <>
                        {searchTerm && (
                            <div className="rh-result-count" style={{ color: cfg.color }}>
                                <Search size={12} />
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{searchRaw}"
                            </div>
                        )}
                        <div className="rh-grid">
                            {filtered.map((res, idx) => (
                                <div
                                    key={res.id || idx}
                                    className="rh-card"
                                    style={{ animationDelay: `${idx * 0.055}s`, borderColor: `${cfg.color}20` }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = `0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}30`;
                                        e.currentTarget.style.borderColor = `${cfg.color}35`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = '';
                                        e.currentTarget.style.borderColor = `${cfg.color}20`;
                                    }}
                                >
                                    {/* Top accent line */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                                        borderRadius: '18px 18px 0 0', background: cfg.grad,
                                    }} />

                                    {/* Corner glow */}
                                    <div style={{
                                        position: 'absolute', top: '-20px', right: '-20px',
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: `radial-gradient(circle,${cfg.glow},transparent 70%)`,
                                        opacity: 0.4, pointerEvents: 'none',
                                    }} />

                                    {/* Icon + title */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', position: 'relative', zIndex: 1, marginTop: '6px' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                                            background: cfg.bg, border: `1px solid ${cfg.border}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <cfg.icon size={17} color={cfg.color} />
                                        </div>
                                        <h3 style={{
                                            margin: 0, flex: 1,
                                            fontSize: 'clamp(0.86rem, 3.2vw, 0.97rem)',
                                            fontWeight: 700, lineHeight: 1.45,
                                            color: '#E2E8F0', wordBreak: 'break-word',
                                        }}>
                                            {res.title}
                                        </h3>
                                    </div>

                                    {/* Tag pills */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                                        <span style={{
                                            fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                                            borderRadius: '20px', background: cfg.bg,
                                            color: cfg.color, border: `1px solid ${cfg.border}`,
                                        }}>
                                            {cfg.label}
                                        </span>
                                        {user?.branch && (
                                            <span style={{
                                                fontSize: '0.68rem', fontWeight: 500, padding: '3px 10px',
                                                borderRadius: '20px',
                                                background: 'rgba(148,163,184,0.07)',
                                                color: 'rgba(148,163,184,0.55)',
                                                border: '1px solid rgba(148,163,184,0.12)',
                                            }}>
                                                {user.branch}
                                            </span>
                                        )}
                                    </div>

                                    {/* Open button */}
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rh-btn"
                                        style={{ background: cfg.grad, boxShadow: `0 4px 20px ${cfg.glow}`, position: 'relative', zIndex: 1 }}
                                    >
                                        <ExternalLink size={15} />
                                        Open Resource
                                    </a>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ResourcesHub;
