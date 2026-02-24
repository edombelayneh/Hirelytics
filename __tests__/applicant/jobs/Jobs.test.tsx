import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import Jobs from '../../../app/applicant/jobs/page'
import type { AvailableJob } from '../../../app/data/availableJobs'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCKS                                 */
/* -------------------------------------------------------------------------- */

// Clerk: component uses BOTH useAuth and useUser
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isLoaded: true,
  })),
  useUser: vi.fn(() => ({
    user: {
      publicMetadata: { role: 'applicant' },
    },
  })),
}))

// Must match the page import: '../../lib/firebaseClient'
vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {},
}))

// Firestore spies
type DocPath = { __docPath: unknown[] }
type CollectionPath = { __collection: unknown[] }
type Unsubscribe = () => void

type SnapshotDoc = { id: string }
type Snapshot = { docs: SnapshotDoc[] }

const collectionMock = vi.fn((...args: unknown[]): CollectionPath => ({ __collection: args }))
const docMock = vi.fn((...args: unknown[]): DocPath => ({ __docPath: args }))
const setDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'SERVER_TS')

// Default: no applied jobs
let snapshotDocIds: string[] = []

// Mock the entire Firestore module
vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),

  onSnapshot: vi.fn((_ref: unknown, callback: (snap: Snapshot) => void): Unsubscribe => {
    callback({
      docs: snapshotDocIds.map((id) => ({ id })),
    })
    return vi.fn() as Unsubscribe
  }),
}))

/* -------------------------------------------------------------------------- */
/*                         MOCKED CHILD COMPONENT                              */
/* -------------------------------------------------------------------------- */

// Must match the page import: '../../components/AvailableJobsList'
vi.mock('../../../app/components/AvailableJobsList', () => ({
  AvailableJobsList: ({
    onApply,
    appliedJobIds,
  }: {
    onApply: (job: AvailableJob) => void
    appliedJobIds: Set<number>
  }) => (
    <div data-testid='available-jobs-list'>
      <div data-testid='applied-jobs-count'>{appliedJobIds.size}</div>

      <button
        data-testid='apply-button'
        onClick={() =>
          onApply({
            id: 1,
            title: 'Test Job',
            company: 'Test Company',
            location: 'Test City',
            type: 'Full-time',
            postedDate: '2026-01-01',
            salary: '$100,000',
            description: 'Test description',
            requirements: ['Req 1'],
            status: 'Open',
            applyLink: 'https://example.com/apply',
          })
        }
      >
        Apply
      </button>
    </div>
  ),
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('Jobs Page', () => {
  beforeEach(() => {
    // Reset mocks and snapshot data before each test to ensure isolation
    vi.clearAllMocks()
    snapshotDocIds = []
  })

  afterEach(() => {
    // Cleanup the DOM after each test to prevent test interference
    cleanup()
  })

  it('renders the Jobs page', () => {
    // Just check that the main component renders without crashing
    render(<Jobs />)
    expect(screen.getByTestId('available-jobs-list')).toBeTruthy()
  })

  it('passes appliedJobIds from Firestore snapshot to AvailableJobsList', () => {
    // This tests the real-time listener logic
    snapshotDocIds = ['1', '2', '3'] // Simulate 3 applied jobs in Firestore
    render(<Jobs />)

    expect(screen.getByTestId('applied-jobs-count').textContent).toBe('3')
  })

  it('calls setDoc when Apply is triggered', async () => {
    // This tests the handleApply logic, including the Firestore write
    render(<Jobs />)

    // Simulate user clicking the Apply button in the mocked AvailableJobsList
    fireEvent.click(screen.getByTestId('apply-button'))

    // doc(db, 'users', userId, 'applications', String(job.id))
    expect(docMock).toHaveBeenCalledWith(
      expect.any(Object),
      'users',
      'test-user-id-123',
      'applications',
      '1'
    )

    // setDoc(ref, data, { merge: true })
    expect(setDocMock).toHaveBeenCalledTimes(1)
    expect(setDocMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        id: '1',
        company: 'Test Company',
        position: 'Test Job',
        city: 'Test City',
        status: 'Applied',
        jobSource: 'Available Jobs',
        outcome: 'Pending',
        createdAt: 'SERVER_TS',
        updatedAt: 'SERVER_TS',
      }),
      { merge: true } // Prevent overwriting existing data
    )
  })

  it('does not call setDoc if job already applied (id exists in appliedJobIds)', () => {
    // This tests that the handleApply function correctly prevents duplicate applications
    snapshotDocIds = ['1'] // applied already
    render(<Jobs />)

    // Simulate user clicking the Apply button in the mocked AvailableJobsList
    fireEvent.click(screen.getByTestId('apply-button'))

    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('renders main content container', () => {
    // This checks that the main layout container is present and has the correct styling classes
    render(<Jobs />)

    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.classList.contains('container')).toBe(true)
    expect(main.classList.contains('mx-auto')).toBe(true)
    expect(main.classList.contains('px-6')).toBe(true)
    expect(main.classList.contains('py-8')).toBe(true)
    expect(main.classList.contains('space-y-8')).toBe(true)
  })

  it('renders with correct background styling', () => {
    // This checks that the outermost div has the correct background styling classes
    const { container } = render(<Jobs />)
    const mainDiv = container.querySelector('.min-h-screen.bg-background')
    expect(mainDiv).toBeTruthy()
  })
})
