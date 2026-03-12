import React, { useState, useCallback } from 'react';
import {
    X, Send, Star, Lightbulb, Bug, MessageSquare,
    Trophy, ChevronRight, ChevronLeft, CheckCircle,
} from 'lucide-react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

// ── Constants ────────────────────────────────────────────────────────────────
const FEEDBACK_TYPES = [
    { id: 'feature',  label: 'Suggest a Feature',  icon: Lightbulb,      color: '#FBBF24', pts: 20, desc: "Tell us what you'd love to see" },
    { id: 'bug',      label: 'Report a Problem',   icon: Bug,             color: '#F87171', pts: 30, desc: 'Something not working right?' },
    { id: 'general',  label: 'General Feedback',   icon: MessageSquare,   color: '#60A5FA', pts: 10, desc: 'Anything else on your mind' },
];
const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent!' };

// ── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '1rem 0' }}>
        {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onChange(n)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                transform: value >= n ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s',
            }}>
                <Star size={36} fill={value >= n ? '#FBBF24' : 'transparent'} color={value >= n ? '#FBBF24' : 'rgba(255,255,255,0.3)'} />
            </button>
        ))}
    </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const FeedbackModal = ({ isOpen, onClose }) => {
    const { user }         = useAuth();
    const { awardPoints }  = useData();

    // ALL hooks before early return — avoids React error #310
    const [step,         setStep]         = useState(0);
    const [rating,       setRating]       = useState(0);
    const [feedbackType, setFeedbackType] = useState(null);
    const [message,      setMessage]      = useState('');
    const [loading,      setLoading]      = useState(false);
    const [earnedPts,    setEarnedPts]    = useState(0);
    const [error,        setError]        = useState('');

    const reset = useCallback(() => {
        setStep(0); setRating(0); setFeedbackType(null);
        setMessage(''); setLoading(false); setEarnedPts(0); setError('');
    }, []);

    const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

    const handleSubmit = useCallback(async () => {
        if (!message.trim()) { setError('Please write something before submitting.'); return; }
        setError('');
        setLoading(true);
        const type  = FEEDBACK_TYPES.find(t => t.id === feedbackType);
        const pts   = type?.pts || 10;
        try {
            await addDoc(collection(db, 'reviews'), {
                userId:     user?.uid   || 'anonymous',
                userName:   user?.name  || 'Anonymous',
                userEmail:  user?.email || 'No Email',
                userBranch: user?.branch || 'N/A',
                rating,
                type: feedbackType,
                message: message.trim(),
                points: pts,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            // Award points through shared DataContext — writes to totalPoints + weeklyPoints
            if (user?.uid) {
                await awardPoints(
                    user.uid,
                    user.name || 'Student',
                    pts,
                    `Submitted ${feedbackType} feedback`
                );
            }
            setEarnedPts(pts);
            setStep(3);
        } catch (e) {
            console.error('Feedback submit error:', e);
            setError('Failed to send. Please try again.');
        }
        setLoading(false);
    }, [message, feedbackType, rating, user, awardPoints]);

    // Early return AFTER all hooks
    if (!isOpen) return null;

    const currentType = FEEDBACK_TYPES.find(t => t.id === feedbackType);

    // common textarea style — fontSize 16px prevents iOS zoom / Android keyboard dismiss
    const taStyle = {
        width: '100%', minHeight: '130px', padding: '0.9rem',
        borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${error ? '#F87171' : 'rgba(255,255,255,0.1)'}`,
        color: 'white', fontSize: '16px', resize: 'vertical',
        fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
    };

    const renderStep = () => {
        // Step 0 — star rating
        if (step === 0) return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌟</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem' }}>How are we doing?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                    Rate your overall experience with AcadeMe
                </p>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                    <p style={{ color: '#FBBF24', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        {STAR_LABELS[rating]}
                    </p>
                )}
                <GlassButton variant="gradient" disabled={rating === 0} onClick={() => setStep(1)}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: rating === 0 ? 0.4 : 1 }}>
                    Next <ChevronRight size={16} style={{ marginLeft: '6px' }} />
                </GlassButton>
            </div>
        );

        // Step 1 — pick type
        if (step === 1) return (
            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem' }}>What's on your mind?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.1rem' }}>Choose a category</p>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {FEEDBACK_TYPES.map(({ id, label, icon: Icon, color, pts, desc }) => (
                        <button key={id}
                            onClick={() => { setFeedbackType(id); setStep(2); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '0.9rem 1rem', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1.5px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer', textAlign: 'left', color: 'white',
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={20} color={color} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{label}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{desc}</div>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: '700', whiteSpace: 'nowrap' }}>+{pts} pts</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setStep(0)}
                    style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronLeft size={14} /> Back
                </button>
            </div>
        );

        // Step 2 — write message
        if (step === 2) return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                    {currentType && (
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${currentType.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <currentType.icon size={18} color={currentType.color} />
                        </div>
                    )}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{currentType?.label}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
                            Earn <strong style={{ color: '#34D399' }}>+{currentType?.pts} pts</strong> for submitting
                        </p>
                    </div>
                </div>

                {feedbackType === 'feature' && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(251,191,36,0.08)', borderRadius: '8px', borderLeft: '3px solid #FBBF24' }}>
                        💡 Describe the feature, how it would work, and why it would help students.
                    </p>
                )}
                {feedbackType === 'bug' && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(248,113,113,0.08)', borderRadius: '8px', borderLeft: '3px solid #F87171' }}>
                        🐛 What happened? What did you expect? Steps to reproduce it?
                    </p>
                )}

                <textarea
                    value={message}
                    onChange={e => { setMessage(e.target.value); setError(''); }}
                    placeholder={
                        feedbackType === 'feature' ? "e.g. I'd love a timetable feature..." :
                        feedbackType === 'bug'     ? "e.g. When I tap Attendance the app crashes..." :
                        "Share anything — we read every message!"
                    }
                    style={taStyle}
                />
                {error && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem' }}>
                    <button onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', padding: '0.65rem 1rem', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChevronLeft size={14} /> Back
                    </button>
                    <GlassButton variant="gradient" onClick={handleSubmit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                        {loading ? 'Submitting...' : <><Send size={15} style={{ marginRight: '6px' }} /> Submit</>}
                    </GlassButton>
                </div>
            </div>
        );

        // Step 3 — success
        if (step === 3) return (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle size={52} color="#34D399" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Thank you! 🎉</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Your feedback helps us make AcadeMe better for every student.
                </p>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(52,211,153,0.12)', border: '1.5px solid #34D399',
                    borderRadius: '12px', padding: '0.65rem 1.25rem', marginBottom: '1.5rem',
                }}>
                    <Trophy size={20} color="#34D399" />
                    <span style={{ fontWeight: '700', color: '#34D399', fontSize: '1rem' }}>
                        +{earnedPts} Points Earned!
                    </span>
                </div>
                <GlassButton variant="gradient" onClick={handleClose} style={{ width: '100%', justifyContent: 'center' }}>
                    Done
                </GlassButton>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
        }}>
            <GlassCard style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', position: 'relative' }}>
                {step < 3 && (
                    <button onClick={handleClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                        <X size={22} />
                    </button>
                )}
                {/* Progress dots */}
                {step < 3 && (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '1.25rem' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                height: '4px', borderRadius: '2px',
                                width: step === i ? '24px' : '8px',
                                background: step >= i ? '#60A5FA' : 'rgba(255,255,255,0.15)',
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                    </div>
                )}
                {renderStep()}
            </GlassCard>
        </div>
    );
};

export default FeedbackModal;
