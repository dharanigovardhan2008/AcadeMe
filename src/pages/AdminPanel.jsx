import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, BarChart2, Settings as SettingsIcon, Shield, Plus, MoreVertical, Trash2, Ban, CheckCircle, MessageCircle, Mail, Send, Bell } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
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
            // Update local state
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
                adminId: 'admin', // or real admin UID
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

    if (loading) return <div style={{ color: 'white' }}>Loading users...</div>;

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
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Reg No</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Branch</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>
                                    {user.regNo || <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>N/A</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>{user.name}</td>
                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>{user.branch}</td>
                                <td style={{ padding: '1rem' }}>
                                    <Badge variant={user.isBlocked ? "destructive" : "success"}>
                                        {user.isBlocked ? "Blocked" : "Active"}
                                    </Badge>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <GlassButton
                                        onClick={() => {
                                            setSelectedUserForMessage(user);
                                            setShowMessageModal(true);
                                        }}
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.2)', border: 'none',
                                            color: '#60A5FA', padding: '6px', borderRadius: '6px', cursor: 'pointer'
                                        }}
                                        title="Message User"
                                    >
                                        <MessageCircle size={16} />
                                    </GlassButton>
                                    <GlassButton
                                        onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                                        style={{ padding: '5px 10px', background: user.isBlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
                                    >
                                        {user.isBlocked ? <CheckCircle size={16} color="#34D399" /> : <Ban size={16} color="#F87171" />}
                                    </GlassButton>
                                    <GlassButton
                                        onClick={() => deleteUser(user.id)}
                                        style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.1)' }}
                                    >
                                        <Trash2 size={16} />
                                    </GlassButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showMessageModal && selectedUserForMessage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <GlassCard style={{ width: '400px', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Send Message to {selectedUserForMessage.name}</h3>
                        <form onSubmit={handleSendMessage}>
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message here..."
                                style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '1rem' }}
                                required
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <GlassButton type="button" onClick={() => setShowMessageModal(false)} style={{ background: 'rgba(255,255,255,0.1)' }}>Cancel</GlassButton>
                                <GlassButton type="submit" variant="gradient">Send</GlassButton>
                            </div>
                        </form>
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
            setNewFaculty({ name: '', designation: '', mobile: '', branch: 'CSE' }); // Reset form
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

            {/* Add Faculty Form */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Add New Faculty</h4>
                <form onSubmit={handleAddFaculty} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Name</label>
                        <input
                            required
                            type="text"
                            placeholder="Dr. John Doe"
                            value={newFaculty.name}
                            onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Designation</label>
                        <input
                            required
                            type="text"
                            placeholder="Professor"
                            value={newFaculty.designation}
                            onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mobile</label>
                        <input
                            required
                            type="tel"
                            placeholder="9876543210"
                            value={newFaculty.mobile}
                            onChange={(e) => setNewFaculty({ ...newFaculty, mobile: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Branch</label>
                        <select
                            value={newFaculty.branch}
                            onChange={(e) => setNewFaculty({ ...newFaculty, branch: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                        >
                            {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML', 'AIDS'].map(b => (
                                <option key={b} value={b} style={{ background: '#333' }}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <GlassButton type="submit" disabled={loading} variant="gradient" style={{ justifyContent: 'center', height: '42px' }}>
                        {loading ? 'Adding...' : 'Add Faculty'}
                    </GlassButton>
                </form>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Designation</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Mobile</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Branch</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculty.map(fac => (
                            <tr key={fac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>{fac.name}</td>
                                <td style={{ padding: '1rem' }}>{fac.designation}</td>
                                <td style={{ padding: '1rem' }}>{fac.mobile}</td>
                                <td style={{ padding: '1rem' }}><Badge variant="primary">{fac.branch}</Badge></td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <GlassButton
                                        onClick={() => handleDeleteFaculty(fac.id)}
                                        style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.1)' }}
                                    >
                                        <Trash2 size={16} />
                                    </GlassButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const ResourcesManagement = () => {
    const [resources, setResources] = useState([]);
    const [newResource, setNewResource] = useState({ title: '', type: 'concept-map
