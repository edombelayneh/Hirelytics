import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import JobDetailsPage from '../../../../app/recruiter/jobs/[jobId]/page'

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

const defaultJobSnapshotData = {
  title: 'Software Engineer',
  company: 'TechCorp',
  location: 'Remote',
  description: 'Build and maintain applicant-facing features.',
  requirements: ['React', 'TypeScript'],
  optionalRequirements: ['Firebase experience'],
  salary: '$100,000',
  type: 'Full-time',
}

const defaultApplicationSnapshotData = {
  id: '1',
  jobId: '1',
  status: 'Applied',
  notes: 'Submitted this week',
  jobLink: 'https://example.com/jobs/1',
  createdAt: '2026-01-15T13:30:00.000Z',
  updatedAt: '2026-01-20T17:45:00.000Z',
}

let jobSnapshotExists = true
let applicationSnapshotExists = true
let jobSnapshotData: Record<string, unknown> = defaultJobSnapshotData
let applicationSnapshotData: Record<string, unknown> = defaultApplicationSnapshotData

// Mock Firestore listeners
vi.mock('firebase/firestore', () => ({
  doc: (...path: unknown[]) => ({ path }),
  onSnapshot: (ref: MockRef, cb: (snapshot: Snapshot) => void) => {
    if (ref.path[1] === 'jobs') {
      cb({
        id: String(ref.path[2]),
        exists: () => jobSnapshotExists,
        data: () => jobSnapshotData,
      })
      return vi.fn()
    }

    cb({
      id: String(ref.path[4]),
      exists: () => applicationSnapshotExists,
      data: () => applicationSnapshotData,
    })

    return vi.fn()
  },
}))

describe('Applicant Job Details Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jobSnapshotExists = true
    applicationSnapshotExists = true
    jobSnapshotData = defaultJobSnapshotData
    applicationSnapshotData = defaultApplicationSnapshotData
  })

  afterEach(() => {
    cleanup()
  })

  it('renders merged job details from Firebase and shows application back button', () => {
    render(<JobDetailsPage />)

    expect(screen.getByRole('heading', { name: /Software Engineer/i })).toBeTruthy()
    expect(screen.getByText('TechCorp • Remote')).toBeTruthy()
    expect(screen.getByText('Build and maintain applicant-facing features.')).toBeTruthy()
    expect(screen.getByText(/React/i)).toBeTruthy()
    expect(screen.getByText(/TypeScript/i)).toBeTruthy()
    expect(screen.getByText(/Firebase experience/i)).toBeTruthy()
  })
  it('hides internal ids and renders posted/updated as date-only at the bottom', () => {
    render(<JobDetailsPage />)

    expect(screen.queryByRole('heading', { name: /Job 1/i })).toBeNull()
    expect(screen.queryByText(/^Id$/i)).toBeNull()
    expect(screen.queryByText(/^Job Id$/i)).toBeNull()

    expect(screen.getByText('Posted')).toBeTruthy()
    expect(screen.getByText('Updated')).toBeTruthy()
    expect(screen.queryByText(/T13:30:00/)).toBeNull()
    expect(screen.queryByText(/T17:45:00/)).toBeNull()
  })

  it('routes back to applications when back button is clicked', () => {
    // Confirms context-aware back button uses applications route.
    render(<JobDetailsPage />)

    fireEvent.click(screen.getByRole('button', { name: /Back to Available Jobs/i }))
    expect(pushMock).toHaveBeenCalledWith('/recruiter/jobs')
  })

  it('renders fallback details when Firebase documents are partial', () => {
    // Simulate missing canonical job doc and sparse application doc for same job.
    jobSnapshotExists = false
    applicationSnapshotData = {
      id: '1',
      jobId: '1',
      status: 'Applied',
    }

    render(<JobDetailsPage />)

    expect(screen.getByRole('heading', { name: /Software Engineer/i })).toBeTruthy()
    expect(screen.getByText(/TechCorp/i)).toBeTruthy()
    expect(
      screen.getByText(
        'Develop and maintain web applications, collaborate with cross-functional teams, and ensure code quality.'
      )
    ).toBeTruthy()
    expect(screen.getByText("Bachelor's in Computer Science")).toBeTruthy()
    expect(screen.getByText('Proficiency in JavaScript and Python')).toBeTruthy()
  })
})
