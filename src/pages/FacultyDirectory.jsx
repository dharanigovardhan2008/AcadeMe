import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Phone, User, X, Plus, Trash2, Edit2, Code, Filter, RefreshCcw, Lightbulb, ChevronRight, Users } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

// ── Inject styles once ────────────────────────────────────────────────────────
const STYLE_ID = 'fd-modern-styles';
function injectFDStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const rules = [
        "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');",
        '@keyframes fd-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}',
        '@keyframes fd-scale-in{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}',
        '@keyframes fd-spin{to{transform:rotate(360deg)}}',
        '@keyframes fd-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}',

        '.fd{font-family:"Outfit",sans-serif;color:#e2eaf5;min-height:100vh}',

        // Hero
        '.fd-hero{position:relative;border-radius:24px;overflow:hidden;padding:2.25rem 2rem 2rem;margin-bottom:1.5rem;background:linear-gradient(135deg,#080f1e 0%,#0c1931 60%,#070d1a 100%);border:1px solid rgba(56,189,248,0.13)}',
        '.fd-hero-glow1{position:absolute;top:-80px;right:-40px;width:300px;height:300px;background:radial-gradient(circle,rgba(56,189,248,0.1) 0%,transparent 65%);pointer-events:none}',
        '.fd-hero-glow2{position:absolute;bottom:-60px;left:10%;width:220px;height:220px;background:radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 65%);pointer-events:none}',
        '.fd-hero-content{position:relative;z-index:1}',
        '.fd-hero-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:1.25rem}',
        '.fd-hero-title{font-size:clamp(1.7rem,5vw,2.5rem);font-weight:800;letter-spacing:-1.5px;margin:0 0 4px;background:linear-gradient(135deg,#e0f2fe,#7dd3fc,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}',
        '.fd-hero-sub{color:rgba(125,185,225,0.5);font-size:0.88rem;margin:0;font-weight:400}',
        '.fd-count-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:20px;background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.18);color:#7dd3fc;font-size:0.75rem;font-weight:600;white-space:nowrap}',
        '.fd-hero-btns{display:flex;gap:9px;flex-wrap:wrap}',

        // Buttons
        '.fd-btn-suggest{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:50px;border:1px solid rgba(52,211,153,0.3);background:rgba(52,211,153,0.07);color:#34d399;font-weight:700;font-size:0.82rem;cursor:pointer;transition:all .2s;font-family:"Outfit",sans-serif;letter-spacing:.2px}',
        '.fd-btn-suggest:hover{background:rgba(52,211,153,0.16);border-color:rgba(52,211,153,0.55);transform:translateY(-1px)}',
        '.fd-btn-add{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:50px;border:none;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-weight:700;font-size:0.82rem;cursor:pointer;transition:all .2s;font-family:"Outfit",sans-serif;box-shadow:0 4px 18px rgba(37,99,235,0.3)}',
        '.fd-btn-add:hover{transform:translateY(-1px);box-shadow:0 7px 26px rgba(37,99,235,0.45)}',

        // Search bar
        '.fd-searchbar{display:flex;gap:10px;flex-wrap:wrap;align-items:stretch;padding:1rem 1.25rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:18px;margin-bottom:1.4rem;box-sizing:border-box}',
        '.fd-search-wrap{flex:1;min-width:180px;display:flex;align-items:center;gap:9px;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:0 13px;transition:border-color .2s}',
        '.fd-search-wrap:focus-within{border-color:rgba(56,189,248,0.4)}',
        '.fd-search-input{flex:1;background:none;border:none;outline:none;color:#e2eaf5;font-size:0.86rem;padding:10px 0;font-family:"Outfit",sans-serif}',
        '.fd-search-input::placeholder{color:rgba(125,185,225,0.28)}',
        '.fd-filter-scroll{display:flex;gap:6px;overflow-x:auto;align-items:center;scrollbar-width:none;padding:2px 0}',
        '.fd-filter-scroll::-webkit-scrollbar{display:none}',
        '.fd-chip{padding:7px 13px;border-radius:20px;border:1px solid;font-size:0.76rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:"Outfit",sans-serif;letter-spacing:.2px}',
        '.fd-chip-on{background:rgba(56,189,248,0.13);border-color:rgba(56,189,248,0.45);color:#7dd3fc}',
        '.fd-chip-off{background:transparent;border-color:rgba(255,255,255,0.09);color:rgba(125,185,225,0.45)}',
        '.fd-chip-off:hover{background:rgba(255,255,255,0.04);color:rgba(180,210,235,0.65)}',

        // Section label
        '.fd-section-label{font-size:0.68rem;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:rgba(56,189,248,0.4);margin:0 0 1rem;display:flex;align-items:center;gap:8px}',
        '.fd-section-label::after{content:"";flex:1;height:1px;background:rgba(56,189,248,0.08)}',

        // Grid
        '.fd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.1rem}',

        // Card
        '.fd-card{background:linear-gradient(155deg,rgba(12,22,44,0.95),rgba(7,12,26,0.98));border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden;cursor:pointer;position:relative;transition:transform .25s cubic-bezier(.34,1.56,.64,1),border-color .22s,box-shadow .22s;animation:fd-in .4s ease both}',
        '.fd-card:hover{transform:translateY(-5px) scale(1.015);border-color:rgba(56,189,248,0.28);box-shadow:0 14px 44px rgba(0,0,0,0.45),0 0 0 1px rgba(56,189,248,0.08)}',
        '.fd-card-accent{height:3px;background:linear-gradient(90deg,#38bdf8,#818cf8,#a855f7)}',
        '.fd-card-body{padding:1.25rem 1.25rem 0.9rem}',
        '.fd-card-row{display:flex;gap:13px;align-items:flex-start}',
        '.fd-avatar{width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:800;color:#fff;flex-shrink:0;position:relative}',
        '.fd-avatar::after{content:"";position:absolute;inset:-3px;border-radius:17px;background:inherit;opacity:.2;filter:blur(10px);z-index:-1}',
        '.fd-card-info{flex:1;min-width:0}',
        '.fd-card-name{font-size:0.95rem;font-weight:700;margin:0 0 2px;color:#e8f4ff;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.fd-card-desig{font-size:0.75rem;color:rgba(125,185,225,0.48);margin:0 0 9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.fd-card-codes{display:flex;gap:5px;flex-wrap:wrap}',
        '.fd-code-badge{padding:3px 9px;border-radius:7px;font-size:0.68rem;font-weight:600;font-family:"JetBrains Mono",monospace;background:rgba(56,189,248,0.09);color:#7dd3fc;border:1px solid rgba(56,189,248,0.18);letter-spacing:.3px}',
        '.fd-code-more{padding:3px 9px;border-radius:7px;font-size:0.68rem;color:rgba(125,185,225,0.38);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07)}',
        '.fd-card-footer{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.25rem;border-top:1px solid rgba(255,255,255,0.04);margin-top:.9rem}',
        '.fd-dept-tag{font-size:0.7rem;color:rgba(125,185,225,0.38);font-weight:600;letter-spacing:.3px}',
        '.fd-view-link{display:flex;align-items:center;gap:3px;font-size:0.72rem;color:rgba(56,189,248,0.45);font-weight:600;transition:color .15s}',
        '.fd-card:hover .fd-view-link{color:#38bdf8}',
        '.fd-admin-btns{position:absolute;top:12px;right:12px;display:flex;gap:5px;opacity:0;transition:opacity .18s}',
        '.fd-card:hover .fd-admin-btns{opacity:1}',
        '.fd-icon-btn{width:26px;height:26px;border-radius:7px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}',

        // Empty
        '.fd-empty{grid-column:1/-1;text-align:center;padding:5rem 2rem;color:rgba(125,185,225,0.28)}',

        // Modals
        '.fd-overlay{position:fixed;inset:0;z-index:60;background:rgba(2,6,16,0.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fd-scale-in .2s ease both}',
        '.fd-modal{width:100%;max-width:500px;background:linear-gradient(145deg,#0c1931,#07111f);border:1px solid rgba(56,189,248,0.18);border-radius:26px;overflow:hidden;position:relative;max-height:90vh;overflow-y:auto}',
        '.fd-modal-banner{height:5px;background:linear-gradient(90deg,#38bdf8,#6366f1,#a855f7)}',
        '.fd-modal-head{padding:1.75rem 1.75rem 1.25rem;text-align:center}',
        '.fd-modal-avatar{width:84px;height:84px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:1.9rem;font-weight:800;color:#fff;margin:0 auto 1rem}',
        '.fd-modal-name{font-size:1.55rem;font-weight:800;margin:0 0 4px;color:#e8f4ff;letter-spacing:-.5px}',
        '.fd-modal-desig{font-size:0.84rem;color:rgba(56,189,248,0.6);margin:0 0 8px}',
        '.fd-dept-pill{display:inline-block;padding:4px 13px;background:rgba(56,189,248,0.09);border:1px solid rgba(56,189,248,0.2);border-radius:20px;font-size:0.74rem;color:#7dd3fc;font-weight:600}',
        '.fd-modal-body{padding:0 1.5rem 1.75rem;display:grid;gap:8px}',
        '.fd-info-block{padding:11px 14px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:12px}',
        '.fd-info-block-label{font-size:0.68rem;color:rgba(125,185,225,0.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;display:flex;align-items:center;gap:6px}',
        '.fd-tags{display:flex;flex-wrap:wrap;gap:5px}',
        '.fd-tag-course{padding:5px 11px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.18);border-radius:8px;font-size:0.76rem;color:#7dd3fc;font-weight:500}',
        '.fd-tag-code{padding:5px 11px;background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.18);border-radius:8px;font-size:0.73rem;color:#fbbf24;font-weight:600;font-family:"JetBrains Mono",monospace}',
        '.fd-phone-row{display:flex;align-items:center;gap:12px}',
        '.fd-phone-icon{width:36px;height:36px;border-radius:10px;background:rgba(52,211,153,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}',
        '.fd-phone-label{font-size:0.68rem;color:rgba(125,185,225,0.38);text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px;font-weight:600}',
        '.fd-phone-val{font-size:0.9rem;color:#e2eaf5;font-family:"JetBrains Mono",monospace;font-weight:500}',
        '.fd-call-btn{width:100%;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#0284c7,#4f46e5);color:#fff;font-size:0.92rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:"Outfit",sans-serif;transition:all .2s;box-shadow:0 5px 20px rgba(2,132,199,0.3);margin-top:4px}',
        '.fd-call-btn:hover{transform:translateY(-1px);box-shadow:0 9px 28px rgba(2,132,199,0.42)}',
        '.fd-close-btn{position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(125,185,225,0.55);z-index:2;transition:background .15s}',
        '.fd-close-btn:hover{background:rgba(255,255,255,0.1)}',

        // Suggest modal
        '.fd-suggest-modal{width:100%;max-width:470px;background:linear-gradient(145deg,#0c1931,#07111f);border:1px solid rgba(52,211,153,0.18);border-radius:26px;overflow:hidden;position:relative;max-height:92vh;overflow-y:auto}',
        '.fd-suggest-head{padding:1.25rem 1.5rem;display:flex;align-items:center;gap:11px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(52,211,153,0.03)}',
        '.fd-suggest-body{padding:1.25rem 1.5rem;display:grid;gap:10px}',
        '.fd-suggest-btn{width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#34d399,#059669);color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .2s}',
        '.fd-suggest-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}',
        '.fd-suggest-btn:disabled{opacity:.5;cursor:not-allowed}',
        '.fd-success{text-align:center;padding:3rem 2rem}',

        // Admin form
        '.fd-admin-form{background:rgba(12,22,44,0.85);border:1px solid rgba(59,130,246,0.2);border-radius:22px;padding:1.75rem;margin-bottom:1.5rem;animation:fd-in .3s ease both}',
        '.fd-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
        '.fd-form-label{font-size:0.68rem;font-weight:700;color:rgba(125,185,225,0.45);text-transform:uppercase;letter-spacing:.9px;margin-bottom:5px;display:block}',
        '.fd-input{width:100%;padding:10px 13px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.28);color:#e2eaf5;font-size:0.85rem;font-family:"Outfit",sans-serif;outline:none;transition:border-color .18s;box-sizing:border-box}',
        '.fd-input:focus{border-color:rgba(56,189,248,0.38)}',
        '.fd-input::placeholder{color:rgba(125,185,225,0.25)}',
        '.fd-submit-btn{width:100%;padding:12px;border-radius:11px;border:none;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .2s;margin-top:2px}',
        '.fd-submit-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}',
        '.fd-submit-btn:disabled{opacity:.5;cursor:not-allowed}',

        // Responsive
        '@media(max-width:640px){.fd-form-grid{grid-template-columns:1fr}.fd-hero{padding:1.4rem 1rem}.fd-searchbar{flex-direction:column}.fd-grid{grid-template-columns:1fr}.fd-modal,.fd-suggest-modal{border-radius:20px}.fd-hero-top{flex-direction:column;gap:8px}}',
    ];
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = rules.join('\n');
    document.head.appendChild(el);
}

