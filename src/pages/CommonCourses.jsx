import React, { useState, useEffect } from 'react';
// FIX: Added RefreshCcw to imports
import { Layers, CheckCircle, Search, BookOpen, RefreshCcw } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const CommonCourses = () => {
    const [dept1, setDept1] = useState('CSE');
    const [dept2, setDept2] = useState('IT');
    const [commonList, setCommonList] = useState([]);
    const [allCourses, setAllCourses] = useState([]); 
    const [loading, setLoading] = useState(true);

    const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'AIDS', 'BT', 'BME'];

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Adjust collection name if yours is different (e.g. 'courses' or 'mandatoryCourses')
                const querySnapshot = await getDocs(collection(db, "mandatoryCourses")); 
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

    const findCommon = () => {
        if (dept1 === dept2) {
            alert("Please select two different departments.");
            return;
        }

        // Filter for Dept 1
        const list1 = allCourses
            .filter(c => c.department === dept1 || (Array.isArray(c.departments) && c.departments.includes(dept1)))
            .map(c => c.name);

        // Filter for Dept 2
        const list2 = allCourses
            .filter(c => c.department === dept2 || (Array.isArray(c.departments) && c.departments.includes(dept2)))
            .map(c => c.name);

        // Find Intersection
        const common = list1.filter(courseName => list2.includes(courseName));
        setCommonList([...new Set(common)]);
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
                            <select 
                                value={dept1} 
                                onChange={(e) => setDept1(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                            >
                                {DEPARTMENTS.map(d => <option key={d} value={d} style={{color:'black'}}>{d}</option>)}
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#aaa' }}>VS</div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Department 2</label>
                            <select 
                                value={dept2} 
                                onChange={(e) => setDept2(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                            >
                                {DEPARTMENTS.map(d => <option key={d} value={d} style={{color:'black'}}>{d}</option>)}
                            </select>
                        </div>

                        <GlassButton 
                            onClick={findCommon} 
                            disabled={loading}
                            variant="gradient" 
                            style={{ justifyContent: 'center', marginTop: '1rem' }}
                        >
                            {loading ? <RefreshCcw className="animate-spin" size={18}/> : "Find Common Subjects"}
                        </GlassButton>
                    </div>
                </GlassCard>

                {/* Results Card */}
                <GlassCard>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layers size={20} color="#34D399" /> Results
                    </h3>

                    {commonList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                                Found <b>{commonList.length}</b> common subjects between <b>{dept1}</b> and <b>{dept2}</b>.
                            </div>
                            <div style={{ display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                                {commonList.map((course, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <BookOpen size={18} color="#FBBF24" />
                                        <span style={{ fontSize: '1rem' }}>{course}</span>
                                        <CheckCircle size={16} color="#34D399" style={{ marginLeft: 'auto' }} />
                                    </div>
                                ))}
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
