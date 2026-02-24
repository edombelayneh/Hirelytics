// __tests__/home/HomePage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import HomePage from '../../app/home/page'

/* -------------------------------------------------------------------------- */
/*                               GLOBAL MOCKS                                 */
/* -------------------------------------------------------------------------- */

// Mock the entire Clerk module to control useAuth behavior in tests
const clerk = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
vi.mock('@clerk/nextjs', () => ({
  useAuth: clerk.useAuth,
}))

// Mock the entire protectedAction module to control its behavior in tests
const protectedActionMock = vi.hoisted(() => ({
  protectedAction: vi.fn(),
}))
vi.mock('../../app/utils/protectedAction', () => ({
  protectedAction: protectedActionMock.protectedAction,
}))

// Mock the entire framer-motion module to prevent animation issues in tests
vi.mock('framer-motion', () => {
  const MotionDiv = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return { motion: { div: MotionDiv } }
})

// Mock the entire lucide-react module to prevent icon rendering issues in tests
vi.mock('../../app/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button
      type='button'
      onClick={onClick}
    >
      {children}
    </button>
  ),
}))

// Mock the entire card component to prevent styling issues in tests
vi.mock('../../app/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid='card'>{children}</div>,
}))

// Mock the entire sonner module to control toast behavior in tests
vi.mock('lucide-react', () => ({
  Brain: () => <span data-testid='icon-brain' />,
  Clock: () => <span data-testid='icon-clock' />,
  Globe: () => <span data-testid='icon-globe' />,
  Zap: () => <span data-testid='icon-zap' />,
  Shield: () => <span data-testid='icon-shield' />,
  BarChart3: () => <span data-testid='icon-barchart3' />,
  Briefcase: () => <span data-testid='icon-briefcase' />,
  ClipboardList: () => <span data-testid='icon-clipboardlist' />,
  ArrowRight: () => <span data-testid='icon-arrowright' />,
  Users: () => <span data-testid='icon-users' />,
  Sparkles: () => <span data-testid='icon-sparkles' />,
  CheckCircle2: () => <span data-testid='icon-checkcircle2' />,
  LineChart: () => <span data-testid='icon-linechart' />,
}))

