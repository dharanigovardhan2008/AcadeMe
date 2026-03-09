import React, { useState, useEffect } from 'react';
import { Moon, Bell, Database, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import DashboardLayout from '../components/DashboardLayout';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const Toggle = ({ value, onChange }) => (
    <div
        onClick={() => onChange(!value)}
        style={{
            width: '50px', height: '26px', borderRadius: '13px',
            background: value ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
        }}
    >
        <div style={{
            width: '20px', height: '20px', borderRadius: '50%', background: 'white',
            position: 'absolute', top: '3px', left: value ? '27px' : '3px',
            transition: 'all 0.3s'
        }}></div>
    </div>
);

const Settings = () => {
    const [settings, setSettings] = useState({
        darkMode: true,
        pushNotifs: false,
        emailNotifs: false,
        sounds: true,
        cgpaAlerts: true,
        attendanceAlerts: true
    });

    const [notifStatus, setNotifStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

    const handlePushNotifToggle = async (value) => {
        if (!value) {
            setSettings({ ...settings, pushNotifs: false });
            setNotifStatus(null);
            return;
        }

        setLoading(true);
        setNotifStatus(null);

        try {
            const user = auth.currentUser;
            if (!user) { setNotifStatus('error'); setLoading(false); return; }

            // ✅ Detect TWA/APK
            const isTWA = document.referrer.includes('android-app://')
                || window.matchMedia('(display-mode: standalone)').matches;

            if (isTWA) {
                const permission = Notification.permission;

                if (permission === 'denied') {
                    setNotifStatus('denied');
                    setLoading(false);
                    return;
                }

                if (permission === 'granted') {
                    try {
                        const swReg = await navigator.serviceWorker.register('/sw.js');
                        await navigator.serviceWorker.ready;
                        const messaging = getMessaging();
                        const token = await getToken(messaging, {
                            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                            serviceWorkerRegistration: swReg,
                        });
                        if (token) {
                            await setDoc(doc(db, 'users', user.uid),
                                { fcmToken: token, notificationsEnabled: true }, { merge: true });
                            await setDoc(doc(db, 'fcm_tokens', user.uid),
                                { token, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });
                            setSettings({ ...settings, pushNotifs: true });
                            setNotifStatus('success');
                        } else {
                            setNotifStatus('denied');
                        }
                    } catch (e) {
                        console.error(e);
                        setNotifStatus('error');
                    }
                    setLoading(false);
                    return;
                }

                // permission === 'default' in TWA → show Android guide
                setNotifStatus('twa_guide');
                setLoading(false);
                return;
            }

            // ✅ Normal browser flow
            const supported = await isSupported();
            if (!supported) { setNotifStatus('unsupported'); setLoading(false); return; }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') { setNotifStatus('denied'); setLoading(false); return; }

            const swReg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            const messaging = getMessaging();
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: swReg,
            });

            if (!token) { setNotifStatus('error'); setLoading(false); return; }

            await setDoc(doc(db, 'users', user.uid),
                { fcmToken: token, notificationsEnabled: true }, { merge: true });
            await setDoc(doc(db, 'fcm_tokens', user.uid),
                { token, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });

            setSettings({ ...settings, pushNotifs: true });
            setNotifStatus('success');

        } catch (err) {
            console.error(err);
            setNotifStatus('error');
        }

        setLoading(false);
    };

    useEffect(() => {
        const loadNotificationState = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists() && docSnap.data().notificationsEnabled === true) {
                    setSettings(prev => ({ ...prev, pushNotifs: true }));
                }
            } catch (error) {
                console.error("Error loading notification state:", error);
            }
        };
        loadNotificationState();
    }, []);

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage application preferences</p>
            </GlassCard>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <GlassCard className="mb-6">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Moon size={20} /> Appearance
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <p style={{ fontWeight: '500' }}>Dark Mode</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Switch between light and dark themes</p>
                        </div>
                        <Toggle value={settings.darkMode} onChange={() => toggle('darkMode')} />
                    </div>
                </GlassCard>

                <GlassCard className="mb-6">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} /> Notifications
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1, marginRight: '1rem' }}>
                            <p style={{ fontWeight: '500' }}>Push Notifications</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Get notified when admin posts updates
                            </p>

                            {loading && (
                                <p style={{ fontSize: '0.8rem', color: '#f7971e', marginTop: '4px' }}>
                                    ⏳ Enabling notifications...
                                </p>
                            )}

                            {notifStatus === 'success' && (
                                <p style={{ fontSize: '0.8rem', color: '#43e97b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={12} /> Notifications enabled successfully!
                                </p>
                            )}

                            {notifStatus === 'denied' && (
                                <div style={{ marginTop: '6px' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <XCircle size={12} /> Permission blocked.
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>
                                        Go to Android Settings → Apps → AcadeMe → Notifications → Allow
                                    </p>
                                </div>
                            )}

                            {notifStatus === 'twa_guide' && (
                                <div style={{ marginTop: '6px', padding: '10px', background: 'rgba(255,193,7,0.1)', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.3)' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#FFC107', fontWeight: '600', marginBottom: '4px' }}>
                                        ⚙️ Enable in Android Settings:
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: '1.6' }}>
                                        1. Open Android <b style={{ color: 'white' }}>Settings</b><br />
                                        2. Go to <b style={{ color: 'white' }}>Apps → AcadeMe</b><br />
                                        3. Tap <b style={{ color: 'white' }}>Notifications</b><br />
                                        4. Turn on <b style={{ color: 'white' }}>Allow Notifications</b><br />
                                        5. Come back and toggle again ✅
                                    </p>
                                </div>
                            )}

                            {notifStatus === 'unsupported' && (
                                <p style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <XCircle size={12} /> Notifications not supported on this device.
                                </p>
                            )}

                            {notifStatus === 'error' && (
                                <p style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <XCircle size={12} /> Something went wrong. Please try again.
                                </p>
                            )}
                        </div>
                        <Toggle value={settings.pushNotifs} onChange={handlePushNotifToggle} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <p>Email Updates</p>
                        <Toggle value={settings.emailNotifs} onChange={() => toggle('emailNotifs')} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                        <p>Attendance Alerts</p>
                        <Toggle value={settings.attendanceAlerts} onChange={() => toggle('attendanceAlerts')} />
                    </div>
                </GlassCard>

                <GlassCard className="mb-6">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={20} /> Data & Storage
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <GlassButton style={{ flex: 1, justifyContent: 'center' }}>Export My Data</GlassButton>
                        <GlassButton style={{ flex: 1, justifyContent: 'center', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)' }}>Clear Cache</GlassButton>
                    </div>
                </GlassCard>

                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                    <p>AcadeMe v1.0.0</p>
                    <p style={{ fontSize: '0.8rem' }}>Made with ❤️ for SIMATS</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
