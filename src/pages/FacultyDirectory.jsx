import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Search, Star, Mail, Filter, ChevronDown, ChevronUp,
    Phone, BookOpen, Code, Plus, X, Trash2, Edit2,
    Lightbulb, Users, TrendingUp, Sparkles, Award, RefreshCcw
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import {
    collection, onSnapshot, addDoc, deleteDoc,
    updateDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

/* ═══════════════════════════════════════════════════════
   STYLE INJECTION  — runs once, never repeats
═══════════════════════════════════════════════════════ */
const __SID = 'fd-neon-v4';
function injectCSS() {
    if (document.getElementById(__SID)) return;
    const el = document.createElement('style');
    el.id = __SID;
    el.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap');

/* ─ root ─ */
.fdn { font-family:'Inter',sans-serif; color:#cbd5e1; }
.fdn *, .fdn *::before, .fdn *::after { box-sizing:border-box; }

/* ─ keyframes ─ */
@keyframes fdnUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fdnIn    { from{opacity:0;transform:scale(.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes fdnSpin  { to{transform:rotate(360deg)} }
@keyframes fdnPing  { 0%{transform:scale(1);opacity:1} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
@keyframes fdnGlow  { 0%,100%{opacity:.65} 50%{opacity:1} }
@keyframes fdnShimmer { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
@keyframes fdnRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes fdnPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.45)} 60%{box-shadow:0 0 0 10px rgba(99,102,241,0)} }
@keyframes fdnBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes fdnExpandIn {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0); }
}

/* ─ HERO ─ */
.fdn-hero {
    border-radius:22px; overflow:hidden; position:relative;
    padding:clamp(1.4rem,4vw,2.2rem) clamp(1.2rem,4vw,1.8rem);
    margin-bottom:1.4rem;
    background:linear-gradient(135deg,#0f0c29 0%,#1a1040 45%,#0d1b2a 100%);
    border:1px solid rgba(99,102,241,.2);
    box-shadow:0 0 0 1px rgba(255,255,255,.04), 0 8px 40px rgba(0,0,0,.4);
}
.fdn-hero::before {
    content:''; position:absolute; top:-100px; right:-60px;
    width:340px; height:340px; border-radius:50%;
    background:radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 65%);
    pointer-events:none;
}
.fdn-hero::after {
    content:''; position:absolute; bottom:-60px; left:15%;
    width:240px; height:240px; border-radius:50%;
    background:radial-gradient(circle, rgba(168,85,247,.11) 0%, transparent 65%);
    pointer-events:none;
}
.fdn-hero-inner { position:relative; z-index:1; }
.fdn-hero-top {
    display:flex; justify-content:space-between;
    align-items:flex-start; flex-wrap:wrap; gap:.8rem; margin-bottom:1.2rem;
}
.fdn-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:clamp(1.6rem,5.5vw,2.4rem);
    font-weight:700; letter-spacing:-.8px; margin:0 0 5px;
    background:linear-gradient(135deg,#f8fafc 15%,#c4b5fd 55%,#818cf8 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.fdn-sub { color:rgba(148,163,184,.5); font-size:.86rem; margin:0; }
.fdn-badge {
    display:inline-flex; align-items:center; gap:6px; padding:5px 13px;
    border-radius:30px; font-size:.72rem; font-weight:700; letter-spacing:.3px;
    background:rgba(99,102,241,.14); border:1px solid rgba(99,102,241,.28);
    color:#a5b4fc; white-space:nowrap; align-self:flex-start;
}
.fdn-live { width:6px; height:6px; border-radius:50%; background:#818cf8; position:relative; }
.fdn-live::after {
    content:''; position:absolute; inset:0; border-radius:50%; background:#818cf8;
    animation:fdnPing 1.8s ease-in-out infinite;
}
.fdn-hero-btns { display:flex; gap:8px; flex-wrap:wrap; }

/* ─ BUTTONS ─ */
.fdn-btn {
    display:inline-flex; align-items:center; gap:7px; padding:10px 18px;
    border-radius:11px; font-size:.83rem; font-weight:700; cursor:pointer;
    font-family:'Inter',sans-serif; border:1px solid transparent;
    transition:all .18s cubic-bezier(.4,0,.2,1); white-space:nowrap;
}
.fdn-btn-outline {
    background:rgba(52,211,153,.08); border-color:rgba(52,211,153,.28); color:#34d399;
}
.fdn-btn-outline:hover { background:rgba(52,211,153,.16); border-color:rgba(52,211,153,.5); transform:translateY(-1px); }
.fdn-btn-solid {
    background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff;
    box-shadow:0 4px 16px rgba(99,102,241,.35);
}
.fdn-btn-solid:hover { transform:translateY(-1px); box-shadow:0 7px 22px rgba(99,102,241,.5); }
.fdn-btn:active { transform:translateY(0) !important; }

/* ─ GLASS SEARCH BAR ─ */
.fdn-search-bar {
    display:flex; gap:10px; align-items:stretch; flex-wrap:wrap;
    padding:10px 12px; border-radius:16px; margin-bottom:1.2rem;
    background:rgba(255,255,255,.04);
    backdrop-filter:blur(16px) saturate(150%);
    -webkit-backdrop-filter:blur(16px) saturate(150%);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 4px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.06);
}
.fdn-search-inner {
    flex:1; min-width:180px; display:flex; align-items:center; gap:9px;
    background:rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.07);
    border-radius:10px; padding:0 13px; transition:border-color .2s, box-shadow .2s;
}
.fdn-search-inner:focus-within {
    border-color:rgba(99,102,241,.5);
    box-shadow:0 0 0 3px rgba(99,102,241,.12);
}
.fdn-search-input {
    flex:1; background:none; border:none; outline:none; color:#e2e8f0;
    font-size:.87rem; padding:11px 0; font-family:'Inter',sans-serif;
}
.fdn-search-input::placeholder { color:rgba(148,163,184,.28); }

/* ─ FILTER CHIPS ─ */
.fdn-chips-row {
    display:flex; gap:6px; overflow-x:auto; scrollbar-width:none;
    padding-bottom:2px; margin-bottom:1.5rem; align-items:center;
}
.fdn-chips-row::-webkit-scrollbar { display:none; }
.fdn-chip-lbl {
    font-size:.68rem; font-weight:700; color:rgba(148,163,184,.35);
    text-transform:uppercase; letter-spacing:1.2px; white-space:nowrap;
    display:flex; align-items:center; gap:5px; flex-shrink:0; padding-right:4px;
}
.fdn-chip {
    padding:7px 14px; border-radius:20px; border:1px solid; font-size:.74rem;
    font-weight:600; cursor:pointer; white-space:nowrap; transition:all .14s;
    font-family:'Inter',sans-serif; flex-shrink:0;
}
.fdn-chip-on  { background:rgba(99,102,241,.18); border-color:rgba(99,102,241,.45); color:#a5b4fc; }
.fdn-chip-off { background:rgba(255,255,255,.03); border-color:rgba(255,255,255,.08); color:rgba(148,163,184,.5); }
.fdn-chip-off:hover { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.14); color:rgba(203,213,225,.7); }

/* ─ SECTION HEADER ─ */
.fdn-sec {
    display:flex; align-items:center; gap:9px; margin-bottom:1rem;
}
.fdn-sec-icon {
    width:30px; height:30px; border-radius:9px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
}
.fdn-sec-label { font-size:.84rem; font-weight:700; letter-spacing:.2px; }
.fdn-sec-line { flex:1; height:1px; background:rgba(255,255,255,.06); }

/* ─ TOP RATED STRIP ─ */
.fdn-top-strip {
    display:flex; gap:.85rem; overflow-x:auto; scrollbar-width:none;
    padding-bottom:6px; margin-bottom:1.75rem;
}
.fdn-top-strip::-webkit-scrollbar { display:none; }
.fdn-top-card {
    flex-shrink:0; width:190px; border-radius:18px; overflow:hidden; cursor:pointer;
    background:linear-gradient(145deg,#1a1040,#0f0c29);
    border:1px solid rgba(99,102,241,.2);
    padding:1.1rem 1rem; position:relative;
    transition:transform .22s cubic-bezier(.34,1.56,.64,1), border-color .2s, box-shadow .2s;
    animation:fdnUp .4s ease both;
}
.fdn-top-card::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:120px; height:120px; border-radius:50%;
    background:radial-gradient(circle,rgba(99,102,241,.18),transparent 70%);
    pointer-events:none;
}
.fdn-top-card:hover {
    transform:translateY(-5px) scale(1.025);
    border-color:rgba(99,102,241,.45);
    box-shadow:0 12px 36px rgba(0,0,0,.4), 0 0 0 1px rgba(99,102,241,.15);
}
.fdn-top-av-wrap { position:relative; display:inline-block; margin-bottom:.7rem; }
.fdn-top-av {
    width:50px; height:50px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:#fff;
    position:relative; z-index:1;
}
.fdn-top-av-ring {
    position:absolute; inset:-2px; border-radius:50%; z-index:0;
    padding:2px; animation:fdnRotate 3s linear infinite;
}
.fdn-top-rank {
    position:absolute; bottom:-3px; right:-3px; z-index:2;
    width:19px; height:19px; border-radius:50%;
    background:linear-gradient(135deg,#f59e0b,#ef4444);
    font-size:.6rem; font-weight:800; color:#fff;
    display:flex; align-items:center; justify-content:center;
    border:2px solid #0f0c29;
}
.fdn-top-name {
    font-size:.83rem; font-weight:700; color:#f1f5f9; margin:0 0 2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    font-family:'Space Grotesk',sans-serif;
}
.fdn-top-dept { font-size:.7rem; color:rgba(148,163,184,.45); margin:0 0 7px; }
.fdn-top-stars { display:flex; align-items:center; gap:2px; }
.fdn-top-avg { font-size:.72rem; font-weight:700; color:#fbbf24; margin-left:4px; }

/* ─ SORT + COUNT ROW ─ */
.fdn-sort-row {
    display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:.6rem; margin-bottom:1rem;
}
.fdn-sort-count { font-size:.77rem; color:rgba(148,163,184,.45); font-weight:500; }
.fdn-sort-btns { display:flex; gap:4px; }
.fdn-sort-btn {
    padding:5px 11px; border-radius:7px; border:1px solid; font-size:.72rem;
    font-weight:600; cursor:pointer; transition:all .13s; font-family:'Inter',sans-serif;
}
.fdn-sort-on  { background:rgba(99,102,241,.15); border-color:rgba(99,102,241,.35); color:#a5b4fc; }
.fdn-sort-off { background:transparent; border-color:rgba(255,255,255,.07); color:rgba(148,163,184,.42); }
.fdn-sort-off:hover { background:rgba(255,255,255,.04); border-color:rgba(255,255,255,.13); color:rgba(203,213,225,.65); }

/* ─ MAIN GRID ─ */
.fdn-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap:1rem;
}

/* ─ FACULTY CARD ─ */
.fdn-card {
    border-radius:18px; overflow:visible; cursor:pointer; position:relative;
    background:#1e293b;
    border:1px solid rgba(255,255,255,.07);
    box-shadow:0 2px 16px rgba(0,0,0,.2);
    transition:transform .22s cubic-bezier(.34,1.56,.64,1), border-color .2s, box-shadow .2s;
    animation:fdnUp .4s ease both;
}
.fdn-card:hover {
    transform:translateY(-4px);
    border-color:rgba(99,102,241,.3);
    box-shadow:0 12px 36px rgba(0,0,0,.35), 0 0 0 1px rgba(99,102,241,.1);
}
.fdn-card-bar { height:3px; border-radius:18px 18px 0 0; }
.fdn-card-body { padding:1.2rem 1.15rem .9rem; }

/* neon avatar */
.fdn-av-wrap { position:relative; flex-shrink:0; }
.fdn-av-ring {
    position:absolute; inset:-3px; border-radius:50%; z-index:0;
    animation:fdnGlow 2.5s ease-in-out infinite;
}
.fdn-av {
    width:54px; height:54px; border-radius:50%; position:relative; z-index:1;
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:#fff;
    border:2px solid rgba(255,255,255,.15);
}
.fdn-prof-row { display:flex; align-items:flex-start; gap:12px; margin-bottom:.9rem; }
.fdn-prof-info { flex:1; min-width:0; }
.fdn-faculty-name {
    font-family:'Space Grotesk',sans-serif; font-size:.97rem; font-weight:700;
    color:#f1f5f9; margin:0 0 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    letter-spacing:-.2px;
}
.fdn-dept-pill {
    display:inline-block; padding:3px 10px; border-radius:20px;
    font-size:.67rem; font-weight:700; letter-spacing:.4px;
    margin-bottom:5px; text-transform:uppercase;
}
.fdn-stars-row { display:flex; align-items:center; gap:3px; }
.fdn-avg-val   { font-size:.78rem; font-weight:700; color:#fbbf24; margin-left:3px; }
.fdn-review-ct { font-size:.69rem; color:rgba(148,163,184,.4); }

/* sentiment tag */
.fdn-sentiment {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:20px; font-size:.74rem; font-weight:700;
    margin-bottom:.9rem; position:relative; overflow:visible;
}
.fdn-sentiment::before {
    content:''; position:absolute; inset:-1px; border-radius:20px;
    background:inherit; filter:blur(8px); opacity:.4; z-index:-1;
}

/* card admin actions */
.fdn-card-actions {
    position:absolute; top:10px; right:10px;
    display:flex; gap:4px; opacity:0; transition:opacity .18s; z-index:5;
}
.fdn-card:hover .fdn-card-actions { opacity:1; }
.fdn-ico-btn {
    width:26px; height:26px; border-radius:7px; border:none;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .14s;
}

/* card footer */
.fdn-card-foot {
    display:flex; align-items:center; justify-content:space-between;
    padding:.75rem 1.15rem; background:rgba(0,0,0,.18);
    border-top:1px solid rgba(255,255,255,.05); gap:8px;
}
.fdn-dept-tag { font-size:.68rem; font-weight:600; color:rgba(148,163,184,.35); letter-spacing:.3px; text-transform:uppercase; }
.fdn-expand-btn {
    display:flex; align-items:center; gap:5px; padding:5px 11px;
    border-radius:8px; border:1px solid rgba(255,255,255,.09);
    background:rgba(255,255,255,.04); cursor:pointer; font-size:.72rem;
    font-weight:700; color:rgba(148,163,184,.65); transition:all .14s;
    font-family:'Inter',sans-serif; white-space:nowrap;
}
.fdn-expand-btn:hover { background:rgba(99,102,241,.1); border-color:rgba(99,102,241,.28); color:#a5b4fc; }

/* ─ EXPAND PANEL ─ */
.fdn-expand-panel {
    overflow:hidden; transition:max-height .38s cubic-bezier(.4,0,.2,1), opacity .3s ease;
    max-height:0; opacity:0;
}
.fdn-expand-panel.open { max-height:700px; opacity:1; }
.fdn-expand-inner {
    padding:.9rem 1.15rem 1rem;
    border-top:1px solid rgba(255,255,255,.05);
    display:grid; gap:.6rem;
    animation:fdnExpandIn .3s ease both;
}
.fdn-detail-row {
    display:flex; justify-content:space-between; align-items:center;
    padding:8px 11px; background:rgba(255,255,255,.025);
    border-radius:9px; border:1px solid rgba(255,255,255,.05);
}
.fdn-dk { font-size:.72rem; color:rgba(148,163,184,.45); font-weight:600; }
.fdn-dv { font-size:.8rem; color:#e2e8f0; font-weight:600; }
.fdn-course-chip {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:8px; font-size:.72rem; font-weight:600;
    background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.2); color:#a5b4fc;
    margin:3px;
}
.fdn-code-chip {
    display:inline-flex; padding:4px 10px; border-radius:8px;
    font-size:.7rem; font-weight:700; letter-spacing:.4px;
    background:rgba(251,191,36,.08); border:1px solid rgba(251,191,36,.2); color:#fbbf24;
    margin:3px;
}
.fdn-call-btn {
    width:100%; padding:11px; border-radius:11px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:.88rem; font-weight:700; color:#fff;
    display:flex; align-items:center; justify-content:center; gap:7px; margin-top:4px;
    background:linear-gradient(135deg,#0ea5e9,#6366f1);
    box-shadow:0 4px 16px rgba(14,165,233,.3); transition:all .18s;
}
.fdn-call-btn:hover { transform:translateY(-1px); box-shadow:0 7px 22px rgba(14,165,233,.45); }

/* ─ EMPTY ─ */
.fdn-empty { grid-column:1/-1; text-align:center; padding:5rem 1rem; color:rgba(148,163,184,.3); }

/* ─ SKELETON ─ */
.fdn-skel {
    border-radius:18px; height:170px;
    background:linear-gradient(90deg,#1e293b 0%,#2d3748 50%,#1e293b 100%);
    background-size:300% 100%; animation:fdnShimmer 1.5s ease-in-out infinite;
    border:1px solid rgba(255,255,255,.05);
}

/* ─ MODAL OVERLAY ─ */
.fdn-overlay {
    position:fixed; inset:0; z-index:300;
    background:rgba(2,6,23,.88); backdrop-filter:blur(14px);
    display:flex; align-items:center; justify-content:center;
    padding:1rem; animation:fdnIn .2s ease both;
}
.fdn-modal {
    width:100%; max-width:480px; max-height:90vh; overflow-y:auto;
    border-radius:22px; background:#0f172a;
    border:1px solid rgba(255,255,255,.1);
    box-shadow:0 24px 72px rgba(0,0,0,.7); position:relative;
}
.fdn-modal-stripe { height:4px; background:linear-gradient(90deg,#6366f1,#a855f7,#38bdf8); border-radius:22px 22px 0 0; }
.fdn-modal-head { padding:1.6rem 1.6rem 1.1rem; }
.fdn-modal-title { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; margin:0 0 3px; color:#f1f5f9; }
.fdn-modal-sub { font-size:.79rem; color:rgba(148,163,184,.45); margin:0; }
.fdn-modal-body { padding:0 1.5rem 1.6rem; display:grid; gap:10px; }
.fdn-lbl { font-size:.66rem; font-weight:700; color:rgba(148,163,184,.42); text-transform:uppercase; letter-spacing:.9px; margin-bottom:5px; display:block; }
.fdn-inp {
    width:100%; padding:10px 13px; border-radius:10px; outline:none;
    font-family:'Inter',sans-serif; font-size:.86rem; color:#e2e8f0;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    transition:border-color .18s, box-shadow .18s;
}
.fdn-inp:focus { border-color:rgba(99,102,241,.45); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
.fdn-inp::placeholder { color:rgba(148,163,184,.22); }
.fdn-inp-row { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
.fdn-sub-btn {
    width:100%; padding:12px; border-radius:11px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:.9rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    box-shadow:0 4px 16px rgba(99,102,241,.35); transition:all .18s;
}
.fdn-sub-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 7px 22px rgba(99,102,241,.5); }
.fdn-sub-btn:disabled { opacity:.45; cursor:not-allowed; }
.fdn-close {
    position:absolute; top:12px; right:12px; z-index:2;
    width:30px; height:30px; border-radius:8px; border:none; cursor:pointer;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center;
    color:rgba(148,163,184,.6); transition:all .14s;
}
.fdn-close:hover { background:rgba(255,255,255,.11); color:#e2e8f0; }

/* ─ SUGGEST MODAL ─ */
.fdn-sug-modal {
    width:100%; max-width:450px; max-height:92vh; overflow-y:auto;
    border-radius:22px; background:#0f172a;
    border:1px solid rgba(52,211,153,.2);
    box-shadow:0 24px 72px rgba(0,0,0,.65); position:relative;
}
.fdn-sug-head {
    padding:1.2rem 1.5rem; display:flex; align-items:center; gap:11px;
    border-bottom:1px solid rgba(255,255,255,.05); background:rgba(52,211,153,.03);
}
.fdn-sug-ico { width:36px; height:36px; border-radius:10px; background:rgba(52,211,153,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fdn-sug-body { padding:1.2rem 1.5rem; display:grid; gap:9px; }
.fdn-sug-btn {
    width:100%; padding:12px; border-radius:11px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:.9rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#10b981,#059669);
    box-shadow:0 4px 16px rgba(16,185,129,.3); transition:all .18s;
}
.fdn-sug-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 7px 22px rgba(16,185,129,.45); }
.fdn-sug-btn:disabled { opacity:.45; cursor:not-allowed; }
.fdn-success { text-align:center; padding:2.75rem 1.5rem; }
.fdn-detail-modal {
    width:100%; max-width:460px; max-height:90vh; overflow-y:auto;
    border-radius:22px; background:#0f172a;
    border:1px solid rgba(255,255,255,.1);
    box-shadow:0 24px 72px rgba(0,0,0,.7); position:relative;
}
.fdn-dm-head { padding:1.8rem 1.8rem 1.2rem; text-align:center; }
.fdn-dm-av {
    width:88px; height:88px; border-radius:50%; margin:0 auto .9rem; position:relative;
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:1.8rem; font-weight:700; color:#fff;
    z-index:1;
}
.fdn-dm-ring {
    position:absolute; inset:-4px; border-radius:50%; z-index:0;
    animation:fdnRotate 3s linear infinite;
}
.fdn-dm-name { font-family:'Space Grotesk',sans-serif; font-size:1.4rem; font-weight:700; margin:0 0 5px; color:#f1f5f9; letter-spacing:-.3px; }
.fdn-dm-desig { font-size:.84rem; color:rgba(148,163,184,.55); margin:0 0 9px; }
.fdn-dm-body { padding:0 1.5rem 1.6rem; display:grid; gap:8px; }
.fdn-dm-section { padding:11px 13px; border-radius:12px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); }
.fdn-dm-section-lbl { font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:1.1px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }

/* ═══════════════════ RESPONSIVE ═══════════════════ */
/* Large tablet */
@media (max-width:900px) {
    .fdn-grid { grid-template-columns:repeat(2, 1fr); }
}
/* Tablet */
@media (max-width:768px) {
    .fdn-top-strip { gap:.7rem; }
    .fdn-top-card { width:168px; padding:.9rem; }
    .fdn-inp-row { grid-template-columns:1fr; }
}
/* Mobile */
@media (max-width:600px) {
    .fdn-grid { grid-template-columns:1fr; gap:.8rem; }
    .fdn-hero { padding:1.35rem 1rem; border-radius:17px; }
    .fdn-title { font-size:1.5rem; }
    .fdn-hero-top { flex-direction:column; gap:.65rem; }
    .fdn-badge { align-self:flex-start; }
    .fdn-hero-btns { gap:7px; }
    .fdn-btn { padding:9px 14px; font-size:.8rem; }
    .fdn-search-bar { flex-direction:column; padding:9px 10px; border-radius:14px; }
    .fdn-search-inner { min-width:0; }
    .fdn-top-card { width:155px; padding:.85rem; }
    .fdn-card-body { padding:1rem; }
    .fdn-av { width:48px; height:48px; font-size:1rem; }
    .fdn-card-foot { padding:.65rem 1rem; }
    /* Bottom sheet modals on mobile */
    .fdn-overlay { align-items:flex-end; padding:0; }
    .fdn-modal, .fdn-sug-modal, .fdn-detail-modal {
        max-height:88vh; max-width:100%;
        border-radius:22px 22px 0 0;
    }
    .fdn-modal-stripe { border-radius:22px 22px 0 0; }
    .fdn-sort-row { flex-direction:column; align-items:flex-start; }
    .fdn-sort-btns { flex-wrap:wrap; }
}
/* Very small phones */
@media (max-width:380px) {
    .fdn-av { width:44px; height:44px; font-size:.95rem; }
    .fdn-faculty-name { font-size:.9rem; }
    .fdn-hero { padding:1.1rem .85rem; }
    .fdn-btn { padding:8px 12px; font-size:.78rem; }
    .fdn-top-card { width:142px; padding:.75rem; }
}
`;
    document.head.appendChild(el);
}

/* ═══════════════════════════════════════════════════════
   DATA HELPERS
═══════════════════════════════════════════════════════ */
const DEPT_PALETTES = {
    CSE:  { bg:'rgba(99,102,241,.15)',  b:'rgba(99,102,241,.32)',  c:'#a5b4fc', nc:'#6366f1', nc2:'#8b5cf6' },
    IT:   { bg:'rgba(139,92,246,.14)',  b:'rgba(139,92,246,.3)',   c:'#c4b5fd', nc:'#8b5cf6', nc2:'#a855f7' },
    AIML: { bg:'rgba(16,185,129,.12)',  b:'rgba(16,185,129,.28)',  c:'#6ee7b7', nc:'#10b981', nc2:'#06b6d4' },
    AIDS: { bg:'rgba(244,63,94,.12)',   b:'rgba(244,63,94,.28)',   c:'#fda4af', nc:'#f43f5e', nc2:'#ec4899' },
    ECE:  { bg:'rgba(236,72,153,.12)',  b:'rgba(236,72,153,.28)',  c:'#f9a8d4', nc:'#ec4899', nc2:'#a855f7' },
    EEE:  { bg:'rgba(56,189,248,.12)',  b:'rgba(56,189,248,.28)',  c:'#7dd3fc', nc:'#0ea5e9', nc2:'#6366f1' },
    MECH: { bg:'rgba(245,158,11,.12)',  b:'rgba(245,158,11,.28)',  c:'#fcd34d', nc:'#f59e0b', nc2:'#ef4444' },
    CIVIL:{ bg:'rgba(20,184,166,.12)',  b:'rgba(20,184,166,.28)',  c:'#5eead4', nc:'#14b8a6', nc2:'#0ea5e9' },
    BT:   { bg:'rgba(168,85,247,.12)',  b:'rgba(168,85,247,.28)',  c:'#d8b4fe', nc:'#a855f7', nc2:'#ec4899' },
};
const DEFAULT_PALETTE = { bg:'rgba(148,163,184,.1)', b:'rgba(148,163,184,.22)', c:'rgba(148,163,184,.7)', nc:'#64748b', nc2:'#94a3b8' };
const deptPal = d => DEPT_PALETTES[(d||'').toUpperCase()] || DEFAULT_PALETTE;

const CARD_GRADS = [
    ['#6366f1','#a855f7'], ['#ec4899','#f43f5e'], ['#10b981','#0ea5e9'],
    ['#f59e0b','#ef4444'], ['#0ea5e9','#6366f1'], ['#8b5cf6','#ec4899'],
    ['#14b8a6','#3b82f6'], ['#f97316','#f59e0b'],
];
const cardGrad = nm => CARD_GRADS[(nm?.charCodeAt(0)||0) % CARD_GRADS.length];

const SENTIMENTS = [
    { tag:'Helpful',           emoji:'✨', bg:'rgba(16,185,129,.15)',  b:'rgba(16,185,129,.38)', c:'#34d399' },
    { tag:'Clear Explanations',emoji:'💡', bg:'rgba(99,102,241,.15)',  b:'rgba(99,102,241,.38)', c:'#a5b4fc' },
    { tag:'Strict',            emoji:'⚡', bg:'rgba(239,68,68,.13)',   b:'rgba(239,68,68,.32)',  c:'#fca5a5' },
    { tag:'Engaging',          emoji:'🔥', bg:'rgba(245,158,11,.13)',  b:'rgba(245,158,11,.32)', c:'#fcd34d' },
    { tag:'Student-Friendly',  emoji:'👍', bg:'rgba(56,189,248,.13)',  b:'rgba(56,189,248,.32)', c:'#7dd3fc' },
    { tag:'Research-Oriented', emoji:'🔬', bg:'rgba(139,92,246,.15)',  b:'rgba(139,92,246,.35)', c:'#c4b5fd' },
    { tag:'Practical',         emoji:'🛠️', bg:'rgba(20,184,166,.13)',  b:'rgba(20,184,166,.32)', c:'#5eead4' },
    { tag:'Well-Known',        emoji:'🌟', bg:'rgba(251,191,36,.13)',  b:'rgba(251,191,36,.32)', c:'#fbbf24' },
];
const getSentiment = (dept, reviews = []) => {
    // aggregate feedback keywords from reviews array
    const text = reviews.map(r => (r.feedback||'').toLowerCase()).join(' ');
    if (text.includes('helpful') || text.includes('help')) return SENTIMENTS[0];
    if (text.includes('clear') || text.includes('explain')) return SENTIMENTS[1];
    if (text.includes('strict') || text.includes('tough')) return SENTIMENTS[2];
    if (text.includes('engag') || text.includes('interest')) return SENTIMENTS[3];
    if (text.includes('practical') || text.includes('lab')) return SENTIMENTS[6];
    if (text.includes('research')) return SENTIMENTS[5];
    const d = (dept||'').toUpperCase();
    if (['AIML','AIDS','CSE','IT'].includes(d)) return SENTIMENTS[1];
    if (['MECH','CIVIL','EEE'].includes(d)) return SENTIMENTS[6];
    return SENTIMENTS[7];
};

const ini = nm => {
    const p = (nm||'').trim().split(' ').filter(Boolean);
    return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (p[0]?.[0]||'?').toUpperCase();
};

/* Star row */
const Stars = ({ rating, size = 13 }) => (
    <div style={{ display:'flex', gap:'2px' }}>
        {[1,2,3,4,5].map(i => (
            <Star key={i} size={size}
                fill={i <= Math.round(rating) ? '#fbbf24' : 'none'}
                color={i <= Math.round(rating) ? '#fbbf24' : 'rgba(148,163,184,.2)'}
                strokeWidth={1.5}
            />
        ))}
    </div>
);

/* ═══════════════════════════════════════════════════════
   FACULTY CARD  (with expand animation)
═══════════════════════════════════════════════════════ */
const FacultyCard = ({ f, isAdmin, onEdit, onDelete, reviews, idx }) => {
    const [open, setOpen] = useState(false);
    const pal  = deptPal(f.department);
    const [gc1, gc2] = cardGrad(f.name);
    const sent = getSentiment(f.department, reviews);

    // compute avg rating from reviews for this faculty
    const fReviews = reviews.filter(r => r.facultyName === f.name);
    const avgRating = fReviews.length
        ? (fReviews.reduce((s, r) => s + (r.rating || 0), 0) / fReviews.length)
        : null;

    return (
        <div className="fdn-card" style={{ animationDelay: (idx * .04) + 's' }}>
            {/* color bar */}
            <div className="fdn-card-bar" style={{ background:`linear-gradient(90deg,${gc1},${gc2})` }}/>

            <div className="fdn-card-body">
                {/* profile row */}
                <div className="fdn-prof-row">
                    {/* neon avatar */}
                    <div className="fdn-av-wrap">
                        <div className="fdn-av-ring" style={{
                            background: `conic-gradient(${pal.nc}, ${pal.nc2}, ${pal.nc})`,
                            filter: `drop-shadow(0 0 6px ${pal.nc}88)`,
                        }}/>
                        <div className="fdn-av" style={{ background:`linear-gradient(135deg,${gc1},${gc2})` }}>
                            {ini(f.name)}
                        </div>
                    </div>

                    <div className="fdn-prof-info">
                        <p className="fdn-faculty-name">{f.name}</p>
                        {/* dept pill */}
                        <span className="fdn-dept-pill" style={{ background:pal.bg, border:`1px solid ${pal.b}`, color:pal.c }}>
                            {f.department || 'Faculty'}
                        </span>
                        {/* stars */}
                        <div className="fdn-stars-row">
                            <Stars rating={avgRating || 0} size={13}/>
                            {avgRating !== null
                                ? <><span className="fdn-avg-val">{avgRating.toFixed(1)}</span><span className="fdn-review-ct">({fReviews.length})</span></>
                                : <span className="fdn-review-ct" style={{ marginLeft:'4px' }}>No reviews yet</span>
                            }
                        </div>
                    </div>
                </div>

                {/* sentiment tag */}
                <div className="fdn-sentiment" style={{ background:sent.bg, border:`1px solid ${sent.b}`, color:sent.c }}>
                    <span>{sent.emoji}</span> {sent.tag}
                </div>

                {/* designation */}
                {f.designation && (
                    <p style={{ fontSize:'.79rem', color:'rgba(148,163,184,.55)', margin:'0 0 .5rem', lineHeight:'1.4' }}>
                        {f.designation}
                    </p>
                )}

                {/* EXPAND PANEL */}
                <div className={`fdn-expand-panel ${open ? 'open' : ''}`}>
                    <div className="fdn-expand-inner">
                        {/* courses */}
                        {(f.courses||[]).length > 0 && (
                            <div>
                                <p style={{ fontSize:'.67rem', fontWeight:700, color:'rgba(56,189,248,.6)', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 6px', display:'flex', alignItems:'center', gap:'5px' }}>
                                    <BookOpen size={11}/> Courses Taught
                                </p>
                                <div style={{ display:'flex', flexWrap:'wrap' }}>
                                    {f.courses.map((c, i) => (
                                        <span key={i} className="fdn-course-chip">{c.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* course codes */}
                        {(f.courses||[]).length > 0 && (
                            <div>
                                <p style={{ fontSize:'.67rem', fontWeight:700, color:'rgba(251,191,36,.6)', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 6px', display:'flex', alignItems:'center', gap:'5px' }}>
                                    <Code size={11}/> Course Codes
                                </p>
                                <div style={{ display:'flex', flexWrap:'wrap' }}>
                                    {f.courses.map((c, i) => (
                                        <span key={i} className="fdn-code-chip">{c.code}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* phone */}
                        {f.phone && (
                            <div className="fdn-detail-row">
                                <span className="fdn-dk" style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                    <Phone size={11}/> Phone
                                </span>
                                <span className="fdn-dv">{f.phone}</span>
                            </div>
                        )}
                        {/* recent reviews */}
                        {fReviews.length > 0 && (
                            <div>
                                <p style={{ fontSize:'.67rem', fontWeight:700, color:'rgba(148,163,184,.4)', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 7px', display:'flex', alignItems:'center', gap:'5px' }}>
                                    <Star size={11}/> Latest Review
                                </p>
                                <div style={{ padding:'9px 11px', background:'rgba(255,255,255,.025)', borderRadius:'9px', border:'1px solid rgba(255,255,255,.05)' }}>
                                    <p style={{ fontSize:'.78rem', color:'rgba(203,213,225,.7)', margin:0, lineHeight:'1.6', fontStyle:'italic' }}>
                                        "{fReviews[0].feedback?.slice(0, 140)}{(fReviews[0].feedback?.length||0) > 140 ? '…' : ''}"
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* call button */}
                        {f.phone && (
                            <button className="fdn-call-btn" onClick={() => window.location.href = 'tel:' + f.phone}>
                                <Phone size={15}/> Call Now
                            </button>
                        )}
                        {/* mail button */}
                        {f.email && (
                            <button className="fdn-call-btn" style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 4px 16px rgba(16,185,129,.3)' }}
                                onClick={() => window.location.href = 'mailto:' + f.email}>
                                <Mail size={15}/> Email
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* footer */}
            <div className="fdn-card-foot">
                <span className="fdn-dept-tag">{f.department || '—'}</span>
                <button className="fdn-expand-btn" onClick={() => setOpen(o => !o)}>
                    {open ? <><ChevronUp size={13}/> Collapse</> : <><ChevronDown size={13}/> Details</>}
                </button>
            </div>

            {/* admin controls */}
            {isAdmin && (
                <div className="fdn-card-actions">
                    <button className="fdn-ico-btn" style={{ background:'rgba(99,102,241,.18)', color:'#a5b4fc' }}
                        onClick={e => { e.stopPropagation(); onEdit(f); }}><Edit2 size={12}/></button>
                    <button className="fdn-ico-btn" style={{ background:'rgba(239,68,68,.15)', color:'#fca5a5' }}
                        onClick={e => { e.stopPropagation(); onDelete(f.id); }}><Trash2 size={12}/></button>
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const FacultyDirectory = () => {
    const [list,      setList]      = useState([]);
    const [reviews,   setReviews]   = useState([]);
    const [search,    setSearch]    = useState('');
    const [deptFilt,  setDeptFilt]  = useState('All');
    const [sortBy,    setSortBy]    = useState('alpha');
    const [showForm,  setShowForm]  = useState(false);
    const [formLoad,  setFormLoad]  = useState(false);
    const [editing,   setEditing]   = useState(false);
    const [editId,    setEditId]    = useState(null);
    const [showSug,   setShowSug]   = useState(false);
    const [sugLoad,   setSugLoad]   = useState(false);
    const [sugDone,   setSugDone]   = useState(false);
    const [mounted,   setMounted]   = useState(false);

    const initSug = { name:'', designation:'', department:'', phone:'', courses:'', reason:'' };
    const [sForm, setSForm] = useState(initSug);
    const initFrm = { name:'', designation:'', department:'CSE', phone:'', email:'', courses:[] };
    const [form,  setForm]  = useState(initFrm);
    const [tmpC,  setTmpC]  = useState({ name:'', code:'' });

    const cu      = auth.currentUser;
    const isAdmin = cu?.email?.toLowerCase() === 'palerugopi2008@gmail.com';

    useEffect(() => { injectCSS(); setMounted(true); }, []);

    // Faculty realtime
    useEffect(() => {
        const q = query(collection(db, 'faculty'), orderBy('name'));
        return onSnapshot(q, s => setList(s.docs.map(d => ({ id:d.id, ...d.data() }))));
    }, []);

    // Reviews realtime (to compute ratings + sentiment)
    useEffect(() => {
        const q = query(collection(db, 'facultyReviews'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, s => setReviews(s.docs.map(d => ({ id:d.id, ...d.data() }))));
    }, []);

    /* ── derived data ── */
    const DEPTS = useMemo(() => {
        const d = new Set(list.map(f => f.department).filter(Boolean));
        return ['All', ...d].sort();
    }, [list]);

    // Top rated this week
    const topRated = useMemo(() => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent  = reviews.filter(r => {
            const t = r.createdAt?.toDate?.()?.getTime?.() || 0;
            return t > weekAgo;
        });
        const map = {};
        recent.forEach(r => {
            if (!map[r.facultyName]) map[r.facultyName] = { name:r.facultyName, ratings:[], dept:r.department||'' };
            map[r.facultyName].ratings.push(r.rating||0);
        });
        const ranked = Object.values(map)
            .map(x => ({ ...x, avg: x.ratings.reduce((a,b)=>a+b,0)/x.ratings.length, count:x.ratings.length }))
            .filter(x => x.count >= 1)
            .sort((a,b) => b.avg - a.avg)
            .slice(0, 8);
        // Fallback: top from all time
        if (ranked.length < 3) {
            const allMap = {};
            reviews.forEach(r => {
                if (!allMap[r.facultyName]) allMap[r.facultyName] = { name:r.facultyName, ratings:[], dept:r.department||'' };
                allMap[r.facultyName].ratings.push(r.rating||0);
            });
            return Object.values(allMap)
                .map(x => ({ ...x, avg:x.ratings.reduce((a,b)=>a+b,0)/x.ratings.length, count:x.ratings.length }))
                .filter(x => x.count >= 1)
                .sort((a,b) => b.avg - a.avg)
                .slice(0, 8);
        }
        return ranked;
    }, [reviews]);

    const filtered = useMemo(() => {
        let r = [...list];
        if (deptFilt !== 'All') r = r.filter(f => f.department === deptFilt);
        if (search) {
            const s = search.toLowerCase();
            r = r.filter(f =>
                (f.name?.toLowerCase()||'').includes(s) ||
                (f.designation?.toLowerCase()||'').includes(s) ||
                (f.courses||[]).some(c => (c.name?.toLowerCase()||'').includes(s) || (c.code?.toLowerCase()||'').includes(s))
            );
        }
        if (sortBy === 'alpha') r.sort((a,b) => (a.name||'').localeCompare(b.name||''));
        if (sortBy === 'dept')  r.sort((a,b) => (a.department||'').localeCompare(b.department||''));
        if (sortBy === 'rating') {
            r.sort((a,b) => {
                const ra = reviews.filter(x=>x.facultyName===a.name);
                const rb = reviews.filter(x=>x.facultyName===b.name);
                const avgA = ra.length ? ra.reduce((s,x)=>s+(x.rating||0),0)/ra.length : 0;
                const avgB = rb.length ? rb.reduce((s,x)=>s+(x.rating||0),0)/rb.length : 0;
                return avgB - avgA;
            });
        }
        return r;
    }, [list, deptFilt, search, sortBy, reviews]);

    /* ── CRUD ── */
    const save = async e => {
        e.preventDefault(); setFormLoad(true);
        try {
            if (editing && editId) await updateDoc(doc(db,'faculty',editId), form);
            else await addDoc(collection(db,'faculty'), form);
            setForm(initFrm); setTmpC({name:'',code:''});
            setShowForm(false); setEditing(false); setEditId(null);
        } catch(err) { console.error(err); }
        setFormLoad(false);
    };
    const del = async id => {
        if (!window.confirm('Delete this faculty member?')) return;
        await deleteDoc(doc(db,'faculty',id));
    };
    const edit = f => {
        setForm({...initFrm,...f}); setEditId(f.id); setEditing(true);
        setShowForm(true); window.scrollTo({top:0,behavior:'smooth'});
    };
    const addCourse = () => {
        if (tmpC.name && tmpC.code) {
            setForm({...form, courses:[...(form.courses||[]), tmpC]});
            setTmpC({name:'',code:''});
        }
    };
    const remCourse = i => setForm({...form, courses:form.courses.filter((_,idx)=>idx!==i)});

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
                createdAt: serverTimestamp(),
            });
            setSugDone(true); setSForm(initSug);
            setTimeout(()=>{ setSugDone(false); setShowSug(false); }, 2500);
        } catch(err) { console.error(err); alert('Failed. Please try again.'); }
        setSugLoad(false);
    };

    return (
        <DashboardLayout>
            <div className="fdn" style={{ opacity:mounted?1:0, transition:'opacity .35s' }}>

                {/* ══ HERO ══ */}
                <div className="fdn-hero">
                    <div className="fdn-hero-inner">
                        <div className="fdn-hero-top">
                            <div>
                                <h1 className="fdn-title">Faculty Directory</h1>
                                <p className="fdn-sub">Find professors · courses · ratings · contact info</p>
                            </div>
                            <div className="fdn-badge">
                                <span className="fdn-live"/>
                                <Users size={11}/> {list.length} faculty
                            </div>
                        </div>
                        <div className="fdn-hero-btns">
                            <button className="fdn-btn fdn-btn-outline" onClick={()=>{ setShowSug(true); setSugDone(false); }}>
                                <Lightbulb size={14}/> Suggest Faculty
                            </button>
                            {isAdmin && (
                                <button className="fdn-btn fdn-btn-solid" onClick={()=>{ setShowForm(!showForm); setEditing(false); setForm(initFrm); }}>
                                    {showForm ? <><X size={13}/> Cancel</> : <><Plus size={13}/> Add Faculty</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ ADMIN FORM ══ */}
                {isAdmin && showForm && (
                    <div style={{ borderRadius:'18px', padding:'1.4rem', background:'#1e293b', border:'1px solid rgba(99,102,241,.2)', marginBottom:'1.25rem', animation:'fdnUp .3s ease both' }}>
                        <p style={{ margin:'0 0 1rem', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'.97rem', color:'#f1f5f9' }}>
                            {editing ? 'Edit Faculty' : 'Add New Faculty'}
                        </p>
                        <form onSubmit={save} style={{ display:'grid', gap:'9px' }}>
                            <div className="fdn-inp-row">
                                {[['Full Name *','name','Dr. Rajesh Kumar',true],['Designation *','designation','Assoc. Professor',true],
                                  ['Department','department','CSE',false],['Phone','phone','9876543210',false]].map(([l,k,p,r])=>(
                                    <div key={k}><label className="fdn-lbl">{l}</label>
                                    <input className="fdn-inp" type="text" placeholder={p} required={r}
                                        value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>
                                ))}
                            </div>
                            <div style={{ background:'rgba(255,255,255,.025)', padding:'11px 13px', borderRadius:'11px', border:'1px solid rgba(255,255,255,.06)' }}>
                                <label className="fdn-lbl" style={{ display:'block', marginBottom:'8px' }}>Courses Taught</label>
                                <div style={{ display:'flex', gap:'7px', marginBottom:'8px', flexWrap:'wrap' }}>
                                    <input className="fdn-inp" type="text" placeholder="Code e.g. CS101" value={tmpC.code}
                                        onChange={e=>setTmpC({...tmpC,code:e.target.value})} style={{ flex:1, minWidth:'80px' }}/>
                                    <input className="fdn-inp" type="text" placeholder="Name e.g. Java" value={tmpC.name}
                                        onChange={e=>setTmpC({...tmpC,name:e.target.value})} style={{ flex:2, minWidth:'110px' }}/>
                                    <button type="button" onClick={addCourse}
                                        style={{ padding:'0 13px', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:'9px', cursor:'pointer', color:'#fff', flexShrink:0 }}>
                                        <Plus size={15}/>
                                    </button>
                                </div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                                    {form.courses?.map((c,i)=>(
                                        <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 9px', background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.22)', borderRadius:'7px', fontSize:'.76rem', color:'#a5b4fc' }}>
                                            <b>{c.code}</b> · {c.name}
                                            <X size={11} style={{ cursor:'pointer', opacity:.55 }} onClick={()=>remCourse(i)}/>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="fdn-sub-btn" disabled={formLoad}>
                                {formLoad ? 'Saving...' : (editing ? 'Update Faculty' : 'Save Faculty')}
                            </button>
                        </form>
                    </div>
                )}

                {/* ══ GLASS SEARCH BAR ══ */}
                <div className="fdn-search-bar">
                    <div className="fdn-search-inner">
                        <Search size={15} color="rgba(99,102,241,.5)"/>
                        <input className="fdn-search-input"
                            placeholder="Search by name, course, course code..."
                            value={search} onChange={e=>setSearch(e.target.value)}/>
                        {search && <X size={14} style={{ cursor:'pointer', color:'rgba(148,163,184,.4)', flexShrink:0 }} onClick={()=>setSearch('')}/>}
                    </div>
                </div>

                {/* ══ DEPARTMENT FILTER CHIPS ══ */}
                <div className="fdn-chips-row">
                    <span className="fdn-chip-lbl"><Filter size={11}/> Dept</span>
                    {DEPTS.map(d => (
                        <button key={d} className={'fdn-chip ' + (deptFilt===d?'fdn-chip-on':'fdn-chip-off')}
                            onClick={()=>setDeptFilt(d)}>{d}</button>
                    ))}
                </div>

                {/* ══ TOP RATED THIS WEEK ══ */}
                {topRated.length > 0 && (
                    <div style={{ marginBottom:'1.75rem' }}>
                        <div className="fdn-sec">
                            <div className="fdn-sec-icon" style={{ background:'rgba(245,158,11,.14)' }}>
                                <TrendingUp size={15} color="#fbbf24"/>
                            </div>
                            <span className="fdn-sec-label" style={{ color:'#fbbf24' }}>
                                Top Rated This Week
                            </span>
                            <div className="fdn-sec-line"/>
                            <span style={{ fontSize:'.7rem', color:'rgba(148,163,184,.35)', whiteSpace:'nowrap' }}>Click to search</span>
                        </div>
                        <div className="fdn-top-strip">
                            {topRated.map((f, i) => {
                                const [gc1, gc2] = cardGrad(f.name);
                                const pal = deptPal(f.dept);
                                return (
                                    <div key={f.name} className="fdn-top-card" style={{ animationDelay:(i*.06)+'s' }}
                                        onClick={() => setSearch(f.name)}>
                                        <div className="fdn-top-av-wrap">
                                            <div className="fdn-top-av-ring" style={{
                                                background:`conic-gradient(${gc1},${gc2},${gc1})`,
                                                filter:`blur(1px) drop-shadow(0 0 4px ${gc1}88)`,
                                            }}/>
                                            <div className="fdn-top-av" style={{ background:`linear-gradient(135deg,${gc1},${gc2})` }}>
                                                {ini(f.name)}
                                            </div>
                                            <div className="fdn-top-rank">#{i+1}</div>
                                        </div>
                                        <p className="fdn-top-name">{f.name}</p>
                                        <p className="fdn-top-dept">{f.dept || 'Faculty'} · {f.count} review{f.count>1?'s':''}</p>
                                        <div className="fdn-top-stars">
                                            <Stars rating={f.avg} size={11}/>
                                            <span className="fdn-top-avg">{f.avg.toFixed(1)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ══ ALL FACULTY ══ */}
                <div className="fdn-sec">
                    <div className="fdn-sec-icon" style={{ background:'rgba(99,102,241,.14)' }}>
                        <Users size={15} color="#a5b4fc"/>
                    </div>
                    <span className="fdn-sec-label" style={{ color:'#a5b4fc' }}>All Faculty</span>
                    <div className="fdn-sec-line"/>
                </div>

                {/* sort + count */}
                <div className="fdn-sort-row">
                    <span className="fdn-sort-count">
                        {filtered.length} {filtered.length===1?'result':'results'}
                        {(search||deptFilt!=='All') ? ' · filtered' : ''}
                    </span>
                    <div className="fdn-sort-btns">
                        {[['alpha','A–Z'],['dept','By Dept'],['rating','Top Rated']].map(([v,l])=>(
                            <button key={v} className={'fdn-sort-btn '+(sortBy===v?'fdn-sort-on':'fdn-sort-off')}
                                onClick={()=>setSortBy(v)}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* ══ GRID ══ */}
                <div className="fdn-grid">
                    {filtered.length === 0 ? (
                        <div className="fdn-empty">
                            <RefreshCcw size={34} style={{ marginBottom:'12px', opacity:.22 }}/>
                            <p style={{ fontWeight:600, margin:'0 0 4px', fontSize:'1rem' }}>No faculty found</p>
                            <p style={{ fontSize:'.82rem', margin:0 }}>Try clearing your search or filter</p>
                        </div>
                    ) : filtered.map((f, i) => (
                        <FacultyCard
                            key={f.id} f={f} idx={i}
                            isAdmin={isAdmin}
                            onEdit={edit} onDelete={del}
                            reviews={reviews}
                        />
                    ))}
                </div>

                {/* ══ SUGGEST MODAL ══ */}
                {showSug && (
                    <div className="fdn-overlay" onClick={()=>setShowSug(false)}>
                        <div className="fdn-sug-modal" onClick={e=>e.stopPropagation()}>
                            <button className="fdn-close" onClick={()=>setShowSug(false)}><X size={14}/></button>
                            <div className="fdn-sug-head">
                                <div className="fdn-sug-ico"><Lightbulb size={16} color="#34d399"/></div>
                                <div>
                                    <p style={{ margin:0, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'.95rem', color:'#f1f5f9' }}>Suggest a Faculty</p>
                                    <p style={{ margin:0, fontSize:'.73rem', color:'rgba(148,163,184,.42)' }}>Admin will review your suggestion</p>
                                </div>
                            </div>
                            {sugDone ? (
                                <div className="fdn-success">
                                    <div style={{ fontSize:'3.2rem', marginBottom:'10px' }}>✅</div>
                                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:'#34d399', margin:'0 0 5px', fontSize:'1rem' }}>Submitted!</p>
                                    <p style={{ color:'rgba(148,163,184,.42)', fontSize:'.83rem', margin:0 }}>Admin will review it shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={submitSug} className="fdn-sug-body">
                                    <div className="fdn-inp-row">
                                        {[['Faculty Name *','name',true,'Dr. Kumar'],['Designation','designation',false,'Professor'],
                                          ['Department','department',false,'CSE'],['Phone','phone',false,'9876543210']].map(([l,k,r,p])=>(
                                            <div key={k}><label className="fdn-lbl">{l}</label>
                                            <input className="fdn-inp" type="text" required={r} placeholder={p}
                                                value={sForm[k]} onChange={e=>setSForm({...sForm,[k]:e.target.value})}/></div>
                                        ))}
                                    </div>
                                    <div><label className="fdn-lbl">Courses Taught</label>
                                        <input className="fdn-inp" type="text" placeholder="e.g. Data Structures, OS"
                                            value={sForm.courses} onChange={e=>setSForm({...sForm,courses:e.target.value})}/></div>
                                    <div><label className="fdn-lbl">Why suggest? *</label>
                                        <textarea required rows={3} className="fdn-inp"
                                            placeholder="e.g. They teach Java but aren't listed..."
                                            value={sForm.reason} onChange={e=>setSForm({...sForm,reason:e.target.value})}
                                            style={{ resize:'vertical', fontFamily:"'Inter',sans-serif" }}/></div>
                                    <button type="submit" className="fdn-sug-btn" disabled={sugLoad}>
                                        {sugLoad ? 'Submitting...' : 'Submit Suggestion'}
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
