import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Book, Calendar, ArrowRight, UserPlus, IdCard, Sparkles } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', branch: 'CSE', year: '1st Year', regNo: ''
    });
    const [error, setError] = useState('');
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
            return setError('Passwords do not match');
        }
        try {
            setError('');
            setLoading(true);
            await signup(formData);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            setError('Failed to create an account. Email might be in use.');
        }
        setLoading(false);
    };

    // Custom Style for Dropdown Arrow
    const dropdownStyle = {
        width: '100%', 
        padding: '14px 14px 14px 50px', 
        background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '14px', 
        color: 'white', 
        outline: 'none', 
        cursor: 'pointer',
        appearance: 'none', // Remove default arrow
        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '0.65em auto',
        transition: 'all 0.3s'
    };

    return (
        <div style={{ 
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: '#05050A', position: 'relative', overflow: 'hidden', padding: '20px' 
        }}>
            
            {/* BACKGROUND ANIMATIONS */}
            <div className="bg-tech-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, zIndex: 0 }}></div>

            <div className="animate-float" style={{
                position: 'absolute', top: '5%', right: '15%', width: '350px', height: '350px',
                background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%', filter: 'blur(60px)', zIndex: 0
            }}></div>
            <div className="animate-float-delay" style={{
                position: 'absolute', bottom: '5%', left: '10%', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%', filter: 'blur(60px)', zIndex: 0
            }}></div>

            {/* SIGNUP CARD */}
            <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '550px', zIndex: 10 }}>
                <GlassCard className="glass-card" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '50px', height: '50px', margin: '0 auto 1rem', 
                            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', 
                            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
                        }}>
                            <UserPlus size={24} color="white" />
                        </div>
                        <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create Account</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Start your academic journey today</p>
                    </div>

                    {error && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.2rem' }}>
                        
                        {/* Name */}
                        <div className="input-group" style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="text" name="name" placeholder="Full Name" required
                                value={formData.name} onChange={handleChange}
                                style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>

                        {/* Email */}
                        <div className="input-group" style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="email" name="email" placeholder="Email Address" required
                                value={formData.email} onChange={handleChange}
                                style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>

                        {/* Reg No */}
                        <div className="input-group" style={{ position: 'relative' }}>
                            <IdCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="text" name="regNo" placeholder="Registration Number" required
                                value={formData.regNo} onChange={handleChange}
                                style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>

                        {/* Branch & Year Dropdowns (THEMED) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <Book size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                                <select 
                                    required 
                                    name="branch"
                                    value={formData.branch} 
                                    onChange={handleChange}
                                    style={dropdownStyle}
                                >
                                    {BRANCHES.map(b => (
                                        <option key={b} value={b} style={{ backgroundColor: '#0F0F1A', color: 'white' }}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                                <select 
                                    required 
                                    name="year"
                                    value={formData.year} 
                                    onChange={handleChange}
                                    style={dropdownStyle}
                                >
                                    {YEARS.map(y => (
                                        <option key={y} value={y} style={{ backgroundColor: '#0F0F1A', color: 'white' }}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Passwords */}
                        <div className="input-group" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="password" name="password" placeholder="Password" required
                                value={formData.password} onChange={handleChange}
                                style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="password" name="confirmPassword" placeholder="Confirm Password" required
                                value={formData.confirmPassword} onChange={handleChange}
                                style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>

                        <GlassButton type="submit" disabled={loading} variant="gradient" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem', marginTop: '0.5rem', boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)' }}>
                            {loading ? 'Creating Account...' : <><Sparkles size={20} /> Join Now</>}
                        </GlassButton>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Sign In <ArrowRight size={16} />
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Signup;
