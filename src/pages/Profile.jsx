import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Book, Calendar, Edit2, Shield, Settings as SettingsIcon, LogOut, Hash, Camera, X } from 'lucide-react'; // Added Camera, X
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Profile = () => {
    const { user, isAdmin } = useAuth();
    const { cgpaSubjects, attendanceSubjects } = useData();
    const [isEditing, setIsEditing] = useState(false);
    
    // NEW: State for Avatar Modal
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    // Stats Logic (Preserved)
    const calculateCGPA = () => {
        if (!cgpaSubjects.length) return 0;
        const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
        const total = cgpaSubjects.reduce((sum, s) => sum + (gradePoints[s.grade] || 0), 0);
        return (total / cgpaSubjects.length).toFixed(2);
    }
    const currentCGPA = calculateCGPA();

    const calculateAttendance = () => {
        if (!attendanceSubjects.length) return 0;
        const totalClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.total), 0);
        const attendedClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.attended), 0);
        return totalClasses ? ((attendedClasses / totalClasses) * 100).toFixed(0) : 0;
    }
    const currentAttendance = calculateAttendance();

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        branch: user?.branch || 'CSE',
        year: user?.year || '1st Year',
        regNo: user?.regNo || user?.rollNo || '', 
        section: user?.section || 'A'
    });

    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone,
                branch: user.branch || prev.branch,
                year: user.year || prev.year,
                regNo: user.regNo || user.rollNo || prev.regNo
            }));
        }
    }, [user]);

    // Existing Profile Save Logic (Preserved)
    const handleSave = async () => {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                name: profileData.name,
                phone: profileData.phone,
                regNo: profileData.regNo,
            });
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    // NEW: Avatar Selection Logic
    const AVATAR_OPTIONS = [
        "https://api.dicebear.com/9.x/notionists/svg?seed=Felix",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Abby",
        "https://api.dicebear.com/9.x/notionists/svg?seed=Mila",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Brian",
        "https://api.dicebear.com/9.x/notionists/svg?seed=Robert",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Midnight",
        "https://api.dicebear.com/9.x/notionists/svg?seed=Jocelyn",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Cookie",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
        "https://api.dicebear.com/9.x/bottts/svg?seed=Robot1",
        "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Happy"
    ];

    const handleAvatarSelect = async (url) => {
        setLoadingAvatar(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                avatar: url
            });
            window.location.reload(); // Simple reload to show new avatar everywhere
        } catch (error) {
            console.error("Error updating avatar:", error);
            alert("Failed to update avatar.");
        }
        setLoadingAvatar(false);
        setIsEditingAvatar(false);
    };

    // Determine current avatar or fallback
    const currentAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    return (
        <DashboardLayout>
            <GlassCard className="mb-6 relative overflow-hidden" style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--primary), var(--secondary))', opacity: 0.2 }}></div>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    
                    {/* UPDATED AVATAR SECTION WITH CAMERA BUTTON */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem' }}>
                        <img 
                            src={currentAvatar}
                            alt="Profile" 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '4px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                background: '#1a1a1a'
                            }} 
                        />
                        <button 
                            onClick={() => setIsEditingAvatar(true)}
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                background: 'var(--primary)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                            title="Change Avatar"
                        >
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
                        <h3 style={{ fontWeight: 'bold' }}>Personal Details</h3>
                        <GlassButton onClick={isEditing ? handleSave : () => setIsEditing(true)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                            <Edit2 size={14} /> {isEditing ? 'Save' : 'Edit'}
                        </GlassButton>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isEditing ? (
                            <>
                                <GlassInput label="Full Name" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} icon={User} />
                                <GlassInput label="Phone" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} icon={Phone} />
                                <GlassInput label="Registration Number" value={profileData.regNo} onChange={e => setProfileData({ ...profileData, regNo: e.target.value })} icon={Hash} />
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Full Name</span>
                                    <span>{profileData.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                                    <span>{profileData.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                                    <span>{profileData.phone}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Branch</span>
                                    <span>{profileData.branch}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Registration Number</span>
                                    <span>{profileData.regNo || 'N/A'}</span>
                                </div>
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
                            <GlassButton variant="glass" style={{ justifyContent: 'flex-start', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)' }}><LogOut size={16} /> Delete Account</GlassButton>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* NEW: AVATAR SELECTION MODAL */}
            {isEditingAvatar && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <GlassCard style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Choose Your Avatar</h3>
                            <button onClick={() => setIsEditingAvatar(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {loadingAvatar ? (
                            <p style={{ textAlign: 'center', padding: '2rem' }}>Updating profile...</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {AVATAR_OPTIONS.map((avatarUrl, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleAvatarSelect(avatarUrl)}
                                        style={{ 
                                            cursor: 'pointer', 
                                            borderRadius: '12px', 
                                            padding: '8px', 
                                            background: currentAvatar === avatarUrl ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                                            border: currentAvatar === avatarUrl ? '2px solid #3B82F6' : '2px solid transparent',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                        className="hover:bg-white/10"
                                    >
                                        <img src={avatarUrl} alt={`Avatar ${index}`} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Click an avatar to select it.
                        </p>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Profile;
