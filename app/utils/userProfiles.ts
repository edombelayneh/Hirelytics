// This file reads and saves the user's profile in Firestore.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import type { UserProfile } from '../data/profileData'

// Read the profile from: users/{uid}
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Point to the user's doc
  const ref = doc(db, 'users', uid)

  // Read it once
  const snap = await getDoc(ref)

  // If no doc, return null
  if (!snap.exists()) return null

  // We store profile under a "profile" field
  const data = snap.data() as { profile?: UserProfile } | undefined
  return data?.profile ?? null
}

// Save the profile to: users/{uid}
export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const ref = doc(db, 'users', uid)

  // Merge so we do not overwrite the role or other fields
  await setDoc(
    ref,
    {
      profile,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// -------------------------
// Recruiter profile support
// -------------------------

export type RecruiterProfile = {
  companyName: string
  companyWebsite: string
  recruiterTitle: string
}

// Read recruiter profile from users/{uid}.recruiterProfile
export async function getRecruiterProfile(uid: string): Promise<RecruiterProfile | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null

  const data = snap.data() as { recruiterProfile?: RecruiterProfile } | undefined
  return data?.recruiterProfile ?? null
}

// Save recruiter profile to users/{uid}.recruiterProfile
export async function saveRecruiterProfile(
  uid: string,
  recruiterProfile: RecruiterProfile
): Promise<void> {
  const ref = doc(db, 'users', uid)

  await setDoc(
    ref,
    {
      recruiterProfile,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
