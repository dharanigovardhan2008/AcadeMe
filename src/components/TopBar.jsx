import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, X, MessageCircle, Send, Instagram, School } from 'lucide-react';
import GlassInput from './GlassInput';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

/* ── Feedback Modal ─────────────────────────────────────────── */
const FeedbackModal = ({ onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!feedback.trim()) return;
        // TODO: wire to your Firestore if needed
        setSent(true);
        setTimeout(onClose, 1500);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                }}
            />
            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(420px, calc(100vw - 2rem))',
                background: '#1F1F2E',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '1.5rem',
                zIndex: 9999,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            background: 'rgba(99,102,241,0.2)', padding: '8px',
                            borderRadius: '10px', color: '#818CF8'
                        }}>
                            <MessageCircle size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Send Feedback</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 1rem 0' }}>
                    We'd love to hear your thoughts, suggestions or report an issue.
                </p>

                {sent ? (
                    <div style={{
                        textAlign: 'center', padding: '1.5rem',
                        color: '#34D399', fontWeight: 'bold', fontSize: '0.95rem'
                    }}>
                        ✅ Feedback sent! Thank you.
                    </div>
                ) : (
                    <>
                        <textarea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Write your feedback here..."
                            rows={5}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                color: 'white',
                                padding: '0.75rem',
                                fontSize: '0.88rem',
                                resize: 'vertical',
                                outline: 'none',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                marginTop: '0.75rem',
                                width: '100%',
                                padding: '0.65rem',
                                background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                            }}
                        >
                            Send Feedback
                        </button>
                    </>
                )}
            </div>
        </>
    );
};

/* ── TopBar ─────────────────────────────────────────────────── */
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

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
            setNotifications(list);

            const storageKey = `acadeMe_notif_count_${user.uid}`;
            const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');
            const realUnread = list.length - lastSeenCount;
            setUnreadCount(realUnread > 0 ? realUnread : 0);
        }, (error) => {
            console.error("Error fetching notifications:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const handleReply = async (msgId) => {
        const text = replyText[msgId];
        if (!text?.trim()) return;
        try {
            const msgRef = doc(db, "notifications", msgId);
            await updateDoc(msgRef, {
                replies: arrayUnion({
                    sender: 'user',
                    text: text,
                    timestamp: new Date().toISOString()
                }),
                read: false
            });
            setReplyText(prev => ({ ...prev, [msgId]: '' }));
            alert("Reply sent!");
        } catch (error) {
            console.error("Error replying:", error);
        }
    };

    const handleToggleNotifications = () => {
        const isOpen = !showNotifications;
        setShowNotifications(isOpen);
        if (isOpen && user) {
            setUnreadCount(0);
            const storageKey = `acadeMe_notif_count_${user.uid}`;
            localStorage.setItem(storageKey, notifications.length.toString());
        }
    };

    const iconBtn = {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px',
        borderRadius: '9px',
        transition: 'color 0.18s, background 0.18s',
        textDecoration: 'none',
    };

    return (
        <>
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.2rem',
                marginBottom: '1.5rem',
            }}>
                {/* ── Left: hamburger + brand ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                        onClick={toggleSidebar}
                        className="mobile-only"
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                    >
                        <Menu size={24} />
                    </button>

                    <span style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.3px',
                    }}>
                        AcadeMe
                    </span>
                </div>

                {/* ── Right: icons + profile ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

                    {/* Instagram */}
                    <a
                        href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram"
                        style={iconBtn}
                        className="tb-btn"
                    >
                        <Instagram size={21} />
                    </a>

                    {/* Feedback / Message */}
                    <button
                        onClick={() => setShowFeedback(true)}
                        title="Send Feedback"
                        style={iconBtn}
                        className="tb-btn"
                    >
                        <MessageCircle size={21} />
                    </button>

                    {/* ARMS – official website (School icon) */}
                    <a
                        href="https://arms.sse.saveetha.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="ARMS – Saveetha"
                        style={iconBtn}
                        className="tb-btn"
                    >
                        <School size={21} />
                    </a>

                    {/* Thin divider */}
                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

                    {/* Notification Bell */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={handleToggleNotifications}
                            title="Notifications"
                            style={{ ...iconBtn, position: 'relative' }}
                            className="tb-btn"
                        >
                            <Bell size={21} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '3px', right: '3px',
                                    background: 'var(--danger)', color: 'white',
                                    borderRadius: '50%', fontSize: '0.55rem',
                                    width: '14px', height: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', pointerEvents: 'none',
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification dropdown — position:fixed so it always floats above everything */}
                        {showNotifications && (
                            <>
                                <div
                                    onClick={() => setShowNotifications(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                                />
                                <div style={{
                                    position: 'fixed',
                                    top: '68px',
                                    right: '1rem',
                                    width: 'min(340px, calc(100vw - 2rem))',
                                    maxHeight: '70vh',
                                    overflowY: 'auto',
                                    background: '#1F1F2E',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '14px',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                    zIndex: 200,
                                    padding: '1rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ fontWeight: 'bold', color: 'white', margin: 0 }}>Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.88rem' }}>No notifications yet.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {notifications.map(note => (
                                                <div key={note.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px' }}>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                        <div style={{ background: 'rgba(59,130,246,0.2)', padding: '6px', borderRadius: '50%', color: '#60A5FA', flexShrink: 0 }}>
                                                            <MessageCircle size={13} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 'bold', margin: '0 0 2px' }}>Admin Message</p>
                                                            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)', wordBreak: 'break-word', margin: 0 }}>{note.message}</p>
                                                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px', marginBottom: 0 }}>{new Date(note.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    {note.replies && note.replies.length > 0 && (
                                                        <div style={{ marginLeft: '2rem', borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                                                            {note.replies.map((r, i) => (
                                                                <div key={i} style={{ fontSize: '0.78rem', marginBottom: '3px' }}>
                                                                    <span style={{ color: r.sender === 'user' ? '#34D399' : '#60A5FA', fontWeight: 'bold' }}>
                                                                        {r.sender === 'user' ? 'You' : 'Admin'}:{' '}
                                                                    </span>
                                                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: '5px', marginTop: '0.4rem' }}>
                                                        <GlassInput
                                                            placeholder="Reply..."
                                                            value={replyText[note.id] || ''}
                                                            onChange={e => setReplyText({ ...replyText, [note.id]: e.target.value })}
                                                            style={{ height: '30px', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)' }}
                                                        />
                                                        <button
                                                            onClick={() => handleReply(note.id)}
                                                            style={{
                                                                background: 'var(--primary)', border: 'none', borderRadius: '8px',
                                                                width: '30px', flexShrink: 0,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', color: 'white',
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

                    {/* Thin divider */}
                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

                    {/* Profile avatar */}
                    <div
                        onClick={() => navigate('/profile')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
                    >
                        <div style={{ textAlign: 'right' }} className="desktop-only">
                            <p style={{ fontSize: '0.88rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{user?.name || 'User'}</p>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{user?.branch} • {user?.year}</p>
                        </div>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.15)',
                            flexShrink: 0,
                        }}>
                            <User size={17} />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) { .desktop-only { display: none !important; } }
                @media (min-width: 769px) { .mobile-only { display: none !important; } }
                .tb-btn:hover {
                    color: white !important;
                    background: rgba(255,255,255,0.09) !important;
                }
            `}</style>
        </>
    );
};

export default TopBar;
