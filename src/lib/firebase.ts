
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore"; // Added Firestore import

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp(); // if already initialized, use that one
}

// Initialize Analytics if measurementId is provided and in a browser environment
let analytics: Analytics | undefined;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  analytics = getAnalytics(firebaseApp);
}

// Initialize Firestore
const db: Firestore = getFirestore(firebaseApp);

export { firebaseApp, analytics, db }; // Export db

// Example for later use (e.g., Authentication)
// import { getAuth } from "firebase/auth";
// export const auth = getAuth(firebaseApp);
