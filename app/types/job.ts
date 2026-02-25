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
}
