
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if API key is present
if (!firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing. Please set VITE_FIREBASE_API_KEY in your environment.");
}

// Initialize Firebase only if API key is present to avoid crash
if (!firebaseConfig.apiKey) {
  console.error("CRITICAL: Firebase API Key is missing!");
} else {
  console.log("Firebase initialized with Project ID:", firebaseConfig.projectId);
}

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;

export const db = app ? getFirestore(app) : null as any;
export const auth = app ? getAuth(app) : null as any;
export const storage = app ? getStorage(app) : null as any;

export default app;
