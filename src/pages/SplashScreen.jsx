import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import logo from '../assets/logo.jpg';

const SplashScreen = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        // Still checking Firebase, wait
        if (loading) return;

        // Firebase confirmed — go immediately, no waiting
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }

    }, [navigate, user, loading]); // runs instantly when loading becomes false

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background blobs */}
            <div style={{
                position: 'absolute', top: '25%', left: '25%',
                width: '250px', height: '250px',
                background: 'var(--primary)', borderRadius: '50%',
                filter: 'blur(80px)', opacity: 0.3,
                animation: 'float 6s ease-in-out infinite'
            }}></div>
            <div style={{
                position: 'absolute', bottom: '25%', right: '25%',
                width: '250px', height: '250px',
                background: 'var(--secondary)', borderRadius: '50%',
                filter: 'blur(80px)', opacity: 0.3,
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '2s'
            }}></div>

            {/* Card */}
            <GlassCard style={{
                textAlign: 'center',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '350px',
                padding: '3rem'
            }}>
                {/* Logo */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '120px', height: '120px',
                        borderRadius: '50%', overflow: 'hidden',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                    }}>
                        <img
                            src={logo}
                            alt="AcadeMe"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>

                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    AcadeMe
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Your Academic Journey, Simplified
                </p>

                {/* Spinner — shows while Firebase is checking */}
                <div style={{
                    width: '32px', height: '32px',
                    border: '4px solid rgba(255,255,255,0.1)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>

                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </GlassCard>
        </div>
    );
};

export default SplashScreen;
