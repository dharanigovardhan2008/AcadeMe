import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle, Search, BookOpen, RefreshCcw, CheckSquare, Square } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const CommonCourses = () => {
    const [dept1, setDept1] = useState('CSE');
    const [dept2, setDept2] = useState('IT');
    const [commonList, setCommonList] = useState([]);
    
    // Stores which courses are marked as completed
    const [checkedCourses, setCheckedCourses] = useState({});

    const [allCourses, setAllCourses] = useState([]); 
    const [loading, setLoading] = useState(true);

    const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'AIDS', 'BT', 'BME'];

    // 1. Fetch Courses
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "courses")); 
                const coursesData = [];
                querySnapshot.forEach((doc) => {
                    coursesData.push(doc.data()); 
                });
                setAllCourses(coursesData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching courses:", error);
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // 2. Find Common
    const findCommon = () => {
        if (dept1 === dept2) {
            alert("Please select two different departments.");
            return;
        }

        const list1 = allCourses
            .filter(c => (c.branch === dept1 || c.department === dept1))
            .map(c => c.name.toLowerCase().trim());

        const list2 = allCourses
            .filter(c => (c.branch === dept2 || c.department === dept2))
            .map(c => c.name.toLowerCase().trim());

        const common = list1.filter(courseName => list2.includes(courseName));
        
        const uniqueCommon = [...new Set(common)].map(name => 
            name.charAt(0).toUpperCase() + name.slice(1)
        );

        setCommonList(uniqueCommon);
        // Reset checks when new search is made
        setCheckedCourses({});
    };

    // 3. Toggle Checkbox
    const toggleCheck = (courseName) => {
        setCheckedCourses(prev => ({
            ...prev,
            [courseName]: !prev[courseName]
        }));
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Common Courses</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Find shared subjects between departments</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* Selection Card */}
                <GlassCard>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Search size={20} color="#60A5FA" /> Compare Departments
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Department 1</label>
                            <select value={dept1} onChange={(e) => setDept1(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
                                {DEPARTMENTS.map(d => <option key={d} value={d} style={{color:'black'}}>{d}</option>)}
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#aaa' }}>VS</div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Department 2</label>
                            <select value={dept2} onChange={(e) => setDept2(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
                                {DEPARTMENTS.map(d => <option key={d} value={d} style={{color:'black'}}>{d}</option>)}
                            </select>
                        </div>

                        <GlassButton onClick={findCommon} disabled={loading} variant="gradient" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            {loading ? <RefreshCcw className="animate-spin" size={18}/> : "Find Common Subjects"}
                        </GlassButton>
                    </div>
                </GlassCard>

                {/* Results Card */}
                <GlassCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                            <Layers size={20} color="#34D399" /> Results
                        </h3>
                        {commonList.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                {Object.values(checkedCourses).filter(Boolean).length} / {commonList.length} Completed
                            </span>
                        )}
                    </div>

                    {commonList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                                Found <b>{commonList.length}</b> common subjects between <b>{dept1}</b> and <b>{dept2}</b>.
                            </div>
                            <div style={{ display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                                {commonList.map((course, idx) => {
                                    const isChecked = checkedCourses[course];
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => toggleCheck(course)}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                                                background: isChecked ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.03)', 
                                                borderRadius: '10px', border: isChecked ? '1px solid #34D399' : '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer', transition: '0.2s'
                                            }}
                                        >
                                            <div style={{ color: isChecked ? '#34D399' : '#aaa' }}>
                                                {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '1rem', fontWeight: isChecked ? 'bold' : 'normal', color: isChecked ? 'white' : '#ddd' }}>
                                                    {course}
                                                </span>
                                            </div>
                                            {isChecked && <CheckCircle size={16} color="#34D399" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                            <Layers size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                            <p>Select departments to see results.</p>
                            {loading && <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>Loading Database...</p>}
                        </div>
                    )}
                </GlassCard>

            </div>
        </DashboardLayout>
    );
};

export default CommonCourses;
