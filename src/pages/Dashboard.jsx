import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Calendar, Users, BookOpen, TrendingUp, CheckCircle, MessageCircle, Bell, Clock, Award, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, where, orderBy } from 'firebase/firestore';

// ============ CACHING UTILITY (Optimized) ============
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes Cache

const getFromCache = (key) => {
    try {
        const cached = sessionStorage.getItem(key);
        const timestamp = sessionStorage.getItem(`${key}_time`);
        if (!cached || !timestamp) return null;
        const age = Date.now() - parseInt(timestamp);
        if (age > CACHE_DURATION) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
            return null;
        }
        return JSON.parse(cached);
    } catch (e) { return null; }
};

const saveToCache = (key, data) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem(`${key}_time`, Date.now().toString());
    } catch (e) { console.warn("Cache quota exceeded"); }
};
// ============ END CACHING UTILITY ============

const Dashboard = () => {
    const { user } = useAuth();
    const { cgpaSubjects, attendanceSubjects, faculty } = useData();
    const navigate = useNavigate();
    const [updates, setUpdates] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) return;

            // 1. FETCH UPDATES (With Cache)
            let updatesList = getFromCache('dashboard_updates');
            if (!updatesList) {
                try {
                    const q = query(collection(db, "updates"), orderBy("date", "desc"), limit(5));
                    const snapshot = await getDocs(q);
                    updatesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    saveToCache('dashboard_updates', updatesList);
                } catch (error) { console.error("Updates fetch error", error); }
            }
            setUpdates(updatesList || []);

            // 2. FETCH REVIEWS (With Cache & Limit)
            const reviewCacheKey = `dashboard_reviews_${user.uid}`;
            let reviewsList = getFromCache(reviewCacheKey);
            if (!reviewsList) {
                try {
                    // OPTIMIZATION: Added limit(5) to prevent reading history of 100s of reviews
                    const q = query(collection(db, "reviews"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
                    const snapshot = await getDocs(q);
                    reviewsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    saveToCache(reviewCacheKey, reviewsList);
                } catch (error) { console.error("Reviews fetch error", error); }
            }
            setMyReviews(reviewsList || []);
            
            setLoadingData(false);
        };

        fetchData();
    }, [user?.uid]);

    // Stats Calculation
    const calculateCGPA = () => {
        if (!cgpaSubjects.length) return "0.00";
        const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
        const total = cgpaSubjects.reduce((sum, s) => sum + (gradePoints[s.grade] || 0), 0);
        return (total / cgpaSubjects.length).toFixed(2);
    }
    const currentCGPA = calculateCGPA();

    const calculateAttendance = () => {
        if (!attendanceSubjects.length) return 0;
        const totalClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.total), 0);
        const attendedClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.attended), 0);
        return totalClasses ? ((attendedClasses / totalClasses) * 100).toFixed(0) : 0;
    }
    const currentAttendance = calculateAttendance();
    const attendanceStatus = currentAttendance >= 75 ? 'Safe' : 'Low';

    // Skeleton Loader (Matches layout)
    if (loadingData && !updates.length) { // Only show if no cache data exists
        return (
            <DashboardLayout>
                <div className="skeleton-pulse" style={{ height: '180px', borderRadius: '16px', marginBottom: '2rem' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {[1,2,3,4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '140px', borderRadius: '16px' }}></div>)}
                </div>
            </DashboardLayout>
        );
    }

    const quickActions = [
        { label: 'My Courses', icon: BookOpen, path: '/courses', color: '#A78BFA' },
        { label: 'CGPA Calc', icon: Calculator, path: '/calc', color: '#60A5FA' },
        { label: 'Attendance', icon: Calendar, path: '/attendance', color: '#34D399' },
        { label: 'Faculty', icon: Users, path: '/faculty', color: '#F472B6' },
    ];

    // Avatar Logic: Use selected avatar OR initials fallback
    const displayAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    return (
        <DashboardLayout>
            {/* Welcome Section - ANIMATED */}
            <GlassCard className="mb-6 relative overflow-hidden reveal-scale" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)' }}>
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <img 
                        src={displayAvatar} 
                        alt="Profile" 
                        style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', 
                            border: '3px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', background: '#1a1a1a', objectFit: 'cover'
                        }} 
                    />
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                            Hello, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                            {user?.branch} • {user?.year || 'Student'}
                        </p>
                    </div>
                </div>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
                    <TrendingUp size={150} color="white" />
                </div>
            </GlassCard>

            {/* Stats Row - ANIMATED & STAGGERED */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                
                <GlassCard className="card-3d reveal-up stagger-1">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
                            <Award size={24} />
                        </div>
                        <Badge variant="primary">Target 9.0</Badge>
                    </div>
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentCGPA}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Current CGPA</p>
                </GlassCard>

                <GlassCard className="card-3d reveal-up stagger-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>
                            <Calendar size={24} />
                        </div>
                        <Badge variant={attendanceStatus === 'Safe' ? 'success' : 'destructive'}>{attendanceStatus}</Badge>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: attendanceStatus === 'Safe' ? '#34D399' : '#F87171' }}>{currentAttendance}%</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Attendance</p>
                </GlassCard>

                <GlassCard className="card-3d reveal-up stagger-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' }}>
                            <BookOpen size={24} />
                        </div>
                        <Badge variant="neutral">Active</Badge>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{cgpaSubjects.length}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Subjects</p>
                </GlassCard>

                <GlassCard className="card-3d reveal-up stagger-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', color: '#F472B6' }}>
                            <Clock size={24} />
                        </div>
                        <Badge variant="destructive">Due Soon</Badge>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>0</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Assignments</p>
                </GlassCard>
            </div>

            {/* Quick Actions - ANIMATED */}
            <h2 className="reveal-up" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Quick Actions</h2>
            <div className="reveal-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {quickActions.map((action, idx) => (
                    <GlassCard
                        key={idx}
                        className="card-3d"
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}
                        onClick={() => navigate(action.path)}
                    >
                        <div style={{ padding: '15px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: action.color }}>
                            <action.icon size={30} />
                        </div>
                        <h3 style={{ fontWeight: '600' }}>{action.label}</h3>
                    </GlassCard>
                ))}
            </div>

            {/* Updates & Reviews - GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

                {/* Notifications Panel */}
                <div className="reveal-up stagger-1">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell size={20} /> Notifications
                    </h2>
                    <GlassCard style={{ minHeight: '200px' }}>
                        {updates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                <AlertCircle style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p>No new updates.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {updates.map(update => (
                                    <div key={update.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                            <h4 style={{ fontWeight: '600' }}>{update.title}</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {update.date ? new Date(update.date).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{update.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Feedback Panel */}
                <div className="reveal-up stagger-2">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageCircle size={20} /> My Feedback
                    </h2>
                    <GlassCard style={{ minHeight: '200px' }}>
                        {myReviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                <p>You haven't posted any feedback.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {myReviews.map(review => (
                                    <div key={review.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                            <Badge variant={review.status === 'replied' ? 'success' : 'neutral'}>
                                                {review.status === 'replied' ? 'Replied' : 'Pending'}
                                            </Badge>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: review.reply ? '0.5rem' : '0' }}>
                                            "{review.message}"
                                        </p>
                                        {review.reply && (
                                            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', borderLeft: '2px solid #10B981' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                                    <MessageCircle size={12} color="#34D399" />
                                                    <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 'bold' }}>Admin Reply</span>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{review.reply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
