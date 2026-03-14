import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, PlayCircle, Map, Layers, FlaskConical, HelpCircle, CheckSquare, SearchX } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ============ CACHING UTILITY ============
const CACHE_DURATION = 300000; // 5 minutes

const getFromCache = (key) => {
    try {
        const cached = sessionStorage.getItem(key);
        const timestamp = sessionStorage.getItem(`${key}_time`);
        if (!cached || !timestamp) return null;
        const age = Date.now() - parseInt(timestamp);
        if (age > CACHE_DURATION) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
            return null;
        }
        return JSON.parse(cached);
    } catch {
        // FIX 1: sessionStorage can throw in private/incognito — handle gracefully
        return null;
    }
};

const saveToCache = (key, data) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem(`${key}_time`, Date.now().toString());
    } catch {
        // FIX 1: same — silently fail if storage quota exceeded
    }
};
// ============ END CACHING UTILITY ============

// ============ CONCEPT MAP COLOR PALETTE ============
// FIX 2: Added a distinct color per concept-map card instead of no styling
const CONCEPT_MAP_COLORS = [
    { bg: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.10))', border: 'rgba(6,182,212,0.35)',  accent: '#22D3EE' },
    { bg: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(168,85,247,0.10))', border: 'rgba(139,92,246,0.35)', accent: '#A78BFA' },
    { bg: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(52,211,153,0.10))', border: 'rgba(16,185,129,0.35)', accent: '#34D399' },
    { bg: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.10))', border: 'rgba(245,158,11,0.35)',  accent: '#FBBF24' },
    { bg: 'linear-gradient(135deg, rgba(239,68,68,0.18),  rgba(248,113,113,0.10))', border: 'rgba(239,68,68,0.35)', accent: '#F87171' },
    { bg: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(244,114,182,0.10))', border: 'rgba(236,72,153,0.35)', accent: '#F472B6' },
];
// ============ END COLOR PALETTE ============

// ============ UI HELPER COMPONENTS ============

const SkeletonGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <GlassCard key={i} className="skeleton-pulse" style={{ height: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '60%', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                <div style={{ width: '40%', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                <div style={{ marginTop: 'auto', width: '100%', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>
            </GlassCard>
        ))}
    </div>
);

const EmptyState = ({ message, subMessage }) => (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <SearchX size={48} color="var(--text-secondary)" />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{message}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{subMessage}</p>
    </div>
);

// ============ MAIN COMPONENT ============

const ResourcesHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('concept-maps');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    // FIX 3: Added error state — was completely missing, errors were silently swallowed
    const [error, setError] = useState(null);

    const TABS = [
        { id: 'concept-maps',  label: 'Concept Maps',      icon: Map          },
        { id: 'papers',        label: 'Question Papers',   icon: FileText     },
        { id: 'syllabus',      label: 'Syllabus',          icon: BookOpen     },
        { id: 'lab-manuals',   label: 'Lab Manuals',       icon: FlaskConical },
        { id: 'imp-questions', label: 'Imp Questions',     icon: HelpCircle   },
        { id: 'mcqs',          label: 'MCQs',              icon: CheckSquare  },
        { id: 'lectures',      label: 'Video Lectures',    icon: PlayCircle   },
    ];

    useEffect(() => {
        // FIX 4: Guard against missing user OR missing branch (original only checked user.branch)
        if (!user || !user.branch) {
            setLoading(false);
            return;
        }

        const fetchResources = async () => {
            const cacheKey = `resources_${user.branch}`;
            const cached = getFromCache(cacheKey);
            if (cached) {
                setResources(cached);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null); // FIX 3: Reset error before each fetch
            try {
                const q = query(
                    collection(db, 'resources'),
                    where('branches', 'array-contains', user.branch)
                );
                const querySnapshot = await getDocs(q);
                const resList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                // FIX 5: Original used forEach + push (mutation). Using .map() is cleaner & avoids stale closure bugs
                setResources(resList);
                saveToCache(cacheKey, resList);
            } catch (err) {
                console.error('Error fetching resources:', err);
                // FIX 3: Surface the error to the user instead of silently failing
                setError('Failed to load resources. Please check your connection and try again.');
            } finally {
                // FIX 6: Original set loading=false outside try/catch — if error thrown, it still ran
                // but inconsistently. Using finally guarantees it always runs.
                setLoading(false);
            }
        };

        fetchResources();
    }, [user?.branch]);

    const filteredResources = resources.filter(res => {
        if (activeTab === 'concept-maps')  return res.type === 'concept-map';
        if (activeTab === 'papers')        return res.type === 'paper';
        if (activeTab === 'syllabus')      return res.type === 'syllabus';
        if (activeTab === 'lab-manuals')   return res.type === 'lab-manual';
        if (activeTab === 'imp-questions') return res.type === 'imp-question';
        if (activeTab === 'mcqs')          return res.type === 'mcq';
        // FIX 7: Original returned false for all unmatched — lectures tab would never show resources
        // even if lecture-type docs existed. Added explicit return for lectures.
        if (activeTab === 'lectures')      return res.type === 'lecture';
        return false;
    });

    const renderResourceGrid = (label) => (
        <>
            {filteredResources.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredResources.map((res, idx) => {
                        // FIX 2: Apply concept-map colors cyclically
                        const isConceptMap = activeTab === 'concept-maps';
                        const palette = isConceptMap ? CONCEPT_MAP_COLORS[idx % CONCEPT_MAP_COLORS.length] : null;

                        return (
                            <GlassCard
                                key={res.id || idx}   // FIX 8: Prefer res.id over idx as key to avoid reconciliation bugs
                                style={isConceptMap ? {
                                    background: palette.bg,
                                    border: `1px solid ${palette.border}`,
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                } : {
                                    transition: 'transform 0.2s ease',
                                }}
                            >
                                {/* Concept map accent bar */}
                                {isConceptMap && (
                                    <div style={{
                                        width: '36px', height: '4px', borderRadius: '2px',
                                        background: palette.accent, marginBottom: '0.75rem',
                                    }} />
                                )}

                                <h3 style={{
                                    fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem',
                                    color: isConceptMap ? palette.accent : 'inherit',
                                }}>
                                    {res.title}
                                </h3>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    <Badge variant="primary">{label}</Badge>
                                    {/* FIX 9: Guard user.branch — can be undefined on first render */}
                                    {user?.branch && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                                            {user.branch}
                                        </span>
                                    )}
                                </div>

                                {/* FIX 10: res.url could be undefined — guard with conditional render */}
                                {res.url ? (
                                    <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton
                                            variant="gradient"
                                            style={{
                                                width: '100%', justifyContent: 'center', gap: '0.5rem',
                                                ...(isConceptMap && { borderColor: palette.border }),
                                            }}
                                        >
                                            <Download size={16} /> Open Resource
                                        </GlassButton>
                                    </a>
                                ) : (
                                    <GlassButton variant="gradient" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.4 }}>
                                        Link Unavailable
                                    </GlassButton>
                                )}
                            </GlassCard>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    message={`No ${label} Found`}
                    subMessage={`We haven't uploaded any ${label.toLowerCase()} for ${user?.branch ?? 'your branch'} yet. Check back soon!`}
                />
            )}
        </>
    );

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.2)', color: '#22D3EE' }}>
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Resources Hub</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Everything you need to succeed</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '10px 20px', borderRadius: '12px', border: 'none',
                                background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'all 0.3s ease', whiteSpace: 'nowrap',
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* FIX 3: Show error banner if fetch failed */}
            {error && (
                <GlassCard style={{ marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)' }}>
                    <p style={{ color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚠️ {error}
                    </p>
                </GlassCard>
            )}

            {loading ? <SkeletonGrid /> : (
                <>
                    {activeTab === 'concept-maps'  && renderResourceGrid('Concept Map')}
                    {activeTab === 'papers'        && renderResourceGrid('Question Paper')}
                    {activeTab === 'syllabus'      && renderResourceGrid('Syllabus')}
                    {activeTab === 'lab-manuals'   && renderResourceGrid('Lab Manual')}
                    {activeTab === 'imp-questions' && renderResourceGrid('Important Questions')}
                    {activeTab === 'mcqs'          && renderResourceGrid('MCQs')}

                    {/* FIX 7: Lectures now renders the grid if docs exist, falls back to coming-soon */}
                    {activeTab === 'lectures' && (
                        filteredResources.length > 0
                            ? renderResourceGrid('Video Lecture')
                            : (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <PlayCircle size={60} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <h3>Video Lectures Coming Soon</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>We are curating the best content for you.</p>
                                </div>
                            )
                    )}
                </>
            )}
        </DashboardLayout>
    );
};

export default ResourcesHub;
