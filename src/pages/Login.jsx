import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin, verifyAdmin } = useAuth();
    const navigate = useNavigate();

    // RESTORED: Admin PIN Login
    const handleAdminLogin = () => {
        const pin = prompt("Enter Admin PIN:");
        if (pin) {
            if (verifyAdmin(pin)) {
                navigate('/admin');
            } else {
                alert("Invalid PIN");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            setError('Failed to log in. Please check your credentials.');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { isProfileComplete } = await googleLogin();
            if (isProfileComplete) {
                navigate('/dashboard');
            } else {
                navigate('/profile'); 
            }
        } catch (error) {
            setError('Google Sign-In failed.');
        }
        setLoading(false);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#0F0F1A', 
            position: 'relative', 
            overflow: 'hidden' 
        }}>
            
            {/* ANIMATED BACKGROUND BLOBS */}
            <div className="animate-float" style={{
                position: 'absolute', top: '10%', left: '20%',
                width: '300px', height: '300px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%', filter: 'blur(40px)', zIndex: 0
            }}></div>
            <div className="animate-float-delay" style={{
                position: 'absolute', bottom: '10%', right: '20%',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%', filter: 'blur(50px)', zIndex: 0
            }}></div>

            {/* LOGIN CARD */}
            <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '420px', padding: '20px', zIndex: 10 }}>
                <GlassCard className="glass-card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue your journey</p>
                    </div>

                    {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div className="glass-input-animate" style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 14px 14px 45px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none'
                                }}
                                required
                            />
                        </div>

                        <div className="glass-input-animate" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 14px 14px 45px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none'
                                }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="checkbox" /> Remember me
                            </label>
                            <span style={{ cursor: 'pointer', color: 'var(--primary)' }}>Forgot Password?</span>
                        </div>

                        <GlassButton 
                            type="submit" 
                            disabled={loading} 
                            variant="gradient" 
                            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '0.5rem' }}
                        >
                            {loading ? 'Signing in...' : <><LogIn size={20} /> Sign In</>}
                        </GlassButton>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>OR</span>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        type="button"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', fontSize: '0.9rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            transition: 'all 0.3s ease'
                        }}
                        className="glass-input-animate"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                        Sign in with Google
                    </button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Sign Up <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* HIDDEN ADMIN LOGIN (Small icon at bottom) */}
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button 
                            onClick={handleAdminLogin} 
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                            title="Admin Access"
                        >
                            <ShieldCheck size={16} />
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Login;
