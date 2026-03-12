import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User,
    Settings, Shield, LogOut, Youtube, Instagram, Mail,
    MessageCircle, MessageSquare, Layers, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [showFeedback, setShowFeedback] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/dashboard',      label: 'Dashboard',        icon: Home },
        { path: '/courses',        label: 'My Courses',        icon: BookOpen },
        { path: '/common-courses', label: 'Common Courses',    icon: Layers },
        { path: '/calc',           label: 'CGPA Calculator',   icon: Calculator },
        { path: '/attendance',     label: 'Attendance',        icon: Calendar },
        { path: '/faculty',        label: 'Faculty Directory', icon: Users },
        { path: '/reviews',        label: 'Faculty Reviews',   icon: MessageSquare },
        { path: '/resources',      label: 'Resources Hub',     icon: BookOpen },
        { path: '/leaderboard',    label: 'Leaderboard',       icon: Trophy,     badge: 'NEW' },
        { path: '/profile',        label: 'Profile',           icon: User },
        { path: '/settings',       label: 'Settings',          icon: Settings },
    ];

    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
    }

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 40,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(3px)',
                    }}
                />
            )}

            <aside
                style={{
                    width: '280px',
                    height: '100vh',
                    position: 'fixed',
                    left: 0, top: 0,
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    overflowY: 'auto',
                }}
                className="sidebar-desktop"
            >
                {/* Logo */}
                <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={logo} alt="AcadeMe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h2 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>AcadeMe</h2>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {navItems.map((item) => (
                            <li key={item.path} style={{ marginBottom: '0.4rem' }}>
                                <NavLink
                                    to={item.path}
                                    onClick={toggleSidebar}
                                    style={({ isActive }) => ({
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '12px 16px', borderRadius: '12px',
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                        background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                                        border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                                        borderLeft: isActive ? '4px solid var(--primary)' : '1px solid transparent',
                                        textDecoration: 'none', transition: 'all 0.3s ease',
                                        fontSize: '0.9rem',
                                    })}
                                >
                                    <item.icon size={20} style={{ flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {item.badge && (
                                        <span style={{
                                            fontSize: '0.62rem', fontWeight: '700',
                                            background: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
                                            color: '#0f0f1a', padding: '2px 7px', borderRadius: '10px',
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom section */}
                <div style={{ padding: '0 1rem 1rem', flexShrink: 0 }}>
                    {/* Social + Feedback row */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                        marginBottom: '1rem', padding: '10px',
                        background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                    }}>
                        <a href="https://youtube.com/@genxmind-m8r?si=xHZeCJ3ZRTMjmePF"
                            target="_blank" rel="noreferrer"
                            style={{ color: '#EF4444', display: 'flex', alignItems: 'center' }} title="YouTube">
                            <Youtube size={20} />
                        </a>
                        <a href="https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5"
                            target="_blank" rel="noreferrer"
                            style={{ color: '#E1306C', display: 'flex', alignItems: 'center' }} title="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="mailto:genxmind1@gmail.com"
                            style={{ color: '#FBBF24', display: 'flex', alignItems: 'center' }} title="Email Us">
                            <Mail size={20} />
                        </a>
                        <button
                            onClick={() => setShowFeedback(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', display: 'flex', alignItems: 'center' }}
                            title="Send Suggestion / Feedback"
                        >
                            <MessageCircle size={20} />
                        </button>
                    </div>

                    {/* User card */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px', marginBottom: '0.75rem',
                        background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <img
                            src={userAvatar} alt="Profile"
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', background: '#1a1a1a', flexShrink: 0 }}
                        />
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
                        style={{
                            width: '100%', padding: '12px',
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            background: 'rgba(239,68,68,0.1)', color: '#FCA5A5',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease',
                            fontSize: '0.9rem',
                        }}
                        className="hover-danger"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Desktop always-visible */}
            <style>{`
                @media (min-width: 768px) {
                    .sidebar-desktop { transform: translateX(0) !important; }
                }
                .hover-danger:hover {
                    background: rgba(239,68,68,0.2) !important;
                }
                /* Smooth scrollbar in sidebar */
                .sidebar-desktop::-webkit-scrollbar { width: 4px; }
                .sidebar-desktop::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            `}</style>

            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        </>
    );
};

export default Sidebar;
