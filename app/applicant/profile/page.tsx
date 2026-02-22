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
    const load = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return

      const saved = await getUserProfile(uid)
      if (saved) setProfile(saved)
    }

    load().catch(console.error)
  }, [])

  // Save updated profile to Firestore
  const handleUpdateProfile = async (updated: UserProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

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
