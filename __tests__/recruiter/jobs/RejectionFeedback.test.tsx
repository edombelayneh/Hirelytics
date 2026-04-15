import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const updateDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'SERVER_TS')
const useParamsMock = vi.fn(() => ({ jobId: 'job-123' }))

vi.mock('../../../app/lib/firebaseClient', () => ({ db: {} }))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      {...rest}
    >
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}))

vi.mock('firebase/firestore', () => ({
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
  doc: vi.fn((...args: unknown[]) => ({ path: args })),
  onSnapshot: vi.fn(
    (
      _ref: unknown,
      cb: (snap: { exists: () => boolean; id: string; data: () => Record<string, unknown> }) => void
    ) => {
      cb({
        exists: () => true,
        id: 'job-123',
        data: () => ({
          title: 'Software Engineer Intern',
          company: 'Hirelytics',
          location: 'Remote',
          type: 'Full-time',
          postedDate: '2026-04-15',
          description: 'Build great things.',
          applicantsId: ['a1'],
        }),
      })
      return vi.fn()
    }
  ),
  getDoc: vi.fn((ref: { path: unknown[] }) => {
    if (ref.path[1] === 'users' && ref.path[3] === 'applications') {
      return Promise.resolve({
        exists: () => true,
        data: () => ({ status: 'Interview', jobSource: 'Hirelytics' }),
      })
    }

    return Promise.resolve({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      }),
    })
  }),
}))

vi.mock('../../../app/components/job/JobDetailsCard', () => ({
  JobDetailsCard: () => <div data-testid='job-details-card'>Job Details Card</div>,
}))

vi.mock('../../../app/components/job/ApplicantsTable', () => ({
  ApplicantsTable: ({
    applicants,
    onStatusChange,
  }: {
    applicants: Array<{ id: string; firstName: string; lastName: string }>
    onStatusChange?: (applicantId: string, status: 'Rejected' | 'Offer') => Promise<void> | void
  }) => (
    <div data-testid='applicants-table'>
      <div>{applicants[0]?.firstName}</div>
      <button onClick={() => onStatusChange?.('a1', 'Rejected')}>Open Rejection Modal</button>
    </div>
  ),
}))

vi.mock('../../../app/components/ui/button', () => ({
  Button: ({
    asChild,
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    children: React.ReactNode
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props)
    }

    return <button {...props}>{children}</button>
  },
}))

vi.mock('../../../app/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
}))

vi.mock('../../../app/components/ui/textarea', () => ({
  Textarea: ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}))

vi.mock('../../../app/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
  }) => (open ? <div data-testid='dialog-root'>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../../app/components/ui/popover', () => {
  const PopoverContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
  }>({
    open: false,
    onOpenChange: () => undefined,
  })

  function Popover({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
  }) {
    return (
      <PopoverContext.Provider value={{ open, onOpenChange }}>{children}</PopoverContext.Provider>
    )
  }

  function PopoverTrigger({ children }: { asChild?: boolean; children: React.ReactNode }) {
    const { open, onOpenChange } = React.useContext(PopoverContext)
    if (!React.isValidElement(children)) return null

    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(!open),
    })
  }

  function PopoverContent({ children }: { children: React.ReactNode }) {
    const { open } = React.useContext(PopoverContext)
    return open ? <div data-testid='suggestion-popover'>{children}</div> : null
  }

  return { Popover, PopoverTrigger, PopoverContent }
})

