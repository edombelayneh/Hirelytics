'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
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

  useEffect(() => {
    let isMounted = true
    let lastUid: string | null = null

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user || !isMounted) return
      if (lastUid === user.uid) return
      lastUid = user.uid

      getRecruiterProfile(user.uid)
        .then((saved) => {
          if (saved && isMounted) setProfile(saved)
        })
        .catch((e) => {
          console.error(e)
        })
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
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
