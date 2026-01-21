import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
    authDomain: "edutrackr-5def9.firebaseapp.com",
    projectId: "edutrackr-5def9",
    storageBucket: "edutrackr-5def9.firebasestorage.app",
    messagingSenderId: "315009933456",
    appId: "1:315009933456:web:afafcaf3e17035bd1eb815",
    measurementId: "G-206PV4KM9T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
