'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User, Menu, X } from 'lucide-react'

/**
 * Defines the possible user roles that determine
 * which navigation layout is rendered.
 */
type Role = 'applicant' | 'recruiter' | undefined

/**
 * Structure for each navigation item.
 *
 * match(): determines if this item should be styled as active
 * based on the current route.
 */
type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  match: (pathname: string) => boolean
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  /**
   * Controls whether the mobile menu dropdown is visible.
   */
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  /**
   * Close mobile menu when route changes.
   *
   * WHY:
   * Prevents the menu from staying open after navigation,
   * which would feel like broken UI.
   */
  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false)
  }, [pathname])

  /**
   * Lock background scrolling when mobile menu is open.
   *
   * WHY:
   * Creates a proper "overlay" effect so users cannot scroll
   * the page behind the menu.
   *
   * Cleanup ensures scroll is restored even if component unmounts.
   */
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  /**
   * Primary role source: Clerk metadata.
   * This is the most reliable source of truth.
   */
  const metaRole = (user?.publicMetadata?.role as Role) ?? undefined

  /**
   * Fallback role inference based on URL.
   * Used when metadata is unavailable.
   */
  const inferredRole: Role = pathname.startsWith('/recruiter')
    ? 'recruiter'
    : pathname.startsWith('/applicant')
      ? 'applicant'
      : undefined

  /**
   * Final role resolution:
   * metadata takes priority over inferred route.
   */
  const role = metaRole ?? inferredRole

  /**
   * Navigation configuration for applicants.
   */
  const applicantNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
      // Matches base route + any nested job routes
      match: (p) => p.startsWith('/applicant/jobs'),
    },
    {
      label: 'My Applications',
      href: '/applicant/applications',
      icon: BarChart3,
      match: (p) => p.startsWith('/applicant/applications'),
    },
  ]

  /**
   * Navigation configuration for recruiters.
   */
  const recruiterNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
      match: (p) => p.startsWith('/applicant/jobs'),
    },
    {
      label: 'My Jobs',
      href: '/recruiter/myJobs',
      icon: Briefcase,
      /**
       * Covers:
       * - Job listing page
       * - Individual job detail pages
       *
       * Ensures "My Jobs" remains active when drilling into job details.
       */
      match: (p) => p.startsWith('/recruiter/myJobs') || p.startsWith('/recruiter/jobDetails'),
    },
  ]

  /**
   * Select navigation items based on resolved role.
   * Falls back to minimal navigation if role is unknown.
   */
  const navItems: NavItem[] =
    role === 'recruiter'
      ? recruiterNav
      : role === 'applicant'
        ? applicantNav
        : [{ label: 'Home', href: '/', icon: Home, match: (p) => p === '/' }]

  /**
   * Determines where "My Profile" should route
   * based on the current role.
   */
  const profileHref =
    role === 'recruiter' ? '/recruiter/profile' : role === 'applicant' ? '/applicant/profile' : '/'

  return (
    <>
      {/* Main navbar container (sticky for persistent access) */}
      <nav className='relative flex items-center justify-center px-4 md:px-6 h-20 bg-background border-b sticky top-0 z-50'>
        {/* Logo section (always routes to homepage) */}
        <div className='absolute left-4 md:left-6 flex items-center'>
          <Link
            href='/'
            className='inline-block'
          >
            <img
              src='/Hirelytics_Logo.png'
              alt='Hirelytics Logo'
              className='h-8 md:h-10 w-auto'
            />
          </Link>
        </div>

        {/* Desktop navigation (hidden on mobile, centered layout) */}
        {/* data-testid ensures stable targeting for tests */}
        <div
          className='hidden md:flex gap-6 lg:gap-12'
          data-testid='desktop-nav'
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 text-base lg:text-xl ${
                  isActive
                    ? 'font-bold text-foreground' // active page styling
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className='h-5 w-5 lg:h-6 lg:w-6' />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Right section: user menu + mobile toggle */}
        <div className='absolute right-4 md:right-6 flex items-center gap-2 md:gap-3'>
          {/* Clerk user dropdown menu */}
          <UserButton afterSignOutUrl='/'>
            <UserButton.MenuItems>
              {/* Custom action: navigate to role-specific profile */}
              <UserButton.Action
                label='My Profile'
                labelIcon={<User className='h-4 w-4' />}
                onClick={() => router.push(profileHref)}
              />

              {/* Built-in Clerk actions */}
              <UserButton.Action label='manageAccount' />
              <UserButton.Action label='signOut' />
            </UserButton.MenuItems>
          </UserButton>

          {/* Mobile hamburger toggle (accessible via aria attributes) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='md:hidden p-2 text-foreground focus:outline-none'
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {
              isMenuOpen ? (
                <X className='h-6 w-6' /> // close icon
              ) : (
                <Menu className='h-6 w-6' />
              ) // open icon
            }
          </button>
        </div>
      </nav>

      {/* Mobile navigation dropdown (animated) */}
      {/* data-testid allows stable selection in tests */}
      <div
        data-testid='mobile-nav'
        className={`
          md:hidden fixed inset-x-0 top-20 z-40 bg-background border-b shadow-lg
          transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
      >
        <div className='flex flex-col py-4 px-4 gap-2'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 py-3 px-2 rounded-md text-base ${
                  isActive
                    ? 'bg-muted font-bold text-foreground'
                    : 'font-medium text-muted-foreground hover:bg-muted/50'
                }`}
                /**
                 * Close menu after navigation
                 * Prevents menu staying open after user selects a page
                 */
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className='h-5 w-5' />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
