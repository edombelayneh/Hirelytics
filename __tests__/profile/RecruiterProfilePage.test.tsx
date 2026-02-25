import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { RecruiterProfilePage } from '../../app/profile/recruiterProfile'
import { toast } from '../../app/components/ui/sonner'
import userEvent from '@testing-library/user-event'

// --------------------
// Mocks
// --------------------
vi.mock('../../app/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

let clerkState = {
  isLoaded: true,
  user: {
    id: 'user_123',
    firstName: 'Jane',
    lastName: 'Doe',
    primaryEmailAddress: { emailAddress: 'jane.doe@company.com' },
  },
}

vi.mock('@clerk/nextjs', () => ({
  useUser: () => clerkState,
}))

// FileReader mock that actually triggers onloadend and sets result
type MockFileReaderInstance = {
  readAsDataURL: (file: File) => void
  onloadend: null | (() => void)
  result: string | ArrayBuffer | null
}

global.FileReader = vi.fn(function (this: MockFileReaderInstance) {
  this.onloadend = null
  this.result = null
  this.readAsDataURL = vi.fn(() => {
    this.result = 'data:image/png;base64,MOCK_BASE64'
    this.onloadend?.()
  })
}) as unknown as typeof FileReader

// --------------------
// Test data
// --------------------
const mockRecruiterProfile = {
  companyName: 'Hirelytics Inc.',
  companyWebsite: 'https://hirelytics.com',
  companyLogo: '',
  recruiterName: 'Jane Doe',
  recruiterTitle: 'Talent Acquisition',
  recruiterEmail: 'recruiting@hirelytics.com',
  recruiterPhone: '+1 (123) 456-7890',
  companyLocation: 'Detroit, MI',
  companyDescription: 'We build job analytics tools.',
}

describe('RecruiterProfilePage', () => {
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    clerkState = {
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddress: { emailAddress: 'jane.doe@company.com' },
      },
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('renders recruiter profile data correctly', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Recruiter Profile')).toBeTruthy()
    expect(screen.getByDisplayValue('Hirelytics Inc.')).toBeTruthy()
    expect(screen.getByDisplayValue('recruiting@hirelytics.com')).toBeTruthy()
    expect(screen.getByDisplayValue('Jane Doe')).toBeTruthy()
  })

  it('save button is enabled by default (unless currently saving)', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)
  })

  it('calls onSave with updated form data when Save is clicked', async () => {
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Hirelytics Labs' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1))
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Hirelytics Labs' })
    )
  })

  it('shows success toast when recruiter profile is saved', async () => {
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Hirelytics Labs' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Recruiter profile saved',
        expect.objectContaining({ description: 'Your changes have been saved.' })
      )
    )
  })

  it('shows error toast when onSave throws', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('boom'))

    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Hirelytics Labs' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Save failed',
        expect.objectContaining({ description: 'Please try again.' })
      )
    )
  })
  it('prevents saving and shows validation UI when companyName is empty', async () => {
    const user = userEvent.setup()

    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    const companyInput = screen.getByLabelText(/company name/i) as HTMLInputElement

    // Clear reliably (async) instead of fireEvent.change(...)
    await user.clear(companyInput)

    // Ensure the DOM reflects the cleared value before saving
    await waitFor(() => expect(companyInput.value).toBe(''))

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mockOnSave).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({ description: 'Fix the highlighted fields and try again.' })
    )

    expect(await screen.findByText('Company name is required.')).toBeTruthy()
  })
  it('prevents saving and shows validation UI when recruiterEmail is empty', async () => {
    const user = userEvent.setup()

    // Make Clerk provide NO email, so the component can't refill it
    clerkState = {
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddress: { emailAddress: '' },
      },
    }

    const profileWithMissingEmail = {
      ...mockRecruiterProfile,
      recruiterEmail: '',
    }

    render(
      <RecruiterProfilePage
        recruiterProfile={profileWithMissingEmail}
        onSave={mockOnSave}
      />
    )

    const emailInput = screen.getByLabelText(/recruiter email/i) as HTMLInputElement

    // Now clearing will stick because there is nothing to repopulate with
    await user.clear(emailInput)
    await waitFor(() => expect(emailInput.value).toBe(''))

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mockOnSave).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({ description: 'Fix the highlighted fields and try again.' })
    )

    expect(await screen.findByText('Recruiter email is required.')).toBeTruthy()
  })

  it('prevents saving when recruiterEmail is invalid and shows field error', async () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/recruiter email/i), {
      target: { value: 'invalidemail.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mockOnSave).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({ description: 'Fix the highlighted fields and try again.' })
    )

    expect(await screen.findByText('Enter a valid email.')).toBeTruthy()
  })

  it('autofills recruiter name/email from Clerk when missing in recruiterProfile (not editing)', async () => {
    const emptyProfile = {
      ...mockRecruiterProfile,
      recruiterName: '',
      recruiterEmail: '',
    }

    render(
      <RecruiterProfilePage
        recruiterProfile={emptyProfile}
        onSave={mockOnSave}
      />
    )

    // useEffect runs after render; wait for fields to reflect Clerk autofill
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeTruthy()
      expect(screen.getByDisplayValue('jane.doe@company.com')).toBeTruthy()
    })
  })

  it('does not overwrite typed recruiterEmail while editing (even if parent recruiterProfile changes)', async () => {
    const emptyProfile = {
      ...mockRecruiterProfile,
      recruiterName: '',
      recruiterEmail: '',
    }

    const { rerender } = render(
      <RecruiterProfilePage
        recruiterProfile={emptyProfile}
        onSave={mockOnSave}
      />
    )

    // wait for autofill
    await waitFor(() => {
      expect(screen.getByDisplayValue('jane.doe@company.com')).toBeTruthy()
    })

    // user edits email -> isEditing true
    fireEvent.change(screen.getByLabelText(/recruiter email/i), {
      target: { value: 'my.custom@email.com' },
    })

    // parent pushes a new recruiterProfile (simulate Firestore refresh)
    rerender(
      <RecruiterProfilePage
        recruiterProfile={{ ...emptyProfile, recruiterEmail: '', recruiterName: '' }}
        onSave={mockOnSave}
      />
    )

    // still should keep what user typed
    expect(screen.getByDisplayValue('my.custom@email.com')).toBeTruthy()
  })
  it('disables Save button while saving and shows "Saving..." label', async () => {
    let resolveSave: (() => void) | undefined

    mockOnSave.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Hirelytics Labs' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeTruthy()
    })

    // finish save
    if (!resolveSave) throw new Error('resolveSave was not set')
    resolveSave()

    await waitFor(() => expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy())
  })

  // --------------------
  // Logo upload tests
  // --------------------
  it('rejects non-image logo files', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    const file = new File(['hello'], 'logo.pdf', { type: 'application/pdf' })
    const logoInput = document.querySelector(
      'input[type="file"][accept="image/*"]'
    ) as HTMLInputElement

    fireEvent.change(logoInput, { target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid file type',
      expect.objectContaining({ description: 'Logo must be an image.' })
    )
  })

  it('rejects logo files over 5MB', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    const fileContent = new Array(Math.floor(5.1 * 1024 * 1024)).fill('a').join('')
    const file = new File([fileContent], 'logo.jpg', { type: 'image/jpeg' })
    const logoInput = document.querySelector(
      'input[type="file"][accept="image/*"]'
    ) as HTMLInputElement

    fireEvent.change(logoInput, { target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith(
      'File too large',
      expect.objectContaining({ description: 'Logo must be less than 5MB.' })
    )
  })

  it('accepts image logo files, shows success toast, and includes companyLogo in save payload', async () => {
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    const file = new File(['img'], 'logo.png', { type: 'image/png' })
    const logoInput = document.querySelector(
      'input[type="file"][accept="image/*"]'
    ) as HTMLInputElement

    fireEvent.change(logoInput, { target: { files: [file] } })

    expect(toast.success).toHaveBeenCalledWith('Company logo uploaded')

    // Now click save and assert the logo made it into the saved profile
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1))

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        companyLogo: expect.stringContaining('data:image/png;base64,MOCK_BASE64'),
      })
    )
  })
})
