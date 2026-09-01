import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Check, X, Calculator, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

const TARGET = 0.8; // 80%

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const calcPlan = (total, attended, target = TARGET) => {
  const t = Math.max(0, toInt(total, 0));
  const a = clamp(Math.max(0, toInt(attended, 0)), 0, t || 0);

  if (t === 0) {
    return {
      total: 0,
      attended: 0,
      pct: 0,
      safe: true,
      msg: 'Enter classes to calculate',
      bunk: 0,
      need: 0,
    };
  }

  const pct = (a / t) * 100;
  const safe = pct >= target * 100;

  if (safe) {
    const x = Math.floor(a / target - t);
    const bunk = Math.max(0, x);
    return {
      total: t,
      attended: a,
      pct,
      safe: true,
      msg: bunk > 0 ? `You can safely bunk ${bunk} class${bunk > 1 ? 'es' : ''}` : `Don't bunk the next class`,
      bunk,
      need: 0,
    };
  } else {
    const y = Math.ceil((target * t - a) / (1 - target));
    const need = Math.max(0, y);
    return {
      total: t,
      attended: a,
      pct,
      safe: false,
      msg: `Attend the next ${need} class${need > 1 ? 'es' : ''} to reach ${Math.round(target * 100)}%`,
      bunk: 0,
      need,
    };
  }
};

const normalizeSubject = (s) => {
  const total = Math.max(0, toInt(s.total, 0));
  const attended = clamp(Math.max(0, toInt(s.attended, 0)), 0, total);
  return { ...s, total, attended };
};

const initialNewSubject = { name: '', total: '', attended: '', courseCode: '', facultyName: '' };

const initialReviewForm = {
  facultyName: '', courseCode: '', courseName: '',
  coFaculty: '', minInternals: '', facultyType: 'Moderate',
  mobileAllowed: true, rating: 0, feedback: '',
};

