import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import { 
    Star, User, BookOpen, Code, Smartphone, Plus, X, 
    Search, Filter, Trash2, ShieldCheck, AlertCircle, CheckCircle 
} from 'lucide-react';

const FacultyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Search & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest'); // newest, rating, courseCode
    
    // Form State
    const [formData, setFormData] = useState({
        facultyName: '',
        coFaculty: '',
        courseCode: '',
        courseName: '',
        minInternals: '',    // New Field: Minimum marks given
        internalsVerdict: 'Good', // New Field: Good / Average / Bad
        mobileAllowed: true, // Default to allowed (Green toggle)
        rating: 0,
        feedback: ''
    });

    const currentUser = auth.currentUser;

    // 1. Fetch Reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReviews(reviewsData);
                setFilteredReviews(reviewsData);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            }
        };
        fetchReviews();
    }, []);

    // 2. Filter & Sort Logic
    useEffect(() => {
        let result = [...reviews];

        // Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(r => 
                r.facultyName.toLowerCase().includes(lowerTerm) || 
                r.courseCode.toLowerCase().includes(lowerTerm) ||
                r.courseName.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort
        if (sortOption === 'newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortOption === 'highest') {
            result.sort((a, b) => b.rating - a.rating);
        } else if (sortOption === 'lowest') {
            result.sort((a, b) => a.rating - b.rating);
        } else if (sortOption === 'courseCode') {
            result.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        }

        setFilteredReviews(result);
    }, [searchTerm, sortOption, reviews]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. Delete Review Logic
    const handleDelete = async (reviewId) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            try {
                await deleteDoc(doc(db, "facultyReviews", reviewId));
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            } catch (error) {
                console.error("Error deleting review:", error);
                alert("Failed to delete review.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!currentUser) return alert("Please login first");
        if(formData.rating === 0) return alert("Please select a star rating");

        setLoading(true);
        try {
            await addDoc(collection(db, "facultyReviews"), {
                ...formData,
                reviewerId: currentUser.uid,
                createdAt: new Date().toISOString()
            });
            window.location.reload(); 
        } catch (error) {
            console.error(error);
            alert("Failed to submit review");
        }
        setLoading(false);
    };

    // --- SUB-COMPONENTS ---
    
    // The Colored Rating Box (Green/Orange/Red)
    const RatingBadge = ({ rating }) => {
        let bg = '#EF4444'; // Red
        if (rating >= 4) bg = '#10B981'; // Green
        else if (rating === 3) bg = '#F59E0B'; // Orange

        return (
            <div style={{ 
                background: bg, color: 'white', padding: '8px 16px', borderRadius: '16px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minWidth: '60px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1' }}>{rating}</span>
                <div style={{ display: 'flex', marginTop: '2px' }}>
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
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* --- HEADER --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Faculty Reviews</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Share honest feedback & help juniors</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} style={{ 
                        padding: '12px 24px', borderRadius: '30px', border: 'none',
                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(236,72,153,0.4)'
                    }}>
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Write Review</>}
                    </button>
                </div>

                {/* --- SEARCH & SORT --- */}
                {!showForm && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input 
                                type="text" placeholder="Search by Faculty, Course Code or Subject..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)' }} 
                            />
                        </div>
                        <div style={{ position: 'relative', minWidth: '180px' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <select 
                                value={sortOption} onChange={(e) => setSortOption(e.target.value)}
                                style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}
                            >
                                <option style={{color:'black'}} value="newest">Newest First</option>
                                <option style={{color:'black'}} value="highest">Highest Rated</option>
                                <option style={{color:'black'}} value="lowest">Lowest Rated</option>
                                <option style={{color:'black'}} value="courseCode">Sort by Course Code</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- FORM --- */}
                {showForm && (
                    <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            
                            {/* Faculty Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Faculty Name</label>
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="facultyName" placeholder="Dr. Name" required value={formData.facultyName} onChange={handleChange} style={glassInputStyle} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Co-Faculty (Optional)</label>
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="coFaculty" placeholder="Prof. Name" value={formData.coFaculty} onChange={handleChange} style={glassInputStyle} />
                                </div>
                            </div>

                            {/* Course Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Course Code</label>
                                    <Code size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="courseCode" placeholder="e.g. CSE1001" required value={formData.courseCode} onChange={handleChange} style={glassInputStyle} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Course Name</label>
                                    <BookOpen size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="courseName" placeholder="e.g. Data Structures" required value={formData.courseName} onChange={handleChange} style={glassInputStyle} />
                                </div>
                            </div>

                            {/* Internals & Mobile Block */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ ...labelStyle, marginBottom: '15px', fontSize: '1rem', color: '#EC4899', fontWeight: 'bold' }}>Internals & Rules</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                    
                                    {/* Min Internals */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Min Marks Given</label>
                                        <ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                        <input type="number" name="minInternals" placeholder="e.g. 40" required value={formData.minInternals} onChange={handleChange} style={glassInputStyle} />
                                    </div>

                                    {/* Verdict */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Internals Verdict</label>
                                        <CheckCircle size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                        <select name="internalsVerdict" value={formData.internalsVerdict} onChange={handleChange} style={{...glassInputStyle, appearance: 'none', cursor: 'pointer'}}>
                                            <option style={{color:'black'}} value="Good">Good (High Marks)</option>
                                            <option style={{color:'black'}} value="Average">Average</option>
                                            <option style={{color:'black'}} value="Bad">Bad (Strict)</option>
                                        </select>
                                    </div>

                                    {/* Mobile Toggle */}
                                    <div>
                                        <label style={labelStyle}>Mobile Policy</label>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0 15px', borderRadius: '12px', height: '48px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Allowed?</span>
                                            <div onClick={() => setFormData(prev => ({...prev, mobileAllowed: !prev.mobileAllowed}))} style={{ width: '44px', height: '24px', background: formData.mobileAllowed ? '#10B981' : '#EF4444', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                                <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '23px' : '3px', transition: '0.3s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label style={labelStyle}>Rating</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={36} fill={star <= formData.rating ? "#FBBF24" : "none"} color={star <= formData.rating ? "#FBBF24" : "#4B5563"} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setFormData(prev => ({ ...prev, rating: star }))} />
                                    ))}
                                </div>
                            </div>

                            {/* Feedback */}
                            <div>
                                <label style={labelStyle}>Detailed Feedback</label>
                                <textarea name="feedback" rows="3" placeholder="Share your experience..." required value={formData.feedback} onChange={handleChange} style={{...glassInputStyle, padding: '12px', resize: 'none'}} />
                            </div>

                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' }}>
                                {loading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </GlassCard>
                )}

                {/* --- REVIEWS LIST --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {filteredReviews.length === 0 ? (
                        <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center', marginTop: '2rem' }}>No reviews found.</p>
                    ) : (
                        filteredReviews.map((review) => (
                            <GlassCard key={review.id} style={{ padding: '0', position: 'relative', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                
                                {/* 1. Card Header */}
                                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: 'white' }}>{review.facultyName}</h3>
                                        {review.coFaculty && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#aaa' }}>& {review.coFaculty}</p>}
                                        
                                        {/* Course Name is now here prominent */}
                                        <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <BookOpen size={14} /> {review.courseName}
                                        </div>
                                    </div>

                                    {/* The Rating Badge (Green/Orange/Red Box) */}
                                    <RatingBadge rating={review.rating} />
                                </div>

                                {/* 2. Details Grid (Course Code | Internals | Mobile) */}
                                <div style={{ padding: '0 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                                    
                                    {/* Course Code */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
                                        <Code size={16} color="#A78BFA" /> {review.courseCode}
                                    </div>

                                    {/* Mobile Status */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', color: review.mobileAllowed ? '#34D399' : '#F87171' }}>
                                        <Smartphone size={16} /> {review.mobileAllowed ? "Mobile Allowed" : "No Mobiles"}
                                    </div>

                                    {/* Internals Block */}
                                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F472B6', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            <ShieldCheck size={16} /> Internals:
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'white' }}>Min: <b>{review.minInternals}</b></span>
                                            <span style={{ 
                                                color: review.internalsVerdict === 'Good' ? '#34D399' : review.internalsVerdict === 'Bad' ? '#F87171' : '#FBBF24',
                                                fontWeight: 'bold', textTransform: 'uppercase' 
                                            }}>
                                                {review.internalsVerdict}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Feedback */}
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic', color: '#ddd', lineHeight: '1.5' }}>
                                        "{review.feedback}"
                                    </p>
                                </div>

                                {/* 4. Delete Button (Only for owner) */}
                                {currentUser && currentUser.uid === review.reviewerId && (
                                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                        {/* Since Rating is top right, let's put delete button small near the top or bottom right footer */}
                                    </div>
                                )}
                                
                                {/* Footer Actions */}
                                {currentUser && currentUser.uid === review.reviewerId && (
                                    <button 
                                        onClick={() => handleDelete(review.id)}
                                        style={{ 
                                            width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: '#F87171', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            fontSize: '0.85rem', fontWeight: 'bold', transition: '0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        <Trash2 size={14} /> Delete My Review
                                    </button>
                                )}
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FacultyReviews;
