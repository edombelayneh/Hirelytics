'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User, Menu, X } from 'lucide-react'

/**
 * Possible user roles that determine which nav is shown
 */
type Role = 'applicant' | 'recruiter' | undefined

/**
 * Structure for navigation items
 * match() is used to determine active styling
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
   * Stores the pathname where the menu was opened.
   * If the current pathname changes, the menu automatically counts as closed.
   */
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null)

  /**
   * Menu is only open if it was opened on the current route.
   */
  const isMenuOpen = menuOpenPath === pathname

  /**
   * Lock background scroll when menu is open
   * WHY: creates proper overlay behavior
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
   * Primary role source (from Clerk metadata)
   */
  const metaRole = (user?.publicMetadata?.role as Role) ?? undefined

  /**
   * Fallback role based on route
   */
  const inferredRole: Role = pathname.startsWith('/recruiter')
    ? 'recruiter'
    : pathname.startsWith('/applicant')
      ? 'applicant'
      : undefined

  /**
   * Final role (metadata overrides route)
   */
  const role = metaRole ?? inferredRole

  /**
   * Applicant navigation config
   */
  const applicantNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
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
   * Recruiter navigation config
   */
  const recruiterNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/recruiter/jobs',
      icon: Briefcase,
      match: (p) => p.startsWith('/recruiter/jobs'),
    },
    {
      label: 'My Jobs',
      href: '/recruiter/myJobs',
      icon: Briefcase,
      /**
       * Covers both list + detail pages
       */
      match: (p) => p.startsWith('/recruiter/myJobs') || p.startsWith('/recruiter/JobDetails'),
    },
  ]

  /**
   * Shows different nav items depending on role.
   * Defaults to just Home if role is unknown.
   */
  const navItems: NavItem[] =
    role === 'recruiter'
      ? recruiterNav
      : role === 'applicant'
        ? applicantNav
        : [{ label: 'Home', href: '/', icon: Home, match: (p) => p === '/' }]

  /**
   * Profile route depends on role
   */
  const profileHref =
    role === 'recruiter' ? '/recruiter/profile' : role === 'applicant' ? '/applicant/profile' : '/'

  return (
    <>
      <nav className='relative flex items-center justify-center px-4 lg:px-6 h-20 bg-background border-b sticky top-0 z-50'>
        {/* LOGO (always left) */}
        <div className='absolute left-4 lg:left-6 flex items-center'>
          <Link
            href='/'
            className='inline-block'
          >
            <img
              src='/Hirelytics_Logo.png'
              alt='Hirelytics Logo'
              className='h-8 lg:h-10 w-auto'
            />
          </Link>
        </div>

        {/* DESKTOP NAV (only visible on large screens now) */}
        <div
          className='hidden lg:flex gap-6 xl:gap-12'
          data-testid='desktop-nav'
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 text-base xl:text-xl ${
                  isActive
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className='h-5 w-5 xl:h-6 xl:w-6' />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* RIGHT SIDE (user + hamburger) */}
        <div className='absolute right-4 lg:right-6 flex items-center gap-2 lg:gap-3'>
          <UserButton afterSignOutUrl='/'>
            <UserButton.MenuItems>
              {/* Custom profile navigation */}
              <UserButton.Action
                label='My Profile'
                labelIcon={<User className='h-4 w-4' />}
                onClick={() => router.push(profileHref)}
              />

              {/* Default Clerk actions */}
              <UserButton.Action label='manageAccount' />
              <UserButton.Action label='signOut' />
            </UserButton.MenuItems>
          </UserButton>

          {/* HAMBURGER (mobile + tablet now) */}
          <button
            onClick={() => setMenuOpenPath((prev) => (prev === pathname ? null : pathname))}
            className='lg:hidden p-2 text-foreground focus:outline-none'
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
          </button>
        </div>
      </nav>

      {/* MOBILE/TABLET MENU */}
      <div
        data-testid='mobile-nav'
        className={`
          lg:hidden fixed inset-x-0 top-20 z-40 bg-background border-b shadow-lg
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
                onClick={() => setMenuOpenPath(null)}
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
