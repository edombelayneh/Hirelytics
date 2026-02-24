// __tests__/components/RolePageUI.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { RolePageUI } from '../../app/components/RolePage'

describe('RolePageUI', () => {
  beforeEach(() => {
    // Reset mock call history before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Unmount component + reset DOM after each test
    cleanup()
  })

  it('renders the heading and both role options', () => {
    // Create mock handler for role selection
    const onSelectRole = vi.fn()

    render(<RolePageUI onSelectRole={onSelectRole} />)

    expect(screen.getByText('Welcome')).toBeTruthy()
    // Verify subtext exists
    expect(screen.getByText('Before you continue, tell us what you are here to do.')).toBeTruthy()
    // Verify both role choices render
    expect(screen.getByText('Apply to jobs')).toBeTruthy()
    expect(screen.getByText('Post jobs')).toBeTruthy()
  })

  it('calls onSelectRole with "applicant" when Apply to jobs is clicked', async () => {
    // Use async mock because component likely awaits it
    const onSelectRole = vi.fn(async () => {})

    render(<RolePageUI onSelectRole={onSelectRole} />)
    // Click applicant option
    fireEvent.click(screen.getByRole('button', { name: /apply to jobs/i }))
    // Wait for async handler to be called
    await waitFor(() => {
      expect(onSelectRole).toHaveBeenCalledTimes(1)
      expect(onSelectRole).toHaveBeenCalledWith('applicant')
    })
  })

  it('calls onSelectRole with "recruiter" when Post jobs is clicked', async () => {
    // Async handler mock
    const onSelectRole = vi.fn(async () => {})

    render(<RolePageUI onSelectRole={onSelectRole} />)
    // Click recruiter option
    fireEvent.click(screen.getByRole('button', { name: /post jobs/i }))
    // Verify correct role is passed
    await waitFor(() => {
      expect(onSelectRole).toHaveBeenCalledTimes(1)
      expect(onSelectRole).toHaveBeenCalledWith('recruiter')
    })
  })

  it('disables both buttons while saving, and shows the saving message', async () => {
    // Holder so we can resolve the promise later
    const deferred: { resolve: () => void } = {
      resolve: () => {},
    }
    // Create a promise that stays pending until we resolve it
    const pending = new Promise<void>((resolve) => {
      deferred.resolve = resolve
    })
    // Handler returns the pending promise (simulates saving)
    const onSelectRole = vi.fn(() => pending)

    render(<RolePageUI onSelectRole={onSelectRole} />)
    // Grab both buttons
    const applicantBtn = screen.getByRole('button', { name: /apply to jobs/i }) as HTMLButtonElement
    const recruiterBtn = screen.getByRole('button', { name: /post jobs/i }) as HTMLButtonElement

    fireEvent.click(applicantBtn)

    // while pending
    expect(applicantBtn.disabled).toBe(true)
    expect(recruiterBtn.disabled).toBe(true)
    expect(screen.getByText('Saving your choice...')).toBeTruthy()

    // resolve promise -> component should re-enable
    deferred.resolve()
    // After resolve: buttons enabled + message removed
    await waitFor(() => {
      expect(applicantBtn.disabled).toBe(false)
      expect(recruiterBtn.disabled).toBe(false)
      expect(screen.queryByText('Saving your choice...')).toBeNull()
    })
  })

  it('re-enables buttons even if onSelectRole throws', async () => {
    // Silence console.error spam for this test
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Return a promise that rejects, but is *handled* to avoid unhandled rejection noise
    const onSelectRole = vi.fn(() => Promise.reject(new Error('fail')).catch(() => {}))

    render(<RolePageUI onSelectRole={onSelectRole} />)
    // Grab both buttons
    const applicantBtn = screen.getByRole('button', { name: /apply to jobs/i }) as HTMLButtonElement
    const recruiterBtn = screen.getByRole('button', { name: /post jobs/i }) as HTMLButtonElement
    // Trigger failing path
    fireEvent.click(applicantBtn)
    // Buttons should recover to enabled state
    await waitFor(() => {
      expect(applicantBtn.disabled).toBe(false)
      expect(recruiterBtn.disabled).toBe(false)
    })
    // Restore console behavior
    errorSpy.mockRestore()
  })
})
