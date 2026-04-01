import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react'
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
  // Setup: Reset all mocks and timers before each test
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    // Mock the Firebase save function to resolve successfully by default
    vi.mocked(applicationFirebase.saveExternalJob).mockResolvedValue(undefined)
  })

  // Cleanup: Ensure all pending timers are flushed and real timers are restored
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    cleanup()
  })

  it('renders Step 1 with job link input and Next/Cancel buttons', () => {
    // Render the page component
    render(<AddExternalJobPage />)

    // Verify the URL input field is present
    expect(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...')).toBeTruthy()
    // Verify Cancel button is present (for returning to applications)
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    // Verify Next button is present (for proceeding to Step 2)
    expect(screen.getByRole('button', { name: /Next/i })).toBeTruthy()
  })

  it('moves to Step 2 after entering a valid URL and clicking Next', async () => {
    render(<AddExternalJobPage />)

    // Enter a valid job URL
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })

    // Click Next to proceed to the job details confirmation step
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Verify Step 2 fields are now visible (job details form)
    expect(screen.getByPlaceholderText('Software Engineer')).toBeTruthy()
    expect(screen.getByPlaceholderText('Company Name')).toBeTruthy()
    expect(screen.getByPlaceholderText('Main role summary and responsibilities')).toBeTruthy()

    // Verify Step 2 buttons are present
    expect(screen.getByRole('button', { name: /Back/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeTruthy()
  })

  it('shows error message when required fields are missing on Step 2', async () => {
    render(<AddExternalJobPage />)

    // Proceed to Step 2 with a valid URL
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Try to save without filling in any required fields
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Verify error message is displayed
    expect(screen.getByText('Please fill in Job Name, Company Name, and Description.')).toBeTruthy()
  })

  it('saves successfully, shows overlay, then redirects to /applicant/applications after delay', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    saveExternalJobMock.mockResolvedValueOnce(undefined)

    render(<AddExternalJobPage />)

    // Step 1: Enter a valid job URL
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    // Click Next to proceed to Step 2 (job details confirmation)
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill in all required fields (Job Name, Company Name, Description)
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Software Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TechCorp' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'Build web apps' },
    })

    // Submit the form to save the external job
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Verify the save function was called
    expect(saveExternalJobMock).toHaveBeenCalled()

    // Router should not navigate yet (redirect is delayed)
    expect(pushMock).not.toHaveBeenCalled()
    expect(saveUserApplicationMock).toHaveBeenCalledTimes(1)

    // Flush all pending timers to trigger the delayed redirect
    await vi.runAllTimersAsync()

    // Verify the user was redirected to their applications page
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('Cancel on Step 1 redirects immediately using router.push', () => {
    render(<AddExternalJobPage />)

    // Click the Cancel button on Step 1 (before entering any URL)
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    // Verify the user is redirected back to the applications page immediately
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('saves external job to Firebase with correct data structure', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    saveExternalJobMock.mockResolvedValueOnce(undefined)

    render(<AddExternalJobPage />)

    // Step 1: Enter a job URL
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://www.linkedin.com/jobs/view/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill in all required and optional fields to test complete data capture
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Senior Software Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TechCorp Inc.' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'Lead backend development and architect scalable systems' },
    })

    // Fill in additional fields for complete data validation
    fireEvent.change(screen.getByPlaceholderText('Required skills, experience, or education'), {
      target: { value: '5+ years experience\nProficiency in TypeScript\nExperience with Node.js' },
    })
    fireEvent.change(screen.getByPlaceholderText('Preferred but not required skills'), {
      target: { value: 'AWS\nDocker\nKubernetes' },
    })

    // Set categorical fields
    const jobSourceSelect = screen.getByDisplayValue('Other')
    fireEvent.change(jobSourceSelect, { target: { value: 'LinkedIn' } })

    const employmentSelect = screen.getAllByDisplayValue('Select type')[0]
    fireEvent.change(employmentSelect, { target: { value: 'full-time' } })

    const workArrangementSelect = screen.getAllByDisplayValue('Select job type')[0]
    fireEvent.change(workArrangementSelect, { target: { value: 'remote' } })

    // Set location fields
    fireEvent.change(screen.getByPlaceholderText('United States'), {
      target: { value: 'United States' },
    })
    fireEvent.change(screen.getByPlaceholderText('Michigan'), {
      target: { value: 'Michigan' },
    })
    fireEvent.change(screen.getByPlaceholderText('Mount Pleasant'), {
      target: { value: 'Mount Pleasant' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Verify saveExternalJob was called with all the expected data fields
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

    // Step 1: Enter a valid URL and proceed to Step 2
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill in only the required fields (minimal save test)
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

    // Flush pending timers to trigger the delayed redirect
    await vi.runAllTimersAsync()

    // Verify the user was redirected to their applications page
    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })

  it('shows error when Firebase save fails', async () => {
    const saveExternalJobMock = vi.mocked(applicationFirebase.saveExternalJob)
    // Mock the save function to reject with an error
    saveExternalJobMock.mockRejectedValueOnce(new Error('Firebase error'))

    render(<AddExternalJobPage />)

    // Step 1: Enter a valid URL and proceed to Step 2
    fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
      target: { value: 'https://example.com/job/123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Test Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TestCorp' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'QA testing' },
    })

    // Submit the form (which will fail in Firebase)
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Verify the save was attempted
    expect(saveExternalJobMock).toHaveBeenCalled()

    // Flush all timers
    await vi.runAllTimersAsync()

    // Verify the user was NOT redirected (because save failed)
    expect(pushMock).not.toHaveBeenCalledWith('/applicant/applications')
  })
})
