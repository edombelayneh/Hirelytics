import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import React from 'react'
import { Navbar } from './Navbar'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

// Mock next/link to a plain <a> so href assertions work in jsdom.
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

// Mock usePathname so we can control the current route per test.
const usePathnameMock = vi.fn()
const routerPush = vi.fn()

const useRouterMock = vi.fn(() => ({ push: routerPush }))

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock(),
}))

// Simulate supported roles plus unresolved state.
type Role = 'applicant' | 'recruiter' | undefined
let clerkRole: Role = undefined

// Mock Clerk's useUser and UserButton with nested components.
// This mirrors the real API so role-based rendering and menu actions can be tested.
vi.mock('@clerk/nextjs', async () => {
  const React = await import('react')

  const MockUserButton = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='user-button'>{children}</div>
  )

  const MockMenuItems = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='user-button-menu'>{children}</div>
  )

  const MockAction = ({
    label,
    onClick,
  }: {
    label: string
    onClick?: () => void
    labelIcon?: React.ReactNode
  }) => (
    <button
      type='button'
      onClick={onClick}
    >
      {label}
    </button>
  )

  // Attach subcomponents to mimic Clerk's structure.
  const TypedUserButton = MockUserButton as React.FC<{ children?: React.ReactNode }> & {
    MenuItems: typeof MockMenuItems
    Action: typeof MockAction
  }

  TypedUserButton.MenuItems = MockMenuItems
  TypedUserButton.Action = MockAction

  return {
    // Return role metadata for each test scenario.
    useUser: () => ({
      user: clerkRole ? { publicMetadata: { role: clerkRole } } : { publicMetadata: {} },
    }),
    UserButton: TypedUserButton,
  }
})

/* -------------------------------------------------------------------------- */
/*                               TEST HELPERS                                 */
/* -------------------------------------------------------------------------- */

// Render Navbar with a given role and route.
// Keeps tests focused on behavior instead of setup.
function renderNavbar({
  role,
  pathname = '/',
}: {
  role?: Role
  pathname?: string
} = {}) {
  clerkRole = role
  usePathnameMock.mockReturnValue(pathname)
  return render(<Navbar />)
}

// Scope queries to desktop nav only (avoids mobile duplicates).
function getDesktopNav() {
  return screen.getByTestId('desktop-nav')
}

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('Navbar', () => {
  beforeEach(() => {
    // Reset shared state before each test.
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/')
    routerPush.mockClear()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Clean up DOM and mocks.
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the logo image', () => {
    renderNavbar()

    // Verify logo renders via alt text.
    screen.getByAltText('Hirelytics Logo')
  })

  it('renders the Clerk user button wrapper', () => {
    renderNavbar()

    // Confirms Clerk UserButton is mounted.
    screen.getByTestId('user-button')
  })

  it('renders an SVG icon for each desktop navigation link', () => {
    renderNavbar({ role: 'applicant', pathname: '/applicant/applications' })

    const desktopNav = getDesktopNav()
    const links = within(desktopNav).getAllByRole('link')

    // Each nav link should include a lucide icon.
    links.forEach((link) => {
      expect(link.querySelector('svg')).toBeTruthy()
    })
  })

  it('renders a minimal nav when role cannot be resolved', () => {
    renderNavbar({
      role: undefined,
      pathname: '/somewhere-unknown',
    })

    const desktopNav = getDesktopNav()

    // Only Home should exist, linking to "/".
    const homeLink = within(desktopNav).getByRole('link', { name: /home/i })
    expect(homeLink.getAttribute('href')).toBe('/')

    // No role-specific links should appear.
    expect(within(desktopNav).queryByText('Available Jobs')).toBeNull()
    expect(within(desktopNav).queryByText('My Applications')).toBeNull()
    expect(within(desktopNav).queryByText('My Jobs')).toBeNull()
  })

  it('renders applicant navigation when Clerk metadata says applicant', () => {
    renderNavbar({
      role: 'applicant',
      pathname: '/applicant/applications',
    })

    const desktopNav = getDesktopNav()

    // Applicant-specific routes.
    expect(within(desktopNav).getByRole('link', { name: /home/i }).getAttribute('href')).toBe(
      '/home'
    )

    expect(
      within(desktopNav)
        .getByRole('link', { name: /available jobs/i })
        .getAttribute('href')
    ).toBe('/applicant/jobs')

    expect(
      within(desktopNav)
        .getByRole('link', { name: /my applications/i })
        .getAttribute('href')
    ).toBe('/applicant/applications')

    // Recruiter-only link should not appear.
    expect(within(desktopNav).queryByText('My Jobs')).toBeNull()
  })

  it('renders recruiter navigation when Clerk metadata says recruiter', () => {
    renderNavbar({
      role: 'recruiter',
      pathname: '/recruiter/myJobs',
    })

    const desktopNav = getDesktopNav()

    // Recruiter-specific routes.
    expect(within(desktopNav).getByRole('link', { name: /home/i }).getAttribute('href')).toBe(
      '/home'
    )

    expect(
      within(desktopNav)
        .getByRole('link', { name: /available jobs/i })
        .getAttribute('href')
    ).toBe('/recruiter/jobs')

    expect(
      within(desktopNav)
        .getByRole('link', { name: /my jobs/i })
        .getAttribute('href')
    ).toBe('/recruiter/myJobs')

    // Applicant-only link should not appear.
    expect(within(desktopNav).queryByText('My Applications')).toBeNull()
  })

  it('prioritizes Clerk metadata over route inference when they conflict', () => {
    renderNavbar({
      role: 'applicant',
      pathname: '/recruiter/myJobs',
    })

    const desktopNav = getDesktopNav()

    // Metadata role should override route-based inference.
    within(desktopNav).getByRole('link', { name: /my applications/i })
    expect(within(desktopNav).queryByRole('link', { name: /my jobs/i })).toBeNull()
  })

  it('toggles the mobile menu open and closed', () => {
    renderNavbar()

    const hamburger = screen.getByRole('button', { name: /open menu/i })

    // aria-expanded reflects open/closed state.
    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('false')
  })

  it('locks body scroll while the mobile menu is open', () => {
    renderNavbar()

    const hamburger = screen.getByRole('button', { name: /open menu/i })

    fireEvent.click(hamburger)

    // Body scrolling should be disabled while menu is open.
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes the mobile menu when the pathname changes', () => {
    const { rerender } = renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))

    // Simulate route change.
    usePathnameMock.mockReturnValue('/new-route')
    rerender(<Navbar />)

    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    )
  })

  it('navigates to the correct profile when "My Profile" is clicked (applicant)', () => {
    renderNavbar({
      role: 'applicant',
      pathname: '/applicant/applications',
    })

    const profileButton = screen.getByRole('button', { name: /my profile/i })

    fireEvent.click(profileButton)

    // Should route to applicant profile.
    expect(routerPush).toHaveBeenCalledWith('/applicant/profile')
  })

  it('navigates to the correct profile when "My Profile" is clicked (recruiter)', () => {
    renderNavbar({
      role: 'recruiter',
      pathname: '/recruiter/myJobs',
    })

    const profileButton = screen.getByRole('button', { name: /my profile/i })

    fireEvent.click(profileButton)

    // Should route to recruiter profile.
    expect(routerPush).toHaveBeenCalledWith('/recruiter/profile')
  })
})
