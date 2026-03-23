import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import AddExternalJobPage from '../../../app/applicant/addExternalJob/page'
import * as applicationFirebase from '../../../app/utils/applicationFirebase'

// Mock Next.js router
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

// Mock Clerk useAuth hook
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'test-user-123',
    isLoaded: true,
  }),
}))

// Mock Firebase utilities
vi.mock('../../../app/utils/applicationFirebase', () => ({
  saveExternalJob: vi.fn(),
}))

describe('AddExternalJobPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.mocked(applicationFirebase.saveExternalJob).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('renders Step 1 with job link input and Next/Cancel buttons', () => {
    render(<AddExternalJobPage />)

    expect(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Next/i })).toBeTruthy()
  })

  it('moves to Step 2 after entering a valid URL and clicking Next', () => {
    render(<AddExternalJobPage />)

    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2 fields
    expect(screen.getByPlaceholderText('Software Engineer')).toBeTruthy()
    expect(screen.getByPlaceholderText('Company Name')).toBeTruthy()
    expect(screen.getByPlaceholderText('Main role summary and responsibilities')).toBeTruthy()

    // Step 2 buttons
    expect(screen.getByRole('button', { name: /Back/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeTruthy()
  })

  it('shows error message when required fields are missing on Step 2', () => {
    render(<AddExternalJobPage />)

    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Click save without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(screen.getByText('Please fill in Job Name, Company Name, and Description.')).toBeTruthy()
  })

  it('saves successfully, shows overlay, then redirects to /applicant/applications after delay', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    saveExternalJobMock.mockResolvedValueOnce(undefined)

    render(<AddExternalJobPage />)

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2 required fields
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Software Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TechCorp' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'Build web apps' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(saveExternalJobMock).toHaveBeenCalled()

    // Router should not have pushed yet
    expect(pushMock).not.toHaveBeenCalled()

    // Flush pending timers (including the redirect timeout)
    await vi.runAllTimersAsync()

    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('Cancel on Step 1 redirects immediately using router.push', () => {
    render(<AddExternalJobPage />)

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('saves external job to Firebase with correct data structure', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    saveExternalJobMock.mockResolvedValueOnce(undefined)

    render(<AddExternalJobPage />)

    // Step 1: Enter URL
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://www.linkedin.com/jobs/view/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Senior Software Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TechCorp Inc.' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'Lead backend development and architect scalable systems' },
    })

    // Fill in additional fields for complete data
    fireEvent.change(screen.getByPlaceholderText('Required skills, experience, or education'), {
      target: { value: '5+ years experience\nProficiency in TypeScript\nExperience with Node.js' },
    })
    fireEvent.change(screen.getByPlaceholderText('Preferred but not required skills'), {
      target: { value: 'AWS\nDocker\nKubernetes' },
    })

    // Set job source
    const jobSourceSelect = screen.getByDisplayValue('Other')
    fireEvent.change(jobSourceSelect, { target: { value: 'LinkedIn' } })

    // Set employment type
    const employmentSelect = screen.getAllByDisplayValue('Select type')[0]
    fireEvent.change(employmentSelect, { target: { value: 'full-time' } })

    // Set work arrangement
    const workArrangementSelect = screen.getAllByDisplayValue('Select job type')[0]
    fireEvent.change(workArrangementSelect, { target: { value: 'remote' } })

    // Set location
    fireEvent.change(screen.getByPlaceholderText('United States'), {
      target: { value: 'United States' },
    })
    fireEvent.change(screen.getByPlaceholderText('Michigan'), {
      target: { value: 'Michigan' },
    })
    fireEvent.change(screen.getByPlaceholderText('Mount Pleasant'), {
      target: { value: 'Mount Pleasant' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Verify saveExternalJob was called with the correct data
    expect(saveExternalJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-123',
        jobUrl: 'https://www.linkedin.com/jobs/view/123',
        jobName: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        description: 'Lead backend development and architect scalable systems',
        jobSource: 'LinkedIn',
        employmentType: 'full-time',
        workArrangement: 'remote',
        country: 'United States',
        state: 'Michigan',
        city: 'Mount Pleasant',
      })
    )
  })

  it('redirects to My Applications after successfully saving to Firebase', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    saveExternalJobMock.mockResolvedValueOnce(undefined)

    render(<AddExternalJobPage />)

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Test Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TestCorp' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'QA testing' },
    })

    // Submit and verify Firebase was called
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(saveExternalJobMock).toHaveBeenCalled()

    // Flush pending timers (including the redirect timeout)
    await vi.runAllTimersAsync()
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('shows error when Firebase save fails', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    saveExternalJobMock.mockRejectedValueOnce(new Error('Firebase error'))

    render(<AddExternalJobPage />)

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Test Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TestCorp' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'QA testing' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(saveExternalJobMock).toHaveBeenCalled()

    // Should NOT redirect
    await vi.runAllTimersAsync()
    expect(pushMock).not.toHaveBeenCalledWith('/applicant/applications')
  })
})
