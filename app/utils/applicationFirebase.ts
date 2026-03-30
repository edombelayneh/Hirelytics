import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import type { AvailableJob } from '../data/availableJobs'
import type { JobSource } from '../types/jobSource'
import { normalizeJobSource } from '../types/jobSource'

type DetailRecord = Record<string, unknown>

type ApplicationJobDetails = {
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
  recruiterId?: string
}

type ApplicationPayload = {
  id: string
  jobId: string
  userId: string
  company: string
  position: string
  country: string
  city: string
  state?: string
  contactPerson: string
  jobSource: string
  notes?: string
  jobLink: string
  applicationDate: string
  status: 'Applied'
  outcome: 'Pending'
  notes: string
  recruiterId?: string
  visaRequired?: string
  experienceLevel?: string
  preferredSkills?: string
  workArrangement?: string
  paymentType?: string
  createdAt?: unknown
  updatedAt?: unknown
  jobDetails: ApplicationJobDetails
}

type BuildApplicationFromAvailableJobParams = {
  userId: string
  job: AvailableJob
}

type BuildApplicationParams = {
  userId: string
  jobId: string
  mergedJob: DetailRecord
  fallback: {
    title: string
    company: string
    location: string
    description: string
    requirements: string[]
    postedDate: string
  }
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function parseLocation(location: string): { city: string; country: string } {
  if (!location) return { city: '', country: '' }
  if (location.toLowerCase() === 'remote') return { city: 'Remote', country: 'Remote' }

  // Keep the full location string as city since values are often "City, ST".
  return { city: location.trim(), country: '' }
}

export function buildApplicationFromAvailableJob({
  userId,
  job,
}: BuildApplicationFromAvailableJobParams): ApplicationPayload {
  const { city, country } = parseLocation(job.location)
  const jobId = String(job.id)

  return {
    id: jobId,
    jobId,
    userId,
    company: job.company,
    position: job.title,
    country,
    city,
    contactPerson: '',
    jobSource: 'Hirelytics',
    jobLink: job.applyLink,
    applicationDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    outcome: 'Pending',
    notes: '',
    recruiterId: job.recruiterId,
    jobDetails: {
      id: jobId,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      postedDate: job.postedDate,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements,
      status: job.status,
      applyLink: job.applyLink,
      recruiterId: job.recruiterId,
    },
  }
}

export function buildApplication({
  userId,
  jobId,
  mergedJob,
  fallback,
}: BuildApplicationParams): ApplicationPayload {
  const title = toText(mergedJob.title) || fallback.title
  const company = toText(mergedJob.company) || toText(mergedJob.companyName) || fallback.company
  const location = toText(mergedJob.location) || fallback.location
  const locationParts = parseLocation(location)
  const hasExplicitCountry = Boolean(toText(mergedJob.country))
  const city = toText(mergedJob.city) || (hasExplicitCountry ? location : locationParts.city)
  const country = toText(mergedJob.country) || locationParts.country
  const requirements =
    toStringList(mergedJob.requirements).length > 0
      ? toStringList(mergedJob.requirements)
      : fallback.requirements

  const state = toText(mergedJob.state) || undefined
  const visaRequired = toText(mergedJob.visaRequired) || undefined
  const experienceLevel = toText(mergedJob.experienceLevel) || undefined
  const preferredSkills = toText(mergedJob.preferredSkills) || undefined
  const workArrangement = toText(mergedJob.workArrangement) || undefined
  const paymentType = toText(mergedJob.paymentType) || undefined
  const jobLink = toText(mergedJob.applyLink) || toText(mergedJob.jobLink)
  const jobSource = normalizeJobSource(toText(mergedJob.jobSource) || 'Hirelytics')

  return {
    id: jobId,
    jobId,
    userId,
    company,
    position: title,
    country,
    city,
    ...(state ? { state } : {}),
    contactPerson: toText(mergedJob.contactPerson),
    jobSource,
    jobLink,
    applicationDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    outcome: 'Pending',
    notes: '',
    recruiterId: toText(mergedJob.recruiterId) || undefined,
    ...(visaRequired ? { visaRequired } : {}),
    ...(experienceLevel ? { experienceLevel } : {}),
    ...(preferredSkills ? { preferredSkills } : {}),
    ...(workArrangement ? { workArrangement } : {}),
    ...(paymentType ? { paymentType } : {}),
    jobDetails: {
      id: jobId,
      title,
      company,
      location,
      type: toText(mergedJob.type) || toText(mergedJob.employmentType),
      postedDate: toText(mergedJob.postedDate) || fallback.postedDate,
      salary: toText(mergedJob.salary) || toText(mergedJob.paymentAmount),
      description:
        toText(mergedJob.description) ||
        toText(mergedJob.generalDescription) ||
        fallback.description,
      requirements,
      status: toText(mergedJob.status) || 'Open',
      applyLink: jobLink,
      recruiterId: toText(mergedJob.recruiterId) || undefined,
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

export async function applyToAvailableJob({ userId, job }: BuildApplicationFromAvailableJobParams) {
  const payload = buildApplicationFromAvailableJob({ userId, job })
  await saveUserApplication(payload)

  const jobRef = doc(db, 'jobPostings', payload.jobId)
  await setDoc(jobRef, { applicantsId: arrayUnion(userId) }, { merge: true })
}

export async function applyToJobFromDetails({
  userId,
  jobId,
  mergedJob,
  fallback,
}: BuildApplicationParams) {
  const payload = buildApplication({ userId, jobId, mergedJob, fallback })
  await saveUserApplication(payload)

  const jobRef = doc(db, 'jobPostings', jobId)
  await setDoc(jobRef, { applicantsId: arrayUnion(userId) }, { merge: true })
}
