import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Phone, User, X, Plus, Trash2, Edit2, Code, Filter, RefreshCcw, Star } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

/* ✅ UNIFORM COLOR (NEW) */
const UNIFORM_GRADIENT = ['#3B82F6', '#8B5CF6'];

/* ── inject card styles once ─────────────────────────────── */
(function () {
    if (document.getElementById('fd-card-style')) return;
    const s = document.createElement('style');
    s.id = 'fd-card-style';
    s.textContent = `

/* ✅ UPDATED GRID (MOBILE FIX) */
.fd-grid {
    display:grid;
    grid-template-columns:repeat(1, 1fr);
    gap:.9rem;
}
@media (min-width:480px) {
    .fd-grid { grid-template-columns:repeat(2, 1fr); }
}
@media (min-width:768px) {
    .fd-grid { grid-template-columns:repeat(3, 1fr); }
}
@media (min-width:1024px) {
    .fd-grid { grid-template-columns:repeat(4, 1fr); }
}
@media (min-width:1280px) {
    .fd-grid { grid-template-columns:repeat(5, 1fr); }
}

/* keep your existing styles unchanged below */
@keyframes fdGlow { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes fdUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes fdIn   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

.fd-av-ring { position:absolute; inset:-3px; border-radius:50%; z-index:0; animation:fdGlow 3s ease-in-out infinite; }
.fd-av-inner {
    position:relative; z-index:1;
    width:64px; height:64px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:1.4rem; font-weight:800; color:#fff;
    border:2px solid rgba(255,255,255,.18);
}

.fd-card {
    border-radius:16px; cursor:pointer; position:relative;
    transition:transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
    animation:fdUp .4s ease both;
    text-align:center;
}
.fd-card:hover { transform:translateY(-5px) scale(1.025); }

.fd-chips { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding:2px 0; }
.fd-chips::-webkit-scrollbar { display:none; }

.fd-overlay {
    position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.82);
    backdrop-filter:blur(10px); display:flex; align-items:center;
    justify-content:center; padding:1rem; animation:fdIn .18s ease both;
}

.fd-modal { width:100%; max-width:500px; max-height:90vh; overflow-y:auto; }

`;
    document.head.appendChild(s);
}());

const getInitials = name => {
    const p = (name || '').trim().split(' ').filter(Boolean);
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

const StarRating = ({ rating, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '6px' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={14}
                fill={i <= Math.round(rating) ? '#FBBF24' : 'none'}
                color={i <= Math.round(rating) ? '#FBBF24' : 'rgba(148,163,184,.2)'} />
        ))}
    </div>
);

const FacultyDirectory = () => {
    const [facultyList, setFacultyList] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'faculty'), orderBy('name'));
        const unsubscribe = onSnapshot(q, snapshot => {
            setFacultyList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    const filtered = facultyList.filter(f =>
        f.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div>

                {/* HEADER */}
                <GlassCard style={{ marginBottom: '1rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        rowGap: '0.5rem' /* ✅ FIX */
                    }}>
                        <h1>Faculty Directory</h1>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <GlassInput
                            icon={Search}
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </GlassCard>

                {/* GRID */}
                <div className="fd-grid">
                    {filtered.map(f => {
                        const [gc1, gc2] = UNIFORM_GRADIENT; /* ✅ FIX */

                        return (
                            <div key={f.id} className="fd-card"
                                onClick={() => setSelectedFaculty(f)}>
                                <GlassCard style={{
                                    padding: 'clamp(0.8rem, 2vw, 1.25rem)', /* ✅ FIX */
                                    textAlign: 'center'
                                }}>
                                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                                        <div className="fd-av-ring"
                                            style={{ background: `conic-gradient(${gc1}, ${gc2}, ${gc1})` }} />
                                        <div className="fd-av-inner"
                                            style={{ background: `linear-gradient(135deg,${gc1},${gc2})` }}>
                                            {getInitials(f.name)}
                                        </div>
                                    </div>

                                    <p style={{ fontWeight: 'bold' }}>{f.name}</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                        {f.designation}
                                    </p>
                                </GlassCard>
                            </div>
                        );
                    })}
                </div>

                {/* MODAL */}
                {selectedFaculty && (
                    <div className="fd-overlay" onClick={() => setSelectedFaculty(null)}>
                        <div className="fd-modal" onClick={e => e.stopPropagation()}>
                            <GlassCard>
                                <h2>{selectedFaculty.name}</h2>
                                <p>{selectedFaculty.designation}</p>
                            </GlassCard>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FacultyDirectory;
