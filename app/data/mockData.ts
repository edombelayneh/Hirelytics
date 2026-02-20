import { jobsData } from './jobs'

export interface JobApplication {
  id: string
  company: string
  country: string
  city: string
  jobLink: string
  position: string
  applicationDate: string
  status: 'Applied' | 'Interview' | 'Rejected' | 'Offer' | 'Withdrawn'
  contactPerson: string
  notes: string
  jobSource: 'LinkedIn' | 'Company Website' | 'Indeed' | 'Glassdoor' | 'Referral' | 'Other'
  outcome: 'Pending' | 'Successful' | 'Unsuccessful' | 'In Progress'
  // Stores the Firebase UID of the recruiter who posted the job the user applied to
  recruiterId?: string
}

// Load job applications from jobs data file
export const mockJobApplications: JobApplication[] = jobsData

export const getDashboardStats = () => {
  const total = mockJobApplications.length
  const applied = mockJobApplications.filter((app) => app.status === 'Applied').length
  const interviews = mockJobApplications.filter((app) => app.status === 'Interview').length
  const offers = mockJobApplications.filter((app) => app.status === 'Offer').length
  const rejected = mockJobApplications.filter((app) => app.status === 'Rejected').length

  const responseRate = Math.round(((interviews + offers + rejected) / total) * 100)
  const successRate = Math.round((offers / total) * 100)

  return {
    total,
    applied,
    interviews,
    offers,
    rejected,
    responseRate,
    successRate,
  }
}

export const getApplicationsByMonth = () => {
  const monthCounts: { [key: string]: number } = {}

  mockJobApplications.forEach((app) => {
    const date = new Date(app.applicationDate)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
  })

  return Object.entries(monthCounts).map(([month, count]) => ({
    month,
    applications: count,
  }))
}

export const getStatusDistribution = () => {
  const statusCounts: { [key: string]: number } = {}

  mockJobApplications.forEach((app) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1
  })

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / mockJobApplications.length) * 100),
  }))
}

export const getApplicationsByMonthFromList = (applications: JobApplication[]) => {
  const monthCounts: { [key: string]: number } = {}

  applications.forEach((app) => {
    const date = new Date(app.applicationDate)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
  })

  return Object.entries(monthCounts).map(([month, count]) => ({
    month,
    applications: count,
  }))
}

export const getStatusDistributionFromList = (applications: JobApplication[]) => {
  const statusCounts: { [key: string]: number } = {}

  applications.forEach((app) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1
  })

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / applications.length) * 100),
  }))
}

export const getDashboardStatsFromList = (applications: JobApplication[]) => {
  const total = applications.length
  const applied = applications.filter((app) => app.status === 'Applied').length
  const interviews = applications.filter((app) => app.status === 'Interview').length
  const offers = applications.filter((app) => app.status === 'Offer').length
  const rejected = applications.filter((app) => app.status === 'Rejected').length

  const responseRate = total > 0 ? Math.round(((interviews + offers + rejected) / total) * 100) : 0
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0

  return {
    total,
    applied,
    interviews,
    offers,
    rejected,
    responseRate,
    successRate,
  }
}
