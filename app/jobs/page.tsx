'use client'

import { AvailableJobsList } from '../components/AvailableJobsList'
import { AvailableJob } from '../data/availableJobs'
import { JobApplication } from '../data/mockData'
import { parseLocation } from '../utils/locationParser'
import { getCurrentDateString } from '../utils/dateFormatter'
import { toast } from '../components/ui/sonner'

interface JobsPageProps {
  onAddApplication?: (app: JobApplication) => void
  appliedJobIds?: Set<number>
}

function Jobs({ onAddApplication, appliedJobIds = new Set() }: JobsPageProps) {
  const handleApply = (job: AvailableJob) => {
    const { city, country } = parseLocation(job.location)
    const newApplication: JobApplication = {
      id: `app-${Date.now()}`,
      company: job.company,
      country,
      city,
      jobLink: job.applyLink,
      position: job.title,
      applicationDate: getCurrentDateString(),
      status: 'Applied',
      contactPerson: '',
      notes: `Applied via job board. ${job.type} position.`,
      jobSource: 'Other',
      outcome: 'Pending',
    }

    if (onAddApplication) {
      onAddApplication(newApplication)
      toast.success(`Successfully applied to ${job.title} at ${job.company}!`, {
        description: 'Your application has been added to the tracker.',
      })
      window.location.pathname = '/applications'
    }
  }

  return (
    <div className="min-h-screen bg-background">
     

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
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

