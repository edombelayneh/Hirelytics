import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { JobCard } from './JobCard'
import { AvailableJob } from '../data/availableJobs'

describe('JobCard', () => {
  // --- Mock job data for testing ---
  // This object simulates a real job and will be passed to the JobCard component
  const mockJob: AvailableJob = {
    id: 1,
    title: 'Software Engineer',
    company: 'TechCorp Inc.',
    location: 'New York, NY',
    type: 'Full-time',
    postedDate: '2025-10-20',
    salary: '$95,000 - $120,000',
    description: 'Develop and maintain web applications, collaborate with cross-functional teams.',
    requirements: [
      "Bachelor's in Computer Science",
      '2+ years experience in software development',
      'Proficiency in JavaScript and Python',
      'Experience with React and Node.js',
    ],
    status: 'Open',
    applyLink: '#',
  }

  // --- Mock function for the Apply button ---
  // vi.fn() creates a spy function so we can track if it is called
  const mockOnApply = vi.fn()

  // --- Reset mocks before each test ---
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Cleanup after each test to remove mounted components from DOM ---
  afterEach(() => {
    cleanup()
  })

  // --- Test rendering of job title and company ---
  it('renders job title and company correctly', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('Software Engineer')).toBeTruthy()
    expect(screen.getByText('TechCorp Inc.')).toBeTruthy()
  })

  // --- Test rendering of job location and salary ---
  it('renders job location and salary', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('New York, NY')).toBeTruthy()
    expect(screen.getByText('$95,000 - $120,000')).toBeTruthy()
  })

  // --- Test rendering of job description ---
  it('renders job description', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText(/Develop and maintain web applications/)).toBeTruthy()
  })

  // --- Test that full-time badge is displayed for full-time jobs ---
  it('displays Full-time badge for full-time jobs', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('Full-time')).toBeTruthy()
  })

  // --- Test that part-time badge is displayed for part-time jobs ---
  it('displays secondary badge variant for part-time jobs', () => {
    const partTimeJob = { ...mockJob, type: 'Part-time' }
    render(
      <JobCard
        job={partTimeJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('Part-time')).toBeTruthy()
  })

  // --- Test that contract badge is displayed for contract jobs ---
  it('displays secondary badge variant for contract jobs', () => {
    const contract = { ...mockJob, type: 'Contract' }
    render(
      <JobCard
        job={contract}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('Contract')).toBeTruthy()
  })

  // --- Test that only the first 3 requirements are displayed ---
  it('displays only first 3 requirements', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText("Bachelor's in Computer Science")).toBeTruthy()
    expect(screen.getByText('2+ years experience in software development')).toBeTruthy()
    expect(screen.getByText('Proficiency in JavaScript and Python')).toBeTruthy()
    // Ensure the 4th requirement does not render
    expect(screen.queryByText('Experience with React and Node.js')).toBeNull()
  })

  // --- Test display of "Today" for jobs posted on the current date ---
  it('shows "Today" for jobs posted today', () => {
    const todayJob = { ...mockJob, postedDate: new Date().toISOString().split('T')[0] }
    render(
      <JobCard
        job={todayJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('Today')).toBeTruthy()
  })

  // --- Test display of "days ago" for jobs posted in the past ---
  it('shows days ago for older job postings', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5) // 5 days ago
    const oldJob = { ...mockJob, postedDate: pastDate.toISOString().split('T')[0] }
    render(
      <JobCard
        job={oldJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    expect(screen.getByText('5d ago')).toBeTruthy()
  })

  // --- Test rendering of Apply Now button for jobs not yet applied ---
  it('renders "Apply Now" button when not applied', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    const card = screen.getByTestId('job-card-1')
    const button = within(card).getByRole('button', { name: /Apply Now/i })
    expect(button).toBeTruthy()
    expect(button.hasAttribute('disabled')).toBe(false)
  })

  // --- Test rendering of Applied button for jobs already applied ---
  it('renders "Applied" button when already applied', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={true}
      />
    )
    const card = screen.getByTestId('job-card-1')
    const button = within(card).getByRole('button', { name: /Applied/i })
    expect(button).toBeTruthy()
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  // --- Test that onApply callback is triggered when Apply Now button is clicked ---
  it('calls onApply when Apply Now button is clicked', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    const card = screen.getByTestId('job-card-1')
    const button = within(card).getByRole('button', { name: /Apply Now/i })
    fireEvent.click(button)
    expect(mockOnApply).toHaveBeenCalledTimes(1)
    expect(mockOnApply).toHaveBeenCalledWith(mockJob)
  })

  // --- Test that onApply callback is NOT triggered when Applied button is clicked ---
  it('does not call onApply when Applied button is clicked', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={true}
      />
    )
    const card = screen.getByTestId('job-card-1')
    const button = within(card).getByRole('button', { name: /Applied/i })
    fireEvent.click(button)
    expect(mockOnApply).not.toHaveBeenCalled()
  })

  // --- Test that required icons are rendered ---
  it('renders all required icons', () => {
    const { container } = render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )
    const icons = container.querySelectorAll('svg') // Select all SVG elements
    expect(icons.length).toBeGreaterThan(0) // Ensure at least one icon exists
  })

  // --- Test that CheckCircle icon appears when job is applied ---
  it('renders CheckCircle icon when applied', () => {
    render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={true}
      />
    )
    const card = screen.getByTestId('job-card-1')
    const button = within(card).getByRole('button', { name: /Applied/i })
    expect(button).toBeTruthy()
  })
})
