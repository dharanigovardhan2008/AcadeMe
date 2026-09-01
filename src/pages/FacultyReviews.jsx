// FacultyReviews.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, getDocs,
    query, orderBy, doc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import {
    Star, User, BookOpen, Code, Plus, X, Search, Filter,
    Trash2, Edit2, ShieldCheck, ThumbsUp, ThumbsDown,
    MessageCircle, Send, UserCheck, Flame, Trophy, ChevronDown
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const POINTS = { SUBMIT_REVIEW: 25, EDIT_REVIEW: 5, LIKE_REVIEW: 2, COMMENT: 5 };

const PointsToast = ({ pts, reason, onDone }) => {
    useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div style={{
            position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
            background: '#ffffff', border: '1px solid #E5E7EB',
            borderRadius: '999px', padding: '12px 24px', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '10px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap', color: '#111827', animation: 'slideUp 0.3s ease-out'
        }}>
            <div style={{ background: '#FEF08A', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                <Trophy size={16} color="#CA8A04" />
            </div>
            <span style={{ fontWeight: '700', color: '#111827' }}>+{pts} pts</span>
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>{reason}</span>
            <style>{`@keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
        </div>
    );
};

const FacultyReviews = () => {
    const { awardPoints } = useData() || {};
    const { user } = useAuth() || {};
    const currentUser = auth.currentUser;

    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeCommentBox, setActiveCommentBox] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [courseFilter, setCourseFilter] = useState('All');
    const [uniqueCourses, setUniqueCourses] = useState([]);
    const [toast, setToast] = useState(null);

    const ADMIN_EMAILS = ['palerugopi2008@gmail.com'];
    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);
    const showToast = (pts, reason) => setToast({ pts, reason });

    const initialFormState = {
        facultyName: '', coFaculty: '', courseCode: '', courseName: '',
        minInternals: '', facultyType: 'Moderate', mobileAllowed: true,
        rating: 0, feedback: '', likes: [], dislikes: [], comments: []
    };
    const [formData, setFormData] = useState(initialFormState);

    const timeAgo = (d) => {
        if (!d) return 'Just now';
        const s = Math.floor((Date.now() - new Date(d)) / 1000);
        if (s < 60) return 'Just now';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        return Math.floor(s / 86400) + 'd ago';
    };

    // Pastel styling for tags mimicking the reference image
    const getTypeStyle = (t) => {
        const styles = {
            Rod: { bg: '#FEE2E2', text: '#991B1B' },
            Strict: { bg: '#FFEDD5', text: '#C2410C' },
            Moderate: { bg: '#FEF3C7', text: '#B45309' },
            Loose: { bg: '#DCFCE7', text: '#166534' }
        };
        return styles[t] || { bg: '#F3F4F6', text: '#374151' };
    };

    const fetchReviews = useCallback(async () => {
        try {
            const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setReviews(data);
            setFilteredReviews(data);
            setUniqueCourses([...new Set(data.map(r => r.courseCode?.toUpperCase()).filter(Boolean))].sort());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    useEffect(() => {
        let result = [...reviews];
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            result = result.filter(r => r.facultyName?.toLowerCase().includes(t) || r.courseName?.toLowerCase().includes(t));
        }
        if (courseFilter !== 'All') result = result.filter(r => r.courseCode?.toUpperCase() === courseFilter);
        if (sortOption === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (sortOption === 'highest') result.sort((a, b) => b.rating - a.rating);
        setFilteredReviews(result);
    }, [searchTerm, sortOption, courseFilter, reviews]);

    const handleLike = async (review) => {
        if (!currentUser) return alert("Login to vote");
        const ref = doc(db, "facultyReviews", review.id);
        const isLiked = review.likes?.includes(currentUser.uid);
        setReviews(prev => prev.map(r => r.id === review.id ? {
            ...r,
            likes: isLiked ? r.likes.filter(id => id !== currentUser.uid) : [...(r.likes || []), currentUser.uid],
            dislikes: (r.dislikes || []).filter(id => id !== currentUser.uid),
        } : r));
        try {
            if (isLiked) {
                await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(ref, { likes: arrayUnion(currentUser.uid), dislikes: arrayRemove(currentUser.uid) });
                if (awardPoints) await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.LIKE_REVIEW, 'Liked a review');
                showToast(POINTS.LIKE_REVIEW, 'Liked a review');
            }
        } catch (e) { console.error(e); fetchReviews(); }
    };

    const handleDislike = async (review) => {
        if (!currentUser) return alert("Login to vote");
        const ref = doc(db, "facultyReviews", review.id);
        const isDisliked = review.dislikes?.includes(currentUser.uid);
        setReviews(prev => prev.map(r => r.id === review.id ? {
            ...r,
            dislikes: isDisliked ? r.dislikes.filter(id => id !== currentUser.uid) : [...(r.dislikes || []), currentUser.uid],
            likes: (r.likes || []).filter(id => id !== currentUser.uid),
        } : r));
        try {
            if (isDisliked) await updateDoc(ref, { dislikes: arrayRemove(currentUser.uid) });
            else await updateDoc(ref, { dislikes: arrayUnion(currentUser.uid), likes: arrayRemove(currentUser.uid) });
        } catch (e) { console.error(e); fetchReviews(); }
    };

    const handleSubmitComment = async (reviewId) => {
        if (!currentUser) return alert("Login to comment");
        if (!commentText.trim()) return;
        const newComment = {
            id: Date.now().toString(), uid: currentUser.uid,
            name: currentUser.displayName || user?.name || "User",
            text: commentText.trim(), createdAt: new Date().toISOString(),
        };
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, comments: [...(r.comments || []), newComment] } : r));
        setCommentText('');
        setActiveCommentBox(null);
        try {
            await updateDoc(doc(db, "facultyReviews", reviewId), { comments: arrayUnion(newComment) });
            if (awardPoints) await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.COMMENT, 'Commented on a review');
            showToast(POINTS.COMMENT, 'Comment posted');
        } catch (e) { console.error(e); fetchReviews(); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Please login first");
        if (formData.rating === 0) return alert("Please select a star rating");
        setLoading(true);
        try {
            const dataToSave = { ...formData, updatedAt: new Date().toISOString() };
            if (editingId) {
                await updateDoc(doc(db, "facultyReviews", editingId), dataToSave);
                if (awardPoints) await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.EDIT_REVIEW, 'Edited a review');
                showToast(POINTS.EDIT_REVIEW, 'Review updated');
            } else {
                await addDoc(collection(db, "facultyReviews"), {
                    ...dataToSave, likes: [], dislikes: [], comments: [],
                    reviewerId: currentUser.uid,
                    reviewerName: currentUser.displayName || user?.name || "Unknown Student",
                    reviewerEmail: currentUser.email || "No Email",
                    createdAt: new Date().toISOString(),
                });
                if (awardPoints) await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.SUBMIT_REVIEW, 'Submitted a faculty review');
                showToast(POINTS.SUBMIT_REVIEW, 'Review submitted!');
            }
            setShowForm(false); setFormData(initialFormState); setEditingId(null);
            fetchReviews();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this review permanently?")) {
            await deleteDoc(doc(db, "facultyReviews", id));
            setReviews(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleEdit = (review) => {
        setFormData(review); setEditingId(review.id); setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Pastel grade badge similar to the reference image
    const RatingBadge = ({ rating }) => {
        const style = rating >= 4 ? { bg: '#DCFCE7', text: '#166534', icon: '#166534' } 
                    : rating === 3 ? { bg: '#FEF08A', text: '#854D0E', icon: '#854D0E' } 
                    : { bg: '#FEE2E2', text: '#991B1B', icon: '#991B1B' };
        
        return (
            <div style={{ background: style.bg, padding: '4px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: style.text }}>{rating}</span>
                <Star size={14} fill={style.icon} color={style.icon} />
            </div>
        );
    };

    // Reusable UI styles matching the image
    const inputStyle = { width: '100%', padding: '12px 16px', paddingLeft: '40px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#111827', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' };
    const labelStyle = { display: 'block', marginBottom: '8px', color: '#4B5563', fontSize: '0.85rem', fontWeight: '600' };
    const cardStyle = { background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', padding: '24px' };

    return (
        <DashboardLayout>
            <div style={{ 
                minHeight: '100vh', 
                // The requested beautiful mesh gradient background
                background: 'linear-gradient(115deg, #FDF0F6 0%, #E8EFFF 50%, #F5F3FF 100%)', 
                padding: '3rem 1.5rem 5rem', 
                color: '#111827' 
            }}>
                {toast && <PointsToast pts={toast.pts} reason={toast.reason} onDone={() => setToast(null)} />}
                
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                    {/* Header Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Faculty Reviews</h1>
                            <p style={{ color: '#6B7280', fontSize: '1rem', margin: '6px 0 0' }}>Share your campus experiences • Earn points</p>
                        </div>
                        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(initialFormState); }} 
                            style={{ 
                                padding: '12px 24px', borderRadius: '999px', border: 'none', 
                                background: showForm ? '#F3F4F6' : '#3B82F6', 
                                color: showForm ? '#374151' : 'white', 
                                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', 
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: showForm ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.3)'
                            }}>
                            {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Write Review</>}
                        </button>
                    </div>

                    {/* Points Guide & Filters - Kept clean and white */}
                    {!showForm && (
                        <div style={{ ...cardStyle, padding: '16px 24px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Points Info */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '50%' }}>
                                    <Trophy size={16} color="#3B82F6" />
                                </div>
                                <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '700' }}>Earn rewards:</span>
                                {[['Review', POINTS.SUBMIT_REVIEW], ['Edit', POINTS.EDIT_REVIEW], ['Like', POINTS.LIKE_REVIEW], ['Comment', POINTS.COMMENT]].map(([l, p]) => (
                                    <span key={l} style={{ fontSize: '0.8rem', color: '#3B82F6', background: '#EFF6FF', padding: '4px 12px', borderRadius: '999px', fontWeight: '600' }}>+{p} {l}</span>
                                ))}
                            </div>

                            <hr style={{ border: 'none', height: '1px', background: '#F3F4F6', margin: 0 }} />

                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                    <input type="text" placeholder="Search faculty or course..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{...inputStyle, background: 'transparent'}} />
                                </div>
                                <div style={{ width: '1px', height: '24px', background: '#E5E7EB', display: 'block' }} />
                                <div style={{ position: 'relative', minWidth: '160px' }}>
                                    <Code size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                    <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ ...inputStyle, background: 'transparent', appearance: 'none', cursor: 'pointer' }}>
                                        <option value="All">All Courses</option>
                                        {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                </div>
                                <div style={{ position: 'relative', minWidth: '160px' }}>
                                    <Filter size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                    <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{ ...inputStyle, background: 'transparent', appearance: 'none', cursor: 'pointer' }}>
                                        <option value="newest">Newest First</option>
                                        <option value="highest">Highest Rated</option>
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Section */}
                    {showForm && (
                        <div style={{ ...cardStyle, marginBottom: '2rem', padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#111827' }}>{editingId ? "Edit Review" : "New Faculty Review"}</h2>
                                <span style={{ fontSize: '0.85rem', color: '#166534', background: '#DCFCE7', padding: '6px 14px', borderRadius: '999px', fontWeight: '700' }}>
                                    +{editingId ? POINTS.EDIT_REVIEW : POINTS.SUBMIT_REVIEW} pts upon submission
                                </span>
                            </div>
                            
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Faculty Name</label><User size={18} style={{ position: 'absolute', left: '16px', top: '40px', color: '#9CA3AF' }} /><input type="text" placeholder="e.g. Dr. John Doe" required value={formData.facultyName} onChange={e => setFormData(p => ({ ...p, facultyName: e.target.value }))} style={inputStyle} /></div>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Co-Faculty (Optional)</label><User size={18} style={{ position: 'absolute', left: '16px', top: '40px', color: '#9CA3AF' }} /><input type="text" placeholder="e.g. Prof. Smith" value={formData.coFaculty} onChange={e => setFormData(p => ({ ...p, coFaculty: e.target.value }))} style={inputStyle} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Course Code</label><Code size={18} style={{ position: 'absolute', left: '16px', top: '40px', color: '#9CA3AF' }} /><input type="text" placeholder="e.g. CSE1001" required value={formData.courseCode} onChange={e => setFormData(p => ({ ...p, courseCode: e.target.value }))} style={inputStyle} /></div>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Course Name</label><BookOpen size={18} style={{ position: 'absolute', left: '16px', top: '40px', color: '#9CA3AF' }} /><input type="text" placeholder="e.g. Data Structures" required value={formData.courseName} onChange={e => setFormData(p => ({ ...p, courseName: e.target.value }))} style={inputStyle} /></div>
                                </div>
                                
                                <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                        <div style={{ position: 'relative' }}><label style={labelStyle}>Internal Marks (Min)</label><ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '40px', color: '#9CA3AF' }} /><input type="number" placeholder="e.g. 40" required value={formData.minInternals} onChange={e => setFormData(p => ({ ...p, minInternals: e.target.value }))} style={{...inputStyle, background: '#FFFFFF'}} /></div>
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>Faculty Type</label>
                                            <UserCheck size={18} style={{ position: 'absolute', left: '16px', top: '40px', color: '#9CA3AF' }} />
                                            <select value={formData.facultyType} onChange={e => setFormData(p => ({ ...p, facultyType: e.target.value }))} style={{ ...inputStyle, background: '#FFFFFF', appearance: 'none', cursor: 'pointer' }}>{['Loose', 'Moderate', 'Strict', 'Rod'].map(t => <option key={t}>{t}</option>)}</select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '42px', color: '#9CA3AF', pointerEvents: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Mobile Usage</label>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '0 16px', borderRadius: '12px', height: '48px', border: '1px solid #E5E7EB' }}>
                                                <span style={{ fontSize: '0.95rem', color: '#374151', fontWeight: '500' }}>Allowed in class?</span>
                                                <div onClick={() => setFormData(p => ({ ...p, mobileAllowed: !p.mobileAllowed }))} style={{ width: '44px', height: '24px', background: formData.mobileAllowed ? '#22C55E' : '#EF4444', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                                    <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '23px' : '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Overall Rating</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[1,2,3,4,5].map(s => <Star key={s} size={36} fill={s <= formData.rating ? "#FBBF24" : "none"} color={s <= formData.rating ? "#FBBF24" : "#D1D5DB"} style={{ cursor: 'pointer', transition: '0.2s' }} onClick={() => setFormData(p => ({ ...p, rating: s }))} />)}
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={labelStyle}>Detailed Feedback</label>
                                    <textarea rows="4" placeholder="Share your experience regarding teaching style, assignments, and grading..." required value={formData.feedback} onChange={e => setFormData(p => ({ ...p, feedback: e.target.value }))} style={{ ...inputStyle, paddingLeft: '16px', resize: 'vertical' }} />
                                </div>
                                
                                <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: '0.2s', marginTop: '8px' }}>
                                    {loading ? 'Processing...' : (editingId ? 'Update Review' : 'Submit Review')}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Reviews Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {filteredReviews.length === 0 ? (
                            <div style={{ ...cardStyle, gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem' }}>
                                <BookOpen size={48} color="#D1D5DB" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: '#6B7280', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>No reviews found for your criteria.</p>
                            </div>
                        ) : filteredReviews.map(review => {
                            const typeStyle = getTypeStyle(review.facultyType);
                            
                            return (
                                <div key={review.id} style={{ ...cardStyle, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                                    
                                    {/* Card Header */}
                                    <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.facultyName}</h3>
                                            {review.coFaculty && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>with {review.coFaculty}</p>}
                                            
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '999px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: '700' }}>{review.courseCode}</span>
                                                <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '999px', background: '#F3F4F6', color: '#4B5563', fontWeight: '600', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.courseName}</span>
                                            </div>
                                        </div>
                                        <RatingBadge rating={review.rating} />
                                    </div>

                                    {/* Card Meta Info */}
                                    <div style={{ padding: '0 24px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                                        <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                            <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Internal Marks</span>
                                            <span style={{ fontWeight: '700', color: '#111827' }}>{review.minInternals} Min</span>
                                        </div>
                                        <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                            <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Mobile</span>
                                            <span style={{ fontWeight: '700', color: review.mobileAllowed ? '#166534' : '#991B1B' }}>{review.mobileAllowed ? "Allowed" : "Strict"}</span>
                                        </div>
                                    </div>

                                    {/* Faculty Type Pill */}
                                    <div style={{ padding: '0 24px 16px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: typeStyle.bg, color: typeStyle.text, padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700' }}>
                                            {review.facultyType === 'Rod' && <Flame size={14} />} {review.facultyType} Type
                                        </span>
                                    </div>

                                    {/* Feedback Text */}
                                    <div style={{ padding: '0 24px 20px', flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', lineHeight: 1.6, maxHeight: '100px', overflowY: 'auto' }}>"{review.feedback}"</p>
                                    </div>

                                    {/* Admin info */}
                                    {isAdmin && (
                                        <div style={{ padding: '8px 24px', background: '#FEF2F2', borderTop: '1px solid #FEE2E2', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontSize: '0.8rem', fontWeight: '600' }}>
                                            <ShieldCheck size={14} /> Posted by: {review.isAnonymous ? 'Anonymous' : review.reviewerName}
                                        </div>
                                    )}

                                    {/* Action Footer */}
                                    <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div onClick={() => handleLike(review)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: review.likes?.includes(currentUser?.uid) ? '#3B82F6' : '#6B7280', transition: '0.2s' }}>
                                                <ThumbsUp size={16} fill={review.likes?.includes(currentUser?.uid) ? "#3B82F6" : "none"} /><span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{review.likes?.length || 0}</span>
                                            </div>
                                            <div onClick={() => handleDislike(review)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: review.dislikes?.includes(currentUser?.uid) ? '#EF4444' : '#6B7280', transition: '0.2s' }}>
                                                <ThumbsDown size={16} fill={review.dislikes?.includes(currentUser?.uid) ? "#EF4444" : "none"} /><span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{review.dislikes?.length || 0}</span>
                                            </div>
                                            <div onClick={() => setActiveCommentBox(activeCommentBox === review.id ? null : review.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: activeCommentBox === review.id ? '#111827' : '#6B7280', transition: '0.2s' }}>
                                                <MessageCircle size={16} /><span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{review.comments?.length || 0}</span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: '500' }}>{timeAgo(review.createdAt)}</span>
                                    </div>

                                    {/* Comments Section */}
                                    {activeCommentBox === review.id && (
                                        <div style={{ padding: '16px 24px', background: '#FFFFFF', borderTop: '1px solid #F3F4F6' }}>
                                            <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                                                {review.comments?.length > 0 ? review.comments.map(c => (
                                                    <div key={c.id} style={{ fontSize: '0.85rem', background: '#F9FAFB', padding: '10px 12px', borderRadius: '12px' }}>
                                                        <strong style={{ color: '#111827', display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>{c.name}</strong> 
                                                        <span style={{ color: '#4B5563', lineHeight: 1.4 }}>{c.text}</span>
                                                    </div>
                                                )) : <span style={{ fontSize: '0.85rem', color: '#9CA3AF', textAlign: 'center', display: 'block', padding: '10px 0' }}>Be the first to comment.</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input type="text" placeholder="Add a comment... (+5 pts)" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmitComment(review.id)} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontSize: '0.85rem', padding: '10px 16px', borderRadius: '999px', outline: 'none' }} />
                                                <button onClick={() => handleSubmitComment(review.id)} style={{ background: '#3B82F6', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}><Send size={16} style={{ marginLeft: '-2px' }} /></button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Edit / Delete Footer */}
                                    {currentUser && (currentUser.uid === review.reviewerId || isAdmin) && (
                                        <div style={{ padding: '12px 24px', background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #F3F4F6' }}>
                                            <button onClick={() => handleEdit(review)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', padding: 0 }}><Edit2 size={14} /> Edit</button>
                                            <button onClick={() => handleDelete(review.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', padding: 0 }}><Trash2 size={14} /> Delete</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FacultyReviews;