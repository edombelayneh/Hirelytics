import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ProfilePage } from '../../../app/applicant/profile/ProfilePage'
import { toast } from '../../../app/components/ui/sonner'

// Mock Clerk's useUser hook
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      id: 'user_123',
      firstName: 'Jane',
      lastName: 'Doe',
      primaryEmailAddress: { emailAddress: 'jane.doe@example.com' },
    },
  }),
}))

// Mock toast
vi.mock('../../../app/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockProfile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '989-989-4573',
  location: 'Mount Pleasant',
  currentTitle: 'Software Engineer',
  yearsOfExperience: '10',
  availability: 'Immediately',
  linkedinUrl: 'https://linkedin.com',
  portfolioUrl: 'https://portfolio.com',
  githubUrl: 'https://github.com',
  bio: 'Driven learner focused on growth.',
  profilePicture: '',
  resumeFile: '',
  resumeFileName: '',
}

const mockOnUpdateProfile = vi.fn()
const mockOnAddJobHistory = vi.fn()
const mockOnEditJobHistory = vi.fn()
const mockOnDeleteJobHistory = vi.fn()

describe('ProfilePage job history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows validation error when job history fields are missing', async () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={[]}
        jobHistoryLoading={false}
        onAddJobHistory={vi.fn()}
        onEditJobHistory={vi.fn()}
        onDeleteJobHistory={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /save and add another/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Missing job history fields',
        expect.objectContaining({
          description: 'Please fill in company, title, role description, start date, and end date.',
        })
      )
    })
  })

  it('adds a new job history item', async () => {
    mockOnAddJobHistory.mockResolvedValueOnce(undefined)

    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={[]}
        jobHistoryLoading={false}
        onAddJobHistory={mockOnAddJobHistory}
        onEditJobHistory={mockOnEditJobHistory}
        onDeleteJobHistory={mockOnDeleteJobHistory}
      />
    )

    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Office of Information Technology' },
    })

    fireEvent.change(screen.getByLabelText(/^title$/i), {
      target: { value: 'Student Classroom Technician' },
    })

    fireEvent.change(screen.getByLabelText(/role description/i), {
      target: { value: 'Managed classroom AV systems' },
    })

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2025-01-01' },
    })

    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: '2026-01-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save and add another/i }))

    await waitFor(() => {
      expect(mockOnAddJobHistory).toHaveBeenCalledWith({
        company: 'Office of Information Technology',
        title: 'Student Classroom Technician',
        roleDescription: 'Managed classroom AV systems',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        isCurrent: false,
      })
    })
  })

  it('allows editing an existing job history item', async () => {
    const existingJobs = [
      {
        id: 'job1',
        company: 'CMU OIT',
        title: 'Student Technician',
        roleDescription: 'Helped classrooms',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
        isCurrent: false,
      },
    ]

    mockOnEditJobHistory.mockResolvedValueOnce(undefined)

    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={existingJobs}
        jobHistoryLoading={false}
        onAddJobHistory={mockOnAddJobHistory}
        onEditJobHistory={mockOnEditJobHistory}
        onDeleteJobHistory={mockOnDeleteJobHistory}
      />
    )

    // enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    // confirm fields were populated
    expect((screen.getByLabelText(/company/i) as HTMLInputElement).value).toBe('CMU OIT')

    // update company name
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Office of Information Technology' },
    })

    // submit update
    fireEvent.click(screen.getByRole('button', { name: /update job history/i }))

    await waitFor(() => {
      expect(mockOnEditJobHistory).toHaveBeenCalledWith('job1', {
        company: 'Office of Information Technology',
        title: 'Student Technician',
        roleDescription: 'Helped classrooms',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
        isCurrent: false,
      })
    })
  })

  it('calls delete job history when delete button is clicked', async () => {
    const existingJobs = [
      {
        id: 'job1',
        company: 'CMU OIT',
        title: 'Student Technician',
        roleDescription: 'Helped classrooms',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
        isCurrent: false,
      },
    ]

    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={existingJobs}
        jobHistoryLoading={false}
        onAddJobHistory={mockOnAddJobHistory}
        onEditJobHistory={mockOnEditJobHistory}
        onDeleteJobHistory={mockOnDeleteJobHistory}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(mockOnDeleteJobHistory).toHaveBeenCalledWith('job1')
    })
  })

  it('shows validation error when start date is after end date', async () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={[]}
        jobHistoryLoading={false}
        onAddJobHistory={mockOnAddJobHistory}
        onEditJobHistory={mockOnEditJobHistory}
        onDeleteJobHistory={mockOnDeleteJobHistory}
      />
    )

    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'CMU OIT' },
    })

    fireEvent.change(screen.getByLabelText(/^title$/i), {
      target: { value: 'Student Technician' },
    })

    fireEvent.change(screen.getByLabelText(/role description/i), {
      target: { value: 'Helped classrooms' },
    })

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2026-12-01' },
    })

    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: '2025-01-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save and add another/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Invalid job history dates',
        expect.objectContaining({
          description: 'Start date cannot be after end date.',
        })
      )
    })

    expect(mockOnAddJobHistory).not.toHaveBeenCalled()
  })

  it('allows saving a current job without an end date', async () => {
    mockOnAddJobHistory.mockResolvedValueOnce(undefined)

    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={[]}
        jobHistoryLoading={false}
        onAddJobHistory={mockOnAddJobHistory}
        onEditJobHistory={mockOnEditJobHistory}
        onDeleteJobHistory={mockOnDeleteJobHistory}
      />
    )

    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'CMU OIT' },
    })

    fireEvent.change(screen.getByLabelText(/^title$/i), {
      target: { value: 'Student Technician' },
    })

    fireEvent.change(screen.getByLabelText(/role description/i), {
      target: { value: 'Helped classrooms' },
    })

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2025-01-01' },
    })

    fireEvent.click(screen.getByLabelText(/i currently work here/i))

    fireEvent.click(screen.getByRole('button', { name: /save and add another/i }))

    await waitFor(() => {
      expect(mockOnAddJobHistory).toHaveBeenCalledWith({
        company: 'CMU OIT',
        title: 'Student Technician',
        roleDescription: 'Helped classrooms',
        startDate: '2025-01-01',
        isCurrent: true,
      })
    })
  })

  it('disables end date when current job is selected', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
        jobHistory={[]}
        jobHistoryLoading={false}
        onAddJobHistory={mockOnAddJobHistory}
        onEditJobHistory={mockOnEditJobHistory}
        onDeleteJobHistory={mockOnDeleteJobHistory}
      />
    )

    const checkbox = screen.getByLabelText(/i currently work here/i)
    const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement

    fireEvent.click(checkbox)

    expect(endDateInput.disabled).toBe(true)
  })
})
