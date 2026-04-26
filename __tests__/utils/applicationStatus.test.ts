import { describe, expect, it } from 'vitest'

import {
  getDisplayStatusForApplication,
  normalizeInternalStatus,
  summarizeApplicationStatuses,
} from '../../app/utils/applicationStatus'
import type { ApplicationStatus } from '../../app/types/job'

describe('app/utils/applicationStatus', () => {
  it('normalizes legacy status labels to canonical regular-cased status values', () => {
    expect(normalizeInternalStatus('Applied')).toBe('Applied')
    expect(normalizeInternalStatus('assessments')).toBe('Screening')
    expect(normalizeInternalStatus('Interviews (behavioral or technical)')).toBe('Interviews')
    expect(normalizeInternalStatus('Offers and Negotiations')).toBe('Offer')
  })

  it('returns normalized display status regardless of job source', () => {
    expect(
      getDisplayStatusForApplication('Phase I: resume stage' as ApplicationStatus, 'Hirelytics')
    ).toBe('Applied')
    expect(getDisplayStatusForApplication('phone call' as ApplicationStatus, 'LinkedIn')).toBe(
      'Screening'
    )
  })

  it('summarizes statuses using normalized categories', () => {
    const summary = summarizeApplicationStatuses([
      'Applied',
      'Applied',
      'assessments',
      'Interviews',
      'Offer',
      'Offer',
      'Rejected',
      'Withdrawn',
    ] as ApplicationStatus[])

    expect(summary).toEqual({
      applied: 2,
      interviews: 2,
      offers: 2,
      rejected: 1,
    })
  })
})
