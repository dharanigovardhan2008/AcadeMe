import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, BarChart2, Shield, Plus, Trash2, Ban, CheckCircle, MessageCircle, Mail, Send, Bell, Star, Flame } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- USER MANAGEMENT ---
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);
    const [messageText, setMessageText] = useState('');

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersList = [];
            querySnapshot.forEach((doc) => usersList.push({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
            setLoading(false);
        } catch (error) { console.error(error); setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleBlockUser = async (userId, isBlocked) => {
        try {
            await updateDoc(doc(db, "users", userId), { isBlocked: !isBlocked });
            setUsers(users.map(user => user.id === userId ? { ...user, isBlocked: !isBlocked } : user));
        } catch (error) { console.error(error); }
    };

    const deleteUser = async (userId) => {
        if (window.confirm("Permanently delete this user?")) {
            await deleteDoc(doc(db, "users", userId));
            setUsers(users.filter(user => user.id !== userId));
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedUserForMessage || !messageText.trim()) return;
        try {
            await addDoc(collection(db, "notifications"), {
                userId: selectedUserForMessage.uid, userName: selectedUserForMessage.name,
                adminId: 'admin', message: messageText, type: 'admin_message', read: false,
                createdAt: new Date().toISOString(), replies: []
            });
            setShowMessageModal(false); setMessageText(''); alert("Message sent!");
        } catch (error) { console.error(error); }
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading users...</div>;

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>User Management</h3>
                <GlassButton onClick={fetchUsers}><Layers size={16} /> Refresh</GlassButton>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>User</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Reg No</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Branch</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=32`} alt={user.name} style={{ borderRadius: '50%' }} /><div><div style={{ fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div></div></div></td>
                                <td style={{ padding: '1rem' }}>{user.regNo || "N/A"}</td>
                                <td style={{ padding: '1rem' }}>{user.branch}</td>
                                <td style={{ padding: '1rem' }}><Badge variant={user.isBlocked ? "destructive" : "success"}>{user.isBlocked ? "Blocked" : "Active"}</Badge></td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <GlassButton onClick={() => { setSelectedUserForMessage(user); setShowMessageModal(true); }} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}><MessageCircle size={16} /></GlassButton>
                                    <GlassButton onClick={() => toggleBlockUser(user.id, user.isBlocked)} style={{ background: user.isBlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>{user.isBlocked ? <CheckCircle size={16} color="#34D399" /> : <Ban size={16} color="#F87171" />}</GlassButton>
                                    <GlassButton onClick={() => deleteUser(user.id)} style={{ background: 'rgba(255, 255, 255, 0.1)' }}><Trash2 size={16} /></GlassButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showMessageModal && selectedUserForMessage && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <GlassCard style={{ width: '400px', padding: '1.5rem' }}>
                        <h3>Send Message to {selectedUserForMessage.name}</h3>
                        <form onSubmit={handleSendMessage}><textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type message..." style={{ width: '100%', minHeight: '100px', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '1rem' }} required /><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}><GlassButton onClick={() => setShowMessageModal(false)}>Cancel</GlassButton><GlassButton type="submit" variant="gradient">Send</GlassButton></div></form>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
};

// --- FACULTY MANAGEMENT ---
const FacultyManagement = () => {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchFaculty = async () => {
        const q = await getDocs(collection(db, "faculty"));
        setFaculty(q.docs.map(d => ({id: d.id, ...d.data()})));
    }
    useEffect(() => { fetchFaculty() }, []);

    const handleDeleteFaculty = async (id) => {
        if (window.confirm("Delete faculty member?")) {
            await deleteDoc(doc(db, "faculty", id));
            fetchFaculty();
        }
    };

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Faculty Management</h3>
                <GlassButton onClick={fetchFaculty}><Layers size={16} /> Refresh</GlassButton>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', color: 'white' }}>
                    <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{textAlign:'left', padding:'10px'}}>Name</th><th style={{textAlign:'left'}}>Designation</th><th style={{textAlign:'left'}}>Branch</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
                    <tbody>{faculty.map(f => (<tr key={f.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}><td style={{padding:'10px'}}>{f.name}</td><td>{f.designation}</td><td>{f.department}</td><td style={{textAlign:'right'}}><GlassButton onClick={() => handleDeleteFaculty(f.id)}><Trash2 size={16}/></GlassButton></td></tr>))}</tbody>
                </table>
            </div>
        </GlassCard>
    );
};

// --- RESOURCES MANAGEMENT ---
const ResourcesManagement = () => {
    const [resources, setResources] = useState([]);
    const [newResource, setNewResource] = useState({ title: '', type: 'concept-map', url: '', branches: [] });
    const [loading, setLoading] = useState(false);
    const BRANCHES = ['CSE', 'IT', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL'];

    const fetchResources = async () => {
        const q = await getDocs(collection(db, "resources"));
        setResources(q.docs.map(d => ({id: d.id, ...d.data()})));
    };
    useEffect(() => { fetchResources() }, []);

    const handleAddResource = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "resources"), { ...newResource, createdAt: new Date().toISOString() });
            alert("Resource Added!"); fetchResources();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    return (
        <GlassCard>
            <h3>Resources Management</h3>
            <form onSubmit={handleAddResource} style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <input required placeholder="Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} style={{padding:'10px', borderRadius:'8px', background:'rgba(0,0,0,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.1)'}} />
                <input required placeholder="URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} style={{padding:'10px', borderRadius:'8px', background:'rgba(0,0,0,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.1)'}} />
                <GlassButton type="submit" disabled={loading} variant="gradient">{loading ? 'Uploading...' : 'Upload'}</GlassButton>
            </form>
            <div>{resources.map(r => <div key={r.id} style={{padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{r.title}</div>)}</div>
        </GlassCard>
    );
};

// --- UPDATES MANAGEMENT ---
const UpdatesManagement = () => {
    const [updates, setUpdates] = useState([]);
    const [newUpdate, setNewUpdate] = useState({ title: '', message: '' });

    const fetchUpdates = async () => {
        const q = query(collection(db, "updates"));
        const snapshot = await getDocs(q);
        setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    useEffect(() => { fetchUpdates(); }, []);

    const postUpdate = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "updates"), { ...newUpdate, date: new Date().toISOString() });
        setNewUpdate({title:'', message:''}); fetchUpdates(); alert("Posted!");
    };

    return (
        <GlassCard>
            <h3 style={{marginBottom:'1rem'}}>System Updates</h3>
            <form onSubmit={postUpdate} style={{display:'grid', gap:'1rem', marginBottom:'2rem'}}>
                <input placeholder="Title" value={newUpdate.title} onChange={e=>setNewUpdate({...newUpdate, title:e.target.value})} style={{padding:'10px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px'}} required />
                <textarea placeholder="Message" value={newUpdate.message} onChange={e=>setNewUpdate({...newUpdate, message:e.target.value})} style={{padding:'10px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', minHeight:'80px'}} />
                <GlassButton type="submit" variant="gradient">Post Update</GlassButton>
            </form>
            <div>{updates.map(u => <div key={u.id} style={{padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><h4>{u.title}</h4><p style={{color:'#aaa', fontSize:'0.9rem'}}>{u.message}</p></div>)}</div>
        </GlassCard>
    );
};

// --- REVIEWS MANAGEMENT (FIXED FOR ADMIN VIEW) ---
const ReviewsManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // Updated to fetch from 'facultyReviews' collection
            const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
            const list = [];
            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            setReviews(list);
        } catch (error) { console.error("Error fetching reviews:", error); }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, []);

    const handleDeleteReview = async (id) => {
        if (window.confirm("Permanently delete this review?")) {
            await deleteDoc(doc(db, "facultyReviews", id));
            setReviews(reviews.filter(r => r.id !== id));
        }
    };

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Faculty Reviews Admin</h3>
                <GlassButton onClick={fetchReviews}><Layers size={16} /> Refresh</GlassButton>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? <p>Loading...</p> : reviews.length === 0 ? <p style={{ color: '#aaa' }}>No reviews found.</p> : reviews.map(r => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div>
                                <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{r.facultyName}</h4>
                                <span style={{ fontSize: '0.8rem', color: '#60A5FA', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{r.courseCode}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FBBF24', fontWeight: 'bold' }}><Star size={16} fill="#FBBF24" /> {r.rating}</div>
                                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* --- ADMIN ONLY: STUDENT INFO --- */}
                        <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '8px', borderRadius: '8px', marginBottom: '10px', borderLeft: '3px solid #EC4899' }}>
                            <p style={{ fontSize: '0.8rem', color: '#EC4899', fontWeight: 'bold', marginBottom: '2px' }}>Posted By (Admin View):</p>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem' }}>
                                <span style={{ color: 'white' }}>{r.reviewerName || "Unknown"}</span>
                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>({r.reviewerEmail})</span>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: '#ddd', fontStyle: 'italic', marginBottom: '10px' }}>"{r.feedback}"</p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <GlassButton onClick={() => handleDeleteReview(r.id)} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}><Trash2 size={16} /> Delete</GlassButton>
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

// --- MESSAGES MANAGEMENT ---
const MessagesTab = () => {
    const [allMessages, setAllMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);

    const fetchAllMessages = async () => {
        setLoadingMessages(true);
        try {
            const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setAllMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error(error); }
        setLoadingMessages(false);
    };

    useEffect(() => { fetchAllMessages(); }, []);

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>User Conversations</h3>
                <GlassButton onClick={fetchAllMessages} style={{ padding: '8px', fontSize: '0.9rem' }}>Refresh</GlassButton>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingMessages ? <p>Loading...</p> : allMessages.map(msg => (
                    <div key={msg.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <h4>To: {msg.userName}</h4>
                        <p style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px' }}>{msg.message}</p>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

// --- MAIN ADMIN PANEL ---
const AdminPanel = () => {
    const { user, loading: authLoading } = useAuth(); 
    const navigate = useNavigate(); 
    const [activeTab, setActiveTab] = useState('overview');
    
    // REAL STATS
    const [stats, setStats] = useState({ users: 0, faculty: 0, reviews: 0, resources: 0 });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            navigate('/dashboard'); 
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const getStats = async () => {
            const u = await getDocs(collection(db, "users"));
            const f = await getDocs(collection(db, "faculty"));
            const r = await getDocs(collection(db, "facultyReviews"));
            const res = await getDocs(collection(db, "resources"));
            setStats({ users: u.size, faculty: f.size, reviews: r.size, resources: res.size });
        };
        if(user?.role === 'admin') getStats();
    }, [user]);

    const adminTabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'user management', label: 'Users', icon: Users },
        { id: 'faculty', label: 'Faculty', icon: Users },
        { id: 'resources', label: 'Resources', icon: BookOpen },
        { id: 'reviews', label: 'Reviews', icon: MessageCircle }, 
        { id: 'messages', label: 'Messages', icon: Send },
        { id: 'updates', label: 'Updates', icon: Bell },
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.users}</h2><p style={{color:'#aaa'}}>Total Users</p></GlassCard>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.faculty}</h2><p style={{color:'#aaa'}}>Total Faculty</p></GlassCard>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.reviews}</h2><p style={{color:'#aaa'}}>Total Reviews</p></GlassCard>
                    <GlassCard><h2 style={{fontSize:'2.5rem', fontWeight:'bold'}}>{stats.resources}</h2><p style={{color:'#aaa'}}>Resources</p></GlassCard>
                </div>
            )}

            {activeTab === 'user management' && <UserManagement />}
            {activeTab === 'faculty' && <FacultyManagement />}
            {activeTab === 'resources' && <ResourcesManagement />}
            {activeTab === 'updates' && <UpdatesManagement />}
            {activeTab === 'reviews' && <ReviewsManagement />}
            {activeTab === 'messages' && <MessagesTab />}
        </DashboardLayout>
    );
}; 

export default AdminPanel;
