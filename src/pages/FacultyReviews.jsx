import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, getDocs,
    query, orderBy, doc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import {
    Star, User, BookOpen, Code, Plus, X, Search, Filter,
    Trash2, Edit2, ShieldCheck, ThumbsUp, ThumbsDown,
    MessageCircle, Send, UserCheck, Flame, Trophy
} from 'lucide-react';
import { useData } from '../context/DataContext';

const POINTS = { SUBMIT_REVIEW: 25, EDIT_REVIEW: 5, LIKE_REVIEW: 2, COMMENT: 5, CALL_FACULTY: 3 };
import { useAuth } from '../context/AuthContext';

const PointsToast = ({ pts, reason, onDone }) => {
    useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div style={{
            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#065f46,#047857)', border: '1px solid #34D399',
            borderRadius: '12px', padding: '10px 20px', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
        }}>
            <Trophy size={16} color="#34D399" />
            <span style={{ color: '#34D399', fontWeight: '700' }}>+{pts} pts</span>
            <span style={{ color: '#d1fae5', fontSize: '0.82rem' }}>{reason}</span>
        </div>
    );
};

const FacultyReviews = () => {
    const { awardPoints } = useData();
    const { user } = useAuth();
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

    const getTypeColor = (t) => ({ Rod: '#F43F5E', Strict: '#EF4444', Moderate: '#FACC15', Loose: '#34D399' }[t] || '#ccc');

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
                await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.LIKE_REVIEW, 'Liked a review');
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
        const ct = commentText;
        setCommentText('');
        setActiveCommentBox(null);
        try {
            await updateDoc(doc(db, "facultyReviews", reviewId), { comments: arrayUnion(newComment) });
            await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.COMMENT, 'Commented on a review');
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
                await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.EDIT_REVIEW, 'Edited a review');
                showToast(POINTS.EDIT_REVIEW, 'Review updated');
            } else {
                await addDoc(collection(db, "facultyReviews"), {
                    ...dataToSave, likes: [], dislikes: [], comments: [],
                    reviewerId: currentUser.uid,
                    reviewerName: currentUser.displayName || user?.name || "Unknown Student",
                    reviewerEmail: currentUser.email || "No Email",
                    createdAt: new Date().toISOString(),
                });
                await awardPoints(currentUser.uid, currentUser.displayName || user?.name, POINTS.SUBMIT_REVIEW, 'Submitted a faculty review');
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

    const RatingBadge = ({ rating }) => {
        const bg = rating >= 4 ? '#10B981' : rating === 3 ? '#F59E0B' : '#EF4444';
        return (
            <div style={{ background: bg, color: 'white', padding: '6px 10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '45px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1 }}>{rating}</span>
                <div style={{ display: 'flex', marginTop: '2px' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={6} fill="white" color="white" style={{ opacity: i < rating ? 1 : 0.4 }} />)}
                </div>
            </div>
        );
    };

    const gi = { width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' };
    const lb = { display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0F0F1A', paddingTop: '80px', color: 'white' }}>
            {toast && <PointsToast pts={toast.pts} reason={toast.reason} onDone={() => setToast(null)} />}
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Faculty Reviews</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Honest feedback • Earn points by contributing!</p>
                    </div>
                    <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(initialFormState); }} style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Write Review</>}
                    </button>
                </div>

                {/* Points guide */}
                {!showForm && (
                    <GlassCard style={{ padding: '0.7rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <Trophy size={15} color="#34D399" />
                        <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: '600' }}>Earn points:</span>
                        {[['Submit review', POINTS.SUBMIT_REVIEW], ['Edit review', POINTS.EDIT_REVIEW], ['Like', POINTS.LIKE_REVIEW], ['Comment', POINTS.COMMENT]].map(([l, p]) => (
                            <span key={l} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(52,211,153,0.1)', padding: '3px 10px', borderRadius: '20px' }}>+{p} {l}</span>
                        ))}
                    </GlassCard>
                )}

                {/* Filters */}
                {!showForm && (
                    <GlassCard style={{ padding: '1.2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input type="text" placeholder="Search faculty or course..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...gi, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                        <div style={{ position: 'relative', minWidth: '150px' }}>
                            <Code size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ ...gi, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}>
                                <option style={{ color: 'black' }} value="All">All Courses</option>
                                {uniqueCourses.map(c => <option key={c} style={{ color: 'black' }} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{ position: 'relative', minWidth: '150px' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{ ...gi, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}>
                                <option style={{ color: 'black' }} value="newest">Newest First</option>
                                <option style={{ color: 'black' }} value="highest">Highest Rated</option>
                            </select>
                        </div>
                    </GlassCard>
                )}

                {/* Form */}
                {showForm && (
                    <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(236,72,153,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{editingId ? "Edit Review" : "New Review"}</h2>
                            <span style={{ fontSize: '0.8rem', color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(52,211,153,0.3)' }}>
                                +{editingId ? POINTS.EDIT_REVIEW : POINTS.SUBMIT_REVIEW} pts on submit
                            </span>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}><label style={lb}>Faculty Name</label><User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" placeholder="Dr. Name" required value={formData.facultyName} onChange={e => setFormData(p => ({ ...p, facultyName: e.target.value }))} style={gi} /></div>
                                <div style={{ position: 'relative' }}><label style={lb}>Co-Faculty</label><User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" placeholder="Optional" value={formData.coFaculty} onChange={e => setFormData(p => ({ ...p, coFaculty: e.target.value }))} style={gi} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}><label style={lb}>Course Code</label><Code size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" placeholder="e.g. CSE1001" required value={formData.courseCode} onChange={e => setFormData(p => ({ ...p, courseCode: e.target.value }))} style={gi} /></div>
                                <div style={{ position: 'relative' }}><label style={lb}>Course Name</label><BookOpen size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" placeholder="Subject" required value={formData.courseName} onChange={e => setFormData(p => ({ ...p, courseName: e.target.value }))} style={gi} /></div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}><label style={lb}>Internal Marks (Min)</label><ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="number" placeholder="e.g. 40" required value={formData.minInternals} onChange={e => setFormData(p => ({ ...p, minInternals: e.target.value }))} style={gi} /></div>
                                    <div style={{ position: 'relative' }}><label style={lb}>Faculty Type</label><UserCheck size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><select value={formData.facultyType} onChange={e => setFormData(p => ({ ...p, facultyType: e.target.value }))} style={{ ...gi, appearance: 'none', cursor: 'pointer' }}>{['Loose', 'Moderate', 'Strict', 'Rod'].map(t => <option key={t} style={{ color: 'black' }}>{t}</option>)}</select></div>
                                    <div><label style={lb}>Mobile</label><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0 15px', borderRadius: '12px', height: '48px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ fontSize: '0.9rem', color: '#ddd' }}>Allowed?</span><div onClick={() => setFormData(p => ({ ...p, mobileAllowed: !p.mobileAllowed }))} style={{ width: '44px', height: '24px', background: formData.mobileAllowed ? '#10B981' : '#EF4444', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}><div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '23px' : '3px', transition: '0.3s' }} /></div></div></div>
                                </div>
                            </div>
                            <div><label style={lb}>Rating</label><div style={{ display: 'flex', gap: '10px' }}>{[1,2,3,4,5].map(s => <Star key={s} size={36} fill={s <= formData.rating ? "#FBBF24" : "none"} color={s <= formData.rating ? "#FBBF24" : "#4B5563"} style={{ cursor: 'pointer' }} onClick={() => setFormData(p => ({ ...p, rating: s }))} />)}</div></div>
                            <div><label style={lb}>Feedback</label><textarea rows="3" placeholder="Share your experience..." required value={formData.feedback} onChange={e => setFormData(p => ({ ...p, feedback: e.target.value }))} style={{ ...gi, padding: '12px', paddingLeft: '12px', resize: 'none' }} /></div>
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Saving...' : (editingId ? 'Update Review' : 'Submit Review')}</button>
                        </form>
                    </GlassCard>
                )}

                {/* Reviews */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredReviews.length === 0 ? (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', padding: '3rem' }}>No reviews found.</p>
                    ) : filteredReviews.map(review => (
                        <GlassCard key={review.id} style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', background: 'rgba(15,15,25,0.6)', backdropFilter: 'blur(10px)' }}>
                            <div style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.facultyName}</h3>
                                    {review.coFaculty && <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#999' }}>& {review.coFaculty}</p>}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(167,139,250,0.2)', color: '#A78BFA', fontWeight: 'bold' }}>{review.courseCode}</span>
                                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(20,184,166,0.2)', color: '#22D3EE', fontWeight: 'bold', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.courseName}</span>
                                    </div>
                                </div>
                                <RatingBadge rating={review.rating} />
                            </div>
                            <div style={{ padding: '0 1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Internal Marks (Min):</span><span style={{ fontWeight: 'bold' }}>{review.minInternals}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#aaa' }}>Faculty Type:</span><span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getTypeColor(review.facultyType), fontWeight: 'bold' }}>{review.facultyType === 'Rod' && <Flame size={13} />}{review.facultyType}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Mobile:</span><span style={{ color: review.mobileAllowed ? '#34D399' : '#F87171', fontWeight: 'bold' }}>{review.mobileAllowed ? "Allowed" : "Not Allowed"}</span></div>
                            </div>
                            <div style={{ padding: '0 1.2rem 1rem', flex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5, maxHeight: '90px', overflowY: 'auto' }}>"{review.feedback}"</p>
                            </div>
                            {isAdmin && (
                                <div style={{ padding: '6px 1.2rem', background: 'rgba(236,72,153,0.1)', borderTop: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', gap: '8px', color: '#F472B6', fontSize: '0.78rem' }}>
                                    <ShieldCheck size={13} /> Posted by: <b>{review.reviewerName}</b>
                                </div>
                            )}
                            <div style={{ padding: '0.8rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div onClick={() => handleLike(review)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: review.likes?.includes(currentUser?.uid) ? '#34D399' : '#94A3B8' }}>
                                        <ThumbsUp size={15} fill={review.likes?.includes(currentUser?.uid) ? "#34D399" : "none"} /><span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{review.likes?.length || 0}</span>
                                    </div>
                                    <div onClick={() => handleDislike(review)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: review.dislikes?.includes(currentUser?.uid) ? '#F87171' : '#94A3B8' }}>
                                        <ThumbsDown size={15} fill={review.dislikes?.includes(currentUser?.uid) ? "#F87171" : "none"} /><span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{review.dislikes?.length || 0}</span>
                                    </div>
                                    <div onClick={() => setActiveCommentBox(activeCommentBox === review.id ? null : review.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#94A3B8' }}>
                                        <MessageCircle size={15} /><span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{review.comments?.length || 0}</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{timeAgo(review.createdAt)}</span>
                            </div>
                            {activeCommentBox === review.id && (
                                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ maxHeight: '110px', overflowY: 'auto', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {review.comments?.length > 0 ? review.comments.map(c => (
                                            <div key={c.id} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: '6px' }}>
                                                <strong style={{ color: '#38BDF8' }}>{c.name}:</strong> <span style={{ color: '#ccc' }}>{c.text}</span>
                                            </div>
                                        )) : <span style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center', display: 'block' }}>No comments yet.</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input type="text" placeholder="Write a comment... (+5 pts)" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmitComment(review.id)} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem', padding: '6px 10px', borderRadius: '6px', outline: 'none' }} />
                                        <button onClick={() => handleSubmitComment(review.id)} style={{ background: '#3B82F6', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: 'white' }}><Send size={14} /></button>
                                    </div>
                                </div>
                            )}
                            {currentUser && (currentUser.uid === review.reviewerId || isAdmin) && (
                                <div style={{ padding: '6px 1.2rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span onClick={() => handleEdit(review)} style={{ cursor: 'pointer', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit2 size={12} /> Edit</span>
                                    <span onClick={() => handleDelete(review.id)} style={{ cursor: 'pointer', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}><Trash2 size={12} /> Delete</span>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyReviews;
