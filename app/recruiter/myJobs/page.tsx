'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Navbar } from '@/app/components/Navbar'
import { RecruiterJobCard } from '../../components/RecruiterJobCard'
import { EmptyMyJobs } from '../../components/EmptyMyJobs'
import type { RecruiterJob } from '../../types/recruiterJobs'

export default function RecruiterMyJobsPage() {
  // TODO: replace with Firestore fetch for recruiter jobs
  const jobs = useMemo<RecruiterJob[]>(
    () => [
      {
        id: 'job-1',
        title: 'Software Engineer Intern',
        company: 'Hirelytics',
        location: 'Remote',
        type: 'Internship',
        postedAt: '2026-02-21',
        status: 'Open',
        applicantsCount: 3,
        description: 'Work on the Hirelytics platform...',
      },
      {
        id: 'job-2',
        title: 'Frontend Engineer',
        company: 'Hirelytics',
        location: 'Detroit, MI',
        type: 'Full-time',
        postedAt: '2026-02-10',
        status: 'Paused',
        applicantsCount: 0,
        description: 'Build UI features in Next.js...',
      },
    ],
    []
  )

  return (
    <div className='min-h-screen bg-background'>
      <main className='container mx-auto px-6 py-8 space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold'>My Jobs</h1>
            <p className='text-sm text-muted-foreground'>
              Manage the jobs you’ve posted and review applicants.
            </p>
          </div>

          <Button asChild>
            <Link href='/recruiter/addNewJob'>Post new job</Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
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
