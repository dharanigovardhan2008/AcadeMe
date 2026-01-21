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
    const { user } = useAuth(); // Import useAuth hook logic properly (assuming imports needed)

    // ... existing logic ...

    const handleGradeChange = (course, grade) => {
        // Check if already exists in cgpaSubjects
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
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>My Courses</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your grades for mandatory subjects</p>
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
                            <GlassCard key={course.id || course.code} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                borderLeft: currentGrade ? '4px solid #34D399' : '4px solid transparent',
                                position: 'relative',
                                zIndex: courses.length - index // Stacking context fix for dropdowns
                            }}>
                                <div>
                                    <h3 style={{ fontWeight: '600' }}>{course.name}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{course.code}</p>
                                </div>
                                <div style={{ width: '150px' }}>
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
