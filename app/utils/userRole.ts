// app/utils/userRole.ts
// This file handles reading/writing the user's role in Firestore.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

// These are the only roles we allow.
export type Role = 'applicant' | 'recruiter'

// This is the shape of the Firestore user document.
export type UserDoc = {
  role: Role
  clerkUserId?: string
  createdAt?: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
}

/**
 * Get the user's Firestore document.
 * - Returns null if the user doc does not exist yet.
 */
export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  // Point to: users/{uid}
  const ref = doc(db, 'users', uid)

  // Read the document once
  const snap = await getDoc(ref)

  // If it doesn't exist, return null
  if (!snap.exists()) return null

  // Otherwise return the data
  return snap.data() as UserDoc
}

/**
 * Create the user's Firestore document for the first time.
 * - Use this right after the user picks a role on the Role page.
 */
export async function createUserDoc(params: {
  uid: string
  role: Role
  clerkUserId?: string
}): Promise<void> {
  const { uid, role, clerkUserId } = params

  const ref = doc(db, 'users', uid)

  // Create the doc with role + timestamps
  await setDoc(
    ref,
    {
      role,
      clerkUserId: clerkUserId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true } // merge=true means we won't wipe other fields later
  )
}

/**
 * Convenience function:
 * - If user exists -> returns their role
 * - If user does not exist -> returns null (so you can send them to role picker)
 */
export async function getUserRole(uid: string): Promise<Role | null> {
  const user = await getUserDoc(uid)
  return user?.role ?? null
}
