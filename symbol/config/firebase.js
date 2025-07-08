import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: "gamesessionrecord.firebaseapp.com",
    projectId: "gamesessionrecord",
    storageBucket: "gamesessionrecord.firebasestorage.app",
    messagingSenderId: "964305638979",
    appId: "1:964305638979:web:8425626a30b5e47e8e26f6",
    measurementId: "G-QNBY2L1NRP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

export { app, storage };
export default app; 