import { arrayUnion, doc, collection, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import type { AvailableJob } from '../data/availableJobs'

// Canonical shape persisted in each user's `applications/{jobId}` document.
// Keeping this centralized prevents subtle field drift across different apply entry points.
type JobDetailsPayload = {
  id: string
  title: string
  company: string
  location: string
  type: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  status: string
  applyLink: string
  recruiterId: string
}

type SaveUserApplicationInput = {
  userId: string
  jobId: string
  company: string
  position: string
  country: string
  city: string
  status?: string
  contactPerson: string
  jobSource: string
  notes?: string
  jobLink: string
  jobDetails: JobDetailsPayload
}

type BuildFromAvailableJobInput = {
  userId: string
  job: AvailableJob
}

type BuildFromJobDetailsInput = {
  userId: string
  jobId: string
  company: string
  position: string
  country: string
  city: string
  contactPerson: string
  jobSource?: string
  jobLink: string
  title: string
  location: string
  type: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  status: string
  applyLink: string
  recruiterId: string
}

type BuildFromJobDetailsRecordInput = {
  userId: string
  jobId: string
  mergedJob: Record<string, unknown>
  fallback: {
    title: string
    company: string
    location: string
    description: string
    requirements: string[]
    postedDate: string
  }
  jobSource?: string
}

// Normalizes free-form values from merged sources (Firestore, JSON fallback, nested objects)
// into a clean string suitable for persistence.
function toCleanString(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '—' ? '' : trimmed
  }
  if (typeof value === 'number') return String(value)
  return ''
}

// Returns the first non-empty normalized candidate in priority order.
// This lets us define explicit precedence (e.g., canonical field before fallback field).
function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const next = toCleanString(value)
    if (next) return next
  }
  return ''
}

// Accepts only array-like values for requirements and strips unusable entries.
function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toCleanString(entry)).filter(Boolean)
}

// Builds a save-ready payload from the list-page `AvailableJob` model.
// Used by the `/applicant/jobs` page where source data is already strongly typed.
export function buildApplicationFromAvailableJob(
  input: BuildFromAvailableJobInput
): SaveUserApplicationInput {
  const { userId, job } = input
  const jobId = String(job.id)

  return {
    userId,
    jobId,
    company: job.company ?? '',
    position: job.title ?? '',
    country: '',
    city: job.location ?? '',
    contactPerson: '',
    jobSource: 'Hirelytics',
    jobLink: '',
    jobDetails: {
      id: jobId,
      title: job.title ?? '',
      company: job.company ?? '',
      location: job.location ?? '',
      type: job.type ?? '',
      postedDate: job.postedDate ?? '',
      salary: job.salary ?? '',
      description: job.description ?? '',
      requirements: job.requirements ?? [],
      status: job.status ?? '',
      applyLink: job.applyLink ?? '',
      recruiterId: job.recruiterId ?? '',
    },
  }
}

// One-call list-page helper: map input model -> persist to Firestore.
// Also appends the applicant's userId to the job's applicantsId array in jobPostings.
export async function applyToAvailableJob(input: BuildFromAvailableJobInput) {
  const { userId, job } = input
  const jobId = String(job.id)

  await saveUserApplication(buildApplicationFromAvailableJob(input))

  const jobRef = doc(db, 'jobPostings', jobId)
  await setDoc(jobRef, { applicantsId: arrayUnion(userId) }, { merge: true })
}

// Low-level builder for already-normalized detail values.
// Other higher-level mappers should delegate to this to keep final payload shape consistent.
export function buildApplicationFromJobDetails(
  input: BuildFromJobDetailsInput
): SaveUserApplicationInput {
  const {
    userId,
    jobId,
    company,
    position,
    country,
    city,
    contactPerson,
    jobSource = 'Hirelytics',
    jobLink,
    title,
    location,
    type,
    postedDate,
    salary,
    description,
    requirements,
    status,
    applyLink,
    recruiterId,
  } = input

  return {
    userId,
    jobId,
    company,
    position,
    country,
    city,
    contactPerson,
    jobSource,
    jobLink,
    jobDetails: {
      id: jobId,
      title,
      company,
      location,
      type,
      postedDate,
      salary,
      description,
      requirements,
      status,
      applyLink,
      recruiterId,
    },
  }
}

