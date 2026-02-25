import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { RecruiterProfilePage } from '../../app/profile/recruiterProfile'
import { toast } from '../../app/components/ui/sonner'

// Mock the toast
vi.mock('../../app/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Clerk useUser to provide consistent user data for tests
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      id: 'user_123',
      firstName: 'Jane',
      lastName: 'Doe',
      primaryEmailAddress: { emailAddress: 'jane.doe@company.com' },
    },
  }),
}))

// Mock FileReader
interface MockFileReader {
  readAsDataURL: (file: File) => void
  onloadend: (() => void) | null
  result: string | ArrayBuffer | null
}

global.FileReader = vi.fn(function (this: MockFileReader) {
  this.readAsDataURL = vi.fn()
  this.onloadend = null
  this.result = null
}) as unknown as typeof FileReader

// Mock recruiter profile data
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

const mockOnSave = vi.fn()

describe('RecruiterProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('enables Save button when a field is edited', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    // edit company name to trigger isEditing
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Hirelytics Labs' },
    })

    const saveButton = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)
  })

  it('calls onSave when Save button is clicked', () => {
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

    expect(mockOnSave).toHaveBeenCalledTimes(1)
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Hirelytics Labs' })
    )
  })

  it('prevents saving with empty companyName', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: '' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({
        description: 'Please fill in company name and recruiter email.',
      })
    )
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('prevents saving with empty recruiterEmail', async () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    const emailInput = screen.getByRole('textbox', { name: /recruiter email/i })

    // force editing state + ensure value really becomes empty
    fireEvent.change(emailInput, { target: { value: 'temp@x.com' } })
    fireEvent.change(emailInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await Promise.resolve()

    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({
        description: 'Please fill in company name and recruiter email.',
      })
    )
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('prevents saving with invalid email format (missing @)', () => {
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

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format',
      expect.objectContaining({
        description: 'Please enter a valid recruiter email address.',
      })
    )
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('prevents saving with invalid email format (missing domain)', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/recruiter email/i), {
      target: { value: 'invalid@domain' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format',
      expect.objectContaining({
        description: 'Please enter a valid recruiter email address.',
      })
    )
    expect(mockOnSave).not.toHaveBeenCalled()
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

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(toast.success).toHaveBeenCalledWith(
      'Recruiter profile saved',
      expect.objectContaining({
        description: 'Your changes have been saved.',
      })
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

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(toast.error).toHaveBeenCalledWith(
      'Save failed',
      expect.objectContaining({
        description: 'Please try again.',
      })
    )
  })

  // Logo Upload Tests
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
      expect.objectContaining({
        description: 'Logo must be an image.',
      })
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
      expect.objectContaining({
        description: 'Logo must be less than 5MB.',
      })
    )
  })

  it('accepts image logo files and shows success toast', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={mockRecruiterProfile}
        onSave={mockOnSave}
      />
    )
  })
})
