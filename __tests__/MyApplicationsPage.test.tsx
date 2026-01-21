import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import MyApplicationsPage from '../app/applications/page'
import { JobApplication } from '../app/data/mockData'

// --- Mock Clerk authentication ---
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id-123',
    isSignedIn: true,
  })),
}))

// --- Mock Firebase Firestore ---
vi.mock('../app/lib/firebaseClient', () => ({
  firestore: {},
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
}))

// --- Mock child components to simplify testing ---
vi.mock('../app/components/HeroPanel', () => ({
  default: ({ applications }: { applications: JobApplication[] }) => (
    <div data-testid='hero-panel'>HeroPanel: {applications.length} applications</div>
  ),
}))

vi.mock('../app/components/SummaryCards', () => ({
  SummaryCards: ({ applications }: { applications: JobApplication[] }) => (
    <div data-testid='summary-cards'>SummaryCards: {applications.length} applications</div>
  ),
}))

vi.mock('../app/components/ApplicationsTable', () => ({
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
      <button onClick={() => onStatusChange?.('1', 'Interview')}>Change Status</button>
      <button onClick={() => onNotesChange?.('1', 'New notes')}>Change Notes</button>
    </div>
  ),
}))

describe('MyApplicationsPage', () => {
  // --- Mock application data for testing ---
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

  // --- Mock callback functions ---
  const mockOnStatusChange = vi.fn()
  const mockOnNotesChange = vi.fn()

  // --- Reset mocks before each test ---
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Cleanup after each test to remove mounted components from DOM ---
  afterEach(() => {
    cleanup()
  })

  // --- Test rendering of page with applications ---
  it('renders the page with all main sections', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    // Check for main headings
    expect(screen.getByText('Dashboard Overview')).toBeTruthy()
    expect(screen.getByText('Key Metrics')).toBeTruthy()
  })

  // --- Test that HeroPanel receives correct props ---
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

  // --- Test that SummaryCards receives correct props ---
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

  // --- Test that ApplicationsTable receives correct props ---
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

  // --- Test rendering with empty applications array ---
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

  // --- Test onStatusChange callback is passed and works ---
  it('passes onStatusChange callback to ApplicationsTable', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    const changeStatusButton = screen.getByRole('button', { name: /Change Status/i })
    fireEvent.click(changeStatusButton)

    expect(mockOnStatusChange).toHaveBeenCalledTimes(1)
    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'Interview')
  })

  // --- Test onNotesChange callback is passed and works ---
  it('passes onNotesChange callback to ApplicationsTable', () => {
    render(
      <MyApplicationsPage
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
        onNotesChange={mockOnNotesChange}
      />
    )

    const changeNotesButton = screen.getByRole('button', { name: /Change Notes/i })
    fireEvent.click(changeNotesButton)

    expect(mockOnNotesChange).toHaveBeenCalledTimes(1)
    expect(mockOnNotesChange).toHaveBeenCalledWith('1', 'New notes')
  })

  // --- Test that callbacks are optional ---
  it('renders correctly without optional callbacks', () => {
    render(<MyApplicationsPage applications={mockApplications} />)

    expect(screen.getByTestId('hero-panel')).toBeTruthy()
    expect(screen.getByTestId('summary-cards')).toBeTruthy()
    expect(screen.getByTestId('applications-table')).toBeTruthy()
  })

  // --- Test section structure and headings ---
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
