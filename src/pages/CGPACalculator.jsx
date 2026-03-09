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
const LOGO_B64 = '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';

const getGradeLetter = (v) => v>=9?'S':v>=8?'A':v>=7?'B':v>=6?'C':v>=5?'D':'F';
const getPerf       = (v) => v>=9?'Outstanding Performance':v>=8?'Excellent Work':v>=7?'Good Performance':v>=6?'Keep Improving':'Needs Improvement';
const getRemark     = (v) => v>=9?'Exceptional results! You are among the best in your class.':v>=8?'Great job! Keep this momentum going strong.':v>=7?'Good standing. Push a little harder to reach excellence.':v>=6?'Satisfactory. Focus more on your weaker subjects.':'Improvement needed. Seek help and study consistently.';
const accentRGB     = (v) => v>=8?[52,211,153]:v>=6?[251,191,36]:[248,113,113];
const gradeRGB      = (p) => p>=9?[52,211,153]:p>=7?[129,140,248]:p>=5?[251,191,36]:[248,113,113];

/* ─────────────────────────────────────────────────────────────
   drawRoundRect  – helper since older jsPDF roundedRect
   doesn't support fill+stroke in one call cleanly
───────────────────────────────────────────────────────────── */
const rr = (doc, x, y, w, h, r, style='F') => doc.roundedRect(x, y, w, h, r, r, style);

