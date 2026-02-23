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

        // Listen for notifications for this user
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort by date (newest first)
            list.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
            
            setNotifications(list);

            // --- PERSISTENT UNREAD LOGIC ---
            // 1. Get the count of messages we saw last time from LocalStorage
            const storageKey = `acadeMe_notif_count_${user.uid}`;
            const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');

            // 2. Calculate real unread (Total in DB - Total we saw before)
            const realUnread = list.length - lastSeenCount;

            // 3. Set badge (if realUnread is negative, it means messages were deleted, so show 0)
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

    // Toggle function: Open dropdown AND save current count to storage
    const handleToggleNotifications = () => {
        const isOpen = !showNotifications;
        setShowNotifications(isOpen);

        if (isOpen) {
            // User opened the panel, mark all current messages as "Seen" locally
            setUnreadCount(0);
            const storageKey = `acadeMe_notif_count_${user.uid}`;
            localStorage.setItem(storageKey, notifications.length.toString());
        }
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem', padding: '1rem 0'
        }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={handleToggleNotifications} 
                        style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <Bell size={24} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-2px', right: '-2px',
                                background: 'var(--danger)', color: 'white',
                                borderRadius: '50%', fontSize: '0.6rem', width: '16px', height: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute', top: '100%', right: '0',
                            width: '350px', maxHeight: '400px', overflowY: 'auto',
                            background: '#1F1F2E', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            zIndex: 100, marginTop: '10px', padding: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontWeight: 'bold', color: 'white' }}>Notifications</h4>
                                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={16} /></button>
                            </div>

                            {notifications.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No notifications.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {notifications.map(note => (
                                        <div key={note.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '50%', color: '#60A5FA' }}>
                                                    <MessageCircle size={14} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#60A5FA', fontWeight: 'bold', marginBottom: '2px' }}>Admin Message</p>
                                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>{note.message}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(note.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Replies */}
                                            {note.replies && note.replies.length > 0 && (
                                                <div style={{ marginLeft: '2rem', marginTop: '0.5rem', marginBottom: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
                                                    {note.replies.map((r, i) => (
                                                        <div key={i} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                                                            <span style={{ color: r.sender === 'user' ? '#34D399' : '#60A5FA', fontWeight: 'bold' }}>{r.sender === 'user' ? 'You' : 'Admin'}: </span>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{r.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Input */}
                                            <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem' }}>
                                                <GlassInput
                                                    placeholder="Reply..."
                                                    value={replyText[note.id] || ''}
                                                    onChange={e => setReplyText({ ...replyText, [note.id]: e.target.value })}
                                                    style={{ height: '32px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
                                                />
                                                <button
                                                    onClick={() => handleReply(note.id)}
                                                    style={{
                                                        background: 'var(--primary)', border: 'none', borderRadius: '8px',
                                                        width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', color: 'white'
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

                <div
                    onClick={() => navigate('/profile')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
                >
                    <div style={{ textAlign: 'right' }} className="desktop-only">
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user?.name || 'User'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.branch} • {user?.year}</p>
                    </div>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(255,255,255,0.2)'
                    }}>
                        <User size={20} />
                    </div>
                </div>
            </div>

            <style>{`
            @media (max-width: 768px) {
                .desktop-only { display: none !important; }
            }
            @media (min-width: 769px) {
                .mobile-only { display: none !important; }
            }
        `}</style>
        </div>
    );
};

export default TopBar;
