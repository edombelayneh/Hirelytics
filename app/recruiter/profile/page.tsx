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
  companyLogo: '',
  companyLocation: '',
  companyDescription: '',
  recruiterName: '',
  recruiterEmail: '',
  recruiterPhone: '',
  recruiterTitle: '',
}

export default function RecruiterProfileRoute() {
  const [profile, setProfile] = useState<RecruiterProfile>(defaultRecruiterProfile)
  const [loadedOnce, setLoadedOnce] = useState(false)

  useEffect(() => {
    const load = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return

      const saved = await getRecruiterProfile(uid)
      if (saved) setProfile(saved)
      setLoadedOnce(true)
    }

    load().catch((e) => {
      console.error(e)
      setLoadedOnce(true)
    })
  }, [])

  const handleSave = async (updated: RecruiterProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await saveRecruiterProfile(uid, updated)
    setProfile(updated)
  }

  // Optional: you can show nothing/skeleton until first load attempt finishes
  // if (!loadedOnce) return null

  return (
    <RecruiterProfilePage
      recruiterProfile={profile}
      onSave={handleSave}
    />
  )
}
