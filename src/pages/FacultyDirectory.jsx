import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, BookOpen, Phone, X, Plus, Trash2, Edit2, Code, Filter, ChevronDown, RefreshCcw, Send, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const POINTS = { CALL_FACULTY: 3, SUGGEST_FACULTY: 15 };

// ── InfoRow ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
        {icon}
        <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{label}</p>
            <p style={{ margin: 0 }}>{value}</p>
        </div>
    </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const FacultyDirectory = () => {
    const { awardPoints } = useData();
    const { user } = useAuth();

    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');

    // Filter state
    const [filterMode, setFilterMode]       = useState('code'); // 'code' | 'name'
    const [filterValue, setFilterValue]     = useState('All');
    const [showFilterDrop, setShowFilterDrop] = useState(false);
    const [dropPos, setDropPos]             = useState({ top: 0, right: 0 });
    const filterBtnRef = useRef(null);

    // Modal / form state
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showAdminForm, setShowAdminForm]     = useState(false);
    const [showSuggestForm, setShowSuggestForm] = useState(false);
    const [suggestDone, setSuggestDone]         = useState(false);
    const [loading, setLoading]                 = useState(false);
    const [isEditing, setIsEditing]             = useState(false);
    const [editId, setEditId]                   = useState(null);

    const currentUser = auth.currentUser;
    const ADMIN_EMAIL = "palerugopi2008@gmail.com";
    const isAdmin = currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Admin form
    const blankForm = { name: '', designation: '', phone: '', courses: [] };
    const [formData, setFormData]   = useState(blankForm);
    const [tempCourse, setTempCourse] = useState({ name: '', code: '' });

    // Suggest form (any logged-in user)
    const blankSuggest = { name: '', designation: '', phone: '', courseCode: '', courseName: '', note: '' };
    const [suggestData, setSuggestData] = useState(blankSuggest);

    // ── Real-time fetch ──────────────────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, "faculty"), orderBy("name"));
        const unsub = onSnapshot(q, snap => {
            setFacultyList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // ── Close filter dropdown on outside click ───────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (filterBtnRef.current && !filterBtnRef.current.contains(e.target)) {
                setShowFilterDrop(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Derived lists ────────────────────────────────────────────────────────
    const uniqueCodes = useMemo(() =>
        ['All', ...new Set(facultyList.flatMap(f => f.courses?.map(c => c.code) || []).filter(Boolean))].sort()
    , [facultyList]);

    const uniqueNames = useMemo(() =>
        ['All', ...new Set(facultyList.flatMap(f => f.courses?.map(c => c.name) || []).filter(Boolean))].sort()
    , [facultyList]);

    const filtered = useMemo(() => facultyList.filter(f => {
        const s = search.toLowerCase().trim();
        const matchSearch = !s ||
            (f.name?.toLowerCase() || '').includes(s) ||
            (f.designation?.toLowerCase() || '').includes(s) ||
            f.courses?.some(c =>
                (c.code?.toLowerCase() || '').includes(s) ||
                (c.name?.toLowerCase() || '').includes(s)
            );
        const matchFilter = filterValue === 'All' ? true :
            filterMode === 'code'
                ? f.courses?.some(c => c.code === filterValue)
                : f.courses?.some(c => c.name === filterValue);
        return matchSearch && matchFilter;
    }), [search, filterMode, filterValue, facultyList]);

    // ── Admin CRUD ───────────────────────────────────────────────────────────
    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
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
            setFormData(blankForm);
            setTempCourse({ name: '', code: '' });
            setShowAdminForm(false); setIsEditing(false); setEditId(null);
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
        setEditId(f.id); setIsEditing(true); setShowAdminForm(true); setSelectedFaculty(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addCourseToForm = () => {
        if (tempCourse.name && tempCourse.code) {
            setFormData(p => ({ ...p, courses: [...(p.courses || []), { ...tempCourse }] }));
            setTempCourse({ name: '', code: '' });
        }
    };

    // ── User suggestion submit ───────────────────────────────────────────────
    const handleSuggestSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "facultySuggestions"), {
                ...suggestData,
                submittedBy: currentUser?.email || 'anonymous',
                submittedAt: serverTimestamp(),
                status: 'pending',
            });
            // Award points for contributing
            if (currentUser) {
                await awardPoints(
                    currentUser.uid,
                    currentUser.displayName || user?.name,
                    POINTS.SUGGEST_FACULTY,
                    'Suggested a faculty member'
                );
            }
            setSuggestDone(true);
            setSuggestData(blankSuggest);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    // ── Call with points ─────────────────────────────────────────────────────
    const handleCall = async (phone) => {
        if (!phone) return;
        if (currentUser) {
            await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.CALL_FACULTY, 'Called a faculty member');
        }
        window.location.href = `tel:${phone}`;
    };

    // ── Filter dropdown position ─────────────────────────────────────────────
    const openFilterDrop = () => {
        if (filterBtnRef.current) {
            const r = filterBtnRef.current.getBoundingClientRect();
            setDropPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
        }
        setShowFilterDrop(p => !p);
    };

    const activeLabel = filterValue !== 'All'
        ? (filterMode === 'code' ? `Code: ${filterValue}` : `Course: ${filterValue}`)
        : null;

    const filterOptions = filterMode === 'code' ? uniqueCodes : uniqueNames;

    // ── Helpers ──────────────────────────────────────────────────────────────
    const initials = (name) =>
        name?.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || '?';

    // fontSize 16px on all inputs — prevents iOS zoom / keyboard dismiss
    const inp = {
        width: '100%', padding: '12px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none',
        fontSize: '16px', boxSizing: 'border-box',
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <style>{`
                .fd-opt {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    color: rgba(255,255,255,0.6);
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    text-align: left;
                    width: 100%;
                    transition: background 0.15s;
                }
                .fd-opt:hover { background: rgba(255,255,255,0.07); color: white; }
                .fd-opt.sel { background: rgba(59,130,246,0.2); border-color: #3B82F6; color: white; font-weight: 600; }
            `}</style>

            {/* ── Header card ── */}
            <GlassCard style={{ marginBottom: '1.25rem', overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Faculty Directory</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.88rem' }}>
                            {filtered.length} faculty found
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Any logged-in user: suggest a faculty */}
                        {currentUser && !isAdmin && (
                            <button
                                onClick={() => { setShowSuggestForm(p => !p); setSuggestDone(false); }}
                                style={{ padding: '10px 18px', borderRadius: '30px', border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.1)', color: '#34D399', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                            >
                                {showSuggestForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Suggest Faculty</>}
                            </button>
                        )}
                        {/* Admin: add/edit */}
                        {isAdmin && (
                            <button
                                onClick={() => { setShowAdminForm(p => !p); setIsEditing(false); setFormData(blankForm); }}
                                style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {showAdminForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Faculty</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Search + Filter */}
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} color="#aaa" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            type="search"
                            placeholder="Search name, course or code..."
                            onChange={e => setSearch(e.target.value)}
                            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                            style={{ ...inp, paddingLeft: '38px' }}
                        />
                    </div>
                    <button
                        ref={filterBtnRef}
                        onClick={openFilterDrop}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '12px 14px', borderRadius: '12px', flexShrink: 0,
                            border: `1px solid ${activeLabel ? '#3B82F6' : 'rgba(255,255,255,0.15)'}`,
                            background: activeLabel ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                            color: activeLabel ? '#60A5FA' : 'white',
                            cursor: 'pointer', fontSize: '0.88rem', fontWeight: activeLabel ? '600' : '400',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Filter size={15} />
                        {activeLabel
                            ? <><span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeLabel}</span><X size={13} onClick={e => { e.stopPropagation(); setFilterValue('All'); }} /></>
                            : <><span>Filter</span><ChevronDown size={13} style={{ opacity: 0.6 }} /></>
                        }
                    </button>
                </div>

                {/* Active filter chip */}
                {activeLabel && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filtered by:</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.3)' }}>{activeLabel}</span>
                        <button onClick={() => setFilterValue('All')} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.75rem' }}>✕ Clear</button>
                    </div>
                )}
            </GlassCard>

            {/* ── Filter dropdown portal ── */}
            {showFilterDrop && createPortal(
                <div style={{
                    position: 'fixed', top: dropPos.top, right: dropPos.right,
                    width: '260px', background: '#16162a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px', padding: '12px',
                    zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        {[['code','By Code'],['name','By Course Name']].map(([m, lbl]) => (
                            <button key={m} onClick={() => { setFilterMode(m); setFilterValue('All'); }} style={{
                                flex: 1, padding: '7px', borderRadius: '8px', cursor: 'pointer',
                                border: `1px solid ${filterMode === m ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                                background: filterMode === m ? 'rgba(59,130,246,0.2)' : 'transparent',
                                color: filterMode === m ? 'white' : 'rgba(255,255,255,0.5)',
                                fontSize: '0.78rem', fontWeight: filterMode === m ? '700' : '400',
                            }}>{lbl}</button>
                        ))}
                    </div>
                    {/* Options */}
                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filterOptions.map(opt => (
                            <button key={opt}
                                className={`fd-opt${filterValue === opt ? ' sel' : ''}`}
                                onClick={() => { setFilterValue(opt); setShowFilterDrop(false); }}
                            >{opt}</button>
                        ))}
                    </div>
                </div>,
                document.body
            )}

            {/* ── User suggest form ── */}
            {currentUser && !isAdmin && showSuggestForm && (
                <GlassCard style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(52,211,153,0.25)' }}>
                    {suggestDone ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            <CheckCircle size={48} color="#34D399" style={{ marginBottom: '12px' }} />
                            <h3 style={{ margin: '0 0 8px', color: '#34D399' }}>Suggestion Sent!</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px', fontSize: '0.9rem' }}>
                                Thank you! The admin will review and add the faculty.
                            </p>
                            <span style={{ fontSize: '0.85rem', background: 'rgba(52,211,153,0.15)', color: '#34D399', padding: '4px 14px', borderRadius: '20px', border: '1px solid rgba(52,211,153,0.3)' }}>
                                +{POINTS.SUGGEST_FACULTY} pts earned 🎉
                            </span>
                            <button onClick={() => { setSuggestDone(false); setShowSuggestForm(false); }}
                                style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: '20px', border: 'none', background: 'rgba(52,211,153,0.15)', color: '#34D399', cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <h3 style={{ margin: '0 0 4px' }}>Suggest a Faculty Member</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.2rem' }}>
                                Know a faculty not listed here? Suggest them — the admin will review and add.
                            </p>
                            <form onSubmit={handleSuggestSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.85rem' }}>
                                    <input required type="text" placeholder="Faculty Name *" value={suggestData.name}
                                        onChange={e => setSuggestData(p => ({ ...p, name: e.target.value }))} style={inp} />
                                    <input type="text" placeholder="Designation" value={suggestData.designation}
                                        onChange={e => setSuggestData(p => ({ ...p, designation: e.target.value }))} style={inp} />
                                </div>
                                <input required type="tel" placeholder="Phone Number *" value={suggestData.phone}
                                    onChange={e => setSuggestData(p => ({ ...p, phone: e.target.value }))} style={inp} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.85rem' }}>
                                    <input type="text" placeholder="Course Code (e.g. CS101)" value={suggestData.courseCode}
                                        onChange={e => setSuggestData(p => ({ ...p, courseCode: e.target.value }))} style={inp} />
                                    <input type="text" placeholder="Course Name (e.g. Java)" value={suggestData.courseName}
                                        onChange={e => setSuggestData(p => ({ ...p, courseName: e.target.value }))} style={inp} />
                                </div>
                                <textarea placeholder="Any additional notes..." value={suggestData.note}
                                    onChange={e => setSuggestData(p => ({ ...p, note: e.target.value }))}
                                    rows={2}
                                    style={{ ...inp, resize: 'vertical' }} />
                                <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#34D399,#059669)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Send size={16} />
                                    {loading ? 'Sending...' : 'Submit Suggestion'}
                                </button>
                            </form>
                        </>
                    )}
                </GlassCard>
            )}

            {/* ── Admin add/edit form ── */}
            {isAdmin && showAdminForm && (
                <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <h3 style={{ margin: '0 0 1.5rem' }}>{isEditing ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                    <form onSubmit={handleAdminSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
                            <input type="text" placeholder="Name (e.g. Dr. Gopi)" required value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inp} />
                            <input type="text" placeholder="Designation" required value={formData.designation}
                                onChange={e => setFormData(p => ({ ...p, designation: e.target.value }))} style={inp} />
                        </div>
                        <input required type="tel" placeholder="Phone Number *" value={formData.phone}
                            onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inp} />
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '8px', display: 'block' }}>Courses Taught</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input type="text" placeholder="Code (e.g. CS101)" value={tempCourse.code}
                                    onChange={e => setTempCourse(p => ({ ...p, code: e.target.value }))} style={inp} />
                                <input type="text" placeholder="Name (e.g. Java)" value={tempCourse.name}
                                    onChange={e => setTempCourse(p => ({ ...p, name: e.target.value }))} style={inp} />
                                <button type="button" onClick={addCourseToForm}
                                    style={{ padding: '0 15px', background: '#34D399', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'black', flexShrink: 0 }}>
                                    <Plus />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {formData.courses?.map((c, i) => (
                                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.2)', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <b>{c.code}</b> - {c.name}
                                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => setFormData(p => ({ ...p, courses: p.courses.filter((_, idx) => idx !== i) }))} />
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

            {/* ── Faculty grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filtered.length > 0 ? filtered.map(f => (
                    <GlassCard key={f.id} onClick={() => setSelectedFaculty(f)} style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{initials(f.name)}</span>
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

            {/* ── Faculty detail modal ── */}
            {selectedFaculty && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setSelectedFaculty(null)}>
                    <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.2)' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{initials(selectedFaculty.name)}</span>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedFaculty.name}</h2>
                            <p style={{ color: 'var(--primary)' }}>{selectedFaculty.designation}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                        : <span style={{ fontSize: '0.8rem', color: '#666' }}>No courses listed.</span>}
                                </div>
                            </div>
                            <InfoRow icon={<Phone size={20} color="var(--success)" />} label="Phone" value={selectedFaculty.phone || "N/A"} />
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
                                        : <span style={{ fontSize: '0.8rem', color: '#666' }}>No codes listed.</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <GlassButton variant="gradient" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleCall(selectedFaculty.phone)}>
                                Call Now
                            </GlassButton>
                            {currentUser && <span style={{ fontSize: '0.75rem', color: '#34D399', whiteSpace: 'nowrap' }}>+{POINTS.CALL_FACULTY} pts</span>}
                        </div>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDirectory;
