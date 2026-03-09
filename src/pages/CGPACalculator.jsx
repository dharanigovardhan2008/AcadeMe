import React, { useState } from 'react';
import { Trash2, Calculator, Save, Share2, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassDropdown from '../components/GlassDropdown';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
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

const getRemark = (cgpa) => {
    if (cgpa >= 9) return 'Exceptional academic achievement. Keep up the outstanding work!';
    if (cgpa >= 8) return 'Excellent performance. You are among the top performers.';
    if (cgpa >= 7) return 'Good academic standing. A little more effort will take you higher.';
    if (cgpa >= 6) return 'Satisfactory performance. Focus on weaker subjects to improve.';
    return 'Academic improvement required. Seek guidance and study consistently.';
};

const getAccentRGB = (cgpa) => {
    if (cgpa >= 8) return [34, 197, 94];
    if (cgpa >= 6) return [250, 204, 21];
    return [239, 68, 68];
};

const getGradeRGB = (pts) => {
    if (pts >= 9) return [34, 197, 94];
    if (pts >= 7) return [99, 102, 241];
    if (pts >= 5) return [250, 204, 21];
    return [239, 68, 68];
};

/* ══════════════════════════════════════════════════════════════
   PDF GENERATOR
══════════════════════════════════════════════════════════════ */
const generatePDF = (cgpaSubjects, calculatedCGPA, userProfile) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    const cgpa = parseFloat(calculatedCGPA);
    const now = new Date();
    const accent = getAccentRGB(cgpa);

    // ── Color Palette ──────────────────────────────────────────
    const C = {
        // Backgrounds
        pageBg:    [10, 14, 26],      // near-black page bg
        headerBg:  [13, 18, 36],      // deep navy header
        cardBg:    [18, 26, 48],      // slightly lighter navy card
        rowEven:   [15, 22, 40],      // table even row
        rowOdd:    [18, 27, 50],      // table odd row
        divider:   [30, 42, 70],      // subtle divider lines
        // Accents
        indigo:    [99, 102, 241],
        indigoLt:  [129, 132, 255],
        white:     [255, 255, 255],
        // Text
        textPrim:  [226, 232, 240],   // slate-200
        textSec:   [148, 163, 184],   // slate-400
        textMuted: [71, 85, 105],     // slate-600
        // Accent (dynamic)
        accent,
    };

    // ── Page Background ────────────────────────────────────────
    doc.setFillColor(...C.pageBg);
    doc.rect(0, 0, W, H, 'F');

    // ── Decorative top-right corner glow ──────────────────────
    doc.setFillColor(...C.indigo);
    doc.setGState(doc.GState({ opacity: 0.07 }));
    doc.circle(W, 0, 60, 'F');
    doc.setGState(doc.GState({ opacity: 0.04 }));
    doc.circle(W, 0, 90, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    /* ── SECTION 1: HEADER ────────────────────────────────────
       Full-width dark navy header with logo + title + student info
    ──────────────────────────────────────────────────────────── */
    const HDR_H = 68;
    doc.setFillColor(...C.headerBg);
    doc.rect(0, 0, W, HDR_H, 'F');

    // Left indigo accent strip
    doc.setFillColor(...C.indigo);
    doc.rect(0, 0, 6, HDR_H, 'F');

    // Bottom header border line
    doc.setFillColor(...C.indigo);
    doc.setGState(doc.GState({ opacity: 0.5 }));
    doc.rect(0, HDR_H - 1, W, 1, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    // ── App Logo Block ─────────────────────────────────────────
    // Outer glow circle
    doc.setFillColor(...C.indigo);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.circle(28, 24, 16, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    // Logo circle
    doc.setFillColor(...C.indigo);
    doc.circle(28, 24, 12, 'F');
    // "A" monogram inside
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...C.white);
    doc.text('A', 28, 28.5, { align: 'center' });

    // App name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...C.white);
    doc.text('AcadeMe', 44, 22);
    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.indigoLt);
    doc.text('Academic Performance Tracker', 44, 28);

    // Vertical divider between logo and report title
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.4);
    doc.line(105, 10, 105, 38);

    // ── Report Title ───────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.white);
    doc.text('CGPA REPORT', 113, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.textSec);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Generated: ${dateStr}`, 113, 27);
    doc.text('Semester Analysis  |  Confidential', 113, 33);

    // ── Thin separator ─────────────────────────────────────────
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.3);
    doc.line(14, 42, W - 14, 42);

    // ── Student Info Row ───────────────────────────────────────
    const name   = userProfile?.name   || 'Student';
    const regNo  = userProfile?.regNo  || '—';
    const branch = userProfile?.branch || '—';
    const year   = userProfile?.year   || '—';

    // Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text('STUDENT NAME', 14, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.textPrim);
    doc.text(name.toUpperCase(), 14, 57);

    // Reg No
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text('REG. NUMBER', 75, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.textPrim);
    doc.text(String(regNo).toUpperCase(), 75, 57);

    // Branch
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text('BRANCH', 135, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.textPrim);
    doc.text(String(branch).toUpperCase(), 135, 57);

    // Year
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text('YEAR', 180, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.textPrim);
    doc.text(String(year), 180, 57);

    /* ── SECTION 2: CGPA SCORE HERO ───────────────────────────
       Large centered CGPA display with dynamic progress bar
    ──────────────────────────────────────────────────────────── */
    let y = HDR_H + 10;

    // Score card bg
    doc.setFillColor(...C.cardBg);
    doc.roundedRect(14, y, W - 28, 42, 4, 4, 'F');

    // Left accent bar on card
    doc.setFillColor(...C.accent);
    doc.roundedRect(14, y, 4, 42, 2, 2, 'F');
    doc.rect(16, y, 2, 42, 'F');

    // CGPA big number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(...C.accent);
    doc.text(calculatedCGPA, 50, y + 22, { align: 'center' });

    // "/ 10.00" small
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.textSec);
    doc.text('/ 10.00', 50, y + 31, { align: 'center' });

    // "CGPA" label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text('CGPA SCORE', 50, y + 8, { align: 'center' });

    // Vertical divider
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.4);
    doc.line(80, y + 8, 80, y + 36);

    // Performance label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...C.accent);
    doc.text(getPerformanceLabel(cgpa), 95, y + 17);

    // Grade letter badge
    doc.setFillColor(...C.indigo);
    doc.roundedRect(95, y + 21, 28, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    doc.text(`GRADE  ${getGradeLetter(cgpa)}`, 109, y + 28, { align: 'center' });

    // Percentage equivalent
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.textSec);
    doc.text(`${((cgpa / 10) * 100).toFixed(1)}% Equivalent`, 95, y + 38);

    // Progress bar (full width inside card)
    const barX = 14, barY = y + 42, barTotalW = W - 28, barH = 5;
    const fillW = (cgpa / 10) * barTotalW;
    doc.setFillColor(...C.divider);
    doc.roundedRect(barX, barY, barTotalW, barH, 2, 2, 'F');
    doc.setFillColor(...C.accent);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');

    // Progress bar label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textMuted);
    doc.text('0', barX, barY + 10);
    doc.text('5.0', barX + barTotalW / 2, barY + 10, { align: 'center' });
    doc.text('10', barX + barTotalW, barY + 10, { align: 'right' });

    y += 60;

    /* ── SECTION 3: STATS ROW ─────────────────────────────────
       4 small stat cards in a row
    ──────────────────────────────────────────────────────────── */
    const totalPts = cgpaSubjects.reduce((s, sub) => s + GRADE_POINTS[sub.grade || 'F'], 0);
    const passed   = cgpaSubjects.filter(s => GRADE_POINTS[s.grade || 'F'] >= 5).length;
    const highest  = [...cgpaSubjects].sort((a, b) => GRADE_POINTS[b.grade] - GRADE_POINTS[a.grade])[0];
    const lowest   = [...cgpaSubjects].sort((a, b) => GRADE_POINTS[a.grade] - GRADE_POINTS[b.grade])[0];

    const stats = [
        { label: 'SUBJECTS',    value: String(cgpaSubjects.length),         color: C.indigo          },
        { label: 'TOTAL PTS',   value: `${totalPts}/${cgpaSubjects.length * 10}`, color: [14, 165, 233]  },
        { label: 'PASSED',      value: `${passed}/${cgpaSubjects.length}`,  color: [34, 197, 94]     },
        { label: 'PERCENTAGE',  value: `${((cgpa/10)*100).toFixed(1)}%`,    color: [...C.accent]     },
    ];

    const statW = (W - 28 - 9) / 4;
    stats.forEach((s, i) => {
        const sx = 14 + i * (statW + 3);
        doc.setFillColor(...C.cardBg);
        doc.roundedRect(sx, y, statW, 22, 3, 3, 'F');
        // Top color line
        doc.setFillColor(...s.color);
        doc.roundedRect(sx, y, statW, 3, 2, 2, 'F');
        doc.rect(sx, y + 1, statW, 2, 'F');
        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...s.color);
        doc.text(s.value, sx + statW / 2, y + 14, { align: 'center' });
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...C.textMuted);
        doc.text(s.label, sx + statW / 2, y + 20, { align: 'center' });
    });

    y += 30;

    /* ── SECTION 4: SUBJECT TABLE ─────────────────────────────
       Professional dark-themed table
    ──────────────────────────────────────────────────────────── */
    // Section heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.indigoLt);
    doc.text('▌  SUBJECT BREAKDOWN', 14, y);
    y += 5;

    // Column definitions
    const COL = {
        no:     { x: 14,   w: 10  },
        name:   { x: 26,   w: 86  },
        code:   { x: 114,  w: 28  },
        grade:  { x: 144,  w: 20  },
        pts:    { x: 166,  w: 16  },
        bar:    { x: 184,  w: 12  },
    };

    // Table header row
    doc.setFillColor(...C.indigo);
    doc.setGState(doc.GState({ opacity: 0.25 }));
    doc.roundedRect(14, y, W - 28, 9, 2, 2, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.indigoLt);
    doc.text('#',       COL.no.x + 3,               y + 5.8);
    doc.text('SUBJECT', COL.name.x,                  y + 5.8);
    doc.text('CODE',    COL.code.x + COL.code.w/2,   y + 5.8, { align: 'center' });
    doc.text('GRADE',   COL.grade.x + COL.grade.w/2, y + 5.8, { align: 'center' });
    doc.text('PTS',     COL.pts.x + COL.pts.w/2,     y + 5.8, { align: 'center' });
    doc.text('BAR',     COL.bar.x + COL.bar.w/2,     y + 5.8, { align: 'center' });
    y += 9;

    // Table rows
    const ROW_H = 10;
    cgpaSubjects.forEach((subject, i) => {
        const pts = GRADE_POINTS[subject.grade || 'F'];
        const gc  = getGradeRGB(pts);
        const ry  = y + i * ROW_H;

        // Row background
        doc.setFillColor(...(i % 2 === 0 ? C.rowEven : C.rowOdd));
        doc.rect(14, ry, W - 28, ROW_H, 'F');

        // Grade-colored left micro-bar
        doc.setFillColor(...gc);
        doc.rect(14, ry, 3, ROW_H, 'F');

        // Row bottom border
        doc.setDrawColor(...C.divider);
        doc.setLineWidth(0.15);
        doc.line(14, ry + ROW_H, W - 14, ry + ROW_H);

        // Index number
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...C.textMuted);
        doc.text(String(i + 1).padStart(2, '0'), COL.no.x + 3, ry + 6.5);

        // Subject name (truncate if long)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...C.textPrim);
        const nameText = doc.splitTextToSize(subject.name || '—', COL.name.w - 2)[0];
        doc.text(nameText, COL.name.x, ry + 6.5);

        // Subject code pill
        const code    = subject.code || '—';
        const codeLen = doc.getTextWidth(code) + 5;
        doc.setFillColor(...C.indigo);
        doc.setGState(doc.GState({ opacity: 0.25 }));
        doc.roundedRect(COL.code.x + COL.code.w/2 - codeLen/2, ry + 1.5, codeLen, 6, 1.5, 1.5, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...C.indigoLt);
        doc.text(code, COL.code.x + COL.code.w/2, ry + 6.2, { align: 'center' });

        // Grade badge
        doc.setFillColor(...gc);
        doc.roundedRect(COL.grade.x + COL.grade.w/2 - 6, ry + 1.5, 12, 6.5, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.white);
        doc.text(subject.grade || 'F', COL.grade.x + COL.grade.w/2, ry + 6.5, { align: 'center' });

        // Points number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...gc);
        doc.text(String(pts), COL.pts.x + COL.pts.w/2, ry + 6.5, { align: 'center' });

        // Mini horizontal bar
        const barBgX = COL.bar.x;
        const barFill = (pts / 10) * COL.bar.w;
        doc.setFillColor(...C.divider);
        doc.roundedRect(barBgX, ry + 3.5, COL.bar.w, 3, 1, 1, 'F');
        doc.setFillColor(...gc);
        doc.roundedRect(barBgX, ry + 3.5, barFill, 3, 1, 1, 'F');
    });

    y += cgpaSubjects.length * ROW_H;

    // Table bottom line
    doc.setDrawColor(...C.indigo);
    doc.setGState(doc.GState({ opacity: 0.3 }));
    doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    doc.setGState(doc.GState({ opacity: 1 }));
    y += 8;

    /* ── SECTION 5: BEST / WORST + REMARK ────────────────────
       Side by side info cards + overall remark
    ──────────────────────────────────────────────────────────── */
    if (highest && lowest) {
        const halfW = (W - 28 - 4) / 2;

        // Best subject card
        doc.setFillColor(...C.cardBg);
        doc.roundedRect(14, y, halfW, 18, 3, 3, 'F');
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(14, y, 3, 18, 2, 2, 'F');
        doc.rect(15, y, 2, 18, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(34, 197, 94);
        doc.text('BEST SUBJECT', 20, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.textPrim);
        doc.text(doc.splitTextToSize(highest.name, halfW - 10)[0], 20, y + 12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(34, 197, 94);
        doc.text(`Grade ${highest.grade}  ·  ${GRADE_POINTS[highest.grade]} pts`, 14 + halfW - 2, y + 15, { align: 'right' });

        // Needs attention card
        const rx2 = 14 + halfW + 4;
        doc.setFillColor(...C.cardBg);
        doc.roundedRect(rx2, y, halfW, 18, 3, 3, 'F');
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(rx2, y, 3, 18, 2, 2, 'F');
        doc.rect(rx2 + 1, y, 2, 18, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(239, 68, 68);
        doc.text('NEEDS ATTENTION', rx2 + 6, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.textPrim);
        doc.text(doc.splitTextToSize(lowest.name, halfW - 10)[0], rx2 + 6, y + 12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(239, 68, 68);
        doc.text(`Grade ${lowest.grade}  ·  ${GRADE_POINTS[lowest.grade]} pts`, rx2 + halfW - 2, y + 15, { align: 'right' });

        y += 24;
    }

    // Remark box
    doc.setFillColor(...C.cardBg);
    doc.roundedRect(14, y, W - 28, 14, 3, 3, 'F');
    doc.setFillColor(...C.accent);
    doc.roundedRect(14, y, 3, 14, 2, 2, 'F');
    doc.rect(15, y, 2, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.accent);
    doc.text('REMARK', 20, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.textSec);
    doc.text(getRemark(cgpa), 20, y + 11);
    y += 20;

    /* ── SECTION 6: GRADE SCALE ───────────────────────────────
       Visual grade scale with current grade highlighted
    ──────────────────────────────────────────────────────────── */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.indigoLt);
    doc.text('▌  GRADE SCALE REFERENCE', 14, y);
    y += 6;

    const scaleItems = [
        { g: 'S', p: 10, color: [34, 197, 94]   },
        { g: 'A', p: 9,  color: [99, 102, 241]  },
        { g: 'B', p: 8,  color: [59, 130, 246]  },
        { g: 'C', p: 7,  color: [250, 204, 21]  },
        { g: 'D', p: 6,  color: [249, 115, 22]  },
        { g: 'E', p: 5,  color: [239, 68, 68]   },
        { g: 'F', p: 0,  color: [100, 116, 139] },
    ];

    const tileW = (W - 28 - 12) / 7;
    const myGrade = getGradeLetter(cgpa);

    scaleItems.forEach((item, i) => {
        const tx = 14 + i * (tileW + 2);
        const isMe = myGrade === item.g;

        if (isMe) {
            // Highlighted tile
            doc.setFillColor(...item.color);
            doc.roundedRect(tx, y - 3, tileW, 20, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(...C.white);
            doc.text(item.g, tx + tileW / 2, y + 8, { align: 'center' });
            doc.setFontSize(6);
            doc.text(`${item.p} pts`, tx + tileW / 2, y + 13, { align: 'center' });
            // "YOUR GRADE" marker
            doc.setFontSize(5);
            doc.setTextColor(...item.color);
            doc.text('YOU', tx + tileW / 2, y - 5, { align: 'center' });
        } else {
            doc.setFillColor(...C.cardBg);
            doc.roundedRect(tx, y, tileW, 14, 2, 2, 'F');
            doc.setFillColor(...item.color);
            doc.setGState(doc.GState({ opacity: 0.15 }));
            doc.roundedRect(tx, y, tileW, 14, 2, 2, 'F');
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...item.color);
            doc.text(item.g, tx + tileW / 2, y + 8, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            doc.setTextColor(...C.textMuted);
            doc.text(`${item.p}`, tx + tileW / 2, y + 12, { align: 'center' });
        }
    });

    /* ── FOOTER ───────────────────────────────────────────────
       Dark footer strip
    ──────────────────────────────────────────────────────────── */
    // Top rule
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.3);
    doc.line(0, H - 16, W, H - 16);

    doc.setFillColor(...C.headerBg);
    doc.rect(0, H - 15, W, 15, 'F');

    doc.setFillColor(...C.indigo);
    doc.rect(0, H - 15, 5, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.indigoLt);
    doc.text('AcadeMe', 10, H - 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text(`${name.toUpperCase()}  ·  ${regNo}  ·  ${branch}`, W / 2, H - 6, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text(`Page 1 of 1  ·  ${dateStr}`, W - 10, H - 6, { align: 'right' });

    /* ── SAVE ─────────────────────────────────────────────── */
    const fname = `AcadeMe_CGPA_${String(now.getFullYear())}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${(name || 'student').replace(/\s+/g,'_')}.pdf`;
    doc.save(fname);
};

/* ══════════════════════════════════════════════════════════════
   REACT COMPONENT
══════════════════════════════════════════════════════════════ */
const CGPACalculator = () => {
    const { cgpaSubjects, courses, addSubjectCGPA, removeSubjectCGPA, updateSubjectCGPA } = useData();
    const { user } = useAuth();
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
                                            <GlassDropdown options={GRADES} value={subject.grade}
                                                onChange={(g) => updateSubjectCGPA(subject.id, g)} />
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

                        <GlassButton variant="gradient"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                            onClick={calculate}>
                            Calculate CGPA
                        </GlassButton>

                        {showResult && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <GlassButton
                                    onClick={() => generatePDF(cgpaSubjects, calculatedCGPA, user)}
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
