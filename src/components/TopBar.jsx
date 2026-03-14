import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Send, CheckCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, arrayUnion,
} from 'firebase/firestore';

/* ── Safe Firestore Timestamp ── */
const toJSDate = (val) => {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

const fmtTime = (val) => {
  if (!val) return '';
  const d = toJSDate(val);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const TopBar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => toJSDate(b.createdAt) - toJSDate(a.createdAt));
      setNotifications(list);
      const key = `acadeMe_notif_count_${user.uid}`;
      const seen = parseInt(localStorage.getItem(key) || '0', 10);
      setUnreadCount(Math.max(0, list.length - seen));
    }, (err) => console.error('Notification error:', err));
    return () => unsub();
  }, [user?.uid]);

  const markAllRead = () => {
    if (!user?.uid) return;
    localStorage.setItem(`acadeMe_notif_count_${user.uid}`, notifications.length.toString());
    setUnreadCount(0);
  };

  const handleBellClick = () => {
    setShowNotifications(v => {
      if (!v) markAllRead();
      return !v;
    });
  };

  const handleReply = async (msgId) => {
    const text = replyText[msgId];
    if (!text?.trim()) return;
    try {
      await updateDoc(doc(db, 'notifications', msgId), {
        replies: arrayUnion({
          sender: 'user',
          text: text.trim(),
          timestamp: new Date().toISOString(),
        }),
        read: false,
      });
      setReplyText(prev => ({ ...prev, [msgId]: '' }));
    } catch (e) {
      console.error('Reply error:', e);
    }
  };

  const userInitial = (user?.name || 'U').charAt(0).toUpperCase();
  const userAvatar = user?.avatar;

  return (
    <>
      <style>{`
        /* ══════════════════════════════════════
           TOP BAR
        ══════════════════════════════════════ */
        .topbar {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          height: 64px;
          background: rgba(13, 13, 24, 0.85);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          box-sizing: border-box;
        }

        /* ── Left Section ── */
        .topbar-left {
          display: flex; align-items: center; gap: 12px;
        }

        .topbar-hamburger {
          display: none; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 12px;
          background: transparent; border: none;
          color: rgba(255,255,255,0.7); cursor: pointer;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .topbar-hamburger:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .topbar-hamburger:active { transform: scale(0.95); }
        @media (max-width: 768px) { .topbar-hamburger { display: flex; } }

        .topbar-brand {
          font-weight: 800; font-size: 1.25rem;
          background: linear-gradient(135deg, #818CF8, #6366F1, #4F46E5);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; letter-spacing: -0.5px;
          cursor: pointer; user-select: none;
          transition: opacity 0.2s;
        }
        .topbar-brand:hover { opacity: 0.85; }

        /* ── Right Section ── */
        .topbar-right {
          display: flex; align-items: center; gap: 6px;
        }

        /* ── Quick Link Buttons ── */
        .topbar-link {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          height: 36px; padding: 0 12px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
        }
        .topbar-link:hover {
          background: rgba(255,255,255,0.1);
          color: #fff; border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .topbar-link:active { transform: scale(0.97); }

        .topbar-link-insta:hover { color: #E1306C !important; border-color: rgba(225,48,108,0.25) !important; }
        .topbar-link-arms:hover { color: #FBBF24 !important; border-color: rgba(251,191,36,0.25) !important; }

        /* Hide text on small screens, keep icon */
        .topbar-link-text { display: none; }
        @media (min-width: 640px) { .topbar-link-text { display: inline; } }

        /* ── Separator ── */
        .topbar-sep {
          width: 1px; height: 28px;
          background: rgba(255,255,255,0.08);
          margin: 0 6px; flex-shrink: 0;
        }

        /* ── Bell Button ── */
        .topbar-bell {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 12px;
          background: transparent; border: none;
          color: rgba(255,255,255,0.6); cursor: pointer;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .topbar-bell:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .topbar-bell:active { transform: scale(0.95); }

        .topbar-bell-badge {
          position: absolute; top: 4px; right: 4px;
          min-width: 18px; height: 18px; border-radius: 9px;
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: #fff; font-size: 0.6rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px; line-height: 1;
          border: 2.5px solid rgba(13,13,24,1);
          pointer-events: none;
          animation: badge-pop 0.3s ease;
        }
        @keyframes badge-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        /* ── Profile Section ── */
        .topbar-profile {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; padding: 4px; border-radius: 14px;
          transition: background 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .topbar-profile:hover { background: rgba(255,255,255,0.06); }

        .topbar-user-info {
          display: none; flex-direction: column; align-items: flex-end; gap: 0;
        }
        @media (min-width: 600px) { .topbar-user-info { display: flex; } }

        .topbar-user-name {
          font-size: 0.84rem; font-weight: 700; color: #F1F5F9;
          max-width: 130px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; line-height: 1.3;
        }
        .topbar-user-meta {
          font-size: 0.68rem; color: rgba(148,163,184,0.5);
          line-height: 1.3;
        }

        .topbar-avatar {
          width: 38px; height: 38px; min-width: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9rem; color: #fff;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          border: 2.5px solid rgba(99,102,241,0.3);
          transition: all 0.25s; overflow: hidden;
          flex-shrink: 0;
        }
        .topbar-avatar:hover {
          border-color: rgba(99,102,241,0.7);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(99,102,241,0.3);
        }
        .topbar-avatar img {
          width: 100%; height: 100%; object-fit: cover;
        }

        /* ══════════════════════════════════════
           NOTIFICATION PANEL
        ══════════════════════════════════════ */
        .notif-overlay {
          position: fixed; inset: 0; z-index: 998;
          background: rgba(0,0,0,0.3);
          animation: notif-fade 0.15s ease;
        }
        @keyframes notif-fade { from { opacity: 0; } to { opacity: 1; } }

        .notif-panel {
          position: fixed; top: 72px; right: 16px;
          width: min(400px, calc(100vw - 32px));
          max-height: calc(100vh - 90px);
          background: rgba(15, 15, 28, 0.98);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 25px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
          backdrop-filter: blur(30px);
          display: flex; flex-direction: column;
          overflow: hidden; z-index: 999;
          animation: notif-slide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes notif-slide {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
          .notif-panel { right: 8px; top: 68px; width: calc(100vw - 16px); border-radius: 16px; }
        }

        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px 14px; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .notif-header-left { display: flex; align-items: center; gap: 10px; }
        .notif-header-title { font-weight: 700; font-size: 0.95rem; color: #F1F5F9; }
        .notif-header-count {
          font-size: 0.62rem; font-weight: 700;
          background: rgba(99,102,241,0.15); color: #818CF8;
          padding: 2px 8px; border-radius: 10px;
        }

        .notif-scroll { overflow-y: auto; flex: 1; overscroll-behavior: contain; }
        .notif-scroll::-webkit-scrollbar { width: 3px; }
        .notif-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        .notif-empty {
          padding: 3rem 1rem; text-align: center; color: rgba(148,163,184,0.3);
        }
        .notif-empty-icon { display: block; margin: 0 auto 12px; opacity: 0.15; }

        .notif-item {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .notif-item:hover { background: rgba(255,255,255,0.02); }
        .notif-item:last-child { border-bottom: none; }

        .notif-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #6366F1, #818CF8);
          flex-shrink: 0; margin-top: 5px;
        }

        .notif-replies {
          border-left: 2px solid rgba(99,102,241,0.15);
          padding-left: 12px; margin: 8px 0 8px 10px;
        }

        .notif-reply-row {
          display: flex; gap: 6px; align-items: flex-end; margin-top: 10px;
        }
        .notif-reply-input {
          flex: 1; padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; outline: none;
          color: #E2E8F0; font-size: 0.8rem; font-family: inherit;
          resize: none; min-height: 38px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .notif-reply-input:focus {
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .notif-reply-input::placeholder { color: rgba(148,163,184,0.35); }

        .notif-send-btn {
          padding: 8px 14px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: #fff; font-size: 0.75rem; font-weight: 700;
          cursor: pointer; display: flex; align-items: center;
          gap: 4px; flex-shrink: 0; min-height: 38px;
          transition: all 0.2s;
        }
        .notif-send-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .notif-send-btn:active { transform: scale(0.97); }
        .notif-send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

        .notif-close-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; color: #94A3B8;
          transition: all 0.2s;
        }
        .notif-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .notif-mark-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(148,163,184,0.45); font-size: 0.68rem;
          display: flex; align-items: center; gap: 4px;
          padding: 4px 8px; border-radius: 6px;
          transition: all 0.2s;
        }
        .notif-mark-btn:hover { color: #818CF8; background: rgba(99,102,241,0.08); }

        /* ── Instagram SVG (custom since lucide may not have it) ── */
        .icon-insta { width: 16px; height: 16px; }
      `}</style>

      <div className="topbar">
        {/* ── Left ── */}
        <div className="topbar-left">
          <button className="topbar-hamburger" onClick={toggleSidebar} aria-label="Menu">
            <Menu size={22} />
          </button>
          <span className="topbar-brand" onClick={() => navigate('/dashboard')}>
            AcadeMe
          </span>
        </div>

        {/* ── Right ── */}
        <div className="topbar-right">

          {/* Instagram */}
          <a
            href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
            target="_blank"
            rel="noopener noreferrer"
            className="topbar-link topbar-link-insta"
            aria-label="Instagram"
          >
            <svg className="icon-insta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <span className="topbar-link-text">Instagram</span>
          </a>

          {/* ARMS */}
          <a
            href="https://arms.sse.saveetha.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="topbar-link topbar-link-arms"
            aria-label="ARMS Portal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span className="topbar-link-text">ARMS</span>
          </a>

          {/* Separator */}
          <div className="topbar-sep" />

          {/* Bell */}
          <button
            className="topbar-bell"
            onClick={handleBellClick}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="topbar-bell-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Separator */}
          <div className="topbar-sep" />

          {/* Profile */}
          <div
            className="topbar-profile"
            onClick={() => {
              setShowNotifications(false);
              navigate('/profile');
            }}
          >
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user?.name || 'User'}</span>
              {(user?.branch || user?.year) && (
                <span className="topbar-user-meta">
                  {[user.branch, user.year].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <div className="topbar-avatar">
              {userAvatar ? (
                <img src={userAvatar} alt={user?.name || 'Profile'} />
              ) : (
                userInitial
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ Notification Panel ══ */}
      {showNotifications && (
        <>
          <div className="notif-overlay" onClick={() => setShowNotifications(false)} />
          <div className="notif-panel" ref={panelRef}>
            <div className="notif-header">
              <div className="notif-header-left">
                <span className="notif-header-title">Notifications</span>
                {notifications.length > 0 && (
                  <span className="notif-header-count">{notifications.length}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button className="notif-mark-btn" onClick={markAllRead}>
                    <CheckCheck size={12} /> Mark read
                  </button>
                )}
                <button className="notif-close-btn" onClick={() => setShowNotifications(false)} aria-label="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="notif-scroll">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <Bell size={32} className="notif-empty-icon" />
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.88rem' }}>All caught up!</p>
                  <p style={{ margin: 0, fontSize: '0.76rem' }}>No new notifications</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="notif-item">
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="notif-dot" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                            {notif.title || notif.message || 'Notification'}
                          </p>
                          <span style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.4)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
                            {fmtTime(notif.createdAt)}
                          </span>
                        </div>

                        {notif.body && notif.body !== notif.title && (
                          <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: 'rgba(148,163,184,0.6)', lineHeight: 1.5 }}>
                            {notif.body}
                          </p>
                        )}

                        {/* Message content if separate from title */}
                        {notif.message && notif.message !== notif.title && !notif.body && (
                          <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: 'rgba(148,163,184,0.6)', lineHeight: 1.5 }}>
                            {notif.message}
                          </p>
                        )}

                        {notif.url && (
                          <a href={notif.url} target="_blank" rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              fontSize: '0.73rem', fontWeight: 600, color: '#818CF8',
                              textDecoration: 'none', marginBottom: '6px',
                              background: 'rgba(99,102,241,0.08)', padding: '4px 10px',
                              borderRadius: '6px', transition: 'background 0.2s',
                            }}
                          >
                            <ExternalLink size={12} /> Open Link
                          </a>
                        )}

                        {notif.replies?.length > 0 && (
                          <div className="notif-replies">
                            {notif.replies.map((r, i) => (
                              <div key={i} style={{ marginBottom: i < notif.replies.length - 1 ? '6px' : 0 }}>
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: 700,
                                  color: r.sender === 'admin' ? '#FBBF24' : '#818CF8',
                                }}>
                                  {r.sender === 'admin' ? 'Admin' : 'You'}
                                </span>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(226,232,240,0.55)', lineHeight: 1.4 }}>
                                  {r.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="notif-reply-row">
                          <textarea
                            className="notif-reply-input"
                            rows={1}
                            placeholder="Write a reply..."
                            value={replyText[notif.id] || ''}
                            onChange={e => setReplyText(p => ({ ...p, [notif.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(notif.id);
                              }
                            }}
                          />
                          <button
                            className="notif-send-btn"
                            onClick={() => handleReply(notif.id)}
                            disabled={!replyText[notif.id]?.trim()}
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TopBar;
