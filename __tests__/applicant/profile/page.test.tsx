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

const getUserProfileMock = vi.fn(async (_uid: string): Promise<UserProfile | null> => null)
const saveUserProfileMock = vi.fn(async (_uid: string, _profile: UserProfile): Promise<void> => {})

vi.mock('../../../app/utils/userProfiles', () => {
  return {
    getUserProfile: (uid: string) => getUserProfileMock(uid),
    saveUserProfile: (uid: string, profile: UserProfile) => saveUserProfileMock(uid, profile),
  }
})

vi.mock('../../../app/lib/firebaseClient', () => {
  return {
    firebaseAuth: {
      get currentUser() {
        return globalThis.__mockCurrentUser
      },
    },
  }
})

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
    vi.clearAllMocks()
    globalThis.__mockCurrentUser = { uid: 'uid-123' }
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with defaultProfile initially (before load resolves)', async () => {
    getUserProfileMock.mockResolvedValueOnce(null)

    render(<ApplicantProfileRoute />)

    expect(screen.getByTestId('profile-page-mock')).toBeTruthy()
    expect(screen.getByTestId('firstName').textContent).toBe('')

    await waitFor(() => {
      expect(getUserProfileMock).toHaveBeenCalledWith('uid-123')
    })
  })

  it('loads saved profile and passes it down to ProfilePage', async () => {
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

    await waitFor(() => {
      expect(getUserProfileMock).toHaveBeenCalledWith('uid-123')
      expect(screen.getByTestId('firstName').textContent).toBe('Jane')
    })
  })

  it('calls saveUserProfile and updates local state when child triggers onUpdateProfile', async () => {
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
    saveUserProfileMock.mockResolvedValueOnce(undefined)

    render(<ApplicantProfileRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('firstName').textContent).toBe('Jane')
    })

    fireEvent.click(screen.getByTestId('save-trigger'))

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
    globalThis.__mockCurrentUser = null

    render(<ApplicantProfileRoute />)

    // allow effect to run without timers
    await Promise.resolve()

    expect(getUserProfileMock).not.toHaveBeenCalled()
    expect(saveUserProfileMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('profile-page-mock')).toBeTruthy()
  })
})
