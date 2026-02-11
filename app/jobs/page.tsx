'use client'

import { useEffect, useState } from 'react'
import { AvailableJobsList } from '../components/AvailableJobsList'
import { AvailableJob } from '../data/availableJobs'
import { useAuth } from '@clerk/nextjs'
import { db } from '../lib/firebaseClient'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'

interface JobsPageProps {
  onAddApplication: (job: AvailableJob) => void
}

function Jobs({ onAddApplication }: JobsPageProps) {
  const { userId } = useAuth()

  //THIS is what disables Apply Now
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())

  //Listen to this user's applications
  useEffect(() => {
    if (!userId) return

    const ref = collection(db, 'users', userId, 'applications')

    const unsub = onSnapshot(ref, (snap) => {
      const ids = new Set<number>()
      snap.docs.forEach((doc) => {
        const id = Number(doc.id)
        if (!isNaN(id)) ids.add(id)
      })
      setAppliedJobIds(ids)
    })

    return () => unsub()
  }, [userId])

  const handleApply = async (job: AvailableJob) => {
    // Prevent double-clicks immediately
    if (appliedJobIds.has(job.id)) return

    onAddApplication(job)

    if (!userId) return

    const ref = doc(db, 'users', userId, 'applications', String(job.id))

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
      { merge: true }
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <main className='container mx-auto px-6 py-8 space-y-8'>
        <section>
          <AvailableJobsList
            onApply={handleApply}
            appliedJobIds={appliedJobIds}
          />
        </section>
      </main>
    </div>
  )
}

export default Jobs
