'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebaseClient'
import { Button } from '../../../components/ui/button'
import { JobDetailsCard } from '../../../components/job/JobDetailsCard'
import { ApplicantsTable } from '../../../components/job/ApplicantsTable'
import type { Applicant, Job, ApplicationStatus } from '../../../types/job'

//status for user applications
const VALID_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
]

function toApplicationStatus(value: unknown): ApplicationStatus {
  return VALID_STATUSES.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : 'Applied'
}

export default function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>()

  // Job posting data fetched from jobPostings collection
  const [job, setJob] = useState<Job | null>(null)
  // Applicant profiles resolved from users/{uid}.profile for each id in applicantsId
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loadingJob, setLoadingJob] = useState(true)

  // Subscribe to the job posting in real-time
  useEffect(() => {
    if (!jobId) return

    const unsub = onSnapshot(doc(db, 'jobPostings', jobId), async (snap) => {
      if (!snap.exists()) {
        setLoadingJob(false)
        return
      }

      const data = snap.data()

      setJob({
        id: snap.id,
        title: data.title ?? '',
        company: data.company,
        location: data.location,
        type: data.type,
        postedAt: data.postedDate,
        description: data.description,
      })

      // Fetch profile for each applicant userId stored in applicantsId
      const applicantIds: string[] = Array.isArray(data.applicantsId) ? data.applicantsId : []

      // Fetch each applicant's profile from users/{uid}.profile in parallel
      const profiles = await Promise.all(
        applicantIds.map(async (uid) => {
          const [userSnap, applicationSnap] = await Promise.all([
            getDoc(doc(db, 'users', uid)),
            getDoc(doc(db, 'users', uid, 'applications', jobId)),
          ])

          const profile = userSnap.exists() ? (userSnap.data()?.profile ?? {}) : {}
          const applicationData = applicationSnap.exists() ? (applicationSnap.data() ?? {}) : {}

          return {
            id: uid,
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            resumeUrl: profile.resumeFile,
            resumeFileName: profile.resumeFileName,
            linkedinUrl: profile.linkedinUrl,
            portfolioUrl: profile.portfolioUrl,
            applicationStatus: toApplicationStatus(applicationData.status),
            jobSource:
              typeof applicationData.jobSource === 'string'
                ? applicationData.jobSource
                : 'Hirelytics',
          } as Applicant
        })
      )

      setApplicants(profiles)
      setLoadingJob(false)
    })

    return () => unsub()
  }, [jobId])

  if (loadingJob) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='text-sm text-muted-foreground'>Loading job details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='text-sm text-muted-foreground'>Job not found.</p>
      </div>
    )
  }
  const handleApplicantStatusChange = async (applicantId: string, status: ApplicationStatus) => {
    if (!jobId) return

    await updateDoc(doc(db, 'users', applicantId, 'applications', jobId), {
      status,
      updatedAt: serverTimestamp(),
    })

    setApplicants((prev) =>
      prev.map((applicant) =>
        applicant.id === applicantId
          ? {
              ...applicant,
              applicationStatus: status,
            }
          : applicant
      )
    )
  }
  return (
    <div className='min-h-screen bg-background'>
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
            onStatusChange={handleApplicantStatusChange}
          />
        </div>
      </main>
    </div>
  )
}
