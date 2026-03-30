import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import React from 'react'
import { Navbar } from './Navbar'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Replace Next.js <Link> with a plain <a> element.
 *
 * WHY:
 * - Simplifies testing
 * - Allows direct assertions on `href`
 * - Avoids Next.js routing complexity
 */
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

/**
 * Router + pathname mocks
 *
 * - usePathnameMock controls the "current route"
 * - routerPush is used to verify navigation behavior
 */
const usePathnameMock = vi.fn()
const routerPush = vi.fn()

/**
 * useRouter returns our mocked push function,
 * allowing us to assert navigation calls.
 */
const useRouterMock = vi.fn(() => ({ push: routerPush }))

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock(),
}))

/**
 * Role control for Clerk mock.
 * Each test sets this value before rendering.
 */
type Role = 'applicant' | 'recruiter' | undefined
let clerkRole: Role = undefined

/**
 * Clerk mock using async factory (ESM-compatible).
 *
 * Only mocks what Navbar actually uses:
 * - UserButton container
 * - MenuItems wrapper
 * - Action buttons
 *
 * Keeps tests focused on Navbar logic, not Clerk internals.
 */
vi.mock('@clerk/nextjs', async () => {
  const React = await import('react')

  const MockUserButton = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='user-button'>{children}</div>
  )

  const MockMenuItems = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='user-button-menu'>{children}</div>
  )

  /**
   * Represents each dropdown action (e.g., "My Profile")
   * Clicking triggers the handler passed from Navbar.
   */
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

  /**
   * Recreate Clerk's component API shape:
   * UserButton.MenuItems and UserButton.Action
   */
  const TypedUserButton = MockUserButton as React.FC<{ children?: React.ReactNode }> & {
    MenuItems: typeof MockMenuItems
    Action: typeof MockAction
  }

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
/*                               TEST HELPERS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Shared render helper
 *
 * Ensures consistent setup across tests:
 * - sets role
 * - sets pathname
 * - renders component
 */
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

/**
 * Desktop navigation selector
 *
 * Uses data-testid for stability instead of relying on CSS classes.
 */
function getDesktopNav() {
  return screen.getByTestId('desktop-nav')
}

/**
 * Mobile helpers are commented out intentionally.
 *
 * WHY:
 * - Not used in current tests
 * - Avoids lint warnings
 * - Can be re-enabled when expanding test coverage
 */
// function getMobileNav() { ... }

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('Navbar', () => {
  beforeEach(() => {
    /**
     * Reset shared state before each test
     * to ensure complete isolation.
     */
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/')
    routerPush.mockClear()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the logo image', () => {
    renderNavbar()

    /**
     * getByAltText throws if not found,
     * so no explicit assertion is needed.
     */
    screen.getByAltText('Hirelytics Logo')
  })

  it('renders the Clerk user button wrapper', () => {
    renderNavbar()
    screen.getByTestId('user-button')
  })

  it('renders an SVG icon for each desktop navigation link', () => {
    renderNavbar({ role: 'applicant', pathname: '/applicant/applications' })

    const desktopNav = getDesktopNav()
    const links = within(desktopNav).getAllByRole('link')

    /**
     * Ensures every nav item includes an icon.
     * Validates UI consistency.
     */
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

    /**
     * Only "Home" should appear in fallback state
     */
    const homeLink = within(desktopNav).getByRole('link', { name: /home/i })
    expect(homeLink.getAttribute('href')).toBe('/')

    // Ensure role-specific links are not rendered
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

    /**
     * Validate correct routes for applicant navigation
     */
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

    // Recruiter-only link should not exist
    expect(within(desktopNav).queryByText('My Jobs')).toBeNull()
  })

  it('prioritizes Clerk metadata over route inference when they conflict', () => {
    renderNavbar({
      role: 'applicant',
      pathname: '/recruiter/myJobs',
    })

    /**
     * Metadata should override route inference.
     * Applicant nav should render instead of recruiter nav.
     */
    const desktopNav = getDesktopNav()
    within(desktopNav).getByRole('link', { name: /my applications/i })
    expect(within(desktopNav).queryByRole('link', { name: /my jobs/i })).toBeNull()
  })

  it('toggles the mobile menu open and closed', () => {
    renderNavbar()

    /**
     * Verifies:
     * - aria-expanded state changes
     * - aria-label updates correctly
     */
    const hamburger = screen.getByRole('button', { name: /open menu/i })

    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('false')
  })

  it('locks body scroll while the mobile menu is open', () => {
    renderNavbar()

    /**
     * Ensures UX behavior:
     * background scrolling is disabled when menu is open
     */
    const hamburger = screen.getByRole('button', { name: /open menu/i })

    fireEvent.click(hamburger)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes the mobile menu when the pathname changes', () => {
    const { rerender } = renderNavbar()

    /**
     * Simulates navigation and verifies menu resets.
     */
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))

    usePathnameMock.mockReturnValue('/new-route')
    rerender(<Navbar />)

    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    )
  })
})
