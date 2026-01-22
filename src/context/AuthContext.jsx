import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot = () => { };

        // 1. Initial Local Storage Check (For instant load)
        const cachedUser = localStorage.getItem('edutrackr_user');
        if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
            // Check Admin Status from cache
            const storedAdminUid = localStorage.getItem('edutrackr_admin_uid');
            const isAuthorizedAdmin = 
                (parsed.email === 'palerugopi2008@gmail.com') || 
                (parsed.role === 'admin') || 
                (storedAdminUid === parsed.uid);
            setIsAdmin(isAuthorizedAdmin);
        }

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            unsubscribeSnapshot(); // Cleanup previous listener

            if (currentUser) {
                // Determine source: cache or fresh
                const userRef = doc(db, "users", currentUser.uid);

                unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();

                        if (userData.isBlocked) {
                            await signOut(auth);
                            alert("Your account has been blocked by the admin.");
                            setUser(null);
                            setIsAdmin(false);
                            localStorage.removeItem('edutrackr_admin_uid');
                            localStorage.removeItem('edutrackr_user');
                        } else {
                            const fullUserData = { ...currentUser, ...userData };
                            setUser(fullUserData);
                            
                            // Save to LocalStorage for persistence
                            localStorage.setItem('edutrackr_user', JSON.stringify(fullUserData));

                            // ADMIN CHECK LOGIC (Preserved from your code)
                            const storedAdminUid = localStorage.getItem('edutrackr_admin_uid');
                            const isAuthorizedAdmin =
                                (currentUser.email === 'palerugopi2008@gmail.com') ||
                                (userData.role === 'admin') ||
                                (storedAdminUid === currentUser.uid);

                            setIsAdmin(isAuthorizedAdmin);
                        }
                    } else {
                        // Doc doesn't exist yet (very fresh signup)
                        setUser(currentUser);
                        if (currentUser.email === 'palerugopi2008@gmail.com') {
                            setIsAdmin(true);
                            localStorage.setItem('edutrackr_admin_uid', currentUser.uid);
                        }
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Auth Snapshot Error:", error);
                    setLoading(false);
                });
            } else {
                // Logout
                setUser(null);
                setIsAdmin(false);
                localStorage.removeItem('edutrackr_user');
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeSnapshot();
        };
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    // ==========================================
    // FIXED SIGNUP FUNCTION
    // Can now handle Object (formData) OR separate arguments
    // ==========================================
    const signup = async (arg1, password, name, branch, year) => {
        try {
            let email, pass, userName, userBranch, userYear, userRegNo;

            // Check if arg1 is the formData object
            if (typeof arg1 === 'object') {
                email = arg1.email;
                pass = arg1.password;
                userName = arg1.name;
                userBranch = arg1.branch;
                userYear = arg1.year;
                userRegNo = arg1.regNo || '';
            } else {
                // Fallback for old way of calling it
                email = arg1;
                pass = password;
                userName = name;
                userBranch = branch;
                userYear = year;
                userRegNo = '';
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            const userData = {
                uid: user.uid,
                name: userName,
                email: email,
                branch: userBranch,
                year: userYear,
                regNo: userRegNo,
                role: 'student',
                createdAt: new Date().toISOString(),
                avatar: ''
            };

            await setDoc(doc(db, "users", user.uid), userData);
            localStorage.setItem('edutrackr_user', JSON.stringify(userData));
            return user;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setIsAdmin(false);
            localStorage.removeItem('edutrackr_admin_uid');
            localStorage.removeItem('edutrackr_user');
        } catch (error) {
            console.error(error);
        }
    };

    const googleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));

            let isProfileComplete = false;
            if (userDoc.exists()) {
                const data = userDoc.data();
                // Merge Google Data with Firestore Data
                const fullData = { ...user, ...data };
                setUser(fullData);
                localStorage.setItem('edutrackr_user', JSON.stringify(fullData));

                if (data.branch && data.branch !== 'N/A') {
                    isProfileComplete = true;
                }
            } else {
                // New Google User - create basic doc
                const newUserData = {
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    role: 'student',
                    createdAt: new Date().toISOString(),
                    avatar: user.photoURL
                };
                await setDoc(doc(db, "users", user.uid), newUserData);
                localStorage.setItem('edutrackr_user', JSON.stringify(newUserData));
            }

            return { user, isProfileComplete };
        } catch (error) {
            console.error("Google Sign In Error:", error);
            throw error;
        }
    };

    const verifyAdmin = (pin) => {
        if (pin === '235312493') {
            setIsAdmin(true);
            if (user) {
                localStorage.setItem('edutrackr_admin_uid', user.uid);
                // Also update local user object so UI reflects admin status immediately
                const updatedUser = { ...user, role: 'admin' };
                setUser(updatedUser);
                localStorage.setItem('edutrackr_user', JSON.stringify(updatedUser));
            }
            return true;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, login, googleLogin, signup, logout, verifyAdmin, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
