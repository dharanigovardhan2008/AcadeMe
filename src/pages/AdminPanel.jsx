
import React, { useState, useEffect, useMemo } from 'react';
import { Users, BookOpen, Layers, BarChart2, Shield, Plus, Trash2, Ban, CheckCircle, MessageCircle, Send, Bell, Star, Link as LinkIcon, ExternalLink, Edit2, Search, X, ChevronDown, RefreshCw } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { clearCoursesCache } from '../context/DataContext';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageText, setMessageText] = useState('');

    const fetchUsers = async () => {
        try {
            const snap = await getDocs(collection(db, "users"));
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        } catch (e) { setLoading(false); }
    };
    useEffect(() => { fetchUsers(); }, []);

    const toggleBlock = async (id, isBlocked) => {
        await updateDoc(doc(db, "users", id), { isBlocked: !isBlocked });
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: !isBlocked } : u));
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Permanently delete this user?")) return;
        await deleteDoc(doc(db, "users", id));
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!selectedUser || !messageText.trim()) return;
        await addDoc(collection(db, "notifications"), {
            userId: selectedUser.uid, userName: selectedUser.name, adminId: 'admin',
            message: messageText, type: 'admin_message', read: false,
            createdAt: new Date().toISOString(), replies: []
        });
        setShowMessageModal(false); setMessageText(''); alert("Message sent!");
    };

    if (loading) return <div style={{color:'white',textAlign:'center',padding:'2rem'}}>Loading users...</div>;
    return (
        <GlassCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontWeight:'bold',fontSize:'1.5rem'}}>User Management</h3>
                <GlassButton onClick={fetchUsers}><Layers size={16}/> Refresh</GlassButton>
            </div>
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',color:'white'}}>
                    <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                        <th style={{textAlign:'left',padding:'1rem'}}>User</th>
                        <th style={{textAlign:'left',padding:'1rem'}}>Reg No</th>
                        <th style={{textAlign:'left',padding:'1rem'}}>Branch</th>
                        <th style={{textAlign:'left',padding:'1rem'}}>Status</th>
                        <th style={{textAlign:'right',padding:'1rem'}}>Actions</th>
                    </tr></thead>
                    <tbody>{users.map(u => (
                        <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                            <td style={{padding:'1rem'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&size=32`} alt={u.name} style={{borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)'}}/>
                                    <div><div style={{fontWeight:'bold'}}>{u.name}</div><div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{u.email}</div></div>
                                </div>
                            </td>
                            <td style={{padding:'1rem'}}>{u.regNo||<span style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>N/A</span>}</td>
                            <td style={{padding:'1rem'}}>{u.branch}</td>
                            <td style={{padding:'1rem'}}><Badge variant={u.isBlocked?"destructive":"success"}>{u.isBlocked?"Blocked":"Active"}</Badge></td>
                            <td style={{padding:'1rem',textAlign:'right'}}>
                                <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
                                    <GlassButton onClick={()=>{setSelectedUser(u);setShowMessageModal(true);}} style={{background:'rgba(59,130,246,0.2)',color:'#60A5FA',padding:'6px'}}><MessageCircle size={16}/></GlassButton>
                                    <GlassButton onClick={()=>toggleBlock(u.id,u.isBlocked)} style={{padding:'5px 10px',background:u.isBlocked?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}}>{u.isBlocked?<CheckCircle size={16} color="#34D399"/>:<Ban size={16} color="#F87171"/>}</GlassButton>
                                    <GlassButton onClick={()=>deleteUser(u.id)} style={{padding:'5px 10px',background:'rgba(255,255,255,0.1)'}}><Trash2 size={16}/></GlassButton>
                                </div>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {showMessageModal && selectedUser && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
                    <GlassCard style={{width:'400px',padding:'1.5rem'}}>
                        <h3 style={{fontWeight:'bold',marginBottom:'1rem'}}>Message {selectedUser.name}</h3>
                        <form onSubmit={sendMessage}>
                            <textarea value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Type your message..." style={{width:'100%',minHeight:'100px',padding:'10px',background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.1)',color:'white',marginBottom:'1rem',borderRadius:'8px'}} required/>
                            <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem'}}>
                                <GlassButton type="button" onClick={()=>setShowMessageModal(false)}>Cancel</GlassButton>
                                <GlassButton type="submit" variant="gradient">Send</GlassButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
};

// ─── FACULTY MANAGEMENT ──────────────────────────────────────────────────────
const FacultyManagement = () => {
    const { faculty } = useData();
    const [form, setForm] = useState({ name:'', designation:'', mobile:'', branch:'CSE' });
    const [loading, setLoading] = useState(false);
    const iStyle = {width:'100%',padding:'10px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.1)',color:'white'};

    const handleAdd = async (e) => {
        e.preventDefault(); setLoading(true);
        try { await addDoc(collection(db,"faculty"),form); setForm({name:'',designation:'',mobile:'',branch:'CSE'}); alert("Faculty added!"); }
        catch(e){ alert("Error"); } setLoading(false);
    };
    const handleDelete = async (id) => {
        if(!window.confirm("Delete?")) return;
        try { await deleteDoc(doc(db,"faculty",id)); } catch(e){}
    };

    return (
        <GlassCard>
            <h3 style={{fontWeight:'bold',fontSize:'1.5rem',marginBottom:'1.5rem'}}>Faculty Management</h3>
            <div style={{marginBottom:'2rem',padding:'1.5rem',background:'rgba(255,255,255,0.05)',borderRadius:'12px'}}>
                <h4 style={{marginBottom:'1rem',fontWeight:'bold'}}>Add New Faculty</h4>
                <form onSubmit={handleAdd} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'1rem',alignItems:'end'}}>
                    <input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={iStyle}/>
                    <input required placeholder="Designation" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} style={iStyle}/>
                    <input required type="tel" placeholder="Mobile" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} style={iStyle}/>
                    <select value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})} style={{...iStyle,cursor:'pointer'}}>
                        {['CSE','ECE','EEE','MECH','CIVIL','IT','AIML','AIDS'].map(b=><option key={b} value={b} style={{background:'#333'}}>{b}</option>)}
                    </select>
                    <GlassButton type="submit" disabled={loading} variant="gradient" style={{justifyContent:'center',height:'42px'}}>{loading?'Adding...':'Add Faculty'}</GlassButton>
                </form>
            </div>
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',color:'white'}}>
                    <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}><th style={{textAlign:'left',padding:'1rem'}}>Name</th><th style={{textAlign:'left',padding:'1rem'}}>Designation</th><th style={{textAlign:'left',padding:'1rem'}}>Mobile</th><th style={{textAlign:'left',padding:'1rem'}}>Branch</th><th style={{textAlign:'right',padding:'1rem'}}>Actions</th></tr></thead>
                    <tbody>{faculty.map(f=>(<tr key={f.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}><td style={{padding:'1rem'}}>{f.name}</td><td style={{padding:'1rem'}}>{f.designation}</td><td style={{padding:'1rem'}}>{f.mobile}</td><td style={{padding:'1rem'}}><Badge variant="primary">{f.branch}</Badge></td><td style={{padding:'1rem',textAlign:'right'}}><GlassButton onClick={()=>handleDelete(f.id)} style={{padding:'5px 10px',background:'rgba(255,255,255,0.1)'}}><Trash2 size={16}/></GlassButton></td></tr>))}</tbody>
                </table>
            </div>
        </GlassCard>
    );
};

// ─── COURSES MANAGEMENT (with Mandatory Courses per branch) ──────────────────
const CoursesManagement = () => {
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // All-courses filters
    const [filterBranch, setFilterBranch] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Add/edit form
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name:'', code:'', branch:'CSE' });

    // New branch
    const [showNewBranch, setShowNewBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');

    // Mandatory courses view: which branch the admin is editing
    const [mandatoryBranch, setMandatoryBranch] = useState('');
    const [mandatoryView, setMandatoryView] = useState(false);

    // Branches derived dynamically from Firestore
    const branches = useMemo(() => [...new Set(allCourses.map(c => c.branch).filter(Boolean))].sort(), [allCourses]);

    // Mandatory courses for selected branch
    const mandatoryCourses = useMemo(() =>
        allCourses.filter(c => c.branch === mandatoryBranch).sort((a,b) => a.name.localeCompare(b.name))
    , [allCourses, mandatoryBranch]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "courses"));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a,b) => (a.branch + a.name).localeCompare(b.branch + b.name));
            setAllCourses(list);
            // Auto-select first branch for mandatory view
            if (!mandatoryBranch && list.length > 0) {
                const firstBranch = [...new Set(list.map(c => c.branch).filter(Boolean))].sort()[0];
                setMandatoryBranch(firstBranch || '');
            }
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchCourses(); }, []);

    const filtered = useMemo(() => allCourses.filter(c => {
        const matchBranch = filterBranch === 'ALL' || c.branch === filterBranch;
        const t = searchTerm.toLowerCase();
        const matchSearch = !t || c.name?.toLowerCase().includes(t) || c.code?.toLowerCase().includes(t);
        return matchBranch && matchSearch;
    }), [allCourses, filterBranch, searchTerm]);

    const openAdd = (defaultBranch) => {
        setFormData({ name:'', code:'', branch: defaultBranch || branches[0] || 'CSE' });
        setIsEditing(false); setEditId(null); setShowForm(true);
    };
    const openEdit = (c) => {
        setFormData({ name: c.name, code: c.code, branch: c.branch });
        setIsEditing(true); setEditId(c.id); setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.code.trim() || !formData.branch.trim()) { alert("Fill all fields."); return; }
        setSaving(true);
        try {
            const p = { name: formData.name.trim(), code: formData.code.trim().toUpperCase(), branch: formData.branch.trim().toUpperCase() };
            if (isEditing && editId) {
                await updateDoc(doc(db, "courses", editId), p);
                setAllCourses(prev => prev.map(c => c.id === editId ? { ...c, ...p } : c));
            } else {
                const ref = await addDoc(collection(db, "courses"), p);
                setAllCourses(prev => [...prev, { id: ref.id, ...p }]);
            }
            // Bust cache so students see updated data
            clearCoursesCache(formData.branch.toUpperCase());
            setShowForm(false);
        } catch(e) { alert("Save failed."); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, name, branch) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await deleteDoc(doc(db, "courses", id));
            setAllCourses(prev => prev.filter(c => c.id !== id));
            clearCoursesCache(branch); // bust cache for affected branch
        } catch(e) { alert("Delete failed."); }
    };

    const handleAddBranch = async () => {
        const name = newBranchName.trim().toUpperCase();
        if (!name) { alert("Enter branch name."); return; }
        if (branches.includes(name)) { alert(`"${name}" already exists.`); return; }
        setSaving(true);
        try {
            const p = { name: `Introduction to ${name}`, code: `${name}101`, branch: name };
            const ref = await addDoc(collection(db, "courses"), p);
            setAllCourses(prev => [...prev, { id: ref.id, ...p }]);
            setNewBranchName(''); setShowNewBranch(false); setMandatoryBranch(name);
        } catch(e) { alert("Failed."); }
        finally { setSaving(false); }
    };

    const iStyle = { width:'100%', padding:'10px 14px', borderRadius:'10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'white', fontSize:'0.95rem', boxSizing:'border-box' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── MANDATORY COURSES BLOCK ────────────────────────────────── */}
            <GlassCard style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
                    <div>
                        <h3 style={{ margin:0, fontWeight:'bold', fontSize:'1.3rem', display:'flex', alignItems:'center', gap:'10px' }}>
                            <BookOpen size={20} color="#818CF8"/> Mandatory Courses per Branch
                        </h3>
                        <p style={{ margin:'4px 0 0', fontSize:'0.85rem', color:'#aaa' }}>
                            These are the courses students see on their "My Courses" page. Changes apply to all users of that branch.
                        </p>
                    </div>
                    <GlassButton onClick={() => openAdd(mandatoryBranch)} variant="gradient" style={{ fontSize:'0.85rem' }}>
                        + Add Course to {mandatoryBranch || '...'}
                    </GlassButton>
                </div>

                {/* Branch selector tabs */}
                {branches.length > 0 && (
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'1.5rem' }}>
                        {branches.map(b => (
                            <button key={b} onClick={() => setMandatoryBranch(b)} style={{
                                padding:'6px 16px', borderRadius:'20px', border:'1px solid',
                                borderColor: mandatoryBranch === b ? '#818CF8' : 'rgba(255,255,255,0.15)',
                                background: mandatoryBranch === b ? 'rgba(99,102,241,0.3)' : 'transparent',
                                color: mandatoryBranch === b ? '#c7d2fe' : '#aaa',
                                cursor:'pointer', fontSize:'0.85rem', fontWeight: mandatoryBranch === b ? '600' : '400',
                                transition:'all 0.2s',
                            }}>{b} <span style={{ fontSize:'0.75rem', opacity:0.7 }}>({allCourses.filter(c=>c.branch===b).length})</span></button>
                        ))}
                    </div>
                )}

                {/* Mandatory courses list for selected branch */}
                {loading ? (
                    <p style={{ color:'#aaa', textAlign:'center', padding:'1rem' }}>Loading...</p>
                ) : mandatoryBranch ? (
                    mandatoryCourses.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'2rem', color:'#aaa' }}>
                            <BookOpen size={32} style={{ opacity:0.3, marginBottom:'0.5rem' }}/>
                            <p>No courses yet for <strong style={{color:'white'}}>{mandatoryBranch}</strong>.</p>
                            <GlassButton onClick={() => openAdd(mandatoryBranch)} style={{ marginTop:'1rem', background:'rgba(99,102,241,0.2)', color:'#c7d2fe' }}>
                                + Add First Course
                            </GlassButton>
                        </div>
                    ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                            {mandatoryCourses.map((c, idx) => (
                                <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)' }}
                                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                        <span style={{ color:'#555', fontSize:'0.8rem', minWidth:'24px' }}>{idx+1}.</span>
                                        <div>
                                            <p style={{ margin:0, fontWeight:'600', fontSize:'0.95rem' }}>{c.name}</p>
                                            <span style={{ fontSize:'0.78rem', color:'#93C5FD', background:'rgba(59,130,246,0.15)', padding:'2px 8px', borderRadius:'10px' }}>{c.code}</span>
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', gap:'8px' }}>
                                        <button onClick={() => openEdit(c)} style={{ background:'rgba(59,130,246,0.2)', border:'none', color:'#60A5FA', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem' }}><Edit2 size={13}/> Edit</button>
                                        <button onClick={() => handleDelete(c.id, c.name, c.branch)} style={{ background:'rgba(239,68,68,0.15)', border:'none', color:'#F87171', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem' }}><Trash2 size={13}/> Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <p style={{ color:'#aaa', textAlign:'center', padding:'1rem' }}>Select a branch above to manage its mandatory courses.</p>
                )}

                {/* Cache-bust note */}
                <div style={{ marginTop:'1rem', padding:'8px 14px', background:'rgba(52,211,153,0.07)', borderRadius:'8px', border:'1px solid rgba(52,211,153,0.15)', fontSize:'0.8rem', color:'#6ee7b7', display:'flex', alignItems:'center', gap:'8px' }}>
                    <RefreshCw size={13}/> Changes apply immediately to all students in the selected branch on their next page load.
                </div>
            </GlassCard>

            {/* ── ALL COURSES TABLE ──────────────────────────────────────── */}
            <GlassCard>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
                    <h3 style={{ margin:0, fontWeight:'bold', fontSize:'1.3rem', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Layers size={20} color="#60A5FA"/> All Courses
                        <span style={{ fontSize:'0.8rem', color:'#aaa', fontWeight:'normal' }}>({allCourses.length} total)</span>
                    </h3>
                    <div style={{ display:'flex', gap:'10px' }}>
                        <GlassButton onClick={() => setShowNewBranch(v => !v)} style={{ background:'rgba(168,85,247,0.2)', color:'#c084fc' }}>+ New Branch</GlassButton>
                        <GlassButton onClick={() => openAdd()} variant="gradient">+ Add Course</GlassButton>
                    </div>
                </div>

                {/* New Branch */}
                {showNewBranch && (
                    <div style={{ display:'flex', gap:'10px', marginBottom:'1.5rem', padding:'1rem', background:'rgba(168,85,247,0.08)', borderRadius:'12px', border:'1px solid rgba(168,85,247,0.25)' }}>
                        <input value={newBranchName} onChange={e => setNewBranchName(e.target.value.toUpperCase())} placeholder="e.g. CSE-AI" style={{ ...iStyle, flex:1 }} onKeyDown={e => e.key==='Enter' && handleAddBranch()}/>
                        <GlassButton onClick={handleAddBranch} disabled={saving} style={{ background:'rgba(168,85,247,0.3)', color:'white', whiteSpace:'nowrap' }}>{saving?'Adding...':'Add Branch'}</GlassButton>
                        <GlassButton onClick={() => setShowNewBranch(false)} style={{ padding:'8px' }}><X size={16}/></GlassButton>
                    </div>
                )}

                {/* Add / Edit Form */}
                {showForm && (
                    <div style={{ marginBottom:'1.5rem', padding:'1.5rem', background:'rgba(59,130,246,0.08)', borderRadius:'12px', border:'1px solid rgba(59,130,246,0.2)' }}>
                        <h4 style={{ margin:'0 0 1rem', color:'#60A5FA' }}>{isEditing ? '✏️ Edit Course' : '➕ Add Course'}</h4>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1rem' }}>
                            <div>
                                <label style={{ display:'block', marginBottom:'5px', color:'#aaa', fontSize:'0.85rem' }}>Course Name *</label>
                                <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Data Structures" style={iStyle}/>
                            </div>
                            <div>
                                <label style={{ display:'block', marginBottom:'5px', color:'#aaa', fontSize:'0.85rem' }}>Code *</label>
                                <input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS301" style={iStyle}/>
                            </div>
                            <div>
                                <label style={{ display:'block', marginBottom:'5px', color:'#aaa', fontSize:'0.85rem' }}>Branch *</label>
                                <select value={formData.branch} onChange={e => setFormData(p => ({ ...p, branch: e.target.value }))} style={{ ...iStyle, cursor:'pointer' }}>
                                    {branches.map(b => <option key={b} value={b} style={{ color:'black' }}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:'10px' }}>
                            <GlassButton onClick={handleSave} disabled={saving} variant="gradient">{saving ? 'Saving...' : isEditing ? 'Update' : 'Save Course'}</GlassButton>
                            <GlassButton onClick={() => setShowForm(false)}>Cancel</GlassButton>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                    <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
                        <Search size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#aaa' }}/>
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or code..." style={{ ...iStyle, paddingLeft:'36px' }}/>
                    </div>
                    <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ ...iStyle, width:'auto', minWidth:'130px', cursor:'pointer' }}>
                        <option value="ALL" style={{ color:'black' }}>All Branches</option>
                        {branches.map(b => <option key={b} value={b} style={{ color:'black' }}>{b}</option>)}
                    </select>
                    <span style={{ color:'#aaa', fontSize:'0.85rem', whiteSpace:'nowrap' }}>{filtered.length} shown</span>
                </div>

                {loading ? (
                    <p style={{ textAlign:'center', color:'#aaa', padding:'2rem' }}>Loading courses...</p>
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign:'center', color:'#aaa', padding:'2rem' }}>No courses found.</p>
                ) : (
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', color:'white', fontSize:'0.9rem' }}>
                            <thead><tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign:'left', padding:'10px 12px', color:'#aaa' }}>#</th>
                                <th style={{ textAlign:'left', padding:'10px 12px', color:'#aaa' }}>Course Name</th>
                                <th style={{ textAlign:'left', padding:'10px 12px', color:'#aaa' }}>Code</th>
                                <th style={{ textAlign:'left', padding:'10px 12px', color:'#aaa' }}>Branch</th>
                                <th style={{ textAlign:'right', padding:'10px 12px', color:'#aaa' }}>Actions</th>
                            </tr></thead>
                            <tbody>{filtered.map((c, idx) => (
                                <tr key={c.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                    <td style={{ padding:'10px 12px', color:'#555' }}>{idx+1}</td>
                                    <td style={{ padding:'10px 12px', fontWeight:'500' }}>{c.name}</td>
                                    <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(59,130,246,0.2)', color:'#93C5FD', padding:'3px 10px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600' }}>{c.code}</span></td>
                                    <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(52,211,153,0.15)', color:'#34D399', padding:'3px 10px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600' }}>{c.branch}</span></td>
                                    <td style={{ padding:'10px 12px', textAlign:'right' }}>
                                        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
                                            <button onClick={() => openEdit(c)} style={{ background:'rgba(59,130,246,0.2)', border:'none', color:'#60A5FA', padding:'6px 10px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem' }}><Edit2 size={14}/> Edit</button>
                                            <button onClick={() => handleDelete(c.id, c.name, c.branch)} style={{ background:'rgba(239,68,68,0.15)', border:'none', color:'#F87171', padding:'6px 10px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem' }}><Trash2 size={14}/> Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

// ─── RESOURCES MANAGEMENT ────────────────────────────────────────────────────
const ResourcesManagement = () => {
    const [resources, setResources] = useState([]);
    const [newR, setNewR] = useState({ title:'', type:'concept-map', url:'', branches:[] });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const BRANCHES = ['CSE','IT','AIML','AIDS','ECE','EEE','MECH','CIVIL','BT','BME','BI','CSE-Bio','CSE-AI','CSE-DS'];
    const fetchResources = async () => {
        setFetchLoading(true);
        try { const snap = await getDocs(collection(db,"resources")); setResources(snap.docs.map(d=>({id:d.id,...d.data()}))); }
        catch(e){} setFetchLoading(false);
    };
    useEffect(()=>{ fetchResources(); },[]);
    const toggleBranch = (b) => setNewR(p=>({...p,branches:p.branches.includes(b)?p.branches.filter(x=>x!==b):[...p.branches,b]}));
    const handleAdd = async (e) => {
        e.preventDefault();
        if(!newR.branches.length){ alert("Select at least one branch."); return; }
        setLoading(true);
        try { await addDoc(collection(db,"resources"),{...newR,createdAt:new Date().toISOString()}); setNewR({title:'',type:'concept-map',url:'',branches:[]}); alert("Added!"); fetchResources(); }
        catch(e){ alert("Error"); } setLoading(false);
    };
    const handleDelete = async (id) => {
        if(!window.confirm("Delete?")) return;
        try { await deleteDoc(doc(db,"resources",id)); setResources(p=>p.filter(r=>r.id!==id)); } catch(e){}
    };
    const iStyle = {width:'100%',padding:'10px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.1)',color:'white'};
    return (
        <GlassCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontWeight:'bold',fontSize:'1.5rem'}}>Resources Management</h3>
                <GlassButton onClick={fetchResources}><Layers size={16}/> Refresh</GlassButton>
            </div>
            <div style={{marginBottom:'2rem',padding:'1.5rem',background:'rgba(255,255,255,0.05)',borderRadius:'12px'}}>
                <h4 style={{marginBottom:'1rem',fontWeight:'bold'}}>Upload Resource</h4>
                <form onSubmit={handleAdd} style={{display:'grid',gap:'1rem'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                        <div><label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.9rem',color:'var(--text-secondary)'}}>Title</label><input required type="text" placeholder="e.g. Data Structures Concept Map" value={newR.title} onChange={e=>setNewR({...newR,title:e.target.value})} style={iStyle}/></div>
                        <div><label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.9rem',color:'var(--text-secondary)'}}>Type</label><select value={newR.type} onChange={e=>setNewR({...newR,type:e.target.value})} style={{...iStyle,cursor:'pointer'}}><option value="concept-map">Concept Map</option><option value="paper">Question Paper</option><option value="syllabus">Syllabus</option><option value="lab-manual">Lab Manual</option><option value="imp-question">Imp Questions</option><option value="mcq">MCQs</option></select></div>
                    </div>
                    <div><label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.9rem',color:'var(--text-secondary)'}}>Resource URL</label><input required type="url" placeholder="https://drive.google.com/..." value={newR.url} onChange={e=>setNewR({...newR,url:e.target.value})} style={iStyle}/></div>
                    <div><label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.9rem',color:'var(--text-secondary)'}}>Target Branches</label>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
                            {BRANCHES.map(b=><button key={b} type="button" onClick={()=>toggleBranch(b)} style={{padding:'5px 12px',borderRadius:'20px',border:'1px solid',borderColor:newR.branches.includes(b)?'var(--primary)':'rgba(255,255,255,0.2)',background:newR.branches.includes(b)?'rgba(59,130,246,0.3)':'transparent',color:'white',cursor:'pointer'}}>{b}</button>)}
                        </div>
                    </div>
                    <GlassButton type="submit" disabled={loading} variant="gradient" style={{justifyContent:'center'}}>{loading?'Uploading...':'Upload Resource'}</GlassButton>
                </form>
            </div>
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',color:'white'}}>
                    <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}><th style={{textAlign:'left',padding:'1rem'}}>Title</th><th style={{textAlign:'left',padding:'1rem'}}>Type</th><th style={{textAlign:'left',padding:'1rem'}}>Branches</th><th style={{textAlign:'right',padding:'1rem'}}>Actions</th></tr></thead>
                    <tbody>{fetchLoading?<tr><td colSpan="4" style={{textAlign:'center',padding:'1rem'}}>Loading...</td></tr>:resources.map(r=>(<tr key={r.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}><td style={{padding:'1rem'}}><h4 style={{fontWeight:'600'}}>{r.title}</h4><a href={r.url} target="_blank" rel="noreferrer" style={{fontSize:'0.8rem',color:'var(--primary)'}}>View Link</a></td><td style={{padding:'1rem'}}><Badge variant="neutral">{r.type}</Badge></td><td style={{padding:'1rem'}}><div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>{(r.branches||[]).map(b=><span key={b} style={{fontSize:'0.75rem',padding:'2px 6px',background:'rgba(255,255,255,0.1)',borderRadius:'4px'}}>{b}</span>)}</div></td><td style={{padding:'1rem',textAlign:'right'}}><GlassButton onClick={()=>handleDelete(r.id)} style={{padding:'5px 10px',background:'rgba(255,255,255,0.1)'}}><Trash2 size={16}/></GlassButton></td></tr>))}</tbody>
                </table>
            </div>
        </GlassCard>
    );
};

// ─── UPDATES MANAGEMENT ──────────────────────────────────────────────────────
const UpdatesManagement = () => {
    const [updates, setUpdates] = useState([]);
    const [form, setForm] = useState({ title:'', message:'', link:'' });
    const fetchUpdates = async () => {
        try { const snap = await getDocs(collection(db,"updates")); const list = snap.docs.map(d=>({id:d.id,...d.data()})); list.sort((a,b)=>new Date(b.date)-new Date(a.date)); setUpdates(list); } catch(e){}
    };
    useEffect(()=>{ fetchUpdates(); },[]);
    const post = async (e) => {
        e.preventDefault();
        try { await addDoc(collection(db,"updates"),{...form,date:new Date().toISOString()}); setForm({title:'',message:'',link:''}); fetchUpdates(); alert("Posted!"); } catch(e){}
    };
    const del = async (id) => { if(!window.confirm("Delete?")) return; await deleteDoc(doc(db,"updates",id)); fetchUpdates(); };
    const iStyle = {padding:'10px',background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.1)',color:'white',borderRadius:'8px'};
    return (
        <GlassCard>
            <h3 style={{marginBottom:'1rem',fontWeight:'bold',fontSize:'1.5rem'}}>System Updates</h3>
            <form onSubmit={post} style={{display:'grid',gap:'1rem',marginBottom:'2rem'}}>
                <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={iStyle} required/>
                <textarea placeholder="Message" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{...iStyle,minHeight:'80px'}}/>
                <div style={{position:'relative'}}>
                    <LinkIcon size={16} style={{position:'absolute',left:'10px',top:'12px',color:'#aaa'}}/>
                    <input type="url" placeholder="Resource Link (Optional)" value={form.link} onChange={e=>setForm({...form,link:e.target.value})} style={{width:'100%',...iStyle,paddingLeft:'35px',outline:'none'}}/>
                </div>
                <GlassButton type="submit" variant="gradient">Post Update</GlassButton>
            </form>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {updates.map(u=>(
                    <div key={u.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'15px',background:'rgba(255,255,255,0.05)',borderRadius:'8px'}}>
                        <div>
                            <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.5rem'}}>
                                <h4 style={{fontWeight:'bold'}}>{u.title}</h4>
                                <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{new Date(u.date).toLocaleDateString()}</span>
                            </div>
                            <p style={{fontSize:'0.9rem',color:'rgba(255,255,255,0.8)'}}>{u.message}</p>
                            {u.link&&<a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:'0.85rem',color:'var(--primary)',marginTop:'5px',display:'flex',alignItems:'center',gap:'5px'}}><ExternalLink size={14}/> View Resource</a>}
                        </div>
                        <GlassButton onClick={()=>del(u.id)} style={{padding:'8px',background:'rgba(255,255,255,0.1)'}}><Trash2 size={16}/></GlassButton>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

// ─── REVIEWS MANAGEMENT ──────────────────────────────────────────────────────
const ReviewsManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchReviews = async () => {
        setLoading(true);
        try { const q = query(collection(db,"facultyReviews"),orderBy("createdAt","desc")); const snap = await getDocs(q); setReviews(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch(e){} setLoading(false);
    };
    useEffect(()=>{ fetchReviews(); },[]);
    const del = async (id) => {
        if(!window.confirm("Delete?")) return;
        try { await deleteDoc(doc(db,"facultyReviews",id)); setReviews(p=>p.filter(r=>r.id!==id)); } catch(e){}
    };
    return (
        <GlassCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontWeight:'bold',fontSize:'1.5rem'}}>Student Reviews</h3>
                <GlassButton onClick={fetchReviews}><Layers size={16}/> Refresh</GlassButton>
            </div>
            <div style={{display:'grid',gap:'1rem'}}>
                {loading?<p style={{color:'var(--text-secondary)'}}>Loading...</p>:reviews.length===0?<p style={{color:'var(--text-secondary)'}}>No reviews.</p>:reviews.map(r=>(
                    <div key={r.id} style={{background:'rgba(255,255,255,0.05)',padding:'1rem',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.1)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.8rem'}}>
                            <div><h4 style={{fontWeight:'bold'}}>{r.facultyName}</h4><span style={{fontSize:'0.8rem',color:'#60A5FA',background:'rgba(59,130,246,0.1)',padding:'2px 6px',borderRadius:'4px'}}>{r.courseCode}</span></div>
                            <div style={{textAlign:'right'}}><div style={{display:'flex',alignItems:'center',gap:'4px',color:'#FBBF24',fontWeight:'bold'}}><Star size={16} fill="#FBBF24"/> {r.rating}</div><span style={{fontSize:'0.75rem',color:'#aaa'}}>{new Date(r.createdAt).toLocaleDateString()}</span></div>
                        </div>
                        <div style={{background:'rgba(236,72,153,0.1)',padding:'8px',borderRadius:'8px',marginBottom:'10px',borderLeft:'3px solid #EC4899'}}>
                            <p style={{fontSize:'0.8rem',color:'#EC4899',fontWeight:'bold',marginBottom:'2px'}}>Posted By:</p>
                            <span style={{color:'white'}}>{r.reviewerName||"Unknown"}</span>
                            <span style={{color:'#aaa',fontSize:'0.8rem',marginLeft:'10px'}}>({r.reviewerEmail})</span>
                        </div>
                        <p style={{fontSize:'0.9rem',color:'#ddd',fontStyle:'italic',marginBottom:'10px'}}>"{r.feedback}"</p>
                        <div style={{display:'flex',justifyContent:'flex-end'}}><GlassButton onClick={()=>del(r.id)} style={{background:'rgba(239,68,68,0.2)',color:'#EF4444'}}><Trash2 size={16}/> Delete</GlassButton></div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────
const MessagesTab = () => {
    const [msgs, setMsgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchMsgs = async () => {
        setLoading(true);
        try { const q = query(collection(db,"notifications"),orderBy("createdAt","desc")); const snap = await getDocs(q); setMsgs(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch(e){} setLoading(false);
    };
    useEffect(()=>{ fetchMsgs(); },[]);
    return (
        <GlassCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontSize:'1.2rem',fontWeight:'bold'}}>User Conversations</h3>
                <GlassButton onClick={fetchMsgs}>Refresh</GlassButton>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {loading?<p style={{color:'var(--text-secondary)',textAlign:'center'}}>Loading...</p>:msgs.map(m=>(
                    <div key={m.id} style={{padding:'15px',background:'rgba(255,255,255,0.05)',borderRadius:'12px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.userName||'User')}&background=random&color=fff&size=32`} alt="" style={{borderRadius:'50%'}}/>
                                <div><h4 style={{fontWeight:'bold'}}>To: {m.userName||'Unknown'}</h4><span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{new Date(m.createdAt).toLocaleString()}</span></div>
                            </div>
                            <Badge variant="primary">Admin Message</Badge>
                        </div>
                        <p style={{background:'rgba(59,130,246,0.1)',padding:'10px',borderRadius:'8px',borderLeft:'3px solid #3B82F6'}}>{m.message}</p>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
const AdminPanel = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ users:0, faculty:0, reviews:0, resources:0 });
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(()=>{ if(!authLoading&&(!user||user.role!=='admin')) navigate('/dashboard'); },[user,authLoading,navigate]);

    useEffect(()=>{
        const getStats = async () => {
            try {
                const [u,f,r,res] = await Promise.all([
                    getDocs(collection(db,"users")), getDocs(collection(db,"faculty")),
                    getDocs(collection(db,"facultyReviews")), getDocs(collection(db,"resources")),
                ]);
                setStats({users:u.size,faculty:f.size,reviews:r.size,resources:res.size});
                const qU = query(collection(db,"users"),orderBy("createdAt","desc"),limit(5));
                const snap = await getDocs(qU);
                setRecentUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
            } catch(e){ console.error(e); }
        };
        if(user?.role==='admin') getStats();
    },[user]);

    const STATS = [
        {label:'Total Users',value:stats.users,icon:Users,color:'#3B82F6'},
        {label:'Total Faculty',value:stats.faculty,icon:Layers,color:'#F59E0B'},
        {label:'Resources',value:stats.resources,icon:BookOpen,color:'#8B5CF6'},
        {label:'Reviews',value:stats.reviews,icon:MessageCircle,color:'#10B981'},
    ];

    const TABS = [
        {id:'overview',label:'Overview'},{id:'user management',label:'Users'},
        {id:'faculty',label:'Faculty'},{id:'courses',label:'Courses'},
        {id:'resources',label:'Resources'},{id:'reviews',label:'Reviews'},
        {id:'messages',label:'Messages'},{id:'updates',label:'Updates'},
    ];

    if(authLoading) return <div style={{color:'white',textAlign:'center',marginTop:'50px'}}>Checking permissions...</div>;
    if(!user||user.role!=='admin') return null;

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                    <div style={{padding:'10px',borderRadius:'12px',background:'rgba(239,68,68,0.2)',color:'#F87171'}}><Shield size={24}/></div>
                    <div><h1 style={{fontSize:'1.8rem',fontWeight:'bold'}}>Admin Panel</h1><p style={{color:'var(--text-secondary)'}}>System Management Dashboard</p></div>
                </div>
                <div style={{display:'flex',gap:'0.5rem',marginTop:'1.5rem',borderBottom:'1px solid rgba(255,255,255,0.1)',overflowX:'auto',paddingBottom:'1px'}}>
                    {TABS.map(t=>(
                        <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:'10px 15px',background:'none',border:'none',color:activeTab===t.id?'var(--primary)':'var(--text-secondary)',borderBottom:activeTab===t.id?'2px solid var(--primary)':'2px solid transparent',cursor:'pointer',fontWeight:'500',whiteSpace:'nowrap',transition:'color 0.2s'}}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {activeTab==='overview'&&(
                <>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'1.5rem',marginBottom:'2rem'}}>
                        {STATS.map((s,i)=>(
                            <GlassCard key={i}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
                                    <div style={{padding:'10px',borderRadius:'12px',background:`${s.color}33`,color:s.color}}><s.icon size={24}/></div>
                                    <Badge variant="success">Live</Badge>
                                </div>
                                <h2 style={{fontSize:'2.5rem',fontWeight:'bold'}}>{s.value}</h2>
                                <p style={{color:'var(--text-secondary)'}}>{s.label}</p>
                            </GlassCard>
                        ))}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem'}}>
                        <GlassCard>
                            <h3 style={{marginBottom:'1.5rem',fontWeight:'bold'}}>Recent Signups</h3>
                            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                                {recentUsers.map(u=>(
                                    <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px',background:'rgba(255,255,255,0.03)',borderRadius:'8px'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&size=40`} alt={u.name} style={{width:'40px',height:'40px',borderRadius:'50%'}}/>
                                            <div><p style={{fontWeight:'500'}}>{u.name}</p><p style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{u.branch} • {u.year||'Student'}</p></div>
                                        </div>
                                        <Badge variant={u.isBlocked?"destructive":"success"}>{u.isBlocked?"Blocked":"Active"}</Badge>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard>
                            <h3 style={{marginBottom:'1.5rem',fontWeight:'bold'}}>Quick Actions</h3>
                            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                                <GlassButton onClick={()=>setActiveTab('courses')} variant="gradient" style={{justifyContent:'center'}}><BookOpen size={16}/> Manage Courses</GlassButton>
                                <GlassButton onClick={()=>setActiveTab('user management')} style={{justifyContent:'center',background:'rgba(255,255,255,0.1)'}}><Users size={16}/> Manage Users</GlassButton>
                                <GlassButton onClick={()=>setActiveTab('reviews')} style={{justifyContent:'center',background:'rgba(255,255,255,0.1)'}}>Review Reports</GlassButton>
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}

            {activeTab==='user management'&&<UserManagement/>}
            {activeTab==='faculty'&&<FacultyManagement/>}
            {activeTab==='courses'&&<CoursesManagement/>}
            {activeTab==='resources'&&<ResourcesManagement/>}
            {activeTab==='updates'&&<UpdatesManagement/>}
            {activeTab==='reviews'&&<ReviewsManagement/>}
            {activeTab==='messages'&&<MessagesTab/>}
        </DashboardLayout>
    );
};

export default AdminPanel;

