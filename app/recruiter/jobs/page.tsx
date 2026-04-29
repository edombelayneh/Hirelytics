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
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  // Jobs fetched from Firestore jobPostings collection
  const [jobs, setJobs] = useState<AvailableJob[]>([])
  // Access user metadata (e.g., role-based logic if needed)
  const { user } = useUser()
  const role = (user?.publicMetadata?.role as Role | undefined) ?? null

  // Ref to track if component is mounted
  const mountedRef = useRef(false)

  // Subscribe to jobPostings collection so new jobs appear in real-time
  useEffect(() => {
    const ref = collection(db, 'jobPostings')
    const unsub = onSnapshot(ref, (snap) => {
      const fetched = snap.docs.map((doc: unknown) => {
        const maybeDoc = doc as { id?: string; data?: unknown }
        let dataObj: Record<string, unknown> = {}

        if (typeof maybeDoc.data === 'function') {
          const d = (maybeDoc.data as () => unknown)()
          if (typeof d === 'object' && d !== null) dataObj = d as Record<string, unknown>
        } else if (typeof maybeDoc.data === 'object' && maybeDoc.data !== null) {
          dataObj = maybeDoc.data as Record<string, unknown>
        } else if (typeof doc === 'object' && doc !== null) {
          dataObj = doc as Record<string, unknown>
        }

        const merged = Object.assign({ id: maybeDoc.id ?? '' }, dataObj)
        return merged as AvailableJob
      })

      setJobs(fetched)

      // Dev-only: log jobs missing required fields so we can diagnose filtered-out items
      if (process.env.NODE_ENV === 'development') {
        const missing = fetched
          .map((j) => ({
            id: j.id,
            title: Boolean(j.title),
            company: Boolean(j.company),
            location: Boolean(j.location),
            salary: Boolean(j.salary),
            description: Boolean(j.description),
            postedDate: Boolean(j.postedDate),
          }))
          .filter(
            (m) =>
              !(m.title && m.company && m.location && m.salary && m.description && m.postedDate)
          )

        if (missing.length > 0) {
          console.table(missing)
        }
      }
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Wait until Clerk finishes loading and user exists
    if (!isLoaded || !userId) return

    // Reference this user's applications collection
    const ref = collection(db, 'users', userId, 'applications')

    // Listen for real-time updates
    const unsub = onSnapshot(ref, (snap) => {
      if (!mountedRef.current) return

      const ids = new Set<string>()

      snap.docs.forEach((doc) => {
        ids.add(doc.id)
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
            jobs={jobs}
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
