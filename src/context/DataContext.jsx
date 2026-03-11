import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
    collection, query, where, getDocs, addDoc, deleteDoc,
    updateDoc, doc, increment, getDoc, setDoc,
} from 'firebase/firestore';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// ============ CACHE ============
const CACHE_DURATION = 300000;
const getFromCache = (key) => {
    const cached = sessionStorage.getItem(key);
    const ts = sessionStorage.getItem(`${key}_time`);
    if (!cached || !ts) return null;
    if (Date.now() - parseInt(ts) > CACHE_DURATION) {
        sessionStorage.removeItem(key); sessionStorage.removeItem(`${key}_time`); return null;
    }
    return JSON.parse(cached);
};
const saveToCache = (key, data) => {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}_time`, Date.now().toString());
};
const clearUserCache = (uid) => {
    ['grades', 'attendance'].forEach(k => {
        sessionStorage.removeItem(`${k}_${uid}`);
        sessionStorage.removeItem(`${k}_${uid}_time`);
    });
};
export const clearCoursesCache = (branch) => {
    sessionStorage.removeItem(`courses_${branch}`);
    sessionStorage.removeItem(`courses_${branch}_time`);
};

// ============ POINTS CONFIG (import this in any file) ============
export const POINTS = {
    SUBMIT_REVIEW: 25,
    EDIT_REVIEW: 5,
    LIKE_REVIEW: 2,
    COMMENT: 5,
    CALL_FACULTY: 3,
    FEEDBACK_FEATURE: 20,
    FEEDBACK_BUG: 30,
    FEEDBACK_GENERAL: 10,
};

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [cgpaSubjects, setCgpaSubjects] = useState([]);
    const [attendanceSubjects, setAttendanceSubjects] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [courses, setCourses] = useState([]);

    // Faculty
    useEffect(() => {
        (async () => {
            try {
                const cached = getFromCache('faculty_list');
                if (cached) { setFaculty(cached); return; }
                const snap = await getDocs(collection(db, "faculty"));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setFaculty(list);
                saveToCache('faculty_list', list);
            } catch (e) { console.error("fetchFaculty:", e); }
        })();
    }, []);

    // Courses
    const fetchCourses = useCallback(async (isRefresh = false) => {
        if (!user?.branch) return;
        const cacheKey = `courses_${user.branch}`;
        if (!isRefresh) {
            const cached = getFromCache(cacheKey);
            if (cached) { setCourses(cached); return; }
        } else {
            clearCoursesCache(user.branch);
        }
        try {
            const q = query(collection(db, "courses"), where("branch", "==", user.branch));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(list);
            saveToCache(cacheKey, list);
        } catch (e) { console.error("fetchCourses:", e); }
    }, [user?.branch]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);
    const refreshCourses = useCallback(() => fetchCourses(true), [fetchCourses]);

    // User data
    useEffect(() => {
        if (!user) { setCgpaSubjects([]); setAttendanceSubjects([]); return; }
        (async () => {
            try {
                const gKey = `grades_${user.uid}`;
                const cg = getFromCache(gKey);
                if (cg) { setCgpaSubjects(cg); }
                else {
                    const snap = await getDocs(collection(db, "users", user.uid, "grades"));
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setCgpaSubjects(list); saveToCache(gKey, list);
                }
                const aKey = `attendance_${user.uid}`;
                const ca = getFromCache(aKey);
                if (ca) { setAttendanceSubjects(ca); }
                else {
                    const snap2 = await getDocs(collection(db, "users", user.uid, "attendance"));
                    const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
                    setAttendanceSubjects(list2); saveToCache(aKey, list2);
                }
            } catch (e) { console.error("fetchUserData:", e); }
        })();
    }, [user?.uid]);

    // CGPA
    const addSubjectCGPA = async (subject) => {
        if (!user) return;
        await addDoc(collection(db, "users", user.uid, "grades"), subject);
        setCgpaSubjects(prev => [...prev, { id: Date.now().toString(), ...subject }]);
        clearUserCache(user.uid);
    };
    const removeSubjectCGPA = async (id) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "grades", id));
        setCgpaSubjects(prev => prev.filter(s => s.id !== id));
        clearUserCache(user.uid);
    };
    const updateSubjectCGPA = async (id, grade) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "grades", id), { grade });
        setCgpaSubjects(prev => prev.map(s => s.id === id ? { ...s, grade } : s));
        clearUserCache(user.uid);
    };

    // Attendance
    const addAttendanceSubject = async (subject) => {
        if (!user) return;
        await addDoc(collection(db, "users", user.uid, "attendance"), subject);
        setAttendanceSubjects(prev => [...prev, { id: Date.now().toString(), ...subject }]);
        clearUserCache(user.uid);
    };
    const updateAttendance = async (id, total, attended) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "attendance", id), { total, attended });
        setAttendanceSubjects(prev => prev.map(s => s.id === id ? { ...s, total, attended } : s));
        clearUserCache(user.uid);
    };

    // ============ POINTS SYSTEM ============
    const awardPoints = useCallback(async (uid, name, pts, reason) => {
        if (!uid || !pts) return;
        try {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            if (snap.exists()) {
                const data = snap.data();
                const lastReset = data.pointsLastReset ? new Date(data.pointsLastReset) : null;
                const needsReset = !lastReset || lastReset < weekStart;
                await updateDoc(ref, {
                    totalPoints: increment(pts),
                    weeklyPoints: needsReset ? pts : increment(pts),
                    ...(needsReset ? { pointsLastReset: weekStart.toISOString() } : {}),
                    name: name || data.name || 'Student',
                });
            } else {
                await setDoc(ref, {
                    totalPoints: pts,
                    weeklyPoints: pts,
                    pointsLastReset: weekStart.toISOString(),
                    name: name || 'Student',
                }, { merge: true });
            }
            // Log history
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
