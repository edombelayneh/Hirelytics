// // __tests__/app/role/page.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import type { Role } from '../../app/components/RolePage'

/* -------------------------------------------------------------------------- */
/*                          HOIST-SAFE SHARED MOCKS                             */
/* -------------------------------------------------------------------------- */

// Anything used inside vi.mock factories MUST be hoist-safe.
// vi.hoisted ensures it exists before the mock factories execute.
const hoisted = vi.hoisted(() => {
  return {
    firebaseAuthMock: { currentUser: { uid: 'firebase_uid_123' } as { uid: string } | null },
    routerReplaceMock: vi.fn(),
  }
})

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// RolePageUI mock
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

// toast mock (no top-level refs)
vi.mock('../../app/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// createUserDoc mock
vi.mock('../../app/utils/userRole', () => ({
  createUserDoc: vi.fn(),
}))

// Clerk mocks
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  useAuth: vi.fn(),
}))

// router mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: hoisted.routerReplaceMock,
  }),
}))

// firebaseClient mock (uses hoisted object)
vi.mock('../../app/lib/firebaseClient', () => ({
  firebaseAuth: hoisted.firebaseAuthMock,
}))

/* -------------------------------------------------------------------------- */
/*                             IMPORTS AFTER MOCKS                             */
/* -------------------------------------------------------------------------- */

import RolePage from '../../app/role/page'
import { toast } from '../../app/components/ui/sonner'
import { createUserDoc } from '../../app/utils/userRole'
import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

/* -------------------------------------------------------------------------- */
/*                                   SETUP                                    */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  // reset firebase auth per test
  hoisted.firebaseAuthMock.currentUser = { uid: 'firebase_uid_123' }

  // clerk defaults
  ;(useUser as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    user: { reload: vi.fn(async (): Promise<void> => {}) },
  })
  ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    userId: 'clerk_user_123',
  })

  // createUserDoc default
  ;(createUserDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

  // fetch default
  global.fetch = vi.fn(async () => ({ ok: true })) as unknown as typeof fetch

  // clear call history
  ;(toast.error as unknown as ReturnType<typeof vi.fn>).mockClear()
  ;(createUserDoc as unknown as ReturnType<typeof vi.fn>).mockClear()

  const router = useRouter() as unknown as { replace: ReturnType<typeof vi.fn> }
  router.replace.mockClear()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('RolePage', () => {
  it('shows error if Firebase UID is missing', async () => {
    hoisted.firebaseAuthMock.currentUser = null

    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Not ready yet', {
        description: 'Try again in a moment.',
      })
    })

    expect(createUserDoc).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows error if API call fails (res.ok === false)', async () => {
    global.fetch = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch

    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    await waitFor(() => {
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'applicant',
        clerkUserId: 'clerk_user_123',
      })

      expect(toast.error).toHaveBeenCalledWith('Could not save role', {
        description: 'Please try again.',
      })
    })
  })

  it('successfully handles applicant role selection', async () => {
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    const router = useRouter() as unknown as { replace: ReturnType<typeof vi.fn> }

    await waitFor(() => {
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'applicant',
        clerkUserId: 'clerk_user_123',
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'applicant' }),
      })

      expect(router.replace).toHaveBeenCalledWith('/applicant/profile')
    })
  })

  it('successfully handles recruiter role selection', async () => {
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Recruiter'))

    const router = useRouter() as unknown as { replace: ReturnType<typeof vi.fn> }

    await waitFor(() => {
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'recruiter',
        clerkUserId: 'clerk_user_123',
      })

      expect(router.replace).toHaveBeenCalledWith('/recruiter/profile')
    })
  })

  it('passes clerkUserId as undefined when useAuth() returns null', async () => {
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      userId: null,
    })

    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    await waitFor(() => {
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'applicant',
        clerkUserId: undefined,
      })
    })
  })
})
