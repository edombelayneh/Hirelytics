import type { ApplicationStatus } from '../types/job'

export const ApplicationStatusColor: Record<ApplicationStatus, string> = {
  APPLIED: '!bg-yellow-200',
  SCREENING: '!bg-blue-200',
  INTERVIEWS: '!bg-indigo-200',
  OFFERS: '!bg-green-200',
  REJECTED: '!bg-red-200',
  WITHDRAWN: '!bg-purple-200',
}
