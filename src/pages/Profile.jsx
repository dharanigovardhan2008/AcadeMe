import React, { useState, useEffect } from 'react';
import { 
    User, Mail, Phone, Edit2, Shield, LogOut, Hash, 
    Camera, X, Upload, Save, BookOpen, GraduationCap, 
    Award, CheckSquare, ChevronRight, Info, Database, Lock, Globe, AlertCircle, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/* ── Inject Ultra-Premium Styles ─────────────────────────────── */
(function () {
    if (document.getElementById('profile-ultra-style')) return;
    const s = document.createElement('style');
    s.id = 'profile-ultra-style';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(16px); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        .p-page {
            min-height: 100vh;
            background-color: #FAFAFA;
            background-image: 
                radial-gradient(at 0% 0%, hsla(333,100%,96%,1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(225,100%,96%,1) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(278,100%,96%,1) 0, transparent 50%);
            padding: 2rem 1rem 6rem;
        }

        /* Glassmorphic Hero Card */
        .p-hero {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 1);
            border-radius: 40px; overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,1);
            margin-bottom: 2rem; position: relative;
            animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .p-hero-cover {
            height: 200px; width: 100%;
            background: linear-gradient(135deg, #E0F2FE 0%, #F3E8FF 50%, #FFE4E6 100%);
            position: relative;
        }
        .p-hero-cover::after {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at top right, rgba(255,255,255,0.6), transparent 60%);
        }
        .p-hero-content { padding: 0 3rem 3rem; text-align: center; position: relative; }

        /* Avatar */
        .p-avatar-wrap {
            position: relative; width: 150px; height: 150px;
            margin: -75px auto 20px; z-index: 10;
        }
        .p-avatar {
            width: 100%; height: 100%; border-radius: 50%;
            border: 6px solid #FFFFFF; object-fit: cover; background: #F9FAFB;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .p-camera-btn {
            position: absolute; bottom: 4px; right: 4px;
            width: 46px; height: 46px; border-radius: 50%;
            background: #111827; color: #FFFFFF; border: 4px solid #FFFFFF;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 10px 24px rgba(0,0,0,0.2);
        }
        .p-camera-btn:hover { transform: scale(1.1) rotate(-5deg); background: #3B82F6; }

        /* Premium Cards */
        .p-card {
            background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px);
            border-radius: 36px; padding: 2.5rem;
            border: 1px solid rgba(255,255,255,1);
            box-shadow: 0 12px 40px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5);
            display: flex; flex-direction: column; position: relative; overflow: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .p-card:hover { box-shadow: 0 24px 60px rgba(0,0,0,0.06); transform: translateY(-4px); }

        /* Ambient Orbs */
        .p-ambient-orb {
            position: absolute; top: -60px; right: -60px;
            width: 200px; height: 200px; border-radius: 50%;
            filter: blur(50px); opacity: 0.35; z-index: 0;
            transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none;
        }
        .p-card:hover .p-ambient-orb { transform: scale(1.4) translate(-15px, 15px); opacity: 0.55; }
        .p-card-content { position: relative; z-index: 1; }

        /* Info Blocks (Replacing Rows) */
        .p-info-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;
        }
        .p-info-block {
            background: #FFFFFF; border: 1px solid #F3F4F6;
            border-radius: 24px; padding: 20px;
            display: flex; flex-direction: column; gap: 12px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .p-info-block:hover {
            transform: translateY(-4px); border-color: #E5E7EB;
            box-shadow: 0 12px 30px rgba(0,0,0,0.05);
        }
        .p-info-icon-wrap {
            width: 44px; height: 44px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
        }

        /* Inputs */
        .p-input-group { display: flex; flex-direction: column; gap: 8px; }
        .p-label { font-size: 0.85rem; font-weight: 700; color: #4B5563; padding-left: 4px; }
        .p-input {
            width: 100%; padding: 18px 20px; border-radius: 20px;
            background: #FFFFFF; border: 1px solid #E5E7EB; color: #111827;
            font-size: 1rem; font-weight: 600; outline: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
        }
        .p-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15), 0 10px 30px rgba(0,0,0,0.04); transform: translateY(-1px); }

        /* Buttons */
        .p-btn {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            padding: 16px 28px; border-radius: 999px; font-weight: 800; font-size: 1rem;
            cursor: pointer; border: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); outline: none;
        }
        .p-btn-dark { background: #111827; color: #FFFFFF; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .p-btn-dark:hover { box-shadow: 0 12px 32px rgba(17,24,39,0.3); transform: translateY(-2px); }
        .p-btn-light { background: #FFFFFF; color: #111827; border: 1px solid #E5E7EB; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .p-btn-light:hover { background: #F9FAFB; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        
        .p-action-btn {
            display: flex; align-items: center; justify-content: space-between;
            padding: 20px 24px; border-radius: 24px; font-weight: 700; font-size: 1.05rem;
            cursor: pointer; border: 1px solid #E5E7EB; background: #FFFFFF; color: #111827;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .p-action-btn:hover { background: #F9FAFB; transform: translateX(6px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); border-color: #D1D5DB; }
        .p-action-danger { background: #FFF5F5; border-color: #FECACA; color: #DC2626; }
        .p-action-danger:hover { background: #FEF2F2; border-color: #F87171; box-shadow: 0 12px 24px rgba(220,38,38,0.15); }

        .p-pill { padding: 8px 18px; border-radius: 999px; font-size: 0.9rem; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; }
        
        .p-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        @media(min-width: 1024px) { .p-grid { grid-template-columns: 1.5fr 1fr; } }

        /* ── MODALS ── */
        .p-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(17,24,39,0.3); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: modalFadeIn 0.3s ease both; }
        .p-modal { width: 100%; background: #FFFFFF; position: relative; -ms-overflow-style: none; scrollbar-width: none; border: 1px solid rgba(255,255,255,0.8); animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .p-modal::-webkit-scrollbar { display: none; }
        
        .p-modal-sm { max-width: 580px; max-height: 90vh; overflow-y: auto; border-radius: 40px; padding: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.25); }
        
        /* Premium Privacy Policy Modal */
        .p-modal-lg { max-width: 860px; height: 90vh; border-radius: 36px; display: flex; flex-direction: column; overflow: hidden; background: #FAFAFA; box-shadow: 0 40px 100px rgba(0,0,0,0.3); }
        .p-modal-header { padding: 28px 40px; background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
        .p-modal-body { padding: 40px; overflow-y: auto; color: #4B5563; font-size: 1.05rem; line-height: 1.8; }
        
        /* Policy Content Styling */
        .p-modal-body h1 { font-size: 2.5rem; font-weight: 900; color: #111827; margin: 0 0 12px; letter-spacing: -1px; }
        .p-date-pill { display: inline-block; background: #EFF6FF; color: #1D4ED8; font-weight: 700; padding: 6px 16px; border-radius: 999px; font-size: 0.9rem; margin-bottom: 3rem; }
        
        .p-policy-card { background: #FFFFFF; border: 1px solid #F3F4F6; border-radius: 24px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .p-policy-card h2 { font-size: 1.4rem; font-weight: 900; color: #111827; margin: 0 0 16px; letter-spacing: -0.5px; display: flex; align-items: center; gap: 12px; }
        .p-policy-icon { width: 36px; height: 36px; border-radius: 12px; background: #EFF6FF; color: #1D4ED8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        
        .p-policy-card p { margin: 0 0 16px; }
        .p-policy-card p:last-child { margin: 0; }
        .p-policy-card ul { margin: 0; padding-left: 20px; }
        .p-policy-card li { margin-bottom: 8px; }
        .p-policy-card li:last-child { margin-bottom: 0; }
        
        .p-disclaimer-card { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 24px; padding: 32px; margin-top: 3rem; color: #92400E; }
        .p-disclaimer-card h3 { font-size: 1.2rem; font-weight: 900; color: #B45309; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }

        .p-modal-body::-webkit-scrollbar { width: 8px; display: block; }
        .p-modal-body::-webkit-scrollbar-track { background: transparent; }
        .p-modal-body::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        .p-modal-body::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

        @media(max-width: 600px) { 
            .p-overlay { align-items: flex-end; padding: 0; } 
            .p-modal-sm { border-radius: 40px 40px 0 0; padding: 32px 24px; max-height: 85vh; }
            .p-modal-lg { border-radius: 32px 32px 0 0; height: 90vh; }
            .p-modal-header { padding: 20px 24px; }
            .p-modal-body { padding: 24px; font-size: 1rem; }
            .p-card { padding: 1.5rem; }
        }
    `;
    document.head.appendChild(s);
}());

// Image Compression Function
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 200;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; } } 
                else { if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject; img.src = e.target.result;
        };
        reader.onerror = reject; reader.readAsDataURL(file);
    });
};

const Profile = () => {
    const { user, isAdmin, logout } = useAuth();
    const { cgpaSubjects, attendanceSubjects } = useData();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [localAvatar, setLocalAvatar] = useState(null);
    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', branch: '', year: '', regNo: '' });

    const BRANCHES = ['CSE', 'IT', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BT', 'BME', 'BI', 'CSE-Bio', 'CSE-AI', 'CSE-DS'];
    const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '', email: user.email || '', phone: user.phone || '',
                branch: user.branch || 'CSE', year: user.year || '1st Year', regNo: user.regNo || user.rollNo || ''
            });
            setLocalAvatar(user.avatar || null);
        }
    }, [user]);

    const refreshLocalUser = async () => {
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                const data = snap.data();
                setProfileData(prev => ({ ...prev, ...data }));
                setLocalAvatar(data.avatar || null);
            }
        } catch (e) { console.error("Error refreshing user:", e); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: profileData.name, phone: profileData.phone, branch: profileData.branch,
                year: profileData.year, regNo: profileData.regNo
            });
            setIsEditing(false);
            await refreshLocalUser();
        } catch (error) { console.error(error); alert("Failed to update profile."); }
        setLoading(false);
    };

    const updateAvatarInDb = async (url) => {
        setLoadingAvatar(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { avatar: url });
            setLocalAvatar(url);
            setIsEditingAvatar(false);
        } catch (error) { console.error(error); alert("Failed to update avatar."); }
        setLoadingAvatar(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setLoadingAvatar(true);
            const compressed = await compressImage(file);
            await updateAvatarInDb(compressed);
        } catch (error) { console.error(error); alert("Failed to process image."); setLoadingAvatar(false); }
    };

    const currentCGPA = (() => {
        if (!cgpaSubjects?.length) return '0.00';
        const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
        const total = cgpaSubjects.reduce((sum, s) => sum + (gradePoints[s.grade] || 0), 0);
        return (total / cgpaSubjects.length).toFixed(2);
    })();

    const currentAttendance = (() => {
        if (!attendanceSubjects?.length) return 0;
        const totalClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
        const attendedClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.attended || 0), 0);
        return totalClasses ? ((attendedClasses / totalClasses) * 100).toFixed(0) : 0;
    })();

    const currentAvatar = localAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=EFF6FF&color=1D4ED8&size=128&bold=true`;

    const AVATAR_OPTIONS = [
        "https://api.dicebear.com/9.x/personas/svg?seed=Leo&backgroundColor=EFF6FF",
        "https://api.dicebear.com/9.x/personas/svg?seed=Mila&backgroundColor=FCE7F3",
        "https://api.dicebear.com/9.x/personas/svg?seed=Ryker&backgroundColor=F3E8FF",
        "https://api.dicebear.com/9.x/personas/svg?seed=Nora&backgroundColor=DCFCE7",
        "https://api.dicebear.com/9.x/personas/svg?seed=Jack&backgroundColor=FEF3C7",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=E0F2FE",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=FFE4E6",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=James&backgroundColor=DCFCE7"
    ];

    // InfoBlock for View Mode
    const InfoBlock = ({ icon, label, value, bg, color }) => (
        <div className="p-info-block">
            <div className="p-info-icon-wrap" style={{ background: bg, color: color }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: '700', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1.1rem', color: '#111827', fontWeight: '800' }}>{value}</div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="p-page">
                <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    
                    {/* ── HERO BANNER ── */}
                    <div className="p-hero" style={{ animationDelay: '0s' }}>
                        <div className="p-hero-cover" />
                        <div className="p-hero-content">
                            <div className="p-avatar-wrap">
                                <img src={currentAvatar} alt="Profile" className="p-avatar" />
                                <button onClick={() => setIsEditingAvatar(true)} className="p-camera-btn"><Camera size={20} strokeWidth={2.5} /></button>
                            </div>
                            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', fontWeight: '900', color: '#111827', margin: '0 0 16px', letterSpacing: '-1px' }}>{profileData.name}</h1>
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <span className="p-pill" style={{ background: '#EFF6FF', color: '#1D4ED8' }}><BookOpen size={16} strokeWidth={2.5} /> {profileData.branch}</span>
                                <span className="p-pill" style={{ background: '#F3E8FF', color: '#6D28D9' }}><GraduationCap size={16} strokeWidth={2.5} /> {profileData.year}</span>
                                {isAdmin && <span className="p-pill" style={{ background: '#FEF2F2', color: '#DC2626' }}><Shield size={16} strokeWidth={2.5} /> Admin</span>}
                            </div>
                        </div>
                    </div>

                    <div className="p-grid">
                        
                        {/* ── PROFILE DETAILS / FORM (Left Col) ── */}
                        <div className="p-card" style={{ animationDelay: '0.1s' }}>
                            <div className="p-ambient-orb" style={{ background: '#8B5CF6' }} />
                            <div className="p-card-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Personal Info</h3>
                                    <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className={`p-btn ${isEditing ? 'p-btn-dark' : 'p-btn-light'}`} disabled={loading} style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
                                        {isEditing ? <><Save size={18} /> {loading ? 'Saving...' : 'Save'}</> : <><Edit2 size={18} /> Edit</>}
                                    </button>
                                </div>

                                {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="p-input-group"><label className="p-label">Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className="p-input" /></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                            <div className="p-input-group"><label className="p-label">Phone Number</label><input type="text" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="p-input" /></div>
                                            <div className="p-input-group"><label className="p-label">Registration Number</label><input type="text" value={profileData.regNo} onChange={e => setProfileData({ ...profileData, regNo: e.target.value })} className="p-input" /></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                            <div className="p-input-group">
                                                <label className="p-label">Branch</label>
                                                <select value={profileData.branch} onChange={e => setProfileData({ ...profileData, branch: e.target.value })} className="p-input" style={{ cursor: 'pointer' }}>
                                                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </div>
                                            <div className="p-input-group">
                                                <label className="p-label">Year</label>
                                                <select value={profileData.year} onChange={e => setProfileData({ ...profileData, year: e.target.value })} className="p-input" style={{ cursor: 'pointer' }}>
                                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-info-grid">
                                        <InfoBlock icon={<User size={22} />} label="Full Name" value={profileData.name} bg="#EFF6FF" color="#1D4ED8" />
                                        <InfoBlock icon={<Mail size={22} />} label="Email Address" value={profileData.email} bg="#FCE7F3" color="#BE185D" />
                                        <InfoBlock icon={<Phone size={22} />} label="Phone Number" value={profileData.phone || "Not Set"} bg="#DCFCE7" color="#15803D" />
                                        <InfoBlock icon={<Hash size={22} />} label="Register No" value={profileData.regNo || "Not Set"} bg="#F3E8FF" color="#6D28D9" />
                                        <InfoBlock icon={<BookOpen size={22} />} label="Branch" value={profileData.branch} bg="#FEF3C7" color="#B45309" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── STATS & ACTIONS (Right Col) ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* CGPA Card */}
                                <div className="p-card" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', animationDelay: '0.2s' }}>
                                    <div className="p-ambient-orb" style={{ background: '#3B82F6' }} />
                                    <div className="p-card-content">
                                        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(29,78,216,0.15)' }}><Award size={32} strokeWidth={2.5} /></div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#111827', lineHeight: 1, letterSpacing: '-1.5px' }}>{currentCGPA}</div>
                                        <div style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '800', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall CGPA</div>
                                    </div>
                                </div>
                                {/* Attendance Card */}
                                <div className="p-card" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', animationDelay: '0.3s' }}>
                                    <div className="p-ambient-orb" style={{ background: '#10B981' }} />
                                    <div className="p-card-content">
                                        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(21,128,61,0.15)' }}><CheckSquare size={32} strokeWidth={2.5} /></div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#111827', lineHeight: 1, letterSpacing: '-1.5px' }}>{currentAttendance}%</div>
                                        <div style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '800', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Actions */}
                            <div className="p-card" style={{ padding: '36px', animationDelay: '0.4s' }}>
                                <div className="p-ambient-orb" style={{ background: '#F43F5E' }} />
                                <div className="p-card-content">
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', margin: '0 0 24px', letterSpacing: '-0.5px' }}>Account Settings</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <button onClick={() => setShowPrivacyPolicy(true)} className="p-action-btn">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><Shield size={24} color="#6B7280" /> Privacy Policy</span>
                                            <ChevronRight size={24} color="#9CA3AF" />
                                        </button>
                                        <button onClick={async () => { await logout(); navigate('/login'); }} className="p-action-btn p-action-danger">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><LogOut size={24} /> Log Out</span>
                                            <ChevronRight size={24} opacity={0.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── AVATAR UPLOAD MODAL ── */}
            {isEditingAvatar && (
                <div className="p-overlay" onClick={() => setIsEditingAvatar(false)}>
                    <div className="p-modal p-modal-sm" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Avatar</h2>
                            <button onClick={() => setIsEditingAvatar(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#E5E7EB'} onMouseOut={e=>e.currentTarget.style.background='#F3F4F6'}><X size={22} /></button>
                        </div>

                        {loadingAvatar ? (
                            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', border: '5px solid #EFF6FF', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                                <div style={{ color: '#111827', fontWeight: '800', fontSize: '1.2rem' }}>Uploading...</div>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', width: '100%', padding: '40px 20px', textAlign: 'center', background: '#F9FAFB', border: '2px dashed #CBD5E1', borderRadius: '28px', cursor: 'pointer', marginBottom: '32px', transition: 'all 0.2s' }} onMouseOver={e=> {e.currentTarget.style.borderColor='#3B82F6'; e.currentTarget.style.background='#EFF6FF'}} onMouseOut={e=> {e.currentTarget.style.borderColor='#CBD5E1'; e.currentTarget.style.background='#F9FAFB'}}>
                                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFFFFF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 10px 30px rgba(29,78,216,0.1)' }}><Upload size={28} strokeWidth={2.5} /></div>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: '0 0 8px' }}>Upload Photo</h4>
                                    <p style={{ fontSize: '0.95rem', color: '#6B7280', margin: 0, fontWeight: '500' }}>JPEG or PNG (Auto-compressed to fit)</p>
                                </label>

                                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: '0 0 16px' }}>Presets</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '16px' }}>
                                    {AVATAR_OPTIONS.map((url, i) => (
                                        <img key={i} src={url} alt={`Preset ${i}`} onClick={() => updateAvatarInDb(url)}
                                            style={{ width: '100%', borderRadius: '50%', cursor: 'pointer', border: currentAvatar === url ? '4px solid #1D4ED8' : '4px solid #F3F4F6', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', background: '#F9FAFB' }}
                                            onMouseEnter={e => {e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'}}
                                            onMouseLeave={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'}}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PRIVACY POLICY MODAL (World-Class Readability) ── */}
            {showPrivacyPolicy && (
                <div className="p-overlay" onClick={() => setShowPrivacyPolicy(false)}>
                    <div className="p-modal p-modal-lg" onClick={e => e.stopPropagation()}>
                        
                        <div className="p-modal-header">
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Shield size={28} color="#1D4ED8" strokeWidth={2.5} /> Privacy & Policy
                            </h2>
                            <button onClick={() => setShowPrivacyPolicy(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#E5E7EB'} onMouseOut={e=>e.currentTarget.style.background='#F3F4F6'}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-modal-body">
                            
                            <h1>Privacy Policy</h1>
                            <span className="p-date-pill">Last updated: October 24, 2023</span>
                            
                            <p style={{ fontSize: '1.15rem', color: '#374151', marginBottom: '2rem' }}>This Privacy Policy explains how this application ("the App") collects, uses, stores, and protects your information.</p>

                            <div className="p-policy-card">
                                <h2><div className="p-policy-icon"><Info size={20} strokeWidth={2.5} /></div> 1. About This App</h2>
                                <p>This App is an independent student project created to help students track academic information such as CGPA and attendance. It is <strong>not officially affiliated with, endorsed by, or operated by SIMATS Engineering</strong> or any other institution. Any reference to SIMATS Engineering is for contextual/informational purposes only.</p>
                            </div>

                            <div className="p-policy-card">
                                <h2><div className="p-policy-icon"><Database size={20} strokeWidth={2.5} /></div> 2. Information We Collect</h2>
                                <ul>
                                    <li><strong>Account information:</strong> name, email address, phone number</li>
                                    <li><strong>Academic information:</strong> registration/roll number, branch, year of study, CGPA subjects and grades, attendance records</li>
                                    <li><strong>Profile information:</strong> profile photo/avatar (if uploaded or selected)</li>
                                    <li><strong>Authentication data:</strong> securely managed login credentials, unique user ID, sign-in timestamps (via Firebase Authentication)</li>
                                </ul>
                                <p>All academic data is entered directly by you. We do not pull this from any official college system or database.</p>
                            </div>

                            <div className="p-policy-card">
                                <h2><div className="p-policy-icon"><Shield size={20} strokeWidth={2.5} /></div> 3. How We Use & Store Your Data</h2>
                                <h3>Usage</h3>
                                <p>Your data is used only to display your personalized dashboard (CGPA, attendance), maintain your account, and allow you to manage your profile. <strong>We do not use your data for advertising and do not sell or rent it to third parties.</strong></p>
                                
                                <h3>Storage & Security</h3>
                                <p>Stored securely via Firebase (Google Cloud):</p>
                                <ul>
                                    <li><strong>Firebase Authentication</strong> – login credentials (never stored in plain text)</li>
                                    <li><strong>Cloud Firestore</strong> – profile and academic data</li>
                                </ul>
                                <p>Encrypted in transit (HTTPS) and at rest, per Firebase's default infrastructure.</p>
                            </div>

                            <div className="p-policy-card">
                                <h2><div className="p-policy-icon"><Lock size={20} strokeWidth={2.5} /></div> 4. Access & Third-Party Info</h2>
                                <h3>Who Can Access Your Data?</h3>
                                <ul>
                                    <li><strong>You</strong> can view and edit your own data anytime.</li>
                                    <li><strong>The App administrator(s)</strong> may have technical database access for maintenance, and will not use it beyond operating the App.</li>
                                    <li>We do not share your data with SIMATS Engineering, faculty, or any third party.</li>
                                </ul>

                                <h3>Third-Party Information Displayed</h3>
                                <p>Where the App displays information about third parties (for example, publicly available faculty contact details), such information is sourced only from official, publicly published SIMATS Engineering resources. We do not independently collect, solicit, or verify personal contact information of any third party. If you believe any information displayed is inaccurate, outdated, or should not be published, contact us immediately at the email below and it will be removed.</p>
                            </div>

                            <div className="p-policy-card">
                                <h2><div className="p-policy-icon"><Globe size={20} strokeWidth={2.5} /></div> 5. Your Rights & Choices</h2>
                                <ul>
                                    <li><strong>Edit</strong> your profile information anytime</li>
                                    <li><strong>Request deletion</strong> of your account and data by emailing us</li>
                                    <li><strong>Change your password</strong> anytime via Privacy & Security settings</li>
                                </ul>
                            </div>

                            <div className="p-policy-card">
                                <h2><div className="p-policy-icon"><FileText size={20} strokeWidth={2.5} /></div> 6. Additional Terms</h2>
                                <h3>Data Accuracy Disclaimer</h3>
                                <p>CGPA and attendance figures are calculated from information you enter and are for <strong>personal reference only</strong>. They are not official academic records.</p>
                                
                                <h3>Children's Privacy</h3>
                                <p>This App is intended for college/university students and is not directed at children under 13.</p>
                                
                                <h3>Contact Us</h3>
                                <p>For any queries or data removal requests, please email: <strong>techbehindapps@gmail.com</strong></p>
                            </div>

                            {/* Disclaimer Box */}
                            <div className="p-disclaimer-card">
                                <h3><AlertCircle size={22} strokeWidth={2.5} /> Legal Disclaimer</h3>
                                This App is an independent, student-built project and is not an official product of SIMATS Engineering. The developers are not liable for decisions made based on information displayed within the App. Any third-party information shown is sourced from publicly available official channels; requests for correction or removal will be honored promptly upon contact.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Profile;