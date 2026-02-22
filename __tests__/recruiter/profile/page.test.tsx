// __tests__/recruiter/profile/RecruiterProfileRoute.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import type { RecruiterProfile } from '../../../app/utils/userProfiles'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCK STATE                            */
/* -------------------------------------------------------------------------- */

declare global {
  // eslint-disable-next-line no-var
  var __mockCurrentUser: { uid: string } | null
}

globalThis.__mockCurrentUser = { uid: 'uid-123' }

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

const getRecruiterProfileMock = vi.fn(
  async (_uid: string): Promise<RecruiterProfile | null> => null
)
const saveRecruiterProfileMock = vi.fn(
  async (_uid: string, _profile: RecruiterProfile): Promise<void> => {}
)

vi.mock('../../../app/utils/userProfiles', () => {
  return {
    getRecruiterProfile: (uid: string) => getRecruiterProfileMock(uid),
    saveRecruiterProfile: (uid: string, profile: RecruiterProfile) =>
      saveRecruiterProfileMock(uid, profile),
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
    vi.clearAllMocks()
    globalThis.__mockCurrentUser = { uid: 'uid-123' }
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with default profile initially and kicks off load', async () => {
    getRecruiterProfileMock.mockResolvedValueOnce(null)

    render(<RecruiterProfileRoute />)

    expect(screen.getByTestId('recruiter-profile-page-mock')).toBeTruthy()
    expect(screen.getByTestId('companyName').textContent).toBe('') // default

    await waitFor(() => {
      expect(getRecruiterProfileMock).toHaveBeenCalledWith('uid-123')
    })
  })

  it('loads saved recruiter profile and passes it to RecruiterProfilePage', async () => {
    getRecruiterProfileMock.mockResolvedValueOnce({
      companyName: 'Hirelytics',
      companyWebsite: 'https://hirelytics.com',
      recruiterTitle: 'Talent Acquisition',
    })

    render(<RecruiterProfileRoute />)

    await waitFor(() => {
      expect(getRecruiterProfileMock).toHaveBeenCalledWith('uid-123')
      expect(screen.getByTestId('companyName').textContent).toBe('Hirelytics')
    })
  })

  it('calls saveRecruiterProfile and updates local state when child triggers onSave', async () => {
    getRecruiterProfileMock.mockResolvedValueOnce({
      companyName: 'Hirelytics',
      companyWebsite: '',
      recruiterTitle: '',
    })
    saveRecruiterProfileMock.mockResolvedValueOnce(undefined)

    render(<RecruiterProfileRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('companyName').textContent).toBe('Hirelytics')
    })

    fireEvent.click(screen.getByTestId('save-trigger'))

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
    globalThis.__mockCurrentUser = null

    render(<RecruiterProfileRoute />)

    await Promise.resolve()

    expect(getRecruiterProfileMock).not.toHaveBeenCalled()
    expect(saveRecruiterProfileMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('recruiter-profile-page-mock')).toBeTruthy()
  })
})
