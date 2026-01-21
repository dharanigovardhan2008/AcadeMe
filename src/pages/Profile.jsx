import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Book, Calendar, Edit2, Shield, Settings as SettingsIcon, LogOut, Hash, Camera, X } from 'lucide-react';
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
    
    // Avatar Modal State
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    // ==========================================
    // 20 FLAT & ATTRACTIVE AVATAR OPTIONS
    // (Matched to the style of the image you provided)
    // ==========================================
    const AVATAR_OPTIONS = [
        // Row 1: Flat "Personas" Style (Matches your image perfectly)
        "https://api.dicebear.com/9.x/personas/svg?seed=Leo&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/personas/svg?seed=Mila&backgroundColor=ffdfbf",
        "https://api.dicebear.com/9.x/personas/svg?seed=Ryker&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/personas/svg?seed=Nora&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/personas/svg?seed=Jack&backgroundColor=b6e3f4",
        
        // Row 2: More Flat Styles
        "https://api.dicebear.com/9.x/personas/svg?seed=Sofia&backgroundColor=ffdfbf",
        "https://api.dicebear.com/9.x/personas/svg?seed=Mason&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/personas/svg?seed=Avery&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/personas/svg?seed=Oliver&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/personas/svg?seed=Maya&backgroundColor=ffdfbf",

        // Row 3: "Avataaars" Style (Classic Tech Look)
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=James&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Maria&backgroundColor=ffdfbf",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Brian&backgroundColor=c0aede",

        // Row 4: Professional & Clean
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Amara&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Christopher&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Jessica&backgroundColor=ffdfbf",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Ryan&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Samantha&backgroundColor=d1d4f9"
    ];

    // Stats Logic
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

    const handleAvatarSelect = async (url) => {
        setLoadingAvatar(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                avatar: url
            });
            window.location.reload(); 
        } catch (error) {
            console.error("Error updating avatar:", error);
            alert("Failed to update avatar.");
        }
        setLoadingAvatar(false);
        setIsEditingAvatar(false);
    };

    const currentAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=3B82F6&color=fff&size=128&bold=true`;

    return (
        <DashboardLayout>
            <GlassCard className="mb-6 relative overflow-hidden" style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--primary), var(--secondary))', opacity: 0.2 }}></div>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    
                    {/* AVATAR DISPLAY */}
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

            {/* AVATAR SELECTION MODAL */}
            {isEditingAvatar && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <GlassCard style={{ width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Choose Avatar</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select a style that fits you best</p>
                            </div>
                            <button onClick={() => setIsEditingAvatar(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {loadingAvatar ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <div className="skeleton-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                                <p>Updating your profile...</p>
                            </div>
                        ) : (
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                                gap: '1rem',
                                paddingBottom: '1rem'
                            }}>
                                {AVATAR_OPTIONS.map((avatarUrl, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleAvatarSelect(avatarUrl)}
                                        style={{ 
                                            cursor: 'pointer', 
                                            borderRadius: '50%', // Circle shape like the image
                                            padding: '4px', 
                                            background: currentAvatar === avatarUrl ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                            border: currentAvatar === avatarUrl ? '3px solid #3B82F6' : '3px solid transparent',
                                            transition: 'transform 0.2s',
                                            aspectRatio: '1/1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <img 
                                            src={avatarUrl} 
                                            alt={`Avatar ${index}`} 
                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Profile;
