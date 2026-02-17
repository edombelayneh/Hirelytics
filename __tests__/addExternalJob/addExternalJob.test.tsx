import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import AddExternalJobPage from '../../app/addExternalJob/page'

describe('AddExternalJobPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    window.location.hash = ''
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

    expect(
      screen.getByText('Please fill in Job Name, Company Name, and Description.')
    ).toBeTruthy()
  })

  it('saves successfully, shows overlay, then redirects to #/applications after 1500ms', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

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

    
    expect(screen.getByRole('button', { name: /Saving\.\.\./i })).toBeTruthy()

    // Message + overlay text
    expect(screen.getByText(/Saved\. Redirecting to My Applications\.\.\./i)).toBeTruthy()
    expect(screen.getByText(/Saving application\.\.\./i)).toBeTruthy()
    expect(screen.getByText(/Redirecting you to My Applications\./i)).toBeTruthy()

    // Redirect
    expect(window.location.hash).toBe('')
    vi.advanceTimersByTime(1500)
    expect(window.location.hash).toBe('#/applications')

    logSpy.mockRestore()
  })

  it('Cancel on Step 1 redirects immediately to #/applications', () => {
    render(<AddExternalJobPage />)

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(window.location.hash).toBe('#/applications')
  })
})
