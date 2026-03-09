import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Edit2, Shield, Settings as SettingsIcon, LogOut, Hash, Camera, X, Upload, Image as ImageIcon, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// ✅ Bug #17 Fix — Compress image to max 200x200px JPEG before saving to Firestore
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG at 70% quality → typically 10–30KB
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressed);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const Profile = () => {
    const { user, isAdmin, logout } = useAuth();
    const { cgpaSubjects, attendanceSubjects } = useData();
    const navigate = useNavigate(); // ✅ Bug #23 Fix — use React Router navigate

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [localAvatar, setLocalAvatar] = useState(null); // ✅ Bug #12 Fix — local state instead of reload

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        branch: '',
        year: '',
        regNo: ''
    });

    const BRANCHES = ['CSE', 'IT', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BT', 'BME', 'BI', 'CSE-Bio', 'CSE-AI', 'CSE-DS'];
    const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                branch: user.branch || 'CSE',
                year: user.year || '1st Year',
                regNo: user.regNo || user.rollNo || ''
            });
            setLocalAvatar(user.avatar || null);
        }
    }, [user]);

    // ✅ Bug #12 Fix — refresh user from Firestore and update local state, no page reload
    const refreshLocalUser = async () => {
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                const data = snap.data();
                setProfileData(prev => ({ ...prev, ...data }));
                setLocalAvatar(data.avatar || null);
            }
        } catch (e) {
            console.error("Error refreshing user:", e);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: profileData.name,
                phone: profileData.phone,
                branch: profileData.branch,
                year: profileData.year,
                regNo: profileData.regNo
            });
            setIsEditing(false);
            await refreshLocalUser(); // ✅ No reload — just re-fetch from Firestore
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
        setLoading(false);
    };

    const updateAvatarInDb = async (url) => {
        setLoadingAvatar(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { avatar: url });
            setLocalAvatar(url); // ✅ Update local state instantly, no reload
            setIsEditingAvatar(false);
        } catch (error) {
            console.error("Error updating avatar:", error);
            alert("Failed to update avatar.");
        }
        setLoadingAvatar(false);
    };

    // ✅ Bug #17 Fix — compress image before saving, keeps Firestore doc well under 1MB
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoadingAvatar(true);
            const compressed = await compressImage(file);
            await updateAvatarInDb(compressed);
        } catch (error) {
            console.error("Compression error:", error);
            alert("Failed to process image. Please try a different one.");
            setLoadingAvatar(false);
        }
    };

    const calculateCGPA = () => {
        if (!cgpaSubjects?.length) return 0;
        const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
        const total = cgpaSubjects.reduce((sum, s) => sum + (gradePoints[s.grade] || 0), 0);
        return (total / cgpaSubjects.length).toFixed(2);
    };

    const calculateAttendance = () => {
        if (!attendanceSubjects?.length) return 0;
        const totalClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
        const attendedClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.attended || 0), 0);
        return totalClasses ? ((attendedClasses / totalClasses) * 100).toFixed(0) : 0;
    };

    const currentCGPA = calculateCGPA();
    const currentAttendance = calculateAttendance();

    const currentAvatar = localAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    const AVATAR_OPTIONS = [
        "https://api.dicebear.com/9.x/personas/svg?seed=Leo&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/personas/svg?seed=Mila&backgroundColor=ffdfbf",
        "https://api.dicebear.com/9.x/personas/svg?seed=Ryker&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/personas/svg?seed=Nora&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/personas/svg?seed=Jack&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=James&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Maria&backgroundColor=ffdfbf"
    ];

    const inputStyle = {
        width: '100%', padding: '12px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', outline: 'none', fontSize: '1rem'
    };

    return (
        <DashboardLayout>
            <GlassCard className="mb-6 relative overflow-hidden" style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--primary), var(--secondary))', opacity: 0.2 }}></div>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem' }}>
                        <img
                            src={currentAvatar}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.2)', background: '#1a1a1a' }}
                        />
                        <button onClick={() => setIsEditingAvatar(true)} style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                            <Camera size={18} />
                        </button>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{profileData.name}</h1>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <Badge variant="primary">{profileData.branch}</Badge>
                        <Badge variant="neutral">{profileData.year}</Badge>
                        {isAdmin && <Badge variant="danger">Admin</Badge>}
                    </div>
                </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <GlassCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: 'bold' }}>Profile Details</h3>
                        <GlassButton onClick={isEditing ? handleSave : () => setIsEditing(true)} style={{ padding: '5px 10px', fontSize: '0.8rem' }} disabled={loading}>
                            {isEditing ? <><Save size={14} /> {loading ? 'Saving...' : 'Save'}</> : <><Edit2 size={14} /> Edit</>}
                        </GlassButton>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isEditing ? (
                            <>
                                <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Phone</label><input type="text" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Reg No</label><input type="text" value={profileData.regNo} onChange={e => setProfileData({ ...profileData, regNo: e.target.value })} style={inputStyle} /></div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Branch</label>
                                    <select value={profileData.branch} onChange={e => setProfileData({ ...profileData, branch: e.target.value })} style={inputStyle}>
                                        {BRANCHES.map(b => <option key={b} value={b} style={{ color: 'black' }}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Year</label>
                                    <select value={profileData.year} onChange={e => setProfileData({ ...profileData, year: e.target.value })} style={inputStyle}>
                                        {YEARS.map(y => <option key={y} value={y} style={{ color: 'black' }}>{y}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <InfoRow icon={<User size={18} />} label="Full Name" value={profileData.name} />
                                <InfoRow icon={<Mail size={18} />} label="Email" value={profileData.email} />
                                <InfoRow icon={<Phone size={18} />} label="Phone" value={profileData.phone || "Not Set"} />
                                <InfoRow icon={<BookOpen size={18} />} label="Branch" value={profileData.branch} />
                                <InfoRow icon={<Hash size={18} />} label="Reg No" value={profileData.regNo || "Not Set"} />
                            </>
                        )}
                    </div>
                </GlassCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <GlassCard style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{currentCGPA}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>Current CGPA</div>
                        </GlassCard>
                        <GlassCard style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{currentAttendance}%</div>
                            <div style={{ color: 'var(--text-secondary)' }}>Attendance</div>
                        </GlassCard>
                    </div>

                    <GlassCard>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Account Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <GlassButton variant="glass" style={{ justifyContent: 'flex-start' }}><SettingsIcon size={16} /> Notification Settings</GlassButton>
                            <GlassButton variant="glass" style={{ justifyContent: 'flex-start' }}><Shield size={16} /> Privacy & Security</GlassButton>
                            {/* ✅ Bug #23 Fix — use navigate() instead of window.location.href */}
                            <GlassButton
                                onClick={async () => { await logout(); navigate('/login'); }}
                                variant="glass"
                                style={{ justifyContent: 'flex-start', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)' }}
                            >
                                <LogOut size={16} /> Logout
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* AVATAR MODAL */}
            {isEditingAvatar && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <GlassCard style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Choose Avatar</h3>
                            <button onClick={() => setIsEditingAvatar(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {loadingAvatar ? (
                            <p style={{ textAlign: 'center' }}>Updating...</p>
                        ) : (
                            <div>
                                {/* ✅ Bug #17 Fix — compress image to 200x200 JPEG before upload */}
                                <div style={{ marginBottom: '2rem', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}><Upload size={18} /> Upload Photo</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>Image will be auto-compressed to fit Firestore limits</p>
                                    <label style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><ImageIcon size={18} /> Choose from Gallery</div>
                                    </label>
                                </div>

                                <h4 style={{ marginBottom: '1rem' }}>Or choose preset</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem' }}>
                                    {AVATAR_OPTIONS.map((url, i) => (
                                        <img key={i} src={url} alt={`Avatar ${i}`} onClick={() => updateAvatarInDb(url)}
                                            style={{ width: '100%', borderRadius: '50%', cursor: 'pointer', border: currentAvatar === url ? '3px solid #3B82F6' : '3px solid transparent' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: 'var(--primary)' }}>{icon}</div>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <span style={{ fontWeight: '500' }}>{value}</span>
    </div>
);

export default Profile;
