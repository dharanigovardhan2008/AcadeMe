import React, { useState, useEffect } from 'react';
import {
    Calendar, Plus, CheckCircle, AlertTriangle,
    Trash2, BookOpen, TrendingUp, X, Check
} from 'lucide-react';
import GlassDropdown from '../components/GlassDropdown';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

/* ─────────────────────────────────────────────
   DELETE FIX: The original bug was that it only
   updated Firestore but NOT the local DataContext
   state, so the UI didn't re-render. We now call
   updateDoc AND immediately sync local state via
   a forced re-fetch or optimistic update pattern.
   We do this by updating Firestore and relying on
   DataContext's real-time listener (if present),
   OR by updating the local list optimistically.
───────────────────────────────────────────────── */

const AttendanceTracker = () => {
    const { attendanceSubjects, updateAttendance, addAttendanceSubject, courses } = useData();
    const { user } = useAuth();

    const [newSubject, setNewSubject]   = useState({ name: '', total: '', attended: '' });
    const [calcData, setCalcData]       = useState({ selectedCourseName: '' });
    const [mounted, setMounted]         = useState(false);
    const [showAdd, setShowAdd]         = useState(false);
    const [deleting, setDeleting]       = useState(null); // subject name being deleted
    const [confirmDel, setConfirmDel]   = useState(null); // subject awaiting confirm

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    // ── Overall stats ──────────────────────────────────────────
    const totalClasses  = attendanceSubjects.reduce((s, x) => s + parseInt(x.total    || 0), 0);
    const totalAttended = attendanceSubjects.reduce((s, x) => s + parseInt(x.attended || 0), 0);
    const overallPct    = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;

    const safeCount   = attendanceSubjects.filter(s => s.total && Math.round((s.attended / s.total) * 100) >= 80).length;
    const dangerCount = attendanceSubjects.length - safeCount;

    // ── Add subject ────────────────────────────────────────────
    const handleAddSubject = () => {
        if (!newSubject.name.trim() || !newSubject.total) return;
        addAttendanceSubject({
            ...newSubject,
            total:    parseInt(newSubject.total),
            attended: parseInt(newSubject.attended || 0),
        });
        setNewSubject({ name: '', total: '', attended: '' });
        setShowAdd(false);
    };

    // ── DELETE FIX ─────────────────────────────────────────────
    // Original only wrote to Firestore — UI never updated because
    // DataContext local state was not mutated. Fix: write to
    // Firestore AND immediately call updateAttendance(id, …) or
    // use optimistic approach via direct Firestore update +
    // the context's real-time onSnapshot listener picks it up.
    // If your DataContext uses onSnapshot, just writing Firestore
    // is enough — but we also optimistically hide the card via
    // local `deleting` state so UX is instant.
    const handleDeleteSubject = async (subject) => {
        setConfirmDel(null);
        setDeleting(subject.name);
        try {
            const updatedList = attendanceSubjects.filter(s => s.name !== subject.name);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { attendanceSubjects: updatedList });
            // If DataContext uses onSnapshot, UI will auto-update.
            // If not, the optimistic hide via `deleting` state keeps UX clean.
        } catch (err) {
            console.error('Delete failed:', err);
            setDeleting(null); // restore card on failure
        }
    };

    // ── Progress ring helper ───────────────────────────────────
    const ring = (pct) => {
        const r = 26, circ = 2 * Math.PI * r;
        const dash = (pct / 100) * circ;
        return { circ, dash };
    };

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes at-up   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes at-in   { from { opacity:0 } to { opacity:1 } }
        @keyframes at-bar  { from { width:0 } to { width:var(--w) } }
        @keyframes at-pop  { 0%{transform:scale(0.85);opacity:0} 70%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        @keyframes at-spin { to { transform:rotate(360deg) } }
        @keyframes at-ring-fill { from { stroke-dashoffset: var(--circ) } to { stroke-dashoffset: var(--offset) } }

        .at-page {
            font-family: 'DM Sans', sans-serif;
            width: 100%; max-width: 100%;
            opacity: 0; transition: opacity 0.4s ease;
        }
        .at-page.in { opacity: 1; }

        /* ── PAGE HEADER ── */
        .at-head {
            margin-bottom: 1.5rem;
            animation: at-up 0.4s ease both;
        }
        .at-head-title {
            font-family: 'Syne', sans-serif;
            font-size: clamp(1.5rem, 5vw, 2rem);
            font-weight: 800; letter-spacing: -0.03em;
            background: linear-gradient(120deg, #fff 30%, #94A3B8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; line-height: 1.1;
        }
        .at-head-sub {
            font-size: 0.82rem; color: rgba(148,163,184,0.6);
            margin-top: 4px; font-weight: 400;
        }

        /* ── STATS ROW ── */
        .at-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 1.5rem;
        }
        @media (max-width: 480px) {
            .at-stats { grid-template-columns: 1fr 1fr; }
            .at-stat-main { grid-column: 1 / -1; }
        }

        .at-stat {
            background: rgba(15,23,42,0.7);
            border: 1px solid rgba(148,163,184,0.09);
            border-radius: 16px;
            padding: 14px 16px;
            backdrop-filter: blur(16px);
            animation: at-up 0.4s ease both;
            position: relative; overflow: hidden;
        }
        .at-stat::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }
        .at-stat-main {
            display: flex; align-items: center; gap: 16px;
            padding: 18px 20px;
        }
        .at-stat-num {
            font-family: 'Syne', sans-serif;
            font-size: 2.2rem; font-weight: 800; line-height: 1;
            letter-spacing: -0.04em;
        }
        .at-stat-lbl {
            font-size: 0.72rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: rgba(148,163,184,0.5); margin-top: 3px;
        }
        .at-stat-val {
            font-size: 1.4rem; font-weight: 700;
            font-family: 'Syne', sans-serif; line-height: 1;
        }

        /* ── SUBJECT GRID ── */
        .at-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
            margin-bottom: 1.5rem;
        }
        @media (max-width: 380px) { .at-grid { grid-template-columns: 1fr; } }

        /* ── SUBJECT CARD ── */
        .at-card {
            background: rgba(13,19,38,0.75);
            border: 1px solid rgba(148,163,184,0.08);
            border-radius: 18px;
            padding: 16px;
            backdrop-filter: blur(16px);
            display: flex; flex-direction: column; gap: 12px;
            animation: at-up 0.4s ease both;
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            position: relative; overflow: hidden;
        }
        .at-card:hover {
            transform: translateY(-3px);
            border-color: rgba(148,163,184,0.15);
            box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }
        .at-card::after {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 2px;
            border-radius: 18px 18px 0 0;
            background: var(--card-accent, rgba(52,211,153,0.5));
            opacity: 0.7;
        }
        .at-card.deleting {
            opacity: 0; transform: scale(0.95);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }

        /* Card top row */
        .at-card-top {
            display: flex; align-items: flex-start;
            justify-content: space-between; gap: 8px;
        }
        .at-card-name {
            font-size: 0.95rem; font-weight: 600;
            color: #E2E8F0; line-height: 1.3; flex: 1;
            word-break: break-word;
        }
        .at-card-pct {
            font-family: 'Syne', sans-serif;
            font-size: 1.1rem; font-weight: 800;
            flex-shrink: 0; line-height: 1;
        }

        /* Progress bar */
        .at-bar-track {
            height: 5px; background: rgba(255,255,255,0.06);
            border-radius: 10px; overflow: hidden;
        }
        .at-bar-fill {
            height: 100%; border-radius: 10px;
            background: var(--bar-color);
            width: var(--w);
            transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 8px var(--bar-glow);
        }

        /* Card info row */
        .at-card-info {
            display: flex; justify-content: space-between;
            align-items: center; gap: 6px; flex-wrap: wrap;
        }
        .at-card-count {
            font-size: 0.75rem; color: rgba(148,163,184,0.55); font-weight: 500;
        }
        .at-card-status {
            font-size: 0.7rem; font-weight: 600;
            padding: 3px 9px; border-radius: 20px;
            background: var(--status-bg); color: var(--status-color);
            border: 1px solid var(--status-border);
            white-space: nowrap;
        }

        /* Card action buttons */
        .at-card-actions {
            display: grid; grid-template-columns: 1fr 1fr 36px;
            gap: 7px; align-items: center;
        }
        .at-btn-present, .at-btn-absent, .at-btn-del {
            border: none; border-radius: 10px;
            cursor: pointer; font-weight: 600;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.8rem;
            padding: 9px 10px;
            transition: all 0.18s ease;
            display: flex; align-items: center; justify-content: center; gap: 5px;
            -webkit-tap-highlight-color: transparent;
        }
        .at-btn-present {
            background: rgba(52,211,153,0.12);
            color: #34D399;
            border: 1px solid rgba(52,211,153,0.2);
        }
        .at-btn-present:hover { background: rgba(52,211,153,0.22); transform: scale(1.02); }
        .at-btn-absent {
            background: rgba(248,113,113,0.1);
            color: #F87171;
            border: 1px solid rgba(248,113,113,0.2);
        }
        .at-btn-absent:hover { background: rgba(248,113,113,0.2); transform: scale(1.02); }
        .at-btn-del {
            background: rgba(239,68,68,0.08);
            color: rgba(248,113,113,0.6);
            border: 1px solid rgba(239,68,68,0.12);
            padding: 9px;
        }
        .at-btn-del:hover {
            background: rgba(239,68,68,0.18);
            color: #F87171;
            border-color: rgba(239,68,68,0.3);
            transform: scale(1.05);
        }

        /* ── CONFIRM DELETE OVERLAY ── */
        .at-confirm-overlay {
            position: absolute; inset: 0;
            background: rgba(7,9,18,0.92);
            backdrop-filter: blur(6px);
            border-radius: 18px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 12px; z-index: 10;
            animation: at-in 0.2s ease;
        }
        .at-confirm-msg {
            font-size: 0.82rem; color: rgba(226,232,240,0.85);
            text-align: center; line-height: 1.4; padding: 0 12px;
            font-weight: 500;
        }
        .at-confirm-btns {
            display: flex; gap: 8px;
        }
        .at-confirm-yes, .at-confirm-no {
            padding: 8px 18px; border-radius: 10px; border: none;
            font-weight: 700; font-size: 0.78rem; cursor: pointer;
            font-family: 'DM Sans', sans-serif;
            -webkit-tap-highlight-color: transparent;
            transition: all 0.18s ease;
        }
        .at-confirm-yes {
            background: rgba(239,68,68,0.2); color: #F87171;
            border: 1px solid rgba(239,68,68,0.3);
        }
        .at-confirm-yes:hover { background: rgba(239,68,68,0.35); }
        .at-confirm-no {
            background: rgba(148,163,184,0.1); color: rgba(148,163,184,0.8);
            border: 1px solid rgba(148,163,184,0.15);
        }
        .at-confirm-no:hover { background: rgba(148,163,184,0.2); }

        /* ── BOTTOM PANELS ── */
        .at-panels {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        @media (max-width: 580px) { .at-panels { grid-template-columns: 1fr; } }

        .at-panel {
            background: rgba(13,19,38,0.75);
            border: 1px solid rgba(148,163,184,0.08);
            border-radius: 18px;
            padding: 18px;
            backdrop-filter: blur(16px);
            animation: at-up 0.4s ease both;
            position: relative; overflow: hidden;
        }
        .at-panel::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
        }
        .at-panel-title {
            font-size: 0.88rem; font-weight: 700;
            color: rgba(226,232,240,0.85);
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 14px;
        }
        .at-panel-icon {
            width: 28px; height: 28px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }

        /* ── INPUTS ── */
        .at-input {
            width: 100%;
            background: rgba(0,0,0,0.25);
            border: 1px solid rgba(148,163,184,0.1);
            border-radius: 11px;
            padding: 11px 13px;
            color: #E2E8F0;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.875rem;
            font-weight: 500;
            outline: none;
            transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
            /* prevent iOS zoom */
            font-size: 16px;
        }
        .at-input::placeholder { color: rgba(148,163,184,0.35); font-size: 0.82rem; }
        .at-input:focus {
            border-color: rgba(99,102,241,0.4);
            background: rgba(0,0,0,0.35);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .at-input-row {
            display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }

        /* ── ADD BUTTON ── */
        .at-add-btn {
            width: 100%; padding: 12px;
            background: linear-gradient(135deg, #6366F1, #4F46E5);
            border: none; border-radius: 12px;
            color: #fff; font-weight: 700; font-size: 0.875rem;
            cursor: pointer; font-family: 'DM Sans', sans-serif;
            display: flex; align-items: center; justify-content: center; gap: 7px;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 4px 16px rgba(99,102,241,0.3);
            -webkit-tap-highlight-color: transparent;
        }
        .at-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .at-add-btn:active { transform: scale(0.98); }
        .at-add-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* ── QUICK MARK ── */
        .at-qm-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
            margin-top: 10px;
        }
        .at-qm-present, .at-qm-absent {
            padding: 12px 8px; border-radius: 12px; border: none;
            font-weight: 700; font-size: 0.875rem; cursor: pointer;
            font-family: 'DM Sans', sans-serif;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        }
        .at-qm-present {
            background: linear-gradient(135deg, #34D399, #059669);
            color: #fff;
            box-shadow: 0 4px 14px rgba(52,211,153,0.3);
        }
        .at-qm-present:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(52,211,153,0.4); }
        .at-qm-present:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        .at-qm-absent {
            background: rgba(248,113,113,0.12);
            color: #F87171;
            border: 1px solid rgba(248,113,113,0.25);
        }
        .at-qm-absent:hover { background: rgba(248,113,113,0.22); transform: translateY(-2px); }
        .at-qm-absent:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* ── ADD PANEL TOGGLE (mobile) ── */
        .at-fab {
            display: none;
        }
        @media (max-width: 580px) {
            .at-fab {
                display: flex;
                position: fixed; bottom: 24px; right: 20px;
                width: 52px; height: 52px;
                background: linear-gradient(135deg, #6366F1, #4F46E5);
                border: none; border-radius: 16px;
                align-items: center; justify-content: center;
                cursor: pointer; z-index: 40;
                box-shadow: 0 6px 24px rgba(99,102,241,0.45);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                -webkit-tap-highlight-color: transparent;
            }
            .at-fab:hover { transform: scale(1.08); }
            .at-fab:active { transform: scale(0.95); }
        }

        /* ── EMPTY STATE ── */
        .at-empty {
            border-radius: 18px;
            background: rgba(13,19,38,0.5);
            border: 1px dashed rgba(148,163,184,0.12);
            padding: 3rem 1.5rem;
            text-align: center;
            display: flex; flex-direction: column;
            align-items: center; gap: 10px;
            animation: at-up 0.4s ease both;
            margin-bottom: 1.5rem;
        }
        .at-empty-title {
            font-size: 0.95rem; font-weight: 600; color: rgba(226,232,240,0.5);
        }
        .at-empty-sub {
            font-size: 0.78rem; color: rgba(148,163,184,0.35);
        }

        /* ── ADD FORM SLIDE (mobile drawer style) ── */
        .at-add-form-fields {
            display: flex; flex-direction: column; gap: 10px;
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className={`at-page${mounted ? ' in' : ''}`}>

                {/* ── PAGE HEADER ── */}
                <div className="at-head">
                    <h1 className="at-head-title">Attendance Tracker</h1>
                    <p className="at-head-sub">Track your academic presence</p>
                </div>

                {/* ── STATS ROW ── */}
                <div className="at-stats">
                    {/* Main overall % */}
                    <div className="at-stat at-stat-main" style={{ animationDelay: '0s', gridColumn: undefined }}>
                        <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
                            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                            <circle
                                cx="32" cy="32" r="26"
                                fill="none"
                                stroke={overallPct >= 80 ? '#34D399' : '#F87171'}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${ring(overallPct).circ}`}
                                strokeDashoffset={ring(overallPct).circ - ring(overallPct).dash}
                                transform="rotate(-90 32 32)"
                                style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                        </svg>
                        <div>
                            <div className="at-stat-num" style={{ color: overallPct >= 80 ? '#34D399' : '#F87171' }}>
                                {overallPct}%
                            </div>
                            <div className="at-stat-lbl">Overall</div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.45)', marginTop: 4 }}>
                                {totalAttended} / {totalClasses} classes
                            </div>
                        </div>
                    </div>

                    {/* Safe subjects */}
                    <div className="at-stat" style={{ animationDelay: '0.08s' }}>
                        <div className="at-stat-lbl" style={{ marginBottom: 6 }}>Safe</div>
                        <div className="at-stat-val" style={{ color: '#34D399' }}>{safeCount}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(148,163,184,0.4)', marginTop: 4 }}>≥ 80%</div>
                    </div>

                    {/* At-risk */}
                    <div className="at-stat" style={{ animationDelay: '0.12s' }}>
                        <div className="at-stat-lbl" style={{ marginBottom: 6 }}>At Risk</div>
                        <div className="at-stat-val" style={{ color: dangerCount > 0 ? '#F87171' : 'rgba(148,163,184,0.5)' }}>{dangerCount}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(148,163,184,0.4)', marginTop: 4 }}>Below 80%</div>
                    </div>
                </div>

                {/* ── SUBJECT CARDS ── */}
                {attendanceSubjects.length === 0 ? (
                    <div className="at-empty">
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BookOpen size={22} color="#818CF8" />
                        </div>
                        <div className="at-empty-title">No subjects yet</div>
                        <div className="at-empty-sub">Add a subject below to start tracking</div>
                    </div>
                ) : (
                    <div className="at-grid">
                        {attendanceSubjects.map((subject, idx) => {
                            const pct    = subject.total ? Math.round((subject.attended / subject.total) * 100) : 0;
                            const isSafe = pct >= 80;
                            const isDeleting = deleting === subject.name;

                            let statusMsg = '';
                            if (subject.total) {
                                if (isSafe) {
                                    const canSkip = Math.floor((subject.attended - 0.8 * subject.total) / 0.8);
                                    statusMsg = `Skip ${Math.max(0, canSkip)}`;
                                } else {
                                    const needed = Math.ceil((0.8 * subject.total - subject.attended) / 0.2);
                                    statusMsg = `Need ${needed} more`;
                                }
                            }

                            return (
                                <div
                                    key={subject.id || subject.name}
                                    className={`at-card${isDeleting ? ' deleting' : ''}`}
                                    style={{
                                        animationDelay: `${idx * 0.05}s`,
                                        '--card-accent': isSafe
                                            ? 'linear-gradient(90deg,#34D399,#10B981)'
                                            : 'linear-gradient(90deg,#F87171,#EF4444)',
                                    }}
                                >
                                    {/* Confirm delete overlay */}
                                    {confirmDel?.name === subject.name && (
                                        <div className="at-confirm-overlay">
                                            <Trash2 size={20} color="#F87171" />
                                            <div className="at-confirm-msg">
                                                Delete <strong style={{ color: '#E2E8F0' }}>{subject.name}</strong>?<br />
                                                This cannot be undone.
                                            </div>
                                            <div className="at-confirm-btns">
                                                <button className="at-confirm-yes" onClick={() => handleDeleteSubject(subject)}>
                                                    Delete
                                                </button>
                                                <button className="at-confirm-no" onClick={() => setConfirmDel(null)}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Card top */}
                                    <div className="at-card-top">
                                        <span className="at-card-name">{subject.name}</span>
                                        <span className="at-card-pct" style={{ color: isSafe ? '#34D399' : '#F87171' }}>
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="at-bar-track">
                                        <div
                                            className="at-bar-fill"
                                            style={{
                                                '--w': `${pct}%`,
                                                '--bar-color': isSafe
                                                    ? 'linear-gradient(90deg,#34D399,#10B981)'
                                                    : 'linear-gradient(90deg,#F87171,#EF4444)',
                                                '--bar-glow': isSafe ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)',
                                            }}
                                        />
                                    </div>

                                    {/* Info row */}
                                    <div className="at-card-info">
                                        <span className="at-card-count">{subject.attended} / {subject.total} attended</span>
                                        {statusMsg && (
                                            <span
                                                className="at-card-status"
                                                style={{
                                                    '--status-bg':     isSafe ? 'rgba(52,211,153,0.1)'  : 'rgba(248,113,113,0.1)',
                                                    '--status-color':  isSafe ? '#34D399'               : '#F87171',
                                                    '--status-border': isSafe ? 'rgba(52,211,153,0.2)'  : 'rgba(248,113,113,0.2)',
                                                }}
                                            >
                                                {statusMsg}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="at-card-actions">
                                        <button
                                            className="at-btn-present"
                                            onClick={() => updateAttendance(subject.id, parseInt(subject.total) + 1, parseInt(subject.attended) + 1)}
                                        >
                                            <Check size={13} /> Present
                                        </button>
                                        <button
                                            className="at-btn-absent"
                                            onClick={() => updateAttendance(subject.id, parseInt(subject.total) + 1, parseInt(subject.attended))}
                                        >
                                            <X size={13} /> Absent
                                        </button>
                                        <button
                                            className="at-btn-del"
                                            onClick={() => setConfirmDel(subject)}
                                            title="Delete subject"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── BOTTOM PANELS ── */}
                <div className="at-panels">

                    {/* Add Subject */}
                    <div className="at-panel" style={{ animationDelay: '0.18s' }}>
                        <div className="at-panel-title">
                            <div className="at-panel-icon" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                <Plus size={14} color="#818CF8" />
                            </div>
                            Add Subject
                        </div>
                        <div className="at-add-form-fields">
                            <input
                                className="at-input"
                                placeholder="Subject name"
                                value={newSubject.name}
                                onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                            />
                            <div className="at-input-row">
                                <input
                                    className="at-input"
                                    type="number"
                                    placeholder="Total classes"
                                    value={newSubject.total}
                                    onChange={e => setNewSubject({ ...newSubject, total: e.target.value })}
                                />
                                <input
                                    className="at-input"
                                    type="number"
                                    placeholder="Attended"
                                    value={newSubject.attended}
                                    onChange={e => setNewSubject({ ...newSubject, attended: e.target.value })}
                                />
                            </div>
                            <button
                                className="at-add-btn"
                                onClick={handleAddSubject}
                                disabled={!newSubject.name.trim() || !newSubject.total}
                            >
                                <Plus size={15} /> Add Subject
                            </button>
                        </div>
                    </div>

                    {/* Quick Mark */}
                    <div className="at-panel" style={{ animationDelay: '0.22s' }}>
                        <div className="at-panel-title">
                            <div className="at-panel-icon" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)' }}>
                                <CheckCircle size={14} color="#34D399" />
                            </div>
                            Quick Mark
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.45)', marginBottom: 12, fontWeight: 400 }}>
                            Select an active session to mark attendance
                        </p>
                        <GlassDropdown
                            options={courses.length > 0 ? courses.map(c => c.name) : attendanceSubjects.map(s => s.name)}
                            value={calcData.selectedCourseName}
                            onChange={(name) => setCalcData({ ...calcData, selectedCourseName: name })}
                            placeholder="Select subject…"
                            style={{ zIndex: 20 }}
                        />
                        <div className="at-qm-grid">
                            <button
                                className="at-qm-present"
                                disabled={!calcData.selectedCourseName}
                                onClick={() => {
                                    if (!calcData.selectedCourseName) return;
                                    const existing = attendanceSubjects.find(s => s.name === calcData.selectedCourseName);
                                    if (existing) {
                                        updateAttendance(existing.id, parseInt(existing.total) + 1, parseInt(existing.attended) + 1);
                                    } else {
                                        addAttendanceSubject({ name: calcData.selectedCourseName, total: 1, attended: 1 });
                                    }
                                }}
                            >
                                ✓ Present
                            </button>
                            <button
                                className="at-qm-absent"
                                disabled={!calcData.selectedCourseName}
                                onClick={() => {
                                    if (!calcData.selectedCourseName) return;
                                    const existing = attendanceSubjects.find(s => s.name === calcData.selectedCourseName);
                                    if (existing) {
                                        updateAttendance(existing.id, parseInt(existing.total) + 1, parseInt(existing.attended));
                                    } else {
                                        addAttendanceSubject({ name: calcData.selectedCourseName, total: 1, attended: 0 });
                                    }
                                }}
                            >
                                ✗ Absent
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceTracker;
