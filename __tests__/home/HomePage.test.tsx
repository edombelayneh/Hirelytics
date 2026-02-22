// __tests__/home/HomePage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import HomePage from '../../app/home/page'

/* ---------------------------------------------
   MOCK: Clerk auth
--------------------------------------------- */
const clerk = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('@clerk/nextjs', () => ({
  useAuth: clerk.useAuth,
}))

/* ---------------------------------------------
   MOCK: protectedAction  (FIXED PATH)
--------------------------------------------- */
const protectedActionMock = vi.hoisted(() => ({
  protectedAction: vi.fn(),
}))

vi.mock('../../app/utils/protectedAction', () => ({
  protectedAction: protectedActionMock.protectedAction,
}))

/* ---------------------------------------------
   MOCK: framer-motion
--------------------------------------------- */
vi.mock('framer-motion', () => {
  const MotionDiv = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return { motion: { div: MotionDiv } }
})

/* ---------------------------------------------
   MOCK: UI components (FIXED PATHS)
--------------------------------------------- */
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

vi.mock('../../app/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid='card'>{children}</div>,
}))

/* ---------------------------------------------
   MOCK: lucide-react icons
--------------------------------------------- */
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

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clerk.useAuth.mockReturnValue({ isSignedIn: false })

    protectedActionMock.protectedAction.mockImplementation(
      ({ isSignedIn, onAuthed }: { isSignedIn: boolean; onAuthed: () => void }) => {
        if (isSignedIn) onAuthed()
      }
    )

    window.location.hash = ''
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the hero section with the main headline and primary buttons', () => {
    render(<HomePage />)

    expect(screen.getByText('Make Hiring Faster, Fairer, and Clearer')).toBeTruthy()
    expect(screen.getByText('Browse Available Jobs')).toBeTruthy()
    expect(screen.getByText('View My Applications')).toBeTruthy()
  })

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

  it('renders the How It Works section with all three steps', () => {
    render(<HomePage />)

    expect(screen.getByText('How It Works')).toBeTruthy()
    expect(screen.getByText('Apply & Sync')).toBeTruthy()
    expect(screen.getByText('Review & Update')).toBeTruthy()
    expect(screen.getByText('AI Feedback')).toBeTruthy()
  })

  it('renders the CTA section and both CTA buttons', () => {
    render(<HomePage />)

    expect(screen.getByText('Start Building a Better Hiring Experience')).toBeTruthy()
    expect(screen.getByText('Get Started Now')).toBeTruthy()
    expect(screen.getByText('View Dashboard')).toBeTruthy()
  })

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

  it('when signed OUT, clicking hero buttons calls protectedAction and does not change the hash', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: false })

    render(<HomePage />)

    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe('')

    fireEvent.click(screen.getByText('View My Applications'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledTimes(2)
    expect(window.location.hash).toBe('')
  })

  it('when signed IN, hero buttons update the hash correctly', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: true })

    render(<HomePage />)

    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(window.location.hash).toBe('#/jobs')

    fireEvent.click(screen.getByText('View My Applications'))
    expect(window.location.hash).toBe('#/applications')
  })

  it('when signed IN, CTA buttons also route correctly', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: true })

    render(<HomePage />)

    fireEvent.click(screen.getByText('Get Started Now'))
    expect(window.location.hash).toBe('#/jobs')

    fireEvent.click(screen.getByText('View Dashboard'))
    expect(window.location.hash).toBe('#/applications')
  })

  it('passes the correct auth state into protectedAction', () => {
    clerk.useAuth.mockReturnValue({ isSignedIn: false })
    render(<HomePage />)

    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledWith({
      isSignedIn: false,
      onAuthed: expect.any(Function),
    })

    cleanup()

    clerk.useAuth.mockReturnValue({ isSignedIn: true })
    render(<HomePage />)

    fireEvent.click(screen.getByText('Browse Available Jobs'))
    expect(protectedActionMock.protectedAction).toHaveBeenCalledWith({
      isSignedIn: true,
      onAuthed: expect.any(Function),
    })
  })
})
