import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import React from 'react'
import { Navbar } from './Navbar'

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Replace Next.js Link with a plain anchor element for testing.
 *
 * Why:
 * In jsdom, we do not need full Next.js routing behavior. A normal <a>
 * makes it easy to assert href values directly.
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
 * Mock routing hooks so each test can control the current pathname
 * and verify navigation triggered through router.push().
 */
const usePathnameMock = vi.fn()
const routerPush = vi.fn()
const useRouterMock = vi.fn(() => ({ push: routerPush }))

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock(),
}))

/**
 * Match the roles supported by Navbar.
 * undefined represents the unresolved fallback case.
 */
type Role = 'applicant' | 'recruiter' | undefined

/**
 * Shared mock role that useUser() reads from.
 * Each test updates this before rendering Navbar.
 */
let clerkRole: Role = undefined

/**
 * Mock Clerk components used by Navbar.
 *
 * Why:
 * We only need enough Clerk behavior to verify:
 * - role-based rendering from useUser()
 * - presence of the user menu wrapper
 * - click behavior for custom menu actions like "My Profile"
 *
 * The nested structure is preserved so Navbar can render
 * <UserButton.MenuItems> and <UserButton.Action> normally.
 */
vi.mock('@clerk/nextjs', async () => {
  const React = await import('react')

  /**
   * Minimal stand-in for Clerk's UserButton wrapper.
   */
  const MockUserButton = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='user-button'>{children}</div>
  )

  /**
   * Minimal stand-in for the menu items container.
   */
  const MockMenuItems = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='user-button-menu'>{children}</div>
  )

  /**
   * Minimal stand-in for Clerk menu actions.
   *
   * Rendering each action as a button lets tests click custom actions
   * like "My Profile" and verify the attached handler runs.
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
   * Attach nested subcomponents so the mock matches Clerk's API shape.
   */
  const TypedUserButton = MockUserButton as React.FC<{ children?: React.ReactNode }> & {
    MenuItems: typeof MockMenuItems
    Action: typeof MockAction
  }

  TypedUserButton.MenuItems = MockMenuItems
  TypedUserButton.Action = MockAction

  return {
    /**
     * Return role metadata based on the current test scenario.
     * If no role is set, Navbar should fall back to its unknown-role behavior.
     */
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
 * Render Navbar with an optional mocked role and pathname.
 *
 * Why:
 * This helper keeps each test focused on what it is verifying
 * instead of repeating the same setup logic.
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
 * Scope queries to the desktop nav only.
 *
 * Why:
 * Navbar renders both desktop and mobile navigation, which can create
 * duplicate text in the DOM. Scoping avoids ambiguous queries.
 */
function getDesktopNav() {
  return screen.getByTestId('desktop-nav')
}

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe('Navbar', () => {
  beforeEach(() => {
    /**
     * Reset shared mock state before every test so one scenario
     * cannot leak into the next.
     */
    clerkRole = undefined
    usePathnameMock.mockReturnValue('/')
    routerPush.mockClear()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    /**
     * Clean up the rendered DOM and clear mock call history after each test.
     */
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the logo image', () => {
    renderNavbar()

    /**
     * The logo should always render, regardless of role or route.
     */
    screen.getByAltText('Hirelytics Logo')
  })

  it('renders the Clerk user button wrapper', () => {
    renderNavbar()

    /**
     * Confirms the user menu area is mounted.
     * This is important because custom menu actions live inside it.
     */
    screen.getByTestId('user-button')
  })

  it('renders an SVG icon for each desktop navigation link', () => {
    renderNavbar({ role: 'applicant', pathname: '/applicant/applications' })

    const desktopNav = getDesktopNav()
    const links = within(desktopNav).getAllByRole('link')

    /**
     * Each visible nav link should include its matching Lucide icon.
     * This protects the visual structure of the navbar, not just the text labels.
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
     * In the unresolved-role case, Navbar should fall back to a safe,
     * minimal navigation with only the root Home link.
     */
    const homeLink = within(desktopNav).getByRole('link', { name: /home/i })
    expect(homeLink.getAttribute('href')).toBe('/')

    /**
     * No applicant-only or recruiter-only links should be shown.
     */
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
     * Applicant users should receive applicant routes, even if multiple
     * nav layouts exist in the component.
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

    /**
     * Recruiter-only links must not appear in the applicant view.
     */
    expect(within(desktopNav).queryByText('My Jobs')).toBeNull()
  })

  it('renders recruiter navigation when Clerk metadata says recruiter', () => {
    renderNavbar({
      role: 'recruiter',
      pathname: '/recruiter/myJobs',
    })

    const desktopNav = getDesktopNav()

    /**
     * Recruiter users should receive recruiter routes.
     */
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

    /**
     * Applicant-only links must not appear in the recruiter view.
     */
    expect(within(desktopNav).queryByText('My Applications')).toBeNull()
  })

  it('prioritizes Clerk metadata over route inference when they conflict', () => {
    renderNavbar({
      role: 'applicant',
      pathname: '/recruiter/myJobs',
    })

    const desktopNav = getDesktopNav()

    /**
     * Navbar supports a route-based fallback, but explicit Clerk metadata
     * should win when the two sources disagree.
     */
    within(desktopNav).getByRole('link', { name: /my applications/i })
    expect(within(desktopNav).queryByRole('link', { name: /my jobs/i })).toBeNull()
  })

  it('toggles the mobile menu open and closed', () => {
    renderNavbar()

    const hamburger = screen.getByRole('button', { name: /open menu/i })

    /**
     * aria-expanded is the simplest reliable signal for the mobile menu's
     * open/closed state in this test environment.
     */
    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('false')
  })

  it('locks body scroll while the mobile menu is open', () => {
    renderNavbar()

    const hamburger = screen.getByRole('button', { name: /open menu/i })

    fireEvent.click(hamburger)

    /**
     * Opening the mobile menu should prevent the page behind it from scrolling.
     */
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes the mobile menu when the pathname changes', () => {
    const { rerender } = renderNavbar()

    /**
     * Open the menu first so the route change can prove it closes automatically.
     */
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))

    /**
     * Simulate a navigation event by changing the mocked pathname and rerendering.
     */
    usePathnameMock.mockReturnValue('/new-route')
    rerender(<Navbar />)

    /**
     * After the route changes, the menu should no longer be considered open.
     */
    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    )
  })

  it('navigates to the correct profile when "My Profile" is clicked (applicant)', () => {
    renderNavbar({
      role: 'applicant',
      pathname: '/applicant/applications',
    })

    /**
     * Regression test:
     * "My Profile" used to navigate differently, but Navbar now routes through
     * router.push(). This verifies the applicant path still resolves correctly.
     */
    const profileButton = screen.getByRole('button', { name: /my profile/i })

    fireEvent.click(profileButton)

    expect(routerPush).toHaveBeenCalledWith('/applicant/profile')
  })

  it('navigates to the correct profile when "My Profile" is clicked (recruiter)', () => {
    renderNavbar({
      role: 'recruiter',
      pathname: '/recruiter/myJobs',
    })

    /**
     * Same regression protection as above, but for the recruiter-specific path.
     */
    const profileButton = screen.getByRole('button', { name: /my profile/i })

    fireEvent.click(profileButton)

    expect(routerPush).toHaveBeenCalledWith('/recruiter/profile')
  })
})
