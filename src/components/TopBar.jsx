import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, X, MessageCircle, Send } from 'lucide-react';
import GlassInput from './GlassInput';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [replyText, setReplyText] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const db_ = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return db_ - da;
            });
            setNotifications(list);

            const storageKey = `acadeMe_notif_count_${user.uid}`;
            const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');
            const realUnread = list.length - lastSeenCount;
            setUnreadCount(realUnread > 0 ? realUnread : 0);
        }, (error) => {
            console.error('Error fetching notifications:', error);
        });

        return () => unsubscribe();
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
        } catch (error) {
            console.error('Error replying:', error);
        }
    };

    const handleToggleNotifications = () => {
        const isOpen = !showNotifications;
        setShowNotifications(isOpen);
        if (isOpen) {
            setUnreadCount(0);
            localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
        }
    };

    return (
        <>
            {/* 
                z-index: 100 — sits above page content,
                but BELOW sidebar (z:200) and overlay (z:199).
                This is the key fix: TopBar must never cover the sidebar.
            */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 0',
                marginBottom: '1.5rem',
                background: 'linear-gradient(180deg, rgba(6,13,31,0.98) 80%, transparent 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Hamburger — mobile only */}
                    <button
                        onClick={toggleSidebar}
                        className="mobile-only"
                        style={{
                            background: 'rgba(30,64,175,0.15)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: '10px',
                            color: '#60A5FA',
                            cursor: 'pointer',
                            width: '38px',
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>

                    <div style={{ width: '280px' }} className="desktop-only">
                        <GlassInput
                            placeholder="Search anything..."
                            icon={Search}
                            style={{ margin: 0, height: '40px', background: 'rgba(255,255,255,0.03)' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    {/* Notifications */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={handleToggleNotifications}
                            style={{
                                position: 'relative',
                                background: 'rgba(30,64,175,0.12)',
                                border: '1px solid rgba(59,130,246,0.18)',
                                borderRadius: '10px',
                                color: '#60A5FA',
                                cursor: 'pointer',
                                width: '38px', height: '38px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-4px', right: '-4px',
                                    background: '#EF4444', color: 'white',
                                    borderRadius: '50%', fontSize: '0.58rem',
                                    width: '17px', height: '17px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', border: '2px solid #060d1f',
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                                width: '340px', maxHeight: '420px', overflowY: 'auto',
                                background: '#0c1629',
                                border: '1px solid rgba(59,130,246,0.2)',
                                borderRadius: '16px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
                                zIndex: 110, /* above topbar */
                                padding: '1rem',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Notifications</h4>
                                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'rgba(148,163,184,0.6)', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                </div>

                                {notifications.length === 0 ? (
                                    <p style={{ color: 'rgba(148,163,184,0.5)', textAlign: 'center', fontSize: '0.85rem', padding: '1rem 0' }}>
                                        No notifications yet.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {notifications.map(note => (
                                            <div key={note.id} style={{
                                                background: 'rgba(30,64,175,0.08)',
                                                border: '1px solid rgba(59,130,246,0.12)',
                                                padding: '12px', borderRadius: '12px',
                                            }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <div style={{ background: 'rgba(59,130,246,0.15)', padding: '6px', borderRadius: '50%', color: '#60A5FA', flexShrink: 0 }}>
                                                        <MessageCircle size={13} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700, marginBottom: '3px' }}>Admin Message</p>
                                                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{note.message}</p>
                                                        <p style={{ fontSize: '0.68rem', color: 'rgba(148,163,184,0.4)', marginTop: '4px' }}>
                                                            {new Date(note.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {note.replies?.length > 0 && (
                                                    <div style={{ marginLeft: '2rem', marginTop: '0.5rem', marginBottom: '0.5rem', borderLeft: '2px solid rgba(59,130,246,0.2)', paddingLeft: '0.6rem' }}>
                                                        {note.replies.map((r, i) => (
                                                            <div key={i} style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                                                                <span style={{ color: r.sender === 'user' ? '#34D399' : '#60A5FA', fontWeight: 700 }}>
                                                                    {r.sender === 'user' ? 'You' : 'Admin'}:{' '}
                                                                </span>
                                                                <span style={{ color: 'rgba(148,163,184,0.7)' }}>{r.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem' }}>
                                                    <GlassInput
                                                        placeholder="Reply..."
                                                        value={replyText[note.id] || ''}
                                                        onChange={e => setReplyText({ ...replyText, [note.id]: e.target.value })}
                                                        style={{ height: '32px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
                                                    />
                                                    <button
                                                        onClick={() => handleReply(note.id)}
                                                        style={{
                                                            background: 'rgba(37,99,235,0.8)', border: 'none', borderRadius: '8px',
                                                            width: '34px', flexShrink: 0,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer', color: 'white',
                                                            transition: 'background 0.2s',
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
                        )}
                    </div>

                    {/* Profile */}
                    <div
                        onClick={() => navigate('/profile')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    >
                        <div style={{ textAlign: 'right' }} className="desktop-only">
                            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', margin: 0 }}>
                                {user?.name || 'User'}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.5)', margin: 0 }}>
                                {user?.branch} • {user?.year}
                            </p>
                        </div>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1.5px solid rgba(59,130,246,0.4)',
                            boxShadow: '0 0 12px rgba(59,130,246,0.2)',
                            transition: 'box-shadow 0.2s ease',
                        }}>
                            <User size={18} color="white" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px)  { .desktop-only { display: none !important; } }
                @media (min-width: 769px)  { .mobile-only  { display: none !important; } }
            `}</style>
        </>
    );
};

export default TopBar;
