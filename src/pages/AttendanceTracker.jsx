import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, CheckCircle, Trash2,
    BookOpen, TrendingUp, X, Check
} from 'lucide-react';
import GlassDropdown from '../components/GlassDropdown';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

const AttendanceTracker = () => {
    const {
        attendanceSubjects,
        updateAttendance,
        addAttendanceSubject,
        deleteAttendanceSubject,
        courses,
    } = useData();

    const [newSubject, setNewSubject] = useState({ name: '', total: '', attended: '' });
    const [quickSel,   setQuickSel]   = useState('');
    const [mounted,    setMounted]    = useState(false);
    const [addOpen,    setAddOpen]    = useState(false);
    const [toDelete,   setToDelete]   = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    const totalClasses  = attendanceSubjects.reduce((s, x) => s + (+x.total    || 0), 0);
    const totalAttended = attendanceSubjects.reduce((s, x) => s + (+x.attended || 0), 0);
    const overallPct    = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;
    const safeCount     = attendanceSubjects.filter(s => s.total && Math.round((+s.attended / +s.total) * 100) >= 75).length;
    const atRisk        = attendanceSubjects.length - safeCount;

    const handleAdd = () => {
        if (!newSubject.name.trim() || !newSubject.total) return;
        addAttendanceSubject({
            name:     newSubject.name.trim(),
            total:    parseInt(newSubject.total),
            attended: parseInt(newSubject.attended || 0),
        });
        setNewSubject({ name: '', total: '', attended: '' });
        setAddOpen(false);
    };

    // ⚡ Instant — DataContext does optimistic update first
    const markPresent = useCallback((s) =>
        updateAttendance(s.id, +s.total + 1, +s.attended + 1), [updateAttendance]);

    const markAbsent = useCallback((s) =>
        updateAttendance(s.id, +s.total + 1, +s.attended), [updateAttendance]);

    // ⚡ Instant — deleteAttendanceSubject removes from local state first
    const handleDelete = useCallback((id) => {
        setToDelete(null);
        deleteAttendanceSubject(id);
    }, [deleteAttendanceSubject]);

    const quickPresent = () => {
        if (!quickSel) return;
        const ex = attendanceSubjects.find(s => s.name === quickSel);
        if (ex) markPresent(ex);
        else addAttendanceSubject({ name: quickSel, total: 1, attended: 1 });
    };

    const quickAbsent = () => {
        if (!quickSel) return;
        const ex = attendanceSubjects.find(s => s.name === quickSel);
        if (ex) markAbsent(ex);
        else addAttendanceSubject({ name: quickSel, total: 1, attended: 0 });
    };

    const getPct    = (s) => s.total ? Math.round((+s.attended / +s.total) * 100) : 0;
    const isSafe    = (s) => getPct(s) >= 75;
    const statusTip = (s) => {
        const pct = getPct(s);
        if (!s.total) return '';
        if (pct >= 75) {
            const can = Math.floor((+s.attended - 0.75 * +s.total) / 0.75);
            return can > 0 ? `Can skip ${can}` : 'Just safe';
        }
        const need = Math.ceil((0.75 * +s.total - +s.attended) / 0.25);
        return `Need ${need} more`;
    };

    const Ring = ({ pct, size = 56 }) => {
        const stroke = 4.5;
        const r      = (size - stroke) / 2;
        const circ   = 2 * Math.PI * r;
        const off    = circ - (pct / 100) * circ;
        const col    = pct >= 75 ? '#34D399' : pct >= 50 ? '#FBBF24' : '#F87171';
        return (
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={col} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={off}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
        );
    };

    const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes popIn{0%{opacity:0;transform:scale(.88)}70%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}

.at{font-family:'Outfit',sans-serif;width:100%;max-width:100%;opacity:0;transition:opacity .3s ease}
.at.in{opacity:1}

/* HEADER */
.at-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  margin-bottom:20px;animation:fadeUp .35s ease both}
.at-hd h1{font-size:clamp(1.4rem,4vw,1.85rem);font-weight:800;letter-spacing:-.03em;
  background:linear-gradient(120deg,#fff 20%,#94A3B8 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1}
.at-hd p{font-size:.78rem;color:rgba(148,163,184,.5);margin-top:4px;font-weight:400}
.at-add-toggle{display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:12px;
  background:linear-gradient(135deg,#6366F1,#4F46E5);border:none;color:#fff;
  font-family:'Outfit',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;
  box-shadow:0 4px 16px rgba(99,102,241,.35);transition:all .18s ease;
  -webkit-tap-highlight-color:transparent;white-space:nowrap;flex-shrink:0}
.at-add-toggle:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(99,102,241,.45)}
.at-add-toggle:active{transform:scale(.97)}

/* STATS */
.at-stats{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-bottom:18px}
@media(max-width:460px){.at-stats{grid-template-columns:1fr 1fr}.at-stat-hero{grid-column:1/-1}}
.at-stat{background:rgba(13,19,38,.8);border:1px solid rgba(148,163,184,.08);
  border-radius:16px;padding:14px 16px;backdrop-filter:blur(16px);
  animation:fadeUp .35s ease both;position:relative;overflow:hidden}
.at-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)}
.at-stat-hero{display:flex;align-items:center;gap:14px;padding:16px 18px}
.at-stat-big{font-size:2rem;font-weight:800;letter-spacing:-.04em;line-height:1}
.at-stat-lbl{font-size:.65rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.09em;color:rgba(148,163,184,.45);margin-top:3px}
.at-stat-sub{font-size:.68rem;color:rgba(148,163,184,.35);margin-top:5px}
.at-stat-val{font-size:1.5rem;font-weight:800;letter-spacing:-.03em;line-height:1}
.at-stat-mini-lbl{font-size:.62rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.08em;color:rgba(148,163,184,.4);margin-bottom:5px}

