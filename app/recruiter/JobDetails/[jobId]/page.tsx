'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebaseClient'
import { Button } from '../../../components/ui/button'
import { JobDetailsCard } from '../../../components/job/JobDetailsCard'
import { ApplicantsTable } from '../../../components/job/ApplicantsTable'
import {
  INTERNAL_APPLICATION_STATUSES,
  type Applicant,
  type Job,
  type ApplicationStatus,
} from '../../../types/job'
import { getDisplayStatusForApplication } from '../../../utils/applicationStatus'

//status for user applications
const VALID_STATUSES: ApplicationStatus[] = [
  ...INTERNAL_APPLICATION_STATUSES,
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'resume stage',
  'assessments',
  'phone call',
  'Interviews (behavioral or technical)',
  'Offers and Negotiations',
  'Phase I: resume stage',
  'Phase II: assessments and phone calls',
  'assessments and phone calls',
  'Phase III: interviews (behavioral or technical)',
  'Phase IV: offers and negotiations',
]

function toApplicationStatus(value: unknown): ApplicationStatus {
  return VALID_STATUSES.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : 'APPLIED'
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
          const resolvedJobSource =
            typeof applicationData.jobSource === 'string' ? applicationData.jobSource : 'Hirelytics'

          return {
            id: uid,
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            resumeUrl: profile.resumeFile,
            resumeFileName: profile.resumeFileName,
            linkedinUrl: profile.linkedinUrl,
            portfolioUrl: profile.portfolioUrl,
            applicationStatus: getDisplayStatusForApplication(
              toApplicationStatus(applicationData.status),
              resolvedJobSource
            ),
            jobSource: resolvedJobSource,
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
      <main className='mr-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 space-y-6'>
        <div>
          <Button
            asChild
            variant='outline'
          >
            <Link href='/recruiter/myJobs'>Return to my jobs</Link>
          </Button>
        </div>

        <div className='grid gap-6 md:grid-cols-[340px_minmax(0,1fr)]'>
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
