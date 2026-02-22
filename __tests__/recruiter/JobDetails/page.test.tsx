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
    vi.clearAllMocks()
    useParamsMock.mockReturnValue({ jobId: 'job-123' })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the return link to recruiter myJobs', () => {
    render(<JobDetailsPage />)

    const link = screen.getByRole('link', { name: /return to my jobs/i })
    expect(link.getAttribute('href')).toBe('/recruiter/myJobs')
  })

  it('passes the route jobId into JobDetailsCard job prop', () => {
    render(<JobDetailsPage />)

    expect(screen.getByTestId('job-details-card')).toBeTruthy()
    expect(screen.getByTestId('job-id').textContent).toBe('job-123')
    expect(screen.getByTestId('job-title').textContent).toBe('Software Engineer Intern')
    expect(screen.getByTestId('job-company').textContent).toBe('Hirelytics')
  })

  it('renders ApplicantsTable with seeded applicants and correct profileHref builder', () => {
    render(<JobDetailsPage />)

    expect(screen.getByTestId('applicants-table')).toBeTruthy()
    expect(screen.getByTestId('applicant-count').textContent).toBe('3')
    expect(screen.getByTestId('first-applicant-name').textContent).toContain('Edom Belayneh')
    expect(screen.getByTestId('profile-href-a1').textContent).toBe('/recruiter/applicants/a1')
  })
})
