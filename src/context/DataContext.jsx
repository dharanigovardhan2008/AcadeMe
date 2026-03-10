import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
    collection, query, where, getDocs,
    addDoc, deleteDoc, updateDoc, doc,
} from 'firebase/firestore';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// ── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_DURATION = 300000; // 5 min

const getFromCache = (key) => {
    const cached = sessionStorage.getItem(key);
    const ts = sessionStorage.getItem(`${key}_time`);
    if (!cached || !ts) return null;
    if (Date.now() - parseInt(ts) > CACHE_DURATION) {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}_time`);
        return null;
    }
    return JSON.parse(cached);
};

const saveToCache = (key, data) => {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}_time`, Date.now().toString());
};

const clearUserCache = (userId) => {
    ['grades', 'attendance'].forEach(k => {
        sessionStorage.removeItem(`${k}_${userId}`);
        sessionStorage.removeItem(`${k}_${userId}_time`);
    });
};

// Exported so AdminPanel can bust the cache after editing courses for a branch
export const clearCoursesCache = (branch) => {
    sessionStorage.removeItem(`courses_${branch}`);
    sessionStorage.removeItem(`courses_${branch}_time`);
};
// ─────────────────────────────────────────────────────────────────────────────

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [cgpaSubjects, setCgpaSubjects] = useState([]);
    const [attendanceSubjects, setAttendanceSubjects] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [courses, setCourses] = useState([]);

    // ── Fetch Faculty (global, one-time) ──────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            try {
                const cached = getFromCache('faculty_list');
                if (cached) { setFaculty(cached); return; }
                const snap = await getDocs(collection(db, "faculty"));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setFaculty(list);
                saveToCache('faculty_list', list);
            } catch (e) { console.error("Error fetching faculty:", e); }
        };
        fetch();
    }, []);

    // ── Fetch Courses (by branch) ─────────────────────────────────────────────
    const fetchCourses = useCallback(async (branch) => {
        if (!branch) return;
        try {
            const cacheKey = `courses_${branch}`;
            const cached = getFromCache(cacheKey);
            if (cached) { setCourses(cached); return; }
            const q = query(collection(db, "courses"), where("branch", "==", branch));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(list);
            saveToCache(cacheKey, list);
        } catch (e) { console.error("Error fetching courses:", e); }
    }, []);

    useEffect(() => {
        if (user?.branch) fetchCourses(user.branch);
    }, [user?.branch, fetchCourses]);

    // Exposed so components can force-refresh after admin edits
    const refreshCourses = useCallback(() => {
        if (user?.branch) {
            clearCoursesCache(user.branch);
            fetchCourses(user.branch);
        }
    }, [user?.branch, fetchCourses]);

    // ── Fetch User Data (CGPA + Attendance) ───────────────────────────────────
    useEffect(() => {
        if (!user) { setCgpaSubjects([]); setAttendanceSubjects([]); return; }

        const fetch = async () => {
            try {
                // Grades
                const gradeKey = `grades_${user.uid}`;
                const cachedGrades = getFromCache(gradeKey);
                if (cachedGrades) {
                    setCgpaSubjects(cachedGrades);
                } else {
                    const snap = await getDocs(collection(db, "users", user.uid, "grades"));
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setCgpaSubjects(list);
                    saveToCache(gradeKey, list);
                }

                // Attendance
                const attKey = `attendance_${user.uid}`;
                const cachedAtt = getFromCache(attKey);
                if (cachedAtt) {
                    setAttendanceSubjects(cachedAtt);
                } else {
                    const snap = await getDocs(collection(db, "users", user.uid, "attendance"));
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setAttendanceSubjects(list);
                    saveToCache(attKey, list);
                }
            } catch (e) { console.error("Error fetching user data:", e); }
        };
        fetch();
    }, [user?.uid]);

    // ── CGPA actions ──────────────────────────────────────────────────────────
    const addSubjectCGPA = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "grades"), subject);
            setCgpaSubjects(prev => [...prev, { id: Date.now().toString(), ...subject }]);
            clearUserCache(user.uid);
        } catch (e) { console.error("Error adding grade:", e); }
    };

    const removeSubjectCGPA = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "grades", id));
            setCgpaSubjects(prev => prev.filter(s => s.id !== id));
            clearUserCache(user.uid);
        } catch (e) { console.error("Error deleting grade:", e); }
    };

    const updateSubjectCGPA = async (id, grade) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "grades", id), { grade });
            setCgpaSubjects(prev => prev.map(s => s.id === id ? { ...s, grade } : s));
            clearUserCache(user.uid);
        } catch (e) { console.error("Error updating grade:", e); }
    };

    // ── Attendance actions ────────────────────────────────────────────────────
    const addAttendanceSubject = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "attendance"), subject);
            setAttendanceSubjects(prev => [...prev, { id: Date.now().toString(), ...subject }]);
            clearUserCache(user.uid);
        } catch (e) { console.error("Error adding attendance:", e); }
    };

    const updateAttendance = async (id, total, attended) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "attendance", id), { total, attended });
            setAttendanceSubjects(prev => prev.map(s => s.id === id ? { ...s, total, attended } : s));
            clearUserCache(user.uid);
        } catch (e) { console.error("Error updating attendance:", e); }
    };

    return (
        <DataContext.Provider value={{
            cgpaSubjects, attendanceSubjects, faculty, courses,
            addSubjectCGPA, removeSubjectCGPA, updateSubjectCGPA,
            updateAttendance, addAttendanceSubject,
            refreshCourses,
        }}>
            {children}
        </DataContext.Provider>
    );
};
