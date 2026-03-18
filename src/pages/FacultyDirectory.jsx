import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, BookOpen, Phone, X, Plus, Trash2, Edit2,
    Code, Filter, RefreshCcw, Lightbulb, ChevronRight, Users, Sparkles
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import {
    collection, onSnapshot, addDoc, deleteDoc,
    updateDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

/* ─────────────────────────────────────────────────────────────
   STYLES  –  injected once, never re-injected
───────────────────────────────────────────────────────────── */
const STYLE_ID = 'fd-glass-v2';
function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

/* ── keyframes ── */
@keyframes fgFadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes fgScaleIn  { from{opacity:0;transform:scale(.93) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes fgSpin     { to{transform:rotate(360deg)} }
@keyframes fgPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.82)} }
@keyframes fgOrb1     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-15px) scale(1.08)} }
@keyframes fgOrb2     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-15px,12px) scale(1.06)} }
@keyframes fgShimmer  { 0%{background-position:-400% center} 100%{background-position:400% center} }
@keyframes fgGlow     { 0%,100%{box-shadow:0 0 18px rgba(99,102,241,.3)} 50%{box-shadow:0 0 36px rgba(99,102,241,.6)} }

/* ── page root ── */
.fg { font-family:'Plus Jakarta Sans',sans-serif; color:#e4ecf7; box-sizing:border-box; }
.fg *, .fg *::before, .fg *::after { box-sizing:inherit; }

/* ── background canvas ── */
.fg-bg {
    position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none;
    background:radial-gradient(ellipse at 20% 10%, #0f0c29 0%, #080818 40%, #020209 100%);
}
.fg-orb1 {
    position:absolute; width:520px; height:520px; border-radius:50%;
    background:radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 65%);
    top:-120px; right:-80px; animation:fgOrb1 9s ease-in-out infinite;
}
.fg-orb2 {
    position:absolute; width:380px; height:380px; border-radius:50%;
    background:radial-gradient(circle, rgba(168,85,247,.14) 0%, transparent 65%);
    bottom:-80px; left:-60px; animation:fgOrb2 11s ease-in-out infinite;
}
.fg-orb3 {
    position:absolute; width:260px; height:260px; border-radius:50%;
    background:radial-gradient(circle, rgba(56,189,248,.1) 0%, transparent 65%);
    top:40%; left:55%;
}

/* ── glass mixin helpers ── */
.fg-glass {
    background: rgba(255,255,255,0.045);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.1);
}
.fg-glass-strong {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.12);
}

/* ── hero ── */
.fg-hero {
    position:relative; border-radius:28px; overflow:hidden;
    padding:2.5rem 1.75rem 2rem; margin-bottom:1.5rem;
    background:linear-gradient(135deg,rgba(99,102,241,.15) 0%,rgba(168,85,247,.1) 50%,rgba(56,189,248,.08) 100%);
    backdrop-filter:blur(24px) saturate(180%);
    -webkit-backdrop-filter:blur(24px) saturate(180%);
    border:1px solid rgba(255,255,255,0.13);
    box-shadow:0 8px 48px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.1);
}
.fg-hero-noise {
    position:absolute; inset:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
    opacity:.6;
}
.fg-hero-shine {
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);
}
.fg-hero-inner { position:relative; z-index:1; }
.fg-hero-top {
    display:flex; justify-content:space-between; align-items:flex-start;
    flex-wrap:wrap; gap:10px; margin-bottom:1.25rem;
}
.fg-title {
    font-family:'Syne',sans-serif;
    font-size:clamp(1.75rem,6vw,2.6rem);
    font-weight:800; letter-spacing:-1.5px; margin:0 0 5px;
    background:linear-gradient(135deg,#fff 0%,#c4b5fd 40%,#93c5fd 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.fg-subtitle { color:rgba(196,181,253,.5); font-size:.87rem; margin:0; }
.fg-count-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 13px; border-radius:20px; white-space:nowrap;
    background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3);
    color:#a5b4fc; font-size:.73rem; font-weight:700; letter-spacing:.3px;
}
.fg-hero-btns { display:flex; gap:9px; flex-wrap:wrap; align-items:center; }

/* ── buttons ── */
.fg-btn-suggest {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 19px; border-radius:50px; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.82rem;
    border:1px solid rgba(52,211,153,.35);
    background:rgba(52,211,153,.1);
    color:#34d399; transition:all .22s; letter-spacing:.2px;
    backdrop-filter:blur(10px);
}
.fg-btn-suggest:hover {
    background:rgba(52,211,153,.2); border-color:rgba(52,211,153,.6);
    transform:translateY(-2px); box-shadow:0 6px 22px rgba(52,211,153,.2);
}
.fg-btn-suggest:active { transform:translateY(0); }
.fg-btn-add {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 19px; border-radius:50px; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.82rem;
    border:none; color:#fff; transition:all .22s;
    background:linear-gradient(135deg,#6366f1,#a855f7);
    box-shadow:0 4px 20px rgba(99,102,241,.4);
}
.fg-btn-add:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(99,102,241,.55); }
.fg-btn-add:active { transform:translateY(0); }

