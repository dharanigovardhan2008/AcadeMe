import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Send, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
    collection, query, where, onSnapshot,
    updateDoc, doc, arrayUnion,
} from 'firebase/firestore';

const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [notifications,     setNotifications]     = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [replyText,         setReplyText]         = useState({});
    const [unreadCount,       setUnreadCount]       = useState(0);

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
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=3B82F6&color=fff&size=128&bold=true`;

    const fmtTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
               ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <style>{`
                .tb {
                    position: sticky; top: 0; z-index: 30;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 10px 16px;
                    background: rgba(10,14,30,0.88);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    min-height: 60px;
                    box-sizing: border-box;
                }

                .tb-left {
                    display: flex; align-items: center; gap: 12px;
                }

                .tb-ham {
                    display: flex; align-items: center; justify-content: center;
                    width: 38px; height: 38px; min-width: 38px; border-radius: 10px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.12);
                    cursor: pointer;
                    color: #CBD5E1;
                    transition: background 0.2s;
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-ham:hover, .tb-ham:focus { background: rgba(255,255,255,0.14); color: #F1F5F9; outline: none; }
                @media (min-width: 768px) { .tb-ham { display: none; } }

                .tb-brand {
                    font-size: 1.05rem; font-weight: 800;
                    background: linear-gradient(135deg, #60A5FA, #A78BFA);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.3px;
                }

                .tb-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

                .tb-bell {
                    position: relative;
                    display: flex; align-items: center; justify-content: center;
                    width: 38px; height: 38px; min-width: 38px; border-radius: 10px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.1);
                    cursor: pointer;
                    color: #CBD5E1;
                    transition: background 0.2s, color 0.2s;
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-bell:hover { background: rgba(255,255,255,0.13); color: #F1F5F9; }

                .tb-badge {
                    position: absolute; top: -5px; right: -5px;
                    min-width: 17px; height: 17px; border-radius: 10px;
                    background: #EF4444; color: #fff;
                    font-size: 0.58rem; font-weight: 800;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 3px; line-height: 1;
                    border: 2px solid rgba(10,14,30,1);
                }

                .tb-uinfo { display: none; flex-direction: column; align-items: flex-end; gap: 1px; }
                @media (min-width: 600px) { .tb-uinfo { display: flex; } }

                .tb-avatar {
                    width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
                    object-fit: cover; cursor: pointer;
                    border: 2px solid rgba(96,165,250,0.4);
                    transition: border-color 0.2s, transform 0.2s;
                    -webkit-tap-highlight-color: transparent;
                }
                .tb-avatar:hover { border-color: rgba(96,165,250,0.9); transform: scale(1.06); }

                .tb-panel {
                    position: fixed; top: 68px; right: 12px;
                    width: min(380px, calc(100vw - 24px));
                    max-height: 72vh;
                    background: rgba(11,15,32,0.98);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
                    backdrop-filter: blur(24px);
                    display: flex; flex-direction: column;
                    overflow: hidden; z-index: 1000;
                    animation: tb-drop 0.2s ease;
                }
                @keyframes tb-drop {
                    from { opacity:0; transform:translateY(-8px) scale(0.97); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
                .tb-phead {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 13px 15px 11px; flex-shrink: 0;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .tb-pscroll { overflow-y: auto; flex: 1; }
                .tb-pscroll::-webkit-scrollbar { width: 3px; }
                .tb-pscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
                .tb-nitem {
                    padding: 13px 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    transition: background 0.15s;
                }
                .tb-nitem:hover { background: rgba(255,255,255,0.03); }
                .tb-nitem:last-child { border-bottom: none; }

                .tb-reply-inp {
                    flex: 1; padding: 7px 10px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 8px; outline: none;
                    color: #E2E8F0; font-size: 0.78rem; font-family: inherit;
                    resize: none; min-height: 38px;
                    transition: border-color 0.2s;
                }
                .tb-reply-inp:focus { border-color: rgba(96,165,250,0.5); }
                .tb-reply-inp::placeholder { color: rgba(148,163,184,0.4); }

                .tb-send-btn {
                    padding: 7px 12px; border-radius: 8px; border: none;
                    background: linear-gradient(135deg,#3B82F6,#6366F1);
                    color: #fff; font-size: 0.75rem; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center;
                    gap: 4px; flex-shrink: 0; min-height: 38px;
                    transition: opacity 0.2s;
                }
                .tb-send-btn:hover { opacity: 0.88; }
                .tb-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
            `}</style>

            <div className="tb">

                {/* ── Left: Hamburger + Brand ── */}
                <div className="tb-left">
                    <button className="tb-ham" onClick={toggleSidebar} aria-label="Menu">
                        <Menu size={20} />
                    </button>
                    <span className="tb-brand">acadeMe</span>
                </div>

                {/* ── Right: Bell + Name + Avatar ── */}
                <div className="tb-right">

                    <button className="tb-bell" onClick={handleBellClick} aria-label="Notifications">
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    <div className="tb-uinfo">
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || 'User'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(148,163,184,0.55)' }}>
                            {[user?.branch, user?.year].filter(Boolean).join(' · ')}
                        </span>
                    </div>

                    <img
                        className="tb-avatar"
                        src={userAvatar}
                        alt={user?.name || 'Profile'}
                        onClick={() => navigate('/profile')}
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=U&background=3B82F6&color=fff`;
                        }}
                    />
                </div>
            </div>

            {/* ── Notification panel ── */}
            {showNotifications && (
                <>
                    <div onClick={() => setShowNotifications(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }} />

                    <div className="tb-panel">
                        <div className="tb-phead">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bell size={15} color="#60A5FA" />
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#E2E8F0' }}>Notifications</span>
                                {notifications.length > 0 && (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(96,165,250,0.14)', color: '#60A5FA', padding: '2px 7px', borderRadius: '10px' }}>
                                        {notifications.length}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px' }}>
                                        <CheckCheck size={11} /> Mark read
                                    </button>
                                )}
                                <button onClick={() => setShowNotifications(false)}
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8' }}>
                                    <X size={13} />
                                </button>
                            </div>
                        </div>

                        <div className="tb-pscroll">
                            {notifications.length === 0 ? (
                                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(148,163,184,0.35)' }}>
                                    <Bell size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.18 }} />
                                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.84rem' }}>No notifications</p>
                                    <p style={{ margin: 0, fontSize: '0.74rem' }}>You're all caught up!</p>
                                </div>
                            ) : notifications.map(notif => (
                                <div key={notif.id} className="tb-nitem">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.83rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                                                {notif.title || notif.message || 'Notification'}
                                            </p>
                                            {notif.body && notif.body !== notif.title && (
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(148,163,184,0.6)', lineHeight: 1.4 }}>{notif.body}</p>
                                            )}
                                        </div>
                                        {notif.createdAt && (
                                            <span style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {fmtTime(notif.createdAt)}
                                            </span>
                                        )}
                                    </div>

                                    {notif.url && (
                                        <a href={notif.url} target="_blank" rel="noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', fontWeight: 600, color: '#60A5FA', textDecoration: 'none', marginBottom: '8px' }}>
                                            Open Resource →
                                        </a>
                                    )}

                                    {notif.replies?.length > 0 && (
                                        <div style={{ borderLeft: '2px solid rgba(96,165,250,0.22)', paddingLeft: '10px', marginBottom: '8px' }}>
                                            {notif.replies.map((r, i) => (
                                                <div key={i} style={{ marginBottom: i < notif.replies.length - 1 ? '5px' : 0 }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: r.sender === 'admin' ? '#FBBF24' : '#60A5FA' }}>
                                                        {r.sender === 'admin' ? 'Admin' : 'You'}
                                                    </span>
                                                    <p style={{ margin: '2px 0 0', fontSize: '0.73rem', color: 'rgba(226,232,240,0.62)' }}>{r.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
                                        <textarea
                                            className="tb-reply-inp"
                                            rows={1}
                                            placeholder="Reply..."
                                            value={replyText[notif.id] || ''}
                                            onChange={e => setReplyText(p => ({ ...p, [notif.id]: e.target.value }))}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply(notif.id);
                                                }
                                            }}
                                        />
                                        <button className="tb-send-btn" onClick={() => handleReply(notif.id)} disabled={!replyText[notif.id]?.trim()}>
                                            <Send size={11} /> Send
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
