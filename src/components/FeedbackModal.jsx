import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const FeedbackModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "reviews"), {
                userId: user?.uid || 'anonymous',
                userName: user?.name || 'Anonymous',
                userEmail: user?.email || 'No Email',
                userBranch: user?.branch || 'N/A',
                message: message,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            alert("Thank you for your feedback!");
            setMessage('');
            onClose();
        } catch (error) {
            console.error("Error sending feedback:", error);
            alert("Failed to send feedback. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <GlassCard style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Send Feedback</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Have a suggestion or found a bug? Let us know!
                </p>

                <form onSubmit={handleSubmit}>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your feedback here..."
                        style={{
                            width: '100%', minHeight: '150px', padding: '1rem',
                            borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                            fontSize: '1rem', marginBottom: '1.5rem', resize: 'vertical'
                        }}
                    />

                    <GlassButton
                        type="submit"
                        variant="gradient"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {loading ? 'Sending...' : 'Submit Feedback'} <Send size={18} style={{ marginLeft: '8px' }} />
                    </GlassButton>
                </form>
            </GlassCard>
        </div>
    );
};

export default FeedbackModal;
