import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User, Settings,
    Shield, LogOut, Youtube, Instagram, Mail, MessageCircle,
    MessageSquare, Layers, Globe, ChevronRight, Sparkles, Trophy, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [showFeedback, setShowFeedback] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(iv);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/dashboard',      label: 'Dashboard',          icon: Home,          color: '#60A5FA', glow: '#3B82F6' },
        { path: '/courses',        label: 'My Courses',         icon: BookOpen,       color: '#34D399', glow: '#10B981' },
        { path: '/common-courses', label: 'Common Courses',     icon: Layers,         color: '#A78BFA', glow: '#8B5CF6' },
        { path: '/calc',           label: 'CGPA Calculator',    icon: Calculator,     color: '#FBBF24', glow: '#F59E0B' },
        { path: '/attendance',     label: 'Attendance Tracker', icon: Calendar,       color: '#F87171', glow: '#EF4444' },
        { path: '/faculty',        label: 'Faculty Directory',  icon: Users,          color: '#38BDF8', glow: '#0EA5E9' },
        { path: '/reviews',        label: 'Faculty Reviews',    icon: MessageSquare,  color: '#FB923C', glow: '#F97316' },
        { path: '/resources',      label: 'Resources Hub',      icon: BookOpen,       color: '#4ADE80', glow: '#22C55E' },
        { path: '/leaderboard',    label: 'Leaderboard',        icon: Trophy,         color: '#FFD700', glow: '#F59E0B' },
        { path: '/profile',        label: 'Profile',            icon: User,           color: '#E879F9', glow: '#D946EF' },
        { path: '/settings',       label: 'Settings',           icon: Settings,       color: '#94A3B8', glow: '#64748B' },
    ];

    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield, color: '#FCD34D', glow: '#F59E0B' });
    }

    const socialLinks = [
        { href: 'https://youtube.com/@genxmind-m8r?si=xHZeCJ3ZRTMjmePF',                             icon: Youtube,   color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   label: 'YT'   },
        { href: 'https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5',        icon: Instagram, color: '#E1306C', bg: 'rgba(225,48,108,0.15)',  label: 'IG'   },
        { href: 'https://arms.sse.saveetha.com/',                                                     icon: Globe,     color: '#10B981', bg: 'rgba(16,185,129,0.15)',  label: 'ARMS' },
        { href: 'mailto:genxmind1@gmail.com',                                                         icon: Mail,      color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', label: 'Mail' },
    ];

    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');

    const staggerCSS = navItems.map((_, i) =>
        `.sb-item:nth-child(${i + 1}) { transition-delay: ${i * 0.04}s; }`
    ).join('\n');

    return (
        <>
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.sb {
    font-family: 'Plus Jakarta Sans', sans-serif;
    width: 285px;
    height: 100vh;
    position: fixed;
    left: 0; top: 0;
    display: flex;
    flex-direction: column;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
    will-change: transform;
    background:
        radial-gradient(ellipse 220% 120% at -10% -5%,  rgba(59,130,246,0.09)  0%, transparent 55%),
        radial-gradient(ellipse 180% 100% at 110% 105%, rgba(139,92,246,0.09)  0%, transparent 55%),
        radial-gradient(ellipse 120%  80% at  50%  50%, rgba(16,185,129,0.03)  0%, transparent 70%),
        linear-gradient(170deg, #07091a 0%, #090c1e 45%, #07091a 100%);
    border-right: 1px solid rgba(255,255,255,0.055);
}
.sb.open { transform: translateX(0); }

.sb::after {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.022;
    pointer-events: none;
    z-index: 0;
}

.sb-beam {
    position: absolute;
    left: 0; top: -80px;
    width: 100%; height: 80px;
    background: linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.04) 40%, rgba(139,92,246,0.07) 70%, transparent 100%);
    animation: scanDown 6s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
}
@keyframes scanDown {
    0%   { top: -80px; opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { top: 100vh; opacity: 0; }
}

.sb-edge {
    position: absolute;
    left: 0; top: 0;
    width: 2px; height: 100%;
    background: linear-gradient(180deg, transparent 0%, #3B82F6 25%, #8B5CF6 50%, #10B981 75%, transparent 100%);
    opacity: 0;
    animation: edgeFade 0.6s ease 0.4s forwards;
    z-index: 3;
}
@keyframes edgeFade { to { opacity: 0.5; } }

.sb-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(55px);
    pointer-events: none;
    z-index: 0;
    animation: orbDrift ease-in-out infinite;
}
.sb-orb-1 {
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%);
    top: -60px; left: -60px;
    animation-duration: 10s;
}
.sb-orb-2 {
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%);
    bottom: 140px; right: -40px;
    animation-duration: 13s; animation-delay: -4s;
}
.sb-orb-3 {
    width: 100px; height: 100px;
    background: radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%);
    top: 42%; left: 15%;
    animation-duration: 8s; animation-delay: -7s;
}
@keyframes orbDrift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(12px,-18px) scale(1.08); }
    66%      { transform: translate(-10px,12px) scale(0.94); }
}

