import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, BarChart2, Settings as SettingsIcon, Shield, Plus, MoreVertical, Trash2, Ban, CheckCircle, MessageCircle, Mail, Send, Bell } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
            querySnapshot.forEach((doc) => {
                usersList.push({ id: doc.id, ...doc.data() });
            });
            setUsers(usersList);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users: ", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleBlockUser = async (userId, isBlocked) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                isBlocked: !isBlocked
            });
            setUsers(users.map(user =>
                user.id === userId ? { ...user, isBlocked: !isBlocked } : user
            ));
        } catch (error) {
            console.error("Error updating user: ", error);
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to permanently delete this user?")) {
            try {
                await deleteDoc(doc(db, "users", userId));
                setUsers(users.filter(user => user.id !== userId));
            } catch (error) {
                console.error("Error deleting user: ", error);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedUserForMessage || !messageText.trim()) return;

        try {
            await addDoc(collection(db, "notifications"), {
                userId: selectedUserForMessage.uid,
                userName: selectedUserForMessage.name,
                adminId: 'admin', 
                message: messageText,
                type: 'admin_message',
                read: false,
                createdAt: new Date().toISOString(),
                replies: []
            });
            setShowMessageModal(false);
            setMessageText('');
            alert("Message sent successfully!");
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        }
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
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=32`} 
                                            alt={user.name} 
                                            style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {user.regNo || <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>N/A</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>{user.branch}</td>
                                <td style={{ padding: '1rem' }}>
                                    <Badge variant={user.isBlocked ? "destructive" : "success"}>
                                        {user.isBlocked ? "Blocked" : "Active"}
                                    </Badge>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <GlassButton onClick={() => { setSelectedUserForMessage(user); setShowMessageModal(true); }} style={{ background: 'rgba(59, 130, 246, 0.2)', border: 'none', color: '#60A5FA', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Message User"><MessageCircle size={16} /></GlassButton>
                                    <GlassButton onClick={() => toggleBlockUser(user.id, user.isBlocked)} style={{ padding: '5px 10px', background: user.isBlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>{user.isBlocked ? <CheckCircle size={16} color="#34D399" /> : <Ban size={16} color="#F87171" />}</GlassButton>
                                    <GlassButton onClick={() => deleteUser(user.id)} style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.1)' }}><Trash2 size={16} /></GlassButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showMessageModal && selectedUserForMessage && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <GlassCard style={{ width: '400px', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Send Message to {selectedUserForMessage.name}</h3>
                        <form onSubmit={handleSendMessage}><textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message here..." style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '1rem' }} required /><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}><GlassButton type="button" onClick={() => setShowMessageModal(false)} style={{ background: 'rgba(255,255,255,0.1)' }}>Cancel</GlassButton><GlassButton type="submit" variant="gradient">Send</GlassButton></div></form>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
};

const FacultyManagement = () => {
    const { faculty } = useData();
    const [newFaculty, setNewFaculty] = useState({ name: '', designation: '', mobile: '', branch: 'CSE' });
    const [loading, setLoading] = useState(false);

    const handleAddFaculty = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "faculty"), newFaculty);
            setNewFaculty({ name: '', designation: '', mobile: '', branch: 'CSE' }); 
            alert("Faculty added successfully!");
        } catch (error) {
            console.error("Error adding faculty: ", error);
            alert("Error adding faculty");
        }
        setLoading(false);
    };

    const handleDeleteFaculty = async (id) => {
        if (window.confirm("Are you sure you want to delete this faculty member?")) {
            try {
                await deleteDoc(doc(db, "faculty", id));
            } catch (error) {
                console.error("Error deleting faculty: ", error);
            }
        }
    };

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Faculty Management</h3>
            </div>
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Add New Faculty</h4>
                <form onSubmit={handleAddFaculty} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <input required type="text" placeholder="Name" value={newFaculty.name} onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    <input required type="text" placeholder="Designation" value={newFaculty.designation} onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    <input required type="tel" placeholder="Mobile" value={newFaculty.mobile} onChange={(e) => setNewFaculty({ ...newFaculty, mobile: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    <select value={newFaculty.branch} onChange={(e) => setNewFaculty({ ...newFaculty, branch: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>{['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML', 'AIDS'].map(b => (<option key={b} value={b} style={{ background: '#333' }}>{b}</option>))}</select>
                    <GlassButton type="submit" disabled={loading} variant="gradient" style={{ justifyContent: 'center', height: '42px' }}>{loading ? 'Adding...' : 'Add Faculty'}</GlassButton>
                </form>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ textAlign: 'left', padding: '1rem' }}>Name</th><th style={{ textAlign: 'left', padding: '1rem' }}>Designation</th><th style={{ textAlign: 'left', padding: '1rem' }}>Mobile</th><th style={{ textAlign: 'left', padding: '1rem' }}>Branch</th><th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th></tr></thead>
                    <tbody>{faculty.map(fac => (<tr key={fac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '1rem' }}>{fac.name}</td><td style={{ padding: '1rem' }}>{fac.designation}</td><td style={{ padding: '1rem' }}>{fac.mobile}</td><td style={{ padding: '1rem' }}><Badge variant="primary">{fac.branch}</Badge></td><td style={{ padding: '1rem', textAlign: 'right' }}><GlassButton onClick={() => handleDeleteFaculty(fac.id)} style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.1)' }}><Trash2 size={16} /></GlassButton></td></tr>))}</tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const ResourcesManagement = () => {
    const [resources, setResources] = useState([]);
    const [newResource, setNewResource] = useState({ title: '', type: 'concept-map', url: '', branches: [] });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const BRANCHES = ['CSE', 'IT', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BT', 'BME', 'BI', 'CSE-Bio', 'CSE-AI', 'CSE-DS'];

    const fetchResources = async () => {
        setFetchLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "resources"));
            const list = [];
            querySnapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
            setResources(list);
        } catch (error) { console.error("Error fetching resources: ", error); }
        setFetchLoading(false);
    };

    useEffect(() => { fetchResources(); }, []);

    const handleBranchChange = (branch) => {
        setNewResource(prev => {
            const currentBranches = prev.branches;
            if (currentBranches.includes(branch)) { return { ...prev, branches: currentBranches.filter(b => b !== branch) }; } else { return { ...prev, branches: [...currentBranches, branch] }; }
        });
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        if (newResource.branches.length === 0) { alert("Please select at least one branch."); return; }
        setLoading(true);
        try {
            await addDoc(collection(db, "resources"), { ...newResource, createdAt: new Date().toISOString() });
            setNewResource({ title: '', type: 'concept-map', url: '', branches: [] });
            alert("Resource added successfully!"); fetchResources();
        } catch (error) { console.error("Error adding resource: ", error); alert("Error adding resource"); }
        setLoading(false);
    };

    const handleDeleteResource = async (id) => {
        if (window.confirm("Are you sure you want to delete this resource?")) {
            try { await deleteDoc(doc(db, "resources", id)); setResources(resources.filter(res => res.id !== id)); } catch (error) { console.error("Error deleting resource: ", error); }
        }
    };

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}><h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Resources Management</h3><GlassButton onClick={fetchResources}><Layers size={16} /> Refresh</GlassButton></div>
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Upload Resource</h4>
                <form onSubmit={handleAddResource} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Title</label><input required type="text" placeholder="e.g., Data Structures Concept Map" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} /></div>
                        <div><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type</label><select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}><option value="concept-map" style={{ background: '#333' }}>Concept Map</option><option value="paper" style={{ background: '#333' }}>Question Paper (PYQ)</option><option value="syllabus" style={{ background: '#333' }}>Syllabus</option><option value="lab-manual" style={{ background: '#333' }}>Lab Manual</option><option value="imp-question" style={{ background: '#333' }}>Imp Questions</option><option value="mcq" style={{ background: '#333' }}>MCQs</option></select></div>
                    </div>
                    <div><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Resource URL</label><input required type="url" placeholder="https://drive.google.com/..." value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} /></div>
                    <div><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target Branches</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{BRANCHES.map(branch => (<button key={branch} type="button" onClick={() => handleBranchChange(branch)} style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', borderColor: newResource.branches.includes(branch) ? 'var(--primary)' : 'rgba(255,255,255,0.2)', background: newResource.branches.includes(branch) ? 'rgba(59, 130, 246, 0.3)' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>{branch}</button>))}</div></div>
                    <GlassButton type="submit" disabled={loading} variant="gradient" style={{ justifyContent: 'center', marginTop: '1rem' }}>{loading ? 'Uploading...' : 'Upload Resource'}</GlassButton>
                </form>
            </div>
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}><thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ textAlign: 'left', padding: '1rem' }}>Title</th><th style={{ textAlign: 'left', padding: '1rem' }}>Type</th><th style={{ textAlign: 'left', padding: '1rem' }}>Branches</th><th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th></tr></thead><tbody>{fetchLoading ? (<tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>Loading...</td></tr>) : resources.map(res => (<tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '1rem' }}><h4 style={{ fontWeight: '600' }}>{res.title}</h4><a href={res.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View Link</a></td><td style={{ padding: '1rem' }}><Badge variant="neutral">{res.type}</Badge></td><td style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>{res.branches.map(b => (<span key={b} style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{b}</span>))}</div></td><td style={{ padding: '1rem', textAlign: 'right' }}><GlassButton onClick={() => handleDeleteResource(res.id)} style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.1)' }}><Trash2 size={16} /></GlassButton></td></tr>))}</tbody></table></div>
        </GlassCard>
    );
};

const UpdatesManagement = () => {
    const [updates, setUpdates] = useState([]);
    const [newUpdate, setNewUpdate] = useState({ title: '', message: '' });

    const fetchUpdates = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "updates"));
            const list = [];
            querySnapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
            list.sort((a, b) => new Date(b.date) - new Date(a.date));
            setUpdates(list);
        } catch (error) { console.error("Error fetching updates: ", error); }
    };

    useEffect(() => { fetchUpdates(); }, []);

    const postUpdate = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "updates"), { ...newUpdate, date: new Date().toISOString() });
        setNewUpdate({ title: '', message: '' }); fetchUpdates(); alert("Posted!");
    };

    return (
        <GlassCard>
            <h3 style={{ marginBottom: '1rem' }}>System Updates</h3>
            <form onSubmit={postUpdate} style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <input placeholder="Title" value={newUpdate.title} onChange={e => setNewUpdate({ ...newUpdate, title: e.target.value })} style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} required />
                <textarea placeholder="Message" value={newUpdate.message} onChange={e => setNewUpdate({ ...newUpdate, message: e.target.value })} style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', minHeight: '80px' }} />
                <GlassButton type="submit" variant="gradient">Post Update</GlassButton>
            </form>
            <div>{updates.map(u => <div key={u.id} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><h4>{u.title}</h4><p style={{ color: '#aaa', fontSize: '0.9rem' }}>{u.message}</p></div>)}</div>
        </GlassCard>
    );
};

// --- UPDATED REVIEWS MANAGEMENT (This is the section I fixed) ---
const ReviewsManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // FIXED: Fetch from correct collection 'facultyReviews'
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
        if (window.confirm("Delete this review?")) {
            try {
                await deleteDoc(doc(db, "facultyReviews", id));
                setReviews(reviews.filter(r => r.id !== id));
            } catch (error) { console.error("Error deleting review:", error); }
        }
    };

    const handleReply = async (id, currentReply) => {
        alert("Note: Use the Comment feature in the Faculty Reviews page to reply publicly.");
    };

    return (
        <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Student Reviews & Feedback</h3>
                <GlassButton onClick={fetchReviews}><Layers size={16} /> Refresh</GlassButton>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                ) : reviews.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No reviews yet.</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    {/* STUDENT NAME SHOWN HERE FOR ADMIN */}
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerName || 'User')}&background=random&color=fff&size=32`} 
                                        alt={review.reviewerName} 
                                        style={{ borderRadius: '50%' }}
                                    />
                                    <div>
                                        <h4 style={{ fontWeight: 'bold' }}>{review.reviewerName || 'Anonymous'}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {review.facultyName} • {review.courseCode}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a
                                        href={`mailto:${review.reviewerEmail}`}
                                        className="button"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '8px', borderRadius: '8px',
                                            background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA',
                                            textDecoration: 'none'
                                        }}
                                        title="Reply via Email"
                                    >
                                        <Mail size={16} />
                                    </a>
                                    <button
                                        onClick={() => handleDeleteReview(review.id)}
                                        style={{
                                            padding: '8px', borderRadius: '8px', border: 'none',
                                            background: 'rgba(239, 68, 68, 0.2)', color: '#F87171',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', color: 'rgba(255,255,255,0.9)' }}>
                                {review.feedback}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
};

const MessagesTab = () => {
    const [allMessages, setAllMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);

    const fetchAllMessages = async () => {
        setLoadingMessages(true);
        try {
            const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setAllMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error("Error fetching messages:", error); }
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
                {loadingMessages ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading conversations...</p> : allMessages.length === 0 ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No conversations yet.</p> : allMessages.map(msg => (
                    <div key={msg.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.userName || 'User')}&background=random&color=fff&size=32`} alt={msg.userName} style={{ borderRadius: '50%' }} />
                                <div><h4 style={{ fontWeight: 'bold' }}>To: {msg.userName || 'Unknown User'}</h4><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(msg.createdAt).toLocaleString()}</span></div>
                            </div>
                            <Badge variant="primary">Admin Message</Badge>
                        </div>
                        <p style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '1rem', borderLeft: '3px solid #3B82F6' }}>{msg.message}</p>
                        {msg.replies && msg.replies.length > 0 && (<div style={{ marginLeft: '1rem', marginTop: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}><h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Replies</h5>{msg.replies.map((reply, idx) => (<div key={idx} style={{ marginBottom: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}><span style={{ fontWeight: 'bold', color: reply.sender === 'admin' ? '#60A5FA' : '#34D399' }}>{reply.sender === 'admin' ? 'Admin' : 'User'}</span><span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{new Date(reply.timestamp).toLocaleTimeString()}</span></div><p style={{ fontSize: '0.9rem' }}>{reply.text}</p></div>))}</div>)}
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

const AdminPanel = () => {
    const { faculty } = useData();
    const { user, loading: authLoading } = useAuth(); 
    const navigate = useNavigate(); 
    const [activeTab, setActiveTab] = useState('overview');
    const [recentUsers, setRecentUsers] = useState([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // --- REAL STATS STATE ---
    const [stats, setStats] = useState({ users: 0, faculty: 0, reviews: 0, resources: 0 });

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                navigate('/dashboard'); 
            }
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const getStats = async () => {
            try {
                setLoadingStats(true);
                const u = await getDocs(collection(db, "users"));
                const f = await getDocs(collection(db, "faculty"));
                const r = await getDocs(collection(db, "facultyReviews"));
                const res = await getDocs(collection(db, "resources"));
                
                setStats({ users: u.size, faculty: f.size, reviews: r.size, resources: res.size });

                // Recent users
                const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
                const snapUsers = await getDocs(qUsers);
                const recent = [];
                snapUsers.forEach((doc) => recent.push({ id: doc.id, ...doc.data() }));
                setRecentUsers(recent);
                setLoadingStats(false);
            } catch(e) { console.error(e); }
        };
        if(user?.role === 'admin') getStats();
    }, [user]);

    const adminTabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'user management', label: 'User Management', icon: Users },
        { id: 'faculty', label: 'Faculty', icon: Users },
        { id: 'resources', label: 'Resources', icon: BookOpen },
        { id: 'reviews', label: 'Reviews', icon: MessageCircle }, 
        { id: 'messages', label: 'Messages', icon: Send },
        { id: 'updates', label: 'Updates', icon: Bell },
    ];

    if (authLoading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Checking permissions...</div>;
    
    if (!user || user.role !== 'admin') return null;

    const STATS_DATA = [
        { label: 'Total Users', value: stats.users, icon: Users, color: '#3B82F6' },
        { label: 'Total Faculty', value: stats.faculty, icon: Layers, color: '#F59E0B' },
        { label: 'Resources', value: stats.resources, icon: BookOpen, color: '#8B5CF6' },
        { label: 'Reviews', value: stats.reviews, icon: MessageCircle, color: '#10B981' },
    ];

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Admin Panel</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>System Management Dashboard</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
                    {adminTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '10px 15px', background: 'none', border: 'none',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* --- OVERVIEW TAB (Real Data) --- */}
            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {STATS_DATA.map((stat, idx) => (
                            <GlassCard key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ padding: '10px', borderRadius: '12px', background: `${stat.color}33`, color: stat.color }}>
                                        <stat.icon size={24} />
                                    </div>
                                </div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stat.value}</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                            </GlassCard>
                        ))}
                    </div>

                    <GlassCard>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>Recent Signups</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentUsers.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>No recent signups found.</p>
                            ) : (
                                recentUsers.map(user => (
                                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=40`} 
                                                alt={user.name} 
                                                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                                            />
                                            <div>
                                                <p style={{ fontWeight: '500' }}>{user.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.branch} • {user.year || 'Student'}</p>
                                            </div>
                                        </div>
                                        <Badge variant={user.isBlocked ? "destructive" : "success"}>
                                            {user.isBlocked ? "Blocked" : "Active"}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </>
            )}

            {/* Other Tabs */}
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
