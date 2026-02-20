import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import GlassCard from '../components/GlassCard';
import { Star, User, Book, Code, Smartphone, MessageSquare, Plus, X, GraduationCap, Users } from 'lucide-react';

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

    // Fetch Reviews from Database
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

    // Styling constants to match your theme
    const glassInputStyle = {
        width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none'
    };
    const labelStyle = { display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0F0F1A', paddingTop: '80px', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Faculty Reviews</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Share feedback & help juniors</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} style={{ 
                        padding: '10px 20px', borderRadius: '30px', border: 'none',
                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                        {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Write Review</>}
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <GlassCard style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Faculty Name</label>
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="facultyName" placeholder="Dr. Name" required value={formData.facultyName} onChange={handleChange} style={glassInputStyle} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Co-Faculty</label>
                                    <Users size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="coFaculty" placeholder="Prof. Name" value={formData.coFaculty} onChange={handleChange} style={glassInputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Course Code</label>
                                    <Book size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="courseCode" placeholder="CSE1001" required value={formData.courseCode} onChange={handleChange} style={glassInputStyle} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Course Name</label>
                                    <Book size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <input type="text" name="courseName" placeholder="Subject Name" required value={formData.courseName} onChange={handleChange} style={glassInputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Internals</label>
                                    <GraduationCap size={18} style={{ position: 'absolute', left: '14px', top: '40px', color: '#aaa' }} />
                                    <select name="internals" value={formData.internals} onChange={handleChange} style={{...glassInputStyle, appearance: 'none'}}>
                                        <option style={{color:'black'}} value="Easy">Easy</option>
                                        <option style={{color:'black'}} value="Medium">Medium</option>
                                        <option style={{color:'black'}} value="Strict">Strict</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0 15px', borderRadius: '12px', height: '48px', marginTop: '29px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Smartphone size={16}/> Mobile Allowed?</span>
                                    <div onClick={() => setFormData(prev => ({...prev, mobileAllowed: !prev.mobileAllowed}))} style={{ width: '40px', height: '22px', background: formData.mobileAllowed ? '#10B981' : '#4B5563', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                        <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mobileAllowed ? '21px' : '3px', transition: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Rating</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={30} fill={star <= formData.rating ? "#FBBF24" : "none"} color={star <= formData.rating ? "#FBBF24" : "#4B5563"} style={{ cursor: 'pointer' }} onClick={() => setFormData(prev => ({ ...prev, rating: star }))} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Feedback</label>
                                <textarea name="feedback" rows="3" placeholder="Write your review..." required value={formData.feedback} onChange={handleChange} style={{...glassInputStyle, padding: '12px', resize: 'none'}} />
                            </div>
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#3B82F6', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Submitting...' : 'Submit Review'}</button>
                        </form>
                    </GlassCard>
                )}

                {/* Reviews List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {reviews.map((review) => (
                        <GlassCard key={review.id} style={{ padding: '1.5rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{review.facultyName}</h3>
                                <div style={{ color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} fill="#FBBF24"/> {review.rating}</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                <span>📚 {review.courseCode}</span>
                                <span>🎓 {review.internals} Internals</span>
                                <span style={{ color: review.mobileAllowed ? '#34D399' : '#EF4444' }}>📱 {review.mobileAllowed ? "Mobile ON" : "Mobile OFF"}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#ddd', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>"{review.feedback}"</p>
                            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>By {review.reviewerName}</div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyReviews;
