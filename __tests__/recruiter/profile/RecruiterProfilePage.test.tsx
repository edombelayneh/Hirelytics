// __tests__/recruiter/profile/RecruiterProfilePage.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

import { RecruiterProfilePage } from '../../../app/recruiter/profile/RecruiterProfilePage' // <-- adjust path
import type { RecruiterProfile } from '../../../app/utils/userProfiles'

// -----------------------------------------------------------------------------
// Helpers (no jest-dom)
// -----------------------------------------------------------------------------
const expectInDoc = (el: unknown): void => {
  expect(el).toBeTruthy()
}

const expectInputValue = (el: HTMLElement, value: string): void => {
  expect((el as HTMLInputElement).value).toBe(value)
}

const expectDisabled = (el: HTMLElement): void => {
  expect((el as HTMLButtonElement).disabled).toBe(true)
}

const expectEnabled = (el: HTMLElement): void => {
  expect((el as HTMLButtonElement).disabled).toBe(false)
}

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
type ClerkUser = {
  id: string
  firstName?: string | null
  lastName?: string | null
  primaryEmailAddress?: { emailAddress?: string | null } | null
}
type UseUserReturn = { isLoaded: boolean; user: ClerkUser | null }

const useUserMock = vi.fn<() => UseUserReturn>()
vi.mock('@clerk/nextjs', () => ({
  useUser: (): UseUserReturn => useUserMock(),
}))

type ToastOptions = { description?: string }
type ToastFn = (title: string, opts?: ToastOptions) => void

const toastSuccess = vi.fn<ToastFn>()
const toastError = vi.fn<ToastFn>()

vi.mock('../../../app/components/ui/sonner', () => ({
  toast: {
    success: (title: string, opts?: ToastOptions): void => toastSuccess(title, opts),
    error: (title: string, opts?: ToastOptions): void => toastError(title, opts),
  },
}))

vi.mock('../../../app/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid='card'>{children}</div>
  ),
}))

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
}
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
vi.mock('../../../app/components/ui/input', () => ({
  Input: (props: InputProps): JSX.Element => <input {...props} />,
}))

vi.mock('../../../app/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }): JSX.Element => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
vi.mock('../../../app/components/ui/textarea', () => ({
  Textarea: (props: TextareaProps): JSX.Element => <textarea {...props} />,
}))

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

// -----------------------------------------------------------------------------
// FileReader mock
// -----------------------------------------------------------------------------
type MockFileReaderHandler = (() => void) | null

class MockFileReader {
  public result: string | ArrayBuffer | null = null
  public onloadend: MockFileReaderHandler = null

  public readAsDataURL(_file: File): void {
    this.result = 'data:image/png;base64,FAKE'
    if (this.onloadend) this.onloadend()
  }
}

describe('RecruiterProfilePage', () => {
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

  beforeEach(() => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: 'Jane',
        lastName: 'Doe',
        primaryEmailAddress: { emailAddress: 'jane.doe@hirelytics.com' },
      },
    })

    toastSuccess.mockClear()
    toastError.mockClear()

    const g = globalThis as unknown as { FileReader: typeof FileReader }
    g.FileReader = MockFileReader as unknown as typeof FileReader
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

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

  it('calls onSave with current form data when valid and shows success toast', async () => {
    const onSave = vi.fn(async (): Promise<void> => {})

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

    const saved = onSave.mock.calls[0][0] as RecruiterProfile
    expect(saved.companyWebsite).toBe('https://hirelytics.com')

    expect(toastSuccess).toHaveBeenCalled()
    expect(toastSuccess.mock.calls[0][0]).toMatch(/Recruiter profile saved/i)
  })

  it('disables save button and shows "Saving..." while saving', async () => {
    let resolveSave: (() => void) | null = null

    const onSave = vi.fn(
      async (): Promise<void> =>
        await new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

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

    if (resolveSave) resolveSave()

    await waitFor(() => {
      const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
      expectEnabled(saveBtn)
    })
  })

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
