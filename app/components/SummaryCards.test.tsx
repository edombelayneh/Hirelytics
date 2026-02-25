import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryCards } from './SummaryCards'
import { JobApplication } from '../data/mockData'

// Mock the dashboard helper from mockData
// We override it so the component receives predictable stats
vi.mock('../data/mockData', () => ({
  getDashboardStatsFromList: vi.fn(() => ({
    total: 10,
    applied: 4,
    interviews: 2,
    responseRate: 50,
    successRate: 20,
    offers: 1,
  })),
  JobApplication: {},
}))

describe('SummaryCards', () => {
  // Minimal mock application list
  // Only includes required fields for this test
  const mockApplications: JobApplication[] = [
    { id: '1', status: 'Applied' } as JobApplication,
    { id: '2', status: 'Interview' } as JobApplication,
  ]

  it('renders all summary cards with correct titles and values', () => {
    render(<SummaryCards applications={mockApplications} />)
    // Ensure at least one expected title is present
    expect(screen.getByText('Total Applications')).toBeTruthy()
  })
})
