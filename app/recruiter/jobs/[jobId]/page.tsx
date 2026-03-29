'use client'

import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../../lib/firebaseClient'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { formatDateWithYear } from '../../../utils/dateFormatter'
// Fixme(TODO - remove after Firebase init): Temporary JSON fallback for local testing only.
import { availableJobs } from '../../../data/availableJobs'

type DetailRecord = Record<string, unknown>
// Tracks snapshot payloads by context key so we can avoid synchronous setState in effect bodies.
type SnapshotState = { key: string; data: DetailRecord | null }

function isDetailRecord(value: unknown): value is DetailRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatValue(value: unknown): string {
  // Render missing values consistently in the UI.
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) {
    // Flatten arrays for display in text-based fields.
    return value.map((item) => formatValue(item)).join(', ')
  }
  if (typeof value === 'object') {
    // Preserve object data in a debuggable string form for additional fields.
    return JSON.stringify(value)
  }
  return String(value)
}

function toDateOnly(value: unknown): string {
  // Normalize Firestore timestamps and string/number dates into a date-only label.
  if (!value) return '—'

  if (typeof value === 'object' && value !== null) {
    if ('toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
      const parsed = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(parsed.getTime()) ? '—' : formatDateWithYear(parsed.toISOString())
    }

    if ('seconds' in value && typeof (value as { seconds?: unknown }).seconds === 'number') {
      const date = new Date((value as { seconds: number }).seconds * 1000)
      return Number.isNaN(date.getTime()) ? '—' : formatDateWithYear(date.toISOString())
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '—' : formatDateWithYear(parsed.toISOString())
  }

  return '—'
}

function toList(value: unknown): string[] {
  // Accept list-like values from multiple sources (array or delimited string).
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item).trim()).filter((item) => item && item !== '—')
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeJobSource(value: unknown): string {
  const formatted = formatValue(value)
  if (formatted === '—') return formatted

  return formatted.trim().toLowerCase() === 'available jobs' ? 'Hirelytics' : formatted
}

