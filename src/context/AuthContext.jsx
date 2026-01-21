
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

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            unsubscribeSnapshot(); // Cleanup previous listener

            if (currentUser) {
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
                        } else {
                            setUser({ ...currentUser, ...userData });

                            // STRICT ADMIN CHECK:
                            // 1. Hardcoded Email
                            // 2. Verified PIN (stored in local storage LINKED to UID)
                            const storedAdminUid = localStorage.getItem('edutrackr_admin_uid');
                            const isAuthorizedAdmin =
                                (currentUser.email === 'palerugopi2008@gmail.com') ||
                                (storedAdminUid === currentUser.uid);

                            setIsAdmin(isAuthorizedAdmin);
                        }
                    } else {
                        // User created but doc not ready yet (or manually deleted)
                        setUser(currentUser);
                        if (currentUser.email === 'palerugopi2008@gmail.com') {
                            setIsAdmin(true);
                            localStorage.setItem('edutrackr_admin_uid', currentUser.uid);
                        } else {
                            setIsAdmin(false);
                        }
                    }
                    // CRITICAL FIX: Only set loading to false AFTER we have the user data from Firestore
                    setLoading(false);
                }, (error) => {
                    console.error("Auth Snapshot Error:", error);
                    setLoading(false);
                });
            } else {
                // No user logged in
                setUser(null);
                setIsAdmin(false);
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

    const signup = async (userData) => {
        try {
            const { email, password, name, branch, year, regNo } = userData;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name,
                email,
                branch,
                year,
                regNo: regNo || '',
                createdAt: new Date().toISOString()
            });

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
                if (data.branch && data.branch !== 'N/A') {
                    isProfileComplete = true;
                }
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
