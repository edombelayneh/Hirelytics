'use client'

import { useEffect, useState } from 'react'
import { ProfilePage } from './ProfilePage'
import { defaultProfile, type UserProfile } from '../../data/profileData'
import { firebaseAuth } from '../../lib/firebaseClient'
import { getUserProfile, saveUserProfile } from '../../utils/userProfiles'
import {
  addJobHistory,
  deleteJobHistory,
  getJobHistory,
  type JobHistoryItem,
} from '@/app/utils/jobHistory'
import { set } from 'react-hook-form'
import { NEXT_REWRITTEN_PATH_HEADER } from 'next/dist/client/components/app-router-headers'

export default function ApplicantProfileRoute() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([])
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const uid = firebaseAuth.currentUser?.uid

      if (!uid) {
        setJobHistoryLoading(false)
        return
      }

      try {
        const saved = await getUserProfile(uid)
        if (saved) {
          setProfile({ ...defaultProfile, ...saved })
        }

        const history = await getJobHistory(uid)
        setJobHistory(history)
      } catch (err) {
        console.error('Failed to load profile/job history:', err)
        setJobHistory([])
      } finally {
        setJobHistoryLoading(false)
      }
    }

    load().catch(console.error)
  }, [])

  const handleUpdateProfile = async (updated: UserProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await saveUserProfile(uid, updated)
    setProfile(updated)
  }

  const handleAddJobHistory = async (item: {
    company: string
    title: string
    roleDescription: string
    startDate: string
    endDate: string
  }) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    const newId = await addJobHistory(uid, item)
    setJobHistory((prev) => [
      {
        id: newId,
        ...item,
      },
      ...prev,
    ])
    setJobHistoryLoading(false)
  }

  const handleDeleteJobHistory = async (jobHistoryId: string) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await deleteJobHistory(uid, jobHistoryId)
    setJobHistory((prev) => prev.filter((item) => item.id !== jobHistoryId))
  }

  return (
    <ProfilePage
      profile={profile}
      onUpdateProfile={handleUpdateProfile}
      jobHistory={jobHistory}
      jobHistoryLoading={jobHistoryLoading}
      onAddJobHistory={handleAddJobHistory}
      onDeleteJobHistory={handleDeleteJobHistory}
    />
  )
}
