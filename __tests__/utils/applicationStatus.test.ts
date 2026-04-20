import { describe, expect, it } from 'vitest'

import {
  getDisplayStatusForApplication,
  normalizeInternalStatus,
  summarizeApplicationStatuses,
} from '../../app/utils/applicationStatus'
import type { ApplicationStatus } from '../../app/types/job'

describe('app/utils/applicationStatus', () => {
  it('normalizes legacy status labels to canonical uppercase status values', () => {
    expect(normalizeInternalStatus('Applied')).toBe('APPLIED')
    expect(normalizeInternalStatus('assessments')).toBe('SCREENING')
    expect(normalizeInternalStatus('Interviews (behavioral or technical)')).toBe('INTERVIEWS')
    expect(normalizeInternalStatus('Offers and Negotiations')).toBe('OFFERS')
  })

  it('returns normalized display status regardless of job source', () => {
    expect(
      getDisplayStatusForApplication('Phase I: resume stage' as ApplicationStatus, 'Hirelytics')
    ).toBe('APPLIED')
    expect(getDisplayStatusForApplication('phone call' as ApplicationStatus, 'LinkedIn')).toBe(
      'SCREENING'
    )
  })

  it('summarizes statuses using normalized categories', () => {
    const summary = summarizeApplicationStatuses([
      'APPLIED',
      'Applied',
      'assessments',
      'INTERVIEWS',
      'Offer',
      'OFFERS',
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
