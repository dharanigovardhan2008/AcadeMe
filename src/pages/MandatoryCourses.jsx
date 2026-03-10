import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BookOpen, CheckCircle, ChevronDown, Check } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

const gradeColor = (g) => {
    if (!g) return 'rgba(255,255,255,0.15)';
    if (g === 'S') return '#34D399';
    if (g === 'A') return '#60A5FA';
    if (g === 'B') return '#818CF8';
    if (g === 'C') return '#FBBF24';
    if (g === 'D' || g === 'E') return '#FB923C';
    if (g === 'F') return '#F87171';
    return 'rgba(255,255,255,0.15)';
};

// Inline dropdown that uses position:fixed to escape overflow:hidden on GlassCard
const GradeDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({});
    const triggerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = GRADES.length * 44 + 12;
            if (spaceBelow < menuHeight) {
                setMenuPos({ bottom: window.innerHeight - rect.top + 6, top: 'auto', left: rect.left, width: rect.width });
            } else {
                setMenuPos({ top: rect.bottom + 6, bottom: 'auto', left: rect.left, width: rect.width });
            }
        }
        setIsOpen(prev => !prev);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger button */}
            <div
                ref={triggerRef}
                onClick={handleToggle}
                style={{
                    padding: '9px 10px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: value ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                }}
            >
                <span style={{ fontSize: '0.9rem' }}>{value || 'Grade --'}</span>
                <ChevronDown
                    size={15}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s',
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                    }}
                />
            </div>

            {/* Fixed-position glass menu — escapes overflow:hidden */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: menuPos.top ?? 'auto',
                    bottom: menuPos.bottom ?? 'auto',
                    left: menuPos.left,
                    width: menuPos.width,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'rgba(15, 15, 26, 0.97)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    zIndex: 99999,
                    padding: '6px',
                }}>
                    {GRADES.map((grade) => (
                        <div
                            key={grade}
                            onClick={() => { onChange(grade); setIsOpen(false); }}
                            style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: value === grade ? 'var(--primary, #3B82F6)' : 'rgba(255,255,255,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '2px',
                                background: value === grade ? 'rgba(59,130,246,0.15)' : 'transparent',
                                fontSize: '0.95rem',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = value === grade ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = value === grade ? 'rgba(59,130,246,0.15)' : 'transparent'}
                        >
                            <span>{grade}</span>
                            {value === grade && <Check size={16} color="var(--primary, #3B82F6)" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MandatoryCourses = () => {
    const { courses, cgpaSubjects, addSubjectCGPA, updateSubjectCGPA } = useData();
    const { user } = useAuth();

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
            <style>{`
                .mc-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                }
                .mc-title {
                    font-size: 1.8rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                }
                .mc-progress-card {
                    margin-bottom: 1.25rem;
                    padding: 0.9rem 1.2rem;
                }
                .mc-progress-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }
                .mc-course-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.75rem;
                    padding: 0.9rem 1.1rem;
                    transition: border-color 0.3s ease;
                    overflow: visible;
                    box-sizing: border-box;
                    width: 100%;
                }
                .mc-course-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                }
                .mc-grade-dot {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-weight: bold;
                    font-size: 0.82rem;
                    border-width: 2px;
                    border-style: solid;
                }
                .mc-course-text { min-width: 0; overflow: hidden; }
                .mc-course-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin: 0;
                }
                .mc-course-code {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin: 2px 0 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mc-course-right {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-shrink: 0;
                }
                .mc-dropdown-wrap { width: 120px; }

                @media (max-width: 480px) {
                    .mc-title { font-size: 1.3rem; }
                    .mc-progress-card { padding: 0.75rem 0.9rem; }
                    .mc-progress-label { font-size: 0.78rem; }
                    .mc-course-card { padding: 0.65rem 0.75rem; gap: 0.5rem; }
                    .mc-course-left { gap: 7px; }
                    .mc-grade-dot { width: 28px; height: 28px; font-size: 0.68rem; }
                    .mc-course-name { font-size: 0.82rem; }
                    .mc-course-code { font-size: 0.7rem; }
                    .mc-dropdown-wrap { width: 100px; }
                    .mc-check-icon { display: none; }
                }
                @media (min-width: 481px) and (max-width: 768px) {
                    .mc-title { font-size: 1.55rem; }
                    .mc-course-name { font-size: 0.88rem; }
                    .mc-dropdown-wrap { width: 110px; }
                }
                @media (min-width: 1024px) {
                    .mc-title { font-size: 2rem; }
                    .mc-grade-dot { width: 40px; height: 40px; font-size: 0.88rem; }
                    .mc-course-name { font-size: 1rem; }
                    .mc-dropdown-wrap { width: 130px; }
                }
            `}</style>

            {/* Header */}
            <div className="mc-header">
                <h1 className="mc-title">
                    <BookOpen size={24} color="#60A5FA" /> My Courses
                </h1>
                {courses.length > 0 && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px' }}>
                        {gradeStats.graded}/{gradeStats.total} graded
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {courses.length > 0 && (
                <GlassCard className="mc-progress-card">
                    <div className="mc-progress-label">
                        <span style={{ color: 'var(--text-secondary)' }}>Grade Progress</span>
                        <span style={{ fontWeight: '600' }}>{gradeStats.graded} / {gradeStats.total}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${gradeStats.total ? (gradeStats.graded / gradeStats.total) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, #3B82F6, #34D399)',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </GlassCard>
            )}

            {/* Course list */}
            <div style={{ display: 'grid', gap: '0.65rem' }}>
                {courses.length === 0 ? (
                    <GlassCard>
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ fontWeight: '600', marginBottom: '4px' }}>No courses found for <strong style={{ color: 'white' }}>{user?.branch || 'your branch'}</strong></p>
                            <p style={{ fontSize: '0.85rem' }}>Your admin hasn't added any courses yet.</p>
                        </div>
                    </GlassCard>
                ) : (
                    courses.map((course, index) => {
                        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
                        const currentGrade = existing?.grade || '';
                        const color = gradeColor(currentGrade);

                        return (
                            <GlassCard
                                key={course.id || course.code}
                                className="mc-course-card"
                                style={{
                                    borderLeft: `4px solid ${color}`,
                                    position: 'relative',
                                    zIndex: courses.length - index,
                                    overflow: 'visible',
                                }}
                            >
                                <div className="mc-course-left">
                                    <div
                                        className="mc-grade-dot"
                                        style={{
                                            background: currentGrade ? `${color}22` : 'rgba(255,255,255,0.05)',
                                            borderColor: color,
                                            color: color,
                                        }}
                                    >
                                        {currentGrade || '—'}
                                    </div>
                                    <div className="mc-course-text">
                                        <p className="mc-course-name">{course.name}</p>
                                        <p className="mc-course-code">
                                            {course.code}
                                            {currentGrade && (
                                                <span style={{ marginLeft: '6px', color }}>
                                                    • {GRADE_POINTS[currentGrade]} pts
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mc-course-right">
                                    {currentGrade && <CheckCircle className="mc-check-icon" size={14} color="#34D399" />}
                                    <div className="mc-dropdown-wrap">
                                        <GradeDropdown
                                            value={currentGrade}
                                            onChange={(g) => handleGradeChange(course, g)}
                                        />
                                    </div>
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
                                