// ------------------------------------------------------------------ */
//                         TESTS
/* ------------------------------------------------------------------ */

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // default state: user is signed out
    clerk.useAuth.mockReturnValue({ isSignedIn: false })
    // default protectedAction behavior:
    // only run onAuthed() if the user is signed in
    protectedActionMock.protectedAction.mockImplementation(
      ({ isSignedIn, onAuthed }: { isSignedIn: boolean; onAuthed: () => void }) => {
        if (isSignedIn) onAuthed()
      }
    )
    // reset the hash so each test starts clean
    window.location.hash = ''
  })

  // Clean up the DOM after every test so state/DOM from one test
  // can’t leak into the next test and cause flaky assertions.
  afterEach(() => {
    cleanup()
  })

  // Verifies the top “hero” section renders the main marketing headline
  // and the two primary call-to-action buttons users see first.
  it('renders the hero section with the main headline and primary buttons', () => {
    render(<HomePage />)

    expect(screen.getByText('Make Hiring Faster, Fairer, and Clearer')).toBeTruthy()
    expect(screen.getByText('Browse Available Jobs')).toBeTruthy()
    expect(screen.getByText('View My Applications')).toBeTruthy()
  })
  // Confirms the stats row renders all key values and their labels.
  // This protects against accidental copy changes or missing UI blocks.
  it('renders the stats row with all values and labels', () => {
    render(<HomePage />)

    expect(screen.getByText('10+')).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByText('Real-time')).toBeTruthy()
    expect(screen.getByText('All-in-One')).toBeTruthy()

    expect(screen.getAllByText('Available Jobs').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Free Forever')).toBeTruthy()
    expect(screen.getByText('Updates')).toBeTruthy()
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })
  // Ensures the “Features” section renders and all expected feature cards/titles exist.
  // Also checks there’s at least one card rendered (sanity check for the grid).
  it('renders the features section and all feature titles', () => {
    render(<HomePage />)

    expect(screen.getByText('What Makes Hirelytics Different')).toBeTruthy()

    expect(screen.getByText('AI Feedback Engine')).toBeTruthy()
    expect(screen.getByText('Real-Time Status Updates')).toBeTruthy()
    expect(screen.getByText('Smart Job Aggregation')).toBeTruthy()
    expect(screen.getByText('Recruiter Efficiency')).toBeTruthy()
    expect(screen.getByText('Applicant Insights')).toBeTruthy()
    expect(screen.getByText('Compliance & Security')).toBeTruthy()

    expect(screen.getAllByTestId('card').length).toBeGreaterThan(0)
  })
  // Verifies the “How It Works” section shows all steps.
  // This protects the onboarding flow messaging and step titles from being removed.
  it('renders the How It Works section with all three steps', () => {
    render(<HomePage />)

    expect(screen.getByText('How It Works')).toBeTruthy()
    expect(screen.getByText('Apply & Sync')).toBeTruthy()
    expect(screen.getByText('Review & Update')).toBeTruthy()
    expect(screen.getByText('AI Feedback')).toBeTruthy()
  })
  // Confirms the bottom call-to-action section renders the headline
  // and the two CTA buttons that route users into the app.
  it('renders the CTA section and both CTA buttons', () => {
    render(<HomePage />)

    expect(screen.getByText('Start Building a Better Hiring Experience')).toBeTruthy()
    expect(screen.getByText('Get Started Now')).toBeTruthy()
    expect(screen.getByText('View Dashboard')).toBeTruthy()
  })
  // Verifies footer branding is present and that nav links point to the intended routes.
  // This catches accidental changes to hrefs (hash routing + anchor links).
  it('renders the footer and links point to the correct routes', () => {
    render(<HomePage />)

    expect(screen.getByText('Hirelytics')).toBeTruthy()

    const featuresLink = screen.getByRole('link', { name: 'Features' })
    const jobsLink = screen.getByRole('link', { name: 'Available Jobs' })
    const appsLink = screen.getByRole('link', { name: 'My Applications' })

    expect(featuresLink.getAttribute('href')).toBe('#features')
    expect(jobsLink.getAttribute('href')).toBe('#/jobs')
    expect(appsLink.getAttribute('href')).toBe('#/applications')
  })
  // Signed-out behavior: clicking hero buttons should trigger the protectedAction gate
  // (e.g., sign-in prompt) and should NOT navigate/change the URL hash.
  it('when signed OUT, clicking hero buttons calls protectedAction and does not change the hash', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: false })

    render(<HomePage />)
    // Simulate clicking the hero buttons and check that protectedAction is called and the hash does NOT change
    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe('')
    // Reset mocks and hash before next click
    fireEvent.click(screen.getByText('View My Applications'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledTimes(2)
    expect(window.location.hash).toBe('')
  })

  // Signed-in behavior: clicking hero buttons should navigate by updating the hash.
  // This confirms routing logic is wired correctly when auth is valid.
  it('when signed IN, hero buttons update the hash correctly', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: true })

    render(<HomePage />)
    // Simulate clicking the hero buttons and check that the hash updates to the expected routes
    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(window.location.hash).toBe('#/jobs')
    // Reset hash before next click
    fireEvent.click(screen.getByText('View My Applications'))
    expect(window.location.hash).toBe('#/applications')
  })
  // Signed-in behavior for CTA buttons too (not just hero buttons).
  // Ensures “Get Started Now” and “View Dashboard” route to the right pages.
  it('when signed IN, CTA buttons also route correctly', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: true })

    render(<HomePage />)
    // Simulate clicking the CTA buttons at the bottom of the page
    fireEvent.click(screen.getByText('Get Started Now'))
    expect(window.location.hash).toBe('#/jobs')
    // Reset hash before next click
    fireEvent.click(screen.getByText('View Dashboard'))
    expect(window.location.hash).toBe('#/applications')
  })
  // Ensures we pass the correct auth state into protectedAction.
  // This checks the integration contract: protectedAction receives isSignedIn
  // and a callback that should run when the user is authenticated.
  it('passes the correct auth state into protectedAction', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: false })
    render(<HomePage />)

    // Simulate user clicking the Browse Available Jobs button when signed out
    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledWith({
      isSignedIn: false,
      onAuthed: expect.any(Function),
    })

    cleanup()
    // Simulate user signing in by changing the mock return value and clicking the button again
    clerk.useAuth.mockReturnValue({ isSignedIn: true })
    render(<HomePage />)

    // Simulate user clicking the button again when signed in
    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledWith({
      isSignedIn: true,
      onAuthed: expect.any(Function),
    })
  })
})
