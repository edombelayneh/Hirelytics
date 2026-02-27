// __tests__/recruiter/profile/RecruiterProfileRoute.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import type { RecruiterProfile } from '../../../app/utils/userProfiles'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCK STATE                            */
/* -------------------------------------------------------------------------- */

declare global {
  var __mockCurrentUser: { uid: string } | null
}

globalThis.__mockCurrentUser = { uid: 'uid-123' }

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Mock the entire userProfiles module to control getRecruiterProfile and saveRecruiterProfile behavior in tests
const getRecruiterProfileMock = vi.fn(
  async (_uid: string): Promise<RecruiterProfile | null> => null
)
const saveRecruiterProfileMock = vi.fn(
  async (_uid: string, _profile: RecruiterProfile): Promise<void> => {}
)

// Mock the entire firebaseClient module to control firebaseAuth.currentUser behavior in tests
vi.mock('../../../app/utils/userProfiles', () => {
  return {
    getRecruiterProfile: (uid: string) => getRecruiterProfileMock(uid),
    saveRecruiterProfile: (uid: string, profile: RecruiterProfile) =>
      saveRecruiterProfileMock(uid, profile),
  }
})

// Mock the entire firebaseClient module to control firebaseAuth.currentUser behavior in tests
vi.mock('../../../app/lib/firebaseClient', () => {
  return {
    firebaseAuth: {
      get currentUser() {
        return globalThis.__mockCurrentUser
      },
    },
  }
})

// Mock child page so we can inspect props and trigger save
vi.mock('../../../app/recruiter/profile/RecruiterProfilePage', () => ({
  RecruiterProfilePage: ({
    recruiterProfile,
    onSave,
  }: {
    recruiterProfile: RecruiterProfile
    onSave: (p: RecruiterProfile) => Promise<void>
  }) => (
    <div data-testid='recruiter-profile-page-mock'>
      <div data-testid='companyName'>{recruiterProfile.companyName}</div>
      <button
        type='button'
        data-testid='save-trigger'
        onClick={() =>
          onSave({
            ...recruiterProfile,
            companyName: 'UpdatedCo',
          })
        }
      >
        Trigger Save
      </button>
    </div>
  ),
}))

/* -------------------------------------------------------------------------- */
/*                            IMPORT AFTER MOCKS                              */
/* -------------------------------------------------------------------------- */

import RecruiterProfileRoute from '../../../app/recruiter/profile/page'

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('RecruiterProfileRoute (page.tsx)', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks()
    globalThis.__mockCurrentUser = { uid: 'uid-123' } // Default logged in user for tests, can override in specific tests if needed
  })

  afterEach(() => {
    // Cleanup the DOM after each test to prevent test interference
    cleanup()
  })

  it('renders with default profile initially and kicks off load', async () => {
    // Mock getRecruiterProfile to resolve with null to simulate no existing profile (so we can check default values are passed to child)
    getRecruiterProfileMock.mockResolvedValueOnce(null)

    render(<RecruiterProfileRoute />)

    expect(screen.getByTestId('recruiter-profile-page-mock')).toBeTruthy()
    expect(screen.getByTestId('companyName').textContent).toBe('') // default

    // Wait for the useEffect to call getRecruiterProfile and update state (even though it resolves with null, we just want to confirm the call happens)
    await waitFor(() => {
      expect(getRecruiterProfileMock).toHaveBeenCalledWith('uid-123')
    })
  })

  it('loads saved recruiter profile and passes it to RecruiterProfilePage', async () => {
    // Mock getRecruiterProfile to resolve with a sample profile and check that it's rendered in the child component
    getRecruiterProfileMock.mockResolvedValueOnce({
      companyName: 'Hirelytics',
      companyWebsite: 'https://hirelytics.com',
      recruiterTitle: 'Talent Acquisition',
    })

    render(<RecruiterProfileRoute />)

    // Wait for the useEffect to call getRecruiterProfile and update state, then check that the returned profile data is rendered in the child component
    await waitFor(() => {
      expect(getRecruiterProfileMock).toHaveBeenCalledWith('uid-123')
      expect(screen.getByTestId('companyName').textContent).toBe('Hirelytics')
    })
  })

  it('calls saveRecruiterProfile and updates local state when child triggers onSave', async () => {
    // Mock getRecruiterProfile to resolve with existing profile data, then simulate user updating and saving profile
    getRecruiterProfileMock.mockResolvedValueOnce({
      companyName: 'Hirelytics',
      companyWebsite: '',
      recruiterTitle: '',
    })
    // Mock saveRecruiterProfile to resolve successfully - we will check that it's called with the expected updated profile data
    saveRecruiterProfileMock.mockResolvedValueOnce(undefined)

    render(<RecruiterProfileRoute />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('companyName').textContent).toBe('Hirelytics')
    })

    // Simulate user clicking the button that triggers onSave in the mocked RecruiterProfilePage
    fireEvent.click(screen.getByTestId('save-trigger'))

    // Assert that saveRecruiterProfile was called with the updated profile data and that the UI reflects the updated company name after saving
    await waitFor(() => {
      expect(saveRecruiterProfileMock).toHaveBeenCalledTimes(1)
      expect(saveRecruiterProfileMock).toHaveBeenCalledWith(
        'uid-123',
        expect.objectContaining({ companyName: 'UpdatedCo' }) as RecruiterProfile
      )
      expect(screen.getByTestId('companyName').textContent).toBe('UpdatedCo')
    })
  })

  it('does nothing if firebaseAuth.currentUser is missing', async () => {
    // This tests the early return logic in both the load and save functions when there is no authenticated user
    globalThis.__mockCurrentUser = null

    render(<RecruiterProfileRoute />)

    // Wait a tick to allow any async effects to run
    await Promise.resolve()

    // Assert that getRecruiterProfile and saveRecruiterProfile were not called, and that the component still renders without crashing
    expect(getRecruiterProfileMock).not.toHaveBeenCalled()
    expect(saveRecruiterProfileMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('recruiter-profile-page-mock')).toBeTruthy()
  })
})
