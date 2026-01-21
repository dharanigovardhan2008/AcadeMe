import React, { useState } from 'react';
import { Moon, Sun, Bell, Volume2, Shield, AlertCircle, Database } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import DashboardLayout from '../components/DashboardLayout';

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
        pushNotifs: true,
        emailNotifs: false,
        sounds: true,
        cgpaAlerts: true,
        attendanceAlerts: true
    });

    const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

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
                        <p>Push Notifications</p>
                        <Toggle value={settings.pushNotifs} onChange={() => toggle('pushNotifs')} />
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
