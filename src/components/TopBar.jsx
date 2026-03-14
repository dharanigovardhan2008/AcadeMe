import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, X, MessageCircle, Send, Instagram, BookOpen } from 'lucide-react';
import GlassInput from './GlassInput';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

/* ── Feedback Modal ──────────────────────────────────────────── */
const FeedbackModal = ({ onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!feedback.trim()) return;
        setSent(true);
        setTimeout(onClose, 1600);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9998, padding: '1rem',
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '400px',
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'white' }}>Send Feedback</p>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                        <X size={17} />
                    </button>
                </div>

                {sent ? (
                    <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#4ade80', fontSize: '0.9rem', fontWeight: '600' }}>
                        ✓ Thanks for your feedback!
                    </div>
                ) : (
                    <>
                        <textarea
                            autoFocus
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Share your thoughts or report an issue…"
                            rows={4}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: 'white',
                                padding: '0.75rem 1rem', fontSize: '0.875rem',
                                resize: 'none', outline: 'none', fontFamily: 'inherit',
                                lineHeight: '1.6',
                            }}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                marginTop: '0.75rem', width: '100%',
                                padding: '0.7rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                border: 'none', borderRadius: '12px',
                                color: 'white', fontWeight: '700',
                                fontSize: '0.875rem', cursor: 'pointer',
                                letterSpacing: '0.01em',
                            }}
                        >
                            Send
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

/* ── TopBar ──────────────────────────────────────────────────── */
const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [replyText, setReplyText] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setNotifications(list);
            const storageKey = `acadeMe_notif_count_${user.uid}`;
            const lastSeen = parseInt(localStorage.getItem(storageKey) || '0');
            const realUnread = list.length - lastSeen;
            setUnreadCount(realUnread > 0 ? realUnread : 0);
        }, err => console.error(err));
        return () => unsubscribe();
    }, [user]);

    const handleReply = async (msgId) => {
        const text = replyText[msgId];
        if (!text?.trim()) return;
        try {
            await updateDoc(doc(db, "notifications", msgId), {
                replies: arrayUnion({ sender: 'user', text, timestamp: new Date().toISOString() }),
                read: false,
            });
            setReplyText(prev => ({ ...prev, [msgId]: '' }));
        } catch (err) { console.error(err); }
    };

    const handleBell = () => {
        const next = !showNotifications;
        setShowNotifications(next);
        if (next && user) {
            setUnreadCount(0);
            localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
        }
    };

    /* shared icon-button style */
    const ib = (extra = {}) => ({
        background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.45)',
        cursor: 'pointer', padding: '8px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
        textDecoration: 'none', lineHeight: 1,
        ...extra,
    });

    return (
        <>
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            {/* ── Bar ────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.75rem',
                padding: '0 0.25rem',
            }}>

                {/* Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={toggleSidebar}
                        className="mobile-only"
                        style={ib()}
                    >
                        <Menu size={22} />
                    </button>
                    <span style={{
                        fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.4px',
                        background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        AcadeMe
                    </span>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

                    {/* Instagram */}
                    <a
                        href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
                        target="_blank" rel="noopener noreferrer"
                        title="Instagram" style={ib()} className="tb-icon"
                    >
                        <Instagram size={20} />
                    </a>

                    {/* ARMS – using BookOpen icon for academic portal */}
                    <a
                        href="https://arms.sse.saveetha.com/"
                        target="_blank" rel="noopener noreferrer"
                        title="ARMS Portal" style={ib()} className="tb-icon"
                    >
                        <BookOpen size={20} />
                    </a>

                    {/* Divider */}
                    <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 4px', display: 'inline-block' }} />

                    {/* Bell */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={handleBell} title="Notifications" style={ib()} className="tb-icon">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '5px', right: '5px',
                                    background: '#ef4444', color: 'white',
                                    width: '13px', height: '13px', borderRadius: '50%',
                                    fontSize: '0.55rem', fontWeight: '700',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                {/* Close on outside click */}
                                <div onClick={() => setShowNotifications(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 199 }} />

                                {/* Panel — fixed so it always renders above page content */}
                                <div style={{
                                    position: 'fixed', top: '64px', right: '1rem',
                                    width: 'min(340px, calc(100vw - 2rem))',
                                    maxHeight: '70vh', overflowY: 'auto',
                                    background: '#1a1a2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '18px',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                                    zIndex: 200, padding: '1rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>Notifications</p>
                                        <button onClick={() => setShowNotifications(false)}
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                                            <X size={15} />
                                        </button>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: '0.85rem', padding: '1rem 0' }}>
                                            You're all caught up 🎉
                                        </p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {notifications.map(note => (
                                                <div key={note.id} style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '12px', padding: '0.75rem',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                }}>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                        <div style={{
                                                            width: '30px', height: '30px', borderRadius: '50%',
                                                            background: 'rgba(99,102,241,0.2)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#818cf8', flexShrink: 0,
                                                        }}>
                                                            <MessageCircle size={13} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', margin: '0 0 3px' }}>Admin</p>
                                                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', margin: 0, wordBreak: 'break-word', lineHeight: 1.5 }}>
                                                                {note.message}
                                                            </p>
                                                            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
                                                                {new Date(note.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {note.replies?.length > 0 && (
                                                        <div style={{
                                                            marginTop: '0.5rem', marginLeft: '2.5rem',
                                                            borderLeft: '2px solid rgba(255,255,255,0.08)',
                                                            paddingLeft: '0.6rem',
                                                        }}>
                                                            {note.replies.map((r, i) => (
                                                                <p key={i} style={{ fontSize: '0.78rem', margin: '3px 0', color: 'rgba(255,255,255,0.45)' }}>
                                                                    <span style={{ color: r.sender === 'user' ? '#4ade80' : '#818cf8', fontWeight: '700' }}>
                                                                        {r.sender === 'user' ? 'You' : 'Admin'}:{' '}
                                                                    </span>
                                                                    {r.text}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: '6px', marginTop: '0.6rem' }}>
                                                        <GlassInput
                                                            placeholder="Reply…"
                                                            value={replyText[note.id] || ''}
                                                            onChange={e => setReplyText({ ...replyText, [note.id]: e.target.value })}
                                                            style={{ height: '30px', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)' }}
                                                        />
                                                        <button
                                                            onClick={() => handleReply(note.id)}
                                                            style={{
                                                                width: '30px', height: '30px', flexShrink: 0,
                                                                background: 'var(--primary)', border: 'none',
                                                                borderRadius: '8px', cursor: 'pointer',
                                                                color: 'white', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Send size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 4px', display: 'inline-block' }} />

                    {/* Profile */}
                    <div
                        onClick={() => navigate('/profile')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '4px 6px', borderRadius: '12px' }}
                        className="tb-profile"
                    >
                        <div style={{ textAlign: 'right' }} className="desktop-only">
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: 'white', lineHeight: 1.3 }}>
                                {user?.name || 'User'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                                {user?.branch} · {user?.year}
                            </p>
                        </div>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.12)',
                        }}>
                            <User size={17} color="white" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) { .desktop-only { display: none !important; } }
                @media (min-width: 769px)  { .mobile-only  { display: none !important; } }
                .tb-icon:hover { color: white !important; background: rgba(255,255,255,0.08) !important; }
                .tb-profile:hover { background: rgba(255,255,255,0.05) !important; }
            `}</style>
        </>
    );
};

export default TopBar;
