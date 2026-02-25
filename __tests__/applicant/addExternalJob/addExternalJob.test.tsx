import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import AddExternalJobPage from '../../../app/applicant/addExternalJob/page'

// Mock Next.js router
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('AddExternalJobPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('renders Step 1 with job link input and Next/Cancel buttons', () => {
    render(<AddExternalJobPage />)

    expect(
      screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...')
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Next/i })).toBeTruthy()
  })

  it('moves to Step 2 after entering a valid URL and clicking Next', () => {
    render(<AddExternalJobPage />)

    fireEvent.change(
      screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'),
      {
        target: { value: 'https://example.com/job/123' },
      }
    )

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2 fields
    expect(screen.getByPlaceholderText('Software Engineer')).toBeTruthy()
    expect(screen.getByPlaceholderText('Company Name')).toBeTruthy()
    expect(
      screen.getByPlaceholderText('Main role summary and responsibilities')
    ).toBeTruthy()

    // Step 2 buttons
    expect(screen.getByRole('button', { name: /Back/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeTruthy()
  })

  it('shows error message when required fields are missing on Step 2', () => {
    render(<AddExternalJobPage />)

    fireEvent.change(
      screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'),
      {
        target: { value: 'https://example.com/job/123' },
      }
    )
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Click save without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(
      screen.getByText('Please fill in Job Name, Company Name, and Description.')
    ).toBeTruthy()
  })

  it('saves successfully, shows overlay, then redirects to /applicant/applications after delay', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<AddExternalJobPage />)

    // Step 1
    fireEvent.change(
      screen.getByPlaceholderText('https://www.linkedin.com/jobs/view/...'),
      {
        target: { value: 'https://example.com/job/123' },
      }
    )
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2 required fields
    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Software Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TechCorp' },
    })
    fireEvent.change(
      screen.getByPlaceholderText('Main role summary and responsibilities'),
      {
        target: { value: 'Build web apps' },
      }
    )

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Message + overlay text
    expect(
      screen.getByText(/Saved\. Redirecting to My Applications\.\.\./i)
    ).toBeTruthy()
    expect(screen.getByText(/Saving application\.\.\./i)).toBeTruthy()
    expect(
      screen.getByText(/Redirecting you to My Applications\./i)
    ).toBeTruthy()

    // Router should not have pushed yet
    expect(pushMock).not.toHaveBeenCalled()

    // We used ~800ms in the component; advance past that
    vi.advanceTimersByTime(1000)

    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')

    logSpy.mockRestore()
  })

  it('Cancel on Step 1 redirects immediately using router.push', () => {
    render(<AddExternalJobPage />)

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(pushMock).toHaveBeenCalledWith('/applicant/applications')
  })
})