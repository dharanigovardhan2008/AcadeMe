import React, { useState, useCallback, useMemo } from 'react';
import { Trash2, Calculator, Save, Share2, Plus, Check } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassDropdown from '../components/GlassDropdown';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

const CGPACalculator = () => {
    const { cgpaSubjects, courses, addSubjectCGPA, removeSubjectCGPA, updateSubjectCGPA } = useData();
    const { user } = useAuth();
    const [selectedElectiveId, setSelectedElectiveId] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [calculatedCGPA, setCalculatedCGPA] = useState(0);
    const [copied, setCopied] = useState(false); // ✅ for Save button feedback

    const handleAddElective = useCallback(() => {
        if (!selectedElectiveId) return;
        const course = courses.find(c => c.id === selectedElectiveId);
        if (course) {
            addSubjectCGPA({ name: course.name, code: course.code, grade: 'A' });
            setSelectedElectiveId('');
            setShowResult(false);
        }
    }, [selectedElectiveId, courses, addSubjectCGPA]);

    const calculate = useCallback(() => {
        if (!cgpaSubjects.length) return;
        // F = not yet graded → excluded from both total and points
        const gradedSubjects = cgpaSubjects.filter(s => s.grade && s.grade !== 'F');
        if (!gradedSubjects.length) {
            alert('Please assign at least one grade (S/A/B/C/D/E) to calculate CGPA.');
            return;
        }
        const total = gradedSubjects.reduce((sum, s) => sum + GRADE_POINTS[s.grade], 0);
        const result = (total / gradedSubjects.length).toFixed(2);
        setCalculatedCGPA(result);
        setShowResult(true);
    }, [cgpaSubjects]);

    const getMessage = (cgpa) => {
        if (cgpa >= 9) return "🏆 Outstanding Performance!";
        if (cgpa >= 8) return "⭐ Excellent Work!";
        if (cgpa >= 7) return "👍 Good Performance!";
        if (cgpa >= 6) return "📈 Keep Improving!";
        return "💪 You Can Do Better!";
    };

    // ✅ Save — downloads a styled PDF report
    const handleSave = useCallback(async () => {
        const gradedSubjects = cgpaSubjects.filter(s => s.grade && s.grade !== 'F');
        if (!gradedSubjects.length) return;

        // Dynamically import jsPDF (loaded via CDN script tag added below)
        const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const W = 210, margin = 20;
        let y = 0;

        // ── Header gradient bar ──
        doc.setFillColor(15, 15, 26);
        doc.rect(0, 0, W, 50, 'F');

        // AcadeMe branding
        doc.setTextColor(96, 165, 250);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('AcadeMe', margin, 14);

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('CGPA Report', margin, 26);

        // Date
        doc.setFontSize(9);
        doc.setTextColor(160, 160, 180);
        const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`Generated: ${date}`, margin, 34);

        // CGPA big badge (top right)
        const cgpaNum = parseFloat(calculatedCGPA);
        const badgeColor = cgpaNum >= 9 ? [52, 211, 153] : cgpaNum >= 7 ? [96, 165, 250] : cgpaNum >= 6 ? [251, 191, 36] : [248, 113, 113];
        doc.setFillColor(...badgeColor);
        doc.roundedRect(W - margin - 38, 8, 38, 34, 4, 4, 'F');
        doc.setTextColor(15, 15, 26);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(String(calculatedCGPA), W - margin - 19, 24, { align: 'center' });
        doc.setFontSize(8);
        doc.text('CGPA / 10', W - margin - 19, 33, { align: 'center' });

        y = 58;

        // ── Student Info box ──
        doc.setFillColor(30, 30, 50);
        doc.roundedRect(margin, y, W - margin * 2, 24, 3, 3, 'F');
        doc.setTextColor(160, 160, 180);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Student Name', margin + 6, y + 7);
        doc.text('Register No.', W / 2 + 4, y + 7);
        doc.setTextColor(230, 230, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(user?.name || user?.displayName || 'N/A', margin + 6, y + 16);
        doc.text(user?.regNo || user?.registrationNumber || 'N/A', W / 2 + 4, y + 16);

        y = 92;

        // ── Performance badge ──
        const msg = cgpaNum >= 9 ? 'Outstanding Performance' : cgpaNum >= 8 ? 'Excellent Work' : cgpaNum >= 7 ? 'Good Performance' : cgpaNum >= 6 ? 'Keep Improving' : 'You Can Do Better';
        doc.setFillColor(...badgeColor.map(c => Math.min(255, c + 160)));
        doc.setTextColor(...badgeColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const msgW = doc.getTextWidth(msg) + 10;
        doc.roundedRect(margin, y, msgW, 9, 2, 2, 'F');
        doc.text(msg, margin + 5, y + 6.5);

        y = 108;

        // ── Table header ──
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, y, W - margin * 2, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('S.No', margin + 4, y + 6.2);
        doc.text('Course Name', margin + 20, y + 6.2);
        doc.text('Grade', W - margin - 16, y + 6.2);

        y += 9;

        // ── Table rows ──
        gradedSubjects.forEach((subject, i) => {
            const rowBg = i % 2 === 0 ? [22, 22, 38] : [28, 28, 48];
            doc.setFillColor(...rowBg);
            doc.rect(margin, y, W - margin * 2, 8, 'F');

            // grade color dot
            const gradeColors = { S: [52,211,153], A: [96,165,250], B: [129,140,248], C: [251,191,36], D: [251,146,60], E: [248,113,113] };
            const gc = gradeColors[subject.grade] || [200, 200, 200];
            doc.setFillColor(...gc);
            doc.circle(W - margin - 12, y + 4, 2.5, 'F');

            doc.setTextColor(200, 200, 220);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.text(String(i + 1), margin + 6, y + 5.5);

            // truncate long names
            const name = subject.name.length > 45 ? subject.name.substring(0, 42) + '...' : subject.name;
            doc.text(name, margin + 20, y + 5.5);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...gc);
            doc.text(subject.grade, W - margin - 10, y + 5.5);

            y += 8;
        });

        // ── Summary row ──
        y += 2;
        doc.setFillColor(30, 30, 55);
        doc.rect(margin, y, W - margin * 2, 10, 'F');
        doc.setTextColor(160, 160, 200);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Subjects Graded: ${gradedSubjects.length}`, margin + 6, y + 7);
        doc.setTextColor(...badgeColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`CGPA: ${calculatedCGPA} / 10`, W - margin - 6, y + 7, { align: 'right' });

        // ── Footer ──
        y = 285;
        doc.setFillColor(15, 15, 26);
        doc.rect(0, y, W, 15, 'F');
        doc.setTextColor(80, 80, 110);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by AcadeMe  •  acade-me.vercel.app', W / 2, y + 8, { align: 'center' });

        doc.save(`CGPA_Report_${user?.name || 'Student'}.pdf`);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [calculatedCGPA, cgpaSubjects, user]);

    // ✅ Bug #26 Fix — Share button: Web Share API on mobile, clipboard fallback on desktop
    const handleShare = useCallback(async () => {
        const text = `🎓 My CGPA: ${calculatedCGPA}/10\nCalculated on AcadeMe`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'My CGPA', text });
            } catch (e) {
                if (e.name !== 'AbortError') console.error(e);
            }
        } else {
            await navigator.clipboard.writeText(text);
            alert('Result copied to clipboard!');
        }
    }, [calculatedCGPA]);

    // ✅ useMemo — only recalculates when courses or cgpaSubjects change
    const availableElectives = useMemo(() =>
        courses.filter(c => !cgpaSubjects.some(s => s.code === c.code || s.name === c.name)),
        [courses, cgpaSubjects]
    );

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59,130,246,0.2)', color: '#60A5FA' }}>
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>CGPA Calculator</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Calculate your academic performance</p>
                    </div>
                </div>
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
                                    <span style={{ fontWeight: '500', flex: 1, marginRight: '1rem' }}>{subject.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '100px' }}>
                                            {/* ✅ Grade change is optimistic in DataContext — instant UI update */}
                                            <GlassDropdown
                                                options={GRADES}
                                                value={subject.grade}
                                                onChange={(g) => updateSubjectCGPA(subject.id, g)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeSubjectCGPA(subject.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: 0.7, padding: '4px' }}
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
                            padding: '1rem', background: 'rgba(59,130,246,0.05)',
                            borderRadius: '8px', border: '1px dashed rgba(59,130,246,0.3)',
                            marginTop: '1.5rem'
                        }}>
                            <div style={{ flex: 1 }}>
                                <GlassDropdown
                                    options={availableElectives.map(c => c.name)}
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
                                    width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: selectedElectiveId ? 'pointer' : 'not-allowed',
                                    opacity: !selectedElectiveId ? 0.5 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Result Card */}
                <div>
                    <GlassCard style={{ textAlign: 'center', position: 'sticky', top: '100px' }}>
                        <div style={{
                            width: '150px', height: '150px', borderRadius: '50%',
                            background: `radial-gradient(closest-side, #0F0F1A 79%, transparent 80% 100%), conic-gradient(${calculatedCGPA >= 5 ? '#34D399' : '#F87171'} ${showResult ? calculatedCGPA * 10 : 0}%, rgba(255,255,255,0.1) 0)`,
                            margin: '0 auto 1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.5s ease'
                        }}>
                            <div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{showResult ? calculatedCGPA : '?'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CGPA</div>
                            </div>
                        </div>

                        {showResult && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {getMessage(calculatedCGPA)}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Based on {cgpaSubjects.filter(s => s.grade && s.grade !== 'F').length} subjects</p>
                            </div>
                        )}

                        <GlassButton
                            variant="gradient"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                            onClick={calculate}
                            disabled={cgpaSubjects.length === 0}
                        >
                            <Calculator size={16} /> Calculate CGPA
                        </GlassButton>

                        {showResult && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {/* ✅ Save — downloads PDF report */}
                                <GlassButton
                                    onClick={handleSave}
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}
                                >
                                    {copied ? <><Check size={16} /> Downloaded!</> : <><Save size={16} /> Save PDF</>}
                                </GlassButton>
                                {/* ✅ Share — Web Share API / clipboard */}
                                <GlassButton
                                    onClick={handleShare}
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}
                                >
                                    <Share2 size={16} /> Share
                                </GlassButton>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
            <style>{`@media(max-width: 900px) { div[style*="grid-template-columns: 1fr 350px"] { grid-template-columns: 1fr !important; } }`}</style>
        </DashboardLayout>
    );
};

export default CGPACalculator;
