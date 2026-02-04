'use client'

// Initializes Firebase client SDK for browser usage.
// Provides access to Firebase Auth and Firestore in the frontend.

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Public Firebase config variables (safe to expose on client)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Reuse existing Firebase app or initialize a new one
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Export Firebase services
export const firebaseAuth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
