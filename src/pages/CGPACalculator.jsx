import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Plus, Minus, RotateCcw, Award } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const GRADE_POINTS = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
const GRADES = Object.keys(GRADE_POINTS);

// Soft pastel theme colors for each grade
const GRADE_COLORS = {
    S: '#10B981', // Emerald
    A: '#3B82F6', // Blue
    B: '#6366F1', // Indigo
    C: '#F59E0B', // Amber
    D: '#F97316', // Orange
    E: '#F43F5E', // Rose
    F: '#EF4444', // Red
};

// Animated Number Counter
const AnimatedCounter = ({ value, decimals = 0 }) => {
    const [disp, setDisp] = useState(0);
    useEffect(() => {
        let t0 = null;
        const dur = 600; // Snappy 600ms animation
        const num = parseFloat(value) || 0;
        const tick = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            const easeOutQuart = 1 - Math.pow(1 - p, 4);
            setDisp(num * easeOutQuart);
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [value]);
    return <>{disp.toFixed(decimals)}</>;
};

const CGPACalculator = () => {
    const [mounted, setMounted] = useState(false);
    
    // State to hold the count of each grade
    const [counts, setCounts] = useState({
        S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0
    });

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    const handleIncrement = (grade) => {
        setCounts(prev => ({ ...prev, [grade]: prev[grade] + 1 }));
    };

    const handleDecrement = (grade) => {
        setCounts(prev => ({ ...prev, [grade]: Math.max(0, prev[grade] - 1) }));
    };

    const handleReset = () => {
        setCounts({ S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 });
    };

    // Instant calculations using useMemo
    const stats = useMemo(() => {
        let totalSubs = 0;
        let totalPts = 0;
        const segments = [];
        let currentPct = 0;

        Object.entries(counts).forEach(([g, count]) => {
            totalSubs += count;
            totalPts += count * GRADE_POINTS[g];
        });

        const cgpa = totalSubs === 0 ? 0 : (totalPts / totalSubs);

        // Calculate pie chart segments for CSS conic-gradient
        if (totalSubs > 0) {
            Object.entries(counts).forEach(([g, count]) => {
                if (count > 0) {
                    const pct = (count / totalSubs) * 100;
                    segments.push({
                        grade: g,
                        color: GRADE_COLORS[g],
                        start: currentPct,
                        end: currentPct + pct
                    });
                    currentPct += pct;
                }
            });
        }

        return { totalSubs, totalPts, cgpa, segments };
    }, [counts]);

    // Build the conic gradient string for the donut chart
    const donutGradient = stats.totalSubs === 0 
        ? 'conic-gradient(#F3F4F6 0% 100%)' 
        : `conic-gradient(${stats.segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`;

    const getMessage = (cgpa) => {
        if (cgpa === 0) return "Add grades to see result";
        if (cgpa >= 9) return "Outstanding Performance! 🏆";
        if (cgpa >= 8) return "Excellent Work! ⭐";
        if (cgpa >= 7) return "Good Performance! 👍";
        if (cgpa >= 6) return "Keep Improving! 📈";
        return "You Can Do Better! 💪";
    };

    const CSS = `
        .calc-theme-wrapper {
            position: relative;
            min-height: 100vh;
            width: 100%;
            background-color: #FDFDFD;
            font-family: 'DM Sans', sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 2rem 1rem 4rem; /* Adjusted top padding since header is removed */
            box-sizing: border-box;
        }

        .calc-mesh-bg {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none;
            background: 
                radial-gradient(circle at 15% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 85% 70%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 60%);
            filter: blur(60px);
        }

        .calc-container {
            position: relative; z-index: 1; width: 100%; max-width: 900px;
            animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .calc-grid {
            display: grid; grid-template-columns: 1.1fr 1fr; gap: 2rem;
        }

        .calc-card {
            background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            border-radius: 28px; padding: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        }

        .calc-card-title {
            font-size: 1.1rem; font-weight: 700; color: #1F2937; margin: 0 0 1.5rem 0;
            display: flex; align-items: center; gap: 8px;
        }

        /* Input Rows */
        .grade-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 14px; background: #F9FAFB; border-radius: 999px; /* Pill Shape */
            margin-bottom: 12px; border: 1px solid #F3F4F6; transition: background 0.2s;
        }
        .grade-row:hover { background: #F3F4F6; }

        .grade-badge {
            width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 1rem; color: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .grade-points { font-size: 0.8rem; color: #6B7280; font-weight: 600; margin-left: 12px; }

        .stepper-wrap {
            display: flex; align-items: center; gap: 12px;
            background: white; padding: 4px; border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04); border: 1px solid #E5E7EB;
        }

        .step-btn {
            width: 32px; height: 32px; border-radius: 50%; border: none;
            background: #F3F4F6; color: #4B5563; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
        }
        .step-btn:hover:not(:disabled) { background: #E5E7EB; color: #111827; }
        .step-btn:active:not(:disabled) { transform: scale(0.95); }
        .step-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .step-val { font-size: 1.1rem; font-weight: 700; color: #111827; width: 24px; text-align: center; }

        /* Donut Chart */
        .donut-wrap {
            position: relative; width: 220px; height: 220px; margin: 0 auto 2rem;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: background 0.5s ease;
            animation: scaleIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .donut-inner {
            position: relative; width: 170px; height: 170px; background: white;
            border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;
            box-shadow: inset 0 4px 10px rgba(0,0,0,0.05); z-index: 2;
        }
        .donut-cgpa-val { font-size: 3.5rem; font-weight: 800; color: #111827; line-height: 1; letter-spacing: -1px; }
        .donut-cgpa-lbl { font-size: 0.9rem; font-weight: 700; color: #6B7280; letter-spacing: 1px; margin-top: 4px; }

        /* Results & Stats */
        .result-msg { text-align: center; font-size: 1.1rem; font-weight: 700; color: #3B82F6; margin-bottom: 1.5rem; }
        
        .stat-pills { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .stat-pill {
            background: #F9FAFB; border: 1px solid #E5E7EB; padding: 12px 20px;
            border-radius: 999px; display: flex; align-items: center; gap: 10px;
        }
        .stat-pill-val { font-size: 1.1rem; font-weight: 800; color: #111827; }
        .stat-pill-lbl { font-size: 0.8rem; font-weight: 600; color: #6B7280; text-transform: uppercase; }

        .reset-btn {
            width: 100%; padding: 14px; border-radius: 999px; border: 1px solid #FECACA;
            background: #FEF2F2; color: #EF4444; font-weight: 700; font-size: 0.95rem; font-family: inherit;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            cursor: pointer; margin-top: 2rem; transition: all 0.2s;
        }
        .reset-btn:hover { background: #EF4444; color: white; border-color: #EF4444; }

        @media (max-width: 768px) {
            .calc-theme-wrapper { padding: 1.5rem 1rem; }
            .calc-grid { grid-template-columns: 1fr; gap: 1.5rem; }
            .calc-card { padding: 1.5rem; border-radius: 24px; }
            .donut-wrap { width: 180px; height: 180px; }
            .donut-inner { width: 135px; height: 135px; }
            .donut-cgpa-val { font-size: 2.8rem; }
            .grade-row { padding: 8px 12px; }
            .grade-badge { width: 32px; height: 32px; font-size: 0.9rem; }
        }
    `;

    return (
        <DashboardLayout>
            <style>{CSS}</style>
            
            <div className="calc-theme-wrapper">
                <div className="calc-mesh-bg" />
                
                <div className="calc-container" style={{ opacity: mounted ? 1 : 0 }}>
                    <div className="calc-grid">
                        
                        {/* ── LEFT PANEL: Inputs ── */}
                        <div className="calc-card">
                            <h3 className="calc-card-title">
                                <Award size={20} color="#8B5CF6" /> Grade Counts
                            </h3>
                            
                            {GRADES.map(grade => (
                                <div key={grade} className="grade-row">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div className="grade-badge" style={{ background: GRADE_COLORS[grade] }}>
                                            {grade}
                                        </div>
                                        <div className="grade-points">{GRADE_POINTS[grade]} pts</div>
                                    </div>
                                    
                                    <div className="stepper-wrap">
                                        <button 
                                            className="step-btn" 
                                            disabled={counts[grade] === 0}
                                            onClick={() => handleDecrement(grade)}
                                        >
                                            <Minus size={16} strokeWidth={3} />
                                        </button>
                                        <div className="step-val">{counts[grade]}</div>
                                        <button 
                                            className="step-btn" 
                                            onClick={() => handleIncrement(grade)}
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── RIGHT PANEL: Results & Donut Chart ── */}
                        <div className="calc-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 className="calc-card-title" style={{ justifyContent: 'center' }}>
                                    <PieChart size={20} color="#3B82F6" /> Live Result
                                </h3>

                                {/* Donut Chart */}
                                <div className="donut-wrap" style={{ background: donutGradient }}>
                                    <div className="donut-inner">
                                        <div className="donut-cgpa-val">
                                            <AnimatedCounter value={stats.cgpa} decimals={2} />
                                        </div>
                                        <div className="donut-cgpa-lbl">CGPA</div>
                                    </div>
                                </div>

                                <div className="result-msg">
                                    {getMessage(stats.cgpa)}
                                </div>

                                <div className="stat-pills">
                                    <div className="stat-pill">
                                        <span className="stat-pill-val"><AnimatedCounter value={stats.totalSubs} /></span>
                                        <span className="stat-pill-lbl">Subjects</span>
                                    </div>
                                    <div className="stat-pill">
                                        <span className="stat-pill-val"><AnimatedCounter value={stats.totalPts} /></span>
                                        <span className="stat-pill-lbl">Total Points</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleReset} className="reset-btn">
                                <RotateCcw size={18} /> Reset Calculator
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CGPACalculator;