import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User, Settings,
    Shield, LogOut, Youtube, Instagram, Mail, MessageCircle,
    MessageSquare, Layers, Globe, ChevronRight, Sparkles,
    Trophy, Crown, Medal, Zap, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import FeedbackModal from './FeedbackModal';
import logo from '../assets/logo.jpg';

/* ─────────────── tiny helpers ─────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={11} style={{ color: '#FFD700' }} />;
    if (rank === 2) return <Medal size={11} style={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <Medal size={11} style={{ color: '#CD7F32' }} />;
    return <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>#{rank}</span>;
};

const getRankGlow = (rank) => {
    if (rank === 1) return 'rgba(255,215,0,0.25)';
    if (rank === 2) return 'rgba(192,192,192,0.2)';
    if (rank === 3) return 'rgba(205,127,50,0.2)';
    return 'transparent';
};

/* ─────────────── component ─────────────── */
const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const dataCtx = useData?.();
    const navigate = useNavigate();
    const [showFeedback, setShowFeedback] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [activeGlow, setActiveGlow] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [lbLoading, setLbLoading] = useState(true);
    const [time, setTime] = useState(new Date());
    const particlesRef = useRef([]);

    /* mount stagger */
    useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

    /* live clock */
    useEffect(() => {
        const iv = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(iv);
    }, []);

    /* leaderboard data — tries DataContext first, falls back to mock */
    useEffect(() => {
        const load = async () => {
            setLbLoading(true);
            try {
                const raw = dataCtx?.leaderboard || dataCtx?.users || dataCtx?.students;
                if (raw && raw.length) {
                    const sorted = [...raw]
                        .sort((a, b) => (b.cgpa || b.points || 0) - (a.cgpa || a.points || 0))
                        .slice(0, 3);
                    setLeaderboard(sorted);
                } else {
                    await sleep(600);
                    setLeaderboard([
                        { id: 1, name: 'Top Student', cgpa: 9.8, branch: 'CSE' },
                        { id: 2, name: 'Second Place', cgpa: 9.5, branch: 'ECE' },
                        { id: 3, name: 'Third Place', cgpa: 9.2, branch: 'MECH' },
                    ]);
                }
            } catch { setLeaderboard([]); }
            setLbLoading(false);
        };
        load();
    }, [dataCtx]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/dashboard',      label: 'Dashboard',       icon: Home,          color: '#60A5FA', glow: '#3B82F6' },
        { path: '/courses',        label: 'My Courses',      icon: BookOpen,       color: '#34D399', glow: '#10B981' },
        { path: '/common-courses', label: 'Common Courses',  icon: Layers,         color: '#A78BFA', glow: '#8B5CF6' },
        { path: '/calc',           label: 'CGPA Calc',       icon: Calculator,     color: '#FBBF24', glow: '#F59E0B' },
        { path: '/attendance',     label: 'Attendance',      icon: Calendar,       color: '#F87171', glow: '#EF4444' },
        { path: '/faculty',        label: 'Faculty Dir.',    icon: Users,          color: '#38BDF8', glow: '#0EA5E9' },
        { path: '/reviews',        label: 'Reviews',         icon: MessageSquare,  color: '#FB923C', glow: '#F97316' },
        { path: '/resources',      label: 'Resources',       icon: BookOpen,       color: '#4ADE80', glow: '#22C55E' },
        { path: '/leaderboard',    label: 'Leaderboard',     icon: Trophy,         color: '#FFD700', glow: '#F59E0B' },
        { path: '/profile',        label: 'Profile',         icon: User,           color: '#E879F9', glow: '#D946EF' },
        { path: '/settings',       label: 'Settings',        icon: Settings,       color: '#94A3B8', glow: '#64748B' },
    ];
    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield, color: '#FCD34D', glow: '#F59E0B' });
    }

    const socialLinks = [
        { href: 'https://youtube.com/@genxmind-m8r?si=xHZeCJ3ZRTMjmePF',                              icon: Youtube,   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'YT'   },
        { href: 'https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5',         icon: Instagram, color: '#E1306C', bg: 'rgba(225,48,108,0.12)',  label: 'IG'   },
        { href: 'https://arms.sse.saveetha.com/',                                                      icon: Globe,     color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'ARMS' },
        { href: 'mailto:genxmind1@gmail.com',                                                          icon: Mail,      color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', label: 'Mail' },
    ];

    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');

    return (
        <>
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

/* ── reset ── */
.sb * { box-sizing: border-box; }

/* ── shell ── */
.sb {
    font-family: 'Space Grotesk', sans-serif;
    width: 272px;
    height: 100vh;
    position: fixed;
    left: 0; top: 0;
    display: flex;
    flex-direction: column;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
    will-change: transform;
    /* layered background */
    background:
        radial-gradient(ellipse 200% 100% at 0% 0%, rgba(59,130,246,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 150% 80% at 100% 100%, rgba(139,92,246,0.07) 0%, transparent 60%),
        linear-gradient(180deg, #080b18 0%, #0b0f1e 50%, #080b18 100%);
    border-right: 1px solid rgba(255,255,255,0.06);
}
.sb.open { transform: translateX(0); }

/* noise grain overlay */
.sb::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    z-index: 0;
}

/* ── scrolling beam ── */
.sb-beam {
    position: absolute;
    left: 0; top: 0;
    width: 2px;
    height: 60px;
    background: linear-gradient(180deg, transparent, #3B82F6, #8B5CF6, transparent);
    animation: beamScroll 4s ease-in-out infinite;
    opacity: 0.7;
    z-index: 1;
    pointer-events: none;
    border-radius: 0 2px 2px 0;
}
@keyframes beamScroll {
    0%   { top: -60px; opacity: 0; }
    10%  { opacity: 0.7; }
    90%  { opacity: 0.7; }
    100% { top: 100vh; opacity: 0; }
}

/* ── floating particles ── */
.sb-particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    animation: particleDrift linear infinite;
}
@keyframes particleDrift {
    0%   { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
    10%  { opacity: 1; transform: translateY(90vh) translateX(5px) scale(1); }
    90%  { opacity: 0.5; }
    100% { transform: translateY(-10vh) translateX(-5px) scale(0.5); opacity: 0; }
}

/* ── logo ── */
.sb-logo {
    padding: 1.4rem 1.2rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
}
.sb-logo-img {
    width: 40px; height: 40px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    padding: 1.5px;
    box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(59,130,246,0.35);
    animation: logoGlow 3s ease-in-out infinite;
}
@keyframes logoGlow {
    0%,100% { box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 4px 20px rgba(59,130,246,0.3); }
    50%      { box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 4px 30px rgba(139,92,246,0.45), 0 0 60px rgba(59,130,246,0.15); }
}
.sb-logo-img img {
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 10px;
    display: block;
}
.sb-logo-text {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #fff 20%, #93C5FD 60%, #C4B5FD 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.sb-logo-pill {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #60A5FA;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.2);
    padding: 3px 8px 3px 6px;
    border-radius: 20px;
    animation: pillBreath 2.5s ease-in-out infinite;
}
@keyframes pillBreath {
    0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59,130,246,0); }
    50%      { opacity: 0.7; box-shadow: 0 0 8px rgba(59,130,246,0.25); }
}

/* ── clock ── */
.sb-clock {
    margin: 0 1.2rem 0.9rem;
    padding: 8px 12px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
}
.sb-clock-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    font-weight: 700;
    color: #60A5FA;
    letter-spacing: 0.05em;
}
.sb-clock-sep {
    animation: colonBlink 1s step-end infinite;
    opacity: 1;
}
@keyframes colonBlink { 50% { opacity: 0; } }
.sb-clock-date {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
    font-weight: 500;
}

/* ── divider ── */
.sb-div {
    height: 1px;
    margin: 0 1.2rem 0.5rem;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.07) 60%, transparent);
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}
.sb-section-lbl {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    padding: 0.3rem 1.2rem 0.4rem;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

/* ── nav ── */
.sb-nav {
    flex: 1;
    padding: 0 0.6rem;
    overflow-y: auto;
    scrollbar-width: none;
    position: relative;
    z-index: 2;
    min-height: 0;
}
.sb-nav::-webkit-scrollbar { display: none; }

.sb-nav-item {
    margin-bottom: 1px;
    opacity: 0;
    transform: translateX(-16px);
    transition: opacity 0.35s ease, transform 0.35s ease;
}
.sb-nav-item.vis {
    opacity: 1;
    transform: translateX(0);
}

.sb-nav-link {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 9px 12px;
    border-radius: 11px;
    text-decoration: none;
    color: rgba(255,255,255,0.38);
    font-size: 0.83rem;
    font-weight: 500;
    position: relative;
    transition: color 0.2s ease, background 0.2s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1);
    border: 1px solid transparent;
    overflow: hidden;
    cursor: pointer;
    white-space: nowrap;
}

