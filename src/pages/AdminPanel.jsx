import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, BookOpen, Layers, BarChart2, Shield, Plus, Trash2, Ban, 
    CheckCircle, MessageCircle, Send, Bell, BellRing, Star, Link as LinkIcon, 
    ExternalLink, Edit2, Search, X, ChevronDown, RefreshCw, Clock, LayoutDashboard 
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { clearCoursesCache } from '../context/DataContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── PREMIUM CSS INJECTION ──────────────────────────────────────────────
const GLOBAL_CSS = `
    .admin-wrap {
        min-height: 100vh;
        background: linear-gradient(135deg, #FFDCE8 0%, #F5E6FF 40%, #E6F0FF 100%);
        font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        color: #111827;
        padding-bottom: 80px;
    }

    /* Glassmorphism Sticky Nav */
    .glass-nav-wrapper {
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 20px;
        display: flex;
        justify-content: center;
        pointer-events: none;
    }
    .glass-nav {
        pointer-events: auto;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 1);
        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
        border-radius: 999px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        width: 100%;
        max-width: 1200px;
        transition: all 0.3s ease;
    }
    
    .nav-tabs-container {
        display: flex;
        gap: 6px;
        background: rgba(249, 250, 251, 0.8);
        padding: 6px;
        border-radius: 999px;
        border: 1px solid rgba(229, 231, 235, 0.5);
        overflow-x: auto;
        scrollbar-width: none;
        flex: 1;
    }
    .nav-tabs-container::-webkit-scrollbar { display: none; }
    
    .nav-tab {
        padding: 8px 18px;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        font-family: inherit;
        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        white-space: nowrap;
    }
    .nav-tab.active {
        background: #FFFFFF;
        color: #111827;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .nav-tab.inactive {
        background: transparent;
        color: #6B7280;
    }
    .nav-tab.inactive:hover {
        background: rgba(255,255,255,0.5);
        color: #374151;
    }

    /* Premium Cards */
    .premium-card {
        background: #FFFFFF;
        border-radius: 32px;
        padding: 32px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
        box-sizing: border-box;
        width: 100%;
        transition: transform 0.2s ease;
        margin-bottom: 1.5rem;
    }
    .premium-card.tinted {
        background: linear-gradient(145deg, #ffffff 0%, #FAFAFA 100%);
        border: 1px solid #F3F4F6;
    }
    
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.4);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }

    /* Inputs & Forms */
    .premium-input {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        padding: 12px 16px;
        width: 100%;
        color: #111827;
        outline: none;
        transition: all 0.2s;
        box-sizing: border-box;
        font-family: inherit;
        font-weight: 500;
    }
    .premium-input:focus {
        border-color: #8B5CF6;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        background: #FFFFFF;
    }
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    /* List Items */
    .list-item-wrapper {
        display: flex;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #F3F4F6;
    }
    .list-item-wrapper:last-child {
        border-bottom: none;
    }

    /* Responsive Design */
    @media (max-width: 900px) {
        .form-grid { grid-template-columns: 1fr; }
    }
    
    @media (max-width: 768px) {
        .glass-nav-wrapper { padding: 10px; }
        .glass-nav { 
            flex-direction: column; 
            border-radius: 24px; 
            padding: 16px; 
            gap: 16px; 
            align-items: flex-start;
        }
        .nav-tabs-container { width: 100%; box-sizing: border-box; }
        .hide-on-mobile { display: none !important; }
        
        .premium-card { padding: 20px; border-radius: 24px; }
        .list-item-wrapper { flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px 0; }
        .list-item-actions { width: 100%; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start; }
        
        .stats-grid { grid-template-columns: 1fr 1fr !important; }
        .main-content { padding: 0 10px !important; }
    }
`;

// ─── DESIGN SYSTEM COMPONENTS ──────────────────────────────────────────

const StyledCard = ({ children, style, className }) => (
    <div className={`premium-card ${className || ''}`} style={style}>{children}</div>
);

