'use client'

import { AvailableJobsList } from '../components/AvailableJobsList'
import { AvailableJob } from '../data/availableJobs'

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
