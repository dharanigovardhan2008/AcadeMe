import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import AnimatedText from '../components/AnimatedText'; // Import the new helper

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin, verifyAdmin } = useAuth();
    const navigate = useNavigate();

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
            setError('Failed to log in.');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { isProfileComplete } = await googleLogin();
            navigate(isProfileComplete ? '/dashboard' : '/profile');
        } catch (error) {
            setError('Google Sign-In failed.');
        }
        setLoading(false);
    };

    return (
        <div style={{ 
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: '#05050A', position: 'relative', overflow: 'hidden' 
        }}>
            
            <div className="bg-tech-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, zIndex: 0 }}></div>

            {/* Glowing Blobs */}
            <div className="animate-float" style={{
                position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%', filter: 'blur(60px)', zIndex: 0
            }}></div>
            <div className="animate-float-delay" style={{
                position: 'absolute', bottom: '10%', right: '20%', width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%', filter: 'blur(70px)', zIndex: 0
            }}></div>

            {/* 3D Floating Icons */}
            <Zap size={40} className="floating-icon" color="#3B82F6" style={{ position: 'absolute', top: '15%', right: '15%', opacity: 0.5 }} />
            <Globe size={40} className="floating-icon" color="#8B5CF6" style={{ position: 'absolute', bottom: '20%', left: '10%', opacity: 0.5, animationDelay: '1s' }} />

            {/* 
               MAIN CARD 
               Added: card-3d (for tilt), reveal-scale (for entry animation)
            */}
            <div className="reveal-scale card-3d" style={{ width: '100%', maxWidth: '440px', padding: '20px', zIndex: 10 }}>
                <GlassCard className="glass-card">
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ 
                            width: '60px', height: '60px', margin: '0 auto 1rem', 
                            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', 
                            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
                        }}>
                            <LogIn size={30} color="white" />
                        </div>
                        
                        {/* New Animated Text Component */}
                        <h2 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            <AnimatedText text="Welcome Back" />
                        </h2>
                        
                        <p style={{ color: 'var(--text-secondary)' }} className="reveal-up stagger-1">
                            Enter your details to access your dashboard
                        </p>
                    </div>

                    {error && <div className="reveal-up" style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div className="input-group reveal-up stagger-2" style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '16px 16px 16px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none' }} required />
                        </div>

                        <div className="input-group reveal-up stagger-3" style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '16px 16px 16px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none' }} required />
                        </div>

                        <div className="reveal-up stagger-4" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Remember me</label>
                            <span style={{ cursor: 'pointer', color: 'var(--primary)' }}>Forgot Password?</span>
                        </div>

                        <GlassButton type="submit" disabled={loading} variant="gradient" className="reveal-up stagger-4 magnetic-btn" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </GlassButton>
                    </form>

                    <div className="reveal-up stagger-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>OR CONTINUE WITH</span>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <button onClick={handleGoogleLogin} type="button" disabled={loading} className="reveal-up stagger-4 magnetic-btn"
                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '22px', height: '22px' }} />
                        Sign in with Google
                    </button>

                    <div className="reveal-up stagger-4" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Create Account <ArrowRight size={16} /></Link>
                    </div>

                    <div className="reveal-up stagger-4" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button onClick={handleAdminLogin} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} title="Admin Access">
                            <ShieldCheck size={18} />
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Login;
