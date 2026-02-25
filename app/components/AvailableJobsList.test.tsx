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
// Added recruiterId field to match the updated AvailableJob interface
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
      recruiterId: 'recruiter-uid-1', // Mock recruiter UID for testing
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
      recruiterId: 'recruiter-uid-1',
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
      recruiterId: 'recruiter-uid-1',
    },
  ]
  return { availableJobs }
})

// --- Mock recruiter cache to prevent Firebase initialization during tests ---
// This prevents the component from trying to fetch real recruiters from Firebase
vi.mock('../utils/recruiterCache', () => ({
  fetchAllRecruiters: vi.fn(),
  getAllRecruiterUids: vi.fn(() => ['recruiter-uid-1', 'recruiter-uid-2']),
  getRandomRecruiterUid: vi.fn(() => 'recruiter-uid-1'),
  clearRecruiterCache: vi.fn(),
  assignRecruitersToJobs: vi.fn((jobs) => jobs),
}))

describe('AvailableJobsList', () => {
  // Mock apply handler so we can assert it’s passed/usable if needed
  const mockOnApply = vi.fn()

  beforeEach(() => {
    // Reset spies before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset DOM after each test
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
  it('renders Add Job link to correct page for recruiters', () => {
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
        role='recruiter'
      />
    )

    const addJob = screen.getByRole('link', { name: /Add Job/i })
    expect(addJob.getAttribute('href')).toBe('#/addNewJob')
  })

  it('does not render Add Job link for applicants', () => {
    // Applicants should not see recruiter-only UI
    render(
      <AvailableJobsList
        onApply={mockOnApply}
        appliedJobIds={new Set()}
        role='applicant'
      />
    )

    expect(screen.queryByRole('link', { name: /Add Job/i })).toBeNull()
  })

  it('renders all jobs', () => {
    // Sanity check: all mocked jobs render on initial load
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

  it('filters jobs by search', () => {
    // Typing into search should reduce visible job cards
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

  it('filters jobs by type', () => {
    // Type dropdown should filter down to matching job types
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

  it('filters jobs by location (remote)', () => {
    // Location dropdown should support “remote” filtering
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

  it('shows empty message when no jobs match', () => {
    // When filters return nothing, component should show an empty state
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
