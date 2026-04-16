import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { getDoc } from 'firebase/firestore'
import ApplicationDetailsPage from '../../../../app/applicant/applications/[applicationId]/page'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCKS                                 */
/* -------------------------------------------------------------------------- */

const pushMock = vi.fn()
const searchParamsMock = { get: vi.fn().mockReturnValue(null) }
const updateDocMock = vi.fn().mockResolvedValue(undefined)
const docMock = vi.fn().mockReturnValue({ id: 'mock-ref' })

vi.mock('next/navigation', () => ({
  useParams: () => ({ applicationId: 'app-1' }),
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsMock,
}))

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'user-1', isLoaded: true }),
}))

vi.mock('@/app/lib/firebaseClient', () => ({ db: {} }))

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: vi.fn(),
  // Fires the callback synchronously so loadingJob resolves on mount
  onSnapshot: vi.fn((_, callback: (snap: { exists: () => boolean }) => void) => {
    callback({ exists: () => false })
    return () => {}
  }),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  serverTimestamp: () => 'SERVER_TS',
}))

vi.mock('@/app/utils/dateFormatter', () => ({
  formatDateWithYear: (date: string) => date ?? '',
}))

// Accordion: simple passthrough to avoid Radix animation/portal issues in jsdom
vi.mock('@/app/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Tabs: stores onValueChange so tests can trigger tab switches by clicking buttons
let capturedOnValueChange: ((v: string) => void) | undefined
vi.mock('@/app/components/ui/tabs', () => ({
  Tabs: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode
    onValueChange?: (v: string) => void
  }) => {
    capturedOnValueChange = onValueChange
    return <div>{children}</div>
  },
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // Each trigger is a plain button that fires onValueChange with its value on click
  TabsTrigger: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button onClick={() => capturedOnValueChange?.(value)}>{children}</button>
  ),
  // All tab content is always rendered — assertions check data presence, not visibility
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

// Builds a mock Firestore document snapshot for the application
function makeAppSnap(overrides: Record<string, unknown> = {}) {
  return {
    exists: () => true,
    id: 'app-1',
    data: () => ({
      id: 'app-1',
      company: 'TechCorp',
      position: 'Software Engineer',
      status: 'Rejected',
      applicationDate: '2026-01-01',
      city: 'New York',
      country: 'USA',
      jobSource: 'Hirelytics',
      notes: '',
      jobLink: '',
      contactPerson: '',
      updatedAt: '2026-04-13',
      ...overrides,
    }),
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('ApplicationDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to null (no ?tab= param) by default
    searchParamsMock.get.mockReturnValue(null)
    // Default: valid application document exists
    vi.mocked(getDoc).mockResolvedValue(makeAppSnap() as never)
  })

  afterEach(() => {
    cleanup()
  })

  // --- Loading & Not Found States ---

  it('shows a loading state while application data is being fetched', () => {
    // getDoc never resolves → loadingApp stays true
    vi.mocked(getDoc).mockReturnValue(new Promise(() => {}) as never)
    render(<ApplicationDetailsPage />)

    expect(screen.getByText('Loading...')).toBeTruthy()
  })

  it('shows not found message when the application document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)
    render(<ApplicationDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Application not found.')).toBeTruthy()
    })
  })

  // --- Tab Rendering ---

  it('renders all three tab labels once data has loaded', async () => {
    render(<ApplicationDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Job Posting')).toBeTruthy()
      expect(screen.getByText('My Details')).toBeTruthy()
      expect(screen.getByText('Feedback')).toBeTruthy()
    })
  })

  // --- Feedback Tab Content ---

  it('shows the empty state when recruiterFeedback is absent', async () => {
    // No recruiterFeedback field → empty state message shown
    render(<ApplicationDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('No feedback yet')).toBeTruthy()
      expect(screen.getByText("You'll be notified when feedback is available.")).toBeTruthy()
    })
  })

  it('shows the feedback text when recruiterFeedback exists', async () => {
    vi.mocked(getDoc).mockResolvedValue(
      makeAppSnap({ recruiterFeedback: 'Strong candidate, keep in touch.' }) as never
    )
    render(<ApplicationDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Strong candidate, keep in touch.')).toBeTruthy()
    })
  })

  it('shows current application status in the empty state', async () => {
    render(<ApplicationDetailsPage />)

    await waitFor(() => {
      // "Current status:" label is unique to the feedback empty state pill
      expect(screen.getByText(/Current status:/)).toBeTruthy()
      expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0)
    })
  })

  // --- Mark Feedback as Seen ---

  it('calls updateDoc with recruiterFeedbackSeen: true when user clicks the Feedback tab', async () => {
    vi.mocked(getDoc).mockResolvedValue(
      makeAppSnap({ recruiterFeedback: 'Good fit for next cycle.' }) as never
    )
    render(<ApplicationDetailsPage />)

    // Wait for the app data to load so handleTabChange has a non-null recruiterFeedback
    await waitFor(() => screen.getByText('Good fit for next cycle.'))

    // Simulate the user clicking the Feedback tab trigger
    fireEvent.click(screen.getByText('Feedback'))

    await waitFor(() => {
      expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { recruiterFeedbackSeen: true })
    })
  })

  it('calls updateDoc with recruiterFeedbackSeen: true on mount when URL has ?tab=feedback', async () => {
    // Deep-link: page loads directly on the Feedback tab
    searchParamsMock.get.mockReturnValue('feedback')
    vi.mocked(getDoc).mockResolvedValue(
      makeAppSnap({ recruiterFeedback: 'You were a great candidate.' }) as never
    )
    render(<ApplicationDetailsPage />)

    // The useEffect fires once application loads with unread feedback
    await waitFor(() => {
      expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { recruiterFeedbackSeen: true })
    })
  })

  it('does not call updateDoc when feedback is already marked as seen', async () => {
    vi.mocked(getDoc).mockResolvedValue(
      makeAppSnap({ recruiterFeedback: 'Great!', recruiterFeedbackSeen: true }) as never
    )
    render(<ApplicationDetailsPage />)

    await waitFor(() => screen.getByText('Great!'))

    // Switching to the Feedback tab should not write again since it is already seen
    fireEvent.click(screen.getByText('Feedback'))

    expect(updateDocMock).not.toHaveBeenCalled()
  })
})
