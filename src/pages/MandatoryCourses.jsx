import React, { useMemo } from 'react';
import { BookOpen, CheckCircle, Info } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassDropdown from '../components/GlassDropdown';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

// Grade colour coding
const gradeColor = (g) => {
    if (!g) return 'rgba(255,255,255,0.1)';
    if (g === 'S') return '#34D399';
    if (g === 'A') return '#60A5FA';
    if (g === 'B') return '#818CF8';
    if (g === 'C') return '#FBBF24';
    if (g === 'D' || g === 'E') return '#FB923C';
    if (g === 'F') return '#F87171';
    return 'rgba(255,255,255,0.1)';
};

const MandatoryCourses = () => {
    const { courses, cgpaSubjects, addSubjectCGPA, updateSubjectCGPA } = useData();
    const { user } = useAuth();

    // Grade stats summary
    const gradeStats = useMemo(() => {
        const graded = courses.filter(c => {
            const ex = cgpaSubjects.find(s => s.code === c.code || s.name === c.name);
            return ex && ex.grade;
        });
        return { total: courses.length, graded: graded.length };
    }, [courses, cgpaSubjects]);

    const handleGradeChange = (course, grade) => {
        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
        if (existing) {
            updateSubjectCGPA(existing.id, grade);
        } else {
            addSubjectCGPA({ name: course.name, code: course.code, grade });
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BookOpen size={28} color="#60A5FA" /> My Courses
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Mandatory subjects for <strong style={{ color: 'white' }}>{user?.branch || '...'}</strong> branch — assign grades to track your CGPA
                </p>
            </div>

            {/* Progress bar */}
            {courses.length > 0 && (
                <GlassCard style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Grade Progress</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{gradeStats.graded} / {gradeStats.total} subjects graded</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${gradeStats.total ? (gradeStats.graded / gradeStats.total) * 100 : 0}%`, background: 'linear-gradient(90deg, #3B82F6, #34D399)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                    </div>
                </GlassCard>
            )}

            {/* Info banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', padding: '10px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.85rem', color: '#93C5FD' }}>
                <Info size={16} />
                Courses are set by your admin for the <strong>{user?.branch}</strong> branch. Grades you assign here sync with your CGPA Calculator.
            </div>

            {/* Course list */}
            <div style={{ display: 'grid', gap: '0.85rem' }}>
                {courses.length === 0 ? (
                    <GlassCard>
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ fontWeight: '600', marginBottom: '4px' }}>No courses found for <strong style={{ color: 'white' }}>{user?.branch || 'your branch'}</strong></p>
                            <p style={{ fontSize: '0.85rem' }}>Your admin hasn't added any courses for this branch yet.</p>
                        </div>
                    </GlassCard>
                ) : (
                    courses.map((course, index) => {
                        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
                        const currentGrade = existing?.grade || '';
                        const color = gradeColor(currentGrade);

                        return (
                            <GlassCard key={course.id || course.code} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderLeft: `4px solid ${color}`,
                                position: 'relative',
                                zIndex: courses.length - index,
                                transition: 'border-color 0.3s ease',
                                gap: '1rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                    {/* Grade dot */}
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: currentGrade ? `${color}22` : 'rgba(255,255,255,0.05)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold', fontSize: '0.85rem', color: color }}>
                                        {currentGrade || '—'}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.name}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {course.code}
                                            {currentGrade && <span style={{ marginLeft: '8px', color: color }}>• {GRADE_POINTS[currentGrade]} pts</span>}
                                        </p>
                                    </div>
                                </div>
                                {currentGrade && (
                                    <CheckCircle size={16} color="#34D399" style={{ flexShrink: 0 }} />
                                )}
                                <div style={{ width: '150px', flexShrink: 0 }}>
                                    <GlassDropdown
                                        options={GRADES}
                                        value={currentGrade}
                                        onChange={(g) => handleGradeChange(course, g)}
                                        placeholder="Grade --"
                                    />
                                </div>
                            </GlassCard>
                        );
                    })
                )}
            </div>
        </DashboardLayout>
    );
};

export default MandatoryCourses;
