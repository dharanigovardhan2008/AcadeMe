import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, Send, MessageCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

const fmtDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }); }
    catch { return ''; }
};

const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate  = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [panelOpen,     setPanelOpen]     = useState(false);
    const [replyText,     setReplyText]     = useState({});
    const [unread,        setUnread]        = useState(0);
    const [search,        setSearch]        = useState('');
    const [searchOn,      setSearchOn]      = useState(false);

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setNotifications(list);
            const seen = parseInt(localStorage.getItem(`acadeMe_notif_seen_${user.uid}`) || '0');
            setUnread(Math.max(0, list.length - seen));
        }, console.error);
        return () => unsub();
    }, [user?.uid]);

    const openPanel = () => {
        setPanelOpen(true);
        if (user?.uid) { localStorage.setItem(`acadeMe_notif_seen_${user.uid}`, String(notifications.length)); setUnread(0); }
    };

    const handleReply = async (id) => {
        const text = replyText[id]?.trim(); if (!text) return;
        try {
            await updateDoc(doc(db, 'notifications', id), { replies: arrayUnion({ sender: 'user', text, timestamp: new Date().toISOString() }) });
            setReplyText(p => ({ ...p, [id]: '' }));
        } catch (e) { console.error(e); }
    };

    const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366F1&color=fff&size=128&bold=true`;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                @keyframes tb-fade  { from{opacity:0} to{opacity:1} }
                @keyframes tb-slide { from{transform:translateX(105%)} to{transform:translateX(0)} }
                @keyframes tb-card  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

                /* ── Bar ── */
                .tb {
                    position:sticky; top:0; z-index:100;
                    display:flex; align-items:center; gap:10px;
                    padding:0 16px; height:60px;
                    background:rgba(8,12,28,0.92);
                    backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
                    border-bottom:1px solid rgba(255,255,255,0.06);
                    font-family:'Plus Jakarta Sans',sans-serif;
                }
                .tb::before {
                    content:''; position:absolute; top:0; left:0; right:0; height:1px;
                    background:linear-gradient(90deg,transparent,rgba(99,102,241,0.55) 30%,rgba(56,189,248,0.45) 65%,transparent);
                    pointer-events:none;
                }

                /* ── Uniform icon button — all 38×38 ── */
                .tb-btn {
                    width:38px; height:38px; border-radius:11px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center; position:relative;
                    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
                    color:rgba(148,163,184,0.8); cursor:pointer; outline:none;
                    transition:background .18s,color .18s,border-color .18s,transform .15s;
                    -webkit-tap-highlight-color:transparent;
                }
                .tb-btn:hover  { background:rgba(255,255,255,0.1); color:#F1F5F9; border-color:rgba(255,255,255,0.14); }
                .tb-btn:active { transform:scale(0.92); }
                .tb-ham { display:flex; }
                @media(min-width:768px){ .tb-ham{ display:none!important; } }

                /* ── Search ── */
                .tb-srch { flex:1; min-width:0; max-width:420px; position:relative; display:flex; align-items:center; }
                .tb-srch-ico { position:absolute; left:11px; color:rgba(100,116,139,0.65); pointer-events:none; transition:color .2s; }
                .tb-srch.on .tb-srch-ico { color:#818CF8; }
                .tb-srch-inp {
                    width:100%; height:38px; padding:0 12px 0 34px;
                    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
                    border-radius:11px; color:#E2E8F0; outline:none;
                    font-family:'Plus Jakarta Sans',sans-serif; font-size:0.855rem;
                    transition:background .2s,border-color .2s,box-shadow .2s;
                }
                .tb-srch-inp::placeholder { color:rgba(100,116,139,0.55); }
                .tb-srch-inp:focus { background:rgba(255,255,255,0.08); border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.12); }

                /* ── Right cluster ── */
                .tb-right { display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0; }

                /* ── Badge ── */
                .tb-badge {
                    position:absolute; top:-4px; right:-4px;
                    min-width:17px; height:17px; padding:0 3px; border-radius:9px;
                    background:#EF4444; color:#fff; font-size:0.58rem; font-weight:800;
                    display:flex; align-items:center; justify-content:center;
                    border:2px solid rgba(8,12,28,0.95); pointer-events:none;
                }

                /* ── Avatar — same 38×38 ── */
                .tb-av {
                    width:38px; height:38px; border-radius:11px; object-fit:cover;
                    cursor:pointer; flex-shrink:0; border:1px solid rgba(99,102,241,0.35);
                    transition:border-color .2s,transform .2s;
                }
                .tb-av:hover { border-color:rgba(99,102,241,0.75); transform:scale(1.06); }

                /* ── User text (desktop) ── */
                .tb-uinfo { display:none; flex-direction:column; cursor:pointer; padding:0 2px; }
                @media(min-width:580px){ .tb-uinfo{ display:flex; } }
                .tb-uname { font-size:0.78rem; font-weight:700; color:#CBD5E1; white-space:nowrap; line-height:1.2; }
                .tb-usub  { font-size:0.64rem; color:rgba(100,116,139,0.75); white-space:nowrap; }

                /* ── Overlay ── */
                .tb-ov { position:fixed; inset:0; background:rgba(0,0,0,0.52); backdrop-filter:blur(4px); z-index:9998; animation:tb-fade .2s ease; }

                /* ── Panel ── */
                .tb-panel {
                    position:fixed; top:0; right:0; bottom:0;
                    width:min(400px,100vw); background:#080c1c;
                    border-left:1px solid rgba(255,255,255,0.07); z-index:9999;
                    display:flex; flex-direction:column;
                    animation:tb-slide .3s cubic-bezier(0.32,0.72,0,1);
                    box-shadow:-24px 0 64px rgba(0,0,0,0.7);
                    font-family:'Plus Jakarta Sans',sans-serif;
                }
                .tb-phead {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:18px 16px 14px; flex-shrink:0;
                    background:rgba(12,18,40,0.9); border-bottom:1px solid rgba(255,255,255,0.06);
                }
                .tb-pbody { flex:1; overflow-y:auto; padding:12px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.07) transparent; }
                .tb-pbody::-webkit-scrollbar { width:3px; }
                .tb-pbody::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }

                /* ── Notification card ── */
                .tb-nc { border-radius:16px; padding:14px 14px 12px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); margin-bottom:8px; transition:background .2s,border-color .2s; animation:tb-card .3s ease both; }
                .tb-nc:hover { background:rgba(255,255,255,0.042); border-color:rgba(99,102,241,0.22); }

                /* ── Reply ── */
                .tb-rrow { display:flex; gap:8px; margin-top:10px; }
                .tb-rinp { flex:1; height:36px; padding:0 11px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; color:#E2E8F0; font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; outline:none; transition:border-color .2s; }
                .tb-rinp:focus { border-color:rgba(99,102,241,0.5); }
                .tb-rinp::placeholder { color:rgba(100,116,139,0.5); font-size:0.78rem; }
                .tb-send { width:36px; height:36px; border-radius:10px; border:none; background:linear-gradient(135deg,#6366F1,#4F46E5); color:#fff; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(99,102,241,0.4); transition:opacity .2s,transform .15s; }
                .tb-send:hover { opacity:0.85; }
                .tb-send:active { transform:scale(0.92); }

                /* ── Bubble ── */
                .tb-bub { padding:6px 10px; border-radius:10px; font-size:0.77rem; line-height:1.45; margin-bottom:3px; }

                /* ── Empty ── */
                .tb-empty { text-align:center; padding:4rem 1.5rem; display:flex; flex-direction:column; align-items:center; gap:12px; }
            `}</style>

            {/* ── BAR ── */}
            <header className="tb">
                <button className="tb-btn tb-ham" onClick={toggleSidebar} aria-label="Menu"><Menu size={18} /></button>

                <div className={`tb-srch${searchOn ? ' on' : ''}`}>
                    <Search size={14} className="tb-srch-ico" />
                    <input className="tb-srch-inp" type="text" placeholder="Search anything…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter'&&search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`); if(e.key==='Escape'){setSearch('');setSearchOn(false);} }}
                        onFocus={() => setSearchOn(true)} onBlur={() => setSearchOn(false)} />
                </div>

                <div className="tb-right">
                    <button className="tb-btn" onClick={openPanel} aria-label="Notifications">
                        <Bell size={17} />
                        {unread > 0 && <span className="tb-badge">{unread > 99 ? '99+' : unread}</span>}
                    </button>

                    <div className="tb-uinfo" onClick={() => navigate('/profile')}>
                        <span className="tb-uname">{user?.name?.split(' ')[0] || 'Student'}</span>
                        <span className="tb-usub">{[user?.branch, user?.year].filter(Boolean).join(' · ')}</span>
                    </div>

                    <img src={avatar} alt="profile" className="tb-av" onClick={() => navigate('/profile')}
                        onError={e => { e.target.src='https://ui-avatars.com/api/?name=U&background=6366F1&color=fff&size=128'; }} />
                </div>
            </header>

            {/* ── PANEL ── */}
            {panelOpen && (
                <>
                    <div className="tb-ov" onClick={() => setPanelOpen(false)} />
                    <aside className="tb-panel">
                        <div className="tb-phead">
                            <div>
                                <h2 style={{margin:0,fontSize:'0.98rem',fontWeight:800,color:'#F1F5F9'}}>Notifications</h2>
                                <p style={{margin:'2px 0 0',fontSize:'0.69rem',color:'rgba(100,116,139,0.8)'}}>
                                    {notifications.length} message{notifications.length!==1?'s':''} from admin
                                </p>
                            </div>
                            <button className="tb-btn" onClick={() => setPanelOpen(false)} aria-label="Close"><X size={17} /></button>
                        </div>

                        <div className="tb-pbody">
                            {notifications.length === 0 ? (
                                <div className="tb-empty">
                                    <div style={{width:54,height:54,borderRadius:16,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                        <Bell size={24} color="rgba(129,140,248,0.7)" />
                                    </div>
                                    <div>
                                        <p style={{margin:'0 0 4px',fontWeight:700,fontSize:'0.9rem',color:'#94A3B8'}}>No notifications</p>
                                        <p style={{margin:0,fontSize:'0.77rem',color:'rgba(100,116,139,0.6)'}}>Admin messages will appear here</p>
                                    </div>
                                </div>
                            ) : notifications.map((n, idx) => (
                                <div key={n.id} className="tb-nc" style={{animationDelay:`${idx*0.04}s`}}>
                                    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8}}>
                                        <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                            <MessageCircle size={16} color="#818CF8" />
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <p style={{margin:'0 0 2px',fontWeight:700,fontSize:'0.87rem',color:'#E2E8F0',lineHeight:1.3}}>{n.title||'Message from Admin'}</p>
                                            <p style={{margin:0,fontSize:'0.67rem',color:'rgba(100,116,139,0.75)'}}>{fmtDate(n.createdAt)}</p>
                                        </div>
                                    </div>

                                    {(n.message||n.body||n.text) && (
                                        <p style={{margin:'0 0 8px',fontSize:'0.82rem',color:'rgba(148,163,184,0.72)',lineHeight:1.55}}>
                                            {n.message||n.body||n.text}
                                        </p>
                                    )}

                                    {(n.link||n.url) && (
                                        <a href={n.link||n.url} target="_blank" rel="noreferrer"
                                            style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:'0.74rem',fontWeight:700,color:'#818CF8',textDecoration:'none',padding:'5px 10px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9,marginBottom:8,transition:'background .2s'}}
                                            onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.18)'}
                                            onMouseLeave={e=>e.currentTarget.style.background='rgba(99,102,241,0.1)'}>
                                            <ExternalLink size={12}/> Open Resource
                                        </a>
                                    )}

                                    {n.replies?.length > 0 && (
                                        <div style={{marginBottom:8,display:'flex',flexDirection:'column',gap:3}}>
                                            {n.replies.map((r,i) => (
                                                <div key={i} className="tb-bub" style={{
                                                    background:r.sender==='user'?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.04)',
                                                    color:r.sender==='user'?'#A5B4FC':'rgba(148,163,184,0.7)',
                                                    textAlign:r.sender==='user'?'right':'left',
                                                    border:`1px solid ${r.sender==='user'?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.06)'}`,
                                                }}>{r.text}</div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="tb-rrow">
                                        <input className="tb-rinp" placeholder="Reply to admin…"
                                            value={replyText[n.id]||''}
                                            onChange={e=>setReplyText(p=>({...p,[n.id]:e.target.value}))}
                                            onKeyDown={e=>{if(e.key==='Enter')handleReply(n.id);}} />
                                        <button className="tb-send" onClick={()=>handleReply(n.id)}><Send size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default TopBar;
