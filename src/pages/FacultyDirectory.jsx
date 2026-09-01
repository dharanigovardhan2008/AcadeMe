import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Phone, User, X, Plus, Trash2, Edit2, Code, Filter, RefreshCcw, Star, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

/* ── Inject Modern Light Theme Styles ─────────────────────────────── */
(function () {
    if (document.getElementById('fd-modern-style')) return;
    const s = document.createElement('style');
    s.id = 'fd-modern-style';
    s.textContent = `
@keyframes fdUp { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
@keyframes fdFade { from{opacity:0} to{opacity:1} }

/* Smooth scrolling filter chips */
.fd-scroll-container {
    display: flex;
    gap: 10px;
    align-items: center;
    overflow-x: auto;
    padding-bottom: 4px;
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.fd-scroll-container::-webkit-scrollbar { display: none; }

/* Filter Chips */
.fd-chip { 
    padding: 8px 18px; border-radius: 999px; border: 1px solid; 
    font-size: .85rem; font-weight: 600; cursor: pointer; 
    white-space: nowrap; transition: all .2s ease; outline: none; 
}
.fd-chip-on  { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; box-shadow: 0 4px 12px rgba(29, 78, 216, 0.1); }
.fd-chip-off { background: #FFFFFF; border-color: #E5E7EB; color: #6B7280; }
.fd-chip-off:hover { background: #F9FAFB; border-color: #D1D5DB; color: #111827; }

/* Faculty Cards */
.fd-card {
    background: #FFFFFF;
    border-radius: 28px;
    border: 1px solid #F3F4F6;
    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
    cursor: pointer; position: relative;
    transition: transform .25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow .25s ease;
    animation: fdUp .4s ease both;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}
.fd-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 20px 50px rgba(0,0,0,0.08); 
}

/* Modal Enhancements */
.fd-overlay {
    position: fixed; inset: 0; z-index: 9999; background: rgba(17,24,39,.4);
    backdrop-filter: blur(8px); display: flex; align-items: center;
    justify-content: center; padding: 1rem; animation: fdFade .2s ease both;
}
.fd-modal { 
    width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; overflow-x: hidden;
    background: #FFFFFF; border-radius: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); 
    position: relative;
    -ms-overflow-style: none; scrollbar-width: none;
}
.fd-modal::-webkit-scrollbar { display: none; }

/* Mobile Modal Bottom Sheet */
@media (max-width: 600px) {
    .fd-overlay { align-items: flex-end; padding: 0; }
    .fd-modal { border-radius: 32px 32px 0 0 !important; max-height: 88vh; }
}

/* Responsive Grid */
.fd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: 1.5rem;
}

/* Form Layout Mobile Fixes */
.fd-form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.fd-course-inputs { display: flex; gap: 8px; flex-wrap: wrap; }
@media (min-width: 600px) { 
    .fd-form-grid { grid-template-columns: 1fr 1fr; } 
    .fd-course-inputs { flex-wrap: nowrap; }
}
`;
    document.head.appendChild(s);
}());

/* ── Helpers ─────────────────────────────────────────────── */
const PASTELS = [
    { bg: '#EFF6FF', text: '#1D4ED8', shadow: 'rgba(29, 78, 216, 0.2)' }, 
    { bg: '#FCE7F3', text: '#BE185D', shadow: 'rgba(190, 24, 93, 0.2)' }, 
    { bg: '#DCFCE7', text: '#15803D', shadow: 'rgba(21, 128, 61, 0.2)' },
    { bg: '#FEF3C7', text: '#B45309', shadow: 'rgba(180, 83, 9, 0.2)' }, 
    { bg: '#F3E8FF', text: '#6D28D9', shadow: 'rgba(109, 40, 217, 0.2)' }, 
    { bg: '#FFE4E6', text: '#BE123C', shadow: 'rgba(190, 18, 60, 0.2)' },
    { bg: '#E0F2FE', text: '#0369A1', shadow: 'rgba(3, 105, 161, 0.2)' }, 
    { bg: '#FFEDD5', text: '#C2410C', shadow: 'rgba(194, 65, 12, 0.2)' }
];
const getPastel = name => PASTELS[(name?.charCodeAt(0) || 0) % PASTELS.length];
const getInitials = name => {
    const p = (name || '').trim().split(' ').filter(Boolean);
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

const StarRating = ({ rating, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} fill={i <= Math.round(rating) ? '#FBBF24' : 'none'} color={i <= Math.round(rating) ? '#FBBF24' : '#E5E7EB'} strokeWidth={i <= Math.round(rating) ? 1 : 2} />
            ))}
        </div>
        {rating > 0 && <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#B45309' }}>{Number(rating).toFixed(1)}</span>}
        {count && <span style={{ fontSize: '.75rem', color: '#9CA3AF', fontWeight: 600 }}>({count})</span>}
    </div>
);

