// __tests__/recruiter/profile/RecruiterProfilePage.test.tsx
import React, { JSX } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

import { RecruiterProfilePage } from '../../../app/recruiter/profile/RecruiterProfilePage' // <-- adjust path
import type { RecruiterProfile } from '../../../app/utils/userProfiles'

// Checks if an element exists on the page (is visible to the user)
const expectInDoc = (el: unknown): void => {
  expect(el).toBeTruthy()
}

// Verifies that an input field contains a specific value
const expectInputValue = (el: HTMLElement, value: string): void => {
  expect((el as HTMLInputElement).value).toBe(value)
}

// Verifies that a button cannot be clicked (disabled state)
const expectDisabled = (el: HTMLElement): void => {
  expect((el as HTMLButtonElement).disabled).toBe(true)
}

// Verifies that a button can be clicked (enabled state)
const expectEnabled = (el: HTMLElement): void => {
  expect((el as HTMLButtonElement).disabled).toBe(false)
}

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */
// Mock ClerkUser type represents a user from the authentication service
type ClerkUser = {
  id: string
  firstName?: string | null
  lastName?: string | null
  primaryEmailAddress?: { emailAddress?: string | null } | null
}
// UseUserReturn represents the result of getting user info from Clerk
type UseUserReturn = { isLoaded: boolean; user: ClerkUser | null }

// Mock function to simulate getting user data from Clerk (authentication service)
const useUserMock = vi.fn<() => UseUserReturn>()
vi.mock('@clerk/nextjs', () => ({
  useUser: (): UseUserReturn => useUserMock(),
}))

// Toast types define the shape of notification messages
type ToastOptions = { description?: string }
type ToastFn = (title: string, opts?: ToastOptions) => void

// Mock toast functions to track notification calls during tests
const toastSuccess = vi.fn<ToastFn>()
const toastError = vi.fn<ToastFn>()

// Mock the toast notification component (sonner) with fake success/error functions
vi.mock('../../../app/components/ui/sonner', () => ({
  toast: {
    success: (title: string, opts?: ToastOptions): void => toastSuccess(title, opts),
    error: (title: string, opts?: ToastOptions): void => toastError(title, opts),
  },
}))

// Mock Card component - creates a simple container for content
vi.mock('../../../app/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid='card'>{children}</div>
  ),
}))

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
}
// Mock Button component - renders a clickable button element
vi.mock('../../../app/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...rest }: ButtonProps): JSX.Element => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  ),
}))

type InputProps = React.InputHTMLAttributes<HTMLInputElement>
// Mock Input component - renders a text input field
vi.mock('../../../app/components/ui/input', () => ({
  Input: (props: InputProps): JSX.Element => <input {...props} />,
}))

// Mock Label component - renders a label for form inputs
vi.mock('../../../app/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }): JSX.Element => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
// Mock Textarea component - renders a multi-line text input
vi.mock('../../../app/components/ui/textarea', () => ({
  Textarea: (props: TextareaProps): JSX.Element => <textarea {...props} />,
}))

// Mock Avatar components - render user profile images or initials
vi.mock('../../../app/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }): JSX.Element => <div>{children}</div>,
  AvatarImage: ({ alt, src }: { alt?: string; src?: string }): JSX.Element => (
    <img
      alt={alt ?? ''}
      src={src ?? ''}
    />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div>{children}</div>
  ),
}))

// Simulates reading files from the user's computer for logo uploads
type MockFileReaderHandler = (() => void) | null

// Fake FileReader that returns a predetermined image instead of reading real files
class MockFileReader {
  public result: string | ArrayBuffer | null = null
  public onloadend: MockFileReaderHandler = null

