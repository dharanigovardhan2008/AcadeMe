import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User, Settings,
    Shield, LogOut, Youtube, Instagram, Mail, MessageCircle,
    MessageSquare, Layers, Globe, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showFeedback, setShowFeedback] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [hoveredSocial, setHoveredSocial] = useState(null);
    const [mounted, setMounted] = useState(false);
    const indicatorRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(t);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home, color: '#60A5FA' },
        { path: '/courses', label: 'My Courses', icon: BookOpen, color: '#34D399' },
        { path: '/common-courses', label: 'Common Courses', icon: Layers, color: '#A78BFA' },
        { path: '/calc', label: 'CGPA Calculator', icon: Calculator, color: '#FBBF24' },
        { path: '/attendance', label: 'Attendance', icon: Calendar, color: '#F87171' },
        { path: '/faculty', label: 'Faculty Directory', icon: Users, color: '#38BDF8' },
        { path: '/reviews', label: 'Faculty Reviews', icon: MessageSquare, color: '#FB923C' },
        { path: '/resources', label: 'Resources Hub', icon: BookOpen, color: '#4ADE80' },
        { path: '/profile', label: 'Profile', icon: User, color: '#E879F9' },
        { path: '/settings', label: 'Settings', icon: Settings, color: '#94A3B8' },
    ];

    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield, color: '#FCD34D' });
    }

    const socialLinks = [
        {
            href: 'https://youtube.com/@genxmind-m8r?si=xHZeCJ3ZRTMjmePF',
            icon: Youtube,
            color: '#EF4444',
            bg: 'rgba(239,68,68,0.15)',
            label: 'YouTube'
        },
        {
            href: 'https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5',
            icon: Instagram,
            color: '#E1306C',
            bg: 'rgba(225,48,108,0.15)',
            label: 'Instagram'
        },
        {
            href: 'https://arms.sse.saveetha.com/',
            icon: Globe,
            color: '#10B981',
            bg: 'rgba(16,185,129,0.15)',
            label: 'College Portal'
        },
        {
            href: 'mailto:genxmind1@gmail.com',
            icon: Mail,
            color: '#FBBF24',
            bg: 'rgba(251,191,36,0.15)',
            label: 'Email'
        },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

                .academe-sidebar {
                    font-family: 'DM Sans', sans-serif;
                    width: 280px;
                    height: 100vh;
                    position: fixed;
                    left: 0; top: 0;
                    background: linear-gradient(160deg,
                        rgba(10, 12, 28, 0.98) 0%,
                        rgba(15, 18, 40, 0.98) 50%,
                        rgba(10, 14, 35, 0.98) 100%
                    );
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border-right: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    flex-direction: column;
                    z-index: 50;
                    transform: translateX(-100%);
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }

                .academe-sidebar.open {
                    transform: translateX(0);
                }

                /* Animated gradient orbs in background */
                .sidebar-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(60px);
                    opacity: 0.12;
                    pointer-events: none;
                    animation: orbFloat 8s ease-in-out infinite;
                }
                .sidebar-orb-1 {
                    width: 180px; height: 180px;
                    background: radial-gradient(circle, #3B82F6, transparent);
                    top: -40px; left: -40px;
                    animation-delay: 0s;
                }
                .sidebar-orb-2 {
                    width: 140px; height: 140px;
                    background: radial-gradient(circle, #8B5CF6, transparent);
                    bottom: 120px; right: -30px;
                    animation-delay: -3s;
                }
                .sidebar-orb-3 {
                    width: 100px; height: 100px;
                    background: radial-gradient(circle, #10B981, transparent);
                    top: 45%; left: 20%;
                    animation-delay: -5s;
                }

                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(10px, -15px) scale(1.1); }
                    66% { transform: translate(-8px, 10px) scale(0.95); }
                }

                /* Logo area */
                .sidebar-logo {
                    padding: 1.6rem 1.5rem 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.9rem;
                    position: relative;
                }
                .logo-ring {
                    width: 44px; height: 44px;
                    border-radius: 14px;
                    position: relative;
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    padding: 2px;
                    flex-shrink: 0;
                    box-shadow: 0 0 20px rgba(59,130,246,0.4);
                    animation: logoPulse 3s ease-in-out infinite;
                }
                @keyframes logoPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.4); }
                    50% { box-shadow: 0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(59,130,246,0.2); }
                }
                .logo-ring img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    border-radius: 12px;
                }
                .logo-text {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.25rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #fff 0%, #93C5FD 50%, #C4B5FD 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.02em;
                }
                .logo-badge {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.6rem;
                    font-weight: 600;
                    color: #60A5FA;
                    background: rgba(59,130,246,0.1);
                    border: 1px solid rgba(59,130,246,0.2);
                    padding: 3px 8px;
                    border-radius: 20px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    animation: badgePulse 2s ease-in-out infinite;
                }
                @keyframes badgePulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                /* Divider */
                .sidebar-divider {
                    height: 1px;
                    margin: 0.5rem 1.5rem;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                }

                /* Nav label */
                .nav-section-label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.25);
                    padding: 0.75rem 1.5rem 0.4rem;
                    font-family: 'DM Sans', sans-serif;
                }

                /* Nav items */
                .sidebar-nav {
                    flex: 1;
                    padding: 0 0.75rem;
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .sidebar-nav::-webkit-scrollbar { display: none; }

                .nav-item-wrap {
                    margin-bottom: 2px;
                    opacity: 0;
                    transform: translateX(-20px);
                    transition: opacity 0.4s ease, transform 0.4s ease;
                }
                .nav-item-wrap.visible {
                    opacity: 1;
                    transform: translateX(0);
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    padding: 10px 14px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: rgba(255,255,255,0.45);
                    font-size: 0.875rem;
                    font-weight: 400;
                    position: relative;
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                    border: 1px solid transparent;
                    cursor: pointer;
                }
                .nav-link::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.03);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    border-radius: 12px;
                }
                .nav-link:hover::before { opacity: 1; }
                .nav-link:hover {
                    color: rgba(255,255,255,0.85);
                    transform: translateX(3px);
                }

                .nav-link.active {
                    color: white;
                    background: rgba(59,130,246,0.1);
                    border-color: rgba(59,130,246,0.2);
                }
                .nav-link.active .nav-icon-wrap {
                    transform: scale(1.1);
                }

                .nav-icon-wrap {
                    width: 32px; height: 32px;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.25s ease;
                    background: rgba(255,255,255,0.05);
                }

                .nav-link.active .nav-icon-wrap,
                .nav-link:hover .nav-icon-wrap {
                    background: rgba(255,255,255,0.08);
                }

                .nav-active-bar {
                    position: absolute;
                    left: 0; top: 50%;
                    transform: translateY(-50%);
                    width: 3px; height: 60%;
                    border-radius: 0 3px 3px 0;
                    background: linear-gradient(180deg, #60A5FA, #A78BFA);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .nav-link.active .nav-active-bar { opacity: 1; }

                .nav-arrow {
                    margin-left: auto;
                    opacity: 0;
                    transform: translateX(-5px);
                    transition: all 0.2s ease;
                    color: rgba(255,255,255,0.3);
                }
                .nav-link:hover .nav-arrow,
                .nav-link.active .nav-arrow {
                    opacity: 1;
                    transform: translateX(0);
                }

                /* Shimmer effect on hover */
                .nav-link::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 60%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
                    transition: left 0.5s ease;
                }
                .nav-link:hover::after { left: 150%; }

                /* Bottom section */
                .sidebar-bottom {
                    padding: 0.75rem;
                }

                /* User card */
                .user-card {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    margin-bottom: 0.75rem;
                    background: rgba(255,255,255,0.04);
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.07);
                    transition: all 0.3s ease;
                    cursor: default;
                    position: relative;
                    overflow: hidden;
                }
                .user-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05));
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .user-card:hover::before { opacity: 1; }

                .user-avatar-wrap {
                    position: relative;
                    flex-shrink: 0;
                }
                .user-avatar {
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 2px solid rgba(59,130,246,0.3);
                }
                .user-status-dot {
                    position: absolute;
                    bottom: -1px; right: -1px;
                    width: 10px; height: 10px;
                    background: #10B981;
                    border-radius: 50%;
                    border: 2px solid rgba(10,12,28,0.98);
                    animation: statusPulse 2s ease-in-out infinite;
                }
                @keyframes statusPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
                    50% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
                }
                .user-info { overflow: hidden; flex: 1; }
                .user-name {
                    margin: 0;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.9);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: 'Syne', sans-serif;
                }
                .user-role {
                    margin: 0;
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.35);
                    white-space: nowrap;
                }

                /* Social links */
                .social-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    margin-bottom: 0.75rem;
                }
                .social-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 8px 4px;
                    border-radius: 12px;
                    text-decoration: none;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.03);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }
                .social-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    border-radius: 12px;
                }
                .social-btn:hover {
                    transform: translateY(-3px) scale(1.05);
                    border-color: rgba(255,255,255,0.15);
                }
                .social-btn:hover::before { opacity: 1; }
                .social-label {
                    font-size: 0.55rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    opacity: 0.6;
                    transition: opacity 0.2s ease;
                }
                .social-btn:hover .social-label { opacity: 1; }

                /* Feedback button */
                .feedback-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 9px;
                    background: rgba(59,130,246,0.08);
                    border: 1px solid rgba(59,130,246,0.15);
                    border-radius: 12px;
                    color: rgba(96,165,250,0.9);
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                    transition: all 0.3s ease;
                    font-family: 'DM Sans', sans-serif;
                }
                .feedback-btn:hover {
                    background: rgba(59,130,246,0.15);
                    border-color: rgba(59,130,246,0.3);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 15px rgba(59,130,246,0.15);
                }

                /* Logout */
                .logout-btn {
                    width: 100%;
                    padding: 11px 14px;
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    background: rgba(239,68,68,0.07);
                    color: rgba(252,165,165,0.8);
                    border: 1px solid rgba(239,68,68,0.12);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    font-size: 0.875rem;
                    font-weight: 500;
                    font-family: 'DM Sans', sans-serif;
                    position: relative;
                    overflow: hidden;
                }
                .logout-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(239,68,68,0.08);
                    transform: scaleX(0);
                    transform-origin: left;
                    transition: transform 0.3s ease;
                }
                .logout-btn:hover::before { transform: scaleX(1); }
                .logout-btn:hover {
                    color: #FCA5A5;
                    border-color: rgba(239,68,68,0.25);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 15px rgba(239,68,68,0.1);
                }

                @media (min-width: 768px) {
                    .academe-sidebar { transform: translateX(0) !important; }
                }

                /* Staggered entrance */
                ${navItems.map((_, i) => `
                    .nav-item-wrap:nth-child(${i + 1}) {
                        transition-delay: ${i * 0.04}s;
                    }
                `).join('')}
            `}</style>

            <aside className={`academe-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Background orbs */}
                <div className="sidebar-orb sidebar-orb-1" />
                <div className="sidebar-orb sidebar-orb-2" />
                <div className="sidebar-orb sidebar-orb-3" />

                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-ring">
                        <img src={logo} alt="AcadeMe" />
                    </div>
                    <span className="logo-text">AcadeMe</span>
                    <span className="logo-badge">
                        <Sparkles size={8} />
                        Beta
                    </span>
                </div>

                <div className="sidebar-divider" />
                <div className="nav-section-label">Navigation</div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {navItems.map((item, i) => (
                            <li key={item.path} className={`nav-item-wrap ${mounted ? 'visible' : ''}`}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => { if (window.innerWidth < 768 && toggleSidebar) toggleSidebar(); }}
                                >
                                    <div className="nav-active-bar" />
                                    <div
                                        className="nav-icon-wrap"
                                        style={{ color: item.color }}
                                    >
                                        <item.icon size={16} />
                                    </div>
                                    <span>{item.label}</span>
                                    <ChevronRight size={12} className="nav-arrow" />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom */}
                <div className="sidebar-bottom">
                    <div className="sidebar-divider" style={{ margin: '0 0 0.75rem' }} />

                    {/* User card */}
                    <div className="user-card">
                        <div className="user-avatar-wrap">
                            <img src={userAvatar} alt="Profile" className="user-avatar" />
                            <div className="user-status-dot" />
                        </div>
                        <div className="user-info">
                            <p className="user-name">{user?.name || 'User'}</p>
                            <p className="user-role">{user?.branch || 'Student'}</p>
                        </div>
                    </div>

                    {/* Social links */}
                    <div className="social-row">
                        {socialLinks.map((s) => (
                            <a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noreferrer"
                                className="social-btn"
                                title={s.label}
                                style={{ '--social-bg': s.bg, '--social-color': s.color }}
                            >
                                <style>{`
                                    .social-btn[title="${s.label}"]::before { background: ${s.bg}; }
                                    .social-btn[title="${s.label}"] { color: ${s.color}; }
                                `}</style>
                                <s.icon size={16} />
                                <span className="social-label" style={{ color: s.color }}>{s.label}</span>
                            </a>
                        ))}
                    </div>

                    {/* Feedback */}
                    <button className="feedback-btn" onClick={() => setShowFeedback(true)}>
                        <MessageCircle size={15} />
                        Send Feedback
                    </button>

                    {/* Logout */}
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
            </aside>
        </>
    );
};

export default Sidebar;