/* ripple on hover */
.sb-nav-link::after {
    content: '';
    position: absolute;
    top: 50%; left: 12px;
    width: 0; height: 0;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease, opacity 0.4s ease;
    opacity: 0;
}
.sb-nav-link:hover::after {
    width: 260px; height: 260px; opacity: 1;
}

.sb-nav-link:hover {
    color: rgba(255,255,255,0.8);
    transform: translateX(4px);
    background: rgba(255,255,255,0.03);
}
.sb-nav-link.active {
    color: #fff;
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.08);
}
.sb-nav-link.active .sb-icon {
    transform: scale(1.12) rotate(-3deg);
}

/* active left bar */
.sb-nav-link .sb-bar {
    position: absolute;
    left: 0; top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px; height: 65%;
    border-radius: 0 3px 3px 0;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1);
}
.sb-nav-link.active .sb-bar,
.sb-nav-link:hover .sb-bar {
    transform: translateY(-50%) scaleY(1);
}

.sb-icon {
    width: 30px; height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), background 0.2s ease, box-shadow 0.3s ease;
    background: rgba(255,255,255,0.04);
}
.sb-nav-link:hover .sb-icon,
.sb-nav-link.active .sb-icon {
    background: rgba(255,255,255,0.07);
}
.sb-nav-link.active .sb-icon {
    box-shadow: 0 0 12px var(--icon-glow, transparent);
}

