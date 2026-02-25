import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import AddNewJobPage from '../../../app/recruiter/addNewJob/page'

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

  it('shows unauthorized access message for non-recruiter submit attempt', () => {
    const { container } = render(<AddNewJobPage initialUserRole='applicant' />)

    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form as HTMLFormElement)

    expect(screen.getByText(/Unauthorized access/i)).toBeTruthy()
    expect(screen.queryByText(/Submitting job/i)).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('submits and shows redirect overlay, then updates hash to /jobdetails', () => {
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

    const savingBtn = screen.getByRole('button', { name: /Saving/i })
    expect(savingBtn).toBeTruthy()
    expect((savingBtn as HTMLButtonElement).disabled).toBe(true)

    expect(screen.getByText(/Job submitted\. Redirecting to Job Details/i)).toBeTruthy()
    expect(screen.getByText(/Submitting job/i)).toBeTruthy()
    expect(screen.getByText(/Redirecting you to the .* page/i)).toBeTruthy()

    expect(window.location.hash).toBe('')
    vi.advanceTimersByTime(2000)
    expect(window.location.hash).toBe('#/jobdetails')

    logSpy.mockRestore()
  })
})
