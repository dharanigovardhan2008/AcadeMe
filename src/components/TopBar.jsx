import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, MessageCircle, Send, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [notifications,     setNotifications]     = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [replyText,         setReplyText]         = useState({});
    const [unreadCount,       setUnreadCount]       = useState(0);
    const [searchQuery,       setSearchQuery]       = useState('');
    const [searchFocused,     setSearchFocused]     = useState(false);

    // ── Notification listener ─────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const db_ = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return db_ - da;
                });
            setNotifications(list);
            const key = `acadeMe_notif_count_${user.uid}`;
            const seen = parseInt(localStorage.getItem(key) || '0');
            setUnreadCount(Math.max(0, list.length - seen));
        }, err => console.error(err));
        return () => unsub();
    }, [user]);

    const openNotifications = () => {
        setShowNotifications(true);
        if (user) {
            localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
            setUnreadCount(0);
        }
    };

    const handleReply = async (msgId) => {
        const text = replyText[msgId];
        if (!text?.trim()) return;
        try {
            await updateDoc(doc(db, 'notifications', msgId), {
                replies: arrayUnion({ sender: 'user', text, timestamp: new Date().toISOString() }),
                read: false,
            });
            setReplyText(prev => ({ ...prev, [msgId]: '' }));
        } catch (err) { console.error(err); }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=3B82F6&color=fff&size=128&bold=true`;

    const CSS = `
        /* ── TopBar ── */
        .tb {
            position: sticky; top: 0; z-index: 40;
            display: flex; align-items: center; gap: 10px;
            padding: 10px 16px;
            background: rgba(10,15,35,0.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(148,163,184,0.1);
        }

        /* ── Hamburger ── */
        .tb-menu {
            display: flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: rgba(148,163,184,0.08);
            border: 1px solid rgba(148,163,184,0.14);
            cursor: pointer; color: #94A3B8;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        }
        .tb-menu:hover { background: rgba(148,163,184,0.16); color: #E2E8F0; }
        @media (min-width: 768px) { .tb-menu { display: none; } }

        /* ── Search ── */
        .tb-search-wrap {
            flex: 1; position: relative; min-width: 0;
        }
        .tb-search {
            width: 100%; padding: 9px 12px 9px 36px;
            background: rgba(148,163,184,0.07);
            border: 1px solid rgba(148,163,184,0.12);
            border-radius: 12px; color: #E2E8F0;
            font-size: 0.88rem; font-family: inherit;
            outline: none; transition: all 0.2s ease;
        }
        .tb-search::placeholder { color: #475569; }
        .tb-search:focus {
            background: rgba(148,163,184,0.11);
            border-color: rgba(129,140,248,0.45);
            box-shadow: 0 0 0 3px rgba(129,140,248,0.1);
        }

        /* ── Right cluster ── */
        .tb-right {
            display: flex; align-items: center; gap: 8px;
            flex-shrink: 0; margin-left: auto;
        }

        /* ── Icon button (Bell) ── */
        .tb-icon-btn {
            position: relative; display: flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: rgba(148,163,184,0.08);
            border: 1px solid rgba(148,163,184,0.14);
            cursor: pointer; color: #94A3B8;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        }
        .tb-icon-btn:hover { background: rgba(148,163,184,0.16); color: #E2E8F0; border-color: rgba(148,163,184,0.25); }

        /* ── Badge ── */
        .tb-badge {
            position: absolute; top: -5px; right: -5px;
            min-width: 18px; height: 18px; padding: 0 4px;
            border-radius: 9px; background: #EF4444;
            color: white; font-size: 0.6rem; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid rgba(10,15,35,0.95); pointer-events: none;
        }

        /* ── User chip ── */
        .tb-user {
            display: flex; align-items: center; gap: 8px;
            padding: 5px 10px 5px 5px;
            background: rgba(148,163,184,0.07);
            border: 1px solid rgba(148,163,184,0.13);
            border-radius: 22px; cursor: pointer;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent; flex-shrink: 0;
        }
        .tb-user:hover { background: rgba(148,163,184,0.13); border-color: rgba(148,163,184,0.24); }
        .tb-user-avatar {
            width: 28px; height: 28px; border-radius: 50%;
            object-fit: cover; flex-shrink: 0;
            border: 1.5px solid rgba(99,102,241,0.45);
        }
        .tb-user-name { font-size: 0.8rem; font-weight: 700; color: #CBD5E1; white-space: nowrap; line-height: 1.2; }
        .tb-user-sub  { font-size: 0.65rem; color: #64748B; white-space: nowrap; }
        @media (max-width: 420px) { .tb-user-text { display: none; } }

        /* ── Notification panel ── */
        .tb-panel {
            position: fixed; top: 0; right: 0; bottom: 0;
            width: min(380px, 100vw);
            background: rgba(8,12,28,0.97);
            backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
            border-left: 1px solid rgba(148,163,184,0.1);
            z-index: 9999;
            display: flex; flex-direction: column;
            box-shadow: -12px 0 48px rgba(0,0,0,0.6);
            animation: tb-slide 0.25s cubic-bezier(0.34,1,0.64,1);
        }
        @keyframes tb-slide { from{transform:translateX(105%)} to{transform:translateX(0)} }

        .tb-panel-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 1rem 1.1rem;
            border-bottom: 1px solid rgba(148,163,184,0.09);
            background: rgba(15,23,42,0.7);
        }
        .tb-panel-body { flex: 1; overflow-y: auto; padding: 0.75rem; }
        .tb-panel-body::-webkit-scrollbar { width: 4px; }
        .tb-panel-body::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 2px; }

        .tb-notif-card {
            border-radius: 14px; padding: 1rem;
            background: rgba(255,255,255,0.025);
            border: 1px solid rgba(148,163,184,0.09);
            margin-bottom: 8px; transition: border-color 0.2s;
        }
        .tb-notif-card:hover { border-color: rgba(99,102,241,0.3); }

        .tb-reply-row { display: flex; gap: 8px; margin-top: 10px; }
        .tb-reply-in {
            flex: 1; padding: 8px 11px; border-radius: 10px;
            background: rgba(148,163,184,0.07);
            border: 1px solid rgba(148,163,184,0.12);
            color: #E2E8F0; outline: none;
            font-size: 16px; font-family: inherit;
        }
        .tb-reply-in:focus { border-color: rgba(99,102,241,0.4); }
        .tb-reply-send {
            width: 36px; height: 36px; border-radius: 10px; border: none;
            background: linear-gradient(135deg,#6366F1,#4F46E5);
            color: white; cursor: pointer; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            transition: opacity 0.2s;
        }
        .tb-reply-send:hover { opacity: 0.85; }

        .tb-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.55);
            z-index: 9998; backdrop-filter: blur(2px);
        }
    `;

    return (
        <>
            <style>{CSS}</style>

            {/* ── Top bar ── */}
            <div className="tb">

                {/* Hamburger — mobile only */}
                <button className="tb-menu" onClick={toggleSidebar} aria-label="Open menu">
                    <Menu size={20} />
                </button>

                {/* Search bar */}
                <div className="tb-search-wrap">
                    <Search
                        size={15}
                        style={{
                            position: 'absolute', left: '11px', top: '50%',
                            transform: 'translateY(-50%)', pointerEvents: 'none',
                            color: searchFocused ? '#818CF8' : '#64748B',
                            transition: 'color 0.2s',
                        }}
                    />
                    <input
                        className="tb-search"
                        type="text"
                        placeholder="Search anything..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                </div>

                {/* Right side */}
                <div className="tb-right">

                    {/* Bell */}
                    <button className="tb-icon-btn" onClick={openNotifications} aria-label="Notifications">
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="tb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </button>

                    {/* User chip */}
                    <div className="tb-user" onClick={() => navigate('/profile')}>
                        <img
                            src={userAvatar}
                            alt={user?.name || 'User'}
                            className="tb-user-avatar"
                            onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=U&background=3B82F6&color=fff&size=128'; }}
                        />
                        <div className="tb-user-text">
                            <div className="tb-user-name">{user?.name?.split(' ')[0] || 'User'}</div>
                            <div className="tb-user-sub">
                                {[user?.branch, user?.year].filter(Boolean).join(' · ')}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Notification panel ── */}
            {showNotifications && (
                <>
                    <div className="tb-overlay" onClick={() => setShowNotifications(false)} />
                    <div className="tb-panel">

                        {/* Panel header */}
                        <div className="tb-panel-head">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#E2E8F0' }}>
                                    Notifications
                                </h2>
                                <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748B' }}>
                                    {notifications.length} message{notifications.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNotifications(false)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'rgba(148,163,184,0.08)',
                                    border: '1px solid rgba(148,163,184,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#94A3B8',
                                }}>
                                <X size={17} />
                            </button>
                        </div>

                        {/* Panel body */}
                        <div className="tb-panel-body">
                            {notifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#475569' }}>
                                    <Bell size={40} style={{ opacity: 0.25, marginBottom: '14px', display: 'block', margin: '0 auto 14px' }} />
                                    <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#64748B' }}>No notifications yet</p>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.78rem' }}>Admin messages will appear here</p>
                                </div>
                            ) : notifications.map((notif, idx) => (
                                <div key={notif.id} className="tb-notif-card"
                                    style={{ animationDelay: `${idx * 0.04}s` }}>

                                    {/* Header row */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                                            background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.24)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <MessageCircle size={15} color="#818CF8" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#E2E8F0', marginBottom: '2px' }}>
                                                {notif.title || 'Message from Admin'}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                                {notif.createdAt
                                                    ? new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : ''}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <p style={{ margin: '0 0 8px', fontSize: '0.83rem', color: '#94A3B8', lineHeight: 1.55 }}>
                                        {notif.message || notif.body || notif.text}
                                    </p>

                                    {/* Link */}
                                    {notif.url && (
                                        <a href={notif.url} target="_blank" rel="noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                fontSize: '0.76rem', fontWeight: 700, color: '#818CF8',
                                                textDecoration: 'none', padding: '5px 10px',
                                                background: 'rgba(99,102,241,0.1)', borderRadius: '8px',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                                marginBottom: '8px',
                                            }}>
                                            Open Resource <ChevronRight size={11} />
                                        </a>
                                    )}

                                    {/* Previous replies */}
                                    {notif.replies?.length > 0 && (
                                        <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {notif.replies.map((r, i) => (
                                                <div key={i} style={{
                                                    padding: '6px 10px', borderRadius: '8px',
                                                    fontSize: '0.78rem',
                                                    background: r.sender === 'user' ? 'rgba(99,102,241,0.12)' : 'rgba(148,163,184,0.07)',
                                                    color: r.sender === 'user' ? '#818CF8' : '#94A3B8',
                                                    textAlign: r.sender === 'user' ? 'right' : 'left',
                                                }}>
                                                    {r.text}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply */}
                                    <div className="tb-reply-row">
                                        <input
                                            className="tb-reply-in"
                                            placeholder="Reply to admin..."
                                            value={replyText[notif.id] || ''}
                                            onChange={e => setReplyText(prev => ({ ...prev, [notif.id]: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter') handleReply(notif.id); }}
                                        />
                                        <button className="tb-reply-send" onClick={() => handleReply(notif.id)}>
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default TopBar;