// High-level builder for the job-details page where values may come from multiple merged sources.
// It resolves aliases/fallbacks, then delegates to `buildApplicationFromJobDetails`.
export function buildApplication(input: BuildFromJobDetailsRecordInput): SaveUserApplicationInput {
  const { userId, jobId, mergedJob, fallback, jobSource = 'Hirelytics' } = input

  const company = firstNonEmpty(mergedJob.company, mergedJob.companyName, fallback.company)
  const position = firstNonEmpty(mergedJob.title, mergedJob.position, fallback.title)
  const country = firstNonEmpty(mergedJob.country)
  const city = firstNonEmpty(mergedJob.city, mergedJob.location, fallback.location)
  const contactPerson = firstNonEmpty(mergedJob.contactPerson)
  const jobLink = firstNonEmpty(mergedJob.jobLink, mergedJob.applyLink)
  const type = firstNonEmpty(mergedJob.type)
  const salary = firstNonEmpty(mergedJob.salary, mergedJob.hourlyRate, mergedJob.paymentAmount)
  const description = firstNonEmpty(
    mergedJob.description,
    mergedJob.generalDescription,
    fallback.description
  )
  const requirements = toStringList(mergedJob.requirements)
  const status = firstNonEmpty(mergedJob.status)
  const resolvedJobSource = firstNonEmpty(mergedJob.jobSource, jobSource)
  const applyLink = firstNonEmpty(mergedJob.applyLink, mergedJob.jobLink)
  const recruiterId = firstNonEmpty(mergedJob.recruiterId)

  return buildApplicationFromJobDetails({
    userId,
    jobId,
    company,
    position,
    country,
    city,
    contactPerson,
    jobSource: resolvedJobSource,
    jobLink,
    title: position || fallback.title,
    location: firstNonEmpty(mergedJob.location, fallback.location),
    type,
    postedDate: fallback.postedDate,
    salary,
    description,
    requirements: requirements.length > 0 ? requirements : fallback.requirements,
    status,
    applyLink,
    recruiterId,
  })
}

// One-call details-page helper: normalize merged record -> persist to Firestore.
// Also appends the applicant's userId to the job's applicantsId array in jobPostings.
export async function applyToJobFromDetails(input: BuildFromJobDetailsRecordInput) {
  const { userId, jobId } = input

  await saveUserApplication(buildApplication(input))

  const jobRef = doc(db, 'jobPostings', jobId)
  await setDoc(jobRef, { applicantsId: arrayUnion(userId) }, { merge: true })
}

// Persists the canonical application document using merge semantics.
// Merge keeps any unrelated existing fields while updating the normalized application payload.
export async function saveUserApplication(input: SaveUserApplicationInput) {
  const {
    userId,
    jobId,
    company,
    position,
    country,
    city,
    status = 'Applied',
    contactPerson,
    jobSource,
    notes = '',
    jobLink,
    jobDetails,
  } = input

  const ref = doc(db, 'users', userId, 'applications', jobId)

  await setDoc(
    ref,
    {
      id: jobId,
      jobId,
      company,
      position,
      country,
      city,
      applicationDate: new Date().toISOString(),
      status,
      contactPerson,
      jobSource,
      notes,
      jobLink,
      jobDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// Type for external job data from the Add External Job form.
export type SaveExternalJobInput = {
  userId: string
  jobUrl: string
  jobName: string
  companyName: string
  companyContact: string
  description: string
  qualifications: string
  preferredSkills: string
  country: string
  state: string
  city: string
  paymentAmount: string
  paymentType: 'hourly' | 'salary' | ''
  visaRequired: 'yes' | 'no' | ''
  workArrangement: 'onsite' | 'remote' | 'hybrid' | ''
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | ''
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | ''
  applicationDate: string
  jobSource: string
}

// Saves an externally-sourced job to user's applications.
// Creates a unique document in Firestore at users/{userId}/applications/{jobId}.
// Uses Firebase's auto-generated document ID for both the document path and the id field.
export async function saveExternalJob(input: SaveExternalJobInput) {
  const {
    userId,
    jobUrl,
    jobName,
    companyName,
    companyContact,
    description,
    qualifications,
    preferredSkills,
    country,
    state,
    city,
    paymentAmount,
    paymentType,
    visaRequired,
    workArrangement,
    employmentType,
    experienceLevel,
    applicationDate,
    jobSource,
  } = input

  // Pre-generate the Firestore doc reference so its auto-generated ID can be stored
  // inside the document itself — no timestamp-based IDs, no race condition.
  const newDocRef = doc(collection(db, 'users', userId, 'applications'))
  const jobId = newDocRef.id

  // Build location string.
  const locationParts = [city, state, country].filter(Boolean)
  const location = locationParts.join(', ')
  const cityDisplay = [city, state].filter(Boolean).join(', ')

  // Normalize date-only form input to explicit UTC midnight for stable ordering
  // and consistent parsing across clients in different timezones.
  const applicationDateISO = /^\d{4}-\d{2}-\d{2}$/.test(applicationDate)
    ? `${applicationDate}T00:00:00.000Z`
    : new Date(applicationDate).toISOString()

  const ref = newDocRef

  await setDoc(
    ref,
    {
      id: jobId,
      company: companyName,
      position: jobName,
      country,
      city: cityDisplay || city,
      applicationDate: applicationDateISO,
      status: 'Applied',
      contactPerson: companyContact,
      jobSource,
      outcome: 'Pending',
      notes: '',
      jobLink: jobUrl,
      isExternal: true, // Flag to identify external jobs.
      jobDetails: {
        title: jobName,
        company: companyName,
        location,
        type: employmentType || '',
        postedDate: applicationDateISO,
        salary: paymentAmount
          ? `$${paymentAmount}${paymentType === 'hourly' ? '/hr' : paymentType === 'salary' ? '/year' : ''}`
          : '',
        description,
        requirements: qualifications ? qualifications.split('\n').filter(Boolean) : [],
        status: 'Applied',
        applyLink: jobUrl,
        recruiterId: '',
      },
      externalJobMetadata: {
        qualifications,
        preferredSkills,
        paymentType,
        visaRequired,
        workArrangement,
        employmentType,
        experienceLevel,
        state,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
