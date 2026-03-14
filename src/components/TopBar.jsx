import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, X, MessageCircle, Send, Instagram, GraduationCap } from 'lucide-react';
import GlassInput from './GlassInput';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

/* ─── Feedback Modal ─────────────────────────────────────────── */
const FeedbackModal = ({ onClose }) => {
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const submit = () => {
        if (!text.trim()) return;
        setDone(true);
        setTimeout(onClose, 1400);
    };
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '380px',
                    background: 'var(--card-bg, #16162a)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '1.25rem',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Feedback</span>
                    <button onClick={onClose} style={ghostBtn}><X size={16} /></button>
                </div>
                {done
                    ? <p style={{ color: '#4ade80', textAlign: 'center', fontSize: '0.9rem', padding: '1rem 0' }}>✓ Sent — thank you!</p>
                    : <>
                        <textarea
                            autoFocus
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Share your thoughts or report an issue…"
                            rows={4}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                borderRadius: '10px', color: 'white',
                                padding: '0.65rem 0.85rem', fontSize: '0.85rem',
                                resize: 'none', outline: 'none', fontFamily: 'inherit',
                                lineHeight: 1.6,
                            }}
                        />
                        <button
                            onClick={submit}
                            style={{
                                marginTop: '0.65rem', width: '100%', padding: '0.6rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                border: 'none', borderRadius: '10px', color: 'white',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                            }}
                        >Send</button>
                    </>
                }
            </div>
        </div>
    );
};

const ghostBtn = {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
    padding: '4px', borderRadius: '6px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', lineHeight: 1,
};

