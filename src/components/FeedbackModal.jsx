import React, { useState, useCallback } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const MAX_CHARS = 500;

const FeedbackModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null

    if (!isOpen) return null;

    const handleClose = () => {
        setMessage('');
        setStatus(null);
        onClose();
    };

    const handleSubmit = useCallback(async () => {
        if (!message.trim() || loading) return;

        setLoading(true);
        setStatus(null);
        try {
            await addDoc(collection(db, "reviews"), {
                userId: user?.uid || 'anonymous',
                userName: user?.name || 'Anonymous',
                userEmail: user?.email || 'No Email',
                userBranch: user?.branch || 'N/A',
                message: message.trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            setStatus('success');
            setMessage('');
        } catch (error) {
            console.error("Error sending feedback:", error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }, [message, loading, user]);

    const charsLeft = MAX_CHARS - message.length;

    return (
        <div
            onClick={handleClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <GlassCard
                onClick={(e) => e.stopPropagation()}
                style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', padding: '4px',
                    }}
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Send Feedback
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Have a suggestion or found a bug? Let us know!
                </p>

                {/* Success state */}
                {status === 'success' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                        borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem',
                        color: '#34D399',
                    }}>
                        <CheckCircle size={18} />
                        <span style={{ fontSize: '0.9rem' }}>Thanks! Your feedback has been sent.</span>
                    </div>
                )}

                {/* Error state */}
                {status === 'error' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem',
                        color: '#F87171',
                    }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '0.9rem' }}>Failed to send. Please try again.</span>
                    </div>
                )}

                {/* Textarea */}
                <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                    <textarea
                        value={message}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_CHARS) {
                                setMessage(e.target.value);
                                if (status) setStatus(null);
                            }
                        }}
                        placeholder="Write your feedback here..."
                        style={{
                            width: '100%', minHeight: '150px', padding: '1rem',
                            paddingBottom: '2rem',
                            borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${charsLeft < 20 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`,
                            color: 'white', fontSize: '0.95rem', resize: 'vertical',
                            outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    <span style={{
                        position: 'absolute', bottom: '10px', right: '12px',
                        fontSize: '0.75rem',
                        color: charsLeft < 20 ? '#FBBF24' : 'var(--text-secondary)',
                    }}>
                        {charsLeft}
                    </span>
                </div>

                {/* Submit button */}
                <GlassButton
                    onClick={handleSubmit}
                    variant="gradient"
                    disabled={loading || !message.trim()}
                    style={{ width: '100%', justifyContent: 'center', opacity: (!message.trim() || loading) ? 0.6 : 1 }}
                >
                    {loading ? 'Sending...' : 'Submit Feedback'}
                    <Send size={16} style={{ marginLeft: '8px' }} />
                </GlassButton>
            </GlassCard>
        </div>
    );
};

export default FeedbackModal;
