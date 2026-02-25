// --------------------------------------------------
// RecruiterJob type
// Represents a job post created by a recruiter
// Used in recruiter dashboard + job management views
// --------------------------------------------------
export type RecruiterJob = {
  id: string
  title: string
  company: string
  location?: string
  type?: string
  postedAt?: string
  status?: 'Open' | 'Closed' | 'Paused'
  applicantsCount?: number
  description?: string
}
