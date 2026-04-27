'use client'

import { memo } from 'react'
import HeroPanel from '../../components/HeroPanel'
import { SummaryCards } from '../../components/SummaryCards'
import { ApplicationsTable } from '../../components/ApplicationsTable'
import { JobApplication } from '../../data/mockData'
import { db } from '../../lib/firebaseClient'
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  arrayRemove,
} from 'firebase/firestore'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import {
  getDisplayStatusForApplication,
  isInternalHirelyticsJob,
} from '../../utils/applicationStatus'

const MyApplicationsPage = memo(function MyApplicationsPage() {
  // Get authenticated user and loading state from Clerk
  const { userId, isLoaded } = useAuth()

  // Store live application data from Firestore
  const [liveApplications, setLiveApplications] = useState<JobApplication[]>([])

  // Store the application selected for deletion so the confirmation modal can show
  const [applicationToDelete, setApplicationToDelete] = useState<JobApplication | null>(null)

  // Listen in real-time to this user's applications
  useEffect(() => {
    // Wait until Clerk finishes loading and user exists
    if (!isLoaded || !userId) return

    // Query this user's applications ordered by newest first
    const q = query(
      collection(db, 'users', userId, 'applications'),
      orderBy('applicationDate', 'desc')
    )

    // Subscribe to real-time updates
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => {
        const data = d.data() as JobApplication
        return {
          ...data,
          status: getDisplayStatusForApplication(data.status, data.jobSource),
          id: data.id ?? d.id, // Ensure every record has an id
        }
      })

      // Update UI state with latest data
      setLiveApplications(next)
    })

    // Cleanup listener when component unmounts
    return () => unsub()
  }, [isLoaded, userId])

  // Handle status updates from the table
  const handleStatusChange = async (id: string, status: JobApplication['status']) => {
    if (!isLoaded || !userId) return // Update user status

    const target = liveApplications.find((app) => app.id === id)
    if (!target) return // Hirelytics-hosted jobs are recruiter-managed, User cannot update status

    if (target.jobSource === 'Hirelytics') return

    // Update status in Firestore
    await updateDoc(doc(db, 'users', userId, 'applications', id), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  // Handle notes updates from the table
  const handleNotesChange = async (id: string, notes: string) => {
    if (!isLoaded || !userId) return

    // Update notes in Firestore
    await updateDoc(doc(db, 'users', userId, 'applications', id), {
      notes,
      updatedAt: serverTimestamp(),
    })
  }

  // Opens the in-app confirmation modal before deleting an application
  const handleDeleteApplication = (id: string) => {
    const target = liveApplications.find((app) => String(app.id) === String(id))
    if (!target) return

    setApplicationToDelete(target)
  }

  // Deletes the application after the user confirms in the modal
  const confirmDeleteApplication = async () => {
    if (!isLoaded || !userId || !applicationToDelete) return

    const id = String(applicationToDelete.id)
    const isInternalJob = applicationToDelete.jobSource === 'Hirelytics'

    // For internal Hirelytics jobs, remove the applicant from the job posting too
    if (isInternalJob) {
      await updateDoc(doc(db, 'jobPostings', id), {
        applicantsId: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      })
    }

    // Delete the application from the user's applications subcollection
    await deleteDoc(doc(db, 'users', userId, 'applications', id))
    setApplicationToDelete(null)
  }

  return (
    <>
      {applicationToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
            <h2 className='text-lg font-semibold mb-2'>Delete application?</h2>

            <p className='text-sm text-gray-600 mb-6'>
              {applicationToDelete.jobSource === 'Hirelytics'
                ? 'Are you sure you want to delete this application? Your application will be withdrawn from consideration.'
                : 'Are you sure you want to delete this application?'}
            </p>

            <div className='flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setApplicationToDelete(null)}
                className='rounded border px-4 py-2 text-sm'
              >
                Cancel
              </button>

              <button
                type='button'
                onClick={confirmDeleteApplication}
                className='rounded bg-red-600 px-4 py-2 text-sm text-white'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8'>
        <div className='space-y-8'>
          {/* Dashboard overview section */}
          <section className='space-y-4'>
            <div>
              <h2 className='text-2xl font-bold mb-1'>Dashboard Overview</h2>
            </div>
            <HeroPanel applications={liveApplications} />
          </section>

          {/* Summary metrics section */}
          <section className='space-y-4'>
            <div>
              <h2 className='text-2xl font-bold mb-1'>Key Metrics</h2>
            </div>
            <SummaryCards applications={liveApplications} />
          </section>

          {/* Applications table section */}
          <section>
            <ApplicationsTable
              applications={liveApplications}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              onDeleteApplication={handleDeleteApplication}
            />
          </section>
        </div>
      </div>
    </>
  )
})

export default MyApplicationsPage
