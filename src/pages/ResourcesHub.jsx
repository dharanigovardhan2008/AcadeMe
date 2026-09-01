import React, { useState, useEffect } from 'react';
import {
    BookOpen, FileText, PlayCircle, Map,
    FlaskConical, HelpCircle, CheckSquare,
    SearchX, ExternalLink, Sparkles, BookMarked, Search, X, ChevronRight, LayoutGrid
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

// ── Tab Config (Premium Vibrant Pastels) ─────────────────────────────────────
const TABS = [
    { id: 'concept-maps',  label: 'Concept Maps',  icon: Map,          type: 'concept-map',  color: '#3B82F6', bg: '#EFF6FF', light: '#DBEAFE' },
    { id: 'papers',        label: 'Papers',        icon: FileText,     type: 'paper',        color: '#8B5CF6', bg: '#F5F3FF', light: '#EDE9FE' },
    { id: 'syllabus',      label: 'Syllabus',      icon: BookOpen,     type: 'syllabus',     color: '#10B981', bg: '#ECFDF5', light: '#D1FAE5' },
    { id: 'lab-manuals',   label: 'Lab Manuals',   icon: FlaskConical, type: 'lab-manual',   color: '#14B8A6', bg: '#ECFEFF', light: '#CCFBF1' },
    { id: 'imp-questions', label: 'Imp Questions', icon: HelpCircle,   type: 'imp-question', color: '#F59E0B', bg: '#FFFBEB', light: '#FEF3C7' },
    { id: 'mcqs',          label: 'MCQs',          icon: CheckSquare,  type: 'mcq',          color: '#EC4899', bg: '#FDF2F8', light: '#FCE7F3' },
    { id: 'lectures',      label: 'Videos',        icon: PlayCircle,   type: null,           color: '#F97316', bg: '#FFF7ED', light: '#FFEDD5' },
];

// ── Inject Ultra-Premium Styles ──────────────────────────────────────────────
(function () {
    if (document.getElementById('rh-ultra-style')) return;
    const s = document.createElement('style');
    s.id = 'rh-ultra-style';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

        /* Smooth reveal animations */
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        
        .r-page {
            min-height: 100vh;
            background-color: #FAFAFA;
            background-image: 
                radial-gradient(at 0% 0%, hsla(333,100%,96%,1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(225,100%,96%,1) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(278,100%,96%,1) 0, transparent 50%);
            padding: 2rem 1rem 6rem;
        }

        /* Hero Glass Panel */
        .r-hero {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 32px;
            padding: 2.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,1);
            margin-bottom: 2rem;
            display: flex; flex-direction: column; gap: 1.5rem;
            position: relative; overflow: hidden;
        }
        
        @media (min-width: 860px) {
            .r-hero { flex-direction: row; justify-content: space-between; align-items: center; padding: 3rem; }
        }

        /* Search Input Premium */
        .r-search-container { position: relative; width: 100%; max-width: 400px; flex-shrink: 0; }
        .r-search-input {
            width: 100%; padding: 18px 20px 18px 56px;
            background: #FFFFFF; border: 1px solid #E5E7EB;
            border-radius: 24px; font-size: 1rem; font-weight: 500; color: #111827;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            outline: none;
        }
        .r-search-input::placeholder { color: #9CA3AF; }
        .r-search-input:focus {
            border-color: #3B82F6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15), 0 10px 30px rgba(0,0,0,0.06);
            transform: translateY(-2px);
        }
        .r-search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #9CA3AF; transition: color 0.3s; }
        .r-search-input:focus + .r-search-icon { color: #3B82F6; }

        /* Premium Tabs */
        .r-tabs-wrap {
            display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 1.5rem;
            -ms-overflow-style: none; scrollbar-width: none;
        }
        .r-tabs-wrap::-webkit-scrollbar { display: none; }
        .r-tab {
            display: flex; align-items: center; gap: 8px;
            padding: 14px 24px; border-radius: 999px;
            font-size: 0.95rem; font-weight: 600; cursor: pointer;
            white-space: nowrap; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            background: #FFFFFF; color: #6B7280; border: 1px solid #E5E7EB;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02); outline: none;
        }
        .r-tab:hover { background: #F9FAFB; color: #111827; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.06); }
        .r-tab.active {
            background: #111827; color: #FFFFFF; border-color: #111827;
            box-shadow: 0 10px 30px rgba(17,24,39,0.25); transform: translateY(-2px);
        }

        /* Grid */
        .r-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 1.5rem; }

        /* Card with Ambient Orb */
        .r-card {
            background: #FFFFFF; border-radius: 32px; padding: 28px;
            border: 1px solid rgba(255,255,255,0.8);
            box-shadow: 0 10px 40px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5);
            display: flex; flex-direction: column; gap: 20px;
            position: relative; overflow: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            animation: fadeSlideUp 0.5s ease both;
        }
        .r-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 24px 60px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,1);
        }

        /* Ambient blurred orb inside the card */
        .r-ambient-orb {
            position: absolute; top: -40px; right: -40px;
            width: 140px; height: 140px; border-radius: 50%;
            filter: blur(40px); opacity: 0.4; z-index: 0;
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        }
        .r-card:hover .r-ambient-orb { transform: scale(1.5) translate(-10px, 10px); opacity: 0.7; }

        .r-card-content { position: relative; z-index: 1; display: flex; flex-direction: column; flex: 1; height: 100%; }

        /* Icon Box */
        .r-icon-box {
            width: 56px; height: 56px; border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.06);
            border: 1px solid rgba(255,255,255,0.5);
        }

        /* Pills */
        .r-pill-group { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .r-pill {
            font-size: 0.75rem; font-weight: 700; padding: 6px 14px;
            border-radius: 999px; letter-spacing: 0.3px; text-transform: uppercase;
        }

        /* Card Button */
        .r-btn {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; padding: 16px; border-radius: 20px;
            background: #F9FAFB; color: #111827; border: 1px solid #E5E7EB;
            font-size: 1rem; font-weight: 700; cursor: pointer; text-decoration: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); margin-top: auto;
        }
        .r-card:hover .r-btn {
            background: #111827; color: #FFFFFF; border-color: #111827;
            box-shadow: 0 10px 24px rgba(17,24,39,0.2);
        }
        .r-btn-icon { transition: transform 0.3s; }
        .r-card:hover .r-btn-icon { transform: translateX(4px); }

        /* Empty State */
        .r-empty {
            background: rgba(255,255,255,0.6); backdrop-filter: blur(24px);
            border-radius: 40px; padding: 6rem 2rem; text-align: center;
            border: 1px dashed #D1D5DB; box-shadow: 0 10px 40px rgba(0,0,0,0.02);
            display: flex; flex-direction: column; align-items: center; gap: 1rem;
            animation: fadeSlideUp 0.5s ease both;
        }

        /* Skeleton */
        .r-skel {
            background: #FFFFFF; border-radius: 32px; padding: 28px;
            border: 1px solid #F3F4F6; display: flex; flex-direction: column; gap: 20px;
            animation: pulseGlow 2s ease-in-out infinite; box-shadow: 0 10px 40px rgba(0,0,0,0.02);
        }
    `;
    document.head.appendChild(s);
}());

// ── Component ─────────────────────────────────────────────────────────────────
const ResourcesHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('concept-maps');
    const [resources, setResources] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [searchRaw, setSearchRaw] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch resources
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

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearchTerm(searchRaw.trim().toLowerCase()), 250);
        return () => clearTimeout(t);
    }, [searchRaw]);

    // Clear search on tab switch
    useEffect(() => { setSearchRaw(''); setSearchTerm(''); }, [activeTab]);

    const cfg      = TABS.find(t => t.id === activeTab);
    const byTab    = resources.filter(r => r.type === cfg?.type);
    const filtered = searchTerm
        ? byTab.filter(r => r.title?.toLowerCase().includes(searchTerm))
        : byTab;

    return (
        <DashboardLayout>
            <div className="r-page">
                <div style={{ maxWidth: '1250px', margin: '0 auto', width: '100%' }}>

                    {/* ── HERO HEADER ── */}
                    <div className="r-hero">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(29, 78, 216, 0.12)' }}>
                                <LayoutGrid size={36} color="#1D4ED8" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', fontWeight: '900', margin: '0 0 4px', color: '#111827', letterSpacing: '-1px', lineHeight: 1.1 }}>
                                    Resources Hub
                                </h1>
                                <p style={{ fontSize: '1.1rem', color: '#6B7280', margin: 0, fontWeight: '500' }}>
                                    {user?.branch ? `Premium study materials for ${user.branch}` : 'Everything you need to excel'}
                                </p>
                            </div>
                        </div>

                        {/* SEARCH BAR (Hidden on videos tab) */}
                        {activeTab !== 'lectures' && (
                            <div className="r-search-container">
                                <Search size={22} className="r-search-icon" />
                                <input
                                    className="r-search-input"
                                    type="text"
                                    value={searchRaw}
                                    onChange={e => setSearchRaw(e.target.value)}
                                    placeholder={`Search in ${cfg?.label || 'resources'}...`}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── TABS ── */}
                    <div className="r-tabs-wrap">
                        {TABS.map(tab => {
                            const on = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`r-tab ${on ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon size={18} strokeWidth={on ? 2.5 : 2} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── RESULTS INFO ── */}
                    {activeTab !== 'lectures' && !loading && (
                        <div style={{ marginBottom: '2rem', color: '#6B7280', fontSize: '1rem', fontWeight: '600', paddingLeft: '8px' }}>
                            {searchTerm ? `Found ${filtered.length} results for "${searchRaw}"` : `Showing ${filtered.length} ${cfg.label}`}
                        </div>
                    )}

                    {/* ── CONTENT AREA ── */}
                    {loading ? (
                        /* SKELETON LOADERS */
                        <div className="r-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="r-skel" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: '#F3F4F6' }} />
                                    <div style={{ width: '85%', height: '24px', background: '#F3F4F6', borderRadius: '8px' }} />
                                    <div style={{ width: '50%', height: '16px', background: '#F3F4F6', borderRadius: '8px' }} />
                                    <div style={{ height: '56px', width: '100%', background: '#F3F4F6', borderRadius: '20px', marginTop: '20px' }} />
                                </div>
                            ))}
                        </div>

                    ) : activeTab === 'lectures' ? (
                        /* LECTURES EMPTY STATE */
                        <div className="r-empty">
                            <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 20px 40px rgba(234, 88, 12, 0.15)', border: '4px solid #FFFFFF' }}>
                                <PlayCircle size={48} color="#EA580C" strokeWidth={2} />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 12px', color: '#111827', letterSpacing: '-0.5px' }}>Video Lectures Coming Soon</h3>
                            <p style={{ color: '#6B7280', fontSize: '1.15rem', margin: '0 0 32px', maxWidth: '400px', fontWeight: '500', lineHeight: 1.6 }}>We are curating the absolute highest quality video content tailored specifically to your branch syllabus.</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111827', color: '#FFFFFF', padding: '14px 28px', borderRadius: '999px', fontSize: '1.05rem', fontWeight: '800', boxShadow: '0 10px 30px rgba(17,24,39,0.2)' }}>
                                <Sparkles size={20} /> Stay Tuned
                            </span>
                        </div>

                    ) : filtered.length === 0 ? (
                        /* NO RESULTS EMPTY STATE */
                        <div className="r-empty">
                            <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '4px solid #FFFFFF', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                                <SearchX size={48} color="#9CA3AF" />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 12px', color: '#111827', letterSpacing: '-0.5px' }}>{searchTerm ? 'No matches found' : `No ${cfg.label} yet`}</h3>
                            <p style={{ color: '#6B7280', fontSize: '1.15rem', margin: '0 0 32px', maxWidth: '400px', fontWeight: '500', lineHeight: 1.6 }}>
                                {searchTerm ? `We couldn't find anything matching "${searchRaw}".` : `Premium resources for ${user?.branch || 'your branch'} haven't been uploaded to this category yet.`}
                            </p>
                            {searchTerm && (
                                <button onClick={() => setSearchRaw('')} style={{ background: '#111827', color: '#FFF', padding: '16px 32px', borderRadius: '999px', border: 'none', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(17,24,39,0.2)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                    Clear Search
                                </button>
                            )}
                        </div>

                    ) : (
                        /* RESOURCE CARDS */
                        <div className="r-grid">
                            {filtered.map((res, idx) => (
                                <div key={res.id || idx} className="r-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    
                                    {/* Ambient Glow Orb */}
                                    <div className="r-ambient-orb" style={{ background: cfg.color }} />
                                    
                                    <div className="r-card-content">
                                        {/* Icon */}
                                        <div className="r-icon-box" style={{ background: cfg.bg, color: cfg.color }}>
                                            <cfg.icon size={28} strokeWidth={2.5} />
                                        </div>

                                        {/* Title */}
                                        <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: '800', color: '#111827', lineHeight: 1.4, letterSpacing: '-0.3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {res.title}
                                        </h3>

                                        {/* Tags */}
                                        <div className="r-pill-group">
                                            <span className="r-pill" style={{ background: cfg.light, color: cfg.color }}>{cfg.label}</span>
                                            {user?.branch && <span className="r-pill" style={{ background: '#F3F4F6', color: '#4B5563' }}>{user.branch}</span>}
                                        </div>

                                        {/* Action Button */}
                                        <a href={res.url} target="_blank" rel="noreferrer" className="r-btn">
                                            Open Resource <ChevronRight size={20} className="r-btn-icon" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ResourcesHub;