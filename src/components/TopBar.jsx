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
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/* ── Instagram SVG Icon ── */
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/* ── Graduation Cap / College SVG Icon ── */
const CollegeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

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
        /* ══════════════════════════════════════════
           TOPBAR — WORLD CLASS
        ══════════════════════════════════════════ */
        .tb-root {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px;
          height: 60px;
          background: rgba(10, 10, 20, 0.75);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          box-sizing: border-box;
        }

        /* ── Left ── */
        .tb-left { display: flex; align-items: center; gap: 10px; }

        /* ── Hamburger ── */
        .tb-menu {
          display: none; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 12px;
          background: transparent; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .tb-menu:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .tb-menu:active { transform: scale(0.92); }
        @media (max-width: 768px) { .tb-menu { display: flex; } }

        /* ── Brand ── */
        .tb-logo {
          font-weight: 900; font-size: 1.3rem; letter-spacing: -0.8px;
          background: linear-gradient(135deg, #818CF8 0%, #6366F1 40%, #4F46E5 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          cursor: pointer; user-select: none;
          transition: opacity 0.2s;
          position: relative;
        }
        .tb-logo::after {
          content: ''; position: absolute;
          bottom: -2px; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #6366F1, transparent);
          border-radius: 1px; opacity: 0;
          transition: opacity 0.2s;
        }
        .tb-logo:hover::after { opacity: 1; }

        /* ── Right ── */
        .tb-right { display: flex; align-items: center; gap: 4px; }

        /* ── Icon Button (shared) ── */
        .tb-icon {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 12px;
          background: transparent; border: none;
          color: rgba(255,255,255,0.4); cursor: pointer;
          transition: all 0.25s ease;
          -webkit-tap-highlight-color: transparent;
          text-decoration: none;
        }
        .tb-icon:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
          transform: translateY(-1px);
        }
        .tb-icon:active { transform: scale(0.92); }

        /* ── Specific icon hovers ── */
        .tb-icon-insta:hover {
          color: #E1306C !important;
          background: rgba(225,48,108,0.08) !important;
          box-shadow: 0 4px 16px rgba(225,48,108,0.12);
        }
        .tb-icon-arms:hover {
          color: #FBBF24 !important;
          background: rgba(251,191,36,0.08) !important;
          box-shadow: 0 4px 16px rgba(251,191,36,0.12);
        }
        .tb-icon-bell:hover {
          color: #60A5FA !important;
          background: rgba(96,165,250,0.08) !important;
        }

        /* ── Tooltips ── */
        .tb-icon[data-tip]::before {
          content: attr(data-tip);
          position: absolute; bottom: -32px; left: 50%;
          transform: translateX(-50%) scale(0.9);
          padding: 4px 10px; border-radius: 8px;
          background: rgba(15,15,30,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          font-size: 0.62rem; font-weight: 600;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: all 0.2s ease;
          z-index: 100;
        }
        .tb-icon[data-tip]:hover::before {
          opacity: 1; transform: translateX(-50%) scale(1);
          bottom: -36px;
        }
        @media (max-width: 768px) {
          .tb-icon[data-tip]::before { display: none; }
        }

        /* ── Separator ── */
        .tb-sep {
          width: 1px; height: 24px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 0 4px; flex-shrink: 0;
        }

        /* ── Bell Badge ── */
        .tb-badge {
          position: absolute; top: 3px; right: 3px;
          min-width: 16px; height: 16px; border-radius: 8px;
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: #fff; font-size: 0.55rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px; line-height: 1;
          border: 2px solid rgba(10,10,20,1);
          pointer-events: none;
          animation: tb-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 8px rgba(239,68,68,0.4);
        }
        @keyframes tb-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        /* ── Profile ── */
        .tb-profile {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; padding: 4px 6px; border-radius: 14px;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          margin-left: 2px;
        }
        .tb-profile:hover { background: rgba(255,255,255,0.05); }
        .tb-profile:active { transform: scale(0.97); }

        .tb-uinfo {
          display: none; flex-direction: column; align-items: flex-end;
          gap: 0; max-width: 140px;
        }
        @media (min-width: 640px) { .tb-uinfo { display: flex; } }

        .tb-uname {
          font-size: 0.82rem; font-weight: 700; color: #F1F5F9;
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; line-height: 1.3;
        }
        .tb-umeta {
          font-size: 0.65rem; color: rgba(148,163,184,0.45);
          line-height: 1.3;
        }

        .tb-avatar {
          width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.85rem; color: #fff;
          background: linear-gradient(135deg, #6366F1, #818CF8, #A78BFA);
          border: 2px solid rgba(99,102,241,0.25);
          transition: all 0.3s ease;
          overflow: hidden; flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(99,102,241,0.15);
        }
        .tb-profile:hover .tb-avatar {
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
          transform: scale(1.05);
        }
        .tb-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* ══════════════════════════════════════════
           NOTIFICATION PANEL
        ══════════════════════════════════════════ */
        .np-overlay {
          position: fixed; inset: 0; z-index: 998;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: np-fadein 0.2s ease;
        }
        @keyframes np-fadein { from { opacity: 0; } to { opacity: 1; } }

        .np-panel {
          position: fixed; top: 68px; right: 14px;
          width: min(400px, calc(100vw - 28px));
          max-height: calc(100vh - 86px);
          background: rgba(13, 13, 26, 0.97);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          box-shadow:
            0 30px 80px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.03),
            inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          display: flex; flex-direction: column;
          overflow: hidden; z-index: 999;
          animation: np-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes np-slide {
          from { opacity: 0; transform: translateY(-14px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
          .np-panel {
            right: 8px; top: 64px;
            width: calc(100vw - 16px);
            max-height: calc(100vh - 80px);
            border-radius: 18px;
          }
        }

        .np-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px 14px; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .np-head-left { display: flex; align-items: center; gap: 10px; }
        .np-head-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #6366F1, #818CF8);
          box-shadow: 0 0 8px rgba(99,102,241,0.4);
        }
        .np-head-title { font-weight: 800; font-size: 0.95rem; color: #F1F5F9; }
        .np-head-count {
          font-size: 0.6rem; font-weight: 700;
          background: rgba(99,102,241,0.12); color: #818CF8;
          padding: 2px 8px; border-radius: 10px;
        }
        .np-head-actions { display: flex; gap: 6px; align-items: center; }

        .np-mark-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(148,163,184,0.4); font-size: 0.67rem;
          display: flex; align-items: center; gap: 4px;
          padding: 4px 8px; border-radius: 8px;
          transition: all 0.2s;
        }
        .np-mark-btn:hover { color: #818CF8; background: rgba(99,102,241,0.08); }

        .np-close {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 9px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer; color: rgba(148,163,184,0.5);
          transition: all 0.2s;
        }
        .np-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .np-scroll {
          overflow-y: auto; flex: 1;
          overscroll-behavior: contain;
        }
        .np-scroll::-webkit-scrollbar { width: 3px; }
        .np-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

        .np-empty {
          padding: 3.5rem 1.5rem; text-align: center;
          color: rgba(148,163,184,0.25);
        }
        .np-empty-ico { display: block; margin: 0 auto 14px; opacity: 0.12; }

        .np-item {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.15s;
        }
        .np-item:hover { background: rgba(255,255,255,0.02); }
        .np-item:last-child { border-bottom: none; }

        .np-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
          margin-top: 6px;
          background: linear-gradient(135deg, #818CF8, #6366F1);
          box-shadow: 0 0 6px rgba(99,102,241,0.3);
        }

        .np-msg-title {
          margin: 0 0 3px; font-weight: 700; font-size: 0.84rem;
          color: #E2E8F0; line-height: 1.45;
        }
        .np-msg-body {
          margin: 0 0 4px; font-size: 0.77rem;
          color: rgba(148,163,184,0.55); line-height: 1.5;
        }
        .np-msg-time {
          font-size: 0.6rem; color: rgba(148,163,184,0.3);
          display: flex; align-items: center; gap: 3px;
        }

        .np-link {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 6px; font-size: 0.73rem; font-weight: 600;
          color: #818CF8; text-decoration: none;
          background: rgba(99,102,241,0.06); padding: 4px 10px;
          border-radius: 7px; transition: background 0.2s;
        }
        .np-link:hover { background: rgba(99,102,241,0.12); }

        .np-replies {
          border-left: 2px solid rgba(99,102,241,0.12);
          padding-left: 12px; margin: 8px 0 8px 4px;
        }
        .np-reply-sender {
          font-size: 0.63rem; font-weight: 700;
        }
        .np-reply-text {
          margin: 2px 0 0; font-size: 0.74rem;
          color: rgba(226,232,240,0.5); line-height: 1.4;
        }

        .np-input-row {
          display: flex; gap: 6px; align-items: flex-end; margin-top: 10px;
        }
        .np-input {
          flex: 1; padding: 9px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; outline: none;
          color: #E2E8F0; font-size: 0.8rem; font-family: inherit;
          resize: none; min-height: 38px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .np-input:focus {
          border-color: rgba(99,102,241,0.35);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.06);
        }
        .np-input::placeholder { color: rgba(148,163,184,0.3); }

        .np-send {
          width: 38px; height: 38px; min-width: 38px;
          border-radius: 12px; border: none;
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99,102,241,0.2);
        }
        .np-send:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.3); }
        .np-send:active { transform: scale(0.95); }
        .np-send:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Mobile tweaks ── */
        @media (max-width: 380px) {
          .tb-root { padding: 0 12px; height: 56px; }
          .tb-icon { width: 34px; height: 34px; }
          .tb-avatar { width: 32px; height: 32px; min-width: 32px; }
          .tb-logo { font-size: 1.15rem; }
        }
      `}</style>

      <div className="tb-root">
        {/* ── Left ── */}
        <div className="tb-left">
          <button className="tb-menu" onClick={toggleSidebar} aria-label="Menu">
            <Menu size={22} />
          </button>
          <span className="tb-logo" onClick={() => navigate('/dashboard')}>
            AcadeMe
          </span>
        </div>

        {/* ── Right ── */}
        <div className="tb-right">

          {/* Instagram — Icon Only */}
          <a
            href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
            target="_blank"
            rel="noopener noreferrer"
            className="tb-icon tb-icon-insta"
            data-tip="Instagram"
            aria-label="Instagram"
          >
            <InstagramIcon size={19} />
          </a>

          {/* ARMS College — Icon Only */}
          <a
            href="https://arms.sse.saveetha.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="tb-icon tb-icon-arms"
            data-tip="ARMS Portal"
            aria-label="ARMS Portal"
          >
            <CollegeIcon size={19} />
          </a>

          {/* Separator */}
          <div className="tb-sep" />

          {/* Bell — Icon Only */}
          <button
            className="tb-icon tb-icon-bell"
            onClick={handleBellClick}
            data-tip="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Separator */}
          <div className="tb-sep" />

          {/* Profile */}
          <div
            className="tb-profile"
            onClick={() => { setShowNotifications(false); navigate('/profile'); }}
          >
            <div className="tb-uinfo">
              <span className="tb-uname">{user?.name || 'User'}</span>
              {(user?.branch || user?.year) && (
                <span className="tb-umeta">
                  {[user.branch, user.year].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <div className="tb-avatar">
              {userAvatar ? (
                <img src={userAvatar} alt="" />
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
          <div className="np-overlay" onClick={() => setShowNotifications(false)} />
          <div className="np-panel" ref={panelRef}>
            <div className="np-head">
              <div className="np-head-left">
                <div className="np-head-dot" />
                <span className="np-head-title">Notifications</span>
                {notifications.length > 0 && (
                  <span className="np-head-count">{notifications.length}</span>
                )}
              </div>
              <div className="np-head-actions">
                {unreadCount > 0 && (
                  <button className="np-mark-btn" onClick={markAllRead}>
                    <CheckCheck size={12} /> Mark read
                  </button>
                )}
                <button className="np-close" onClick={() => setShowNotifications(false)} aria-label="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="np-scroll">
              {notifications.length === 0 ? (
                <div className="np-empty">
                  <Bell size={36} className="np-empty-ico" />
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.9rem', color: 'rgba(148,163,184,0.4)' }}>
                    All caught up!
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem' }}>No new notifications</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="np-item">
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="np-dot" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title / Message */}
                        <p className="np-msg-title">
                          {notif.title || notif.message || 'Notification'}
                        </p>
                        {notif.body && notif.body !== notif.title && (
                          <p className="np-msg-body">{notif.body}</p>
                        )}
                        {notif.message && notif.message !== notif.title && !notif.body && (
                          <p className="np-msg-body">{notif.message}</p>
                        )}

                        {/* Time */}
                        {notif.createdAt && (
                          <span className="np-msg-time">
                            {fmtTime(notif.createdAt)}
                          </span>
                        )}

                        {/* Link */}
                        {notif.url && (
                          <div>
                            <a href={notif.url} target="_blank" rel="noreferrer" className="np-link">
                              <ExternalLink size={11} /> Open Link
                            </a>
                          </div>
                        )}

                        {/* Replies */}
                        {notif.replies?.length > 0 && (
                          <div className="np-replies">
                            {notif.replies.map((r, i) => (
                              <div key={i} style={{ marginBottom: i < notif.replies.length - 1 ? '6px' : 0 }}>
                                <span className="np-reply-sender" style={{
                                  color: r.sender === 'admin' ? '#FBBF24' : '#818CF8',
                                }}>
                                  {r.sender === 'admin' ? 'Admin' : 'You'}
                                </span>
                                <p className="np-reply-text">{r.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        <div className="np-input-row">
                          <textarea
                            className="np-input"
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
                            className="np-send"
                            onClick={() => handleReply(notif.id)}
                            disabled={!replyText[notif.id]?.trim()}
                            aria-label="Send reply"
                          >
                            <Send size={14} />
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
