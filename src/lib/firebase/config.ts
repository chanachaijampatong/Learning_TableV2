import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDQwA-XMYtzCtuG_MwnZ1071RD6ryhwkQ4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "learning-tablev2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "learning-tablev2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "learning-tablev2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "657701215422",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:657701215422:web:c8191db0ec23d69bf252ef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7FQRFFMSKD",
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth | undefined;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  if (typeof window !== "undefined") {
    auth = getAuth(app);
  }
} catch (error) {
  console.warn("Firebase initialization warning:", error);
}

export { app, db, auth };