export default function JobDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, isLoaded } = useAuth()
  const { jobId } = useParams<{ jobId: string }>()

  // Job document listener state, keyed by `jobId`.
  const [jobSnapshotState, setJobSnapshotState] = useState<SnapshotState | null>(null)
  // Application listener state, keyed by `${userId}:${jobId}` to prevent stale cross-user data.
  const [applicationSnapshotState, setApplicationSnapshotState] = useState<SnapshotState | null>(
    null
  )

  // FIXME(TODO - remove after Firebase init): Temporary JSON fallback for local testing only.
  const jsonFallbackJob = useMemo(() => {
    // jobId is a string route param; match against availableJobs string IDs.
    if (!jobId) return null
    return availableJobs.find((job) => job.id === jobId) ?? null
  }, [jobId])

  useEffect(() => {
    // Subscribe to canonical job data from Firebase `jobs/{jobId}`.
    if (!jobId) return

    const unsub = onSnapshot(
      doc(db, 'jobs', jobId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setJobSnapshotState({ key: jobId, data: null })
          return
        }

        setJobSnapshotState({ key: jobId, data: { id: snapshot.id, ...snapshot.data() } })
      },
      () => {
        setJobSnapshotState({ key: jobId, data: null })
      }
    )

    return () => unsub()
  }, [jobId])

  useEffect(() => {
    // Subscribe to user-specific application data that may include job snapshots/metadata.
    if (!isLoaded || !userId || !jobId) return

    const snapshotKey = `${userId}:${jobId}`

    const unsub = onSnapshot(
      doc(db, 'users', userId, 'applications', jobId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setApplicationSnapshotState({ key: snapshotKey, data: null })
          return
        }

        setApplicationSnapshotState({
          key: snapshotKey,
          data: { id: snapshot.id, ...snapshot.data() },
        })
      },
      () => {
        setApplicationSnapshotState({ key: snapshotKey, data: null })
      }
    )

    return () => unsub()
  }, [isLoaded, userId, jobId])

  const currentJobKey = jobId ?? ''
  // Current user/job context key used to read the correct application snapshot.
  const currentApplicationKey = isLoaded && userId && jobId ? `${userId}:${jobId}` : null

  // Read only the job snapshot that belongs to the current route key.
  const jobDocData =
    jobSnapshotState && jobSnapshotState.key === currentJobKey ? jobSnapshotState.data : undefined

  // Read only the application snapshot for the current signed-in user + route key.
  const applicationDocData =
    currentApplicationKey &&
    applicationSnapshotState &&
    applicationSnapshotState.key === currentApplicationKey
      ? applicationSnapshotState.data
      : undefined

  // FIXME(TODO - remove after Firebase init):
  // `mergedJob` is explicitly typed as `DetailRecord` only because we merge a temporary JSON fallback
  // shape with Firebase data. When Firebase `jobs/{jobId}` is fully populated in all environments:
  // 1) remove `jsonFallbackJob` and the fallback `if (!firebaseHasData && jsonFallbackJob)` block below,
  // 2) remove `availableJobs` import + `jsonFallbackJob` useMemo,
  // 3) remove these `as DetailRecord` casts and tighten typing to Firebase-only data.
  const mergedJob = useMemo<DetailRecord>(() => {
    // Some application docs store a nested `jobDetails` object; safely merge when present.
    const applicationJobDetails = isDetailRecord(applicationDocData?.jobDetails)
      ? applicationDocData.jobDetails
      : {}

    // FIXME(TODO - remove after Firebase init): Temporary JSON fallback for local testing only.
    // Layer fallback data first so partial Firebase/application snapshots still render complete details.
    const fallbackJobData = jsonFallbackJob
      ? ({
          ...jsonFallbackJob,
          id: String(jsonFallbackJob.id),
        } as DetailRecord)
      : {}

    return {
      ...fallbackJobData,
      ...applicationDocData,
      ...applicationJobDetails,
      ...jobDocData,
    } as DetailRecord
  }, [applicationDocData, jobDocData, jsonFallbackJob])

  // Derived page/UI state.
  const hasJobData = Object.keys(mergedJob).length > 0
  // `undefined` means listener has not produced a value for current key yet => still loading.
  const loadingJobDoc = Boolean(jobId) && jobDocData === undefined
  // Same loading pattern for user application listener.
  const loadingApplicationDoc = Boolean(currentApplicationKey) && applicationDocData === undefined
  const loading = loadingJobDoc || loadingApplicationDoc
  const fromApplications = searchParams.get('from') === 'applications'

  const title =
    formatValue(mergedJob.title) !== '—'
      ? formatValue(mergedJob.title)
      : formatValue(mergedJob.position)
  const company =
    formatValue(mergedJob.company) !== '—'
      ? formatValue(mergedJob.company)
      : formatValue(mergedJob.companyName)
  const location =
    formatValue(mergedJob.location) !== '—'
      ? formatValue(mergedJob.location)
      : [mergedJob.city, mergedJob.country].filter(Boolean).join(', ') || '—'

  const jobDetailsText =
    formatValue(mergedJob.description) !== '—'
      ? formatValue(mergedJob.description)
      : formatValue(mergedJob.generalDescription)

  const requirements = toList(mergedJob.requirements)
  const optionalRequirements =
    toList(mergedJob.optionalRequirements).length > 0
      ? toList(mergedJob.optionalRequirements)
      : toList(mergedJob.preferredSkills).length > 0
        ? toList(mergedJob.preferredSkills)
        : toList(mergedJob.qualifications)

  // Date-only metadata shown in footer.
  const postedDate = toDateOnly(mergedJob.postedAt ?? mergedJob.postedDate ?? mergedJob.createdAt)
  const updatedDate = toDateOnly(mergedJob.updatedAt)

  const applicantInfoFields: Array<[label: string, value: string]> = [
    ['Employment Type', formatValue(mergedJob.employmentType ?? mergedJob.type)],
    ['Work Arrangement', formatValue(mergedJob.workArrangement ?? mergedJob.jobType)],
    ['Experience Level', formatValue(mergedJob.experienceLevel)],
    [
      'Compensation',
      formatValue(mergedJob.salary ?? mergedJob.hourlyRate ?? mergedJob.paymentAmount),
    ],
    ['Application Deadline', formatValue(mergedJob.applicationDeadline)],
    ['Visa Required', formatValue(mergedJob.visaRequired)],
    ['Contact Person', formatValue(mergedJob.contactPerson)],
    ...(fromApplications ? [['Job Source', normalizeJobSource(mergedJob.jobSource)] as const] : []),
    ['Application Status', formatValue(mergedJob.status)],
  ].filter((entry): entry is [string, string] => entry[1] !== '—')

  return (
    <div className='min-h-screen bg-background'>
      <main className='container mx-auto max-w-6xl px-6 py-8 space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          {/* Context-aware back navigation based on source page. */}
          <Button
            variant='outline'
            onClick={() => router.push('/recruiter/jobs')}
          >
            Back to Available Jobs
          </Button>
        </div>

        {loading ? (
          // Loading state while Firebase listeners initialize.
          <Card className='rounded-2xl'>
            <CardContent className='py-8 text-sm text-muted-foreground'>
              Loading job details...
            </CardContent>
          </Card>
        ) : hasJobData ? (
          // Primary content state when a job is found from Firebase or fallback JSON.
          <Card className='rounded-2xl border shadow-sm'>
            <CardHeader className='space-y-2'>
              <CardTitle className='text-3xl md:text-4xl font-bold tracking-tight'>
                {title === '—' ? 'Job Details' : title}
              </CardTitle>
              <div className='text-base text-muted-foreground'>
                {company}
                {location !== '—' ? ` • ${location}` : ''}
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Main narrative/details section. */}
              <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                <h3 className='text-xl font-semibold'>Job Details</h3>
                <p className='text-base text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                  {jobDetailsText}
                </p>
              </section>

              {/* Side-by-side required and optional qualifications. */}
              <section className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                  <h3 className='text-xl font-semibold'>Requirements</h3>
                  {requirements.length > 0 ? (
                    <ul className='text-base text-muted-foreground space-y-2'>
                      {requirements.map((requirement) => (
                        <li
                          key={requirement}
                          className='flex items-start gap-2'
                        >
                          <span className='text-primary mt-1'>•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-base text-muted-foreground'>
                      No required qualifications provided.
                    </p>
                  )}
                </div>

                <div className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                  <h3 className='text-xl font-semibold'>Optional Requirements</h3>
                  {optionalRequirements.length > 0 ? (
                    <ul className='text-base text-muted-foreground space-y-2'>
                      {optionalRequirements.map((requirement) => (
                        <li
                          key={requirement}
                          className='flex items-start gap-2'
                        >
                          <span className='text-primary mt-1'>•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-base text-muted-foreground'>
                      No optional requirements provided.
                    </p>
                  )}
                </div>
              </section>

              {applicantInfoFields.length > 0 ? (
                // Applicant-facing job metadata (status/source/compensation/etc).
                <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                  <h3 className='text-xl font-semibold'>Applicant Information</h3>
                  <dl className='grid grid-cols-1 md:grid-cols-2 gap-4 text-base'>
                    {applicantInfoFields.map(([label, value]) => (
                      <div key={label}>
                        <dt className='font-semibold'>{label}</dt>
                        <dd className='text-muted-foreground break-words'>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <div className='rounded-xl border-t pt-5'>
                {/* Posted/updated metadata grouped together at the bottom. */}
                <dl className='grid grid-cols-1 md:grid-cols-2 gap-4 text-base'>
                  <div>
                    <dt className='font-semibold'>Posted</dt>
                    <dd className='text-muted-foreground'>{postedDate}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold'>Updated</dt>
                    <dd className='text-muted-foreground'>{updatedDate}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Empty state when neither Firebase nor fallback provides a matching job.
          <Card className='rounded-2xl'>
            <CardContent className='py-8 text-sm text-muted-foreground'>
              No job details found in Firebase for this job.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
