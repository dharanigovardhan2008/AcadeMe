import React, { useState } from 'react';
import { Trash2, Calculator, Save, Share2, Plus } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassDropdown from '../components/GlassDropdown';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

const CGPACalculator = () => {
    const { cgpaSubjects, courses, addSubjectCGPA, removeSubjectCGPA, updateSubjectCGPA } = useData();
    const [selectedElectiveId, setSelectedElectiveId] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [calculatedCGPA, setCalculatedCGPA] = useState(0);

    const handleAddElective = () => {
        if (!selectedElectiveId) return;
        const course = courses.find(c => c.id === selectedElectiveId);
        if (course) {
            addSubjectCGPA({
                name: course.name,
                code: course.code,
                grade: 'A' // Default
            });
            setSelectedElectiveId('');
            setShowResult(false);
        }
    };

    const calculate = () => {
        if (!cgpaSubjects.length) return;
        const total = cgpaSubjects.reduce((sum, s) => sum + GRADE_POINTS[s.grade || 'F'], 0);
        const result = (total / cgpaSubjects.length).toFixed(2);
        setCalculatedCGPA(result);
        setShowResult(true);
    };

    const getMessage = (cgpa) => {
        if (cgpa >= 9) return "🏆 Outstanding Performance!";
        if (cgpa >= 8) return "⭐ Excellent Work!";
        if (cgpa >= 7) return "👍 Good Performance!";
        if (cgpa >= 6) return "📈 Keep Improving!";
        return "💪 You Can Do Better!";
    };

    // Filter out courses already in cgpaSubjects to show in Elective Dropdown
    const availableElectives = courses.filter(c =>
        !cgpaSubjects.some(s => s.code === c.code || s.name === c.name)
    );

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>CGPA Calculator</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Calculate your academic performance</p>
                    </div>
                </div>

                {/* Grading Reference */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📋 Grade Points Reference</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {Object.entries(GRADE_POINTS).map(([g, p]) => (
                            <Badge key={g} variant="neutral">{g} = {p}</Badge>
                        ))}
                    </div>
                </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div>
                    <GlassCard>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Your Subjects</h3>
                            {/* Optional link to Mandatory Courses */}
                        </div>


                        {cgpaSubjects.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No subjects added yet. Go to 'My Courses' to add mandatory subjects or add an elective below.
                            </p>
                        ) : (
                            cgpaSubjects.map(subject => (
                                <div key={subject.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <span style={{ fontWeight: '500' }}>{subject.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '100px' }}>
                                            <GlassDropdown
                                                options={GRADES}
                                                value={subject.grade}
                                                onChange={(g) => updateSubjectCGPA(subject.id, g)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeSubjectCGPA(subject.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: 0.7 }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Add Elective Row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', background: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.3)',
                            marginTop: '1.5rem'
                        }}>
                            <div style={{ flex: 1 }}>
                                <GlassDropdown
                                    options={availableElectives.map(c => c.name)} // Name array for dropdown
                                    // We need to map back name to ID or just store ID if we assume names unique. 
                                    // GlassDropdown assumes strings options.
                                    // Better to filter options 
                                    value={selectedElectiveId ? courses.find(c => c.id === selectedElectiveId)?.name : ''}
                                    onChange={(name) => {
                                        const c = courses.find(x => x.name === name);
                                        if (c) setSelectedElectiveId(c.id);
                                    }}
                                    placeholder="Add Elective from Course List..."
                                />
                            </div>
                            <button
                                onClick={handleAddElective}
                                disabled={!selectedElectiveId}
                                style={{
                                    background: 'var(--primary)', border: 'none', color: 'white',
                                    width: '40px', height: '40px', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    opacity: !selectedElectiveId ? 0.5 : 1
                                }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </GlassCard>
                </div>

                <div>
                    <GlassCard style={{ textAlign: 'center', position: 'sticky', top: '100px' }}>
                        <div style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            background: `radial-gradient(closest-side, #0F0F1A 79%, transparent 80% 100%), conic-gradient(${calculatedCGPA >= 5 ? '#34D399' : '#F87171'} ${showResult ? calculatedCGPA * 10 : 0}%, rgba(255,255,255,0.1) 0)`,
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{showResult ? calculatedCGPA : '?'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CGPA</div>
                            </div>
                        </div>

                        {showResult && (
                            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
                                <h3 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {getMessage(calculatedCGPA)}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Based on {cgpaSubjects.length} subjects</p>
                            </div>
                        )}

                        <GlassButton variant="gradient" style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }} onClick={calculate}>
                            Calculate CGPA
                        </GlassButton>

                        {showResult && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <GlassButton style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}><Save size={16} /> Save</GlassButton>
                                <GlassButton style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}><Share2 size={16} /> Share</GlassButton>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
            <style>{`@media(max-width: 900px) { div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; } }`}</style>
        </DashboardLayout>
    );
};

export default CGPACalculator;
