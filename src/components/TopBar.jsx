import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, X, MessageCircle, Send } from 'lucide-react';
import GlassInput from './GlassInput';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

// ── ARMS College Portal icon ──────────────────────────────────────────────────
// 4-square grid = "portal / apps" metaphor
const ArmsIcon = ({ size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3"  y="3"  width="7" height="7" rx="1.5" fill="currentColor" opacity="0.95"/>
        <rect x="14" y="3"  width="7" height="7" rx="1.5" fill="currentColor" opacity="0.75"/>
        <rect x="3"  y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.75"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.55"/>
    </svg>
);

// ── Instagram brand icon ──────────────────────────────────────────────────────
const InstagramIcon = ({ size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
    </svg>
);

// ── Feedback / chat-lines icon ────────────────────────────────────────────────
const FeedbackIcon = ({ size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="9" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// ── TopBar ────────────────────────────────────────────────────────────────────
const TopBar = ({ toggleSidebar }) => {
    const { user }  = useAuth();
    const navigate  = useNavigate();
    const [notifications,     setNotifications]     = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [replyText,         setReplyText]         = useState({});
    const [unreadCount,       setUnreadCount]       = useState(0);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const dA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dB - dA;
            });
            setNotifications(list);
            const key    = `acadeMe_notif_count_${user.uid}`;
            const seen   = parseInt(localStorage.getItem(key) || '0');
            const unread = list.length - seen;
            setUnreadCount(unread > 0 ? unread : 0);
        }, err => console.error('Notification error:', err));
        return () => unsub();
    }, [user]);

    const handleReply = async (msgId) => {
        const text = replyText[msgId];
        if (!text?.trim()) return;
        try {
            await updateDoc(doc(db, 'notifications', msgId), {
                replies: arrayUnion({ sender: 'user', text, timestamp: new Date().toISOString() }),
                read: false,
            });
            setReplyText(prev => ({ ...prev, [msgId]: '' }));
            alert('Reply sent!');
        } catch (err) { console.error(err); }
    };

    const handleToggleNotifications = () => {
        const next = !showNotifications;
        setShowNotifications(next);
        if (next) {
            setUnreadCount(0);
            localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
        }
    };

    // Base style for the three quick-action icon buttons
    const qBtn = {
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '7px', borderRadius: '10px',
        transition: 'background 0.18s ease, transform 0.15s ease',
        textDecoration: 'none',
    };

    const hover = (color) => ({
        onMouseEnter: e => { e.currentTarget.style.background = color; e.currentTarget.style.transform = 'scale(1.1)'; },
        onMouseLeave: e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.transform = 'scale(1)'; },
    });

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem', padding: '1rem 0',
        }}>

            {/* ── Left: hamburger + search ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={toggleSidebar}
                    className="mobile-only"
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    <Menu size={24} />
                </button>
                <div style={{ width: '300px' }} className="desktop-only">
                    <GlassInput
                        placeholder="Search anything..."
                        icon={Search}
                        style={{ margin: 0, height: '40px', background: 'rgba(255,255,255,0.03)' }}
                    />
                </div>
            </div>

            {/* ── Right: ARMS + Instagram + Feedback | Bell | Profile ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

                {/* ARMS College Portal */}
                <a
                    href="https://arms.sse.saveetha.com/"
                    target="_blank"
                    rel="noreferrer"
                    title="ARMS — College Portal"
                    style={{ ...qBtn, color: '#60A5FA' }}
                    {...hover('rgba(96,165,250,0.13)')}
                >
                    <ArmsIcon size={21} />
                </a>

                {/* Instagram */}
                <a
                    href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
                    target="_blank"
                    rel="noreferrer"
                    title="Instagram"
                    style={{ ...qBtn, color: '#E1306C' }}
                    {...hover('rgba(225,48,108,0.13)')}
                >
                    <InstagramIcon size={21} />
                </a>

                {/* Feedback — fires open-feedback event; Sidebar listens and opens modal */}
                <button
                    title="Send Feedback / Suggestion"
                    style={{ ...qBtn, color: '#34D399' }}
                    onClick={() => window.dispatchEvent(new CustomEvent('open-feedback'))}
                    {...hover('rgba(52,211,153,0.13)')}
                >
                    <FeedbackIcon size={21} />
                </button>

                {/* Thin vertical divider */}
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 6px', flexShrink: 0 }} />

                {/* Bell */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={handleToggleNotifications}
                        title="Notifications"
                        style={{ ...qBtn, color: 'var(--text-secondary)', position: 'relative' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '2px', right: '2px',
                                background: 'var(--danger)', color: 'white',
                                borderRadius: '50%', fontSize: '0.6rem',
                                width: '16px', height: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold',
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification dropdown — all original logic 100% preserved */}
                    {showNotifications && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0,
                            width: '350px', maxHeight: '400px', overflowY: 'auto',
                            background: '#1F1F2E', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            zIndex: 100, marginTop: '10px', padding: '1rem',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontWeight: 'bold', color: 'white', margin: 0 }}>Notifications</h4>
                                <button onClick={() => setShowNotifications(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {notifications.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No notifications.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {notifications.map(note => (
                                        <div key={note.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ background: 'rgba(59,130,246,0.2)', padding: '6px', borderRadius: '50%', color: '#60A5FA' }}>
                                                    <MessageCircle size={14} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#60A5FA', fontWeight: 'bold', margin: '0 0 2px' }}>Admin Message</p>
                                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 4px' }}>{note.message}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                        {new Date(note.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {note.replies?.length > 0 && (
                                                <div style={{ marginLeft: '2rem', marginTop: '0.5rem', marginBottom: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
                                                    {note.replies.map((r, i) => (
                                                        <div key={i} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                                                            <span style={{ color: r.sender === 'user' ? '#34D399' : '#60A5FA', fontWeight: 'bold' }}>
                                                                {r.sender === 'user' ? 'You' : 'Admin'}:{' '}
                                                            </span>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{r.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem' }}>
                                                <GlassInput
                                                    placeholder="Reply..."
                                                    value={replyText[note.id] || ''}
                                                    onChange={e => setReplyText({ ...replyText, [note.id]: e.target.value })}
                                                    style={{ height: '32px', fontSize: '16px', background: 'rgba(0,0,0,0.2)' }}
                                                />
                                                <button
                                                    onClick={() => handleReply(note.id)}
                                                    style={{
                                                        background: 'var(--primary)', border: 'none', borderRadius: '8px',
                                                        width: '32px', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', cursor: 'pointer', color: 'white',
                                                    }}
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div
                    onClick={() => navigate('/profile')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', marginLeft: '6px' }}
                >
                    <div style={{ textAlign: 'right' }} className="desktop-only">
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>{user?.name || 'User'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{user?.branch} • {user?.year}</p>
                    </div>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(255,255,255,0.2)',
                    }}>
                        <User size={20} />
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) { .desktop-only { display: none !important; } }
                @media (min-width: 769px) { .mobile-only  { display: none !important; } }
            `}</style>
        </div>
    );
};

export default TopBar;
