'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { JobDetailsCard } from '../../../components/job/JobDetailsCard'
import { ApplicantsTable } from '../../../components/job/ApplicantsTable'
import type { Applicant, Job } from '../../../types/job'
import { Navbar } from '../../../components/Navbar'

export default function JobDetailsPage() {
  const params = useParams<{ jobId: string }>()
  const jobId = params.jobId

  // TODO: replace with Firestore fetch
  const job: Job = {
    id: jobId,
    title: 'Software Engineer Intern',
    company: 'Hirelytics',
    location: 'Remote',
    type: 'Internship',
    postedAt: '2026-02-21',
    description: 'Skeleton description here...',
  }

  // TODO: replace with Firestore fetch
  const applicants: Applicant[] = [
    {
      id: 'a1',
      firstName: 'Edom',
      lastName: 'Belayneh',
      resumeUrl: '/sample-resume.pdf',
      resumeFileName: 'Edom_Belayneh_Resume.pdf',
      linkedinUrl: 'https://www.linkedin.com/in/edombelayneh',
      portfolioUrl: 'https://www.edombelayneh.com',
    },
    {
      id: 'a2',
      firstName: 'Jessie',
      lastName: 'Servis',
      resumeUrl: '/sample-resume.pdf',
      resumeFileName: 'Jessics_Servis_Resume.pdf',
      linkedinUrl: 'https://www.linkedin.com/in/jessieservis',
      portfolioUrl: 'https://www.jessieservis.com',
    },
    {
      id: 'a3',
      firstName: 'Emma',
      lastName: 'Vandenstorm',
      resumeUrl: '/sample-resume.pdf',
      resumeFileName: 'Emma_Vandenstorm_Resume.pdf',
      linkedinUrl: 'https://www.linkedin.com/in/emma-vandenstorm',
      portfolioUrl: 'https://www.emmavandenstorm.com',
    },
  ]
  return (
    <div className='min-h-screen bg-background'>
      <Navbar />

      <main className='mx-auto max-w-6xl px-6 py-6 space-y-6'>
        <div>
          <Button
            asChild
            variant='outline'
          >
            <Link href='/recruiter/myJobs'>Return to my jobs</Link>
          </Button>
        </div>

        <div className='grid gap-6 md:grid-cols-[380px_1fr]'>
          <JobDetailsCard job={job} />

          <ApplicantsTable
            applicants={applicants}
            profileHref={(applicantId) => `/recruiter/applicants/${applicantId}`}
          />
        </div>
      </main>
    </div>
  )
}
