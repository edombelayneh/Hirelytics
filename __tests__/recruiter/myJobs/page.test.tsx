// __tests__/recruiter/myJobs/RecruiterMyJobsPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import RecruiterMyJobsPage from '../../../app/recruiter/myJobs/page'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// next/link -> plain <a> so we can assert href
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      {...rest}
    >
      {children}
    </a>
  ),
}))

// If your Button component is complex, you can mock it lightly.
// (Optional, but keeps tests stable)
vi.mock('@/app/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode; asChild?: boolean; variant?: string }) => (
    <div data-testid='button-mock'>{children}</div>
  ),
}))

// Navbar isn't used visually in this page, so we can stub it
vi.mock('@/app/components/Navbar', () => ({
  Navbar: () => <div data-testid='navbar-mock' />,
}))

// Mock RecruiterJobCard to verify rendering + props
type RecruiterJob = {
  id: string
  title: string
  company: string
  location: string
  type: string
  postedAt: string
  status: string
  applicantsCount: number
  description: string
}

vi.mock('../../../app/components/RecruiterJobCard', () => ({
  RecruiterJobCard: ({ job }: { job: RecruiterJob }) => (
    <div data-testid='job-card'>
      <div data-testid='job-id'>{job.id}</div>
      <div data-testid='job-title'>{job.title}</div>
      <div data-testid='job-status'>{job.status}</div>
    </div>
  ),
}))

// Mock EmptyMyJobs (should NOT render in current page since jobs.length === 2)
vi.mock('../../../app/components/EmptyMyJobs', () => ({
  EmptyMyJobs: () => <div data-testid='empty-myjobs' />,
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('RecruiterMyJobsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders page header and description', () => {
    render(<RecruiterMyJobsPage />)

    expect(screen.getByText('My Jobs')).toBeTruthy()
    expect(screen.getByText(/manage the jobs you’ve posted/i)).toBeTruthy()
  })

  it('renders "Post new job" link with correct href', () => {
    render(<RecruiterMyJobsPage />)

    const link = screen.getByRole('link', { name: /post new job/i })
    expect(link.getAttribute('href')).toBe('/recruiter/addNewJob')
  })

  it('renders one RecruiterJobCard per job (jobs length > 0)', () => {
    render(<RecruiterMyJobsPage />)

    const cards = screen.getAllByTestId('job-card')
    expect(cards.length).toBe(2)

    // sanity check first job info (from seeded data)
    expect(screen.getAllByTestId('job-id')[0].textContent).toBe('job-1')
    expect(screen.getAllByTestId('job-title')[0].textContent).toBe('Software Engineer Intern')
    expect(screen.getAllByTestId('job-status')[0].textContent).toBe('Open')

    // and second job
    expect(screen.getAllByTestId('job-id')[1].textContent).toBe('job-2')
    expect(screen.getAllByTestId('job-status')[1].textContent).toBe('Paused')
  })

  it('does not render EmptyMyJobs when jobs exist', () => {
    render(<RecruiterMyJobsPage />)
    expect(screen.queryByTestId('empty-myjobs')).toBeNull()
  })
})
