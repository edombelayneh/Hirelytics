// --------------------------------------------------
// Job type
// Represents a job posting in the system
// Used for recruiter job lists + job detail pages
// --------------------------------------------------
export type Job = {
  id: string
  title: string
  company?: string
  location?: string
  type?: string
  postedAt?: string
  description?: string
}

// --------------------------------------------------
// Applicant type
// Represents a candidate applying to a job
// Used in recruiter views + applicant tables
// --------------------------------------------------
export type Applicant = {
  id: string
  firstName: string
  lastName: string

  resumeUrl?: string
  resumeFileName?: string

  linkedinUrl?: string
  portfolioUrl?: string

  applicationStatus?: ApplicationStatus
  jobSource?: string
}

// --------------------------------------------------
// ApplicationStatus type
// Represents the lifecycle status of a user's job application
// ------------------------------------------------
export const APPLICATION_STATUSES = [
  'Applied',
  'Screening',
  'Interviews',
  'Offer',
  'Rejected',
  'Withdrawn',
] as const

export type InternalApplicationPhase = (typeof APPLICATION_STATUSES)[number]

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

// Backward-compatible aliases while migrating from older naming.
export const INTERNAL_APPLICATION_STATUSES = APPLICATION_STATUSES
export type InternalApplicationStatus = ApplicationStatus
