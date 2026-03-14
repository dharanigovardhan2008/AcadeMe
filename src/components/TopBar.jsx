import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Send, CheckCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
    collection, query, where, onSnapshot,
    updateDoc, doc, arrayUnion,
} from 'firebase/firestore';

const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [replyText, setReplyText] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                });
            setNotifications(list);
            const key = `acadeMe_notif_count_${user.uid}`;
            const seen = parseInt(localStorage.getItem(key) || '0');
            setUnreadCount(Math.max(0, list.length - seen));
        }, console.error);
        return () => unsub();
    }, [user]);

    const markAllRead = () => {
        if (!user) return;
        localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
        setUnreadCount(0);
    };

    const handleBellClick = () => {
        const willOpen = !showNotifications;
        if (willOpen) markAllRead();
        setShowNotifications(willOpen);
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
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (!showNotifications) return;
        const onKey = (e) => e.key === 'Escape' && setShowNotifications(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showNotifications]);

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366F1&color=fff&size=128&bold=true`;

    const fmtTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
            ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = user?.name?.split(' ')[0] || 'User';

    return (
        <>
            <style>{`
                @keyframes tb-fadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes tb-slidePanel {
                    from { opacity: 0; transform: translateY(-10px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes tb-bellRing {
                    0%, 100% { transform: rotate(0); }
                    15% { transform: rotate(12deg); }
                    30% { transform: rotate(-10deg); }
                    45% { transform: rotate(6deg); }
                    60% { transform: rotate(-4deg); }
                    75% { transform: rotate(2deg); }
                }
                @keyframes tb-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                @keyframes tb-gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .tb {
                    position: sticky; top: 0; z-index: 30;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 20px;
                    height: 64px;
                    background: linear-gradient(135deg, rgba(8,12,28,0.92), rgba(15,20,45,0.92));
                    backdrop-filter: blur(24px) saturate(1.4);
                    -webkit-backdrop-filter: blur(24px) saturate(1.4);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    box-sizing: border-box;
                    animation: tb-fadeIn 0.3s ease;
                }
                .tb::after {
                    content: '';
                    position: absolute; bottom: 0; left: 20px; right: 20px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(96,165,250,0.3), transparent);
                }

                .tb-left { display: flex; align-items: center; gap: 14px; }

                .tb-ham {
                    display: flex; align-items: center; justify-content: center;
                    width: 40px; height: 40px; min-width: 40px; border-radius: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    cursor: pointer; color: #94A3B8;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-ham:hover {
                    background: rgba(99,102,241,0.12);
                    border-color: rgba(99,102,241,0.25);
                    color: #C4B5FD;
                    transform: scale(1.04);
                }
                .tb-ham:active { transform: scale(0.96); }
                @media (min-width: 768px) { .tb-ham { display: none; } }

                .tb-brand-wrap {
                    display: flex; align-items: center; gap: 8px;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-brand-logo {
                    width: 32px; height: 32px; border-radius: 10px;
                    background: linear-gradient(135deg, #6366F1, #8B5CF6, #3B82F6);
                    background-size: 200% 200%;
                    animation: tb-gradientShift 4s ease infinite;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
                    flex-shrink: 0;
                }
                .tb-brand-text {
                    font-size: 1.15rem; font-weight: 800;
                    background: linear-gradient(135deg, #818CF8, #60A5FA, #A78BFA);
                    background-size: 200% 200%;
                    animation: tb-gradientShift 4s ease infinite;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.5px;
                }

                .tb-greeting {
                    display: none; flex-direction: column; gap: 0;
                    margin-left: 8px; padding-left: 16px;
                    border-left: 1px solid rgba(255,255,255,0.06);
                }
                @media (min-width: 900px) { .tb-greeting { display: flex; } }

                .tb-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

                .tb-bell-wrap { position: relative; }
                .tb-bell {
                    display: flex; align-items: center; justify-content: center;
                    width: 40px; height: 40px; min-width: 40px; border-radius: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    cursor: pointer; color: #94A3B8;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-bell:hover {
                    background: rgba(251,191,36,0.1);
                    border-color: rgba(251,191,36,0.2);
                    color: #FCD34D;
                }
                .tb-bell:hover svg { animation: tb-bellRing 0.6s ease; }
                .tb-bell:active { transform: scale(0.94); }

                .tb-badge {
                    position: absolute; top: -4px; right: -4px;
                    min-width: 18px; height: 18px; border-radius: 9px;
                    background: linear-gradient(135deg, #EF4444, #F97316);
                    color: #fff;
                    font-size: 0.6rem; font-weight: 800;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 4px; line-height: 1;
                    border: 2px solid rgba(8,12,28,1);
                    animation: tb-pulse 2s ease infinite;
                    box-shadow: 0 2px 8px rgba(239,68,68,0.4);
                }

                .tb-divider {
                    width: 1px; height: 28px;
                    background: rgba(255,255,255,0.06);
                    margin: 0 4px;
                    flex-shrink: 0;
                }
                @media (max-width: 480px) { .tb-divider { display: none; } }

                .tb-profile {
                    display: flex; align-items: center; gap: 10px;
                    padding: 4px 6px 4px 4px; border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-profile:hover { background: rgba(255,255,255,0.05); }
                .tb-profile:active { transform: scale(0.97); }

                .tb-uinfo { display: none; flex-direction: column; align-items: flex-end; gap: 0; }
                @media (min-width: 600px) { .tb-uinfo { display: flex; } }

                .tb-avatar-ring {
                    width: 38px; height: 38px; min-width: 38px;
                    border-radius: 50%; padding: 2px;
                    background: linear-gradient(135deg, #6366F1, #3B82F6, #8B5CF6);
                    background-size: 200% 200%;
                    animation: tb-gradientShift 4s ease infinite;
                    flex-shrink: 0;
                }
                .tb-avatar {
                    width: 100%; height: 100%; border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(8,12,28,1);
                    transition: transform 0.25s;
                }
                .tb-profile:hover .tb-avatar { transform: scale(1.06); }

                .tb-status {
                    width: 9px; height: 9px; border-radius: 50%;
                    background: #22C55E;
                    border: 2px solid rgba(8,12,28,1);
                    position: absolute; bottom: 0; right: 0;
                    box-shadow: 0 0 6px rgba(34,197,94,0.5);
                }

                /* ── Panel ── */
                .tb-overlay {
                    position: fixed; inset: 0; z-index: 999;
                    background: rgba(0,0,0,0.3);
                    backdrop-filter: blur(2px);
                    animation: tb-fadeIn 0.15s ease;
                }
                .tb-panel {
                    position: fixed; top: 72px; right: 16px;
                    width: min(400px, calc(100vw - 32px));
                    max-height: 75vh;
                    background: linear-gradient(170deg, rgba(13,17,38,0.98), rgba(8,12,28,0.99));
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    box-shadow:
                        0 32px 72px rgba(0,0,0,0.6),
                        0 0 0 1px rgba(255,255,255,0.04),
                        inset 0 1px 0 rgba(255,255,255,0.06);
                    backdrop-filter: blur(30px);
                    display: flex; flex-direction: column;
                    overflow: hidden; z-index: 1000;
                    animation: tb-slidePanel 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tb-phead {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 18px 14px; flex-shrink: 0;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.02);
                }
                .tb-pscroll {
                    overflow-y: auto; flex: 1;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.08) transparent;
                }
                .tb-pscroll::-webkit-scrollbar { width: 4px; }
                .tb-pscroll::-webkit-scrollbar-track { background: transparent; }
                .tb-pscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

                .tb-nitem {
                    padding: 14px 18px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    transition: all 0.2s ease;
                    position: relative;
                }
                .tb-nitem::before {
                    content: '';
                    position: absolute; left: 0; top: 0; bottom: 0;
                    width: 0; background: linear-gradient(180deg, #6366F1, #3B82F6);
                    border-radius: 0 3px 3px 0;
                    transition: width 0.2s ease;
                }
                .tb-nitem:hover { background: rgba(255,255,255,0.02); }
                .tb-nitem:hover::before { width: 3px; }
                .tb-nitem:last-child { border-bottom: none; }

                .tb-reply-row {
                    display: flex; gap: 8px; align-items: flex-end;
                    margin-top: 10px;
                }
                .tb-reply-inp {
                    flex: 1; padding: 8px 12px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px; outline: none;
                    color: #E2E8F0; font-size: 0.78rem; font-family: inherit;
                    resize: none; min-height: 38px;
                    transition: all 0.2s ease;
                }
                .tb-reply-inp:focus {
                    border-color: rgba(99,102,241,0.4);
                    background: rgba(99,102,241,0.06);
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
                }
                .tb-reply-inp::placeholder { color: rgba(148,163,184,0.3); }

                .tb-send-btn {
                    padding: 8px 14px; border-radius: 10px; border: none;
                    background: linear-gradient(135deg, #6366F1, #8B5CF6);
                    color: #fff; font-size: 0.74rem; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center;
                    gap: 5px; flex-shrink: 0; min-height: 38px;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 12px rgba(99,102,241,0.25);
                }
                .tb-send-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(99,102,241,0.35);
                }
                .tb-send-btn:active { transform: translateY(0) scale(0.97); }
                .tb-send-btn:disabled {
                    opacity: 0.3; cursor: not-allowed;
                    transform: none; box-shadow: none;
                }

                .tb-link {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 0.73rem; font-weight: 600;
                    color: #818CF8; text-decoration: none;
                    margin: 6px 0 8px; padding: 4px 10px;
                    border-radius: 6px;
                    background: rgba(99,102,241,0.08);
                    transition: all 0.2s ease;
                }
                .tb-link:hover {
                    background: rgba(99,102,241,0.15);
                    color: #A5B4FC;
                }

                .tb-replies {
                    border-left: 2px solid rgba(99,102,241,0.2);
                    padding-left: 12px; margin: 8px 0;
                    display: flex; flex-direction: column; gap: 6px;
                }

                .tb-mark-btn {
                    background: none; border: none; cursor: pointer;
                    color: rgba(148,163,184,0.45); font-size: 0.68rem;
                    display: flex; align-items: center; gap: 4px;
                    padding: 4px 8px; border-radius: 6px;
                    transition: all 0.2s ease;
                }
                .tb-mark-btn:hover { color: #818CF8; background: rgba(99,102,241,0.08); }

                .tb-close-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px; width: 28px; height: 28px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: #64748B;
                    transition: all 0.2s ease;
                }
                .tb-close-btn:hover {
                    background: rgba(239,68,68,0.1);
                    border-color: rgba(239,68,68,0.2);
                    color: #FCA5A5;
                }

                .tb-empty {
                    padding: 3.5rem 1.5rem; text-align: center;
                    color: rgba(148,163,184,0.3);
                }
            `}</style>

            <div className="tb">

                {/* ── Left ── */}
                <div className="tb-left">
                    <button className="tb-ham" onClick={toggleSidebar} aria-label="Menu">
                        <Menu size={20} />
                    </button>

                    <div className="tb-brand-wrap" onClick={() => navigate('/')}>
                        <div className="tb-brand-logo">
                            <Sparkles size={17} color="#fff" />
                        </div>
                        <span className="tb-brand-text">acadeMe</span>
                    </div>

                    <div className="tb-greeting">
                        <span style={{
                            fontSize: '0.78rem', fontWeight: 600, color: '#CBD5E1',
                            lineHeight: 1.3
                        }}>
                            {getGreeting()}, {firstName} 👋
                        </span>
                        <span style={{
                            fontSize: '0.65rem', color: 'rgba(148,163,184,0.4)',
                            lineHeight: 1.3
                        }}>
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'long', day: 'numeric', month: 'short'
                            })}
                        </span>
                    </div>
                </div>

                {/* ── Right ── */}
                <div className="tb-right">

                    {/* Bell */}
                    <div className="tb-bell-wrap">
                        <button className="tb-bell" onClick={handleBellClick} aria-label="Notifications">
                            <Bell size={18} />
                        </button>
                        {unreadCount > 0 && (
                            <span className="tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </div>

                    <div className="tb-divider" />

                    {/* Profile */}
                    <div className="tb-profile" onClick={() => navigate('/profile')}>
                        <div className="tb-uinfo">
                            <span style={{
                                fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0',
                                maxWidth: '130px', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                lineHeight: 1.3
                            }}>
                                {user?.name || 'User'}
                            </span>
                            <span style={{
                                fontSize: '0.65rem', color: 'rgba(148,163,184,0.45)',
                                lineHeight: 1.3
                            }}>
                                {[user?.branch, user?.year].filter(Boolean).join(' · ') || 'Student'}
                            </span>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div className="tb-avatar-ring">
                                <img
                                    className="tb-avatar"
                                    src={userAvatar}
                                    alt={user?.name || 'Profile'}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=U&background=6366F1&color=fff`;
                                    }}
                                />
                            </div>
                            <div className="tb-status" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Notification Panel ── */}
            {showNotifications && (
                <>
                    <div className="tb-overlay" onClick={() => setShowNotifications(false)} />

                    <div className="tb-panel">
                        <div className="tb-phead">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(96,165,250,0.2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Bell size={14} color="#818CF8" />
                                </div>
                                <div>
                                    <span style={{
                                        fontWeight: 700, fontSize: '0.9rem', color: '#E2E8F0',
                                        display: 'block', lineHeight: 1.2
                                    }}>
                                        Notifications
                                    </span>
                                    <span style={{
                                        fontSize: '0.62rem', color: 'rgba(148,163,184,0.4)'
                                    }}>
                                        {notifications.length === 0
                                            ? 'No new updates'
                                            : `${notifications.length} total`}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {unreadCount > 0 && (
                                    <button className="tb-mark-btn" onClick={markAllRead}>
                                        <CheckCheck size={12} /> Mark read
                                    </button>
                                )}
                                <button className="tb-close-btn" onClick={() => setShowNotifications(false)}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="tb-pscroll">
                            {notifications.length === 0 ? (
                                <div className="tb-empty">
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '16px',
                                        background: 'rgba(99,102,241,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 14px'
                                    }}>
                                        <Bell size={24} style={{ opacity: 0.25, color: '#818CF8' }} />
                                    </div>
                                    <p style={{
                                        margin: '0 0 4px', fontWeight: 700,
                                        fontSize: '0.88rem', color: 'rgba(148,163,184,0.5)'
                                    }}>
                                        All caught up!
                                    </p>
                                    <p style={{
                                        margin: 0, fontSize: '0.74rem',
                                        color: 'rgba(148,163,184,0.3)'
                                    }}>
                                        No new notifications right now
                                    </p>
                                </div>
                            ) : notifications.map(notif => (
                                <div key={notif.id} className="tb-nitem">
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        gap: '10px', marginBottom: '4px'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                margin: '0 0 3px', fontWeight: 700,
                                                fontSize: '0.82rem', color: '#E2E8F0',
                                                lineHeight: 1.45
                                            }}>
                                                {notif.title || notif.message || 'Notification'}
                                            </p>
                                            {notif.body && notif.body !== notif.title && (
                                                <p style={{
                                                    margin: 0, fontSize: '0.74rem',
                                                    color: 'rgba(148,163,184,0.55)',
                                                    lineHeight: 1.45
                                                }}>
                                                    {notif.body}
                                                </p>
                                            )}
                                        </div>
                                        {notif.createdAt && (
                                            <span style={{
                                                fontSize: '0.6rem',
                                                color: 'rgba(148,163,184,0.3)',
                                                whiteSpace: 'nowrap', flexShrink: 0,
                                                marginTop: '2px'
                                            }}>
                                                {fmtTime(notif.createdAt)}
                                            </span>
                                        )}
                                    </div>

                                    {notif.url && (
                                        <a href={notif.url} target="_blank" rel="noreferrer" className="tb-link">
                                            Open Resource →
                                        </a>
                                    )}

                                    {notif.replies?.length > 0 && (
                                        <div className="tb-replies">
                                            {notif.replies.map((r, i) => (
                                                <div key={i}>
                                                    <span style={{
                                                        fontSize: '0.62rem', fontWeight: 700,
                                                        color: r.sender === 'admin' ? '#FBBF24' : '#818CF8',
                                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                                    }}>
                                                        {r.sender === 'admin' ? 'Admin' : 'You'}
                                                    </span>
                                                    <p style={{
                                                        margin: '2px 0 0', fontSize: '0.73rem',
                                                        color: 'rgba(226,232,240,0.55)', lineHeight: 1.4
                                                    }}>
                                                        {r.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="tb-reply-row">
                                        <textarea
                                            className="tb-reply-inp"
                                            rows={1}
                                            placeholder="Write a reply..."
                                            value={replyText[notif.id] || ''}
                                            onChange={e => setReplyText(p => ({
                                                ...p, [notif.id]: e.target.value
                                            }))}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply(notif.id);
                                                }
                                            }}
                                        />
                                        <button
                                            className="tb-send-btn"
                                            onClick={() => handleReply(notif.id)}
                                            disabled={!replyText[notif.id]?.trim()}
                                        >
                                            <Send size={12} />
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
