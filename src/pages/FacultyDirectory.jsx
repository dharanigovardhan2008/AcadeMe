import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Phone, MapPin, User, X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

const FacultyDirectory = () => {
    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Track if editing
    const [editId, setEditId] = useState(null);

    // --- ADMIN CHECK ---
    const currentUser = auth.currentUser;
    const ADMIN_EMAIL = "palerugopi2008@gmail.com"; 
    const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Form State (Updated to include courses array)
    const initialFormState = {
        name: '', designation: '', department: 'CSE', 
        phone: '', location: '', 
        courses: [] // Array of { name: '', code: '' }
    };
    const [formData, setFormData] = useState(initialFormState);

    // Temp state for adding a single course in the form
    const [tempCourse, setTempCourse] = useState({ name: '', code: '' });

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

    // 2. Add / Update Logic
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing && editId) {
                await updateDoc(doc(db, "faculty", editId), formData);
            } else {
                await addDoc(collection(db, "faculty"), formData);
            }
            setFormData(initialFormState);
            setTempCourse({ name: '', code: '' });
            setShowForm(false);
            setIsEditing(false);
            setEditId(null);
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

    // 4. Edit Logic
    const handleEdit = (faculty) => {
        setFormData(faculty);
        setEditId(faculty.id);
        setIsEditing(true);
        setShowForm(true);
        setSelectedFaculty(null); // Close modal if open
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper: Add Course to List
    const addCourseToForm = () => {
        if (tempCourse.name && tempCourse.code) {
            setFormData({ ...formData, courses: [...(formData.courses || []), tempCourse] });
            setTempCourse({ name: '', code: '' });
        }
    };

    // Helper: Remove Course from List
    const removeCourseFromForm = (index) => {
        const updated = formData.courses.filter((_, i) => i !== index);
        setFormData({ ...formData, courses: updated });
    };

    // 5. Filtering
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
                        <p style={{ color: 'var(--text-secondary)' }}>Find professors & their courses</p>
                    </div>
                    
                    {isAdmin && (
                        <button 
                            onClick={() => {
                                setShowForm(!showForm);
                                setIsEditing(false);
                                setFormData(initialFormState);
                            }}
                            style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Faculty</>}
                        </button>
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <GlassInput icon={Search} placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ margin: 0 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' }}>
                        {departments.map(d => (
                            <button key={d} onClick={() => setDept(d)} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid', borderColor: dept === d ? 'var(--primary)' : 'rgba(255,255,255,0.1)', background: dept === d ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: dept === d ? 'white' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{d}</button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* --- ADD / EDIT FORM (Admin Only) --- */}
            {isAdmin && showForm && (
                <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
                            <input type="text" placeholder="Designation" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} style={{ ...inputStyle, appearance: 'none' }}>
                                {departments.filter(d => d !== 'All').map(d => <option key={d} value={d} style={{color:'black'}}>{d}</option>)}
                            </select>
                            <input type="text" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                        </div>
                        <input type="text" placeholder="Location / Cabin (e.g. AB-101)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={inputStyle} />

                        {/* Course Addition Section */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '8px', display: 'block' }}>Add Courses Taught</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input type="text" placeholder="Course Code (e.g. CS101)" value={tempCourse.code} onChange={e => setTempCourse({...tempCourse, code: e.target.value})} style={inputStyle} />
                                <input type="text" placeholder="Course Name" value={tempCourse.name} onChange={e => setTempCourse({...tempCourse, name: e.target.value})} style={inputStyle} />
                                <button type="button" onClick={addCourseToForm} style={{ padding: '0 15px', background: '#34D399', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'black' }}><Plus /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {formData.courses?.map((c, i) => (
                                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {c.code} - {c.name}
                                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeCourseFromForm(i)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                            {loading ? 'Saving...' : (isEditing ? 'Update Faculty' : 'Save Faculty')}
                        </button>
                    </form>
                </GlassCard>
            )}

            {/* FACULTY GRID */}
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

                        {/* Admin Action Buttons on Card */}
                        {isAdmin && (
                            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px' }}>
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(f); }} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        )}
                    </GlassCard>
                ))}
            </div>

            {/* DETAIL MODAL */}
            {selectedFaculty && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedFaculty(null)}>
                    <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative' }}>
                        <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.2)' }}>
                                <User size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedFaculty.name}</h2>
                            <p style={{ color: 'var(--primary)' }}>{selectedFaculty.designation}</p>
                            <div style={{ marginTop: '0.5rem' }}><Badge variant="primary">{selectedFaculty.department}</Badge></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Replaced Email with Courses List */}
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--accent)' }}>
                                    <BookOpen size={20} /> <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Courses Taught</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '30px' }}>
                                    {selectedFaculty.courses && selectedFaculty.courses.length > 0 ? (
                                        selectedFaculty.courses.map((c, i) => (
                                            <span key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                                                {c.code} - {c.name}
                                            </span>
                                        ))
                                    ) : ( <span style={{ fontSize: '0.8rem', color: '#666' }}>No courses listed.</span> )}
                                </div>
                            </div>

                            <InfoRow icon={<Phone size={20} color="var(--success)" />} label="Phone" value={selectedFaculty.phone || "N/A"} />
                            <InfoRow icon={<MapPin size={20} color="var(--warning)" />} label="Location" value={selectedFaculty.location || "N/A"} />
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <GlassButton variant="gradient" style={{ flex: 1, justifyContent: 'center' }}>Call Now</GlassButton>
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
