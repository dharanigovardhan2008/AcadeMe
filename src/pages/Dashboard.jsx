import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Calendar, Users, Award, Target,
    FileText, ChevronRight, Zap, Layers,
    PenTool, Video, GraduationCap, Clock,
    ArrowUpRight, Sparkles, Bell, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const QUOTES = [
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal. It is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "Believe you can and you are halfway there.", author: "Theodore Roosevelt" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
    { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
    { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
    { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
    { text: "Intelligence plus character, that is the goal of true education.", author: "Martin Luther King Jr." },
    { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Hard work beats talent when talent does not work hard.", author: "Tim Notke" },
    { text: "The capacity to learn is a gift. The ability to learn is a skill. The willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" },
];

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredAction, setHoveredAction] = useState(null);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                    const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                    return db2 - da;
                });
            setAnnouncements(list.slice(0, 8));
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });
        return () => unsub();
    }, [user]);

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        if (h < 21) return 'Good Evening';
        return 'Good Night';
    };

    const firstName = user?.name?.split(' ')[0] || 'Student';

    const fmtAgo = (v) => {
        if (!v) return '';
        const d = v.toDate ? v.toDate() : new Date(v);
        const s = Math.floor((new Date() - d) / 1000);
        if (s < 60) return 'Just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const avatar = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366F1&color=fff&size=128&bold=true`;

    const actions = [
        { label: 'Timetable', icon: Calendar, color: '#6366F1', bg: 'rgba(99,102,241,0.1)', route: '/timetable' },
        { label: 'Subjects', icon: BookOpen, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', route: '/subjects' },
        { label: 'Faculty', icon: Users, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', route: '/faculty' },
        { label: 'Materials', icon: FileText, color: '#EC4899', bg: 'rgba(236,72,153,0.1)', route: '/materials' },
        { label: 'Attendance', icon: Target, color: '#10B981', bg: 'rgba(16,185,129,0.1)', route: '/attendance' },
        { label: 'Results', icon: Award, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', route: '/results' },
        { label: 'Notes', icon: PenTool, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', route: '/notes' },
        { label: 'Videos', icon: Video, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', route: '/videos' },
    ];

    const stats = [];
    if (user?.cgpa != null) stats.push({ label: 'Current CGPA', value: user.cgpa, icon: Award, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' });
    if (user?.branch) stats.push({ label: 'Branch', value: user.branch, icon: BookOpen, color: '#6366F1', bg: 'rgba(99,102,241,0.1)' });
    if (user?.year) stats.push({ label: 'Year', value: user.year, icon: GraduationCap, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' });
    if (user?.semester) stats.push({ label: 'Semester', value: user.semester, icon: Layers, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' });
    if (user?.rollNo || user?.rollNumber) stats.push({ label: 'Roll No', value: user.rollNo || user.rollNumber, icon: FileText, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' });
    if (user?.section) stats.push({ label: 'Section', value: user.section, icon: Users, color: '#10B981', bg: 'rgba(16,185,129,0.1)' });

    return (
        <>
            <style>{`
                @keyframes d-fadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes d-scaleIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes d-float1 {
                    0%, 100% { transform: translate(0,0) scale(1); }
                    25% { transform: translate(40px,-30px) scale(1.06); }
                    50% { transform: translate(-20px,25px) scale(0.94); }
                    75% { transform: translate(15px,-15px) scale(1.03); }
                }
                @keyframes d-float2 {
                    0%, 100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(-50px,20px) scale(1.1); }
                    66% { transform: translate(30px,-35px) scale(0.92); }
                }
                @keyframes d-float3 {
                    0%, 100% { transform: translate(0,0); }
                    40% { transform: translate(25px,30px); }
                    80% { transform: translate(-30px,-15px); }
                }
                @keyframes d-gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes d-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes d-typewriter {
                    from { width: 0; }
                    to { width: 100%; }
                }
                @keyframes d-borderPulse {
                    0%, 100% { border-color: rgba(99,102,241,0.08); }
                    50% { border-color: rgba(99,102,241,0.2); }
                }
                @keyframes d-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.08); }
                    50% { box-shadow: 0 0 50px rgba(99,102,241,0.15); }
                }
                @keyframes d-slideLeft {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .d-page {
                    min-height: 100vh;
                    background: #060A18;
                    position: relative;
                    overflow-x: hidden;
                }

                /* ── Orbs ── */
                .d-orb {
                    position: fixed; border-radius: 50%;
                    filter: blur(90px); pointer-events: none; z-index: 0;
                    will-change: transform;
                }
                .d-orb-1 {
                    width: 600px; height: 600px;
                    top: -150px; right: -150px;
                    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
                    animation: d-float1 22s ease infinite;
                }
                .d-orb-2 {
                    width: 450px; height: 450px;
                    bottom: 10%; left: -120px;
                    background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%);
                    animation: d-float2 28s ease infinite;
                }
                .d-orb-3 {
                    width: 350px; height: 350px;
                    top: 45%; right: 15%;
                    background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
                    animation: d-float3 32s ease infinite;
                }

                /* ── Hero ── */
                .d-hero {
                    position: relative; z-index: 1;
                    padding: 44px 24px 40px;
                    background: linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 100%);
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    animation: d-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
                }
                .d-hero::after {
                    content: '';
                    position: absolute; bottom: 0; left: 5%; right: 5%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), rgba(59,130,246,0.15), transparent);
                }
                .d-hero-inner {
                    max-width: 1200px; margin: 0 auto;
                    display: flex; align-items: center;
                    justify-content: space-between; gap: 28px;
                }
                .d-hero-left { flex: 1; min-width: 0; }
                .d-greeting {
                    font-size: clamp(1.5rem,4.5vw,2.4rem);
                    font-weight: 800; color: #F1F5F9;
                    letter-spacing: -0.8px; margin: 0 0 2px;
                    line-height: 1.15;
                }
                .d-name-grad {
                    background: linear-gradient(135deg, #818CF8, #60A5FA, #C084FC);
                    background-size: 300% 300%;
                    animation: d-gradient 5s ease infinite;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .d-date {
                    font-size: 0.76rem; color: rgba(148,163,184,0.35);
                    margin: 8px 0 0; font-weight: 500;
                    display: flex; align-items: center; gap: 6px;
                }
                .d-quote-card {
                    margin: 24px 0 0;
                    padding: 18px 22px;
                    background: rgba(255,255,255,0.018);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-left: 3px solid rgba(99,102,241,0.35);
                    border-radius: 0 16px 16px 0;
                    animation: d-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both;
                    transition: all 0.4s ease;
                }
                .d-quote-card:hover {
                    border-left-color: rgba(99,102,241,0.6);
                    background: rgba(255,255,255,0.03);
                    box-shadow: 0 8px 40px rgba(99,102,241,0.06);
                }
                .d-quote-ico {
                    width: 28px; height: 28px; border-radius: 8px;
                    background: rgba(99,102,241,0.08);
                    display: inline-flex; align-items: center; justify-content: center;
                    margin-bottom: 10px;
                }
                .d-quote-text {
                    font-size: 0.86rem; color: rgba(226,232,240,0.6);
                    line-height: 1.65; margin: 0 0 8px;
                    font-style: italic; font-weight: 400;
                }
                .d-quote-author {
                    font-size: 0.68rem; color: rgba(148,163,184,0.3);
                    font-weight: 700; margin: 0;
                    letter-spacing: 0.3px;
                }

                .d-avatar-wrap {
                    flex-shrink: 0;
                    animation: d-scaleIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both;
                }
                .d-avatar-ring {
                    width: 96px; height: 96px;
                    border-radius: 50%; padding: 3px;
                    background: linear-gradient(135deg, #6366F1, #3B82F6, #8B5CF6, #6366F1);
                    background-size: 300% 300%;
                    animation: d-gradient 5s ease infinite, d-glow 4s ease infinite;
                    transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
                }
                .d-avatar-ring:hover { transform: scale(1.06) rotate(3deg); }
                .d-avatar-img {
                    width: 100%; height: 100%;
                    border-radius: 50%; object-fit: cover;
                    border: 3px solid #060A18;
                }
                @media (max-width: 520px) { .d-avatar-wrap { display: none; } }

                /* ── Container ── */
                .d-container {
                    max-width: 1200px; margin: 0 auto;
                    padding: 28px 20px 80px;
                    position: relative; z-index: 1;
                }

                /* ── Section ── */
                .d-section { margin-bottom: 36px; }
                .d-sec-head {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .d-sec-label {
                    display: flex; align-items: center; gap: 10px;
                }
                .d-sec-ico {
                    width: 34px; height: 34px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .d-sec-title {
                    font-size: 1rem; font-weight: 800;
                    color: #E2E8F0; margin: 0;
                    letter-spacing: -0.4px;
                }
                .d-sec-count {
                    font-size: 0.58rem; font-weight: 700;
                    padding: 2px 7px; border-radius: 6px;
                    margin-left: 6px;
                }
                .d-sec-btn {
                    font-size: 0.68rem; font-weight: 600;
                    color: #818CF8; cursor: pointer;
                    display: flex; align-items: center; gap: 4px;
                    padding: 6px 12px; border-radius: 8px;
                    border: 1px solid rgba(99,102,241,0.12);
                    background: rgba(99,102,241,0.06);
                    transition: all 0.25s ease;
                    font-family: inherit;
                }
                .d-sec-btn:hover {
                    background: rgba(99,102,241,0.14);
                    border-color: rgba(99,102,241,0.25);
                    color: #A5B4FC;
                    transform: translateX(2px);
                }

                /* ── Announcements ── */
                .d-ann-list {
                    display: flex; flex-direction: column; gap: 10px;
                }
                .d-ann-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 18px;
                    padding: 18px 20px;
                    transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
                    position: relative; overflow: hidden;
                    cursor: default;
                    animation: d-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
                }
                .d-ann-card::before {
                    content: '';
                    position: absolute; left: 0; top: 0; bottom: 0;
                    width: 0;
                    background: linear-gradient(180deg, #6366F1, #3B82F6);
                    transition: width 0.35s cubic-bezier(0.22,1,0.36,1);
                }
                .d-ann-card:hover {
                    background: rgba(255,255,255,0.035);
                    border-color: rgba(99,102,241,0.12);
                    transform: translateX(6px);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.05);
                }
                .d-ann-card:hover::before { width: 3px; }
                .d-ann-top {
                    display: flex; align-items: flex-start;
                    justify-content: space-between; gap: 12px;
                }
                .d-ann-title {
                    font-size: 0.84rem; font-weight: 700;
                    color: #E2E8F0; margin: 0 0 5px;
                    line-height: 1.45;
                }
                .d-ann-body {
                    font-size: 0.74rem; color: rgba(148,163,184,0.45);
                    margin: 0 0 10px; line-height: 1.55;
                }
                .d-ann-time {
                    font-size: 0.6rem; color: rgba(148,163,184,0.25);
                    font-weight: 600; white-space: nowrap;
                    display: flex; align-items: center; gap: 4px;
                    flex-shrink: 0; margin-top: 2px;
                }
                .d-ann-link {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 0.68rem; font-weight: 600;
                    color: #818CF8; text-decoration: none;
                    padding: 4px 12px; border-radius: 8px;
                    background: rgba(99,102,241,0.07);
                    border: 1px solid rgba(99,102,241,0.1);
                    transition: all 0.25s ease;
                }
                .d-ann-link:hover {
                    background: rgba(99,102,241,0.14);
                    border-color: rgba(99,102,241,0.2);
                    transform: translateX(2px);
                }
                .d-ann-empty {
                    text-align: center; padding: 50px 24px;
                    animation: d-fadeUp 0.6s ease both;
                }
                .d-ann-empty-ico {
                    width: 60px; height: 60px; border-radius: 18px;
                    background: rgba(99,102,241,0.05);
                    border: 1px solid rgba(99,102,241,0.08);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 18px;
                }

                /* ── Skeleton ── */
                .d-skel {
                    background: linear-gradient(90deg,
                        rgba(255,255,255,0.02) 25%,
                        rgba(255,255,255,0.05) 50%,
                        rgba(255,255,255,0.02) 75%);
                    background-size: 200% 100%;
                    animation: d-shimmer 1.8s ease infinite;
                    border-radius: 8px;
                }

                /* ── Stats ── */
                .d-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(170px,1fr));
                    gap: 12px;
                }
                @media (max-width: 480px) {
                    .d-stats-grid { grid-template-columns: 1fr 1fr; }
                }
                .d-stat {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 18px; padding: 20px 18px;
                    transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
                    position: relative; overflow: hidden;
                    animation: d-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
                }
                .d-stat::after {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 2px; opacity: 0;
                    background: var(--accent);
                    transition: opacity 0.35s ease;
                }
                .d-stat:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-4px);
                    box-shadow: 0 16px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03);
                }
                .d-stat:hover::after { opacity: 1; }
                .d-stat-ico {
                    width: 38px; height: 38px; border-radius: 11px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 14px;
                    transition: transform 0.35s ease;
                }
                .d-stat:hover .d-stat-ico { transform: scale(1.1) rotate(-5deg); }
                .d-stat-label {
                    font-size: 0.62rem; color: rgba(148,163,184,0.35);
                    font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.8px; margin: 0 0 6px;
                }
                .d-stat-val {
                    font-size: 1.5rem; font-weight: 800;
                    color: #F1F5F9; margin: 0;
                    letter-spacing: -0.5px; line-height: 1;
                }

                /* ── Quick Actions ── */
                .d-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(8,1fr);
                    gap: 10px;
                }
                @media (max-width: 900px) { .d-actions-grid { grid-template-columns: repeat(4,1fr); } }
                @media (max-width: 400px) { .d-actions-grid { gap: 8px; } }

                .d-action {
                    display: flex; flex-direction: column;
                    align-items: center; gap: 10px;
                    padding: 18px 8px 16px;
                    border-radius: 18px;
                    background: rgba(255,255,255,0.015);
                    border: 1px solid rgba(255,255,255,0.04);
                    cursor: pointer;
                    transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
                    -webkit-tap-highlight-color: transparent;
                    position: relative; overflow: hidden;
                    animation: d-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
                }
                .d-action::before {
                    content: '';
                    position: absolute; inset: 0;
                    background: radial-gradient(circle at 50% 40%, var(--glow) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.35s ease;
                }
                .d-action:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-5px);
                    box-shadow: 0 12px 36px rgba(0,0,0,0.18);
                }
                .d-action:hover::before { opacity: 1; }
                .d-action:active { transform: translateY(-2px) scale(0.97); }
                .d-action-ico {
                    width: 44px; height: 44px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
                    position: relative; z-index: 1;
                }
                .d-action:hover .d-action-ico {
                    transform: scale(1.14) rotate(-6deg);
                    box-shadow: 0 6px 20px var(--glow);
                }
                .d-action-name {
                    font-size: 0.66rem; font-weight: 600;
                    color: rgba(226,232,240,0.5);
                    text-align: center; position: relative; z-index: 1;
                    transition: color 0.25s ease;
                }
                .d-action:hover .d-action-name { color: rgba(226,232,240,0.8); }

                /* ── Footer ── */
                .d-footer {
                    text-align: center; padding: 20px;
                    animation: d-fadeUp 0.6s ease 0.6s both;
                }
                .d-footer-line {
                    width: 60px; height: 2px; border-radius: 1px;
                    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent);
                    margin: 0 auto 14px;
                }
                .d-footer-text {
                    font-size: 0.65rem; color: rgba(148,163,184,0.18);
                    font-weight: 500; margin: 0;
                }
            `}</style>

            <div className="d-page">
                <div className="d-orb d-orb-1" />
                <div className="d-orb d-orb-2" />
                <div className="d-orb d-orb-3" />

                {/* ── Hero ── */}
                <div className="d-hero">
                    <div className="d-hero-inner">
                        <div className="d-hero-left">
                            <h1 className="d-greeting">
                                {getGreeting()},{' '}
                                <span className="d-name-grad">{firstName}</span>
                            </h1>
                            <p className="d-date">
                                <Clock size={13} style={{ opacity: 0.5 }} />
                                {currentTime.toLocaleDateString('en-IN', {
                                    weekday: 'long', day: 'numeric',
                                    month: 'long', year: 'numeric'
                                })}
                                {' | '}
                                {currentTime.toLocaleTimeString('en-IN', {
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>

                            <div className="d-quote-card">
                                <div className="d-quote-ico">
                                    <Sparkles size={14} color="#818CF8" />
                                </div>
                                <p className="d-quote-text">"{quote.text}"</p>
                                <p className="d-quote-author">-- {quote.author}</p>
                            </div>
                        </div>

                        <div className="d-avatar-wrap">
                            <div className="d-avatar-ring">
                                <img
                                    className="d-avatar-img"
                                    src={avatar}
                                    alt={user?.name || 'Profile'}
                                    onError={e => {
                                        e.target.src = `https://ui-avatars.com/api/?name=U&background=6366F1&color=fff`;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-container">

                    {/* ── Announcements ── */}
                    <div className="d-section" style={{ animationDelay: '0.15s' }}>
                        <div className="d-sec-head">
                            <div className="d-sec-label">
                                <div className="d-sec-ico" style={{ background: 'rgba(251,191,36,0.08)' }}>
                                    <Bell size={16} color="#FBBF24" />
                                </div>
                                <div>
                                    <h2 className="d-sec-title" style={{ display: 'flex', alignItems: 'center' }}>
                                        Announcements
                                        {!loading && announcements.length > 0 && (
                                            <span className="d-sec-count" style={{
                                                background: 'rgba(251,191,36,0.1)',
                                                color: '#FBBF24'
                                            }}>
                                                {announcements.length}
                                            </span>
                                        )}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="d-ann-list">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="d-ann-card" style={{
                                        animationDelay: `${0.2 + i * 0.08}s`
                                    }}>
                                        <div className="d-skel" style={{ height: 15, width: '55%', marginBottom: 10 }} />
                                        <div className="d-skel" style={{ height: 12, width: '85%', marginBottom: 7 }} />
                                        <div className="d-skel" style={{ height: 12, width: '40%' }} />
                                    </div>
                                ))}
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="d-ann-empty">
                                <div className="d-ann-empty-ico">
                                    <Bell size={26} color="rgba(99,102,241,0.25)" />
                                </div>
                                <p style={{
                                    margin: '0 0 4px', fontWeight: 700,
                                    fontSize: '0.9rem', color: 'rgba(148,163,184,0.4)'
                                }}>
                                    No announcements yet
                                </p>
                                <p style={{
                                    margin: 0, fontSize: '0.74rem',
                                    color: 'rgba(148,163,184,0.22)'
                                }}>
                                    New updates will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="d-ann-list">
                                {announcements.map((a, i) => (
                                    <div
                                        key={a.id}
                                        className="d-ann-card"
                                        style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                                    >
                                        <div className="d-ann-top">
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p className="d-ann-title">
                                                    {a.title || a.message || 'Notification'}
                                                </p>
                                                {a.body && a.body !== a.title && (
                                                    <p className="d-ann-body">{a.body}</p>
                                                )}
                                            </div>
                                            {a.createdAt && (
                                                <span className="d-ann-time">
                                                    <Clock size={10} />
                                                    {fmtAgo(a.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {a.url && (
                                            <a
                                                href={a.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="d-ann-link"
                                            >
                                                <ExternalLink size={11} /> Open Resource
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Profile Stats ── */}
                    {stats.length > 0 && (
                        <div className="d-section" style={{ animationDelay: '0.3s' }}>
                            <div className="d-sec-head">
                                <div className="d-sec-label">
                                    <div className="d-sec-ico" style={{ background: 'rgba(99,102,241,0.08)' }}>
                                        <GraduationCap size={16} color="#818CF8" />
                                    </div>
                                    <h2 className="d-sec-title">Academic Profile</h2>
                                </div>
                                <button
                                    className="d-sec-btn"
                                    onClick={() => navigate('/profile')}
                                >
                                    View Profile <ChevronRight size={13} />
                                </button>
                            </div>

                            <div className="d-stats-grid">
                                {stats.map((s, i) => {
                                    const Icon = s.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="d-stat"
                                            style={{
                                                '--accent': s.color,
                                                animationDelay: `${0.35 + i * 0.07}s`
                                            }}
                                        >
                                            <div className="d-stat-ico" style={{ background: s.bg }}>
                                                <Icon size={17} color={s.color} />
                                            </div>
                                            <p className="d-stat-label">{s.label}</p>
                                            <p className="d-stat-val">{s.value}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Quick Actions ── */}
                    <div className="d-section" style={{ animationDelay: '0.45s' }}>
                        <div className="d-sec-head">
                            <div className="d-sec-label">
                                <div className="d-sec-ico" style={{ background: 'rgba(16,185,129,0.08)' }}>
                                    <Zap size={16} color="#10B981" />
                                </div>
                                <h2 className="d-sec-title">Quick Access</h2>
                            </div>
                        </div>

                        <div className="d-actions-grid">
                            {actions.map((a, i) => {
                                const Icon = a.icon;
                                return (
                                    <div
                                        key={i}
                                        className="d-action"
                                        style={{
                                            '--glow': a.bg,
                                            animationDelay: `${0.5 + i * 0.05}s`
                                        }}
                                        onClick={() => navigate(a.route)}
                                        onMouseEnter={() => setHoveredAction(i)}
                                        onMouseLeave={() => setHoveredAction(null)}
                                    >
                                        <div className="d-action-ico" style={{ background: a.bg }}>
                                            <Icon
                                                size={20}
                                                color={a.color}
                                                style={{
                                                    transition: 'all 0.3s ease',
                                                    filter: hoveredAction === i
                                                        ? `drop-shadow(0 0 6px ${a.color}40)`
                                                        : 'none'
                                                }}
                                            />
                                        </div>
                                        <span className="d-action-name">{a.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="d-footer">
                        <div className="d-footer-line" />
                        <p className="d-footer-text">
                            acadeMe -- Your Academic Companion
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
