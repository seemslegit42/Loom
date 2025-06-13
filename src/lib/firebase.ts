
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
// import { getAnalytics } from "firebase/analytics"; // Optional: if you want to use Analytics

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp(); // if already initialized, use that one
}

// Optional: Initialize Analytics if measurementId is provided
// let analytics;
// if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
//   analytics = getAnalytics(firebaseApp);
// }

export { firebaseApp };
// export { firebaseApp, analytics }; // Uncomment if using analytics

// Example for later use (e.g., Authentication)
// import { getAuth } from "firebase/auth";
// export const auth = getAuth(firebaseApp);

// Example for later use (e.g., Firestore)
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(firebaseApp);
