export type Job = {
  id: string
  title: string
  company?: string
  location?: string
  type?: string
  postedAt?: string
  description?: string
}

export type Applicant = {
  id: string
  firstName: string
  lastName: string

  resumeUrl?: string
  resumeFileName?: string

  linkedinUrl?: string
  portfolioUrl?: string
}
