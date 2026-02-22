// __tests__/components/RolePageUI.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { RolePageUI } from '../../app/components/RolePage'

describe('RolePageUI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the heading and both role options', () => {
    const onSelectRole = vi.fn()

    render(<RolePageUI onSelectRole={onSelectRole} />)

    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByText('Before you continue, tell us what you are here to do.')).toBeTruthy()

    expect(screen.getByText('Apply to jobs')).toBeTruthy()
    expect(screen.getByText('Post jobs')).toBeTruthy()
  })

  it('calls onSelectRole with "applicant" when Apply to jobs is clicked', async () => {
    const onSelectRole = vi.fn(async () => {})

    render(<RolePageUI onSelectRole={onSelectRole} />)

    fireEvent.click(screen.getByRole('button', { name: /apply to jobs/i }))

    await waitFor(() => {
      expect(onSelectRole).toHaveBeenCalledTimes(1)
      expect(onSelectRole).toHaveBeenCalledWith('applicant')
    })
  })

  it('calls onSelectRole with "recruiter" when Post jobs is clicked', async () => {
    const onSelectRole = vi.fn(async () => {})

    render(<RolePageUI onSelectRole={onSelectRole} />)

    fireEvent.click(screen.getByRole('button', { name: /post jobs/i }))

    await waitFor(() => {
      expect(onSelectRole).toHaveBeenCalledTimes(1)
      expect(onSelectRole).toHaveBeenCalledWith('recruiter')
    })
  })

  it('disables both buttons while saving, and shows the saving message', async () => {
    const deferred: { resolve: () => void } = {
      resolve: () => {},
    }

    const pending = new Promise<void>((resolve) => {
      deferred.resolve = resolve
    })

    const onSelectRole = vi.fn(() => pending)

    render(<RolePageUI onSelectRole={onSelectRole} />)

    const applicantBtn = screen.getByRole('button', { name: /apply to jobs/i }) as HTMLButtonElement
    const recruiterBtn = screen.getByRole('button', { name: /post jobs/i }) as HTMLButtonElement

    fireEvent.click(applicantBtn)

    // while pending
    expect(applicantBtn.disabled).toBe(true)
    expect(recruiterBtn.disabled).toBe(true)
    expect(screen.getByText('Saving your choice...')).toBeTruthy()

    // resolve promise -> component should re-enable
    deferred.resolve()

    await waitFor(() => {
      expect(applicantBtn.disabled).toBe(false)
      expect(recruiterBtn.disabled).toBe(false)
      expect(screen.queryByText('Saving your choice...')).toBeNull()
    })
  })

  it('re-enables buttons even if onSelectRole throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Return a promise that rejects, but is *handled* to avoid unhandled rejection noise
    const onSelectRole = vi.fn(() => Promise.reject(new Error('fail')).catch(() => {}))

    render(<RolePageUI onSelectRole={onSelectRole} />)

    const applicantBtn = screen.getByRole('button', { name: /apply to jobs/i }) as HTMLButtonElement
    const recruiterBtn = screen.getByRole('button', { name: /post jobs/i }) as HTMLButtonElement

    fireEvent.click(applicantBtn)

    await waitFor(() => {
      expect(applicantBtn.disabled).toBe(false)
      expect(recruiterBtn.disabled).toBe(false)
    })

    errorSpy.mockRestore()
  })
})
