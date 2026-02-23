import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, BarChart2, Shield, Plus, Trash2, Ban, CheckCircle, MessageCircle, Mail, Send, Bell, Star } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Fixed imports
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const { user, loading: authLoading } = useAuth(); 
    const navigate = useNavigate(); 
    const [activeTab, setActiveTab] = useState('overview');
    
    // --- REAL STATS STATE ---
    const [stats, setStats] = useState({ users: 0, faculty: 0, reviews: 0, resources: 0 });
    // ------------------------

    const [usersList, setUsersList] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [reviewsList, setReviewsList] = useState([]);
    const [messagesList, setMessagesList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            navigate('/dashboard'); 
        }
    }, [user, authLoading, navigate]);

    // --- FETCH REAL STATS ---
    useEffect(() => {
        const getStats = async () => {
            try {
                const u = await getDocs(collection(db, "users"));
                const f = await getDocs(collection(db, "faculty"));
                const r = await getDocs(collection(db, "facultyReviews"));
                const res = await getDocs(collection(db, "resources"));
                setStats({
                    users: u.size,
                    faculty: f.size,
                    reviews: r.size,
                    resources: res.size
                });
            } catch (e) { console.error(e); }
        };
        if (user?.role === 'admin') getStats();
    }, [user]);

    // --- FETCHERS ---
    const fetchData = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'user management') {
                const q = await getDocs(collection(db, "users"));
                setUsersList(q.docs.map(d => ({id: d.id, ...d.data()})));
            } else if (tab === 'faculty') {
                const q = await getDocs(collection(db, "faculty"));
                setFacultyList(q.docs.map(d => ({id: d.id, ...d.data()})));
            } else if (tab === 'reviews') {
                // Correct collection: facultyReviews
                const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                setReviewsList(snap.docs.map(d => ({id: d.id, ...d.data()})));
            } else if (tab === 'messages') {
                const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                setMessagesList(snap.docs.map(d => ({id: d.id, ...d.data()})));
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => {
        if (activeTab !== 'overview') fetchData(activeTab);
    }, [activeTab]);

    // --- DELETE ACTIONS ---
    const deleteDocItem = async (col, id) => {
        if(window.confirm("Permanently delete?")) {
            await deleteDoc(doc(db, col, id));
            fetchData(activeTab); // refresh
        }
    }

    const adminTabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'user management', label: 'Users', icon: Users },
        { id: 'faculty', label: 'Faculty', icon: Users },
        { id: 'reviews', label: 'Reviews', icon: MessageCircle }, 
        { id: 'messages', label: 'Messages', icon: Send },
    ];

    if (authLoading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    if (!user || user.role !== 'admin') return null;

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }}><Shield size={24} /></div>
                    <div><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Admin Panel</h1><p style={{ color: 'var(--text-secondary)' }}>System Management</p></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
                    {adminTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 15px', background: 'none', border: 'none', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap' }}>{tab.label}</button>
                    ))}
                </div>
            </GlassCard>

            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {/* REAL STATS DISPLAY */}
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.users}</h2><p style={{color:'#aaa'}}>Total Users</p></GlassCard>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.faculty}</h2><p style={{color:'#aaa'}}>Total Faculty</p></GlassCard>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.reviews}</h2><p style={{color:'#aaa'}}>Total Reviews</p></GlassCard>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.resources}</h2><p style={{color:'#aaa'}}>Resources</p></GlassCard>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {loading ? <p>Loading...</p> : reviewsList.map(r => (
                        <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{display:'flex', justifyContent:'space-between'}}>
                                <div>
                                    <h4 style={{fontWeight:'bold'}}>{r.facultyName}</h4>
                                    <p style={{fontSize:'0.8rem', color:'#aaa'}}>Course: {r.courseCode}</p>
                                </div>
                                {/* ADMIN ONLY: SEE STUDENT NAME */}
                                <div style={{textAlign:'right'}}>
                                    <div style={{color:'#F472B6', fontSize:'0.9rem', fontWeight:'bold'}}>By: {r.reviewerName || "Unknown"}</div>
                                    <div style={{color:'#666', fontSize:'0.8rem'}}>{r.reviewerEmail}</div>
                                </div>
                            </div>
                            <p style={{margin:'10px 0', color:'#ddd'}}>"{r.feedback}"</p>
                            <GlassButton onClick={() => deleteDocItem("facultyReviews", r.id)} style={{background:'rgba(239,68,68,0.2)', color:'#F87171'}}><Trash2 size={16}/> Delete Review</GlassButton>
                        </div>
                    ))}
                </div>
            )}

            {/* Placeholder for other tabs logic which you already have */}
            {activeTab === 'user management' && <p>User list here ({usersList.length})</p>}
            {activeTab === 'faculty' && <p>Faculty list here ({facultyList.length})</p>}
            
        </DashboardLayout>
    );
}; 

export default AdminPanel;
