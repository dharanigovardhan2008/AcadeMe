import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calculator, Calendar, Users, BookOpen, TrendingUp,
    MessageSquare, ArrowRight, Megaphone, Layers,
    Trophy, Zap, ExternalLink, Activity, Award,
    Target, ChevronRight, Sparkles, Clock, AlertTriangle,
    CheckSquare, Plus, Trash2, Edit3, X, Check, Star, Send
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, limit, getDocs, orderBy, addDoc } from 'firebase/firestore';

// ── Cache ──────────────────────────────────────────────────────────────────────
const CACHE_TTL = 300000;
const getCache = k => { 
    try { 
        const v = sessionStorage.getItem(k);
        const t = sessionStorage.getItem(`${k}_t`); 
        if (!v || !t || Date.now() - +t > CACHE_TTL) return null; 
        return JSON.parse(v); 
    } catch {
        return null;
    } 
};
const setCache = (k, d) => { 
    try {
        sessionStorage.setItem(k, JSON.stringify(d));
        sessionStorage.setItem(`${k}_t`, String(Date.now()));
    } catch {}
};

// ── Animated counter ───────────────────────────────────────────────────────────
const Counter = ({ value, decimals = 0, suffix = '' }) => {
    const [disp, setDisp] = useState(0);
    const num = parseFloat(value) || 0;
    
    useEffect(() => {
        let t0 = null;
        const dur = 800;
        const tick = ts => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            setDisp(+(num * e).toFixed(decimals));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [num, decimals]);
    
    return <>{disp.toFixed(decimals)}{suffix}</>;
};

const QUOTES = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it's done.",
    "Education is the passport to the future.",
    "Dream big. Work hard. Stay focused.",
];

const getAttendanceInsight = (att, tot) => {
    if (tot === 0) return { type: 'neutral', text: 'No classes yet' };
    const pct = (att / tot) * 100;
    if (pct < 80) {
        const needed = Math.ceil(4 * tot - 5 * att);
        return { type: 'danger', text: `Need ${needed} more class${needed > 1 ? 'es' : ''}` };
    } else {
        const bunk = Math.floor(1.25 * att - tot);
        if (bunk === 0) return { type: 'warning', text: 'Exactly on 80%' };
        return { type: 'success', text: `Can bunk ${bunk} class${bunk > 1 ? 'es' : ''}` };
    }
};

const getSubjectCode = (s, fallbackName) => {
    const explicit = s.code || s.courseCode || s.subjectCode;
    if (explicit) return String(explicit).toUpperCase();
    const initials = (fallbackName || '')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase();
    if (initials.length >= 2) return initials.substring(0, 6);
    return (fallbackName || '').substring(0, 6).toUpperCase();
};

