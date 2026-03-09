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

    // ─── FIXED: Unified permission flow for both Browser and TWA/APK ───
    const handlePushNotifToggle = async (value) => {

        // ── TURN OFF ──────────────────────────────────────────────────
        if (!value) {
            try {
                const user = auth.currentUser;
                if (user) {
                    // Clear token in Firestore so notify.py stops sending to this device
                    await setDoc(doc(db, 'users', user.uid),
                        { fcmToken: null, notificationsEnabled: false }, { merge: true });
                    await setDoc(doc(db, 'fcm_tokens', user.uid),
                        { token: null, updatedAt: new Date().toISOString() }, { merge: true });
                }
            } catch (e) {
                console.error('Error disabling notifications:', e);
            }
            setSettings(prev => ({ ...prev, pushNotifs: false }));
            setNotifStatus(null);
            return;
        }

        // ── TURN ON ───────────────────────────────────────────────────
        setLoading(true);
        setNotifStatus(null);

        try {
            const user = auth.currentUser;
            if (!user) {
                setNotifStatus('error');
                setLoading(false);
                return;
            }

            // Step 1: Check if FCM is supported on this browser/device
            // Catches Firefox, old Safari, some Android WebViews
            const supported = await isSupported();
            if (!supported) {
                setNotifStatus('unsupported');
                setLoading(false);
                return;
            }

            // Step 2: Request permission — ONE call works for BOTH browser AND TWA/APK
            // In a TWA on Android this triggers the native system permission dialog
            // Previously the code was skipping this in TWA and jumping straight to
            // showing the manual guide — which meant the dialog NEVER appeared
            const permission = await Notification.requestPermission();

            if (permission === 'denied') {
                // User has previously denied — Android won't show dialog again
                // Guide them to manually enable in Android Settings
                setNotifStatus('denied');
                setLoading(false);
                return;
            }

            if (permission !== 'granted') {
                // User dismissed the dialog without choosing — do nothing silently
                setSettings(prev => ({ ...prev, pushNotifs: false }));
                setNotifStatus(null);
                setLoading(false);
                return;
            }

            // Step 3: Permission granted — register service worker and get FCM token
            const swReg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const messaging = getMessaging();
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: swReg,
            });

            if (!token) {
                setNotifStatus('error');
                setLoading(false);
                return;
            }

            // Step 4: Save token to Firestore — notify.py reads this to send notifications
            await setDoc(doc(db, 'users', user.uid),
                { fcmToken: token, notificationsEnabled: true }, { merge: true });
            await setDoc(doc(db, 'fcm_tokens', user.uid),
                { token, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });

            setSettings(prev => ({ ...prev, pushNotifs: true }));
            setNotifStatus('success');

        } catch (err) {
            console.error('Error enabling notifications:', err);
            setNotifStatus('error');
        }

        setLoading(false);
    };

    // Load saved notification state from Firestore on mount
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
                                    <div style={{ marginTop: '6px', padding: '10px', background: 'rgba(255,193,7,0.1)', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.3)' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#FFC107', fontWeight: '600', marginBottom: '4px' }}>
                                            ⚙️ Enable manually in Android Settings:
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: '1.6' }}>
                                            1. Open Android <b style={{ color: 'white' }}>Settings</b><br />
                                            2. Go to <b style={{ color: 'white' }}>Apps → AcadeMe</b><br />
                                            3. Tap <b style={{ color: 'white' }}>Notifications</b><br />
                                            4. Turn on <b style={{ color: 'white' }}>Allow Notifications</b><br />
                                            5. Come back and toggle again ✅
                                        </p>
                                    </div>
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
