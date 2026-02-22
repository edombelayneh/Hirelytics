// ApplicationsTable.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { ApplicationsTable } from './ApplicationsTable'
import type { JobApplication } from '../data/mockData'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Date formatter utility
vi.mock('../utils/dateFormatter', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}))

// Badge color utilities
vi.mock('../utils/badgeColors', () => ({
  getStatusColor: (status: string) => `status-${String(status).toLowerCase()}`,
  getOutcomeColor: (outcome: string) => `outcome-${String(outcome).toLowerCase()}`,
}))

// Next.js router
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('./ui/select', () => {
  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
  }) {
    return (
      <select
        role='combobox'
        value={value ?? ''}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    )
  }

  function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return <option value={value}>{children}</option>
  }

  // These are just structural in your component; no-op wrappers are enough.
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const SelectValue = ({ placeholder }: { placeholder?: string }) =>
    placeholder ? <span>{placeholder}</span> : null

  return { Select, SelectItem, SelectContent, SelectTrigger, SelectValue }
})

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('ApplicationsTable', () => {
  const mockApplications: JobApplication[] = [
    {
      id: '1',
      company: 'TechCorp',
      country: 'USA',
      city: 'San Francisco',
      jobLink: 'https://example.com/job1',
      position: 'Software Engineer',
      applicationDate: '2025-01-15',
      status: 'Applied',
      contactPerson: 'John Doe',
      notes: 'Great company culture',
      jobSource: 'LinkedIn',
      outcome: 'Pending',
    },
    {
      id: '2',
      company: 'StartupXYZ',
      country: 'Canada',
      city: 'Toronto',
      jobLink: 'https://example.com/job2',
      position: 'Frontend Developer',
      applicationDate: '2025-01-20',
      status: 'Interview',
      contactPerson: 'Jane Smith',
      notes: 'Second round scheduled',
      jobSource: 'Indeed',
      outcome: 'In Progress',
    },
    {
      id: '3',
      company: 'BigTech Inc',
      country: 'USA',
      city: 'New York',
      jobLink: 'https://example.com/job3',
      position: 'Backend Developer',
      applicationDate: '2025-01-10',
      status: 'Rejected',
      contactPerson: 'Bob Johnson',
      notes: 'Not a good fit',
      jobSource: 'Company Website',
      outcome: 'Unsuccessful',
    },
  ]

  const mockOnStatusChange = vi.fn()
  const mockOnNotesChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders title and description', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('Job Applications')).toBeTruthy()
    expect(screen.getByText('Track and manage all your job applications in one place')).toBeTruthy()
  })

  it('renders all table headers', () => {
    const { container } = render(<ApplicationsTable applications={mockApplications} />)

    const thead = container.querySelector('thead')
    expect(thead).toBeTruthy()

    const headerScope = within(thead as HTMLElement)

    ;[
      'Company',
      'Country/City',
      'Position',
      'Application Date',
      'Status',
      'Contact Person',
      'Job Source',
      'Outcome',
      'Notes',
      'Actions',
    ].forEach((h) => expect(headerScope.getByText(h)).toBeTruthy())
  })

  it('renders all application rows', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.getByText('StartupXYZ')).toBeTruthy()
    expect(screen.getByText('BigTech Inc')).toBeTruthy()
  })

  it('shows application count correctly', () => {
    render(<ApplicationsTable applications={mockApplications} />)
    expect(screen.getByText('Showing 3 of 3 applications')).toBeTruthy()
  })

  it('filters by search term (company)', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TechCorp' } })

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.queryByText('StartupXYZ')).toBeNull()
    expect(screen.queryByText('BigTech Inc')).toBeNull()
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()
  })

  it('search is case-insensitive', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TECHCORP' } })

    expect(screen.getByText('TechCorp')).toBeTruthy()
  })

  it('clears search when input is emptied', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TechCorp' } })
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()

    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('Showing 3 of 3 applications')).toBeTruthy()
  })

  it('filters by status via the status filter dropdown', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    // With our Select mock: first combobox is the filter, then one per row.
    const comboboxes = screen.getAllByRole('combobox')
    const statusFilterSelect = comboboxes[0]

    // Filter to Interview -> only StartupXYZ remains
    fireEvent.change(statusFilterSelect, { target: { value: 'Interview' } })

    expect(screen.getByText('StartupXYZ')).toBeTruthy()
    expect(screen.queryByText('TechCorp')).toBeNull()
    expect(screen.queryByText('BigTech Inc')).toBeNull()
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()
  })

  it('shows empty state when no applications match', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'NonExistentCompany' } })

    expect(screen.getByText('No applications found matching your criteria')).toBeTruthy()
    expect(screen.getByText('Showing 0 of 3 applications')).toBeTruthy()
  })

  it('calls onNotesChange when notes are edited', () => {
    render(
      <ApplicationsTable
        applications={mockApplications}
        onNotesChange={mockOnNotesChange}
      />
    )

    const notesInputs = screen.getAllByPlaceholderText('Add notes...')
    fireEvent.change(notesInputs[0], { target: { value: 'Updated notes' } })

    expect(mockOnNotesChange).toHaveBeenCalledTimes(1)
    expect(mockOnNotesChange).toHaveBeenCalledWith('1', 'Updated notes')
  })

  it('does not crash when callbacks are not provided', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const notesInputs = screen.getAllByPlaceholderText('Add notes...')
    expect(() => {
      fireEvent.change(notesInputs[0], { target: { value: 'New notes' } })
    }).not.toThrow()
  })

  it('calls onStatusChange when a row status is changed', () => {
    render(
      <ApplicationsTable
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
      />
    )

    // combobox[0] is filter, combobox[1] is first row status, etc.
    const comboboxes = screen.getAllByRole('combobox')
    const firstRowStatus = comboboxes[1]

    fireEvent.change(firstRowStatus, { target: { value: 'Interview' } })

    expect(mockOnStatusChange).toHaveBeenCalledTimes(1)
    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'Interview')
  })

  it('navigates to application details when action button is clicked', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    // There is one "Actions" button per row; click the first row's.
    const actionButtons = screen.getAllByRole('button')
    fireEvent.click(actionButtons[0])

    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications/1')
  })

  it('renders correctly with empty applications array', () => {
    render(<ApplicationsTable applications={[]} />)

    expect(screen.getByText('Job Applications')).toBeTruthy()
    expect(screen.getByText('No applications found matching your criteria')).toBeTruthy()
    expect(screen.getByText('Showing 0 of 0 applications')).toBeTruthy()
  })

  it('renders correctly with a single application', () => {
    render(<ApplicationsTable applications={[mockApplications[0]]} />)

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.getByText('Showing 1 of 1 applications')).toBeTruthy()
  })

  it('shows job sources and outcomes in their cells', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    // Job sources
    expect(screen.getByText('LinkedIn')).toBeTruthy()
    expect(screen.getByText('Indeed')).toBeTruthy()
    expect(screen.getByText('Company Website')).toBeTruthy()

    // Outcomes
    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByText('In Progress')).toBeTruthy()
    expect(screen.getByText('Unsuccessful')).toBeTruthy()
  })
})
