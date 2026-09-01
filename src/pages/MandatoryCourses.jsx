import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BookOpen, ChevronDown, Check, X, Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

// Generates soft pastel colors for the grade pills
const getGradeStyle = (g) => {
    switch(g) {
        case 'S': return { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' };
        case 'A': return { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' };
        case 'B': return { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE' };
        case 'C': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
        case 'D':
        case 'E': return { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' };
        case 'F': return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
        default:  return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
};

// ── Dropdown Component ────────────────────────────────────────────────────────
const GradeDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({});
    const triggerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest('.grade-portal-menu')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const calcPos = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const left = Math.min(rect.left, window.innerWidth - 100 - 16);
        setMenuPos({
            top: rect.bottom + 8,
            left: Math.max(left, 16),
            width: 110,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('scroll', calcPos, true);
        window.addEventListener('resize', calcPos);
        return () => {
            window.removeEventListener('scroll', calcPos, true);
            window.removeEventListener('resize', calcPos);
        };
    }, [isOpen]);

    const handleToggle = () => {
        calcPos();
        setIsOpen(prev => !prev);
    };

    const style = getGradeStyle(value);

    const menu = isOpen ? ReactDOM.createPortal(
        <div
            className="grade-portal-menu"
            style={{
                position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width,
                maxHeight: '260px', overflowY: 'auto',
                background: '#FFFFFF', borderRadius: '16px',
                border: '1px solid #F3F4F6', boxShadow: '0 12px 30px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
                zIndex: 999999, padding: '8px',
                fontFamily: "'DM Sans', sans-serif"
            }}
        >
            {GRADES.map((grade) => {
                const itemStyle = getGradeStyle(grade);
                return (
                    <div
                        key={grade}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(grade); setIsOpen(false); }}
                        style={{
                            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                            color: value === grade ? itemStyle.text : '#4B5563',
                            background: value === grade ? itemStyle.bg : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: '0.9rem', fontWeight: value === grade ? '700' : '500',
                            transition: 'background 0.2s',
                            marginBottom: '2px'
                        }}
                        onMouseEnter={(e) => { if(value !== grade) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { if(value !== grade) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span>{grade}</span>
                        {value === grade && <Check size={16} color={itemStyle.text} />}
                    </div>
                );
            })}
            
            {/* Remove Grade Option inside Dropdown */}
            <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
            <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); setIsOpen(false); }}
                style={{
                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                    color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.85rem', fontWeight: '600', transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span>Remove</span>
                <X size={14} color="#EF4444" />
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                style={{
                    padding: '6px 14px', borderRadius: '999px',
                    background: value ? style.bg : '#F3F4F6',
                    color: value ? style.text : '#4B5563',
                    border: `1px solid ${value ? style.border : '#E5E7EB'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.9rem', fontWeight: '700', transition: 'all 0.2s',
                    fontFamily: "'DM Sans', sans-serif"
                }}
            >
                {value ? value : 'Add'}
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', opacity: 0.6 }} />
            </button>
            {menu}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const MandatoryCourses = () => {
    // Destructuring with fallbacks for multiple potential delete function names
    const { courses, cgpaSubjects, addSubjectCGPA, updateSubjectCGPA, deleteSubjectCGPA, removeSubjectCGPA } = useData();
    const { user } = useAuth();

    // Modal & Edit State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseCode, setNewCourseCode] = useState('');
    const [newCourseType, setNewCourseType] = useState('University Elective');

    // Combine Admin courses + User's custom added courses
    const allDisplayCourses = useMemo(() => {
        const list = [...(courses || [])];
        (cgpaSubjects || []).forEach(sub => {
            if (!list.find(c => c.code === sub.code || c.name === sub.name)) {
                list.push({ ...sub, isCustom: true, customType: sub.type || 'Custom' });
            }
        });
        return list;
    }, [courses, cgpaSubjects]);

    const gradeStats = useMemo(() => {
        const graded = allDisplayCourses.filter(c => {
            const ex = cgpaSubjects.find(s => s.code === c.code || s.name === c.name);
            return ex && ex.grade;
        });
        return { total: allDisplayCourses.length, graded: graded.length };
    }, [allDisplayCourses, cgpaSubjects]);

    const handleGradeChange = async (course, grade) => {
        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
        if (existing) {
            await updateSubjectCGPA(existing.id, grade); 
        } else if (grade) {
            await addSubjectCGPA({ name: course.name, code: course.code, grade });
        }
    };

    // Advanced, safe delete handling
    const handleDeleteCourse = async (course) => {
        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
        if (!existing) return;

        try {
            if (course.isCustom) {
                // If it's a user's custom course, we delete the document completely.
                if (typeof deleteSubjectCGPA === 'function') {
                    await deleteSubjectCGPA(existing.id);
                } else if (typeof removeSubjectCGPA === 'function') {
                    await removeSubjectCGPA(existing.id);
                } else {
                    // Robust fallback: direct Firebase deletion if Context functions are missing
                    if (existing.id && user?.uid) {
                        await deleteDoc(doc(db, `users/${user.uid}/cgpaSubjects`, existing.id));
                    }
                }
            } else {
                // If it's an admin/mandatory course, we CANNOT delete it. 
                // We just clear the user's grade to effectively "remove" it from calculations.
                if (typeof updateSubjectCGPA === 'function') {
                    await updateSubjectCGPA(existing.id, '');
                }
            }
        } catch (error) {
            console.error("Error removing course:", error);
        }
    };

    const handleAddCustomCourse = async (e) => {
        e.preventDefault();
        if (!newCourseName.trim() || !newCourseCode.trim()) return;
        
        await addSubjectCGPA({ 
            name: newCourseName.trim(), 
            code: newCourseCode.trim().toUpperCase(), 
            grade: '',
            type: newCourseType
        });
        
        setShowAddModal(false);
        setNewCourseName('');
        setNewCourseCode('');
        setNewCourseType('University Elective');
    };

    const CSS = `
        .mc-theme-wrapper {
            position: relative;
            min-height: 100vh;
            width: 100%;
            background-color: #FDFDFD;
            overflow: hidden;
            font-family: 'DM Sans', sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 3rem 1rem;
            box-sizing: border-box;
        }

        .mc-mesh-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 0;
            pointer-events: none;
            background: 
                radial-gradient(circle at 15% 30%, rgba(255, 120, 220, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 85% 70%, rgba(120, 150, 255, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(200, 100, 255, 0.2) 0%, transparent 60%);
            filter: blur(60px);
        }

        .mc-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 540px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border-radius: 28px;
            padding: 2rem;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.05), 
                0 1px 3px rgba(0, 0, 0, 0.03),
                inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        }

        .mc-header {
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .mc-title-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .mc-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #111827;
            margin: 0;
        }

        .mc-action-btn {
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            color: #4B5563;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .mc-action-btn:hover {
            background: #E5E7EB;
            color: #111827;
            transform: scale(1.05);
        }
        .mc-action-btn.active {
            background: #3B82F6;
            color: #FFFFFF;
            border-color: #3B82F6;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
        }

        /* Progress Bar */
        .mc-progress-wrap { margin-bottom: 2rem; }
        .mc-progress-track {
            height: 6px; background: #F3F4F6;
            border-radius: 999px; overflow: hidden; margin-top: 8px;
        }
        .mc-progress-fill {
            height: 100%; background: linear-gradient(90deg, #A855F7, #6366F1);
            border-radius: 999px; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* List Items */
        .mc-list { display: flex; flex-direction: column; gap: 4px; }
        .mc-row {
            display: flex; align-items: center; padding: 12px;
            border-radius: 16px; transition: background 0.2s ease; gap: 14px;
        }
        .mc-row:hover { background: #F9FAFB; }

        .mc-number-wrap {
            width: 38px; height: 38px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.9rem; font-weight: 700; color: #9CA3AF;
            background: rgba(243, 244, 246, 0.8); border: 1px solid #E5E7EB; flex-shrink: 0;
        }

        .mc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        
        .mc-course-name {
            font-size: 0.95rem; font-weight: 600; color: #1F2937; margin: 0 0 2px 0;
            display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
        }

        .mc-type-pill {
            font-size: 0.65rem; color: #4F46E5; font-weight: 600; background: #EEF2FF;
            border: 1px solid #C7D2FE; padding: 2px 6px; border-radius: 6px; white-space: nowrap;
        }

        .mc-course-code {
            font-size: 0.8rem; color: #6B7280; margin: 0;
            display: flex; align-items: center; gap: 6px;
        }

        /* Delete Button */
        .mc-delete-btn {
            padding: 6px 14px; border-radius: 999px;
            background: #FEF2F2; color: #EF4444; border: 1px solid #FECACA;
            cursor: pointer; display: flex; align-items: center; gap: 6px;
            font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
            font-family: inherit;
        }
        .mc-delete-btn:hover { background: #EF4444; color: white; border-color: #EF4444; }
        
        /* Modal Styles */
        .mc-modal-overlay {
            position: fixed; inset: 0; background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 100;
            display: flex; justify-content: center; align-items: center; padding: 1rem;
        }
        .mc-modal-card {
            background: white; border-radius: 24px; padding: 2rem; width: 100%; max-width: 420px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
            animation: slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mc-input {
            width: 100%; padding: 12px 16px; background: #F9FAFB; border: 1px solid #E5E7EB;
            border-radius: 12px; font-family: inherit; font-size: 0.9rem;
            color: #1F2937; margin-top: 6px; outline: none; transition: border-color 0.2s; box-sizing: border-box;
        }
        .mc-input:focus { border-color: #3B82F6; background: #FFFFFF; }
        
        .mc-type-selector { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .mc-type-btn {
            padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600;
            cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .mc-type-active { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .mc-type-inactive { background: #F9FAFB; color: #4B5563; border: 1px solid #E5E7EB; }
        .mc-type-inactive:hover { background: #F3F4F6; }
        
        .mc-btn-primary {
            background: #3B82F6; color: white; border: none;
            padding: 12px 24px; border-radius: 12px; font-weight: 600; font-family: inherit;
            cursor: pointer; transition: background 0.2s; flex: 1;
        }
        .mc-btn-primary:hover { background: #2563EB; }
        
        .mc-btn-cancel {
            background: transparent; color: #6B7280; border: none;
            padding: 12px 24px; border-radius: 12px; font-weight: 600; font-family: inherit;
            cursor: pointer; transition: background 0.2s;
        }
        .mc-btn-cancel:hover { background: #F3F4F6; color: #1F2937; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 480px) {
            .mc-theme-wrapper { padding: 1.5rem 1rem; }
            .mc-card { padding: 1.5rem 1rem; border-radius: 24px; }
            .mc-row { padding: 10px; gap: 10px; }
            .mc-number-wrap { width: 34px; height: 34px; font-size: 0.85rem; }
            .mc-course-name { font-size: 0.9rem; }
            .mc-modal-card { padding: 1.5rem; }
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            
            <div className="mc-theme-wrapper">
                {/* Colorful Blur Background */}
                <div className="mc-mesh-bg" />

                {/* Main White Modal Card */}
                <div className="mc-card" style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
                    <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    
                    <div className="mc-header">
                        <div className="mc-title-wrap">
                            <h1 className="mc-title">My Courses</h1>
                            <button className="mc-action-btn" onClick={() => setShowAddModal(true)} title="Add a custom course">
                                <Plus size={16} strokeWidth={2.5} />
                            </button>
                            <button 
                                className={`mc-action-btn ${isEditMode ? 'active' : ''}`} 
                                onClick={() => setIsEditMode(!isEditMode)} 
                                title="Edit courses"
                            >
                                {isEditMode ? <Check size={16} strokeWidth={2.5} /> : <Pencil size={15} strokeWidth={2.5} />}
                            </button>
                        </div>
                        {allDisplayCourses.length > 0 && (
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>
                                {user?.branch || 'Student'}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar Section */}
                    {allDisplayCourses.length > 0 && (
                        <div className="mc-progress-wrap">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6B7280', fontWeight: '500' }}>
                                <span>Grade Progress</span>
                                <span>{gradeStats.graded} of {gradeStats.total} Graded</span>
                            </div>
                            <div className="mc-progress-track">
                                <div 
                                    className="mc-progress-fill" 
                                    style={{ width: `${gradeStats.total ? (gradeStats.graded / gradeStats.total) * 100 : 0}%` }} 
                                />
                            </div>
                        </div>
                    )}

                    <div className="mc-list">
                        {allDisplayCourses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6B7280' }}>
                                <BookOpen size={40} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                                <p style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>No courses found</p>
                                <p style={{ fontSize: '0.85rem' }}>Click the + button to add your courses.</p>
                            </div>
                        ) : (
                            allDisplayCourses.map((course, index) => {
                                const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
                                const currentGrade = existing?.grade || '';
                                
                                // Determine if we should show the Remove button in edit mode
                                // We can completely remove Custom Courses, or we can clear grades from Admin Courses.
                                const canRemove = course.isCustom || currentGrade;

                                return (
                                    <div key={course.id || course.code || index} className="mc-row">
                                        
                                        {/* Number Badge */}
                                        <div className="mc-number-wrap">
                                            {index + 1}
                                        </div>

                                        {/* Info */}
                                        <div className="mc-info">
                                            <p className="mc-course-name">
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.name}</span>
                                                {course.isCustom && <span className="mc-type-pill">{course.customType}</span>}
                                            </p>
                                            <p className="mc-course-code">
                                                {course.code}
                                                {currentGrade && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9CA3AF' }}>
                                                        <span style={{ fontSize: '10px' }}>•</span> 
                                                        {GRADE_POINTS[currentGrade]} pts
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Dynamic Action: Edit vs Normal */}
                                        <div style={{ flexShrink: 0 }}>
                                            {isEditMode ? (
                                                canRemove ? (
                                                    <button 
                                                        className="mc-delete-btn"
                                                        onClick={() => handleDeleteCourse(course)}
                                                    >
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '500', paddingRight: '6px' }}>Mandatory</span>
                                                )
                                            ) : (
                                                <GradeDropdown
                                                    value={currentGrade}
                                                    onChange={(g) => handleGradeChange(course, g)}
                                                />
                                            )}
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Add Custom Course Modal Overlay */}
                {showAddModal && (
                    <div className="mc-modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="mc-modal-card" onClick={e => e.stopPropagation()}>
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: '#111827' }}>Add Course</h2>
                            
                            <form onSubmit={handleAddCustomCourse}>
                                
                                {/* Course Type Selection */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Course Type</label>
                                    <div className="mc-type-selector">
                                        {['University Elective', 'Program Elective', 'Other'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                className={`mc-type-btn ${newCourseType === type ? 'mc-type-active' : 'mc-type-inactive'}`}
                                                onClick={() => setNewCourseType(type)}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Course Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="mc-input"
                                        placeholder="e.g. Data Structures"
                                        value={newCourseName}
                                        onChange={e => setNewCourseName(e.target.value)}
                                    />
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Course Code</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="mc-input"
                                        placeholder="e.g. CS201"
                                        value={newCourseCode}
                                        onChange={e => setNewCourseCode(e.target.value)}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" className="mc-btn-cancel" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="mc-btn-primary">
                                        Add Course
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MandatoryCourses;