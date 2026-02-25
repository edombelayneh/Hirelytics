// __tests__/recruiter/jobDetails/JobDetailsPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import JobDetailsPage from '../../../app/recruiter/JobDetails/[jobId]/page'

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

// next/navigation useParams
const useParamsMock = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}))

// Mock JobDetailsCard to inspect props easily
type Job = {
  id: string
  title: string
  company: string
  location: string
  type: string
  postedAt: string
  description: string
}

// Mock ApplicantsTable to inspect props + verify computed profileHref
vi.mock('../../../app/components/job/JobDetailsCard', () => ({
  JobDetailsCard: ({ job }: { job: Job }) => (
    <div data-testid='job-details-card'>
      <div data-testid='job-id'>{job.id}</div>
      <div data-testid='job-title'>{job.title}</div>
      <div data-testid='job-company'>{job.company}</div>
    </div>
  ),
}))

// Mock ApplicantsTable to inspect props + verify computed profileHref
type Applicant = {
  id: string
  firstName: string
  lastName: string
  resumeUrl: string
  resumeFileName: string
  linkedinUrl: string
  portfolioUrl: string
}

// Mock ApplicantsTable to inspect props + verify computed profileHref
vi.mock('../../../app/components/job/ApplicantsTable', () => ({
  ApplicantsTable: ({
    applicants,
    profileHref,
  }: {
    applicants: Applicant[]
    profileHref: (id: string) => string
  }) => (
    <div data-testid='applicants-table'>
      <div data-testid='applicant-count'>{applicants.length}</div>
      <div data-testid='first-applicant-name'>
        {applicants[0]?.firstName} {applicants[0]?.lastName}
      </div>
      <div data-testid='profile-href-a1'>{profileHref('a1')}</div>
    </div>
  ),
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('JobDetailsPage', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks()
    useParamsMock.mockReturnValue({ jobId: 'job-123' }) // Default route param for all tests, can override in specific tests if needed
  })

  afterEach(() => {
    // Cleanup the DOM after each test to prevent test interference
    cleanup()
  })

  it('renders the return link to recruiter myJobs', () => {
    // Just check that the link is there with the correct href - we can trust Next's Link component to handle the actual navigation
    render(<JobDetailsPage />)

    // Check that the link with the expected text is rendered and has the correct href
    const link = screen.getByRole('link', { name: /return to my jobs/i })
    expect(link.getAttribute('href')).toBe('/recruiter/myJobs')
  })

  it('passes the route jobId into JobDetailsCard job prop', () => {
    // Check that the JobDetailsCard receives the job prop with the expected id based on the route param
    render(<JobDetailsPage />)

    // We can check the id, title, and company to confirm the correct job data is being passed based on the route param
    expect(screen.getByTestId('job-details-card')).toBeTruthy()
    expect(screen.getByTestId('job-id').textContent).toBe('job-123')
    expect(screen.getByTestId('job-title').textContent).toBe('Software Engineer Intern')
    expect(screen.getByTestId('job-company').textContent).toBe('Hirelytics')
  })

  it('renders ApplicantsTable with seeded applicants and correct profileHref builder', () => {
    // Check that the ApplicantsTable receives the applicants array and that the profileHref function generates the expected URLs
    render(<JobDetailsPage />)

    // Check that the applicants data is rendered correctly
    expect(screen.getByTestId('applicants-table')).toBeTruthy()
    expect(screen.getByTestId('applicant-count').textContent).toBe('3')
    expect(screen.getByTestId('first-applicant-name').textContent).toContain('Edom Belayneh')
    expect(screen.getByTestId('profile-href-a1').textContent).toBe('/recruiter/applicants/a1')
  })
})
