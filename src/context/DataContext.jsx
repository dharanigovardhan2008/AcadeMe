import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
    collection, query, where, getDocs, addDoc, deleteDoc,
    updateDoc, doc, getDoc, setDoc, increment,
} from 'firebase/firestore';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// ── Cache helpers (5 min TTL) ────────────────────────────────────────────────
const CACHE_TTL = 300000;
const getCache = (key) => {
    try {
        const v = sessionStorage.getItem(key);
        const t = sessionStorage.getItem(`${key}_time`);
        if (!v || !t) return null;
        if (Date.now() - parseInt(t) > CACHE_TTL) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
            return null;
        }
        return JSON.parse(v);
    } catch { return null; }
};
const setCache = (key, data) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem(`${key}_time`, Date.now().toString());
    } catch {}
};
const clearUserCache = (uid) => {
    ['grades', 'attendance'].forEach(k => {
        sessionStorage.removeItem(`${k}_${uid}`);
        sessionStorage.removeItem(`${k}_${uid}_time`);
    });
};

// ── Exported cache-bust helpers (used by AdminPanel / CoursesManagement) ────
export const clearCoursesCache = (branch) => {
    if (branch) {
        sessionStorage.removeItem(`courses_${branch}`);
        sessionStorage.removeItem(`courses_${branch}_time`);
    }
};

// ── Points map ───────────────────────────────────────────────────────────────
export const POINTS = {
    SUBMIT_REVIEW:    25,
    EDIT_REVIEW:       5,
    LIKE_REVIEW:       2,
    COMMENT:           5,
    CALL_FACULTY:      3,
    SUGGEST_FACULTY:  15,
    FEEDBACK_FEATURE: 20,
    FEEDBACK_BUG:     30,
    FEEDBACK_GENERAL: 10,
};

// ── Provider ─────────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
    const { user } = useAuth();

    const [cgpaSubjects,       setCgpaSubjects]       = useState([]);
    const [attendanceSubjects, setAttendanceSubjects] = useState([]);
    const [faculty,            setFaculty]            = useState([]);
    const [courses,            setCourses]            = useState([]);

    // ── Fetch faculty (global, cached) ───────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const cached = getCache('faculty_list');
                if (cached) { setFaculty(cached); return; }
                const snap = await getDocs(collection(db, 'faculty'));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setFaculty(list);
                setCache('faculty_list', list);
            } catch (e) { console.error('fetch faculty:', e); }
        })();
    }, []);

    // ── Fetch courses (branch-scoped, cached) ────────────────────────────────
    const fetchCourses = useCallback(async (forceRefresh = false) => {
        if (!user?.branch) return;
        try {
            const key = `courses_${user.branch}`;
            if (!forceRefresh) {
                const cached = getCache(key);
                if (cached) { setCourses(cached); return; }
            } else {
                clearCoursesCache(user.branch);
            }
            const q = query(collection(db, 'courses'), where('branch', '==', user.branch));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(list);
            setCache(key, list);
        } catch (e) { console.error('fetch courses:', e); }
    }, [user?.branch]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const refreshCourses = useCallback(() => fetchCourses(true), [fetchCourses]);

    // ── Fetch user data (CGPA + attendance, cached) ──────────────────────────
    useEffect(() => {
        if (!user) { setCgpaSubjects([]); setAttendanceSubjects([]); return; }
        (async () => {
            try {
                const gKey = `grades_${user.uid}`;
                const cg = getCache(gKey);
                if (cg) { setCgpaSubjects(cg); }
                else {
                    const snap = await getDocs(collection(db, 'users', user.uid, 'grades'));
                    const g = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setCgpaSubjects(g); setCache(gKey, g);
                }

                const aKey = `attendance_${user.uid}`;
                const ca = getCache(aKey);
                if (ca) { setAttendanceSubjects(ca); }
                else {
                    const snap = await getDocs(collection(db, 'users', user.uid, 'attendance'));
                    const a = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setAttendanceSubjects(a); setCache(aKey, a);
                }
            } catch (e) { console.error('fetch user data:', e); }
        })();
    }, [user?.uid]);

    // ── CGPA actions ─────────────────────────────────────────────────────────
    const addSubjectCGPA = async (subject) => {
        if (!user) return;
        const ref = await addDoc(collection(db, 'users', user.uid, 'grades'), subject);
        const s = { id: ref.id, ...subject };
        setCgpaSubjects(p => [...p, s]);
        clearUserCache(user.uid);
    };

    const removeSubjectCGPA = async (id) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'grades', id));
        setCgpaSubjects(p => p.filter(s => s.id !== id));
        clearUserCache(user.uid);
    };

    const updateSubjectCGPA = async (id, grade) => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid, 'grades', id), { grade });
        setCgpaSubjects(p => p.map(s => s.id === id ? { ...s, grade } : s));
        clearUserCache(user.uid);
    };

    // ── Attendance actions ───────────────────────────────────────────────────
    const addAttendanceSubject = async (subject) => {
        if (!user) return;
        const ref = await addDoc(collection(db, 'users', user.uid, 'attendance'), subject);
        const s = { id: ref.id, ...subject };
        setAttendanceSubjects(p => [...p, s]);
        clearUserCache(user.uid);
    };

    const updateAttendance = async (id, total, attended) => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid, 'attendance', id), { total, attended });
        setAttendanceSubjects(p => p.map(s => s.id === id ? { ...s, total, attended } : s));
        clearUserCache(user.uid);
    };

    // ── Points system ─────────────────────────────────────────────────────────
    // awardPoints(uid, name, pts, reason)
    // • Adds to totalPoints (all time)
    // • Adds to weeklyPoints — resets automatically if last reset < this week's Sunday
    const awardPoints = useCallback(async (uid, name, pts, reason) => {
        if (!uid || !pts) return;
        try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            const now = new Date();
            // Sunday of current week at midnight
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            if (snap.exists()) {
                const data = snap.data();
                const lastReset = data.pointsLastReset ? new Date(data.pointsLastReset) : null;
                const needsReset = !lastReset || lastReset < weekStart;
                await updateDoc(ref, {
                    totalPoints:  increment(pts),
                    weeklyPoints: needsReset ? pts : increment(pts),
                    name:         name || data.name || 'Student',
                    ...(needsReset ? { pointsLastReset: weekStart.toISOString() } : {}),
                });
            } else {
                await setDoc(ref, {
                    totalPoints:      pts,
                    weeklyPoints:     pts,
                    pointsLastReset:  weekStart.toISOString(),
                    name:             name || 'Student',
                }, { merge: true });
            }
            // History log
            await addDoc(collection(db, 'users', uid, 'pointsHistory'), {
                pts, reason, createdAt: new Date().toISOString(),
            });
        } catch (e) { console.error('awardPoints:', e); }
    }, []);

    return (
        <DataContext.Provider value={{
            cgpaSubjects, attendanceSubjects, faculty, courses,
            addSubjectCGPA, removeSubjectCGPA, updateSubjectCGPA,
            updateAttendance, addAttendanceSubject,
            refreshCourses, awardPoints,
        }}>
            {children}
        </DataContext.Provider>
    );
};
