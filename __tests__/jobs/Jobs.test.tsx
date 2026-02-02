import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Jobs from '../../app/jobs/page'
import { AvailableJob } from '../../app/data/availableJobs'

// Mock AvailableJobsList to isolate Jobs page testing
vi.mock('../../app/components/AvailableJobsList', () => ({
  AvailableJobsList: ({
    onApply,
    appliedJobIds,
  }: {
    onApply: (job: AvailableJob) => void
    appliedJobIds: Set<number>
  }) => (
    <div data-testid='available-jobs-list'>
      <div>AvailableJobsList Component</div>
      <div data-testid='applied-jobs-count'>{appliedJobIds.size}</div>
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
  const mockAppliedJobIds = new Set<number>([1, 2, 3])

  // Clear mocks before each test
  beforeEach(() => {
    mockOnAddApplication.mockClear()
  })

  // Checking to make sure it renders
  it('should render the Jobs page without crashing', () => {
    render(
      <Jobs onAddApplication={mockOnAddApplication} appliedJobIds={mockAppliedJobIds} />
    )

    expect(screen.getByTestId('available-jobs-list')).toBeTruthy()
  })

  // Component presence
  it('should render the AvailableJobsList component', () => {
    render(
      <Jobs onAddApplication={mockOnAddApplication} appliedJobIds={mockAppliedJobIds} />
    )

    expect(screen.getByText('AvailableJobsList Component')).toBeTruthy()
  })

  // Props validation
  it('should pass appliedJobIds to AvailableJobsList', () => {
    render(
      <Jobs onAddApplication={mockOnAddApplication} appliedJobIds={mockAppliedJobIds} />
    )

    const appliedJobsCount = screen.getByTestId('applied-jobs-count')
    expect(appliedJobsCount.textContent).toBe('3')
  })

  // Callback wiring
  it('should call onAddApplication when handleApply is triggered', () => {
    render(
      <Jobs onAddApplication={mockOnAddApplication} appliedJobIds={new Set()} />
    )

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
    render(
      <Jobs onAddApplication={mockOnAddApplication} appliedJobIds={mockAppliedJobIds} />
    )

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
    const { container } = render(
      <Jobs onAddApplication={mockOnAddApplication} appliedJobIds={mockAppliedJobIds} />
    )

    const mainDiv = container.querySelector('.min-h-screen.bg-background')
    expect(mainDiv).toBeTruthy()
  })
})