/* ── Main Component ──────────────────────────────────────── */
const FacultyDirectory = () => {
    const [facultyList,    setFacultyList]    = useState([]);
    const [reviews,        setReviews]        = useState([]);
    const [search,         setSearch]         = useState('');
    const [courseFilter,   setCourseFilter]   = useState('All');
    const [selectedFaculty,setSelectedFaculty]= useState(null);
    const [showForm,       setShowForm]       = useState(false);
    const [loading,        setLoading]        = useState(false);
    const [isEditing,      setIsEditing]      = useState(false);
    const [editId,         setEditId]         = useState(null);

    const currentUser = auth.currentUser;
    const ADMIN_EMAIL = 'palerugopi2008@gmail.com';
    const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const initialFormState = { name: '', designation: '', department: 'CSE', phone: '', courses: [] };
    const [formData,   setFormData]   = useState(initialFormState);
    const [tempCourse, setTempCourse] = useState({ name: '', code: '' });

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'faculty'), orderBy('name')), snap => {
            setFacultyList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'facultyReviews'), orderBy('createdAt', 'desc')), snap => {
            setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    const ratingMap = useMemo(() => {
        const map = {};
        reviews.forEach(r => {
            if (!r.facultyName) return;
            if (!map[r.facultyName]) map[r.facultyName] = { sum: 0, count: 0 };
            map[r.facultyName].sum += Number(r.rating) || 0;
            map[r.facultyName].count += 1;
        });
        return map;
    }, [reviews]);

    const uniqueCourseCodes = useMemo(() => {
        const codes = facultyList.flatMap(f => f.courses ? f.courses.map(c => c.code) : []);
        return ['All', ...new Set(codes.filter(c => c))].sort();
    }, [facultyList]);

    const filtered = facultyList.filter(f => {
        const s = search.toLowerCase().trim();
        const matchesSearch = (f.name?.toLowerCase() || '').includes(s) || (f.designation?.toLowerCase() || '').includes(s) || (f.courses && f.courses.some(c => (c.name?.toLowerCase() || '').includes(s)));
        const matchesCode = courseFilter === 'All' || (f.courses && f.courses.some(c => c.code === courseFilter));
        return matchesSearch && matchesCode;
    });

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try {
            if (isEditing && editId) await updateDoc(doc(db, 'faculty', editId), formData);
            else await addDoc(collection(db, 'faculty'), formData);
            setFormData(initialFormState); setTempCourse({ name: '', code: '' });
            setShowForm(false); setIsEditing(false); setEditId(null);
        } catch (error) { console.error(error); }
        setLoading(false);
    };
    
    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this faculty member?')) {
            await deleteDoc(doc(db, 'faculty', id));
            setSelectedFaculty(null);
        }
    };
    
    const handleEdit = (faculty, e) => {
        e.stopPropagation();
        setFormData(faculty); setEditId(faculty.id); setIsEditing(true);
        setShowForm(true); setSelectedFaculty(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addCourseToForm = () => {
        if (tempCourse.name && tempCourse.code) {
            setFormData({ ...formData, courses: [...(formData.courses || []), tempCourse] });
            setTempCourse({ name: '', code: '' });
        }
    };

    const removeCourseFromForm = index => {
        setFormData({ ...formData, courses: formData.courses.filter((_, i) => i !== index) });
    };

    const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', color: '#111827', outline: 'none', fontSize: '0.95rem', transition: '0.2s' };
    const labelStyle = { display: 'block', marginBottom: '8px', color: '#4B5563', fontSize: '0.85rem', fontWeight: '600' };

    return (
        <DashboardLayout>
            <div style={{ minHeight: '100vh', background: 'linear-gradient(115deg, #FDF0F6 0%, #E8EFFF 50%, #F5F3FF 100%)', padding: '2rem 1rem 5rem', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '1150px', margin: '0 auto', width: '100%' }}>

                    {/* ── Header ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Faculty Directory</h1>
                            <p style={{ color: '#6B7280', fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', margin: '4px 0 0' }}>Find professors, courses, and reviews</p>
                        </div>
                        {isAdmin && (
                            <button onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData(initialFormState); }}
                                style={{ padding: '12px 24px', borderRadius: '999px', border: 'none', background: showForm ? '#F3F4F6' : '#111827', color: showForm ? '#374151' : 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: showForm ? 'none' : '0 8px 20px rgba(0,0,0,0.15)' }}>
                                {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Faculty</>}
                            </button>
                        )}
                    </div>

                    {/* ── Search & Filter Pill ── */}
                    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '16px 20px', marginBottom: '2.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input type="text" placeholder="Search by professor name, department, or subject..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '48px', background: '#F9FAFB', border: 'none', borderRadius: '16px' }} />
                        </div>
                        <div className="fd-scroll-container">
                            <Filter size={18} color="#9CA3AF" style={{ flexShrink: 0, marginRight: '4px' }} />
                            {uniqueCourseCodes.map(code => (
                                <button key={code} className={'fd-chip ' + (courseFilter === code ? 'fd-chip-on' : 'fd-chip-off')} onClick={() => setCourseFilter(code)}>
                                    {code === 'All' ? 'All Departments' : code}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Admin Form ── */}
                    {isAdmin && showForm && (
                        <div style={{ background: '#FFFFFF', borderRadius: '32px', padding: 'clamp(24px, 4vw, 40px)', marginBottom: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 1.5rem', color: '#111827' }}>{isEditing ? 'Edit Faculty Details' : 'Add New Faculty Member'}</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div className="fd-form-grid">
                                    <div><label style={labelStyle}>Full Name</label><input type="text" placeholder="e.g. Dr. John Doe" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{...inputStyle, background: '#F9FAFB'}} /></div>
                                    <div><label style={labelStyle}>Designation</label><input type="text" placeholder="e.g. Associate Professor" required value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} style={{...inputStyle, background: '#F9FAFB'}} /></div>
                                    <div><label style={labelStyle}>Department</label><input type="text" placeholder="e.g. CSE" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} style={{...inputStyle, background: '#F9FAFB'}} /></div>
                                    <div><label style={labelStyle}>Contact Number</label><input type="text" placeholder="Optional phone number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{...inputStyle, background: '#F9FAFB'}} /></div>
                                </div>

                                <div style={{ background: '#F9FAFB', padding: 'clamp(16px, 3vw, 24px)', borderRadius: '24px', border: '1px solid #E5E7EB' }}>
                                    <label style={{ ...labelStyle, marginBottom: '12px' }}>Assigned Courses</label>
                                    <div className="fd-course-inputs">
                                        <input type="text" placeholder="Code (e.g. CS101)" value={tempCourse.code} onChange={e => setTempCourse({ ...tempCourse, code: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: '120px' }} />
                                        <input type="text" placeholder="Course Name (e.g. Data Structures)" value={tempCourse.name} onChange={e => setTempCourse({ ...tempCourse, name: e.target.value })} style={{ ...inputStyle, flex: 2, minWidth: '160px' }} />
                                        <button type="button" onClick={addCourseToForm} style={{ padding: '0 20px', background: '#3B82F6', border: 'none', borderRadius: '16px', cursor: 'pointer', color: 'white', fontWeight: '700', height: '48px', flexShrink: 0 }}>Add</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                                        {formData.courses?.map((c, i) => (
                                            <div key={i} style={{ padding: '8px 16px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '999px', fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                                <b style={{ fontWeight: '800' }}>{c.code}</b> {c.name}
                                                <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeCourseFromForm(i)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#111827', border: 'none', color: 'white', fontSize: '1.05rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Publish Profile')}
                                </button>
                            </form>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem', color: '#6B7280', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '8px' }}>
                        Showing {filtered.length} faculty {filtered.length === 1 ? 'member' : 'members'}
                    </div>

                    {/* ── Faculty Grid ── */}
                    <div className="fd-grid">
                        {filtered.length > 0 ? filtered.map((f, idx) => {
                            const pStyle = getPastel(f.name);
                            const rData = ratingMap[f.name];
                            const avg   = rData ? rData.sum / rData.count : 0;
                            const count = rData ? rData.count : 0;
                            const topCourses = f.courses?.slice(0, 2) || [];

                            return (
                                <div key={f.id} className="fd-card" style={{ animationDelay: (idx * .03) + 's' }} onClick={() => setSelectedFaculty(f)}>
                                    
                                    {/* Top Color Banner (Subtle) */}
                                    <div style={{ height: '40px', background: `linear-gradient(180deg, ${pStyle.bg} 0%, rgba(255,255,255,0) 100%)`, borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }} />

                                    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, marginTop: '-20px' }}>
                                        
                                        {/* Avatar */}
                                        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px', flexShrink: 0 }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: pStyle.bg, border: '4px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: '800', color: pStyle.text, boxShadow: `0 8px 24px ${pStyle.shadow}` }}>
                                                {getInitials(f.name)}
                                            </div>
                                            {count > 0 && (
                                                <div style={{ position: 'absolute', top: '0', right: '-4px', minWidth: '24px', height: '24px', borderRadius: '12px', background: '#EF4444', fontSize: '.75rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #FFFFFF', padding: '0 4px' }}>
                                                    {count}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#111827', margin: '0 0 4px', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {f.name}
                                        </h3>
                                        <p style={{ fontSize: '.85rem', color: '#6B7280', margin: '0 0 12px', fontWeight: '500' }}>{f.designation}</p>
                                        
                                        <span style={{ fontSize: '.75rem', background: '#F3F4F6', color: '#4B5563', padding: '4px 12px', borderRadius: '999px', fontWeight: '700', marginBottom: '16px' }}>
                                            {f.department}
                                        </span>

                                        <div style={{ flexGrow: 1 }} />

                                        {/* Quick Courses Preview */}
                                        {topCourses.length > 0 && (
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
                                                {topCourses.map(c => (
                                                    <span key={c.code} style={{ fontSize: '0.7rem', color: '#6B7280', border: '1px solid #E5E7EB', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>{c.code}</span>
                                                ))}
                                                {f.courses.length > 2 && <span style={{ fontSize: '0.7rem', color: '#9CA3AF', padding: '2px 4px', fontWeight: '600' }}>+{f.courses.length - 2}</span>}
                                            </div>
                                        )}

                                        {/* Bottom Footer Area */}
                                        <div style={{ width: '100%', borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {count > 0 ? <StarRating rating={avg} count={count} /> : <span style={{ fontSize: '.8rem', color: '#9CA3AF', fontWeight: '500' }}>No reviews</span>}
                                            <ChevronRight size={18} color="#D1D5DB" />
                                        </div>

                                        {/* Admin Tools */}
                                        {isAdmin && (
                                            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => handleEdit(f, e)} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '50%', color: '#4B5563', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><Edit2 size={14} /></button>
                                                <button onClick={(e) => handleDelete(f.id, e)} style={{ background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '50%', color: '#EF4444', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', background: '#FFFFFF', borderRadius: '32px', border: '1px dashed #E5E7EB' }}>
                                <Search size={56} color="#D1D5DB" style={{ margin: '0 auto 1.5rem' }} />
                                <h3 style={{ color: '#111827', fontSize: '1.2rem', fontWeight: '800', margin: '0 0 8px' }}>No faculty found</h3>
                                <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>Try adjusting your search or department filter.</p>
                            </div>
                        )}
                    </div>

                    {/* ── Detail Modal ── */}
                    {selectedFaculty && (
                        <div className="fd-overlay" onClick={() => setSelectedFaculty(null)}>
                            <div className="fd-modal" onClick={e => e.stopPropagation()}>
                                
                                {/* Modal Header / Cover Image */}
                                {(() => {
                                    const pStyle = getPastel(selectedFaculty.name);
                                    return (
                                        <>
                                            <div style={{ height: '140px', background: `linear-gradient(135deg, ${pStyle.bg} 0%, #FFFFFF 100%)`, position: 'relative' }}>
                                                <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#FFFFFF', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111827', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            
                                            <div style={{ padding: '0 32px 32px' }}>
                                                {/* Profile Overlapping Banner */}
                                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: pStyle.bg, border: '6px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', color: pStyle.text, marginTop: '-50px', marginBottom: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                                                    {getInitials(selectedFaculty.name)}
                                                </div>

                                                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px', color: '#111827', letterSpacing: '-.5px' }}>{selectedFaculty.name}</h2>
                                                <p style={{ color: '#4B5563', margin: '0 0 16px', fontSize: '1.05rem', fontWeight: '500' }}>{selectedFaculty.designation}</p>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                                    <span style={{ background: '#F3F4F6', color: '#374151', padding: '6px 16px', borderRadius: '999px', fontSize: '.85rem', fontWeight: '700' }}>{selectedFaculty.department} Dept</span>
                                                    {ratingMap[selectedFaculty.name] && (
                                                        <div style={{ background: '#FEF3C7', padding: '6px 16px', borderRadius: '999px' }}>
                                                            <StarRating rating={ratingMap[selectedFaculty.name].sum / ratingMap[selectedFaculty.name].count} count={ratingMap[selectedFaculty.name].count} />
                                                        </div>
                                                    )}
                                                </div>

                                                <hr style={{ border: 'none', height: '1px', background: '#F3F4F6', margin: '0 0 24px' }} />

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    {/* Courses Section */}
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#111827' }}>
                                                            <BookOpen size={20} color="#3B82F6" />
                                                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>Courses Taught</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                            {selectedFaculty.courses?.length > 0
                                                                ? selectedFaculty.courses.map((c, i) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 16px', gap: '12px' }}>
                                                                        <span style={{ fontSize: '.85rem', color: '#1D4ED8', fontWeight: '800', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>{c.code}</span>
                                                                        <span style={{ fontSize: '.9rem', color: '#4B5563', fontWeight: '600' }}>{c.name}</span>
                                                                    </div>
                                                                ))
                                                                : <span style={{ fontSize: '.9rem', color: '#9CA3AF' }}>No courses listed yet.</span>
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Contact Section */}
                                                    {selectedFaculty.phone && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '20px' }}>
                                                                <div style={{ background: '#DCFCE7', padding: '12px', borderRadius: '50%' }}><Phone size={20} color="#15803D" /></div>
                                                                <div style={{ flex: 1 }}>
                                                                    <p style={{ fontSize: '.85rem', color: '#6B7280', margin: '0 0 4px', fontWeight: '600' }}>Contact Number</p>
                                                                    <p style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '1.1rem' }}>{selectedFaculty.phone}</p>
                                                                </div>
                                                                <button onClick={() => window.location.href = `tel:${selectedFaculty.phone}`} style={{ padding: '10px 20px', borderRadius: '999px', background: '#111827', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                                    Call
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
};

export default FacultyDirectory;