import React, { useState } from 'react';
import { Trash2, Calculator, Save, Share2, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
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
            addSubjectCGPA({ name: course.name, code: course.code, grade: 'A' });
            setSelectedElectiveId('');
            setShowResult(false);
        }
    };

    const calculate = () => {
        if (!cgpaSubjects.length) return;
        const total = cgpaSubjects.reduce((sum, s) => sum + GRADE_POINTS[s.grade || 'F'], 0);
        setCalculatedCGPA((total / cgpaSubjects.length).toFixed(2));
        setShowResult(true);
    };

    const getMessage = (cgpa) => {
        if (cgpa >= 9) return "🏆 Outstanding Performance!";
        if (cgpa >= 8) return "⭐ Excellent Work!";
        if (cgpa >= 7) return "👍 Good Performance!";
        if (cgpa >= 6) return "📈 Keep Improving!";
        return "💪 You Can Do Better!";
    };

    const getGrade = (cgpa) => {
        if (cgpa >= 9) return "S";
        if (cgpa >= 8) return "A";
        if (cgpa >= 7) return "B";
        if (cgpa >= 6) return "C";
        if (cgpa >= 5) return "D";
        return "F";
    };

    const handleSavePDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const cgpaNum = parseFloat(calculatedCGPA);
        const now = new Date();

        // Header background
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 55, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 55, pageW, 3, 'F');

        // App name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(148, 163, 184);
        doc.text('AcadeMe', 14, 14);

        // Title
        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.text('CGPA Report', 14, 30);

        // Date & subject count
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`Generated on ${dateStr}`, 14, 40);
        doc.text(`Total Subjects: ${cgpaSubjects.length}`, 14, 48);

        // CGPA badge (top right)
        const bx = pageW - 50, by = 12;
        doc.setFillColor(99, 102, 241);
        doc.circle(bx + 15, by + 18, 18, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text(`${calculatedCGPA}`, bx + 15, by + 16, { align: 'center' });
        doc.setFontSize(8);
        doc.setTextColor(199, 210, 254);
        doc.text('CGPA', bx + 15, by + 24, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`Grade: ${getGrade(cgpaNum)}`, bx + 15, by + 33, { align: 'center' });

        // Performance banner
        const msgY = 72;
        const mc = cgpaNum >= 7 ? [52, 211, 153] : cgpaNum >= 5 ? [251, 191, 36] : [248, 113, 113];
        doc.setFillColor(...mc);
        doc.roundedRect(14, msgY - 6, pageW - 28, 14, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(getMessage(cgpaNum).replace(/[^\x00-\x7F]/g, '').trim(), pageW / 2, msgY + 2, { align: 'center' });

        // Table header
        let tableY = 96;
        doc.setFillColor(30, 41, 59);
        doc.rect(14, tableY - 6, pageW - 28, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('#', 18, tableY);
        doc.text('Subject Name', 28, tableY);
        doc.text('Code', pageW - 65, tableY);
        doc.text('Grade', pageW - 42, tableY);
        doc.text('Points', pageW - 24, tableY);
        tableY += 6;

        // Table rows
        cgpaSubjects.forEach((subject, i) => {
            const rowY = tableY + i * 12;
            doc.setFillColor(i % 2 === 0 ? 248 : 241, i % 2 === 0 ? 250 : 245, i % 2 === 0 ? 252 : 249);
            doc.rect(14, rowY - 5, pageW - 28, 12, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.rect(14, rowY - 5, pageW - 28, 12, 'S');

            const pts = GRADE_POINTS[subject.grade || 'F'];
            const gc = pts >= 8 ? [22, 163, 74] : pts >= 6 ? [234, 179, 8] : [220, 38, 38];

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text(`${i + 1}`, 18, rowY + 2);
            doc.text(doc.splitTextToSize(subject.name || '—', pageW - 28 - 75)[0], 28, rowY + 2);
            doc.text(subject.code || '—', pageW - 65, rowY + 2);

            // Grade pill
            doc.setFillColor(...gc);
            doc.roundedRect(pageW - 46, rowY - 3, 12, 8, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text(subject.grade || 'F', pageW - 40, rowY + 2, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(99, 102, 241);
            doc.text(`${pts}`, pageW - 22, rowY + 2, { align: 'center' });
        });

        // Summary stats
        let sy = tableY + cgpaSubjects.length * 12 + 14;
        if (sy > pageH - 60) { doc.addPage(); sy = 20; }

        const totalPoints = cgpaSubjects.reduce((s, sub) => s + GRADE_POINTS[sub.grade || 'F'], 0);

        doc.setFillColor(30, 41, 59);
        doc.roundedRect(14, sy, pageW - 28, 8, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('SUMMARY', 18, sy + 5.5);
        sy += 12;

        const cardW = (pageW - 28 - 8) / 3;
        [
            { label: 'Final CGPA', value: calculatedCGPA, color: [99, 102, 241] },
            { label: 'Total Points', value: `${totalPoints}/${cgpaSubjects.length * 10}`, color: [52, 211, 153] },
            { label: 'Overall Grade', value: getGrade(cgpaNum), color: [251, 191, 36] },
        ].forEach((stat, i) => {
            const cx = 14 + i * (cardW + 4);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(...stat.color);
            doc.setLineWidth(0.5);
            doc.roundedRect(cx, sy, cardW, 20, 3, 3, 'FD');
            doc.setFillColor(...stat.color);
            doc.roundedRect(cx, sy, cardW, 4, 2, 2, 'F');
            doc.rect(cx, sy + 2, cardW, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...stat.color);
            doc.text(String(stat.value), cx + cardW / 2, sy + 13, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(stat.label, cx + cardW / 2, sy + 18, { align: 'center' });
        });

        // Footer
        doc.setFillColor(15, 23, 42);
        doc.rect(0, pageH - 14, pageW, 14, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Generated by AcadeMe  |  Keep working hard!', pageW / 2, pageH - 5, { align: 'center' });

        doc.save(`CGPA_Report_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.pdf`);
    };

    const handleShare = async () => {
        const text = `My CGPA: ${calculatedCGPA} | Grade: ${getGrade(parseFloat(calculatedCGPA))} | ${getMessage(parseFloat(calculatedCGPA))} — via AcadeMe`;
        if (navigator.share) {
            await navigator.share({ title: 'My CGPA Result', text });
        } else {
            await navigator.clipboard.writeText(text);
            alert('Result copied to clipboard!');
        }
    };

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
                                    <span style={{ fontWeight: '500' }}>{subject.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '100px' }}>
                                            <GlassDropdown options={GRADES} value={subject.grade} onChange={(g) => updateSubjectCGPA(subject.id, g)} />
                                        </div>
                                        <button onClick={() => removeSubjectCGPA(subject.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: 0.7 }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                            background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px',
                            border: '1px dashed rgba(59, 130, 246, 0.3)', marginTop: '1.5rem'
                        }}>
                            <div style={{ flex: 1 }}>
                                <GlassDropdown
                                    options={availableElectives.map(c => c.name)}
                                    value={selectedElectiveId ? courses.find(c => c.id === selectedElectiveId)?.name : ''}
                                    onChange={(name) => { const c = courses.find(x => x.name === name); if (c) setSelectedElectiveId(c.id); }}
                                    placeholder="Add Elective from Course List..."
                                />
                            </div>
                            <button onClick={handleAddElective} disabled={!selectedElectiveId}
                                style={{ background: 'var(--primary)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !selectedElectiveId ? 0.5 : 1 }}>
                                <Plus size={20} />
                            </button>
                        </div>
                    </GlassCard>
                </div>

                <div>
                    <GlassCard style={{ textAlign: 'center', position: 'sticky', top: '100px' }}>
                        <div style={{
                            width: '150px', height: '150px', borderRadius: '50%',
                            background: `radial-gradient(closest-side, #0F0F1A 79%, transparent 80% 100%), conic-gradient(${calculatedCGPA >= 5 ? '#34D399' : '#F87171'} ${showResult ? calculatedCGPA * 10 : 0}%, rgba(255,255,255,0.1) 0)`,
                            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                                <GlassButton onClick={handleSavePDF} style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}>
                                    <Save size={16} /> Save PDF
                                </GlassButton>
                                <GlassButton onClick={handleShare} style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}>
                                    <Share2 size={16} /> Share
                                </GlassButton>
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