.sb-chevron {
    margin-left: auto;
    opacity: 0;
    transform: translateX(-6px) scale(0.8);
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
    color: rgba(255,255,255,0.25);
    flex-shrink: 0;
}
.sb-nav-link:hover .sb-chevron,
.sb-nav-link.active .sb-chevron {
    opacity: 1;
    transform: translateX(0) scale(1);
}

/* stagger delays */
${navItems.map((_, i) => `.sb-nav-item:nth-child(${i + 1}) { transition-delay: ${i * 0.035}s; }`).join('\n')}

/* ── leaderboard card ── */
.sb-lb {
    margin: 0 0.6rem 0.6rem;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.4s ease 0.5s, transform 0.4s ease 0.5s;
}
.sb-lb.vis { opacity: 1; transform: translateY(0); }

.sb-lb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.sb-lb-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
}
.sb-lb-link {
    font-size: 0.62rem;
    color: #60A5FA;
    text-decoration: none;
    font-weight: 600;
    opacity: 0.7;
    transition: opacity 0.2s;
    letter-spacing: 0.03em;
}
.sb-lb-link:hover { opacity: 1; }

.sb-lb-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.2s ease;
    position: relative;
    overflow: hidden;
    cursor: default;
}
.sb-lb-row:last-child { border-bottom: none; }
.sb-lb-row:hover { background: rgba(255,255,255,0.03); }
.sb-lb-row::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--row-glow, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
}
.sb-lb-row:hover::before { opacity: 1; }

.sb-lb-rank {
    width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.sb-lb-avatar {
    width: 26px; height: 26px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(59,130,246,0.2);
}
.sb-lb-info { flex: 1; overflow: hidden; }
.sb-lb-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
}
.sb-lb-sub {
    font-size: 0.6rem;
    color: rgba(255,255,255,0.3);
    line-height: 1.2;
}
.sb-lb-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 700;
    color: #FBBF24;
    flex-shrink: 0;
}

/* skeleton pulse */
.sb-lb-skeleton {
    height: 36px;
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 200% 100%;
    animation: skeletonPulse 1.4s ease infinite;
    border-radius: 8px;
    margin: 6px 12px;
}
@keyframes skeletonPulse {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* ── bottom ── */
.sb-bottom {
    padding: 0.5rem 0.6rem 0.7rem;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

/* user card */
.sb-user {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 11px;
    margin-bottom: 0.55rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 13px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s ease;
    cursor: default;
}
.sb-user::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent);
    transform: scaleX(0);
    transition: transform 0.4s ease;
}
.sb-user:hover::after { transform: scaleX(1); }
.sb-user:hover { border-color: rgba(59,130,246,0.2); }

