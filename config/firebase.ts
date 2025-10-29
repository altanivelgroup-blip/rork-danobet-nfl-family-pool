// config/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ✅ DanoBet.G Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD-qg1k9z-iI1SveQOpTMGC3icvz_hvDBU",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "danobet-nfl-family-pool.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "danobet-nfl-family-pool",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "danobet-nfl-family-pool.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "634159887883",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:634159887883:web:30ba4cd739b937f937790e",
};

// Initialize safely (avoid multiple inits)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export commonly used Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
