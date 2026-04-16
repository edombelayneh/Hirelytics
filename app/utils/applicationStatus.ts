import type { ApplicationStatus, InternalApplicationStatus } from '../types/job'
import { INTERNAL_APPLICATION_STATUSES } from '../types/job'
import type { JobSource } from '../types/jobSource'

export const EXTERNAL_APPLICATION_STATUSES: InternalApplicationStatus[] = [
  ...INTERNAL_APPLICATION_STATUSES,
]

const LEGACY_STATUS_TO_CANONICAL: Record<string, InternalApplicationStatus> = {
  APPLIED: 'APPLIED',
  SCREENING: 'SCREENING',
  INTERVIEWS: 'INTERVIEWS',
  OFFERS: 'OFFERS',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  Applied: 'APPLIED',
  Interview: 'INTERVIEWS',
  Offer: 'OFFERS',
  Rejected: 'REJECTED',
  Withdrawn: 'WITHDRAWN',
  'resume stage': 'APPLIED',
  assessments: 'SCREENING',
  'phone call': 'SCREENING',
  'Interviews (behavioral or technical)': 'INTERVIEWS',
  'Offers and Negotiations': 'OFFERS',
  'Phase I: resume stage': 'APPLIED',
  'Phase II: assessments and phone calls': 'SCREENING',
  'assessments and phone calls': 'SCREENING',
  'Phase III: interviews (behavioral or technical)': 'INTERVIEWS',
  'Phase IV: offers and negotiations': 'OFFERS',
}

export function isInternalHirelyticsJob(jobSource: JobSource | string | undefined): boolean {
  return jobSource === 'Hirelytics'
}

export function normalizeInternalStatus(status: ApplicationStatus): ApplicationStatus {
  return LEGACY_STATUS_TO_CANONICAL[status] ?? status
}

export function getDisplayStatusForApplication(
  status: ApplicationStatus,
  jobSource: JobSource | string | undefined
): ApplicationStatus {
  void jobSource
  return normalizeInternalStatus(status)
}

export function getRecruiterManagedStatusOptions(): InternalApplicationStatus[] {
  return [...INTERNAL_APPLICATION_STATUSES]
}

export function summarizeApplicationStatuses(statuses: ApplicationStatus[]) {
  const normalized = statuses.map((status) => normalizeInternalStatus(status))
  const applied = normalized.filter((status) => status === 'APPLIED').length
  const interviews = normalized.filter(
    (status) => status === 'SCREENING' || status === 'INTERVIEWS'
  ).length
  const offers = normalized.filter((status) => status === 'OFFERS').length
  const rejected = normalized.filter((status) => status === 'REJECTED').length

  return {
    applied,
    interviews,
    offers,
    rejected,
  }
}
