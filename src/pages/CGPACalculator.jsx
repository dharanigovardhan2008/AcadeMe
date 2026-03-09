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

/* ─── helpers ─────────────────────────────────────────────── */
const getGradeLetter = (cgpa) => {
    if (cgpa >= 9) return 'S';
    if (cgpa >= 8) return 'A';
    if (cgpa >= 7) return 'B';
    if (cgpa >= 6) return 'C';
    if (cgpa >= 5) return 'D';
    return 'F';
};

const getPerformanceLabel = (cgpa) => {
    if (cgpa >= 9) return 'Outstanding Performance';
    if (cgpa >= 8) return 'Excellent Work';
    if (cgpa >= 7) return 'Good Performance';
    if (cgpa >= 6) return 'Keep Improving';
    return 'Needs Improvement';
};

const getAccentColor = (cgpa) => {
    if (cgpa >= 8) return [34, 197, 94];
    if (cgpa >= 6) return [234, 179, 8];
    return [239, 68, 68];
};

const getGradeColor = (pts) => {
    if (pts >= 9) return [34, 197, 94];
    if (pts >= 7) return [59, 130, 246];
    if (pts >= 5) return [234, 179, 8];
    return [239, 68, 68];
};

/* ─── PDF generator ────────────────────────────────────────── */
const generatePDF = (cgpaSubjects, calculatedCGPA) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const cgpa = parseFloat(calculatedCGPA);
    const now = new Date();
    const accent = getAccentColor(cgpa);

    const INDIGO     = [67, 56, 202];
    const DARK       = [15, 23, 42];
    const SLATE      = [30, 41, 59];
    const LIGHT_SLATE= [71, 85, 105];
    const MUTED      = [148, 163, 184];
    const WHITE      = [255, 255, 255];
    const LIGHT_BG   = [248, 250, 252];
    const BORDER     = [226, 232, 240];

    /* ── 1. HEADER ──────────────────────────────────────────── */
    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, 72, 'F');

    // Subtle diagonal texture
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.15);
    doc.setGState(doc.GState({ opacity: 0.04 }));
    for (let x = -20; x < W + 40; x += 8) doc.line(x, 0, x + 40, 72);
    doc.setGState(doc.GState({ opacity: 1 }));

    // Left accent bar
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, 5, 72, 'F');

    // Logo badge
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(12, 10, 32, 13, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text('AcadeMe', 28, 18.5, { align: 'center' });

    // Title
    doc.setFontSize(28);
    doc.setTextColor(...WHITE);
    doc.text('Academic Performance', 12, 42);
    doc.setFontSize(13);
    doc.setTextColor(165, 180, 252);
    doc.text('CGPA Report  |  Semester Analysis', 12, 52);

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Generated: ${dateStr}`, 12, 63);

    /* ── 2. CGPA HERO CIRCLE ────────────────────────────────── */
    const cx = W - 34, cy = 36, r = 26;

    doc.setFillColor(99, 102, 241);
    doc.setGState(doc.GState({ opacity: 0.2 }));
    doc.circle(cx, cy, r + 4, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    doc.setFillColor(...WHITE);
    doc.circle(cx, cy, r + 1, 'F');
    doc.setFillColor(...accent);
    doc.circle(cx, cy, r, 'F');
    doc.setFillColor(...WHITE);
    doc.circle(cx, cy, r - 5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...DARK);
    doc.text(calculatedCGPA, cx, cy - 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_SLATE);
    doc.text('out of 10', cx, cy + 5, { align: 'center' });

    doc.setFillColor(...INDIGO);
    doc.roundedRect(cx - 8, cy + r - 1, 16, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(`Grade ${getGradeLetter(cgpa)}`, cx, cy + r + 5, { align: 'center' });

    /* ── 3. PROGRESS DIVIDER ────────────────────────────────── */
    doc.setFillColor(...accent);
    doc.rect(0, 72, W * (cgpa / 10), 3, 'F');
    doc.setFillColor(...INDIGO);
    doc.rect(W * (cgpa / 10), 72, W * (1 - cgpa / 10), 3, 'F');

    /* ── 4. PERFORMANCE BANNER ──────────────────────────────── */
    const bannerY = 80;
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, bannerY, W, 18, 'F');
    doc.setFillColor(...accent);
    doc.rect(0, bannerY, 4, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...accent);
    doc.text(getPerformanceLabel(cgpa).toUpperCase(), 12, bannerY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...LIGHT_SLATE);
    const totalPtsAll = cgpaSubjects.reduce((s, sub) => s + GRADE_POINTS[sub.grade || 'F'], 0);
    doc.text(`Based on ${cgpaSubjects.length} subject${cgpaSubjects.length !== 1 ? 's' : ''}  |  Total Grade Points: ${totalPtsAll} / ${cgpaSubjects.length * 10}`, 12, bannerY + 14);

    const pct = ((cgpa / 10) * 100).toFixed(1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...INDIGO);
    doc.text(`${pct}%  Equivalent`, W - 12, bannerY + 10, { align: 'right' });

    /* ── 5. SUBJECT TABLE ───────────────────────────────────── */
    let y = 106;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INDIGO);
    doc.text('SUBJECT BREAKDOWN', 12, y);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.4);
    doc.line(12, y + 1.5, 12 + doc.getTextWidth('SUBJECT BREAKDOWN'), y + 1.5);
    y += 7;

    const cols = {
        no:     { x: 12,  w: 10, label: 'NO.'          },
        name:   { x: 24,  w: 88, label: 'SUBJECT NAME' },
        code:   { x: 114, w: 32, label: 'CODE'         },
        grade:  { x: 148, w: 22, label: 'GRADE'        },
        points: { x: 172, w: 26, label: 'POINTS'       },
    };

    // Header row
    doc.setFillColor(...SLATE);
    doc.roundedRect(10, y - 4, W - 20, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(cols.no.label,     cols.no.x,                              y + 3);
    doc.text(cols.name.label,   cols.name.x,                            y + 3);
    doc.text(cols.code.label,   cols.code.x   + cols.code.w / 2,        y + 3, { align: 'center' });
    doc.text(cols.grade.label,  cols.grade.x  + cols.grade.w / 2,       y + 3, { align: 'center' });
    doc.text(cols.points.label, cols.points.x + cols.points.w / 2,      y + 3, { align: 'center' });
    y += 11;

    cgpaSubjects.forEach((subject, i) => {
        const rowH = 11;
        const pts = GRADE_POINTS[subject.grade || 'F'];
        const gc = getGradeColor(pts);

        doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
        doc.rect(10, y - 3.5, W - 20, rowH, 'F');

        doc.setFillColor(...gc);
        doc.rect(10, y - 3.5, 3, rowH, 'F');

        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.line(10, y + rowH - 3.5, W - 10, y + rowH - 3.5);

        // Index
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...LIGHT_SLATE);
        doc.text(String(i + 1).padStart(2, '0'), cols.no.x, y + 3);

        // Name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(doc.splitTextToSize(subject.name || '—', cols.name.w - 2)[0], cols.name.x, y + 3);

        // Code pill
        const code = subject.code || '—';
        const codeW = doc.getTextWidth(code) + 6;
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(cols.code.x + cols.code.w / 2 - codeW / 2, y - 1.5, codeW, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(37, 99, 235);
        doc.text(code, cols.code.x + cols.code.w / 2, y + 3, { align: 'center' });

        // Grade badge
        doc.setFillColor(...gc);
        doc.roundedRect(cols.grade.x + cols.grade.w / 2 - 6, y - 2, 12, 7.5, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...WHITE);
        doc.text(subject.grade || 'F', cols.grade.x + cols.grade.w / 2, y + 3, { align: 'center' });

        // Points with mini bar
        const barW = 18;
        const fillW = (pts / 10) * barW;
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(cols.points.x + cols.points.w / 2 - barW / 2, y + 2.5, barW, 3, 1, 1, 'F');
        doc.setFillColor(...gc);
        doc.roundedRect(cols.points.x + cols.points.w / 2 - barW / 2, y + 2.5, fillW, 3, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...gc);
        doc.text(`${pts}`, cols.points.x + cols.points.w / 2, y - 0.5, { align: 'center' });

        y += rowH;
    });

    doc.setDrawColor(...SLATE);
    doc.setLineWidth(0.5);
    doc.line(10, y - 2.5, W - 10, y - 2.5);

    /* ── 6. STATS CARDS ─────────────────────────────────────── */
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INDIGO);
    doc.text('PERFORMANCE SUMMARY', 12, y);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.4);
    doc.line(12, y + 1.5, 12 + doc.getTextWidth('PERFORMANCE SUMMARY'), y + 1.5);
    y += 8;

    const passed = cgpaSubjects.filter(s => GRADE_POINTS[s.grade || 'F'] >= 5).length;
    const cards = [
        { label: 'CGPA',      value: calculatedCGPA,                     sub: 'out of 10.00',              color: [...INDIGO]     },
        { label: 'GRADE',     value: getGradeLetter(cgpa),               sub: 'Overall Grade',             color: [...accent]     },
        { label: 'TOTAL PTS', value: `${totalPtsAll}`,                   sub: `of ${cgpaSubjects.length * 10} max`, color: [14, 165, 233] },
        { label: 'PASSED',    value: `${passed}/${cgpaSubjects.length}`, sub: 'subjects cleared',          color: [34, 197, 94]  },
    ];

    const cardW2 = (W - 20 - 9) / 4;
    cards.forEach((card, i) => {
        const cx2 = 10 + i * (cardW2 + 3);

        // Shadow
        doc.setFillColor(210, 215, 230);
        doc.roundedRect(cx2 + 0.8, y + 0.8, cardW2, 26, 3, 3, 'F');

        // Card
        doc.setFillColor(...WHITE);
        doc.roundedRect(cx2, y, cardW2, 26, 3, 3, 'F');

        // Top bar
        doc.setFillColor(...card.color);
        doc.roundedRect(cx2, y, cardW2, 5, 3, 3, 'F');
        doc.rect(cx2, y + 2, cardW2, 3, 'F');

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...MUTED);
        doc.text(card.label, cx2 + cardW2 / 2, y + 8, { align: 'center' });

        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(...card.color);
        doc.text(card.value, cx2 + cardW2 / 2, y + 17, { align: 'center' });

        // Sub
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...MUTED);
        doc.text(card.sub, cx2 + cardW2 / 2, y + 23, { align: 'center' });
    });

    y += 34;

    /* ── 7. BEST / WORST STRIP ──────────────────────────────── */
    const highest = [...cgpaSubjects].sort((a, b) => GRADE_POINTS[b.grade] - GRADE_POINTS[a.grade])[0];
    const lowest  = [...cgpaSubjects].sort((a, b) => GRADE_POINTS[a.grade] - GRADE_POINTS[b.grade])[0];

    if (highest && lowest) {
        const halfW = (W - 23) / 2;

        // Best
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(10, y, halfW, 20, 3, 3, 'F');
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(10, y, 4, 20, 3, 3, 'F');
        doc.rect(12, y, 2, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(22, 101, 52);
        doc.text('BEST SUBJECT', 17, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        doc.text(doc.splitTextToSize(highest.name, halfW - 10)[0], 17, y + 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(34, 197, 94);
        doc.text(`Grade ${highest.grade}  |  ${GRADE_POINTS[highest.grade]} pts`, halfW + 6, y + 14, { align: 'right' });

        // Lowest
        const rx = 10 + halfW + 3;
        doc.setFillColor(255, 241, 242);
        doc.roundedRect(rx, y, halfW, 20, 3, 3, 'F');
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(rx, y, 4, 20, 3, 3, 'F');
        doc.rect(rx + 2, y, 2, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(153, 27, 27);
        doc.text('NEEDS ATTENTION', rx + 7, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        doc.text(doc.splitTextToSize(lowest.name, halfW - 10)[0], rx + 7, y + 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(239, 68, 68);
        doc.text(`Grade ${lowest.grade}  |  ${GRADE_POINTS[lowest.grade]} pts`, rx + halfW - 5, y + 14, { align: 'right' });

        y += 26;
    }

    /* ── 8. GRADE SCALE VISUAL ──────────────────────────────── */
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INDIGO);
    doc.text('GRADE SCALE REFERENCE', 12, y);
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(0.4);
    doc.line(12, y + 1.5, 12 + doc.getTextWidth('GRADE SCALE REFERENCE'), y + 1.5);
    y += 10;

    const scaleItems = [
        { g: 'S', p: 10, color: [34, 197, 94]  },
        { g: 'A', p: 9,  color: [59, 130, 246] },
        { g: 'B', p: 8,  color: [99, 102, 241] },
        { g: 'C', p: 7,  color: [234, 179, 8]  },
        { g: 'D', p: 6,  color: [249, 115, 22] },
        { g: 'E', p: 5,  color: [239, 68, 68]  },
        { g: 'F', p: 0,  color: [100, 116, 139]},
    ];
    const itemW = (W - 20 - 6 * 2) / 7;
    const myGrade = getGradeLetter(cgpa);

    scaleItems.forEach((item, i) => {
        const sx = 10 + i * (itemW + 2);
        const isMyGrade = myGrade === item.g;

        if (isMyGrade) {
            doc.setFillColor(...item.color);
            doc.roundedRect(sx, y - 4, itemW, 18, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...WHITE);
            doc.text(item.g, sx + itemW / 2, y + 5, { align: 'center' });
            doc.setFontSize(6.5);
            doc.text(`${item.p} pts`, sx + itemW / 2, y + 11, { align: 'center' });
            // "YOUR GRADE" arrow label above
            doc.setFontSize(5.5);
            doc.setTextColor(...item.color);
            doc.text('YOUR GRADE', sx + itemW / 2, y - 6, { align: 'center' });
        } else {
            doc.setFillColor(...item.color);
            doc.setGState(doc.GState({ opacity: 0.18 }));
            doc.roundedRect(sx, y, itemW, 12, 2, 2, 'F');
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...item.color);
            doc.text(item.g, sx + itemW / 2, y + 6, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(...MUTED);
            doc.text(`${item.p}`, sx + itemW / 2, y + 10, { align: 'center' });
        }
    });

    /* ── 9. FOOTER ──────────────────────────────────────────── */
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(10, H - 18, W - 10, H - 18);

    doc.setFillColor(...DARK);
    doc.rect(0, H - 16, W, 16, 'F');
    doc.setFillColor(...INDIGO);
    doc.rect(0, H - 16, 5, 16, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(165, 180, 252);
    doc.text('AcadeMe', 12, H - 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Academic Performance Report  |  Confidential', W / 2, H - 7, { align: 'center' });
    doc.text('Page 1 of 1', W - 12, H - 7, { align: 'right' });

    const fname = `AcadeMe_CGPA_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.pdf`;
    doc.save(fname);
};

/* ─── React Component ──────────────────────────────────────── */
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
        if (cgpa >= 9) return '🏆 Outstanding Performance!';
        if (cgpa >= 8) return '⭐ Excellent Work!';
        if (cgpa >= 7) return '👍 Good Performance!';
        if (cgpa >= 6) return '📈 Keep Improving!';
        return '💪 You Can Do Better!';
    };

    const handleShare = async () => {
        const text = `My CGPA: ${calculatedCGPA} | Grade: ${getGradeLetter(parseFloat(calculatedCGPA))} | ${getPerformanceLabel(parseFloat(calculatedCGPA))} — via AcadeMe`;
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
                                        <button onClick={() => removeSubjectCGPA(subject.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: 0.7 }}>
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
                                style={{
                                    background: 'var(--primary)', border: 'none', color: 'white',
                                    width: '40px', height: '40px', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', opacity: !selectedElectiveId ? 0.5 : 1
                                }}>
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
                                <GlassButton
                                    onClick={() => generatePDF(cgpaSubjects, calculatedCGPA)}
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}>
                                    <Save size={16} /> Save PDF
                                </GlassButton>
                                <GlassButton
                                    onClick={handleShare}
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}>
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
