// This file reads and saves the user's profile in Firestore.
// Both for regular applicant profiles and recruiter profiles.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import type { UserProfile } from '../data/profileData'

// -----------------
// Read the profile from: users/{uid}, which comes from firebase auth UID
// -----------------
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Point to the user's doc and read it from Firestore id it exists, if it doesnt return null
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  // We store profile under a "profile" field
  const data = snap.data() as { profile?: UserProfile } | undefined
  return data?.profile ?? null
}

// -----------------
// Save the profile to: users/{uid}, which is stored in firebase auth UID
// -----------------
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
// ../utils/userProfiles.ts
export type RecruiterProfile = {
  // company
  companyName: string
  companyWebsite?: string
  companyLogo?: string
  companyLocation?: string
  companyDescription?: string

  // recruiter
  recruiterName?: string
  recruiterTitle?: string
  recruiterEmail: string
  recruiterPhone?: string
}

// -------------------
// Read recruiter profile from users/{uid}.recruiterProfile from Firestore
// -------------------
export async function getRecruiterProfile(uid: string): Promise<RecruiterProfile | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null

  const data = snap.data() as { recruiterProfile?: RecruiterProfile } | undefined
  return data?.recruiterProfile ?? null
}

// -------------------
// Save recruiter profile to users/{uid}.recruiterProfile
// -------------------
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
