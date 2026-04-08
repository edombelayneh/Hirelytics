//// Loads user profile and job history from Firebase and passes data into ProfilePage
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
  updateJobHistory,
  type JobHistoryItem,
} from '@/app/utils/jobHistory'

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
    endDate?: string
    isCurrent: boolean
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

  const handleEditJobHistory = async (
    jobHistoryId: string,
    item: {
      company: string
      title: string
      roleDescription: string
      startDate: string
      endDate?: string
      isCurrent: boolean
    }
  ) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await updateJobHistory(uid, jobHistoryId, item)

    setJobHistory((prev) =>
      prev.map((entry) => (entry.id === jobHistoryId ? { ...entry, ...item } : entry))
    )
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
      onEditJobHistory={handleEditJobHistory}
      onDeleteJobHistory={handleDeleteJobHistory}
    />
  )
}
