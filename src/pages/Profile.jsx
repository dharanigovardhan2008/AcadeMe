import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Book, Calendar, Edit2, Shield, Settings as SettingsIcon, LogOut, Hash } from 'lucide-react'; // Added Hash
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

    // Stats
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
        regNo: user?.regNo || user?.rollNo || '', // Support both for migration/legacy
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
                // optionally update branch/year if we add dropdowns later, for now restricted or display only in edit? 
                // User asked to edit Reg No. 
            });
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    return (
        <DashboardLayout>
            <GlassCard className="mb-6 relative overflow-hidden" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--primary), var(--secondary))', opacity: 0.2 }}></div>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem',
                        background: '#0F0F1A', border: '4px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <User size={40} color="white" />
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
        </DashboardLayout>
    );
};

export default Profile;
