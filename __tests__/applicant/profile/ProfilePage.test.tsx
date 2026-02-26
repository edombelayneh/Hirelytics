import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

// Import the component we are testing
import { ProfilePage } from '../../../app/applicant/profile/ProfilePage'

// Import toast so we can check if it was called
import { toast } from '../../../app/components/ui/sonner'

/* -------------------------------------------------------------------------- */
/*                                GLOBAL MOCKS                                */
/* -------------------------------------------------------------------------- */

// Mock Clerk's useUser hook
// This prevents crashes from missing Clerk provider
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

// Mock the toast system
vi.mock('../../../app/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

type FileReaderMockInstance = {
  result: string | ArrayBuffer | null
  onloadend: (() => void) | null
  readAsDataURL: (file: Blob) => void
}

global.FileReader = vi.fn(function (this: FileReaderMockInstance) {
  this.result = null
  this.onloadend = null

  this.readAsDataURL = vi.fn(() => {
    this.result = 'data:mock'
    this.onloadend?.()
  })
}) as unknown as typeof FileReader
/* -------------------------------------------------------------------------- */
/*                            MOCK PROFILE DATA                               */
/* -------------------------------------------------------------------------- */

const mockProfile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '989-989-4573',
  location: 'Mount Pleasant',
  currentTitle: 'Software Engineer',
  yearsOfExperience: '10',
  availability: 'Immediately',
  linkedinUrl: 'https://linkedin.com',
  portfolioUrl: 'https://portfolio.com',
  githubUrl: 'https://github.com',
  bio: 'Driven learner focused on growth.',
  profilePicture: '',
  resumeFile: '',
  resumeFileName: '',
}

// Mock save function
const mockOnUpdateProfile = vi.fn()

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('ProfilePage', () => {
  // Clear mocks before every test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Clean DOM after every test
  afterEach(() => {
    cleanup()
  })

  /* ---------------------------- RENDER TEST ---------------------------- */

  it('renders profile data correctly', () => {
    // Render component
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Check page header exists
    expect(screen.getByText('My Profile')).toBeTruthy()

    // Check form fields contain correct values
    expect(screen.getByDisplayValue('Jane')).toBeTruthy()
    expect(screen.getByDisplayValue('Doe')).toBeTruthy()
    expect(screen.getByDisplayValue('jane.doe@example.com')).toBeTruthy()
  })

  /* ---------------------------- SAVE SUCCESS ---------------------------- */

  it('calls onUpdateProfile when Save is clicked with valid data', async () => {
    // Make mock save resolve successfully
    mockOnUpdateProfile.mockResolvedValueOnce(undefined)

    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Change first name
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Wait for async save
    await waitFor(() => {
      expect(mockOnUpdateProfile).toHaveBeenCalledTimes(1)
    })

    // Ensure success toast was shown
    expect(toast.success).toHaveBeenCalledWith(
      'Profile updated successfully',
      expect.objectContaining({
        description: 'Your changes have been saved.',
      })
    )
  })

  /* ---------------------------- REQUIRED FIELD TESTS ---------------------------- */
  // it('prevents saving when first name is empty', async () => {
  //   render(
  //     <ProfilePage
  //       profile={mockProfile}
  //       onUpdateProfile={mockOnUpdateProfile}
  //     />
  //   )

  //   const firstNameInput = screen.getByLabelText(/first name/i)

  //   // Clear first name
  //   fireEvent.change(firstNameInput, { target: { value: '' } })

  //   // Attempt save
  //   fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

  //   // Ensure save was NOT called
  //   await waitFor(() => {
  //     expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  //   })

  //   // Assert the UI indicates an error in *some* reliable way
  //   await waitFor(() => {
  //     const ariaInvalid = firstNameInput.getAttribute('aria-invalid') === 'true'
  //     const inlineError =
  //       !!screen.queryByText(/first name.*required/i) ||
  //       !!screen.queryByText(/required.*first name/i)

  //     // If your component uses the same toast as the other validation test,
  //     // this will also make the test pass even if there's no inline error text.
  //     const toastErrorCalled = (toast.error as unknown as { mock?: { calls: unknown[][] } })?.mock
  //       ?.calls?.length
  //       ? true
  //       : false

  //     if (!ariaInvalid && !inlineError && !toastErrorCalled) {
  //       throw new Error('First name was not marked invalid (aria/message/toast not found).')
  //     }
  //   })
  // })

  it('prevents saving when email format is invalid', async () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Enter invalid email
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalidemail.com' },
    })

    // Try saving
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Missing required fields',
        expect.objectContaining({
          description: 'Fix the highlighted fields and try again.',
        })
      )
    })

    // Check inline validation message
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy()
  })

  /* ---------------------------- FILE UPLOAD TESTS ---------------------------- */

  it('rejects invalid resume file type', async () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Create invalid file (.txt)
    const file = new File(['content'], 'resume.txt', { type: 'text/plain' })

    // Find resume file input
    const resumeInput = Array.from(document.querySelectorAll('input[type="file"]')).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf,.doc,.docx')
    ) as HTMLInputElement

    // Trigger upload
    fireEvent.change(resumeInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Invalid file type',
        expect.objectContaining({
          description: 'Resume must be PDF, DOC, or DOCX.',
        })
      )
    })
  })

  it('rejects profile pictures over 5MB', async () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Create large fake file
    const largeContent = new Array(Math.floor(5.1 * 1024 * 1024)).fill('a').join('')
    const file = new File([largeContent], 'profile.jpg', { type: 'image/jpeg' })

    // Find image input
    const imageInput = Array.from(document.querySelectorAll('input[type="file"]')).find(
      (input) => (input as HTMLInputElement).accept === 'image/*'
    ) as HTMLInputElement

    // Trigger upload
    fireEvent.change(imageInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'File too large',
        expect.objectContaining({
          description: 'Profile picture must be less than 5MB',
        })
      )
    })
  })
})
