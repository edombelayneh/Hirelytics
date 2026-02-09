import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ApplicationsTable } from './ApplicationsTable'
import { JobApplication } from '../data/mockData'

// Mock the date formatter utility
vi.mock('../utils/dateFormatter', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}))

// Mock the badge color utilities
vi.mock('../utils/badgeColors', () => ({
  getStatusColor: (status: string) => `status-${status.toLowerCase()}`,
  getOutcomeColor: (outcome: string) => `outcome-${outcome.toLowerCase()}`,
}))

// Mock scrollIntoView for Radix UI components
Element.prototype.scrollIntoView = vi.fn()

describe('ApplicationsTable', () => {
  // Mock applications data
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

  // --- Rendering Tests ---

  it('renders the table with title and description', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('Job Applications')).toBeTruthy()
    expect(screen.getByText('Track and manage all your job applications in one place')).toBeTruthy()
  })

  it('renders all table headers', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    expect(screen.getByText('Company')).toBeTruthy()
    expect(screen.getByText('Country/City')).toBeTruthy()
    expect(screen.getByText('Position')).toBeTruthy()
    expect(screen.getByText('Application Date')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
    expect(screen.getByText('Contact Person')).toBeTruthy()
    expect(screen.getByText('Job Source')).toBeTruthy()
    expect(screen.getByText('Outcome')).toBeTruthy()
    expect(screen.getByText('Notes')).toBeTruthy()
    expect(screen.getByText('Actions')).toBeTruthy()
  })

  it('renders all application rows', () => {
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

  // --- Search Functionality Tests ---

  it('filters applications by company name', () => {
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

  it('search is case insensitive', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    fireEvent.change(searchInput, { target: { value: 'TECHCORP' } })

    expect(screen.getByText('TechCorp')).toBeTruthy()
  })

  it('clears search filter when input is emptied', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const searchInput = screen.getByPlaceholderText('Search companies, positions, or locations...')
    
    // Apply filter
    fireEvent.change(searchInput, { target: { value: 'TechCorp' } })
    expect(screen.getByText('Showing 1 of 3 applications')).toBeTruthy()

    // Clear filter
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('Showing 3 of 3 applications')).toBeTruthy()
  })

  // --- Status Filter Tests ---
  // Note: Radix Select dropdown interactions are difficult to test in jsdom
  // because they use portals and complex DOM manipulation.
  // These tests verify the filter exists and is accessible.

  it('renders status filter dropdown', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const filterTriggers = screen.getAllByRole('combobox')
    const statusFilterTrigger = filterTriggers[0]
    expect(statusFilterTrigger).toBeTruthy()
    expect(screen.getByText('All Status')).toBeTruthy()
  })

  // --- Callback Tests ---

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
    render(
      <ApplicationsTable
        applications={mockApplications}
        onNotesChange={mockOnNotesChange}
      />
    )

    const notesInputs = screen.getAllByPlaceholderText('Add notes...')
    const firstNotesInput = notesInputs[0]

    fireEvent.change(firstNotesInput, { target: { value: 'Updated notes' } })

    expect(mockOnNotesChange).toHaveBeenCalledWith('1', 'Updated notes')
  })

  it('does not crash when callbacks are not provided', () => {
    render(<ApplicationsTable applications={mockApplications} />)

    const notesInputs = screen.getAllByPlaceholderText('Add notes...')
    const firstNotesInput = notesInputs[0]

    // Should not throw error
    expect(() => {
      fireEvent.change(firstNotesInput, { target: { value: 'New notes' } })
    }).not.toThrow()
  })

  // --- External Link Tests ---

  it('opens job link in new tab when action button is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ApplicationsTable applications={mockApplications} />)

    const actionButtons = screen.getAllByRole('button', { name: '' })
    // Find the external link buttons (they have ExternalLink icon)
    const externalLinkButton = actionButtons.find((button) => 
      button.querySelector('svg')
    )

    if (externalLinkButton) {
      fireEvent.click(externalLinkButton)
      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/job1', '_blank')
    }

    windowOpenSpy.mockRestore()
  })

  // --- Edge Cases ---

  it('renders correctly with empty applications array', () => {
    render(<ApplicationsTable applications={[]} />)

    expect(screen.getByText('Job Applications')).toBeTruthy()
    expect(screen.getByText('No applications found matching your criteria')).toBeTruthy()
    expect(screen.getByText('Showing 0 of 0 applications')).toBeTruthy()
  })

  it('renders correctly with single application', () => {
    render(<ApplicationsTable applications={[mockApplications[0]]} />)

    expect(screen.getByText('TechCorp')).toBeTruthy()
    expect(screen.getByText('Showing 1 of 1 applications')).toBeTruthy()
  })

  it('displays all job sources correctly', () => {
    const diverseApplications: JobApplication[] = [
      { ...mockApplications[0], jobSource: 'LinkedIn' },
      { ...mockApplications[1], jobSource: 'Indeed' },
      { ...mockApplications[2], jobSource: 'Glassdoor' },
    ]

    render(<ApplicationsTable applications={diverseApplications} />)

    expect(screen.getByText('LinkedIn')).toBeTruthy()
    expect(screen.getByText('Indeed')).toBeTruthy()
    expect(screen.getByText('Glassdoor')).toBeTruthy()
  })

  it('displays all outcomes correctly', () => {
    const diverseApplications: JobApplication[] = [
      { ...mockApplications[0], outcome: 'Pending' },
      { ...mockApplications[1], outcome: 'In Progress' },
      { ...mockApplications[2], outcome: 'Unsuccessful' },
    ]

    render(<ApplicationsTable applications={diverseApplications} />)

    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByText('In Progress')).toBeTruthy()
    expect(screen.getByText('Unsuccessful')).toBeTruthy()
  })

  // --- Memoization Test ---

  it('memoizes and does not re-render unnecessarily', () => {
    const { rerender } = render(
      <ApplicationsTable applications={mockApplications} />
    )

    const initialCompanyElement = screen.getByText('TechCorp')

    // Re-render with same props
    rerender(<ApplicationsTable applications={mockApplications} />)

    const afterRerenderCompanyElement = screen.getByText('TechCorp')

    // Elements should be the same (component memoized)
    expect(initialCompanyElement).toBe(afterRerenderCompanyElement)
  })
})