/* ADD FORM */
.at-add-form{background:rgba(13,19,38,.88);border:1px solid rgba(99,102,241,.22);
  border-radius:18px;padding:18px;margin-bottom:18px;backdrop-filter:blur(20px);
  animation:popIn .22s ease both;box-shadow:0 8px 32px rgba(0,0,0,.3),0 0 0 1px rgba(99,102,241,.1)}
.at-add-form-title{font-size:.82rem;font-weight:700;color:rgba(226,232,240,.8);
  margin-bottom:14px;display:flex;align-items:center;gap:8px}
.at-add-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
@media(max-width:380px){.at-add-grid{grid-template-columns:1fr}}
.at-inp{width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(148,163,184,.1);
  border-radius:11px;padding:11px 13px;color:#E2E8F0;font-family:'Outfit',sans-serif;
  font-size:16px;font-weight:500;outline:none;
  transition:border-color .15s,background .15s,box-shadow .15s}
.at-inp::placeholder{color:rgba(148,163,184,.3)}
.at-inp:focus{border-color:rgba(99,102,241,.45);background:rgba(0,0,0,.4);
  box-shadow:0 0 0 3px rgba(99,102,241,.12)}
.at-add-row{display:flex;gap:8px;margin-top:8px}
.at-btn-add{flex:1;padding:11px;border-radius:12px;border:none;
  background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;
  font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:6px;
  box-shadow:0 4px 14px rgba(99,102,241,.3);transition:all .15s ease;
  -webkit-tap-highlight-color:transparent}
.at-btn-add:hover{opacity:.9;transform:translateY(-1px)}
.at-btn-add:active{transform:scale(.97)}
.at-btn-add:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
.at-btn-cancel{padding:11px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.12);
  background:rgba(148,163,184,.07);color:rgba(148,163,184,.6);
  font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;
  transition:all .15s ease;-webkit-tap-highlight-color:transparent}
.at-btn-cancel:hover{background:rgba(148,163,184,.13);color:rgba(148,163,184,.85)}

/* GRID */
.at-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));
  gap:12px;margin-bottom:18px}
@media(max-width:340px){.at-grid{grid-template-columns:1fr}}

/* CARD */
.at-card{background:rgba(11,16,32,.82);border:1px solid rgba(148,163,184,.08);
  border-radius:18px;padding:16px;backdrop-filter:blur(18px);
  display:flex;flex-direction:column;gap:11px;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;
  animation:fadeUp .35s ease both;position:relative;overflow:hidden}
.at-card:hover{transform:translateY(-3px);border-color:rgba(148,163,184,.14);
  box-shadow:0 14px 36px rgba(0,0,0,.38)}
.at-card-accent{position:absolute;top:0;left:0;right:0;height:2px;border-radius:18px 18px 0 0}
.at-card-hd{display:flex;align-items:center;justify-content:space-between;gap:10px}
.at-card-name{font-size:.92rem;font-weight:700;color:#E2E8F0;flex:1;
  line-height:1.3;word-break:break-word}
