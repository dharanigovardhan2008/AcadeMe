import React, { useState, useEffect } from 'react';
import {
    BookOpen, FileText, Download, PlayCircle, Map,
    Layers, FlaskConical, HelpCircle, CheckSquare, SearchX, ExternalLink,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
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

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
    { id: 'concept-maps',   label: 'Concept Maps',     shortLabel: 'Maps',      icon: Map,         type: 'concept-map',   color: '#22D3EE' },
    { id: 'papers',         label: 'Question Papers',  shortLabel: 'Papers',    icon: FileText,    type: 'paper',         color: '#818CF8' },
    { id: 'syllabus',       label: 'Syllabus',         shortLabel: 'Syllabus',  icon: BookOpen,    type: 'syllabus',      color: '#34D399' },
    { id: 'lab-manuals',    label: 'Lab Manuals',      shortLabel: 'Labs',      icon: FlaskConical,type: 'lab-manual',    color: '#F87171' },
    { id: 'imp-questions',  label: 'Imp Questions',    shortLabel: 'Imp Q',     icon: HelpCircle,  type: 'imp-question',  color: '#FBBF24' },
    { id: 'mcqs',           label: 'MCQs',             shortLabel: 'MCQs',      icon: CheckSquare, type: 'mcq',           color: '#A78BFA' },
    { id: 'lectures',       label: 'Video Lectures',   shortLabel: 'Videos',    icon: PlayCircle,  type: null,            color: '#FB923C' },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonGrid = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '1rem',
    }}>
        {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ width: '65%', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                <div style={{ width: '40%', height: '16px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px' }} />
                <div style={{ marginTop: 'auto', width: '100%', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
            </GlassCard>
        ))}
    </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ label, branch }) => (
    <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1.25rem' }}>
            <SearchX size={40} color="var(--text-secondary)" />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No {label} Found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '280px', lineHeight: 1.5 }}>
            No {label.toLowerCase()} uploaded for {branch} yet. Check back soon!
        </p>
    </div>
);

// ── Resource card ─────────────────────────────────────────────────────────────
const ResourceCard = ({ res, label, branch, accentColor }) => (
    <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Accent bar */}
        <div style={{ height: '3px', borderRadius: '2px', background: `linear-gradient(90deg,${accentColor},${accentColor}44)`, margin: '-1px -1px 0', borderRadius: '8px 8px 0 0' }} />

        <h3 style={{
            fontSize: 'clamp(0.9rem, 3vw, 1.05rem)',
            fontWeight: '700',
            lineHeight: 1.35,
            margin: 0,
            wordBreak: 'break-word',
        }}>
            {res.title}
        </h3>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge variant="primary">{label}</Badge>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{branch}</span>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                <GlassButton variant="gradient" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem',
                    padding: '12px', fontSize: '0.9rem', minHeight: '44px' }}>
                    <ExternalLink size={16} /> Open Resource
                </GlassButton>
            </a>
        </div>
    </GlassCard>
);

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
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [user?.branch]);

    const activeTabCfg  = TABS.find(t => t.id === activeTab);
    const filtered      = resources.filter(r => r.type === activeTabCfg?.type);

    return (
        <DashboardLayout>
            <style>{`
                /* ── Tab scrollbar hidden ── */
                .rh-tabs::-webkit-scrollbar { display: none; }
                .rh-tabs { -ms-overflow-style: none; scrollbar-width: none; }

                /* ── Tab button ── */
                .rh-tab {
                    display: flex; align-items: center; gap: 7px;
                    padding: 9px 16px; border-radius: 12px; border: none;
                    cursor: pointer; white-space: nowrap; font-size: 0.88rem; font-weight: 500;
                    transition: all 0.25s ease; flex-shrink: 0;
                    -webkit-tap-highlight-color: transparent;
                    min-height: 42px;
                }
                .rh-tab-on  { color: white; font-weight: 700; }
                .rh-tab-off { background: rgba(255,255,255,0.05); color: var(--text-secondary); }
                .rh-tab-off:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }

                /* ── Resource grid ── */
                .rh-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
                    gap: 1rem;
                }

                /* ── Skeleton pulse ── */
                @keyframes rh-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
                .rh-skel { animation: rh-pulse 1.5s ease-in-out infinite; }

                /* ── Mobile overrides ── */
                @media (max-width: 480px) {
                    .rh-grid {
                        grid-template-columns: 1fr;
                    }
                    .rh-tab { padding: 8px 13px; font-size: 0.82rem; gap: 5px; }
                    .rh-header-title { font-size: 1.4rem !important; }
                }

                @media (min-width: 481px) and (max-width: 768px) {
                    .rh-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (min-width: 769px) {
                    .rh-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    }
                }
            `}</style>

            {/* ── Header + Tabs ── */}
            <GlassCard style={{ marginBottom: '1.25rem', padding: '1.25rem 1.25rem 1rem' }}>

                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.1rem' }}>
                    <div style={{
                        padding: '9px', borderRadius: '12px',
                        background: 'rgba(6,182,212,0.18)', color: '#22D3EE',
                        flexShrink: 0,
                    }}>
                        <Layers size={22} />
                    </div>
                    <div>
                        <h1 className="rh-header-title" style={{ fontSize: 'clamp(1.3rem,5vw,1.8rem)', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>
                            Resources Hub
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                            Everything you need to succeed
                        </p>
                    </div>
                </div>

                {/* Scrollable tabs */}
                <div className="rh-tabs" style={{
                    display: 'flex', gap: '6px',
                    overflowX: 'auto', paddingBottom: '4px',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`rh-tab ${activeTab === tab.id ? 'rh-tab-on' : 'rh-tab-off'}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={activeTab === tab.id ? {
                                background: `linear-gradient(135deg,${tab.color}40,${tab.color}20)`,
                                border: `1px solid ${tab.color}55`,
                                boxShadow: `0 4px 14px ${tab.color}25`,
                                color: tab.color,
                            } : {}}
                        >
                            <tab.icon size={15} />
                            {/* Show short label on very small screens via CSS would need media query in JS — use full label, CSS truncates */}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* ── Content area ── */}
            {loading ? (
                <div className="rh-grid rh-skel">
                    {[1, 2, 3, 4].map(i => (
                        <GlassCard key={i} style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ width: '65%', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                            <div style={{ width: '40%', height: '16px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px' }} />
                            <div style={{ marginTop: 'auto', width: '100%', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                        </GlassCard>
                    ))}
                </div>
            ) : activeTab === 'lectures' ? (
                /* ── Videos coming soon ── */
                <GlassCard style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.6 }}>
                        <PlayCircle size={56} color="#FB923C" style={{ opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontSize: 'clamp(1rem,4vw,1.3rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Video Lectures Coming Soon
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        We're curating the best content for you. Stay tuned!
                    </p>
                </GlassCard>
            ) : filtered.length === 0 ? (
                <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                    <EmptyState label={activeTabCfg?.label || activeTab} branch={user?.branch || ''} />
                </GlassCard>
            ) : (
                <div className="rh-grid">
                    {filtered.map((res, idx) => (
                        <ResourceCard
                            key={res.id || idx}
                            res={res}
                            label={activeTabCfg?.label || ''}
                            branch={user?.branch || ''}
                            accentColor={activeTabCfg?.color || '#818CF8'}
                        />
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
};

export default ResourcesHub;
