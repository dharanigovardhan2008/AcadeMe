import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, BookOpen, Phone, User, X, Plus, Trash2, Edit2,
    Code, Filter, RefreshCcw, Mail, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const POINTS = { CALL_FACULTY: 3 };

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    return isMobile;
};

const DEPT_COLORS = {
    CSE: '#60A5FA', IT: '#34D399', ECE: '#FBBF24', EEE: '#F87171',
    MECH: '#A78BFA', CIVIL: '#FB923C', AIDS: '#38BDF8', AIML: '#4ADE80',
};
const getDC = (d) => DEPT_COLORS[d?.toUpperCase()] || '#94A3B8';

const FieldRow = ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: color || 'white' }}>{value || '—'}</span>
    </div>
);

const FacultyDirectory = () => {
    const { awardPoints } = useData();
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const currentUser = auth.currentUser;
    const isAdmin = currentUser?.email?.toLowerCase() === 'palerugopi2008@gmail.com';

    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('add');
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');

    const blankForm = { name: '', designation: '', department: 'CSE', phone: '', email: '', cabin: '', courses: [] };
    const [formData, setFormData] = useState(blankForm);
    const [tempCourse, setTempCourse] = useState({ code: '', name: '' });

    useEffect(() => {
        const q = query(collection(db, 'faculty'), orderBy('name'));
        return onSnapshot(q, snap => setFacultyList(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const uniqueDepts = useMemo(() => {
        return ['All', ...new Set(facultyList.map(f => f.department).filter(Boolean))].sort();
    }, [facultyList]);

    const filtered = useMemo(() => facultyList.filter(f => {
        const s = search.toLowerCase();
        const ok = !s || f.name?.toLowerCase().includes(s) || f.designation?.toLowerCase().includes(s) || f.courses?.some(c => c.name?.toLowerCase().includes(s) || c.code?.toLowerCase().includes(s));
        return ok && (deptFilter === 'All' || f.department === deptFilter);
    }), [facultyList, search, deptFilter]);

    const openForm = (mode, fac = null) => {
        setFormMode(mode);
        setFormData(fac ? { ...fac } : blankForm);
        setEditId(fac?.id || null);
        setShowForm(true);
        setSelectedFaculty(null);
    };

    const closeForm = () => { setShowForm(false); setFormData(blankForm); setTempCourse({ code: '', name: '' }); };

    const addCourse = () => {
        if (tempCourse.code && tempCourse.name) {
            setFormData(p => ({ ...p, courses: [...(p.courses || []), { ...tempCourse }] }));
            setTempCourse({ code: '', name: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (formMode === 'suggest') {
                await addDoc(collection(db, 'pendingFaculty'), {
                    ...formData,
                    suggestedBy: currentUser?.uid || 'anon',
                    suggestedByName: user?.name || currentUser?.displayName || 'Student',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                });
                setToast('Suggestion sent! Admin will review it.');
            } else if (formMode === 'edit' && editId) {
                await updateDoc(doc(db, 'faculty', editId), formData);
                setToast('Faculty updated.');
            } else {
                await addDoc(collection(db, 'faculty'), formData);
                setToast('Faculty added.');
            }
            closeForm();
            setTimeout(() => setToast(''), 3000);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this faculty?')) return;
        await deleteDoc(doc(db, 'faculty', id));
        setSelectedFaculty(null);
    };

    const handleCall = async (phone) => {
        if (!phone) return;
        if (currentUser) await awardPoints(currentUser.uid, user?.name || currentUser.displayName, POINTS.CALL_FACULTY, 'Called faculty');
        window.location.href = `tel:${phone}`;
    };

    const inp = { width: '100%', padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' };
    const lbl = { display: 'block', marginBottom: '4px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' };

    // ─── FORM MODAL ───
    const FormModal = () => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }} onClick={closeForm}>
            <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: isMobile ? '100%' : '560px', padding: isMobile ? '1.2rem' : '2rem', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>
                <button onClick={closeForm} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: '800', marginBottom: '4px' }}>
                    {formMode === 'suggest' ? '📬 Suggest a Faculty' : formMode === 'edit' ? '✏️ Edit Faculty' : '➕ Add Faculty'}
                </h2>
                {formMode === 'suggest' && <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>Fill what you know — admin will verify before publishing.</p>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                        <div><label style={lbl}>Name *</label><input required placeholder="Dr. Firstname Lastname" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inp} /></div>
                        <div><label style={lbl}>Designation</label><input placeholder="e.g. Asst. Professor" value={formData.designation} onChange={e => setFormData(p => ({ ...p, designation: e.target.value }))} style={inp} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={lbl}>Department</label>
                            <select value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                                {['CSE','IT','ECE','EEE','MECH','CIVIL','AIDS','AIML'].map(d => <option key={d} style={{ background: '#1a1a2e', color: 'white' }}>{d}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Phone</label><input type="tel" placeholder="9876543210" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inp} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                        <div><label style={lbl}>Email</label><input type="email" placeholder="faculty@college.edu" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={inp} /></div>
                        <div><label style={lbl}>Cabin / Room No.</label><input placeholder="Block A, Room 204" value={formData.cabin} onChange={e => setFormData(p => ({ ...p, cabin: e.target.value }))} style={inp} /></div>
                    </div>

                    {/* Courses */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <label style={{ ...lbl, marginBottom: '0.65rem' }}>Courses Taught</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: '7px', alignItems: 'end', marginBottom: '8px' }}>
                            <div>
                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginBottom: '3px' }}>Code</div>
                                <input placeholder="CS301" value={tempCourse.code} onChange={e => setTempCourse(p => ({ ...p, code: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCourse())} style={{ ...inp, padding: '8px 10px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginBottom: '3px' }}>Name</div>
                                <input placeholder="Data Structures" value={tempCourse.name} onChange={e => setTempCourse(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCourse())} style={{ ...inp, padding: '8px 10px' }} />
                            </div>
                            <button type="button" onClick={addCourse} style={{ padding: '8px 0', background: '#34D399', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#0f0f1a', fontWeight: '800', fontSize: '1.1rem', height: '38px' }}>+</button>
                        </div>
                        {formData.courses?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {formData.courses.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px 3px 10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', fontSize: '0.78rem' }}>
                                        <span style={{ color: '#60A5FA', fontWeight: '700' }}>{c.code}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{c.name}</span>
                                        <X size={11} style={{ cursor: 'pointer', color: '#F87171', marginLeft: '2px' }} onClick={() => setFormData(p => ({ ...p, courses: p.courses.filter((_, j) => j !== i) }))} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading} style={{ padding: '13px', borderRadius: '12px', background: formMode === 'suggest' ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'linear-gradient(135deg,#3B82F6,#6366F1)', border: 'none', color: 'white', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.95rem' }}>
                        {loading ? 'Submitting...' : formMode === 'suggest' ? '📬 Send Suggestion' : formMode === 'edit' ? '✅ Update' : '✅ Add Faculty'}
                    </button>
                </form>
            </GlassCard>
        </div>
    );

    // ─── DETAIL MODAL (desktop only) ───
    const DetailModal = () => {
        if (!selectedFaculty || isMobile) return null;
        const f = selectedFaculty;
        const dc = getDC(f.department);
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedFaculty(null)}>
                <GlassCard onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <button onClick={() => setSelectedFaculty(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={22} /></button>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '50%', margin: '0 auto 1rem', background: `${dc}22`, border: `3px solid ${dc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', fontWeight: '800', color: dc }}>
                            {f.name?.split(' ')[1]?.[0] || f.name?.[0] || '?'}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px' }}>{f.name}</h2>
                        <p style={{ color: dc, fontWeight: '600', margin: '0 0 8px', fontSize: '0.9rem' }}>{f.designation}</p>
                        <span style={{ background: `${dc}22`, color: dc, padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>{f.department}</span>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <FieldRow label="📞 Phone" value={f.phone} color="#34D399" />
                        <FieldRow label="✉️ Email" value={f.email} color="#60A5FA" />
                        <FieldRow label="🏠 Cabin" value={f.cabin} />
                    </div>
                    {f.courses?.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Courses Taught</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {f.courses.map((c, i) => (
                                    <span key={i} style={{ padding: '4px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '20px', fontSize: '0.78rem' }}>
                                        <span style={{ color: '#FBBF24', fontWeight: '700' }}>{c.code}</span>
                                        {c.name && <span style={{ color: 'rgba(255,255,255,0.55)', marginLeft: '5px' }}>{c.name}</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: f.phone && f.email ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                        {f.phone && (
                            <GlassButton variant="gradient" style={{ justifyContent: 'center' }} onClick={() => handleCall(f.phone)}>
                                <Phone size={14} style={{ marginRight: '5px' }} /> Call
                                {currentUser && <span style={{ marginLeft: '5px', fontSize: '0.68rem', color: '#34D399' }}>+{POINTS.CALL_FACULTY}pts</span>}
                            </GlassButton>
                        )}
                        {f.email && (
                            <button onClick={() => window.location.href = `mailto:${f.email}`} style={{ padding: '11px', borderRadius: '10px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.88rem' }}>
                                <Mail size={14} /> Email
                            </button>
                        )}
                    </div>
                    {isAdmin && (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <button onClick={() => openForm('edit', f)} style={{ flex: 1, padding: '9px', borderRadius: '10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA', cursor: 'pointer', fontWeight: '600', fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Edit2 size={13} /> Edit</button>
                            <button onClick={() => handleDelete(f.id)} style={{ flex: 1, padding: '9px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', cursor: 'pointer', fontWeight: '600', fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Trash2 size={13} /> Delete</button>
                        </div>
                    )}
                </GlassCard>
            </div>
        );
    };

    return (
        <DashboardLayout>
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: '#065f46', border: '1px solid #34D399', borderRadius: '12px', padding: '10px 20px', zIndex: 9999, color: '#34D399', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    ✅ {toast}
                </div>
            )}

            {/* Header card */}
            <GlassCard style={{ marginBottom: '1.25rem', padding: isMobile ? '1rem' : '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.1rem' }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '800', margin: 0 }}>Faculty Directory</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '3px 0 0' }}>
                            {filtered.length} faculty • {filtered.reduce((a, f) => a + (f.courses?.length || 0), 0)} courses
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => openForm('suggest')} style={{ padding: isMobile ? '8px 12px' : '9px 16px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#818CF8', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: isMobile ? '0.78rem' : '0.85rem' }}>
                            <Send size={13} /> Suggest
                        </button>
                        {isAdmin && (
                            <button onClick={() => openForm('add')} style={{ padding: isMobile ? '8px 12px' : '9px 16px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: isMobile ? '0.78rem' : '0.85rem' }}>
                                <Plus size={14} /> Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input type="text" placeholder="Search name, subject or course code..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 35px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '0.88rem' }} />
                </div>

                {/* Dept filter chips */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {uniqueDepts.map(d => {
                        const dc = getDC(d);
                        const active = deptFilter === d;
                        return (
                            <button key={d} onClick={() => setDeptFilter(d)} style={{ padding: '6px 13px', borderRadius: '20px', border: `1px solid ${active ? dc : 'rgba(255,255,255,0.1)'}`, background: active ? `${dc}22` : 'transparent', color: active ? dc : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: active ? '700' : '400', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>
                                {d}
                            </button>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Faculty grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : window.innerWidth < 1100 ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? '0.7rem' : '1.1rem' }}>
                {filtered.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <RefreshCcw size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                        <p style={{ fontWeight: '600' }}>No faculty found</p>
                    </div>
                ) : filtered.map(f => {
                    const dc = getDC(f.department);
                    const expanded = expandedCard === f.id;
                    return (
                        <GlassCard
                            key={f.id}
                            onClick={() => isMobile ? setExpandedCard(expanded ? null : f.id) : setSelectedFaculty(f)}
                            style={{ padding: isMobile ? '0.9rem' : '1.15rem', cursor: 'pointer', borderTop: `3px solid ${dc}`, transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }}
                            onMouseEnter={e => { if (!isMobile) e.currentTarget.style.transform = 'translateY(-3px)'; }}
                            onMouseLeave={e => { if (!isMobile) e.currentTarget.style.transform = ''; }}
                        >
                            {/* Card top row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                <div style={{ width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px', borderRadius: '10px', background: `${dc}18`, border: `1.5px solid ${dc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '800', color: dc, flexShrink: 0 }}>
                                    {f.name?.split(' ')[1]?.[0] || f.name?.[0] || '?'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: '700', fontSize: isMobile ? '0.88rem' : '0.93rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.designation || 'Faculty'}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: dc, background: `${dc}18`, padding: '2px 7px', borderRadius: '8px' }}>{f.department}</span>
                                    {isMobile && <span style={{ color: 'rgba(255,255,255,0.3)' }}>{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>}
                                </div>
                            </div>

                            {/* Course chips */}
                            {f.courses?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                                    {f.courses.slice(0, 3).map((c, i) => (
                                        <span key={i} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(251,191,36,0.1)', color: '#FBBF24', fontWeight: '600' }}>{c.code}</span>
                                    ))}
                                    {f.courses.length > 3 && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>+{f.courses.length - 3}</span>}
                                </div>
                            )}

                            {/* Mobile expand section */}
                            {isMobile && expanded && (
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                    {f.phone && <FieldRow label="Phone" value={f.phone} color="#34D399" />}
                                    {f.email && <FieldRow label="Email" value={f.email} color="#60A5FA" />}
                                    {f.cabin && <FieldRow label="Cabin" value={f.cabin} />}
                                    {f.courses?.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '5px' }}>All Courses</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {f.courses.map((c, i) => (
                                                    <span key={i} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(251,191,36,0.1)', color: '#FBBF24' }}>{c.code} — {c.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: f.phone && f.email ? '1fr 1fr' : '1fr', gap: '7px', marginTop: '10px' }}>
                                        {f.phone && (
                                            <button onClick={e => { e.stopPropagation(); handleCall(f.phone); }} style={{ padding: '9px', borderRadius: '9px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <Phone size={13} /> Call
                                            </button>
                                        )}
                                        {f.email && (
                                            <button onClick={e => { e.stopPropagation(); window.location.href = `mailto:${f.email}`; }} style={{ padding: '9px', borderRadius: '9px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <Mail size={13} /> Email
                                            </button>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                            <button onClick={e => { e.stopPropagation(); openForm('edit', f); }} style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60A5FA', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>Edit</button>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(f.id); }} style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isMobile && <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', margin: '8px 0 0' }}>Tap to view details</p>}
                        </GlassCard>
                    );
                })}
            </div>

            {showForm && <FormModal />}
            <DetailModal />
        </DashboardLayout>
    );
};

export default FacultyDirectory;
