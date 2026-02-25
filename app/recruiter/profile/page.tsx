'use client'

import { useEffect, useState } from 'react'
import { RecruiterProfilePage } from './RecruiterProfilePage'
import { firebaseAuth } from '../../lib/firebaseClient'
import {
  getRecruiterProfile,
  saveRecruiterProfile,
  type RecruiterProfile,
} from '../../utils/userProfiles'

// Default/empty recruiter profile shape
// Used before data loads or if no profile exists
const defaultRecruiterProfile: RecruiterProfile = {
  companyName: '',
  companyWebsite: '',
  recruiterTitle: '',
}
// Route wrapper: fetches + saves recruiter profile
export default function RecruiterProfileRoute() {
  // Local state holding recruiter profile data
  const [profile, setProfile] = useState<RecruiterProfile>(defaultRecruiterProfile)

  // Load saved profile when component mounts
  useEffect(() => {
    // Async loader function
    const load = async () => {
      // Get current authenticated user ID
      const uid = firebaseAuth.currentUser?.uid
      // If no logged-in user, exit early
      if (!uid) return

      // Fetch recruiter profile from database
      const saved = await getRecruiterProfile(uid)
      // If profile exists, update local state
      if (saved) setProfile(saved)
    }

    load().catch(console.error) // Log load errors
  }, [])

  // Persist profile changes
  const handleSave = async (updated: RecruiterProfile) => {
    // Get current user ID
    const uid = firebaseAuth.currentUser?.uid
    // If no user, do nothing
    if (!uid) return

    // Persist updated profile to database
    await saveRecruiterProfile(uid, updated)
    // Update local state after successful save
    setProfile(updated)
  }
  // Render UI component with data + save handler
  return (
    <RecruiterProfilePage
      recruiterProfile={profile}
      onSave={handleSave}
    />
  )
}
