// Vitest utilities for structuring and asserting tests
// - describe / it: test grouping and test cases
// - expect: assertions
// - vi: mocking and spies
// - beforeEach / afterEach: test lifecycle hooks
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// React Testing Library helpers
// - render: mounts a React component into a virtual DOM
// - screen: queries the rendered DOM in an accessibility-friendly way
// - fireEvent: simulates user interactions
// - cleanup: unmounts components between tests to avoid leakage
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// The page component under test
import MyApplicationsPage from '../../app/applications/page'

// Shared type used by the page and mocked child components
import { JobApplication } from '../../app/data/mockData'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCKS                                 */
/* -------------------------------------------------------------------------- */

// --- Mock Clerk authentication ---
// The page relies on useAuth() to determine whether a user is signed in.
// We mock it so tests run deterministically without real auth.
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isSignedIn: true,
  })),
}))

// --- Mock Firebase client ---
// Prevents the test environment from initializing a real Firebase instance.
vi.mock('../../app/lib/firebaseClient', () => ({
  firebaseAuth: {},
  firestore: {},
}))

// --- Mock Firestore methods ---
// These are imported by the page logic but not exercised directly in these tests.
// Stubbing them avoids runtime errors and side effects.
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
}))

/* -------------------------------------------------------------------------- */
/*                         MOCKED CHILD COMPONENTS                             */
/* -------------------------------------------------------------------------- */

// Child components are mocked to:
// 1) Reduce test complexity
// 2) Isolate MyApplicationsPage behavior
// 3) Make assertions easier by rendering predictable output

// --- HeroPanel mock ---
// Displays only the number of applications it receives.
vi.mock('../../app/components/HeroPanel', () => ({
  default: ({ applications }: { applications: JobApplication[] }) => (
    <div data-testid='hero-panel'>HeroPanel: {applications.length} applications</div>
  ),
}))

// --- SummaryCards mock ---
// Similar strategy: render minimal output tied to props.
vi.mock('../../app/components/SummaryCards', () => ({
  SummaryCards: ({ applications }: { applications: JobApplication[] }) => (
    <div data-testid='summary-cards'>SummaryCards: {applications.length} applications</div>
  ),
}))

// --- ApplicationsTable mock ---
// In addition to rendering a count, this mock exposes buttons
// that deliberately invoke callback props so we can verify wiring.
vi.mock('../../app/components/ApplicationsTable', () => ({
  ApplicationsTable: ({
    applications,
    onStatusChange,
    onNotesChange,
  }: {
    applications: JobApplication[]
    onStatusChange?: (id: string, status: JobApplication['status']) => void
    onNotesChange?: (id: string, notes: string) => void
  }) => (
    <div data-testid='applications-table'>
      <div>ApplicationsTable: {applications.length} applications</div>

      {/* Simulates a status update initiated by the user */}
      <button onClick={() => onStatusChange?.('1', 'Interview')}>Change Status</button>

      {/* Simulates a notes update initiated by the user */}
      <button onClick={() => onNotesChange?.('1', 'New notes')}>Change Notes</button>
    </div>
  ),
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('MyApplicationsPage', () => {
  // --- Representative mock data ---
  // Covers multiple statuses and realistic field values.
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

  // --- Mock callback handlers ---
  // Used to verify that events are properly wired from child components.
  const mockOnStatusChange = vi.fn()
  const mockOnNotesChange = vi.fn()

  // --- Reset all spies and mocks before each test ---
  // Ensures tests are isolated and order-independent.
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Explicit DOM cleanup after each test ---
  // Required for React 18 + Strict Mode to prevent duplicate nodes.
  afterEach(() => {
    cleanup()
  })

  // --- Smoke test: main sections render ---
  it('renders the page with all main sections', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    // Assert high-level structure rather than implementation details
    expect(screen.getByText('Dashboard Overview')).toBeTruthy()
    expect(screen.getByText('Key Metrics')).toBeTruthy()
  })

  // --- HeroPanel integration test ---
  it('renders HeroPanel with correct application count', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    const heroPanel = screen.getByTestId('hero-panel')
    expect(heroPanel).toBeTruthy()
    expect(heroPanel.textContent).toContain('3 applications')
  })

  // --- SummaryCards integration test ---
  it('renders SummaryCards with correct application count', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    const summaryCards = screen.getByTestId('summary-cards')
    expect(summaryCards).toBeTruthy()
    expect(summaryCards.textContent).toContain('3 applications')
  })

  // --- ApplicationsTable integration test ---
  it('renders ApplicationsTable with correct application count', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    const applicationsTable = screen.getByTestId('applications-table')
    expect(applicationsTable).toBeTruthy()
    expect(applicationsTable.textContent).toContain('3 applications')
  })

  // --- Edge case: no applications ---
  it('renders correctly with empty applications array', () => {
    render(
      <MyApplicationsPage
        applications={[]}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    expect(screen.getByTestId('hero-panel').textContent).toContain('0 applications')
    expect(screen.getByTestId('summary-cards').textContent).toContain('0 applications')
    expect(screen.getByTestId('applications-table').textContent).toContain('0 applications')
  })

  // --- Callback wiring: status changes ---
  it('passes onStatusChange callback to ApplicationsTable', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Change Status/i }))

    expect(mockOnStatusChange).toHaveBeenCalledTimes(1)
    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'Interview')
  })

  // --- Callback wiring: notes changes ---
  it('passes onNotesChange callback to ApplicationsTable', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Change Notes/i }))

    expect(mockOnNotesChange).toHaveBeenCalledTimes(1)
    expect(mockOnNotesChange).toHaveBeenCalledWith('1', 'New notes')
  })

  // --- Optional props safety ---
  it('renders correctly without optional callbacks', () => {
    render(<MyApplicationsPage applications={mockApplications} />)

    expect(screen.getByTestId('hero-panel')).toBeTruthy()
    expect(screen.getByTestId('summary-cards')).toBeTruthy()
    expect(screen.getByTestId('applications-table')).toBeTruthy()
  })

  // --- Semantic structure check ---
  // Verifies heading hierarchy instead of raw text presence.
  it('renders all section headings correctly', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings).toHaveLength(2)
    expect(headings[0].textContent).toBe('Dashboard Overview')
    expect(headings[1].textContent).toBe('Key Metrics')
  })
})
