import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react'
import React from 'react'
import AddExternalJobPage from '../../../app/applicant/addExternalJob/page'

// Mock Next.js router
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user-123',
    isLoaded: true,
  }),
}))

// vi.hoisted ensures these are available inside the vi.mock factory (which is hoisted to top)
const { saveUserApplicationMock, buildApplicationMock } = vi.hoisted(() => ({
  saveUserApplicationMock: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  buildApplicationMock: vi.fn().mockReturnValue({
    id: 'mock-id',
    jobId: 'mock-id',
    userId: 'user-123',
  }),
}))

vi.mock('../../../app/utils/applicationFirebase', () => ({
  buildApplication: buildApplicationMock,
  saveUserApplication: saveUserApplicationMock,
}))

/** Helper: advances to Step 2 by setting URL and clicking Next */
async function goToStep2() {
  fireEvent.change(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'), {
    target: { value: 'https://example.com/job/123' },
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
  })
}

describe('AddExternalJobPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ scraped: {} }),
      }))
    )
    saveUserApplicationMock.mockResolvedValue(undefined)
    buildApplicationMock.mockReturnValue({ id: 'mock-id', jobId: 'mock-id', userId: 'user-123' })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    cleanup()
  })

  it('renders Step 1 with job link input and Next/Cancel buttons', () => {
    render(<AddExternalJobPage />)

    expect(screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Next/i })).toBeTruthy()
  })

  it('moves to Step 2 after entering a valid URL and clicking Next', async () => {
    render(<AddExternalJobPage />)

    await goToStep2()

    // Step 2 fields
    expect(screen.getByPlaceholderText('Software Engineer')).toBeTruthy()
    expect(screen.getByPlaceholderText('Company Name')).toBeTruthy()
    expect(screen.getByPlaceholderText('Main role summary and responsibilities')).toBeTruthy()

    // Step 2 buttons
    expect(screen.getByRole('button', { name: /Back/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeTruthy()
  })

  it('shows error message when required fields are missing on Step 2', async () => {
    render(<AddExternalJobPage />)

    await goToStep2()

    // Click save without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(screen.getByText('Please fill in Job Name, Company Name, and Description.')).toBeTruthy()
  })

  it('saves successfully, shows overlay, calls saveUserApplication, then redirects after delay', async () => {
    render(<AddExternalJobPage />)

    await goToStep2()

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
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    })

    // Message + overlay text
    await waitFor(() => {
      expect(screen.getByText(/Saved! Redirecting to My Applications\.\.\./i)).toBeTruthy()
    })
    expect(screen.getByText(/Saving application\.\.\./i)).toBeTruthy()
    expect(screen.getByText(/Redirecting you to My Applications\./i)).toBeTruthy()

    // Router should not have pushed yet
    expect(pushMock).not.toHaveBeenCalled()
    expect(saveUserApplicationMock).toHaveBeenCalledTimes(1)

    // Redirect runs after an ~800ms timeout in the component.
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
    })
  })

  it('Cancel on Step 1 redirects immediately using router.push', () => {
    render(<AddExternalJobPage />)

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })
})
