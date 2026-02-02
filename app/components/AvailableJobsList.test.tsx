// app/components/AvailableJobsList.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { AvailableJobsList } from './AvailableJobsList'

// --- Mock JobCard so we can test ONLY the list behavior (rendering/filtering) ---
vi.mock('./JobCard', () => ({
  JobCard: ({ job }: { job: { title: string } }) => <div data-testid='job-item'>{job.title}</div>,
}))

// --- Mock Input as a normal input ---
vi.mock('./ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      data-testid='search-input'
      {...props}
    />
  ),
}))

// --- Mock Select as a normal <select> ---
vi.mock('./ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (v: string) => void
    children: React.ReactNode
  }) => (
    <select
      data-testid='select'
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder: string }) => (
    <option value=''>{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

// --- Mock availableJobs so results are predictable ---
vi.mock('../data/availableJobs', () => {
  const availableJobs = [
    {
      id: 1,
      title: 'Software Engineer',
      company: 'TechCorp',
      location: 'Remote',
      type: 'Full-time',
      postedDate: '2025-10-20',
      salary: '$100k',
      description: 'Build web apps',
      requirements: [],
      status: 'Open',
      applyLink: '#',
    },
    {
      id: 2,
      title: 'Data Analyst',
      company: 'DataCo',
      location: 'New York, NY',
      type: 'Part-time',
      postedDate: '2025-10-19',
      salary: '$70k',
      description: 'Analyze data',
      requirements: [],
      status: 'Open',
      applyLink: '#',
    },
    {
      id: 3,
      title: 'QA Engineer',
      company: 'Quality Inc.',
      location: 'Chicago, IL',
      type: 'Contract',
      postedDate: '2025-10-18',
      salary: '$80k',
      description: 'Test software',
      requirements: [],
      status: 'Open',
      applyLink: '#',
    },
  ]
  return { availableJobs }
})

describe('AvailableJobsList', () => {
  const mockOnApply = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // Shows header + correct counts
  it('renders header and counts', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    expect(screen.getByText('Available Jobs')).toBeTruthy()
    expect(screen.getByText(/Browse and apply to 3 open positions/i)).toBeTruthy()
    expect(screen.getByText(/Showing 3 of 3 jobs/i)).toBeTruthy()
  })

  // Add Job link points to correct page
  it('renders Add Job link to correct page', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    const addJob = screen.getByRole('link', { name: /Add Job/i })
    expect(addJob.getAttribute('href')).toBe('#/addNewJob')
  })

  // Renders all jobs initially
  it('renders all jobs', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    expect(screen.getByText('Software Engineer')).toBeTruthy()
    expect(screen.getByText('Data Analyst')).toBeTruthy()
    expect(screen.getByText('QA Engineer')).toBeTruthy()

    expect(screen.getAllByTestId('job-item').length).toBe(3)
  })

  // Search filters list
  it('filters jobs by search', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'analyst' } })

    expect(screen.queryByText('Software Engineer')).toBeNull()
    expect(screen.getByText('Data Analyst')).toBeTruthy()
    expect(screen.queryByText('QA Engineer')).toBeNull()

    expect(screen.getByText(/Showing 1 of 3 jobs/i)).toBeTruthy()
  })

  // Type dropdown filters list
  it('filters jobs by type', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    const selects = screen.getAllByTestId('select')
    const typeSelect = selects[0]

    fireEvent.change(typeSelect, { target: { value: 'Full-time' } })

    expect(screen.getByText('Software Engineer')).toBeTruthy()
    expect(screen.queryByText('Data Analyst')).toBeNull()
    expect(screen.queryByText('QA Engineer')).toBeNull()

    expect(screen.getByText(/Showing 1 of 3 jobs/i)).toBeTruthy()
  })

  // Location dropdown filters list (remote)
  it('filters jobs by location (remote)', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    const selects = screen.getAllByTestId('select')
    const locationSelect = selects[1]

    fireEvent.change(locationSelect, { target: { value: 'remote' } })

    expect(screen.getByText('Software Engineer')).toBeTruthy()
    expect(screen.queryByText('Data Analyst')).toBeNull()
    expect(screen.queryByText('QA Engineer')).toBeNull()

    expect(screen.getByText(/Showing 1 of 3 jobs/i)).toBeTruthy()
  })

  // Shows empty state when no matches
  it('shows empty message when no jobs match', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
      />
    )

    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'zzzzzz' } })

    expect(screen.getByText(/No jobs found matching your criteria/i)).toBeTruthy()
    expect(screen.getByText(/Showing 0 of 3 jobs/i)).toBeTruthy()
  })
})
