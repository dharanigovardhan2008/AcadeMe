import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, BookOpen, Phone, X, Plus, Trash2, Edit2,
    Code, Filter, RefreshCcw, Lightbulb, ChevronRight,
    Users, Star, MapPin, GraduationCap
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import {
    collection, onSnapshot, addDoc, deleteDoc,
    updateDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

/* ─── STYLE INJECTION ─────────────────────────────────────── */
const SID = 'fd-v3';
function injectStyles() {
    if (document.getElementById(SID)) return;
    const s = document.createElement('style');
    s.id = SID;
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* reset & root */
.fd3 { font-family:'Inter',system-ui,sans-serif; color:#e2e8f0; }
.fd3 *, .fd3 *::before, .fd3 *::after { box-sizing:border-box; }

/* ─ keyframes ─ */
@keyframes fd3Up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes fd3In   { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
@keyframes fd3Spin { to{transform:rotate(360deg)} }
@keyframes fd3Pulse{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
@keyframes fd3Shimmer{0%{background-position:-300% 0}100%{background-position:300% 0}}

/* ─ hero ─ */
.fd3-hero {
    border-radius:20px;
    padding: clamp(1.25rem,4vw,2rem) clamp(1.25rem,4vw,1.75rem);
    margin-bottom:1.25rem;
    background:linear-gradient(135deg,#1e1b4b 0%,#1a1035 50%,#0f172a 100%);
    border:1px solid rgba(99,102,241,.22);
    position:relative; overflow:hidden;
}
.fd3-hero::before {
    content:''; position:absolute; top:-80px; right:-80px;
    width:280px; height:280px; border-radius:50%;
    background:radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 70%);
    pointer-events:none;
}
.fd3-hero::after {
    content:''; position:absolute; bottom:-60px; left:30%;
    width:200px; height:200px; border-radius:50%;
    background:radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%);
    pointer-events:none;
}
.fd3-hero-inner { position:relative; z-index:1; }
.fd3-hero-row {
    display:flex; justify-content:space-between;
    align-items:flex-start; flex-wrap:wrap; gap:.75rem;
    margin-bottom:1.1rem;
}
.fd3-h1 {
    font-size:clamp(1.5rem,5vw,2.2rem); font-weight:800;
    letter-spacing:-.8px; margin:0 0 .3rem;
    background:linear-gradient(135deg,#fff 30%,#a5b4fc 70%,#818cf8 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; line-height:1.15;
}
.fd3-h1-sub { color:rgba(165,180,252,.5); font-size:.85rem; margin:0; font-weight:400; }
.fd3-live {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 12px; border-radius:30px; font-size:.73rem; font-weight:600;
    background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3);
    color:#a5b4fc; white-space:nowrap; align-self:flex-start;
}
.fd3-live-dot {
    width:6px; height:6px; border-radius:50%; background:#818cf8;
    animation:fd3Pulse 2s ease-in-out infinite;
}
.fd3-hero-btns { display:flex; gap:8px; flex-wrap:wrap; }

/* ─ buttons ─ */
.fd3-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:9px 17px; border-radius:10px; font-size:.82rem;
    font-weight:600; cursor:pointer; transition:all .18s;
    font-family:'Inter',sans-serif; border:1px solid transparent;
    white-space:nowrap;
}
.fd3-btn-ghost {
    background:rgba(52,211,153,.1); border-color:rgba(52,211,153,.3); color:#34d399;
}
.fd3-btn-ghost:hover { background:rgba(52,211,153,.18); border-color:rgba(52,211,153,.55); transform:translateY(-1px); }
.fd3-btn-primary {
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff; border-color:transparent;
    box-shadow:0 4px 14px rgba(99,102,241,.35);
}
.fd3-btn-primary:hover { transform:translateY(-1px); box-shadow:0 7px 20px rgba(99,102,241,.5); }

/* ─ search bar ─ */
.fd3-bar {
    display:flex; gap:10px; flex-wrap:wrap;
    background:rgba(15,23,42,.6);
    border:1px solid rgba(255,255,255,.07);
    border-radius:16px; padding:10px 12px;
    margin-bottom:1.25rem;
    backdrop-filter:blur(12px);
}
.fd3-search {
    flex:1; min-width:0; display:flex; align-items:center; gap:8px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
    border-radius:10px; padding:0 12px; transition:border-color .18s;
}
.fd3-search:focus-within {
    border-color:rgba(99,102,241,.45);
    box-shadow:0 0 0 3px rgba(99,102,241,.1);
}
.fd3-search input {
    flex:1; background:none; border:none; outline:none;
    color:#e2e8f0; font-size:.86rem; padding:10px 0;
    font-family:'Inter',sans-serif;
}
.fd3-search input::placeholder { color:rgba(148,163,184,.35); }
.fd3-chips { display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; align-items:center; padding:1px 0; }
.fd3-chips::-webkit-scrollbar { display:none; }
.fd3-chip {
    padding:6px 13px; border-radius:8px; border:1px solid;
    font-size:.74rem; font-weight:600; cursor:pointer;
    white-space:nowrap; transition:all .14s; font-family:'Inter',sans-serif;
    flex-shrink:0;
}
.fd3-chip-on  { background:rgba(99,102,241,.2); border-color:rgba(99,102,241,.45); color:#a5b4fc; }
.fd3-chip-off { background:transparent; border-color:rgba(255,255,255,.08); color:rgba(148,163,184,.5); }
.fd3-chip-off:hover { background:rgba(255,255,255,.05); color:rgba(203,213,225,.7); border-color:rgba(255,255,255,.15); }

/* ─ results row ─ */
.fd3-meta {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:.9rem; flex-wrap:wrap; gap:.5rem;
}
.fd3-count { font-size:.78rem; font-weight:600; color:rgba(148,163,184,.5); letter-spacing:.3px; }

/* ─ grid ─ */
.fd3-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));
    gap:1rem;
}

/* ─ card ─ */
.fd3-card {
    border-radius:16px; overflow:hidden; cursor:pointer; position:relative;
    background:#1e293b;
    border:1px solid rgba(255,255,255,.07);
    transition:transform .22s cubic-bezier(.34,1.56,.64,1),border-color .2s,box-shadow .2s;
    animation:fd3Up .4s ease both;
}
.fd3-card:hover {
    transform:translateY(-4px) scale(1.012);
    border-color:rgba(99,102,241,.35);
    box-shadow:0 12px 36px rgba(0,0,0,.35),0 0 0 1px rgba(99,102,241,.12);
}
.fd3-card:active { transform:translateY(-1px) scale(1.005); }
.fd3-card-bar { height:3px; }
.fd3-card-inner { padding:1.1rem; }
.fd3-card-top { display:flex; align-items:flex-start; gap:11px; margin-bottom:.9rem; }
.fd3-av {
    width:52px; height:52px; border-radius:13px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:1.15rem; font-weight:800; color:#fff;
}
.fd3-card-title { flex:1; min-width:0; }
.fd3-card-name {
    font-size:.94rem; font-weight:700; color:#f1f5f9;
    margin:0 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    letter-spacing:-.2px;
}
.fd3-card-desig {
    font-size:.74rem; color:rgba(148,163,184,.55);
    margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.fd3-card-codes { display:flex; gap:5px; flex-wrap:wrap; }
.fd3-code {
    padding:3px 8px; border-radius:6px; font-size:.68rem; font-weight:700;
    letter-spacing:.3px; background:rgba(99,102,241,.12);
    border:1px solid rgba(99,102,241,.2); color:#a5b4fc;
}
.fd3-code-more {
    padding:3px 8px; border-radius:6px; font-size:.68rem;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    color:rgba(148,163,184,.4);
}
.fd3-card-foot {
    display:flex; align-items:center; justify-content:space-between;
    padding:.75rem 1.1rem; background:rgba(0,0,0,.2);
    border-top:1px solid rgba(255,255,255,.05);
}
.fd3-dept { font-size:.69rem; font-weight:600; color:rgba(148,163,184,.4); letter-spacing:.3px; text-transform:uppercase; }
.fd3-more {
    display:flex; align-items:center; gap:3px; font-size:.72rem;
    font-weight:700; color:rgba(99,102,241,.5); transition:color .15s;
}
.fd3-card:hover .fd3-more { color:#a5b4fc; }
.fd3-abs-btns {
    position:absolute; top:10px; right:10px; display:flex; gap:4px;
    opacity:0; transition:opacity .18s;
}
.fd3-card:hover .fd3-abs-btns { opacity:1; }
.fd3-ib {
    width:26px; height:26px; border-radius:7px; border:none;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .14s; backdrop-filter:blur(6px);
}

/* ─ empty ─ */
.fd3-empty {
    grid-column:1/-1; padding:4rem 1rem; text-align:center;
    color:rgba(148,163,184,.35);
}

/* ─ overlay ─ */
.fd3-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(2,6,23,.82);
    backdrop-filter:blur(12px);
    display:flex; align-items:center; justify-content:center;
    padding:1rem; animation:fd3In .2s ease both;
}

/* ─ modal shared ─ */
.fd3-modal {
    width:100%; max-width:460px; max-height:90vh; overflow-y:auto;
    border-radius:22px; position:relative;
    background:#0f172a;
    border:1px solid rgba(255,255,255,.1);
    box-shadow:0 24px 64px rgba(0,0,0,.65);
}
.fd3-modal-top { height:4px; border-radius:22px 22px 0 0; }
.fd3-modal-head { padding:1.75rem 1.75rem 1.25rem; text-align:center; }
.fd3-modal-av {
    width:80px; height:80px; border-radius:20px; margin:0 auto .9rem;
    display:flex; align-items:center; justify-content:center;
    font-size:1.75rem; font-weight:800; color:#fff;
}
.fd3-modal-name { font-size:1.4rem; font-weight:800; margin:0 0 4px; color:#f1f5f9; letter-spacing:-.4px; }
.fd3-modal-desig { font-size:.84rem; color:rgba(148,163,184,.6); margin:0 0 8px; }
.fd3-modal-dept {
    display:inline-block; padding:3px 12px; border-radius:20px; font-size:.72rem; font-weight:700;
    background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.28); color:#a5b4fc;
}
.fd3-modal-body { padding:0 1.5rem 1.75rem; display:grid; gap:8px; }
.fd3-section {
    padding:11px 13px; border-radius:12px;
    background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.06);
}
.fd3-section-lbl {
    display:flex; align-items:center; gap:6px; font-size:.66rem; font-weight:700;
    text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px;
}
.fd3-tags { display:flex; flex-wrap:wrap; gap:5px; }
.fd3-tag-c {
    padding:4px 10px; border-radius:8px; font-size:.75rem; font-weight:500;
    background:rgba(56,189,248,.09); border:1px solid rgba(56,189,248,.2); color:#7dd3fc;
}
.fd3-tag-k {
    padding:4px 10px; border-radius:8px; font-size:.72rem; font-weight:700;
    background:rgba(251,191,36,.08); border:1px solid rgba(251,191,36,.2); color:#fbbf24;
    letter-spacing:.4px;
}
.fd3-phone-row { display:flex; align-items:center; gap:11px; }
.fd3-phone-ico {
    width:36px; height:36px; border-radius:10px; flex-shrink:0;
    background:rgba(52,211,153,.12); display:flex; align-items:center; justify-content:center;
}
.fd3-phone-l { font-size:.66rem; color:rgba(148,163,184,.4); text-transform:uppercase; letter-spacing:.8px; font-weight:700; margin-bottom:2px; }
.fd3-phone-v { font-size:.9rem; color:#e2e8f0; font-weight:600; }
.fd3-call {
    width:100%; padding:13px; border-radius:12px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:.9rem; font-weight:700; color:#fff;
    display:flex; align-items:center; justify-content:center; gap:8px;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    box-shadow:0 4px 18px rgba(99,102,241,.35); transition:all .18s; margin-top:2px;
}
.fd3-call:hover { transform:translateY(-2px); box-shadow:0 8px 26px rgba(99,102,241,.5); }
.fd3-x {
    position:absolute; top:13px; right:13px; z-index:2;
    width:30px; height:30px; border-radius:8px; border:none; cursor:pointer;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center;
    color:rgba(148,163,184,.7); transition:all .14s;
}
.fd3-x:hover { background:rgba(255,255,255,.12); color:#e2e8f0; }

/* ─ suggest modal ─ */
.fd3-suggest {
    width:100%; max-width:440px; max-height:92vh; overflow-y:auto;
    border-radius:22px; position:relative;
    background:#0f172a;
    border:1px solid rgba(52,211,153,.18);
    box-shadow:0 24px 64px rgba(0,0,0,.65);
}
.fd3-sug-head {
    padding:1.2rem 1.5rem;
    border-bottom:1px solid rgba(255,255,255,.06);
    background:rgba(52,211,153,.04);
    display:flex; align-items:center; gap:11px;
}
.fd3-sug-ico {
    width:36px; height:36px; border-radius:10px; flex-shrink:0;
    background:rgba(52,211,153,.14); display:flex; align-items:center; justify-content:center;
}
.fd3-sug-body { padding:1.2rem 1.5rem; display:grid; gap:9px; }
.fd3-sug-btn {
    width:100%; padding:12px; border-radius:11px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:.88rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#10b981,#059669);
    box-shadow:0 4px 16px rgba(16,185,129,.3); transition:all .18s;
}
.fd3-sug-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 7px 22px rgba(16,185,129,.45); }
.fd3-sug-btn:disabled { opacity:.45; cursor:not-allowed; }
.fd3-success { text-align:center; padding:2.75rem 1.5rem; }

/* ─ admin form ─ */
.fd3-form-wrap {
    border-radius:18px; padding:1.5rem;
    background:#1e293b;
    border:1px solid rgba(99,102,241,.2);
    margin-bottom:1.25rem;
    animation:fd3Up .3s ease both;
}
.fd3-fg2 { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
.fd3-lbl { font-size:.67rem; font-weight:700; color:rgba(148,163,184,.45); text-transform:uppercase; letter-spacing:.9px; margin-bottom:5px; display:block; }
.fd3-inp {
    width:100%; padding:10px 12px; border-radius:10px; outline:none;
    font-family:'Inter',sans-serif; font-size:.85rem; color:#e2e8f0;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    transition:border-color .18s,box-shadow .18s;
}
.fd3-inp:focus { border-color:rgba(99,102,241,.45); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
.fd3-inp::placeholder { color:rgba(148,163,184,.25); }
.fd3-sub {
    width:100%; padding:12px; border-radius:11px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:.88rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    box-shadow:0 4px 16px rgba(99,102,241,.3); transition:all .18s;
}
.fd3-sub:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
.fd3-sub:disabled { opacity:.45; cursor:not-allowed; }

/* ─ skeleton loader ─ */
.fd3-skel {
    border-radius:16px; overflow:hidden;
    background:linear-gradient(90deg,#1e293b 0%,#2d3748 50%,#1e293b 100%);
    background-size:300% 100%;
    animation:fd3Shimmer 1.6s ease-in-out infinite;
    height:140px; border:1px solid rgba(255,255,255,.06);
}

/* ═══════════════ RESPONSIVE ═══════════════ */

/* tablet */
@media (max-width:768px) {
    .fd3-grid { grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr)); gap:.85rem; }
    .fd3-hero { padding:1.5rem 1.2rem; border-radius:18px; }
    .fd3-h1 { font-size:1.55rem; }
    .fd3-overlay { padding:.75rem; }
}

/* mobile */
@media (max-width:600px) {
    .fd3-grid { grid-template-columns:1fr 1fr; gap:.75rem; }
    .fd3-hero { padding:1.25rem 1rem; border-radius:16px; margin-bottom:1rem; }
    .fd3-h1 { font-size:1.4rem; letter-spacing:-.4px; }
    .fd3-h1-sub { font-size:.78rem; }
    .fd3-hero-row { gap:.6rem; margin-bottom:.9rem; }
    .fd3-live { padding:4px 10px; font-size:.7rem; }
    .fd3-bar { padding:8px 10px; border-radius:13px; gap:7px; }
    .fd3-search { border-radius:8px; padding:0 10px; }
    .fd3-search input { font-size:.83rem; padding:9px 0; }
    .fd3-chip { padding:5px 10px; font-size:.71rem; }
    .fd3-btn { padding:8px 14px; font-size:.79rem; }
    .fd3-card { border-radius:14px; }
    .fd3-card-inner { padding:.9rem .85rem .7rem; }
    .fd3-av { width:44px; height:44px; border-radius:11px; font-size:1rem; }
    .fd3-card-name { font-size:.86rem; }
    .fd3-card-desig { font-size:.7rem; }
    .fd3-card-top { gap:8px; margin-bottom:.7rem; }
    .fd3-card-foot { padding:.6rem .85rem; }
    .fd3-dept { font-size:.65rem; }
    .fd3-more { font-size:.68rem; }
    .fd3-form-wrap { padding:1.1rem; border-radius:14px; }
    .fd3-fg2 { grid-template-columns:1fr; }
    .fd3-modal { border-radius:20px; }
    .fd3-modal-head { padding:1.4rem 1.4rem 1rem; }
    .fd3-modal-av { width:68px; height:68px; font-size:1.5rem; }
    .fd3-modal-name { font-size:1.2rem; }
    .fd3-modal-body { padding:0 1.2rem 1.5rem; }
    .fd3-suggest { border-radius:20px; }
    .fd3-sug-body { padding:1rem 1.2rem; }
    .fd3-sug-head { padding:1rem 1.2rem; }
    /* bottom sheet on mobile */
    .fd3-overlay { align-items:flex-end; padding:0; }
    .fd3-modal, .fd3-suggest {
        max-height:88vh; border-radius:22px 22px 0 0;
        max-width:100%;
    }
}

/* small mobile */
@media (max-width:400px) {
    .fd3-grid { grid-template-columns:1fr; }
    .fd3-av { width:40px; height:40px; font-size:.95rem; border-radius:10px; }
    .fd3-card-inner { padding:.85rem .8rem .65rem; }
    .fd3-hero-btns { gap:6px; }
    .fd3-btn { padding:8px 12px; font-size:.77rem; }
}
`;
    document.head.appendChild(s);
}

/* ─── HELPERS ─────────────────────────────────────────────── */
const GRADS = [
    ['#6366f1','#8b5cf6'], ['#ec4899','#f43f5e'], ['#f59e0b','#ef4444'],
    ['#10b981','#0ea5e9'], ['#3b82f6','#6366f1'], ['#14b8a6','#06b6d4'],
    ['#a855f7','#ec4899'], ['#f97316','#f59e0b'],
];
const grad = nm => { const [a,b] = GRADS[(nm?.charCodeAt(0)||0) % GRADS.length]; return `linear-gradient(135deg,${a},${b})`; };
const ini  = nm => { const p=(nm||'').trim().split(' ').filter(Boolean); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(p[0]?.[0]||'?').toUpperCase(); };

/* ─── COMPONENT ───────────────────────────────────────────── */
const FacultyDirectory = () => {
    const [list,    setList]    = useState([]);
    const [search,  setSearch]  = useState('');
    const [filter,  setFilter]  = useState('All');
    const [sel,     setSel]     = useState(null);
    const [showF,   setShowF]   = useState(false);
    const [fLoad,   setFLoad]   = useState(false);
    const [editing, setEditing] = useState(false);
    const [editId,  setEditId]  = useState(null);
    const [mounted, setMounted] = useState(false);
    const [showSug, setShowSug] = useState(false);
    const [sugLoad, setSugLoad] = useState(false);
    const [sugDone, setSugDone] = useState(false);

    const initSug = {name:'',designation:'',department:'',phone:'',courses:'',reason:''};
    const [sForm,  setSForm]  = useState(initSug);
    const initFrm  = {name:'',designation:'',department:'CSE',phone:'',courses:[]};
    const [form,   setForm]   = useState(initFrm);
    const [tmpC,   setTmpC]   = useState({name:'',code:''});

    const cu      = auth.currentUser;
    const isAdmin = cu?.email?.toLowerCase() === 'palerugopi2008@gmail.com';

    useEffect(() => { injectStyles(); setMounted(true); }, []);

    useEffect(() => {
        const q = query(collection(db,'faculty'), orderBy('name'));
        return onSnapshot(q, s => setList(s.docs.map(d => ({id:d.id,...d.data()}))));
    }, []);

    const codes = useMemo(() => {
        const c = list.flatMap(f => (f.courses||[]).map(x=>x.code));
        return ['All', ...new Set(c.filter(Boolean))].sort();
    }, [list]);

    const filtered = list.filter(f => {
        const s = search.toLowerCase().trim();
        const hit = !s ||
            (f.name?.toLowerCase()||'').includes(s) ||
            (f.designation?.toLowerCase()||'').includes(s) ||
            (f.courses||[]).some(c=>(c.name?.toLowerCase()||'').includes(s)||(c.code?.toLowerCase()||'').includes(s));
        const code = filter==='All' || (f.courses||[]).some(c=>c.code===filter);
        return hit && code;
    });

    /* ── CRUD — logic unchanged ── */
    const save = async e => {
        e.preventDefault(); setFLoad(true);
        try {
            if (editing && editId) await updateDoc(doc(db,'faculty',editId), form);
            else await addDoc(collection(db,'faculty'), form);
            setForm(initFrm); setTmpC({name:'',code:''});
            setShowF(false); setEditing(false); setEditId(null);
        } catch(err) { console.error(err); }
        setFLoad(false);
    };
    const del = async id => {
        if (!window.confirm('Delete this faculty member?')) return;
        await deleteDoc(doc(db,'faculty',id)); setSel(null);
    };
    const edit = f => {
        setForm(f); setEditId(f.id); setEditing(true);
        setShowF(true); setSel(null);
        window.scrollTo({top:0,behavior:'smooth'});
    };
    const addC = () => {
        if (tmpC.name && tmpC.code) { setForm({...form,courses:[...(form.courses||[]),tmpC]}); setTmpC({name:'',code:''}); }
    };
    const remC = i => setForm({...form,courses:form.courses.filter((_,idx)=>idx!==i)});

    const submitSug = async e => {
        e.preventDefault();
        if (!cu) { alert('Please log in to suggest a faculty.'); return; }
        setSugLoad(true);
        try {
            await addDoc(collection(db,'facultySuggestions'), {
                ...sForm,
                suggestedBy: cu.displayName||cu.email||'Anonymous',
                suggestedByEmail: cu.email||'',
                suggestedByUid: cu.uid||'',
                status:'pending',
                createdAt:serverTimestamp(),
            });
            setSugDone(true); setSForm(initSug);
            setTimeout(()=>{setSugDone(false);setShowSug(false);}, 2500);
        } catch(err) { console.error(err); alert('Failed. Please try again.'); }
        setSugLoad(false);
    };

    const closeOverlay = () => { setSel(null); setShowSug(false); };

    return (
        <DashboardLayout>
            <div className="fd3" style={{opacity:mounted?1:0,transition:'opacity .35s'}}>

                {/* ══ HERO ══════════════════════════════════════════════ */}
                <div className="fd3-hero">
                    <div className="fd3-hero-inner">
                        <div className="fd3-hero-row">
                            <div>
                                <h1 className="fd3-h1">Faculty Directory</h1>
                                <p className="fd3-h1-sub">Find professors · courses · contact</p>
                            </div>
                            <div className="fd3-live">
                                <span className="fd3-live-dot"/>
                                <Users size={11}/> {list.length} members
                            </div>
                        </div>
                        <div className="fd3-hero-btns">
                            <button className="fd3-btn fd3-btn-ghost" onClick={()=>{setShowSug(true);setSugDone(false);}}>
                                <Lightbulb size={14}/> Suggest Faculty
                            </button>
                            {isAdmin && (
                                <button className="fd3-btn fd3-btn-primary" onClick={()=>{setShowF(!showF);setEditing(false);setForm(initFrm);}}>
                                    {showF ? <><X size={13}/> Cancel</> : <><Plus size={13}/> Add Faculty</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ ADMIN FORM ════════════════════════════════════════ */}
                {isAdmin && showF && (
                    <div className="fd3-form-wrap">
                        <p style={{margin:'0 0 1rem',fontWeight:700,fontSize:'.95rem',color:'#f1f5f9'}}>
                            {editing?'Edit Faculty':'Add New Faculty'}
                        </p>
                        <form onSubmit={save} style={{display:'grid',gap:'9px'}}>
                            <div className="fd3-fg2">
                                {[['Name *','name','Dr. Rajesh',true],['Designation *','designation','Assoc. Prof',true],
                                  ['Department','department','CSE',false],['Phone','phone','9876543210',false]].map(([l,k,p,r])=>(
                                    <div key={k}>
                                        <label className="fd3-lbl">{l}</label>
                                        <input className="fd3-inp" type="text" placeholder={p} required={r}
                                            value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>
                                    </div>
                                ))}
                            </div>
                            <div style={{background:'rgba(255,255,255,.025)',padding:'.9rem',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)'}}>
                                <label className="fd3-lbl" style={{display:'block',marginBottom:'8px'}}>Courses Taught</label>
                                <div style={{display:'flex',gap:'6px',marginBottom:'8px',flexWrap:'wrap'}}>
                                    <input className="fd3-inp" type="text" placeholder="Code e.g. CS101" value={tmpC.code}
                                        onChange={e=>setTmpC({...tmpC,code:e.target.value})} style={{flex:1,minWidth:'80px'}}/>
                                    <input className="fd3-inp" type="text" placeholder="Name e.g. Java" value={tmpC.name}
                                        onChange={e=>setTmpC({...tmpC,name:e.target.value})} style={{flex:2,minWidth:'120px'}}/>
                                    <button type="button" onClick={addC}
                                        style={{padding:'0 13px',background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:'9px',cursor:'pointer',color:'#fff',flexShrink:0}}>
                                        <Plus size={15}/>
                                    </button>
                                </div>
                                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                                    {form.courses?.map((c,i)=>(
                                        <span key={i} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'3px 9px',background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.22)',borderRadius:'7px',fontSize:'.77rem',color:'#a5b4fc'}}>
                                            <b>{c.code}</b> · {c.name}
                                            <X size={11} style={{cursor:'pointer',opacity:.55}} onClick={()=>remC(i)}/>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="fd3-sub" disabled={fLoad}>
                                {fLoad?'Saving...':(editing?'Update Faculty':'Save Faculty')}
                            </button>
                        </form>
                    </div>
                )}

                {/* ══ SEARCH & FILTERS ══════════════════════════════════ */}
                <div className="fd3-bar">
                    <div className="fd3-search">
                        <Search size={15} color="rgba(99,102,241,.5)"/>
                        <input placeholder="Search name, course, code..." value={search} onChange={e=>setSearch(e.target.value)}/>
                        {search && <X size={14} style={{cursor:'pointer',color:'rgba(148,163,184,.4)',flexShrink:0}} onClick={()=>setSearch('')}/>}
                    </div>
                    <div className="fd3-chips">
                        <Filter size={13} color="rgba(148,163,184,.3)" style={{flexShrink:0}}/>
                        {codes.map(c=>(
                            <button key={c} className={'fd3-chip '+(filter===c?'fd3-chip-on':'fd3-chip-off')} onClick={()=>setFilter(c)}>{c}</button>
                        ))}
                    </div>
                </div>

                {/* results count */}
                <div className="fd3-meta">
                    <span className="fd3-count">
                        {filtered.length} {filtered.length===1?'result':'results'}
                        {(search||filter!=='All')?' (filtered)':''}
                    </span>
                </div>

                {/* ══ GRID ══════════════════════════════════════════════ */}
                <div className="fd3-grid">
                    {filtered.length===0 ? (
                        <div className="fd3-empty">
                            <RefreshCcw size={32} style={{marginBottom:'10px',opacity:.22}}/>
                            <p style={{fontWeight:600,margin:'0 0 4px'}}>No faculty found</p>
                            <p style={{fontSize:'.8rem',margin:0}}>Try clearing search or filter</p>
                        </div>
                    ) : filtered.map((f,idx)=>(
                        <div key={f.id} className="fd3-card" style={{animationDelay:(idx*.04)+'s'}} onClick={()=>setSel(f)}>
                            <div className="fd3-card-bar" style={{background:grad(f.name)}}/>
                            <div className="fd3-card-inner">
                                <div className="fd3-card-top">
                                    <div className="fd3-av" style={{background:grad(f.name)}}>{ini(f.name)}</div>
                                    <div className="fd3-card-title">
                                        <p className="fd3-card-name">{f.name}</p>
                                        <p className="fd3-card-desig">{f.designation}</p>
                                    </div>
                                </div>
                                <div className="fd3-card-codes">
                                    {(f.courses||[]).slice(0,3).map((c,i)=><span key={i} className="fd3-code">{c.code}</span>)}
                                    {(f.courses?.length||0)>3 && <span className="fd3-code-more">+{f.courses.length-3}</span>}
                                </div>
                            </div>
                            <div className="fd3-card-foot">
                                <span className="fd3-dept">{f.department||'—'}</span>
                                <span className="fd3-more">View <ChevronRight size={12}/></span>
                            </div>
                            {isAdmin && (
                                <div className="fd3-abs-btns" onClick={e=>e.stopPropagation()}>
                                    <button className="fd3-ib" style={{background:'rgba(99,102,241,.18)',color:'#a5b4fc'}} onClick={()=>edit(f)}><Edit2 size={12}/></button>
                                    <button className="fd3-ib" style={{background:'rgba(239,68,68,.15)',color:'#fca5a5'}} onClick={()=>del(f.id)}><Trash2 size={12}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ══ DETAIL MODAL ══════════════════════════════════════ */}
                {sel && (
                    <div className="fd3-overlay" onClick={closeOverlay}>
                        <div className="fd3-modal" onClick={e=>e.stopPropagation()}>
                            <div className="fd3-modal-top" style={{background:grad(sel.name)}}/>
                            <button className="fd3-x" onClick={()=>setSel(null)}><X size={14}/></button>
                            <div className="fd3-modal-head">
                                <div className="fd3-modal-av" style={{background:grad(sel.name)}}>{ini(sel.name)}</div>
                                <h2 className="fd3-modal-name">{sel.name}</h2>
                                <p className="fd3-modal-desig">{sel.designation}</p>
                                {sel.department && <span className="fd3-modal-dept">{sel.department}</span>}
                            </div>
                            <div className="fd3-modal-body">
                                <div className="fd3-section">
                                    <div className="fd3-section-lbl" style={{color:'#38bdf8'}}><BookOpen size={12}/> Courses Taught</div>
                                    <div className="fd3-tags">
                                        {(sel.courses||[]).length>0
                                            ? sel.courses.map((c,i)=><span key={i} className="fd3-tag-c">{c.name}</span>)
                                            : <span style={{fontSize:'.8rem',color:'rgba(148,163,184,.3)'}}>None listed</span>}
                                    </div>
                                </div>
                                <div className="fd3-section">
                                    <div className="fd3-section-lbl" style={{color:'#fbbf24'}}><Code size={12}/> Course Codes</div>
                                    <div className="fd3-tags">
                                        {(sel.courses||[]).length>0
                                            ? sel.courses.map((c,i)=><span key={i} className="fd3-tag-k">{c.code}</span>)
                                            : <span style={{fontSize:'.8rem',color:'rgba(148,163,184,.3)'}}>None listed</span>}
                                    </div>
                                </div>
                                <div className="fd3-section">
                                    <div className="fd3-phone-row">
                                        <div className="fd3-phone-ico"><Phone size={15} color="#34d399"/></div>
                                        <div>
                                            <div className="fd3-phone-l">Phone</div>
                                            <div className="fd3-phone-v">{sel.phone||'Not available'}</div>
                                        </div>
                                    </div>
                                </div>
                                {sel.phone && (
                                    <button className="fd3-call" onClick={()=>window.location.href='tel:'+sel.phone}>
                                        <Phone size={15}/> Call Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ SUGGEST MODAL ═════════════════════════════════════ */}
                {showSug && (
                    <div className="fd3-overlay" onClick={()=>setShowSug(false)}>
                        <div className="fd3-suggest" onClick={e=>e.stopPropagation()}>
                            <button className="fd3-x" onClick={()=>setShowSug(false)}><X size={14}/></button>
                            <div className="fd3-sug-head">
                                <div className="fd3-sug-ico"><Lightbulb size={16} color="#34d399"/></div>
                                <div>
                                    <p style={{margin:0,fontWeight:700,fontSize:'.95rem',color:'#f1f5f9'}}>Suggest a Faculty</p>
                                    <p style={{margin:0,fontSize:'.73rem',color:'rgba(148,163,184,.45)'}}>Admin will review your suggestion</p>
                                </div>
                            </div>
                            {sugDone ? (
                                <div className="fd3-success">
                                    <div style={{fontSize:'3rem',marginBottom:'10px'}}>✅</div>
                                    <p style={{fontWeight:700,color:'#34d399',margin:'0 0 5px',fontSize:'1.05rem'}}>Submitted!</p>
                                    <p style={{color:'rgba(148,163,184,.45)',fontSize:'.84rem',margin:0}}>Admin will review it shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={submitSug} className="fd3-sug-body">
                                    <div className="fd3-fg2">
                                        {[['Name *','name',true,'Dr. Kumar'],['Designation','designation',false,'Professor'],
                                          ['Department','department',false,'CSE'],['Phone','phone',false,'9876543210']].map(([l,k,r,p])=>(
                                            <div key={k}>
                                                <label className="fd3-lbl">{l}</label>
                                                <input className="fd3-inp" type="text" required={r} placeholder={p}
                                                    value={sForm[k]} onChange={e=>setSForm({...sForm,[k]:e.target.value})}/>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="fd3-lbl">Courses Taught</label>
                                        <input className="fd3-inp" type="text" placeholder="e.g. Data Structures, OS"
                                            value={sForm.courses} onChange={e=>setSForm({...sForm,courses:e.target.value})}/>
                                    </div>
                                    <div>
                                        <label className="fd3-lbl">Why suggest? *</label>
                                        <textarea required rows={3} className="fd3-inp"
                                            placeholder="e.g. They teach Java but aren't listed..."
                                            value={sForm.reason} onChange={e=>setSForm({...sForm,reason:e.target.value})}
                                            style={{resize:'vertical',fontFamily:"'Inter',sans-serif"}}/>
                                    </div>
                                    <button type="submit" className="fd3-sug-btn" disabled={sugLoad}>
                                        {sugLoad?'Submitting...':'Submit Suggestion'}
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