.at-card-pct{font-size:1.05rem;font-weight:800;flex-shrink:0}
.at-bar{height:5px;background:rgba(255,255,255,.055);border-radius:10px;overflow:hidden}
.at-bar-fill{height:100%;border-radius:10px;transition:width .5s cubic-bezier(.4,0,.2,1)}
.at-card-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap}
.at-card-count{font-size:.72rem;color:rgba(148,163,184,.5);font-weight:500}
.at-pill{font-size:.65rem;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}
.at-card-acts{display:grid;grid-template-columns:1fr 1fr auto;gap:7px;align-items:center}
.at-present,.at-absent,.at-del{border:none;border-radius:10px;cursor:pointer;
  font-family:'Outfit',sans-serif;font-weight:700;font-size:.8rem;padding:9px 10px;
  display:flex;align-items:center;justify-content:center;gap:5px;
  transition:all .12s ease;-webkit-tap-highlight-color:transparent;user-select:none}
.at-present{background:rgba(52,211,153,.13);color:#34D399;border:1px solid rgba(52,211,153,.22)}
.at-present:hover{background:rgba(52,211,153,.24);transform:scale(1.03)}
.at-present:active{transform:scale(.96)}
.at-absent{background:rgba(248,113,113,.1);color:#F87171;border:1px solid rgba(248,113,113,.2)}
.at-absent:hover{background:rgba(248,113,113,.22);transform:scale(1.03)}
.at-absent:active{transform:scale(.96)}
.at-del{width:36px;height:36px;padding:0;background:rgba(239,68,68,.07);
  color:rgba(248,113,113,.5);border:1px solid rgba(239,68,68,.1)}
.at-del:hover{background:rgba(239,68,68,.18);color:#F87171;
  border-color:rgba(239,68,68,.28);transform:scale(1.08)}
.at-del:active{transform:scale(.94)}

/* CONFIRM */
.at-confirm{position:absolute;inset:0;background:rgba(7,10,22,.93);
  backdrop-filter:blur(8px);border-radius:18px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:12px;z-index:10;animation:fadeIn .18s ease}
.at-confirm p{font-size:.8rem;color:rgba(226,232,240,.8);text-align:center;
  line-height:1.5;padding:0 16px;font-weight:500}
.at-confirm p strong{color:#E2E8F0}
.at-cf-btns{display:flex;gap:8px}
.at-cf-yes,.at-cf-no{padding:9px 20px;border-radius:10px;border:none;
  font-family:'Outfit',sans-serif;font-weight:700;font-size:.78rem;cursor:pointer;
  transition:all .15s ease;-webkit-tap-highlight-color:transparent}
.at-cf-yes{background:rgba(239,68,68,.18);color:#F87171;border:1px solid rgba(239,68,68,.28)}
.at-cf-yes:hover{background:rgba(239,68,68,.32)}
.at-cf-no{background:rgba(148,163,184,.1);color:rgba(148,163,184,.75);
  border:1px solid rgba(148,163,184,.15)}
.at-cf-no:hover{background:rgba(148,163,184,.2)}

/* PANELS */
.at-panels{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:560px){.at-panels{grid-template-columns:1fr}}
.at-panel{background:rgba(11,16,32,.82);border:1px solid rgba(148,163,184,.08);
  border-radius:18px;padding:18px;backdrop-filter:blur(18px);
  animation:fadeUp .4s ease both;position:relative;overflow:hidden}
.at-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)}
.at-panel-title{font-size:.85rem;font-weight:700;color:rgba(226,232,240,.8);
  display:flex;align-items:center;gap:8px;margin-bottom:14px}
.at-panel-icon{width:28px;height:28px;border-radius:8px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center}
.at-qm-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.at-qm-p,.at-qm-a{padding:12px;border-radius:12px;border:none;
  font-family:'Outfit',sans-serif;font-size:.875rem;font-weight:700;
  cursor:pointer;transition:all .15s ease;-webkit-tap-highlight-color:transparent}
.at-qm-p{background:linear-gradient(135deg,#34D399,#059669);color:#fff;
  box-shadow:0 4px 14px rgba(52,211,153,.28)}
.at-qm-p:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(52,211,153,.38)}
.at-qm-p:active{transform:scale(.96)}
.at-qm-p:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
.at-qm-a{background:rgba(248,113,113,.1);color:#F87171;border:1px solid rgba(248,113,113,.22)}
.at-qm-a:hover{background:rgba(248,113,113,.2);transform:translateY(-2px)}
.at-qm-a:active{transform:scale(.96)}
.at-qm-a:disabled{opacity:.35;cursor:not-allowed;transform:none}

/* EMPTY */
.at-empty{border-radius:18px;background:rgba(11,16,32,.6);
  border:1px dashed rgba(148,163,184,.1);padding:3rem 1.5rem;
  text-align:center;display:flex;flex-direction:column;
  align-items:center;gap:10px;animation:fadeUp .35s ease both;margin-bottom:18px}
.at-empty h3{font-size:.9rem;font-weight:600;color:rgba(226,232,240,.4)}
.at-empty p{font-size:.75rem;color:rgba(148,163,184,.3)}

/* SUMMARY ROWS */
.at-sum-row{display:flex;justify-content:space-between;align-items:center;
  padding:8px 12px;border-radius:11px;background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.04)}
.at-sum-lbl{font-size:.75rem;color:rgba(148,163,184,.55);font-weight:500}
.at-sum-val{font-size:.85rem;font-weight:800}
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className={`at${mounted ? ' in' : ''}`}>

                {/* HEADER */}
                <div className="at-hd">
                    <div>
                        <h1>Attendance Tracker</h1>
                        <p>Track your academic presence</p>
                    </div>
                    <button className="at-add-toggle" onClick={() => setAddOpen(o => !o)}>
                        {addOpen ? <X size={14} /> : <Plus size={14} />}
                        {addOpen ? 'Close' : 'Add Subject'}
                    </button>
                </div>

                {/* STATS */}
                <div className="at-stats">
                    <div className="at-stat at-stat-hero" style={{ animationDelay: '0s' }}>
                        <Ring pct={overallPct} />
                        <div>
                            <div className="at-stat-big" style={{
                                color: overallPct >= 75 ? '#34D399' : overallPct >= 50 ? '#FBBF24' : '#F87171'
                            }}>{overallPct}%</div>
                            <div className="at-stat-lbl">Overall</div>
                            <div className="at-stat-sub">{totalAttended} / {totalClasses} classes</div>
                        </div>
                    </div>
                    <div className="at-stat" style={{ animationDelay: '.06s' }}>
                        <div className="at-stat-mini-lbl">Safe ✓</div>
                        <div className="at-stat-val" style={{ color: '#34D399' }}>{safeCount}</div>
                        <div style={{ fontSize: '.65rem', color: 'rgba(148,163,184,.35)', marginTop: 4 }}>≥ 75%</div>
                    </div>
                    <div className="at-stat" style={{ animationDelay: '.1s' }}>
                        <div className="at-stat-mini-lbl">At Risk ⚠</div>
                        <div className="at-stat-val" style={{ color: atRisk > 0 ? '#F87171' : 'rgba(148,163,184,.4)' }}>{atRisk}</div>
                        <div style={{ fontSize: '.65rem', color: 'rgba(148,163,184,.35)', marginTop: 4 }}>Below 75%</div>
                    </div>
                </div>

                {/* ADD FORM */}
                {addOpen && (
                    <div className="at-add-form">
                        <div className="at-add-form-title">
                            <Plus size={14} color="#818CF8" /> New Subject
                        </div>
                        <input className="at-inp" placeholder="Subject name"
                            value={newSubject.name}
                            onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            style={{ width: '100%', marginBottom: 8 }}
                        />
                        <div className="at-add-grid">
                            <input className="at-inp" type="number" placeholder="Total classes"
                                value={newSubject.total}
                                onChange={e => setNewSubject(p => ({ ...p, total: e.target.value }))}
                            />
                            <input className="at-inp" type="number" placeholder="Attended (optional)"
                                value={newSubject.attended}
                                onChange={e => setNewSubject(p => ({ ...p, attended: e.target.value }))}
                            />
                        </div>
                        <div className="at-add-row">
                            <button className="at-btn-add" onClick={handleAdd}
                                disabled={!newSubject.name.trim() || !newSubject.total}>
                                <Plus size={14} /> Add Subject
                            </button>
                            <button className="at-btn-cancel" onClick={() => setAddOpen(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* CARDS */}
                {attendanceSubjects.length === 0 ? (
                    <div className="at-empty">
                        <div style={{
                            width: 46, height: 46, borderRadius: 13,
                            background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BookOpen size={20} color="#818CF8" />
                        </div>
                        <h3>No subjects yet</h3>
                        <p>Tap "Add Subject" to start tracking</p>
                    </div>
                ) : (
                    <div className="at-grid">
                        {attendanceSubjects.map((s, idx) => {
                            const pct  = getPct(s);
                            const safe = isSafe(s);
                            const tip  = statusTip(s);
                            const col  = safe ? '#34D399' : pct >= 50 ? '#FBBF24' : '#F87171';
                            const barG = safe
                                ? 'linear-gradient(90deg,#34D399,#10B981)'
                                : pct >= 50
                                    ? 'linear-gradient(90deg,#FBBF24,#D97706)'
                                    : 'linear-gradient(90deg,#F87171,#EF4444)';

                            return (
                                <div key={s.id || s.name} className="at-card"
                                    style={{ animationDelay: `${idx * 0.045}s` }}>

                                    <div className="at-card-accent" style={{ background: barG }} />

                                    {/* Confirm delete overlay */}
                                    {toDelete === s.id && (
                                        <div className="at-confirm">
                                            <Trash2 size={20} color="#F87171" />
                                            <p>Delete <strong>{s.name}</strong>?<br />This cannot be undone.</p>
                                            <div className="at-cf-btns">
                                                <button className="at-cf-yes" onClick={() => handleDelete(s.id)}>Delete</button>
                                                <button className="at-cf-no"  onClick={() => setToDelete(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="at-card-hd">
                                        <span className="at-card-name">{s.name}</span>
                                        <span className="at-card-pct" style={{ color: col }}>{pct}%</span>
                                    </div>

                                    <div className="at-bar">
                                        <div className="at-bar-fill" style={{
                                            width: `${pct}%`, background: barG,
                                            boxShadow: `0 0 8px ${col}55`,
                                        }} />
                                    </div>

                                    <div className="at-card-meta">
                                        <span className="at-card-count">{s.attended} / {s.total} attended</span>
                                        {tip && (
                                            <span className="at-pill" style={{
                                                background: safe ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
                                                color: col,
                                                border: `1px solid ${safe ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}`,
                                            }}>{tip}</span>
                                        )}
                                    </div>

                                    {/* ⚡ Instant buttons */}
                                    <div className="at-card-acts">
                                        <button className="at-present" onClick={() => markPresent(s)}>
                                            <Check size={12} /> Present
                                        </button>
                                        <button className="at-absent" onClick={() => markAbsent(s)}>
                                            <X size={12} /> Absent
                                        </button>
                                        <button className="at-del" onClick={() => setToDelete(s.id)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* BOTTOM PANELS */}
                <div className="at-panels">

                    {/* Quick Mark */}
                    <div className="at-panel" style={{ animationDelay: '.2s' }}>
                        <div className="at-panel-title">
                            <div className="at-panel-icon" style={{
                                background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.22)' }}>
                                <CheckCircle size={14} color="#34D399" />
                            </div>
                            Quick Mark
                        </div>
                        <p style={{ fontSize: '.73rem', color: 'rgba(148,163,184,.4)', marginBottom: 10, fontWeight: 400 }}>
                            Select a subject to mark instantly
                        </p>
                        <GlassDropdown
                            options={courses.length > 0 ? courses.map(c => c.name) : attendanceSubjects.map(s => s.name)}
                            value={quickSel}
                            onChange={setQuickSel}
                            placeholder="Select subject…"
                            style={{ zIndex: 20 }}
                        />
                        <div className="at-qm-btns">
                            <button className="at-qm-p" disabled={!quickSel} onClick={quickPresent}>✓ Present</button>
                            <button className="at-qm-a" disabled={!quickSel} onClick={quickAbsent}>✗ Absent</button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="at-panel" style={{ animationDelay: '.25s' }}>
                        <div className="at-panel-title">
                            <div className="at-panel-icon" style={{
                                background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.22)' }}>
                                <TrendingUp size={14} color="#818CF8" />
                            </div>
                            Summary
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { label: 'Total Subjects', val: attendanceSubjects.length, color: '#94A3B8' },
                                { label: 'Total Classes',  val: totalClasses,              color: '#60A5FA' },
                                { label: 'Total Attended', val: totalAttended,             color: '#34D399' },
                                { label: 'Total Missed',   val: totalClasses - totalAttended, color: '#F87171' },
                            ].map(row => (
                                <div key={row.label} className="at-sum-row">
                                    <span className="at-sum-lbl">{row.label}</span>
                                    <span className="at-sum-val" style={{ color: row.color }}>{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceTracker;
