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

// ============ ADDED CACHING UTILITY ============
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
    // Clear user-specific caches when data changes
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
                // Check cache first
                const cached = getFromCache('faculty_list');
                if (cached) {
                    setFaculty(cached);
                    return;
                }

                // Fetch from Firebase
                const snapshot = await getDocs(collection(db, "faculty"));
                const facultyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFaculty(facultyList);
                
                // Save to cache
                saveToCache('faculty_list', facultyList);
            } catch (error) {
                console.error("Error fetching faculty:", error);
            }
        };

        fetchFaculty();
    }, []); // Only runs once on mount

    // Fetch Courses (Based on User Branch) - ONE TIME with cache
    useEffect(() => {
        if (!user || !user.branch) return;

        const fetchCourses = async () => {
            try {
                // Check cache first
                const cacheKey = `courses_${user.branch}`;
                const cached = getFromCache(cacheKey);
                if (cached) {
                    setCourses(cached);
                    return;
                }

                // Fetch from Firebase
                const q = query(collection(db, "courses"), where("branch", "==", user.branch));
                const snapshot = await getDocs(q);
                const courseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCourses(courseList);
                
                // Save to cache
                saveToCache(cacheKey, courseList);
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        };

        fetchCourses();
    }, [user?.branch]); // Only runs when branch changes

    // Fetch User Data (CGPA & Attendance) - ONE TIME with cache
    useEffect(() => {
        if (!user) {
            setCgpaSubjects([]);
            setAttendanceSubjects([]);
            return;
        }

        const fetchUserData = async () => {
            try {
                // Fetch CGPA Subjects
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

                // Fetch Attendance Subjects
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
    }, [user?.uid]); // Only runs when user changes

    // --- Actions ---

    // CGPA
    const addSubjectCGPA = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "grades"), subject);
            
            // Update local state immediately
            const newSubject = { id: Date.now().toString(), ...subject };
            setCgpaSubjects(prev => [...prev, newSubject]);
            
            // Clear cache to force refresh next time
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error adding grade:", e);
        }
    };

    const removeSubjectCGPA = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "grades", id));
            
            // Update local state immediately
            setCgpaSubjects(prev => prev.filter(s => s.id !== id));
            
            // Clear cache
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error deleting grade:", e);
        }
    };

    const updateSubjectCGPA = async (id, grade) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "grades", id), { grade });
            
            // Update local state immediately
            setCgpaSubjects(prev => prev.map(s => s.id === id ? { ...s, grade } : s));
            
            // Clear cache
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error updating grade:", e);
        }
    };

    // Attendance
    const addAttendanceSubject = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "attendance"), subject);
            
            // Update local state immediately
            const newSubject = { id: Date.now().toString(), ...subject };
            setAttendanceSubjects(prev => [...prev, newSubject]);
            
            // Clear cache
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error adding attendance:", e);
        }
    };

    const updateAttendance = async (id, total, attended) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "attendance", id), { total, attended });
            
            // Update local state immediately
            setAttendanceSubjects(prev => prev.map(s => 
                s.id === id ? { ...s, total, attended } : s
            ));
            
            // Clear cache
            clearUserCache(user.uid);
        } catch (e) {
            console.error("Error updating attendance:", e);
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
            addAttendanceSubject
        }}>
            {children}
        </DataContext.Provider>
    );
};
