import React, { useState, useEffect } from 'react';
import { 
    Bug, Star, Lightbulb, UserPlus, MessageSquare, 
    MessageCircle, Pencil, Phone, ThumbsUp, Info, ChevronDown 
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Static Data for "How to Earn" ──────────────────────────────────────────────
const HOW_TO_EARN = [
    { label: 'Report a bug',         pts: 30, Icon: Bug,           color: '#EF4444' },
    { label: 'Submit faculty review',pts: 25, Icon: Star,          color: '#F59E0B' },
    { label: 'Suggest a feature',    pts: 20, Icon: Lightbulb,     color: '#8B5CF6' },
    { label: 'Suggest a faculty',    pts: 15, Icon: UserPlus,      color: '#10B981' },
    { label: 'General feedback',     pts: 10, Icon: MessageSquare, color: '#3B82F6' },
    { label: 'Comment on review',    pts:  5, Icon: MessageCircle, color: '#6366F1' },
    { label: 'Edit your review',     pts:  5, Icon: Pencil,        color: '#EC4899' },
    { label: 'Call a faculty',       pts:  3, Icon: Phone,         color: '#14B8A6' },
    { label: 'Like a review',        pts:  2, Icon: ThumbsUp,      color: '#F43F5E' },
];

// ── Animated Counter ───────────────────────────────────────────────────────────
const Counter = ({ value }) => {
    const [disp, setDisp] = useState(0);
    useEffect(() => {
        let t0 = null;
        const dur = 1000;
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWeekStart = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
};

// Returns a clean initial instead of fetching an external profile image
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

const CrownIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(250, 204, 21, 0.5))' }}>
        <path d="M4 19V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V19H4Z" fill="#FACC15"/>
        <path d="M2.30902 11.2361C1.94273 11.0529 1.5414 11.4542 1.72458 11.8205L4.54911 17.4696C4.68652 17.7444 4.96696 17.916 5.27411 17.916H18.7259C19.033 17.916 19.3135 17.7444 19.4509 17.4696L22.2754 11.8205C22.4586 11.4542 22.0573 11.0529 21.691 11.2361L16.4801 13.8415C16.126 14.0186 15.7107 13.8821 15.5398 13.5342L12.4439 7.2346C12.2576 6.8554 11.7424 6.8554 11.5561 7.2346L8.46017 13.5342C8.28933 13.8821 7.874 14.0186 7.51988 13.8415L2.30902 11.2361Z" fill="#FDE047"/>
        <circle cx="12" cy="5" r="2" fill="#FACC15"/>
        <circle cx="3" cy="9" r="1.5" fill="#FACC15"/>
        <circle cx="21" cy="9" r="1.5" fill="#FACC15"/>
    </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Leaderboard = () => {
    const { user } = useAuth();
    const currentUid = auth.currentUser?.uid || user?.uid;

    const [tab, setTab] = useState('weekly');
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEarn, setShowEarn] = useState(false);
    const [mounted, setMounted] = useState(false);

    const weekStart = getWeekStart();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

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
    const sorted = [...allUsers].sort((a, b) => (b[key] || 0) - (a[key] || 0));
    
    // Split into top 3 (Podium) and the rest
    const top3 = sorted.slice(0, 3);
    const listUsers = sorted.slice(3, 100); 

    const myIdx = sorted.findIndex(u => u.uid === currentUid);
    const myRank = myIdx >= 0 ? myIdx + 1 : null;
    const myEntry = myIdx >= 0 ? sorted[myIdx] : null;

    // ── Hardcoded Light Theme CSS ──
    const CSS = `
        .lb-theme-wrapper {
            background-color: #FAFAFA; /* Soft off-white page background */
            min-height: 100vh;
            width: 100%;
            font-family: 'DM Sans', sans-serif;
            color: #1F2937;
        }

        .lb-container { 
            max-width: 600px; margin: 0 auto; padding: 1.5rem 1rem 3rem; width: 100%; box-sizing: border-box; 
        }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

        /* Tabs */
        .lb-tabs { 
            display: flex; gap: 8px; background: #E5E7EB; padding: 6px; 
            border-radius: 999px; margin: 0 auto 2.5rem; max-width: 300px; justify-content: space-between;
        }
        .lb-tab {
            flex: 1; padding: 10px 0; border-radius: 999px; border: none; font-weight: 600; font-size: 0.85rem;
            cursor: pointer; transition: all 0.3s ease; background: transparent; color: #4B5563; text-align: center;
        }
        .lb-tab.active { background: #3B82F6; color: #FFFFFF; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3); }

        /* Podium */
        .lb-podium { display: flex; align-items: flex-end; justify-content: center; gap: 8px; margin-bottom: 2rem; height: 260px; }
        .podium-col { display: flex; flex-direction: column; align-items: center; width: 30%; max-width: 110px; position: relative; }
        
        .podium-initial-wrap { position: relative; margin-bottom: 12px; }
        .podium-initial { 
            width: 54px; height: 54px; border-radius: 50%; border: 3px solid #FFFFFF; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: #F3F4F6; color: #374151;
            display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;
        }
        .podium-crown { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); z-index: 2; }
        
        .podium-name { font-size: 0.75rem; font-weight: 700; color: #1F2937; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-bottom: 2px; }
        .podium-pts { font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 14px; }
        
        .podium-block {
            width: 100%; border-top-left-radius: 12px; border-top-right-radius: 12px;
            display: flex; justify-content: center; padding-top: 15px; position: relative;
            box-shadow: inset 0 4px 10px rgba(255,255,255,0.4), 0 10px 20px -5px rgba(0,0,0,0.15);
        }
        .podium-block::after { content: ''; position: absolute; inset: 0; border-top-left-radius: inherit; border-top-right-radius: inherit; background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 40%); pointer-events: none; }
        
        .podium-rank-num { font-size: 2.8rem; font-weight: 800; color: #FFFFFF; line-height: 1; text-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1; }

        .rank-2 .podium-block { height: 110px; background: linear-gradient(180deg, #34D399 0%, #059669 100%); }
        .rank-1 .podium-block { height: 150px; background: linear-gradient(180deg, #60A5FA 0%, #2563EB 100%); }
        .rank-1 .podium-initial { width: 68px; height: 68px; border-width: 4px; font-size: 1.8rem; }
        .rank-3 .podium-block { height: 85px; background: linear-gradient(180deg, #BEF264 0%, #65A30D 100%); }

        /* List Card */
        .lb-card {
            background: #FFFFFF; border: 1px solid #F3F4F6;
            border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);
            overflow: hidden; padding-bottom: ${myEntry ? '72px' : '0'};
            position: relative;
        }

        /* Perfectly Aligned Grid for Header and Rows */
        .lb-grid {
            display: grid;
            grid-template-columns: 40px 40px 1fr 80px;
            align-items: center;
            gap: 12px;
        }

        /* Black List Header */
        .lb-list-header {
            background: #111111; color: #FFFFFF; padding: 12px 20px; border-radius: 999px;
            margin: 1rem 1rem 0.5rem; font-size: 0.75rem; font-weight: 600;
        }
        .header-col { text-align: left; }
        .header-pts { text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 4px; }
        
        /* List Rows */
        .lb-row { padding: 12px 20px; transition: background 0.2s; }
        .lb-row:not(:last-child) { border-bottom: 1px solid #F3F4F6; }
        .lb-row:hover { background: #F9FAFB; }
        
        .lb-row-rank { font-size: 1rem; font-weight: 700; color: #9CA3AF; text-align: center; }
        
        .lb-row-initial { 
            width: 40px; height: 40px; border-radius: 50%; background: #F3F4F6; color: #4B5563;
            display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;
        }
        
        .lb-row-info { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .lb-row-name { font-size: 0.9rem; font-weight: 700; color: #1F2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .lb-row-level { font-size: 0.75rem; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lb-row-pts { font-size: 0.95rem; font-weight: 700; color: #3B82F6; text-align: right; }

        /* Sticky "You" Bar */
        .lb-you-bar {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: linear-gradient(90deg, #3B82F6, #2563EB);
            color: #FFFFFF; padding: 14px 20px; 
            box-shadow: 0 -4px 20px rgba(37, 99, 235, 0.25);
        }
        .lb-you-bar .lb-row-rank { color: #FFFFFF; opacity: 0.9; }
        .lb-you-bar .lb-row-initial { background: rgba(255,255,255,0.2); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.4); }
        .lb-you-bar .lb-row-name, .lb-you-bar .lb-row-pts { color: #FFFFFF; }
        .lb-you-bar .lb-row-level { color: rgba(255,255,255,0.8); }

        /* How to earn */
        .lb-earn-card { margin-top: 2rem; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .lb-earn-head { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; color: #1F2937; }
        .lb-earn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 0 1.25rem 1.25rem; }
        .lb-earn-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #F9FAFB; border-radius: 12px; }
        .lb-earn-pts { background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 700; font-size: 0.75rem; padding: 4px 8px; border-radius: 999px; }

        @media (max-width: 480px) {
            .lb-podium { height: 210px; gap: 4px; }
            .rank-1 .podium-block { height: 125px; }
            .rank-2 .podium-block { height: 90px; }
            .rank-3 .podium-block { height: 70px; }
            .podium-rank-num { font-size: 2.2rem; }
            .rank-1 .podium-initial { width: 56px; height: 56px; font-size: 1.5rem; }
            .podium-initial { width: 46px; height: 46px; font-size: 1.2rem; }
            
            /* Responsive Grid Adjustments */
            .lb-grid { grid-template-columns: 24px 36px 1fr 65px; gap: 10px; }
            .lb-list-header { padding: 10px 14px; margin: 0.75rem 0.75rem 0.5rem; }
            .lb-row { padding: 12px 14px; }
            .lb-you-bar { padding: 12px 14px; }
            .lb-row-rank { font-size: 0.9rem; }
            .lb-row-initial { width: 36px; height: 36px; font-size: 1rem; }
        }
    `;

    // Reorder top3 for visual podium: Rank 2, Rank 1, Rank 3
    const podiumOrder = [top3[1], top3[0], top3[2]];

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            
            <div className="lb-theme-wrapper">
                <div className="lb-container" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                    
                    {/* ── Tabs ── */}
                    <div className="lb-tabs anim-fade">
                        <button className={`lb-tab ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>
                            This Week
                        </button>
                        <button className={`lb-tab ${tab === 'alltime' ? 'active' : ''}`} onClick={() => setTab('alltime')}>
                            All Time
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6B7280' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                            <p>Loading rankings...</p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : sorted.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6B7280' }}>
                            <Star size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                            <h3 style={{ margin: '0 0 8px', color: '#1F2937' }}>No Rankings Yet</h3>
                            <p>Be the first to earn points this period!</p>
                        </div>
                    ) : (
                        <>
                            {/* ── 3D Podium ── */}
                            <div className="lb-podium">
                                {podiumOrder.map((u, idx) => {
                                    // Original rank is 2 for idx 0, 1 for idx 1, 3 for idx 2
                                    const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                                    return (
                                        <div key={idx} className={`podium-col rank-${rank} anim-fade`} style={{ animationDelay: `${0.1 + (idx * 0.1)}s`, opacity: u ? 1 : 0 }}>
                                            {u && (
                                                <>
                                                    <div className="podium-initial-wrap">
                                                        {rank === 1 && <CrownIcon />}
                                                        <div className="podium-initial">{getInitial(u.name)}</div>
                                                    </div>
                                                    <div className="podium-name">{u.name.split(' ')[0]}</div>
                                                    <div className="podium-pts"><Counter value={u[key] || 0} /></div>
                                                    <div className="podium-block">
                                                        <span className="podium-rank-num">{rank}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── List Card ── */}
                            <div className="lb-card anim-fade" style={{ animationDelay: '0.4s' }}>
                                
                                {/* Header mapped precisely to Grid */}
                                <div className="lb-list-header lb-grid">
                                    <div className="header-col" style={{ textAlign: 'center' }}>Rank</div>
                                    <div className="header-col" style={{ gridColumn: '2 / span 2' }}>ID & Level</div>
                                    <div className="header-pts">Points <Info size={12} opacity={0.6}/></div>
                                </div>

                                <div style={{ padding: '0 0 10px 0' }}>
                                    {listUsers.map((u, i) => {
                                        const actualRank = i + 4; // Because top 3 are in podium
                                        return (
                                            <div key={u.uid} className="lb-row lb-grid">
                                                <div className="lb-row-rank">{actualRank}</div>
                                                <div className="lb-row-initial">{getInitial(u.name)}</div>
                                                <div className="lb-row-info">
                                                    <div className="lb-row-name">{u.name}</div>
                                                    <div className="lb-row-level">{u.branch || 'Level 1'}</div>
                                                </div>
                                                <div className="lb-row-pts"><Counter value={u[key] || 0} /></div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Sticky "You" Bar at Bottom mapped precisely to Grid */}
                                {myEntry && (
                                    <div className="lb-you-bar lb-grid">
                                        <div className="lb-row-rank">{myRank}</div>
                                        <div className="lb-row-initial">{getInitial(myEntry.name)}</div>
                                        <div className="lb-row-info">
                                            <div className="lb-row-name">You</div>
                                            <div className="lb-row-level">{myEntry.branch || 'Level 1'}</div>
                                        </div>
                                        <div className="lb-row-pts"><Counter value={myEntry[key] || 0} /></div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── How to Earn ── */}
                    <div className="lb-earn-card anim-fade" style={{ animationDelay: '0.5s' }}>
                        <div className="lb-earn-head" onClick={() => setShowEarn(!showEarn)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Star size={18} color="#F59E0B" />
                                How to Earn Points
                            </div>
                            <ChevronDown size={18} style={{ transform: showEarn ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                        </div>
                        
                        {showEarn && (
                            <div className="lb-earn-grid">
                                {HOW_TO_EARN.map((item, i) => (
                                    <div key={i} className="lb-earn-item" style={{ animation: `fadeUp 0.3s ${i * 0.05}s both` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <item.Icon size={16} color={item.color} />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1F2937' }}>{item.label}</span>
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