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
const collectionMock = vi.fn((...args: any[]) => ({ __collection: args }))
const docMock = vi.fn((...args: any[]) => ({ __docPath: args }))
const setDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'SERVER_TS')

// Default: no applied jobs
let snapshotDocIds: string[] = []

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => collectionMock(...args),
  doc: (...args: any[]) => docMock(...args),
  setDoc: (...args: any[]) => setDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),

  onSnapshot: vi.fn((_ref: any, callback: any) => {
    callback({
      docs: snapshotDocIds.map((id) => ({ id })),
    })
    return vi.fn()
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
    vi.clearAllMocks()
    snapshotDocIds = []
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the Jobs page', () => {
    render(<Jobs />)
    expect(screen.getByTestId('available-jobs-list')).toBeTruthy()
  })

  it('passes appliedJobIds from Firestore snapshot to AvailableJobsList', () => {
    snapshotDocIds = ['1', '2', '3'] // gets converted to Set<number> {1,2,3}
    render(<Jobs />)

    expect(screen.getByTestId('applied-jobs-count').textContent).toBe('3')
  })

  it('calls setDoc when Apply is triggered', async () => {
    render(<Jobs />)

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
      { merge: true }
    )
  })

  it('does not call setDoc if job already applied (id exists in appliedJobIds)', () => {
    snapshotDocIds = ['1'] // applied already
    render(<Jobs />)

    fireEvent.click(screen.getByTestId('apply-button'))

    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('renders main content container', () => {
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
    const { container } = render(<Jobs />)
    const mainDiv = container.querySelector('.min-h-screen.bg-background')
    expect(mainDiv).toBeTruthy()
  })
})
