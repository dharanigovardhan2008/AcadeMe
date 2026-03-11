import React, { useState, useCallback } from 'react';
import { X, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
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

        // Optimistic: close modal and show success immediately
        const optimisticMessage = message.trim();
        setMessage('');
        setStatus('success');

        try {
            await addDoc(collection(db, "reviews"), {
                userId: user?.uid || 'anonymous',
                userName: user?.name || 'Anonymous',
                userEmail: user?.email || 'No Email',
                userBranch: user?.branch || 'N/A',
                message: optimisticMessage,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            // Auto-close after success
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (error) {
            console.error("Error sending feedback:", error);
            // Rollback: restore message, show error
            setMessage(optimisticMessage);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }, [message, loading, user]);

    const charsLeft = MAX_CHARS - message.length;
    const isOverLimit = charsLeft < 0;
    const canSubmit = message.trim().length > 0 && !isOverLimit && !loading;

    return (
        <div
            onClick={handleClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem',
            }}
        >
            <GlassCard
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', padding: '4px', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={22} />
                </button>

                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                    Send Feedback
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                    Have a suggestion or found a bug? Let us know!
                </p>

                {/* Inline status messages */}
                {status === 'success' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                        borderRadius: '10px', padding: '0.75rem 1rem',
                        color: '#34D399', marginBottom: '1rem', fontSize: '0.9rem',
                    }}>
                        <CheckCircle size={16} />
                        Thank you! Your feedback has been sent.
                    </div>
                )}
                {status === 'error' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: '10px', padding: '0.75rem 1rem',
                        color: '#F87171', marginBottom: '1rem', fontSize: '0.9rem',
                    }}>
                        <AlertCircle size={16} />
                        Failed to send. Please try again.
                    </div>
                )}

                {/* Textarea */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <textarea
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (status === 'error') setStatus(null);
                        }}
                        placeholder="Write your feedback here..."
                        style={{
                            width: '100%', minHeight: '140px', padding: '0.9rem',
                            paddingBottom: '2rem',
                            borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isOverLimit ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            color: 'white', fontSize: '0.95rem', resize: 'vertical',
                            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                    />
                    {/* Character counter */}
                    <span style={{
                        position: 'absolute', bottom: '8px', right: '10px',
                        fontSize: '0.75rem',
                        color: isOverLimit ? '#F87171' : charsLeft < 50 ? '#FBBF24' : 'var(--text-secondary)',
                        pointerEvents: 'none',
                    }}>
                        {charsLeft}
                    </span>
                </div>

                {/* Submit button */}
                <GlassButton
                    onClick={handleSubmit}
                    variant="gradient"
                    disabled={!canSubmit}
                    style={{
                        width: '100%', justifyContent: 'center',
                        opacity: canSubmit ? 1 : 0.5,
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                    }}
                >
                    {loading
                        ? <><Loader size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> Sending...</>
                        : <><Send size={16} style={{ marginRight: '8px' }} /> Submit Feedback</>
                    }
                </GlassButton>

                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </GlassCard>
        </div>
    );
};

export default FeedbackModal;
