import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import ApplicantProfileRoute from '../../../app/applicant/profile/page'
import type { UserProfile } from '../../../app/data/profileData'

/* -------------------------------------------------------------------------- */
/*                               MOCKS                                        */
/* -------------------------------------------------------------------------- */

const getUserProfileMock = vi.fn()
const saveUserProfileMock = vi.fn()

vi.mock('../../../app/utils/userProfiles', () => ({
  getUserProfile: (...args: any[]) => getUserProfileMock(...args),
  saveUserProfile: (...args: any[]) => saveUserProfileMock(...args),
}))

// Route reads firebaseAuth.currentUser?.uid
vi.mock('../../../app/lib/firebaseClient', () => ({
  firebaseAuth: {
    currentUser: { uid: 'uid-123' },
  },
}))

// defaultProfile comes from data/profileData (we can use real or mock; mocking keeps it predictable)
const defaultProfileMock: UserProfile = {
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

vi.mock('../../../app/data/profileData', () => ({
  defaultProfile: defaultProfileMock,
}))

// Mock the child ProfilePage so we can inspect props easily
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
/*                               TESTS                                        */
/* -------------------------------------------------------------------------- */

describe('ApplicantProfileRoute (page.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with defaultProfile initially (before load resolves)', async () => {
    // getUserProfile resolves later; render should still work
    getUserProfileMock.mockResolvedValueOnce(null)

    render(<ApplicantProfileRoute />)

    expect(screen.getByTestId('profile-page-mock')).toBeTruthy()
    expect(screen.getByTestId('firstName').textContent).toBe('') // default
  })

  it('loads saved profile and passes it down to ProfilePage', async () => {
    getUserProfileMock.mockResolvedValueOnce({
      ...defaultProfileMock,
      firstName: 'Jane',
    })

    render(<ApplicantProfileRoute />)

    // wait a tick for useEffect -> load() -> setProfile()
    await new Promise((r) => setTimeout(r, 0))

    expect(getUserProfileMock).toHaveBeenCalledWith('uid-123')
    expect(screen.getByTestId('firstName').textContent).toBe('Jane')
  })

  it('calls saveUserProfile and updates local state when child triggers onUpdateProfile', async () => {
    getUserProfileMock.mockResolvedValueOnce({
      ...defaultProfileMock,
      firstName: 'Jane',
    })
    saveUserProfileMock.mockResolvedValueOnce(undefined)

    render(<ApplicantProfileRoute />)
    await new Promise((r) => setTimeout(r, 0))

    fireEvent.click(screen.getByTestId('save-trigger'))
    await new Promise((r) => setTimeout(r, 0))

    expect(saveUserProfileMock).toHaveBeenCalledTimes(1)
    expect(saveUserProfileMock).toHaveBeenCalledWith(
      'uid-123',
      expect.objectContaining({ firstName: 'Updated' })
    )

    // after save, route sets local state to updated profile (so child gets new props)
    expect(screen.getByTestId('firstName').textContent).toBe('Updated')
  })

  it('does nothing if firebaseAuth.currentUser is missing', async () => {
    // override the firebaseClient mock for this test
    vi.doMock('../../../app/lib/firebaseClient', () => ({
      firebaseAuth: { currentUser: null },
    }))

    // re-import after doMock so it uses the new mock
    const { default: RouteWithNoUser } = await import('../../../app/applicant/profile/page')

    render(<RouteWithNoUser />)
    await new Promise((r) => setTimeout(r, 0))

    expect(getUserProfileMock).not.toHaveBeenCalled()
  })
})
