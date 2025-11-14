// Initializes the Firebase Admin SDK for server-side operations.
// Used to issue custom tokens and manage Firebase users.
import * as admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'

// Convert escaped newlines in the private key to actual newlines
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

// Initialize Firebase Admin only once
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  })
}

// Export admin authentication instance
export const adminAuth = admin.auth()
