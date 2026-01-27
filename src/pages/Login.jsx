import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedText from '../components/AnimatedText';
// --- FIREBASE IMPORTS ---
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; 
// ------------------------

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, verifyAdmin } = useAuth();
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
            setError('Failed to log in. Please check your credentials.');
        }
        setLoading(false);
    };

    // --- NEW GOOGLE LOGIC ---
    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user has already filled details in Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // User exists -> Dashboard
                navigate('/dashboard');
            } else {
                // User is NEW -> Go to Complete Profile (Modified Signup Page)
                navigate('/complete-profile'); 
            }
        } catch (error) {
            console.error(error);
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
            <div className="animate-float" style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
            <div className="animate-float-delay" style={{ position: 'absolute', bottom: '10%', right: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(70px)', zIndex: 0 }}></div>
            <Zap size={40} className="floating-icon" color="#3B82F6" style={{ position: 'absolute', top: '15%', right: '15%', opacity: 0.5 }} />
            <Globe size={40} className="floating-icon" color="#8B5CF6" style={{ position: 'absolute', bottom: '20%', left: '10%', opacity: 0.5, animationDelay: '1s' }} />
            <Cpu size={40} className="floating-icon" color="#EC4899" style={{ position: 'absolute', top: '20%', left: '10%', opacity: 0.3, animationDelay: '2s' }} />

            <div className="reveal-scale card-3d" style={{ width: '100%', maxWidth: '440px', padding: '20px', zIndex: 10 }}>
                <GlassCard className="glass-card" style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ width: '60px', height: '60px', margin: '0 auto 1rem', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)' }}>
                            <LogIn size={30} color="white" />
                        </div>
                        <h2 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}><AnimatedText text="Welcome" /></h2>
                    </div>
                    {error && <div className="reveal-up" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="input-group reveal-up stagger-2" style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'all 0.3s ease' }} required />
                        </div>
                        <div className="input-group reveal-up stagger-3" style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 10 }} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'all 0.3s ease' }} required />
                        </div>
                        <div className="reveal-up stagger-4" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 5px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" style={{ accentColor: 'var(--primary)' }} /> Remember me</label>
                            <span style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '500' }}>Forgot Password?</span>
                        </div>
                        <button type="submit" disabled={loading} className="reveal-up stagger-4 magnetic-btn" style={{ width: '100%', padding: '14px', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}>{loading ? 'Signing in...' : 'Sign In'}</button>
                    </form>

                    <div className="reveal-up stagger-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                        <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '1px' }}>OR CONTINUE WITH</span>
                        <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
                    </div>

                    <button onClick={handleGoogleLogin} type="button" disabled={loading} className="animate-shimmer reveal-up stagger-4 magnetic-btn" style={{ width: '100%', padding: '14px', borderRadius: '30px', border: 'none', background: 'white', color: 'black', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: '600', transition: 'transform 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '22px', height: '22px' }} />Sign in with Google</button>

                    <div className="reveal-up stagger-4" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Create Account <ArrowRight size={16} /></Link></div>
                    <div className="reveal-up stagger-4" style={{ marginTop: '1.5rem', textAlign: 'center' }}><button onClick={handleAdminLogin} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.1)'} title="Admin Access"><ShieldCheck size={18} /></button></div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Login;
