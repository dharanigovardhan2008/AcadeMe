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

// ── Glass design tokens (unified, no per-tab colors in UI) ───────────────────
const G = {
    // Base glass surfaces
    surface:        'rgba(255,255,255,0.04)',
    surfaceHover:   'rgba(255,255,255,0.075)',
    surfaceActive:  'rgba(255,255,255,0.10)',
    border:         'rgba(255,255,255,0.10)',
    borderHover:    'rgba(255,255,255,0.20)',
    borderActive:   'rgba(255,255,255,0.28)',
    // Text
    textPrimary:    '#F1F5F9',
    textSecondary:  'rgba(203,213,225,0.75)',
    textMuted:      'rgba(148,163,184,0.5)',
    // Accent (single cool white glow for active states)
    accentBg:       'rgba(255,255,255,0.08)',
    accentBorder:   'rgba(255,255,255,0.25)',
    accentGlow:     'rgba(255,255,255,0.08)',
    accentText:     '#F1F5F9',
    // Button gradient — neutral frosted
    btnGrad:        'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)',
    btnBorder:      'rgba(255,255,255,0.22)',
    btnShadow:      '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
};

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
        @keyframes rh-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
        }

        .rh-page {
            font-family: 'Plus Jakarta Sans', sans-serif;
            width: 100%; max-width: 100%;
            opacity: 0; transition: opacity 0.35s ease;
        }
        .rh-page.in { opacity: 1; }

        /* ── HEADER ── */
        .rh-header {
            position: relative; overflow: hidden;
            background: rgba(10,14,26,0.55);
            border: 1px solid ${G.border};
            border-radius: 22px;
            padding: 1.25rem 1.1rem 0;
            margin-bottom: 1.1rem;
            backdrop-filter: blur(28px) saturate(160%);
            -webkit-backdrop-filter: blur(28px) saturate(160%);
            box-shadow:
                0 0 0 1px rgba(255,255,255,0.04) inset,
                0 24px 64px rgba(0,0,0,0.4),
                0 1px 0 rgba(255,255,255,0.08) inset;
        }

        /* top shimmer line */
        .rh-header::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg,
                transparent 0%, rgba(255,255,255,0.18) 30%,
                rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.18) 70%, transparent 100%);
            background-size: 200% 100%;
            animation: rh-shimmer 6s linear infinite;
        }

        /* subtle radial glow inside header */
        .rh-header::after {
            content: '';
            position: absolute; top: -80px; right: -80px;
            width: 260px; height: 260px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.04), transparent 70%);
            pointer-events: none;
        }

        /* ── TITLE ── */
        .rh-title {
            font-size: clamp(1.2rem, 5vw, 1.75rem);
            font-weight: 800; margin: 0; line-height: 1.15; letter-spacing: -0.3px;
            background: linear-gradient(135deg, #ffffff 0%, rgba(203,213,225,0.8) 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* ── ICON BOX ── */
        .rh-icon-box {
            width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.14);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12);
        }

        /* ── TAB GRID ── */
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
            border: 1px solid ${G.border};
            background: ${G.surface};
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.65rem; font-weight: 500;
            color: ${G.textMuted};
            text-align: center; line-height: 1.3;
            min-height: 64px;
            transition: all 0.22s ease;
            -webkit-tap-highlight-color: transparent;
            word-break: break-word;
            backdrop-filter: blur(8px);
        }
        .rh-tab:hover {
            background: ${G.surfaceHover};
            border-color: ${G.borderHover};
            color: ${G.textSecondary};
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .rh-tab.on {
            font-weight: 700;
            transform: translateY(-2px);
            background: ${G.surfaceActive};
            border-color: ${G.borderActive};
            color: ${G.accentText};
            box-shadow:
                0 8px 24px rgba(0,0,0,0.35),
                inset 0 1px 0 rgba(255,255,255,0.2),
                0 0 0 1px rgba(255,255,255,0.08);
        }

        /* icon inside tab */
        .rh-tab-icon {
            width: 30px; height: 30px; border-radius: 9px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.09);
            transition: all 0.22s;
        }
        .rh-tab.on .rh-tab-icon {
            background: rgba(255,255,255,0.10);
            border-color: rgba(255,255,255,0.22);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
        }

        /* ── CARD GRID ── */
        .rh-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.85rem;
        }
        @media (min-width: 580px) { .rh-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 960px) { .rh-grid { grid-template-columns: repeat(3,1fr); } }

        /* ── CARD ── */
        .rh-card {
            position: relative; overflow: hidden;
            border-radius: 20px;
            padding: 1.15rem 1.1rem 1.05rem;
            background: rgba(12,17,32,0.55);
            border: 1px solid ${G.border};
            backdrop-filter: blur(20px) saturate(140%);
            -webkit-backdrop-filter: blur(20px) saturate(140%);
            display: flex; flex-direction: column; gap: 0.85rem;
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s, background 0.25s;
            animation: rh-up 0.4s ease both;
            box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .rh-card:hover {
            transform: translateY(-5px);
            background: rgba(18,25,45,0.65);
            border-color: ${G.borderHover};
            box-shadow:
                0 16px 40px rgba(0,0,0,0.45),
                inset 0 1px 0 rgba(255,255,255,0.12),
                0 0 0 1px rgba(255,255,255,0.06);
        }

        /* top accent — frosted prismatic line */
        .rh-card-top {
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            border-radius: 20px 20px 0 0;
            background: linear-gradient(90deg,
                transparent 0%, rgba(255,255,255,0.12) 20%,
                rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.12) 80%, transparent 100%);
        }

        /* inner gloss */
        .rh-card::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(145deg,
                rgba(255,255,255,0.04) 0%, transparent 40%, rgba(255,255,255,0.02) 100%);
            pointer-events: none; border-radius: inherit;
        }

        /* corner orb */
        .rh-card-orb {
            position: absolute; top: -25px; right: -25px;
            width: 90px; height: 90px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%);
            opacity: 0.6; pointer-events: none;
        }

        /* ── CARD ICON BOX ── */
        .rh-card-icon {
            width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.14);
            display: flex; align-items: center; justify-content: center;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.2);
        }

        /* ── PILLS ── */
        .rh-pill {
            font-size: 0.68rem; font-weight: 700; padding: 3px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.07);
            color: rgba(203,213,225,0.8);
            border: 1px solid rgba(255,255,255,0.13);
            backdrop-filter: blur(6px);
        }
        .rh-pill-muted {
            font-size: 0.68rem; font-weight: 500; padding: 3px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.04);
            color: rgba(148,163,184,0.55);
            border: 1px solid rgba(255,255,255,0.08);
        }

        /* ── BUTTON ── */
        .rh-btn {
            display: flex; align-items: center; justify-content: center;
            gap: 7px; width: 100%;
            padding: 12px 16px; border-radius: 13px; border: 1px solid ${G.btnBorder};
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.875rem; font-weight: 700;
            cursor: pointer; text-decoration: none;
            color: ${G.textPrimary};
            min-height: 46px; margin-top: auto;
            -webkit-tap-highlight-color: transparent;
            transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s, background 0.2s;
            position: relative; overflow: hidden;
            background: ${G.btnGrad};
            box-shadow: ${G.btnShadow};
            backdrop-filter: blur(8px);
        }
        .rh-btn::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }
        .rh-btn:hover {
            opacity: 1;
            background: rgba(255,255,255,0.14);
            box-shadow: 0 6px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .rh-btn:active { transform: scale(0.97); opacity: 0.85; }

        /* ── EMPTY STATE ── */
        .rh-empty {
            border-radius: 22px;
            background: rgba(10,14,26,0.5);
            border: 1px solid ${G.border};
            padding: 4rem 1.5rem; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 1rem;
            animation: rh-up 0.4s ease both;
            backdrop-filter: blur(20px);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .rh-empty-icon {
            width: 62px; height: 62px; border-radius: 18px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.13);
            display: flex; align-items: center; justify-content: center;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.25);
        }

        /* ── SKELETON ── */
        .rh-skel {
            animation: rh-pulse 1.6s ease-in-out infinite;
            border-radius: 20px;
            background: rgba(10,14,26,0.5);
            border: 1px solid rgba(255,255,255,0.07);
            padding: 1.1rem; display: flex; flex-direction: column; gap: 0.8rem;
            backdrop-filter: blur(12px);
        }
        .rh-skel-bar {
            border-radius: 8px;
            background: rgba(255,255,255,0.06);
        }

        /* ── SEARCH ── */
        .rh-search-wrap { position: relative; margin: 0.75rem 0 1.1rem; }
        .rh-search-input {
            width: 100%;
            padding: 11px 40px 11px 40px;
            border-radius: 13px;
            border: 1px solid rgba(255,255,255,0.11);
            background: rgba(255,255,255,0.05);
            color: ${G.textPrimary};
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 16px; font-weight: 500;
            outline: none;
            backdrop-filter: blur(10px);
            transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .rh-search-input::placeholder { color: rgba(148,163,184,0.38); font-size: 0.85rem; }
        .rh-search-input:focus {
            border-color: rgba(255,255,255,0.28);
            background: rgba(255,255,255,0.08);
            box-shadow: 0 0 0 3px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .rh-search-icon {
            position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
            pointer-events: none; display: flex; align-items: center;
            color: rgba(148,163,184,0.45);
            transition: color 0.2s;
        }
        .rh-search-input:focus ~ .rh-search-icon,
        .rh-search-wrap:focus-within .rh-search-icon { color: rgba(203,213,225,0.7); }
        .rh-search-clear {
            position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
            width: 24px; height: 24px; border-radius: 50%; border: none; cursor: pointer;
            background: rgba(255,255,255,0.10); color: rgba(148,163,184,0.7);
            display: flex; align-items: center; justify-content: center;
            transition: background 0.2s, color 0.2s;
            -webkit-tap-highlight-color: transparent;
        }
        .rh-search-clear:hover { background: rgba(255,255,255,0.18); color: #E2E8F0; }

        .rh-result-count {
            font-size: 0.72rem; font-weight: 600;
            color: rgba(148,163,184,0.5);
            padding: 0 2px 0.6rem;
            display: flex; align-items: center; gap: 5px;
        }

        /* ── CLEAR SEARCH BUTTON ── */
        .rh-clear-btn {
            padding: 8px 20px; border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.07);
            color: ${G.textSecondary}; font-weight: 700;
            font-size: 0.8rem; cursor: pointer;
            font-family: 'Plus Jakarta Sans,sans-serif';
            backdrop-filter: blur(8px);
            transition: background 0.2s, border-color 0.2s;
        }
        .rh-clear-btn:hover {
            background: rgba(255,255,255,0.12);
            border-color: rgba(255,255,255,0.28);
        }

        /* ── BADGE (stay tuned) ── */
        .rh-badge {
            display: flex; align-items: center; gap: 6px;
            padding: 6px 14px; border-radius: 20px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.13);
            backdrop-filter: blur(6px);
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className={`rh-page${mounted ? ' in' : ''}`}>

                {/* ── HEADER ── */}
                <div className="rh-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                        <div className="rh-icon-box">
                            <BookMarked size={19} color="rgba(203,213,225,0.85)" />
                        </div>
                        <div>
                            <h1 className="rh-title">Resources Hub</h1>
                            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: G.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
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
                                >
                                    <div className="rh-tab-icon">
                                        <tab.icon
                                            size={15}
                                            color={on ? 'rgba(226,232,240,0.95)' : 'rgba(148,163,184,0.5)'}
                                        />
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
                        <div className="rh-search-wrap">
                            <span className="rh-search-icon">
                                <Search size={16} />
                            </span>
                            <input
                                className="rh-search-input"
                                type="search"
                                value={searchRaw}
                                onChange={e => setSearchRaw(e.target.value)}
                                placeholder={`Search ${cfg?.label || 'resources'}…`}
                                autoComplete="off"
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
                        <div className="rh-empty-icon">
                            <PlayCircle size={28} color="rgba(203,213,225,0.8)" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: G.textPrimary }}>
                                Video Lectures Coming Soon
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: G.textMuted, maxWidth: '240px' }}>
                                We're curating the best content for you.
                            </p>
                        </div>
                        <div className="rh-badge">
                            <Sparkles size={12} color="rgba(203,213,225,0.7)" />
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: G.textSecondary }}>Stay tuned</span>
                        </div>
                    </div>

                ) : filtered.length === 0 ? (
                    <div className="rh-empty">
                        <div className="rh-empty-icon">
                            <SearchX size={26} color="rgba(203,213,225,0.75)" />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: G.textPrimary }}>
                                {searchTerm ? 'No results found' : `No ${cfg.label} Yet`}
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: G.textMuted, maxWidth: '240px' }}>
                                {searchTerm
                                    ? `Nothing matched "${searchRaw}" in ${cfg.label}. Try a different keyword.`
                                    : `Nothing uploaded for ${user?.branch || 'your branch'} yet. Check back soon!`}
                            </p>
                        </div>
                        {searchTerm && (
                            <button onClick={() => setSearchRaw('')} className="rh-clear-btn">
                                Clear search
                            </button>
                        )}
                    </div>

                ) : (
                    <>
                        {searchTerm && (
                            <div className="rh-result-count">
                                <Search size={12} />
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{searchRaw}"
                            </div>
                        )}
                        <div className="rh-grid">
                            {filtered.map((res, idx) => (
                                <div
                                    key={res.id || idx}
                                    className="rh-card"
                                    style={{ animationDelay: `${idx * 0.055}s` }}
                                >
                                    {/* frosted top line */}
                                    <div className="rh-card-top" />

                                    {/* corner orb */}
                                    <div className="rh-card-orb" />

                                    {/* Icon + title */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', position: 'relative', zIndex: 1, marginTop: '6px' }}>
                                        <div className="rh-card-icon">
                                            <cfg.icon size={17} color="rgba(203,213,225,0.85)" />
                                        </div>
                                        <h3 style={{
                                            margin: 0, flex: 1,
                                            fontSize: 'clamp(0.86rem, 3.2vw, 0.97rem)',
                                            fontWeight: 700, lineHeight: 1.45,
                                            color: G.textPrimary, wordBreak: 'break-word',
                                        }}>
                                            {res.title}
                                        </h3>
                                    </div>

                                    {/* Tag pills */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                                        <span className="rh-pill">{cfg.label}</span>
                                        {user?.branch && (
                                            <span className="rh-pill-muted">{user.branch}</span>
                                        )}
                                    </div>

                                    {/* Open button */}
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rh-btn"
                                        style={{ position: 'relative', zIndex: 1 }}
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