.sb-spark {
    position: absolute;
    width: 3px; height: 3px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
    animation: sparkFloat linear infinite;
}
@keyframes sparkFloat {
    0%   { transform: translateY(110vh) scale(0); opacity: 0; }
    8%   { opacity: 0.6; transform: translateY(95vh) scale(1); }
    92%  { opacity: 0.3; }
    100% { transform: translateY(-10vh) scale(0.4); opacity: 0; }
}



.sb-clock {
    margin: 1.2rem 1rem 0.85rem;
    padding: 9px 13px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 2; flex-shrink: 0; overflow: hidden;
    transition: border-color 0.3s ease;
}
.sb-clock:hover { border-color: rgba(59,130,246,0.25); }
.sb-clock::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(59,130,246,0.04), transparent, rgba(139,92,246,0.04));
    opacity: 0; transition: opacity 0.3s ease;
}
.sb-clock:hover::before { opacity: 1; }
.sb-clock-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem; font-weight: 700; color: #60A5FA;
    letter-spacing: 0.04em; position: relative; z-index: 1;
}
.sb-colon { animation: colonBlink 1s step-end infinite; }
@keyframes colonBlink { 50% { opacity: 0.15; } }
.sb-clock-right {
    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    position: relative; z-index: 1;
}
.sb-clock-date {
    font-size: 0.65rem; color: rgba(255,255,255,0.35); font-weight: 500; line-height: 1;
}
.sb-clock-live {
    display: flex; align-items: center; gap: 4px;
    font-size: 0.55rem; color: #34D399; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
}
.sb-live-dot {
    width: 5px; height: 5px;
    background: #34D399; border-radius: 50%;
    animation: liveDot 1.5s ease-in-out infinite;
}
@keyframes liveDot {
    0%,100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(1.6); opacity: 0.4; }
}

.sb-div {
    height: 1px; margin: 0 1rem 0.4rem;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent);
    flex-shrink: 0; position: relative; z-index: 2;
}
.sb-lbl {
    font-size: 0.59rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.18);
    padding: 0.2rem 1.2rem 0.35rem;
    flex-shrink: 0; position: relative; z-index: 2;
}

.sb-nav {
    flex: 1; padding: 0 0.55rem; overflow-y: auto; scrollbar-width: none;
    position: relative; z-index: 2; min-height: 0;
}
.sb-nav::-webkit-scrollbar { display: none; }

.sb-item {
    margin-bottom: 2px; opacity: 0; transform: translateX(-20px);
    transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.16,1,0.3,1);
}
.sb-item.vis { opacity: 1; transform: translateX(0); }
${staggerCSS}

