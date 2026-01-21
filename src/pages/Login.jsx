import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, googleLogin, verifyAdmin } = useAuth();
    const navigate = useNavigate();

    const handleAdminLogin = () => {
        const pin = prompt("Enter Admin PIN:");
        if (pin) {
            if (verifyAdmin(pin)) {
                // Determine logic: maybe sign in as admin@simats.edu firebase user or just route
                // For now, just route to admin panel as isAdmin is set in context
                navigate('/admin');
            } else {
                alert("Invalid PIN");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { isProfileComplete } = await googleLogin();
            if (isProfileComplete) {
                navigate('/dashboard');
            } else {
                navigate('/complete-profile');
            }
        } catch (error) {
            console.error(error);
            setError('Google Sign In Failed');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            position: 'relative'
        }}>
            {/* Background elements */}
            <div style={{
                position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px',
                background: 'var(--accent)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.2,
            }}></div>

            <GlassCard style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue your journey</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#FEE2E2',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <GlassInput
                        icon={Mail}
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ marginBottom: '1.5rem' }}
                    />
                    <GlassInput
                        icon={Lock}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ marginBottom: '1rem' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ marginRight: '0.5rem' }} /> Remember me
                        </label>
                        <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Forgot Password?</a>
                    </div>

                    <GlassButton
                        type="submit"
                        variant="gradient"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'} <LogIn size={18} />
                    </GlassButton>
                </form>

                <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ padding: '0 1rem', fontSize: '0.8rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <GlassButton onClick={handleGoogleLogin} style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    Continue with Google
                </GlassButton>

                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Sign Up</Link>
                    </p>
                </div>


            </GlassCard>
        </div>
    );
};

export default Login;