  public readAsDataURL(_file: File): void {
    // Returns a fake base64 image string to simulate successful file reading
    this.result = 'data:image/png;base64,FAKE'
    if (this.onloadend) this.onloadend()
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */
describe('RecruiterProfilePage', () => {
  // Creates a default profile with empty fields, allowing overrides for specific test scenarios
  const baseProfile = (overrides: Partial<RecruiterProfile> = {}): RecruiterProfile =>
    ({
      companyName: '',
      companyWebsite: '',
      companyLogo: '',
      companyLocation: '',
      companyDescription: '',
      recruiterName: '',
      recruiterTitle: '',
      recruiterEmail: '',
      recruiterPhone: '',
      ...overrides,
    }) as RecruiterProfile

  // Runs before each test - sets up fake user data and mocks
  beforeEach(() => {
    // Set up a fake logged-in user (Jane Doe) for tests to use
    useUserMock.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddress: { emailAddress: 'jane.doe@hirelytics.com' },
      },
    })

    // Clear any previous notification calls from earlier tests
    toastSuccess.mockClear()
    toastError.mockClear()

    // Replace real FileReader with our fake version for testing file uploads
    const g = globalThis as unknown as { FileReader: typeof FileReader }
    g.FileReader = MockFileReader as unknown as typeof FileReader
  })

