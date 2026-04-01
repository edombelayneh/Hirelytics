import { arrayUnion, doc, collection, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import type { AvailableJob } from '../data/availableJobs'
import type { JobSource } from '../types/jobSource'
import { normalizeJobSource } from '../types/jobSource'

type DetailRecord = Record<string, unknown>

type ApplicationJobDetails = {
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
}

type ApplicationPayload = {
  id: string
  jobId?: string
  userId: string
  company: string
  position: string
  country: string
  city: string
  state?: string
  contactPerson: string
  jobSource: JobSource
  jobLink: string
  applicationDate: string
  status: 'Applied'
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

type BuildFromJobDetailsInput = {
  userId: string
  id: string
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
  jobPostingStatus: string
  applyLink: string
  recruiterId?: string
  state?: string
  visaRequired?: string
  experienceLevel?: string
  preferredSkills?: string
  workArrangement?: string
  paymentType?: string
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
    userId,
    id: jobId,
    company: job.company,
    position: job.title,
    country,
    city,
    contactPerson: '',
    jobSource: 'Hirelytics',
    jobLink: job.applyLink,
    applicationDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    notes: '',
    recruiterId: job.recruiterId,
    jobDetails: {
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

  return buildApplicationFromJobDetails({
    userId,
    id: jobId,
    company,
    position: title,
    country,
    city,
    contactPerson: toText(mergedJob.contactPerson),
    jobSource,
    jobLink,
    title,
    location,
    type: toText(mergedJob.type) || toText(mergedJob.employmentType),
    postedDate: toText(mergedJob.postedDate) || fallback.postedDate,
    salary: toText(mergedJob.salary) || toText(mergedJob.paymentAmount),
    description:
      toText(mergedJob.description) || toText(mergedJob.generalDescription) || fallback.description,
    requirements,
    jobPostingStatus: toText(mergedJob.status) || 'Open',
    applyLink: jobLink,
    recruiterId: toText(mergedJob.recruiterId) || undefined,
    ...(state ? { state } : {}),
    ...(visaRequired ? { visaRequired } : {}),
    ...(experienceLevel ? { experienceLevel } : {}),
    ...(preferredSkills ? { preferredSkills } : {}),
    ...(workArrangement ? { workArrangement } : {}),
    ...(paymentType ? { paymentType } : {}),
  })
}

export function buildApplicationFromJobDetails({
  userId,
  id,
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
  jobPostingStatus,
  applyLink,
  recruiterId,
  state,
  visaRequired,
  experienceLevel,
  preferredSkills,
  workArrangement,
  paymentType,
}: BuildFromJobDetailsInput): ApplicationPayload {
  const normalizedSource = normalizeJobSource(jobSource)

  return {
    userId,
    id,
    company,
    position,
    country,
    city,
    ...(state ? { state } : {}),
    contactPerson,
    jobSource: normalizedSource,
    jobLink,
    applicationDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    notes: '',
    recruiterId,
    ...(visaRequired ? { visaRequired } : {}),
    ...(experienceLevel ? { experienceLevel } : {}),
    ...(preferredSkills ? { preferredSkills } : {}),
    ...(workArrangement ? { workArrangement } : {}),
    ...(paymentType ? { paymentType } : {}),
    jobDetails: {
      title,
      company,
      location,
      type,
      postedDate,
      salary,
      description,
      requirements,
      status: jobPostingStatus,
      applyLink: jobLink,
    },
  }
}

export async function saveUserApplication(application: ApplicationPayload): Promise<void> {
  const resolvedJobId = application.jobId || application.id
  const ref = doc(db, 'users', application.userId, 'applications', resolvedJobId)
  const normalizedApplication = {
    ...application,
    id: application.id || resolvedJobId,
    jobId: resolvedJobId,
    status: application.status || 'Applied',
  }

  await setDoc(
    ref,
    {
      ...normalizedApplication,
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