.sb-user-av-wrap { position: relative; flex-shrink: 0; }
.sb-user-av {
    width: 34px; height: 34px;
    border-radius: 10px;
    object-fit: cover;
    border: 1.5px solid rgba(59,130,246,0.3);
    display: block;
}
.sb-user-dot {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 9px; height: 9px;
    background: #10B981;
    border-radius: 50%;
    border: 2px solid #080b18;
    animation: dotPulse 2.5s ease-in-out infinite;
}
@keyframes dotPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
    50%      { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
}
.sb-user-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255,255,255,0.88);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 1.2;
}
.sb-user-role {
    font-size: 0.66rem;
    color: rgba(255,255,255,0.3);
    line-height: 1.2;
}
.sb-user-zap {
    margin-left: auto;
    color: #FBBF24;
    opacity: 0.6;
    animation: zapBounce 2s ease-in-out infinite;
    flex-shrink: 0;
}
@keyframes zapBounce {
    0%,100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-2px) scale(1.1); }
}

/* social grid */
.sb-socials {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
    margin-bottom: 0.5rem;
}
.sb-social-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 8px 4px 7px;
    border-radius: 11px;
    text-decoration: none;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.025);
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.2s, background 0.2s, box-shadow 0.3s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}
.sb-social-btn::before {
    content: '';
    position: absolute; inset: 0;
    opacity: 0;
    transition: opacity 0.25s ease;
    border-radius: 11px;
}
.sb-social-btn:hover {
    transform: translateY(-4px) scale(1.06);
}
.sb-social-btn:hover::before { opacity: 1; }
.sb-social-lbl {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.55;
    transition: opacity 0.2s;
    line-height: 1;
}
.sb-social-btn:hover .sb-social-lbl { opacity: 1; }

/* feedback */
.sb-feedback {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px;
    background: rgba(59,130,246,0.07);
    border: 1px solid rgba(59,130,246,0.13);
    border-radius: 11px;
    color: rgba(96,165,250,0.85);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 0.45rem;
    transition: all 0.3s ease;
    font-family: 'Space Grotesk', sans-serif;
    letter-spacing: 0.01em;
    position: relative;
    overflow: hidden;
}
.sb-feedback::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
}
.sb-feedback:hover {
    border-color: rgba(59,130,246,0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(59,130,246,0.12);
}
.sb-feedback:hover::after { opacity: 1; }

/* logout */
.sb-logout {
    width: 100%;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    background: rgba(239,68,68,0.06);
    color: rgba(252,165,165,0.75);
    border: 1px solid rgba(239,68,68,0.1);
    border-radius: 11px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
    font-size: 0.83rem;
    font-weight: 600;
    font-family: 'Space Grotesk', sans-serif;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.01em;
}
.sb-logout::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(239,68,68,0.1), transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
}
.sb-logout:hover::before { transform: scaleX(1); }
.sb-logout:hover {
    color: #FCA5A5;
    border-color: rgba(239,68,68,0.22);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(239,68,68,0.1);
}
.sb-logout-icon {
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
}
.sb-logout:hover .sb-logout-icon {
    transform: translateX(2px) rotate(-10deg);
}
.sb-logout span { position: relative; z-index: 1; }

