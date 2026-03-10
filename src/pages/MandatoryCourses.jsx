import React from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassDropdown from '../components/GlassDropdown';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

const MandatoryCourses = () => {
    const { courses, cgpaSubjects, addSubjectCGPA, updateSubjectCGPA } = useData();
    const { user } = useAuth();

    const handleGradeChange = (course, grade) => {
        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);

        if (existing) {
            updateSubjectCGPA(existing.id, grade);
        } else {
            addSubjectCGPA({
                name: course.name,
                code: course.code,
                grade: grade
            });
        }
    };

    return (
        <DashboardLayout>
            {/* Responsive styles injected via a <style> tag */}
            <style>{`
                .mc-header {
                    margin-bottom: 2rem;
                }
                .mc-header h1 {
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 0 0 4px 0;
                }
                .mc-header p {
                    color: var(--text-secondary);
                    margin: 0;
                }

                .mc-course-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: nowrap;
                }

                .mc-course-info {
                    flex: 1;
                    min-width: 0; /* allows text truncation */
                }

                .mc-course-info h3 {
                    font-weight: 600;
                    margin: 0 0 4px 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .mc-course-info p {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .mc-grade-wrapper {
                    width: 150px;
                    flex-shrink: 0;
                }

                /* Tablet and below */
                @media (max-width: 768px) {
                    .mc-header h1 {
                        font-size: 1.5rem;
                    }

                    .mc-course-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .mc-grade-wrapper {
                        width: 100%;
                    }
                }

                /* Small phones */
                @media (max-width: 480px) {
                    .mc-header h1 {
                        font-size: 1.25rem;
                    }

                    .mc-course-info h3 {
                        white-space: normal;
                        overflow: visible;
                        text-overflow: unset;
                    }
                }
            `}</style>

            <div className="mc-header">
                <h1>My Courses</h1>
                <p>Manage your grades for mandatory subjects</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {courses.length === 0 ? (
                    <GlassCard>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No courses found for your branch ({user?.branch || 'Unknown'}).
                            <br />
                            Please confirm if you have seeded the database (Check Admin Login &rarr; Seed DB).
                        </p>
                    </GlassCard>
                ) : (
                    courses.map((course, index) => {
                        const existing = cgpaSubjects.find(s => s.code === course.code || s.name === course.name);
                        const currentGrade = existing ? existing.grade : '';

                        return (
                            <GlassCard
                                key={course.id || course.code}
                                style={{
                                    borderLeft: currentGrade ? '4px solid #34D399' : '4px solid transparent',
                                    position: 'relative',
                                    zIndex: courses.length - index,
                                }}
                            >
                                <div className="mc-course-card">
                                    <div className="mc-course-info">
                                        <h3>{course.name}</h3>
                                        <p>{course.code}</p>
                                    </div>
                                    <div className="mc-grade-wrapper">
                                        <GlassDropdown
                                            options={GRADES}
                                            value={currentGrade}
                                            onChange={(g) => handleGradeChange(course, g)}
                                            placeholder="Grade --"
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
