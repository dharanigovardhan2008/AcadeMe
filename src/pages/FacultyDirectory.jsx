import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Phone, BookOpen, Code, X, Plus,
    Trash2, Edit2, Filter, RefreshCcw, Lightbulb,
    ChevronDown, ChevronUp, Star, Users, TrendingUp, Mail
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import {
    collection, onSnapshot, addDoc, deleteDoc,
    updateDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

/* ─── one-time CSS injection ─────────────────────────────── */
function injectCSS() {
    if (document.getElementById('fd-glass-clean')) return;
    const el = document.createElement('style');
    el.id = 'fd-glass-clean';
    el.textContent = `
/* keyframes */
@keyframes fdUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes fdIn   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
@keyframes fdGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes fdSpin { to{transform:rotate(360deg)} }
@keyframes fdExpandIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

/* neon ring */
.fd-neon-ring {
    position:absolute; inset:-3px; border-radius:50%; z-index:0;
    animation:fdGlow 3s ease-in-out infinite;
}
.fd-av {
    position:relative; z-index:1; width:56px; height:56px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:1.2rem; font-weight:800; color:#fff;
    border:2px solid rgba(255,255,255,.15);
}

/* expand panel */
.fd-expand {
    overflow:hidden;
    transition:max-height .38s cubic-bezier(.4,0,.2,1), opacity .3s ease;
    max-height:0; opacity:0;
}
.fd-expand.open { max-height:600px; opacity:1; }
.fd-expand-inner {
    border-top:1px solid rgba(255,255,255,.07);
    padding:.85rem .1rem .2rem;
    display:grid; gap:.55rem;
    animation:fdExpandIn .3s ease both;
}

/* sentiment glow */
.fd-tag {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 11px; border-radius:20px; font-size:.72rem; font-weight:700;
    position:relative;
}
.fd-tag::before {
    content:''; position:absolute; inset:-1px; border-radius:20px;
    background:inherit; filter:blur(7px); opacity:.35; z-index:-1;
}

/* top-rated strip */
.fd-strip {
    display:flex; gap:.75rem; overflow-x:auto; scrollbar-width:none;
    padding-bottom:4px;
}
.fd-strip::-webkit-scrollbar { display:none; }
.fd-strip-card {
    flex-shrink:0; border-radius:16px; padding:.9rem .85rem;
    cursor:pointer; position:relative; overflow:hidden;
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.09);
    backdrop-filter:blur(14px);
    transition:transform .2s, border-color .2s;
    animation:fdUp .4s ease both;
    width:160px;
}
.fd-strip-card:hover { transform:translateY(-3px); border-color:rgba(99,102,241,.4); }

/* chip filter row */
.fd-chips {
    display:flex; gap:6px; overflow-x:auto; scrollbar-width:none;
    padding:2px 0; flex-wrap:nowrap; align-items:center;
}
.fd-chips::-webkit-scrollbar { display:none; }
.fd-chip {
    padding:6px 14px; border-radius:20px; border:1px solid; font-size:.75rem;
    font-weight:600; cursor:pointer; white-space:nowrap; transition:all .14s;
    flex-shrink:0; font-family:inherit; background:transparent;
}
.fd-chip-on  { background:rgba(59,130,246,.2); border-color:rgba(59,130,246,.5); color:#93c5fd; }
.fd-chip-off { border-color:rgba(255,255,255,.1); color:rgba(148,163,184,.55); }
.fd-chip-off:hover { background:rgba(255,255,255,.05); color:rgba(203,213,225,.75); }

/* detail row inside expand */
.fd-detail {
    display:flex; justify-content:space-between; align-items:center;
    padding:8px 10px; background:rgba(255,255,255,.04);
    border-radius:9px; border:1px solid rgba(255,255,255,.06);
}
.fd-dk { font-size:.7rem; color:rgba(148,163,184,.5); font-weight:600; }
.fd-dv { font-size:.8rem; color:#e2e8f0; font-weight:600; }

/* overlay */
.fd-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(0,0,0,.8); backdrop-filter:blur(12px);
    display:flex; align-items:center; justify-content:center;
    padding:1rem; animation:fdIn .18s ease both;
}

/* ghost input for forms */
.fd-inp {
    width:100%; padding:11px 13px; border-radius:12px; border:1px solid rgba(255,255,255,.1);
    background:rgba(0,0,0,.3); color:#e2e8f0; outline:none; font-family:inherit; font-size:.87rem;
    transition:border-color .18s;
}
.fd-inp:focus { border-color:rgba(59,130,246,.5); }
.fd-inp::placeholder { color:rgba(148,163,184,.28); }

/* section label */
.fd-sec {
    display:flex; align-items:center; gap:8px; margin-bottom:.85rem;
}
.fd-sec-ico {
    width:28px; height:28px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
}
.fd-sec-title { font-size:.82rem; font-weight:700; letter-spacing:.2px; }
.fd-sec-line { flex:1; height:1px; background:rgba(255,255,255,.06); }

/* ===================== RESPONSIVE ===================== */

/* Base grid — mobile first: 1 column */
.fd-grid {
    display:grid;
    grid-template-columns:1fr;
    gap:.85rem;
}

/* 2 columns from 480px */
@media (min-width:480px) {
    .fd-grid { grid-template-columns:repeat(2,1fr); gap:.9rem; }
    .fd-strip-card { width:170px; }
}

/* 3 columns from 840px */
@media (min-width:840px) {
    .fd-grid { grid-template-columns:repeat(3,1fr); gap:1rem; }
}

/* 4 columns from 1200px */
@media (min-width:1200px) {
    .fd-grid { grid-template-columns:repeat(4,1fr); }
}

/* Admin form grid */
.fd-form-row { display:grid; grid-template-columns:1fr; gap:.75rem; }
@media (min-width:540px) { .fd-form-row { grid-template-columns:1fr 1fr; } }

/* Search bar */
.fd-searchbar { display:flex; flex-direction:column; gap:.6rem; }
@media (min-width:500px) { .fd-searchbar { flex-direction:row; align-items:center; } }

/* hero title */
.fd-title { font-size:clamp(1.4rem,5vw,1.9rem); font-weight:800; margin:0 0 4px; letter-spacing:-.5px; }

/* top strip card width on tiny screens */
@media (max-width:360px) {
    .fd-strip-card { width:145px; padding:.75rem; }
    .fd-av { width:48px; height:48px; font-size:1rem; }
}

/* Modals: full-width bottom sheet on mobile */
.fd-modal { width:100%; max-width:480px; max-height:90vh; overflow-y:auto; position:relative; }
@media (max-width:520px) {
    .fd-overlay { align-items:flex-end; padding:0; }
    .fd-modal { max-height:88vh; border-radius:22px 22px 0 0 !important; max-width:100%; }
}
`;
    document.head.appendChild(el);
}

/* ─── helpers ─────────────────────────────────────────────── */
const GRADS = [
    ['#6366f1','#a855f7'], ['#ec4899','#f43f5e'], ['#10b981','#06b6d4'],
    ['#f59e0b','#ef4444'], ['#3b82f6','#6366f1'], ['#14b8a6','#0ea5e9'],
    ['#8b5cf6','#ec4899'], ['#f97316','#f59e0b'],
];
const avatarGrad = name => {
    const [a, b] = GRADS[(name?.charCodeAt(0) || 0) % GRADS.length];
    return `linear-gradient(135deg,${a},${b})`;
};
const ini = name => {
    const p = (name || '').trim().split(' ').filter(Boolean);
    return p.length >= 2
        ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
        : (p[0]?.[0] || '?').toUpperCase();
};

/* Sentiment: derived from real review data, not fake */
const TAGS = [
    { tag: 'Helpful',            emoji: '✨', bg: 'rgba(16,185,129,.14)',  b: 'rgba(16,185,129,.35)',  c: '#34d399' },
    { tag: 'Clear Explanations', emoji: '💡', bg: 'rgba(59,130,246,.14)',  b: 'rgba(59,130,246,.35)',  c: '#93c5fd' },
    { tag: 'Strict',             emoji: '⚡', bg: 'rgba(239,68,68,.13)',   b: 'rgba(239,68,68,.32)',   c: '#fca5a5' },
    { tag: 'Engaging',           emoji: '🔥', bg: 'rgba(245,158,11,.13)',  b: 'rgba(245,158,11,.32)',  c: '#fcd34d' },
    { tag: 'Student-Friendly',   emoji: '👍', bg: 'rgba(56,189,248,.13)',  b: 'rgba(56,189,248,.32)',  c: '#7dd3fc' },
    { tag: 'Practical',          emoji: '🛠️', bg: 'rgba(20,184,166,.13)',  b: 'rgba(20,184,166,.3)',   c: '#5eead4' },
    { tag: 'Well Regarded',      emoji: '🌟', bg: 'rgba(251,191,36,.12)',  b: 'rgba(251,191,36,.3)',   c: '#fbbf24' },
];
/* Derive sentiment from actual review texts */
const getSentiment = (reviewTexts = []) => {
    const blob = reviewTexts.join(' ').toLowerCase();
    if (blob.includes('helpful') || blob.includes('support'))    return TAGS[0];
    if (blob.includes('clear')   || blob.includes('explain'))    return TAGS[1];
    if (blob.includes('strict')  || blob.includes('tough'))      return TAGS[2];
    if (blob.includes('engag')   || blob.includes('interest'))   return TAGS[3];
    if (blob.includes('friend')  || blob.includes('approach'))   return TAGS[4];
    if (blob.includes('practial')|| blob.includes('lab'))        return TAGS[5];
    return TAGS[6];
};

const StarRow = ({ rating, size = 13 }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={size}
                fill={i <= Math.round(rating) ? '#fbbf24' : 'none'}
                color={i <= Math.round(rating) ? '#fbbf24' : 'rgba(148,163,184,.22)'}
                strokeWidth={1.5}
            />
        ))}
    </div>
);

