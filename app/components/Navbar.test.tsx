// app/components/Navbar.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import { Navbar } from './Navbar'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Mock next/link to a plain <a> so href assertions work in jsdom
vi.mock('next/link', () => {
  return {
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
  }
})

// Mock usePathname so we can control current route per test
const usePathnameMock = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}))

// Mock Clerk (useUser + UserButton with nested MenuItems/Action components)
type Role = 'applicant' | 'recruiter' | undefined
let clerkRole: Role = undefined

// Mock Clerk (useUser + UserButton with nested components)
vi.mock('@clerk/nextjs', async () => {
  const React = (await import('react')) as typeof import('react')

  // Mock UserButton wrapper
  function MockUserButton({ children }: { children?: React.ReactNode }) {
    return <div data-testid='user-button'>{children}</div>
  }
  MockUserButton.displayName = 'MockUserButton'
  // Mock dropdown container
  function MockMenuItems({ children }: { children?: React.ReactNode }) {
    return <div data-testid='user-button-menu'>{children}</div>
  }
  MockMenuItems.displayName = 'MockMenuItems'
  // Mock menu action button
  function MockAction({
    label,
    onClick,
  }: {
    label: string
    onClick?: () => void
    labelIcon?: React.ReactNode
  }) {
    return (
      <button
        type='button'
        onClick={onClick}
      >
        {label}
      </button>
    )
  }
  MockAction.displayName = 'MockAction'
  // Attach subcomponents to mimic real Clerk API
  type MockUserButtonComponent = React.FC<{ children?: React.ReactNode }> & {
    MenuItems: React.FC<{ children?: React.ReactNode }>
    Action: React.FC<{
      label: string
      onClick?: () => void
      labelIcon?: React.ReactNode
    }>
  }

  const TypedUserButton = MockUserButton as MockUserButtonComponent
  TypedUserButton.MenuItems = MockMenuItems
  TypedUserButton.Action = MockAction

  return {
    // useUser returns role from simulated metadata
    useUser: () => ({
      user: clerkRole ? { publicMetadata: { role: clerkRole } } : { publicMetadata: {} },
    }),
    UserButton: TypedUserButton,
  }
})

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('Navbar', () => {
  beforeEach(() => {
    // Reset role before each test
    clerkRole = undefined
    // Default path
    usePathnameMock.mockReturnValue('/')
  })

  afterEach(() => {
    // Cleanup DOM
    cleanup()
    // Reset all mock call counts
    vi.clearAllMocks()
  })

  it('renders the logo image', () => {
    render(<Navbar />)
    // Verify logo <img> renders
    expect(screen.getByAltText('Hirelytics Logo')).toBeTruthy()
  })

  it('when role is unresolved, renders a minimal nav (Home only -> "/")', () => {
    // No role + unknown route
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/somewhere-unknown')

    render(<Navbar />)

    // Only Home should exist, and it should go to "/"
    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink.getAttribute('href')).toBe('/')
    // Other role-specific links should not render
    expect(screen.queryByText('Available Jobs')).toBeNull()
    expect(screen.queryByText('My Applications')).toBeNull()
    expect(screen.queryByText('My Jobs')).toBeNull()
  })

  it('renders applicant nav when role is applicant (from Clerk metadata)', () => {
    clerkRole = 'applicant'
    usePathnameMock.mockReturnValue('/applicant/applications')

    render(<Navbar />)
    // Applicant Home
    const home = screen.getByRole('link', { name: /home/i })
    expect(home.getAttribute('href')).toBe('/home')

    // Applicant job links
    const jobs = screen.getByRole('link', { name: /available jobs/i })
    expect(jobs.getAttribute('href')).toBe('/applicant/jobs')
    const apps = screen.getByRole('link', { name: /my applications/i })
    expect(apps.getAttribute('href')).toBe('/applicant/applications')

    // Recruiter-only link should not appear
    expect(screen.queryByText('My Jobs')).toBeNull()
  })

  it('renders recruiter nav when role is recruiter (from Clerk metadata)', () => {
    clerkRole = 'recruiter'
    usePathnameMock.mockReturnValue('/recruiter/myJobs')

    render(<Navbar />)
    // Recruiter Home
    const home = screen.getByRole('link', { name: /home/i })
    expect(home.getAttribute('href')).toBe('/home')
    // Shared jobs link
    const jobs = screen.getByRole('link', { name: /available jobs/i })
    expect(jobs.getAttribute('href')).toBe('/applicant/jobs') // as in your component
    // Recruiter-specific link
    const myJobs = screen.getByRole('link', { name: /my jobs/i })
    expect(myJobs.getAttribute('href')).toBe('/recruiter/myJobs')
    // Applicant-only link should not appear
    expect(screen.queryByText('My Applications')).toBeNull()
  })

  it('falls back to route prefix when metadata is missing (inferred applicant)', () => {
    // No Clerk metadata, infer from URL
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/applicant/jobs')

    render(<Navbar />)
    // Should render applicant links
    expect(screen.getByRole('link', { name: /available jobs/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /my applications/i })).toBeTruthy()
    // Should not render recruiter link
    expect(screen.queryByRole('link', { name: /my jobs/i })).toBeNull()
  })

  it('applies active styles to the matched nav item', () => {
    clerkRole = 'applicant'
    usePathnameMock.mockReturnValue('/applicant/jobs')
    render(<Navbar />)

    const jobsLink = screen.getByRole('link', { name: /available jobs/i })
    // Active link should have bold + foreground styling
    expect(jobsLink.className.includes('font-bold')).toBe(true)
    expect(jobsLink.className.includes('text-foreground')).toBe(true)
    // Inactive link should have muted styling
    const appsLink = screen.getByRole('link', { name: /my applications/i })
    expect(appsLink.className.includes('text-muted-foreground')).toBe(true)
  })

  it('renders the UserButton wrapper', () => {
    render(<Navbar />)
    // Confirms Clerk UserButton integration
    expect(screen.getByTestId('user-button')).toBeTruthy()
  })

  it('clicking "My Profile" sends user to the role-based profile route', () => {
    clerkRole = 'recruiter'
    usePathnameMock.mockReturnValue('/recruiter/myJobs')

    // Make location.href writable in jsdom for this test
    const originalLocation = window.location
    // @ts-expect-error - redefining location for test
    delete window.location
    // @ts-expect-error - redefining location for test
    window.location = { href: 'http://localhost/' }

    render(<Navbar />)
    // Trigger profile click
    fireEvent.click(screen.getByRole('button', { name: 'My Profile' }))
    // Should redirect to recruiter profile
    expect(window.location.href).toBe('/recruiter/profile')

    // restore location
    // @ts-expect-error - restore
    window.location = originalLocation
  })

  it('renders lucide icons (svgs) for nav items', () => {
    clerkRole = 'applicant'
    usePathnameMock.mockReturnValue('/applicant/applications')

    const { container } = render(<Navbar />)

    // Ensure nav icons exist
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })
})
