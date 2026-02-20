import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import { Star, User, Book, Code, Smartphone, MessageSquare, Plus, X, GraduationCap, Users, Search, Filter } from 'lucide-react';

const FacultyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Search & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest'); // newest, highest, lowest
    
    // Form State
    const [formData, setFormData] = useState({
        facultyName: '',
        coFaculty: '',
        courseCode: '',
        courseName: '',
        internals: '', // Changed to empty string for Number input
        mobileAllowed: false,
        rating: 0,
        feedback: ''
    });

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

        // Filter by Search
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
        }

        setFilteredReviews(result);
    }, [searchTerm, sortOption, reviews]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!auth.currentUser) return alert("Please login first");
        if(formData.rating === 0) return alert("Please select a star rating");

        setLoading(true);
        try {
            await addDoc(collection(db, "facultyReviews"), {
                ...formData,
                // We still save ID for admin purposes, but we won't display the name
                reviewerId: auth.currentUser.uid,
                createdAt: new Date().toISOString()
            });
            window.location.reload(); 
        } catch (error) {
            console.error(error);
            alert("Failed to submit review");
        }
        setLoading(false);
    };

    // Styling
    const glassInputStyle = {
        width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none'
    };
    const labelStyle = { display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0F0F1A', paddingTop: '80px', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* --- HEADER --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Faculty Reviews</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Anonymous feedback for juniors</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} style={{ 
                        padding: '10px 20px', borderRadius: '30px', border: 'none',
                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Write Review</>}
                    </button>
                </div>

                {/* --- SEARCH & SORT BAR (New Feature) --- */}
                {!showForm && (
                    <GlassCard style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        
                        {/* Search Input */}
                        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input 
                                type="text" 
                                placeholder="Search Faculty or Course..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)' }} 
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div style={{ position: 'relative', minWidth: '150px' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <select 
                                value={sortOption} 
                                onChange={(e) => setSortOption(e.target.value)}
                                style={{ ...glassInputStyle, paddingLeft: '40px', background: 'rgba(255,255,255,0.05)', appearance: 'none', cursor: 'pointer' }}
                            >
                                <option style={{color:'black'}} value="newest">Newest First</option>
                                <option style={{color:'black'}} value="highest">Highest Rated</option>
                                <option style={{color:'black'}} value="lowest">Lowest Rated</option>
                            </select>
                        </div>
                    </GlassCard>
                )}

                {/* --- ADD REVIEW FORM --- */}
                {showForm && (
                    <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            
                            {/* Row 1 */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Faculty Name</label>
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="facultyName" placeholder="Dr. Name" required value={formData.facultyName} onChange={handleChange} style={glassInputStyle} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Co-Faculty (Optional)</label>
                                    <Users size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="coFaculty" placeholder="Prof. Name" value={formData.coFaculty} onChange={handleChange} style={glassInputStyle} />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Course Code</label>
                                    <Code size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="courseCode" placeholder="CSE1001" required value={formData.courseCode} onChange={handleChange} style={glassInputStyle} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Course Name</label>
                                    <Book size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="courseName" placeholder="Subject Name" required value={formData.courseName} onChange={handleChange} style={glassInputStyle} />
                                </div>
                            </div>

                            {/* Row 3 - Updated Internals & Mobile */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Internals Marks (Average)</label>
                                    <GraduationCap size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    {/* Changed to Number Input */}
                                    <input 
                                        type="number" 
                                        name="internals" 
                                        placeholder="e.g. 45" 
                                        required 
                                        value={formData.internals} 
                                        onChange={handleChange} 
                                        style={glassInputStyle} 
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0 15px', borderRadius: '12px', height: '48px', marginTop: '29px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Smartphone size={16}/> Mobile Allowed?
                                    </span>
                                    {/* Green/Red Toggle */}
                                    <div 
                                        onClick={() => setFormData(prev => ({...prev, mobileAllowed: !prev.mobileAllowed}))} 
                                        style={{ 
                                            width: '44px', height: '24px', 
                                            background: formData.mobileAllowed ? '#10B981' : '#EF4444', // Green if Allowed, Red if Not
                                            borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' 
                                        }}
                                    >
                                        <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '23px' : '3px', transition: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label style={labelStyle}>Rating</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} size={32} 
                                            fill={star <= formData.rating ? "#FBBF24" : "none"} 
                                            color={star <= formData.rating ? "#FBBF24" : "#4B5563"} 
                                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }} 
                                            onClick={() => setFormData(prev => ({ ...prev, rating: star }))} 
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Feedback */}
                            <div>
                                <label style={labelStyle}>Feedback</label>
                                <textarea name="feedback" rows="3" placeholder="Write your review..." required value={formData.feedback} onChange={handleChange} style={{...glassInputStyle, padding: '12px', resize: 'none'}} />
                            </div>

                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                {loading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </GlassCard>
                )}

                {/* --- REVIEWS LIST --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredReviews.length === 0 ? (
                        <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center', marginTop: '2rem' }}>No reviews found.</p>
                    ) : (
                        filteredReviews.map((review) => (
                            <GlassCard key={review.id} style={{ padding: '1.5rem', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}>
                                
                                {/* Header: Name & Star */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{review.facultyName}</h3>
                                        {review.coFaculty && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#aaa' }}>& {review.coFaculty}</p>}
                                    </div>
                                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '5px 10px', borderRadius: '8px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                        <Star size={14} fill="#FBBF24"/> {review.rating}
                                    </div>
                                </div>

                                {/* Details Grid - No Emojis, Glass Icons Only */}
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Book size={16} color="#8B5CF6" /> 
                                        <span>{review.courseCode}</span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <GraduationCap size={16} color="#EC4899" /> 
                                        <span>{review.internals} Internals</span>
                                    </div>
                                    
                                    {/* Mobile Status: Green for Allowed, Red for Not Allowed */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: review.mobileAllowed ? '#34D399' : '#F87171' }}>
                                        <Smartphone size={16} /> 
                                        <span>{review.mobileAllowed ? "Mobile Allowed" : "Mobile Not Allowed"}</span>
                                    </div>
                                </div>

                                {/* Feedback Box */}
                                <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#eee', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', lineHeight: '1.5', borderLeft: '3px solid #3B82F6' }}>
                                    "{review.feedback}"
                                </p>
                                
                                {/* REMOVED "By [Student Name]" line as requested */}
                                
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FacultyReviews;
