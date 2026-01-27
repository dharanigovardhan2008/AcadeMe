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
import { updatePassword } from 'firebase/auth'; // Import this to set the password

const CompleteProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Initial state: Pre-fill name from Google
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

        // Validation
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        if (formData.password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            // 1. Update the password for the Google User
            await updatePassword(user, formData.password);

            // 2. Save all data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: user.email,
                branch: formData.branch,
                year: formData.year,
                regNo: formData.regNo,
                createdAt: new Date().toISOString()
            });

            // 3. Navigate to dashboard
            // Using window.location.href ensures a full refresh so AuthContext updates correctly
            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Error creating profile:", error);
            // Handle specific error where user needs to re-login to set password
            if (error.code === 'auth/requires-recent-login') {
                alert("For security, please log out and log in again to set a password.");
            } else {
                alert("Error creating profile: " + error.message);
            }
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
                    <p style={{ color: 'var(--text-secondary)' }}>Set a password and finish setup</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Full Name Field */}
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

                    {/* Registration Number Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registration Number</label>
                        <GlassInput
                            icon={IdCard}
                            type="text"
                            placeholder="Registration Number"
                            value={formData.regNo}
                            onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                            required
                        />
                    </div>

                    {/* Branch and Year Dropdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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

                    {/* Password Fields (Added Back) */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create Password</label>
                        <GlassInput
                            icon={Lock}
                            type="password"
                            placeholder="New Password"
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

                    <GlassButton type="submit" variant="gradient" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Finish Setup'} <ArrowRight size={18} />
                    </GlassButton>
                </form>
            </GlassCard>
        </div>
    );
};

export default CompleteProfile;
