import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ProfilePage } from '../../app/profile/page'
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
      primaryEmailAddress: { emailAddress: 'jane.doe@example.com' },
    },
  }),
}))

// Mock File Reader
interface MockFileReader {
  readAsDataURL: (file: File) => void
  onloadend: (() => void) | null
  result: string | ArrayBuffer | null
}

global.FileReader = vi.fn(function (this: MockFileReader) {
  this.onloadend = null
  this.result = null
  this.readAsDataURL = vi.fn(() => {
    // simulate a successful read
    this.result = 'data:mock;base64,AAA='
    this.onloadend?.()
  })
}) as unknown as typeof FileReader

// Mock profile data
const mockProfile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '989-989-4573',
  location: 'Mount Pleasant',
  currentTitle: 'Software Engineer',
  yearsOfExperience: '10',
  availability: 'Immediately',
  linkedinUrl: 'https://www.linkedin.com/',
  portfolioUrl: 'https://workspace.google.com/products/drive/',
  githubUrl: 'https://github.com/',
  bio: 'Driven learner focused on growth, innovation, and real-world tech impact.',
  profilePicture: '',
  resumeFile: '',
  resumeFileName: '',
}

const mockOnUpdateProfile = vi.fn()

function renderPage(overrides?: Partial<React.ComponentProps<typeof ProfilePage>>) {
  const props: React.ComponentProps<typeof ProfilePage> = {
    profile: mockProfile,
    onUpdateProfile: mockOnUpdateProfile,
    isOnboardingRequired: false,
    ...overrides,
  }
  return render(<ProfilePage {...props} />)
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders profile data correctly', () => {
    renderPage()

    expect(screen.getByText('My Profile')).toBeTruthy()
    expect(screen.getByDisplayValue('Jane')).toBeTruthy()
    expect(screen.getByDisplayValue('Doe')).toBeTruthy()
    expect(screen.getByDisplayValue('jane.doe@example.com')).toBeTruthy()
  })

  it('shows disabled "Saved" button initially (not editing, onboarding not required)', () => {
    renderPage()

    // When canSave is false, label is "Saved"
    const btn = screen.getByRole('button', { name: /saved/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('enables Save button when a field is edited', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    const saveButton = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)
  })

  it('calls onUpdateProfile when Save button is clicked (after editing)', async () => {
    mockOnUpdateProfile.mockResolvedValueOnce(undefined)
    renderPage()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockOnUpdateProfile).toHaveBeenCalledTimes(1)
    })

    expect(mockOnUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Janet' })
    )
  })

  it('disables Save when firstName is empty (cannot attempt save)', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: '' },
    })

    // With missing required field, canSave becomes false -> label "Saved" + disabled
    const btn = screen.getByRole('button', { name: /saved/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)

    // Handler is never called, so no toast expected
    expect(toast.error).not.toHaveBeenCalled()
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('disables Save when lastName is empty (cannot attempt save)', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: '' },
    })

    const btn = screen.getByRole('button', { name: /saved/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)

    expect(toast.error).not.toHaveBeenCalled()
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('disables Save when email is empty (cannot attempt save)', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: '' },
    })

    const btn = screen.getByRole('button', { name: /saved/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)

    expect(toast.error).not.toHaveBeenCalled()
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('prevents saving with invalid email format (missing @)', async () => {
    renderPage()

    // keep requiredFilled true, but make email invalid
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalidemail.com' },
    })

    // email is non-empty => requiredFilled true; edited => canSave true
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format',
      expect.objectContaining({
        description: 'Please enter a valid email address',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('prevents saving with invalid email format (missing domain)', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid@domain' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format',
      expect.objectContaining({
        description: 'Please enter a valid email address',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('shows success toast when profile is updated', async () => {
    mockOnUpdateProfile.mockResolvedValueOnce(undefined)
    renderPage()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Profile updated successfully',
        expect.objectContaining({
          description: 'Your changes have been saved',
        })
      )
    })
  })

  it('rejects resume files with invalid extension', () => {
    renderPage()

    const file = new File(['resume content'], 'resume.txt', { type: 'text/plain' })

    const resumeInput = Array.from(document.querySelectorAll('input[type="file"]')).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf')
    ) as HTMLInputElement

    fireEvent.change(resumeInput, { target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid file type',
      expect.objectContaining({
        description: 'Resume must be in PDF, DOC, or DOCX format',
      })
    )
  })

  it('rejects resume files over 10MB', () => {
    renderPage()

    const fileContent = new Array(Math.floor(10.1 * 1024 * 1024)).fill('a').join('')
    const file = new File([fileContent], 'resume.pdf', { type: 'application/pdf' })

    const resumeInput = Array.from(document.querySelectorAll('input[type="file"]')).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf')
    ) as HTMLInputElement

    fireEvent.change(resumeInput, { target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith(
      'File too large',
      expect.objectContaining({
        description: 'Resume must be less than 10MB',
      })
    )
  })

  it('rejects profile pictures over 5MB', () => {
    renderPage()

    const fileContent = new Array(Math.floor(5.1 * 1024 * 1024)).fill('a').join('')
    const file = new File([fileContent], 'profile.jpg', { type: 'image/jpeg' })

    const profilePicInput = Array.from(document.querySelectorAll('input[type="file"]')).find(
      (input) => (input as HTMLInputElement).accept.includes('image/')
    ) as HTMLInputElement

    fireEvent.change(profilePicInput, { target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith(
      'File too large',
      expect.objectContaining({
        description: 'Profile picture must be less than 5MB',
      })
    )
  })
})
