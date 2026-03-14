import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Send, MessageCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

const fmtDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }); }
    catch { return ''; }
};

const TopBar = ({ toggleSidebar }) => {
    const { user }  = useAuth();
    const navigate  = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [panelOpen,     setPanelOpen]     = useState(false);
    const [replyText,     setReplyText]     = useState({});
    const [unread,        setUnread]        = useState(0);
    const [visible,       setVisible]       = useState(true);   // hide-on-scroll
    const [atTop,         setAtTop]         = useState(true);
    const lastY = useRef(0);

    // ── Hide / show on scroll ─────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setAtTop(y < 10);
            if (y < 10) { setVisible(true); lastY.current = y; return; }
            if (y > lastY.current + 8) { setVisible(false); }   // scroll down → hide
            else if (y < lastY.current - 5) { setVisible(true); } // scroll up  → show
            lastY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Notifications ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setNotifications(list);
            const seen = parseInt(localStorage.getItem(`acadeMe_notif_seen_${user.uid}`) || '0');
            setUnread(Math.max(0, list.length - seen));
        }, console.error);
        return () => unsub();
    }, [user?.uid]);

    const openPanel = () => {
        setPanelOpen(true);
        if (user?.uid) {
            localStorage.setItem(`acadeMe_notif_seen_${user.uid}`, String(notifications.length));
            setUnread(0);
        }
    };

    const handleReply = async (id) => {
        const text = replyText[id]?.trim();
        if (!text) return;
        try {
            await updateDoc(doc(db, 'notifications', id), {
                replies: arrayUnion({ sender: 'user', text, timestamp: new Date().toISOString() }),
            });
            setReplyText(p => ({ ...p, [id]: '' }));
        } catch (e) { console.error(e); }
    };

    const avatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366F1&color=fff&size=128&bold=true`;

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        /* ═══════════════════ KEYFRAMES ═══════════════════ */
        @keyframes tb-slide-in  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes tb-card-in   { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tb-badge-pop { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes tb-pulse     { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 5px rgba(239,68,68,0)} }
        @keyframes tb-ring      { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(14deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(8deg)} }
        @keyframes tb-bounce    { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} 60%{transform:translateY(-2px)} }
        @keyframes tb-spin-once { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes tb-wiggle    { 0%,100%{transform:scale(1) rotate(0)} 25%{transform:scale(1.15) rotate(-8deg)} 75%{transform:scale(1.15) rotate(8deg)} }
        @keyframes tb-avatar-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 5px rgba(99,102,241,0.15)} }
        @keyframes tb-shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }

        /* ═══════════════════ BAR ═══════════════════ */
        .tb {
            position: fixed; top: 0; left: 0; right: 0; z-index: 200;
            height: 62px;
            display: flex; align-items: center;
            padding: 0 14px 0 16px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        .tb.hidden  { transform: translateY(-100%); }
        .tb.visible { transform: translateY(0); }
        .tb.scrolled {
            background: rgba(8, 12, 30, 0.94);
            backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
            border-bottom: 1px solid rgba(255,255,255,0.07);
            box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .tb.top {
            background: rgba(8, 12, 30, 0.7);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        /* Shimmer top line */
        .tb::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg,
                transparent 0%, rgba(99,102,241,0.6) 30%,
                rgba(56,189,248,0.5) 65%, transparent 100%);
            background-size: 200% 100%;
            animation: tb-shimmer 4s linear infinite;
        }

        /* ═══════════════════ HAMBURGER ═══════════════════ */
        .tb-ham {
            width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(148,163,184,0.85); cursor: pointer; outline: none;
            transition: background .2s, color .2s, transform .15s;
            -webkit-tap-highlight-color: transparent;
        }
        .tb-ham:hover  { background: rgba(255,255,255,0.1); color: #F1F5F9; }
        .tb-ham:active { transform: scale(0.9); }
        .tb-ham:hover .tb-ham-icon { animation: tb-wiggle 0.4s ease; }
        @media (min-width: 768px) { .tb-ham { display: none !important; } }

        /* ═══════════════════ APP NAME (centre) ═══════════════════ */
        .tb-brand {
            flex: 1; text-align: center;
            font-size: 1.05rem; font-weight: 800; letter-spacing: -0.3px;
            background: linear-gradient(135deg, #ffffff 0%, #818CF8 50%, #38BDF8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; background-size: 200% 100%;
            animation: tb-shimmer 5s linear infinite;
            user-select: none;
        }
        /* On desktop, brand shifts left since no hamburger */
        @media (min-width: 768px) {
            .tb-brand { text-align: left; margin-left: 2px; }
        }

        /* ═══════════════════ RIGHT CLUSTER ═══════════════════ */
        .tb-right {
            display: flex; align-items: center; gap: 10px;
            flex-shrink: 0;
        }

        /* ═══════════════════ BELL ═══════════════════ */
        .tb-bell-wrap {
            position: relative; cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }
        .tb-bell-btn {
            width: 40px; height: 40px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(148,163,184,0.85);
            transition: background .2s, color .2s, border-color .2s, transform .15s;
            -webkit-tap-highlight-color: transparent;
        }
        .tb-bell-btn:hover {
            background: rgba(99,102,241,0.15);
            border-color: rgba(99,102,241,0.35);
            color: #818CF8;
        }
        .tb-bell-btn:hover .tb-bell-icon { animation: tb-ring 0.5s ease; }
        .tb-bell-btn:active { transform: scale(0.9); }
        .tb-badge {
            position: absolute; top: -4px; right: -4px;
            min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px;
            background: #EF4444; color: #fff; font-size: 0.58rem; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid rgba(8,12,30,0.95); pointer-events: none;
            animation: tb-badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both,
                       tb-pulse 2.5s ease-in-out 0.4s infinite;
        }

        /* ═══════════════════ PROFILE CIRCLE ═══════════════════ */
        .tb-profile {
            display: flex; align-items: center; gap: 9px;
            cursor: pointer; padding: 3px;
            -webkit-tap-highlight-color: transparent;
            border-radius: 30px;
            transition: background .2s;
        }
        .tb-profile:hover { background: rgba(255,255,255,0.05); }
        .tb-avatar {
            width: 38px; height: 38px;
            border-radius: 50% !important;   /* CIRCLE */
            object-fit: cover; flex-shrink: 0;
            border: 2px solid rgba(99,102,241,0.5);
            animation: tb-avatar-pulse 3s ease-in-out infinite;
            transition: transform .2s, border-color .2s;
        }
        .tb-profile:hover .tb-avatar {
            transform: scale(1.08);
            border-color: rgba(99,102,241,0.85);
            animation: none;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        .tb-uname {
            font-size: 0.82rem; font-weight: 700; color: #E2E8F0;
            white-space: nowrap; line-height: 1.2;
        }
        .tb-usub {
            font-size: 0.65rem; color: rgba(100,116,139,0.8);
            white-space: nowrap;
        }
        .tb-utext { display: none; flex-direction: column; }
        @media (min-width: 580px) { .tb-utext { display: flex; } }

        /* ═══════════════════ NOTIFICATION PANEL ═══════════════════ */
        .tb-ov {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
            z-index: 300; cursor: pointer;
        }
        .tb-panel {
            position: fixed; top: 0; right: 0; bottom: 0;
            width: min(390px, 100vw); z-index: 301;
            background: rgba(8,12,28,0.97);
            backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
            border-left: 1px solid rgba(255,255,255,0.07);
            box-shadow: -12px 0 60px rgba(0,0,0,0.6);
            display: flex; flex-direction: column;
            animation: tb-slide-in 0.28s cubic-bezier(0.34,1,0.64,1) both;
        }
        .tb-phead {
            display: flex; align-items: center; justify-content: space-between;
            padding: 1rem 1.1rem;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            background: rgba(15,23,42,0.7);
            position: relative;
        }
        .tb-phead::after {
            content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);
        }
        .tb-pbody {
            flex: 1; overflow-y: auto; padding: 0.8rem; overscroll-behavior: contain;
        }
        .tb-pbody::-webkit-scrollbar { width: 4px; }
        .tb-pbody::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .tb-close {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
            color: rgba(148,163,184,0.8); cursor: pointer;
            transition: background .2s, transform .15s;
        }
        .tb-close:hover { background: rgba(239,68,68,0.12); color: #F87171; border-color: rgba(239,68,68,0.3); }
        .tb-close:hover .tb-close-icon { animation: tb-spin-once 0.4s ease; }
        .tb-close:active { transform: scale(0.9); }

        /* ── Notification card ── */
        .tb-nc {
            border-radius: 14px; padding: 1rem;
            background: rgba(255,255,255,0.025);
            border: 1px solid rgba(255,255,255,0.07);
            margin-bottom: 8px;
            transition: border-color .2s, background .2s;
            animation: tb-card-in 0.3s ease both;
        }
        .tb-nc:hover { background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.25); }

        /* ── Reply ── */
        .tb-rrow { display: flex; gap: 8px; margin-top: 10px; }
        .tb-rinp {
            flex: 1; height: 36px; padding: 0 11px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px; color: #E2E8F0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 16px; outline: none;
            transition: border-color .2s;
        }
        .tb-rinp:focus { border-color: rgba(99,102,241,0.5); }
        .tb-rinp::placeholder { color: rgba(100,116,139,0.5); font-size: 0.78rem; }
        .tb-send {
            width: 36px; height: 36px; border-radius: 10px; border: none;
            background: linear-gradient(135deg,#6366F1,#4F46E5);
            color: #fff; cursor: pointer; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 14px rgba(99,102,241,0.4);
            transition: opacity .2s, transform .15s;
        }
        .tb-send:hover { opacity: 0.85; }
        .tb-send:hover .tb-send-icon { animation: tb-bounce 0.4s ease; }
        .tb-send:active { transform: scale(0.9); }

        /* ── Empty ── */
        .tb-empty {
            text-align: center; padding: 4rem 1.5rem;
            display: flex; flex-direction: column; align-items: center; gap: 14px;
        }
    `;

    return (
        <>
            <style>{CSS}</style>

            {/* Spacer so page content doesn't hide behind fixed bar */}
            <div style={{ height: '62px', flexShrink: 0 }} />

            {/* ═══════════════════ TOP BAR ═══════════════════ */}
            <header className={`tb ${visible ? 'visible' : 'hidden'} ${atTop ? 'top' : 'scrolled'}`}>

                {/* Hamburger — mobile only */}
                <button className="tb-ham" onClick={toggleSidebar} aria-label="Toggle menu">
                    <Menu size={18} className="tb-ham-icon" />
                </button>

                {/* App name (centre on mobile, left-aligned on desktop) */}
                <div className="tb-brand">AcadeMe</div>

                {/* Right side */}
                <div className="tb-right">

                    {/* Bell with animated ring */}
                    <div className="tb-bell-wrap" onClick={openPanel} role="button" aria-label="Notifications">
                        <div className="tb-bell-btn">
                            <Bell size={18} className="tb-bell-icon" />
                        </div>
                        {unread > 0 && (
                            <span className="tb-badge">{unread > 99 ? '99+' : unread}</span>
                        )}
                    </div>

                    {/* Profile — circular avatar + name on desktop */}
                    <div className="tb-profile" onClick={() => navigate('/profile')}>
                        <img
                            src={avatar}
                            alt={user?.name || 'Profile'}
                            className="tb-avatar"
                            onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=U&background=6366F1&color=fff&size=128'; }}
                        />
                        <div className="tb-utext">
                            <span className="tb-uname">{user?.name?.split(' ')[0] || 'Student'}</span>
                            <span className="tb-usub">{[user?.branch, user?.year].filter(Boolean).join(' · ')}</span>
                        </div>
                    </div>

                </div>
            </header>

            {/* ═══════════════════ NOTIFICATION PANEL ═══════════════════ */}
            {panelOpen && (
                <>
                    <div className="tb-ov" onClick={() => setPanelOpen(false)} />
                    <aside className="tb-panel">

                        {/* Header */}
                        <div className="tb-phead">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#F1F5F9' }}>
                                    Notifications
                                </h2>
                                <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'rgba(100,116,139,0.8)' }}>
                                    {notifications.length} message{notifications.length !== 1 ? 's' : ''} from admin
                                </p>
                            </div>
                            <button className="tb-close" onClick={() => setPanelOpen(false)} aria-label="Close">
                                <X size={16} className="tb-close-icon" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="tb-pbody">
                            {notifications.length === 0 ? (
                                <div className="tb-empty">
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 18,
                                        background: 'rgba(99,102,241,0.1)',
                                        border: '1px solid rgba(99,102,241,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Bell size={24} color="rgba(129,140,248,0.7)" />
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.9rem', color: '#94A3B8' }}>
                                            No notifications
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.77rem', color: 'rgba(100,116,139,0.6)' }}>
                                            Admin messages will appear here
                                        </p>
                                    </div>
                                </div>
                            ) : notifications.map((n, idx) => (
                                <div key={n.id} className="tb-nc" style={{ animationDelay: `${idx * 0.04}s` }}>

                                    {/* Notif header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <MessageCircle size={15} color="#818CF8" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.87rem', color: '#E2E8F0', lineHeight: 1.3 }}>
                                                {n.title || 'Message from Admin'}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.67rem', color: 'rgba(100,116,139,0.75)' }}>
                                                {fmtDate(n.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    {(n.message || n.body || n.text) && (
                                        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'rgba(148,163,184,0.72)', lineHeight: 1.55 }}>
                                            {n.message || n.body || n.text}
                                        </p>
                                    )}

                                    {/* Link */}
                                    {(n.link || n.url) && (
                                        <a href={n.link || n.url} target="_blank" rel="noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                fontSize: '0.74rem', fontWeight: 700, color: '#818CF8',
                                                textDecoration: 'none', padding: '5px 10px',
                                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)',
                                                borderRadius: 9, marginBottom: 8, transition: 'background .2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}>
                                            <ExternalLink size={12} /> Open Resource
                                        </a>
                                    )}

                                    {/* Previous replies */}
                                    {n.replies?.length > 0 && (
                                        <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {n.replies.map((r, i) => (
                                                <div key={i} style={{
                                                    padding: '6px 10px', borderRadius: 10, fontSize: '0.77rem',
                                                    lineHeight: 1.45, marginBottom: 3,
                                                    background: r.sender === 'user' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                                                    color: r.sender === 'user' ? '#A5B4FC' : 'rgba(148,163,184,0.7)',
                                                    textAlign: r.sender === 'user' ? 'right' : 'left',
                                                    border: `1px solid ${r.sender === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                                }}>
                                                    {r.text}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply */}
                                    <div className="tb-rrow">
                                        <input className="tb-rinp" placeholder="Reply to admin…"
                                            value={replyText[n.id] || ''}
                                            onChange={e => setReplyText(p => ({ ...p, [n.id]: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter') handleReply(n.id); }} />
                                        <button className="tb-send" onClick={() => handleReply(n.id)}>
                                            <Send size={14} className="tb-send-icon" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default TopBar;
