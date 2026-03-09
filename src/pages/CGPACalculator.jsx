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
                grade: 'A'
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
        if (cgpa >= 9) return "Outstanding Performance!";
        if (cgpa >= 8) return "Excellent Work!";
        if (cgpa >= 7) return "Good Performance!";
        if (cgpa >= 6) return "Keep Improving!";
        return "You Can Do Better!";
    };

    const getEmoji = (cgpa) => {
        if (cgpa >= 9) return "Trophy";
        if (cgpa >= 8) return "Star";
        if (cgpa >= 7) return "Thumbs Up";
        if (cgpa >= 6) return "Chart";
        return "Muscle";
    };

    const getGrade = (cgpa) => {
        if (cgpa >= 9) return "S";
        if (cgpa >= 8) return "A";
        if (cgpa >= 7) return "B";
        if (cgpa >= 6) return "C";
        if (cgpa >= 5) return "D";
        return "F";
    };

    // ── SAVE PDF ──────────────────────────────────────────────────────────────
    const handleSavePDF = async () => {
        // Dynamically import jsPDF so it's only loaded when needed
        const { default: jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')
            .catch(() => import('jspdf'));

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        // ── HEADER BACKGROUND ─────────────────────────────────────────────────
        doc.setFillColor(15, 23, 42);          // dark navy
        doc.rect(0, 0, pageW, 55, 'F');

        // Accent bar
        doc.setFillColor(99, 102, 241);        // indigo
        doc.rect(0, 55, pageW, 3, 'F');

        // App name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(148, 163, 184);       // slate-400
        doc.text('AcadeMe', 14, 14);

        // Main title
        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.text('CGPA Report', 14, 30);

        // Subtitle / date
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`Generated on ${dateStr}`, 14, 40);
        doc.text(`Total Subjects: ${cgpaSubjects.length}`, 14, 48);

        // ── CGPA SCORE BADGE (top-right) ──────────────────────────────────────
        const cgpaNum = parseFloat(calculatedCGPA);
        const badgeX = pageW - 50;
        const badgeY = 12;

        // Badge circle background
        doc.setFillColor(99, 102, 241);
        doc.circle(badgeX + 15, badgeY + 18, 18, 'F');

        // CGPA value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text(`${calculatedCGPA}`, badgeX + 15, badgeY + 16, { align: 'center' });

        // "CGPA" label
        doc.setFontSize(8);
        doc.setTextColor(199, 210, 254);      // indigo-200
        doc.text('CGPA', badgeX + 15, badgeY + 24, { align: 'center' });

        // Grade letter
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`Grade: ${getGrade(cgpaNum)}`, badgeX + 15, badgeY + 33, { align: 'center' });

        // ── PERFORMANCE MESSAGE ───────────────────────────────────────────────
        let msgY = 72;
        const msgColor = cgpaNum >= 7 ? [52, 211, 153] : cgpaNum >= 5 ? [251, 191, 36] : [248, 113, 113];
        doc.setFillColor(...msgColor);
        doc.roundedRect(14, msgY - 6, pageW - 28, 14, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(getMessage(cgpaNum), pageW / 2, msgY + 2, { align: 'center' });

        // ── SUBJECT TABLE ─────────────────────────────────────────────────────
        let tableY = 96;

        // Table header
        doc.setFillColor(30, 41, 59);          // slate-800
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

            // Alternate row shading
            if (i % 2 === 0) {
                doc.setFillColor(248, 250, 252);
            } else {
                doc.setFillColor(241, 245, 249);
            }
            doc.rect(14, rowY - 5, pageW - 28, 12, 'F');

            // Row border
            doc.setDrawColor(226, 232, 240);
            doc.rect(14, rowY - 5, pageW - 28, 12, 'S');

            const pts = GRADE_POINTS[subject.grade || 'F'];
            const gradeColor = pts >= 8 ? [22, 163, 74] : pts >= 6 ? [234, 179, 8] : [220, 38, 38];

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text(`${i + 1}`, 18, rowY + 2);

            // Truncate long subject names
            const maxNameWidth = pageW - 28 - 75;
            const nameTxt = doc.splitTextToSize(subject.name || '—', maxNameWidth)[0];
            doc.text(nameTxt, 28, rowY + 2);
            doc.text(subject.code || '—', pageW - 65, rowY + 2);

            // Grade pill
            doc.setFillColor(...gradeColor);
            doc.roundedRect(pageW - 46, rowY - 3, 12, 8, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text(subject.grade || 'F', pageW - 40, rowY + 2, { align: 'center' });

            // Points
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(99, 102, 241);
            doc.text(`${pts}`, pageW - 22, rowY + 2, { align: 'center' });
        });

        // ── SUMMARY STATS BOX ─────────────────────────────────────────────────
        let summaryY = tableY + cgpaSubjects.length * 12 + 14;

        // Make sure it doesn't overflow
        if (summaryY > pageH - 60) {
            doc.addPage();
            summaryY = 20;
        }

        const totalPoints = cgpaSubjects.reduce((s, sub) => s + GRADE_POINTS[sub.grade || 'F'], 0);
        const highest = cgpaSubjects.reduce((best, sub) =>
            GRADE_POINTS[sub.grade] > GRADE_POINTS[best.grade] ? sub : best, cgpaSubjects[0]);
        const lowest = cgpaSubjects.reduce((worst, sub) =>
            GRADE_POINTS[sub.grade] < GRADE_POINTS[worst.grade] ? sub : worst, cgpaSubjects[0]);

        // Stats header
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(14, summaryY, pageW - 28, 8, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('SUMMARY', 18, summaryY + 5.5);

        summaryY += 12;

        // 3-column stat cards
        const cardW = (pageW - 28 - 8) / 3;
        const stats = [
            { label: 'Final CGPA', value: calculatedCGPA, color: [99, 102, 241] },
            { label: 'Total Points', value: `${totalPoints} / ${cgpaSubjects.length * 10}`, color: [52, 211, 153] },
            { label: 'Overall Grade', value: getGrade(cgpaNum), color: [251, 191, 36] },
        ];

        stats.forEach((stat, i) => {
            const cardX = 14 + i * (cardW + 4);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(...stat.color);
            doc.setLineWidth(0.5);
            doc.roundedRect(cardX, summaryY, cardW, 20, 3, 3, 'FD');

            // Colored top accent
            doc.setFillColor(...stat.color);
            doc.roundedRect(cardX, summaryY, cardW, 4, 2, 2, 'F');
            doc.rect(cardX, summaryY + 2, cardW, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...stat.color);
            doc.text(String(stat.value), cardX + cardW / 2, summaryY + 13, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(stat.label, cardX + cardW / 2, summaryY + 18, { align: 'center' });
        });

        summaryY += 28;

        // Best / Lowest subject info
        if (highest && lowest) {
            doc.setFillColor(240, 253, 244);
            doc.setDrawColor(134, 239, 172);
            doc.setLineWidth(0.3);
            doc.roundedRect(14, summaryY, (pageW - 32) / 2, 16, 2, 2, 'FD');

            doc.setFillColor(255, 241, 242);
            doc.setDrawColor(252, 165, 165);
            doc.roundedRect(14 + (pageW - 32) / 2 + 4, summaryY, (pageW - 32) / 2, 16, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(22, 163, 74);
            doc.text('Best Subject', 18, summaryY + 6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            const bestTxt = doc.splitTextToSize(`${highest.name} (${highest.grade})`, (pageW - 32) / 2 - 6)[0];
            doc.text(bestTxt, 18, summaryY + 12);

            const rx = 14 + (pageW - 32) / 2 + 8;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(220, 38, 38);
            doc.text('Needs Attention', rx, summaryY + 6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            const worstTxt = doc.splitTextToSize(`${lowest.name} (${lowest.grade})`, (pageW - 32) / 2 - 6)[0];
            doc.text(worstTxt, rx, summaryY + 12);
        }

        // ── FOOTER ────────────────────────────────────────────────────────────
        doc.setFillColor(15, 23, 42);
        doc.rect(0, pageH - 14, pageW, 14, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Generated by AcadeMe  •  Keep working hard!', pageW / 2, pageH - 5, { align: 'center' });

        doc.save(`CGPA_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`);
    };
    // ── END SAVE PDF ──────────────────────────────────────────────────────────

    const handleShare = async () => {
        const text = `My CGPA: ${calculatedCGPA} | Grade: ${getGrade(parseFloat(calculatedCGPA))} | Subjects: ${cgpaSubjects.length} | ${getMessage(parseFloat(calculatedCGPA))} — via AcadeMe`;
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

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', background: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.3)',
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
                            width: '150px', height: '150px', borderRadius: '50%',
                            background: `radial-gradient(closest-side, #0F0F1A 79%, transparent 80% 100%), conic-gradient(${calculatedCGPA >= 5 ? '#34D399' : '#F87171'} ${showResult ? calculatedCGPA * 10 : 0}%, rgba(255,255,255,0.1) 0)`,
                            margin: '0 auto 1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
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

                        <GlassButton
                            variant="gradient"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                            onClick={calculate}
                        >
                            Calculate CGPA
                        </GlassButton>

                        {showResult && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <GlassButton
                                    onClick={handleSavePDF}
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}
                                >
                                    <Save size={16} /> Save PDF
                                </GlassButton>
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
            <style>{`@media(max-width: 900px) { div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; } }`}</style>
        </DashboardLayout>
    );
};

export default CGPACalculator;
