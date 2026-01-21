import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    setDoc
} from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [cgpaSubjects, setCgpaSubjects] = useState([]);
    const [attendanceSubjects, setAttendanceSubjects] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [courses, setCourses] = useState([]); // Available courses for the branch

    // Fetch Faculty (Global)
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "faculty"), (snapshot) => {
            const facultyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFaculty(facultyList);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Courses (Based on User Branch)
    useEffect(() => {
        if (user && user.branch) {
            const q = query(collection(db, "courses"), where("branch", "==", user.branch));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const courseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCourses(courseList);
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Fetch User Data (CGPA & Attendance)
    useEffect(() => {
        if (!user) {
            setCgpaSubjects([]);
            setAttendanceSubjects([]);
            return;
        }

        // Real-time listener for CGPA Subjects (Subcollection: users/{uid}/grades)
        const gradesUnsub = onSnapshot(collection(db, "users", user.uid, "grades"), (snapshot) => {
            const grades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCgpaSubjects(grades);
        });

        // Real-time listener for Attendance (Subcollection: users/{uid}/attendance)
        const attendanceUnsub = onSnapshot(collection(db, "users", user.uid, "attendance"), (snapshot) => {
            const att = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAttendanceSubjects(att);
        });

        return () => {
            gradesUnsub();
            attendanceUnsub();
        };
    }, [user]);

    // --- Actions ---

    // CGPA
    const addSubjectCGPA = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "grades"), subject);
        } catch (e) {
            console.error("Error adding grade:", e);
        }
    };

    const removeSubjectCGPA = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "grades", id));
        } catch (e) {
            console.error("Error deleting grade:", e);
        }
    };

    const updateSubjectCGPA = async (id, grade) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "grades", id), { grade });
        } catch (e) {
            console.error("Error updating grade:", e);
        }
    };

    // Attendance
    const addAttendanceSubject = async (subject) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "users", user.uid, "attendance"), subject);
        } catch (e) {
            console.error("Error adding attendance:", e);
        }
    };

    const updateAttendance = async (id, total, attended) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "attendance", id), { total, attended });
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
