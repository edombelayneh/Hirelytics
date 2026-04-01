import type { ApplicationStatus } from '../types/job'

export const ApplicationStatusColor: Record<ApplicationStatus, string> = {
  Applied: '!bg-yellow-200',
  Interview: '!bg-blue-200',
  Offer: '!bg-green-200',
  Rejected: '!bg-red-200',
  Withdrawn: '!bg-purple-200',
}