const PillButton = ({ children, onClick, variant = 'secondary', style, disabled, type="button", className="" }) => {
    const getVariant = () => {
        if(disabled) return { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' };
        switch(variant) {
            case 'primary': return { background: '#111827', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(17, 24, 39, 0.15)' };
            case 'blue': return { background: '#3B82F6', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' };
            case 'danger': return { background: '#FEE2E2', color: '#EF4444' };
            case 'success': return { background: '#D1FAE5', color: '#10B981' };
            case 'warning': return { background: '#FEF3C7', color: '#D97706' };
            case 'outline': return { background: 'transparent', color: '#374151', border: '1px solid #E5E7EB' };
            case 'purple': return { background: '#EDE9FE', color: '#7C3AED' };
            case 'soft-blue': return { background: '#DBEAFE', color: '#3B82F6' };
            case 'soft-purple': return { background: '#F3E8FF', color: '#9333EA' };
            default: return { background: '#F3F4F6', color: '#374151' };
        }
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className} style={{
            padding: '8px 16px', borderRadius: '999px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', 
            fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', 
            fontSize: '0.85rem', transition: 'all 0.2s', ...getVariant(), ...style
        }}>
            {children}
        </button>
    );
};

const ListItem = ({ index, title, subtitle, actions, icon, sideInfo }) => (
    <div className="list-item-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, width: '100%' }}>
            {index && <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontWeight: '700', fontSize: '0.9rem', marginRight: '16px', flexShrink: 0 }}>
                {index}
            </div>}
            {icon && <div style={{ marginRight: '16px', flexShrink: 0 }}>{icon}</div>}
            <div style={{ minWidth: 0, paddingRight: '16px', flex: 1 }}>
                <h4 style={{ margin: 0, color: '#111827', fontWeight: '700', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
                {subtitle && <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.85rem', fontWeight: '500' }}>{subtitle}</p>}
            </div>
            {sideInfo && <div className="hide-on-mobile" style={{ paddingRight: '16px' }}>{sideInfo}</div>}
        </div>
        <div className="list-item-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {actions}
        </div>
    </div>
);

// ─── OVERVIEW TAB ───────────────────────────────────────────────────────────
const OverviewTab = ({ setActiveTab }) => {
    const [stats, setStats] = useState({ users:0, faculty:0, reviews:0, resources:0 });
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
            } catch(e){} finally { setLoading(false); }
        };
        getStats();
    },[]);

    const STATS = [
        {label:'Total Users',value:stats.users,icon:Users,color:'#3B82F6', bg:'#DBEAFE'},
        {label:'Total Faculty',value:stats.faculty,icon:Layers,color:'#D97706', bg:'#FEF3C7'},
        {label:'Resources',value:stats.resources,icon:BookOpen,color:'#7C3AED', bg:'#EDE9FE'},
        {label:'Reviews',value:stats.reviews,icon:MessageCircle,color:'#10B981', bg:'#D1FAE5'},
    ];

    if (loading) return <div style={{textAlign:'center', padding:'3rem', color:'#6B7280'}}>Loading Insights...</div>;

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'1.5rem'}}>
                {STATS.map((s,i)=>(
                    <StyledCard key={i} style={{padding:'24px', marginBottom: 0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
                            <div style={{padding:'12px',borderRadius:'16px',background:s.bg,color:s.color}}><s.icon size={24}/></div>
                            <span style={{fontSize:'0.75rem', fontWeight:'700', color:'#10B981', background:'#D1FAE5', padding:'4px 10px', borderRadius:'999px'}}>Live</span>
                        </div>
                        <h2 style={{fontSize:'2.5rem',fontWeight:'800', margin:'0 0 4px', color:'#111827', letterSpacing:'-1px'}}>{s.value}</h2>
                        <p style={{margin:0, color:'#6B7280', fontWeight:'600', fontSize:'0.9rem'}}>{s.label}</p>
                    </StyledCard>
                ))}
            </div>
            
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:'1.5rem'}}>
                <StyledCard style={{ marginBottom: 0}}>
                    <h3 style={{fontWeight:'800',fontSize:'1.3rem', color:'#111827', margin:'0 0 1.5rem'}}>Recent Signups</h3>
                    <div style={{display:'flex',flexDirection:'column'}}>
                        {recentUsers.map((u)=>(
                            <ListItem key={u.id}
                                icon={<img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&size=42`} alt="" style={{borderRadius:'50%'}}/>}
                                title={u.name} subtitle={`${u.branch} • ${u.year||'Student'}`}
                                actions={<span style={{fontSize:'0.75rem', fontWeight:'700', padding:'6px 12px', borderRadius:'999px', background: u.isBlocked?'#FEE2E2':'#D1FAE5', color: u.isBlocked?'#EF4444':'#10B981'}}>{u.isBlocked?'Blocked':'Active'}</span>}
                            />
                        ))}
                    </div>
                </StyledCard>
                <StyledCard style={{ marginBottom: 0}}>
                    <h3 style={{fontWeight:'800',fontSize:'1.3rem', color:'#111827', margin:'0 0 1.5rem'}}>Quick Actions</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        <PillButton onClick={()=>setActiveTab('courses')} variant="blue" style={{justifyContent:'center', padding:'14px', fontSize:'0.95rem'}}><BookOpen size={18}/> Manage Courses</PillButton>
                        <PillButton onClick={()=>setActiveTab('user management')} style={{justifyContent:'center', padding:'14px', fontSize:'0.95rem'}}><Users size={18}/> Manage Users</PillButton>
                        <PillButton onClick={()=>setActiveTab('updates')} variant="purple" style={{justifyContent:'center', padding:'14px', fontSize:'0.95rem'}}><Bell size={18}/> Send Notification</PillButton>
                        <PillButton onClick={()=>setActiveTab('reviews')} style={{justifyContent:'center', padding:'14px', fontSize:'0.95rem'}}><Star size={18}/> Review Reports</PillButton>
                    </div>
                </StyledCard>
            </div>
        </div>
    );
};

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageText, setMessageText] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {} finally { setLoading(false); }
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

    return (
        <StyledCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontWeight:'800',fontSize:'1.5rem', color: '#111827', margin:0}}>User Directory</h3>
                <PillButton onClick={fetchUsers}><RefreshCw size={16}/> <span className="hide-on-mobile">Refresh</span></PillButton>
            </div>
            
            <div style={{display:'flex',flexDirection:'column'}}>
                {loading ? <p style={{textAlign:'center', padding:'2rem', color:'#6B7280'}}>Loading...</p> : 
                users.map((u, i) => (
                    <ListItem 
                        key={u.id} index={i+1} title={u.name} 
                        icon={<img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&size=42`} alt="" style={{borderRadius:'50%'}}/>}
                        subtitle={`${u.email} • ${u.branch}`}
                        sideInfo={<span style={{fontSize:'0.85rem', color:'#6B7280', fontWeight:'600'}}>Reg: {u.regNo||'N/A'}</span>}
                        actions={
                            <>
                                <PillButton onClick={()=>{setSelectedUser(u);setShowMessageModal(true);}} variant="soft-blue"><MessageCircle size={14}/> Msg</PillButton>
                                <PillButton onClick={()=>toggleBlock(u.id,u.isBlocked)} variant={u.isBlocked ? 'success' : 'warning'}>
                                    {u.isBlocked ? <CheckCircle size={14}/> : <Ban size={14}/>} {u.isBlocked ? 'Unblock' : 'Block'}
                                </PillButton>
                                <PillButton onClick={()=>deleteUser(u.id)} variant="danger"><Trash2 size={14}/></PillButton>
                            </>
                        }
                    />
                ))}
            </div>

            {showMessageModal && selectedUser && (
                <div className="modal-overlay">
                    <StyledCard style={{maxWidth:'450px', padding:'32px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                            <h3 style={{fontWeight:'800', margin:0, color:'#111827'}}>Message {selectedUser.name}</h3>
                            <button onClick={()=>setShowMessageModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#6B7280'}}><X size={20}/></button>
                        </div>
                        <form onSubmit={sendMessage}>
                            <textarea value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Type your message..." className="premium-input" style={{minHeight:'120px', marginBottom:'1.5rem', resize:'none'}} required/>
                            <div style={{display:'flex',justifyContent:'flex-end',gap:'12px'}}>
                                <PillButton type="button" onClick={()=>setShowMessageModal(false)} variant="outline">Cancel</PillButton>
                                <PillButton type="submit" variant="primary">Send Message</PillButton>
                            </div>
                        </form>
                    </StyledCard>
                </div>
            )}
        </StyledCard>
    );
};

// ─── FACULTY MANAGEMENT ──────────────────────────────────────────────────────
const FacultyManagement = () => {
    const { faculty } = useData();
    const [form, setForm] = useState({ name:'', designation:'', mobile:'', branch:'CSE' });
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault(); setLoading(true);
        try { await addDoc(collection(db,"faculty"),form); setForm({name:'',designation:'',mobile:'',branch:'CSE'}); alert("Faculty added!"); }
        catch(e){} setLoading(false);
    };
    const handleDelete = async (id) => {
        if(!window.confirm("Delete?")) return;
        try { await deleteDoc(doc(db,"faculty",id)); } catch(e){}
    };

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
            <StyledCard className="tinted">
                <h3 style={{fontWeight:'800',fontSize:'1.5rem', color:'#111827', margin: '0 0 1.5rem 0'}}>Add New Faculty</h3>
                <form onSubmit={handleAdd} style={{display:'grid', gap:'16px'}}>
                    <div className="form-grid">
                        <div><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="premium-input" placeholder="Faculty Name"/></div>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Designation</label><input required value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} className="premium-input" placeholder="e.g. Assistant Professor"/></div>
                    </div>
                    <div className="form-grid">
                        <div><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Mobile</label><input required type="tel" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} className="premium-input" placeholder="Contact Number"/></div>
                        <div>
                            <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Branch</label>
                            <select value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})} className="premium-input">
                                {['CSE','ECE','EEE','MECH','CIVIL','IT','AIML','AIDS'].map(b=><option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    <PillButton type="submit" disabled={loading} variant="primary" style={{justifyContent:'center',height:'48px', marginTop:'8px'}}>{loading?'Adding...':'Add Faculty'}</PillButton>
                </form>
            </StyledCard>

            <StyledCard>
                <h3 style={{fontWeight:'800',fontSize:'1.5rem', color:'#111827', margin: '0 0 1.5rem 0'}}>Faculty Roster</h3>
                <div style={{display:'flex',flexDirection:'column'}}>
                    {faculty.map((f, i)=>(
                        <ListItem 
                            key={f.id} index={i+1} title={f.name} 
                            subtitle={`${f.designation} • ${f.mobile}`}
                            sideInfo={<span style={{fontSize:'0.75rem', fontWeight:'700', color:'#3B82F6', background:'#DBEAFE', padding:'4px 10px', borderRadius:'999px'}}>{f.branch}</span>}
                            actions={<PillButton onClick={()=>handleDelete(f.id)} variant="danger"><Trash2 size={14}/> <span className="hide-on-mobile">Remove</span></PillButton>}
                        />
                    ))}
                </div>
            </StyledCard>
        </div>
    );
};

