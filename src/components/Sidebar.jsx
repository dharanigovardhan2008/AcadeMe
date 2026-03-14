import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User,
    Settings, Shield, LogOut, MessageCircle, MessageSquare, Layers, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [showFeedback, setShowFeedback] = useState(false);

    // Listen for TopBar's open-feedback event so both buttons open the same modal
    React.useEffect(() => {
        const handler = () => setShowFeedback(true);
        window.addEventListener('open-feedback', handler);
        return () => window.removeEventListener('open-feedback', handler);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/leaderboard',    label: 'Leaderboard',       icon: Trophy },
        { path: '/dashboard',      label: 'Dashboard',         icon: Home },
        { path: '/courses',        label: 'My Courses',        icon: BookOpen },
        { path: '/common-courses', label: 'Common Courses',    icon: Layers },
        { path: '/calc',           label: 'CGPA Calculator',   icon: Calculator },
        { path: '/attendance',     label: 'Attendance',        icon: Calendar },
        { path: '/faculty',        label: 'Faculty Directory', icon: Users },
        { path: '/reviews',        label: 'Faculty Reviews',   icon: MessageSquare },
        { path: '/resources',      label: 'Resources Hub',     icon: BookOpen },
        { path: '/profile',        label: 'Profile',           icon: User },
        { path: '/settings',       label: 'Settings',          icon: Settings },
    ];

    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
    }

    return (
        <aside
            className="sidebar-desktop"
            style={{
                width: '280px', height: '100vh',
                position: 'fixed', left: 0, top: 0,
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column',
                zIndex: 50,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease-in-out',
            }}
        >
            {/* ── Logo ── */}
            <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={logo} alt="AcadeMe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>AcadeMe</h2>
            </div>

            {/* ── Nav ── */}
            <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {navItems.map((item, idx) => (
                        <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                            <NavLink
                                to={item.path}
                                onClick={toggleSidebar}
                                style={({ isActive }) => ({
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '12px 16px', borderRadius: '12px',
                                    textDecoration: 'none', transition: 'all 0.3s ease',
                                    fontSize: '0.9rem',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    // Leaderboard (idx 0) gets gold accent, rest get blue
                                    background: idx === 0
                                        ? (isActive ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.06)')
                                        : (isActive ? 'rgba(59,130,246,0.15)' : 'transparent'),
                                    border: idx === 0
                                        ? `1px solid ${isActive ? 'rgba(251,191,36,0.45)' : 'rgba(251,191,36,0.18)'}`
                                        : (isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent'),
                                    borderLeft: idx === 0
                                        ? `4px solid ${isActive ? '#FBBF24' : 'rgba(251,191,36,0.35)'}`
                                        : (isActive ? '4px solid var(--primary)' : '1px solid transparent'),
                                })}
                            >
                                <item.icon size={20} color={idx === 0 ? '#FBBF24' : undefined} />
                                {item.label}
                            </NavLink>

                            {/* Divider after Leaderboard */}
                            {idx === 0 && (
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.5rem 0.5rem 0' }} />
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* ── Bottom ── */}
            <div style={{ padding: '0 1rem 1rem' }}>

                {/* Feedback — only social link remaining */}
                <button
                    onClick={() => setShowFeedback(true)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                    style={{
                        width: '100%', padding: '11px 16px', marginBottom: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '12px', cursor: 'pointer',
                        color: '#60A5FA', fontSize: '0.9rem', fontWeight: '500',
                        transition: 'background 0.2s ease',
                    }}
                >
                    <MessageCircle size={18} />
                    Send Feedback
                </button>

                {/* User card */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px', marginBottom: '0.75rem',
                    background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <img src={userAvatar} alt="Profile"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', background: '#1a1a1a', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'User'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {user?.branch || 'Student'}
                        </p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="hover-danger"
                    style={{
                        width: '100%', padding: '12px',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        background: 'rgba(239,68,68,0.1)', color: '#FCA5A5',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '12px', cursor: 'pointer',
                        transition: 'all 0.3s ease', fontSize: '0.9rem',
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>

            <style>{`
                @media (min-width: 768px) { .sidebar-desktop { transform: translateX(0) !important; } }
                .hover-danger:hover { background: rgba(239,68,68,0.2) !important; }
            `}</style>

            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        </aside>
    );
};

export default Sidebar;
