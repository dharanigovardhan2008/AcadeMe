import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, Calendar, Users, BookOpen,
  TrendingUp, MessageSquare, ArrowRight,
  Megaphone, ExternalLink,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

/* ── Cache helpers ── */
const CACHE_DURATION = 300000;
const getFromCache = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    const timestamp = sessionStorage.getItem(`${key}_time`);
    if (!cached || !timestamp) return null;
    if (Date.now() - parseInt(timestamp, 10) > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}_time`);
      return null;
    }
    return JSON.parse(cached);
  } catch { return null; }
};
const saveToCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}_time`, Date.now().toString());
  } catch {}
};

/* ── Safe Firestore date ── */
const toSafeDate = (val) => {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

const Dashboard = () => {
  const { user } = useAuth();
  const { cgpaSubjects = [], attendanceSubjects = [], faculty = [] } = useData() || {};
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const cached = getFromCache('dashboard_updates');
        if (cached) setUpdates(cached);

        const q = query(collection(db, 'updates'), orderBy('date', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));

        saveToCache('dashboard_updates', list);
        setUpdates(list);
      } catch (err) {
        console.error('Updates Error:', err);
      }
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

  const quickActions = [
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'CGPA Calculator', icon: Calculator, path: '/calc' },
    { label: 'Attendance Tracker', icon: Calendar, path: '/attendance' },
    { label: 'Faculty Directory', icon: Users, path: '/faculty' },
  ];

  return (
    <DashboardLayout>
      <style>{`
        .dash-greeting {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(88,101,242,0.15), rgba(0,0,0,0.4));
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .dash-greeting h1 { font-size: 1.6rem; font-weight: 700; margin: 0; }
        .dash-greeting-icon {
          position: absolute; right: -20px; top: -20px; opacity: 0.08;
        }
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .dash-quick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .dash-review-cta {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 16px;
          position: relative; z-index: 1;
        }

        @media (min-width: 768px) {
          .dash-greeting { padding: 2rem; }
          .dash-greeting h1 { font-size: 1.8rem; }
          .dash-stats-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
          .dash-quick-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        }

        @media (max-width: 380px) {
          .dash-greeting h1 { font-size: 1.3rem; }
          .dash-stats-grid { gap: 0.75rem; }
          .dash-quick-grid { gap: 0.75rem; }
        }
      `}</style>

      {/* ── Greeting Card ── */}
      <GlassCard className="dash-greeting">
        <h1>{getGreeting()}, {userName} 👋</h1>
        <p style={{ opacity: 0.7, marginTop: 6, fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </p>
        <div style={{
          marginTop: '1rem', paddingLeft: '1rem',
          borderLeft: '3px solid #6366f1',
          fontStyle: 'italic', opacity: 0.8, fontSize: '0.88rem',
        }}>
          "Success is not final, failure is not fatal: it is the courage to continue that counts."
        </div>
        <TrendingUp size={140} className="dash-greeting-icon" />
      </GlassCard>

      {/* ── Announcements ── */}
      {updates.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <GlassCard style={{ padding: '1.25rem', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem',
            }}>
              <Megaphone size={22} color="#FBBF24" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                Latest Announcements
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {updates.map(update => (
                <div key={update.id} style={{
                  padding: '12px', background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px', borderLeft: '4px solid #FBBF24',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '4px', alignItems: 'center',
                    flexWrap: 'wrap', gap: '4px',
                  }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem', margin: 0 }}>
                      {update.title}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: '#aaa' }}>
                      {toSafeDate(update.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#ddd', margin: 0 }}>
                    {update.message}
                  </p>
                  {update.link && (
                    <a
                      href={update.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        marginTop: '8px', fontSize: '0.8rem', color: '#60A5FA',
                        textDecoration: 'none', fontWeight: 600,
                        background: 'rgba(96,165,250,0.1)',
                        padding: '4px 10px', borderRadius: '6px',
                      }}
                    >
                      <ExternalLink size={13} /> Open Resource
                    </a>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="dash-stats-grid">
        <StatCard
          icon={<TrendingUp size={24} />}
          value={currentCGPA}
          label="Current CGPA"
          color="#60A5FA"
        />
        <StatCard
          icon={<Calendar size={24} />}
          value={`${currentAttendance}%`}
          label="Attendance"
          badge={attendanceStatus}
          color={attendanceStatus === 'Safe' ? '#34D399' : '#F87171'}
        />
        <StatCard
          icon={<BookOpen size={24} />}
          value={cgpaSubjects.length}
          label="Subjects"
          color="#A78BFA"
        />
        <StatCard
          icon={<Users size={24} />}
          value={`${faculty.length}+`}
          label="Faculty"
          badge="View"
          color="#F472B6"
          onClick={() => navigate('/faculty')}
        />
      </div>

      {/* ── Faculty Reviews CTA ── */}
      <div style={{ marginBottom: '2rem' }}>
        <GlassCard
          onClick={() => navigate('/reviews')}
          style={{
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            padding: '1.5rem', border: '1px solid rgba(236,72,153,0.3)',
          }}
        >
          <div style={{
            position: 'absolute', top: '-50%', right: '-10%',
            width: '250px', height: '250px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(40px)', zIndex: 0,
          }} />
          <div className="dash-review-cta">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '50px', height: '50px',
                background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                borderRadius: '14px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageSquare size={24} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '3px', margin: 0 }}>
                  Faculty Reviews
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Rate professors & check feedback.
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#EC4899', fontWeight: 'bold', fontSize: '0.9rem',
              background: 'rgba(236,72,153,0.1)',
              padding: '8px 16px', borderRadius: '20px',
            }}>
              View <ArrowRight size={18} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Quick Actions ── */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>
        Quick Actions
      </h2>
      <div className="dash-quick-grid">
        {quickActions.map((item, idx) => (
          <GlassCard
            key={idx}
            onClick={() => navigate(item.path)}
            style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem' }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: '50%', margin: '0 auto 0.8rem',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.icon size={24} />
            </div>
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
              {item.label}
            </h3>
          </GlassCard>
        ))}
      </div>
    </DashboardLayout>
  );
};

/* ── Stat Card (responsive) ── */
const StatCard = ({ icon, value, label, badge, color, onClick }) => (
  <GlassCard
    onClick={onClick}
    style={{
      padding: '1.2rem', cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: `${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
    }}>
      {icon}
    </div>
    {badge && (
      <div style={{ position: 'absolute', right: 14, top: 14 }}>
        <Badge variant="neutral">{badge}</Badge>
      </div>
    )}
    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.8rem', margin: '0.8rem 0 0' }}>
      {value}
    </h2>
    <p style={{ opacity: 0.7, fontSize: '0.8rem', margin: '4px 0 0' }}>{label}</p>
  </GlassCard>
);

export default Dashboard;
