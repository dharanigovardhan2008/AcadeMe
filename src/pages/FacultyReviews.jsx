import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, doc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import { 
    Star, User, BookOpen, Code, Smartphone, Plus, X, 
    Search, Filter, Trash2, Edit2, ShieldCheck, Clock, CheckCircle, 
    Heart, ThumbsUp, ThumbsDown, MessageCircle, Send, AlertTriangle, UserCheck, Flame 
} from 'lucide-react';

const FacultyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Comment Section State
    const [activeCommentBox, setActiveCommentBox] = useState(null); 
    const [commentText, setCommentText] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest'); 
    const [courseFilter, setCourseFilter] = useState('All');
    const [uniqueCourses, setUniqueCourses] = useState([]);

    const currentUser = auth.currentUser;

    // ==========================================
    // 🔐 ADMIN CHECK 
    // ==========================================
    const ADMIN_EMAILS = ['admin@college.com', 'principal@college.com']; 
    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);

    // Form State
    const initialFormState = {
        facultyName: '',
        coFaculty: '',
        courseCode: '',
        courseName: '',
        minInternals: '',
        facultyType: 'Moderate', 
        mobileAllowed: true,
        rating: 0,
        feedback: '',
        likes: [],     
        dislikes: [],
        comments: []   
    };
    const [formData, setFormData] = useState(initialFormState);

    // --- Helpers ---
    const timeAgo = (dateString) => {
        if(!dateString) return "Just now";
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        let interval = Math.floor(seconds / 31536000);
        if (interval > 1) return interval + "y ago";
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) return interval + "mo ago";
        interval = Math.floor(seconds / 86400);
        if (interval > 1) return interval + "d ago";
        if (interval === 1) return "1d ago";
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + "h ago";
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + "m ago";
        return "Just now";
    };

    const getTypeColor = (type) => {
        switch(type) {
            case 'Rod': return '#F43F5E'; // Rose/Red (Danger)
            case 'Strict': return '#EF4444'; // Red
            case 'Moderate': return '#FACC15'; // Yellow
            case 'Loose': return '#34D399'; // Green
            default: return '#ccc';
        }
    };

    // --- Fetch Data ---
    const fetchReviews = async () => {
        try {
            const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(reviewsData);
            setFilteredReviews(reviewsData);
            const courses = [...new Set(reviewsData.map(item => item.courseCode.toUpperCase()))];
            setUniqueCourses(courses.sort());
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // --- Filter Logic ---
    useEffect(() => {
        let result = [...reviews];
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(r => 
                r.facultyName.toLowerCase().includes(lowerTerm) || 
                r.courseName.toLowerCase().includes(lowerTerm)
            );
        }
        if (courseFilter !== 'All') {
            result = result.filter(r => r.courseCode.toUpperCase() === courseFilter);
        }
        if (sortOption === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (sortOption === 'highest') result.sort((a, b) => b.rating - a.rating);
        
        setFilteredReviews(result);
    }, [searchTerm, sortOption, courseFilter, reviews]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Like / Dislike Logic ---
    const handleLike = async (review) => {
        if (!currentUser) return alert("Login to vote");
        const reviewRef = doc(db, "facultyReviews", review.id);
        const isLiked = review.likes?.includes(currentUser.uid);

        try {
            if (isLiked) {
                await updateDoc(reviewRef, { likes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(reviewRef, { 
                    likes: arrayUnion(currentUser.uid),
                    dislikes: arrayRemove(currentUser.uid) 
                });
            }
            fetchReviews(); 
        } catch (error) { console.error(error); }
    };

    const handleDislike = async (review) => {
        if (!currentUser) return alert("Login to vote");
        const reviewRef = doc(db, "facultyReviews", review.id);
        const isDisliked = review.dislikes?.includes(currentUser.uid);

        try {
            if (isDisliked) {
                await updateDoc(reviewRef, { dislikes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(reviewRef, { 
                    dislikes: arrayUnion(currentUser.uid), 
                    likes: arrayRemove(currentUser.uid)
                });
            }
            fetchReviews();
        } catch (error) { console.error(error); }
    };

    // --- Comments ---
    const handleSubmitComment = async (reviewId) => {
        if (!currentUser) return alert("Login to comment");
        if (!commentText.trim()) return;

        const reviewRef = doc(db, "facultyReviews", reviewId);
        const newComment = {
            id: Date.now().toString(),
            uid: currentUser.uid,
            name: currentUser.displayName || "User",
            text: commentText,
            createdAt: new Date().toISOString()
        };

        try {
            await updateDoc(reviewRef, { comments: arrayUnion(newComment) });
            setCommentText('');
            fetchReviews();
        } catch (error) { console.error(error); }
    };

    // --- Submit Review ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!currentUser) return alert("Please login first");
        if(formData.rating === 0) return alert("Please select a star rating");
        setLoading(true);
        try {
            const dataToSave = { ...formData, updatedAt: new Date().toISOString() };

            if (editingId) {
                const reviewRef = doc(db, "facultyReviews", editingId);
                await updateDoc(reviewRef, dataToSave);
            } else {
                await addDoc(collection(db, "facultyReviews"), {
                    ...dataToSave,
                    likes: [], dislikes: [], comments: [],
                    reviewerId: currentUser.uid,
                    createdAt: new Date().toISOString()
                });
            }
            setShowForm(false);
            setFormData(initialFormState);
            setEditingId(null);
            fetchReviews();
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    const handleDelete = async (reviewId) => {
        if (window.confirm("Delete this review permanently?")) {
            await deleteDoc(doc(db, "facultyReviews", reviewId));
            fetchReviews();
        }
    };

    const handleEdit = (review) => {
        setFormData(review);
        setEditingId(review.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- UI Components ---
    const RatingBadge = ({ rating }) => {
        let bg = '#EF4444';
        if (rating >= 4) bg = '#10B981';
        else if (rating === 3) bg = '#F59E0B';
        return (
            <div style={{ background: bg, color: 'white', padding: '6px 10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '45px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: '1' }}>{rating}</span>
                <div style={{ display: 'flex', marginTop: '2px' }}>{[...Array(5)].map((_, i) => (<Star key={i} size={6} fill="white" color="white" style={{ opacity: i < rating ? 1 : 0.4 }} />))}</div>
            </div>
        );
    };

    const glassInputStyle = { width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' };
    const labelStyle = { display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0F0F1A', paddingTop: '80px', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* --- HEADER --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Faculty Reviews</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Honest feedback & insights</p>
                    </div>
                    <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(initialFormState); }} style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Write Review</>}
                    </button>
                </div>

                {/* --- FILTERS --- */}
                {!showForm && (
                    <GlassCard style={{ padding: '1.2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}><Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)' }} /></div>
                        <div style={{ position: 'relative', minWidth: '160px' }}><Code size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} /><select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}><option style={{color:'black'}} value="All">All Courses</option>{uniqueCourses.map(code => (<option key={code} style={{color:'black'}} value={code}>{code}</option>))}</select></div>
                        <div style={{ position: 'relative', minWidth: '160px' }}><Filter size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} /><select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}><option style={{color:'black'}} value="newest">Newest First</option><option style={{color:'black'}} value="highest">Highest Rated</option></select></div>
                    </GlassCard>
                )}

                {/* --- FORM --- */}
                {showForm && (
                    <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{editingId ? "Edit Review" : "New Review"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Faculty Name</label><User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="facultyName" placeholder="Dr. Name" required value={formData.facultyName} onChange={handleChange} style={glassInputStyle} /></div>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Co-Faculty</label><User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="coFaculty" placeholder="Optional" value={formData.coFaculty} onChange={handleChange} style={glassInputStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Course Code</label><Code size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="courseCode" placeholder="e.g. CSE1001" required value={formData.courseCode} onChange={handleChange} style={glassInputStyle} /></div>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Course Name</label><BookOpen size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="courseName" placeholder="Subject" required value={formData.courseName} onChange={handleChange} style={glassInputStyle} /></div>
                            </div>
                            
                            {/* Stats Inputs */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ ...labelStyle, marginBottom: '15px', color: '#EC4899', fontWeight: 'bold' }}>Details</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Min Marks Given</label><ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="number" name="minInternals" placeholder="e.g. 40" required value={formData.minInternals} onChange={handleChange} style={glassInputStyle} /></div>
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Faculty Type</label>
                                        <UserCheck size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                        <select name="facultyType" value={formData.facultyType} onChange={handleChange} style={{...glassInputStyle, appearance: 'none', cursor: 'pointer', paddingLeft: '45px'}}>
                                            <option style={{color:'black'}}>Loose</option>
                                            <option style={{color:'black'}}>Moderate</option>
                                            <option style={{color:'black'}}>Strict</option>
                                            <option style={{color:'black', fontWeight:'bold', color:'red'}}>Rod</option>
                                        </select>
                                    </div>
                                    <div><label style={labelStyle}>Mobile</label><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0 15px', borderRadius: '12px', height: '48px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ fontSize: '0.9rem', color: '#ddd' }}>Allowed?</span><div onClick={() => setFormData(prev => ({...prev, mobileAllowed: !prev.mobileAllowed}))} style={{ width: '44px', height: '24px', background: formData.mobileAllowed ? '#10B981' : '#EF4444', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}><div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '23px' : '3px', transition: '0.3s' }}></div></div></div></div>
                                </div>
                            </div>
                            
                            <div><label style={labelStyle}>Rating</label><div style={{ display: 'flex', gap: '10px' }}>{[1, 2, 3, 4, 5].map((star) => (<Star key={star} size={36} fill={star <= formData.rating ? "#FBBF24" : "none"} color={star <= formData.rating ? "#FBBF24" : "#4B5563"} style={{ cursor: 'pointer' }} onClick={() => setFormData(prev => ({ ...prev, rating: star }))} />))}</div></div>
                            <div><label style={labelStyle}>Feedback</label><textarea name="feedback" rows="3" placeholder="Experience..." required value={formData.feedback} onChange={handleChange} style={{...glassInputStyle, padding: '12px', resize: 'none'}} /></div>
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Saving...' : (editingId ? 'Update Review' : 'Submit Review')}</button>
                        </form>
                    </GlassCard>
                )}

                {/* --- REVIEWS GRID (TRANSPARENT GLASS CARDS) --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredReviews.length === 0 ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>No reviews found.</p> : filteredReviews.map((review) => (
                        <GlassCard key={review.id} style={{ 
                            padding: '0', 
                            overflow: 'hidden', 
                            border: '1px solid rgba(255,255,255,0.08)', // Subtle white border
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%', 
                            background: 'rgba(15, 15, 25, 0.6)', // TRANSPARENT DARK GLASS
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                            
                            {/* HEADER */}
                            <div style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ paddingRight: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{review.facultyName}</h3>
                                    {review.coFaculty && <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#999' }}>& {review.coFaculty}</p>}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(167, 139, 250, 0.2)', color: '#A78BFA', fontWeight: 'bold', border: '1px solid rgba(167, 139, 250, 0.3)' }}>{review.courseCode}</span>
                                        {/* Updated Course Name Color (Teal/Cyan) */}
                                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(20, 184, 166, 0.2)', color: '#22D3EE', fontWeight: 'bold', border: '1px solid rgba(20, 184, 166, 0.3)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.courseName}</span>
                                    </div>
                                </div>
                                <RatingBadge rating={review.rating} />
                            </div>

                            {/* STATS ROW (Clean Layout) */}
                            <div style={{ padding: '0 1.2rem 1rem 1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc' }}>
                                    <ShieldCheck size={14} color="#aaa" /> Min: <b style={{color:'white'}}>{review.minInternals}</b>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getTypeColor(review.facultyType) }}>
                                    {review.facultyType === 'Rod' ? <Flame size={14} /> : <UserCheck size={14} />} 
                                    <b style={{ textTransform: 'uppercase' }}>{review.facultyType}</b>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px', color: review.mobileAllowed ? '#34D399' : '#F87171' }}>
                                    <Smartphone size={14} /> <b>{review.mobileAllowed ? "Mobile Allowed" : "Mobile Not Allowed"}</b>
                                </div>
                            </div>

                            {/* FEEDBACK (Transparent Box) */}
                            <div style={{ padding: '0 1.2rem 1rem 1.2rem', flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.5', maxHeight: '100px', overflowY: 'auto' }}>"{review.feedback}"</p>
                            </div>

                            {/* SOCIAL BAR (Transparent) */}
                            <div style={{ padding: '0.8rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {/* Like */}
                                    <div onClick={() => handleLike(review)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: '0.2s', color: review.likes?.includes(currentUser?.uid) ? '#34D399' : '#94A3B8' }}>
                                        <ThumbsUp size={16} fill={review.likes?.includes(currentUser?.uid) ? "#34D399" : "none"} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{review.likes?.length || 0}</span>
                                    </div>
                                    {/* Dislike */}
                                    <div onClick={() => handleDislike(review)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: '0.2s', color: review.dislikes?.includes(currentUser?.uid) ? '#F87171' : '#94A3B8' }}>
                                        <ThumbsDown size={16} fill={review.dislikes?.includes(currentUser?.uid) ? "#F87171" : "none"} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{review.dislikes?.length || 0}</span>
                                    </div>
                                    {/* Comments */}
                                    <div onClick={() => setActiveCommentBox(activeCommentBox === review.id ? null : review.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#94A3B8' }}>
                                        <MessageCircle size={16} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{review.comments?.length || 0}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{timeAgo(review.createdAt)}</div>
                            </div>

                            {/* COMMENT SECTION */}
                            {activeCommentBox === review.id && (
                                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {review.comments?.length > 0 ? review.comments.map((c) => (
                                            <div key={c.id} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: '6px' }}>
                                                <strong style={{ color: '#38BDF8' }}>{c.name}:</strong> <span style={{ color: '#ccc' }}>{c.text}</span>
                                            </div>
                                        )) : <span style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center' }}>No comments yet.</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem', padding: '6px 10px', borderRadius: '6px', outline: 'none' }} />
                                        <button onClick={() => handleSubmitComment(review.id)} style={{ background: '#3B82F6', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: 'white' }}><Send size={14} /></button>
                                    </div>
                                </div>
                            )}

                            {/* EDIT/DELETE (Admin or Owner) */}
                            {currentUser && (currentUser.uid === review.reviewerId || isAdmin) && (
                                <div style={{ padding: '6px 1.2rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span onClick={() => handleEdit(review)} style={{ cursor: 'pointer', color: '#60A5FA' }}>Edit</span>
                                    <span onClick={() => handleDelete(review.id)} style={{ cursor: 'pointer', color: '#F87171' }}>Delete</span>
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
