import React, { useState, useEffect } from 'react';
import { 
    Bug, Star, Lightbulb, UserPlus, MessageSquare, 
    MessageCircle, Pencil, Phone, ThumbsUp, 
    ChevronDown, Trophy, Award, Crown
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── How to Earn Data ───────────────────────────────────────────────────────────
const HOW_TO_EARN = [
    { label: 'Report a bug',          pts: 30, Icon: Bug,           color: '#EF4444', bg: '#FEE2E2' },
    { label: 'Submit faculty review', pts: 25, Icon: Star,          color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Suggest a feature',     pts: 20, Icon: Lightbulb,     color: '#8B5CF6', bg: '#F3E8FF' },
    { label: 'Suggest a faculty',     pts: 15, Icon: UserPlus,      color: '#10B981', bg: '#D1FAE5' },
    { label: 'General feedback',      pts: 10, Icon: MessageSquare, color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Comment on review',     pts:  5, Icon: MessageCircle, color: '#6366F1', bg: '#E0E7FF' },
    { label: 'Edit your review',      pts:  5, Icon: Pencil,        color: '#EC4899', bg: '#FCE7F3' },
    { label: 'Call a faculty',        pts:  3, Icon: Phone,         color: '#14B8A6', bg: '#CCFBF1' },
    { label: 'Like a review',         pts:  2, Icon: ThumbsUp,      color: '#F43F5E', bg: '#FFE4E6' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWeekStart = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
};
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

const PASTELS = [
    { bg: '#EFF6FF', text: '#1D4ED8' }, { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#DCFCE7', text: '#15803D' }, { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#F3E8FF', text: '#6D28D9' }, { bg: '#E0F2FE', text: '#0369A1' },
];
const getPastel = (name) => PASTELS[(name?.charCodeAt(0) || 0) % PASTELS.length];

// Medal styles for top 3
const MEDALS = {
    1: { bg: '#FEF3C7', text: '#B45309', ring: '#FBBF24', label: 'Champion' },
    2: { bg: '#F1F5F9', text: '#475569', ring: '#94A3B8', label: 'Runner Up' },
    3: { bg: '#FFEDD5', text: '#C2410C', ring: '#FB923C', label: 'Third Place' },
};

// ── Animated Counter ──────────────────────────────────────────────────────────
const Counter = ({ value }) => {
    const [disp, setDisp] = useState(0);
    useEffect(() => {
        let t0 = null; const dur = 900;
        const tick = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            setDisp(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [value]);
    return <>{disp.toLocaleString()}</>;
};

// ── Styles ────────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('lb-final-style')) return;
    const s = document.createElement('style');
    s.id = 'lb-final-style';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

        @keyframes lbUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        /* EXACT BACKGROUND FROM REFERENCE IMAGE */
        .lb-page {
            min-height: 100vh;
            background: linear-gradient(100deg,
                #FBD5E8 0%,
                #F9DCEF 18%,
                #F0E2F7 38%,
                #E4E5FB 58%,
                #DEE6FC 78%,
                #E6EDFD 100%);
            padding: 2.5rem 1rem 6rem;
        }

        .lb-container { max-width: 720px; margin: 0 auto; width: 100%; }

        /* Header */
        .lb-head { text-align: center; margin-bottom: 2rem; animation: lbUp 0.4s ease both; }
        .lb-head-icon {
            width: 68px; height: 68px; background: #FFFFFF; border-radius: 22px;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;
            box-shadow: 0 14px 34px rgba(245, 158, 11, 0.22);
        }
        .lb-title { font-size: clamp(2rem, 5vw, 2.6rem); font-weight: 900; color: #111827; margin: 0 0 8px; letter-spacing: -1.2px; }
        .lb-sub { font-size: 1.05rem; color: #6B7280; font-weight: 500; margin: 0; }

        /* Tabs */
        .lb-tabs {
            display: flex; background: rgba(255,255,255,0.75); backdrop-filter: blur(20px);
            padding: 6px; border-radius: 999px; max-width: 320px; margin: 0 auto 2rem;
            border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 8px 30px rgba(0,0,0,0.05);
            animation: lbUp 0.5s ease both;
        }
        .lb-tab {
            flex: 1; padding: 12px 0; border-radius: 999px; border: none;
            font-weight: 700; font-size: 0.95rem; cursor: pointer; background: transparent;
            color: #6B7280; transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .lb-tab.on { background: #111827; color: #FFF; box-shadow: 0 8px 22px rgba(17,24,39,0.25); }

        /* Main Board Card (styled like "My Courses") */
        .lb-board {
            background: #FFFFFF; border-radius: 32px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.06);
            padding: 32px; animation: lbUp 0.6s ease both;
        }

        .lb-board-head {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }
        .lb-board-title { font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px; }
        .lb-board-count { font-size: 0.95rem; color: #9CA3AF; font-weight: 600; }

        /* Progress-like divider under title */
        .lb-meta-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: #6B7280; font-weight: 500; margin: 20px 0 10px; }
        .lb-bar { height: 6px; background: #F1F5F9; border-radius: 999px; overflow: hidden; margin-bottom: 24px; }
        .lb-bar-fill { height: 100%; background: linear-gradient(90deg,#8B5CF6,#6366F1); border-radius: 999px; transition: width 1s cubic-bezier(0.16,1,0.3,1); }

        /* Rows */
        .lb-row {
            display: grid; grid-template-columns: 44px 1fr auto;
            align-items: center; gap: 16px;
            padding: 14px 8px; border-radius: 18px;
            transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
            animation: lbUp 0.4s ease both;
        }
        .lb-row:hover { background: #F9FAFB; transform: translateX(4px); }

        .lb-num {
            width: 44px; height: 44px; border-radius: 50%;
            background: #F3F4F6; color: #9CA3AF;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 1rem; flex-shrink: 0;
        }
        .lb-num.medal { border: 2px solid; }

        .lb-info { min-width: 0; }
        .lb-name {
            font-size: 1.05rem; font-weight: 700; color: #111827;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 3px; letter-spacing: -0.2px;
            display: flex; align-items: center; gap: 8px;
        }
        .lb-meta { font-size: 0.85rem; color: #9CA3AF; font-weight: 500; }

        .lb-pill {
            padding: 8px 16px; border-radius: 999px;
            font-weight: 800; font-size: 0.9rem; white-space: nowrap;
            display: flex; align-items: center; gap: 4px;
        }

        .lb-you-tag {
            background: #111827; color: #FFF; font-size: 0.65rem; font-weight: 800;
            padding: 3px 8px; border-radius: 999px; letter-spacing: 0.5px;
        }

        .lb-row.me { background: #F5F3FF; border: 1px solid #DDD6FE; }
        .lb-row.me:hover { background: #EDE9FE; }

        /* Empty / Loading */
        .lb-empty {
            background: #FFFFFF; border-radius: 32px; padding: 5rem 2rem; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.06); animation: lbUp 0.5s ease both;
        }

        /* How to Earn */
        .lb-earn {
            margin-top: 1.5rem; background: #FFFFFF; border-radius: 32px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.06); overflow: hidden;
            animation: lbUp 0.7s ease both;
        }
        .lb-earn-head {
            padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;
            cursor: pointer; font-weight: 800; font-size: 1.2rem; color: #111827; letter-spacing: -0.3px;
        }
        .lb-earn-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            gap: 14px; padding: 0 32px 32px;
        }
        .lb-earn-item {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px; background: #F9FAFB; border-radius: 18px;
            border: 1px solid #F1F5F9; transition: all 0.25s;
        }
        .lb-earn-item:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.05); background: #FFF; }
        .lb-earn-ic { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lb-earn-pts { background: #111827; color: #FFF; font-weight: 800; font-size: 0.8rem; padding: 5px 12px; border-radius: 999px; }

        @media (max-width: 600px) {
            .lb-page { padding: 1.5rem 0.75rem 5rem; }
            .lb-board { padding: 22px 18px; border-radius: 28px; }
            .lb-board-title { font-size: 1.35rem; }
            .lb-row { grid-template-columns: 38px 1fr auto; gap: 12px; padding: 12px 4px; }
            .lb-num { width: 38px; height: 38px; font-size: 0.9rem; }
            .lb-name { font-size: 0.95rem; }
            .lb-pill { padding: 6px 12px; font-size: 0.8rem; }
            .lb-earn-head { padding: 20px; font-size: 1.05rem; }
            .lb-earn-grid { padding: 0 20px 20px; grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(s);
}());

// ── Component ─────────────────────────────────────────────────────────────────
const Leaderboard = () => {
    const { user } = useAuth();
    const currentUid = auth.currentUser?.uid || user?.uid;

    const [tab, setTab] = useState('weekly');
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEarn, setShowEarn] = useState(false);

    const weekStart = getWeekStart();

    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(collection(db, 'users'), snap => {
            const list = snap.docs.map(d => {
                const data = d.data();
                const lr = data.pointsLastReset ? new Date(data.pointsLastReset) : null;
                return {
                    uid: d.id,
                    name: data.name || 'Student',
                    branch: data.branch || 'Level 1',
                    totalPoints: data.totalPoints || 0,
                    weeklyPoints: (!lr || lr < weekStart) ? 0 : (data.weeklyPoints || 0),
                };
            }).filter(u => u.totalPoints > 0 || u.weeklyPoints > 0);
            setAllUsers(list);
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });
        return () => unsub();
    }, []);

    const key = tab === 'weekly' ? 'weeklyPoints' : 'totalPoints';

    // HIGHEST AT TOP → LOWEST AT BOTTOM
    const sorted = [...allUsers].sort((a, b) => (b[key] || 0) - (a[key] || 0));

    const myIdx = sorted.findIndex(u => u.uid === currentUid);
    const myRank = myIdx >= 0 ? myIdx + 1 : null;
    const topScore = sorted[0]?.[key] || 1;

    return (
        <DashboardLayout>
            <div className="lb-page">
                <div className="lb-container">

                    {/* Header */}
                    <div className="lb-head">
                        <div className="lb-head-icon"><Trophy size={34} color="#F59E0B" strokeWidth={2.5} /></div>
                        <h1 className="lb-title">Leaderboard</h1>
                        <p className="lb-sub">Contribute, earn points, and climb to the top.</p>
                    </div>

                    {/* Tabs */}
                    <div className="lb-tabs">
                        <button className={`lb-tab ${tab === 'weekly' ? 'on' : ''}`} onClick={() => setTab('weekly')}>This Week</button>
                        <button className={`lb-tab ${tab === 'alltime' ? 'on' : ''}`} onClick={() => setTab('alltime')}>All Time</button>
                    </div>

                    {loading ? (
                        <div className="lb-empty">
                            <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#8B5CF6', borderRadius: '50%', margin: '0 auto 18px', animation: 'spin 1s linear infinite' }} />
                            <p style={{ fontWeight: 600, color: '#6B7280', margin: 0 }}>Loading rankings…</p>
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="lb-empty">
                            <Award size={56} color="#D1D5DB" style={{ marginBottom: 16 }} />
                            <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: '1.4rem', fontWeight: 800 }}>No Rankings Yet</h3>
                            <p style={{ color: '#6B7280', fontSize: '1.05rem', margin: 0 }}>Be the first to earn points this period!</p>
                        </div>
                    ) : (
                        <div className="lb-board">
                            {/* Board Header */}
                            <div className="lb-board-head">
                                <h2 className="lb-board-title">{tab === 'weekly' ? 'Weekly Rankings' : 'All-Time Rankings'}</h2>
                                <span className="lb-board-count">{sorted.length} {sorted.length === 1 ? 'player' : 'players'}</span>
                            </div>

                            {/* Your rank progress */}
                            <div className="lb-meta-row">
                                <span>{myRank ? `Your Rank` : 'Not ranked yet'}</span>
                                <span style={{ fontWeight: 700, color: '#111827' }}>
                                    {myRank ? `#${myRank} of ${sorted.length}` : '—'}
                                </span>
                            </div>
                            <div className="lb-bar">
                                <div className="lb-bar-fill" style={{ width: myRank ? `${Math.max(6, ((sorted.length - myRank + 1) / sorted.length) * 100)}%` : '0%' }} />
                            </div>

                            {/* RANKED LIST — highest → lowest */}
                            <div>
                                {sorted.map((u, i) => {
                                    const rank = i + 1;
                                    const isMe = u.uid === currentUid;
                                    const medal = MEDALS[rank];
                                    const pastel = getPastel(u.name);
                                    const pts = u[key] || 0;

                                    return (
                                        <div
                                            key={u.uid}
                                            className={`lb-row ${isMe ? 'me' : ''}`}
                                            style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}
                                        >
                                            {/* Rank Number / Medal */}
                                            <div
                                                className={`lb-num ${medal ? 'medal' : ''}`}
                                                style={medal ? { background: medal.bg, color: medal.text, borderColor: medal.ring } : {}}
                                            >
                                                {rank === 1 ? <Crown size={20} fill={medal.text} color={medal.text} /> : rank}
                                            </div>

                                            {/* Name + Meta */}
                                            <div className="lb-info">
                                                <div className="lb-name">
                                                    {u.name}
                                                    {isMe && <span className="lb-you-tag">YOU</span>}
                                                </div>
                                                <div className="lb-meta">
                                                    {u.branch} {medal ? `• ${medal.label}` : ''}
                                                </div>
                                            </div>

                                            {/* Points Pill */}
                                            <div
                                                className="lb-pill"
                                                style={medal
                                                    ? { background: medal.bg, color: medal.text }
                                                    : { background: pastel.bg, color: pastel.text }}
                                            >
                                                <Counter value={pts} /> pts
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* How to Earn */}
                    <div className="lb-earn">
                        <div className="lb-earn-head" onClick={() => setShowEarn(!showEarn)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#FFFBEB', padding: 8, borderRadius: 12, display: 'flex' }}>
                                    <Star size={20} color="#F59E0B" strokeWidth={2.5} />
                                </div>
                                How to Earn Points
                            </div>
                            <ChevronDown size={20} color="#9CA3AF" style={{ transform: showEarn ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        </div>

                        {showEarn && (
                            <div className="lb-earn-grid">
                                {HOW_TO_EARN.map((item, i) => (
                                    <div key={i} className="lb-earn-item" style={{ animation: `lbUp 0.3s ${i * 0.04}s both` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="lb-earn-ic" style={{ background: item.bg, color: item.color }}>
                                                <item.Icon size={18} strokeWidth={2.5} />
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{item.label}</span>
                                        </div>
                                        <span className="lb-earn-pts">+{item.pts}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Leaderboard;