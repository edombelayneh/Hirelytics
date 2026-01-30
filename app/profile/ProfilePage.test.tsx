import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ProfilePage } from './profilepage'


// Mock the toast 
vi.mock('../components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

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
    render(<ProfilePage profile={mockProfile} onUpdateProfile={mockOnUpdateProfile} />)

    // Check headers and form fields
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane.doe@example.com')).toBeInTheDocument()
  })

  it('enables Save button when a field is edited', () => {
    render(<ProfilePage profile={mockProfile} onUpdateProfile={mockOnUpdateProfile} />)

    // Change first name
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Janet' },
    })

    // Save button should now be enabled
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeEnabled()
  })

  it('calls onUpdateProfile when Save button is clicked', () => {
    render(<ProfilePage profile={mockProfile} onUpdateProfile={mockOnUpdateProfile} />)

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
})
