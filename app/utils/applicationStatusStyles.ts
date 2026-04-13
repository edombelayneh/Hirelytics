import type { ApplicationStatus } from '../types/job'

export const ApplicationStatusColor: Record<ApplicationStatus, string> = {
  Applied: '!bg-yellow-200',
  Interview: '!bg-blue-200',
  Offer: '!bg-green-200',
  Rejected: '!bg-red-200',
  Withdrawn: '!bg-purple-200',
  'resume stage': '!bg-amber-200',
  assessments: '!bg-sky-200',
  'phone call': '!bg-cyan-200',
  'Interviews (behavioral or technical)': '!bg-indigo-200',
  'Offers and Negotiations': '!bg-emerald-200',
}
