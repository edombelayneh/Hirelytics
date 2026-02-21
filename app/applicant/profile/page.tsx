'use client'

import { useEffect, useState } from 'react'
import { ProfilePage } from './ProfilePage'
import { defaultProfile, type UserProfile } from '../../data/profileData'
import { firebaseAuth } from '../../lib/firebaseClient'
import { getUserProfile, saveUserProfile } from '../../utils/userProfiles'

export default function ApplicantProfileRoute() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  useEffect(() => {
    const load = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return
      const saved = await getUserProfile(uid)
      if (saved) setProfile(saved)
    }

    load().catch(console.error)
  }, [])

  const handleUpdateProfile = async (updated: UserProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return
    await saveUserProfile(uid, updated)
    setProfile(updated)
  }

  return (
    <ProfilePage
      profile={profile}
      onUpdateProfile={handleUpdateProfile}
    />
  )
}
