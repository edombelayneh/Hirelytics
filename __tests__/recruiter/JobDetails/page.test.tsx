// __tests__/recruiter/jobDetails/JobDetailsPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import React from 'react'
import JobDetailsPage from '../../../app/recruiter/JobDetails/[jobId]/page'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Clerk: component uses useAuth to identify the signed-in recruiter
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({ userId: 'recruiter-uid-1', isLoaded: true })),
}))

// Firebase client stub — avoids real SDK initialization in tests
vi.mock('../../../app/lib/firebaseClient', () => ({ db: {} }))

const updateDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'SERVER_TS')

// Firestore mock:
// - onSnapshot delivers job data synchronously (including 3 applicant uids)
// - getDoc resolves with profile data for each applicant uid
vi.mock('firebase/firestore', () => ({
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
  doc: vi.fn((...args: unknown[]) => ({ path: args })),
  onSnapshot: vi.fn(
    (
      _ref: unknown,
      cb: (snap: { exists: () => boolean; id: string; data: () => Record<string, unknown> }) => void
    ) => {
      cb({
        exists: () => true,
        id: 'job-123',
        data: () => ({
          title: 'Software Engineer Intern',
          company: 'Hirelytics',
          location: 'Remote',
          type: 'Full-time',
          postedDate: '2025-10-20',
          description: 'Build great things.',
          applicantsId: ['a1', 'a2', 'a3'],
        }),
      })
      return vi.fn()
    }
  ),
  getDoc: vi.fn((ref: { path: unknown[] }) => {
    const uid = ref.path[2] as string
    const names: Record<string, { firstName: string; lastName: string }> = {
      a1: { firstName: 'Edom', lastName: 'Belayneh' },
      a2: { firstName: 'Jane', lastName: 'Smith' },
      a3: { firstName: 'John', lastName: 'Doe' },
    }
    const profile = names[uid] ?? { firstName: 'Unknown', lastName: 'User' }
    if (ref.path[0] === 'users' && ref.path[2] === 'applications') {
      return Promise.resolve({
        exists: () => true,
        data: () => ({ status: 'Interview', jobSource: 'Hirelytics' }),
      })
    }
    return Promise.resolve({
      exists: () => true,
      data: () => ({ profile }),
    })
  }),
}))

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

  it('renders the return link to recruiter myJobs', async () => {
    render(<JobDetailsPage />)

    // Wait for the component to finish loading (exits loading state after getDoc resolves)
    const link = await screen.findByRole('link', { name: /return to my jobs/i })
    expect(link.getAttribute('href')).toBe('/recruiter/myJobs')
  })

  it('passes the route jobId into JobDetailsCard job prop', async () => {
    render(<JobDetailsPage />)

    // Wait until Firestore data is loaded and JobDetailsCard is rendered
    await screen.findByTestId('job-details-card')

    expect(screen.getByTestId('job-id').textContent).toBe('job-123')
    expect(screen.getByTestId('job-title').textContent).toBe('Software Engineer Intern')
    expect(screen.getByTestId('job-company').textContent).toBe('Hirelytics')
  })

  it('renders ApplicantsTable with seeded applicants and correct profileHref builder', async () => {
    render(<JobDetailsPage />)

    // Wait until all getDoc calls resolve and ApplicantsTable receives final applicants list
    await waitFor(async () => {
      expect(screen.getByTestId('applicant-count').textContent).toBe('3')
    })

    expect(screen.getByTestId('applicants-table')).toBeTruthy()
    expect(screen.getByTestId('first-applicant-name').textContent).toContain('Edom Belayneh')
    expect(screen.getByTestId('profile-href-a1').textContent).toBe('/recruiter/applicants/a1')
  })
})
