import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Mock Clerk authentication
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isSignedIn: true,
  })),
}))

// Mock Firebase client before importing the page
vi.mock('../../app/lib/firebaseClient', () => ({
  firebaseAuth: {},
  db: {},
}))

// Mock Firebase/firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  collection: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    // Call the callback immediately with a mock snapshot that has no docs
    callback({
      docs: [],
      data: () => ({}),
    })
    // Return an unsubscribe function
    return vi.fn()
  }),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

import Jobs from '../../app/jobs/page'
import { AvailableJob } from '../../app/data/availableJobs'
import type { Role } from '../../app/utils/userRole'

// Mock AvailableJobsList to isolate Jobs page testing
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
      {/* Button to trigger apply callback */}
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
  // Setup mock functions and test data
  const mockOnAddApplication = vi.fn()

  // Clear mocks before each test
  beforeEach(() => {
    mockOnAddApplication.mockClear()
  })

  // Clean up DOM after each test
  afterEach(() => {
    cleanup()
  })

  // Checking to make sure it renders
  it('should render the Jobs page without crashing', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)

    expect(screen.getByTestId('available-jobs-list')).toBeTruthy()
  })

  // Component presence
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

  // Props validation
  it('should pass appliedJobIds to AvailableJobsList', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)

    const appliedJobsCount = screen.getByTestId('applied-jobs-count')
    // Component initializes with empty Set, so count should be 0
    expect(appliedJobsCount.textContent).toBe('0')
  })

  // Callback wiring
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

  // Layout validation
  it('should render main content container', () => {
    render(<Jobs onAddApplication={mockOnAddApplication} />)

    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    // Verify all container classes
    expect(main.classList.contains('container')).toBe(true)
    expect(main.classList.contains('mx-auto')).toBe(true)
    expect(main.classList.contains('px-6')).toBe(true)
    expect(main.classList.contains('py-8')).toBe(true)
    expect(main.classList.contains('space-y-8')).toBe(true)
  })

  // Styling validation
  it('should render with correct background styling', () => {
    const { container } = render(<Jobs onAddApplication={mockOnAddApplication} />)

    const mainDiv = container.querySelector('.min-h-screen.bg-background')
    expect(mainDiv).toBeTruthy()
  })
})