/* ═════════════════════════════════════════════════════════════
   GENERATE PDF
   Uses a canvas to render rich gradient header, then
   precise jsPDF drawing for all data sections.
═════════════════════════════════════════════════════════════ */
const generatePDF = async (cgpaSubjects, calculatedCGPA, user) => {
  const doc   = new jsPDF({ unit:'mm', format:'a4' });
  const PW    = 210, PH = 297;
  const cgpa  = parseFloat(calculatedCGPA);
  const now   = new Date();
  const acc   = accentRGB(cgpa);
  const grade = getGradeLetter(cgpa);

  /* ── PALETTE ──────────────────────────────────────────────── */
  const BG    = [11, 15, 28];
  const HDR   = [14, 20, 40];
  const CARD  = [20, 29, 55];
  const CARD2 = [24, 35, 64];
  const DIV   = [35, 50, 85];
  const IND   = [99, 102, 241];
  const INDL  = [165, 180, 252];
  const WH    = [255,255,255];
  const T1    = [226,232,240];
  const T2    = [148,163,184];
  const T3    = [71, 85,105];

  /* ── PAGE BACKGROUND ─────────────────────────────────────── */
  doc.setFillColor(...BG);
  doc.rect(0, 0, PW, PH, 'F');

  /* ── subtle dot-grid texture (3 faint dots per row) ─────── */
  doc.setFillColor(...DIV);
  doc.setGState(doc.GState({opacity:0.25}));
  for(let r=8;r<PH;r+=10) for(let c=8;c<PW;c+=10) doc.circle(c,r,0.35,'F');
  doc.setGState(doc.GState({opacity:1}));

  /* ══════════════════════════════════════════════════════════
     SECTION 1 ── HEADER  (0 → 75mm)
  ══════════════════════════════════════════════════════════ */
  /* gradient illusion: 3 overlapping rects from dark→slightly lighter */
  [[HDR,0],[  [16,23,46],25],[[18,26,50],50]].forEach(([c,y])=>{
    doc.setFillColor(...c); doc.rect(0,y,PW,26,'F');
  });
  /* hard bottom edge */
  doc.setFillColor(...BG); doc.rect(0,74,PW,2,'F');

  /* left accent pillar */
  doc.setFillColor(...IND); doc.rect(0,0,5,75,'F');

  /* indigo glow top-right */
  doc.setFillColor(...IND);
  doc.setGState(doc.GState({opacity:0.08})); doc.circle(PW+5,0,55,'F');
  doc.setGState(doc.GState({opacity:0.04})); doc.circle(PW+5,0,80,'F');
  doc.setGState(doc.GState({opacity:1}));

  /* ── Logo ────────────────────────────────────────────────── */
  try { doc.addImage(LOGO_B64,'JPEG',10,9,20,20,'','FAST'); } catch(e){}

  /* App name */
  doc.setFont('helvetica','bold'); doc.setFontSize(17);
  doc.setTextColor(...WH);
  doc.text('AcadeMe', 34, 18);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
  doc.setTextColor(...INDL);
  doc.text('Academic Performance Tracker', 34, 25);

  /* vertical rule between logo area and report info */
  doc.setDrawColor(...DIV); doc.setLineWidth(0.3);
  doc.line(105,8,105,36);

  /* Report label */
  doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.setTextColor(...WH);
  doc.text('CGPA REPORT', 112,17);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
  doc.setTextColor(...T2);
  const ds = now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  doc.text(`Date: ${ds}`, 112, 24);
  doc.text('Semester Analysis  ·  Confidential', 112, 30);

  /* ── thin separator ──────────────────────────────────────── */
  doc.setDrawColor(...DIV); doc.setLineWidth(0.25);
  doc.line(10,40,PW-10,40);

  /* ── Student info band ───────────────────────────────────── */
  const name   = user?.name   || 'Student';
  const regNo  = user?.regNo  || '—';
  const branch = user?.branch || '—';
  const yr     = user?.year   || '—';

  [
    {lbl:'STUDENT NAME', val:name.toUpperCase(),           x:10},
    {lbl:'REG. NUMBER',  val:String(regNo).toUpperCase(),  x:72},
    {lbl:'BRANCH',       val:String(branch).toUpperCase(), x:134},
    {lbl:'YEAR',         val:String(yr),                   x:183},
  ].forEach(f=>{
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...T3);
    doc.text(f.lbl, f.x, 48);
    doc.setFont('helvetica','bold');   doc.setFontSize(8.5); doc.setTextColor(...T1);
    doc.text(f.val, f.x, 56);
  });

  /* accent underline on name */
  doc.setDrawColor(...acc); doc.setLineWidth(0.5);
  doc.line(10, 58, 10+doc.getTextWidth(name.toUpperCase())*0.9, 58);

  /* bottom border of header */
  doc.setFillColor(...acc[0],acc[1],acc[2]);
  doc.setFillColor(...acc);
  doc.rect(0,73,PW*(cgpa/10),2,'F');
  doc.setFillColor(...IND);
  doc.rect(PW*(cgpa/10),73,PW*(1-cgpa/10),2,'F');

  /* ══════════════════════════════════════════════════════════
     SECTION 2 ── CGPA HERO CARD  (78 → 128mm)
  ══════════════════════════════════════════════════════════ */
  let y = 78;

  /* card */
  doc.setFillColor(...CARD);
  rr(doc, 10, y, PW-20, 46, 4);

  /* left accent bar */
  doc.setFillColor(...acc);
  rr(doc, 10, y, 5, 46, 2);
  doc.rect(13, y, 2, 46,'F');

  /* big CGPA digit */
  doc.setFont('helvetica','bold'); doc.setFontSize(42);
  doc.setTextColor(...acc);
  doc.text(calculatedCGPA, 54, y+30, {align:'center'});

  doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
  doc.setTextColor(...T2);
  doc.text('out of 10.00', 54, y+38, {align:'center'});

  doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
  doc.setTextColor(...T3);
  doc.text('YOUR CGPA', 54, y+7, {align:'center'});

  /* vertical rule */
  doc.setDrawColor(...DIV); doc.setLineWidth(0.3);
  doc.line(84, y+7, 84, y+40);

  /* performance text */
  doc.setFont('helvetica','bold'); doc.setFontSize(15);
  doc.setTextColor(...acc);
  doc.text(getPerf(cgpa), 92, y+18);

  /* grade pill */
  doc.setFillColor(...IND);
  rr(doc, 92, y+22, 32, 11, 3);
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.setTextColor(...WH);
  doc.text(`GRADE  ${grade}`, 108, y+30, {align:'center'});

  /* pct */
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.setTextColor(...T2);
  doc.text(`${((cgpa/10)*100).toFixed(1)}%  Percentage Equivalent`, 92, y+41);

  /* progress bar */
  y += 46;
  doc.setFillColor(...DIV); rr(doc,10,y,PW-20,4,2);
  doc.setFillColor(...acc); rr(doc,10,y,(PW-20)*(cgpa/10),4,2);
  doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...T3);
  doc.text('0',10,y+8); doc.text('5.0',(PW)/2,y+8,{align:'center'}); doc.text('10',PW-10,y+8,{align:'right'});
  y += 13;

  /* ══════════════════════════════════════════════════════════
     SECTION 3 ── STAT CARDS  (y → y+26)
  ══════════════════════════════════════════════════════════ */
  const totalPts = cgpaSubjects.reduce((s,sub)=>s+GRADE_POINTS[sub.grade||'F'],0);
  const passed   = cgpaSubjects.filter(s=>GRADE_POINTS[s.grade||'F']>=5).length;
  const highest  = [...cgpaSubjects].sort((a,b)=>GRADE_POINTS[b.grade]-GRADE_POINTS[a.grade])[0];
  const lowest   = [...cgpaSubjects].sort((a,b)=>GRADE_POINTS[a.grade]-GRADE_POINTS[b.grade])[0];

  const statCards = [
    {lbl:'SUBJECTS',   val:String(cgpaSubjects.length),         clr:IND},
    {lbl:'TOTAL PTS',  val:`${totalPts}/${cgpaSubjects.length*10}`, clr:[14,165,233]},
    {lbl:'PASSED',     val:`${passed}/${cgpaSubjects.length}`,  clr:[52,211,153]},
    {lbl:'PERCENTAGE', val:`${((cgpa/10)*100).toFixed(1)}%`,    clr:[...acc]},
  ];
  const sw = (PW-20-9)/4;
  statCards.forEach((sc,i)=>{
    const sx = 10+i*(sw+3);
    doc.setFillColor(...CARD2); rr(doc,sx,y,sw,24,3);
    doc.setFillColor(...sc.clr); rr(doc,sx,y,sw,4,2); doc.rect(sx,y+2,sw,2,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...sc.clr);
    doc.text(sc.val, sx+sw/2, y+16, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...T3);
    doc.text(sc.lbl, sx+sw/2, y+22, {align:'center'});
  });
  y += 30;

  /* ══════════════════════════════════════════════════════════
     SECTION 4 ── SUBJECT TABLE
  ══════════════════════════════════════════════════════════ */
  /* section heading */
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...INDL);
  doc.text('SUBJECT BREAKDOWN', 10, y);
  doc.setDrawColor(...IND); doc.setLineWidth(0.4);
  doc.line(10,y+1.2, 10+doc.getTextWidth('SUBJECT BREAKDOWN'), y+1.2);
  y += 6;

  /* column layout */
  const C = { no:{x:10,w:9}, name:{x:21,w:84}, code:{x:107,w:28}, grade:{x:137,w:20}, pts:{x:159,w:14}, bar:{x:175,w:25} };

  /* header row */
  doc.setFillColor(...IND); doc.setGState(doc.GState({opacity:0.2}));
  rr(doc,10,y,PW-20,9,2);
  doc.setGState(doc.GState({opacity:1}));
  doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...INDL);
  doc.text('#',        C.no.x+2,   y+5.8);
  doc.text('SUBJECT',  C.name.x,   y+5.8);
  doc.text('CODE',     C.code.x+C.code.w/2,   y+5.8, {align:'center'});
  doc.text('GRADE',    C.grade.x+C.grade.w/2, y+5.8, {align:'center'});
  doc.text('PTS',      C.pts.x+C.pts.w/2,     y+5.8, {align:'center'});
  doc.text('SCORE BAR',C.bar.x+C.bar.w/2,     y+5.8, {align:'center'});
  y += 9;

  const RH = 10;
  cgpaSubjects.forEach((sub,i)=>{
    const pts = GRADE_POINTS[sub.grade||'F'];
    const gc  = gradeRGB(pts);
    const ry  = y + i*RH;

    /* row bg */
    doc.setFillColor(...(i%2===0?CARD:CARD2));
    doc.rect(10,ry,PW-20,RH,'F');

    /* left grade-colour strip */
    doc.setFillColor(...gc); doc.rect(10,ry,3,RH,'F');

    /* bottom border */
    doc.setDrawColor(...DIV); doc.setLineWidth(0.12);
    doc.line(10,ry+RH,PW-10,ry+RH);

    /* index */
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...T3);
    doc.text(String(i+1).padStart(2,'0'), C.no.x+2, ry+6.5);

    /* name */
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...T1);
    doc.text(doc.splitTextToSize(sub.name||'—',C.name.w-2)[0], C.name.x, ry+6.5);

    /* code pill */
    const code=sub.code||'—', cw=doc.getTextWidth(code)+5;
    doc.setFillColor(...IND); doc.setGState(doc.GState({opacity:0.22}));
    rr(doc, C.code.x+C.code.w/2-cw/2, ry+1.8, cw, 6, 1.5);
    doc.setGState(doc.GState({opacity:1}));
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...INDL);
    doc.text(code, C.code.x+C.code.w/2, ry+6.3, {align:'center'});

    /* grade badge */
    doc.setFillColor(...gc);
    rr(doc, C.grade.x+C.grade.w/2-6.5, ry+1.8, 13, 7, 1.8);
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...BG);
    doc.text(sub.grade||'F', C.grade.x+C.grade.w/2, ry+6.8, {align:'center'});

    /* pts */
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...gc);
    doc.text(String(pts), C.pts.x+C.pts.w/2, ry+6.5, {align:'center'});

    /* score bar */
    const bx=C.bar.x, bw=C.bar.w, fill=(pts/10)*bw;
    doc.setFillColor(...DIV); rr(doc,bx,ry+3.5,bw,3,1.2);
    doc.setFillColor(...gc);  rr(doc,bx,ry+3.5,fill,3,1.2);
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...T3);
    doc.text(`${pts}/10`, bx+bw+1, ry+6.5);
  });

  y += cgpaSubjects.length*RH;

  /* table bottom rule */
  doc.setDrawColor(...IND); doc.setGState(doc.GState({opacity:0.3}));
  doc.setLineWidth(0.5); doc.line(10,y,PW-10,y);
  doc.setGState(doc.GState({opacity:1}));
  y += 9;

  /* ══════════════════════════════════════════════════════════
     SECTION 5 ── BEST / WORST + REMARK
  ══════════════════════════════════════════════════════════ */
  if(highest && lowest){
    const hw=(PW-20-4)/2;

    /* best */
    doc.setFillColor(...CARD); rr(doc,10,y,hw,20,3);
    doc.setFillColor(52,211,153); rr(doc,10,y,4,20,2); doc.rect(12,y,2,20,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(52,211,153);
    doc.text('BEST SUBJECT',17,y+6);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...T1);
    doc.text(doc.splitTextToSize(highest.name,hw-12)[0],17,y+13);
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(52,211,153);
    doc.text(`Grade ${highest.grade}  ·  ${GRADE_POINTS[highest.grade]} pts`,10+hw-2,y+16,{align:'right'});

    /* worst */
    const rx=10+hw+4;
    doc.setFillColor(...CARD); rr(doc,rx,y,hw,20,3);
    doc.setFillColor(248,113,113); rr(doc,rx,y,4,20,2); doc.rect(rx+2,y,2,20,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(248,113,113);
    doc.text('NEEDS ATTENTION',rx+7,y+6);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...T1);
    doc.text(doc.splitTextToSize(lowest.name,hw-12)[0],rx+7,y+13);
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(248,113,113);
    doc.text(`Grade ${lowest.grade}  ·  ${GRADE_POINTS[lowest.grade]} pts`,rx+hw-2,y+16,{align:'right'});
    y += 26;
  }

  /* remark */
  doc.setFillColor(...CARD); rr(doc,10,y,PW-20,15,3);
  doc.setFillColor(...acc); rr(doc,10,y,4,15,2); doc.rect(12,y,2,15,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...acc);
  doc.text('REMARK',17,y+6);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...T2);
  doc.text(getRemark(cgpa),17,y+12);
  y += 21;

  /* ══════════════════════════════════════════════════════════
     SECTION 6 ── GRADE SCALE
  ══════════════════════════════════════════════════════════ */
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...INDL);
  doc.text('GRADE SCALE REFERENCE',10,y);
  doc.setDrawColor(...IND); doc.setLineWidth(0.4);
  doc.line(10,y+1.5,10+doc.getTextWidth('GRADE SCALE REFERENCE'),y+1.5);
  y += 8;

  const scl=[
    {g:'S',p:10,c:[52,211,153]},{g:'A',p:9,c:[99,102,241]},{g:'B',p:8,c:[59,130,246]},
    {g:'C',p:7,c:[250,204,21]},{g:'D',p:6,c:[249,115,22]},{g:'E',p:5,c:[239,68,68]},{g:'F',p:0,c:[100,116,139]}
  ];
  const tw=(PW-20-12)/7;
  scl.forEach((it,i)=>{
    const tx=10+i*(tw+2), isMe=grade===it.g;
    if(isMe){
      /* highlight tile with glow */
      doc.setFillColor(...it.c); doc.setGState(doc.GState({opacity:0.18}));
      rr(doc,tx-1,y-6,tw+2,26,3);
      doc.setGState(doc.GState({opacity:1}));
      doc.setFillColor(...it.c); rr(doc,tx,y-4,tw,22,3);
      doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...BG);
      doc.text(it.g,tx+tw/2,y+8,{align:'center'});
      doc.setFontSize(6); doc.text(`${it.p} pts`,tx+tw/2,y+14,{align:'center'});
      doc.setFontSize(5.5); doc.setTextColor(...it.c);
      doc.text('▲ YOU',tx+tw/2,y-7,{align:'center'});
    } else {
      doc.setFillColor(...CARD2); rr(doc,tx,y,tw,15,2);
      doc.setFillColor(...it.c); doc.setGState(doc.GState({opacity:0.12}));
      rr(doc,tx,y,tw,15,2);
      doc.setGState(doc.GState({opacity:1}));
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...it.c);
      doc.text(it.g,tx+tw/2,y+8,{align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...T3);
      doc.text(`${it.p}`,tx+tw/2,y+13,{align:'center'});
    }
  });

  /* ══════════════════════════════════════════════════════════
     FOOTER
  ══════════════════════════════════════════════════════════ */
  doc.setDrawColor(...DIV); doc.setLineWidth(0.25); doc.line(0,PH-17,PW,PH-17);
  doc.setFillColor(...HDR); doc.rect(0,PH-16,PW,16,'F');
  doc.setFillColor(...IND); doc.rect(0,PH-16,5,16,'F');

  try { doc.addImage(LOGO_B64,'JPEG',7,PH-13,8,8,'','FAST'); } catch(e){}

  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...INDL);
  doc.text('AcadeMe',18,PH-7);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...T2);
  doc.text(`${name.toUpperCase()}  ·  ${regNo}  ·  ${branch}  ·  Year ${yr}`, PW/2, PH-7, {align:'center'});
  doc.text(`Page 1 of 1  ·  ${ds}`, PW-10, PH-7, {align:'right'});

  /* ── SAVE ─────────────────────────────────────────────── */
  doc.save(`AcadeMe_CGPA_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${(name||'student').replace(/\s+/g,'_')}.pdf`);
};

