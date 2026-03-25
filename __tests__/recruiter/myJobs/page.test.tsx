// __tests__/recruiter/myJobs/RecruiterMyJobsPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import React from 'react'
import RecruiterMyJobsPage from '../../../app/recruiter/myJobs/page'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Clerk: component uses useAuth to get the current recruiter's userId
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({ userId: 'recruiter-uid-1', isLoaded: true })),
}))

// Firebase client stub — avoids real SDK initialization in tests
vi.mock('../../../app/lib/firebaseClient', () => ({ db: {} }))

// Firestore mock: onSnapshot calls its callback synchronously with 2 seeded jobs
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((_q: unknown, cb: (snap: { docs: unknown[] }) => void) => {
    cb({
      docs: [
        {
          id: 'job-1',
          data: () => ({
            title: 'Software Engineer Intern',
            company: 'Hirelytics',
            location: 'Remote',
            type: 'Full-time',
            postedDate: '2025-10-20',
            status: 'Open',
            applicantsId: [],
            description: 'Build great things.',
          }),
        },
        {
          id: 'job-2',
          data: () => ({
            title: 'Product Manager',
            company: 'Hirelytics',
            location: 'New York, NY',
            type: 'Full-time',
            postedDate: '2025-10-21',
            status: 'Paused',
            applicantsId: [],
            description: 'Drive product strategy.',
          }),
        },
      ],
    })
    return vi.fn() // unsubscribe no-op
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
    expect(screen.getByText(/manage the jobs you/i)).toBeTruthy()
  })

  it('renders Post new job link with correct href', () => {
    render(<RecruiterMyJobsPage />)

    const link = screen.getByRole('link', { name: /post new job/i })
    expect(link.getAttribute('href')).toBe('/recruiter/addNewJob')
  })

  it('renders one RecruiterJobCard per job (jobs length > 0)', async () => {
    render(<RecruiterMyJobsPage />)

    // Wait for Firestore snapshot to populate the job list
    const cards = await screen.findAllByTestId('job-card')
    expect(cards.length).toBe(2)

    // sanity check first job info (from seeded data)
    expect(screen.getAllByTestId('job-id')[0].textContent).toBe('job-1')
    expect(screen.getAllByTestId('job-title')[0].textContent).toBe('Software Engineer Intern')
    expect(screen.getAllByTestId('job-status')[0].textContent).toBe('Open')

    // and second job
    expect(screen.getAllByTestId('job-id')[1].textContent).toBe('job-2')
    expect(screen.getAllByTestId('job-status')[1].textContent).toBe('Paused')
  })

  it('does not render EmptyMyJobs when jobs exist', async () => {
    render(<RecruiterMyJobsPage />)

    // Wait for jobs to load before asserting empty state is absent
    await screen.findAllByTestId('job-card')
    await waitFor(() => expect(screen.queryByTestId('empty-myjobs')).toBeNull())
  })
})
