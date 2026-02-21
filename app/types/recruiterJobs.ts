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
