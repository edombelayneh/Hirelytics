'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { UserButton, useUser } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User, Menu, X } from 'lucide-react'

/**
 * Represents the user role that determines navigation structure.
 */
type Role = 'applicant' | 'recruiter' | undefined

/**
 * Standard structure for each navigation item.
 *
 * match(): determines whether the item should be styled as active
 * based on the current pathname.
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
   * Controls whether the mobile menu is open.
   */
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  /**
   * Close mobile menu when route changes.
   *
   * WHY:
   * Prevents the menu from staying open after navigation.
   */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false)
  }, [pathname])

  /**
   * Lock background scroll when mobile menu is open.
   *
   * WHY:
   * Creates proper overlay behavior on mobile.
   * Cleanup ensures scroll is restored on unmount.
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
   * Primary role source: Clerk metadata (most reliable).
   */
  const metaRole = (user?.publicMetadata?.role as Role) ?? undefined

  /**
   * Fallback role inference from URL.
   * Used when metadata is unavailable.
   */
  const inferredRole: Role = pathname.startsWith('/recruiter')
    ? 'recruiter'
    : pathname.startsWith('/applicant')
      ? 'applicant'
      : undefined

  /**
   * Final role resolution:
   * metadata overrides inferred route.
   */
  const role = metaRole ?? inferredRole

  /**
   * Applicant navigation configuration.
   */
  const applicantNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
      // Matches base and nested job routes
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
   * Recruiter navigation configuration.
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
       * Covers both:
       * - job list page
       * - job detail page
       *
       * Ensures "My Jobs" stays active when drilling into job details.
       */
      match: (p) => p.startsWith('/recruiter/myJobs') || p.startsWith('/recruiter/jobDetails'),
    },
  ]

  /**
   * Select navigation items based on role.
   * Falls back to minimal navigation if role is unknown.
   */
  const navItems: NavItem[] =
    role === 'recruiter'
      ? recruiterNav
      : role === 'applicant'
        ? applicantNav
        : [{ label: 'Home', href: '/', icon: Home, match: (p) => p === '/' }]

  /**
   * Determines profile route based on role.
   */
  const profileHref =
    role === 'recruiter' ? '/recruiter/profile' : role === 'applicant' ? '/applicant/profile' : '/'

  return (
    <>
      {/* Main navbar container (sticky at top) */}
      <nav className='relative flex items-center justify-between px-4 md:px-6 h-20 bg-background border-b sticky top-0 z-50'>
        {/* Logo section (routes to homepage) */}
        <div className='flex items-center'>
          <Link
            href='/'
            className='inline-block'
          >
            <Image
              src='/Hirelytics_Logo.png'
              alt='Hirelytics Logo'
              width={40}
              height={40}
              className='h-8 md:h-10 w-auto'
            />
          </Link>
        </div>

        {/* Desktop navigation (hidden on mobile, test-friendly via data-testid) */}
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
                    ? 'font-bold text-foreground'
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
        <div className='flex items-center gap-2 md:gap-3'>
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
            {isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation menu (animated dropdown) */}
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
                 * Prevents stale open state across pages
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
