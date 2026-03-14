import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Calculator, Calendar, Users, BookOpen, User,
    Settings, Shield, LogOut, Youtube, Instagram, Mail,
    MessageCircle, MessageSquare, Layers, Globe, Trophy,
    ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [showFeedback, setShowFeedback] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(iv);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const userAvatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1E40AF&color=fff&size=128&bold=true`;

    const navItems = [
        { path: '/dashboard',      label: 'Dashboard',          icon: Home,          color: '#60A5FA' },
        { path: '/courses',        label: 'My Courses',         icon: BookOpen,       color: '#34D399' },
        { path: '/common-courses', label: 'Common Courses',     icon: Layers,         color: '#818CF8' },
        { path: '/calc',           label: 'CGPA Calculator',    icon: Calculator,     color: '#FBBF24' },
        { path: '/attendance',     label: 'Attendance Tracker', icon: Calendar,       color: '#F87171' },
        { path: '/faculty',        label: 'Faculty Directory',  icon: Users,          color: '#38BDF8' },
        { path: '/reviews',        label: 'Faculty Reviews',    icon: MessageSquare,  color: '#FB923C' },
        { path: '/resources',      label: 'Resources Hub',      icon: BookOpen,       color: '#4ADE80' },
        { path: '/leaderboard',    label: 'Leaderboard',        icon: Trophy,         color: '#FFD700' },
        { path: '/profile',        label: 'Profile',            icon: User,           color: '#E879F9' },
        { path: '/settings',       label: 'Settings',           icon: Settings,       color: '#94A3B8' },
    ];

    if (isAdmin || user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield, color: '#FCD34D' });
    }

    const socialLinks = [
        { href: 'https://youtube.com/@genxmind-m8r?si=xHZeCJ3ZRTMjmePF',                      icon: Youtube,   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'YT'   },
        { href: 'https://www.instagram.com/dharani_govardhan_chowdary?igsh=bzF3eG9wNHkwbHB5', icon: Instagram, color: '#E1306C', bg: 'rgba(225,48,108,0.12)',  label: 'IG'   },
        { href: 'https://arms.sse.saveetha.com/',                                              icon: Globe,     color: '#34D399', bg: 'rgba(52,211,153,0.12)',  label: 'ARMS' },
        { href: 'mailto:genxmind1@gmail.com',                                                  icon: Mail,      color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', label: 'Mail' },
    ];

    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');

    const staggerCSS = navItems.map((_, i) =>
        `.sb-item:nth-child(${i + 1}){transition-delay:${i * 0.035}s}`
    ).join('\n');

    return (
        <>
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

*,*::before,*::after{box-sizing:border-box}

/* ══════════════════════════════════════
   SHELL — z-index 200 so it always
   renders above TopBar (z:100) and
   the overlay (z:199)
══════════════════════════════════════ */
.sb{
    font-family:'Plus Jakarta Sans',sans-serif;
    width:285px;height:100vh;
    position:fixed;left:0;top:0;
    display:flex;flex-direction:column;
    z-index:200;                          /* ← KEY FIX */
    transform:translateX(-100%);
    transition:transform 0.42s cubic-bezier(0.16,1,0.3,1);
    overflow:hidden;will-change:transform;

    /* Navy dark-blue theme matching the website */
    background:
        radial-gradient(ellipse 200% 120% at -5% -5%,  rgba(30,64,175,0.18) 0%, transparent 50%),
        radial-gradient(ellipse 160%  90% at 110% 110%, rgba(37,99,235,0.12)  0%, transparent 55%),
        linear-gradient(175deg, #060d1f 0%, #080f24 40%, #050c1a 100%);
    border-right:1px solid rgba(59,130,246,0.15);
    box-shadow: 4px 0 32px rgba(0,0,0,0.5);
}
.sb.open{transform:translateX(0)}

/* grain */
.sb::after{
    content:'';position:absolute;inset:0;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
    opacity:0.018;pointer-events:none;z-index:0;
}

/* ── left neon edge ── */
.sb-edge{
    position:absolute;left:0;top:0;width:2px;height:100%;
    background:linear-gradient(180deg,transparent 0%,#3B82F6 30%,#1D4ED8 60%,transparent 100%);
    opacity:0;z-index:3;
    animation:edgeFade 0.5s ease 0.3s forwards;
}
@keyframes edgeFade{to{opacity:0.6}}

/* ── ambient orbs ── */
.sb-orb{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;z-index:0;animation:orbDrift ease-in-out infinite}
.sb-orb-1{width:200px;height:200px;background:radial-gradient(circle,rgba(30,64,175,0.25),transparent 70%);top:-50px;left:-50px;animation-duration:11s}
.sb-orb-2{width:150px;height:150px;background:radial-gradient(circle,rgba(37,99,235,0.18),transparent 70%);bottom:150px;right:-30px;animation-duration:14s;animation-delay:-5s}
.sb-orb-3{width:90px;height:90px;background:radial-gradient(circle,rgba(59,130,246,0.14),transparent 70%);top:42%;left:20%;animation-duration:9s;animation-delay:-3s}
@keyframes orbDrift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(10px,-15px) scale(1.07)}66%{transform:translate(-8px,10px) scale(0.94)}}

/* ── CLOSE btn (mobile) ── */
.sb-close{
    position:absolute;top:14px;right:14px;z-index:10;
    width:30px;height:30px;border-radius:8px;border:none;
    background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);
    color:rgba(148,163,184,0.6);cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:all 0.2s ease;-webkit-tap-highlight-color:transparent;
}
.sb-close:hover{background:rgba(59,130,246,0.2);color:#E2E8F0}
@media(min-width:768px){.sb-close{display:none}}

/* ── CLOCK ── */
.sb-clock{
    margin:1.1rem 1rem 0.8rem;padding:9px 13px;
    background:rgba(30,64,175,0.12);
    border:1px solid rgba(59,130,246,0.18);
    border-radius:12px;display:flex;align-items:center;justify-content:space-between;
    position:relative;z-index:2;flex-shrink:0;overflow:hidden;
    transition:border-color 0.3s ease;
}
.sb-clock:hover{border-color:rgba(59,130,246,0.35)}
.sb-clock-time{
    font-family:'JetBrains Mono',monospace;
    font-size:1rem;font-weight:700;color:#60A5FA;letter-spacing:0.04em;
}
.sb-colon{animation:colonBlink 1s step-end infinite}
@keyframes colonBlink{50%{opacity:0.15}}
.sb-clock-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.sb-clock-date{font-size:0.63rem;color:rgba(148,163,184,0.35);font-weight:500}
.sb-clock-online{display:flex;align-items:center;gap:4px;font-size:0.54rem;color:#34D399;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}
.sb-live-dot{width:5px;height:5px;background:#34D399;border-radius:50%;animation:livePulse 1.8s ease-in-out infinite}
@keyframes livePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:0.4}}

/* ── DIVIDER / LABEL ── */
.sb-div{height:1px;margin:0 1rem 0.4rem;background:linear-gradient(90deg,transparent,rgba(59,130,246,0.2) 30%,rgba(59,130,246,0.2) 70%,transparent);flex-shrink:0;position:relative;z-index:2}
.sb-lbl{font-size:0.58rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(59,130,246,0.4);padding:0.2rem 1.2rem 0.35rem;flex-shrink:0;position:relative;z-index:2}

/* ── NAV ── */
.sb-nav{flex:1;padding:0 0.55rem;overflow-y:auto;scrollbar-width:none;position:relative;z-index:2;min-height:0}
.sb-nav::-webkit-scrollbar{display:none}

.sb-item{margin-bottom:2px;opacity:0;transform:translateX(-18px);transition:opacity 0.36s ease,transform 0.36s cubic-bezier(0.16,1,0.3,1)}
.sb-item.vis{opacity:1;transform:translateX(0)}
${staggerCSS}

.sb-link{
    display:flex;align-items:center;gap:0.75rem;
    padding:9px 12px;border-radius:12px;text-decoration:none;
    color:rgba(148,163,184,0.42);font-size:0.83rem;font-weight:500;
    position:relative;overflow:hidden;border:1px solid transparent;
    transition:color 0.2s ease,background 0.2s ease,border-color 0.2s ease,transform 0.25s cubic-bezier(0.16,1,0.3,1);
    cursor:pointer;white-space:normal;line-height:1.3;
}
/* shimmer */
.sb-link::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(59,130,246,0.06),transparent);transition:left 0.5s ease;pointer-events:none}
.sb-link:hover::before{left:160%}
/* ripple */
.sb-link::after{content:'';position:absolute;top:50%;left:14px;width:0;height:0;border-radius:50%;background:rgba(59,130,246,0.06);transform:translate(-50%,-50%);transition:width 0.4s ease,height 0.4s ease,opacity 0.4s ease;opacity:0}
.sb-link:hover::after{width:260px;height:260px;opacity:1}

.sb-link:hover{color:rgba(255,255,255,0.82);transform:translateX(4px);background:rgba(59,130,246,0.06)}
.sb-link.active{color:#fff;background:rgba(37,99,235,0.18);border-color:rgba(59,130,246,0.28)}

/* left accent bar */
.sb-bar{position:absolute;left:0;top:50%;transform:translateY(-50%) scaleY(0);width:3px;height:58%;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#60A5FA,#1D4ED8);transition:transform 0.25s cubic-bezier(0.16,1,0.3,1);pointer-events:none}
.sb-link:hover .sb-bar,.sb-link.active .sb-bar{transform:translateY(-50%) scaleY(1)}

/* icon */
.sb-icon{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.07);transition:transform 0.28s cubic-bezier(0.16,1,0.3,1),background 0.2s ease,box-shadow 0.28s ease}
.sb-link:hover .sb-icon{background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.2);transform:scale(1.1)}
.sb-link.active .sb-icon{background:rgba(37,99,235,0.2);border-color:rgba(59,130,246,0.35);transform:scale(1.12) rotate(-3deg);box-shadow:0 0 14px rgba(59,130,246,0.3)}

/* chevron */
.sb-chev{margin-left:auto;opacity:0;transform:translateX(-6px) scale(0.7);transition:all 0.2s cubic-bezier(0.16,1,0.3,1);color:rgba(59,130,246,0.4);flex-shrink:0}
.sb-link:hover .sb-chev,.sb-link.active .sb-chev{opacity:1;transform:translateX(0) scale(1)}

/* ── BOTTOM ── */
.sb-bottom{padding:0.5rem 0.55rem 0.8rem;flex-shrink:0;position:relative;z-index:2}

/* user card */
.sb-user{display:flex;align-items:center;gap:9px;padding:9px 11px;margin-bottom:0.55rem;background:rgba(30,64,175,0.1);border:1px solid rgba(59,130,246,0.15);border-radius:13px;position:relative;overflow:hidden;transition:border-color 0.3s ease,background 0.3s ease;cursor:default}
.sb-user::after{content:'';position:absolute;bottom:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent);transform:scaleX(0);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1)}
.sb-user:hover::after{transform:scaleX(1)}
.sb-user:hover{border-color:rgba(59,130,246,0.3);background:rgba(30,64,175,0.15)}
.sb-user-av-wrap{position:relative;flex-shrink:0}
.sb-user-av{width:34px;height:34px;border-radius:10px;object-fit:cover;border:1.5px solid rgba(59,130,246,0.35);display:block;transition:border-color 0.3s}
.sb-user:hover .sb-user-av{border-color:rgba(59,130,246,0.6)}
.sb-dot{position:absolute;bottom:-2px;right:-2px;width:9px;height:9px;background:#34D399;border-radius:50%;border:2px solid #060d1f;animation:dotPulse 2.5s ease-in-out infinite}
@keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.5)}50%{box-shadow:0 0 0 5px rgba(52,211,153,0)}}
.sb-user-name{font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.88);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.sb-user-role{font-size:0.65rem;color:rgba(148,163,184,0.35);line-height:1.3}

/* social grid */
.sb-socials{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:0.5rem}
.sb-social{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px 7px;border-radius:11px;text-decoration:none;border:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.022);transition:transform 0.28s cubic-bezier(0.16,1,0.3,1),border-color 0.2s,box-shadow 0.28s;cursor:pointer;position:relative;overflow:hidden}
.sb-social::before{content:'';position:absolute;inset:0;opacity:0;border-radius:11px;transition:opacity 0.22s ease}
.sb-social:hover{transform:translateY(-5px) scale(1.08);border-color:rgba(255,255,255,0.12)}
.sb-social:hover::before{opacity:1}
.sb-social-lbl{font-size:0.5rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;opacity:0.45;transition:opacity 0.2s;line-height:1}
.sb-social:hover .sb-social-lbl{opacity:1}

/* feedback */
.sb-fb{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:8px;background:rgba(30,64,175,0.1);border:1px solid rgba(59,130,246,0.18);border-radius:11px;color:rgba(96,165,250,0.8);font-size:0.78rem;font-weight:600;cursor:pointer;margin-bottom:0.45rem;transition:all 0.28s cubic-bezier(0.16,1,0.3,1);font-family:'Plus Jakarta Sans',sans-serif;position:relative;overflow:hidden}
.sb-fb::before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,rgba(30,64,175,0.15),rgba(59,130,246,0.1));opacity:0;transition:opacity 0.3s ease}
.sb-fb:hover{border-color:rgba(59,130,246,0.35);color:#93C5FD;transform:translateY(-2px);box-shadow:0 6px 20px rgba(30,64,175,0.2)}
.sb-fb:hover::before{opacity:1}
.sb-fb span{position:relative;z-index:1}
.sb-fb svg{position:relative;z-index:1;transition:transform 0.3s ease}
.sb-fb:hover svg{transform:rotate(-10deg) scale(1.15)}

/* logout */
.sb-out{width:100%;padding:10px 14px;display:flex;align-items:center;gap:0.8rem;background:rgba(239,68,68,0.06);color:rgba(252,165,165,0.7);border:1px solid rgba(239,68,68,0.1);border-radius:11px;cursor:pointer;transition:all 0.28s cubic-bezier(0.16,1,0.3,1);font-size:0.82rem;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;position:relative;overflow:hidden}
.sb-out::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(239,68,68,0.1),transparent);transform:scaleX(0);transform-origin:left;transition:transform 0.35s cubic-bezier(0.16,1,0.3,1)}
.sb-out:hover::before{transform:scaleX(1)}
.sb-out:hover{color:#FCA5A5;border-color:rgba(239,68,68,0.22);transform:translateY(-1px);box-shadow:0 6px 18px rgba(239,68,68,0.1)}
.sb-out span,.sb-out-ico{position:relative;z-index:1}
.sb-out-ico{transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)}
.sb-out:hover .sb-out-ico{transform:translateX(3px) rotate(-10deg)}

/* desktop always visible */
@media(min-width:768px){.sb{transform:translateX(0) !important}}
            `}</style>

            <aside className={`sb${isOpen ? ' open' : ''}`}>

                {/* bg layers */}
                <div className="sb-orb sb-orb-1" />
                <div className="sb-orb sb-orb-2" />
                <div className="sb-orb sb-orb-3" />
                <div className="sb-edge" />

                {/* mobile close button */}
                <button className="sb-close" onClick={toggleSidebar} aria-label="Close menu">
                    <X size={14} />
                </button>

                {/* ── CLOCK ── */}
                <div className="sb-clock">
                    <span className="sb-clock-time">
                        {hh}<span className="sb-colon">:</span>{mm}<span className="sb-colon">:</span>{ss}
                    </span>
                    <div className="sb-clock-right">
                        <span className="sb-clock-date">
                            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="sb-clock-online">
                            <div className="sb-live-dot" /> Online
                        </span>
                    </div>
                </div>

                <div className="sb-div" />
                <div className="sb-lbl">Navigation</div>

                {/* ── NAV ── */}
                <nav className="sb-nav">
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {navItems.map((item) => (
                            <li key={item.path} className={`sb-item${mounted ? ' vis' : ''}`}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
                                    onClick={() => { if (window.innerWidth < 768) toggleSidebar(); }}
                                >
                                    <div className="sb-bar" />
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

                {/* ── BOTTOM ── */}
                <div className="sb-bottom">
                    <div className="sb-div" style={{ margin: '0 0 0.55rem' }} />

                    {/* user card */}
                    <div className="sb-user">
                        <div className="sb-user-av-wrap">
                            <img src={userAvatar} alt="avatar" className="sb-user-av" />
                            <div className="sb-dot" />
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div className="sb-user-name">{user?.name || 'User'}</div>
                            <div className="sb-user-role">{user?.branch || 'Student'}</div>
                        </div>
                    </div>

                    {/* socials */}
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

                    {/* feedback */}
                    <button className="sb-fb" onClick={() => setShowFeedback(true)}>
                        <MessageCircle size={14} />
                        <span>Send Feedback</span>
                    </button>

                    {/* logout */}
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
