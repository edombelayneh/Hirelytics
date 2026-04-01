import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Jobs from '../../../app/recruiter/jobs/page'
import type { Role } from '../../../app/utils/userRole'
import type { AvailableJob } from '../../../app/data/availableJobs'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCKS                                 */
/* -------------------------------------------------------------------------- */

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isLoaded: true,
  })),
  useUser: vi.fn(() => ({
    user: {
      publicMetadata: { role: 'recruiter' },
    },
  })),
}))

vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {},
}))

type Snapshot = { docs: { id: string }[] }

// Simulated Firestore snapshot data
let snapshotDocIds: string[] = []

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_ref: unknown, callback: (snap: Snapshot) => void) => {
    callback({
      docs: snapshotDocIds.map((id) => ({ id })),
    })
    return vi.fn()
  }),
  getDocs: vi.fn(() =>
    Promise.resolve({
      docs: snapshotDocIds.map((id) => ({
        id,
        data: vi.fn(() => ({})),
      })),
    })
  ),
}))

/* -------------------------------------------------------------------------- */
/*                         MOCKED CHILD COMPONENT                              */
/* -------------------------------------------------------------------------- */

interface MockAvailableJobsListProps {
  onApply: (job: AvailableJob) => void
  appliedJobIds: Set<string>
  role?: Role | null
}

vi.mock('../../../app/components/AvailableJobsList', () => ({
  AvailableJobsList: ({ appliedJobIds }: MockAvailableJobsListProps) => (
    <div data-testid='available-jobs-list'>
      <div data-testid='applied-jobs-count'>{appliedJobIds.size}</div>
    </div>
  ),
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('Recruiter Jobs Page', () => {
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

  it('recruiter has no applied jobs (empty set)', () => {
    snapshotDocIds = [] // recruiters should have none
    render(<Jobs />)

    expect(screen.getByTestId('applied-jobs-count').textContent).toBe('0')
  })

  it('renders main container', () => {
    render(<Jobs />)

    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.classList.contains('container')).toBe(true)
  })

  it('renders background styling', () => {
    const { container } = render(<Jobs />)
    const mainDiv = container.querySelector('.min-h-screen.bg-background')
    expect(mainDiv).toBeTruthy()
  })
})
