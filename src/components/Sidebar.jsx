import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calculator, Calendar, Users, BookOpen, User, Settings, Shield, LogOut, Youtube, Instagram, Mail, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import FeedbackModal from './FeedbackModal';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [showFeedback, setShowFeedback] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/courses', label: 'My Courses', icon: BookOpen }, // Added Mandatory Courses
        { path: '/calc', label: 'CGPA Calculator', icon: Calculator },
        { path: '/attendance', label: 'Attendance', icon: Calendar },
        { path: '/faculty', label: 'Faculty Directory', icon: Users },
        { path: '/resources', label: 'Resources Hub', icon: BookOpen },
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    // Only show Admin Panel if explicitly authorized via PIN logic
    if (isAdmin) {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
    }

    return (
        <aside style={{
            width: '280px',
            height: '100vh',
            position: 'fixed',
            left: 0, top: 0,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            // Responsive inline style hack for desktop (usually handled by media queries, assuming desktop first here with mobile toggle override)
        }} className="sidebar-desktop">

            <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '40px', height: '40px',
                    borderRadius: '50%', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <img src={logo} alt="AcadeMe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>AcadeMe</h2>
            </div>

            <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto' }}>
                <ul style={{ listStyle: 'none' }}>
                    {navItems.map((item) => (
                        <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive ? 'nav-item active' : 'nav-item'
                                }
                                style={({ isActive }) => ({
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px',
                                    borderRadius: '12px', color: isActive ? 'white' : 'var(--text-secondary)',
                                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                    border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                    textDecoration: 'none', transition: 'all 0.3s ease',
                                    borderLeft: isActive ? '4px solid var(--primary)' : '1px solid transparent' // override border
                                })}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                    marginBottom: '1rem', padding: '10px',
                    background: 'rgba(255,255,255,0.05)', borderRadius: '12px'
                }}>
                    <a href="https://youtube.com/@genxmind-m8r?si=xHZeCJ3ZRTMjmePF" target="_blank" rel="noreferrer" style={{ color: '#EF4444', display: 'flex', alignItems: 'center' }} title="YouTube">
                        <Youtube size={20} />
                    </a>
                    <a href="https://www.instagram.com/genx_mind?igsh=MWl2MTM0djhyMnU2aw==" target="_blank" rel="noreferrer" style={{ color: '#E1306C', display: 'flex', alignItems: 'center' }} title="Instagram">
                        <Instagram size={20} />
                    </a>
                    <a href="mailto:genxmind1@gmail.com" style={{ color: '#FBBF24', display: 'flex', alignItems: 'center' }} title="Email Us">
                        <Mail size={20} />
                    </a>
                    <button onClick={() => setShowFeedback(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', display: 'flex', alignItems: 'center' }} title="Send Suggestion">
                        <MessageCircle size={20} />
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', padding: '12px', display: 'flex', alignItems: 'center', gap: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease'
                    }}
                    className="hover-danger"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
            <style>{`
         @media (min-width: 768px) {
             .sidebar-desktop { transform: translateX(0) !important; }
         }
         .hover-danger:hover {
             background: rgba(239, 68, 68, 0.2) !important;
         }
       `}</style>

            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        </aside>
    );
};

export default Sidebar;
