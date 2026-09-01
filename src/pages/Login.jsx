// Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ShieldCheck, Eye, EyeOff, GraduationCap } from 'lucide-react';

// --- IMPORTS FOR GOOGLE AUTH ---
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; 
// -------------------------------

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, verifyAdmin } = useAuth();
    const navigate = useNavigate();

    const handleAdminLogin = () => {
        const pin = prompt("Enter Admin PIN:");
        if (pin) {
            if (verifyAdmin(pin)) navigate('/admin');
            else alert("Invalid PIN");
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
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                navigate('/dashboard');
            } else {
                navigate('/complete-profile'); 
            }
        } catch (error) {
            console.error(error);
            setError('Google Sign-In failed.');
            setLoading(false);
        }
    };

    const CSS = `
        * { box-sizing: border-box; }
        .auth-root {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #bce1ff;
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(255,255,255,0.7) 0%, transparent 50%),
                radial-gradient(circle at 85% 30%, rgba(255,255,255,0.8) 0%, transparent 50%),
                radial-gradient(circle at 50% 90%, rgba(255,255,255,0.95) 0%, transparent 60%);
            position: relative;
            overflow-x: hidden;
            padding: 2rem 1.5rem;
            color: #111827;
        }
        
        .auth-card-container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 440px;
            animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        
        /* Max-polished Glass Card */
        .auth-glass-panel {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(40px) saturate(150%);
            -webkit-backdrop-filter: blur(40px) saturate(150%);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 
                0 24px 48px rgba(0, 0, 0, 0.08), 
                inset 0 1px 1px rgba(255, 255, 255, 0.8),
                inset 0 0 20px rgba(255, 255, 255, 0.3);
            border-radius: 32px;
            padding: 2.75rem;
            position: relative;
            overflow: hidden; /* For the loader overlay */
        }

        /* 3D Educational Loader Overlay */
        .edu-loader-overlay {
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 100;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out forwards;
        }
        .edu-scene {
            width: 120px;
            height: 120px;
            perspective: 800px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
        }
        .edu-core {
            position: absolute;
            z-index: 10;
            color: #0071E3;
            animation: pulse-core 2s infinite ease-in-out;
            background: white;
            padding: 14px;
            border-radius: 50%;
            box-shadow: 0 8px 24px rgba(0, 113, 227, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .edu-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid transparent;
            transform-style: preserve-3d;
        }
        .edu-ring-1 {
            border-top-color: #0071E3;
            border-bottom-color: #5856D6;
            animation: spin-ring-1 2s linear infinite;
        }
        .edu-ring-2 {
            border-left-color: #EC4899;
            border-right-color: #8B5CF6;
            animation: spin-ring-2 2.5s linear infinite;
        }
        .edu-ring-3 {
            border-top-color: #10B981;
            border-bottom-color: #3B82F6;
            animation: spin-ring-3 3s linear infinite;
        }
        .edu-loading-text {
            font-size: 1.15rem;
            font-weight: 700;
            background: linear-gradient(135deg, #0071E3, #5856D6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: pulse-text 2s infinite ease-in-out;
            letter-spacing: 0.02em;
        }

        /* Segmented Control (Toggle) */
        .auth-toggle-container {
            display: flex;
            background: rgba(235, 235, 240, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 999px;
            padding: 4px;
            position: relative;
            margin-bottom: 2rem;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            backdrop-filter: blur(10px);
        }
        .auth-toggle-slider {
            position: absolute;
            top: 4px; bottom: 4px;
            width: calc(50% - 4px);
            background: #FFFFFF;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform: translateX(0);
        }
        .auth-toggle-btn {
            flex: 1;
            position: relative;
            z-index: 2;
            padding: 0.65rem 0;
            text-align: center;
            font-size: 0.95rem;
            font-weight: 600;
            color: #6B7280;
            cursor: pointer;
            border: none;
            background: none;
            transition: color 0.3s ease;
        }
        .auth-toggle-btn.active { color: #111827; }

        /* Header Elements */
        .auth-icon-top {
            width: 52px;
            height: 52px;
            margin: 0 auto 1.25rem;
            background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 1);
            border: 1px solid rgba(229, 231, 235, 0.5);
        }
        .auth-title {
            font-size: 1.65rem;
            font-weight: 800;
            color: #111827;
            margin: 0 0 0.5rem;
            text-align: center;
            letter-spacing: -0.03em;
        }
        .auth-subtitle {
            color: #4B5563;
            font-size: 0.9rem;
            margin: 0 0 2rem;
            text-align: center;
            line-height: 1.5;
            font-weight: 500;
        }

        /* Glassy Inputs */
        .auth-input-wrap {
            position: relative;
            margin-bottom: 0.875rem;
        }
        .auth-input {
            width: 100%;
            padding: 1.1rem 1rem 1.1rem 3.25rem;
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 16px;
            color: #111827;
            font-size: 0.95rem;
            font-weight: 600;
            outline: none;
            transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
            backdrop-filter: blur(10px);
        }
        .auth-input::placeholder { color: #8792A1; font-weight: 500; }
        .auth-input:focus {
            background: rgba(255, 255, 255, 0.9);
            border-color: #0071E3;
            box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15), inset 0 1px 2px rgba(0,0,0,0.01);
        }
        .auth-input-icon {
            position: absolute;
            left: 1.1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6B7280;
            z-index: 10;
            transition: color 0.3s ease;
        }
        .auth-input:focus ~ .auth-input-icon, 
        .auth-input:not(:placeholder-shown) ~ .auth-input-icon {
            color: #0071E3;
        }
        .auth-pwd-toggle {
            position: absolute;
            right: 1.1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6B7280;
            cursor: pointer;
            padding: 0;
            display: flex;
            transition: color 0.2s;
        }
        .auth-pwd-toggle:hover { color: #111827; }

        /* Links & Buttons */
        .auth-forgot {
            display: block;
            text-align: right;
            font-size: 0.8125rem;
            color: #4B5563;
            font-weight: 600;
            text-decoration: none;
            margin-bottom: 1.5rem;
            cursor: pointer;
            transition: color 0.2s;
        }
        .auth-forgot:hover { color: #0071E3; }
        
        .auth-submit-btn {
            width: 100%;
            padding: 1.1rem;
            border-radius: 16px;
            background: linear-gradient(135deg, #111827 0%, #374151 100%);
            border: none;
            color: #FFFFFF;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
            box-shadow: 0 8px 16px rgba(17, 24, 39, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            display: flex;
            justify-content: center;
            align-items: center;
            letter-spacing: 0.02em;
        }
        .auth-submit-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 12px 20px rgba(17, 24, 39, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2); 
            background: linear-gradient(135deg, #000000 0%, #1F2937 100%);
        }

        /* Divider */
        .auth-divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 1.75rem 0;
            color: #6B7280;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.05em;
        }
        .auth-divider::before, .auth-divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .auth-divider:not(:empty)::before { margin-right: 1rem; }
        .auth-divider:not(:empty)::after { margin-left: 1rem; }
        
        /* Exclusive Google Button */
        .auth-google-btn {
            width: 100%;
            padding: 1.1rem;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            color: #111827;
            backdrop-filter: blur(10px);
        }
        .auth-google-btn:hover { 
            background: #FFFFFF; 
            transform: translateY(-2px); 
            box-shadow: 0 8px 16px rgba(0,0,0,0.06); 
            border-color: rgba(0,0,0,0.12);
        }

        .auth-admin-btn {
            background: none;
            border: none;
            color: #9CA3AF;
            cursor: pointer;
            transition: color 0.2s;
            padding: 8px;
            display: block;
            margin: 1.5rem auto 0;
        }
        .auth-admin-btn:hover { color: #4B5563; }
        
        /* Keyframes for Loader and Entrance */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin-ring-1 { 0% { transform: rotateX(65deg) rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateX(65deg) rotateY(360deg) rotateZ(360deg); } }
        @keyframes spin-ring-2 { 0% { transform: rotateX(0deg) rotateY(65deg) rotateZ(0deg); } 100% { transform: rotateX(360deg) rotateY(65deg) rotateZ(360deg); } }
        @keyframes spin-ring-3 { 0% { transform: rotateX(45deg) rotateY(45deg) rotateZ(0deg); } 100% { transform: rotateX(45deg) rotateY(45deg) rotateZ(360deg); } }
        @keyframes pulse-core { 0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(0, 113, 227, 0.25); } 50% { transform: scale(1.15); box-shadow: 0 16px 40px rgba(0, 113, 227, 0.5); } }
        @keyframes pulse-text { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
    `;

    return (
        <div className="auth-root">
            <style>{CSS}</style>

            <div className="auth-card-container">
                <div className="auth-glass-panel">
                    
                    {/* --- 3D Educational Loader Overlay --- */}
                    {loading && (
                        <div className="edu-loader-overlay">
                            <div className="edu-scene">
                                <div className="edu-ring edu-ring-1"></div>
                                <div className="edu-ring edu-ring-2"></div>
                                <div className="edu-ring edu-ring-3"></div>
                                <div className="edu-core">
                                    <GraduationCap size={36} strokeWidth={2} />
                                </div>
                            </div>
                            <div className="edu-loading-text">Authenticating...</div>
                        </div>
                    )}

                    {/* Segmented Toggle Control */}
                    <div className="auth-toggle-container">
                        <div className="auth-toggle-slider" style={{ transform: 'translateX(0)' }}></div>
                        <button className="auth-toggle-btn active">Log In</button>
                        <button className="auth-toggle-btn" onClick={() => navigate('/signup')}>Sign Up</button>
                    </div>

                    <div className="auth-icon-top">
                        <LogIn size={22} color="#111827" strokeWidth={2.5} />
                    </div>
                    <h2 className="auth-title">Sign in with email</h2>
                    <p className="auth-subtitle">Welcome back to your academic portal. Access your dashboard instantly.</p>

                    {error && (
                        <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '12px', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid #FEE2E2', fontWeight: '500' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-wrap">
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="auth-input" 
                                required 
                            />
                            <Mail size={18} className="auth-input-icon" />
                        </div>
                        
                        <div className="auth-input-wrap">
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="auth-input" 
                                required 
                            />
                            <Lock size={18} className="auth-input-icon" />
                            <button type="button" className="auth-pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <span className="auth-forgot">Forgot password?</span>

                        <button type="submit" className="auth-submit-btn">
                            Get Started
                        </button>
                    </form>

                    <div className="auth-divider">Or sign in with</div>

                    {/* Full Width Exclusive Google Button */}
                    <button onClick={handleGoogleLogin} type="button" className="auth-google-btn" title="Sign in with Google">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '22px', height: '22px' }} />
                        Continue with Google
                    </button>

                    <button onClick={handleAdminLogin} className="auth-admin-btn" title="Admin Access">
                        <ShieldCheck size={18} />
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Login;