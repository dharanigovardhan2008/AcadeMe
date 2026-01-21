import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, Lock, IdCard } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import GlassDropdown from '../components/GlassDropdown';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';

const CompleteProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Determine initial name from Google Auth if available
    const [formData, setFormData] = useState({
        name: user?.displayName || '',
        password: '',
        confirmPassword: '',
        branch: 'CSE',
        year: '1st Year',
        regNo: ''
    });

    useEffect(() => {
        if (user?.displayName) {
            setFormData(prev => ({ ...prev, name: user.displayName }));
        }
    }, [user]);

    const BRANCHES = ['CSE', 'IT', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BT', 'BME', 'BI', 'CSE-Bio', 'CSE-AI', 'CSE-DS'];
    const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // Set password if provided
            if (formData.password) {
                await updatePassword(user, formData.password);
            }

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: user.email,
                branch: formData.branch,
                year: formData.year,
                regNo: formData.regNo,
                createdAt: new Date().toISOString()
            });
            // Force reload or just navigate?
            // AuthContext listens to checking doc, but we just created it.
            // Ideally AuthContext onAuthStateChanged would pick up the doc change if we subscribed to it?
            // Actually our AuthContext only fetches doc ONCE on mount/login.
            // So we might need to manually update user state or just simple reload.
            // Let's do a hard reload to ensure context picks up new claims/data, or just push to dashboard 
            // and rely on a "silent" refresh if we implemented one. 
            // For now, let's just navigate. If dashboard shows "N/A", user might need refresh.
            // BETTER: window.location.href = '/dashboard' to force context re-mount and fetch.
            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Error creating profile:", error);
            alert("Error creating profile. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
            {/* Background */}
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: '300px', height: '300px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15 }}></div>

            <GlassCard style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Complete Profile</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Finish setting up your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</label>
                        <GlassInput
                            icon={User}
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <GlassInput
                            icon={Lock}
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            style={{ marginBottom: '1rem' }}
                        />
                        <GlassInput
                            icon={Lock}
                            type="password"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <GlassInput
                            icon={IdCard}
                            type="text"
                            placeholder="Registration Number"
                            value={formData.regNo}
                            onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Branch</label>
                            <GlassDropdown
                                options={BRANCHES}
                                value={formData.branch}
                                onChange={(val) => setFormData({ ...formData, branch: val })}
                                placeholder="Select Branch"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Year</label>
                            <GlassDropdown
                                options={YEARS}
                                value={formData.year}
                                onChange={(val) => setFormData({ ...formData, year: val })}
                                placeholder="Select Year"
                            />
                        </div>
                    </div>

                    <GlassButton type="submit" variant="gradient" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'} <ArrowRight size={18} />
                    </GlassButton>
                </form>
            </GlassCard>
        </div>
    );
};

export default CompleteProfile;
