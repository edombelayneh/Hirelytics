// // __tests__/app/role/page.test.tsx
// This file tests the RolePage component that lets users choose between "Applicant" or "Recruiter" roles
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import type { Role } from '../../app/components/RolePage'

/* -------------------------------------------------------------------------- */
/*                          HOIST-SAFE SHARED MOCKS                             */
/* -------------------------------------------------------------------------- */

// Mocks need special handling so they're ready before any test code runs
const hoisted = vi.hoisted(() => {
  return {
    firebaseAuthMock: { currentUser: { uid: 'firebase_uid_123' } as { uid: string } | null },
    routerReplaceMock: vi.fn(),
  }
})

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Pretend the RolePage UI component exists and give it fake buttons for testing
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

// Pretend the toast notification system exists (just tracks if it was called)
vi.mock('../../app/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// Pretend the user document creation function exists
vi.mock('../../app/utils/userRole', () => ({
  createUserDoc: vi.fn(),
}))

// Pretend Clerk authentication tools exist
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  useAuth: vi.fn(),
}))

// Pretend Next.js router exists (used to move between pages)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: hoisted.routerReplaceMock,
  }),
}))

// Pretend Firebase authentication exists (tracks who is logged in)
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

// Run this before each test to set up a fresh starting state
beforeEach(() => {
  // Reset Firebase user to be "logged in" for most tests
  hoisted.firebaseAuthMock.currentUser = { uid: 'firebase_uid_123' }

  // Pretend a Clerk user is logged in
  ;(useUser as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    user: { reload: vi.fn(async (): Promise<void> => {}) },
  })
  ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    userId: 'clerk_user_123',
  })

  // Pretend the user document creation always succeeds
  ;(createUserDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

  // Pretend API calls always succeed by default
  global.fetch = vi.fn(async () => ({ ok: true })) as unknown as typeof fetch

  // Clear any record of previous function calls from earlier tests
  ;(toast.error as unknown as ReturnType<typeof vi.fn>).mockClear()
  ;(createUserDoc as unknown as ReturnType<typeof vi.fn>).mockClear()

  const router = useRouter() as unknown as { replace: ReturnType<typeof vi.fn> }
  router.replace.mockClear()
})

// Clean up after each test finishes
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

// A group of tests for the RolePage component
describe('RolePage', () => {
  // Test: What happens if Firebase user ID is missing (not logged in)?
  it('shows error if Firebase UID is missing', async () => {
    // Pretend no one is logged in to Firebase
    hoisted.firebaseAuthMock.currentUser = null

    // Show the role page and click the applicant button
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    // Expect an error toast to appear saying "Not ready yet"
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Not ready yet', {
        description: 'Try again in a moment.',
      })
    })

    // The user document should NOT have been created since we're not logged in
    expect(createUserDoc).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // Test: What happens if the API call to save the role fails?
  it('shows error if API call fails (res.ok === false)', async () => {
    // Pretend the API call fails
    global.fetch = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch

    // Show the role page and click the applicant button
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    // Wait for the user document to be created and an error to appear
    await waitFor(() => {
      // Check that we tried to save the user with applicant role
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'applicant',
        clerkUserId: 'clerk_user_123',
      })

      // Check that an error toast appeared
      expect(toast.error).toHaveBeenCalledWith('Could not save role', {
        description: 'Please try again.',
      })
    })
  })

  // Test: Does selecting "Applicant" role work correctly?
  it('successfully handles applicant role selection', async () => {
    // Show the role page and click the applicant button
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    const router = useRouter() as unknown as { replace: ReturnType<typeof vi.fn> }

    // Wait for everything to complete
    await waitFor(() => {
      // Check that the user document was created with applicant role
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'applicant',
        clerkUserId: 'clerk_user_123',
      })

      // Check that the API was called to save the role
      expect(global.fetch).toHaveBeenCalledWith('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'applicant' }),
      })

      // Check that the user was sent to the applicant profile page
      expect(router.replace).toHaveBeenCalledWith('/applicant/profile')
    })
  })

  // Test: Does selecting "Recruiter" role work correctly?
  it('successfully handles recruiter role selection', async () => {
    // Show the role page and click the recruiter button
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Recruiter'))

    const router = useRouter() as unknown as { replace: ReturnType<typeof vi.fn> }

    // Wait for everything to complete
    await waitFor(() => {
      // Check that the user document was created with recruiter role
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'recruiter',
        clerkUserId: 'clerk_user_123',
      })

      // Check that the user was sent to the recruiter profile page
      expect(router.replace).toHaveBeenCalledWith('/recruiter/profile')
    })
  })

  // Test: What if Clerk authentication is not available?
  it('passes clerkUserId as undefined when useAuth() returns null', async () => {
    // Pretend Clerk is not returning a user ID
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      userId: null,
    })

    // Show the role page and click the applicant button
    render(<RolePage />)
    fireEvent.click(screen.getByText('Pick Applicant'))

    // Wait for the user document to be created
    await waitFor(() => {
      // The user document should be created but with undefined for clerkUserId
      expect(createUserDoc).toHaveBeenCalledWith({
        uid: 'firebase_uid_123',
        role: 'applicant',
        clerkUserId: undefined,
      })
    })
  })
})