/* ─── TopBar ─────────────────────────────────────────────────── */
const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [replyText, setReplyText] = useState({});
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        return onSnapshot(q, snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setNotifications(list);
            const key = `acadeMe_notif_count_${user.uid}`;
            const seen = parseInt(localStorage.getItem(key) || '0');
            setUnread(Math.max(0, list.length - seen));
        }, console.error);
    }, [user]);

    const handleReply = async id => {
        const t = replyText[id];
        if (!t?.trim()) return;
        try {
            await updateDoc(doc(db, 'notifications', id), {
                replies: arrayUnion({ sender: 'user', text: t, timestamp: new Date().toISOString() }),
                read: false,
            });
            setReplyText(p => ({ ...p, [id]: '' }));
        } catch (e) { console.error(e); }
    };

    const openNotif = () => {
        const next = !showNotif;
        setShowNotif(next);
        if (next && user) {
            setUnread(0);
            localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
        }
    };

    return (
        <>
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            {/* ── Bar ───────────────────────────────────── */}
            <header style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                marginBottom: '1.75rem',
            }}>

                {/* Left — hamburger (mobile) + brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                        onClick={toggleSidebar}
                        className="tb-mobile"
                        style={{ ...ghostBtn, color: 'white', padding: '6px' }}
                    >
                        <Menu size={22} />
                    </button>
                    <span style={{
                        fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px',
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        AcadeMe
                    </span>
                </div>

                {/* Right — action icons + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                    {/* Instagram */}
                    <a
                        href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
                        target="_blank" rel="noopener noreferrer"
                        title="Instagram"
                        className="tb-icon"
                        style={iconStyle}
                    >
                        <Instagram size={19} />
                    </a>

                    {/* ARMS portal */}
                    <a
                        href="https://arms.sse.saveetha.com/"
                        target="_blank" rel="noopener noreferrer"
                        title="ARMS Portal"
                        className="tb-icon"
                        style={iconStyle}
                    >
                        <GraduationCap size={19} />
                    </a>

                    {/* divider */}
                    <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

                    {/* Bell */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={openNotif}
                            title="Notifications"
                            className="tb-icon"
                            style={{ ...iconStyle, position: 'relative' }}
                        >
                            <Bell size={19} />
                            {unread > 0 && (
                                <span style={{
                                    position: 'absolute', top: 4, right: 4,
                                    width: 14, height: 14, borderRadius: '50%',
                                    background: '#ef4444', color: 'white',
                                    fontSize: '0.5rem', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    pointerEvents: 'none', border: '1.5px solid transparent',
                                }}>
                                    {unread}
                                </span>
                            )}
                        </button>

                        {showNotif && (
                            <>
                                {/* backdrop */}
                                <div
                                    onClick={() => setShowNotif(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 299 }}
                                />
                                {/* panel */}
                                <div style={{
                                    position: 'fixed', top: 60, right: 16,
                                    width: 'min(320px, calc(100vw - 2rem))',
                                    maxHeight: '72vh', overflowY: 'auto',
                                    background: 'var(--card-bg, #16162a)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                                    zIndex: 300, padding: '1rem',
                                }}>
                                    {/* header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                                        <button onClick={() => setShowNotif(false)} style={ghostBtn}><X size={15} /></button>
                                    </div>

                                    {notifications.length === 0
                                        ? <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: '0.82rem', padding: '1.2rem 0' }}>All caught up 🎉</p>
                                        : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {notifications.map(n => (
                                                <div key={n.id} style={{
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.07)',
                                                    borderRadius: '10px', padding: '0.7rem',
                                                }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{
                                                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                                            background: 'rgba(99,102,241,0.18)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#818cf8',
                                                        }}>
                                                            <MessageCircle size={12} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ margin: '0 0 2px', fontSize: '0.7rem', color: '#818cf8', fontWeight: 700 }}>Admin</p>
                                                            <p style={{ margin: 0, fontSize: '0.83rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, wordBreak: 'break-word' }}>{n.message}</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
                                                                {new Date(n.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {n.replies?.length > 0 && (
                                                        <div style={{ marginTop: '0.4rem', marginLeft: '2.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.07)' }}>
                                                            {n.replies.map((r, i) => (
                                                                <p key={i} style={{ margin: '2px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                                                    <span style={{ color: r.sender === 'user' ? '#4ade80' : '#818cf8', fontWeight: 700 }}>
                                                                        {r.sender === 'user' ? 'You' : 'Admin'}:{' '}
                                                                    </span>
                                                                    {r.text}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem' }}>
                                                        <GlassInput
                                                            placeholder="Reply…"
                                                            value={replyText[n.id] || ''}
                                                            onChange={e => setReplyText(p => ({ ...p, [n.id]: e.target.value }))}
                                                            style={{ height: '28px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)' }}
                                                        />
                                                        <button
                                                            onClick={() => handleReply(n.id)}
                                                            style={{
                                                                width: 28, height: 28, flexShrink: 0,
                                                                background: 'var(--primary)', border: 'none',
                                                                borderRadius: '7px', cursor: 'pointer',
                                                                color: 'white', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Send size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    }
                                </div>
                            </>
                        )}
                    </div>

                    {/* divider */}
                    <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

                    {/* Avatar / profile */}
                    <div
                        onClick={() => navigate('/profile')}
                        className="tb-profile"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', padding: '4px 6px', borderRadius: '10px' }}
                    >
                        <div className="tb-desktop" style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                                {user?.name || 'User'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                                {user?.branch} · {user?.year}
                            </p>
                        </div>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.1)',
                        }}>
                            <User size={16} color="white" />
                        </div>
                    </div>
                </div>
            </header>

            <style>{`
                @media (max-width: 768px) {
                    .tb-desktop { display: none !important; }
                }
                @media (min-width: 769px) {
                    .tb-mobile { display: none !important; }
                }
                .tb-icon {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.38);
                    cursor: pointer;
                    width: 34px; height: 34px;
                    border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    text-decoration: none;
                    transition: color 0.15s, background 0.15s;
                    flex-shrink: 0;
                }
                .tb-icon:hover {
                    color: white;
                    background: rgba(255,255,255,0.07);
                }
                .tb-profile:hover {
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </>
    );
};

const iconStyle = {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.38)', cursor: 'pointer',
    width: 34, height: 34, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none', flexShrink: 0,
};

export default TopBar;
