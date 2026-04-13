import type { ApplicationStatus, InternalApplicationPhase } from '../types/job'
import { INTERNAL_APPLICATION_PHASES } from '../types/job'
import type { JobSource } from '../types/jobSource'

export const EXTERNAL_APPLICATION_STATUSES: Array<ApplicationStatus> = [
  'resume stage',
  'assessments',
  'phone call',
  'Interviews (behavioral or technical)',
  'Offers and Negotiations',
  'Rejected',
  'Withdrawn',
]

const LEGACY_INTERNAL_TO_PHASE: Partial<Record<ApplicationStatus, InternalApplicationPhase>> = {
  Applied: 'resume stage',
  Interview: 'Interviews (behavioral or technical)',
  Offer: 'Offers and Negotiations',
}

const LEGACY_PHASE_LABELS: Record<string, InternalApplicationPhase> = {
  'Phase I: resume stage': 'resume stage',
  'Phase II: assessments and phone calls': 'assessments',
  'assessments and phone calls': 'assessments',
  'Phase III: interviews (behavioral or technical)': 'Interviews (behavioral or technical)',
  'Phase IV: offers and negotiations': 'Offers and Negotiations',
}

export function isInternalHirelyticsJob(jobSource: JobSource | string | undefined): boolean {
  return jobSource === 'Hirelytics'
}

export function normalizeInternalStatus(status: ApplicationStatus): ApplicationStatus {
  return LEGACY_INTERNAL_TO_PHASE[status] ?? LEGACY_PHASE_LABELS[status] ?? status
}

export function getDisplayStatusForApplication(
  status: ApplicationStatus,
  jobSource: JobSource | string | undefined
): ApplicationStatus {
  void jobSource
  return normalizeInternalStatus(status)
}

export function getRecruiterManagedStatusOptions(): InternalApplicationPhase[] {
  return [...INTERNAL_APPLICATION_PHASES]
}

function isAppliedStatus(status: ApplicationStatus): boolean {
  const normalized = status as string
  return (
    normalized === 'Applied' ||
    normalized === 'resume stage' ||
    normalized === 'Phase I: resume stage'
  )
}

function isInterviewStatus(status: ApplicationStatus): boolean {
  const normalized = status as string
  return (
    normalized === 'Interview' ||
    normalized === 'assessments' ||
    normalized === 'phone call' ||
    normalized === 'Interviews (behavioral or technical)' ||
    normalized === 'assessments and phone calls' ||
    normalized === 'Phase II: assessments and phone calls' ||
    normalized === 'Phase III: interviews (behavioral or technical)'
  )
}

function isOfferStatus(status: ApplicationStatus): boolean {
  const normalized = status as string
  return (
    normalized === 'Offer' ||
    normalized === 'Offers and Negotiations' ||
    normalized === 'Phase IV: offers and negotiations'
  )
}

export function summarizeApplicationStatuses(statuses: ApplicationStatus[]) {
  const applied = statuses.filter(isAppliedStatus).length
  const interviews = statuses.filter(isInterviewStatus).length
  const offers = statuses.filter(isOfferStatus).length
  const rejected = statuses.filter((status) => status === 'Rejected').length

  return {
    applied,
    interviews,
    offers,
    rejected,
  }
}