/* ═════════════════════════════════════════════════════════════
   REACT COMPONENT
═════════════════════════════════════════════════════════════ */
const CGPACalculator = () => {
  const { cgpaSubjects, courses, addSubjectCGPA, removeSubjectCGPA, updateSubjectCGPA } = useData();
  const { user } = useAuth();
  const [selectedElectiveId, setSelectedElectiveId] = useState('');
  const [showResult, setShowResult]   = useState(false);
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
    const total = cgpaSubjects.reduce((s, sub) => s + GRADE_POINTS[sub.grade || 'F'], 0);
    setCalculatedCGPA((total / cgpaSubjects.length).toFixed(2));
    setShowResult(true);
  };

  const getMessage = (v) => {
    if (v >= 9) return '🏆 Outstanding Performance!';
    if (v >= 8) return '⭐ Excellent Work!';
    if (v >= 7) return '👍 Good Performance!';
    if (v >= 6) return '📈 Keep Improving!';
    return '💪 You Can Do Better!';
  };

  const handleShare = async () => {
    const text = `My CGPA: ${calculatedCGPA} | Grade: ${getGradeLetter(parseFloat(calculatedCGPA))} | ${getPerf(parseFloat(calculatedCGPA))} — via AcadeMe`;
    if (navigator.share) await navigator.share({ title: 'My CGPA', text });
    else { await navigator.clipboard.writeText(text); alert('Copied to clipboard!'); }
  };

  const availableElectives = courses.filter(c =>
    !cgpaSubjects.some(s => s.code === c.code || s.name === c.name)
  );

  return (
    <DashboardLayout>
      <GlassCard className="mb-6">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
          <div style={{ padding:'10px', borderRadius:'12px', background:'rgba(59,130,246,0.2)', color:'#60A5FA' }}>
            <Calculator size={24} />
          </div>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'bold' }}>CGPA Calculator</h1>
            <p style={{ color:'var(--text-secondary)' }}>Calculate your academic performance</p>
          </div>
        </div>
        <div style={{ background:'rgba(0,0,0,0.2)', padding:'1rem', borderRadius:'12px' }}>
          <h3 style={{ marginBottom:'0.5rem', fontSize:'0.9rem', color:'var(--text-secondary)' }}>📋 Grade Points Reference</h3>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            {Object.entries(GRADE_POINTS).map(([g,p]) => <Badge key={g} variant="neutral">{g} = {p}</Badge>)}
          </div>
        </div>
      </GlassCard>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 350px', gap:'2rem' }}>
        <div>
          <GlassCard>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ fontSize:'1.2rem', fontWeight:'600' }}>Your Subjects</h3>
            </div>
            {cgpaSubjects.length === 0 ? (
              <p style={{ color:'var(--text-secondary)', textAlign:'center', padding:'2rem' }}>
                No subjects added yet. Go to 'My Courses' to add mandatory subjects or add an elective below.
              </p>
            ) : cgpaSubjects.map(subject => (
              <div key={subject.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'1rem', marginBottom:'1rem', background:'rgba(255,255,255,0.03)',
                borderRadius:'8px', border:'1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontWeight:'500' }}>{subject.name}</span>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ width:'100px' }}>
                    <GlassDropdown options={GRADES} value={subject.grade} onChange={g => updateSubjectCGPA(subject.id, g)} />
                  </div>
                  <button onClick={() => removeSubjectCGPA(subject.id)}
                    style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', opacity:0.7 }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <div style={{
              display:'flex', alignItems:'center', gap:'1rem', padding:'1rem',
              background:'rgba(59,130,246,0.05)', borderRadius:'8px',
              border:'1px dashed rgba(59,130,246,0.3)', marginTop:'1.5rem'
            }}>
              <div style={{ flex:1 }}>
                <GlassDropdown
                  options={availableElectives.map(c => c.name)}
                  value={selectedElectiveId ? courses.find(c => c.id === selectedElectiveId)?.name : ''}
                  onChange={name => { const c = courses.find(x => x.name === name); if (c) setSelectedElectiveId(c.id); }}
                  placeholder="Add Elective from Course List..."
                />
              </div>
              <button onClick={handleAddElective} disabled={!selectedElectiveId}
                style={{
                  background:'var(--primary)', border:'none', color:'white',
                  width:'40px', height:'40px', borderRadius:'8px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', opacity: !selectedElectiveId ? 0.5 : 1
                }}>
                <Plus size={20} />
              </button>
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard style={{ textAlign:'center', position:'sticky', top:'100px' }}>
            <div style={{
              width:'150px', height:'150px', borderRadius:'50%',
              background:`radial-gradient(closest-side,#0F0F1A 79%,transparent 80% 100%),conic-gradient(${calculatedCGPA>=5?'#34D399':'#F87171'} ${showResult?calculatedCGPA*10:0}%,rgba(255,255,255,0.1) 0)`,
              margin:'0 auto 1.5rem', display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <div>
                <div style={{ fontSize:'3rem', fontWeight:'bold' }}>{showResult ? calculatedCGPA : '?'}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>CGPA</div>
              </div>
            </div>

            {showResult && (
              <div style={{ marginBottom:'1.5rem', animation:'fadeIn 0.5s ease' }}>
                <h3 className="gradient-text" style={{ fontSize:'1.2rem', fontWeight:'bold', marginBottom:'0.5rem' }}>
                  {getMessage(calculatedCGPA)}
                </h3>
                <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>Based on {cgpaSubjects.length} subjects</p>
              </div>
            )}

            <GlassButton variant="gradient"
              style={{ width:'100%', justifyContent:'center', marginBottom:'1rem' }}
              onClick={calculate}>
              Calculate CGPA
            </GlassButton>

            {showResult && (
              <div style={{ display:'flex', gap:'1rem' }}>
                <GlassButton onClick={() => generatePDF(cgpaSubjects, calculatedCGPA, user)}
                  style={{ flex:1, justifyContent:'center', fontSize:'0.9rem' }}>
                  <Save size={16} /> Save PDF
                </GlassButton>
                <GlassButton onClick={handleShare}
                  style={{ flex:1, justifyContent:'center', fontSize:'0.9rem' }}>
                  <Share2 size={16} /> Share
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
      <style>{`@media(max-width:900px){div[style*="grid-template-columns"]{grid-template-columns:1fr !important;}}`}</style>
    </DashboardLayout>
  );
};

export default CGPACalculator;

