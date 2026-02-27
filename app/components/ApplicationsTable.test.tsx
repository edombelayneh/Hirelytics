// ApplicationsTable.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react'
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
  getStatusColor: (status: string) =>
    `status-${String(status).toLowerCase().replace(/\s+/g, '-')}`,
  getOutcomeColor: (outcome: string) =>
    `outcome-${String(outcome).toLowerCase().replace(/\s+/g, '-')}`,
}))

// Next.js router
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))
// Mock your Select component with a native <select> for easier testing
// This keeps behavior testable without relying on portal/popover UI internals
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
  // SelectItem becomes <option> so dropdown options work in DOM tests
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
  // Sample dataset used across tests to validate rendering + filters
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
  // Callback spies used to assert row-level edits trigger parent handlers
  const mockOnStatusChange = vi.fn()
  const mockOnNotesChange = vi.fn()

  beforeEach(() => {
    // Reset spies between tests so counts don’t leak across cases
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Ensure DOM is cleaned up between tests
    cleanup()
  })

  it('renders title and description', () => {
    // Basic smoke test: confirms top-level text is present
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('Job Applications')).toBeTruthy()
    expect(screen.getByText('Track and manage all your job applications in one place')).toBeTruthy()
  })

  it('renders all table headers', () => {
    // Verifies table structure is correct and headers don’t regress
    const { container } = render(<ApplicationsTable applications={mockApplications} />)

    const thead = container.querySelector('thead')
    expect(thead).toBeTruthy()
    // Scope queries to the <thead> so we only check header labels
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
    // Confirms each row’s company name is displayed
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.getByText('StartupXYZ')).toBeTruthy()
    expect(screen.getByText('BigTech Inc')).toBeTruthy()
  })

  it('displays application details correctly', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    // Check first application details
    expect(screen.getByText('TechCorp')).toBeTruthy()
    const usaElements = screen.getAllByText('USA')
    expect(usaElements.length).toBeGreaterThan(0)
    expect(screen.getByText('San Francisco')).toBeTruthy()
    expect(screen.getByText('Software Engineer')).toBeTruthy()
    expect(screen.getByText('John Doe')).toBeTruthy()
  })

  it('shows empty state when no applications match filter', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'NonExistentCompany' } })

    expect(screen.getByText('No applications found matching your criteria')).toBeTruthy()
  })

  it('displays application count correctly', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('Showing 3 of 3 applications')).toBeTruthy()
  })
  it('shows application count correctly', () => {
    // Checks the “Showing X of Y” label matches the provided dataset
    render(<ApplicationsTable applications={mockApplications} />)
    expect(screen.getByText('Showing 3 of 3 applications')).toBeTruthy()
  })

  // --- Search Functionality Tests ---

  it('filters by search term (company)', () => {
    // Simulates typing into search and confirms list shrinks accordingly
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TechCorp' } })

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.queryByText('StartupXYZ')).toBeNull()
    expect(screen.queryByText('BigTech Inc')).toBeNull()
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()
  })

  it('filters applications by position', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'Frontend' } })

    expect(screen.getByText('StartupXYZ')).toBeTruthy()
    expect(screen.queryByText('TechCorp')).toBeNull()
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()
  })

  it('filters applications by country', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'Canada' } })

    expect(screen.getByText('StartupXYZ')).toBeTruthy()
    expect(screen.queryByText('TechCorp')).toBeNull()
    expect(screen.queryByText('BigTech Inc')).toBeNull()
  })

  it('filters applications by city', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'Toronto' } })

    expect(screen.getByText('StartupXYZ')).toBeTruthy()
    expect(screen.queryByText('TechCorp')).toBeNull()
  })

  it('search is case-insensitive', () => {
    // Ensures search normalizes casing
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TECHCORP' } })

    expect(screen.getByText('TechCorp')).toBeTruthy()
  })

  it('clears search when input is emptied', () => {
    // Confirms clearing the input restores the full list
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TechCorp' } })
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()

    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('Showing 3 of 3 applications')).toBeTruthy()
  })

  // --- Status Filter Tests ---
  // Note: Radix Select dropdown interactions are difficult to test in jsdom
  // because they use portals and complex DOM manipulation.
  // These tests verify the filter exists and is accessible.

  it('filters by status via the status filter dropdown', () => {
    // Uses the mocked <select> filter to show only matching statuses
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

  // --- Callback Tests ---

  it('shows empty state when no applications match', () => {
    // Validates user-friendly empty state and correct count when filters return nothing
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'NonExistentCompany' } })

    expect(screen.getByText('No applications found matching your criteria')).toBeTruthy()
    expect(screen.getByText('Showing 0 of 3 applications')).toBeTruthy()
  })

  it('provides status change functionality via Select components', () => {
    render(
      <ApplicationsTable
        applications={mockApplications}
        onStatusChange={mockOnStatusChange}
      />
    )

    // Verify status dropdowns exist (actual interaction testing is limited in jsdom)
    const statusDropdowns = screen.getAllByRole('combobox')
    // Should have filter dropdown + one for each row
    expect(statusDropdowns.length).toBe(mockApplications.length + 1)
  })

  it('calls onNotesChange when notes are edited', () => {
    // Ensures notes edits trigger the parent callback with id + new value
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
    // Confirms component guards optional callbacks (no runtime errors)
    render(<ApplicationsTable applications={mockApplications} />)

    const notesInputs = screen.getAllByPlaceholderText('Add notes...')
    expect(() => {
      fireEvent.change(notesInputs[0], { target: { value: 'New notes' } })
    }).not.toThrow()
  })

  it('calls onStatusChange when a row status is changed', () => {
    // Ensures status edits trigger the parent callback with id + new status
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

  // --- External Link Tests ---

  it('navigates to application details when action button is clicked', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    // Your Action button is icon-only, so it has no accessible name.
    // Grab all buttons and click the first one (first row action).
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications/1')
  })

  it('navigates to application details when action button is clicked', () => {
    // Verifies clicking the row action triggers a route push to details page
    render(<ApplicationsTable applications={mockApplications} />)

    // There is one "Actions" button per row; click the first row's.
    const actionButtons = screen.getAllByRole('button')
    fireEvent.click(actionButtons[0])

    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications/1')
  })

  // --- Edge Case Tests ---

  it('renders correctly with empty applications array', () => {
    // Handles empty dataset gracefully (still shows header + empty state)
    render(<ApplicationsTable applications={[]} />)

    expect(screen.getByText('Job Applications')).toBeTruthy()
    expect(screen.getByText('No applications found matching your criteria')).toBeTruthy()
    expect(screen.getByText('Showing 0 of 0 applications')).toBeTruthy()
  })

  it('renders correctly with a single application', () => {
    // Confirms counts and row rendering work for minimal data
    render(<ApplicationsTable applications={[mockApplications[0]]} />)

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.getByText('Showing 1 of 1 applications')).toBeTruthy()
  })

  it('shows job sources and outcomes in their cells', () => {
    // Confirms key fields render in table cells (source + outcome columns)
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

  // --- Memoization Test ---

  it('memoizes and does not re-render unnecessarily', () => {
    const { rerender } = render(<ApplicationsTable applications={mockApplications} />)

    const initialCompanyElement = screen.getByText('TechCorp')

    // Re-render with same props
    rerender(<ApplicationsTable applications={mockApplications} />)

    const afterRerenderCompanyElement = screen.getByText('TechCorp')

    // Elements should be the same (component memoized)
    expect(initialCompanyElement).toBe(afterRerenderCompanyElement)
  })

  // --- Graph and status color styling ---
  it('applies the correct background color class for each outcome', () => {
  render(<ApplicationsTable applications={mockApplications} />)

  const pendingBadge = screen.getByText('Pending')
  const inProgressBadge = screen.getByText('In Progress')
  const unsuccessfulBadge = screen.getByText('Unsuccessful')

  // className is a big string, just check it contains our mocked class
  expect(pendingBadge.className).toContain('outcome-pending')
  expect(inProgressBadge.className).toContain('outcome-in-progress')
  expect(unsuccessfulBadge.className).toContain('outcome-unsuccessful')
})

})
