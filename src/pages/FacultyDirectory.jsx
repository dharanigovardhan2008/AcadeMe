import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Phone, User, X, Plus, Trash2, Edit2, Code, Filter, RefreshCcw } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const POINTS = { CALL_FACULTY: 3 };

const FacultyDirectory = () => {
    const { awardPoints } = useData();
    const { user } = useAuth();

    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const currentUser = auth.currentUser;
    const ADMIN_EMAIL = "palerugopi2008@gmail.com";
    const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const initialFormState = { name: '', designation: '', phone: '', courses: [] };
    const [formData, setFormData] = useState(initialFormState);
    const [tempCourse, setTempCourse] = useState({ name: '', code: '' });

    useEffect(() => {
        const q = query(collection(db, "faculty"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setFacultyList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    const uniqueCourseCodes = useMemo(() => {
        const codes = facultyList.flatMap(f => f.courses ? f.courses.map(c => c.code) : []);
        return ['All', ...new Set(codes.filter(Boolean))].sort();
    }, [facultyList]);

    const filtered = useMemo(() => facultyList.filter(f => {
        const s = search.toLowerCase().trim();
        const matchesSearch = !s ||
            (f.name?.toLowerCase() || '').includes(s) ||
            (f.designation?.toLowerCase() || '').includes(s) ||
            f.courses?.some(c =>
                (c.name?.toLowerCase() || '').includes(s) ||
                (c.code?.toLowerCase() || '').includes(s)
            );
        const matchesCode = courseFilter === 'All' ||
            f.courses?.some(c => c.code === courseFilter);
        return matchesSearch && matchesCode;
    }), [search, courseFilter, facultyList]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // only save fields we want — no department/room/email
            const data = {
                name: formData.name,
                designation: formData.designation,
                phone: formData.phone,
                courses: formData.courses || [],
            };
            if (isEditing && editId) {
                await updateDoc(doc(db, "faculty", editId), data);
            } else {
                await addDoc(collection(db, "faculty"), data);
            }
            setFormData(initialFormState);
            setTempCourse({ name: '', code: '' });
            setShowForm(false); setIsEditing(false); setEditId(null);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this faculty member?")) {
            await deleteDoc(doc(db, "faculty", id));
            setSelectedFaculty(null);
        }
    };

    const handleEdit = (faculty) => {
        setFormData({
            name: faculty.name || '',
            designation: faculty.designation || '',
            phone: faculty.phone || '',
            courses: faculty.courses || [],
        });
        setEditId(faculty.id); setIsEditing(true);
        setShowForm(true); setSelectedFaculty(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addCourseToForm = () => {
        if (tempCourse.name && tempCourse.code) {
            setFormData(p => ({ ...p, courses: [...(p.courses || []), { ...tempCourse }] }));
            setTempCourse({ name: '', code: '' });
        }
    };

    const removeCourseFromForm = (index) => {
        setFormData(p => ({ ...p, courses: p.courses.filter((_, i) => i !== index) }));
    };

    const handleCallFaculty = async (phone) => {
        if (!phone) return;
        if (currentUser) {
            await awardPoints(
                currentUser.uid,
                currentUser.displayName || user?.name,
                POINTS.CALL_FACULTY,
                'Called a faculty member'
            );
        }
        window.location.href = `tel:${phone}`;
    };

    // font-size 16px stops iOS from zooming + closing keyboard on focus
    const inputStyle = {
        width: '100%', padding: '12px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none',
        fontSize: '16px', boxSizing: 'border-box',
    };

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Faculty Directory</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Find professors by Course Code</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData(initialFormState); }}
                            style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Faculty</>}
                        </button>
                    )}
                </div>

                {/* Search bar */}
                <div style={{ marginTop: '1.5rem' }}>
                    <GlassInput
                        icon={Search}
                        placeholder="Search name, course or code..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ margin: 0, fontSize: '16px' }}
                    />
                </div>

                {/* Filter pills — on its own row, full width, scrollable */}
                <div style={{
                    marginTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    // hide scrollbar but keep scroll
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '2px', // prevents bottom clip
                }}>
                    <Filter size={16} color="#aaa" style={{ flexShrink: 0 }} />
                    {uniqueCourseCodes.map(code => (
                        <button
                            key={code}
                            onClick={() => setCourseFilter(code)}
                            style={{
                                flexShrink: 0,
                                padding: '7px 16px',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: courseFilter === code ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                background: courseFilter === code ? 'rgba(59,130,246,0.2)' : 'transparent',
                                color: courseFilter === code ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: courseFilter === code ? 'bold' : 'normal',
                                fontSize: '0.85rem',
                            }}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Admin form */}
            {isAdmin && showForm && (
                <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem' }}>
                            <input type="text" placeholder="Name (e.g. Dr. Gopi)" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                            <input type="text" placeholder="Designation" required value={formData.designation} onChange={e => setFormData(p => ({ ...p, designation: e.target.value }))} style={inputStyle} />
                        </div>
                        <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '8px', display: 'block' }}>Add Courses Taught</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input type="text" placeholder="Code (e.g. CS101)" value={tempCourse.code} onChange={e => setTempCourse(p => ({ ...p, code: e.target.value }))} style={inputStyle} />
                                <input type="text" placeholder="Name (e.g. Java)" value={tempCourse.name} onChange={e => setTempCourse(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                                <button type="button" onClick={addCourseToForm} style={{ padding: '0 15px', background: '#34D399', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'black', flexShrink: 0 }}><Plus /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {formData.courses?.map((c, i) => (
                                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.2)', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <b>{c.code}</b> - {c.name}
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

            {/* Faculty grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filtered.length > 0 ? filtered.map(f => (
                    <GlassCard key={f.id} onClick={() => setSelectedFaculty(f)} style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                {f.name?.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || '?'}
                            </span>
                        </div>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>{f.name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{f.designation}</p>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {f.courses?.slice(0, 2).map((c, idx) => <Badge key={idx} variant="primary">{c.code}</Badge>)}
                            {f.courses?.length > 2 && <span style={{ fontSize: '0.8rem', color: '#aaa' }}>+{f.courses.length - 2}</span>}
                        </div>
                        {isAdmin && (
                            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px' }}>
                                <button onClick={e => { e.stopPropagation(); handleEdit(f); }} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(f.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        )}
                    </GlassCard>
                )) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <RefreshCcw size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>No faculty members match your search.</p>
                    </div>
                )}
            </div>

            {/* Faculty detail modal */}
            {selectedFaculty && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setSelectedFaculty(null)}
                >
                    <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        {/* Avatar + name */}
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.2)' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                    {selectedFaculty.name?.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || '?'}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedFaculty.name}</h2>
                            <p style={{ color: 'var(--primary)' }}>{selectedFaculty.designation}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Courses taught */}
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--accent)' }}>
                                    <BookOpen size={20} />
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Courses Taught</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '30px' }}>
                                    {selectedFaculty.courses?.length > 0
                                        ? selectedFaculty.courses.map((c, i) => (
                                            <span key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px' }}>{c.name}</span>
                                        ))
                                        : <span style={{ fontSize: '0.8rem', color: '#666' }}>No courses listed.</span>
                                    }
                                </div>
                            </div>

                            {/* Phone */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Phone size={20} color="var(--success)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Phone</p>
                                    <p style={{ margin: 0 }}>{selectedFaculty.phone || "N/A"}</p>
                                </div>
                            </div>

                            {/* Course codes */}
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--warning)' }}>
                                    <Code size={20} />
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Course Codes</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '30px' }}>
                                    {selectedFaculty.courses?.length > 0
                                        ? selectedFaculty.courses.map((c, i) => (
                                            <span key={i} style={{ fontSize: '0.8rem', background: 'rgba(251,191,36,0.1)', color: '#FBBF24', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.2)' }}>{c.code}</span>
                                        ))
                                        : <span style={{ fontSize: '0.8rem', color: '#666' }}>No codes listed.</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Call button */}
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <GlassButton variant="gradient" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleCallFaculty(selectedFaculty.phone)}>
                                Call Now
                            </GlassButton>
                            {currentUser && (
                                <span style={{ fontSize: '0.75rem', color: '#34D399', whiteSpace: 'nowrap' }}>+{POINTS.CALL_FACULTY} pts</span>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDirectory;