/* ─── single faculty card ───────────────────────────────── */
const FCard = ({ f, isAdmin, onEdit, onDelete, fReviews }) => {
    const [open, setOpen] = useState(false);

    /* compute avg rating from REAL reviews */
    const avgRating = fReviews.length
        ? (fReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / fReviews.length).toFixed(1)
        : null;

    /* sentiment from REAL review text */
    const sent = getSentiment(fReviews.map(r => r.feedback || ''));

    const [gc1, gc2] = GRADS[(f.name?.charCodeAt(0) || 0) % GRADS.length];

    return (
        <GlassCard style={{ padding: 0, overflow: 'hidden', position: 'relative', animation: 'fdUp .4s ease both' }}>
            {/* top colour bar */}
            <div style={{ height: '3px', background: `linear-gradient(90deg,${gc1},${gc2})` }} />

            <div style={{ padding: '1.1rem 1.1rem .8rem' }}>

                {/* ── profile row ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', marginBottom: '.85rem' }}>
                    {/* neon avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div className="fd-neon-ring"
                            style={{ background: `conic-gradient(${gc1},${gc2},${gc1})`, filter: `blur(1px) drop-shadow(0 0 5px ${gc1}90)` }} />
                        <div className="fd-av" style={{ background: `linear-gradient(135deg,${gc1},${gc2})` }}>
                            {ini(f.name)}
                        </div>
                    </div>

                    {/* name + badge + stars */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '.95rem', color: '#f1f5f9', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {f.name}
                        </p>
                        <Badge variant="primary" style={{ marginBottom: '5px', fontSize: '.67rem' }}>
                            {f.department || 'Faculty'}
                        </Badge>
                        {/* Stars — real avg or "No reviews" */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                            {avgRating !== null ? (
                                <>
                                    <StarRow rating={Number(avgRating)} size={12} />
                                    <span style={{ fontSize: '.73rem', fontWeight: 700, color: '#fbbf24' }}>{avgRating}</span>
                                    <span style={{ fontSize: '.67rem', color: 'rgba(148,163,184,.4)' }}>({fReviews.length})</span>
                                </>
                            ) : (
                                <span style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.35)' }}>No reviews yet</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── sentiment tag (only when reviews exist) ── */}
                {fReviews.length > 0 && (
                    <div className="fd-tag"
                        style={{ background: sent.bg, border: `1px solid ${sent.b}`, color: sent.c, marginBottom: '.75rem' }}>
                        <span>{sent.emoji}</span> {sent.tag}
                    </div>
                )}

                {/* ── designation ── */}
                {f.designation && (
                    <p style={{ fontSize: '.76rem', color: 'rgba(148,163,184,.5)', margin: '0 0 .5rem', lineHeight: '1.4' }}>
                        {f.designation}
                    </p>
                )}

                {/* ── course code pills ── */}
                {(f.courses || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '.65rem' }}>
                        {f.courses.slice(0, 3).map((c, i) => (
                            <Badge key={i} variant="primary" style={{ fontSize: '.67rem' }}>{c.code}</Badge>
                        ))}
                        {f.courses.length > 3 && (
                            <span style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.4)', alignSelf: 'center' }}>
                                +{f.courses.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* ── EXPAND PANEL ── */}
                <div className={`fd-expand ${open ? 'open' : ''}`}>
                    <div className="fd-expand-inner">

                        {/* courses taught */}
                        {(f.courses || []).length > 0 && (
                            <div>
                                <p style={{ fontSize: '.67rem', fontWeight: 700, color: 'rgba(56,189,248,.65)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <BookOpen size={11} /> Courses Taught
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {f.courses.map((c, i) => (
                                        <span key={i} style={{ padding: '4px 9px', borderRadius: '8px', fontSize: '.72rem', background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.18)', color: '#7dd3fc' }}>
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* course codes */}
                        {(f.courses || []).length > 0 && (
                            <div>
                                <p style={{ fontSize: '.67rem', fontWeight: 700, color: 'rgba(251,191,36,.6)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Code size={11} /> Course Codes
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {f.courses.map((c, i) => (
                                        <span key={i} style={{ padding: '4px 9px', borderRadius: '8px', fontSize: '.71rem', fontWeight: 700, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', color: '#fbbf24' }}>
                                            {c.code}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* phone */}
                        {f.phone && (
                            <div className="fd-detail">
                                <span className="fd-dk" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Phone size={11} /> Phone
                                </span>
                                <span className="fd-dv">{f.phone}</span>
                            </div>
                        )}

                        {/* latest review snippet — real data */}
                        {fReviews[0]?.feedback && (
                            <div style={{ padding: '9px 11px', background: 'rgba(255,255,255,.03)', borderRadius: '9px', border: '1px solid rgba(255,255,255,.05)' }}>
                                <p style={{ fontSize: '.67rem', fontWeight: 700, color: 'rgba(148,163,184,.4)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Star size={10} /> Latest Review
                                </p>
                                <p style={{ fontSize: '.77rem', color: 'rgba(203,213,225,.7)', margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>
                                    &ldquo;{fReviews[0].feedback.slice(0, 130)}{fReviews[0].feedback.length > 130 ? '…' : ''}&rdquo;
                                </p>
                            </div>
                        )}

                        {/* call button */}
                        {f.phone && (
                            <GlassButton
                                variant="gradient"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '2px' }}
                                onClick={() => window.location.href = `tel:${f.phone}`}
                            >
                                <Phone size={14} /> Call Now
                            </GlassButton>
                        )}
                    </div>
                </div>
            </div>

            {/* ── card footer ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem 1.1rem', background: 'rgba(0,0,0,.18)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <span style={{ fontSize: '.67rem', color: 'rgba(148,163,184,.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px' }}>
                    {f.department || '—'}
                </span>
                <button
                    onClick={() => setOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.04)', cursor: 'pointer', fontSize: '.71rem', fontWeight: 700, color: 'rgba(148,163,184,.65)', fontFamily: 'inherit', transition: 'all .14s' }}
                >
                    {open ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details</>}
                </button>
            </div>

            {/* admin edit/delete */}
            {isAdmin && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 5 }}>
                    <button onClick={e => { e.stopPropagation(); onEdit(f); }}
                        style={{ width: '26px', height: '26px', borderRadius: '7px', border: 'none', background: 'rgba(99,102,241,.18)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Edit2 size={12} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(f.id); }}
                        style={{ width: '26px', height: '26px', borderRadius: '7px', border: 'none', background: 'rgba(239,68,68,.15)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                    </button>
                </div>
            )}
        </GlassCard>
    );
};

/* ─── suggest modal ─────────────────────────────────────── */
const SuggestModal = ({ onClose }) => {
    const [form, setForm] = useState({ name: '', designation: '', department: '', phone: '', courses: '', reason: '' });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const cu = auth.currentUser;

    const submit = async e => {
        e.preventDefault();
        if (!cu) { alert('Please log in to suggest a faculty.'); return; }
        setLoading(true);
        try {
            await addDoc(collection(db, 'facultySuggestions'), {
                ...form,
                suggestedBy: cu.displayName || cu.email || 'Anonymous',
                suggestedByEmail: cu.email || '',
                suggestedByUid: cu.uid || '',
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setDone(true);
            setTimeout(() => onClose(), 2200);
        } catch (err) { console.error(err); alert('Failed. Try again.'); }
        setLoading(false);
    };

    return (
        <div className="fd-overlay" onClick={onClose}>
            <div className="fd-modal" onClick={e => e.stopPropagation()}>
                <GlassCard style={{ borderColor: 'rgba(52,211,153,.2)' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(148,163,184,.6)' }}>
                        <X size={14} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.1rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(52,211,153,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Lightbulb size={16} color="#34d399" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '.94rem', color: '#f1f5f9' }}>Suggest a Faculty</p>
                            <p style={{ margin: 0, fontSize: '.72rem', color: 'rgba(148,163,184,.45)' }}>Admin will review your suggestion</p>
                        </div>
                    </div>

                    {done ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                            <p style={{ fontWeight: 700, color: '#34d399', margin: '0 0 5px' }}>Submitted!</p>
                            <p style={{ color: 'rgba(148,163,184,.45)', fontSize: '.82rem', margin: 0 }}>Admin will review it shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit} style={{ display: 'grid', gap: '9px' }}>
                            <div className="fd-form-row">
                                <div>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>Faculty Name *</label>
                                    <input required className="fd-inp" placeholder="Dr. Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>Designation</label>
                                    <input className="fd-inp" placeholder="Professor" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>Department</label>
                                    <input className="fd-inp" placeholder="CSE" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>Phone</label>
                                    <input className="fd-inp" placeholder="9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>Courses</label>
                                <input className="fd-inp" placeholder="e.g. Data Structures, OS" value={form.courses} onChange={e => setForm({ ...form, courses: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>Why suggest? *</label>
                                <textarea required rows={3} className="fd-inp" placeholder="They teach Java but aren't listed here..."
                                    value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <GlassButton type="submit" variant="gradient" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                {loading ? 'Submitting…' : 'Submit Suggestion'}
                            </GlassButton>
                        </form>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

/* ─── main page ─────────────────────────────────────────── */
const FacultyDirectory = () => {
    const [facultyList, setFacultyList] = useState([]);
    const [reviews,     setReviews]     = useState([]);
    const [search,      setSearch]      = useState('');
    const [deptFilter,  setDeptFilter]  = useState('All');
    const [showForm,    setShowForm]    = useState(false);
    const [loading,     setLoading]     = useState(false);
    const [isEditing,   setIsEditing]   = useState(false);
    const [editId,      setEditId]      = useState(null);
    const [showSuggest, setShowSuggest] = useState(false);
    const [mounted,     setMounted]     = useState(false);

    const initForm = { name: '', designation: '', department: 'CSE', phone: '', courses: [] };
    const [formData, setFormData] = useState(initForm);
    const [tmpCourse, setTmpCourse] = useState({ name: '', code: '' });

    const cu = auth.currentUser;
    const isAdmin = cu?.email?.toLowerCase() === 'palerugopi2008@gmail.com';

    useEffect(() => { injectCSS(); setMounted(true); }, []);

    /* realtime faculty */
    useEffect(() => {
        const q = query(collection(db, 'faculty'), orderBy('name'));
        return onSnapshot(q, snap => setFacultyList(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    /* realtime reviews — to compute real ratings + sentiments */
    useEffect(() => {
        const q = query(collection(db, 'facultyReviews'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    /* unique depts from real faculty data */
    const DEPTS = useMemo(() => {
        const d = new Set(facultyList.map(f => f.department).filter(Boolean));
        return ['All', ...d].sort();
    }, [facultyList]);

    /* unique course codes for filter chips */
    const CODES = useMemo(() => {
        const c = facultyList.flatMap(f => (f.courses || []).map(x => x.code));
        return ['All', ...new Set(c.filter(Boolean))].sort();
    }, [facultyList]);

    /* top-rated from REAL reviews this week */
    const topRated = useMemo(() => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const map = {};
        reviews.forEach(r => {
            const t = r.createdAt?.toDate?.()?.getTime?.() || 0;
            if (t < weekAgo) return;
            const k = r.facultyName;
            if (!k) return;
            if (!map[k]) map[k] = { name: k, dept: r.department || '', ratings: [] };
            map[k].ratings.push(Number(r.rating) || 0);
        });
        const ranked = Object.values(map)
            .filter(x => x.ratings.length >= 1)
            .map(x => ({ ...x, avg: x.ratings.reduce((a, b) => a + b, 0) / x.ratings.length, count: x.ratings.length }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 8);

        /* fallback: all-time top if no recent reviews */
        if (ranked.length < 2) {
            const all = {};
            reviews.forEach(r => {
                const k = r.facultyName; if (!k) return;
                if (!all[k]) all[k] = { name: k, dept: r.department || '', ratings: [] };
                all[k].ratings.push(Number(r.rating) || 0);
            });
            return Object.values(all)
                .filter(x => x.ratings.length >= 1)
                .map(x => ({ ...x, avg: x.ratings.reduce((a, b) => a + b, 0) / x.ratings.length, count: x.ratings.length }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 8);
        }
        return ranked;
    }, [reviews]);

    /* filtered faculty list */
    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        return facultyList.filter(f => {
            const matchDept = deptFilter === 'All' || f.department === deptFilter;
            const matchSearch = !s ||
                (f.name?.toLowerCase() || '').includes(s) ||
                (f.designation?.toLowerCase() || '').includes(s) ||
                (f.courses || []).some(c =>
                    (c.name?.toLowerCase() || '').includes(s) ||
                    (c.code?.toLowerCase() || '').includes(s)
                );
            return matchDept && matchSearch;
        });
    }, [facultyList, search, deptFilter]);

    /* reviews keyed by faculty name */
    const reviewsByFaculty = useMemo(() => {
        const map = {};
        reviews.forEach(r => {
            if (!r.facultyName) return;
            if (!map[r.facultyName]) map[r.facultyName] = [];
            map[r.facultyName].push(r);
        });
        return map;
    }, [reviews]);

    /* CRUD */
    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try {
            if (isEditing && editId) await updateDoc(doc(db, 'faculty', editId), formData);
            else await addDoc(collection(db, 'faculty'), formData);
            setFormData(initForm); setTmpCourse({ name: '', code: '' });
            setShowForm(false); setIsEditing(false); setEditId(null);
        } catch (err) { console.error(err); }
        setLoading(false);
    };
    const handleDelete = async id => {
        if (!window.confirm('Delete this faculty member?')) return;
        await deleteDoc(doc(db, 'faculty', id));
    };
    const handleEdit = f => {
        setFormData({ ...initForm, ...f }); setEditId(f.id); setIsEditing(true);
        setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const addCourse = () => {
        if (tmpCourse.name && tmpCourse.code) {
            setFormData({ ...formData, courses: [...(formData.courses || []), tmpCourse] });
            setTmpCourse({ name: '', code: '' });
        }
    };
    const remCourse = i => setFormData({ ...formData, courses: formData.courses.filter((_, idx) => idx !== i) });

    return (
        <DashboardLayout>
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity .35s' }}>

                {/* ══ HEADER ══ */}
                <GlassCard style={{ marginBottom: '1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.85rem', marginBottom: '1.1rem' }}>
                        <div>
                            <h1 className="fd-title" style={{ color: '#f1f5f9' }}>Faculty Directory</h1>
                            <p style={{ margin: 0, color: 'rgba(148,163,184,.5)', fontSize: '.85rem' }}>
                                Find professors · courses · contact info
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* live count */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', color: '#93c5fd', fontSize: '.72rem', fontWeight: 700 }}>
                                <Users size={11} /> {facultyList.length} faculty
                            </div>
                            <GlassButton onClick={() => setShowSuggest(true)} style={{ fontSize: '.8rem', gap: '5px', padding: '8px 14px' }}>
                                <Lightbulb size={13} /> Suggest
                            </GlassButton>
                            {isAdmin && (
                                <GlassButton variant="gradient" onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData(initForm); }} style={{ fontSize: '.8rem', gap: '5px', padding: '8px 14px' }}>
                                    {showForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add</>}
                                </GlassButton>
                            )}
                        </div>
                    </div>

                    {/* glass search bar */}
                    <div className="fd-searchbar" style={{ marginBottom: '1rem' }}>
                        <GlassInput
                            icon={Search}
                            placeholder="Search name, course, code…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ margin: 0, flex: 1, minWidth: 0 }}
                        />
                        {search && (
                            <GlassButton onClick={() => setSearch('')} style={{ padding: '8px 12px', fontSize: '.8rem', flexShrink: 0 }}>
                                <X size={13} />
                            </GlassButton>
                        )}
                    </div>

                    {/* department filter chips */}
                    <div className="fd-chips">
                        <Filter size={13} color="rgba(148,163,184,.35)" style={{ flexShrink: 0 }} />
                        {DEPTS.map(d => (
                            <button key={d} className={'fd-chip ' + (deptFilter === d ? 'fd-chip-on' : 'fd-chip-off')}
                                onClick={() => setDeptFilter(d)}>
                                {d}
                            </button>
                        ))}
                    </div>
                </GlassCard>

                {/* ══ ADMIN FORM ══ */}
                {isAdmin && showForm && (
                    <GlassCard style={{ marginBottom: '1.1rem', borderColor: 'rgba(99,102,241,.22)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '.97rem', color: '#f1f5f9' }}>
                            {isEditing ? 'Edit Faculty' : 'Add New Faculty'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '9px' }}>
                            <div className="fd-form-row">
                                {[['Name *', 'name', 'Dr. Rajesh Kumar', true], ['Designation *', 'designation', 'Assoc. Professor', true],
                                  ['Department', 'department', 'CSE', false], ['Phone', 'phone', '9876543210', false]].map(([l, k, p, r]) => (
                                    <div key={k}>
                                        <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.42)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '5px' }}>{l}</label>
                                        <input className="fd-inp" type="text" placeholder={p} required={r}
                                            value={formData[k]} onChange={e => setFormData({ ...formData, [k]: e.target.value })} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,.03)', padding: '10px', borderRadius: '11px', border: '1px solid rgba(255,255,255,.06)' }}>
                                <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(148,163,184,.4)', textTransform: 'uppercase', letterSpacing: '.9px', display: 'block', marginBottom: '8px' }}>Courses Taught</label>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <input className="fd-inp" type="text" placeholder="Code e.g. CS101" value={tmpCourse.code}
                                        onChange={e => setTmpCourse({ ...tmpCourse, code: e.target.value })} style={{ flex: 1, minWidth: '80px' }} />
                                    <input className="fd-inp" type="text" placeholder="Name e.g. Java" value={tmpCourse.name}
                                        onChange={e => setTmpCourse({ ...tmpCourse, name: e.target.value })} style={{ flex: 2, minWidth: '110px' }} />
                                    <button type="button" onClick={addCourse}
                                        style={{ padding: '0 13px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '9px', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {formData.courses?.map((c, i) => (
                                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)', borderRadius: '7px', fontSize: '.75rem', color: '#a5b4fc' }}>
                                            <b>{c.code}</b> · {c.name}
                                            <X size={11} style={{ cursor: 'pointer', opacity: .55 }} onClick={() => remCourse(i)} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <GlassButton type="submit" variant="gradient" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                {loading ? 'Saving…' : (isEditing ? 'Update Faculty' : 'Save Faculty')}
                            </GlassButton>
                        </form>
                    </GlassCard>
                )}

                {/* ══ TOP RATED THIS WEEK ══ (only shown when real data exists) */}
                {topRated.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="fd-sec">
                            <div className="fd-sec-ico" style={{ background: 'rgba(245,158,11,.13)' }}>
                                <TrendingUp size={14} color="#fbbf24" />
                            </div>
                            <span className="fd-sec-title" style={{ color: '#fbbf24' }}>Top Rated This Week</span>
                            <div className="fd-sec-line" />
                            <span style={{ fontSize: '.67rem', color: 'rgba(148,163,184,.3)', whiteSpace: 'nowrap' }}>Tap to search</span>
                        </div>
                        <div className="fd-strip">
                            {topRated.map((f, i) => {
                                const [gc1, gc2] = GRADS[(f.name?.charCodeAt(0) || 0) % GRADS.length];
                                return (
                                    <div key={f.name} className="fd-strip-card" style={{ animationDelay: (i * .06) + 's' }}
                                        onClick={() => setSearch(f.name)}>
                                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '.65rem' }}>
                                            <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: `conic-gradient(${gc1},${gc2},${gc1})`, filter: 'blur(1px)', animation: 'fdGlow 2.5s ease-in-out infinite' }} />
                                            <div style={{ position: 'relative', zIndex: 1, width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg,${gc1},${gc2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '.95rem', border: '2px solid rgba(255,255,255,.15)' }}>
                                                {ini(f.name)}
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', zIndex: 2, width: '17px', height: '17px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', fontSize: '.57rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' }}>
                                                {i + 1}
                                            </div>
                                        </div>
                                        <p style={{ fontWeight: 700, fontSize: '.79rem', color: '#f1f5f9', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                                        <p style={{ fontSize: '.67rem', color: 'rgba(148,163,184,.45)', margin: '0 0 6px' }}>{f.dept || 'Faculty'} · {f.count} review{f.count > 1 ? 's' : ''}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <StarRow rating={f.avg} size={11} />
                                            <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#fbbf24', marginLeft: '3px' }}>{f.avg.toFixed(1)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ══ RESULTS COUNT + GRID ══ */}
                <div className="fd-sec" style={{ marginBottom: '.75rem' }}>
                    <div className="fd-sec-ico" style={{ background: 'rgba(99,102,241,.13)' }}>
                        <Users size={14} color="#a5b4fc" />
                    </div>
                    <span className="fd-sec-title" style={{ color: '#a5b4fc' }}>
                        {filtered.length} {filtered.length === 1 ? 'Result' : 'Results'}
                        {(search || deptFilter !== 'All') ? ' · Filtered' : ''}
                    </span>
                    <div className="fd-sec-line" />
                </div>

                <div className="fd-grid">
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 1rem', color: 'rgba(148,163,184,.3)' }}>
                            <RefreshCcw size={32} style={{ marginBottom: '10px', opacity: .2 }} />
                            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No faculty found</p>
                            <p style={{ fontSize: '.82rem', margin: 0 }}>Try clearing search or filter</p>
                        </div>
                    ) : filtered.map((f, idx) => (
                        <FCard
                            key={f.id}
                            f={f}
                            idx={idx}
                            isAdmin={isAdmin}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            fReviews={reviewsByFaculty[f.name] || []}
                        />
                    ))}
                </div>

                {/* ══ SUGGEST MODAL ══ */}
                {showSuggest && <SuggestModal onClose={() => setShowSuggest(false)} />}

            </div>
        </DashboardLayout>
    );
};

export default FacultyDirectory;
