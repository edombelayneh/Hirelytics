'use client'

import { useEffect, useState } from 'react'
import { RecruiterProfilePage } from './RecruiterProfilePage'
import { firebaseAuth } from '../../lib/firebaseClient'
import {
  getRecruiterProfile,
  saveRecruiterProfile,
  type RecruiterProfile,
} from '../../utils/userProfiles'

const defaultRecruiterProfile: RecruiterProfile = {
  companyName: '',
  companyWebsite: '',
  recruiterTitle: '',
}

export default function RecruiterProfileRoute() {
  const [profile, setProfile] = useState<RecruiterProfile>(defaultRecruiterProfile)

  useEffect(() => {
    const load = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return
      const saved = await getRecruiterProfile(uid)
      if (saved) setProfile(saved)
    }

    load().catch(console.error)
  }, [])

  const handleSave = async (updated: RecruiterProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return
    await saveRecruiterProfile(uid, updated)
    setProfile(updated)
  }

  return (
    <RecruiterProfilePage
      recruiterProfile={profile}
      onSave={handleSave}
    />
  )
}