// ─── COURSES MANAGEMENT ──────────────────────────────────────────────────────
const CoursesManagement = () => {
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // All-courses filters
    const [filterBranch, setFilterBranch] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Add/Edit Modals
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name:'', code:'', branch:'CSE' });
    
    // Branch Management
    const [showNewBranch, setShowNewBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [mandatoryBranch, setMandatoryBranch] = useState('');

    const branches = useMemo(() => [...new Set(allCourses.map(c => c.branch).filter(Boolean))].sort(), [allCourses]);
    const mandatoryCourses = useMemo(() => allCourses.filter(c => c.branch === mandatoryBranch).sort((a,b) => a.name.localeCompare(b.name)), [allCourses, mandatoryBranch]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "courses"));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a,b) => (a.branch + a.name).localeCompare(b.branch + b.name));
            setAllCourses(list);
            if (!mandatoryBranch && list.length > 0) {
                const firstBranch = [...new Set(list.map(c => c.branch).filter(Boolean))].sort()[0];
                setMandatoryBranch(firstBranch || '');
            }
        } catch(e) {} finally { setLoading(false); }
    };
    useEffect(() => { fetchCourses(); }, []);

    const filtered = useMemo(() => allCourses.filter(c => {
        const matchBranch = filterBranch === 'ALL' || c.branch === filterBranch;
        const t = searchTerm.toLowerCase();
        const matchSearch = !t || c.name?.toLowerCase().includes(t) || c.code?.toLowerCase().includes(t);
        return matchBranch && matchSearch;
    }), [allCourses, filterBranch, searchTerm]);

    const openAdd = (defaultBranch) => { setFormData({ name:'', code:'', branch: defaultBranch || branches[0] || 'CSE' }); setIsEditing(false); setEditId(null); setShowForm(true); };
    const openEdit = (c) => { setFormData({ name: c.name, code: c.code, branch: c.branch }); setIsEditing(true); setEditId(c.id); setShowForm(true); };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.code.trim() || !formData.branch.trim()) return;
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
            clearCoursesCache(formData.branch.toUpperCase());
            setShowForm(false);
        } catch(e) {} finally { setSaving(false); }
    };

    const handleDelete = async (id, name, branch) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try { await deleteDoc(doc(db, "courses", id)); setAllCourses(prev => prev.filter(c => c.id !== id)); clearCoursesCache(branch); } catch(e) {}
    };

    const handleAddBranch = async () => {
        const name = newBranchName.trim().toUpperCase();
        if (!name || branches.includes(name)) return;
        setSaving(true);
        try {
            const p = { name: `Introduction to ${name}`, code: `${name}101`, branch: name };
            const ref = await addDoc(collection(db, "courses"), p);
            setAllCourses(prev => [...prev, { id: ref.id, ...p }]);
            setNewBranchName(''); setShowNewBranch(false); setMandatoryBranch(name);
        } catch(e) {} finally { setSaving(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Mandatory Courses Block */}
            <StyledCard className="tinted" style={{ border: '1px solid #E0E7FF', background: '#F8FAFC' }}> 
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'12px' }}>
                    <div>
                        <h3 style={{ margin:0, fontWeight:'800', fontSize:'1.4rem', color: '#111827', display:'flex', alignItems:'center', gap:'8px' }}>
                            <BookOpen size={20} color="#6366F1"/> Mandatory Courses per Branch
                        </h3>
                        <p style={{ margin:'4px 0 0', fontSize:'0.85rem', color:'#6B7280', fontWeight:'500' }}>Changes apply to all users of that branch on their "My Courses" page.</p>
                    </div>
                    <PillButton onClick={() => openAdd(mandatoryBranch)} variant="primary">+ Add Course to {mandatoryBranch || '...'}</PillButton>
                </div>

                {/* Branch selector tabs */}
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'2rem' }}>
                    {branches.map(b => (
                        <button key={b} onClick={() => setMandatoryBranch(b)} style={{
                            padding:'8px 16px', borderRadius:'999px', border:'none',
                            background: mandatoryBranch === b ? '#4F46E5' : '#F1F5F9',
                            color: mandatoryBranch === b ? '#FFFFFF' : '#64748B',
                            cursor:'pointer', fontSize:'0.85rem', fontWeight: '600', transition:'all 0.2s',
                        }}>
                            {b} <span style={{ opacity: 0.8, fontSize:'0.75rem' }}>({allCourses.filter(c=>c.branch===b).length})</span>
                        </button>
                    ))}
                </div>

                {/* Mandatory Course List */}
                <div style={{ display:'flex', flexDirection:'column' }}>
                    {loading ? <p style={{ color:'#6B7280', textAlign:'center', padding:'2rem' }}>Loading courses...</p> : 
                     mandatoryCourses.length === 0 ? <p style={{ color:'#6B7280', textAlign:'center', padding:'2rem' }}>No courses found for {mandatoryBranch}.</p> : 
                     mandatoryCourses.map((c, idx) => (
                        <ListItem 
                            key={c.id} index={idx+1} title={c.name} subtitle={c.code}
                            actions={
                                <>
                                    <PillButton onClick={() => openEdit(c)} variant="soft-blue"><Edit2 size={14}/> <span className="hide-on-mobile">Edit</span></PillButton>
                                    <PillButton onClick={() => handleDelete(c.id, c.name, c.branch)} variant="danger"><Trash2 size={14}/> <span className="hide-on-mobile">Remove</span></PillButton>
                                </>
                            }
                        />
                    ))}
                </div>
            </StyledCard>

            {/* All Courses Block */}
            <StyledCard>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'12px' }}>
                    <h3 style={{ margin:0, fontWeight:'800', fontSize:'1.4rem', color: '#111827', display:'flex', alignItems:'center', gap:'8px' }}>
                        <Layers size={20} color="#3B82F6"/> All Courses <span style={{ fontSize:'0.9rem', color:'#6B7280', fontWeight:'500' }}>({allCourses.length})</span>
                    </h3>
                    <div style={{ display:'flex', gap:'8px' }}>
                        <PillButton onClick={() => setShowNewBranch(v => !v)} variant="soft-purple">+ New Branch</PillButton>
                        <PillButton onClick={() => openAdd()} variant="primary">+ Add Course</PillButton>
                    </div>
                </div>

                {showNewBranch && (
                    <div style={{ display:'flex', gap:'10px', marginBottom:'2rem', padding:'16px', background:'#F9FAFB', borderRadius:'16px', border:'1px solid #E5E7EB', flexWrap:'wrap' }}>
                        <input value={newBranchName} onChange={e => setNewBranchName(e.target.value.toUpperCase())} placeholder="New Branch Name (e.g. CSE-AI)" className="premium-input" style={{ flex:1, minWidth:'200px' }} />
                        <div style={{display:'flex', gap:'8px'}}>
                            <PillButton onClick={handleAddBranch} disabled={saving} variant="primary">Add Branch</PillButton>
                            <PillButton onClick={() => setShowNewBranch(false)} variant="outline"><X size={16}/></PillButton>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
                    <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
                        <Search size={18} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or code..." className="premium-input" style={{ paddingLeft:'40px' }}/>
                    </div>
                    <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="premium-input" style={{ width:'auto', minWidth:'140px', cursor:'pointer' }}>
                        <option value="ALL">All Branches</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div style={{ display:'flex', flexDirection:'column' }}>
                    {loading ? <p style={{ color:'#6B7280', textAlign:'center', padding:'2rem' }}>Loading...</p> : 
                     filtered.length === 0 ? <p style={{ color:'#6B7280', textAlign:'center', padding:'2rem' }}>No courses match search.</p> : 
                     filtered.map((c, idx) => (
                        <ListItem 
                            key={c.id} index={idx+1} title={c.name} subtitle={c.code}
                            sideInfo={<span style={{fontSize:'0.75rem', fontWeight:'700', color:'#10B981', background:'#D1FAE5', padding:'4px 10px', borderRadius:'999px'}}>{c.branch}</span>}
                            actions={
                                <>
                                    <PillButton onClick={() => openEdit(c)} variant="outline"><Edit2 size={14}/></PillButton>
                                    <PillButton onClick={() => handleDelete(c.id, c.name, c.branch)} variant="danger"><Trash2 size={14}/></PillButton>
                                </>
                            }
                        />
                    ))}
                </div>
            </StyledCard>

            {/* Add / Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <StyledCard style={{maxWidth:'500px', padding:'32px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
                        <h3 style={{ margin:'0 0 1.5rem', color:'#111827', fontSize:'1.5rem', fontWeight:'800' }}>{isEditing ? 'Edit Course' : 'Add Course'}</h3>
                        <div style={{ display:'grid', gap:'16px', marginBottom:'2rem' }}>
                            <div><label style={{ fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block' }}>Course Name</label><input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="premium-input"/></div>
                            <div className="form-grid">
                                <div><label style={{ fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block' }}>Course Code</label><input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="premium-input"/></div>
                                <div><label style={{ fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block' }}>Branch</label>
                                    <select value={formData.branch} onChange={e => setFormData(p => ({ ...p, branch: e.target.value }))} className="premium-input">
                                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
                            <PillButton onClick={() => setShowForm(false)} variant="outline">Cancel</PillButton>
                            <PillButton onClick={handleSave} disabled={saving} variant="primary">{saving ? 'Saving...' : 'Save Course'}</PillButton>
                        </div>
                    </StyledCard>
                </div>
            )}
        </div>
    );
};

// ─── RESOURCES MANAGEMENT ────────────────────────────────────────────────────
const ResourcesManagement = () => {
    const [resources, setResources] = useState([]);
    const [newR, setNewR] = useState({ title:'', type:'concept-map', url:'', branches:[] });
    const [loading, setLoading] = useState(false);
    const BRANCHES = ['CSE','IT','AIML','AIDS','ECE','EEE','MECH','CIVIL','BT','BME','BI','CSE-Bio','CSE-AI','CSE-DS'];
    
    const fetchResources = async () => {
        try { const snap = await getDocs(collection(db,"resources")); setResources(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch(e){}
    };
    useEffect(()=>{ fetchResources(); },[]);

    const toggleBranch = (b) => setNewR(p=>({...p,branches:p.branches.includes(b)?p.branches.filter(x=>x!==b):[...p.branches,b]}));
    
    const handleAdd = async (e) => {
        e.preventDefault();
        if(!newR.branches.length){ alert("Select at least one branch."); return; }
        setLoading(true);
        try { await addDoc(collection(db,"resources"),{...newR,createdAt:new Date().toISOString()}); setNewR({title:'',type:'concept-map',url:'',branches:[]}); alert("Added!"); fetchResources(); }
        catch(e){} setLoading(false);
    };

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
            <StyledCard className="tinted">
                <h3 style={{fontWeight:'800',fontSize:'1.5rem', color:'#111827', margin: '0 0 1.5rem 0'}}>Upload Resource</h3>
                <form onSubmit={handleAdd} style={{display:'grid',gap:'16px'}}>
                    <div className="form-grid">
                        <div><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Title</label><input required placeholder="e.g. Data Structures Concept Map" value={newR.title} onChange={e=>setNewR({...newR,title:e.target.value})} className="premium-input"/></div>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Type</label>
                            <select value={newR.type} onChange={e=>setNewR({...newR,type:e.target.value})} className="premium-input">
                                <option value="concept-map">Concept Map</option><option value="paper">Question Paper</option><option value="syllabus">Syllabus</option>
                                <option value="lab-manual">Lab Manual</option><option value="imp-question">Imp Questions</option><option value="mcq">MCQs</option>
                            </select>
                        </div>
                    </div>
                    <div><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'6px', display:'block'}}>Resource URL</label><input required type="url" placeholder="https://drive.google.com/..." value={newR.url} onChange={e=>setNewR({...newR,url:e.target.value})} className="premium-input"/></div>
                    <div>
                        <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#6B7280', marginBottom:'10px', display:'block'}}>Target Branches</label>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                            {BRANCHES.map(b=>(
                                <button key={b} type="button" onClick={()=>toggleBranch(b)} style={{
                                    padding:'6px 14px', borderRadius:'999px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600', transition:'all 0.2s',
                                    background: newR.branches.includes(b) ? '#111827' : '#F9FAFB', 
                                    color: newR.branches.includes(b) ? '#FFF' : '#4B5563', 
                                    border: newR.branches.includes(b) ? '1px solid #111827' : '1px solid #E5E7EB'
                                }}>{b}</button>
                            ))}
                        </div>
                    </div>
                    <PillButton type="submit" disabled={loading} variant="primary" style={{justifyContent:'center', marginTop:'1rem', height:'48px'}}>{loading?'Uploading...':'Upload Resource'}</PillButton>
                </form>
            </StyledCard>

            <StyledCard>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                    <h3 style={{fontWeight:'800',fontSize:'1.5rem', color:'#111827', margin:0}}>Available Resources</h3>
                    <PillButton onClick={fetchResources}><RefreshCw size={16}/> <span className="hide-on-mobile">Refresh</span></PillButton>
                </div>
                <div style={{display:'flex',flexDirection:'column'}}>
                    {resources.map((r, i)=>(
                        <ListItem 
                            key={r.id} index={i+1} title={r.title} 
                            subtitle={`${r.type.toUpperCase()} • Branches: ${(r.branches||[]).join(', ')}`}
                            actions={
                                <>
                                    <a href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}><PillButton variant="soft-blue"><ExternalLink size={14}/> <span className="hide-on-mobile">View</span></PillButton></a>
                                    <PillButton onClick={async ()=>{ if(window.confirm("Delete?")){ await deleteDoc(doc(db,"resources",r.id)); fetchResources(); } }} variant="danger"><Trash2 size={14}/></PillButton>
                                </>
                            }
                        />
                    ))}
                </div>
            </StyledCard>
        </div>
    );
};

// ─── UPDATES / NOTIFICATIONS MANAGEMENT ──────────────────────────────────────
const DEFAULT_ATTENDANCE_TITLES = ["👀 Did you go to class today?", "🎒 Bunk check-in!", "🚨 Attendance alert (the fun kind)", "📚 Class detective here", "🕵️ Someone's asking about your attendance..."];
const DEFAULT_ATTENDANCE_BODIES = ["No judgment, just curious 👀 Tap to update your attendance in AcadeMe.", "Be honest... did you actually attend or is this a 'mental health day'? Update your attendance either way 😄", "Your attendance % is waiting for the truth. Tap to update it now!", "Professor took attendance. Did YOU take note of it? Update here 📝", "Your attendance tracker is feeling neglected. Give it some love — update now!"];

const AttendanceReminderTest = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [lastSent, setLastSent] = useState(null);

    const [previewTitle] = useState(() => DEFAULT_ATTENDANCE_TITLES[Math.floor(Math.random() * DEFAULT_ATTENDANCE_TITLES.length)]);
    const [previewBody] = useState(() => DEFAULT_ATTENDANCE_BODIES[Math.floor(Math.random() * DEFAULT_ATTENDANCE_BODIES.length)]);

    const useThisDefault = () => {
        setTitle(previewTitle);
        setBody(previewBody);
    };

    const sendReminder = async () => {
        setSending(true);
        try {
            await addDoc(collection(db, 'attendance_reminders'), { triggeredAt: new Date().toISOString(), manual: true, title: title.trim(), body: body.trim() });
            setLastSent(new Date());
            alert("Attendance Reminder triggered!");
        } catch (e) { alert('Failed to send.'); }
        setSending(false);
    };

    return (
        <StyledCard>
            <h3 style={{ marginBottom: '0.5rem', fontWeight: '800', fontSize: '1.4rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellRing size={20} color="#F59E0B" /> Attendance Reminder
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight:'1.5', fontWeight:'500' }}>
                Automatic reminders go out Mon–Sat at 12:00 PM and 4:30 PM IST. Leave fields blank to send a random funny default, or type a custom override.
            </p>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '1.5rem' }}>
                <input placeholder={`Title (optional — random default: "${previewTitle}")`} value={title} onChange={e => setTitle(e.target.value)} className="premium-input" />
                <textarea placeholder={`Message (optional — random default: "${previewBody}")`} value={body} onChange={e => setBody(e.target.value)} className="premium-input" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <PillButton onClick={sendReminder} variant="warning" disabled={sending}><Send size={16} /> {sending ? 'Sending...' : 'Send Attendance Reminder'}</PillButton>
                <PillButton onClick={useThisDefault} variant="outline">Use shown default text</PillButton>
                {lastSent && <span style={{ fontSize: '0.85rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight:'600' }}><CheckCircle size={14} /> Sent at {lastSent.toLocaleTimeString()}</span>}
            </div>
        </StyledCard>
    );
};

const CustomNotificationSender = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [link, setLink] = useState('');
    const [sending, setSending] = useState(false);
    const [lastSent, setLastSent] = useState(null);

    const canSend = title.trim() && body.trim() && !sending;

    const sendCustom = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        setSending(true);
        try {
            await addDoc(collection(db, 'admin_broadcasts'), { title: title.trim(), body: body.trim(), url: link.trim() || 'https://acade-me.vercel.app', sentAt: new Date().toISOString() });
            setLastSent(new Date());
            setTitle(''); setBody(''); setLink('');
            alert("Notification Broadcasted!");
        } catch (err) { alert('Failed to send.'); }
        setSending(false);
    };

    return (
        <StyledCard>
            <h3 style={{ marginBottom: '0.5rem', fontWeight: '800', fontSize: '1.4rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="#3B82F6" /> Custom Notification
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight:'1.5', fontWeight:'500' }}>
                Send a fully free-form push notification right now, to every user with notifications enabled.
            </p>
            <form onSubmit={sendCustom} style={{ display: 'grid', gap: '16px' }}>
                <input placeholder="Title (required)" value={title} onChange={e => setTitle(e.target.value)} className="premium-input" required />
                <textarea placeholder="Message (required)" value={body} onChange={e => setBody(e.target.value)} className="premium-input" style={{ minHeight: '80px', resize: 'vertical' }} required />
                <div style={{ position: 'relative' }}>
                    <LinkIcon size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#9CA3AF' }} />
                    <input type="url" placeholder="Link to open on tap (optional — defaults to the app home)" value={link} onChange={e => setLink(e.target.value)} className="premium-input" style={{ paddingLeft: '40px' }} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                    <PillButton type="submit" variant="blue" disabled={!canSend} style={{ justifySelf: 'start', padding:'10px 20px' }}><Send size={16} /> {sending ? 'Sending...' : 'Send Custom Notification'}</PillButton>
                    {lastSent && <span style={{ fontSize: '0.85rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight:'600' }}><CheckCircle size={14} /> Sent at {lastSent.toLocaleTimeString()}</span>}
                </div>
            </form>
        </StyledCard>
    );
};

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
    
    return (
        <StyledCard>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '800', fontSize: '1.4rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#8B5CF6"/> System Updates Feed
            </h3>
            <form onSubmit={post} style={{ display: 'grid', gap: '16px', marginBottom: '2rem', paddingBottom:'2rem', borderBottom:'1px solid #F3F4F6' }}>
                <input placeholder="Update Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="premium-input" required/>
                <textarea placeholder="Update Message" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="premium-input" style={{minHeight:'100px', resize:'vertical'}}/>
                <div style={{ position: 'relative' }}>
                    <LinkIcon size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#9CA3AF' }} />
                    <input type="url" placeholder="Resource Link (Optional)" value={form.link} onChange={e=>setForm({...form,link:e.target.value})} className="premium-input" style={{ paddingLeft: '40px' }}/>
                </div>
                <PillButton type="submit" variant="primary" style={{ justifySelf: 'start', padding:'10px 20px' }}><Plus size={16} /> Post Update</PillButton>
            </form>

            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {updates.map(u=>(
                    <div key={u.id} style={{padding:'20px', background:'#F9FAFB', borderRadius:'20px', border:'1px solid #E5E7EB'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                            <h4 style={{fontWeight:'700', color:'#111827', margin:0, fontSize:'1.1rem'}}>{u.title}</h4>
                            <PillButton onClick={()=>del(u.id)} variant="outline" style={{padding:'4px 8px', color:'#EF4444', border:'none'}}><Trash2 size={16}/></PillButton>
                        </div>
                        <span style={{fontSize:'0.75rem', color:'#6B7280', display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px', fontWeight:'600'}}><Clock size={12}/> {new Date(u.date).toLocaleDateString()}</span>
                        <p style={{fontSize:'0.95rem', color:'#4B5563', margin:'0 0 12px', lineHeight:'1.5'}}>{u.message}</p>
                        {u.link && <a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:'0.85rem', color:'#3B82F6', display:'inline-flex', alignItems:'center', gap:'6px', textDecoration:'none', fontWeight:'600', background:'#DBEAFE', padding:'6px 12px', borderRadius:'999px'}}><ExternalLink size={14}/> View Resource</a>}
                    </div>
                ))}
            </div>
        </StyledCard>
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
        <StyledCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
                <h3 style={{fontWeight:'800',fontSize:'1.5rem', color:'#111827', margin:0}}>Student Reviews</h3>
                <PillButton onClick={fetchReviews}><RefreshCw size={16}/> <span className="hide-on-mobile">Refresh</span></PillButton>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'1.5rem'}}>
                {loading ? <p style={{color:'#6B7280'}}>Loading...</p> : 
                 reviews.length===0 ? <p style={{color:'#6B7280'}}>No reviews yet.</p> : 
                 reviews.map(r=>(
                    <div key={r.id} style={{background:'#F9FAFB', padding:'24px', borderRadius:'24px', border:'1px solid #E5E7EB', display:'flex', flexDirection:'column'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px'}}>
                            <div>
                                <h4 style={{fontWeight:'800', color:'#111827', margin:'0 0 6px', fontSize:'1.1rem'}}>{r.facultyName}</h4>
                                <span style={{fontSize:'0.75rem', color:'#3B82F6', background:'#DBEAFE', padding:'4px 10px', borderRadius:'999px', fontWeight:'700'}}>{r.courseCode}</span>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:'6px', background:'#FEF3C7', color:'#D97706', padding:'6px 12px', borderRadius:'999px', fontWeight:'800', fontSize:'0.9rem'}}>
                                <Star size={16} fill="#F59E0B" color="#F59E0B"/> {r.rating}
                            </div>
                        </div>
                        
                        <p style={{fontSize:'0.95rem', color:'#374151', fontStyle:'italic', margin:'0 0 20px', flex:1, lineHeight:'1.5'}}>"{r.feedback}"</p>
                        
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'16px', borderTop:'1px solid #E5E7EB'}}>
                            <div style={{display:'flex', flexDirection:'column', minWidth:0, paddingRight:'10px'}}>
                                <span style={{fontSize:'0.85rem', color:'#111827', fontWeight:'700', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{r.reviewerName || "Anonymous"}</span>
                                <span style={{fontSize:'0.75rem', color:'#6B7280', fontWeight:'500', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{r.reviewerEmail}</span>
                            </div>
                            <PillButton onClick={()=>del(r.id)} variant="danger" style={{padding:'8px', flexShrink:0}}><Trash2 size={16}/></PillButton>
                        </div>
                    </div>
                ))}
            </div>
        </StyledCard>
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
        <StyledCard style={{ maxWidth: '850px', margin: '0 auto' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
                <h3 style={{fontWeight:'800',fontSize:'1.5rem', color:'#111827', margin:0}}>User Conversations</h3>
                <PillButton onClick={fetchMsgs}><RefreshCw size={16}/> <span className="hide-on-mobile">Refresh</span></PillButton>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                {loading ? <p style={{color:'#6B7280',textAlign:'center'}}>Loading...</p> : 
                 msgs.map(m=>(
                    <div key={m.id} style={{padding:'24px', background:'#F9FAFB', borderRadius:'24px', border:'1px solid #E5E7EB'}}>
                        <div style={{display:'flex',justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'10px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.userName||'User')}&background=random&color=fff&size=48`} alt="" style={{borderRadius:'50%'}}/>
                                <div>
                                    <h4 style={{fontWeight:'800', color:'#111827', margin:'0 0 4px', fontSize:'1.05rem'}}>To: {m.userName||'Unknown'}</h4>
                                    <span style={{fontSize:'0.8rem', color:'#6B7280', fontWeight:'500'}}>{new Date(m.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <span style={{fontSize:'0.75rem', fontWeight:'700', color:'#3B82F6', background:'#DBEAFE', padding:'6px 12px', borderRadius:'999px'}}>Admin Message</span>
                        </div>
                        <p style={{background:'#FFFFFF', padding:'20px', borderRadius:'16px', border:'1px solid #E5E7EB', margin:0, color:'#374151', fontSize:'1rem', lineHeight:'1.5'}}>{m.message}</p>
                    </div>
                ))}
            </div>
        </StyledCard>
    );
};

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
const AdminPanel = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(()=>{ if(!authLoading&&(!user||user.role!=='admin')) navigate('/dashboard'); },[user,authLoading,navigate]);

    const TABS = [
        {id:'overview',label:'Overview'}, {id:'user management',label:'Users'}, 
        {id:'faculty',label:'Faculty'}, {id:'courses',label:'Courses'}, 
        {id:'resources',label:'Resources'}, {id:'updates',label:'Updates'},
        {id:'reviews',label:'Reviews'}, {id:'messages',label:'Messages'}
    ];

    if(authLoading) return <div style={{textAlign:'center',padding:'50px', color: '#6B7280'}}>Checking permissions...</div>;
    if(!user||user.role!=='admin') return null;

    return (
        <div className="admin-wrap">
            <style>{GLOBAL_CSS}</style>

            {/* ─── FLOATING TOP NAV BAR ─── */}
            <div className="glass-nav-wrapper">
                <div className="glass-nav">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                            <Shield size={22} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>Admin Control</h1>
                            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0, fontWeight: '600' }}>AcadeMe Workspace</p>
                        </div>
                    </div>

                    <div className="nav-tabs-container">
                        {TABS.map(t=>(
                            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`nav-tab ${activeTab === t.id ? 'active' : 'inactive'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <PillButton onClick={() => navigate('/dashboard')} variant="primary" style={{ padding: '10px 20px', flexShrink: 0 }}>
                        <span className="hide-on-mobile">Dashboard</span> <LayoutDashboard size={18} />
                    </PillButton>
                </div>
            </div>

            {/* ─── MAIN CONTENT AREA ─── */}
            <div className="main-content" style={{ padding: '0 20px', maxWidth: '1200px', margin: '20px auto 0' }}>
                {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
                {activeTab === 'user management' && <UserManagement/>}
                {activeTab === 'faculty' && <FacultyManagement/>}
                {activeTab === 'courses' && <CoursesManagement/>}
                {activeTab === 'resources' && <ResourcesManagement/>}
                {activeTab === 'updates' && (
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'1.5rem'}}>
                        <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                            <AttendanceReminderTest/>
                            <CustomNotificationSender/>
                        </div>
                        <UpdatesManagement/>
                    </div>
                )}
                {activeTab === 'reviews' && <ReviewsManagement/>}
                {activeTab === 'messages' && <MessagesTab/>}
            </div>
        </div>
    );
};

export default AdminPanel;