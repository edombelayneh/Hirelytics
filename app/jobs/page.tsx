'use client'

import { AvailableJobsList } from '../components/AvailableJobsList'
import { AvailableJob } from '../data/availableJobs'
import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Plus } from 'lucide-react'

interface JobsPageProps {
  onAddApplication: (job: AvailableJob) => void
  appliedJobIds: Set<number>
}

function Jobs({ onAddApplication, appliedJobIds }: JobsPageProps) {
  const handleApply = (job: AvailableJob) => {
    onAddApplication(job)
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* HEADER SECTION HERE */}
      <header className='border-b'>
        <div className='container mx-auto px-6 py-4 flex items-center justify-between'>
          <h1 className='text-2xl font-bold'>Available Jobs</h1>

          {/* 🔥 THIS IS YOUR BUTTON — ADD NEW JOB 🔥 */}
          <Link href='/addNewJob'>
            <Button size='sm'>
              <Plus className='h-4 w-4 mr-2' />
              Add Job
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
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
