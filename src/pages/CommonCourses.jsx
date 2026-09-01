import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, CheckCircle, Search, RefreshCcw, CheckSquare, Square, ChevronDown } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DEFAULT_DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'AIDS', 'BT', 'BME'];

const CommonCourses = () => {
    const [dept1, setDept1] = useState('CSE');
    const [dept2, setDept2] = useState('IT');
    const [commonList, setCommonList] = useState([]);
    const [checkedCourses, setCheckedCourses] = useState({});
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    
    // Dynamic branches — auto-populated from Firestore
    const [availableBranches, setAvailableBranches] = useState(DEFAULT_DEPARTMENTS);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "courses"));
                const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllCourses(coursesData);

                const branches = [...new Set(coursesData.map(c => c.branch).filter(Boolean))].sort();
                if (branches.length > 0) setAvailableBranches(branches);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const findCommon = useCallback(() => {
        if (dept1 === dept2) { alert("Please select two different departments."); return; }
        if (loading || !allCourses.length) { alert("Courses are still loading. Please wait."); return; }

        setSearching(true);
        const normalize = name => name?.toLowerCase().trim() ?? '';

        const set1 = new Set(allCourses.filter(c => c.branch === dept1).map(c => normalize(c.name)).filter(Boolean));
        const set2 = new Set(allCourses.filter(c => c.branch === dept2).map(c => normalize(c.name)).filter(Boolean));

        const common = [...set1]
            .filter(name => set2.has(name))
            .map(name => name.charAt(0).toUpperCase() + name.slice(1))
            .sort();

        setCommonList(common);
        setCheckedCourses({});
        setSearching(false);
    }, [dept1, dept2, allCourses, loading]);

    const toggleCheck = useCallback((courseName) => {
        setCheckedCourses(prev => ({ ...prev, [courseName]: !prev[courseName] }));
    }, []);

    const completedCount = useMemo(() => Object.values(checkedCourses).filter(Boolean).length, [checkedCourses]);

    const CSS = `
        .cc-theme-wrapper {
            position: relative;
            min-height: 100vh;
            width: 100%;
            background-color: #FDFDFD;
            overflow: hidden;
            font-family: 'DM Sans', sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 3rem 1rem;
            box-sizing: border-box;
        }

        /* Gradient Mesh Background */
        .cc-mesh-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 0;
            pointer-events: none;
            background: 
                radial-gradient(circle at 15% 30%, rgba(255, 120, 220, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 85% 70%, rgba(120, 150, 255, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(200, 100, 255, 0.2) 0%, transparent 60%);
            filter: blur(60px);
        }

        /* Main Unified Card */
        .cc-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 900px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border-radius: 28px;
            padding: 2.5rem;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.05), 
                0 1px 3px rgba(0, 0, 0, 0.03),
                inset 0 0 0 1px rgba(255, 255, 255, 0.5);
            animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .cc-header {
            margin-bottom: 2rem;
            text-align: left;
        }

        .cc-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: #111827;
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .cc-subtitle {
            font-size: 0.9rem;
            color: #6B7280;
            margin: 0;
        }

        /* 2-Column Grid Layout */
        .cc-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr;
            gap: 2.5rem;
        }

        /* Left Panel - Compare */
        .cc-section-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1F2937;
            margin: 0 0 1.25rem 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .cc-input-group {
            margin-bottom: 1rem;
        }

        .cc-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #4B5563;
            margin-bottom: 6px;
            padding-left: 6px;
        }

        .cc-select-wrap {
            position: relative;
        }

        .cc-select {
            width: 100%;
            padding: 14px 24px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 999px; /* Pill Shape */
            font-family: inherit;
            font-size: 0.95rem;
            color: #1F2937;
            outline: none;
            appearance: none;
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s;
            font-weight: 500;
        }
        .cc-select:focus {
            border-color: #3B82F6;
            background: #FFFFFF;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .cc-select-icon {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: #9CA3AF;
        }

        .cc-vs-badge {
            text-align: center;
            font-size: 0.9rem;
            font-weight: 800;
            color: #9CA3AF;
            margin: 1rem 0;
            position: relative;
        }
        .cc-vs-badge::before, .cc-vs-badge::after {
            content: '';
            position: absolute;
            top: 50%;
            width: calc(50% - 20px);
            height: 1px;
            background: #E5E7EB;
        }
        .cc-vs-badge::before { left: 0; }
        .cc-vs-badge::after { right: 0; }

        .cc-btn-primary {
            width: 100%;
            background: #3B82F6;
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 999px; /* Pill Shape */
            font-weight: 600;
            font-family: inherit;
            font-size: 0.95rem;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 1.5rem;
        }
        .cc-btn-primary:hover:not(:disabled) {
            background: #2563EB;
        }
        .cc-btn-primary:disabled {
            background: #9CA3AF;
            cursor: not-allowed;
            opacity: 0.8;
        }

        /* Right Panel - Results */
        .cc-summary-banner {
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            color: #1D4ED8;
            padding: 12px 20px;
            border-radius: 999px; /* Pill Shape */
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .cc-list-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 380px;
            overflow-y: auto;
            padding-right: 6px;
        }

        /* Custom Scrollbar */
        .cc-list-container::-webkit-scrollbar { width: 6px; }
        .cc-list-container::-webkit-scrollbar-track { background: transparent; }
        .cc-list-container::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        .cc-list-container::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

        .cc-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            border-radius: 999px; /* Pill Shape */
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
        }
        
        .cc-row.unchecked {
            background: transparent;
            color: #4B5563;
        }
        .cc-row.unchecked:hover {
            background: #F9FAFB;
            border-color: #E5E7EB;
        }
        
        .cc-row.checked {
            background: #F0FDF4;
            border-color: #A7F3D0;
            color: #065F46;
        }

        .cc-row-text {
            flex: 1;
            font-size: 0.95rem;
            font-weight: 500;
            line-height: 1.4;
        }
        .cc-row.checked .cc-row-text {
            font-weight: 600;
        }

        .cc-empty-state {
            text-align: center;
            padding: 4rem 1rem;
            color: #6B7280;
            background: #F9FAFB;
            border-radius: 24px;
            border: 1px dashed #E5E7EB;
        }

        @media (max-width: 768px) {
            .cc-theme-wrapper { padding: 1.5rem 1rem; }
            .cc-card { padding: 1.5rem; border-radius: 24px; }
            .cc-grid { grid-template-columns: 1fr; gap: 2rem; }
            .cc-title { font-size: 1.4rem; }
            .cc-list-container { max-height: 300px; }
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className="cc-theme-wrapper">
                <div className="cc-mesh-bg" />
                
                <div className="cc-card">
                    <div className="cc-header">
                        <h1 className="cc-title"><Layers size={24} color="#3B82F6" /> Common Courses</h1>
                        <p className="cc-subtitle">Discover shared subjects between two departments</p>
                    </div>

                    <div className="cc-grid">
                        
                        {/* ── LEFT PANEL: Comparison Selection ── */}
                        <div>
                            <h3 className="cc-section-title">
                                <Search size={18} color="#8B5CF6" /> Compare Branches
                            </h3>
                            
                            <div className="cc-input-group">
                                <label className="cc-label">First Department</label>
                                <div className="cc-select-wrap">
                                    <select value={dept1} onChange={e => setDept1(e.target.value)} className="cc-select">
                                        {availableBranches.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="cc-select-icon" />
                                </div>
                            </div>

                            <div className="cc-vs-badge">VS</div>

                            <div className="cc-input-group">
                                <label className="cc-label">Second Department</label>
                                <div className="cc-select-wrap">
                                    <select value={dept2} onChange={e => setDept2(e.target.value)} className="cc-select">
                                        {availableBranches.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="cc-select-icon" />
                                </div>
                            </div>

                            <button 
                                onClick={findCommon} 
                                disabled={loading || searching} 
                                className="cc-btn-primary"
                            >
                                {loading || searching ? (
                                    <><RefreshCcw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                                ) : 'Find Matches'}
                            </button>
                        </div>

                        {/* ── RIGHT PANEL: Results ── */}
                        <div>
                            <h3 className="cc-section-title">
                                <CheckCircle size={18} color="#10B981" /> Match Results
                            </h3>

                            {commonList.length > 0 ? (
                                <div>
                                    <div className="cc-summary-banner">
                                        <span>Found <b>{commonList.length}</b> matches between <b>{dept1}</b> and <b>{dept2}</b></span>
                                        <span style={{ fontWeight: '700', background: '#DBEAFE', padding: '2px 8px', borderRadius: '20px' }}>
                                            {completedCount}/{commonList.length}
                                        </span>
                                    </div>
                                    
                                    <div className="cc-list-container">
                                        {commonList.map((course, idx) => {
                                            const isChecked = !!checkedCourses[course];
                                            return (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => toggleCheck(course)} 
                                                    className={`cc-row ${isChecked ? 'checked' : 'unchecked'}`}
                                                >
                                                    <div style={{ color: isChecked ? '#10B981' : '#D1D5DB' }}>
                                                        {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </div>
                                                    
                                                    <span className="cc-row-text">{course}</span>
                                                    
                                                    {isChecked && <CheckCircle size={16} color="#10B981" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="cc-empty-state">
                                    <Layers size={40} style={{ margin: '0 auto 10px', opacity: 0.2 }} color="#1F2937" />
                                    <p style={{ margin: 0, fontWeight: '600', color: '#374151' }}>
                                        {loading ? 'Connecting to database...' : 'No results to display'}
                                    </p>
                                    {!loading && <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Select two branches and click Find Matches.</p>}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </DashboardLayout>
    );
};

export default CommonCourses;