import type { ApplicationStatus, InternalApplicationPhase } from '../types/job'
import { APPLICATION_STATUSES } from '../types/job'
import type { JobSource } from '../types/jobSource'

export const EXTERNAL_APPLICATION_STATUSES: Array<ApplicationStatus> = [
  'APPLIED',
  'SCREENING',
  'INTERVIEWS',
  'OFFERS',
  'REJECTED',
  'WITHDRAWN',
]

const LEGACY_STATUS_LABELS: Record<string, ApplicationStatus> = {
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

export function normalizeInternalStatus(status: ApplicationStatus | string): ApplicationStatus {
  const normalized = LEGACY_STATUS_LABELS[status]
  if (normalized) return normalized

  const upper = String(status).toUpperCase()
  return APPLICATION_STATUSES.includes(upper as ApplicationStatus)
    ? (upper as ApplicationStatus)
    : 'APPLIED'
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

function isAppliedStatus(status: ApplicationStatus): boolean {
  return normalizeInternalStatus(status) === 'APPLIED'
}

function isInterviewStatus(status: ApplicationStatus): boolean {
  const normalized = normalizeInternalStatus(status)
  return normalized === 'SCREENING' || normalized === 'INTERVIEWS'
}

function isOfferStatus(status: ApplicationStatus): boolean {
  return normalizeInternalStatus(status) === 'OFFERS'
}

export function summarizeApplicationStatuses(statuses: ApplicationStatus[]) {
  const applied = statuses.filter(isAppliedStatus).length
  const interviews = statuses.filter(isInterviewStatus).length
  const offers = statuses.filter(isOfferStatus).length
  const rejected = statuses.filter(
    (status) => normalizeInternalStatus(status) === 'REJECTED'
  ).length

  return {
    applied,
    interviews,
    offers,
    rejected,
  }
}
