import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Jobs from '../../app/jobs/page'
import { AvailableJob } from '../../app/data/availableJobs'
import type { Role } from '../../app/utils/userRole'
import { onSnapshot } from 'firebase/firestore'

// Mock Clerk authentication
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isSignedIn: true,
    isLoaded: true,
  })),
}))

// Mock Firebase client
vi.mock('../../app/lib/firebaseClient', () => ({
  firebaseAuth: {},
  db: {},
}))

// Global Firestore mocks (default = empty snapshot)
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  collection: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({
      docs: [],
      data: () => ({}),
    })
    return vi.fn()
  }),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

// Mock AvailableJobsList
vi.mock('../../app/components/AvailableJobsList', () => ({
  AvailableJobsList: ({
    onApply,
    appliedJobIds,
    role,
  }: {
    onApply: (job: AvailableJob) => void
    appliedJobIds: Set<number>
    role?: Role | null
  }) => (
    <div data-testid='available-jobs-list'>
      <div>AvailableJobsList Component</div>
      <div data-testid='applied-jobs-count'>{appliedJobIds.size}</div>
      <div data-testid='role-value'>{role ?? 'none'}</div>

      <button
        onClick={() =>
          onApply({
            id: 1,
            title: 'Test Job',
            company: 'Test Company',
            location: 'Test City, Test Country',
            type: 'Full-time',
            postedDate: '2026-01-01',
            salary: '$100,000',
            description: 'Test description',
            requirements: ['Requirement 1'],
            status: 'Open',
            applyLink: 'https://example.com/apply',
          })
        }
        data-testid='apply-button'
      >
        Apply
      </button>
    </div>
  ),
}))

describe('Jobs Page', () => {
  const mockOnAddApplication = vi.fn()

  beforeEach(() => {
    mockOnAddApplication.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('should render the Jobs page without crashing', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)
    expect(screen.getByTestId('available-jobs-list')).toBeTruthy()
  })

  it('should render the AvailableJobsList component', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)
    expect(screen.getByText('AvailableJobsList Component')).toBeTruthy()
  })

  it('should pass role to AvailableJobsList', () => {
    render(
      <Jobs
        onAddApplication={mockOnAddApplication}
        role='recruiter'
      />
    )
    expect(screen.getByTestId('role-value').textContent).toBe('recruiter')
  })

  it('should pass appliedJobIds to AvailableJobsList', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)
    const appliedJobsCount = screen.getByTestId('applied-jobs-count')
    expect(appliedJobsCount.textContent).toBe('0')
  })

  // Firestore populated snapshot test
  it('load applied jobs from Firestore and pass them to AvailableJobsList', () => {
    ;(onSnapshot as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (_query, callback) => {
        const cb = callback as (snapshot: {
          docs: Array<{ id: string; data: () => object }>
        }) => void

        cb({
          docs: [
            { id: '1', data: () => ({}) },
            { id: '2', data: () => ({}) },
            { id: '3', data: () => ({}) },
          ],
        })
        // -------------------------------------------

        return vi.fn()
      }
    )

    render(<Jobs onAddApplication={mockOnAddApplication} />)

    const appliedJobsCount = screen.getByTestId('applied-jobs-count')
    expect(appliedJobsCount.textContent).toBe('3')
  })

  it('should call onAddApplication when handleApply is triggered', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)

    const applyButton = screen.getByTestId('apply-button')
    applyButton.click()

    expect(mockOnAddApplication).toHaveBeenCalled()
    expect(mockOnAddApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        title: 'Test Job',
        company: 'Test Company',
      })
    )
  })

  it('should render main content container', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)

    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.classList.contains('container')).toBe(true)
    expect(main.classList.contains('mx-auto')).toBe(true)
    expect(main.classList.contains('px-6')).toBe(true)
    expect(main.classList.contains('py-8')).toBe(true)
    expect(main.classList.contains('space-y-8')).toBe(true)
  })

  it('should render with correct background styling', () => {
    const { container } = render(<Jobs onAddApplication={mockOnAddApplication} />)
    const mainDiv = container.querySelector('.min-h-screen.bg-background')
    expect(mainDiv).toBeTruthy()
  })
})