const Dashboard = () => {
    const { user } = useAuth();
    const { cgpaSubjects = [], attendanceSubjects = [], faculty = [], awardPoints } = useData() || {};
    const navigate = useNavigate();
    const [updates, setUpdates] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('attendance'); 
    const [selectedPointId, setSelectedPointId] = useState(null);

    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 640 : false
    );
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // ── Local To-Do State ─────────────────────────────────────────────────────
    const [todos, setTodos] = useState(() => {
        try {
            const saved = localStorage.getItem('dash_local_todos');
            return saved ? JSON.parse(saved) : [
                { id: 1, text: 'Complete Lab Report', done: false },
                { id: 2, text: 'Review Mathematics Notes', done: true }
            ];
        } catch {
            return [];
        }
    });
    const [newTodoText, setNewTodoText] = useState('');
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editingTodoText, setEditingTodoText] = useState('');
    const [todoFilter, setTodoFilter] = useState('all');

    useEffect(() => {
        try {
            localStorage.setItem('dash_local_todos', JSON.stringify(todos));
        } catch {}
    }, [todos]);

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;
        setTodos(prev => [...prev, { id: Date.now(), text: newTodoText.trim(), done: false }]);
        setNewTodoText('');
    };

    const handleToggleTodo = (id) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const handleDeleteTodo = (id) => {
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    const handleStartEditTodo = (todo) => {
        setEditingTodoId(todo.id);
        setEditingTodoText(todo.text);
    };

    const handleSaveEditTodo = (id) => {
        if (!editingTodoText.trim()) return;
        setTodos(prev => prev.map(t => t.id === id ? { ...t, text: editingTodoText.trim() } : t));
        setEditingTodoId(null);
    };

    const completedTodoCount = todos.filter(t => t.done).length;
    const todoProgressPct = todos.length ? Math.round((completedTodoCount / todos.length) * 100) : 0;
    const filteredTodos = todos.filter(t => {
        if (todoFilter === 'active') return !t.done;
        if (todoFilter === 'done') return t.done;
        return true;
    });

    // ── Faculty Rating Prompt State ───────────────────────────────────────────
    const [pendingRatingSubject, setPendingRatingSubject] = useState(null);
    const [promptRating, setPromptRating] = useState(0);
    const [promptFeedback, setPromptFeedback] = useState('');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    useEffect(() => {
        try {
            const pendingList = JSON.parse(localStorage.getItem('removed_subjects_for_review') || '[]');
            const snoozedUntil = localStorage.getItem('faculty_prompt_snoozed_until');
            if (pendingList.length > 0 && (!snoozedUntil || Date.now() > Number(snoozedUntil))) {
                setPendingRatingSubject(pendingList[0]);
            }
        } catch {}
    }, []);

    const handleSnoozePrompt = () => {
        localStorage.setItem('faculty_prompt_snoozed_until', String(Date.now() + 86400000));
        setPendingRatingSubject(null);
    };

    const handleSubmitQuickRating = async () => {
        if (!promptRating) return alert('Please select a star rating');
        setIsSubmittingRating(true);
        try {
            await addDoc(collection(db, "facultyReviews"), {
                facultyName: pendingRatingSubject.facultyName || 'Unspecified Faculty',
                courseName: pendingRatingSubject.name || pendingRatingSubject.courseName || 'Course',
                courseCode: pendingRatingSubject.code || 'N/A',
                rating: promptRating,
                feedback: promptFeedback || 'Submitted via quick dashboard review prompt.',
                createdAt: new Date().toISOString(),
                reviewerName: user?.name || 'Student',
                reviewerEmail: user?.email || '',
                reviewerId: user?.uid || '',
                facultyType: 'Moderate',
                minInternals: 40,
                mobileAllowed: true,
                likes: [], dislikes: [], comments: []
            });

            if (awardPoints && user?.uid) {
                await awardPoints(user.uid, user.name, 25, 'Submitted a faculty review');
            }

            const pendingList = JSON.parse(localStorage.getItem('removed_subjects_for_review') || '[]');
            const updatedList = pendingList.filter(s => s.id !== pendingRatingSubject.id);
            localStorage.setItem('removed_subjects_for_review', JSON.stringify(updatedList));

            setPendingRatingSubject(updatedList[0] || null);
            setPromptRating(0);
            setPromptFeedback('');
        } catch (e) {
            console.error('Error submitting review:', e);
        }
        setIsSubmittingRating(false);
    };

    // ── Streak Calculation ───────────────────────────────────────────────────
    const streakDays = (() => {
        try {
            const lastActive = localStorage.getItem('user_last_active_date');
            const today = new Date().toDateString();
            let current = Number(localStorage.getItem('user_streak_count') || 1);
            if (lastActive !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastActive === yesterday.toDateString()) {
                    current += 1;
                } else {
                    current = 1;
                }
                localStorage.setItem('user_last_active_date', today);
                localStorage.setItem('user_streak_count', String(current));
            }
            return current;
        } catch {
            return 1;
        }
    })();

    const quote = QUOTES[new Date().getDay() % QUOTES.length];
    const userName = user?.name?.split(' ')[0] || 'Student';

    useEffect(() => { 
        const t = setTimeout(() => setMounted(true), 50); 
        return () => clearTimeout(t); 
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const hit = getCache('dash_updates');
                if (hit) setUpdates(hit);
                const snap = await getDocs(query(collection(db, 'updates'), orderBy('date', 'desc'), limit(5)));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setCache('dash_updates', list);
                setUpdates(list);
            } catch (e) { 
                console.error(e); 
            }
        })();
    }, []);

    useEffect(() => {
        setSelectedPointId(null);
    }, [activeTab]);

    const cgpa = (() => {
        if (!cgpaSubjects?.length) return 0;
        const gp = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
        return +(cgpaSubjects.reduce((s, x) => s + (gp[x.grade] || 0), 0) / cgpaSubjects.length).toFixed(2);
    })();

    const attendanceStats = (() => {
        if (!attendanceSubjects?.length) return { lowestPct: 0, lowestName: '', below80: [] };
        let lowest = Infinity;
        let lowestName = '';
        let below80 = [];
        
        attendanceSubjects.forEach((s, i) => {
            const tot = Number(s.total || 0);
            const att = Number(s.attended || 0);
            const pct = tot ? (att / tot) * 100 : 0;
            const fullName = s.name || s.courseName || s.subject || `Subject ${i+1}`;
            
            if (tot > 0) {
                if (pct < lowest) {
                    lowest = pct;
                    lowestName = fullName;
                }
                if (pct < 80) {
                    below80.push({ name: fullName, pct });
                }
            }
        });
        
        return { 
            lowestPct: lowest === Infinity ? 0 : lowest, 
            lowestName: lowestName || 'No Data', 
            below80: below80.sort((a, b) => a.pct - b.pct) 
        };
    })();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetMoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

    const recentSubjectLimit = isMobile ? 4 : 8;

    const gpMap = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
    const chartData = (activeTab === 'attendance'
        ? attendanceSubjects.map((s, i) => {
            const tot = Number(s.total || 0);
            const att = Number(s.attended || 0);
            const pct = tot ? (att / tot) * 100 : 0;
            const fullName = s.name || s.courseName || s.subject || `Sub ${i+1}`;
            const code = getSubjectCode(s, fullName);
            return {
                id: s.id || `att-${i}`,
                fullName: fullName,
                code: code,
                label: fullName.substring(0, 15) + (fullName.length > 15 ? '...' : ''),
                xLabel: code,
                val: att,
                maxVal: tot,
                pct: pct,
                color: pct >= 80 ? '#34C759' : '#FF3B30', 
                rawPct: pct,
                insight: getAttendanceInsight(att, tot)
            };
        })
        : cgpaSubjects.map((s, i) => {
            const pts = gpMap[s.grade] || 0;
            const fullName = s.courseName || s.name || s.subject || `Sub ${i+1}`;
            const code = getSubjectCode(s, fullName);
            return {
                id: s.id || `cgpa-${i}`,
                fullName: fullName,
                code: code,
                label: fullName.substring(0, 15) + (fullName.length > 15 ? '...' : ''),
                xLabel: code,
                val: pts,
                maxVal: 10,
                pct: (pts / 10) * 100,
                color: pts >= 8 ? '#0071E3' : '#5856D6',
                rawPct: pts * 10
            };
        })
    ).slice(-recentSubjectLimit);

    // Exactly 4 metrics boxes (including Streak and Faculty Reviews CTA)
    const activeStats = [
        { icon: BookOpen, value: cgpaSubjects.length, label: 'Active Courses', color: '#5856D6', detail: 'This semester' },
        { icon: Users, value: faculty.length || 0, label: 'Faculty Network', color: '#FF2D55', detail: 'Browse directory', onClick: () => navigate('/faculty') },
        { icon: Zap, value: streakDays, label: 'Day Streak', color: '#FF9500', detail: 'Keep it going!', suffix: ' Days' },
        { icon: MessageSquare, value: 'Reviews', label: 'Faculty Feedback', color: '#0071E3', detail: 'Explore reviews', isCta: true, onClick: () => navigate('/reviews') }
    ];

    const actions = [
        { label: 'My Courses', icon: BookOpen, path: '/courses' },
        { label: 'CGPA Calc', icon: Calculator, path: '/calc' },
        { label: 'Attendance', icon: Calendar, path: '/attendance' },
        { label: 'Faculty', icon: Users, path: '/faculty' },
        { label: 'Resources', icon: Layers, path: '/resources' },
        { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    ];

    const generateChartPath = (data) => {
        if (!data || data.length === 0) return { pathD: '', areaD: '', points: [] };
        const width = 1000;
        const height = 180;
        const padding = 20;
        const effectiveHeight = height - padding * 2;
        const step = data.length > 1 ? width / (data.length - 1) : width;

        const points = data.map((d, i) => ({
            id: d.id, x: i * step, y: padding + effectiveHeight - (d.pct / 100) * effectiveHeight,
            label: d.xLabel, fullName: d.fullName, pct: d.rawPct, val: d.val
        }));

        let pathD = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i-1];
            const curr = points[i];
            const cpX = (prev.x + curr.x) / 2;
            pathD += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
        }
        const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
        return { pathD, areaD, points };
    };

    const { pathD, areaD, points } = generateChartPath(chartData);
    const chartColor = activeTab === 'attendance' ? '#5856D6' : '#0071E3';

    const handlePointClick = (id) => setSelectedPointId(prev => prev === id ? null : id);

    let heroVal, heroDecimals, heroSuffix, heroColor, heroStatusText, heroStatusBg, heroSubtext;
    const selectedData = selectedPointId !== null ? chartData.find(d => d.id === selectedPointId) : null;
    const displayInsights = activeTab === 'attendance' ? (selectedData ? [selectedData] : chartData) : [];

    if (selectedData) {
        heroVal = activeTab === 'attendance' ? selectedData.rawPct : selectedData.val;
        heroDecimals = 0;
        heroSuffix = activeTab === 'attendance' ? '%' : ' Pts';
        heroColor = selectedData.color;
        
        if (activeTab === 'attendance') {
            const isSafe = selectedData.rawPct >= 80;
            heroStatusText = isSafe ? 'Safe ✓' : 'Below 80% ⚠';
            heroStatusBg = isSafe ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)';
        } else {
            heroStatusText = selectedData.val >= 8 ? 'Excellent ✓' : (selectedData.val >= 6 ? 'Good ✓' : 'Needs Work ⚠');
            heroStatusBg = selectedData.val >= 8 ? 'rgba(0,113,227,0.1)' : (selectedData.val >= 6 ? 'rgba(255,149,0,0.1)' : 'rgba(255,59,48,0.1)');
        }
        heroSubtext = selectedData.fullName;
    } else {
        if (activeTab === 'attendance') {
            heroVal = attendanceStats.lowestPct;
            heroDecimals = 0;
            heroSuffix = '%';
            const isSafe = heroVal >= 80;
            heroColor = isSafe ? '#34C759' : '#FF3B30';
            heroStatusText = isSafe ? 'Lowest Subject ✓' : 'Below 80% ⚠';
            heroStatusBg = isSafe ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)';
            
            heroSubtext = (
                <React.Fragment>
                    <span style={{ display: 'block', color: '#111827', marginBottom: '4px' }}>
                        Lowest: {attendanceStats.lowestName}
                    </span>
                    <span style={{ fontSize: '0.8125rem' }}>
                        {attendanceStats.below80.length > 0 
                            ? `At Risk: ${attendanceStats.below80.map(s => s.name.substring(0,12)).join(', ')}...` 
                            : 'All courses safe'}
                    </span>
                </React.Fragment>
            );
        } else {
            heroVal = cgpa;
            heroDecimals = 2;
            heroSuffix = '';
            heroColor = cgpa >= 8 ? '#0071E3' : (cgpa >= 6 ? '#FF9500' : '#FF3B30');
            heroStatusText = cgpa >= 8 ? 'Excellent ✓' : (cgpa >= 6 ? 'Good ✓' : 'Needs Work ⚠');
            heroStatusBg = cgpa >= 8 ? 'rgba(0,113,227,0.1)' : (cgpa >= 6 ? 'rgba(255,149,0,0.1)' : 'rgba(255,59,48,0.1)');
            heroSubtext = `Overall CGPA (${cgpaSubjects.length} Subjects)`;
        }
    }

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&display=swap');

        * { box-sizing: border-box; }

        .dash-root {
            font-family: var(--font-body);
            min-height: 100vh;
            background: #F8F9FA;
            position: relative;
            overflow-x: hidden;
            width: 100%;
            padding: 2rem 1.5rem 4rem;
            color: var(--text-primary);
        }

        .dash-bg-blob { position: fixed; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; opacity: 0.6; }
        .blob-lavender { top: -10%; left: -5%; width: 600px; height: 600px; background: #E6E6FA; }
        .blob-peach { bottom: -15%; right: -5%; width: 700px; height: 700px; background: #FFDAB9; }

        .dash-main-container {
            position: relative; z-index: 1; max-width: 1400px; margin: 0 auto;
            display: grid; gap: 2rem; align-items: start; transition: all 0.4s ease;
            grid-template-columns: 1fr 360px;
            width: 100%;
        }

        @media (max-width: 1024px) {
            .dash-main-container { grid-template-columns: 1fr; }
        }

        .dash-glass-panel {
            background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
            border-radius: 32px; padding: 2.5rem; transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
            width: 100%; min-width: 0;
        }

        .dash-hero-header { margin-bottom: 1.5rem; animation: fadeInDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dash-hero-title {
            font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 6vw, 3.2rem);
            font-weight: 600; line-height: 1.15; color: #111827; margin: 0 0 0.5rem; letter-spacing: -0.03em;
            word-break: break-word;
        }
        .dash-hero-date { font-size: clamp(0.9rem, 2.5vw, 1.05rem); font-weight: 500; color: #4B5563; margin: 0 0 0.5rem; }
        .dash-hero-quote { font-size: 0.9375rem; color: #6B7280; font-style: italic; margin: 0; max-width: 600px; }

        .dash-toggle-wrap {
            display: inline-flex; width: 100%; max-width: 340px; background: rgba(0, 0, 0, 0.05); padding: 0.375rem;
            border-radius: 999px; position: relative; margin-bottom: 2rem; animation: fadeInUp 0.6s 0.1s both;
        }
        .dash-toggle-slider {
            position: absolute; top: 0.375rem; bottom: 0.375rem; width: calc(50% - 0.375rem);
            background: #FFFFFF; border-radius: 999px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 1;
        }
        .dash-toggle-btn {
            position: relative; z-index: 2; flex: 1; padding: 0.75rem 1rem;
            border: none; background: transparent; font-family: inherit; font-size: 0.9375rem;
            font-weight: 600; color: #4B5563; cursor: pointer; transition: color 0.25s ease;
            min-width: 44px; min-height: 44px; text-align: center;
        }
        .dash-toggle-btn.active { color: #111827; }

        .dash-hero-stat-area {
            display: flex; justify-content: space-between; align-items: flex-start;
            gap: 2rem; margin-bottom: 2.5rem; animation: fadeInUp 0.6s 0.2s both; flex-wrap: wrap;
        }
        .dash-hero-stat-left { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; }
        .dash-hero-number {
            font-size: clamp(2.75rem, 10vw, 5rem); font-weight: 800; line-height: 1;
            letter-spacing: -0.04em; transition: color 0.4s ease; word-break: break-word;
        }
        .dash-hero-status { display: inline-flex; flex-direction: column; gap: 0.25rem; }
        .dash-status-badge {
            display: inline-flex; align-items: center; padding: 0.375rem 0.875rem;
            border-radius: 999px; font-size: 0.875rem; font-weight: 700; width: fit-content;
        }
        .dash-status-sub { font-size: 0.875rem; font-weight: 600; color: #4B5563; max-width: 400px; line-height: 1.4; margin-top: 0.25rem; }

        .dash-insights-box {
            flex: 1 1 280px; min-width: 0; max-width: 420px; background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(0, 0, 0, 0.06); border-radius: 24px; padding: 1.25rem 1.5rem;
            max-height: 170px; display: flex; flex-direction: column; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
        }
        .dash-insights-title {
            margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 700; color: #111827;
            text-transform: uppercase; letter-spacing: 0.05em;
        }
        .dash-insights-list {
            overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; scrollbar-width: none;
        }
        .dash-insights-list::-webkit-scrollbar { display: none; }
        .dash-insight-item {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0.5rem 0; border-bottom: 1px solid rgba(0,0,0,0.04); gap: 1rem;
        }
        .dash-insight-item:last-child { border-bottom: none; }
        .dash-insight-name {
            font-size: 0.8125rem; font-weight: 600; color: #4B5563;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
        }
        .dash-insight-badge {
            font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.625rem;
            border-radius: 999px; white-space: nowrap; flex-shrink: 0;
        }
        .dash-insight-badge.danger { background: rgba(255, 59, 48, 0.1); color: #FF3B30; }
        .dash-insight-badge.success { background: rgba(52, 199, 89, 0.1); color: #34C759; }
        .dash-insight-badge.warning { background: rgba(255, 149, 0, 0.1); color: #FF9500; }
        .dash-insight-badge.neutral { background: rgba(0, 0, 0, 0.05); color: #6B7280; }

        /* Quick Faculty Rating Box */
        .dash-prompt-box {
            background: linear-gradient(135deg, rgba(88, 86, 214, 0.06) 0%, rgba(0, 113, 227, 0.06) 100%);
            border: 1px solid rgba(88, 86, 214, 0.2); border-radius: 24px; padding: 1.5rem;
            margin-bottom: 2rem; position: relative; animation: fadeInUp 0.5s both;
        }
        .dash-prompt-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
        .dash-prompt-sub { font-size: 0.85rem; color: #6B7280; margin-bottom: 1rem; }
        .dash-prompt-stars { display: flex; gap: 8px; margin-bottom: 1rem; }
        .dash-prompt-input {
            width: 100%; padding: 0.75rem 1rem; background: #FFFFFF; border: 1px solid rgba(0,0,0,0.1);
            border-radius: 12px; font-size: 16px; outline: none; margin-bottom: 1rem; color: #111827;
        }

        .dash-chart-section { margin-bottom: 3rem; animation: fadeInUp 0.6s 0.3s both; position: relative; width: 100%; min-width: 0; }
        .dash-svg-chart-container { width: 100%; height: 200px; position: relative; margin-bottom: 0.5rem; }
        .dash-svg-curve { width: 100%; height: 100%; overflow: visible; }
        .dash-svg-point { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: pointer; }
        .dash-svg-point:hover { transform: scale(1.2); }
        
        .dash-chart-labels-container { position: relative; height: 36px; width: 100%; }
        .dash-chart-label-abs {
            position: absolute; transform: translateX(-50%); font-size: 0.8125rem; font-weight: 700;
            letter-spacing: 0.02em; color: #6B7280; text-align: center; white-space: nowrap; max-width: 120px;
            overflow: hidden; text-overflow: ellipsis; cursor: pointer; transition: color 0.2s ease;
            padding: 4px 2px;
        }
        .dash-chart-label-abs:hover, .dash-chart-label-abs.active { color: #111827; }

        .dash-chart-legend {
            display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem;
            font-weight: 600; color: #4B5563; margin-top: 1.5rem; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 1rem;
            flex-wrap: wrap; gap: 0.75rem;
        }
        .dash-legend-item { display: flex; align-items: center; gap: 0.5rem; }
        .dash-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .dash-clear-selection {
            background: none; border: none; color: #6B7280; font-size: 0.75rem; font-weight: 600;
            cursor: pointer; text-decoration: underline; padding: 8px 0;
        }

        .dash-small-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem; animation: fadeInUp 0.6s 0.4s both; }
        @media (max-width: 1024px) {
            .dash-small-cards { grid-template-columns: repeat(2, 1fr); }
        }
        .dash-small-card {
            background: #FFFFFF; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 4px 16px rgba(0,0,0,0.02);
            border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
            min-width: 0;
            aspect-ratio: 1 / 1;
        }
        .dash-small-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .dash-sc-header { display: flex; align-items: center; justify-content: space-between; }
        .dash-sc-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: #F8F9FA; flex-shrink: 0; }
        .dash-sc-value { font-size: 1.75rem; font-weight: 800; color: #111827; line-height: 1; margin-bottom: 0.25rem; }
        .dash-sc-label { font-size: 0.875rem; font-weight: 600; color: #4B5563; margin-bottom: 0.25rem; }
        .dash-sc-detail { font-size: 0.8rem; font-weight: 600; }
        
        .dash-card-cta { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: #FFFFFF; cursor: pointer; }
        .dash-card-cta .dash-sc-icon-wrap { background: rgba(255,255,255,0.1); color: #FFFFFF; }
        .dash-card-cta .dash-sc-label { color: #9CA3AF; }
        .dash-card-cta .dash-sc-value { color: #FFFFFF; }
        .dash-card-cta .dash-sc-detail { color: #FFFFFF; display: flex; align-items: center; gap: 6px; }

        .dash-qa-title { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; margin-bottom: 1rem; }
        .dash-qa-grid { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; scrollbar-width: none; -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; margin: 0 -1.5rem; padding-left: 1.5rem; padding-right: 1.5rem; }
        .dash-qa-grid::-webkit-scrollbar { display: none; }
        .dash-qa-item {
            flex: 0 0 auto; display: flex; align-items: center; gap: 0.75rem; background: #FFFFFF; border: 1px solid rgba(0,0,0,0.04);
            padding: 0.75rem 1.25rem 0.75rem 0.75rem; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); cursor: pointer; transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
            min-height: 44px; scroll-snap-align: start;
        }
        .dash-qa-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .dash-qa-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #F3F4F6; flex-shrink: 0; }
        .dash-qa-label { font-size: 0.875rem; font-weight: 600; color: #374151; white-space: nowrap; }

        .dash-sidebar { display: flex; flex-direction: column; gap: 1.5rem; height: 100%; min-width: 0; }
        
        /* Local To-Do Section Styling */
        .dash-todo-card { background: #FFFFFF; border-radius: 24px; padding: 1.5rem; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 12px rgba(0,0,0,0.02); min-width: 0; }

        .dash-todo-progress-wrap { margin-bottom: 1.1rem; }
        .dash-todo-progress-track { width: 100%; height: 8px; background: #F3F4F6; border-radius: 999px; overflow: hidden; }
        .dash-todo-progress-fill { height: 100%; background: linear-gradient(90deg, #34C759, #0071E3); border-radius: 999px; transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
        .dash-todo-progress-text { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-top: 6px; }

        .dash-todo-input-wrap { display: flex; gap: 8px; margin-bottom: 1rem; }
        .dash-todo-input { flex: 1; min-width: 0; padding: 0.625rem 0.875rem; border-radius: 12px; border: 1px solid #E5E7EB; font-size: 16px; outline: none; }
        .dash-todo-add-btn { background: #111827; color: white; border: none; border-radius: 12px; padding: 0 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; flex-shrink: 0; }

        .dash-todo-filters { display: flex; gap: 4px; background: #F8F9FA; padding: 4px; border-radius: 12px; margin-bottom: 1rem; }
        .dash-todo-filter-btn { flex: 1; border: none; background: transparent; padding: 7px 6px; border-radius: 9px; font-size: 0.75rem; font-weight: 700; color: #6B7280; cursor: pointer; transition: all 0.2s ease; min-height: 32px; }
        .dash-todo-filter-btn.active { background: #FFFFFF; color: #111827; box-shadow: 0 2px 6px rgba(0,0,0,0.07); }

        .dash-todo-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; scrollbar-width: none; }
        .dash-todo-list::-webkit-scrollbar { display: none; }

        .dash-todo-item-v2 { display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.75rem; border-radius: 14px; background: #F8F9FA; transition: background 0.2s ease; }
        .dash-todo-item-v2.done { background: rgba(52, 199, 89, 0.07); }

        .dash-todo-check-circle { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #D1D5DB; background: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.2s ease; }
        .dash-todo-check-circle.done { background: #34C759; border-color: #34C759; }

        .dash-todo-text-v2 { flex: 1; min-width: 0; font-size: 0.85rem; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dash-todo-text-v2.done { color: #9CA3AF; text-decoration: line-through; }

        .dash-todo-actions-v2 { display: flex; gap: 2px; flex-shrink: 0; }
        .dash-todo-icon-btn { border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
        .dash-todo-icon-btn:hover { background: rgba(0,0,0,0.06); }

        .dash-todo-empty-v2 { text-align: center; padding: 1.5rem 0.5rem; color: #9CA3AF; font-size: 0.8rem; margin: 0; }

        .dash-sb-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
        .dash-sb-title { font-size: 1.15rem; font-weight: 700; color: #111827; margin: 0; }
        .dash-sb-badge { background: rgba(0, 113, 227, 0.1); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
        
        .dash-ann-card {
            background: #FFFFFF; border-radius: 20px; padding: 1.25rem; border: 1px solid rgba(0,0,0,0.04);
            box-shadow: 0 2px 12px rgba(0,0,0,0.02); display: flex; gap: 1rem; margin-bottom: 1rem; transition: transform 0.3s ease;
            min-width: 0;
        }
        .dash-ann-card:hover { transform: translateX(4px); box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
        .dash-ann-icon-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FFCC00 0%, #FF9500 100%); display: flex; align-items: center; justify-content: center; color: #FFFFFF; flex-shrink: 0; }
        .dash-ann-content { min-width: 0; flex: 1; }
        .dash-ann-title { font-size: 0.9375rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; word-break: break-word; }
        .dash-ann-date { font-size: 0.75rem; font-weight: 500; color: #9CA3AF; margin-bottom: 0.5rem; display: block; }
        .dash-ann-link { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; font-weight: 600; color: var(--primary); text-decoration: none; padding: 4px 0; }

        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dashDrawArea { from { opacity: 0; clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); } to { opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); } }

        /* ── Mobile ── */
        @media (max-width: 640px) {
            .dash-root { padding: 1.25rem 1rem 3rem; }
            .dash-glass-panel { padding: 1.25rem; border-radius: 22px; }
            .dash-hero-stat-area { flex-direction: column; gap: 1.25rem; }
            .dash-insights-box { max-width: 100%; min-width: 100%; }
            .dash-svg-chart-container { height: 180px; }
            .dash-hero-title { font-size: clamp(1.6rem, 7vw, 2rem); }
            .dash-small-cards { grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
            .dash-small-card { aspect-ratio: auto; }
            .dash-toggle-wrap { max-width: 100%; }
            .dash-prompt-box { padding: 1.25rem; }
            .dash-chart-label-abs { font-size: 0.7rem; max-width: 70px; }

            .dash-qa-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
                overflow-x: visible;
                margin: 0;
                padding: 0;
                scroll-snap-type: none;
            }
            .dash-qa-item {
                width: 100%;
                padding: 0.75rem 0.85rem;
            }
            .dash-qa-label { white-space: normal; line-height: 1.15; }
        }

        @media (prefers-reduced-motion: reduce) {
            .dash-hero-header, .dash-toggle-wrap, .dash-hero-stat-area, .dash-chart-section,
            .dash-small-cards, .dash-prompt-box, .dash-ann-card, .dash-svg-chart-container g {
                animation: none !important;
            }
            .dash-small-card:hover, .dash-ann-card:hover { transform: none; }
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            <div className="dash-root" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                
                <div className="dash-bg-blob blob-peach" />
                <div className="dash-bg-blob blob-lavender" />

                <div className="dash-main-container">
                    
                    {/* LEFT COLUMN: Main Dashboard Panel */}
                    <div className="dash-glass-panel">
                        
                        <div className="dash-hero-header">
                            <h1 className="dash-hero-title">
                                {greeting}, {userName} {greetMoji}
                            </h1>
                            <p className="dash-hero-date">
                                {new Date().toLocaleDateString('en-IN', { 
                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                                })}
                            </p>
                            <p className="dash-hero-quote">"{quote}"</p>
                        </div>

                        {/* Quick 1-Tap Faculty Rating Prompt */}
                        {pendingRatingSubject && (
                            <div className="dash-prompt-box">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <h3 className="dash-prompt-title">Rate Faculty: {pendingRatingSubject.facultyName || pendingRatingSubject.name}</h3>
                                        <p className="dash-prompt-sub">You recently removed {pendingRatingSubject.name || pendingRatingSubject.courseName}. Mind leaving a 1-tap review?</p>
                                    </div>
                                    <button onClick={handleSnoozePrompt} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', flexShrink: 0, width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Snooze for 24h">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="dash-prompt-stars">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star 
                                            key={s} 
                                            size={28} 
                                            fill={s <= promptRating ? "#FFCC00" : "none"} 
                                            color={s <= promptRating ? "#FFCC00" : "#D1D5DB"} 
                                            style={{ cursor: 'pointer', transition: 'transform 0.1s' }} 
                                            onClick={() => setPromptRating(s)}
                                        />
                                    ))}
                                </div>
                                {promptRating > 0 && (
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Optional brief feedback..." 
                                            className="dash-prompt-input" 
                                            value={promptFeedback} 
                                            onChange={e => setPromptFeedback(e.target.value)} 
                                        />
                                        <button 
                                            onClick={handleSubmitQuickRating} 
                                            disabled={isSubmittingRating} 
                                            style={{ background: '#111827', color: 'white', border: 'none', padding: '10px 16px', minHeight: '44px', borderRadius: '12px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Send size={14} /> {isSubmittingRating ? 'Posting...' : 'Submit Review (+25 pts)'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="dash-toggle-wrap">
                            <div className="dash-toggle-slider" style={{ transform: activeTab === 'cgpa' ? 'translateX(100%)' : 'translateX(0)' }} />
                            <button className={`dash-toggle-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                                Attendance
                            </button>
                            <button className={`dash-toggle-btn ${activeTab === 'cgpa' ? 'active' : ''}`} onClick={() => setActiveTab('cgpa')}>
                                CGPA
                            </button>
                        </div>

                        <div className="dash-hero-stat-area">
                            <div className="dash-hero-stat-left">
                                <div className="dash-hero-number" style={{ color: heroColor }}>
                                    <Counter value={heroVal} decimals={heroDecimals} suffix={heroSuffix} />
                                </div>
                                <div className="dash-hero-status">
                                    <span className="dash-status-badge" style={{ color: heroColor, background: heroStatusBg }}>
                                        {heroStatusText}
                                    </span>
                                    <span className="dash-status-sub">
                                        {heroSubtext}
                                    </span>
                                </div>
                            </div>
                            
                            {activeTab === 'attendance' && displayInsights.length > 0 && (
                                <div className="dash-insights-box">
                                    <h4 className="dash-insights-title">
                                        {selectedData ? 'Subject Insight' : 'Attendance Insights'}
                                    </h4>
                                    <div className="dash-insights-list">
                                        {displayInsights.map((d, i) => (
                                            <div key={d.id || i} className="dash-insight-item">
                                                <span className="dash-insight-name" title={d.fullName}>
                                                    {d.label}
                                                </span>
                                                <span className={`dash-insight-badge ${d.insight?.type}`}>
                                                    {d.insight?.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="dash-chart-section">
                            {chartData.length > 0 ? (
                                <>
                                    <div className="dash-svg-chart-container">
                                        <svg viewBox="0 0 1000 180" className="dash-svg-curve" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                                                </linearGradient>
                                            </defs>
                                            {mounted && (
                                                <g style={{ animation: 'dashDrawArea 1s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
                                                    <path d={areaD} fill="url(#chartAreaGrad)" />
                                                    <path d={pathD} fill="none" stroke={chartColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                    {points.map((p, i) => {
                                                        const isSelected = selectedPointId === p.id;
                                                        return (
                                                            <g key={i} onClick={() => handlePointClick(p.id)}>
                                                                {/* Invisible larger target for touch/click ease */}
                                                                <circle cx={p.x} cy={p.y} r="18" fill="transparent" style={{ cursor: 'pointer' }} />
                                                                <circle 
                                                                    className="dash-svg-point"
                                                                    cx={p.x} cy={p.y} r={isSelected ? "5.5" : "4.5"}
                                                                    fill={isSelected ? chartColor : "#FFFFFF"} 
                                                                    stroke={chartColor} strokeWidth="2.5"
                                                                    vectorEffect="non-scaling-stroke"
                                                                >
                                                                    <title>{p.fullName}: {p.pct.toFixed(1)}{activeTab === 'attendance' ? '%' : ' Pts'}</title>
                                                                </circle>
                                                            </g>
                                                        );
                                                    })}
                                                </g>
                                            )}
                                        </svg>
                                    </div>
                                    <div className="dash-chart-labels-container">
                                        {points.map((p, i) => (
                                            <div 
                                                key={i} 
                                                className={`dash-chart-label-abs ${selectedPointId === p.id ? 'active' : ''}`}
                                                style={{ left: `${(p.x / 1000) * 100}%` }} 
                                                title={p.fullName}
                                                onClick={() => handlePointClick(p.id)}
                                            >
                                                {p.label}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>No data available to display.</p>
                            )}
                            
                            <div className="dash-chart-legend">
                                <div className="dash-legend-item">
                                    <div className="dash-legend-dot" style={{ background: chartColor }} /> 
                                    {activeTab === 'attendance' 
                                        ? `Course Attendance Target · Recent ${chartData.length}` 
                                        : `Course Grade Points · Recent ${chartData.length}`}
                                </div>
                                {selectedPointId && (
                                    <button className="dash-clear-selection" onClick={() => setSelectedPointId(null)}>Clear Selection</button>
                                )}
                            </div>
                        </div>

                        {/* Exactly 4 Small Grid Cards */}
                        <div className="dash-small-cards">
                            {activeStats.map((s, i) => (
                                <div key={i} className="dash-small-card" onClick={s.onClick} style={{ cursor: s.onClick ? 'pointer' : 'default' }}>
                                    <div className="dash-sc-header">
                                        <div className="dash-sc-icon-wrap"><s.icon size={22} color={s.color} /></div>
                                    </div>
                                    <div>
                                        <div className="dash-sc-value"><Counter value={s.value} suffix={s.suffix || ''} /></div>
                                        <div className="dash-sc-label">{s.label}</div>
                                        <div className="dash-sc-detail" style={{ color: s.color }}>{s.detail}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="dash-small-card dash-card-cta" onClick={() => navigate('/reviews')}>
                                <div className="dash-sc-header">
                                    <div className="dash-sc-icon-wrap"><MessageSquare size={22} strokeWidth={2.5} /></div>
                                </div>
                                <div>
                                    <div className="dash-sc-value">Reviews</div>
                                    <div className="dash-sc-label">Faculty Feedback</div>
                                    <div className="dash-sc-detail">Explore <ArrowRight size={16} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="dash-quick-actions-wrap">
                            <div className="dash-qa-title">Quick Actions</div>
                            <div className="dash-qa-grid">
                                {actions.map((a, i) => (
                                    <div key={i} className="dash-qa-item" onClick={() => navigate(a.path)}>
                                        <div className="dash-qa-icon"><a.icon size={18} style={{ color: 'var(--text-primary)' }} strokeWidth={2.5} /></div>
                                        <span className="dash-qa-label">{a.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sidebar Elements & Personal Local To-Do */}
                    <div className="dash-sidebar">
                        
                        {/* Personal Local To-Do List */}
                        <div className="dash-todo-card">
                            <div className="dash-sb-header" style={{ marginBottom: '1rem' }}>
                                <h2 className="dash-sb-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckSquare size={18} color="#0071E3" /> Personal To-Do
                                </h2>
                                <span className="dash-sb-badge">{todos.filter(t => !t.done).length} pending</span>
                            </div>

                            {todos.length > 0 && (
                                <div className="dash-todo-progress-wrap">
                                    <div className="dash-todo-progress-track">
                                        <div className="dash-todo-progress-fill" style={{ width: `${todoProgressPct}%` }} />
                                    </div>
                                    <div className="dash-todo-progress-text">
                                        <span>{completedTodoCount} of {todos.length} done</span>
                                        <span>{todoProgressPct}%</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleAddTodo} className="dash-todo-input-wrap">
                                <input 
                                    type="text" 
                                    placeholder="Add task..." 
                                    className="dash-todo-input" 
                                    value={newTodoText} 
                                    onChange={e => setNewTodoText(e.target.value)} 
                                />
                                <button type="submit" className="dash-todo-add-btn"><Plus size={16} /></button>
                            </form>

                            <div className="dash-todo-filters">
                                {['all', 'active', 'done'].map(f => (
                                    <button 
                                        key={f} 
                                        className={`dash-todo-filter-btn ${todoFilter === f ? 'active' : ''}`} 
                                        onClick={() => setTodoFilter(f)}
                                    >
                                        {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}
                                    </button>
                                ))}
                            </div>

                            <div className="dash-todo-list">
                                {filteredTodos.length === 0 ? (
                                    <p className="dash-todo-empty-v2">
                                        {todoFilter === 'done' ? 'No completed tasks yet.' : todoFilter === 'active' ? 'Nothing pending — nice!' : 'No tasks added yet.'}
                                    </p>
                                ) : filteredTodos.map(t => (
                                    <div key={t.id} className={`dash-todo-item-v2 ${t.done ? 'done' : ''}`}>
                                        {editingTodoId === t.id ? (
                                            <div style={{ display: 'flex', gap: '4px', flex: 1, minWidth: 0 }}>
                                                <input 
                                                    type="text" 
                                                    value={editingTodoText} 
                                                    onChange={e => setEditingTodoText(e.target.value)} 
                                                    style={{ flex: 1, minWidth: 0, padding: '6px 8px', fontSize: '16px', borderRadius: '8px', border: '1px solid #CCC' }}
                                                />
                                                <button onClick={() => handleSaveEditTodo(t.id)} style={{ border: 'none', background: '#34C759', color: 'white', borderRadius: '8px', padding: '0 10px', minWidth: '36px', cursor: 'pointer', flexShrink: 0 }}><Check size={14} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div 
                                                    className={`dash-todo-check-circle ${t.done ? 'done' : ''}`} 
                                                    onClick={() => handleToggleTodo(t.id)}
                                                    role="checkbox"
                                                    aria-checked={t.done}
                                                >
                                                    {t.done && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                                                </div>
                                                <span className={`dash-todo-text-v2 ${t.done ? 'done' : ''}`}>
                                                    {t.text}
                                                </span>
                                                <div className="dash-todo-actions-v2">
                                                    <button onClick={() => handleStartEditTodo(t)} className="dash-todo-icon-btn" style={{ color: '#6B7280' }}><Edit3 size={14} /></button>
                                                    <button onClick={() => handleDeleteTodo(t.id)} className="dash-todo-icon-btn" style={{ color: '#FF3B30' }}><Trash2 size={14} /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Announcements */}
                        {updates.length > 0 && (
                            <div className="dash-glass-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                                <div className="dash-sb-header" style={{ marginBottom: '1.5rem' }}>
                                    <h2 className="dash-sb-title">Recent Updates</h2>
                                    <span className="dash-sb-badge">{updates.length} new</span>
                                </div>
                                
                                <div>
                                    {updates.map((u, idx) => (
                                        <div key={u.id} className="dash-ann-card" style={{ animation: `fadeInUp 0.5s ${idx * 0.1}s both` }}>
                                            <div className="dash-ann-icon-col">
                                                <div className="dash-ann-icon-circle"><Megaphone size={18} strokeWidth={2.5} /></div>
                                            </div>
                                            <div className="dash-ann-content">
                                                <h3 className="dash-ann-title">{u.title}</h3>
                                                {u.date && (
                                                    <span className="dash-ann-date">
                                                        {new Date(u.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                )}
                                                {u.message && <p className="dash-ann-message">{u.message}</p>}
                                                {(u.link || u.url) && (
                                                    <a href={u.link || u.url} target="_blank" rel="noreferrer" className="dash-ann-link" onClick={e => e.stopPropagation()}>
                                                        <ExternalLink size={14} strokeWidth={2.5} /> Open Resource
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;