/* ── search bar ── */
.fg-searchbar {
    display:flex; gap:10px; flex-wrap:wrap;
    padding:12px 14px; border-radius:20px; margin-bottom:1.4rem;
    background:rgba(255,255,255,.04);
    backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.09);
    box-shadow:0 4px 24px rgba(0,0,0,.2);
}
.fg-search-wrap {
    flex:1; min-width:0; display:flex; align-items:center; gap:9px;
    background:rgba(0,0,0,.22); border:1px solid rgba(255,255,255,.08);
    border-radius:13px; padding:0 13px; transition:border-color .2s;
}
.fg-search-wrap:focus-within { border-color:rgba(99,102,241,.5); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
.fg-search-inp {
    flex:1; background:none; border:none; outline:none;
    color:#e4ecf7; font-size:.87rem; padding:11px 0;
    font-family:'Plus Jakarta Sans',sans-serif;
}
.fg-search-inp::placeholder { color:rgba(196,181,253,.28); }
.fg-chips { display:flex; gap:6px; overflow-x:auto; align-items:center; scrollbar-width:none; flex-wrap:nowrap; padding:1px 0; }
.fg-chips::-webkit-scrollbar { display:none; }
.fg-chip {
    padding:7px 13px; border-radius:20px; border:1px solid; font-size:.74rem;
    font-weight:600; cursor:pointer; white-space:nowrap; transition:all .15s;
    font-family:'Plus Jakarta Sans',sans-serif; flex-shrink:0;
}
.fg-chip-on  { background:rgba(99,102,241,.2);  border-color:rgba(99,102,241,.5);  color:#a5b4fc; }
.fg-chip-off { background:rgba(255,255,255,.03); border-color:rgba(255,255,255,.08); color:rgba(196,181,253,.4); }
.fg-chip-off:hover { background:rgba(255,255,255,.06); color:rgba(196,181,253,.7); }

/* ── section label ── */
.fg-label {
    font-size:.67rem; font-weight:700; letter-spacing:2px; text-transform:uppercase;
    color:rgba(99,102,241,.5); margin:0 0 1rem;
    display:flex; align-items:center; gap:8px;
}
.fg-label::after { content:''; flex:1; height:1px; background:rgba(99,102,241,.12); }

/* ── grid ── */
.fg-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }

/* ── faculty card ── */
.fg-card {
    position:relative; border-radius:20px; overflow:hidden; cursor:pointer;
    background:rgba(255,255,255,.055);
    backdrop-filter:blur(20px) saturate(160%);
    -webkit-backdrop-filter:blur(20px) saturate(160%);
    border:1px solid rgba(255,255,255,.1);
    box-shadow:0 4px 28px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1);
    transition:transform .28s cubic-bezier(.34,1.56,.64,1), border-color .22s, box-shadow .22s;
    animation:fgFadeUp .45s ease both;
}
.fg-card:hover {
    transform:translateY(-6px) scale(1.015);
    border-color:rgba(99,102,241,.4);
    box-shadow:0 18px 52px rgba(0,0,0,.4), 0 0 0 1px rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.14);
}
.fg-card:active { transform:translateY(-2px) scale(1.005); }
.fg-card-stripe {
    height:3px;
    background:linear-gradient(90deg, var(--ca,#6366f1), var(--cb,#a855f7), var(--cc,#38bdf8));
}
.fg-card-body { padding:1.2rem 1.2rem .9rem; }
.fg-card-row { display:flex; gap:13px; align-items:flex-start; }
.fg-av {
    width:54px; height:54px; border-radius:15px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:800; color:#fff;
    position:relative;
}
.fg-av::before {
    content:''; position:absolute; inset:-1px; border-radius:16px;
    background:inherit; filter:blur(12px); opacity:.35; z-index:-1;
}
.fg-card-meta { flex:1; min-width:0; }
.fg-card-name {
    font-family:'Syne',sans-serif; font-size:.96rem; font-weight:700;
    margin:0 0 2px; color:#f0f4ff; letter-spacing:-.2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.fg-card-desig {
    font-size:.74rem; color:rgba(196,181,253,.45); margin:0 0 8px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.fg-card-codes { display:flex; gap:5px; flex-wrap:wrap; }
.fg-code {
    padding:3px 9px; border-radius:7px; font-size:.68rem; font-weight:700;
    font-family:'Syne',sans-serif; letter-spacing:.4px;
    background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.22); color:#a5b4fc;
}
.fg-code-more {
    padding:3px 9px; border-radius:7px; font-size:.68rem;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); color:rgba(196,181,253,.35);
}
.fg-card-foot {
    display:flex; align-items:center; justify-content:space-between;
    padding:.75rem 1.2rem; margin-top:.8rem;
    border-top:1px solid rgba(255,255,255,.06);
}
.fg-dept { font-size:.69rem; font-weight:600; color:rgba(196,181,253,.35); letter-spacing:.3px; }
.fg-view { display:flex; align-items:center; gap:3px; font-size:.72rem; font-weight:700; color:rgba(99,102,241,.45); transition:color .15s; }
.fg-card:hover .fg-view { color:#a5b4fc; }
.fg-admin-btns { position:absolute; top:12px; right:12px; display:flex; gap:5px; opacity:0; transition:opacity .18s; }
.fg-card:hover .fg-admin-btns { opacity:1; }
.fg-ib {
    width:27px; height:27px; border-radius:8px; border:none; display:flex;
    align-items:center; justify-content:center; cursor:pointer; transition:all .15s;
    backdrop-filter:blur(8px);
}

/* ── empty state ── */
.fg-empty {
    grid-column:1/-1; text-align:center; padding:5rem 1.5rem;
    color:rgba(196,181,253,.28);
}

/* ── overlay ── */
.fg-overlay {
    position:fixed; inset:0; z-index:100;
    background:rgba(4,2,14,.75);
    backdrop-filter:blur(16px) saturate(120%);
    -webkit-backdrop-filter:blur(16px) saturate(120%);
    display:flex; align-items:center; justify-content:center;
    padding:1rem; animation:fgScaleIn .22s ease both;
}

/* ── detail modal ── */
.fg-modal {
    width:100%; max-width:480px; max-height:92vh; overflow-y:auto;
    border-radius:28px; position:relative;
    background:rgba(255,255,255,.08);
    backdrop-filter:blur(36px) saturate(200%);
    -webkit-backdrop-filter:blur(36px) saturate(200%);
    border:1px solid rgba(255,255,255,.15);
    box-shadow:0 24px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.14);
}
.fg-modal-stripe { height:4px; background:linear-gradient(90deg,#6366f1,#a855f7,#38bdf8); }
.fg-modal-head { padding:2rem 2rem 1.25rem; text-align:center; position:relative; }
.fg-modal-av {
    width:88px; height:88px; border-radius:22px; margin:0 auto 1rem;
    display:flex; align-items:center; justify-content:center;
    font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; color:#fff;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
}
.fg-modal-av::after { content:''; position:absolute; inset:-3px; border-radius:25px; background:inherit; filter:blur(16px); opacity:.3; z-index:-1; }
.fg-modal-name { font-family:'Syne',sans-serif; font-size:1.5rem; font-weight:800; margin:0 0 4px; color:#f0f4ff; letter-spacing:-.5px; }
.fg-modal-desig { font-size:.85rem; color:rgba(196,181,253,.6); margin:0 0 10px; }
.fg-modal-dept {
    display:inline-block; padding:4px 14px; border-radius:20px; font-size:.73rem; font-weight:700;
    background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.28); color:#a5b4fc;
}
.fg-modal-body { padding:0 1.5rem 1.75rem; display:grid; gap:9px; }
.fg-info-block {
    padding:12px 14px; border-radius:14px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.07);
    backdrop-filter:blur(10px);
}
.fg-ib-label {
    display:flex; align-items:center; gap:7px;
    font-size:.67rem; font-weight:700; letter-spacing:1px; text-transform:uppercase;
    margin-bottom:8px;
}
.fg-tags { display:flex; flex-wrap:wrap; gap:5px; }
.fg-tag-course {
    padding:5px 11px; border-radius:9px; font-size:.76rem; font-weight:500;
    background:rgba(56,189,248,.09); border:1px solid rgba(56,189,248,.2); color:#7dd3fc;
}
.fg-tag-code {
    padding:5px 11px; border-radius:9px; font-size:.73rem; font-weight:700;
    font-family:'Syne',sans-serif; letter-spacing:.5px;
    background:rgba(251,191,36,.08); border:1px solid rgba(251,191,36,.2); color:#fbbf24;
}
.fg-phone-row { display:flex; align-items:center; gap:12px; }
.fg-phone-ico { width:38px; height:38px; border-radius:11px; background:rgba(52,211,153,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fg-phone-lbl { font-size:.67rem; color:rgba(196,181,253,.38); text-transform:uppercase; letter-spacing:.8px; font-weight:700; margin-bottom:2px; }
.fg-phone-val { font-size:.92rem; color:#e4ecf7; font-family:'Syne',sans-serif; font-weight:600; }
.fg-call-btn {
    width:100%; padding:14px; border-radius:14px; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:.92rem; font-weight:700; color:#fff;
    display:flex; align-items:center; justify-content:center; gap:8px;
    background:linear-gradient(135deg,#6366f1,#a855f7);
    box-shadow:0 6px 24px rgba(99,102,241,.38); transition:all .2s; margin-top:4px;
}
.fg-call-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(99,102,241,.5); }
.fg-close {
    position:absolute; top:14px; right:14px; z-index:2;
    width:32px; height:32px; border-radius:9px; border:none; cursor:pointer;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
    display:flex; align-items:center; justify-content:center;
    color:rgba(196,181,253,.6); transition:all .15s;
}
.fg-close:hover { background:rgba(255,255,255,.13); color:#e4ecf7; }

/* ── suggest modal ── */
.fg-suggest {
    width:100%; max-width:460px; max-height:93vh; overflow-y:auto;
    border-radius:28px; position:relative;
    background:rgba(255,255,255,.07);
    backdrop-filter:blur(36px) saturate(200%);
    -webkit-backdrop-filter:blur(36px) saturate(200%);
    border:1px solid rgba(52,211,153,.2);
    box-shadow:0 24px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.12);
}
.fg-suggest-head {
    display:flex; align-items:center; gap:11px;
    padding:1.3rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.06);
    background:rgba(52,211,153,.04);
}
.fg-suggest-body { padding:1.25rem 1.5rem; display:grid; gap:10px; }
.fg-suggest-ico { width:38px; height:38px; border-radius:11px; background:rgba(52,211,153,.13); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fg-success { text-align:center; padding:3rem 2rem; }

/* ── admin form ── */
.fg-admin-form {
    border-radius:22px; padding:1.6rem; margin-bottom:1.5rem;
    background:rgba(255,255,255,.05);
    backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    border:1px solid rgba(99,102,241,.2);
    box-shadow:0 4px 30px rgba(0,0,0,.25);
    animation:fgFadeUp .3s ease both;
}
.fg-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.fg-lbl { font-size:.67rem; font-weight:700; color:rgba(196,181,253,.42); text-transform:uppercase; letter-spacing:.9px; margin-bottom:5px; display:block; }
.fg-inp {
    width:100%; padding:11px 13px; border-radius:11px; outline:none;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:.86rem; color:#e4ecf7;
    background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.09);
    transition:border-color .18s, box-shadow .18s;
}
.fg-inp:focus { border-color:rgba(99,102,241,.45); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
.fg-inp::placeholder { color:rgba(196,181,253,.22); }
.fg-submit {
    width:100%; padding:13px; border-radius:12px; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:.9rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#6366f1,#a855f7);
    box-shadow:0 4px 18px rgba(99,102,241,.35); transition:all .2s; margin-top:2px;
}
.fg-submit:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
.fg-submit:disabled { opacity:.45; cursor:not-allowed; }
.fg-suggest-btn {
    width:100%; padding:13px; border-radius:12px; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:.9rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#34d399,#059669);
    box-shadow:0 4px 18px rgba(52,211,153,.3); transition:all .2s;
}
.fg-suggest-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
.fg-suggest-btn:disabled { opacity:.45; cursor:not-allowed; }

/* ── loader ── */
.fg-spin { width:28px; height:28px; border:2.5px solid rgba(99,102,241,.15); border-top-color:#6366f1; border-radius:50%; animation:fgSpin .65s linear infinite; }

/* ── live dot ── */
.fg-dot { width:7px; height:7px; border-radius:50%; background:#34d399; box-shadow:0 0 6px #34d399; animation:fgPulse 2s ease-in-out infinite; }

/* ═══════════════════════════════════════
   RESPONSIVE — full mobile support
═══════════════════════════════════════ */
@media (max-width: 680px) {
    .fg-hero { padding:1.5rem 1.1rem 1.4rem; border-radius:22px; }
    .fg-title { letter-spacing:-.8px; }
    .fg-hero-top { flex-direction:column; gap:9px; }
    .fg-count-pill { align-self:flex-start; }
    .fg-hero-btns { gap:7px; }
    .fg-btn-suggest, .fg-btn-add { padding:10px 15px; font-size:.79rem; }
    .fg-searchbar { flex-direction:column; padding:10px; border-radius:16px; }
    .fg-search-wrap { min-width:0; }
    .fg-grid { grid-template-columns:1fr; }
    .fg-card { border-radius:18px; }
    .fg-admin-form { padding:1.2rem; border-radius:18px; }
    .fg-form-grid { grid-template-columns:1fr; }
    .fg-modal { border-radius:22px; }
    .fg-modal-head { padding:1.5rem 1.5rem 1rem; }
    .fg-modal-av { width:76px; height:76px; }
    .fg-modal-name { font-size:1.3rem; }
    .fg-modal-body { padding:0 1.2rem 1.5rem; }
    .fg-suggest { border-radius:22px; }
    .fg-suggest-body { padding:1rem 1.2rem; }
    .fg-suggest-head { padding:1rem 1.2rem; }
    .fg-overlay { padding:.75rem; align-items:flex-end; }
    .fg-modal, .fg-suggest { max-height:88vh; border-radius:22px 22px 0 0; }
}
@media (max-width: 400px) {
    .fg-hero { padding:1.2rem .9rem 1.2rem; }
    .fg-av { width:48px; height:48px; border-radius:12px; font-size:1.05rem; }
    .fg-card-name { font-size:.9rem; }
    .fg-card-body { padding:1rem; }
    .fg-card-foot { padding:.65rem 1rem; }
}
    `;
    const el = document.createElement('style');
    el.id = STYLE_ID; el.textContent = css;
    document.head.appendChild(el);
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const PALETTES = [
    { a:'#6366f1', b:'#a855f7' }, { a:'#f43f5e', b:'#fb7185' },
    { a:'#f59e0b', b:'#f97316' }, { a:'#10b981', b:'#06b6d4' },
    { a:'#0ea5e9', b:'#6366f1' }, { a:'#14b8a6', b:'#3b82f6' },
    { a:'#e11d48', b:'#a855f7' }, { a:'#8b5cf6', b:'#ec4899' },
];
const palette  = n  => PALETTES[(n?.charCodeAt(0) || 0) % PALETTES.length];
const gradient = n  => { const p = palette(n); return 'linear-gradient(135deg,' + p.a + ',' + p.b + ')'; };
const initials = nm => { const p = (nm||'').trim().split(' ').filter(Boolean); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (p[0]?.[0]||'?').toUpperCase(); };
const stripeVars = n => { const p = palette(n); return { '--ca': p.a, '--cb': p.b, '--cc': '#38bdf8' }; };

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const FacultyDirectory = () => {
    /* ── state ── */
    const [facultyList,     setFacultyList]     = useState([]);
    const [search,          setSearch]          = useState('');
    const [courseFilter,    setCourseFilter]    = useState('All');
    const [selected,        setSelected]        = useState(null);
    const [showForm,        setShowForm]        = useState(false);
    const [formLoad,        setFormLoad]        = useState(false);
    const [isEditing,       setIsEditing]       = useState(false);
    const [editId,          setEditId]          = useState(null);
    const [mounted,         setMounted]         = useState(false);
    const [showSuggest,     setShowSuggest]     = useState(false);
    const [suggestLoad,     setSuggestLoad]     = useState(false);
    const [suggestDone,     setSuggestDone]     = useState(false);

    const initSuggest = { name:'', designation:'', department:'', phone:'', courses:'', reason:'' };
    const [sForm, setSForm] = useState(initSuggest);

    const ADMIN = "palerugopi2008@gmail.com";
    const cu     = auth.currentUser;
    const isAdmin = cu?.email?.toLowerCase() === ADMIN.toLowerCase();

    const initForm = { name:'', designation:'', department:'CSE', phone:'', courses:[] };
    const [form,   setForm]   = useState(initForm);
    const [tmpC,   setTmpC]   = useState({ name:'', code:'' });

    /* ── bootstrap ── */
    useEffect(() => { injectStyles(); setMounted(true); }, []);

    /* ── realtime fetch ── */
    useEffect(() => {
        const q = query(collection(db,'faculty'), orderBy('name'));
        return onSnapshot(q, s => setFacultyList(s.docs.map(d => ({ id:d.id, ...d.data() }))));
    }, []);

    /* ── derived ── */
    const codes = useMemo(() => {
        const c = facultyList.flatMap(f => (f.courses||[]).map(x => x.code));
        return ['All', ...new Set(c.filter(Boolean))].sort();
    }, [facultyList]);

    const filtered = facultyList.filter(f => {
        const s = search.toLowerCase().trim();
        const hit = !s ||
            (f.name?.toLowerCase()||'').includes(s) ||
            (f.designation?.toLowerCase()||'').includes(s) ||
            (f.courses||[]).some(c => (c.name?.toLowerCase()||'').includes(s) || (c.code?.toLowerCase()||'').includes(s));
        const code = courseFilter==='All' || (f.courses||[]).some(c => c.code===courseFilter);
        return hit && code;
    });

    /* ── CRUD — logic completely unchanged ── */
    const handleSubmit = async e => {
        e.preventDefault(); setFormLoad(true);
        try {
            if (isEditing && editId) await updateDoc(doc(db,'faculty',editId), form);
            else await addDoc(collection(db,'faculty'), form);
            setForm(initForm); setTmpC({name:'',code:''});
            setShowForm(false); setIsEditing(false); setEditId(null);
        } catch(err) { console.error(err); }
        setFormLoad(false);
    };
    const handleDelete = async id => {
        if (window.confirm('Delete this faculty member?')) {
            await deleteDoc(doc(db,'faculty',id)); setSelected(null);
        }
    };
    const handleEdit = f => {
        setForm(f); setEditId(f.id); setIsEditing(true);
        setShowForm(true); setSelected(null);
        window.scrollTo({ top:0, behavior:'smooth' });
    };
    const addCourse = () => {
        if (tmpC.name && tmpC.code) {
            setForm({ ...form, courses:[...(form.courses||[]), tmpC] });
            setTmpC({ name:'', code:'' });
        }
    };
    const removeCourse = i => setForm({ ...form, courses:form.courses.filter((_,idx)=>idx!==i) });

    const handleSuggest = async e => {
        e.preventDefault();
        if (!cu) { alert('Please log in to suggest a faculty.'); return; }
        setSuggestLoad(true);
        try {
            await addDoc(collection(db,'facultySuggestions'), {
                ...sForm,
                suggestedBy: cu.displayName || cu.email || 'Anonymous',
                suggestedByEmail: cu.email || '',
                suggestedByUid: cu.uid || '',
                status:'pending',
                createdAt: serverTimestamp(),
            });
            setSuggestDone(true); setSForm(initSuggest);
            setTimeout(() => { setSuggestDone(false); setShowSuggest(false); }, 2400);
        } catch(err) { console.error(err); alert('Failed to submit. Please try again.'); }
        setSuggestLoad(false);
    };

    /* ── render ── */
    return (
        <DashboardLayout>
            {/* Fixed animated background */}
            <div className="fg-bg" aria-hidden="true">
                <div className="fg-orb1"/><div className="fg-orb2"/><div className="fg-orb3"/>
            </div>

            <div className="fg" style={{ opacity: mounted ? 1 : 0, transition:'opacity .4s ease' }}>

                {/* ══ HERO ══ */}
                <div className="fg-hero">
                    <div className="fg-hero-noise" aria-hidden="true"/>
                    <div className="fg-hero-shine" aria-hidden="true"/>
                    <div className="fg-hero-inner">
                        <div className="fg-hero-top">
                            <div>
                                <h1 className="fg-title">Faculty Directory</h1>
                                <p className="fg-subtitle">Find professors · course codes · contact info</p>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <div className="fg-dot"/>
                                <div className="fg-count-pill">
                                    <Users size={12}/> {facultyList.length} faculty
                                </div>
                            </div>
                        </div>
                        <div className="fg-hero-btns">
                            <button className="fg-btn-suggest" onClick={() => { setShowSuggest(true); setSuggestDone(false); }}>
                                <Lightbulb size={14}/> Suggest Faculty
                            </button>
                            {isAdmin && (
                                <button className="fg-btn-add" onClick={() => { setShowForm(!showForm); setIsEditing(false); setForm(initForm); }}>
                                    {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Faculty</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ ADMIN FORM ══ */}
                {isAdmin && showForm && (
                    <div className="fg-admin-form">
                        <h3 style={{ margin:'0 0 1.1rem', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:'#f0f4ff' }}>
                            {isEditing ? 'Edit Faculty Member' : 'Add New Faculty Member'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display:'grid', gap:'10px' }}>
                            <div className="fg-form-grid">
                                {[
                                    ['Full Name *',    'name',       'text',  'Dr. Rajesh Kumar',  true ],
                                    ['Designation *',  'designation','text',  'Associate Professor',true ],
                                    ['Department',     'department', 'text',  'CSE',               false],
                                    ['Phone',          'phone',      'text',  '9876543210',        false],
                                ].map(([lbl,key,type,ph,req]) => (
                                    <div key={key}>
                                        <label className="fg-lbl">{lbl}</label>
                                        <input className="fg-inp" type={type} placeholder={ph} required={req}
                                            value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} />
                                    </div>
                                ))}
                            </div>
                            {/* Course adder */}
                            <div style={{ background:'rgba(255,255,255,.03)', padding:'1rem', borderRadius:'12px', border:'1px solid rgba(255,255,255,.06)' }}>
                                <label className="fg-lbl" style={{ display:'block', marginBottom:'9px' }}>Courses Taught</label>
                                <div style={{ display:'flex', gap:'7px', marginBottom:'9px', flexWrap:'wrap' }}>
                                    <input className="fg-inp" type="text" placeholder="Code (e.g. CS101)" value={tmpC.code}
                                        onChange={e=>setTmpC({...tmpC,code:e.target.value})} style={{ flex:1, minWidth:'90px' }} />
                                    <input className="fg-inp" type="text" placeholder="Name (e.g. Java)" value={tmpC.name}
                                        onChange={e=>setTmpC({...tmpC,name:e.target.value})} style={{ flex:2, minWidth:'130px' }} />
                                    <button type="button" onClick={addCourse}
                                        style={{ padding:'0 14px', background:'linear-gradient(135deg,#34d399,#059669)', border:'none', borderRadius:'10px', cursor:'pointer', color:'#fff', flexShrink:0 }}>
                                        <Plus size={15}/>
                                    </button>
                                </div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                                    {form.courses?.map((c,i) => (
                                        <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', borderRadius:'8px', fontSize:'.78rem', color:'#a5b4fc' }}>
                                            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{c.code}</span>
                                            <span style={{ opacity:.35 }}>·</span>
                                            <span>{c.name}</span>
                                            <X size={11} style={{ cursor:'pointer', opacity:.5, marginLeft:'2px' }} onClick={() => removeCourse(i)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="fg-submit" disabled={formLoad}>
                                {formLoad ? 'Saving...' : (isEditing ? 'Update Faculty' : 'Save Faculty')}
                            </button>
                        </form>
                    </div>
                )}

                {/* ══ SEARCH BAR ══ */}
                <div className="fg-searchbar">
                    <div className="fg-search-wrap">
                        <Search size={15} color="rgba(99,102,241,.55)"/>
                        <input className="fg-search-inp" placeholder="Search name, course, code..." value={search} onChange={e=>setSearch(e.target.value)}/>
                        {search && <X size={14} style={{ cursor:'pointer', color:'rgba(196,181,253,.35)', flexShrink:0 }} onClick={()=>setSearch('')}/>}
                    </div>
                    <div className="fg-chips">
                        <Filter size={13} color="rgba(196,181,253,.3)" style={{ flexShrink:0 }}/>
                        {codes.map(c => (
                            <button key={c} className={'fg-chip ' + (courseFilter===c ? 'fg-chip-on' : 'fg-chip-off')} onClick={()=>setCourseFilter(c)}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══ RESULTS LABEL ══ */}
                <div className="fg-label">
                    {filtered.length} {filtered.length===1?'result':'results'}
                    {(search || courseFilter!=='All') ? ' · filtered' : ' · all faculty'}
                </div>

                {/* ══ FACULTY GRID ══ */}
                <div className="fg-grid">
                    {filtered.length === 0 ? (
                        <div className="fg-empty">
                            <RefreshCcw size={34} style={{ marginBottom:'12px', opacity:.22 }}/>
                            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, margin:'0 0 5px', fontSize:'1rem' }}>No faculty found</p>
                            <p style={{ fontSize:'.82rem', margin:0 }}>Try a different search or clear the filter</p>
                        </div>
                    ) : filtered.map((f, idx) => (
                        <div key={f.id} className="fg-card" style={{ animationDelay:(idx*.04)+'s', ...stripeVars(f.name) }} onClick={()=>setSelected(f)}>
                            <div className="fg-card-stripe"/>
                            <div className="fg-card-body">
                                <div className="fg-card-row">
                                    <div className="fg-av" style={{ background:gradient(f.name) }}>
                                        {initials(f.name)}
                                    </div>
                                    <div className="fg-card-meta">
                                        <p className="fg-card-name">{f.name}</p>
                                        <p className="fg-card-desig">{f.designation}</p>
                                        <div className="fg-card-codes">
                                            {(f.courses||[]).slice(0,2).map((c,i) => <span key={i} className="fg-code">{c.code}</span>)}
                                            {(f.courses?.length||0) > 2 && <span className="fg-code-more">+{f.courses.length-2}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="fg-card-foot">
                                <span className="fg-dept">{f.department||'Faculty'}</span>
                                <span className="fg-view">View <ChevronRight size={13}/></span>
                            </div>
                            {isAdmin && (
                                <div className="fg-admin-btns" onClick={e=>e.stopPropagation()}>
                                    <button className="fg-ib" style={{ background:'rgba(99,102,241,.18)', color:'#a5b4fc' }} onClick={()=>handleEdit(f)}><Edit2 size={12}/></button>
                                    <button className="fg-ib" style={{ background:'rgba(239,68,68,.16)', color:'#fca5a5' }} onClick={()=>handleDelete(f.id)}><Trash2 size={12}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ══ DETAIL MODAL ══ */}
                {selected && (
                    <div className="fg-overlay" onClick={()=>setSelected(null)}>
                        <div className="fg-modal" onClick={e=>e.stopPropagation()}>
                            <div className="fg-modal-stripe"/>
                            <button className="fg-close" onClick={()=>setSelected(null)}><X size={15}/></button>
                            <div className="fg-modal-head">
                                <div className="fg-modal-av" style={{ background:gradient(selected.name) }}>
                                    {initials(selected.name)}
                                </div>
                                <h2 className="fg-modal-name">{selected.name}</h2>
                                <p className="fg-modal-desig">{selected.designation}</p>
                                {selected.department && <span className="fg-modal-dept">{selected.department}</span>}
                            </div>
                            <div className="fg-modal-body">
                                {/* Courses */}
                                <div className="fg-info-block">
                                    <div className="fg-ib-label" style={{ color:'#38bdf8' }}><BookOpen size={13}/> Courses Taught</div>
                                    <div className="fg-tags">
                                        {(selected.courses||[]).length > 0
                                            ? selected.courses.map((c,i) => <span key={i} className="fg-tag-course">{c.name}</span>)
                                            : <span style={{ fontSize:'.8rem', color:'rgba(196,181,253,.3)' }}>No courses listed</span>}
                                    </div>
                                </div>
                                {/* Codes */}
                                <div className="fg-info-block">
                                    <div className="fg-ib-label" style={{ color:'#fbbf24' }}><Code size={13}/> Course Codes</div>
                                    <div className="fg-tags">
                                        {(selected.courses||[]).length > 0
                                            ? selected.courses.map((c,i) => <span key={i} className="fg-tag-code">{c.code}</span>)
                                            : <span style={{ fontSize:'.8rem', color:'rgba(196,181,253,.3)' }}>No codes listed</span>}
                                    </div>
                                </div>
                                {/* Phone */}
                                <div className="fg-info-block">
                                    <div className="fg-phone-row">
                                        <div className="fg-phone-ico"><Phone size={16} color="#34d399"/></div>
                                        <div>
                                            <div className="fg-phone-lbl">Phone</div>
                                            <div className="fg-phone-val">{selected.phone || 'Not available'}</div>
                                        </div>
                                    </div>
                                </div>
                                {selected.phone && (
                                    <button className="fg-call-btn" onClick={()=>window.location.href='tel:'+selected.phone}>
                                        <Phone size={16}/> Call Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ SUGGEST MODAL ══ */}
                {showSuggest && (
                    <div className="fg-overlay" onClick={()=>setShowSuggest(false)}>
                        <div className="fg-suggest" onClick={e=>e.stopPropagation()}>
                            <button className="fg-close" onClick={()=>setShowSuggest(false)}><X size={15}/></button>
                            <div className="fg-suggest-head">
                                <div className="fg-suggest-ico"><Lightbulb size={17} color="#34d399"/></div>
                                <div>
                                    <h3 style={{ margin:0, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'.97rem', color:'#f0f4ff' }}>Suggest a Faculty</h3>
                                    <p style={{ margin:0, fontSize:'.73rem', color:'rgba(196,181,253,.42)' }}>Sent to admin for review</p>
                                </div>
                            </div>
                            {suggestDone ? (
                                <div className="fg-success">
                                    <div style={{ fontSize:'3.5rem', marginBottom:'10px' }}>✅</div>
                                    <h4 style={{ fontFamily:"'Syne',sans-serif", color:'#34d399', fontWeight:700, margin:'0 0 6px' }}>Submitted!</h4>
                                    <p style={{ color:'rgba(196,181,253,.4)', fontSize:'.86rem', margin:0 }}>The admin will review it shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSuggest} className="fg-suggest-body">
                                    <div className="fg-form-grid">
                                        {[
                                            ['Faculty Name *','name',        true,  'Dr. Kumar'  ],
                                            ['Designation',   'designation', false, 'Professor'  ],
                                            ['Department',    'department',  false, 'CSE'        ],
                                            ['Phone',         'phone',       false, '9876543210' ],
                                        ].map(([lbl,key,req,ph]) => (
                                            <div key={key}>
                                                <label className="fg-lbl">{lbl}</label>
                                                <input className="fg-inp" type="text" required={req} placeholder={ph}
                                                    value={sForm[key]} onChange={e=>setSForm({...sForm,[key]:e.target.value})} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="fg-lbl">Courses Taught</label>
                                        <input className="fg-inp" type="text" placeholder="e.g. Data Structures, OS"
                                            value={sForm.courses} onChange={e=>setSForm({...sForm,courses:e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="fg-lbl">Why suggest? *</label>
                                        <textarea required rows={3} className="fg-inp"
                                            placeholder="e.g. They teach Java but aren't listed here..."
                                            value={sForm.reason} onChange={e=>setSForm({...sForm,reason:e.target.value})}
                                            style={{ resize:'vertical', fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
                                    </div>
                                    <button type="submit" className="fg-suggest-btn" disabled={suggestLoad}>
                                        {suggestLoad ? 'Submitting...' : 'Submit Suggestion'}
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
