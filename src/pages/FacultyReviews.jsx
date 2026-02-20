import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, doc } from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import { 
    Star, User, BookOpen, Code, Smartphone, Plus, X, 
    Search, Filter, Trash2, Edit2, ShieldCheck, Clock, CheckCircle, AlertCircle 
} from 'lucide-react';

const FacultyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null); // Track which review is being edited

    // Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest'); // newest, oldest, highest, lowest
    const [courseFilter, setCourseFilter] = useState('All'); // For specific course filtering
    const [uniqueCourses, setUniqueCourses] = useState([]);

    // Form State
    const initialFormState = {
        facultyName: '',
        coFaculty: '',
        courseCode: '',
        courseName: '',
        minInternals: '',
        internalsVerdict: 'Good',
        mobileAllowed: true,
        rating: 0,
        feedback: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const currentUser = auth.currentUser;

    // --- HELPER: Time Ago Calculation ---
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = Math.floor(seconds / 31536000);
        if (interval > 1) return interval + " years ago";
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) return interval + " months ago";
        interval = Math.floor(seconds / 86400);
        if (interval > 1) return interval + " days ago";
        if (interval === 1) return "1 day ago";
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + " hours ago";
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + " mins ago";
        return "Just now";
    };

    // 1. Fetch Reviews & Extract Unique Courses
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                setReviews(reviewsData);
                setFilteredReviews(reviewsData);

                // Extract unique course codes for the filter dropdown
                const courses = [...new Set(reviewsData.map(item => item.courseCode.toUpperCase()))];
                setUniqueCourses(courses.sort());
            } catch (error) {
                console.error("Error fetching reviews:", error);
            }
        };
        fetchReviews();
    }, []);

    // 2. Filter & Sort Logic
    useEffect(() => {
        let result = [...reviews];

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(r => 
                r.facultyName.toLowerCase().includes(lowerTerm) || 
                r.courseName.toLowerCase().includes(lowerTerm)
            );
        }

        // Course Code Filter (The requested feature)
        if (courseFilter !== 'All') {
            result = result.filter(r => r.courseCode.toUpperCase() === courseFilter);
        }

        // Sorting
        if (sortOption === 'newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortOption === 'oldest') {
            result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortOption === 'highest') {
            result.sort((a, b) => b.rating - a.rating);
        } else if (sortOption === 'lowest') {
            result.sort((a, b) => a.rating - b.rating);
        }

        setFilteredReviews(result);
    }, [searchTerm, sortOption, courseFilter, reviews]);

    // 3. Handle Form Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 4. Handle Edit Click
    const handleEdit = (review) => {
        setFormData(review);
        setEditingId(review.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 5. Handle Delete
    const handleDelete = async (reviewId) => {
        if (window.confirm("Delete this review completely?")) {
            try {
                await deleteDoc(doc(db, "facultyReviews", reviewId));
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    // 6. Submit (Create or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!currentUser) return alert("Please login first");
        if(formData.rating === 0) return alert("Please select a star rating");

        setLoading(true);
        try {
            if (editingId) {
                // UPDATE existing review
                const reviewRef = doc(db, "facultyReviews", editingId);
                const updatedData = {
                    ...formData,
                    updatedAt: new Date().toISOString() // Track update time
                };
                await updateDoc(reviewRef, updatedData);
                
                // Update local state without reload
                setReviews(prev => prev.map(r => r.id === editingId ? { ...updatedData, id: editingId } : r));
                alert("Review Updated!");
            } else {
                // CREATE new review
                const newReview = {
                    ...formData,
                    reviewerId: currentUser.uid,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                const docRef = await addDoc(collection(db, "facultyReviews"), newReview);
                setReviews(prev => [{ ...newReview, id: docRef.id }, ...prev]);
            }
            
            // Reset Form
            setShowForm(false);
            setFormData(initialFormState);
            setEditingId(null);
        } catch (error) {
            console.error(error);
            alert("Failed to submit review");
        }
        setLoading(false);
    };

    // --- UI COMPONENTS ---

    const RatingBadge = ({ rating }) => {
        let bg = '#EF4444'; // Red
        if (rating >= 4) bg = '#10B981'; // Green
        else if (rating === 3) bg = '#F59E0B'; // Orange

        return (
            <div style={{ 
                background: bg, color: 'white', padding: '8px 12px', borderRadius: '12px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minWidth: '55px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1' }}>{rating}</span>
                <div style={{ display: 'flex', marginTop: '3px' }}>
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={8} fill="white" color="white" style={{ opacity: i < rating ? 1 : 0.4 }} />
                    ))}
                </div>
            </div>
        );
    };

    const glassInputStyle = {
        width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none'
    };
    const labelStyle = { display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0F0F1A', paddingTop: '80px', color: 'white' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                
                {/* --- HEADER --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Faculty Reviews</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Share honest feedback & help juniors</p>
                    </div>
                    <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(initialFormState); }} style={{ 
                        padding: '12px 24px', borderRadius: '30px', border: 'none',
                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(236,72,153,0.4)'
                    }}>
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Write Review</>}
                    </button>
                </div>

                {/* --- FILTERS & SORTING --- */}
                {!showForm && (
                    <GlassCard style={{ padding: '1.2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input type="text" placeholder="Search Faculty..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                        
                        {/* Filter by Unique Course Code */}
                        <div style={{ position: 'relative', minWidth: '160px' }}>
                            <Code size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}>
                                <option style={{color:'black'}} value="All">All Courses</option>
                                {uniqueCourses.map(code => (
                                    <option key={code} style={{color:'black'}} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div style={{ position: 'relative', minWidth: '160px' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}>
                                <option style={{color:'black'}} value="newest">Newest First</option>
                                <option style={{color:'black'}} value="oldest">Oldest First</option>
                                <option style={{color:'black'}} value="highest">Highest Rated</option>
                                <option style={{color:'black'}} value="lowest">Lowest Rated</option>
                            </select>
                        </div>
                    </GlassCard>
                )}

                {/* --- FORM (ADD / EDIT) --- */}
                {showForm && (
                    <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{editingId ? "Edit Review" : "New Review"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Inputs ... (Same as before, simplified for brevity) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Faculty Name</label><User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="facultyName" placeholder="Dr. Name" required value={formData.facultyName} onChange={handleChange} style={glassInputStyle} /></div>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Co-Faculty</label><User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="coFaculty" placeholder="Optional" value={formData.coFaculty} onChange={handleChange} style={glassInputStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Course Code</label><Code size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="courseCode" placeholder="CSE1001" required value={formData.courseCode} onChange={handleChange} style={glassInputStyle} /></div>
                                <div style={{ position: 'relative' }}><label style={labelStyle}>Course Name</label><BookOpen size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="text" name="courseName" placeholder="Subject" required value={formData.courseName} onChange={handleChange} style={glassInputStyle} /></div>
                            </div>

                            {/* Internals Block */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ ...labelStyle, marginBottom: '15px', color: '#EC4899', fontWeight: 'bold' }}>Internals & Mobile</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Min Marks</label><ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><input type="number" name="minInternals" placeholder="e.g. 40" required value={formData.minInternals} onChange={handleChange} style={glassInputStyle} /></div>
                                    <div style={{ position: 'relative' }}><label style={labelStyle}>Verdict</label><CheckCircle size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} /><select name="internalsVerdict" value={formData.internalsVerdict} onChange={handleChange} style={{...glassInputStyle, appearance: 'none', cursor: 'pointer'}}><option style={{color:'black'}}>Good</option><option style={{color:'black'}}>Average</option><option style={{color:'black'}}>Bad</option></select></div>
                                    <div><label style={labelStyle}>Mobile</label><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0 15px', borderRadius: '12px', height: '48px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ fontSize: '0.9rem', color: '#ddd' }}>Allowed?</span><div onClick={() => setFormData(prev => ({...prev, mobileAllowed: !prev.mobileAllowed}))} style={{ width: '44px', height: '24px', background: formData.mobileAllowed ? '#10B981' : '#EF4444', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}><div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '23px' : '3px', transition: '0.3s' }}></div></div></div></div>
                                </div>
                            </div>
                            
                            <div><label style={labelStyle}>Rating</label><div style={{ display: 'flex', gap: '10px' }}>{[1, 2, 3, 4, 5].map((star) => (<Star key={star} size={36} fill={star <= formData.rating ? "#FBBF24" : "none"} color={star <= formData.rating ? "#FBBF24" : "#4B5563"} style={{ cursor: 'pointer' }} onClick={() => setFormData(prev => ({ ...prev, rating: star }))} />))}</div></div>
                            <div><label style={labelStyle}>Feedback</label><textarea name="feedback" rows="3" placeholder="Experience..." required value={formData.feedback} onChange={handleChange} style={{...glassInputStyle, padding: '12px', resize: 'none'}} /></div>
                            
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                {loading ? 'Saving...' : (editingId ? 'Update Review' : 'Submit Review')}
                            </button>
                        </form>
                    </GlassCard>
                )}

                {/* --- REVIEWS LIST (CLEAN UI) --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {filteredReviews.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reviews found.</p> : filteredReviews.map((review) => (
                        <GlassCard key={review.id} style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                            
                            {/* --- 1. CARD HEADER --- */}
                            <div style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{review.facultyName}</h3>
                                        {review.coFaculty && <span style={{ fontSize: '0.85rem', color: '#999' }}>& {review.coFaculty}</span>}
                                    </div>
                                    {/* Badges for Course */}
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                                            <Code size={12} /> {review.courseCode}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                                            <BookOpen size={12} /> {review.courseName}
                                        </div>
                                    </div>
                                </div>
                                <RatingBadge rating={review.rating} />
                            </div>

                            {/* --- 2. STATS ROW (Clean & Professional) --- */}
                            <div style={{ 
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' 
                            }}>
                                {/* Min Internals */}
                                <div style={{ padding: '12px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#ddd' }}>
                                    <ShieldCheck size={16} color="#EC4899" />
                                    <span>Min: <b>{review.minInternals}</b></span>
                                </div>
                                {/* Verdict */}
                                <div style={{ padding: '12px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    {review.internalsVerdict === 'Good' ? <CheckCircle size={16} color="#34D399"/> : <AlertCircle size={16} color="#F87171"/> }
                                    <span style={{ color: review.internalsVerdict === 'Good' ? '#34D399' : review.internalsVerdict === 'Bad' ? '#F87171' : '#FBBF24', fontWeight: 'bold' }}>{review.internalsVerdict}</span>
                                </div>
                                {/* Mobile */}
                                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: review.mobileAllowed ? '#34D399' : '#F87171' }}>
                                    <Smartphone size={16} />
                                    <span>{review.mobileAllowed ? "Mobile Allowed" : "No Mobiles"}</span>
                                </div>
                            </div>

                            {/* --- 3. FEEDBACK --- */}
                            <div style={{ padding: '1.2rem' }}>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#eee', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #60A5FA' }}>
                                    "{review.feedback}"
                                </p>
                            </div>

                            {/* --- 4. FOOTER (Time & Actions) --- */}
                            <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#777' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Clock size={12} /> {timeAgo(review.updatedAt || review.createdAt)} 
                                    {review.updatedAt && review.updatedAt !== review.createdAt && <span>(edited)</span>}
                                </div>
                                
                                {/* Edit/Delete Buttons (Only if Owner) */}
                                {currentUser && currentUser.uid === review.reviewerId && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleEdit(review)} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(review.id)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyReviews;
