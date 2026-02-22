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

// Mock next/navigation usePathname (we’ll set return value per test)
const usePathnameMock = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}))

// Mock Clerk (useUser + UserButton with nested MenuItems/Action components)
type Role = 'applicant' | 'recruiter' | undefined
let clerkRole: Role = undefined

vi.mock('@clerk/nextjs', async () => {
  const React = (await import('react')) as typeof import('react')

  function MockUserButton({ children }: { children?: React.ReactNode }) {
    return <div data-testid='user-button'>{children}</div>
  }
  MockUserButton.displayName = 'MockUserButton'

  function MockMenuItems({ children }: { children?: React.ReactNode }) {
    return <div data-testid='user-button-menu'>{children}</div>
  }
  MockMenuItems.displayName = 'MockMenuItems'

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
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/')
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the logo image', () => {
    render(<Navbar />)
    expect(screen.getByAltText('Hirelytics Logo')).toBeTruthy()
  })

  it('when role is unresolved, renders a minimal nav (Home only -> "/")', () => {
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/somewhere-unknown')

    render(<Navbar />)

    // Only Home should exist, and it should go to "/"
    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink.getAttribute('href')).toBe('/')

    expect(screen.queryByText('Available Jobs')).toBeNull()
    expect(screen.queryByText('My Applications')).toBeNull()
    expect(screen.queryByText('My Jobs')).toBeNull()
  })

  it('renders applicant nav when role is applicant (from Clerk metadata)', () => {
    clerkRole = 'applicant'
    usePathnameMock.mockReturnValue('/applicant/applications')

    render(<Navbar />)

    const home = screen.getByRole('link', { name: /home/i })
    expect(home.getAttribute('href')).toBe('/home')

    const jobs = screen.getByRole('link', { name: /available jobs/i })
    expect(jobs.getAttribute('href')).toBe('/applicant/jobs')

    const apps = screen.getByRole('link', { name: /my applications/i })
    expect(apps.getAttribute('href')).toBe('/applicant/applications')

    expect(screen.queryByText('My Jobs')).toBeNull()
  })

  it('renders recruiter nav when role is recruiter (from Clerk metadata)', () => {
    clerkRole = 'recruiter'
    usePathnameMock.mockReturnValue('/recruiter/myJobs')

    render(<Navbar />)

    const home = screen.getByRole('link', { name: /home/i })
    expect(home.getAttribute('href')).toBe('/home')

    const jobs = screen.getByRole('link', { name: /available jobs/i })
    expect(jobs.getAttribute('href')).toBe('/applicant/jobs') // as in your component

    const myJobs = screen.getByRole('link', { name: /my jobs/i })
    expect(myJobs.getAttribute('href')).toBe('/recruiter/myJobs')

    expect(screen.queryByText('My Applications')).toBeNull()
  })

  it('falls back to route prefix when metadata is missing (inferred applicant)', () => {
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/applicant/jobs')

    render(<Navbar />)

    expect(screen.getByRole('link', { name: /available jobs/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /my applications/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /my jobs/i })).toBeNull()
  })

  it('applies active styles to the matched nav item', () => {
    clerkRole = 'applicant'
    usePathnameMock.mockReturnValue('/applicant/jobs')

    render(<Navbar />)

    const jobsLink = screen.getByRole('link', { name: /available jobs/i })
    expect(jobsLink.className.includes('font-bold')).toBe(true)
    expect(jobsLink.className.includes('text-foreground')).toBe(true)

    const appsLink = screen.getByRole('link', { name: /my applications/i })
    expect(appsLink.className.includes('text-muted-foreground')).toBe(true)
  })

  it('renders the UserButton wrapper', () => {
    render(<Navbar />)
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

    fireEvent.click(screen.getByRole('button', { name: 'My Profile' }))
    expect(window.location.href).toBe('/recruiter/profile')

    // restore
    // @ts-expect-error - restore
    window.location = originalLocation
  })

  it('renders lucide icons (svgs) for nav items', () => {
    clerkRole = 'applicant'
    usePathnameMock.mockReturnValue('/applicant/applications')

    const { container } = render(<Navbar />)

    // logo is <img>, icons are <svg>
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })
})
