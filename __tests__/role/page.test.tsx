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
    // Cleanup the DOM and reset mocks after each test to prevent test interference
    cleanup()
  })

  it('POSTs role, reloads user, then navigates to applicant route', async () => {
    // This tests the full flow of selecting a role, including the API call and navigation
    fetchMock.mockResolvedValueOnce({ ok: true } as unknown as Response)

    render(<RolePage />)

    // Simulate user clicking the button to select applicant role
    fireEvent.click(screen.getByRole('button', { name: /pick applicant/i }))

    // Wait for the async actions to complete and assert the expected calls and navigation
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
    // This tests the flow for selecting the recruiter role
    fetchMock.mockResolvedValueOnce({ ok: true } as unknown as Response)

    render(<RolePage />)

    // Simulate user clicking the button to select recruiter role
    fireEvent.click(screen.getByRole('button', { name: /pick recruiter/i }))

    // Wait for the async actions to complete and assert the expected calls and navigation
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
    // This tests the error handling flow where if the API call fails, it should not attempt to reload the user or navigate
    fetchMock.mockResolvedValueOnce({ ok: false } as unknown as Response)

    render(<RolePage />)

    // Simulate user clicking the button to select applicant role
    fireEvent.click(screen.getByRole('button', { name: /pick applicant/i }))

    // Wait for the async actions to complete and assert that reload and navigation do not happen
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    // Assert that reload and navigation were not called
    expect(reloadMock).not.toHaveBeenCalled()
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('does not crash if user is undefined; still navigates when API ok', async () => {
    // This tests the edge case where useUser returns undefined for user, but the API call still succeeds
    useUserMock.mockReturnValue({ user: undefined })
    fetchMock.mockResolvedValueOnce({ ok: true } as unknown as Response)

    render(<RolePage />)

    // Simulate user clicking the button to select recruiter role
    fireEvent.click(screen.getByRole('button', { name: /pick recruiter/i }))

    // Wait for the async actions to complete and assert that it still attempts to navigate even if user is undefined
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith('/recruiter/myJobs')
    })
  })
})
