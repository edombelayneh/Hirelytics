import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import JobDetailsPage from '../../../../app/applicant/jobs/[jobId]/page'

// Router push spy used to assert back-button navigation behavior.
const pushMock = vi.fn()

// Mock Next navigation hooks for deterministic route/query behavior.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ jobId: '1' }),
  useSearchParams: () => ({ get: (key: string) => (key === 'from' ? 'applications' : null) }),
}))

// Mock auth to represent a signed-in user.
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'user-1', isLoaded: true }),
}))

// Firebase client object is only passed through to Firestore helpers in this test.
vi.mock('../../../../app/lib/firebaseClient', () => ({
  db: {},
}))

type MockRef = { path: unknown[] }

type Snapshot = {
  id: string
  exists: () => boolean
  data: () => Record<string, unknown>
}

// Mock Firestore listeners for both job doc and application doc subscriptions.
vi.mock('firebase/firestore', () => ({
  doc: (...path: unknown[]) => ({ path }),
  onSnapshot: (ref: MockRef, cb: (snapshot: Snapshot) => void) => {
    // `jobs/{jobId}` listener payload.
    if (ref.path[1] === 'jobs') {
      cb({
        id: String(ref.path[2]),
        exists: () => true,
        data: () => ({
          title: 'Software Engineer',
          company: 'TechCorp',
          location: 'Remote',
          description: 'Build and maintain applicant-facing features.',
          requirements: ['React', 'TypeScript'],
          optionalRequirements: ['Firebase experience'],
          salary: '$100,000',
          type: 'Full-time',
        }),
      })
      return vi.fn()
    }

    // `users/{userId}/applications/{jobId}` listener payload.
    cb({
      id: String(ref.path[4]),
      exists: () => true,
      data: () => ({
        id: '1',
        jobId: '1',
        status: 'Applied',
        notes: 'Submitted this week',
        jobLink: 'https://example.com/jobs/1',
        createdAt: '2026-01-15T13:30:00.000Z',
        updatedAt: '2026-01-20T17:45:00.000Z',
      }),
    })

    return vi.fn()
  },
}))

describe('Applicant Job Details Page', () => {
  beforeEach(() => {
    // Reset call counts/args to keep each test isolated.
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up rendered DOM between tests.
    cleanup()
  })

  it('renders merged job details from Firebase and shows application back button', () => {
    // Verifies merged data from both listeners appears in UI sections.
    render(<JobDetailsPage />)

    expect(screen.getByRole('heading', { name: /Software Engineer/i })).toBeTruthy()
    expect(screen.getByText('TechCorp • Remote')).toBeTruthy()
    expect(screen.getByText('Build and maintain applicant-facing features.')).toBeTruthy()
    expect(screen.getByText(/React/i)).toBeTruthy()
    expect(screen.getByText(/TypeScript/i)).toBeTruthy()
    expect(screen.getByText(/Firebase experience/i)).toBeTruthy()
    expect(screen.getByText('Applied')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Back to My Applications/i })).toBeTruthy()
  })

  it('hides internal ids and renders created/updated as date-only at the bottom', () => {
    // Ensures internal fields stay hidden and timestamps are date-only formatted.
    render(<JobDetailsPage />)

    expect(screen.queryByRole('heading', { name: /Job 1/i })).toBeNull()
    expect(screen.queryByText(/^Id$/i)).toBeNull()
    expect(screen.queryByText(/^Job Id$/i)).toBeNull()

    expect(screen.getByText('Created')).toBeTruthy()
    expect(screen.getByText('Updated')).toBeTruthy()
    expect(screen.queryByText(/T13:30:00/)).toBeNull()
    expect(screen.queryByText(/T17:45:00/)).toBeNull()
  })

  it('routes back to applications when back button is clicked', () => {
    // Confirms context-aware back button uses applications route.
    render(<JobDetailsPage />)

    fireEvent.click(screen.getByRole('button', { name: /Back to My Applications/i }))
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('shows the open job posting link when jobLink exists', () => {
    // Confirms external job posting action is rendered when a link is present.
    render(<JobDetailsPage />)

    const postingLink = screen.getByRole('link', { name: /Open Job Posting/i })
    expect(postingLink.getAttribute('href')).toBe('https://example.com/jobs/1')
  })
})
