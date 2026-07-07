import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Phone, X, Plus, Trash2, Edit2, Code, Filter, RefreshCcw, Star } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

/* ── inject card styles once ─────────────────────────────── */
(function () {
    if (document.getElementById('fd-card-style')) return;
    const s = document.createElement('style');
    s.id = 'fd-card-style';
    s.textContent = `
@keyframes fdGlow { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes fdUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes fdIn   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

.fd-shell {
    display:flex;
    flex-direction:column;
    gap:1.1rem;
}

.fd-header {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    flex-wrap:wrap;
    gap:1rem;
}

.fd-title-copy {
    flex:1 1 260px;
    min-width:0;
}

.fd-toolbar {
    display:grid;
    grid-template-columns:minmax(0, 1fr);
    gap:.75rem;
}

.fd-filter-row {
    display:flex;
    align-items:flex-start;
    gap:6px;
}

.fd-summary {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:.75rem;
    flex-wrap:wrap;
}

.fd-stat {
    display:flex;
    align-items:center;
    gap:.45rem;
    padding:.55rem .8rem;
    border-radius:14px;
    border:1px solid rgba(96,165,250,.18);
    background:linear-gradient(135deg, rgba(15,23,42,.65), rgba(30,41,59,.4));
    color:#cbd5e1;
    font-size:.78rem;
    font-weight:600;
}

.fd-grid-wrap {
    display:grid;
    gap:1rem;
}

/* neon avatar ring */
.fd-av-ring {
    position:absolute; inset:-3px; border-radius:50%; z-index:0;
    animation:fdGlow 3s ease-in-out infinite;
}
.fd-av-inner {
    position:relative; z-index:1;
    width:64px; height:64px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:1.4rem; font-weight:800; color:#fff;
    border:2px solid rgba(255,255,255,.18);
}

/* card hover */
.fd-card {
    border-radius:16px; cursor:pointer; position:relative;
    transition:transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
    animation:fdUp .4s ease both;
    text-align:center;
    min-width:0;
}
.fd-card:hover { transform:translateY(-5px) scale(1.025); }
.fd-card-panel {
    padding:1rem .9rem;
    text-align:center;
    height:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:.15rem;
}
.fd-card-courses {
    margin-top:.75rem;
    width:100%;
    display:flex;
    flex-wrap:wrap;
    justify-content:center;
    gap:.4rem;
}
.fd-card-course-pill {
    padding:.28rem .55rem;
    border-radius:999px;
    background:rgba(96,165,250,.12);
    border:1px solid rgba(96,165,250,.22);
    color:#bfdbfe;
    font-size:.68rem;
    line-height:1.2;
    max-width:100%;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
}

/* chip filter */
.fd-chips { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding:2px 0; flex-wrap:nowrap; }
.fd-chips::-webkit-scrollbar { display:none; }
.fd-chip { padding:7px 15px; border-radius:20px; border:1px solid; font-size:.75rem; font-weight:600; cursor:pointer; white-space:nowrap; transition:all .14s; background:transparent; font-family:inherit; }
.fd-chip-on  { background:rgba(59,130,246,.2); border-color:rgba(59,130,246,.5); color:#93c5fd; }
.fd-chip-off { border-color:rgba(255,255,255,.1); color:rgba(148,163,184,.5); }
.fd-chip-off:hover { background:rgba(255,255,255,.05); color:rgba(203,213,225,.7); }

/* modal overlay */
.fd-overlay {
    position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.82);
    backdrop-filter:blur(10px); display:flex; align-items:center;
    justify-content:center; padding:1rem; animation:fdIn .18s ease both;
}

/* ghost input */
.fd-inp {
    width:100%; padding:11px 13px; border-radius:12px;
    border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.3);
    color:#e2e8f0; outline:none; font-family:inherit; font-size:.87rem;
    transition:border-color .18s;
}
.fd-inp:focus { border-color:rgba(59,130,246,.5); }
.fd-inp::placeholder { color:rgba(148,163,184,.28); }

/* ═══ RESPONSIVE GRID ═══ */

/* mobile first: 2 columns */
.fd-grid {
    display:grid;
    grid-template-columns:repeat(2, 1fr);
    gap:.85rem;
}
/* 3 cols ≥ 640px */
@media (min-width:640px) {
    .fd-grid { grid-template-columns:repeat(3, 1fr); gap:1rem; }
}
/* 4 cols ≥ 900px */
@media (min-width:900px) {
    .fd-grid { grid-template-columns:repeat(4, 1fr); gap:1.1rem; }
}
/* 5 cols ≥ 1200px */
@media (min-width:1200px) {
    .fd-grid { grid-template-columns:repeat(5, 1fr); }
}

/* card text sizes for tiny screens */
@media (max-width:380px) {
    .fd-shell { gap:.9rem; }
    .fd-grid { grid-template-columns:1fr; }
    .fd-av-inner { width:52px; height:52px; font-size:1.15rem; }
    .fd-card-name { font-size:.82rem !important; }
    .fd-card-sub  { font-size:.68rem !important; }
    .fd-card-course-pill { font-size:.63rem; }
}

/* admin form grid */
.fd-form-2 { display:grid; grid-template-columns:1fr; gap:.75rem; }
@media (min-width:520px) { .fd-form-2 { grid-template-columns:1fr 1fr; } }

/* modal bottom sheet on mobile */
.fd-modal { width:100%; max-width:500px; max-height:90vh; overflow-y:auto; }
@media (max-width:520px) {
    .fd-overlay { align-items:flex-end; padding:0; }
    .fd-modal { max-height:88vh; border-radius:22px 22px 0 0 !important; max-width:100%; }
    .fd-header { align-items:stretch; }
    .fd-header button { width:100%; justify-content:center; }
}

@media (min-width:768px) {
    .fd-toolbar {
        grid-template-columns:minmax(0, 1.4fr) minmax(240px, .9fr);
        align-items:center;
    }
}

@media (max-width:767px) {
    .fd-filter-row {
        flex-direction:column;
        align-items:stretch;
    }
}
`;
    document.head.appendChild(s);
}());

