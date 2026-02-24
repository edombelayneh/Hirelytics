// __tests__/recruiter/profile/RecruiterProfilePage.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { RecruiterProfilePage } from '../../../app/recruiter/profile/RecruiterProfilePage'
import { toast } from '../../../app/components/ui/sonner'
import type { RecruiterProfile } from '../../../app/utils/userProfiles'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

vi.mock('../../../app/components/Navbar', () => ({
  Navbar: () => <div data-testid='navbar-mock' />,
}))

vi.mock('../../../app/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('RecruiterProfilePage', () => {
  const baseProfile: RecruiterProfile = {
    companyName: 'Hirelytics',
    companyWebsite: 'https://hirelytics.com',
    recruiterTitle: 'Talent Acquisition',
  }

  const onSaveMock = vi.fn(async (_data: RecruiterProfile): Promise<void> => {})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders heading + description + initial form values', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile}
        onSave={onSaveMock}
      />
    )

    expect(screen.getByText('Recruiter Profile')).toBeTruthy()
    expect(screen.getByText('Company info used for job postings.')).toBeTruthy()

    expect(screen.getByDisplayValue('Hirelytics')).toBeTruthy()
    expect(screen.getByDisplayValue('https://hirelytics.com')).toBeTruthy()
    expect(screen.getByDisplayValue('Talent Acquisition')).toBeTruthy()
  })

  it('save button is disabled until user edits a field', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile}
        onSave={onSaveMock}
      />
    )

    const saveBtn = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)

    // Edit company website
    const websiteInput = screen.getByPlaceholderText('https://hirelytics.com')
    fireEvent.change(websiteInput, { target: { value: 'https://example.com' } })

    expect(saveBtn.disabled).toBe(false)
  })

  it('prevents saving if companyName is empty and shows toast error', async () => {
    const emptyCompany: RecruiterProfile = {
      companyName: '',
      companyWebsite: '',
      recruiterTitle: '',
    }

    render(
      <RecruiterProfilePage
        recruiterProfile={emptyCompany}
        onSave={onSaveMock}
      />
    )

    // make it "edited" so button is enabled
    const titleInput = screen.getByPlaceholderText('Talent Acquisition')
    fireEvent.change(titleInput, { target: { value: 'Recruiter' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSaveMock).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required field',
      expect.objectContaining({ description: 'Company name is required.' })
    )
  })

  it('calls onSave with updated data and shows success toast', async () => {
    onSaveMock.mockResolvedValueOnce(undefined)

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile}
        onSave={onSaveMock}
      />
    )

    const nameInput = screen.getByPlaceholderText('Hirelytics Inc.')
    fireEvent.change(nameInput, { target: { value: 'Hirelytics Inc.' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledTimes(1)
      expect(onSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: 'Hirelytics Inc.' }) as RecruiterProfile
      )
      expect(toast.success).toHaveBeenCalledWith('Recruiter profile saved')
    })
  })

  it('shows error toast if onSave throws', async () => {
    onSaveMock.mockRejectedValueOnce(new Error('boom'))

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile}
        onSave={onSaveMock}
      />
    )

    const websiteInput = screen.getByPlaceholderText('https://hirelytics.com')
    fireEvent.change(websiteInput, { target: { value: 'https://fail.com' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Save failed',
        expect.objectContaining({ description: 'Please try again.' })
      )
    })
  })

  it('updates the form when recruiterProfile prop changes', async () => {
    const { rerender } = render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile}
        onSave={onSaveMock}
      />
    )

    expect(screen.getByDisplayValue('Hirelytics')).toBeTruthy()

    const updated: RecruiterProfile = {
      companyName: 'NewCo',
      companyWebsite: 'https://newco.com',
      recruiterTitle: 'Hiring Manager',
    }

    rerender(
      <RecruiterProfilePage
        recruiterProfile={updated}
        onSave={onSaveMock}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('NewCo')).toBeTruthy()
      expect(screen.getByDisplayValue('https://newco.com')).toBeTruthy()
      expect(screen.getByDisplayValue('Hiring Manager')).toBeTruthy()
    })
  })
})
