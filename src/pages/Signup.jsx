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
            // Pass the whole formData object as your original context expects
            await signup(formData);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            setError('Failed to create an account. Email might be in use.');
        }
        setLoading(false);
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

                        {/* Branch & Year Dropdowns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <Book size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                                <select required name="branch"
                                    value={formData.branch} onChange={handleChange}
                                    style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                                >
                                    {BRANCHES.map(b => <option key={b} value={b} style={{background:'#1a1a1a'}}>{b}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                                <select required name="year"
                                    value={formData.year} onChange={handleChange}
                                    style={{ width: '100%', padding: '14px 14px 14px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                                >
                                    {YEARS.map(y => <option key={y} value={y} style={{background:'#1a1a1a'}}>{y}</option>)}
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