.sb-link {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 9px 12px; border-radius: 12px; text-decoration: none;
    color: rgba(255,255,255,0.36); font-size: 0.82rem; font-weight: 500;
    position: relative; overflow: hidden; border: 1px solid transparent;
    transition: color 0.22s ease, background 0.22s ease, border-color 0.22s ease, transform 0.28s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer; white-space: normal; line-height: 1.3;
}
.sb-link::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 65%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transition: left 0.55s ease; pointer-events: none;
}
.sb-link:hover::before { left: 160%; }
.sb-link::after {
    content: '';
    position: absolute; top: 50%; left: 14px;
    width: 0; height: 0; border-radius: 50%;
    background: rgba(255,255,255,0.055);
    transform: translate(-50%, -50%);
    transition: width 0.45s ease, height 0.45s ease, opacity 0.45s ease; opacity: 0;
}
.sb-link:hover::after { width: 280px; height: 280px; opacity: 1; }
.sb-link:hover { color: rgba(255,255,255,0.82); transform: translateX(5px); background: rgba(255,255,255,0.028); }
.sb-link.active { color: #fff; background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.08); }

.sb-bar {
    position: absolute; left: 0; top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px; height: 58%; border-radius: 0 3px 3px 0;
    transition: transform 0.28s cubic-bezier(0.16,1,0.3,1); pointer-events: none;
}
.sb-link:hover .sb-bar,
.sb-link.active .sb-bar { transform: translateY(-50%) scaleY(1); }

.sb-icon {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(255,255,255,0.08);
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.22s ease, box-shadow 0.3s ease;
}
.sb-link:hover .sb-icon {
    background: rgba(255,255,255,0.11);
    border-color: rgba(255,255,255,0.14);
    transform: scale(1.12);
}
.sb-link.active .sb-icon {
    background: rgba(255,255,255,0.13);
    border-color: rgba(255,255,255,0.18);
    transform: scale(1.15) rotate(-4deg);
    box-shadow: 0 0 16px var(--glow), 0 0 6px var(--glow);
}

.sb-chev {
    margin-left: auto; opacity: 0;
    transform: translateX(-8px) scale(0.7);
    transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
    color: rgba(255,255,255,0.22); flex-shrink: 0;
}
.sb-link:hover .sb-chev,
.sb-link.active .sb-chev { opacity: 1; transform: translateX(0) scale(1); }

.sb-bottom {
    padding: 0.5rem 0.55rem 0.8rem; flex-shrink: 0; position: relative; z-index: 2;
}

.sb-user {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 11px; margin-bottom: 0.55rem;
    background: rgba(255,255,255,0.028);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: 13px; position: relative; overflow: hidden;
    transition: border-color 0.3s ease, background 0.3s ease; cursor: default;
}
.sb-user::after {
    content: '';
    position: absolute; bottom: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent);
    transform: scaleX(0); transition: transform 0.45s cubic-bezier(0.16,1,0.3,1);
}
.sb-user:hover::after { transform: scaleX(1); }
.sb-user:hover { border-color: rgba(59,130,246,0.22); background: rgba(59,130,246,0.04); }

.sb-user-av-wrap { position: relative; flex-shrink: 0; }
.sb-user-av {
    width: 34px; height: 34px; border-radius: 10px; object-fit: cover;
    border: 1.5px solid rgba(59,130,246,0.28); display: block;
    transition: border-color 0.3s ease;
}
.sb-user:hover .sb-user-av { border-color: rgba(59,130,246,0.5); }
.sb-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 9px; height: 9px; background: #10B981;
    border-radius: 50%; border: 2px solid #07091a;
    animation: dotPulse 2.5s ease-in-out infinite;
}
@keyframes dotPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
    50%      { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
}
.sb-user-name {
    font-size: 0.82rem; font-weight: 700; color: rgba(255,255,255,0.88);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
}
.sb-user-role { font-size: 0.65rem; color: rgba(255,255,255,0.3); line-height: 1.3; }
.sb-zap {
    margin-left: auto; color: #FBBF24; opacity: 0.5; flex-shrink: 0;
    animation: zapFloat 2.2s ease-in-out infinite;
}
@keyframes zapFloat {
    0%,100% { transform: translateY(0) scale(1); opacity: 0.5; }
    50%      { transform: translateY(-3px) scale(1.15); opacity: 0.9; }
}

.sb-socials {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 0.5rem;
}
.sb-social {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; padding: 8px 4px 7px; border-radius: 11px; text-decoration: none;
    border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.022);
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.2s ease, background 0.2s ease, box-shadow 0.3s ease;
    cursor: pointer; position: relative; overflow: hidden;
}
.sb-social::before {
    content: ''; position: absolute; inset: 0; opacity: 0; border-radius: 11px; transition: opacity 0.25s ease;
}
.sb-social:hover { transform: translateY(-5px) scale(1.08); border-color: rgba(255,255,255,0.12); }
.sb-social:hover::before { opacity: 1; }
.sb-social-lbl {
    font-size: 0.51rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    opacity: 0.45; transition: opacity 0.2s ease; line-height: 1;
}
.sb-social:hover .sb-social-lbl { opacity: 1; }

