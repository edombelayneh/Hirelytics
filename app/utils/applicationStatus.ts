import type { ApplicationStatus, InternalApplicationPhase } from '../types/job'
import { APPLICATION_STATUSES } from '../types/job'
import type { JobSource } from '../types/jobSource'

export const EXTERNAL_APPLICATION_STATUSES: Array<ApplicationStatus> = [...APPLICATION_STATUSES]

const LEGACY_STATUS_LABELS: Record<string, ApplicationStatus> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEWS: 'Interviews',
  OFFERS: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  Applied: 'Applied',
  Interview: 'Interviews',
  Offer: 'Offer',
  Rejected: 'Rejected',
  Withdrawn: 'Withdrawn',
  'resume stage': 'Applied',
  assessments: 'Screening',
  'phone call': 'Screening',
  'Interviews (behavioral or technical)': 'Interviews',
  'Offers and Negotiations': 'Offer',
  'Phase I: resume stage': 'Applied',
  'Phase II: assessments and phone calls': 'Screening',
  'assessments and phone calls': 'Screening',
  'Phase III: interviews (behavioral or technical)': 'Interviews',
  'Phase IV: offers and negotiations': 'Offer',
}

export function isInternalHirelyticsJob(jobSource: JobSource | string | undefined): boolean {
  return jobSource === 'Hirelytics'
}

export function normalizeInternalStatus(status: ApplicationStatus | string): ApplicationStatus {
  const normalized = LEGACY_STATUS_LABELS[status]
  if (normalized) return normalized

  const titleCased = String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase()
  return APPLICATION_STATUSES.includes(titleCased as ApplicationStatus)
    ? (titleCased as ApplicationStatus)
    : 'Applied'
}

export function getDisplayStatusForApplication(
  status: ApplicationStatus | string,
  jobSource: JobSource | string | undefined
): ApplicationStatus {
  void jobSource
  return normalizeInternalStatus(status)
}

export function getRecruiterManagedStatusOptions(): InternalApplicationPhase[] {
  return [...APPLICATION_STATUSES]
}

export function summarizeApplicationStatuses(statuses: ApplicationStatus[]) {
  const normalized = statuses.map((status) => normalizeInternalStatus(status))
  const applied = normalized.filter((status) => status === 'Applied').length
  const interviews = normalized.filter(
    (status) => status === 'Screening' || status === 'Interviews'
  ).length
  const offers = normalized.filter((status) => status === 'Offer').length
  const rejected = normalized.filter((status) => status === 'Rejected').length

  return {
    applied,
    interviews,
    offers,
    rejected,
  }
}
