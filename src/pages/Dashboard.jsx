import { useNavigate } from 'react-router-dom';
import { Calculator, Calendar, Users, BookOpen, TrendingUp, CheckCircle, MessageCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

// ============ ADDED CACHING UTILITY ============
const CACHE_DURATION = 300000; // 5 minutes

const getFromCache = (key) => {
const cached = sessionStorage.getItem(key);
const timestamp = sessionStorage.getItem(${key}_time);
if (!cached || !timestamp) return null;
const age = Date.now() - parseInt(timestamp);
if (age > CACHE_DURATION) {
sessionStorage.removeItem(key);
sessionStorage.removeItem(${key}_time);
return null;
}
return JSON.parse(cached);
};

const saveToCache = (key, data) => {
sessionStorage.setItem(key, JSON.stringify(data));
sessionStorage.setItem(${key}_time, Date.now().toString());
};
// ============ END CACHING UTILITY ============

const Dashboard = () => {
const { user } = useAuth();
const { cgpaSubjects, attendanceSubjects, faculty } = useData();
const navigate = useNavigate();
const [updates, setUpdates] = useState([]);
const [myReviews, setMyReviews] = useState([]);

text

useEffect(() => {
    const fetchUpdates = async () => {
        try {
            // ============ CHECK CACHE FIRST ============
            const cached = getFromCache('dashboard_updates');
            if (cached) {
                setUpdates(cached);
                return;
            }
            // ============ END CACHE CHECK ============

            const q = query(collection(db, "updates"), limit(10));
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            list.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });
            const finalList = list.slice(0, 5);
            setUpdates(finalList);
            
            // ============ SAVE TO CACHE ============
            saveToCache('dashboard_updates', finalList);
            // ============ END SAVE TO CACHE ============
        } catch (error) {
            console.error("Error fetching updates:", error);
        }
    };

    const fetchMyReviews = async () => {
        if (!user?.uid) return;
        try {
            // ============ CHECK CACHE FIRST ============
            const cacheKey = `dashboard_reviews_${user.uid}`;
            const cached = getFromCache(cacheKey);
            if (cached) {
                setMyReviews(cached);
                return;
            }
            // ============ END CACHE CHECK ============

            const q = query(collection(db, "reviews"), where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            list.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
            setMyReviews(list);
            
            // ============ SAVE TO CACHE ============
            saveToCache(cacheKey, list);
            // ============ END SAVE TO CACHE ============
        } catch (error) {
            console.error("Error fetching my reviews:", error);
        }
    };

    fetchUpdates();
    fetchMyReviews();
}, [user]);

// Stats Calculation
const calculateCGPA = () => {
    if (!cgpaSubjects.length) return 0;
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
const attendanceStatus = currentAttendance >= 80 ? 'Safe' : 'Low';

const quotes = [
    "The only way to do great work is to love what you do.",
    "Education is the most powerful weapon which you can use to change the world.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts."
];
const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

const quickActions = [
    { label: 'My Courses', icon: BookOpen, path: '/courses', color: 'text-purple-400' },
    { label: 'CGPA Calculator', icon: Calculator, path: '/calc', color: 'text-blue-400' },
    { label: 'Attendance Tracker', icon: Calendar, path: '/attendance', color: 'text-green-400' },
    { label: 'Faculty Directory', icon: Users, path: '/faculty', color: 'text-pink-400' },
];

return (
    <DashboardLayout>
        {/* Welcome Section */}
        <GlassCard className="mb-6 relative overflow-hidden" style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative', zIndex: 10 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Good Morning, {user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    "{randomQuote}"
                </div>
            </div>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
                <TrendingUp size={150} color="white" />
            </div>
        </GlassCard>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
                        <TrendingUp size={24} />
                    </div>
                    <Badge variant="primary">Top 15%</Badge>
                </div>
                <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentCGPA}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Current CGPA</p>
            </GlassCard>

            <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>
                        <Calendar size={24} />
                    </div>
                    <Badge variant={attendanceStatus === 'Safe' ? 'success' : 'danger'}>{attendanceStatus}</Badge>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: attendanceStatus === 'Safe' ? '#34D399' : '#F87171' }}>{currentAttendance}%</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Overall Attendance</p>
            </GlassCard>

            <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' }}>
                        <BookOpen size={24} />
                    </div>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{cgpaSubjects.length}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Active Subjects</p>
            </GlassCard>

            <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', color: '#F472B6' }}>
                        <Users size={24} />
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/faculty')}>View All</button>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{faculty.length}+</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Faculty Members</p>
            </GlassCard>
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {quickActions.map((action, idx) => (
                <GlassCard
                    key={idx}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}
                    onClick={() => navigate(action.path)}
                >
                    <div style={{ padding: '15px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <action.icon size={30} />
                    </div>
                    <h3 style={{ fontWeight: '600' }}>{action.label}</h3>
                </GlassCard>
            ))}
        </div>

        {/* Recent Updates & Activity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

            {/* Admin Updates Section */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Notifications</h2>
                <GlassCard style={{ marginBottom: '1.5rem' }}>
                    {updates.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No new updates.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {updates.map(update => (
                                <div key={update.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                        <h4 style={{ fontWeight: '600' }}>{update.title}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(update.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{update.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Feedback</h2>
                <GlassCard>
                    {myReviews.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>You haven't sent any feedback yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {myReviews.slice(0, 3).map(review => (
                                <div key={review.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <Badge variant={review.status === 'replied' ? 'success' : 'neutral'}>
                                            {review.status === 'replied' ? 'Replied' : 'Pending'}
                                        </Badge>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {new Date(review.createdAt).toLocaleDateString()}
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
                            {myReviews.length > 3 && (
                                <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
                                    View All
                                </button>
                            )}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Recent Activity Section */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Activity</h2>
                <GlassCard>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { title: 'Updated CGPA', time: '2 hours ago', icon: TrendingUp },
                            { title: 'Marked attendance for DSA', time: 'Yesterday', icon: CheckCircle },
                            { title: 'Downloaded Networks PDF', time: '2 days ago', icon: BookOpen }
                        ].map((activity, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: idx < 2 ? '1rem' : 0, borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                                    <activity.icon size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '500' }}>{activity.title}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    </DashboardLayout>
);
};

export default Dashboard;