.sb-fb {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 8px;
    background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.12);
    border-radius: 11px; color: rgba(96,165,250,0.8);
    font-size: 0.78rem; font-weight: 600; cursor: pointer; margin-bottom: 0.45rem;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    font-family: 'Plus Jakarta Sans', sans-serif; position: relative; overflow: hidden;
}
.sb-fb::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(120deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12));
    opacity: 0; transition: opacity 0.3s ease;
}
.sb-fb:hover { border-color: rgba(59,130,246,0.28); color: #93C5FD; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.14); }
.sb-fb:hover::before { opacity: 1; }
.sb-fb span { position: relative; z-index: 1; }
.sb-fb svg { position: relative; z-index: 1; transition: transform 0.3s ease; }
.sb-fb:hover svg { transform: rotate(-10deg) scale(1.15); }

.sb-out {
    width: 100%; padding: 10px 14px;
    display: flex; align-items: center; gap: 0.8rem;
    background: rgba(239,68,68,0.055); color: rgba(252,165,165,0.7);
    border: 1px solid rgba(239,68,68,0.1); border-radius: 11px;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    font-size: 0.82rem; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif; position: relative; overflow: hidden;
}
.sb-out::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(239,68,68,0.12), transparent);
    transform: scaleX(0); transform-origin: left; transition: transform 0.38s cubic-bezier(0.16,1,0.3,1);
}
.sb-out:hover::before { transform: scaleX(1); }
.sb-out:hover { color: #FCA5A5; border-color: rgba(239,68,68,0.22); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(239,68,68,0.1); }
.sb-out span { position: relative; z-index: 1; }
.sb-out-ico { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); position: relative; z-index: 1; }
.sb-out:hover .sb-out-ico { transform: translateX(3px) rotate(-12deg); }

@media (min-width: 768px) { .sb { transform: translateX(0) !important; } }
            `}</style>

            <aside className={`sb ${isOpen ? 'open' : ''}`}>
                <div className="sb-orb sb-orb-1" />
                <div className="sb-orb sb-orb-2" />
                <div className="sb-orb sb-orb-3" />
                <div className="sb-beam" />
                <div className="sb-edge" />

                {[...Array(7)].map((_, i) => (
                    <div key={i} className="sb-spark" style={{
                        left: `${8 + i * 13}%`,
                        background: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#E1306C','#60A5FA','#A78BFA'][i],
                        animationDuration: `${9 + i * 2.2}s`,
                        animationDelay: `${-i * 1.6}s`,
                    }} />
                ))}


                {/* Clock */}
                <div className="sb-clock">
                    <span className="sb-clock-time">
                        {hh}<span className="sb-colon">:</span>{mm}<span className="sb-colon">:</span>{ss}
                    </span>
                    <div className="sb-clock-right">
                        <span className="sb-clock-date">
                            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="sb-clock-live">
                            <div className="sb-live-dot" />
                            Online
                        </span>
                    </div>
                </div>

                <div className="sb-div" />
                <div className="sb-lbl">Navigation</div>

                {/* Nav */}
                <nav className="sb-nav">
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {navItems.map((item) => (
                            <li key={item.path} className={`sb-item ${mounted ? 'vis' : ''}`}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
                                    style={{ '--glow': item.glow + '66' }}
                                    onClick={() => { if (window.innerWidth < 768 && toggleSidebar) toggleSidebar(); }}
                                >
                                    <div className="sb-bar"
                                        style={{ background: `linear-gradient(180deg, ${item.color}, ${item.glow})` }} />
                                    <div className="sb-icon" style={{ color: item.color }}>
                                        <item.icon size={15} />
                                    </div>
                                    {item.label}
                                    <ChevronRight size={11} className="sb-chev" />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom */}
                <div className="sb-bottom">
                    <div className="sb-div" style={{ margin: '0 0 0.55rem' }} />

                    <div className="sb-user">
                        <div className="sb-user-av-wrap">
                            <img src={userAvatar} alt="avatar" className="sb-user-av" />
                            <div className="sb-dot" />
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div className="sb-user-name">{user?.name || 'User'}</div>
                            <div className="sb-user-role">{user?.branch || 'Student'}</div>
                        </div>
                        <Zap size={14} className="sb-zap" />
                    </div>

                    <div className="sb-socials">
                        {socialLinks.map(s => (
                            <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                                className="sb-social" title={s.label} style={{ color: s.color }}>
                                <style>{`.sb-social[title="${s.label}"]::before{background:${s.bg}}`}</style>
                                <s.icon size={15} />
                                <span className="sb-social-lbl" style={{ color: s.color }}>{s.label}</span>
                            </a>
                        ))}
                    </div>

                    <button className="sb-fb" onClick={() => setShowFeedback(true)}>
                        <MessageCircle size={14} />
                        <span>Send Feedback</span>
                    </button>

                    <button onClick={handleLogout} className="sb-out">
                        <LogOut size={16} className="sb-out-ico" />
                        <span>Logout</span>
                    </button>
                </div>

                <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
            </aside>
        </>
    );
};

export default Sidebar;
