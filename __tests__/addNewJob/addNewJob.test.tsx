// app/addNewJob/AddNewJobPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import AddNewJobPage from '../../app/addNewJob/page' // <-- if test is in same folder as page.tsx

describe('AddNewJobPage', () => {
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

  it('renders required form fields', () => {
    render(<AddNewJobPage />)

    expect(screen.getByPlaceholderText('Software Engineer')).toBeTruthy()
    expect(screen.getByPlaceholderText('Company Name')).toBeTruthy()
    expect(screen.getByPlaceholderText('recruiter@company.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('Main role summary and responsibilities')).toBeTruthy()

    expect(screen.getByRole('button', { name: /Add Job/i })).toBeTruthy()
  })

  it('shows error message when required fields are missing', () => {
    render(<AddNewJobPage />)

    fireEvent.click(screen.getByRole('button', { name: /Add Job/i }))

    expect(
      screen.getByText(/Please fill in Job Name, Company Name, Description, and Recruiter Email/i)
    ).toBeTruthy()

    expect(screen.queryByText(/Submitting job/i)).toBeNull()
  })

  it('submits and shows redirect overlay, then updates hash to /jobs', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<AddNewJobPage />)

    fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
      target: { value: 'Software Engineer' },
    })
    fireEvent.change(screen.getByPlaceholderText('Company Name'), {
      target: { value: 'TechCorp' },
    })
    fireEvent.change(screen.getByPlaceholderText('recruiter@company.com'), {
      target: { value: 'recruiter@techcorp.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
      target: { value: 'Build web apps' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Add Job/i }))

    // Button should change to "Saving..." + disabled
    const savingBtn = screen.getByRole('button', { name: /Saving/i })
    expect(savingBtn).toBeTruthy()
    expect((savingBtn as HTMLButtonElement).disabled).toBe(true)

    // Message + overlay
    expect(screen.getByText(/Job submitted\. Redirecting to Available Jobs/i)).toBeTruthy()
    expect(screen.getByText(/Submitting job/i)).toBeTruthy()
    expect(screen.getByText(/Redirecting you to the Available Jobs page/i)).toBeTruthy()

    // Redirect after 2s
    expect(window.location.hash).toBe('')
    vi.advanceTimersByTime(2000)
    expect(window.location.hash).toBe('#/jobs')

    logSpy.mockRestore()
  })
})
