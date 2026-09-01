// Sidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User,
    Settings, Shield, LogOut, MessageSquare, Layers, Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0071E3&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/dashboard',      label: 'Dashboard',         icon: Home,          special: false },
        { path: '/leaderboard',    label: 'Leaderboard',       icon: Trophy,        special: true },
        { path: '/courses',        label: 'My Courses',        icon: BookOpen,      special: false },
        { path: '/common-courses', label: 'Common Courses',    icon: Layers,        special: false },
        { path: '/calc',           label: 'CGPA Calculator',   icon: Calculator,    special: false },
        { path: '/attendance',     label: 'Attendance',        icon: Calendar,      special: false },
        { path: '/faculty',        label: 'Faculty Directory', icon: Users,         special: false },
        { path: '/reviews',        label: 'Faculty Reviews',   icon: MessageSquare, special: false },
        { path: '/resources',      label: 'Resources Hub',     icon: BookOpen,      special: false },
        { path: '/profile',        label: 'Profile',           icon: User,          special: false },
        { path: '/settings',       label: 'Settings',          icon: Settings,      special: false },
    ];

    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield, special: false });
    }

    const CSS = `
        .sidebar-panel {
            width: 300px;
            height: calc(100vh - 2rem);
            position: fixed;
            left: 1rem;
            top: 1rem;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 1);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
            border-radius: 32px;
            display: flex;
            flex-direction: column;
            z-index: 50;
            overflow: hidden;
            transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .sidebar-brand-row {
            padding: 1.75rem 1.5rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .sidebar-logo-wrap {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .sidebar-brand-title {
            font-size: 1.3rem;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(135deg, #0071E3 0%, #5856D6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }

        .sidebar-links-container {
            flex: 1;
            padding: 0 1rem;
            overflow-y: auto;
            scrollbar-width: none;
        }
        .sidebar-links-container::-webkit-scrollbar { display: none; }

        .sidebar-link {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem 1.125rem;
            border-radius: 999px;
            text-decoration: none;
            color: #4B5563;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.35rem;
            transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .sidebar-link:hover {
            background: rgba(0, 0, 0, 0.04);
            color: #111827;
            transform: translateX(4px);
        }

        .sidebar-link.active {
            background: #111827;
            color: #FFFFFF;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .sidebar-link.special {
            color: #D97706;
        }
        .sidebar-link.special:hover {
            background: rgba(245, 158, 11, 0.08);
            color: #B45309;
        }
        .sidebar-link.special.active {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #FFFFFF;
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .sidebar-separator {
            height: 1px;
            background: rgba(0, 0, 0, 0.06);
            margin: 0.75rem 0.5rem;
        }

        .sidebar-footer-card {
            padding: 1rem;
            background: rgba(255, 255, 255, 0.6);
            border-top: 1px solid rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
        }

        .sidebar-profile-box {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem 0.75rem;
            background: #FFFFFF;
            border: 1px solid rgba(0, 0, 0, 0.04);
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .sidebar-action-pill {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.625rem 1rem;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .sidebar-pill-logout {
            background: rgba(255, 59, 48, 0.08);
            color: #FF3B30;
        }
        .sidebar-pill-logout:hover {
            background: rgba(255, 59, 48, 0.15);
            transform: translateY(-1px);
        }

        @media (max-width: 768px) {
            .sidebar-panel {
                height: 100vh;
                left: 0;
                top: 0;
                border-radius: 0;
            }
        }
    `;

    return (
        <aside 
            className="sidebar-panel"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-110%)' }}
        >
            <style>{CSS}</style>
            
            {/* Logo Header */}
            <div className="sidebar-brand-row">
                <div className="sidebar-logo-wrap">
                    <img src={logo} alt="AcadeMe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 className="sidebar-brand-title">AcadeMe</h2>
            </div>

            {/* Navigation Links */}
            <div className="sidebar-links-container">
                {navItems.map((item) => (
                    <React.Fragment key={item.path}>
                        <NavLink
                            to={item.path}
                            onClick={toggleSidebar}
                            className={({ isActive }) => 
                                `sidebar-link ${item.special ? 'special' : ''} ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={18} strokeWidth={2.5} />
                            {item.label}
                        </NavLink>
                        
                        {item.path === '/leaderboard' && <div className="sidebar-separator" />}
                    </React.Fragment>
                ))}
            </div>

            {/* User Profile & Actions Footer */}
            <div className="sidebar-footer-card">
                <div className="sidebar-profile-box">
                    <img src={userAvatar} alt="Profile" 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'User'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', fontWeight: '500' }}>
                            {user?.branch || 'Student'}
                        </p>
                    </div>
                </div>

                <button className="sidebar-action-pill sidebar-pill-logout" onClick={handleLogout}>
                    <LogOut size={16} strokeWidth={2.5} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;