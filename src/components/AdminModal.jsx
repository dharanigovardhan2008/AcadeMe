import React, { useState, useEffect } from 'react';
import { Shield, Lock, X } from 'lucide-react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminModal = ({ isOpen, onClose }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const { verifyAdmin } = useAuth();
    const navigate = useNavigate();

    // Focus input when open
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (verifyAdmin(pin)) {
            onClose();
            navigate('/admin'); // Navigate to admin dashboard on success
        } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 500);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <GlassCard style={{
                width: '100%', maxWidth: '400px', padding: '2rem',
                animation: error ? 'shake 0.5s ease-in-out' : 'scaleIn 0.3s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="gradient-text" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={24} /> Admin Access
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Enter security PIN to access admin panel.</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: error ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px', padding: '10px 15px', color: 'white', width: '100%', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '5px'
                            }}
                            autoFocus
                        />
                    </div>

                    <GlassButton type="submit" variant="gradient" style={{ width: '100%', justifyContent: 'center' }}>
                        Verify Access
                    </GlassButton>
                </form>
            </GlassCard>
            <style>{`
         @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
         }
         @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
         }
       `}</style>
        </div>
    );
};

export default AdminModal;
