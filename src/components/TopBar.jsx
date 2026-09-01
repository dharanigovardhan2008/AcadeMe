// TopBar.jsx

import React, { useState, useEffect } from 'react';
import { Menu, Bell, BellOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const TopBar = ({ toggleSidebar }) => {
    const location = useLocation();
    const [notifsOn, setNotifsOn] = useState(false);
    const [busy, setBusy] = useState(false);

    // Load saved notification state so the bell reflects reality on mount
    useEffect(() => {
        const loadState = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists() && snap.data().notificationsEnabled === true) {
                    setNotifsOn(true);
                }
            } catch (e) {
                console.error('Error loading notification state:', e);
            }
        };
        loadState();
    }, []);

    const handleToggleNotifications = async () => {
        if (busy) return;

        // ── TURN OFF ──────────────────────────────────────────────
        if (notifsOn) {
            setBusy(true);
            try {
                const user = auth.currentUser;
                if (user) {
                    await setDoc(doc(db, 'users', user.uid),
                        { fcmToken: null, notificationsEnabled: false }, { merge: true });
                    await setDoc(doc(db, 'fcm_tokens', user.uid),
                        { token: null, updatedAt: new Date().toISOString() }, { merge: true });
                }
            } catch (e) {
                console.error('Error disabling notifications:', e);
            }
            setNotifsOn(false);
            setBusy(false);
            return;
        }

        // ── TURN ON ───────────────────────────────────────────────
        setBusy(true);
        try {
            const user = auth.currentUser;
            if (!user) { setBusy(false); return; }

            const supported = await isSupported();
            if (!supported) {
                alert('Notifications are not supported on this browser/device.');
                setBusy(false);
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                // denied or dismissed — leave toggle off, no error noise here
                setBusy(false);
                return;
            }

            const swReg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const messaging = getMessaging();
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: swReg,
            });

            if (!token) {
                setBusy(false);
                return;
            }

            await setDoc(doc(db, 'users', user.uid),
                { fcmToken: token, notificationsEnabled: true }, { merge: true });
            await setDoc(doc(db, 'fcm_tokens', user.uid),
                { token, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });

            setNotifsOn(true);
        } catch (e) {
            console.error('Error enabling notifications:', e);
        }
        setBusy(false);
    };

    const getTitle = () => {
        const path = location.pathname.split('/')[1];
        if (!path) return 'Dashboard';

        const routeMap = {
            'calc': 'CGPA Calculator',
            'att': 'Attendance Tracker',
            'attendance': 'Attendance Tracker',
            'leaderboard': 'Leaderboard',
            'courses': 'My Courses',
            'faculty': 'Faculty Directory',
            'reviews': 'Faculty Reviews',
            'resources': 'Study Resources',
            'profile': 'My Profile',
            'settings': 'Account Settings'
        };

        if (routeMap[path]) {
            return routeMap[path];
        }

        return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    };

    const CSS = `
        .topbar-wrapper {
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 1.5rem 1.5rem 1rem;
            display: flex;
            justify-content: center;
            width: 100%;
            pointer-events: none;
            background: transparent;
        }

        .topbar-pill-container {
            pointer-events: auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 800px;
            padding: 0.75rem 1.25rem;
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
            border-radius: 999px;
            transition: all 0.3s ease;
        }

        .topbar-left-group {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .topbar-menu-btn {
            background: #F3F4F6;
            border: 1px solid rgba(0, 0, 0, 0.04);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #374151;
            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .topbar-menu-btn:hover {
            background: #E5E7EB;
            transform: scale(1.05);
            color: #111827;
        }

        .topbar-page-title {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.01em;
        }

        .topbar-notif-pill {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #0071E3 0%, #5856D6 100%);
            border: none;
            padding: 0.5rem 1.125rem;
            border-radius: 999px;
            cursor: pointer;
            color: #FFFFFF;
            font-size: 0.85rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 113, 227, 0.25);
            transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .topbar-notif-pill.is-off {
            background: #F3F4F6;
            color: #6B7280;
            box-shadow: none;
        }

        .topbar-notif-pill:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 113, 227, 0.35);
        }

        .topbar-notif-pill.is-off:hover {
            background: #E5E7EB;
            color: #374151;
        }

        .topbar-notif-pill:disabled {
            opacity: 0.6;
            cursor: wait;
            transform: none;
        }

        @media (max-width: 640px) {
            .topbar-wrapper {
                padding: 1rem 1rem 0.75rem;
            }
            .topbar-pill-container {
                padding: 0.625rem 1rem;
            }
            .hide-on-mobile {
                display: none;
            }
        }
    `;

    return (
        <header className="topbar-wrapper">
            <style>{CSS}</style>
            <div className="topbar-pill-container">
                <div className="topbar-left-group">
                    <button onClick={toggleSidebar} className="topbar-menu-btn" aria-label="Toggle Menu">
                        <Menu size={20} strokeWidth={2.5} />
                    </button>
                    <h2 className="topbar-page-title">
                        {getTitle()}
                    </h2>
                </div>

                <button
                    className={`topbar-notif-pill${notifsOn ? '' : ' is-off'}`}
                    onClick={handleToggleNotifications}
                    disabled={busy}
                    aria-pressed={notifsOn}
                    aria-label={notifsOn ? 'Turn off notifications' : 'Turn on notifications'}
                    title={notifsOn ? 'Notifications on — tap to turn off' : 'Notifications off — tap to turn on'}
                >
                    {notifsOn ? <Bell size={16} strokeWidth={2.5} /> : <BellOff size={16} strokeWidth={2.5} />}
                    <span className="hide-on-mobile">{notifsOn ? 'Notifications' : 'Notifications Off'}</span>
                </button>
            </div>
        </header>
    );
};

export default TopBar;