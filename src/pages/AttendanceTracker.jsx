import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import GlassDropdown from '../components/GlassDropdown';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

const AttendanceTracker = () => {
    const { attendanceSubjects, updateAttendance, addAttendanceSubject, courses } = useData();
    const [newSubject, setNewSubject] = useState({ name: '', total: '', attended: '' });
    const [calcData, setCalcData] = useState({ selectedCourseName: '' });

    // Overall Calculation
    const totalClasses = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
    const totalAttended = attendanceSubjects.reduce((sum, s) => sum + parseInt(s.attended || 0), 0);
    const overallPercentage = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;

    const handleAddSubject = () => {
        if (newSubject.name && newSubject.total) {
            addAttendanceSubject({
                ...newSubject,
                total: parseInt(newSubject.total),
                attended: parseInt(newSubject.attended || 0)
            });
            setNewSubject({ name: '', total: '', attended: '' });
        }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>Attendance</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Track your academic progress</p>
            </div>

            {/* Overall Stats Card */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.7), rgba(40, 30, 60, 0.4))', // Deep violet charcoal
                backdropFilter: 'blur(20px)',
                borderRadius: '24px', // More rounded
                padding: '2rem',
                border: '0.5px solid rgba(255,255,255,0.1)', // Ultra-thin border
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                <div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: '800', background: 'linear-gradient(to right, #34D399, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {overallPercentage}%
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Total Attendance</p>
                </div>
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {overallPercentage >= 80 ? <CheckCircle size={32} color="#34D399" /> : <AlertTriangle size={32} color="#F87171" />}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {attendanceSubjects.map(subject => {
                    const percentage = subject.total ? Math.round((subject.attended / subject.total) * 100) : 0;
                    const isSafe = percentage >= 80;

                    let statusMsg = "";
                    if (isSafe) {
                        const canSkip = Math.floor((subject.attended - 0.8 * subject.total) / 0.8);
                        statusMsg = `You can skip ${canSkip} classes`;
                    } else {
                        const needed = Math.ceil((0.8 * subject.total - subject.attended) / 0.2);
                        statusMsg = `Attend next ${needed} classes`;
                    }

                    return (
                        <div key={subject.id} style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(15px)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            border: '0.5px solid rgba(255,255,255,0.08)',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 0 0 0.5px rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontWeight: '600', fontSize: '1.1rem' }}>{subject.name}</h3>
                                <span style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: isSafe ? '#34D399' : '#F87171' // Mint Green or Red
                                }}>{percentage}%</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                                <span>Attended: {subject.attended}/{subject.total}</span>
                                <span>{statusMsg}</span>
                            </div>

                            {/* Mint-Emerald Gradient Progress Bar */}
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${percentage}%`,
                                    background: isSafe ? 'linear-gradient(90deg, #34D399 0%, #10B981 100%)' : 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)', // Mint gradient
                                    borderRadius: '10px',
                                    boxShadow: isSafe ? '0 0 10px rgba(16, 185, 129, 0.3)' : '0 0 10px rgba(239, 68, 68, 0.3)',
                                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}></div>
                            </div>

                            {/* Minimalist Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => updateAttendance(subject.id, parseInt(subject.total) + 1, parseInt(subject.attended) + 1)}
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#34D399',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    + Present
                                </button>
                                <button
                                    onClick={() => updateAttendance(subject.id, parseInt(subject.total) + 1, parseInt(subject.attended))}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#F87171',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    + Absent
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Floating Add Subject Card */}
                <div style={{
                    background: 'rgba(20, 20, 35, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '2rem',
                    border: '0.5px solid rgba(255,255,255,0.05)'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}><Plus size={20} /> Add Subject</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <input
                            placeholder="Subject Name"
                            value={newSubject.name}
                            onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                            style={{
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="number"
                                placeholder="Total"
                                value={newSubject.total}
                                onChange={e => setNewSubject({ ...newSubject, total: e.target.value })}
                                style={{
                                    flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Attended"
                                value={newSubject.attended}
                                onChange={e => setNewSubject({ ...newSubject, attended: e.target.value })}
                                style={{
                                    flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                                }}
                            />
                        </div>
                        <GlassButton onClick={handleAddSubject} variant="gradient" style={{ justifyContent: 'center', borderRadius: '12px', padding: '12px' }}>Add Subject</GlassButton>
                    </div>
                </div>

                {/* Mark Active Session - Floating Action */}
                <div style={{
                    background: 'rgba(20, 20, 35, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '2rem',
                    border: '0.5px solid rgba(255,255,255,0.05)'
                }}>
                    <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}><CheckCircle size={20} /> Quick Mark</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Select active session from your branch</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <GlassDropdown
                            options={courses.length > 0 ? courses.map(c => c.name) : attendanceSubjects.map(s => s.name)}
                            value={calcData.selectedCourseName}
                            onChange={(name) => setCalcData({ ...calcData, selectedCourseName: name })}
                            placeholder="Select Running Subject..."
                            style={{ zIndex: 20 }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                disabled={!calcData.selectedCourseName}
                                onClick={() => {
                                    if (!calcData.selectedCourseName) return;

                                    // Check if exists in attendanceSubjects
                                    const existing = attendanceSubjects.find(s => s.name === calcData.selectedCourseName);

                                    if (existing) {
                                        updateAttendance(existing.id, parseInt(existing.total) + 1, parseInt(existing.attended) + 1);
                                    } else {
                                        // Create new
                                        addAttendanceSubject({
                                            name: calcData.selectedCourseName,
                                            total: 1,
                                            attended: 1
                                        });
                                        alert(`Added ${calcData.selectedCourseName} to your list!`);
                                    }
                                }}
                                style={{
                                    background: '#34D399', color: '#000', border: 'none', padding: '12px',
                                    borderRadius: '12px', cursor: 'pointer', fontWeight: '600',
                                    opacity: !calcData.selectedCourseName ? 0.5 : 1
                                }}
                            >
                                Present
                            </button>
                            <button
                                disabled={!calcData.selectedCourseName}
                                onClick={() => {
                                    if (!calcData.selectedCourseName) return;

                                    // Check if exists in attendanceSubjects
                                    const existing = attendanceSubjects.find(s => s.name === calcData.selectedCourseName);

                                    if (existing) {
                                        updateAttendance(existing.id, parseInt(existing.total) + 1, parseInt(existing.attended));
                                    } else {
                                        // Create new
                                        addAttendanceSubject({
                                            name: calcData.selectedCourseName,
                                            total: 1,
                                            attended: 0
                                        });
                                        alert(`Added ${calcData.selectedCourseName} to your list!`);
                                    }
                                }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600',
                                    opacity: !calcData.selectedCourseName ? 0.5 : 1
                                }}
                            >
                                Absent
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceTracker;
