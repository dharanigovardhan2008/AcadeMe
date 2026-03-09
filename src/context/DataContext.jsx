import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
} from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// ============ CACHING UTILITY ============
const CACHE_DURATION = 300000; // 5 minutes

const getFromCache = (key) => {
    const cached = sessionStorage.getItem(key);
    const timestamp = sessionStorage.getItem(`${key}_time`);
    if (!cached || !timestamp) return null;
    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_DURATION) {
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
    sessionStorage.removeItem(`grades_${userId}`);
    sessionStorage.removeItem(`grades_${userId}_time`);
    sessionStorage.removeItem(`attendance_${userId}`);
    sessionStorage.removeItem(`attendance_${userId}_time`);
};
// ============ END CACHING UTILITY ============

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [cgpaSubjects, setCgpaSubjects] = useState([]);
    const [attendanceSubjects, setAttendanceSubjects] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [courses, setCourses] = useState([]);

    // Fetch Faculty (Global) - ONE TIME with cache
    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const cached = getFromCache('faculty_list');
                if (cached) { setFaculty(cached); return; }
                const snapshot = await getDocs(collection(db, "faculty"));
                const facultyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFaculty(facultyList);
                saveToCache('faculty_list', facultyList);
            } catch (error) {
                console.error("Error fetching faculty:", error);
            }
        };
        fetchFaculty();
    }, []);

    // Fetch Courses (Based on User Branch) - ONE TIME with cache
    useEffect(() => {
        if (!user || !user.branch) return;
        const fetchCourses = async () => {
            try {
                const cacheKey = `courses_${user.branch}`;
                const cached = getFromCache(cacheKey);
                if (cached) { setCourses(cached); return; }
                const q = query(collection(db, "courses"), where("branch", "==", user.branch));
                const snapshot = await getDocs(q);
                const courseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCourses(courseList);
                saveToCache(cacheKey, courseList);
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        };
        fetchCourses();
    }, [user?.branch]);

    // Fetch User Data (CGPA & Attendance) - ONE TIME with cache
    useEffect(() => {
        if (!user) {
            setCgpaSubjects([]);
            setAttendanceSubjects([]);
            return;
        }
        const fetchUserData = async () => {
            try {
                const gradesCacheKey = `grades_${user.uid}`;
                const cachedGrades = getFromCache(gradesCacheKey);
                if (cachedGrades) {
                    setCgpaSubjects(cachedGrades);
                } else {
                    const gradesSnapshot = await getDocs(collection(db, "users", user.uid, "grades"));
                    const grades = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setCgpaSubjects(grades);
                    saveToCache(gradesCacheKey, grades);
                }

                const attendanceCacheKey = `attendance_${user.uid}`;
                const cachedAttendance = getFromCache(attendanceCacheKey);
                if (cachedAttendance) {
                    setAttendanceSubjects(cachedAttendance);
                } else {
                    const attendanceSnapshot = await getDocs(collection(db, "users", user.uid, "attendance"));
                    const att = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAttendanceSubjects(att);
                    saveToCache(attendanceCacheKey, att);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserData();
    }, [user?.uid]);

    // --- CGPA Actions ---

    const addSubjectCGPA = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "grades"), subject);
            const newSubject = { id: Date.now().toString(), ...subject };
            setCgpaSubjects(prev => [...prev, newSubject]);
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error adding grade:", e);
        }
    };

    const removeSubjectCGPA = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "grades", id));
            setCgpaSubjects(prev => prev.filter(s => s.id !== id));
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error deleting grade:", e);
        }
    };

    const updateSubjectCGPA = async (id, grade) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "grades", id), { grade });
            setCgpaSubjects(prev => prev.map(s => s.id === id ? { ...s, grade } : s));
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error updating grade:", e);
        }
    };

    // --- Attendance Actions ---

    const addAttendanceSubject = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "attendance"), subject);
            const newSubject = { id: Date.now().toString(), ...subject };
            setAttendanceSubjects(prev => [...prev, newSubject]);
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error adding attendance:", e);
        }
    };

    const updateAttendance = async (id, total, attended) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "attendance", id), { total, attended });
            setAttendanceSubjects(prev => prev.map(s =>
                s.id === id ? { ...s, total, attended } : s
            ));
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error updating attendance:", e);
        }
    };

    // ✅ Fix — removeAttendanceSubject added: deletes from Firestore AND updates local state instantly
    const removeAttendanceSubject = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "attendance", id));
            setAttendanceSubjects(prev => prev.filter(s => s.id !== id));
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error deleting attendance subject:", e);
        }
    };

    return (
        <DataContext.Provider value={{
            cgpaSubjects,
            attendanceSubjects,
            faculty,
            courses,
            addSubjectCGPA,
            removeSubjectCGPA,
            updateSubjectCGPA,
            updateAttendance,
            addAttendanceSubject,
            removeAttendanceSubject, // ✅ exposed to components
        }}>
            {children}
        </DataContext.Provider>
    );
};
