import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Calendar, Clock, TrendingUp, Award, Users,
    FileText, ChevronRight, Play, Star, Zap, Target,
    BarChart3, GraduationCap, Flame, ArrowUpRight,
    Bookmark, Heart, MessageCircle, Share2, MoreHorizontal,
    CheckCircle2, Circle, AlertCircle, Sparkles, Layers,
    PenTool, Library, Video, Download, ExternalLink,
    ChevronLeft, Plus, Search, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const storiesRef = useRef(null);
    const [activeStory, setActiveStory] = useState(null);
    const [likedPosts, setLikedPosts] = useState({});
    const [savedPosts, setSavedPosts] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedTab, setSelectedTab] = useState('all');
    const [showStoryModal, setShowStoryModal] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Student';

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return { text: 'Good Morning', emoji: '☀️', sub: 'Start your day strong!' };
        if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️', sub: 'Keep up the momentum!' };
        if (h < 21) return { text: 'Good Evening', emoji: '🌅', sub: 'Great progress today!' };
        return { text: 'Good Night', emoji: '🌙', sub: 'Rest well, recharge!' };
    };

    const greeting = getGreeting();

    const stats = [
        {
            label: 'Attendance', value: '87%', change: '+2.3%', up: true,
            icon: Target, color: '#22C55E', bg: 'rgba(34,197,94,0.1)',
            ring: 87, subtitle: '156 / 180 classes'
        },
        {
            label: 'CGPA', value: '8.74', change: '+0.12', up: true,
            icon: Award, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',
            ring: 87, subtitle: 'Semester 5'
        },
        {
            label: 'Assignments', value: '12/15', change: '3 pending', up: false,
            icon: FileText, color: '#6366F1', bg: 'rgba(99,102,241,0.1)',
            ring: 80, subtitle: 'Due this week: 2'
        },
        {
            label: 'Credits', value: '142', change: '18 left', up: true,
            icon: Layers, color: '#EC4899', bg: 'rgba(236,72,153,0.1)',
            ring: 89, subtitle: 'Target: 160'
        },
    ];

    const stories = [
        { id: 1, name: 'New Syllabus', avatar: '📚', gradient: ['#6366F1', '#8B5CF6'], seen: false },
        { id: 2, name: 'Exam Alert', avatar: '📝', gradient: ['#EF4444', '#F97316'], seen: false },
        { id: 3, name: 'Workshop', avatar: '💻', gradient: ['#3B82F6', '#06B6D4'], seen: false },
        { id: 4, name: 'Results Out', avatar: '🏆', gradient: ['#F59E0B', '#EAB308'], seen: true },
        { id: 5, name: 'Hackathon', avatar: '🚀', gradient: ['#8B5CF6', '#EC4899'], seen: false },
        { id: 6, name: 'Placement', avatar: '💼', gradient: ['#10B981', '#22C55E'], seen: true },
        { id: 7, name: 'Sports Day', avatar: '⚽', gradient: ['#F97316', '#EF4444'], seen: true },
        { id: 8, name: 'Library', avatar: '📖', gradient: ['#6366F1', '#3B82F6'], seen: false },
    ];

    const quickActions = [
        { label: 'Timetable', icon: Calendar, color: '#6366F1', route: '/timetable' },
        { label: 'Subjects', icon: BookOpen, color: '#3B82F6', route: '/subjects' },
        { label: 'Faculty', icon: Users, color: '#8B5CF6', route: '/faculty' },
        { label: 'Materials', icon: Library, color: '#EC4899', route: '/materials' },
        { label: 'Attendance', icon: Target, color: '#22C55E', route: '/attendance' },
        { label: 'Results', icon: Award, color: '#F59E0B', route: '/results' },
        { label: 'Notes', icon: PenTool, color: '#06B6D4', route: '/notes' },
        { label: 'Videos', icon: Video, color: '#EF4444', route: '/videos' },
    ];

    const feedPosts = [
        {
            id: 1, type: 'announcement',
            author: 'Prof. Sharma', role: 'HOD - CSE',
            avatar: 'https://ui-avatars.com/api/?name=PS&background=6366F1&color=fff',
            time: '2 hours ago',
            title: 'Mid-Semester Exam Schedule Released',
            content: 'The mid-semester examination schedule for all branches has been published. Please check the exam portal for your individual timetable. Preparation materials are available in the library section.',
            likes: 234, comments: 45, shares: 12,
            tags: ['#exams', '#important'],
            image: null,
        },
        {
            id: 2, type: 'resource',
            author: 'Dr. Patel', role: 'Professor - DBMS',
            avatar: 'https://ui-avatars.com/api/?name=DP&background=3B82F6&color=fff',
            time: '5 hours ago',
            title: 'New Study Material: Database Normalization',
            content: 'Comprehensive notes on 1NF, 2NF, 3NF, and BCNF with solved examples. Must study before the upcoming class test.',
            likes: 189, comments: 32, shares: 67,
            tags: ['#DBMS', '#notes'],
            hasAttachment: true,
        },
        {
            id: 3, type: 'event',
            author: 'Tech Club', role: 'Student Organization',
            avatar: 'https://ui-avatars.com/api/?name=TC&background=8B5CF6&color=fff',
            time: '1 day ago',
            title: '🚀 CodeSprint 2025 - Register Now!',
            content: '48-hour national level hackathon with prizes worth ₹5,00,000. Team size: 2-4 members. Last date to register: 25th Jan.',
            likes: 456, comments: 89, shares: 134,
            tags: ['#hackathon', '#coding', '#prizes'],
            image: null,
        },
    ];

    const upcomingTasks = [
        { id: 1, title: 'DBMS Assignment - ER Diagrams', due: 'Tomorrow', priority: 'high', done: false },
        { id: 2, title: 'OS Lab - Process Scheduling', due: 'In 2 days', priority: 'medium', done: false },
        { id: 3, title: 'CN Quiz - Chapter 4', due: 'In 3 days', priority: 'low', done: false },
        { id: 4, title: 'Math Tutorial Sheet 7', due: 'Yesterday', priority: 'high', done: true },
        { id: 5, title: 'DAA Practice Problems', due: 'In 5 days', priority: 'medium', done: false },
    ];

    const timetableToday = [
        { time: '09:00', subject: 'Data Structures', room: 'Room 301', type: 'Lecture', active: true },
        { time: '10:00', subject: 'Operating Systems', room: 'Lab 2', type: 'Lab', active: false },
        { time: '11:30', subject: 'Mathematics III', room: 'Room 205', type: 'Lecture', active: false },
        { time: '14:00', subject: 'Computer Networks', room: 'Room 102', type: 'Tutorial', active: false },
    ];

    const leaderboard = [
        { rank: 1, name: 'Arjun Mehta', score: 9.2, avatar: 'AM' },
        { rank: 2, name: 'Priya Singh', score: 9.1, avatar: 'PS' },
        { rank: 3, name: 'Rahul Kumar', score: 8.9, avatar: 'RK' },
        { rank: 4, name: firstName, score: 8.74, avatar: firstName[0] + (user?.name?.split(' ')[1]?.[0] || ''), isYou: true },
        { rank: 5, name: 'Sneha Reddy', score: 8.6, avatar: 'SR' },
    ];

    const toggleLike = (id) => setLikedPosts(p => ({ ...p, [id]: !p[id] }));
    const toggleSave = (id) => setSavedPosts(p => ({ ...p, [id]: !p[id] }));

    const scrollStories = (dir) => {
        if (storiesRef.current) {
            storiesRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
        }
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'announcements', label: 'Announcements' },
        { id: 'resources', label: 'Resources' },
        { id: 'events', label: 'Events' },
    ];

    return (
        <>
            <style>{`
                @keyframes dash-fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes dash-scaleIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes dash-slideRight {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes dash-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes dash-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.15); }
                    50% { box-shadow: 0 0 40px rgba(99,102,241,0.25); }
                }
                @keyframes dash-gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes dash-ring {
                    from { stroke-dashoffset: 283; }
                }
                @keyframes dash-heartPop {
                    0% { transform: scale(1); }
                    25% { transform: scale(1.3); }
                    50% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
                @keyframes dash-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes dash-storyRing {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .dash {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #080C1C 0%, #0B0F24 50%, #0D1128 100%);
                    padding: 0 0 60px;
                    box-sizing: border-box;
                    overflow-x: hidden;
                }

                .dash-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 16px;
                }

                /* ── Hero Section ── */
                .dash-hero {
                    padding: 28px 20px 24px;
                    background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05), rgba(139,92,246,0.06));
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    position: relative;
                    overflow: hidden;
                    animation: dash-fadeUp 0.5s ease;
                }
                .dash-hero::before {
                    content: '';
                    position: absolute; top: -50%; right: -20%;
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }
                .dash-hero::after {
                    content: '';
                    position: absolute; bottom: -30%; left: -10%;
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }

                /* ── Stories ── */
                .dash-stories-section {
                    padding: 16px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    position: relative;
                    animation: dash-fadeUp 0.5s ease 0.1s both;
                }
                .dash-stories-wrap {
                    position: relative;
                    padding: 0 16px;
                }
                .dash-stories {
                    display: flex; gap: 14px;
                    overflow-x: auto; padding: 8px 4px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    scroll-behavior: smooth;
                    scroll-snap-type: x mandatory;
                }
                .dash-stories::-webkit-scrollbar { display: none; }
                .dash-story-item {
                    display: flex; flex-direction: column;
                    align-items: center; gap: 6px;
                    cursor: pointer; flex-shrink: 0;
                    scroll-snap-align: start;
                    -webkit-tap-highlight-color: transparent;
                }
                .dash-story-ring {
                    width: 66px; height: 66px; border-radius: 50%;
                    padding: 3px;
                    background: conic-gradient(from 0deg, var(--c1), var(--c2), var(--c1));
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .dash-story-ring.seen {
                    background: rgba(255,255,255,0.12);
                }
                .dash-story-item:hover .dash-story-ring {
                    transform: scale(1.08);
                }
                .dash-story-inner {
                    width: 100%; height: 100%; border-radius: 50%;
                    background: #0B0F24;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.5rem;
                    border: 2px solid #0B0F24;
                }
                .dash-story-name {
                    font-size: 0.62rem; color: rgba(226,232,240,0.65);
                    max-width: 68px; text-align: center;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    font-weight: 500;
                }
                .dash-story-nav {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    width: 30px; height: 30px; border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: #CBD5E1; z-index: 2;
                    transition: all 0.2s ease;
                }
                .dash-story-nav:hover { background: rgba(255,255,255,0.18); color: #fff; }
                .dash-story-nav.left { left: 4px; }
                .dash-story-nav.right { right: 4px; }
                @media (max-width: 640px) { .dash-story-nav { display: none; } }

                /* ── Stats Grid ── */
                .dash-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    padding: 20px 16px;
                    animation: dash-fadeUp 0.5s ease 0.2s both;
                }
                @media (max-width: 900px) { .dash-stats { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 480px) { .dash-stats { grid-template-columns: 1fr 1fr; gap: 8px; } }

                .dash-stat-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 18px; padding: 18px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative; overflow: hidden;
                }
                .dash-stat-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 2px;
                    background: var(--accent);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .dash-stat-card:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-3px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
                }
                .dash-stat-card:hover::before { opacity: 1; }
                .dash-stat-card:active { transform: translateY(-1px) scale(0.98); }

                .dash-stat-ring-svg {
                    width: 44px; height: 44px; flex-shrink: 0;
                }
                .dash-stat-ring-bg {
                    fill: none; stroke: rgba(255,255,255,0.06);
                    stroke-width: 3;
                }
                .dash-stat-ring-fill {
                    fill: none; stroke-width: 3;
                    stroke-linecap: round;
                    transform: rotate(-90deg);
                    transform-origin: center;
                    animation: dash-ring 1.2s ease forwards;
                }

                /* ── Quick Actions ── */
                .dash-quick {
                    padding: 0 16px 20px;
                    animation: dash-fadeUp 0.5s ease 0.3s both;
                }
                .dash-quick-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 8px;
                }
                @media (max-width: 768px) { .dash-quick-grid { grid-template-columns: repeat(4, 1fr); } }
                @media (max-width: 400px) { .dash-quick-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; } }

                .dash-quick-item {
                    display: flex; flex-direction: column;
                    align-items: center; gap: 8px;
                    padding: 14px 6px; border-radius: 16px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    cursor: pointer;
                    transition: all 0.25s ease;
                    -webkit-tap-highlight-color: transparent;
                }
                .dash-quick-item:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                }
                .dash-quick-item:active { transform: scale(0.95); }
                .dash-quick-ico {
                    width: 40px; height: 40px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform 0.3s ease;
                }
                .dash-quick-item:hover .dash-quick-ico { transform: scale(1.1) rotate(-3deg); }

                /* ── Content Area ── */
                .dash-content {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 16px;
                    padding: 0 16px 20px;
                    animation: dash-fadeUp 0.5s ease 0.4s both;
                }
                @media (max-width: 960px) {
                    .dash-content { grid-template-columns: 1fr; }
                }

                /* ── Feed ── */
                .dash-feed { display: flex; flex-direction: column; gap: 14px; }

                .dash-tabs {
                    display: flex; gap: 4px;
                    background: rgba(255,255,255,0.03);
                    padding: 4px; border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.05);
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .dash-tabs::-webkit-scrollbar { display: none; }
                .dash-tab {
                    padding: 8px 16px; border-radius: 10px;
                    font-size: 0.76rem; font-weight: 600;
                    color: rgba(148,163,184,0.6);
                    cursor: pointer; white-space: nowrap;
                    border: none; background: none;
                    transition: all 0.25s ease;
                    font-family: inherit;
                }
                .dash-tab:hover { color: rgba(148,163,184,0.9); }
                .dash-tab.active {
                    background: rgba(99,102,241,0.15);
                    color: #A5B4FC;
                }

                .dash-post {
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .dash-post:hover {
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                }
                .dash-post-head {
                    display: flex; align-items: center; gap: 12px;
                    padding: 16px 18px 12px;
                }
                .dash-post-avatar {
                    width: 40px; height: 40px; border-radius: 12px;
                    object-fit: cover; flex-shrink: 0;
                }
                .dash-post-body { padding: 0 18px 14px; }
                .dash-post-actions {
                    display: flex; align-items: center;
                    padding: 10px 18px 14px;
                    border-top: 1px solid rgba(255,255,255,0.04);
                    gap: 4px;
                }
                .dash-post-action {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 12px; border-radius: 10px;
                    font-size: 0.72rem; font-weight: 600;
                    color: rgba(148,163,184,0.5);
                    cursor: pointer; border: none; background: none;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    -webkit-tap-highlight-color: transparent;
                }
                .dash-post-action:hover {
                    background: rgba(255,255,255,0.05);
                    color: rgba(148,163,184,0.8);
                }
                .dash-post-action.liked { color: #EF4444; }
                .dash-post-action.liked:hover { background: rgba(239,68,68,0.08); }
                .dash-post-action.saved { color: #F59E0B; }

                .dash-tag {
                    display: inline-block;
                    padding: 2px 8px; border-radius: 6px;
                    font-size: 0.65rem; font-weight: 600;
                    background: rgba(99,102,241,0.1);
                    color: #818CF8;
                    margin-right: 4px; margin-top: 8px;
                }

                .dash-attachment {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 14px; margin: 10px 0 4px;
                    background: rgba(59,130,246,0.06);
                    border: 1px solid rgba(59,130,246,0.12);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .dash-attachment:hover {
                    background: rgba(59,130,246,0.1);
                    border-color: rgba(59,130,246,0.2);
                }

                /* ── Sidebar Panels ── */
                .dash-sidebar { display: flex; flex-direction: column; gap: 14px; }

                .dash-panel {
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .dash-panel:hover {
                    border-color: rgba(255,255,255,0.08);
                }
                .dash-panel-head {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 18px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .dash-panel-body { padding: 8px 0; }

                /* ── Tasks ── */
                .dash-task {
                    display: flex; align-items: flex-start; gap: 10px;
                    padding: 10px 18px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .dash-task:hover { background: rgba(255,255,255,0.02); }
                .dash-task-check {
                    flex-shrink: 0; margin-top: 1px;
                    cursor: pointer; transition: transform 0.2s ease;
                }
                .dash-task-check:hover { transform: scale(1.15); }

                .dash-priority {
                    display: inline-block;
                    width: 6px; height: 6px; border-radius: 50%;
                    margin-right: 4px; flex-shrink: 0;
                    margin-top: 5px;
                }

                /* ── Schedule ── */
                .dash-sched-item {
                    display: flex; gap: 12px; padding: 10px 18px;
                    transition: background 0.2s ease; cursor: pointer;
                    position: relative;
                }
                .dash-sched-item:hover { background: rgba(255,255,255,0.02); }
                .dash-sched-item.active::before {
                    content: '';
                    position: absolute; left: 0; top: 4px; bottom: 4px;
                    width: 3px; border-radius: 0 3px 3px 0;
                    background: linear-gradient(180deg, #6366F1, #3B82F6);
                }
                .dash-sched-time {
                    width: 48px; flex-shrink: 0;
                    font-size: 0.72rem; font-weight: 700;
                    color: rgba(148,163,184,0.5);
                    padding-top: 1px;
                }
                .dash-sched-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    flex-shrink: 0; margin-top: 5px;
                    position: relative;
                }
                .dash-sched-dot.active::after {
                    content: '';
                    position: absolute; inset: -3px;
                    border-radius: 50%;
                    border: 2px solid;
                    opacity: 0.3;
                    animation: dash-glow 2s ease infinite;
                }

                /* ── Leaderboard ── */
                .dash-lb-item {
                    display: flex; align-items: center; gap: 10px;
                    padding: 8px 18px;
                    transition: background 0.2s ease;
                }
                .dash-lb-item:hover { background: rgba(255,255,255,0.02); }
                .dash-lb-item.you {
                    background: rgba(99,102,241,0.06);
                    border-left: 3px solid #6366F1;
                }
                .dash-lb-rank {
                    width: 22px; height: 22px; border-radius: 7px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.65rem; font-weight: 800;
                    flex-shrink: 0;
                }
                .dash-lb-avatar {
                    width: 30px; height: 30px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.6rem; font-weight: 700; color: #fff;
                    flex-shrink: 0;
                }

                .dash-section-title {
                    display: flex; align-items: center; gap: 8px;
                    padding: 0 16px; margin-bottom: 10px;
                }

                /* ── Streak card ── */
                .dash-streak {
                    margin: 0 16px 16px;
                    padding: 18px 20px;
                    background: linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.08));
                    border: 1px solid rgba(249,115,22,0.15);
                    border-radius: 18px;
                    display: flex; align-items: center; gap: 16px;
                    animation: dash-fadeUp 0.5s ease 0.35s both;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .dash-streak:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(249,115,22,0.15);
                }
                .dash-streak-fire {
                    width: 48px; height: 48px; border-radius: 14px;
                    background: linear-gradient(135deg, #F97316, #EF4444);
                    display: flex; align-items: center; justify-content: center;
                    animation: dash-float 3s ease infinite;
                    box-shadow: 0 6px 20px rgba(249,115,22,0.3);
                    flex-shrink: 0;
                }
            `}</style>

            <div className="dash">

                {/* ── Hero ── */}
                <div className="dash-hero">
                    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <p style={{ margin: '0 0 2px', fontSize: '0.72rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {greeting.emoji} {greeting.sub}
                                </p>
                                <h1 style={{ margin: '0', fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px' }}>
                                    {greeting.text},{' '}
                                    <span style={{
                                        background: 'linear-gradient(135deg, #818CF8, #60A5FA)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}>
                                        {firstName}
                                    </span>
                                </h1>
                                <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'rgba(148,163,184,0.4)' }}>
                                    {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 14px', borderRadius: '12px',
                                background: 'rgba(34,197,94,0.08)',
                                border: '1px solid rgba(34,197,94,0.15)',
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#86EFAC' }}>Semester Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stories ── */}
                <div className="dash-stories-section">
                    <div className="dash-stories-wrap">
                        <button className="dash-story-nav left" onClick={() => scrollStories(-1)}>
                            <ChevronLeft size={14} />
                        </button>
                        <div className="dash-stories" ref={storiesRef}>
                            {/* Add story */}
                            <div className="dash-story-item" onClick={() => setShowStoryModal(true)}>
                                <div style={{
                                    width: '66px', height: '66px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '2px dashed rgba(255,255,255,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Plus size={22} color="rgba(148,163,184,0.5)" />
                                </div>
                                <span className="dash-story-name" style={{ color: 'rgba(148,163,184,0.4)' }}>Your Story</span>
                            </div>
                            {stories.map(s => (
                                <div key={s.id} className="dash-story-item" onClick={() => setActiveStory(s.id)}>
                                    <div
                                        className={`dash-story-ring ${s.seen ? 'seen' : ''}`}
                                        style={{ '--c1': s.gradient[0], '--c2': s.gradient[1] }}
                                    >
                                        <div className="dash-story-inner">{s.avatar}</div>
                                    </div>
                                    <span className="dash-story-name">{s.name}</span>
                                </div>
                            ))}
                        </div>
                        <button className="dash-story-nav right" onClick={() => scrollStories(1)}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="dash-inner">

                    {/* ── Stats ── */}
                    <div className="dash-stats">
                        {stats.map((s, i) => {
                            const Icon = s.icon;
                            const circ = 2 * Math.PI * 18;
                            const offset = circ - (s.ring / 100) * circ;
                            return (
                                <div key={i} className="dash-stat-card" style={{ '--accent': s.color, animationDelay: `${0.2 + i * 0.08}s` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg className="dash-stat-ring-svg" viewBox="0 0 44 44">
                                                <circle className="dash-stat-ring-bg" cx="22" cy="22" r="18" />
                                                <circle
                                                    className="dash-stat-ring-fill"
                                                    cx="22" cy="22" r="18"
                                                    stroke={s.color}
                                                    strokeDasharray={circ}
                                                    strokeDashoffset={offset}
                                                    style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                                                />
                                            </svg>
                                            <div style={{
                                                position: 'absolute',
                                                width: '44px', height: '44px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Icon size={15} color={s.color} />
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.6rem', fontWeight: 700,
                                            color: s.up ? '#22C55E' : '#F59E0B',
                                            padding: '2px 6px', borderRadius: '6px',
                                            background: s.up ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                            display: 'flex', alignItems: 'center', gap: '2px'
                                        }}>
                                            {s.up && <TrendingUp size={9} />} {s.change}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', fontWeight: 800, color: '#F1F5F9', lineHeight: 1 }}>
                                        {s.value}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(148,163,184,0.5)', marginTop: '4px' }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(148,163,184,0.3)', marginTop: '2px' }}>
                                        {s.subtitle}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Quick Actions ── */}
                    <div className="dash-quick">
                        <div className="dash-section-title">
                            <Zap size={14} color="#F59E0B" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1' }}>Quick Access</span>
                        </div>
                        <div className="dash-quick-grid">
                            {quickActions.map((q, i) => {
                                const Icon = q.icon;
                                return (
                                    <div key={i} className="dash-quick-item" onClick={() => navigate(q.route)}>
                                        <div className="dash-quick-ico" style={{ background: `${q.color}15` }}>
                                            <Icon size={19} color={q.color} />
                                        </div>
                                        <span style={{ fontSize: '0.64rem', fontWeight: 600, color: 'rgba(226,232,240,0.6)', textAlign: 'center' }}>
                                            {q.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Streak Card ── */}
                    <div className="dash-streak">
                        <div className="dash-streak-fire">
                            <Flame size={24} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FDBA74' }}>
                                    🔥 14 Day Streak!
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(251,191,36,0.5)' }}>
                                Keep it up! You've been consistent for 2 weeks straight.
                            </p>
                        </div>
                        <div style={{
                            padding: '6px 14px', borderRadius: '10px',
                            background: 'rgba(249,115,22,0.15)',
                            fontSize: '0.68rem', fontWeight: 700, color: '#FB923C',
                            whiteSpace: 'nowrap'
                        }}>
                            Top 5%
                        </div>
                    </div>

                    {/* ── Main Content ── */}
                    <div className="dash-content">

                        {/* ── Feed ── */}
                        <div className="dash-feed">
                            <div className="dash-tabs">
                                {tabs.map(t => (
                                    <button
                                        key={t.id}
                                        className={`dash-tab ${selectedTab === t.id ? 'active' : ''}`}
                                        onClick={() => setSelectedTab(t.id)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {feedPosts.map(post => (
                                <div key={post.id} className="dash-post">
                                    <div className="dash-post-head">
                                        <img className="dash-post-avatar" src={post.avatar} alt={post.author} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0' }}>{post.author}</span>
                                                {post.type === 'announcement' && (
                                                    <span style={{
                                                        fontSize: '0.55rem', fontWeight: 700,
                                                        padding: '1px 6px', borderRadius: '4px',
                                                        background: 'rgba(239,68,68,0.12)', color: '#FCA5A5'
                                                    }}>IMPORTANT</span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.66rem', color: 'rgba(148,163,184,0.4)' }}>{post.role} · {post.time}</span>
                                        </div>
                                        <button style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'rgba(148,163,184,0.3)', padding: '4px'
                                        }}>
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>

                                    <div className="dash-post-body">
                                        <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: '#E2E8F0', lineHeight: 1.4 }}>
                                            {post.title}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(148,163,184,0.55)', lineHeight: 1.6 }}>
                                            {post.content}
                                        </p>

                                        {post.hasAttachment && (
                                            <div className="dash-attachment">
                                                <FileText size={16} color="#60A5FA" />
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#93C5FD', display: 'block' }}>
                                                        Study Material.pdf
                                                    </span>
                                                    <span style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.35)' }}>2.4 MB · PDF</span>
                                                </div>
                                                <Download size={14} color="#60A5FA" />
                                            </div>
                                        )}

                                        <div>
                                            {post.tags.map((tag, i) => (
                                                <span key={i} className="dash-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="dash-post-actions">
                                        <button
                                            className={`dash-post-action ${likedPosts[post.id] ? 'liked' : ''}`}
                                            onClick={() => toggleLike(post.id)}
                                        >
                                            <Heart
                                                size={15}
                                                fill={likedPosts[post.id] ? '#EF4444' : 'none'}
                                                style={likedPosts[post.id] ? { animation: 'dash-heartPop 0.3s ease' } : {}}
                                            />
                                            {likedPosts[post.id] ? post.likes + 1 : post.likes}
                                        </button>
                                        <button className="dash-post-action">
                                            <MessageCircle size={15} /> {post.comments}
                                        </button>
                                        <button className="dash-post-action">
                                            <Share2 size={14} /> {post.shares}
                                        </button>
                                        <div style={{ flex: 1 }} />
                                        <button
                                            className={`dash-post-action ${savedPosts[post.id] ? 'saved' : ''}`}
                                            onClick={() => toggleSave(post.id)}
                                        >
                                            <Bookmark size={15} fill={savedPosts[post.id] ? '#F59E0B' : 'none'} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Sidebar ── */}
                        <div className="dash-sidebar">

                            {/* Today's Schedule */}
                            <div className="dash-panel">
                                <div className="dash-panel-head">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={14} color="#818CF8" />
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0' }}>Today's Schedule</span>
                                    </div>
                                    <span style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.35)', fontWeight: 500 }}>
                                        {currentTime.toLocaleDateString('en-IN', { weekday: 'short' })}
                                    </span>
                                </div>
                                <div className="dash-panel-body">
                                    {timetableToday.map((item, i) => (
                                        <div key={i} className={`dash-sched-item ${item.active ? 'active' : ''}`}>
                                            <span className="dash-sched-time">{item.time}</span>
                                            <div
                                                className={`dash-sched-dot ${item.active ? 'active' : ''}`}
                                                style={{
                                                    background: item.active ? '#6366F1' : 'rgba(148,163,184,0.15)',
                                                    borderColor: '#6366F1'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <span style={{
                                                    fontSize: '0.76rem', fontWeight: 600,
                                                    color: item.active ? '#E2E8F0' : 'rgba(226,232,240,0.55)',
                                                    display: 'block'
                                                }}>
                                                    {item.subject}
                                                </span>
                                                <span style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.3)' }}>
                                                    {item.room} · {item.type}
                                                </span>
                                            </div>
                                            {item.active && (
                                                <span style={{
                                                    fontSize: '0.55rem', fontWeight: 700,
                                                    padding: '2px 6px', borderRadius: '5px',
                                                    background: 'rgba(34,197,94,0.12)', color: '#86EFAC'
                                                }}>NOW</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tasks */}
                            <div className="dash-panel">
                                <div className="dash-panel-head">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle2 size={14} color="#22C55E" />
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0' }}>Upcoming Tasks</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.58rem', fontWeight: 700,
                                        padding: '2px 7px', borderRadius: '6px',
                                        background: 'rgba(99,102,241,0.1)', color: '#818CF8'
                                    }}>
                                        {upcomingTasks.filter(t => !t.done).length} pending
                                    </span>
                                </div>
                                <div className="dash-panel-body">
                                    {upcomingTasks.map(task => (
                                        <div key={task.id} className="dash-task">
                                            <div className="dash-task-check">
                                                {task.done ?
                                                    <CheckCircle2 size={16} color="#22C55E" /> :
                                                    <Circle size={16} color="rgba(148,163,184,0.2)" />
                                                }
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    color: task.done ? 'rgba(148,163,184,0.3)' : '#CBD5E1',
                                                    textDecoration: task.done ? 'line-through' : 'none',
                                                    display: 'block', lineHeight: 1.4
                                                }}>
                                                    {task.title}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <span
                                                        className="dash-priority"
                                                        style={{
                                                            background: task.priority === 'high' ? '#EF4444' :
                                                                task.priority === 'medium' ? '#F59E0B' : '#22C55E'
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '0.6rem',
                                                        color: task.due === 'Yesterday' ? '#FCA5A5' : 'rgba(148,163,184,0.35)',
                                                        fontWeight: 500
                                                    }}>
                                                        {task.due === 'Yesterday' && <AlertCircle size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />}
                                                        {task.due}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="dash-panel">
                                <div className="dash-panel-head">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Star size={14} color="#F59E0B" />
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0' }}>Leaderboard</span>
                                    </div>
                                    <button style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '0.62rem', fontWeight: 600, color: '#818CF8',
                                        display: 'flex', alignItems: 'center', gap: '3px',
                                        fontFamily: 'inherit'
                                    }}>
                                        View All <ChevronRight size={11} />
                                    </button>
                                </div>
                                <div className="dash-panel-body">
                                    {leaderboard.map((lb) => (
                                        <div key={lb.rank} className={`dash-lb-item ${lb.isYou ? 'you' : ''}`}>
                                            <div className="dash-lb-rank" style={{
                                                background: lb.rank <= 3
                                                    ? lb.rank === 1 ? 'rgba(245,158,11,0.15)' : lb.rank === 2 ? 'rgba(148,163,184,0.1)' : 'rgba(217,119,6,0.1)'
                                                    : 'rgba(255,255,255,0.04)',
                                                color: lb.rank <= 3
                                                    ? lb.rank === 1 ? '#FBBF24' : lb.rank === 2 ? '#94A3B8' : '#D97706'
                                                    : 'rgba(148,163,184,0.4)'
                                            }}>
                                                {lb.rank <= 3 ? ['🥇', '🥈', '🥉'][lb.rank - 1] : lb.rank}
                                            </div>
                                            <div className="dash-lb-avatar" style={{
                                                background: lb.isYou ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.08)'
                                            }}>
                                                {lb.avatar}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{
                                                    fontSize: '0.74rem', fontWeight: 600,
                                                    color: lb.isYou ? '#A5B4FC' : '#CBD5E1',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    {lb.name}
                                                    {lb.isYou && <span style={{
                                                        fontSize: '0.5rem', fontWeight: 700,
                                                        padding: '1px 5px', borderRadius: '4px',
                                                        background: 'rgba(99,102,241,0.2)', color: '#818CF8'
                                                    }}>YOU</span>}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.74rem', fontWeight: 800,
                                                color: lb.isYou ? '#818CF8' : 'rgba(226,232,240,0.5)'
                                            }}>
                                                {lb.score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
