'use client'

import { useEffect, useState } from 'react'
import { ProfilePage } from './ProfilePage'
import { defaultProfile, type UserProfile } from '../../data/profileData'
import { firebaseAuth } from '../../lib/firebaseClient'
import { getUserProfile, saveUserProfile } from '../../utils/userProfiles'

// Loads and saves applicant profile data
export default function ApplicantProfileRoute() {
  // Store profile state (starts with defaults)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  // Fetch saved profile on mount
  useEffect(() => {
    // Load existing profile from Firestore when component mounts
    const load = async () => {
      // If not available yet, we skip loading (user may still be linking/authing).
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return

      // Fetch profile data from Firestore.
      // If it exists, overwrite defaults so the UI shows saved values.
      const saved = await getUserProfile(uid)
      if (saved) setProfile(saved)
    }
    // Call loader and log errors for debuggin
    load().catch(console.error)
  }, [])

  // Save updated profile to Firestore
  const handleUpdateProfile = async (updated: UserProfile) => {
    // Ensure we still have an authenticated Firebase user before saving.
    const uid = firebaseAuth.currentUser?.uid
    // If not available yet, we skip loading (user may still be linking/authing).
    if (!uid) return

    // Persist the updated profile to Firestore first (source of truth),
    // then update local state so the UI reflects the saved version.
    await saveUserProfile(uid, updated)
    setProfile(updated)
  }

  // Render profile UI
  return (
    <ProfilePage
      profile={profile}
      onUpdateProfile={handleUpdateProfile}
    />
  )
}
