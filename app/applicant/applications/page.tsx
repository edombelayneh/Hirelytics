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
} from 'firebase/firestore'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

// FIXME: UI IS TWEAKING

const MyApplicationsPage = memo(function MyApplicationsPage() {
  // Get authenticated user and loading state from Clerk
  const { userId, isLoaded } = useAuth()

  // Store live application data from Firestore
  const [liveApplications, setLiveApplications] = useState<JobApplication[]>([])

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
    if (!isLoaded || !userId) return

    await updateDoc(doc(db, 'users', userId, 'applications', id), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  // Handle notes updates from the table
  const handleNotesChange = async (id: string, notes: string) => {
    if (!isLoaded || !userId) return

    await updateDoc(doc(db, 'users', userId, 'applications', id), {
      notes,
      updatedAt: serverTimestamp(),
    })
  }

  return (
    <div className='space-y-8'>
      {/* Dashboard overview section */}
      <section>
        <h2 className='text-xl font-semibold mb-4'>Dashboard Overview</h2>
        <HeroPanel applications={liveApplications} />
      </section>

      {/* Summary metrics section */}
      <section>
        <h2 className='text-xl font-semibold mb-4'>Key Metrics</h2>
        <SummaryCards applications={liveApplications} />
      </section>

      {/* Applications table section */}
      <section>
        <ApplicationsTable
          applications={liveApplications}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      </section>
    </div>
  )
})

export default MyApplicationsPage
