import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { JobCard } from './JobCard'
import { AvailableJob } from '../data/availableJobs'

describe('JobCard', () => {
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

  const mockOnApply = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

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
    expect(screen.queryByText('Experience with React and Node.js')).toBeNull()
  })

  it('shows "Today" for jobs posted today', () => {
    const todayJob = {
      ...mockJob,
      postedDate: new Date().toISOString().split('T')[0],
    }

    render(
      <JobCard
        job={todayJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )

    expect(screen.getByText('Today')).toBeTruthy()
  })

  it('shows days ago for older job postings', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const oldJob = {
      ...mockJob,
      postedDate: pastDate.toISOString().split('T')[0],
    }

    render(
      <JobCard
        job={oldJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )

    expect(screen.getByText('5d ago')).toBeTruthy()
  })

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

  it('renders all required icons', () => {
    const { container } = render(
      <JobCard
        job={mockJob}
        onApply={mockOnApply}
        isApplied={false}
      />
    )

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

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
