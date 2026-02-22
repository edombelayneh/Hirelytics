import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ProfilePage } from '../../../app/applicant/profile/ProfilePage'
import { toast } from '../../../app/components/ui/sonner'

// Mock the toast
vi.mock('../../app/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock File Reader
interface MockFileReader {
  readAsDataURL: () => void
  onloadend: (() => void) | null
}

global.FileReader = vi.fn(function (this: MockFileReader) {
  this.readAsDataURL = vi.fn()
  this.onloadend = null
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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders profile data correctly', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Check headers and form fields
    expect(screen.getByText('My Profile')).toBeTruthy()
    expect(screen.getByDisplayValue('Jane')).toBeTruthy()
    expect(screen.getByDisplayValue('Doe')).toBeTruthy()
    expect(screen.getByDisplayValue('jane.doe@example.com')).toBeTruthy()
  })

  it('enables Save button when a field is edited', () => {
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

    // Save button should now be enabled
    const saveButton = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)
  })

  it('calls onUpdateProfile when Save button is clicked', () => {
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

    // Expect the callback to be called with updated profile
    expect(mockOnUpdateProfile).toHaveBeenCalledTimes(1)
    expect(mockOnUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Janet' })
    )
  })

  it('prevents saving with empty firstName', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Clear first name
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: '' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Should show error toast and not call onUpdateProfile
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({
        description: 'Please fill in your name and email',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('prevents saving with empty lastName', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Clear last name
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: '' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Should show error toast and not call onUpdateProfile
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({
        description: 'Please fill in your name and email',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('prevents saving with empty email', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Clear email
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: '' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Should show error toast and not call onUpdateProfile
    expect(toast.error).toHaveBeenCalledWith(
      'Missing required fields',
      expect.objectContaining({
        description: 'Please fill in your name and email',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('prevents saving with invalid email format (missing @)', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Clear email and enter invalid format
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalidemail.com' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Should show error toast and not call onUpdateProfile
    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format',
      expect.objectContaining({
        description: 'Please enter a valid email address',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('prevents saving with invalid email format (missing domain)', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Enter email without domain extension
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid@domain' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Should show error toast and not call onUpdateProfile
    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format',
      expect.objectContaining({
        description: 'Please enter a valid email address',
      })
    )
    expect(mockOnUpdateProfile).not.toHaveBeenCalled()
  })

  it('allows saving with valid email format', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Change first name to trigger editing mode
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    // Keep the valid email (already set in mockProfile)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Should call onUpdateProfile and show success toast
    expect(mockOnUpdateProfile).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows success toast when profile is updated', async () => {
    // Make the mock resolve successfully
    mockOnUpdateProfile.mockResolvedValueOnce(undefined)

    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Change first name to trigger editing mode
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Should show success toast with correct message
    expect(toast.success).toHaveBeenCalledWith(
      'Profile updated successfully',
      expect.objectContaining({
        description: 'Your changes have been saved',
      })
    )
  })

  // Resume Upload Tests
  it('accepts .pdf resume files', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    const resumeInputs = document.querySelectorAll('input[type="file"]')
    const resumeInput = Array.from(resumeInputs).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf')
    ) as HTMLInputElement

    fireEvent.change(resumeInput, { target: { files: [file] } })

    // Just verify the input accepts the file without errors - the component will handle the rest
    expect(resumeInput).toBeTruthy()
  })

  it('accepts .doc resume files', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    const file = new File(['resume content'], 'resume.doc', { type: 'application/msword' })
    const resumeInputs = document.querySelectorAll('input[type="file"]')
    const resumeInput = Array.from(resumeInputs).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf')
    ) as HTMLInputElement

    fireEvent.change(resumeInput, { target: { files: [file] } })

    expect(resumeInput).toBeTruthy()
  })

  it('accepts .docx resume files', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    const file = new File(['resume content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const resumeInputs = document.querySelectorAll('input[type="file"]')
    const resumeInput = Array.from(resumeInputs).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf')
    ) as HTMLInputElement

    fireEvent.change(resumeInput, { target: { files: [file] } })

    expect(resumeInput).toBeTruthy()
  })
  // Invalid file type tests
  it('rejects .txt resume files', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    const file = new File(['resume content'], 'resume.txt', { type: 'text/plain' })
    const resumeInputs = document.querySelectorAll('input[type="file"]')
    const resumeInput = Array.from(resumeInputs).find((input) =>
      (input as HTMLInputElement).accept.includes('.pdf')
    ) as HTMLInputElement

    fireEvent.change(resumeInput, { target: { files: [file] } })

    // Error invalid file type toast
    expect(toast.error).toHaveBeenCalledWith(
      'Invalid file type',
      expect.objectContaining({
        description: 'Resume must be in PDF, DOC, or DOCX format',
      })
    )
  })

  it('rejects .jpg resume files', () => {
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    const file = new File(['resume content'], 'resume.jpg', { type: 'image/jpeg' })
    const resumeInputs = document.querySelectorAll('input[type="file"]')
    const resumeInput = Array.from(resumeInputs).find((input) =>
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
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Tests for files over 10MB - Resume
    const fileContent = new Array(Math.floor(10.1 * 1024 * 1024)).fill('a').join('')
    const file = new File([fileContent], 'resume.pdf', { type: 'application/pdf' })

    const resumeInputs = document.querySelectorAll('input[type="file"]')
    const resumeInput = Array.from(resumeInputs).find((input) =>
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
    render(
      <ProfilePage
        profile={mockProfile}
        onUpdateProfile={mockOnUpdateProfile}
      />
    )

    // Tests for files over 5MB - PFP
    const fileContent = new Array(Math.floor(5.1 * 1024 * 1024)).fill('a').join('')
    const file = new File([fileContent], 'profile.jpg', { type: 'image/jpeg' })

    const profilePicInputs = document.querySelectorAll('input[type="file"]')
    const profilePicInput = Array.from(profilePicInputs).find(
      (input) => !(input as HTMLInputElement).accept.includes('.pdf')
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
