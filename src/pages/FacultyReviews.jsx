import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import { Star, User, Book, Code, Smartphone, MessageSquare, Plus, X, Save, Search, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FacultyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        facultyName: '',
        coFaculty: '',
        courseCode: '',
        courseName: '',
        internals: 'Easy', 
        mobileAllowed: false,
        rating: 0,
        feedback: ''
    });

    const navigate = useNavigate();

    // Fetch Reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const q = query(collection(db, "facultyReviews"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReviews(reviewsData);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            }
        };
        fetchReviews();
    }, []);

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
                reviewerName: auth.currentUser.displayName || "Anonymous",
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

    // Style for inputs to match your Signup.jsx
    const glassInputStyle = {
        width: '100%', 
        padding: '14px 14px 14px 45px', 
        background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '14px', 
        color: 'white', 
        outline: 'none', 
        transition: 'all 0.3s'
    };

    const labelStyle = { display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' };

    return (
        <div style={{ 
            minHeight: '100vh', 
            padding: '20px', 
            background: '#05050A', 
            position: 'relative', 
            overflowX: 'hidden',
            paddingTop: '80px' // Assuming you have a top navbar
        }}>
            
            {/* --- Background Effects (Matching Login.jsx) --- */}
            <div className="bg-tech-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, zIndex: 0, pointerEvents: 'none' }}></div>
            <div className="animate-float" style={{ position: 'absolute', top: '10%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
            <div className="animate-float-delay" style={{ position: 'absolute', top: '40%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Faculty Reviews</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Share your feedback and help your juniors.</p>
                    </div>
                    
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        style={{ 
                            padding: '12px 24px', 
                            borderRadius: '30px', 
                            background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #EC4899, #8B5CF6)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Review</>}
                    </button>
                </div>

                {/* --- ADD REVIEW FORM --- */}
                {showForm && (
                    <div className="reveal-up" style={{ marginBottom: '3rem' }}>
                        <GlassCard style={{ padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MessageSquare size={20} color="#EC4899"/> Write a Review
                            </h3>
                            
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    {/* Faculty Name */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Faculty Name</label>
                                        <User size={18} style={{ position: 'absolute', left: '16px', top: '42px', color: 'var(--text-secondary)' }} />
                                        <input type="text" name="facultyName" placeholder="Dr. Name" required value={formData.facultyName} onChange={handleChange} style={glassInputStyle} />
                                    </div>

                                    {/* Co-Faculty */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Co-Faculty Name (Optional)</label>
                                        <Users size={18} style={{ position: 'absolute', left: '16px', top: '42px', color: 'var(--text-secondary)' }} />
                                        <input type="text" name="coFaculty" placeholder="Prof. Name" value={formData.coFaculty} onChange={handleChange} style={glassInputStyle} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    {/* Course Code */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Course Code</label>
                                        <Code size={18} style={{ position: 'absolute', left: '16px', top: '42px', color: 'var(--text-secondary)' }} />
                                        <input type="text" name="courseCode" placeholder="e.g. CSE1002" required value={formData.courseCode} onChange={handleChange} style={glassInputStyle} />
                                    </div>

                                    {/* Course Name */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Course Name</label>
                                        <Book size={18} style={{ position: 'absolute', left: '16px', top: '42px', color: 'var(--text-secondary)' }} />
                                        <input type="text" name="courseName" placeholder="e.g. Data Structures" required value={formData.courseName} onChange={handleChange} style={glassInputStyle} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                                    
                                    {/* Internals */}
                                    <div style={{ position: 'relative' }}>
                                        <label style={labelStyle}>Internals Grading</label>
                                        <GraduationCap size={18} style={{ position: 'absolute', left: '16px', top: '42px', color: 'var(--text-secondary)' }} />
                                        <select name="internals" value={formData.internals} onChange={handleChange} style={{ ...glassInputStyle, appearance: 'none', cursor: 'pointer' }}>
                                            <option value="Easy" style={{color:'black'}}>Easy (Good Marks)</option>
                                            <option value="Medium" style={{color:'black'}}>Medium</option>
                                            <option value="Strict" style={{color:'black'}}>Strict (Hard Grading)</option>
                                        </select>
                                    </div>

                                    {/* Mobile Toggle */}
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '52px' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Smartphone size={18} /> Mobile Allowed?
                                        </span>
                                        <div 
                                            onClick={() => setFormData(prev => ({...prev, mobileAllowed: !prev.mobileAllowed}))}
                                            style={{ 
                                                width: '50px', height: '26px', background: formData.mobileAllowed ? '#10B981' : 'rgba(255,255,255,0.2)', 
                                                borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                                            }}
                                        >
                                            <div style={{ 
                                                width: '20px', height: '20px', background: 'white', borderRadius: '50%', 
                                                position: 'absolute', top: '3px', left: formData.mobileAllowed ? '27px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div>
                                    <label style={labelStyle}>Rating (5 Stars)</label>
                                    <div style={{ display: 'flex', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', width: 'fit-content' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                                key={star} size={32} 
                                                fill={star <= formData.rating ? "#FBBF24" : "none"} 
                                                color={star <= formData.rating ? "#FBBF24" : "rgba(255,255,255,0.3)"}
                                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <label style={labelStyle}>Feedback</label>
                                    <textarea name="feedback" rows="4" placeholder="Share your honest experience..." required value={formData.feedback} onChange={handleChange} 
                                        style={{ ...glassInputStyle, padding: '14px', resize: 'none' }} />
                                </div>

                                <button type="submit" disabled={loading} style={{ 
                                    width: '100%', padding: '14px', marginTop: '10px', borderRadius: '14px', 
                                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', border: 'none',
                                    color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
                                    boxShadow: '0 5px 15px rgba(59, 130, 246, 0.4)', transition: 'transform 0.2s'
                                }}>
                                    {loading ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        </GlassCard>
                    </div>
                )}

                {/* --- DISPLAY REVIEWS --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {reviews.map((review, index) => (
                        <div key={review.id} className="reveal-up" style={{ animationDelay: `${index * 0.1}s` }}>
                            <GlassCard style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {/* Card Header */}
                                <div style={{ padding: '1.5rem', background: 'linear-gradient(to right, rgba(255,255,255,0.03), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{review.facultyName}</h3>
                                            {review.coFaculty && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>& {review.coFaculty}</div>}
                                        </div>
                                        <div style={{ background: 'rgba(251, 191, 36, 0.15)', padding: '6px 10px', borderRadius: '10px', color: '#FBBF24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Star size={16} fill="#FBBF24"/> {review.rating}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '1.5rem', flex: 1 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#E0E7FF' }}>
                                            <Book size={14} color="#8B5CF6"/> {review.courseCode}
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#E0E7FF' }}>
                                            <GraduationCap size={14} color="#EC4899"/> {review.internals}
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2', color: review.mobileAllowed ? '#34D399' : '#F87171' }}>
                                            <Smartphone size={14} /> {review.mobileAllowed ? "Mobiles Allowed" : "No Mobiles Allowed"}
                                        </div>
                                    </div>

                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1rem' }}>
                                        "{review.feedback}"
                                    </p>
                                </div>

                                {/* Card Footer */}
                                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                    <span>{review.courseName}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={12}/> {review.reviewerName}</span>
                                </div>
                            </GlassCard>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyReviews;
