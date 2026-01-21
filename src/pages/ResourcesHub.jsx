import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, PlayCircle, Map, Layers, FlaskConical, HelpCircle, CheckSquare } from 'lucide-react';
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
    }, [user?.branch]); // Only refetch if branch changes

    const filteredResources = resources.filter(res => {
        if (activeTab === 'concept-maps') return res.type === 'concept-map';
        if (activeTab === 'papers') return res.type === 'paper';
        if (activeTab === 'syllabus') return res.type === 'syllabus';
        if (activeTab === 'lab-manuals') return res.type === 'lab-manual';
        if (activeTab === 'imp-questions') return res.type === 'imp-question';
        if (activeTab === 'mcqs') return res.type === 'mcq';
        return false;
    });

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

            {loading ? <p style={{ color: 'white', textAlign: 'center' }}>Loading resources for {user?.branch}...</p> : (
                <>
                    {/* Concept Maps Block */}
                    {activeTab === 'concept-maps' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => (
                                <GlassCard key={idx} className="hover:transform hover:-translate-y-1">
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{res.title}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                        <Badge variant="primary">Concept Map</Badge>
                                    </div>
                                    <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton variant="gradient" style={{ width: '100%', justifyContent: 'center' }}>
                                            <Download size={18} /> Open Resource
                                        </GlassButton>
                                    </a>
                                </GlassCard>
                            )) : <p style={{ color: 'var(--text-secondary)' }}>No concept maps found for your branch.</p>}
                        </div>
                    )}

                    {/* Question Papers Block */}
                    {activeTab === 'papers' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => (
                                <GlassCard key={idx}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                            <FileText size={24} color="var(--accent)" />
                                        </div>
                                    </div>
                                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{res.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{user.branch} • PYQ</p>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <a href={res.url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                                            <GlassButton style={{ width: '100%', justifyContent: 'center' }} variant="gradient">Download/View</GlassButton>
                                        </a>
                                    </div>
                                </GlassCard>
                            )) : <p style={{ color: 'var(--text-secondary)' }}>No question papers found for your branch.</p>}
                        </div>
                    )}

                    {/* Syllabus Block */}
                    {activeTab === 'syllabus' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => (
                                <GlassCard key={idx}>
                                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{res.title}</h3>
                                    <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ width: '100%', justifyContent: 'center' }}><Download size={20} /> Download</GlassButton>
                                    </a>
                                </GlassCard>
                            )) : <p style={{ color: 'var(--text-secondary)' }}>No syllabus found for your branch.</p>}
                        </div>
                    )}

                    {/* Lab Manuals Block */}
                    {activeTab === 'lab-manuals' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => (
                                <GlassCard key={idx}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                            <FlaskConical size={24} color="var(--accent)" />
                                        </div>
                                    </div>
                                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{res.title}</h3>
                                    <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ width: '100%', justifyContent: 'center' }} variant="gradient"><Download size={20} /> Download</GlassButton>
                                    </a>
                                </GlassCard>
                            )) : <p style={{ color: 'var(--text-secondary)' }}>No lab manuals found for your branch.</p>}
                        </div>
                    )}

                    {/* Important Questions Block */}
                    {activeTab === 'imp-questions' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => (
                                <GlassCard key={idx}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                            <HelpCircle size={24} color="var(--accent)" />
                                        </div>
                                    </div>
                                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{res.title}</h3>
                                    <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ width: '100%', justifyContent: 'center' }} variant="gradient"><Download size={20} /> Download</GlassButton>
                                    </a>
                                </GlassCard>
                            )) : <p style={{ color: 'var(--text-secondary)' }}>No important questions found for your branch.</p>}
                        </div>
                    )}

                    {/* MCQs Block */}
                    {activeTab === 'mcqs' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => (
                                <GlassCard key={idx}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                            <CheckSquare size={24} color="var(--accent)" />
                                        </div>
                                    </div>
                                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{res.title}</h3>
                                    <a href={res.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ width: '100%', justifyContent: 'center' }} variant="gradient"><Download size={20} /> Download</GlassButton>
                                    </a>
                                </GlassCard>
                            )) : <p style={{ color: 'var(--text-secondary)' }}>No MCQs found for your branch.</p>}
                        </div>
                    )}

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
