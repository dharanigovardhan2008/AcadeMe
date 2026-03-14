import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, CheckCircle, Trash2, BookOpen,
    TrendingUp, X, Check, ChevronDown
} from 'lucide-react';
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
    const [qmOpen,     setQmOpen]     = useState(false); // quick mark subject picker open

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    /* ── stats ─────────────────────────────────────────────── */
    const totalClasses  = attendanceSubjects.reduce((s, x) => s + (+x.total    || 0), 0);
    const totalAttended = attendanceSubjects.reduce((s, x) => s + (+x.attended || 0), 0);
    const overallPct    = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;
    const safeCount     = attendanceSubjects.filter(s =>
        s.total && Math.round((+s.attended / +s.total) * 100) >= 75).length;
    const atRisk = attendanceSubjects.length - safeCount;

    /* ── handlers ───────────────────────────────────────────── */
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

    const markPresent = useCallback((s) =>
        updateAttendance(s.id, +s.total + 1, +s.attended + 1), [updateAttendance]);

    const markAbsent = useCallback((s) =>
        updateAttendance(s.id, +s.total + 1, +s.attended), [updateAttendance]);

    const handleDelete = useCallback((id) => {
        setToDelete(null);
        deleteAttendanceSubject(id);
    }, [deleteAttendanceSubject]);

    const quickPresent = () => {
        if (!quickSel) return;
        const ex = attendanceSubjects.find(s => s.name === quickSel);
        if (ex) markPresent(ex);
        else addAttendanceSubject({ name: quickSel, total: 1, attended: 1 });
        setQuickSel('');
        setQmOpen(false);
    };

    const quickAbsent = () => {
        if (!quickSel) return;
        const ex = attendanceSubjects.find(s => s.name === quickSel);
        if (ex) markAbsent(ex);
        else addAttendanceSubject({ name: quickSel, total: 1, attended: 0 });
        setQuickSel('');
        setQmOpen(false);
    };

    /* ── helpers ─────────────────────────────────────────────── */
    const getPct = (s) => s.total ? Math.round((+s.attended / +s.total) * 100) : 0;

    /* clear status message */
    const getStatus = (s) => {
        const pct = getPct(s);
        if (!s.total) return null;
        if (pct >= 75) {
            const canSkip = Math.floor((+s.attended - 0.75 * +s.total) / 0.75);
            if (canSkip <= 0) return { text: 'Just at 75%', safe: true };
            return { text: `You can skip ${canSkip} class${canSkip > 1 ? 'es' : ''}`, safe: true };
        } else {
            const need = Math.ceil((0.75 * +s.total - +s.attended) / 0.25);
            return { text: `Attend ${need} more class${need > 1 ? 'es' : ''} to reach 75%`, safe: false };
        }
    };

    /* quick mark subject options */
    const qmOptions = courses.length > 0
        ? courses.map(c => c.name)
        : attendanceSubjects.map(s => s.name);

    /* SVG ring */
    const Ring = ({ pct, size = 56 }) => {
        const stroke = 4.5, r = (size - stroke) / 2;
        const circ = 2 * Math.PI * r;
        const off  = circ - (pct / 100) * circ;
        const col  = pct >= 75 ? '#34D399' : pct >= 50 ? '#FBBF24' : '#F87171';
        return (
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
        );
    };

    const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn  {from{opacity:0}to{opacity:1}}
