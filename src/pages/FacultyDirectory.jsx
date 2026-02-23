import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin, User, X, Plus, Trash2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const FacultyDirectory = () => {
    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newFaculty, setNewFaculty] = useState({
        name: '', designation: '', department: 'CSE', email: '', phone: '', cabin: ''
    });

    const departments = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'AIDS', 'BT', 'BME'];

    // 1. Real-time Fetch
    useEffect(() => {
        const q = query(collection(db, "faculty"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFacultyList(list);
        });
        return () => unsubscribe();
    }, []);

    // 2. Add Logic
    const handleAddFaculty = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "faculty"), newFaculty);
            setNewFaculty({ name: '', designation: '', department: 'CSE', email: '', phone: '', cabin: '' });
            setShowForm(false);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // 3. Delete Logic
    const handleDelete = async (id) => {
        if (window.confirm("Delete this faculty member?")) {
            await deleteDoc(doc(db, "faculty", id));
            setSelectedFaculty(null);
        }
    };

    // 4. Safe Filtering
    const filtered = facultyList.filter(f => {
        const nameMatch = f.name?.toLowerCase().includes(search.toLowerCase());
        const deptMatch = dept === 'All' || f.department === dept;
        return nameMatch && deptMatch;
    });

    const inputStyle = {
        width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none'
    };

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Faculty Directory</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Connect with your professors</p>
                    </div>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Faculty</>}
                    </button>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <GlassInput
                            icon={Search}
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' }}>
                        {departments.map(d => (
                            <button
                                key={d}
                                onClick={() => setDept(d)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: dept === d ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    background: dept === d ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: dept === d ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* ADD FORM */}
            {showForm && (
                <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Add New Faculty</h3>
                    <form onSubmit={handleAddFaculty} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="text" placeholder="Name" required value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} style={inputStyle} />
                            <input type="text" placeholder="Designation" required value={newFaculty.designation} onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})} style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} style={{ ...inputStyle, appearance: 'none' }}>
                                {departments.filter(d => d !== 'All').map(d => <option key={d} value={d} style={{color:'black'}}>{d}</option>)}
                            </select>
                            <input type="text" placeholder="Cabin" value={newFaculty.cabin} onChange={e => setNewFaculty({...newFaculty, cabin: e.target.value})} style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="email" placeholder="Email" required value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} style={inputStyle} />
                            <input type="text" placeholder="Phone" value={newFaculty.phone} onChange={e => setNewFaculty({...newFaculty, phone: e.target.value})} style={inputStyle} />
                        </div>
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                            {loading ? 'Adding...' : 'Save Faculty'}
                        </button>
                    </form>
                </GlassCard>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(f => (
                    <GlassCard
                        key={f.id}
                        className="hover:bg-white/5 cursor-pointer"
                        onClick={() => setSelectedFaculty(f)}
                        style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                {f.name.split(' ')[1]?.[0] || f.name[0]}
                            </span>
                        </div>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>{f.name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{f.designation}</p>
                        <Badge variant="primary">{f.department}</Badge>
                    </GlassCard>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedFaculty && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedFaculty(null)}>
                    <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative' }}>
                        <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        
                        {/* Delete Button inside Modal */}
                        <button onClick={() => handleDelete(selectedFaculty.id)} style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} title="Delete Faculty"><Trash2 size={24} /></button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.2)' }}>
                                <User size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedFaculty.name}</h2>
                            <p style={{ color: 'var(--primary)' }}>{selectedFaculty.designation}</p>
                            <div style={{ marginTop: '0.5rem' }}><Badge variant="primary">{selectedFaculty.department}</Badge></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <InfoRow icon={<Mail size={20} color="var(--accent)" />} label="Email" value={selectedFaculty.email} />
                            <InfoRow icon={<Phone size={20} color="var(--success)" />} label="Phone" value={selectedFaculty.phone} />
                            <InfoRow icon={<MapPin size={20} color="var(--warning)" />} label="Cabin" value={selectedFaculty.cabin} />
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <GlassButton variant="gradient" style={{ flex: 1, justifyContent: 'center' }}>Call Now</GlassButton>
                            <GlassButton style={{ flex: 1, justifyContent: 'center' }}>Send Email</GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
        {icon}
        <div><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</p><p>{value}</p></div>
    </div>
);

export default FacultyDirectory;
