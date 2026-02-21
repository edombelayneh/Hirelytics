'use client'

import { useEffect, useState } from 'react'
import { AvailableJobsList } from '../../components/AvailableJobsList'
import { AvailableJob } from '../../data/availableJobs'
import { useAuth, useUser } from '@clerk/nextjs'
import { db } from '../../lib/firebaseClient'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'

function Jobs() {
  // Get Clerk authentication state
  const { userId, isLoaded } = useAuth()

  // Stores job IDs the user has already applied to
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const { user } = useUser()
  const role = user?.publicMetadata?.role

  useEffect(() => {
    // Wait until Clerk finishes loading and user exists
    if (!isLoaded || !userId) return

    // Reference this user's applications collection
    const ref = collection(db, 'users', userId, 'applications')

    // Listen for real-time updates
    const unsub = onSnapshot(ref, (snap) => {
      const ids = new Set<number>()

      // Convert document IDs (stored as strings) back to numbers
      snap.docs.forEach((doc) => {
        const id = Number(doc.id)
        if (!isNaN(id)) ids.add(id)
      })

      // Update state so Apply buttons disable correctly
      setAppliedJobIds(ids)
    })

    // Cleanup listener when component unmounts
    return () => unsub()
  }, [isLoaded, userId])

  const handleApply = async (job: AvailableJob) => {
    if (appliedJobIds.has(job.id)) return
    if (!isLoaded || !userId) return

    const ref = doc(db, 'users', userId, 'applications', String(job.id))

    // Save application record to Firestore
    await setDoc(
      ref,
      {
        id: String(job.id),
        company: job.company ?? '',
        position: job.title ?? '',
        country: '',
        city: job.location ?? '',
        applicationDate: new Date().toISOString(),
        status: 'Applied',
        contactPerson: '',
        jobSource: 'Available Jobs',
        outcome: 'Pending',
        notes: '',
        jobLink: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true } // Prevent overwriting existing data
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Main layout container */}
      <main className='container mx-auto px-6 py-8 space-y-8'>
        <section>
          <AvailableJobsList
            onApply={handleApply}
            appliedJobIds={appliedJobIds} // Controls disabled Apply buttons
          />
        </section>
      </main>
    </div>
  )
}

export default Jobs
