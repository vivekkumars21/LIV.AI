
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAJ5ModDCS3gGr97NPh-xrLgTp3vW2Sw-E",
    authDomain: "livai-49935.firebaseapp.com",
    projectId: "livai-49935",
    storageBucket: "livai-49935.firebasestorage.app",
    messagingSenderId: "1094744702028",
    appId: "1:1094744702028:web:20f2b5b1aad77f8f0008e9",
    measurementId: "G-C1QJ87JQBT"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { auth };
