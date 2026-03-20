'use client'

import { useEffect, useState, useRef } from 'react'
import { AvailableJobsList } from '../../components/AvailableJobsList'
import { AvailableJob } from '../../data/availableJobs'
import type { Role } from '../../utils/userRole'
import { applyToAvailableJob } from '../../utils/applicationFirebase'
import { useAuth, useUser } from '@clerk/nextjs'
import { db } from '../../lib/firebaseClient'
import { collection, onSnapshot } from 'firebase/firestore'

function Jobs() {
  // Get Clerk authentication state
  const { userId, isLoaded } = useAuth()

  // Stores job IDs the user has already applied to
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  // Access user metadata (e.g., role-based logic if needed)
  const { user } = useUser()
  const role = (user?.publicMetadata?.role as Role | undefined) ?? null

  // Ref to track if component is mounted
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    // Wait until Clerk finishes loading and user exists
    if (!isLoaded || !userId) return

    // Reference this user's applications collection
    const ref = collection(db, 'users', userId, 'applications')

    // Listen for real-time updates
    const unsub = onSnapshot(ref, (snap) => {
      if (!mountedRef.current) return

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
    return () => {
      mountedRef.current = false
      unsub()
    }
  }, [isLoaded, userId])

  const handleApply = async (job: AvailableJob) => {
    // Prevent duplicate applications
    if (appliedJobIds.has(job.id)) return
    // Ensure authenticated user exists before writing to Firestore
    if (!isLoaded || !userId) return
    // Save application record to Firestore
    await applyToAvailableJob({ userId, job })
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Main layout container */}
      <main className='container mx-auto px-6 py-8 space-y-8'>
        <section>
          <AvailableJobsList
            onApply={handleApply}
            appliedJobIds={appliedJobIds} // Controls disabled Apply buttons
            role={role}
          />
        </section>
      </main>
    </div>
  )
}

export default Jobs