@keyframes popIn   {0%{opacity:0;transform:scale(.9)}70%{transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

.at { font-family:'Outfit',sans-serif; width:100%; max-width:100%; opacity:0; transition:opacity .3s ease; }
.at.in { opacity:1; }

/* ── PAGE HEADER ── */
.at-hd { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; animation:fadeUp .35s ease both; flex-wrap:wrap; }
.at-hd h1 { font-size:clamp(1.3rem,4vw,1.75rem); font-weight:800; letter-spacing:-.03em; background:linear-gradient(120deg,#fff 20%,#94A3B8 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1.1; }
.at-hd p  { font-size:.78rem; color:rgba(148,163,184,.5); margin-top:3px; }

.at-add-toggle {
    display:flex; align-items:center; gap:7px; padding:9px 15px;
    border-radius:11px; background:linear-gradient(135deg,#2563EB,#1D4ED8);
    border:none; color:#fff; font-family:'Outfit',sans-serif;
    font-size:.82rem; font-weight:700; cursor:pointer;
    box-shadow:0 4px 14px rgba(37,99,235,.35);
    transition:all .18s ease; -webkit-tap-highlight-color:transparent; white-space:nowrap;
}
.at-add-toggle:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(37,99,235,.45); }
.at-add-toggle:active { transform:scale(.97); }

/* ── STATS ── */
.at-stats { display:grid; grid-template-columns:2fr 1fr 1fr; gap:10px; margin-bottom:18px; }
@media(max-width:460px){ .at-stats{grid-template-columns:1fr 1fr} .at-stat-hero{grid-column:1/-1} }

.at-stat {
    background:rgba(10,16,35,.75); border:1px solid rgba(255,255,255,.06);
    border-radius:15px; padding:14px 16px; backdrop-filter:blur(16px);
    animation:fadeUp .35s ease both; position:relative; overflow:hidden;
}
.at-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent); }
.at-stat-hero  { display:flex; align-items:center; gap:14px; padding:15px 18px; }
.at-stat-big   { font-size:2rem; font-weight:800; letter-spacing:-.04em; line-height:1; }
.at-stat-lbl   { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:rgba(148,163,184,.4); margin-top:3px; }
.at-stat-sub   { font-size:.67rem; color:rgba(148,163,184,.32); margin-top:5px; }
.at-stat-val   { font-size:1.45rem; font-weight:800; letter-spacing:-.03em; line-height:1; }
.at-stat-mini  { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:rgba(148,163,184,.38); margin-bottom:5px; }

/* ── ADD FORM ── */
.at-add-form {
    background:rgba(10,16,35,.9); border:1px solid rgba(37,99,235,.22);
    border-radius:16px; padding:16px; margin-bottom:16px;
    backdrop-filter:blur(20px); animation:popIn .22s ease both;
    box-shadow:0 8px 30px rgba(0,0,0,.3);
}
.at-add-title { font-size:.82rem; font-weight:700; color:rgba(226,232,240,.75); margin-bottom:12px; display:flex; align-items:center; gap:7px; }
.at-add-grid  { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
@media(max-width:380px){ .at-add-grid{grid-template-columns:1fr} }

.at-inp {
    width:100%; background:rgba(0,0,0,.28); border:1px solid rgba(255,255,255,.08);
    border-radius:10px; padding:11px 12px; color:#E2E8F0;
    font-family:'Outfit',sans-serif; font-size:16px; font-weight:500; outline:none;
    transition:border-color .15s,box-shadow .15s;
}
.at-inp::placeholder { color:rgba(148,163,184,.28); }
.at-inp:focus { border-color:rgba(37,99,235,.5); box-shadow:0 0 0 3px rgba(37,99,235,.1); }

.at-add-row { display:flex; gap:8px; margin-top:8px; }
.at-btn-submit {
    flex:1; padding:11px; border-radius:11px; border:none;
    background:linear-gradient(135deg,#2563EB,#1D4ED8); color:#fff;
    font-family:'Outfit',sans-serif; font-size:.85rem; font-weight:700;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;
    box-shadow:0 4px 12px rgba(37,99,235,.3); transition:all .15s ease;
    -webkit-tap-highlight-color:transparent;
}
.at-btn-submit:hover { opacity:.9; transform:translateY(-1px); }
.at-btn-submit:disabled { opacity:.3; cursor:not-allowed; transform:none; box-shadow:none; }
.at-btn-cancel {
    padding:11px 14px; border-radius:11px; border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.04); color:rgba(148,163,184,.55);
    font-family:'Outfit',sans-serif; font-size:.85rem; font-weight:600;
    cursor:pointer; transition:all .15s ease;
}
.at-btn-cancel:hover { background:rgba(255,255,255,.08); color:rgba(148,163,184,.85); }

/* ── SUBJECT GRID ── */
.at-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:11px; margin-bottom:16px; }
@media(max-width:320px){ .at-grid{grid-template-columns:1fr} }

/* ── SUBJECT CARD ── */
.at-card {
    background:rgba(10,16,35,.8); border:1px solid rgba(255,255,255,.07);
    border-radius:16px; padding:15px; backdrop-filter:blur(16px);
    display:flex; flex-direction:column; gap:10px;
    animation:fadeUp .35s ease both; position:relative; overflow:hidden;
    transition:border-color .2s ease, box-shadow .2s ease, transform .18s ease;
}
.at-card:hover { transform:translateY(-2px); border-color:rgba(255,255,255,.12); box-shadow:0 10px 28px rgba(0,0,0,.35); }

/* thin top accent */
.at-card-top-bar { position:absolute; top:0; left:0; right:0; height:2px; border-radius:16px 16px 0 0; }

/* card header row */
.at-card-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-top:4px; }
.at-card-name { font-size:.9rem; font-weight:700; color:#E2E8F0; flex:1; line-height:1.35; word-break:break-word; }
.at-card-pct  { font-size:1.1rem; font-weight:800; flex-shrink:0; font-family:'Outfit',sans-serif; line-height:1; }

/* progress bar */
.at-bar       { height:4px; background:rgba(255,255,255,.06); border-radius:10px; overflow:hidden; }
.at-bar-fill  { height:100%; border-radius:10px; transition:width .55s cubic-bezier(.4,0,.2,1); }

/* meta: count + status */
.at-card-meta { display:flex; flex-direction:column; gap:5px; }
.at-count      { font-size:.72rem; color:rgba(148,163,184,.45); font-weight:500; }
.at-status-msg {
    font-size:.74rem; font-weight:600; padding:5px 10px;
    border-radius:8px; line-height:1.3;
    display:inline-flex; align-items:center; gap:5px;
    width:fit-content;
}

/* action row */
.at-card-acts { display:grid; grid-template-columns:1fr 1fr 36px; gap:6px; align-items:center; }

.at-present, .at-absent, .at-del {
    border:none; border-radius:9px; cursor:pointer;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:.8rem;
    padding:9px 8px; display:flex; align-items:center; justify-content:center; gap:5px;
    transition:all .12s ease; -webkit-tap-highlight-color:transparent; user-select:none;
}
.at-present { background:rgba(52,211,153,.1); color:#34D399; border:1px solid rgba(52,211,153,.18); }
.at-present:hover  { background:rgba(52,211,153,.2); }
.at-present:active { transform:scale(.95); }
.at-absent  { background:rgba(248,113,113,.08); color:#F87171; border:1px solid rgba(248,113,113,.16); }
.at-absent:hover   { background:rgba(248,113,113,.18); }
.at-absent:active  { transform:scale(.95); }
.at-del { width:36px; height:36px; padding:0; background:transparent; color:rgba(148,163,184,.3); border:1px solid rgba(255,255,255,.06); }
.at-del:hover  { background:rgba(239,68,68,.12); color:#F87171; border-color:rgba(239,68,68,.2); }
.at-del:active { transform:scale(.93); }

/* confirm overlay */
.at-confirm {
    position:absolute; inset:0; background:rgba(5,8,20,.93);
    backdrop-filter:blur(8px); border-radius:16px;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:11px; z-index:10; animation:fadeIn .18s ease;
}
.at-confirm-msg { font-size:.8rem; color:rgba(226,232,240,.8); text-align:center; line-height:1.5; padding:0 16px; font-weight:500; }
.at-confirm-msg strong { color:#E2E8F0; }
.at-cf-btns { display:flex; gap:8px; }
.at-cf-yes, .at-cf-no {
    padding:8px 18px; border-radius:9px; border:none;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:.78rem; cursor:pointer;
    transition:all .15s ease; -webkit-tap-highlight-color:transparent;
}
.at-cf-yes { background:rgba(239,68,68,.18); color:#F87171; border:1px solid rgba(239,68,68,.25); }
.at-cf-yes:hover { background:rgba(239,68,68,.3); }
.at-cf-no  { background:rgba(255,255,255,.06); color:rgba(148,163,184,.7); border:1px solid rgba(255,255,255,.08); }
.at-cf-no:hover { background:rgba(255,255,255,.1); }

/* ── EMPTY ── */
.at-empty {
    border-radius:16px; background:rgba(10,16,35,.5);
    border:1px dashed rgba(255,255,255,.07); padding:3rem 1.5rem;
    text-align:center; display:flex; flex-direction:column; align-items:center; gap:9px;
    animation:fadeUp .35s ease both; margin-bottom:16px;
}
.at-empty h3 { font-size:.9rem; font-weight:600; color:rgba(226,232,240,.35); }
.at-empty p  { font-size:.75rem; color:rgba(148,163,184,.25); }

/* ── BOTTOM PANELS ── */
.at-panels { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
@media(max-width:540px){ .at-panels{grid-template-columns:1fr} }

.at-panel {
    background:rgba(10,16,35,.8); border:1px solid rgba(255,255,255,.06);
    border-radius:16px; padding:16px; backdrop-filter:blur(16px);
    animation:fadeUp .4s ease both; position:relative; overflow:hidden;
}
.at-panel::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent); }
.at-panel-title { font-size:.83rem; font-weight:700; color:rgba(226,232,240,.75); display:flex; align-items:center; gap:7px; margin-bottom:12px; }
.at-panel-icon  { width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

/* ── QUICK MARK — custom subject picker ── */
.qm-desc { font-size:.73rem; color:rgba(148,163,184,.38); margin-bottom:10px; font-weight:400; line-height:1.4; }

/* The picker trigger button */
.qm-trigger {
    width:100%; padding:10px 12px; border-radius:11px;
    background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.08);
    color: rgba(148,163,184,.5); font-family:'Outfit',sans-serif; font-size:.85rem;
    font-weight:500; cursor:pointer; display:flex; align-items:center; justify-content:space-between;
    gap:8px; text-align:left; transition:border-color .15s, background .15s;
    -webkit-tap-highlight-color:transparent;
}
.qm-trigger.has-val { color:#E2E8F0; }
.qm-trigger:hover { border-color:rgba(37,99,235,.3); background:rgba(0,0,0,.35); }

/* dropdown list */
.qm-list-wrap {
    position:relative; margin-top:4px; z-index:30;
}
.qm-list {
    position:absolute; top:0; left:0; right:0;
    background:#0c1525; border:1px solid rgba(37,99,235,.2);
    border-radius:12px; max-height:180px; overflow-y:auto;
    box-shadow:0 12px 36px rgba(0,0,0,.5);
    animation:slideDown .18s ease both;
    scrollbar-width:thin; scrollbar-color:rgba(37,99,235,.3) transparent;
}
.qm-list::-webkit-scrollbar { width:4px; }
.qm-list::-webkit-scrollbar-thumb { background:rgba(37,99,235,.3); border-radius:4px; }

.qm-opt {
    width:100%; padding:10px 13px; text-align:left; background:transparent;
    border:none; color:rgba(148,163,184,.65); font-family:'Outfit',sans-serif;
    font-size:.83rem; font-weight:500; cursor:pointer;
    transition:background .12s, color .12s;
    -webkit-tap-highlight-color:transparent;
    border-bottom:1px solid rgba(255,255,255,.04);
}
.qm-opt:last-child { border-bottom:none; }
.qm-opt:hover  { background:rgba(37,99,235,.15); color:#E2E8F0; }
.qm-opt.sel    { background:rgba(37,99,235,.2); color:#60A5FA; font-weight:700; }

/* mark buttons */
.qm-btns { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
.qm-p, .qm-a {
    padding:11px 8px; border-radius:11px; border:none;
    font-family:'Outfit',sans-serif; font-size:.85rem; font-weight:700;
    cursor:pointer; transition:all .15s ease; -webkit-tap-highlight-color:transparent;
}
.qm-p { background:linear-gradient(135deg,#059669,#047857); color:#fff; box-shadow:0 4px 12px rgba(5,150,105,.25); }
.qm-p:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(5,150,105,.35); }
.qm-p:active { transform:scale(.96); }
.qm-p:disabled { opacity:.3; cursor:not-allowed; transform:none; box-shadow:none; }
.qm-a { background:rgba(248,113,113,.1); color:#F87171; border:1px solid rgba(248,113,113,.2); }
.qm-a:hover { background:rgba(248,113,113,.2); transform:translateY(-2px); }
.qm-a:active { transform:scale(.96); }
.qm-a:disabled { opacity:.3; cursor:not-allowed; transform:none; }

/* ── SUMMARY ── */
.at-sum-row {
    display:flex; justify-content:space-between; align-items:center;
    padding:8px 11px; border-radius:10px;
    background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.04);
}
.at-sum-lbl { font-size:.74rem; color:rgba(148,163,184,.5); font-weight:500; }
.at-sum-val { font-size:.85rem; font-weight:800; }
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
                            <div className="at-stat-lbl">Overall Attendance</div>
                            <div className="at-stat-sub">{totalAttended} of {totalClasses} classes attended</div>
                        </div>
                    </div>
                    <div className="at-stat" style={{ animationDelay: '.06s' }}>
                        <div className="at-stat-mini">Safe</div>
                        <div className="at-stat-val" style={{ color: '#34D399' }}>{safeCount}</div>
                        <div style={{ fontSize: '.63rem', color: 'rgba(148,163,184,.3)', marginTop: 4 }}>≥ 75%</div>
                    </div>
                    <div className="at-stat" style={{ animationDelay: '.1s' }}>
                        <div className="at-stat-mini">At Risk</div>
                        <div className="at-stat-val" style={{ color: atRisk > 0 ? '#F87171' : 'rgba(148,163,184,.35)' }}>{atRisk}</div>
                        <div style={{ fontSize: '.63rem', color: 'rgba(148,163,184,.3)', marginTop: 4 }}>Below 75%</div>
                    </div>
                </div>

                {/* ADD FORM */}
                {addOpen && (
                    <div className="at-add-form">
                        <div className="at-add-title"><Plus size={13} color="#818CF8" /> New Subject</div>
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
                            <button className="at-btn-submit" onClick={handleAdd}
                                disabled={!newSubject.name.trim() || !newSubject.total}>
                                <Plus size={14} /> Add Subject
                            </button>
                            <button className="at-btn-cancel" onClick={() => setAddOpen(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* SUBJECT CARDS */}
                {attendanceSubjects.length === 0 ? (
                    <div className="at-empty">
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BookOpen size={19} color="#60A5FA" />
                        </div>
                        <h3>No subjects yet</h3>
                        <p>Tap "Add Subject" to start tracking</p>
                    </div>
                ) : (
                    <div className="at-grid">
                        {attendanceSubjects.map((s, idx) => {
                            const pct    = getPct(s);
                            const safe   = pct >= 75;
                            const status = getStatus(s);
                            const col    = safe ? '#34D399' : pct >= 50 ? '#FBBF24' : '#F87171';
                            const barG   = safe
                                ? 'linear-gradient(90deg,#34D399,#10B981)'
                                : pct >= 50
                                    ? 'linear-gradient(90deg,#FBBF24,#D97706)'
                                    : 'linear-gradient(90deg,#F87171,#EF4444)';

                            return (
                                <div key={s.id || s.name} className="at-card"
                                    style={{ animationDelay: `${idx * 0.04}s` }}>

                                    {/* top accent bar — subtle, not glowing */}
                                    <div className="at-card-top-bar" style={{ background: barG, opacity: 0.6 }} />

                                    {/* confirm delete overlay */}
                                    {toDelete === s.id && (
                                        <div className="at-confirm">
                                            <Trash2 size={18} color="#F87171" />
                                            <div className="at-confirm-msg">
                                                Delete <strong>{s.name}</strong>?<br />
                                                This cannot be undone.
                                            </div>
                                            <div className="at-cf-btns">
                                                <button className="at-cf-yes" onClick={() => handleDelete(s.id)}>Delete</button>
                                                <button className="at-cf-no"  onClick={() => setToDelete(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* name + percentage */}
                                    <div className="at-card-hd">
                                        <span className="at-card-name">{s.name}</span>
                                        <span className="at-card-pct" style={{ color: col }}>{pct}%</span>
                                    </div>

                                    {/* progress bar */}
                                    <div className="at-bar">
                                        <div className="at-bar-fill" style={{ width: `${pct}%`, background: barG }} />
                                    </div>

                                    {/* count + clear status message */}
                                    <div className="at-card-meta">
                                        <span className="at-count">{s.attended} of {s.total} classes attended</span>
                                        {status && (
                                            <span className="at-status-msg" style={{
                                                background: safe ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
                                                color:      safe ? '#34D399'              : col,
                                                border:     `1px solid ${safe ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)'}`,
                                            }}>
                                                {safe ? '✓' : '⚠'} {status.text}
                                            </span>
                                        )}
                                    </div>

                                    {/* action buttons */}
                                    <div className="at-card-acts">
                                        <button className="at-present" onClick={() => markPresent(s)}>
                                            <Check size={12} /> Present
                                        </button>
                                        <button className="at-absent" onClick={() => markAbsent(s)}>
                                            <X size={12} /> Absent
                                        </button>
                                        <button className="at-del" onClick={() => setToDelete(s.id)} title="Delete subject">
                                            <Trash2 size={13} />
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
                    <div className="at-panel" style={{ animationDelay: '.18s' }}>
                        <div className="at-panel-title">
                            <div className="at-panel-icon" style={{ background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)' }}>
                                <CheckCircle size={13} color="#34D399" />
                            </div>
                            Quick Mark
                        </div>
                        <p className="qm-desc">
                            Pick a subject and tap Present or Absent — updates instantly.
                        </p>

                        {/* Custom subject picker */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className={`qm-trigger${quickSel ? ' has-val' : ''}`}
                                onClick={() => setQmOpen(o => !o)}
                            >
                                <span>{quickSel || 'Tap to select subject…'}</span>
                                <ChevronDown size={14} style={{
                                    flexShrink: 0,
                                    transform: qmOpen ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform .2s ease',
                                    color: 'rgba(148,163,184,.4)',
                                }} />
                            </button>

                            {qmOpen && (
                                <div className="qm-list-wrap">
                                    <div className="qm-list">
                                        {qmOptions.length === 0 ? (
                                            <div style={{ padding: '12px', fontSize: '.8rem', color: 'rgba(148,163,184,.4)', textAlign: 'center' }}>
                                                No subjects yet
                                            </div>
                                        ) : qmOptions.map(name => (
                                            <button
                                                key={name}
                                                className={`qm-opt${quickSel === name ? ' sel' : ''}`}
                                                onClick={() => { setQuickSel(name); setQmOpen(false); }}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="qm-btns">
                            <button className="qm-p" disabled={!quickSel} onClick={quickPresent}>
                                ✓ Present
                            </button>
                            <button className="qm-a" disabled={!quickSel} onClick={quickAbsent}>
                                ✗ Absent
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="at-panel" style={{ animationDelay: '.22s' }}>
                        <div className="at-panel-title">
                            <div className="at-panel-icon" style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)' }}>
                                <TrendingUp size={13} color="#60A5FA" />
                            </div>
                            Summary
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {[
                                { label: 'Total Subjects', val: attendanceSubjects.length,   color: '#94A3B8' },
                                { label: 'Total Classes',  val: totalClasses,                color: '#60A5FA' },
                                { label: 'Attended',       val: totalAttended,               color: '#34D399' },
                                { label: 'Missed',         val: totalClasses - totalAttended, color: '#F87171' },
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
