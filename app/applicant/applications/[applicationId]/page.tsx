'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { deleteField, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/app/lib/firebaseClient'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import type { JobApplication, FeedbackEntry } from '@/app/data/mockData'
import { formatDateWithYear } from '@/app/utils/dateFormatter'

type DetailRecord = Record<string, unknown>

function isDetailRecord(value: unknown): value is DetailRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function toDateOnly(value: unknown): string {
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

// ── page ──────────────────────────────────────────────────────────────────

const VALID_TABS = ['job-posting', 'my-details', 'feedback'] as const
type TabValue = (typeof VALID_TABS)[number]

export default function ApplicationDetailsPage() {
  const router = useRouter()
  const { applicationId } = useParams<{ applicationId: string }>()
  const { userId, isLoaded } = useAuth()
  // Reads ?tab= from the URL so deep-links (e.g. from the mail icon) open the correct tab.
  // Unknown values fall back to 'job-posting' so Radix always has a valid initial tab.
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab')
  const defaultTab: TabValue = VALID_TABS.includes(rawTab as TabValue)
    ? (rawTab as TabValue)
    : 'job-posting'

  const [application, setApplication] = useState<JobApplication | null>(null)
  // undefined = listener not yet resolved; null = doc doesn't exist
  const [jobDoc, setJobDoc] = useState<DetailRecord | null | undefined>(undefined)
  const [loadingApp, setLoadingApp] = useState(true)
  // Local notes state kept in sync with Firestore on first load only
  const [notes, setNotes] = useState('')
  const notesInitialized = useRef(false)
  // Tracks in-flight Firestore write to disable the Save button
  const [savingNotes, setSavingNotes] = useState(false)
  // Local company contact state kept in sync with Firestore on first load only
  const [companyContact, setCompanyContact] = useState('')
  const contactInitialized = useRef(false)
  const [savingContact, setSavingContact] = useState(false)

  // Subscribe to the user's application document in real-time
  useEffect(() => {
    if (!isLoaded || !userId) return
    const ref = doc(db, 'users', userId, 'applications', applicationId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as JobApplication
        setApplication(data)
        if (!notesInitialized.current) {
          setNotes(data.notes ?? '')
          notesInitialized.current = true
        }
        if (!contactInitialized.current) {
          setCompanyContact(data.companyContact ?? '')
          contactInitialized.current = true
        }
      }
      setLoadingApp(false)
    })
    return () => unsub()
  }, [isLoaded, userId, applicationId])

  // Marks feedback seen on mount when the URL deep-links directly to the Feedback tab.
  useEffect(() => {
    if (defaultTab !== 'feedback' || !userId || !application) return
    const hasFeedback =
      (application.feedbackHistory?.length ?? 0) > 0 ||
      !!application.recruiterFeedback ||
      !!application.rejectionExplanation
    if (!hasFeedback || application.recruiterFeedbackSeen) return
    void updateDoc(doc(db, 'users', userId, 'applications', applicationId), {
      recruiterFeedbackSeen: true,
    }).catch(console.error)
  }, [application, defaultTab, userId, applicationId])

  // Marks recruiter feedback as seen when user manually switches to the Feedback tab
  const handleTabChange = async (value: string) => {
    if (value !== 'feedback' || !userId || !application) return
    if (application.recruiterFeedbackSeen) return
    await updateDoc(doc(db, 'users', userId, 'applications', applicationId), {
      recruiterFeedbackSeen: true,
    })
  }

  // Persists edited notes back to the user's application document in Firestore
  const handleSaveNotes = async () => {
    if (!userId) return
    setSavingNotes(true)
    await updateDoc(doc(db, 'users', userId, 'applications', applicationId), {
      notes,
      updatedAt: serverTimestamp(),
    })
    setSavingNotes(false)
  }

  const handleSaveContact = async () => {
    if (!userId) return
    setSavingContact(true)
    const trimmed = companyContact.trim()
    await updateDoc(doc(db, 'users', userId, 'applications', applicationId), {
      ...(trimmed ? { companyContact: trimmed } : { companyContact: deleteField() }),
      updatedAt: serverTimestamp(),
    })
    setSavingContact(false)
  }

  const handleDeleteContact = async () => {
    if (!userId) return
    setSavingContact(true)
    await updateDoc(doc(db, 'users', userId, 'applications', applicationId), {
      companyContact: deleteField(),
      updatedAt: serverTimestamp(),
    })
    setCompanyContact('')
    setSavingContact(false)
  }

  // Subscribe to the job posting document
  useEffect(() => {
    if (!applicationId) return
    const unsub = onSnapshot(
      doc(db, 'jobPostings', applicationId),
      (snap) => {
        setJobDoc(snap.exists() ? ({ id: snap.id, ...snap.data() } as DetailRecord) : null)
      },
      () => setJobDoc(null)
    )
    return () => unsub()
  }, [applicationId])

  // Merge jobPostings doc with the nested jobDetails stored on the application
  const mergedJob = useMemo<DetailRecord>(() => {
    const appJobDetails = isDetailRecord((application as unknown as DetailRecord)?.jobDetails)
      ? ((application as unknown as DetailRecord).jobDetails as DetailRecord)
      : {}
    return {
      ...appJobDetails,
      ...(jobDoc ?? {}),
    }
  }, [application, jobDoc])

  // Still loading if the Firestore listener hasn't returned a value yet
  const loadingJob = jobDoc === undefined
  // Show spinner until both the application doc and job posting have resolved
  const loading = loadingApp || loadingJob

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='text-muted-foreground'>Application not found.</p>
      </div>
    )
  }

  const isExternalJob = application.isExternal === true

  // Job posting derived values
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
  // Build a unified list of feedback entries from the new array field plus legacy scalar fields.
  // Newest entries are shown first.
  const feedbackEntries: FeedbackEntry[] = (() => {
    const entries: FeedbackEntry[] = [...(application.feedbackHistory ?? [])]

    // Legacy: scalar recruiterFeedback written before feedbackHistory existed
    if (!entries.length && application.recruiterFeedback) {
      entries.push({
        reason: application.rejectionReason ?? '',
        text: application.recruiterFeedback,
        sentAt: (application.recruiterFeedbackAt ??
          application.rejectedAt ??
          '') as FeedbackEntry['sentAt'],
      })
    } else if (!entries.length && application.rejectionExplanation) {
      entries.push({
        reason: application.rejectionReason ?? '',
        text: application.rejectionExplanation,
        sentAt: (application.rejectedAt ?? '') as FeedbackEntry['sentAt'],
      })
    }

    return entries.slice().reverse()
  })()

  const postedDate = toDateOnly(mergedJob.postedAt ?? mergedJob.postedDate ?? mergedJob.createdAt)
  const updatedDate = toDateOnly(mergedJob.updatedAt)

  const metaFields: Array<[string, string]> = [
    ['Employment Type', formatValue(mergedJob.employmentType ?? mergedJob.type)],
    ['Work Arrangement', formatValue(mergedJob.workArrangement ?? mergedJob.jobType)],
    ['Experience Level', formatValue(mergedJob.experienceLevel)],
    [
      'Compensation',
      formatValue(mergedJob.salary ?? mergedJob.hourlyRate ?? mergedJob.paymentAmount),
    ],
    ['Application Deadline', formatValue(mergedJob.applicationDeadline)],
  ].filter((entry): entry is [string, string] => entry[1] !== '—')

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto max-w-6xl px-6 py-8 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            onClick={() => router.push('/applicant/applications')}
          >
            Back to My Applications
          </Button>
          {application.jobLink ? (
            <Button asChild>
              <Link
                href={application.jobLink}
                target='_blank'
                rel='noreferrer'
              >
                Open Job Posting
              </Link>
            </Button>
          ) : null}
        </div>

        {/* Tabs */}
        <Tabs
          // Opens on the tab from the URL param; marks feedback seen on every tab switch
          defaultValue={defaultTab}
          onValueChange={handleTabChange}
        >
          {/* Title + tab switcher on the same row */}
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>{application.position}</h1>
              <p className='text-muted-foreground mt-1'>{application.company}</p>
            </div>
            <TabsList className='shrink-0'>
              <TabsTrigger value='job-posting'>Job Posting</TabsTrigger>
              <TabsTrigger value='my-details'>My Details</TabsTrigger>
              {!isExternalJob && <TabsTrigger value='feedback'>Feedback</TabsTrigger>}
            </TabsList>
          </div>

          {/* ── Job Posting tab ── */}
          <TabsContent
            value='job-posting'
            className='space-y-4 mt-4'
          >
            {jobDoc === null ? (
              <Card className='rounded-2xl'>
                <CardContent className='py-8 text-sm text-muted-foreground'>
                  No job posting found for this application.
                </CardContent>
              </Card>
            ) : (
              <Card className='rounded-2xl border shadow-sm'>
                <CardHeader className='space-y-2'>
                  <CardTitle className='text-2xl font-bold'>
                    {title === '—' ? 'Job Details' : title}
                  </CardTitle>
                  <div className='text-sm text-muted-foreground'>
                    {company}
                    {location !== '—' ? ` • ${location}` : ''}
                  </div>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                    <h3 className='text-lg font-semibold'>Job Details</h3>
                    <p className='text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                      {jobDetailsText}
                    </p>
                  </section>

                  <section className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                      <h3 className='text-lg font-semibold'>Requirements</h3>
                      {requirements.length > 0 ? (
                        <ul className='text-sm text-muted-foreground space-y-2'>
                          {requirements.map((req) => (
                            <li
                              key={req}
                              className='flex items-start gap-2'
                            >
                              <span className='text-primary mt-1'>•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='text-sm text-muted-foreground'>
                          No required qualifications provided.
                        </p>
                      )}
                    </div>

                    <div className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                      <h3 className='text-lg font-semibold'>Optional Requirements</h3>
                      {optionalRequirements.length > 0 ? (
                        <ul className='text-sm text-muted-foreground space-y-2'>
                          {optionalRequirements.map((req) => (
                            <li
                              key={req}
                              className='flex items-start gap-2'
                            >
                              <span className='text-primary mt-1'>•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='text-sm text-muted-foreground'>
                          No optional requirements provided.
                        </p>
                      )}
                    </div>
                  </section>

                  {metaFields.length > 0 && (
                    <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                      <h3 className='text-lg font-semibold'>Job Information</h3>
                      <dl className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                        {metaFields.map(([label, value]) => (
                          <div key={label}>
                            <dt className='font-semibold'>{label}</dt>
                            <dd className='text-muted-foreground'>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}

                  <div className='rounded-xl border-t pt-5'>
                    <dl className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
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
            )}
          </TabsContent>

          {/* ── My Details tab ── */}
          <TabsContent
            value='my-details'
            className='mt-4'
          >
            <Card className='rounded-2xl border shadow-sm'>
              <CardContent className='space-y-6 pt-6'>
                {/* Application status fields */}
                <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                  <h3 className='text-lg font-semibold'>Application Details</h3>
                  <dl className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <div>
                      <dt className='font-semibold'>Status</dt>
                      <dd className='text-muted-foreground'>{application.status}</dd>
                    </div>
                    <div>
                      <dt className='font-semibold'>Applied</dt>
                      <dd className='text-muted-foreground'>
                        {formatDateWithYear(application.applicationDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className='font-semibold'>Location</dt>
                      <dd className='text-muted-foreground'>
                        {application.city}, {application.country}
                      </dd>
                    </div>
                    <div>
                      <dt className='font-semibold'>Source</dt>
                      <dd className='text-muted-foreground'>{application.jobSource}</dd>
                    </div>
                  </dl>
                </section>

                {/* Company Contact */}
                <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                  <h3 className='text-lg font-semibold'>Company Contact</h3>
                  <Input
                    value={companyContact}
                    onChange={(e) => setCompanyContact(e.target.value)}
                    placeholder='Recruiter or hiring manager name'
                    className='text-sm'
                  />
                  <div className='flex justify-between items-center'>
                    {application.companyContact ? (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleDeleteContact}
                        disabled={savingContact}
                      >
                        Delete
                      </Button>
                    ) : (
                      <div />
                    )}
                    <Button
                      size='sm'
                      onClick={handleSaveContact}
                      disabled={savingContact}
                    >
                      {savingContact ? 'Saving...' : 'Save Contact'}
                    </Button>
                  </div>
                </section>

                {/* Notes */}
                <section className='rounded-xl border bg-muted/20 p-5 space-y-3'>
                  <h3 className='text-lg font-semibold'>Notes</h3>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder='Add notes about this application...'
                    className='min-h-[120px] text-sm'
                  />
                  <div className='flex justify-end'>
                    <Button
                      size='sm'
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Feedback tab ── */}
          {!isExternalJob && (
            <TabsContent
              value='feedback'
              className='mt-4'
            >
              {feedbackEntries.length === 0 ? (
                <Card className='rounded-2xl border shadow-sm'>
                  <CardContent className='py-16 flex flex-col items-center justify-center text-center space-y-3'>
                    <h3 className='font-semibold text-base'>No feedback yet</h3>
                    <p className='text-sm text-muted-foreground max-w-xs'>
                      Recruiter feedback will appear here once it has been shared with you.
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      You&apos;ll be notified when feedback is available.
                    </p>
                    <div className='rounded-lg border bg-muted/20 px-4 py-2 text-sm'>
                      <span className='text-muted-foreground'>Current status: </span>
                      <span className='font-medium'>{application.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className='rounded-2xl border shadow-sm'>
                  <CardContent className='p-5'>
                    <Accordion
                      type='multiple'
                      defaultValue={['feedback-0']}
                    >
                      {feedbackEntries.map((entry, i) => (
                        <AccordionItem
                          key={i}
                          value={`feedback-${i}`}
                          className='rounded-xl border bg-muted/20 px-5 mb-2 last:mb-0 last:border-b'
                        >
                          <AccordionTrigger className='hover:no-underline'>
                            <div className='flex flex-col gap-0.5 text-left'>
                              <span className='text-sm font-semibold'>
                                {toDateOnly(entry.sentAt) !== '—'
                                  ? `Received ${toDateOnly(entry.sentAt)}`
                                  : 'Recruiter Feedback'}
                              </span>
                              {entry.reason && (
                                <span className='text-xs text-muted-foreground'>
                                  {entry.reason}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className='text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                              {entry.text}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
