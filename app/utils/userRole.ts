// This file handles reading/writing the user's role in Firestore.
// Both for applicants and recruiters.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

// These are the only roles we allow.
export type Role = 'applicant' | 'recruiter'

// This is what the Firestore user document looks like
export type UserDoc = {
  role: Role
  clerkUserId?: string

  // onboarding flags
  applicantProfileCompleted?: boolean
  recruiterProfileCompleted?: boolean

  createdAt?: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
}

// -----------------
// Get user document, return null if it doesnt exist
// -----------------
export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null

  return snap.data() as UserDoc
}

// -----------------
// Create user document to save their role in their user doc
// Right after the user picks a role on the Role page
// -----------------
export async function createUserDoc(params: {
  uid: string
  role: Role
  clerkUserId?: string
}): Promise<void> {
  const { uid, role, clerkUserId } = params

  const ref = doc(db, 'users', uid)

  // Create the doc with role and timestamps
  await setDoc(
    ref,
    {
      role,
      clerkUserId: clerkUserId ?? null,

      // defaults
      applicantProfileCompleted: role === 'applicant' ? false : false,
      recruiterProfileCompleted: role === 'recruiter' ? false : false,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// -----------------
// If user exists it returns their role
// If user does not exist then it returns null so they can be sent back to pick their role
// -----------------
export async function getUserRole(uid: string): Promise<Role | null> {
  const user = await getUserDoc(uid)
  return user?.role ?? null
}

// -----------------
// Get onboarding status for both applicant and recruiter profiles.
// This is used to determine where to send the user after they pick a role and after they log in.
// -----------------
export async function getOnboardingStatus(uid: string): Promise<{
  role: Role | null
  applicantProfileCompleted: boolean
  recruiterProfileCompleted: boolean
}> {
  const user = await getUserDoc(uid)

  return {
    role: user?.role ?? null,
    applicantProfileCompleted: Boolean(user?.applicantProfileCompleted),
    recruiterProfileCompleted: Boolean(user?.recruiterProfileCompleted),
  }
}