  // Runs after each test - cleans up rendered components and resets mocks
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // Test: Verifies the page displays all expected form fields and the Save button on initial load
  it('renders initial fields and Save button', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({ companyName: 'Hirelytics Inc.' })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    expectInDoc(screen.getByText('Recruiter Profile'))
    expectInDoc(screen.getByLabelText(/Company Name/i))
    expectInDoc(screen.getByLabelText(/Recruiter Email/i))
    expectInDoc(screen.getByRole('button', { name: /Save Changes/i }))
  })

  // Test: Verifies that when profile is empty, user data from Clerk automatically fills the name and email fields
  it('auto-fills recruiter name/email from Clerk when missing', async () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterName: '',
          recruiterEmail: '',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    await waitFor(() => {
      expectInputValue(screen.getByLabelText(/Recruiter Email/i), 'jane.doe@hirelytics.com')
      expectInputValue(screen.getByLabelText(/Your Name/i), 'Jane Doe')
    })
  })

  // Test: Ensures user-typed email is preserved even when new data comes from the database
  it('does not overwrite typed recruiterEmail when user is editing', async () => {
    const { rerender } = render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: '',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    fireEvent.change(screen.getByLabelText(/Recruiter Email/i), {
      target: { value: 'typed@company.com' },
    })

    rerender(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'firestore@company.com',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    await waitFor(() => {
      expectInputValue(screen.getByLabelText(/Recruiter Email/i), 'typed@company.com')
    })
  })

  // Test: Verifies that empty required fields (company name, email) show error messages and prevent saving
  it('validates required fields and shows toast error when missing', async () => {
    // Override Clerk values so auto-fill DOES NOT populate recruiterEmail
    useUserMock.mockReturnValueOnce({
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: '',
        lastName: '',
        primaryEmailAddress: { emailAddress: '' },
      },
    })

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({ companyName: '', recruiterEmail: '' })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    expectInDoc(await screen.findByText(/Company name is required/i))
    expectInDoc(await screen.findByText(/Recruiter email is required/i))

    expect(toastError).toHaveBeenCalled()
    const firstCall = toastError.mock.calls[0]
    expect(firstCall[0]).toMatch(/Missing required fields/i)
  })

  // Test: Verifies that an invalid email format shows an error and doesn't allow saving
  it('validates recruiterEmail format and blocks save', async () => {
    const onSave = vi.fn(async (): Promise<void> => {})

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'not-an-email',
        })}
        onSave={onSave}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    expectInDoc(await screen.findByText(/Enter a valid email/i))
    expect(onSave).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalled()
  })

  // Test: Verifies that valid form data is saved and a success notification appears
  it('calls onSave with current form data when valid and shows success toast', async () => {
    const onSave = vi.fn(async (_profile: RecruiterProfile): Promise<void> => {})

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
          recruiterName: 'Jane Recruiter',
        })}
        onSave={onSave}
      />
    )

    fireEvent.change(screen.getByLabelText(/Company Website/i), {
      target: { value: 'https://hirelytics.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const saved = onSave.mock.calls[0][0] as unknown as RecruiterProfile
    expect(saved.companyWebsite).toBe('https://hirelytics.com')

    expect(toastSuccess).toHaveBeenCalled()
    expect(toastSuccess.mock.calls[0][0]).toMatch(/Recruiter profile saved/i)
  })

  // Test: Verifies the Save button shows "Saving..." and becomes disabled while the save is in progress
  it('disables save button and shows "Saving..." while saving', async () => {
    let resolveSaveRef: (() => void) | null = null

    const onSave = vi.fn(async (_profile: RecruiterProfile): Promise<void> => {
      await new Promise<void>((resolve) => {
        resolveSaveRef = resolve
      })
    })

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
        })}
        onSave={onSave}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    const savingBtn = await screen.findByRole('button', { name: /Saving\.\.\./i })
    expectDisabled(savingBtn)

    // Resolve the save promise
    if (resolveSaveRef) {
      ;(resolveSaveRef as () => void)()
    }

    await waitFor(() => {
      const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
      expectEnabled(saveBtn)
    })
  })

  // Test: Verifies that if saving fails, an error notification is displayed
  it('shows error toast if onSave throws', async () => {
    const onSave = vi.fn(async (): Promise<void> => {
      throw new Error('boom')
    })

    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
        })}
        onSave={onSave}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled()
    })

    const last = toastError.mock.calls.at(-1)
    expect(last ? last[0] : '').toMatch(/Save failed/i)
  })

  // Test: Verifies that uploading a non-image file (like a text file) for the logo is rejected with an error
  it('rejects non-image logo uploads with toast error', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(fileInput).not.toBeNull()
    if (!fileInput) return

    const badFile = new File(['hello'], 'bad.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [badFile] } })

    expect(toastError).toHaveBeenCalled()
    const [title, opts] = toastError.mock.calls[0]
    expect(title).toMatch(/Invalid file type/i)
    expect(opts?.description ?? '').toMatch(/Logo must be an image/i)
  })

  // Test: Verifies that uploading a logo file larger than 5MB is rejected with an error
  it('rejects logo uploads over 5MB with toast error', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(fileInput).not.toBeNull()
    if (!fileInput) return

    const bigFile = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(bigFile, 'size', { value: 5 * 1024 * 1024 + 1 })

    fireEvent.change(fileInput, { target: { files: [bigFile] } })

    expect(toastError).toHaveBeenCalled()
    const [title, opts] = toastError.mock.calls[0]
    expect(title).toMatch(/File too large/i)
    expect(opts?.description ?? '').toMatch(/less than 5MB/i)
  })

  // Test: Verifies that a valid image upload displays a preview and shows a success notification
  it('accepts valid image logo upload, updates preview src, and shows success toast', async () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(fileInput).not.toBeNull()
    if (!fileInput) return

    const goodFile = new File(['pngbytes'], 'logo.png', { type: 'image/png' })
    Object.defineProperty(goodFile, 'size', { value: 1024 })

    fireEvent.change(fileInput, { target: { files: [goodFile] } })

    await waitFor(() => {
      const img = screen.getByAltText(/Company logo/i) as HTMLImageElement
      expect(img.src).toContain('data:image/png;base64,FAKE')
    })

    expect(toastSuccess).toHaveBeenCalled()
    const last = toastSuccess.mock.calls.at(-1)
    expect(last ? last[0] : '').toMatch(/Company logo uploaded/i)
  })

  // Test: Verifies that when no logo is uploaded, the company's initials are displayed as a fallback
  it('shows company initials fallback when no logo and company name present', () => {
    render(
      <RecruiterProfilePage
        recruiterProfile={baseProfile({
          companyName: 'Hirelytics Inc.',
          recruiterEmail: 'recruiting@hirelytics.com',
          companyLogo: '',
        })}
        onSave={vi.fn(async (): Promise<void> => {})}
      />
    )

    expectInDoc(screen.getByText('HI'))
  })
})
