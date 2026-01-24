import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, PlayCircle, Map, Layers, FlaskConical, HelpCircle, CheckSquare, SearchX } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ============ ADDED CACHING UTILITY ============
const CACHE_DURATION = 300000; // 5 minutes

const getFromCache = (key) => {
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
};

const saveToCache = (key, data) => {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}_time`, Date.now().toString());
};
// ============ END CACHING UTILITY ============

// ============ UI HELPER COMPONENTS ============

// 1. Skeleton Loading Grid (UPDATED FOR 2 COLUMNS ON MOBILE)
const SkeletonGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <GlassCard key={i} className="skeleton-pulse" style={{ height: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '60%', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                <div style={{ width: '40%', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                <div style={{ marginTop: 'auto', width: '100%', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>
            </GlassCard>
        ))}
    </div>
);

// 2. Empty State (No Resources Found)
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

    const TABS = [
        { id: 'concept-maps', label: 'Concept Maps', icon: Map },
        { id: 'papers', label: 'Question Papers', icon: FileText },
        { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
        { id: 'lab-manuals', label: 'Lab Manuals', icon: FlaskConical },
        { id: 'imp-questions', label: 'Imp Questions', icon: HelpCircle },
        { id: 'mcqs', label: 'MCQs', icon: CheckSquare },
        { id: 'lectures', label: 'Video Lectures', icon: PlayCircle },
    ];

    useEffect(() => {
        const fetchResources = async () => {
            if (!user?.branch) return;
            
            // ============ CHECK CACHE FIRST ============
            const cacheKey = `resources_${user.branch}`;
            const cached = getFromCache(cacheKey);
            if (cached) {
                setResources(cached);
                setLoading(false);
                return;
            }
            // ============ END CACHE CHECK ============
            
            setLoading(true);
            try {
                const q = query(
                    collection(db, "resources"),
                    where("branches", "array-contains", user.branch)
                );
                const querySnapshot = await getDocs(q);
                const resList = [];
                querySnapshot.forEach((doc) => {
                    resList.push({ id: doc.id, ...doc.data() });
                });
                setResources(resList);
                
                // ============ SAVE TO CACHE ============
                saveToCache(cacheKey, resList);
                // ============ END SAVE TO CACHE ============
            } catch (error) {
                console.error("Error fetching resources:", error);
            }
            setLoading(false);
        };

        fetchResources();
    }, [user?.branch]); 

    // Filter resources based on the active tab
    const filteredResources = resources.filter(res => {
        if (activeTab === 'concept-maps') return res.type === 'concept-map';
        if (activeTab === 'papers') return res.type === 'paper';
        if (activeTab === 'syllabus') return res.type === 'syllabus';
        if (activeTab === 'lab-manuals') return res.type === 'lab-manual';
        if (activeTab === 'imp-questions') return res.type === 'imp-question';
        if (activeTab === 'mcqs') return res.type === 'mcq';
        return false;
    });

    // Helper to render the grid of cards (Avoids repeating code for every tab)
    const renderResourceGrid = (label) => (
        <>
            {filteredResources.length > 0 ? (
                // UPDATED THIS DIV: Uses Tailwind for 2 columns on mobile, 3/4 on laptop
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {filteredResources.map((res, idx) => (
                        <GlassCard key={idx} className="hover:transform hover:-translate-y-1">
                            {/* Adjusted font size slightly for mobile responsiveness */}
                            <h3 className="text-sm md:text-lg font-bold mb-2 md:mb-4 line-clamp-2">
                                {res.title}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <Badge variant="primary">{label}</Badge>
                                {/* Hide branch text on tiny screens to save space */}
                                <span className="hidden md:inline" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                                    {user.branch}
                                </span>
                            </div>
                            <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                <GlassButton variant="gradient" style={{ width: '100%', justifyContent: 'center', padding: '0.5rem' }}>
                                    <Download size={16} /> 
                                    <span className="ml-2 text-xs md:text-sm">Open</span>
                                </GlassButton>
                            </a>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    message={`No ${label} Found`} 
                    subMessage={`We haven't uploaded any ${label.toLowerCase()} for ${user.branch} yet. Check back soon!`}
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
                                transition: 'all 0.3s ease', whiteSpace: 'nowrap'
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {loading ? <SkeletonGrid /> : (
                <>
                    {activeTab === 'concept-maps' && renderResourceGrid('Concept Map')}
                    {activeTab === 'papers' && renderResourceGrid('Question Paper')}
                    {activeTab === 'syllabus' && renderResourceGrid('Syllabus')}
                    {activeTab === 'lab-manuals' && renderResourceGrid('Lab Manual')}
                    {activeTab === 'imp-questions' && renderResourceGrid('Important Questions')}
                    {activeTab === 'mcqs' && renderResourceGrid('MCQs')}
                    
                    {activeTab === 'lectures' && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <PlayCircle size={60} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <h3>Video Lectures Coming Soon</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>We are curating the best content for you.</p>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
};

export default ResourcesHub;
