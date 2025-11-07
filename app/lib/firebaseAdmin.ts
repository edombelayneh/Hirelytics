import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// const privateKey = process.env.FIREBASE_PRIVATE_KEY_B64
//   ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8')
//   : (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const adminAuth = admin.auth();
