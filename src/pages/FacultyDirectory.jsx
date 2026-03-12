import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, BookOpen, Phone, User, X, Plus, Trash2, Edit2, Code, Filter, ChevronDown, RefreshCcw } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
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
    const currentUser = auth.currentUser;

    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');   // 'all' | 'code' | 'courseName'
    const [filterValue, setFilterValue] = useState('All');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const filterRef = useRef(null);

    const ADMIN_EMAIL = "palerugopi2008@gmail.com";
    const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const initialFormState = { name: '', designation: '', phone: '', courses: [] };
    const [formData, setFormData] = useState(initialFormState);
    const [tempCourse, setTempCourse] = useState({ name: '', code: '' });

    // Real-time Firestore listener
    useEffect(() => {
        const q = query(collection(db, "faculty"), orderBy("name"));
        const unsub = onSnapshot(q, snap => {
            setFacultyList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // Close filter panel on outside click
    useEffect(() => {
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilterPanel(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const uniqueCodes = useMemo(() =>
        ['All', ...new Set(facultyList.flatMap(f => f.courses?.map(c => c.code) || []).filter(Boolean)).values()].sort()
    , [facultyList]);

    const uniqueCourseNames = useMemo(() =>
        ['All', ...new Set(facultyList.flatMap(f => f.courses?.map(c => c.name) || []).filter(Boolean)).values()].sort()
    , [facultyList]);

    // Broad search: name, designation, course code, course name — all matched
    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        return facultyList.filter(f => {
            const matchSearch = !s ||
                (f.name?.toLowerCase() || '').includes(s) ||
                (f.designation?.toLowerCase() || '').includes(s) ||
                f.courses?.some(c =>
                    (c.code?.toLowerCase() || '').includes(s) ||
                    (c.name?.toLowerCase() || '').includes(s)
                );

            const matchFilter =
                filterType === 'all' || filterValue === 'All' ? true :
                filterType === 'code'
                    ? f.courses?.some(c => c.code === filterValue)
                    : f.courses?.some(c => c.name === filterValue);

            return matchSearch && matchFilter;
        });
    }, [search, filterType, filterValue, facultyList]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name: formData.name, designation: formData.designation, phone: formData.phone, courses: formData.courses };
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

    const handleEdit = (f) => {
        setFormData({ name: f.name || '', designation: f.designation || '', phone: f.phone || '', courses: f.courses || [] });
        setEditId(f.id); setIsEditing(true); setShowForm(true); setSelectedFaculty(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addCourseToForm = () => {
        if (tempCourse.name && tempCourse.code) {
            setFormData(p => ({ ...p, courses: [...(p.courses || []), { ...tempCourse }] }));
            setTempCourse({ name: '', code: '' });
        }
    };

    const handleCallFaculty = async (phone) => {
        if (!phone) return;
        if (currentUser) {
            await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.CALL_FACULTY, 'Called a faculty member');
        }
        window.location.href = `tel:${phone}`;
    };

    const clearFilter = () => { setFilterType('all'); setFilterValue('All'); };

    const activeFilterLabel =
        filterType !== 'all' && filterValue !== 'All'
            ? (filterType === 'code' ? `Code: ${filterValue}` : `Course: ${filterValue}`)
            : null;

    // font-size 16px on inputs prevents iOS keyboard zoom / dismiss
    const inp = {
        width: '100%', padding: '12px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none',
        fontSize: '16px', boxSizing: 'border-box',
    };

    return (
        <DashboardLayout>
            <style>{`
                .fd-filter-panel { animation: fdFade 0.15s ease; }
                @keyframes fdFade { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
                .fd-filter-option:hover { background: rgba(255,255,255,0.08) !important; }
                .fd-filter-option.active { background: rgba(59,130,246,0.2) !important; border-color: #3B82F6 !important; color: white !important; }
            `}</style>

            {/* ── Header ── */}
            <GlassCard style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Faculty Directory</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.88rem' }}>
                            {filtered.length} of {facultyList.length} faculty
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData(initialFormState); }}
                            style={{ padding: '10px 18px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                        >
                            {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Faculty</>}
                        </button>
                    )}
                </div>

                {/* Search + Filter row */}
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>

                    {/* Search bar — uncontrolled to prevent keyboard close on mobile */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
                        <input
                            type="search"
                            placeholder="Search by name, course code or subject..."
                            defaultValue={search}
                            onChange={e => setSearch(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            style={{ ...inp, paddingLeft: '38px' }}
                        />
                    </div>

                    {/* Filter button */}
                    <div ref={filterRef} style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                            onClick={() => setShowFilterPanel(p => !p)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '11px 14px', borderRadius: '12px',
                                border: activeFilterLabel ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.15)',
                                background: activeFilterLabel ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                                color: activeFilterLabel ? '#60A5FA' : 'white',
                                cursor: 'pointer', fontSize: '0.88rem', fontWeight: activeFilterLabel ? '600' : '400',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Filter size={15} />
                            {activeFilterLabel || 'Filter'}
                            {activeFilterLabel
                                ? <X size={13} onClick={e => { e.stopPropagation(); clearFilter(); }} style={{ marginLeft: '2px' }} />
                                : <ChevronDown size={13} style={{ opacity: 0.6 }} />
                            }
                        </button>

                        {/* Filter panel dropdown */}
                        {showFilterPanel && (
                            <div className="fd-filter-panel" style={{
                                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                width: '280px', background: '#1a1a2e',
                                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px',
                                padding: '1rem', zIndex: 100,
                                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                            }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by</p>

                                {/* Filter type tabs */}
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '0.9rem' }}>
                                    {[['all', 'All'], ['code', 'Course Code'], ['courseName', 'Course Name']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => { setFilterType(val); setFilterValue('All'); }}
                                            style={{
                                                flex: 1, padding: '7px 6px', borderRadius: '8px', border: '1px solid',
                                                borderColor: filterType === val ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                                                background: filterType === val ? 'rgba(59,130,246,0.2)' : 'transparent',
                                                color: filterType === val ? 'white' : 'var(--text-secondary)',
                                                fontSize: '0.75rem', cursor: 'pointer', fontWeight: filterType === val ? '600' : '400',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Options list */}
                                {filterType !== 'all' && (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {(filterType === 'code' ? uniqueCodes : uniqueCourseNames).map(opt => (
                                            <button
                                                key={opt}
                                                className={`fd-filter-option${filterValue === opt ? ' active' : ''}`}
                                                onClick={() => { setFilterValue(opt); setShowFilterPanel(false); }}
                                                style={{
                                                    width: '100%', textAlign: 'left', padding: '8px 12px',
                                                    borderRadius: '8px', border: '1px solid transparent',
                                                    background: filterValue === opt ? 'rgba(59,130,246,0.2)' : 'transparent',
                                                    color: filterValue === opt ? 'white' : 'var(--text-secondary)',
                                                    cursor: 'pointer', fontSize: '0.85rem',
                                                    borderColor: filterValue === opt ? '#3B82F6' : 'transparent',
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {filterType === 'all' && (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem 0' }}>
                                        Select a filter type above
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Active filter chip */}
                {activeFilterLabel && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Filtering by:</span>
                        <span style={{ fontSize: '0.78rem', background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.3)' }}>
                            {activeFilterLabel}
                        </span>
                        <button onClick={clearFilter} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' }}>✕ Clear</button>
                    </div>
                )}
            </GlassCard>

            {/* ── Admin Add/Edit Form ── */}
            {isAdmin && showForm && (
                <GlassCard style={{ marginBottom: '1.5rem', padding: '1.75rem', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <h3 style={{ marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>{isEditing ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <input type="text" placeholder="Full Name (e.g. Dr. Gopi)" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inp} />
                            <input type="text" placeholder="Designation (e.g. Asst. Professor)" required value={formData.designation} onChange={e => setFormData(p => ({ ...p, designation: e.target.value }))} style={inp} />
                        </div>
                        <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inp} />

                        {/* Courses section */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '10px', margin: '0 0 10px' }}>Courses Taught</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '10px' }}>
                                <input type="text" placeholder="Code (e.g. CS101)" value={tempCourse.code} onChange={e => setTempCourse(p => ({ ...p, code: e.target.value }))} style={inp} />
                                <input type="text" placeholder="Name (e.g. Java)" value={tempCourse.name} onChange={e => setTempCourse(p => ({ ...p, name: e.target.value }))} style={inp} />
                                <button type="button" onClick={addCourseToForm} style={{ padding: '0 16px', background: '#34D399', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#0f0f1a', fontWeight: 'bold' }}>
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {formData.courses?.map((c, i) => (
                                    <div key={i} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.18)', borderRadius: '20px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(59,130,246,0.3)' }}>
                                        <b>{c.code}</b> — {c.name}
                                        <X size={13} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setFormData(p => ({ ...p, courses: p.courses.filter((_, idx) => idx !== i) }))} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{ padding: '13px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                            {loading ? 'Saving...' : (isEditing ? 'Update Faculty' : 'Save Faculty')}
                        </button>
                    </form>
                </GlassCard>
            )}

            {/* ── Faculty Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
                {filtered.length > 0 ? filtered.map(f => (
                    <GlassCard
                        key={f.id}
                        onClick={() => setSelectedFaculty(f)}
                        style={{ cursor: 'pointer', textAlign: 'center', position: 'relative', padding: '1.5rem 1.25rem' }}
                    >
                        {/* Avatar */}
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 0.9rem', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.15)' }}>
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                                {f.name?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?'}
                            </span>
                        </div>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '1rem' }}>{f.name}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>{f.designation}</p>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {f.courses?.slice(0, 3).map((c, idx) => (
                                <Badge key={idx} variant="primary" style={{ fontSize: '0.72rem' }}>{c.code}</Badge>
                            ))}
                            {f.courses?.length > 3 && <span style={{ fontSize: '0.75rem', color: '#aaa', alignSelf: 'center' }}>+{f.courses.length - 3}</span>}
                        </div>

                        {isAdmin && (
                            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                                <button onClick={e => { e.stopPropagation(); handleEdit(f); }} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: '4px' }}><Edit2 size={15} /></button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(f.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={15} /></button>
                            </div>
                        )}
                    </GlassCard>
                )) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <RefreshCcw size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
                        <p style={{ fontWeight: '600' }}>No faculty found</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try a different search or clear the filter</p>
                    </div>
                )}
            </div>

            {/* ── Faculty Detail Modal ── */}
            {selectedFaculty && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setSelectedFaculty(null)}
                >
                    <GlassCard
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: '460px', position: 'relative', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', padding: '6px' }}>
                            <X size={18} />
                        </button>

                        {/* Avatar + name */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.15)' }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>
                                    {selectedFaculty.name?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?'}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px' }}>{selectedFaculty.name}</h2>
                            <p style={{ color: 'var(--primary)', margin: 0, fontSize: '0.9rem' }}>{selectedFaculty.designation}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {/* Phone */}
                            {selectedFaculty.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                                    <Phone size={18} color="#34D399" />
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Phone</p>
                                        <p style={{ margin: 0, fontWeight: '500' }}>{selectedFaculty.phone}</p>
                                    </div>
                                </div>
                            )}

                            {/* Courses taught */}
                            {selectedFaculty.courses?.length > 0 && (
                                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <BookOpen size={17} color="#60A5FA" />
                                        <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>Courses Taught</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                        {selectedFaculty.courses.map((c, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                                                <span style={{ fontSize: '0.88rem' }}>{c.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#FBBF24', background: 'rgba(251,191,36,0.1)', padding: '3px 9px', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)', fontWeight: '600' }}>{c.code}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Call button */}
                        {selectedFaculty.phone && (
                            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <GlassButton variant="gradient" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleCallFaculty(selectedFaculty.phone)}>
                                    <Phone size={15} style={{ marginRight: '7px' }} /> Call Now
                                </GlassButton>
                                {currentUser && (
                                    <span style={{ fontSize: '0.75rem', color: '#34D399', whiteSpace: 'nowrap' }}>+{POINTS.CALL_FACULTY} pts</span>
                                )}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDirectory;
