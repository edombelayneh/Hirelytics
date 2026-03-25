'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/app/lib/firebaseClient'
import { Button } from '@/app/components/ui/button'
import { RecruiterJobCard } from '../../components/RecruiterJobCard'
import { EmptyMyJobs } from '../../components/EmptyMyJobs'
import type { RecruiterJob } from '../../types/recruiterJobs'

export default function RecruiterMyJobsPage() {
  const { userId, isLoaded } = useAuth()
  // Jobs posted by this recruiter, fetched in real-time from Firestore
  const [jobs, setJobs] = useState<RecruiterJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !userId) return

    // Only fetch jobs where recruiterId matches the logged-in user
    const q = query(collection(db, 'jobPostings'), where('recruiterId', '==', userId))

    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title ?? '',
          company: data.company ?? '',
          location: data.location,
          type: data.type,
          postedAt: data.postedDate,
          status: data.status,
          // Derive applicant count from the applicantsId array length
          applicantsCount: Array.isArray(data.applicantsId) ? data.applicantsId.length : 0,
          description: data.description,
        } as RecruiterJob
      })
      setJobs(fetched)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => unsub()
  }, [isLoaded, userId])

  return (
    <div className='min-h-screen bg-background'>
      <main className='container mx-auto px-6 py-8 space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold'>My Jobs</h1>
            <p className='text-sm text-muted-foreground'>
              Manage the jobs you&apos;ve posted and review applicants.
            </p>
          </div>

          <Button asChild>
            <Link href='/recruiter/addNewJob'>Post new job</Link>
          </Button>
        </div>

        {loading ? (
          <p className='text-sm text-muted-foreground'>Loading your jobs...</p>
        ) : jobs.length === 0 ? (
          <EmptyMyJobs />
        ) : (
          <div className='grid gap-4'>
            {jobs.map((job) => (
              <RecruiterJobCard
                key={job.id}
                job={job}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
