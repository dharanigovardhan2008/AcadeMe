import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Star, RefreshCw, Crown, Zap, Clock, User } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Constants ────────────────────────────────────────────────────────────────
const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_BG = [
    'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,165,0,0.08))',
    'linear-gradient(135deg,rgba(192,192,192,0.15),rgba(160,160,160,0.08))',
    'linear-gradient(135deg,rgba(205,127,50,0.15),rgba(160,100,30,0.08))',
];

const HOW_TO_EARN = [
    ['Submit a faculty review',  25],
    ['Report a bug',             30],
    ['Suggest a feature',        20],
    ['Suggest a faculty',        15],
    ['General feedback',         10],
    ['Comment on review',         5],
    ['Edit your review',          5],
    ['Like a review',             2],
    ['Call a faculty',            3],
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length >= 2
        ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        : (parts[0]?.[0]?.toUpperCase() || '?');
};

const getWeekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    d.setHours(0, 0, 0, 0);
    return d;
};

const fmtTime = (d) => d?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';

// ── Component ─────────────────────────────────────────────────────────────────
const Leaderboard = () => {
    const { user } = useAuth();
    const currentUid = auth.currentUser?.uid || user?.uid;

    const [tab,         setTab]         = useState('weekly');
    const [allUsers,    setAllUsers]    = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const weekStart = getWeekStart();

    // ── Real-time Firestore listener ─────────────────────────────────────────
    // Listens to the entire `users` collection and re-ranks on every change
    // This means when any user earns points the board updates live (daily changes visible)
    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const users = snap.docs
                .map(d => {
                    const data = d.data();
                    // Client-side weekly reset: if pointsLastReset < this Sunday → weeklyPoints = 0
                    const lastReset = data.pointsLastReset ? new Date(data.pointsLastReset) : null;
                    const stale = !lastReset || lastReset < weekStart;
                    return {
                        uid:          d.id,
                        name:         data.name || 'Student',
                        branch:       data.branch || '',
                        totalPoints:  data.totalPoints  || 0,
                        weeklyPoints: stale ? 0 : (data.weeklyPoints || 0),
                    };
                })
                .filter(u => u.name && (u.totalPoints > 0 || u.weeklyPoints > 0));
            setAllUsers(users);
            setLastUpdated(new Date());
            setLoading(false);
        }, (err) => {
            console.error('Leaderboard snapshot error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []); // Run once — onSnapshot keeps it live

    // ── Derived lists ─────────────────────────────────────────────────────────
    const pointsKey = tab === 'weekly' ? 'weeklyPoints' : 'totalPoints';

    const sorted = [...allUsers]
        .sort((a, b) => (b[pointsKey] || 0) - (a[pointsKey] || 0));

    const top10 = sorted.slice(0, 10);

    // Find current user's rank in full sorted list
    const myRankIdx = sorted.findIndex(u => u.uid === currentUid);
    const myRank    = myRankIdx >= 0 ? myRankIdx + 1 : null;
    const myEntry   = myRankIdx >= 0 ? sorted[myRankIdx] : null;
    const inTop10   = myRank !== null && myRank <= 10;

    // Week range display
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                .lb-row { transition: transform 0.2s; animation: fadeUp 0.3s ease both; }
                .lb-row:hover { transform: translateX(4px); }
                @media (max-width: 480px) {
                    .lb-podium { grid-template-columns: 1fr 1.1fr 1fr !important; gap: 0.5rem !important; }
                    .lb-header h1 { font-size: 1.5rem !important; }
                }
            `}</style>

            {/* ── Header ── */}
            <div className="lb-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Trophy size={28} color="#FBBF24" /> Leaderboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Points update live • Weekly board resets every Sunday
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    {lastUpdated && <><Clock size={12} /> Live · {fmtTime(lastUpdated)}</>}
                </div>
            </div>

            {/* ── Week banner ── */}
            <GlassCard style={{ padding: '0.75rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                    <Clock size={14} color="#818CF8" />
                    <span style={{ color: '#818CF8', fontWeight: '600' }}>This week:</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmtDate(weekStart)} — {fmtDate(weekEnd)}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                    {allUsers.length} students ranked
                </span>
            </GlassCard>

            {/* ── My rank card (always visible) ── */}
            {myEntry && (
                <GlassCard style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: 'white', flexShrink: 0 }}>
                        {initials(myEntry.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                            {myEntry.name} <span style={{ fontSize: '0.72rem', color: '#60A5FA', background: 'rgba(96,165,250,0.15)', padding: '2px 8px', borderRadius: '10px', marginLeft: '4px' }}>You</span>
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {myEntry.branch || 'Student'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontWeight: '800', fontSize: '1.4rem', color: '#60A5FA' }}>
                            #{myRank}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {myEntry[pointsKey] || 0} pts {tab === 'weekly' ? 'this week' : 'total'}
                        </p>
                    </div>
                </GlassCard>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                {[['weekly', '⚡ This Week'], ['alltime', '👑 All Time']].map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                        background: tab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: tab === id ? 'white' : 'var(--text-secondary)',
                        fontWeight: tab === id ? '700' : '400',
                        cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
                    }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Podium top 3 ── */}
            {!loading && top10.length >= 3 && (
                <div className="lb-podium" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                    {[1, 0, 2].map((rankIdx) => {
                        const entry = top10[rankIdx];
                        if (!entry) return <div key={rankIdx} />;
                        const isMe = entry.uid === currentUid;
                        return (
                            <GlassCard key={entry.uid} style={{
                                textAlign: 'center',
                                padding: rankIdx === 0 ? '1.5rem 0.75rem' : '1rem 0.5rem',
                                background: RANK_BG[rankIdx],
                                border: isMe ? '2px solid #60A5FA' : `1px solid ${MEDAL[rankIdx]}44`,
                                position: 'relative',
                            }}>
                                {rankIdx === 0 && <Crown size={20} color="#FFD700" style={{ marginBottom: '4px' }} />}
                                <div style={{
                                    width: rankIdx === 0 ? '58px' : '46px',
                                    height: rankIdx === 0 ? '58px' : '46px',
                                    borderRadius: '50%', margin: '0 auto 8px',
                                    background: `linear-gradient(135deg,${MEDAL[rankIdx]},${MEDAL[rankIdx]}88)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: rankIdx === 0 ? '1.2rem' : '0.95rem',
                                    fontWeight: 'bold', color: '#0f0f1a',
                                }}>
                                    {initials(entry.name)}
                                </div>
                                <p style={{ fontWeight: '700', fontSize: '0.8rem', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {entry.name}{isMe ? ' 👤' : ''}
                                </p>
                                {entry.branch && (
                                    <p style={{ margin: '0 0 4px', fontSize: '0.68rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.branch}</p>
                                )}
                                <p style={{ color: MEDAL[rankIdx], fontWeight: '800', fontSize: rankIdx === 0 ? '1.2rem' : '1rem', margin: 0 }}>
                                    {entry[pointsKey] || 0}
                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginLeft: '2px' }}>pts</span>
                                </p>
                                <div style={{ position: 'absolute', top: '8px', left: '8px', width: '22px', height: '22px', borderRadius: '50%', background: MEDAL[rankIdx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#0f0f1a' }}>
                                    {rankIdx + 1}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* ── Full top 10 list ── */}
            <GlassCard style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem 1rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                        Top 10 Students
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {tab === 'weekly' ? 'Weekly pts' : 'Total pts'}
                    </span>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading leaderboard...</p>
                    </div>
                ) : top10.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Trophy size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: '600', margin: '0 0 4px' }}>No rankings yet</p>
                        <p style={{ fontSize: '0.82rem', margin: 0 }}>Start reviewing faculty or submitting feedback to earn points!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {top10.map((entry, index) => {
                            const rank = index + 1;
                            const isMe = entry.uid === currentUid;
                            const isTop3 = rank <= 3;
                            return (
                                <div key={entry.uid} className="lb-row" style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '11px 14px', borderRadius: '10px',
                                    background: isMe
                                        ? 'rgba(96,165,250,0.12)'
                                        : isTop3 ? `${MEDAL[rank - 1]}0d` : 'rgba(255,255,255,0.03)',
                                    border: isMe ? '1px solid rgba(96,165,250,0.35)' : '1px solid transparent',
                                    animationDelay: `${index * 0.04}s`,
                                }}>
                                    {/* Rank */}
                                    <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
                                        {isTop3
                                            ? <Medal size={18} color={MEDAL[rank - 1]} fill={MEDAL[rank - 1]} />
                                            : <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>#{rank}</span>
                                        }
                                    </div>

                                    {/* Avatar */}
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        background: isTop3
                                            ? `linear-gradient(135deg,${MEDAL[rank - 1]},${MEDAL[rank - 1]}88)`
                                            : 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '0.85rem',
                                        color: isTop3 ? '#0f0f1a' : 'white',
                                    }}>
                                        {initials(entry.name)}
                                    </div>

                                    {/* Name + branch */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: isMe ? '700' : '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                                            {entry.name}
                                            {isMe && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#60A5FA', background: 'rgba(96,165,250,0.15)', padding: '2px 6px', borderRadius: '10px' }}>You</span>}
                                        </p>
                                        {entry.branch && (
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{entry.branch}</p>
                                        )}
                                    </div>

                                    {/* Points */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0, color: isTop3 ? MEDAL[rank - 1] : 'white' }}>
                                            {entry[pointsKey] || 0}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>points</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>

            {/* ── My rank if outside top 10 ── */}
            {!loading && myRank !== null && !inTop10 && (
                <GlassCard style={{ marginBottom: '1.5rem', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <User size={16} color="#60A5FA" />
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>
                        Your current rank: <strong style={{ color: '#60A5FA' }}>#{myRank}</strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '6px', fontSize: '0.8rem' }}>
                            ({myEntry?.[pointsKey] || 0} pts)
                        </span>
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {myRank - 10} spots from top 10
                    </span>
                </GlassCard>
            )}

            {/* ── How to earn points ── */}
            <GlassCard style={{ padding: '1.25rem', border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.03)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#FBBF24" /> How to earn points
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.4rem' }}>
                    {HOW_TO_EARN.map(([action, pts]) => (
                        <div key={action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.79rem', color: 'rgba(255,255,255,0.65)' }}>{action}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34D399', marginLeft: '8px', flexShrink: 0 }}>+{pts}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </DashboardLayout>
    );
};

export default Leaderboard;
