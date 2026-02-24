// __tests__/applicant/profile/page.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import type { UserProfile } from '../../../app/data/profileData'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCK STATE                            */
/* -------------------------------------------------------------------------- */

declare global {
  // keep it minimal and typed
  // eslint-disable-next-line no-var
  var __mockCurrentUser: { uid: string } | null
}

globalThis.__mockCurrentUser = { uid: 'uid-123' }

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */
// Mock the entire userProfiles module to control getUserProfile and saveUserProfile behavior in tests
const getUserProfileMock = vi.fn(async (_uid: string): Promise<UserProfile | null> => null)
const saveUserProfileMock = vi.fn(async (_uid: string, _profile: UserProfile): Promise<void> => {})

// Mock the entire firebaseClient module to control firebaseAuth.currentUser behavior in tests
vi.mock('../../../app/utils/userProfiles', () => {
  return {
    getUserProfile: (uid: string) => getUserProfileMock(uid),
    saveUserProfile: (uid: string, profile: UserProfile) => saveUserProfileMock(uid, profile),
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

// Mock the ProfilePage child component to control its behavior and isolate testing to ApplicantProfileRoute
vi.mock('../../../app/data/profileData', () => {
  const defaultProfile: UserProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    currentTitle: '',
    yearsOfExperience: '',
    availability: 'Immediately',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    bio: '',
    profilePicture: '',
    resumeFile: '',
    resumeFileName: '',
  }

  return { defaultProfile }
})

// Mock the entire ProfilePage component to control its behavior in tests
vi.mock('../../../app/applicant/profile/ProfilePage', () => ({
  ProfilePage: ({
    profile,
    onUpdateProfile,
  }: {
    profile: UserProfile
    onUpdateProfile: (p: UserProfile) => Promise<void>
  }) => (
    <div data-testid='profile-page-mock'>
      <div data-testid='firstName'>{profile.firstName}</div>
      <button
        type='button'
        data-testid='save-trigger'
        onClick={() =>
          onUpdateProfile({
            ...profile,
            firstName: 'Updated',
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

import ApplicantProfileRoute from '../../../app/applicant/profile/page'

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('ApplicantProfileRoute (page.tsx)', () => {
  beforeEach(() => {
    // Reset mocks and global state before each test to ensure isolation
    vi.clearAllMocks()
    globalThis.__mockCurrentUser = { uid: 'uid-123' }
  })

  afterEach(() => {
    // Cleanup the DOM after each test to prevent test interference
    cleanup()
  })

  it('renders with defaultProfile initially (before load resolves)', async () => {
    // This tests the initial render before the useEffect loads saved data, so it should show defaultProfile values
    getUserProfileMock.mockResolvedValueOnce(null)

    render(<ApplicantProfileRoute />)

    expect(screen.getByTestId('profile-page-mock')).toBeTruthy()
    expect(screen.getByTestId('firstName').textContent).toBe('')

    // Wait for the effect to run and confirm getUserProfile was called
    await waitFor(() => {
      expect(getUserProfileMock).toHaveBeenCalledWith('uid-123')
    })
  })

  it('loads saved profile and passes it down to ProfilePage', async () => {
    // This tests that the useEffect successfully loads saved profile data and updates the UI accordingly
    getUserProfileMock.mockResolvedValueOnce({
      firstName: 'Jane',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      currentTitle: '',
      yearsOfExperience: '',
      availability: 'Immediately',
      linkedinUrl: '',
      portfolioUrl: '',
      githubUrl: '',
      bio: '',
      profilePicture: '',
      resumeFile: '',
      resumeFileName: '',
    })

    render(<ApplicantProfileRoute />)
    // Wait for the effect to run and confirm getUserProfile was called and UI updated
    await waitFor(() => {
      expect(getUserProfileMock).toHaveBeenCalledWith('uid-123')
      expect(screen.getByTestId('firstName').textContent).toBe('Jane')
    })
  })

  it('calls saveUserProfile and updates local state when child triggers onUpdateProfile', async () => {
    // This tests that the handleUpdateProfile function correctly calls saveUserProfile and updates local state, which should be reflected in the UI
    getUserProfileMock.mockResolvedValueOnce({
      firstName: 'Jane',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      currentTitle: '',
      yearsOfExperience: '',
      availability: 'Immediately',
      linkedinUrl: '',
      portfolioUrl: '',
      githubUrl: '',
      bio: '',
      profilePicture: '',
      resumeFile: '',
      resumeFileName: '',
    })
    saveUserProfileMock.mockResolvedValueOnce(undefined) // Simulate successful save

    render(<ApplicantProfileRoute />)
    // Wait for the effect to run and confirm initial load
    await waitFor(() => {
      expect(screen.getByTestId('firstName').textContent).toBe('Jane')
    })

    // Simulate child component triggering onUpdateProfile by clicking the button in the mocked ProfilePage
    fireEvent.click(screen.getByTestId('save-trigger'))
    // Wait for the saveUserProfile to be called and confirm it was called with the updated profile data, and that the UI reflects the updated state
    await waitFor(() => {
      expect(saveUserProfileMock).toHaveBeenCalledTimes(1)
      expect(saveUserProfileMock).toHaveBeenCalledWith(
        'uid-123',
        expect.objectContaining({ firstName: 'Updated' }) as UserProfile
      )
      expect(screen.getByTestId('firstName').textContent).toBe('Updated')
    })
  })

  it('does nothing if firebaseAuth.currentUser is missing', async () => {
    // This tests the early return logic in both the load and save functions when there is no authenticated user, ensuring that no profile loading or saving occurs and the UI does not break
    globalThis.__mockCurrentUser = null

    render(<ApplicantProfileRoute />)

    // allow effect to run without timers
    await Promise.resolve()

    expect(getUserProfileMock).not.toHaveBeenCalled()
    expect(saveUserProfileMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('profile-page-mock')).toBeTruthy()
  })
})
