export const JOB_SOURCES = [
  'LinkedIn',
  'Indeed',
  'Handshake',
  'Glassdoor',
  'Google Jobs',
  'Company Website',
  'Greenhouse',
  'Lever',
  'Workday',
  'ZipRecruiter',
  'Monster',
  'Dice',
  'Built In',
  'Wellfound',
  'Referral',
  'Hirelytics',
  'Other',
] as const

export type JobSource = (typeof JOB_SOURCES)[number]
export type JobSourceInput = JobSource | ''

const LEGACY_TO_CANONICAL_JOB_SOURCE: Record<string, JobSource> = {
  'company career page': 'Company Website',
  companywebsite: 'Company Website',
}

export function normalizeJobSource(value: string): JobSource {
  const trimmed = value.trim()
  const legacyMatch = LEGACY_TO_CANONICAL_JOB_SOURCE[trimmed.toLowerCase().replace(/\s+/g, ' ')]
  if (legacyMatch) return legacyMatch

  const exactMatch = JOB_SOURCES.find((source) => source === trimmed)
  return exactMatch ?? 'Other'
}
