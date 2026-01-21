
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, IdCard } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import GlassDropdown from '../components/GlassDropdown';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', branch: 'CSE', year: '1st Year', regNo: ''
    });
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const BRANCHES = ['CSE', 'IT', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BT', 'BME', 'BI', 'CSE-Bio', 'CSE-AI', 'CSE-DS'];
    const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await signup(formData);
            setLoading(false);
            navigate('/dashboard');
        } catch (error) {
            console.error("Signup error:", error);
            setLoading(false);
            alert("Signup failed. Please try again.");
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
            {/* Background */}
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.2 }}></div>

            <GlassCard style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Start your academic journey</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <GlassInput icon={User} name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                    <GlassInput icon={Mail} name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                    <GlassInput icon={Lock} name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                    <GlassInput icon={Lock} name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />

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

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
                    </p>
                </div>
            </GlassCard>
        </div>
    );
};

export default Signup;