vi.mock('../../../app/components/ui/select', () => {
  function SelectTrigger(props: React.HTMLAttributes<HTMLElement>) {
    return <div {...props} />
  }

  function SelectValue(_props: { placeholder?: string }) {
    return null
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return <option value={value}>{children}</option>
  }

  function collectSelectId(children: React.ReactNode): string | undefined {
    let resolvedId: string | undefined

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child) || resolvedId) return
      const childProps = child.props as { id?: string; children?: React.ReactNode }
      if (child.type === SelectTrigger && typeof childProps.id === 'string') {
        resolvedId = childProps.id
        return
      }
      if (childProps.children) {
        const nestedId = collectSelectId(childProps.children)
        if (nestedId) resolvedId = nestedId
      }
    })

    return resolvedId
  }

  function collectOptions(children: React.ReactNode): React.ReactElement[] {
    const options: React.ReactElement[] = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const childProps = child.props as { children?: React.ReactNode }
      if (child.type === SelectItem) {
        options.push(child)
        return
      }
      if (childProps.children) {
        options.push(...collectOptions(childProps.children))
      }
    })

    return options
  }

  function Select({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) {
    const id = collectSelectId(children)
    const options = collectOptions(children)

    return (
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        <option value=''>Select a reason...</option>
        {options}
      </select>
    )
  }

  return { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
})

import { RejectionFeedbackModal } from '../../../app/components/job/RejectionFeedbackModal'
import JobDetailsPage from '../../../app/recruiter/JobDetails/[jobId]/page'

describe('RejectionFeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('fills the explanation from a suggestion and still allows recruiter edits before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <RejectionFeedbackModal
        isOpen={true}
        applicantName='Jane Smith'
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
      target: { value: 'Missing required skills' },
    })

    fireEvent.click(screen.getByRole('button', { name: /suggested explanation/i }))
    expect(screen.getByTestId('suggestion-popover')).toBeTruthy()

    const firstSuggestionText = screen.getByText(
      /we identified several strengths in your background/i
    )
    expect(firstSuggestionText).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /another suggestion/i }))
    expect(
      screen.getByText(/this role requires a stronger match in several of the required skills/i)
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /use suggestion/i }))

    const textarea = screen.getByLabelText(/additional explanation/i) as HTMLTextAreaElement
    expect(textarea.value).toContain('this role requires a stronger match')

    fireEvent.change(textarea, {
      target: {
        value: `${textarea.value} We encourage you to apply again after building more experience in these areas.`,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: /reject applicant/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        'Missing required skills',
        expect.stringContaining('We encourage you to apply again after building more experience')
      )
    })
  })

  it('shows different suggestion content for different rejection reasons', () => {
    render(
      <RejectionFeedbackModal
        isOpen={true}
        applicantName='Jane Smith'
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
      target: { value: 'Position filled' },
    })
    fireEvent.click(screen.getByRole('button', { name: /suggested explanation/i }))
    expect(screen.getByText(/the position has now been filled/i)).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
      target: { value: 'Overqualified for the role' },
    })
    fireEvent.click(screen.getByRole('button', { name: /suggested explanation/i }))
    expect(
      screen.getByText(
        /background reflects a level of experience and responsibility beyond what this position is designed to offer/i
      )
    ).toBeTruthy()
  })
})

describe('JobDetailsPage rejection feedback save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useParamsMock.mockReturnValue({ jobId: 'job-123' })
  })

  afterEach(() => {
    cleanup()
  })

  it('saves rejection feedback to the applicant application document in Firestore', async () => {
    render(<JobDetailsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('applicants-table')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /open rejection modal/i }))

    fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
      target: { value: 'Position filled' },
    })

    fireEvent.click(screen.getByRole('button', { name: /suggested explanation/i }))
    fireEvent.click(screen.getByRole('button', { name: /use suggestion/i }))

    fireEvent.click(screen.getByRole('button', { name: /reject applicant/i }))

    await waitFor(() => {
      expect(updateDocMock).toHaveBeenCalledWith(
        { path: [{}, 'users', 'a1', 'applications', 'job-123'] },
        {
          jobId: 'job-123',
          applicationId: 'job-123',
          status: 'Rejected',
          rejectionReason: 'Position filled',
          rejectionExplanation: expect.stringContaining('position has now been filled'),
          rejectedAt: 'SERVER_TS',
          updatedAt: 'SERVER_TS',
        }
      )
    })
  })
})
