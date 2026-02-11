'use client'

import { memo } from 'react'
import HeroPanel from '../components/HeroPanel'
import { SummaryCards } from '../components/SummaryCards'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { JobApplication } from '../data/mockData'
import { db } from '../lib/firebaseClient'
import { doc, setDoc } from 'firebase/firestore'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

// --- Firestore test component (temporary) ---
function FirestoreTest() {
  const { userId } = useAuth()

  async function testWrite() {
    if (!userId) {
      alert('You must be signed in to write to Firestore.')
      return
    }

    const ref = doc(db, 'users', userId, 'applications', 'hello')
    await setDoc(ref, { test: true, createdAt: new Date() })
    alert('Wrote test doc!')
  }

  return (
    <button
      onClick={testWrite}
      className='bg-blue-500 text-white p-2 rounded'
    >
      Test Firestore Write
    </button>
  )
}

// --- Main page component ---
interface MyApplicationsPageProps {
  applications: JobApplication[]
  onStatusChange?: (id: string, status: JobApplication['status']) => void
  onNotesChange?: (id: string, notes: string) => void
}

const MyApplicationsPage = memo(function MyApplicationsPage({
  applications,
  onStatusChange,
  onNotesChange,
}: MyApplicationsPageProps) {
  const { userId } = useAuth()
  const [liveApplications, setLiveApplications] = useState<JobApplication[]>(applications)

  // real-time listener for THIS user's applications
  useEffect(() => {
    if (!userId) return

    const q = query(
      collection(db, 'users', userId, 'applications'),
      orderBy('applicationDate', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => {
        const data = d.data() as JobApplication
        return {
          ...data,
          id: data.id ?? d.id,
        } as JobApplication
      })
      setLiveApplications(next)
    })

    return () => unsub()
  }, [userId])

  // save status changes to Firestore
  const handleStatusChange: MyApplicationsPageProps['onStatusChange'] = async (id, status) => {
    onStatusChange?.(id, status)
    if (!userId) return

    await updateDoc(doc(db, 'users', userId, 'applications', String(id)), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  //save notes changes to Firestore
  const handleNotesChange: MyApplicationsPageProps['onNotesChange'] = async (id, notes) => {
    onNotesChange?.(id, notes)
    if (!userId) return

    await updateDoc(doc(db, 'users', userId, 'applications', String(id)), {
      notes,
      updatedAt: serverTimestamp(),
    })
  }

  return (
    <div className='space-y-8'>
      <section>
        <h2 className='text-xl font-semibold mb-4'>Dashboard Overview</h2>
        <HeroPanel applications={liveApplications} />
      </section>

      {/* Testing Firebase Storage FIXME: DELETE LATER */}
      <FirestoreTest />

      {/* Summary Cards */}
      <section>
        <h2 className='text-xl font-semibold mb-4'>Key Metrics</h2>
        <SummaryCards applications={liveApplications} />
      </section>

      {/* Applications Table */}
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