const AttendanceTracker = () => {
  const {
    attendanceSubjects, updateAttendance, addAttendanceSubject,
    removeAttendanceSubject, submitFacultyReview,
  } = useData();

  const [localSubjects, setLocalSubjects] = useState([]);
  const timersRef = useRef({});
  const [mounted, setMounted] = useState(false);

  // ── Optimistic-update tracking ────────────────────────────────────────────
  const overridesRef = useRef({}); // id -> { type: 'delete' } | { type: 'update', total, attended }

  // Add subject form
  const [newSubject, setNewSubject] = useState(initialNewSubject);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  // Inline delete confirmation
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Post-delete "review this faculty?" prompt
  const [reviewSubject, setReviewSubject] = useState(null); // the deleted subject, or null
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Instant calculator inputs
  const [instant, setInstant] = useState({ total: '', attended: '' });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const overrides = overridesRef.current;

    const next = attendanceSubjects
      .filter((s) => {
        const ov = overrides[s.id];
        return !(ov && ov.type === 'delete');
      })
      .map((s) => {
        const ov = overrides[s.id];
        if (ov && ov.type === 'update') {
          if (Number(s.total) === ov.total && Number(s.attended) === ov.attended) {
            delete overrides[s.id];
            return normalizeSubject(s);
          }
          return normalizeSubject({ ...s, total: ov.total, attended: ov.attended });
        }
        return normalizeSubject(s);
      });

    Object.keys(overrides).forEach((id) => {
      if (overrides[id].type === 'delete' && !attendanceSubjects.some((s) => s.id === id)) {
        delete overrides[id];
      }
    });

    setLocalSubjects(next);
  }, [attendanceSubjects]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  const queuePersist = useCallback(
    (id, total, attended) => {
      if (!id) return;
      if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
      timersRef.current[id] = setTimeout(() => {
        updateAttendance(id, total, attended);
      }, 300);
    },
    [updateAttendance]
  );

  const markPresent = useCallback(
    (id) => {
      setLocalSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const total = (s.total || 0) + 1;
          const attended = (s.attended || 0) + 1;
          overridesRef.current[id] = { type: 'update', total, attended };
          queuePersist(id, total, attended);
          return { ...s, total, attended };
        })
      );
    },
    [queuePersist]
  );

  const markAbsent = useCallback(
    (id) => {
      setLocalSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const total = (s.total || 0) + 1;
          const attended = s.attended || 0;
          overridesRef.current[id] = { type: 'update', total, attended };
          queuePersist(id, total, attended);
          return { ...s, total, attended };
        })
      );
    },
    [queuePersist]
  );

  const handleDeleteClick = useCallback((subj) => {
    if (!subj?.id) return;
    setConfirmingId(subj.id);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setConfirmingId(null);
  }, []);

  const openReviewPrompt = useCallback((subj) => {
    setReviewForm({
      ...initialReviewForm,
      facultyName: subj.facultyName || '',
      courseCode: subj.courseCode || '',
      courseName: subj.name || '',
    });
    setReviewError('');
    setReviewSubject(subj);
  }, []);

  const closeReviewModal = useCallback(() => {
    setReviewSubject(null);
    setReviewForm(initialReviewForm);
    setReviewError('');
  }, []);

  const handleConfirmDelete = useCallback(
    async (subj) => {
      if (!subj?.id) return;
      setConfirmingId(null);
      setDeletingId(subj.id);

      overridesRef.current[subj.id] = { type: 'delete' };
      setLocalSubjects((prev) => prev.filter((s) => s.id !== subj.id));

      try {
        await removeAttendanceSubject(subj.id);
        // Success — prompt the user to leave a quick anonymous faculty review.
        openReviewPrompt(subj);
      } catch (e) {
        console.error('Failed to delete subject:', e);
        delete overridesRef.current[subj.id];
        setLocalSubjects(attendanceSubjects.map(normalizeSubject));
      } finally {
        setDeletingId(null);
      }
    },
    [removeAttendanceSubject, attendanceSubjects, openReviewPrompt]
  );

  const handleAddSubject = useCallback(async () => {
    setAddError('');
    const name = (newSubject.name || '').trim();
    const courseCode = (newSubject.courseCode || '').trim();
    const facultyName = (newSubject.facultyName || '').trim();
    const total = toInt(newSubject.total, NaN);
    const attended = toInt(newSubject.attended, 0);

    if (!name) { setAddError('Please enter a subject name.'); return; }
    if (!courseCode) { setAddError('Please enter the course code.'); return; }
    if (!facultyName) { setAddError('Please enter the faculty name.'); return; }
    if (!Number.isFinite(total) || total <= 0) {
      setAddError('Please enter a valid total class count (greater than 0).');
      return;
    }

    setSavingAdd(true);
    try {
      await addAttendanceSubject({
        name, courseCode, facultyName,
        total, attended: clamp(attended, 0, total),
      });
      setNewSubject(initialNewSubject);
      setIsAdding(false);
    } catch (e) {
      console.error('Failed to add subject:', e);
      setAddError('Could not save the subject. Please try again.');
    } finally {
      setSavingAdd(false);
    }
  }, [addAttendanceSubject, newSubject]);

  const handleSubmitReview = useCallback(async () => {
    setReviewError('');
    const facultyName = reviewForm.facultyName.trim();
    const courseCode = reviewForm.courseCode.trim();
    const courseName = reviewForm.courseName.trim();
    const feedback = reviewForm.feedback.trim();

    if (!facultyName) return setReviewError('Please enter the faculty name.');
    if (!courseCode) return setReviewError('Please enter the course code.');
    if (!courseName) return setReviewError('Please enter the course name.');
    if (!reviewForm.rating) return setReviewError('Please select a star rating.');
    if (!feedback) return setReviewError('Please share a short feedback.');

    setReviewSubmitting(true);
    try {
      await submitFacultyReview({ ...reviewForm, facultyName, courseCode, courseName, feedback });
      closeReviewModal();
    } catch (e) {
      console.error('Failed to submit review:', e);
      setReviewError('Could not submit the review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  }, [reviewForm, submitFacultyReview, closeReviewModal]);

  const instantRes = useMemo(() => {
    return calcPlan(instant.total, instant.attended, TARGET);
  }, [instant.total, instant.attended]);

  // Live preview while adding a subject
  const addPreview = useMemo(() => {
    return calcPlan(newSubject.total, newSubject.attended, TARGET);
  }, [newSubject.total, newSubject.attended]);

  const CSS = `
    * { box-sizing: border-box; }

    .premium-wrap {
      position: relative;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #FFDCE8 0%, #F5E6FF 40%, #E6F0FF 100%);
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem 1.5rem 6rem;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    .premium-container {
      width: 100%;
      max-width: 800px;
      min-width: 0;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .premium-container.mounted {
      opacity: 1;
      transform: translateY(0);
    }

    /* Main Card */
    .premium-card {
      background: #FFFFFF;
      border-radius: 32px;
      padding: 2.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
      width: 100%;
      min-width: 0;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .card-title {
      font-size: clamp(1.25rem, 4vw, 1.5rem);
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .add-toggle-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: #F3F4F6;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4B5563;
      cursor: pointer;
      transition: all 0.2s, transform 0.15s;
      flex-shrink: 0;
    }
    .add-toggle-btn:hover { background: #E5E7EB; color: #111827; }
    .add-toggle-btn:active { transform: scale(0.94); }
    .add-toggle-btn.open { background: #111827; color: #fff; transform: rotate(45deg); }

    /* Instant Calculator Section */
    .calculator-box {
      background: #FAFAFA;
      border: 1px solid #F3F4F6;
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
    }
    .calc-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #4B5563;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }
    .calc-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .calc-input-group { min-width: 0; }
    .calc-input-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #9CA3AF;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .calc-inp {
      width: 100%;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      outline: none;
      font-weight: 600;
      color: #111827;
      transition: all 0.2s;
      font-family: inherit;
      font-size: 16px;
      min-height: 44px;
      box-sizing: border-box;
    }
    .calc-inp:focus {
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .calc-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1rem 1.1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      line-height: 1.4;
    }
    .calc-result-icon { flex-shrink: 0; display: flex; }
    .calc-result-msg { flex: 1; min-width: 0; }
    .calc-result-pct {
      flex-shrink: 0;
      font-size: 1.25rem;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 999px;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }
    .calc-result.safe { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
    .calc-result.safe .calc-result-pct { background: rgba(5, 150, 105, 0.12); color: #059669; }
    .calc-result.warning { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    .calc-result.warning .calc-result-pct { background: rgba(220, 38, 38, 0.12); color: #DC2626; }

    /* List Items */
    .list-header {
      display: flex;
      justify-content: space-between;
      color: #9CA3AF;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #F3F4F6;
    }

    /* Grid-based row: index | info | actions on row 1.
       Confirm-row / actions can drop to a second full-width row on mobile,
       always starting at the same x-position as the info column. */
    .list-item {
      display: grid;
      grid-template-columns: 32px 1fr auto;
      align-items: center;
      column-gap: 1rem;
      row-gap: 0.65rem;
      padding: 1.1rem 0;
      border-bottom: 1px solid #F9FAFB;
      transition: opacity 0.25s ease;
    }
    .list-item:last-child { border-bottom: none; }
    .list-item.is-deleting { opacity: 0.4; pointer-events: none; }

    .item-index {
      grid-column: 1;
      grid-row: 1;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #F3F4F6;
      color: #6B7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      align-self: start;
    }

    .item-info {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
    }
    .item-title {
      font-weight: 700;
      color: #1F2937;
      font-size: 1.05rem;
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-subtitle {
      font-size: 0.8rem;
      color: #9CA3AF;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .item-meta-pill {
      display: inline-flex;
      align-items: center;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.08);
      color: #6366F1;
      font-weight: 700;
      font-size: 0.7rem;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .item-actions {
      grid-column: 3;
      grid-row: 1;
      display: flex;
      align-items: center;
      gap: 0.9rem;
      justify-self: end;
      flex-shrink: 0;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      min-width: 58px;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }
    .pill-safe { background: #DCFCE7; color: #166534; }
    .pill-danger { background: #FEE2E2; color: #991B1B; }

    .action-group {
      display: flex;
      gap: 4px;
      background: #F3F4F6;
      padding: 4px;
      border-radius: 12px;
      flex-shrink: 0;
    }
    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      color: #6B7280;
      transition: background 0.12s, color 0.12s;
    }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn.present:hover, .action-btn.present:active { background: #FFFFFF; color: #10B981; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .action-btn.absent:hover, .action-btn.absent:active { background: #FFFFFF; color: #EF4444; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .action-btn.delete:hover, .action-btn.delete:active { background: #FEE2E2; color: #DC2626; }

    /* Inline delete confirmation — always spans the full row width */
    .confirm-row {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      animation: fadeIn 0.2s ease;
    }
    .confirm-text { flex: 1; font-size: 0.85rem; font-weight: 600; color: #991B1B; min-width: 0; }
    .confirm-btn {
      border: none;
      border-radius: 8px;
      padding: 0.5rem 0.9rem;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      min-height: 36px;
      white-space: nowrap;
    }
    .confirm-btn.yes { background: #DC2626; color: #fff; }
    .confirm-btn.yes:hover { background: #B91C1C; }
    .confirm-btn.no { background: #F3F4F6; color: #374151; }
    .confirm-btn.no:hover { background: #E5E7EB; }

    /* Add Form inline (rendered above the list) */
    .add-form {
      background: #F9FAFB;
      border: 1px dashed #D1D5DB;
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .add-form-full { grid-column: 1 / -1; }
    .add-error {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FECACA;
      border-radius: 10px;
      padding: 0.6rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .submit-btn {
      height: 44px;
      padding: 0 1.5rem;
      border-radius: 12px;
      background: #111827;
      color: white;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
      grid-column: 1 / -1;
    }
    .submit-btn:hover { background: #1F2937; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Review prompt modal ── */
    .rmodal-overlay {
      position: fixed; inset: 0; background: rgba(17,24,39,0.55);
      display: flex; align-items: center; justify-content: center;
      padding: 1.25rem; z-index: 1000; backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    .rmodal {
      background: #fff; border-radius: 24px; padding: 1.75rem;
      width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 24px 70px rgba(0,0,0,0.25);
    }
    .rmodal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem; gap: 0.75rem; }
    .rmodal-title { font-size: 1.15rem; font-weight: 800; color: #111827; margin: 0; }
    .rmodal-sub { font-size: 0.82rem; color: #6B7280; margin: 0 0 1.25rem; }
    .rmodal-close {
      background: #F3F4F6; border: none; width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      color: #6B7280; flex-shrink: 0;
    }
    .rmodal-close:hover { background: #E5E7EB; }
    .rmodal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem; }
    .rmodal-field { min-width: 0; }
    .rmodal-field.full { grid-column: 1 / -1; }
    .rmodal-field label {
      display: block; font-size: 0.72rem; font-weight: 700; color: #9CA3AF;
      text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px;
    }
    .rmodal-textarea { resize: vertical; min-height: 80px; }
    .rmodal-stars { display: flex; gap: 8px; margin: 4px 0 1rem; cursor: pointer; }
    .rmodal-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
      padding: 0.6rem 0.9rem; margin-bottom: 0.85rem;
    }
    .rmodal-toggle-row span { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .mini-toggle { width: 44px; height: 24px; border-radius: 20px; position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
    .mini-toggle.on { background: #10B981; }
    .mini-toggle.off { background: #EF4444; }
    .mini-toggle-knob { width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 3px; transition: left 0.2s; }
    .rmodal-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .rmodal-btn { flex: 1; height: 46px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; font-size: 0.9rem; transition: background 0.15s; }
    .rmodal-btn.skip { background: #F3F4F6; color: #374151; }
    .rmodal-btn.skip:hover { background: #E5E7EB; }
    .rmodal-btn.submit { background: #111827; color: #fff; }
    .rmodal-btn.submit:hover { background: #1F2937; }
    .rmodal-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .rmodal-anon-note {
      display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #6B7280;
      background: #F9FAFB; border-radius: 10px; padding: 0.5rem 0.75rem; margin-bottom: 1rem;
    }

    /* ── Tablet ── */
    @media (max-width: 768px) {
      .premium-wrap { padding: 1.25rem 1rem 5rem; }
      .premium-card { padding: 1.5rem; border-radius: 24px; }
      .calc-inputs { grid-template-columns: 1fr; gap: 0.75rem; }
      .add-form { grid-template-columns: 1fr; }
      .rmodal-grid { grid-template-columns: 1fr; }
    }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      .premium-wrap { padding: 0.75rem 0.75rem 5rem; }
      .premium-card { padding: 1.25rem; border-radius: 20px; }
      .card-header { margin-bottom: 1.25rem; }

      /* Row 1: index + title/subtitle. Row 2: percentage + buttons,
         starting at the same x-position as the title (column 2). */
      .list-item {
        grid-template-columns: 32px 1fr;
      }
      .item-actions {
        grid-column: 2 / -1;
        grid-row: 2;
        justify-self: stretch;
        justify-content: space-between;
      }
      .confirm-row { grid-column: 1 / -1; grid-row: 2; }
      .action-btn { width: 40px; height: 40px; }
      .pill-badge { min-width: 56px; }

      .calc-result { flex-wrap: wrap; }
      .calc-result-pct { order: -1; flex-basis: 100%; text-align: center; margin-bottom: 4px; }

      .confirm-row { flex-direction: column; align-items: stretch; }
      .confirm-text { text-align: center; }
    }

    @media (prefers-reduced-motion: reduce) {
      .premium-container, .add-form, .confirm-row, .rmodal-overlay { animation: none !important; transition: none !important; }
    }
  `;

  return (
    <DashboardLayout>
      <style>{CSS}</style>
      <div className="premium-wrap">
        <div className={`premium-container ${mounted ? 'mounted' : ''}`}>

          <div className="premium-card">

            {/* Header */}
            <div className="card-header">
              <h1 className="card-title">My Subjects</h1>
              <button
                className={`add-toggle-btn ${isAdding ? 'open' : ''}`}
                onClick={() => { setIsAdding((v) => !v); setAddError(''); }}
                title={isAdding ? 'Close' : 'Add Subject'}
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Instant Calculator */}
            <div className="calculator-box">
              <div className="calc-header">
                <Calculator size={18} />
                <span>Instant Calculator</span>
              </div>
              <div className="calc-inputs">
                <div className="calc-input-group">
                  <label>Total Classes Held</label>
                  <input
                    className="calc-inp"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 40"
                    value={instant.total}
                    onChange={(e) => setInstant((p) => ({ ...p, total: e.target.value }))}
                  />
                </div>
                <div className="calc-input-group">
                  <label>Classes Attended</label>
                  <input
                    className="calc-inp"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 32"
                    value={instant.attended}
                    onChange={(e) => setInstant((p) => ({ ...p, attended: e.target.value }))}
                  />
                </div>
              </div>
              {instant.total !== '' && (
                <div className={`calc-result ${instantRes.safe ? 'safe' : 'warning'}`}>
                  <span className="calc-result-icon">
                    {instantRes.safe ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </span>
                  <span className="calc-result-msg">{instantRes.msg}</span>
                  <span className="calc-result-pct">{Math.round(instantRes.pct)}%</span>
                </div>
              )}
            </div>

            {/* Add Subject Form — sits above the list so it opens at the top */}
            {isAdding && (
              <div className="add-form">
                {addError && (
                  <div className="add-error">
                    <AlertCircle size={16} /> {addError}
                  </div>
                )}
                <div className="calc-input-group">
                  <label>Subject Name</label>
                  <input
                    className="calc-inp"
                    placeholder="e.g. Data Structures"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="calc-input-group">
                  <label>Course Code</label>
                  <input
                    className="calc-inp"
                    placeholder="e.g. CSE1001"
                    value={newSubject.courseCode}
                    onChange={(e) => setNewSubject((p) => ({ ...p, courseCode: e.target.value }))}
                  />
                </div>
                <div className="calc-input-group add-form-full">
                  <label>Faculty Name</label>
                  <input
                    className="calc-inp"
                    placeholder="e.g. Dr. Sharma"
                    value={newSubject.facultyName}
                    onChange={(e) => setNewSubject((p) => ({ ...p, facultyName: e.target.value }))}
                  />
                </div>
                <div className="calc-input-group">
                  <label>Total</label>
                  <input
                    className="calc-inp"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={newSubject.total}
                    onChange={(e) => setNewSubject((p) => ({ ...p, total: e.target.value }))}
                  />
                </div>
                <div className="calc-input-group">
                  <label>Attended</label>
                  <input
                    className="calc-inp"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={newSubject.attended}
                    onChange={(e) => setNewSubject((p) => ({ ...p, attended: e.target.value }))}
                  />
                </div>

                {newSubject.total !== '' && (
                  <div className={`calc-result add-form-full ${addPreview.safe ? 'safe' : 'warning'}`}>
                    <span className="calc-result-icon">
                      {addPreview.safe ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </span>
                    <span className="calc-result-msg">Starting attendance</span>
                    <span className="calc-result-pct">{Math.round(addPreview.pct)}%</span>
                  </div>
                )}

                <button className="submit-btn" onClick={handleAddSubject} disabled={savingAdd}>
                  {savingAdd ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}

            {/* Subjects List */}
            <div className="list-header">
              <span>Subject Progress</span>
              <span>{Math.round(TARGET * 100)}% Target</span>
            </div>

            {localSubjects.length === 0 && !isAdding ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF', fontSize: '0.9rem' }}>
                No subjects added yet. Click the + icon to start tracking.
              </div>
            ) : (
              localSubjects.map((s, index) => {
                const plan = calcPlan(s.total, s.attended, TARGET);
                const safe = plan.safe;
                const isConfirming = confirmingId === s.id;
                const isDeleting = deletingId === s.id;
                const meta = [s.courseCode, s.facultyName].filter(Boolean).join(' · ');

                return (
                  <div className={`list-item ${isDeleting ? 'is-deleting' : ''}`} key={s.id || s.name}>
                    <div className="item-index">{index + 1}</div>

                    <div className="item-info">
                      <h3 className="item-title">{s.name}</h3>
                      <div className="item-subtitle">
                        Attended: {s.attended} / {s.total} classes
                      </div>
                      {meta && <div className="item-meta-pill">{meta}</div>}
                    </div>

                    {isConfirming ? (
                      <div className="confirm-row">
                        <span className="confirm-text">Remove "{s.name}"? This can't be undone.</span>
                        <button className="confirm-btn no" onClick={handleCancelDelete}>Cancel</button>
                        <button className="confirm-btn yes" onClick={() => handleConfirmDelete(s)}>Delete</button>
                      </div>
                    ) : (
                      <div className="item-actions">
                        <div className={`pill-badge ${safe ? 'pill-safe' : 'pill-danger'}`}>
                          {Math.round(plan.pct)}%
                        </div>

                        <div className="action-group">
                          <button className="action-btn present" onClick={() => markPresent(s.id)} title="Mark Present" disabled={isDeleting}>
                            <Check size={18} />
                          </button>
                          <button className="action-btn absent" onClick={() => markAbsent(s.id)} title="Mark Absent" disabled={isDeleting}>
                            <X size={18} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDeleteClick(s)} title="Remove Subject" disabled={isDeleting}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>
        </div>
      </div>

      {/* Post-delete faculty review prompt */}
      {reviewSubject && (
        <div className="rmodal-overlay" onClick={closeReviewModal}>
          <div className="rmodal" onClick={(e) => e.stopPropagation()}>
            <div className="rmodal-header">
              <div>
                <h2 className="rmodal-title">Review this faculty?</h2>
                <p className="rmodal-sub">You just removed "{reviewSubject.name}". Help other students with a quick, anonymous review.</p>
              </div>
              <button className="rmodal-close" onClick={closeReviewModal} title="Close">
                <X size={16} />
              </button>
            </div>

            <div className="rmodal-anon-note">
              <ShieldIcon /> Your name is never shown on this review, even to admins.
            </div>

            {reviewError && (
              <div className="add-error" style={{ marginBottom: '0.85rem' }}>
                <AlertCircle size={16} /> {reviewError}
              </div>
            )}

            <div className="rmodal-grid">
              <div className="rmodal-field">
                <label>Faculty Name</label>
                <input
                  className="calc-inp"
                  value={reviewForm.facultyName}
                  onChange={(e) => setReviewForm((p) => ({ ...p, facultyName: e.target.value }))}
                />
              </div>
              <div className="rmodal-field">
                <label>Co-Faculty (optional)</label>
                <input
                  className="calc-inp"
                  value={reviewForm.coFaculty}
                  onChange={(e) => setReviewForm((p) => ({ ...p, coFaculty: e.target.value }))}
                />
              </div>
              <div className="rmodal-field">
                <label>Course Code</label>
                <input
                  className="calc-inp"
                  value={reviewForm.courseCode}
                  onChange={(e) => setReviewForm((p) => ({ ...p, courseCode: e.target.value }))}
                />
              </div>
              <div className="rmodal-field">
                <label>Course Name</label>
                <input
                  className="calc-inp"
                  value={reviewForm.courseName}
                  onChange={(e) => setReviewForm((p) => ({ ...p, courseName: e.target.value }))}
                />
              </div>
              <div className="rmodal-field">
                <label>Internal Marks (Min, optional)</label>
                <input
                  className="calc-inp"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={reviewForm.minInternals}
                  onChange={(e) => setReviewForm((p) => ({ ...p, minInternals: e.target.value }))}
                />
              </div>
              <div className="rmodal-field">
                <label>Faculty Type</label>
                <select
                  className="calc-inp"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                  value={reviewForm.facultyType}
                  onChange={(e) => setReviewForm((p) => ({ ...p, facultyType: e.target.value }))}
                >
                  {['Loose', 'Moderate', 'Strict', 'Rod'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="rmodal-toggle-row">
              <span>Mobile Allowed?</span>
              <div
                className={`mini-toggle ${reviewForm.mobileAllowed ? 'on' : 'off'}`}
                onClick={() => setReviewForm((p) => ({ ...p, mobileAllowed: !p.mobileAllowed }))}
              >
                <div className="mini-toggle-knob" style={{ left: reviewForm.mobileAllowed ? '23px' : '3px' }} />
              </div>
            </div>

            <div className="rmodal-field full">
              <label>Rating</label>
              <div className="rmodal-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={26}
                    fill={s <= reviewForm.rating ? '#FFCC00' : 'none'}
                    color={s <= reviewForm.rating ? '#FFCC00' : '#D1D5DB'}
                    onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}
                  />
                ))}
              </div>
            </div>

            <div className="rmodal-field full">
              <label>Feedback</label>
              <textarea
                className="calc-inp rmodal-textarea"
                placeholder="Share your honest experience..."
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm((p) => ({ ...p, feedback: e.target.value }))}
              />
            </div>

            <div className="rmodal-actions">
              <button className="rmodal-btn skip" onClick={closeReviewModal} disabled={reviewSubmitting}>
                Skip
              </button>
              <button className="rmodal-btn submit" onClick={handleSubmitReview} disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Tiny inline shield icon so we don't need an extra lucide import just for one note.
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default AttendanceTracker;