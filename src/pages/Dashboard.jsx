import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Calendar, Users, BookOpen, TrendingUp, MessageSquare, ArrowRight, Megaphone, Link as LinkIcon, ExternalLink, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import Lanyard from '../components/Lanyard'; // <--- IMPORT LANYARD

// Cache Logic
const CACHE_DURATION = 300000;
const getFromCache = (key) => {
  try {
      const cached = sessionStorage.getItem(key);
      const timestamp = sessionStorage.getItem(`${key}_time`);
      if (!cached || !timestamp) return null;
      if (Date.now() - parseInt(timestamp, 10) > CACHE_DURATION) {
        sessionStorage.removeItem(key); sessionStorage.removeItem(`${key}_time`);
        return null;
      }
      return JSON.parse(cached);
  } catch (e) { return null; }
};
const saveToCache = (key, data) => {
  try {
      sessionStorage.setItem(key, JSON.stringify(data));
      sessionStorage.setItem(`${key}_time`, Date.now().toString());
  } catch (e) {}
};

const Dashboard = () => {
  const { user } = useAuth();
  const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData() || {};
  const navigate = useNavigate();
  
  // --- LANYARD STATE ---
  const [showLanyard, setShowLanyard] = useState(true); // Default Visible

  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const cached = getFromCache('dashboard_updates');
        if (cached) setUpdates(cached);

        const q = query(collection(db, "updates"), orderBy("date", "desc"), limit(3));
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        
        saveToCache('dashboard_updates', list);
        setUpdates(list);
      } catch (err) { console.error("Updates Error:", err); }
    };
    fetchUpdates();
  }, []);

  const calculateCGPA = () => {
    if (!cgpaSubjects?.length) return 0;
    const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
    const total = cgpaSubjects.reduce((sum, s) => sum + (gradePoints[s.grade] || 0), 0);
    return (total / cgpaSubjects.length).toFixed(2);
  };

  const calculateAttendance = () => {
    if (!attendanceSubjects?.length) return 0;
    const total = attendanceSubjects.reduce((s, x) => s + Number(x.total || 0), 0);
    const attended = attendanceSubjects.reduce((s, x) => s + Number(x.attended || 0), 0);
    return total ? ((attended / total) * 100).toFixed(0) : 0;
  };

  const currentCGPA = calculateCGPA();
  const currentAttendance = calculateAttendance();
  const attendanceStatus = currentAttendance >= 80 ? 'Safe' : 'Low';
  const userName = user?.name ? user.name.split(' ')[0] : 'Student';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  const quickActions = [
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'CGPA Calculator', icon: Calculator, path: '/calc' },
    { label: 'Attendance Tracker', icon: Calendar, path: '/attendance' },
    { label: 'Faculty Directory', icon: Users, path: '/faculty' },
  ];

  return (
    <DashboardLayout>
      
      {/* --- 3D ID CARD OVERLAY --- */}
      {showLanyard && (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => setShowLanyard(false)} // Click anywhere to dismiss
        >
            <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', cursor: 'pointer', zIndex: 10000 }}>
                <X size={32} />
            </div>
            
            {/* Lanyard Component */}
            <div style={{ width: '100%', height: '100%' }}>
                <Lanyard />
            </div>

            {/* User Info Overlay (Simulates Dynamic Text on Card) */}
            <div style={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -20%)', 
                textAlign: 'center', color: 'black', pointerEvents: 'none',
                background: 'white', padding: '20px', borderRadius: '15px', width: '220px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{user?.name || "Student Name"}</h2>
                <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#555' }}>{user?.regNo || "12345678"}</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '5px' }}>
                    <span style={{ background: '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{user?.branch || "CSE"}</span>
                    <span style={{ background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{user?.year || "1st Year"}</span>
                </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: '50px', color: 'white', opacity: 0.7 }}>
                Tap anywhere to enter Dashboard
            </div>
        </div>
      )}

      {/* --- DASHBOARD CONTENT --- */}
      <GlassCard style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(88,101,242,0.15), rgba(0,0,0,0.4))', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{greeting}, {userName} 👋</h1>
        <p style={{ opacity: 0.7, marginTop: 6 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #6366f1', fontStyle: 'italic', opacity: 0.8 }}>"Success is not final, failure is not fatal: it is the courage to continue that counts."</div>
        <TrendingUp size={160} style={{ position: 'absolute', right: -20, top: -20, opacity: 0.08 }} />
      </GlassCard>

      {/* UPDATES */}
      {updates.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
            <GlassCard style={{ padding: '1.5rem', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <Megaphone size={24} color="#FBBF24" />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Latest Announcements</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {updates.map(update => (
                        <div key={update.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', borderLeft: '4px solid #FBBF24' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems:'center' }}>
                                <h4 style={{ fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>{update.title}</h4>
                                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{new Date(update.date).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#ddd', margin: 0 }}>{update.message}</p>
                            {update.link && (
                                <a href={update.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '10px', fontSize: '0.85rem', color: '#60A5FA', textDecoration: 'none', fontWeight: '600', background: 'rgba(96, 165, 250, 0.1)', padding: '5px 10px', borderRadius: '6px' }}>
                                    <ExternalLink size={14} /> Open Resource
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<TrendingUp size={26} />} value={currentCGPA} label="Current CGPA" color="#60A5FA" />
        <StatCard icon={<Calendar size={26} />} value={`${currentAttendance}%`} label="Overall Attendance" badge={attendanceStatus} color={attendanceStatus === 'Safe' ? '#34D399' : '#F87171'} />
        <StatCard icon={<BookOpen size={26} />} value={cgpaSubjects.length} label="Active Subjects" color="#A78BFA" />
        <StatCard icon={<Users size={26} />} value={`${faculty.length}+`} label="Faculty Members" badge="View All" color="#F472B6" onClick={() => navigate('/faculty')} />
      </div>

      {/* FACULTY REVIEWS */}
      <div style={{ marginBottom: '2.5rem' }}>
        <GlassCard onClick={() => navigate('/reviews')} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #EC4899, #BE185D)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquare size={30} color="white" /></div>
                    <div><h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '5px' }}>Faculty Reviews</h2><p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Rate professors & check feedback.</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EC4899', fontWeight: 'bold', fontSize: '1rem', background: 'rgba(236, 72, 153, 0.1)', padding: '10px 20px', borderRadius: '30px' }}>View Reviews <ArrowRight size={20} /></div>
            </div>
        </GlassCard>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {quickActions.map((item, idx) => (
          <GlassCard key={idx} onClick={() => navigate(item.path)} style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 1rem', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={28} /></div>
            <h3 style={{ fontWeight: 600 }}>{item.label}</h3>
          </GlassCard>
        ))}
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ icon, value, label, badge, color, onClick }) => (
  <GlassCard onClick={onClick} style={{ padding: '1.8rem', cursor: onClick ? 'pointer' : 'default', position: 'relative' }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
    {badge && <div style={{ position: 'absolute', right: 20, top: 20 }}><Badge variant="neutral">{badge}</Badge></div>}
    <h2 style={{ fontSize: '2.4rem', fontWeight: 700, marginTop: '1rem' }}>{value}</h2>
    <p style={{ opacity: 0.7 }}>{label}</p>
  </GlassCard>
);

export default Dashboard;
