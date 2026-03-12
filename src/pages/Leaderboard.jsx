import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Star, RefreshCw, Crown, Zap, Clock } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_BG = [
    'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,165,0,0.08))',
    'linear-gradient(135deg,rgba(192,192,192,0.15),rgba(160,160,160,0.08))',
    'linear-gradient(135deg,rgba(205,127,50,0.15),rgba(160,100,30,0.08))',
];

const getWeekStart = () => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
};

const Leaderboard = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('weekly');  // 'weekly' | 'alltime'
    const [weeklyTop, setWeeklyTop] = useState([]);
    const [alltimeTop, setAlltimeTop] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [myRank, setMyRank] = useState(null);

    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'users'));
            const users = snap.docs
                .map(d => ({ uid: d.id, ...d.data() }))
                .filter(u => u.name && (u.totalPoints > 0 || u.weeklyPoints > 0));

            // Reset weekly points if older than current week (client-side display fix)
            const weekly = users
                .map(u => {
                    const lastReset = u.pointsLastReset ? new Date(u.pointsLastReset) : null;
                    const stale = !lastReset || lastReset < weekStart;
                    return { ...u, weeklyPoints: stale ? 0 : (u.weeklyPoints || 0) };
                })
                .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
                .slice(0, 10);

            const alltime = [...users]
                .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                .slice(0, 10);

            setWeeklyTop(weekly);
            setAlltimeTop(alltime);
            setLastUpdated(new Date());

            // Find current user rank
            if (user?.uid) {
                const sorted = tab === 'weekly' ? weekly : alltime;
                const idx = sorted.findIndex(u => u.uid === user.uid);
                setMyRank(idx >= 0 ? idx + 1 : null);
            }
        } catch (e) {
            console.error('Leaderboard fetch:', e);
        }
        setLoading(false);
    }, [user?.uid, tab]);

    useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

    const list = tab === 'weekly' ? weeklyTop : alltimeTop;
    const pointsKey = tab === 'weekly' ? 'weeklyPoints' : 'totalPoints';

    const getInitials = (name = '') => {
        const parts = name.trim().split(' ');
        return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '?';
    };

    const formatTime = (date) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <DashboardLayout>
            <style>{`
                .lb-row { transition: all 0.2s ease; }
                .lb-row:hover { transform: translateX(4px); }
                @media (max-width: 480px) {
                    .lb-title { font-size: 1.4rem !important; }
                    .lb-pts { font-size: 1rem !important; }
                    .lb-name { font-size: 0.88rem !important; }
                }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="lb-title gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Trophy size={28} color="#FBBF24" /> Leaderboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Top 10 students by points • Resets every Sunday
                    </p>
                </div>
                <button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {/* Week info banner */}
            <GlassCard style={{ padding: '0.75rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                    <Clock size={14} color="#818CF8" />
                    <span style={{ color: '#818CF8', fontWeight: '600' }}>This week:</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {weekStart.toLocaleDateString()} — {weekEnd.toLocaleDateString()}
                    </span>
                </div>
                {lastUpdated && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        Updated {formatTime(lastUpdated)}
                    </span>
                )}
            </GlassCard>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                {[['weekly', 'This Week', Zap], ['alltime', 'All Time', Crown]].map(([id, label, Icon]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                            background: tab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: tab === id ? 'white' : 'var(--text-secondary)',
                            fontWeight: tab === id ? '700' : '400',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            fontSize: '0.9rem',
                        }}
                    >
                        <Icon size={15} color={tab === id ? '#FBBF24' : undefined} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Top 3 podium */}
            {!loading && list.length >= 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                    {[1, 0, 2].map((rankIdx) => {
                        const entry = list[rankIdx];
                        if (!entry) return <div key={rankIdx} />;
                        const rank = rankIdx + 1;
                        const isMe = entry.uid === user?.uid;
                        return (
                            <GlassCard
                                key={entry.uid}
                                style={{
                                    textAlign: 'center',
                                    padding: rankIdx === 0 ? '1.5rem 1rem' : '1rem',
                                    background: RANK_BG[rankIdx] || 'rgba(255,255,255,0.04)',
                                    border: isMe ? '2px solid #60A5FA' : `1px solid ${MEDAL_COLORS[rankIdx]}44`,
                                    position: 'relative',
                                }}
                            >
                                {rankIdx === 0 && <Crown size={20} color="#FFD700" style={{ marginBottom: '6px' }} />}
                                <div style={{
                                    width: rankIdx === 0 ? '60px' : '48px', height: rankIdx === 0 ? '60px' : '48px',
                                    borderRadius: '50%', margin: '0 auto 8px',
                                    background: `linear-gradient(135deg,${MEDAL_COLORS[rankIdx]},${MEDAL_COLORS[rankIdx]}88)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: rankIdx === 0 ? '1.3rem' : '1rem', fontWeight: 'bold', color: '#0f0f1a',
                                }}>
                                    {getInitials(entry.name)}
                                </div>
                                <p className="lb-name" style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {entry.name}{isMe ? ' (You)' : ''}
                                </p>
                                <p className="lb-pts" style={{ color: MEDAL_COLORS[rankIdx], fontWeight: '800', fontSize: '1.1rem', margin: 0 }}>
                                    {entry[pointsKey] || 0}
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginLeft: '3px' }}>pts</span>
                                </p>
                                <div style={{ position: 'absolute', top: '8px', left: '8px', width: '22px', height: '22px', borderRadius: '50%', background: MEDAL_COLORS[rankIdx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#0f0f1a' }}>
                                    {rank}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* Full list */}
            <GlassCard style={{ padding: '0.5rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                        <p>Loading leaderboard...</p>
                    </div>
                ) : list.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Trophy size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: '600' }}>No rankings yet</p>
                        <p style={{ fontSize: '0.85rem' }}>Start reviewing faculty or submitting feedback to earn points!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {list.map((entry, index) => {
                            const rank = index + 1;
                            const isMe = entry.uid === user?.uid;
                            const isTop3 = rank <= 3;
                            return (
                                <div
                                    key={entry.uid}
                                    className="lb-row"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '12px 14px', borderRadius: '10px',
                                        background: isMe
                                            ? 'rgba(96,165,250,0.12)'
                                            : isTop3 ? `${MEDAL_COLORS[rank - 1]}0d` : 'rgba(255,255,255,0.03)',
                                        border: isMe ? '1px solid rgba(96,165,250,0.35)' : '1px solid transparent',
                                    }}
                                >
                                    {/* Rank */}
                                    <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
                                        {rank <= 3 ? (
                                            <Medal size={18} color={MEDAL_COLORS[rank - 1]} fill={MEDAL_COLORS[rank - 1]} />
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>#{rank}</span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        background: isTop3
                                            ? `linear-gradient(135deg,${MEDAL_COLORS[rank - 1]},${MEDAL_COLORS[rank - 1]}88)`
                                            : 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '0.85rem',
                                        color: isTop3 ? '#0f0f1a' : 'white',
                                    }}>
                                        {getInitials(entry.name)}
                                    </div>

                                    {/* Name */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="lb-name" style={{ fontWeight: isMe ? '700' : '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                                            {entry.name}
                                            {isMe && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#60A5FA', background: 'rgba(96,165,250,0.15)', padding: '2px 7px', borderRadius: '10px' }}>You</span>}
                                        </p>
                                        {entry.branch && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{entry.branch}</p>}
                                    </div>

                                    {/* Points */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p className="lb-pts" style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0, color: isTop3 ? MEDAL_COLORS[rank - 1] : 'white' }}>
                                            {entry[pointsKey] || 0}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-secondary)' }}>points</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>

            {/* My rank (if not in top 10) */}
            {!loading && myRank && myRank > 10 && (
                <GlassCard style={{ marginTop: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
                    <Star size={16} color="#60A5FA" />
                    <span style={{ fontSize: '0.85rem', color: '#60A5FA' }}>Your rank: <strong>#{myRank}</strong></span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>Keep contributing to climb the board!</span>
                </GlassCard>
            )}


            {/* How to earn points */}
            <GlassCard style={{ marginTop: '1.5rem', padding: '1.25rem', border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.04)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#FBBF24" /> How to earn points
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.5rem' }}>
                    {[
                        ['Submit a faculty review', '+25'],
                        ['Report a bug', '+30'],
                        ['Suggest a feature', '+20'],
                        ['General feedback', '+10'],
                        ['Suggest a faculty', '+15'],
                        ['Comment on review', '+5'],
                        ['Edit your review', '+5'],
                        ['Like a review', '+2'],
                        ['Call a faculty', '+3'],
                    ].map(([action, pts]) => (
                        <div key={action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{action}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34D399' }}>{pts}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </DashboardLayout>
    );
};

export default Leaderboard;
