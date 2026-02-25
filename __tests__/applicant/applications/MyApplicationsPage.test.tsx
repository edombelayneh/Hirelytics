import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import MyApplicationsPage from '../../../app/applicant/applications/page'
import type { JobApplication } from '../../../app/data/mockData'

/* -------------------------------------------------------------------------- */
/*                               TEST DATA                                    */
/* -------------------------------------------------------------------------- */

const mockApplications: JobApplication[] = [
  {
    id: '1',
    company: 'TechCorp Inc.',
    country: 'USA',
    city: 'New York',
    jobLink: 'https://example.com/job1',
    position: 'Software Engineer',
    applicationDate: '2026-01-15',
    status: 'Applied',
    contactPerson: 'John Doe',
    notes: 'Initial application submitted',
    jobSource: 'LinkedIn',
    outcome: 'Pending',
  },
  {
    id: '2',
    company: 'DataSoft LLC',
    country: 'USA',
    city: 'San Francisco',
    jobLink: 'https://example.com/job2',
    position: 'Data Scientist',
    applicationDate: '2026-01-10',
    status: 'Interview',
    contactPerson: 'Jane Smith',
    notes: 'First interview scheduled',
    jobSource: 'Company Website',
    outcome: 'In Progress',
  },
  {
    id: '3',
    company: 'StartupXYZ',
    country: 'USA',
    city: 'Austin',
    jobLink: 'https://example.com/job3',
    position: 'Full Stack Developer',
    applicationDate: '2026-01-05',
    status: 'Rejected',
    contactPerson: 'Bob Johnson',
    notes: 'Not a good fit',
    jobSource: 'Indeed',
    outcome: 'Unsuccessful',
  },
]

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCKS                                 */
/* -------------------------------------------------------------------------- */

// Clerk: component requires isLoaded + userId
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isLoaded: true,
  })),
}))

// Firebase client import path MUST match the page: '../../lib/firebaseClient'
vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {}, // used only as an object passed into firestore helpers
}))

// Firestore spies we want to assert against
type DocPath = { __docPath: unknown[] }
type CollectionPath = { __collection: unknown[] }
type SnapshotDoc<T> = { id: string; data: () => T }
type Snapshot<T> = { docs: Array<SnapshotDoc<T>> }
type Unsubscribe = () => void

const updateDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'SERVER_TS')
const docMock = vi.fn((...parts: unknown[]): DocPath => ({ __docPath: parts }))

// Mock the entire Firestore module to control behavior of query builders, real-time subscriptions, and writes
vi.mock('firebase/firestore', () => ({
  // query builders (not important for behavior assertions here)
  query: vi.fn((x: unknown) => x),
  collection: vi.fn((...args: unknown[]): CollectionPath => ({ __collection: args })),
  orderBy: vi.fn(),

  // real-time subscription: IMPORTANT — call callback with docs
  onSnapshot: vi.fn(
    (_q: unknown, callback: (snap: Snapshot<JobApplication>) => void): Unsubscribe => {
      callback({
        docs: mockApplications.map((a) => ({
          id: a.id,
          data: () => a,
        })),
      })
      return vi.fn() as Unsubscribe
    }
  ),

  // writes
  doc: (...args: unknown[]) => docMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}))

/* -------------------------------------------------------------------------- */
/*                         MOCKED CHILD COMPONENTS                             */
/* -------------------------------------------------------------------------- */

// These paths MUST match the page imports: '../../components/...'
vi.mock('../../../app/components/HeroPanel', () => ({
  default: ({ applications }: { applications: JobApplication[] }) => (
    <div data-testid='hero-panel'>HeroPanel: {applications.length} applications</div>
  ),
}))

// SummaryCards and ApplicationsTable are important to mock because they trigger the callbacks we want to test
vi.mock('../../../app/components/SummaryCards', () => ({
  SummaryCards: ({ applications }: { applications: JobApplication[] }) => (
    <div data-testid='summary-cards'>SummaryCards: {applications.length} applications</div>
  ),
}))

// ApplicationsTable needs to trigger onStatusChange and onNotesChange so we can assert that the correct Firestore updates happen in response
vi.mock('../../../app/components/ApplicationsTable', () => ({
  ApplicationsTable: ({
    applications,
    onStatusChange,
    onNotesChange,
  }: {
    applications: JobApplication[]
    onStatusChange: (id: string, status: JobApplication['status']) => void
    onNotesChange: (id: string, notes: string) => void
  }) => (
    <div data-testid='applications-table'>
      <div>ApplicationsTable: {applications.length} applications</div>
      <button onClick={() => onStatusChange('1', 'Interview')}>Change Status</button>
      <button onClick={() => onNotesChange('1', 'New notes')}>Change Notes</button>
    </div>
  ),
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('MyApplicationsPage', () => {
  beforeEach(() => {
    // Clear mocks before each test to reset call counts and arguments
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup the DOM after each test to prevent test interference
    cleanup()
  })

  it('renders the page with all main sections', () => {
    // Just check that the main headings render
    render(<MyApplicationsPage />)

    expect(screen.getByText('Dashboard Overview')).toBeTruthy()
    expect(screen.getByText('Key Metrics')).toBeTruthy()
  })

  it('renders HeroPanel, SummaryCards, and ApplicationsTable with the live applications count', () => {
    // This indirectly tests that onSnapshot is working and updating state, since the count comes from the mock data we provided
    render(<MyApplicationsPage />)

    expect(screen.getByTestId('hero-panel').textContent).toContain('3 applications')
    expect(screen.getByTestId('summary-cards').textContent).toContain('3 applications')
    expect(screen.getByTestId('applications-table').textContent).toContain('3 applications')
  })

  it('updates status via updateDoc when ApplicationsTable triggers onStatusChange', async () => {
    // We want to assert that the correct document reference is constructed and the correct update is sent to Firestore
    render(<MyApplicationsPage />)
    // Simulate user clicking the button that triggers onStatusChange in the mocked ApplicationsTable
    fireEvent.click(screen.getByRole('button', { name: /change status/i }))

    // doc(db, 'users', userId, 'applications', id)
    expect(docMock).toHaveBeenCalledWith(
      expect.any(Object),
      'users',
      'test-user-id-123',
      'applications',
      '1'
    )
    // updateDoc(docRef, { status, updatedAt: serverTimestamp() })
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        status: 'Interview',
        updatedAt: 'SERVER_TS',
      })
    )
  })

  it('updates notes via updateDoc when ApplicationsTable triggers onNotesChange', async () => {
    // Similar to the previous test but for notes instead of status
    render(<MyApplicationsPage />)
    // Simulate user clicking the button that triggers onNotesChange in the mocked ApplicationsTable
    fireEvent.click(screen.getByRole('button', { name: /change notes/i }))

    // Assert that doc was called with the correct path
    expect(docMock).toHaveBeenCalledWith(
      expect.any(Object),
      'users',
      'test-user-id-123',
      'applications',
      '1'
    )
    // Assert that updateDoc was called with the correct fields to update
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        notes: 'New notes',
        updatedAt: 'SERVER_TS',
      })
    )
  })

  it('renders both section headings as h2', () => {
    // This checks that the headings are present and have the correct semantic level, which is important for accessibility
    render(<MyApplicationsPage />)

    expect(screen.getByRole('heading', { name: /Dashboard Overview/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Key Metrics/i })).toBeTruthy()
  })
})