@media (min-width: 768px) {
    .sb { transform: translateX(0) !important; }
}
            `}</style>

            <aside className={`sb ${isOpen ? 'open' : ''}`}>

                {/* scrolling beam */}
                <div className="sb-beam" />

                {/* floating micro-particles */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="sb-particle" style={{
                        width: `${2 + i % 3}px`,
                        height: `${2 + i % 3}px`,
                        left: `${10 + i * 15}%`,
                        background: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#E1306C','#60A5FA'][i],
                        animationDuration: `${8 + i * 2.5}s`,
                        animationDelay: `${-i * 1.8}s`,
                        opacity: 0.35,
                    }} />
                ))}

                {/* ── Logo ── */}
                <div className="sb-logo">
                    <div className="sb-logo-img">
                        <img src={logo} alt="AcadeMe" />
                    </div>
                    <span className="sb-logo-text">AcadeMe</span>
                    <span className="sb-logo-pill">
                        <Sparkles size={8} />
                        Live
                    </span>
                </div>

                {/* ── Clock ── */}
                <div className="sb-clock">
                    <span className="sb-clock-time">
                        {hh}<span className="sb-clock-sep">:</span>{mm}<span className="sb-clock-sep">:</span>{ss}
                    </span>
                    <span className="sb-clock-date">
                        {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                </div>

                <div className="sb-div" />
                <div className="sb-section-lbl">Menu</div>

                {/* ── Nav ── */}
                <nav className="sb-nav">
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {navItems.map((item, i) => (
                            <li key={item.path} className={`sb-nav-item ${mounted ? 'vis' : ''}`}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `sb-nav-link ${isActive ? 'active' : ''}`}
                                    style={{ '--icon-glow': item.glow + '55' }}
                                    onClick={() => { if (window.innerWidth < 768 && toggleSidebar) toggleSidebar(); }}
                                >
                                    <div className="sb-bar" style={{ background: `linear-gradient(180deg, ${item.color}, ${item.glow})` }} />
                                    <div className="sb-icon" style={{ color: item.color }}>
                                        <item.icon size={15} />
                                    </div>
                                    {item.label}
                                    <ChevronRight size={11} className="sb-chevron" />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* ── Leaderboard mini-card ── */}
                <div className="sb-section-lbl" style={{ paddingTop: '0.6rem' }}>Top Scorers</div>
                <div className={`sb-lb ${mounted ? 'vis' : ''}`}>
                    <div className="sb-lb-header">
                        <div className="sb-lb-title">
                            <Trophy size={12} style={{ color: '#FBBF24' }} />
                            Leaderboard
                        </div>
                        <NavLink to="/leaderboard" className="sb-lb-link">View all →</NavLink>
                    </div>

                    {lbLoading ? (
                        <>{[1,2,3].map(i => <div key={i} className="sb-lb-skeleton" />)}</>
                    ) : leaderboard.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                            No data yet
                        </div>
                    ) : leaderboard.map((student, i) => {
                        const rank = i + 1;
                        const av = student.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=3B82F6&color=fff&size=64&bold=true`;
                        return (
                            <div key={student.id || i} className="sb-lb-row"
                                style={{ '--row-glow': getRankGlow(rank) }}>
                                <div className="sb-lb-rank">{getRankIcon(rank)}</div>
                                <img src={av} alt={student.name} className="sb-lb-avatar" />
                                <div className="sb-lb-info">
                                    <div className="sb-lb-name">{student.name || 'Student'}</div>
                                    <div className="sb-lb-sub">{student.branch || student.department || 'Student'}</div>
                                </div>
                                <div className="sb-lb-score">
                                    {student.cgpa ? `${student.cgpa} GPA` : `${student.points || 0} pts`}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Bottom ── */}
                <div className="sb-bottom">
                    <div className="sb-div" style={{ margin: '0 0 0.55rem' }} />

                    {/* user card */}
                    <div className="sb-user">
                        <div className="sb-user-av-wrap">
                            <img src={userAvatar} alt="me" className="sb-user-av" />
                            <div className="sb-user-dot" />
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div className="sb-user-name">{user?.name || 'User'}</div>
                            <div className="sb-user-role">{user?.branch || 'Student'}</div>
                        </div>
                        <Zap size={14} className="sb-user-zap" />
                    </div>

                    {/* socials */}
                    <div className="sb-socials">
                        {socialLinks.map(s => (
                            <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                                className="sb-social-btn" title={s.label}
                                style={{ color: s.color }}
                            >
                                <style>{`.sb-social-btn[title="${s.label}"]::before{background:${s.bg}}`}</style>
                                <s.icon size={15} />
                                <span className="sb-social-lbl" style={{ color: s.color }}>{s.label}</span>
                            </a>
                        ))}
                    </div>

                    {/* feedback */}
                    <button className="sb-feedback" onClick={() => setShowFeedback(true)}>
                        <MessageCircle size={14} />
                        Send Feedback
                    </button>

                    {/* logout */}
                    <button onClick={handleLogout} className="sb-logout">
                        <LogOut size={16} className="sb-logout-icon" />
                        <span>Logout</span>
                    </button>
                </div>

                <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
            </aside>
        </>
    );
};

export default Sidebar;
