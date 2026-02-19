import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroPanel from './HeroPanel'
import type { JobApplication } from '../data/mockData'

// minimal mock data with the statuses we care about
const mockApplications: JobApplication[] = [
  {
    id: '1',
    company: 'Company A',
    country: 'USA',
    city: 'NYC',
    jobLink: 'https://example.com/a',
    position: 'Role A',
    applicationDate: '2026-01-01',
    status: 'Applied',
    contactPerson: '',
    notes: '',
    jobSource: 'LinkedIn',
    outcome: 'Pending',
  },
  {
    id: '2',
    company: 'Company B',
    country: 'USA',
    city: 'SF',
    jobLink: 'https://example.com/b',
    position: 'Role B',
    applicationDate: '2026-01-02',
    status: 'Interview',
    contactPerson: '',
    notes: '',
    jobSource: 'LinkedIn',
    outcome: 'Pending',
  },
]

describe('HeroPanel', () => {
  it('renders status legend dots with correct colors', () => {
    render(<HeroPanel applications={mockApplications} />)

    // Legend labels look like: "Applied (1)", "Interview (1)"
    const appliedLabel = screen.getByText('Applied (1)')
    const interviewLabel = screen.getByText('Interview (1)')

    const appliedDot = appliedLabel.previousSibling as HTMLElement
    const interviewDot = interviewLabel.previousSibling as HTMLElement

    // Colors from STATUS_COLORS in HeroPanel.tsx
    expect(appliedDot.style.backgroundColor).toBe('rgb(254, 240, 138)')   // #FEF08A
    expect(interviewDot.style.backgroundColor).toBe('rgb(59, 130, 243)') // #3b82f3
  })
})
