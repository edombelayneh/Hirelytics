// __tests__/app/RolePage.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import type { Role } from '../../app/components/RolePage'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Mock RolePageUI so we can trigger onSelectRole directly
vi.mock('../../app/components/RolePage', () => ({
  RolePageUI: ({ onSelectRole }: { onSelectRole: (role: Role) => Promise<void> | void }) => (
    <div>
      <button
        type='button'
        onClick={() => onSelectRole('applicant')}
      >
        Pick Applicant
      </button>
      <button
        type='button'
        onClick={() => onSelectRole('recruiter')}
      >
        Pick Recruiter
      </button>
    </div>
  ),
}))

// Mock Clerk useUser
const reloadMock = vi.fn(async (): Promise<void> => {})
const useUserMock = vi.fn()

vi.mock('@clerk/nextjs', () => ({
  useUser: () => useUserMock(),
}))

/* -------------------------------------------------------------------------- */
/*                            IMPORT AFTER MOCKS                              */
/* -------------------------------------------------------------------------- */

import RolePage from '../../app/role/page'

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('RolePage (wrapper)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // user exists by default
    useUserMock.mockReturnValue({
      user: { reload: reloadMock },
    })

    // mock fetch globally
    globalThis.fetch = fetchMock as unknown as typeof fetch

    // mock window.location.assign safely
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        assign: vi.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('POSTs role, reloads user, then navigates to applicant route', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true } as unknown as Response)

    render(<RolePage />)

    fireEvent.click(screen.getByRole('button', { name: /pick applicant/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'applicant' }),
      })
      expect(reloadMock).toHaveBeenCalledTimes(1)
      expect(window.location.assign).toHaveBeenCalledWith('/applicant/applications')
    })
  })

  it('POSTs role, reloads user, then navigates to recruiter route', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true } as unknown as Response)

    render(<RolePage />)

    fireEvent.click(screen.getByRole('button', { name: /pick recruiter/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'recruiter' }),
      })
      expect(reloadMock).toHaveBeenCalledTimes(1)
      expect(window.location.assign).toHaveBeenCalledWith('/recruiter/myJobs')
    })
  })

  it('does not reload or navigate if API response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false } as unknown as Response)

    render(<RolePage />)

    fireEvent.click(screen.getByRole('button', { name: /pick applicant/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    expect(reloadMock).not.toHaveBeenCalled()
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('does not crash if user is undefined; still navigates when API ok', async () => {
    useUserMock.mockReturnValue({ user: undefined })
    fetchMock.mockResolvedValueOnce({ ok: true } as unknown as Response)

    render(<RolePage />)

    fireEvent.click(screen.getByRole('button', { name: /pick recruiter/i }))

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith('/recruiter/myJobs')
    })
  })
})