// ── Avatar helpers ────────────────────────────────────────────────────────────
const GRADIENTS = [
    ['#0ea5e9','#6366f1'],['#f43f5e','#ec4899'],['#f59e0b','#f97316'],
    ['#10b981','#06b6d4'],['#8b5cf6','#a855f7'],['#14b8a6','#3b82f6'],
    ['#e11d48','#9333ea'],['#0891b2','#2563eb'],
];
const avatarGrad = (name = '') => {
    const [a, b] = GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
    return 'linear-gradient(135deg,' + a + ',' + b + ')';
};
const initials = (name = '') => {
    const p = name.trim().split(' ').filter(Boolean);
    return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

// ── Component ─────────────────────────────────────────────────────────────────
const FacultyDirectory = () => {
    const [facultyList,       setFacultyList]       = useState([]);
    const [search,            setSearch]            = useState('');
    const [courseFilter,      setCourseFilter]      = useState('All');
    const [selectedFaculty,   setSelectedFaculty]   = useState(null);
    const [showForm,          setShowForm]          = useState(false);
    const [formLoading,       setFormLoading]       = useState(false);
    const [isEditing,         setIsEditing]         = useState(false);
    const [editId,            setEditId]            = useState(null);
    const [mounted,           setMounted]           = useState(false);
    const [showSuggestModal,  setShowSuggestModal]  = useState(false);
    const [suggestLoading,    setSuggestLoading]    = useState(false);
    const [suggestSuccess,    setSuggestSuccess]    = useState(false);

    const initSuggest = { name:'', designation:'', department:'', phone:'', courses:'', reason:'' };
    const [suggestForm, setSuggestForm] = useState(initSuggest);

    const currentUser  = auth.currentUser;
    const ADMIN_EMAIL  = "palerugopi2008@gmail.com";
    const isAdmin      = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const initForm = { name:'', designation:'', department:'CSE', phone:'', courses:[] };
    const [formData,   setFormData]   = useState(initForm);
    const [tempCourse, setTempCourse] = useState({ name:'', code:'' });

    useEffect(() => { injectFDStyles(); setMounted(true); }, []);

    useEffect(() => {
        const q = query(collection(db, "faculty"), orderBy("name"));
        return onSnapshot(q, snap => setFacultyList(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
    }, []);

    const uniqueCourseCodes = useMemo(() => {
        const codes = facultyList.flatMap(f => (f.courses||[]).map(c => c.code));
        return ['All', ...new Set(codes.filter(Boolean))].sort();
    }, [facultyList]);

    const filtered = facultyList.filter(f => {
        const s = search.toLowerCase().trim();
        const ok = !s ||
            (f.name?.toLowerCase()||'').includes(s) ||
            (f.designation?.toLowerCase()||'').includes(s) ||
            (f.courses||[]).some(c => (c.name?.toLowerCase()||'').includes(s));
        const code = courseFilter === 'All' || (f.courses||[]).some(c => c.code === courseFilter);
        return ok && code;
    });

    // ── CRUD (logic unchanged) ───────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault(); setFormLoading(true);
        try {
            if (isEditing && editId) await updateDoc(doc(db,"faculty",editId), formData);
            else await addDoc(collection(db,"faculty"), formData);
            setFormData(initForm); setTempCourse({name:'',code:''});
            setShowForm(false); setIsEditing(false); setEditId(null);
        } catch(err) { console.error(err); }
        setFormLoading(false);
    };
    const handleDelete = async (id) => {
        if (window.confirm("Delete this faculty member?")) {
            await deleteDoc(doc(db,"faculty",id)); setSelectedFaculty(null);
        }
    };
    const handleEdit = (f) => {
        setFormData(f); setEditId(f.id); setIsEditing(true);
        setShowForm(true); setSelectedFaculty(null);
        window.scrollTo({top:0,behavior:'smooth'});
    };
    const addCourse = () => {
        if (tempCourse.name && tempCourse.code) {
            setFormData({...formData, courses:[...(formData.courses||[]), tempCourse]});
            setTempCourse({name:'',code:''});
        }
    };
    const removeCourse = (i) => setFormData({...formData, courses:formData.courses.filter((_,idx)=>idx!==i)});

    const handleSuggestSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) { alert("Please log in to suggest a faculty."); return; }
        setSuggestLoading(true);
        try {
            await addDoc(collection(db,"facultySuggestions"), {
                ...suggestForm,
                suggestedBy: currentUser.displayName || currentUser.email || 'Anonymous',
                suggestedByEmail: currentUser.email || '',
                suggestedByUid: currentUser.uid || '',
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setSuggestSuccess(true); setSuggestForm(initSuggest);
            setTimeout(() => { setSuggestSuccess(false); setShowSuggestModal(false); }, 2300);
        } catch(err) { console.error(err); alert("Failed to submit. Please try again."); }
        setSuggestLoading(false);
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <div className="fd" style={{opacity: mounted ? 1 : 0, transition:'opacity .35s ease'}}>

                {/* ── Hero ── */}
                <div className="fd-hero">
                    <div className="fd-hero-glow1" /><div className="fd-hero-glow2" />
                    <div className="fd-hero-content">
                        <div className="fd-hero-top">
                            <div>
                                <h1 className="fd-hero-title">Faculty Directory</h1>
                                <p className="fd-hero-sub">Find professors, course codes &amp; contact info</p>
                            </div>
                            <div className="fd-count-pill">
                                <Users size={12} /> {facultyList.length} faculty members
                            </div>
                        </div>
                        <div className="fd-hero-btns">
                            <button className="fd-btn-suggest" onClick={() => { setShowSuggestModal(true); setSuggestSuccess(false); }}>
                                <Lightbulb size={14} /> Suggest Faculty
                            </button>
                            {isAdmin && (
                                <button className="fd-btn-add" onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData(initForm); }}>
                                    {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Faculty</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Admin Form ── */}
                {isAdmin && showForm && (
                    <div className="fd-admin-form">
                        <h3 style={{margin:'0 0 1.1rem',fontWeight:700,fontSize:'1rem',color:'#e8f4ff'}}>
                            {isEditing ? 'Edit Faculty Member' : 'Add New Faculty Member'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{display:'grid',gap:'10px'}}>
                            <div className="fd-form-grid">
                                <div><label className="fd-form-label">Full Name *</label><input className="fd-input" required type="text" placeholder="e.g. Dr. Rajesh Kumar" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} /></div>
                                <div><label className="fd-form-label">Designation *</label><input className="fd-input" required type="text" placeholder="e.g. Associate Professor" value={formData.designation} onChange={e=>setFormData({...formData,designation:e.target.value})} /></div>
                                <div><label className="fd-form-label">Department</label><input className="fd-input" type="text" placeholder="e.g. CSE" value={formData.department} onChange={e=>setFormData({...formData,department:e.target.value})} /></div>
                                <div><label className="fd-form-label">Phone</label><input className="fd-input" type="text" placeholder="e.g. 9876543210" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} /></div>
                            </div>
                            <div style={{background:'rgba(255,255,255,0.025)',padding:'1rem',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.05)'}}>
                                <label className="fd-form-label" style={{display:'block',marginBottom:'9px'}}>Courses Taught</label>
                                <div style={{display:'flex',gap:'8px',marginBottom:'9px',flexWrap:'wrap'}}>
                                    <input className="fd-input" type="text" placeholder="Code (e.g. CS101)" value={tempCourse.code} onChange={e=>setTempCourse({...tempCourse,code:e.target.value})} style={{flex:1,minWidth:'90px'}} />
                                    <input className="fd-input" type="text" placeholder="Name (e.g. Java)" value={tempCourse.name} onChange={e=>setTempCourse({...tempCourse,name:e.target.value})} style={{flex:2,minWidth:'130px'}} />
                                    <button type="button" onClick={addCourse} style={{padding:'0 14px',background:'#34d399',border:'none',borderRadius:'9px',cursor:'pointer',color:'#000',fontWeight:700,fontFamily:'"Outfit",sans-serif',flexShrink:0}}><Plus size={15}/></button>
                                </div>
                                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                                    {formData.courses?.map((c,i) => (
                                        <div key={i} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:'rgba(56,189,248,0.09)',border:'1px solid rgba(56,189,248,0.18)',borderRadius:'8px',fontSize:'0.78rem',color:'#7dd3fc'}}>
                                            <span style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:600}}>{c.code}</span>
                                            <span style={{opacity:.4}}>·</span>
                                            <span>{c.name}</span>
                                            <X size={11} style={{cursor:'pointer',opacity:.55,marginLeft:'2px'}} onClick={()=>removeCourse(i)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="fd-submit-btn" disabled={formLoading}>
                                {formLoading ? 'Saving...' : (isEditing ? 'Update Faculty' : 'Save Faculty')}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── Search & Filter ── */}
                <div className="fd-searchbar">
                    <div className="fd-search-wrap">
                        <Search size={15} color="rgba(56,189,248,0.45)" />
                        <input className="fd-search-input" placeholder="Search by name, course, code..." value={search} onChange={e=>setSearch(e.target.value)} />
                        {search && <X size={14} style={{cursor:'pointer',color:'rgba(125,185,225,0.35)',flexShrink:0}} onClick={()=>setSearch('')} />}
                    </div>
                    <div className="fd-filter-scroll">
                        <Filter size={13} color="rgba(125,185,225,0.35)" style={{flexShrink:0}} />
                        {uniqueCourseCodes.map(code => (
                            <button key={code} className={'fd-chip ' + (courseFilter===code ? 'fd-chip-on' : 'fd-chip-off')} onClick={()=>setCourseFilter(code)}>
                                {code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Results label ── */}
                <div className="fd-section-label">
                    {filtered.length} {filtered.length===1?'result':'results'}
                    {(search || courseFilter!=='All') ? ' · filtered' : ' · all faculty'}
                </div>

                {/* ── Faculty Grid ── */}
                <div className="fd-grid">
                    {filtered.length === 0 ? (
                        <div className="fd-empty">
                            <RefreshCcw size={34} style={{marginBottom:'12px',opacity:.25}} />
                            <p style={{fontWeight:600,margin:'0 0 5px',fontSize:'1rem'}}>No faculty found</p>
                            <p style={{fontSize:'0.82rem',margin:0}}>Try a different name or clear the filter</p>
                        </div>
                    ) : filtered.map((f, idx) => (
                        <div key={f.id} className="fd-card" style={{animationDelay:(idx*.045)+'s'}} onClick={()=>setSelectedFaculty(f)}>
                            <div className="fd-card-accent" />
                            <div className="fd-card-body">
                                <div className="fd-card-row">
                                    <div className="fd-avatar" style={{background:avatarGrad(f.name)}}>
                                        {initials(f.name)}
                                    </div>
                                    <div className="fd-card-info">
                                        <p className="fd-card-name">{f.name}</p>
                                        <p className="fd-card-desig">{f.designation}</p>
                                        <div className="fd-card-codes">
                                            {f.courses?.slice(0,2).map((c,i) => (
                                                <span key={i} className="fd-code-badge">{c.code}</span>
                                            ))}
                                            {(f.courses?.length||0) > 2 && (
                                                <span className="fd-code-more">+{f.courses.length-2}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="fd-card-footer">
                                <span className="fd-dept-tag">{f.department || 'Faculty'}</span>
                                <span className="fd-view-link">View <ChevronRight size={13}/></span>
                            </div>
                            {isAdmin && (
                                <div className="fd-admin-btns" onClick={e=>e.stopPropagation()}>
                                    <button className="fd-icon-btn" style={{background:'rgba(96,165,250,0.14)',color:'#60a5fa'}} onClick={()=>handleEdit(f)}><Edit2 size={12}/></button>
                                    <button className="fd-icon-btn" style={{background:'rgba(239,68,68,0.13)',color:'#f87171'}} onClick={()=>handleDelete(f.id)}><Trash2 size={12}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Detail Modal ── */}
                {selectedFaculty && (
                    <div className="fd-overlay" onClick={()=>setSelectedFaculty(null)}>
                        <div className="fd-modal" onClick={e=>e.stopPropagation()}>
                            <div className="fd-modal-banner" />
                            <button className="fd-close-btn" onClick={()=>setSelectedFaculty(null)}><X size={15}/></button>
                            <div className="fd-modal-head">
                                <div className="fd-modal-avatar" style={{background:avatarGrad(selectedFaculty.name)}}>
                                    {initials(selectedFaculty.name)}
                                </div>
                                <h2 className="fd-modal-name">{selectedFaculty.name}</h2>
                                <p className="fd-modal-desig">{selectedFaculty.designation}</p>
                                {selectedFaculty.department && <span className="fd-dept-pill">{selectedFaculty.department}</span>}
                            </div>
                            <div className="fd-modal-body">
                                {/* Courses */}
                                <div className="fd-info-block">
                                    <div className="fd-info-block-label" style={{color:'#38bdf8'}}>
                                        <BookOpen size={13}/> Courses Taught
                                    </div>
                                    <div className="fd-tags">
                                        {selectedFaculty.courses?.length > 0
                                            ? selectedFaculty.courses.map((c,i)=><span key={i} className="fd-tag-course">{c.name}</span>)
                                            : <span style={{fontSize:'0.8rem',color:'rgba(125,185,225,0.3)'}}>No courses listed</span>
                                        }
                                    </div>
                                </div>
                                {/* Course codes */}
                                <div className="fd-info-block">
                                    <div className="fd-info-block-label" style={{color:'#fbbf24'}}>
                                        <Code size={13}/> Course Codes
                                    </div>
                                    <div className="fd-tags">
                                        {selectedFaculty.courses?.length > 0
                                            ? selectedFaculty.courses.map((c,i)=><span key={i} className="fd-tag-code">{c.code}</span>)
                                            : <span style={{fontSize:'0.8rem',color:'rgba(125,185,225,0.3)'}}>No codes listed</span>
                                        }
                                    </div>
                                </div>
                                {/* Phone */}
                                <div className="fd-info-block">
                                    <div className="fd-phone-row">
                                        <div className="fd-phone-icon"><Phone size={15} color="#34d399"/></div>
                                        <div>
                                            <div className="fd-phone-label">Phone</div>
                                            <div className="fd-phone-val">{selectedFaculty.phone || 'Not available'}</div>
                                        </div>
                                    </div>
                                </div>
                                {selectedFaculty.phone && (
                                    <button className="fd-call-btn" onClick={()=>window.location.href='tel:'+selectedFaculty.phone}>
                                        <Phone size={16}/> Call Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Suggest Modal ── */}
                {showSuggestModal && (
                    <div className="fd-overlay" onClick={()=>setShowSuggestModal(false)}>
                        <div className="fd-suggest-modal" onClick={e=>e.stopPropagation()}>
                            <button className="fd-close-btn" onClick={()=>setShowSuggestModal(false)}><X size={15}/></button>
                            <div className="fd-suggest-head">
                                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(52,211,153,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <Lightbulb size={17} color="#34d399"/>
                                </div>
                                <div>
                                    <h3 style={{margin:0,fontWeight:700,fontSize:'0.97rem',color:'#e8f4ff'}}>Suggest a Faculty</h3>
                                    <p style={{margin:0,fontSize:'0.73rem',color:'rgba(125,185,225,0.45)'}}>Sent to admin for review</p>
                                </div>
                            </div>
                            {suggestSuccess ? (
                                <div className="fd-success">
                                    <div style={{fontSize:'3.2rem',marginBottom:'10px'}}>✅</div>
                                    <h4 style={{color:'#34d399',fontWeight:700,margin:'0 0 6px'}}>Suggestion Submitted!</h4>
                                    <p style={{color:'rgba(125,185,225,0.45)',fontSize:'0.85rem',margin:0}}>The admin will review it shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSuggestSubmit} className="fd-suggest-body">
                                    <div className="fd-form-grid">
                                        <div><label className="fd-form-label">Faculty Name *</label><input required className="fd-input" type="text" placeholder="e.g. Dr. Kumar" value={suggestForm.name} onChange={e=>setSuggestForm({...suggestForm,name:e.target.value})} /></div>
                                        <div><label className="fd-form-label">Designation</label><input className="fd-input" type="text" placeholder="e.g. Professor" value={suggestForm.designation} onChange={e=>setSuggestForm({...suggestForm,designation:e.target.value})} /></div>
                                        <div><label className="fd-form-label">Department</label><input className="fd-input" type="text" placeholder="e.g. CSE" value={suggestForm.department} onChange={e=>setSuggestForm({...suggestForm,department:e.target.value})} /></div>
                                        <div><label className="fd-form-label">Phone (if known)</label><input className="fd-input" type="text" placeholder="e.g. 9876543210" value={suggestForm.phone} onChange={e=>setSuggestForm({...suggestForm,phone:e.target.value})} /></div>
                                    </div>
                                    <div><label className="fd-form-label">Courses Taught</label><input className="fd-input" type="text" placeholder="e.g. Data Structures, OS" value={suggestForm.courses} onChange={e=>setSuggestForm({...suggestForm,courses:e.target.value})} /></div>
                                    <div><label className="fd-form-label">Why suggest? *</label><textarea required rows={3} className="fd-input" placeholder="e.g. They teach Java but aren't listed..." value={suggestForm.reason} onChange={e=>setSuggestForm({...suggestForm,reason:e.target.value})} style={{resize:'vertical',fontFamily:'"Outfit",sans-serif'}} /></div>
                                    <button type="submit" className="fd-suggest-btn" disabled={suggestLoading}>
                                        {suggestLoading ? 'Submitting...' : 'Submit Suggestion'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default FacultyDirectory;