/* ── helpers ─────────────────────────────────────────────── */
const FACULTY_GRADIENT = ['#3b82f6', '#8b5cf6'];
const getGrad = () => FACULTY_GRADIENT;
const getInitials = name => {
    const p = (name || '').trim().split(' ').filter(Boolean);
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

/* filled gold stars exactly like the screenshot */
const StarRating = ({ rating, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '6px' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i} size={14}
                fill={i <= Math.round(rating) ? '#FBBF24' : 'none'}
                color={i <= Math.round(rating) ? '#FBBF24' : 'rgba(148,163,184,.2)'}
                strokeWidth={1.5}
            />
        ))}
        {rating > 0 && (
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#FBBF24', marginLeft: '3px' }}>
                {Number(rating).toFixed(1)}
            </span>
        )}
    </div>
);

/* ── main component ──────────────────────────────────────── */
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
    const [mounted,        setMounted]        = useState(false);

    const currentUser = auth.currentUser;
    const ADMIN_EMAIL = 'palerugopi2008@gmail.com';
    const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const initialFormState = { name: '', designation: '', department: 'CSE', phone: '', courses: [] };
    const [formData,   setFormData]   = useState(initialFormState);
    const [tempCourse, setTempCourse] = useState({ name: '', code: '' });

    useEffect(() => { setMounted(true); }, []);

    /* realtime faculty — original logic unchanged */
    useEffect(() => {
        const q = query(collection(db, 'faculty'), orderBy('name'));
        const unsubscribe = onSnapshot(q, snapshot => {
            setFacultyList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    /* realtime reviews — for real ratings */
    useEffect(() => {
        const q = query(collection(db, 'facultyReviews'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    /* avg rating per faculty from real data */
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

    /* original filter logic unchanged */
    const uniqueCourseCodes = useMemo(() => {
        const codes = facultyList.flatMap(f => f.courses ? f.courses.map(c => c.code) : []);
        return ['All', ...new Set(codes.filter(c => c))].sort();
    }, [facultyList]);

    const facultyWithReviews = useMemo(
        () => Object.values(ratingMap).filter(data => data.count > 0).length,
        [ratingMap]
    );

    const filtered = facultyList.filter(f => {
        const searchLower = search.toLowerCase().trim();
        const matchesSearch =
            (f.name?.toLowerCase() || '').includes(searchLower) ||
            (f.designation?.toLowerCase() || '').includes(searchLower) ||
            (f.courses && f.courses.some(c => (c.name?.toLowerCase() || '').includes(searchLower)));
        const matchesCode = courseFilter === 'All' ||
            (f.courses && f.courses.some(c => c.code === courseFilter));
        return matchesSearch && matchesCode;
    });

    /* original CRUD unchanged */
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
    const handleDelete = async id => {
        if (window.confirm('Delete this faculty member?')) {
            await deleteDoc(doc(db, 'faculty', id));
            setSelectedFaculty(null);
        }
    };
    const handleEdit = faculty => {
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

    const inputStyle = {
        width: '100%', padding: '12px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none',
    };

    return (
        <DashboardLayout>
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity .3s' }}>
                <div className="fd-shell">

                    {/* ── header card ── */}
                    <GlassCard>
                        <div className="fd-header">
                            <div className="fd-title-copy">
                            <h1 style={{ fontSize: 'clamp(1.4rem,5vw,1.9rem)', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.5px' }}>
                                Faculty Directory
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '.85rem' }}>
                                Browse professors, course codes, and ratings with a layout that stays easy to use on smaller screens.
                            </p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData(initialFormState); }}
                                style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.85rem' }}>
                                {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Faculty</>}
                            </button>
                        )}
                        </div>

                        {/* search + filter */}
                        <div className="fd-toolbar" style={{ marginTop: '1.25rem' }}>
                            <GlassInput
                                icon={Search}
                                placeholder="Search name, course…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ margin: 0 }}
                            />
                            <div className="fd-filter-row">
                                <Filter size={15} color="rgba(148,163,184,.4)" style={{ flexShrink: 0, marginTop: '10px' }} />
                                <div className="fd-chips">
                                    {uniqueCourseCodes.map(code => (
                                        <button key={code} className={'fd-chip ' + (courseFilter === code ? 'fd-chip-on' : 'fd-chip-off')}
                                            onClick={() => setCourseFilter(code)}>
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* ── admin add/edit form ── */}
                    {isAdmin && showForm && (
                        <GlassCard style={{ border: '1px solid rgba(59,130,246,.28)' }}>
                        <h3 style={{ margin: '0 0 1.1rem', fontWeight: 700 }}>
                            {isEditing ? 'Edit Faculty' : 'Add New Faculty'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.85rem' }}>
                            <div className="fd-form-2">
                                <input type="text" placeholder="Name (e.g. Dr. Gopi)" required value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                                <input type="text" placeholder="Designation" required value={formData.designation}
                                    onChange={e => setFormData({ ...formData, designation: e.target.value })} style={inputStyle} />
                                <input type="text" placeholder="Department" value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })} style={inputStyle} />
                                <input type="text" placeholder="Phone Number" value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,.05)', padding: '1rem', borderRadius: '12px' }}>
                                <label style={{ fontSize: '.85rem', color: '#aaa', marginBottom: '8px', display: 'block' }}>
                                    Add Courses Taught
                                </label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                    <input type="text" placeholder="Code (e.g. CS101)" value={tempCourse.code}
                                        onChange={e => setTempCourse({ ...tempCourse, code: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, minWidth: '80px' }} />
                                    <input type="text" placeholder="Name (e.g. Java)" value={tempCourse.name}
                                        onChange={e => setTempCourse({ ...tempCourse, name: e.target.value })}
                                        style={{ ...inputStyle, flex: 2, minWidth: '110px' }} />
                                    <button type="button" onClick={addCourseToForm}
                                        style={{ padding: '0 14px', background: '#34D399', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'black', flexShrink: 0 }}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                    {formData.courses?.map((c, i) => (
                                        <div key={i} style={{ padding: '5px 11px', background: 'rgba(59,130,246,.2)', borderRadius: '20px', fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <b>{c.code}</b> — {c.name}
                                            <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeCourseFromForm(i)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '.9rem' }}>
                                {loading ? 'Saving…' : (isEditing ? 'Update Faculty' : 'Save Faculty')}
                            </button>
                        </form>
                    </GlassCard>
                    )}

                    <div className="fd-grid-wrap">
                        {/* ── results count ── */}
                        <div className="fd-summary">
                            <p style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.55)', margin: 0, fontWeight: 500 }}>
                                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                                {(search || courseFilter !== 'All') ? ' · filtered' : ''}
                            </p>
                            <div className="fd-stat">
                                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                                {facultyWithReviews} rated faculty
                            </div>
                        </div>

                        {/* ══ FACULTY GRID ══ */}
                        <div className="fd-grid">
                            {filtered.length > 0 ? filtered.map((f, idx) => {
                        const [gc1, gc2] = getGrad(f.name);
                        const rData = ratingMap[f.name];
                        const avg   = rData ? rData.sum / rData.count : 0;
                        const count = rData ? rData.count : 0;

                        return (
                            /* ── FACULTY CARD — matches screenshot style ── */
                            <div
                                key={f.id}
                                className="fd-card"
                                style={{ animationDelay: (idx * .04) + 's' }}
                                onClick={() => setSelectedFaculty(f)}
                            >
                                <GlassCard style={{ height: '100%' }}>
                                    <div className="fd-card-panel">
                                    {/* circular neon avatar */}
                                    <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto .75rem', flexShrink: 0 }}>
                                        <div className="fd-av-ring" style={{
                                            background: `conic-gradient(${gc1}, ${gc2}, ${gc1})`,
                                            filter: `blur(1px) drop-shadow(0 0 6px ${gc1}88)`,
                                        }} />
                                        <div className="fd-av-inner" style={{ background: `linear-gradient(135deg,${gc1},${gc2})` }}>
                                            {getInitials(f.name)}
                                        </div>
                                        {/* review count badge — orange dot like screenshot */}
                                        {count > 0 && (
                                            <div style={{
                                                position: 'absolute', top: '-2px', right: '-2px', zIndex: 2,
                                                minWidth: '18px', height: '18px', borderRadius: '9px',
                                                background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                                                fontSize: '.58rem', fontWeight: 800, color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '2px solid #0f172a', padding: '0 3px',
                                            }}>
                                                {count}
                                            </div>
                                        )}
                                    </div>

                                    {/* name */}
                                    <p className="fd-card-name" style={{
                                        fontWeight: 700, fontSize: '.9rem', color: '#f1f5f9',
                                        margin: '0 0 3px', letterSpacing: '-.15px',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        width: '100%',
                                    }}>
                                        {f.name}
                                    </p>

                                    {/* department · review count — exactly like screenshot */}
                                    <p className="fd-card-sub" style={{
                                        fontSize: '.73rem', color: 'rgba(148,163,184,.5)',
                                        margin: '0 0 2px', fontWeight: 500,
                                    }}>
                                        {f.designation || f.department || 'Faculty'}
                                        {count > 0 && ` · ${count} review${count > 1 ? 's' : ''}`}
                                    </p>

                                    {/* stars + rating number — filled gold like screenshot */}
                                    {count > 0 ? (
                                        <StarRating rating={avg} count={count} />
                                    ) : (
                                        <p style={{ fontSize: '.68rem', color: 'rgba(148,163,184,.3)', margin: '5px 0 0', fontStyle: 'italic' }}>
                                            No reviews yet
                                        </p>
                                    )}

                                    {f.courses?.length > 0 && (
                                        <div className="fd-card-courses">
                                            {f.courses.slice(0, 2).map((course, courseIndex) => (
                                                <span key={`${course.code}-${courseIndex}`} className="fd-card-course-pill">
                                                    {course.code || course.name}
                                                </span>
                                            ))}
                                            {f.courses.length > 2 && (
                                                <span className="fd-card-course-pill">+{f.courses.length - 2} more</span>
                                            )}
                                        </div>
                                    )}

                                    {/* admin edit/delete */}
                                    {isAdmin && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}
                                            onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleEdit(f)}
                                                style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: '2px' }}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(f.id)}
                                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    </div>
                                </GlassCard>
                            </div>
                        );
                    }) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                            <RefreshCcw size={38} style={{ marginBottom: '10px', opacity: .4 }} />
                            <p>No faculty members match your search.</p>
                        </div>
                    )}
                        </div>
                    </div>

                    {/* ══ DETAIL MODAL — original logic unchanged ══ */}
                    {selectedFaculty && (
                        <div className="fd-overlay" onClick={() => setSelectedFaculty(null)}>
                            <div className="fd-modal" onClick={e => e.stopPropagation()}>
                                <GlassCard style={{ borderRadius: '20px', position: 'relative' }}>
                                <button onClick={() => setSelectedFaculty(null)}
                                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(148,163,184,.7)' }}>
                                    <X size={15} />
                                </button>

                                {/* modal avatar */}
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    {(() => {
                                        const [gc1, gc2] = getGrad(selectedFaculty.name);
                                        return (
                                            <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 1rem' }}>
                                                <div className="fd-av-ring" style={{ inset: '-4px', background: `conic-gradient(${gc1},${gc2},${gc1})`, filter: `blur(2px) drop-shadow(0 0 8px ${gc1}99)` }} />
                                                <div style={{ position: 'relative', zIndex: 1, width: '90px', height: '90px', borderRadius: '50%', background: `linear-gradient(135deg,${gc1},${gc2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,.2)' }}>
                                                    {getInitials(selectedFaculty.name)}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.4px' }}>
                                        {selectedFaculty.name}
                                    </h2>
                                    <p style={{ color: 'var(--primary)', margin: '0 0 8px', fontSize: '.88rem' }}>
                                        {selectedFaculty.designation}
                                    </p>
                                    <Badge variant="primary">{selectedFaculty.department}</Badge>
                                    {/* rating in modal */}
                                    {ratingMap[selectedFaculty.name] && (
                                        <div style={{ marginTop: '10px' }}>
                                            <StarRating
                                                rating={ratingMap[selectedFaculty.name].sum / ratingMap[selectedFaculty.name].count}
                                                count={ratingMap[selectedFaculty.name].count}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                                    {/* courses */}
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,.03)', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--accent)' }}>
                                            <BookOpen size={18} />
                                            <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Courses Taught</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginLeft: '28px' }}>
                                            {selectedFaculty.courses?.length > 0
                                                ? selectedFaculty.courses.map((c, i) => (
                                                    <span key={i} style={{ fontSize: '.78rem', background: 'rgba(255,255,255,.1)', padding: '4px 10px', borderRadius: '10px' }}>{c.name}</span>
                                                ))
                                                : <span style={{ fontSize: '.78rem', color: '#666' }}>No courses listed.</span>
                                            }
                                        </div>
                                    </div>

                                    {/* phone */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,.03)', borderRadius: '10px' }}>
                                        <Phone size={18} color="var(--success)" />
                                        <div>
                                            <p style={{ fontSize: '.75rem', color: 'var(--text-secondary)', margin: '0 0 2px' }}>Phone</p>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{selectedFaculty.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* codes */}
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,.03)', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--warning)' }}>
                                            <Code size={18} />
                                            <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Course Codes</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginLeft: '28px' }}>
                                            {selectedFaculty.courses?.length > 0
                                                ? selectedFaculty.courses.map((c, i) => (
                                                    <span key={i} style={{ fontSize: '.75rem', background: 'rgba(251,191,36,.1)', color: '#FBBF24', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(251,191,36,.2)' }}>{c.code}</span>
                                                ))
                                                : <span style={{ fontSize: '.78rem', color: '#666' }}>No codes listed.</span>
                                            }
                                        </div>
                                    </div>
                                </div>

                                {selectedFaculty.phone && (
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <GlassButton variant="gradient" style={{ width: '100%', justifyContent: 'center' }}
                                            onClick={() => window.location.href = `tel:${selectedFaculty.phone}`}>
                                            <Phone size={15} /> Call Now
                                        </GlassButton>
                                    </div>
                                )}
                                </GlassCard>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FacultyDirectory;
